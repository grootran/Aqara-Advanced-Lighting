"""Audio effect modulator — maps audio sensor events to speed writes.

Consumes events from AudioEngine and translates them into
effect_speed commands. Three modes:
- volume: energy (loudness) maps to speed
- tempo: BPM maps to speed
- combined: tempo sets baseline, energy modulates around it

Brightness modulation is not supported for hardware effects because
the T1M/T2 restart the effect on every brightness change.
"""

import asyncio
import logging
from typing import Any

from homeassistant.core import HomeAssistant

from .audio_engine import AudioConsumer, AudioEngine, AudioEngineConfig
from .const import (
    AUDIO_EFFECT_MODE_VOLUME,
    AUDIO_EFFECT_MODE_TEMPO,
    AUDIO_EFFECT_MODE_COMBINED,
    AUDIO_EFFECT_SILENCE_DECAY_SECONDS,
    SPEED_DEADBAND,
)
from .models import AudioEffectConfig

_LOGGER = logging.getLogger(__name__)

# BPM range matching the ESPHome beat tracker's clamped output
BPM_MIN = 40.0
BPM_MAX = 200.0


def _apply_sensitivity(value: float, sensitivity: int) -> float:
    """Scale a 0-1 signal by sensitivity.

    sensitivity=50 is neutral (1:1 mapping).
    Higher sensitivity amplifies the signal, lower attenuates.
    """
    factor = sensitivity / 50.0
    return min(1.0, max(0.0, value * factor))


def compute_speed_volume(energy: float, sensitivity: int, speed_min: int, speed_max: int) -> int:
    """Map energy (0-1) to speed range."""
    scaled = _apply_sensitivity(energy, sensitivity)
    return round(speed_min + scaled * (speed_max - speed_min))


def compute_speed_tempo(bpm: float, sensitivity: int, speed_min: int, speed_max: int) -> int:
    """Map BPM (40-200) to speed range.

    BPM <= 0 (unknown) maps to speed_min.
    Sensitivity narrows the effective BPM window around the center (120 BPM).
    """
    if bpm <= 0:
        return speed_min

    center = (BPM_MIN + BPM_MAX) / 2.0  # 120 BPM
    half_range = (BPM_MAX - BPM_MIN) / 2.0  # 80

    # Sensitivity narrows the window: higher = smaller BPM range maps to full speed range
    factor = sensitivity / 50.0
    effective_half = half_range / max(factor, 0.1)

    normalized = (bpm - center) / effective_half  # -1 to 1 at neutral sensitivity
    scaled = (normalized + 1.0) / 2.0  # 0 to 1
    clamped = min(1.0, max(0.0, scaled))

    return round(speed_min + clamped * (speed_max - speed_min))


def compute_speed_combined(
    bpm: float, energy: float, sensitivity: int, speed_min: int, speed_max: int,
) -> int:
    """Tempo sets baseline, energy modulates around it.

    The energy offset is relative to zero — positive energy pushes speed up
    from the tempo baseline, clamped to [speed_min, speed_max].
    """
    baseline = compute_speed_tempo(bpm, sensitivity, speed_min, speed_max)
    energy_scaled = _apply_sensitivity(energy, sensitivity)
    speed_range = speed_max - speed_min
    offset = energy_scaled * speed_range * 0.5  # modulate up to half the range
    return round(min(speed_max, max(speed_min, baseline + offset)))


# Smoothing constants
_SMOOTH_ALPHA_LOW = 0.15   # heavy smoothing for small changes
_SMOOTH_ALPHA_HIGH = 0.7   # fast tracking for large changes
_SMOOTH_JUMP_THRESHOLD = 15  # speed units — changes above this track fast


class SpeedSmoother:
    """Adaptive EMA filter for speed values.

    Small changes get heavy smoothing to reduce jitter.
    Large changes (> jump_threshold) track quickly for responsiveness.
    """

    def __init__(self) -> None:
        self._smoothed: float | None = None

    def update(self, raw_speed: int) -> int:
        """Smooth a raw speed value and return the filtered result."""
        if self._smoothed is None:
            self._smoothed = float(raw_speed)
            return raw_speed

        delta = abs(raw_speed - self._smoothed)
        alpha = _SMOOTH_ALPHA_HIGH if delta >= _SMOOTH_JUMP_THRESHOLD else _SMOOTH_ALPHA_LOW
        self._smoothed += alpha * (raw_speed - self._smoothed)
        return round(self._smoothed)


