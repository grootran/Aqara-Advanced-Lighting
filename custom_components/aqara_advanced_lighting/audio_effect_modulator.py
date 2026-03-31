"""Audio effect modulator — maps sensor events to speed/brightness writes.

Consumes events from AudioEngine and translates them into
effect_speed and brightness commands for T1M and T1 Strip devices.
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
    BRIGHTNESS_DEADBAND,
    DATA_ENTITY_CONTROLLER,
    DOMAIN,
    SPEED_DEADBAND,
    T1M_MODELS,
    brightness_percent_to_device,
)
from .models import AudioEffectConfig

_LOGGER = logging.getLogger(__name__)

# EMA smoothing factor (matches audio_mode_handlers.py ENERGY_EMA_ALPHA)
_EMA_ALPHA = 0.05
# Per-tick flash brightness decay (matches FLASH_BRIGHTNESS_DECAY)
_FLASH_DECAY = 0.02
# Per-tick onset decay rate for on_onset mode (decays toward min between beats)
_ONSET_DECAY_RATE = 0.03


class ModulationChannel:
    """Single modulation channel (speed or brightness)."""

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
        self._envelope: float = 0.5
        self._flash_brightness: float = 0.0
        self._onset_level: float = 0.0

    def process_energy(self, energy: float) -> tuple[int, bool] | None:
        """Process an energy value. Returns (mapped_value, changed) or None if disabled."""
        if self.mode is None:
            return None

        if self.mode == AUDIO_EFFECT_MODE_INTENSITY_BREATHING:
            self._envelope = _EMA_ALPHA * energy + (1 - _EMA_ALPHA) * self._envelope
            sensor_val = self._envelope
        elif self.mode == AUDIO_EFFECT_MODE_ONSET_FLASH:
            self._envelope = _EMA_ALPHA * energy + (1 - _EMA_ALPHA) * self._envelope
            self._flash_brightness = max(0.0, self._flash_brightness - _FLASH_DECAY)
            sensor_val = max(self._envelope, self._flash_brightness)
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
            sensor_val = max(self._envelope, self._flash_brightness)
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
    """Maps audio sensor events to effect speed and brightness writes.

    Implements AudioConsumer to receive events from AudioEngine.
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

        # Create modulation channels
        self._speed_channel = ModulationChannel(
            mode=audio_config.audio_speed_mode,
            range_min=audio_config.audio_speed_min,
            range_max=audio_config.audio_speed_max,
            curve=audio_config.audio_speed_curve,
            deadband=SPEED_DEADBAND,
        )
        self._brightness_channel = ModulationChannel(
            mode=audio_config.audio_brightness_mode,
            range_min=audio_config.audio_brightness_min,
            range_max=audio_config.audio_brightness_max,
            curve=audio_config.audio_brightness_curve,
            deadband=BRIGHTNESS_DEADBAND,
        )

        # Rate limiting
        self._last_speed_write: float = 0.0
        self._last_brightness_write: float = 0.0

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
        """Process audio events into speed/brightness writes."""
        now = time.monotonic()

        # Process decay ticks for on_onset channels (called on every event cycle)
        if "onset" not in events:
            for channel, write_fn, last_write_attr in [
                (self._speed_channel, self._write_speed_to_all, "_last_speed_write"),
                (self._brightness_channel, self._write_brightness_to_all, "_last_brightness_write"),
            ]:
                decay_result = channel.process_energy_tick()
                if decay_result:
                    value, changed = decay_result
                    if changed:
                        await write_fn(value)
                        setattr(self, last_write_attr, now)

        # Process onset events
        if "onset" in events:
            strength = events["onset"].get("strength", 1.0)
            speed_result = self._speed_channel.process_onset(strength)
            if speed_result:
                value, _ = speed_result
                await self._write_speed_to_all(value)
                self._last_speed_write = now

            brightness_result = self._brightness_channel.process_onset(strength)
            if brightness_result:
                value, _ = brightness_result
                await self._write_brightness_to_all(value)
                self._last_brightness_write = now

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

            brightness_result = self._brightness_channel.process_energy(energy)
            if brightness_result:
                value, changed = brightness_result
                if changed:
                    min_interval = min(
                        self._get_rate_limit(eid) for eid in self._entity_ids
                    )
                    if self._is_onset_mode(self._brightness_channel) or (
                        now - self._last_brightness_write >= min_interval
                    ):
                        await self._write_brightness_to_all(value)
                        self._last_brightness_write = now

    async def on_silence_enter(self) -> None:
        """Handle silence — decay or hold based on config."""
        behavior = self._audio_config.audio_silence_behavior
        if behavior == "hold":
            return  # Do nothing, values stay where they are

        # Decay to target over AUDIO_EFFECT_SILENCE_DECAY_SECONDS
        speed_target = self._speed_channel.get_silence_target(behavior)
        brightness_target = self._brightness_channel.get_silence_target(behavior)
        self._silence_task = asyncio.ensure_future(
            self._decay_to_targets(speed_target, brightness_target)
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

    def _create_context(self):
        """Create an integration-tagged context to avoid external change detection."""
        ec = self.hass.data.get(DOMAIN, {}).get(DATA_ENTITY_CONTROLLER)
        if ec:
            return ec.create_context()
        return None

    async def _write_brightness_to_all(self, brightness_pct: int) -> None:
        """Write brightness to all entities via HA light service."""
        brightness_device = brightness_percent_to_device(brightness_pct)
        context = self._create_context()
        tasks = [
            self.hass.services.async_call(
                "light", "turn_on",
                {"entity_id": eid, "brightness": brightness_device},
                blocking=False,
                context=context,
            )
            for eid in self._entity_ids
        ]
        await asyncio.gather(*tasks, return_exceptions=True)

    async def _decay_to_targets(
        self, speed_target: int, brightness_target: int
    ) -> None:
        """Gradually decay speed and brightness to target values using cubic easing."""
        duration = AUDIO_EFFECT_SILENCE_DECAY_SECONDS
        steps = 15  # ~5 updates/second over 3 seconds
        interval = duration / steps

        speed_start = (
            self._speed_channel._last_written
            if self._speed_channel._last_written is not None
            else speed_target
        )
        brightness_start = (
            self._brightness_channel._last_written
            if self._brightness_channel._last_written is not None
            else brightness_target
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

            if self._brightness_channel.mode is not None:
                bright_val = round(
                    brightness_start + (brightness_target - brightness_start) * eased
                )
                await self._write_brightness_to_all(bright_val)

            await asyncio.sleep(interval)
