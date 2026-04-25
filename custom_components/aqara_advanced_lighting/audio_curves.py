"""Response curve functions for audio-reactive effect modulation."""

import math

from .const import (
    AUDIO_RESPONSE_CURVE_LOGARITHMIC,
    AUDIO_RESPONSE_CURVE_EXPONENTIAL,
)


def apply_response_curve(value: float, curve: str) -> float:
    """Apply a response curve to a normalized sensor value.

    Args:
        value: Input value, 0.0-1.0 (clamped if out of range).
        curve: Curve type — "linear", "logarithmic", or "exponential".

    Returns:
        Curved output value, 0.0-1.0.
    """
    value = max(0.0, min(1.0, value))

    if curve == AUDIO_RESPONSE_CURVE_LOGARITHMIC:
        return math.log(1 + value * 9) / math.log(10)
    if curve == AUDIO_RESPONSE_CURVE_EXPONENTIAL:
        return value * value
    # Linear (default fallback)
    return value


def map_to_range(curved_value: float, range_min: int, range_max: int) -> int:
    """Scale a curved 0.0-1.0 value to an integer range.

    Args:
        curved_value: Output from apply_response_curve(), 0.0-1.0.
        range_min: Minimum of the clamped range (1-100).
        range_max: Maximum of the clamped range (1-100).

    Returns:
        Integer value within [range_min, range_max].
    """
    curved_value = max(0.0, min(1.0, curved_value))
    raw = range_min + curved_value * (range_max - range_min)
    return max(range_min, min(range_max, round(raw)))


# Defaults for the pro-tier BassKick scene-side audio mode.
# Brightness pulses on low-bass (pro, ~80-240 Hz) or bass (basic-tier fallback)
# onsets, then decays back toward floor_brightness over pulse_ms.
BASS_KICK_DEFAULTS: dict[str, float] = {
    "pulse_ms": 100.0,         # pulse width at full brightness (cubic ease-out tail)
    "floor_brightness": 0.4,   # resting brightness between kicks
    "dominance_ratio": 1.5,    # driver must exceed competitor mean by this factor
}

# Defaults for the pro-tier FreqToHue scene-side audio mode.
# Spectral centroid maps to hue; amplitude drives brightness via the scene's
# configured brightness curve.
FREQ_TO_HUE_DEFAULTS: dict[str, float | bool] = {
    "hz_min": 100.0,
    "hz_max": 8000.0,
    "hue_start": 0.0,              # degrees — red
    "hue_end": 240.0,              # degrees — blue
    "log_scale": True,
    "silence_gate_amplitude": 0.05,  # hold hue when amplitude drops below this
    "hue_ema_alpha": 0.2,          # EMA smoothing on hue to suppress flicker
}


class EMAFilter:
    """Exponential moving average filter for signal smoothing."""

    __slots__ = ("alpha", "value")

    def __init__(self, alpha: float = 0.05, initial: float = 0.5) -> None:
        self.alpha = alpha
        self.value = initial

    def update(self, input_val: float) -> float:
        """Process one sample and return the smoothed value."""
        self.value = self.alpha * input_val + (1 - self.alpha) * self.value
        return self.value

    def reset(self, value: float = 0.5) -> None:
        """Reset the filter state."""
        self.value = value
