"""Tests for sun_utils module."""

from unittest.mock import MagicMock

from custom_components.aqara_advanced_lighting.sun_utils import (
    SolarStep,
    interpolate_solar_values,
)


def _make_sun_state(elevation: float, rising: bool) -> MagicMock:
    """Create a mock sun state with the given elevation and rising flag."""
    state = MagicMock()
    state.attributes = {"elevation": elevation, "rising": rising}
    return state


SIMPLE_CURVE = [
    SolarStep(sun_elevation=-6, color_temp=2700, brightness=50, phase="rising"),
    SolarStep(sun_elevation=10, color_temp=4000, brightness=180, phase="rising"),
    SolarStep(sun_elevation=45, color_temp=6500, brightness=255, phase="any"),
    SolarStep(sun_elevation=10, color_temp=3500, brightness=200, phase="setting"),
    SolarStep(sun_elevation=-6, color_temp=2700, brightness=80, phase="setting"),
]


def test_interpolation_at_exact_step():
    """At exactly a defined elevation, return that step's values."""
    sun = _make_sun_state(45.0, rising=True)
    ct, br = interpolate_solar_values(SIMPLE_CURVE, sun)
    assert ct == 6500
    assert br == 255


def test_interpolation_midpoint_rising():
    """Between two rising steps, interpolate proportionally."""
    sun = _make_sun_state(27.5, rising=True)  # Midpoint of 10-45
    ct, br = interpolate_solar_values(SIMPLE_CURVE, sun)
    assert 4000 < ct < 6500
    assert 180 < br < 255


def test_interpolation_setting_uses_setting_steps():
    """When sun is setting, use setting-phase steps."""
    sun = _make_sun_state(10.0, rising=False)
    ct, br = interpolate_solar_values(SIMPLE_CURVE, sun)
    assert ct == 3500
    assert br == 200


def test_below_lowest_step_holds():
    """Below the lowest defined elevation, hold at that step's values."""
    sun = _make_sun_state(-20.0, rising=False)
    ct, br = interpolate_solar_values(SIMPLE_CURVE, sun)
    assert ct == 2700
    assert br == 80


def test_above_highest_step_holds():
    """Above the highest elevation, hold at that step's values."""
    sun = _make_sun_state(60.0, rising=True)
    ct, br = interpolate_solar_values(SIMPLE_CURVE, sun)
    assert ct == 6500
    assert br == 255


def test_symmetric_curve_no_phase():
    """Curve with 'any' phase works regardless of rising/setting."""
    symmetric = [
        SolarStep(sun_elevation=-6, color_temp=2700, brightness=50, phase="any"),
        SolarStep(sun_elevation=45, color_temp=6500, brightness=255, phase="any"),
    ]
    sun_rising = _make_sun_state(20.0, rising=True)
    sun_setting = _make_sun_state(20.0, rising=False)
    ct_r, br_r = interpolate_solar_values(symmetric, sun_rising)
    ct_s, br_s = interpolate_solar_values(symmetric, sun_setting)
    assert ct_r == ct_s
    assert br_r == br_s
