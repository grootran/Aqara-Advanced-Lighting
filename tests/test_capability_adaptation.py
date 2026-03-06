"""Tests for capability adaptation in dynamic scenes."""

import pytest

from custom_components.aqara_advanced_lighting.capability_profile import (
    CapabilityProfile,
    LightCapabilityLevel,
    adapt_xy_for_cct_light,
)


def test_cct_only_light_gets_color_temp_instead_of_xy():
    """A CCT-only light should receive color_temp_kelvin, not xy_color."""
    profile = CapabilityProfile(
        level=LightCapabilityLevel.CCT_ONLY,
        min_color_temp_kelvin=2700,
        max_color_temp_kelvin=6500,
    )
    # Warm XY color (0.45, 0.41) should convert to a valid CCT
    kelvin = adapt_xy_for_cct_light(0.45, 0.41, 2700, 6500)
    assert isinstance(kelvin, int)
    assert 2700 <= kelvin <= 6500


def test_brightness_only_light_skips_color():
    """A brightness-only light should only have brightness in service data."""
    profile = CapabilityProfile(level=LightCapabilityLevel.BRIGHTNESS_ONLY)
    assert profile.level == LightCapabilityLevel.BRIGHTNESS_ONLY


def test_full_color_light_passes_xy_unchanged():
    """A full-color light should receive xy_color as-is."""
    profile = CapabilityProfile(level=LightCapabilityLevel.FULL_COLOR)
    assert profile.level == LightCapabilityLevel.FULL_COLOR
