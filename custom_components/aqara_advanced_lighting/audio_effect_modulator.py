"""Audio effect modulator — maps sensor events to speed writes.

Consumes events from AudioEngine and translates them into
effect_speed commands for T1M and T1 Strip devices.

Note: Brightness modulation is not supported for hardware effects because
the T1M restarts the effect on every brightness change (move_to_level).
Only speed can be adjusted live via the custom Aqara cluster.
"""

import asyncio
import logging
import time
from typing import Any

from homeassistant.core import HomeAssistant

from .audio_curves import apply_response_curve, map_to_range
from .audio_engine import AudioConsumer, AudioEngine, AudioEngineConfig
from .const import (
    AUDIO_EFFECT_MODE_CONTINUOUS,
    AUDIO_EFFECT_MODE_INTENSITY_BREATHING,
    AUDIO_EFFECT_MODE_ON_ONSET,
    AUDIO_EFFECT_MODE_ONSET_FLASH,
    AUDIO_EFFECT_RATE_LIMIT_T1M,
    AUDIO_EFFECT_RATE_LIMIT_T1_STRIP,
    AUDIO_EFFECT_SILENCE_DECAY_SECONDS,
    SPEED_DEADBAND,
    T1M_MODELS,
)
from .models import AudioEffectConfig

_LOGGER = logging.getLogger(__name__)

from .const import AUDIO_EMA_ALPHA as _EMA_ALPHA, AUDIO_FLASH_BRIGHTNESS_DECAY as _FLASH_DECAY
# Per-tick onset decay rate for on_onset mode (decays toward min between beats)
_ONSET_DECAY_RATE = 0.03


class ModulationChannel:
    """Single modulation channel (speed)."""

    def __init__(
        self,
        mode: str | None,
        range_min: int,
        range_max: int,
        curve: str,
        deadband: int,
    ) -> None:
        self.mode = mode
        self.range_min = range_min
        self.range_max = range_max
        self.curve = curve
        self.deadband = deadband
        self._last_written: int | None = None
        from .audio_curves import EMAFilter
        self._envelope = EMAFilter(alpha=_EMA_ALPHA, initial=0.5)
        self._flash_brightness: float = 0.0
        self._onset_level: float = 0.0

    def process_energy(self, energy: float) -> tuple[int, bool] | None:
        """Process an energy value. Returns (mapped_value, changed) or None if disabled."""
        if self.mode is None:
            return None

        if self.mode == AUDIO_EFFECT_MODE_INTENSITY_BREATHING:
            self._envelope.update(energy)
            sensor_val = self._envelope.value
        elif self.mode == AUDIO_EFFECT_MODE_ONSET_FLASH:
            self._envelope.update(energy)
            self._flash_brightness = max(0.0, self._flash_brightness - _FLASH_DECAY)
            sensor_val = max(self._envelope.value, self._flash_brightness)
        elif self.mode == AUDIO_EFFECT_MODE_CONTINUOUS:
            sensor_val = energy
        else:
            # on_onset mode doesn't process energy (uses onset events)
            return None

        curved = apply_response_curve(sensor_val, self.curve)
        value = map_to_range(curved, self.range_min, self.range_max)
        changed = self._check_deadband(value, bypass=False)
        if changed:
            self._last_written = value
        return value, changed

    def process_energy_tick(self) -> tuple[int, bool] | None:
        """Process a decay tick for on_onset mode (called periodically between beats).

        Returns (mapped_value, changed) or None if not applicable.
        """
        if self.mode != AUDIO_EFFECT_MODE_ON_ONSET:
            return None
        # Decay toward 0.0 (will map to range_min)
        self._onset_level = max(0.0, self._onset_level - _ONSET_DECAY_RATE)
        curved = apply_response_curve(self._onset_level, self.curve)
        value = map_to_range(curved, self.range_min, self.range_max)
        changed = self._check_deadband(value, bypass=False)
        if changed:
            self._last_written = value
        return value, changed

    def process_onset(self, strength: float) -> tuple[int, bool] | None:
        """Process an onset event. Returns (mapped_value, changed) or None if disabled."""
        if self.mode is None:
            return None

        if self.mode == AUDIO_EFFECT_MODE_ONSET_FLASH:
            self._flash_brightness = min(1.0, strength)
            sensor_val = max(self._envelope.value, self._flash_brightness)
        elif self.mode == AUDIO_EFFECT_MODE_ON_ONSET:
            self._onset_level = min(1.0, strength)
            sensor_val = self._onset_level
        else:
            # Continuous/breathing modes don't process onsets
            return None

        curved = apply_response_curve(sensor_val, self.curve)
        value = map_to_range(curved, self.range_min, self.range_max)
        # Onset always bypasses deadband
        self._last_written = value
        return value, True

    def get_silence_target(self, behavior: str) -> int:
        """Get the target value for silence decay."""
        if behavior == "hold":
            return self._last_written if self._last_written is not None else self.range_min
        if behavior == "decay_mid":
            return round((self.range_min + self.range_max) / 2)
        # decay_min (default)
        return self.range_min

    def _check_deadband(self, value: int, bypass: bool = False) -> bool:
        """Check if value exceeds deadband threshold from last write."""
        if bypass or self._last_written is None:
            return True
        return abs(value - self._last_written) > self.deadband


