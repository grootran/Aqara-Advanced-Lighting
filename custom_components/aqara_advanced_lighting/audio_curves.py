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