class DeadbandFilter:
    """Filters out small speed changes below threshold."""

    def __init__(self, threshold: int) -> None:
        self.threshold = threshold
        self._last_written: int | None = None

    def check(self, value: int) -> bool:
        """Return True if value exceeds deadband from last written."""
        if self._last_written is None:
            self._last_written = value
            return True
        if abs(value - self._last_written) > self.threshold:
            self._last_written = value
            return True
        return False

    @property
    def last_written(self) -> int | None:
        return self._last_written


def get_silence_target(behavior: str, last_written: int | None, speed_min: int, speed_max: int) -> int:
    """Get the target speed value for silence decay."""
    if behavior == "hold":
        return last_written if last_written is not None else speed_min
    if behavior == "decay_mid":
        return round((speed_min + speed_max) / 2)
    # decay_min (default)
    return speed_min


class AudioEffectModulator(AudioConsumer):
    """Maps audio sensor events to effect speed writes.

    Implements AudioConsumer to receive events from AudioEngine.
    """

    def __init__(
        self,
        hass: HomeAssistant,
        entity_ids: list[str],
        audio_config: AudioEffectConfig,
        backend_write_speed: Any,  # Callable for speed writes
    ) -> None:
        self.hass = hass
        self._entity_ids = entity_ids
        self._audio_config = audio_config
        self._write_speed = backend_write_speed
        self._engine: AudioEngine | None = None
        self._silence_task: asyncio.Task | None = None

        self._smoother = SpeedSmoother()
        self._deadband = DeadbandFilter(threshold=SPEED_DEADBAND)
        self._last_bpm: float = 0.0

        # Audio sensor availability flag (read by running-operations API)
        self.audio_waiting: bool = False

    async def start(self, engine: AudioEngine) -> None:
        """Store engine reference for lifecycle management."""
        self._engine = engine

    async def stop(self) -> None:
        """Stop the modulator."""
        if self._silence_task and not self._silence_task.done():
            self._silence_task.cancel()

    def _compute_speed(self, energy: float) -> int:
        """Compute speed value based on current mode."""
        mode = self._audio_config.audio_speed_mode
        sens = self._audio_config.audio_sensitivity
        smin = self._audio_config.audio_speed_min
        smax = self._audio_config.audio_speed_max

        if mode == AUDIO_EFFECT_MODE_VOLUME:
            return compute_speed_volume(energy, sens, smin, smax)
        if mode == AUDIO_EFFECT_MODE_TEMPO:
            return compute_speed_tempo(self._last_bpm, sens, smin, smax)
        if mode == AUDIO_EFFECT_MODE_COMBINED:
            return compute_speed_combined(self._last_bpm, energy, sens, smin, smax)
        return smin

    async def on_audio_events(self, events: dict[str, Any]) -> None:
        """Process audio events into speed writes."""
        # Track latest BPM
        if "bpm" in events:
            self._last_bpm = events["bpm"]

        # For tempo-only mode, only recompute when BPM changes
        if self._audio_config.audio_speed_mode == AUDIO_EFFECT_MODE_TEMPO:
            if "bpm" not in events:
                return
            speed = self._compute_speed(0.0)
        else:
            # Volume and combined modes need energy
            energy = events.get("energy", 0.0)
            speed = self._compute_speed(energy)

        speed = self._smoother.update(speed)
        if self._deadband.check(speed):
            await self._write_speed_to_all(speed)

    async def on_silence_enter(self) -> None:
        """Handle silence — decay or hold based on config."""
        behavior = self._audio_config.audio_silence_behavior
        if behavior == "hold":
            return

        target = get_silence_target(
            behavior,
            self._deadband.last_written,
            self._audio_config.audio_speed_min,
            self._audio_config.audio_speed_max,
        )
        self._silence_task = asyncio.ensure_future(
            self._decay_to_target(target)
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
            self._deadband.last_written
            if self._deadband.last_written is not None
            else speed_target
        )

        for i in range(1, steps + 1):
            t = i / steps
            # Cubic ease-in-out
            if t < 0.5:
                eased = 4 * t * t * t
            else:
                eased = 1 - (-2 * t + 2) ** 3 / 2

            speed_val = round(speed_start + (speed_target - speed_start) * eased)
            await self._write_speed_to_all(speed_val)

            await asyncio.sleep(interval)
