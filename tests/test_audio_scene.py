"""Integration tests for audio-reactive dynamic scenes."""
from __future__ import annotations

import pytest

from custom_components.aqara_advanced_lighting.audio_discovery import (
    determine_audio_tier,
)
from custom_components.aqara_advanced_lighting.const import (
    AUDIO_TIER_RICH,
)
from custom_components.aqara_advanced_lighting.models import (
    DynamicScene,
    DynamicSceneColor,
)


def test_dynamic_scene_with_audio_fields():
    """DynamicScene should accept and validate audio fields."""
    scene = DynamicScene(
        colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)],
        transition_time=1.0,
        hold_time=1.0,
        distribution_mode="shuffle_rotate",
        offset_delay=0.0,
        random_order=False,
        loop_mode="continuous",
        audio_entity="binary_sensor.beat_detected",
        audio_sensitivity=75,
        audio_color_advance="on_onset",
        audio_transition_speed=80,
        audio_brightness_response=True,
    )
    assert scene.audio_entity == "binary_sensor.beat_detected"
    assert scene.audio_sensitivity == 75
    assert scene.audio_transition_speed == 80


def test_dynamic_scene_without_audio_unchanged():
    """DynamicScene without audio fields should work as before."""
    scene = DynamicScene(
        colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)],
        transition_time=1.0,
        hold_time=1.0,
        distribution_mode="shuffle_rotate",
        offset_delay=0.0,
        random_order=False,
        loop_mode="continuous",
    )
    assert scene.audio_entity is None
    assert scene.audio_sensitivity == 50
    assert scene.audio_color_advance == "on_onset"


def test_dynamic_scene_invalid_audio_color_advance():
    """Invalid audio_color_advance should raise ValueError."""
    with pytest.raises(ValueError, match="Invalid audio_color_advance"):
        DynamicScene(
            colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)],
            transition_time=1.0,
            hold_time=1.0,
            distribution_mode="shuffle_rotate",
            offset_delay=0.0,
            random_order=False,
            loop_mode="continuous",
            audio_color_advance="invalid",
        )


def test_audio_tier_routing():
    """Binary sensor should route to rich tier."""
    assert determine_audio_tier("binary_sensor.beat_detected") == AUDIO_TIER_RICH