class AudioEffectModulator(AudioConsumer):
    """Maps audio sensor events to effect speed writes.

    Implements AudioConsumer to receive events from AudioEngine.
    Brightness modulation is not supported for hardware effects —
    the T1M restarts the effect on every brightness change.
    """

    def __init__(
        self,
        hass: HomeAssistant,
        entity_ids: list[str],
        audio_config: AudioEffectConfig,
        backend_write_speed: Any,  # Callable for speed writes
        device_models: dict[str, str],  # entity_id -> model_id
    ) -> None:
        self.hass = hass
        self._entity_ids = entity_ids
        self._audio_config = audio_config
        self._write_speed = backend_write_speed
        self._device_models = device_models
        self._engine: AudioEngine | None = None
        self._silence_task: asyncio.Task | None = None

        # Create speed modulation channel
        self._speed_channel = ModulationChannel(
            mode=audio_config.audio_speed_mode,
            range_min=audio_config.audio_speed_min,
            range_max=audio_config.audio_speed_max,
            curve=audio_config.audio_speed_curve,
            deadband=SPEED_DEADBAND,
        )

        # Rate limiting
        self._last_speed_write: float = 0.0

        # Audio sensor availability flag (read by running-operations API)
        self.audio_waiting: bool = False

    def _get_rate_limit(self, entity_id: str) -> float:
        """Get rate limit for entity based on device model."""
        model = self._device_models.get(entity_id, "")
        if model in T1M_MODELS:
            return AUDIO_EFFECT_RATE_LIMIT_T1M
        return AUDIO_EFFECT_RATE_LIMIT_T1_STRIP

    def _is_onset_mode(self, channel: ModulationChannel) -> bool:
        """Check if channel uses an onset-responsive mode."""
        return channel.mode in (AUDIO_EFFECT_MODE_ON_ONSET, AUDIO_EFFECT_MODE_ONSET_FLASH)

    async def start(self, engine: AudioEngine) -> None:
        """Store engine reference for lifecycle management."""
        self._engine = engine

    async def stop(self) -> None:
        """Stop the modulator."""
        if self._silence_task and not self._silence_task.done():
            self._silence_task.cancel()

    async def on_audio_events(self, events: dict[str, Any]) -> None:
        """Process audio events into speed writes."""
        now = time.monotonic()

        # Process decay ticks for on_onset channel (called on every event cycle)
        if "onset" not in events:
            decay_result = self._speed_channel.process_energy_tick()
            if decay_result:
                value, changed = decay_result
                if changed:
                    await self._write_speed_to_all(value)
                    self._last_speed_write = now

        # Process onset events
        if "onset" in events:
            strength = events["onset"].get("strength", 1.0)
            speed_result = self._speed_channel.process_onset(strength)
            if speed_result:
                value, _ = speed_result
                await self._write_speed_to_all(value)
                self._last_speed_write = now

        # Process energy events (rate-limited)
        if "energy" in events:
            energy = events["energy"]

            speed_result = self._speed_channel.process_energy(energy)
            if speed_result:
                value, changed = speed_result
                if changed:
                    # Rate limit unless onset mode
                    min_interval = min(
                        self._get_rate_limit(eid) for eid in self._entity_ids
                    )
                    if self._is_onset_mode(self._speed_channel) or (
                        now - self._last_speed_write >= min_interval
                    ):
                        await self._write_speed_to_all(value)
                        self._last_speed_write = now

    async def on_silence_enter(self) -> None:
        """Handle silence — decay or hold based on config."""
        behavior = self._audio_config.audio_silence_behavior
        if behavior == "hold":
            return  # Do nothing, values stay where they are

        # Decay to target over AUDIO_EFFECT_SILENCE_DECAY_SECONDS
        speed_target = self._speed_channel.get_silence_target(behavior)
        self._silence_task = asyncio.ensure_future(
            self._decay_to_target(speed_target)
        )

    async def on_silence_exit(self) -> None:
        """Resume normal modulation."""
        if self._silence_task and not self._silence_task.done():
            self._silence_task.cancel()
            self._silence_task = None

    async def on_unavailable_timeout(self) -> None:
        """Audio sensor unavailable too long — stop modulating."""
        self.audio_waiting = True
        _LOGGER.warning("Audio sensor unavailable, stopping effect modulation")

    async def on_sensor_available(self) -> None:
        """Audio sensor recovered after unavailability."""
        self.audio_waiting = False

    async def _write_speed_to_all(self, speed: int) -> None:
        """Write effect_speed to all entities via backend."""
        for entity_id in self._entity_ids:
            try:
                await self._write_speed(entity_id, speed)
            except Exception:
                _LOGGER.warning("Failed to write speed to %s", entity_id, exc_info=True)

    async def _decay_to_target(self, speed_target: int) -> None:
        """Gradually decay speed to target value using cubic easing."""
        duration = AUDIO_EFFECT_SILENCE_DECAY_SECONDS
        steps = 15  # ~5 updates/second over 3 seconds
        interval = duration / steps

        speed_start = (
            self._speed_channel._last_written
            if self._speed_channel._last_written is not None
            else speed_target
        )

        for i in range(1, steps + 1):
            t = i / steps
            # Cubic ease-in-out
            if t < 0.5:
                eased = 4 * t * t * t
            else:
                eased = 1 - (-2 * t + 2) ** 3 / 2

            if self._speed_channel.mode is not None:
                speed_val = round(speed_start + (speed_target - speed_start) * eased)
                await self._write_speed_to_all(speed_val)

            await asyncio.sleep(interval)
