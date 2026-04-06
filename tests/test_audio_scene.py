"""Integration tests for audio-reactive dynamic scenes."""
from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest

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
        audio_brightness_curve="linear",
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


def test_build_scene_engine_config_matches_scene_audio_fields():
    """Engine config should reflect scene's audio settings."""
    from custom_components.aqara_advanced_lighting.audio_scene_consumer import (
        build_scene_engine_config,
    )
    scene = DynamicScene(
        colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)],
        transition_time=1.0,
        hold_time=1.0,
        distribution_mode="shuffle_rotate",
        offset_delay=0.0,
        random_order=False,
        loop_mode="continuous",
        audio_entity="binary_sensor.beat",
        audio_sensitivity=75,
        audio_detection_mode="bass_energy",
        audio_color_advance="continuous",
        audio_brightness_curve="linear",
    )
    config = build_scene_engine_config(scene)
    assert config.consumer_type == "scene"
    assert config.sensitivity == 75
    assert config.detection_mode == "bass_energy"
    assert config.subscribe_energy is True
    assert config.subscribe_onset is False  # continuous mode, not onset
    assert config.subscribe_silence is True


def test_scene_consumer_unavailable_timeout_signals_stop():
    """Consumer should set stop_event when audio sensor times out."""
    from custom_components.aqara_advanced_lighting.audio_scene_consumer import (
        DynamicSceneAudioConsumer,
    )

    scene = DynamicScene(
        colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)],
        transition_time=1.0,
        hold_time=1.0,
        distribution_mode="shuffle_rotate",
        offset_delay=0.0,
        random_order=False,
        loop_mode="continuous",
        audio_entity="binary_sensor.beat",
    )

    class FakeState:
        def __init__(self):
            self.scene = scene
            self.audio_waiting = False

    state = FakeState()
    stop = asyncio.Event()
    handler = MagicMock()

    consumer = DynamicSceneAudioConsumer(
        scene_state=state,
        handler=handler,
        stop_event=stop,
        apply_colors_fn=AsyncMock(),
        transition_seconds=0.5,
        is_onset_mode=True,
        is_energy_mode=False,
    )

    # Simulate unavailable timeout
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(consumer.on_unavailable_timeout())
    finally:
        loop.close()

    assert stop.is_set()
    assert state.audio_waiting is True


# --- Silence behavior tests ---

def test_dynamic_scene_silence_behavior_enum():
    """DynamicScene should accept audio_silence_behavior string enum."""
    scene = DynamicScene(
        colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)],
        transition_time=1.0,
        hold_time=1.0,
        distribution_mode="shuffle_rotate",
        offset_delay=0.0,
        random_order=False,
        loop_mode="continuous",
        audio_entity="binary_sensor.beat",
        audio_silence_behavior="slow_cycle",
    )
    assert scene.audio_silence_behavior == "slow_cycle"


def test_dynamic_scene_silence_behavior_invalid_raises():
    """Invalid audio_silence_behavior should raise ValueError."""
    with pytest.raises(ValueError, match="Invalid audio_silence_behavior"):
        DynamicScene(
            colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)],
            transition_time=1.0,
            hold_time=1.0,
            distribution_mode="shuffle_rotate",
            offset_delay=0.0,
            random_order=False,
            loop_mode="continuous",
            audio_silence_behavior="invalid",
        )


def test_dynamic_scene_silence_behavior_default():
    """Default should be slow_cycle (matches old audio_silence_degradation=True)."""
    scene = DynamicScene(
        colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)],
        transition_time=1.0,
        hold_time=1.0,
        distribution_mode="shuffle_rotate",
        offset_delay=0.0,
        random_order=False,
        loop_mode="continuous",
    )
    assert scene.audio_silence_behavior == "slow_cycle"


# --- Brightness curve tests ---

def test_dynamic_scene_brightness_curve_defaults():
    """Default brightness curve should match old brightness_response=True behavior."""
    scene = DynamicScene(
        colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)],
        transition_time=1.0,
        hold_time=1.0,
        distribution_mode="shuffle_rotate",
        offset_delay=0.0,
        random_order=False,
        loop_mode="continuous",
        audio_entity="binary_sensor.beat",
    )
    assert scene.audio_brightness_curve == "linear"
    assert scene.audio_brightness_min == 30
    assert scene.audio_brightness_max == 100


def test_dynamic_scene_brightness_curve_none_disables():
    """Setting audio_brightness_curve to None disables brightness response."""
    scene = DynamicScene(
        colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)],
        transition_time=1.0,
        hold_time=1.0,
        distribution_mode="shuffle_rotate",
        offset_delay=0.0,
        random_order=False,
        loop_mode="continuous",
        audio_brightness_curve=None,
    )
    assert scene.audio_brightness_curve is None


def test_dynamic_scene_brightness_min_max_validation():
    """audio_brightness_min must be less than audio_brightness_max."""
    with pytest.raises(ValueError, match="audio_brightness_min"):
        DynamicScene(
            colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)],
            transition_time=1.0,
            hold_time=1.0,
            distribution_mode="shuffle_rotate",
            offset_delay=0.0,
            random_order=False,
            loop_mode="continuous",
            audio_brightness_curve="linear",
            audio_brightness_min=80,
            audio_brightness_max=20,
        )


# --- Migration helper tests ---

def test_migrate_silence_param_legacy_true():
    from custom_components.aqara_advanced_lighting.services.dynamic_scene import (
        _migrate_silence_param,
    )
    assert _migrate_silence_param({"audio_silence_degradation": True}) == "slow_cycle"


def test_migrate_silence_param_legacy_false():
    from custom_components.aqara_advanced_lighting.services.dynamic_scene import (
        _migrate_silence_param,
    )
    assert _migrate_silence_param({"audio_silence_degradation": False}) == "hold"


def test_migrate_silence_param_new_field_takes_precedence():
    from custom_components.aqara_advanced_lighting.services.dynamic_scene import (
        _migrate_silence_param,
    )
    assert _migrate_silence_param({
        "audio_silence_degradation": True,
        "audio_silence_behavior": "decay_min",
    }) == "decay_min"


def test_migrate_silence_param_missing_defaults_to_slow_cycle():
    from custom_components.aqara_advanced_lighting.services.dynamic_scene import (
        _migrate_silence_param,
    )
    assert _migrate_silence_param({}) == "slow_cycle"


def test_migrate_brightness_response_legacy_true():
    from custom_components.aqara_advanced_lighting.services.dynamic_scene import (
        _migrate_brightness_response,
    )
    assert _migrate_brightness_response({"audio_brightness_response": True}) == ("linear", 30, 100)


def test_migrate_brightness_response_legacy_false():
    from custom_components.aqara_advanced_lighting.services.dynamic_scene import (
        _migrate_brightness_response,
    )
    assert _migrate_brightness_response({"audio_brightness_response": False}) == (None, 30, 100)


def test_migrate_brightness_response_new_fields_take_precedence():
    from custom_components.aqara_advanced_lighting.services.dynamic_scene import (
        _migrate_brightness_response,
    )
    result = _migrate_brightness_response({
        "audio_brightness_response": True,
        "audio_brightness_curve": "exponential",
        "audio_brightness_min": 10,
        "audio_brightness_max": 80,
    })
    assert result == ("exponential", 10, 80)


def test_migrate_brightness_response_missing_defaults():
    from custom_components.aqara_advanced_lighting.services.dynamic_scene import (
        _migrate_brightness_response,
    )
    assert _migrate_brightness_response({}) == ("linear", 30, 100)


# --- Eager preset migration tests ---

def test_migrate_silence_degradation_preset_rewrites_field():
    """Eager migration should replace bool field with string enum in stored preset."""
    from custom_components.aqara_advanced_lighting.preset_store import (
        _migrate_silence_degradation_to_behavior,
    )
    preset = {"id": "test-1", "name": "Test", "audio_silence_degradation": True}
    result = _migrate_silence_degradation_to_behavior(preset)
    assert "audio_silence_degradation" not in result
    assert result["audio_silence_behavior"] == "slow_cycle"
    assert result["_migrated_silence_v1"] is True


def test_migrate_silence_degradation_false_becomes_hold():
    from custom_components.aqara_advanced_lighting.preset_store import (
        _migrate_silence_degradation_to_behavior,
    )
    preset = {"id": "test-2", "name": "Test", "audio_silence_degradation": False}
    result = _migrate_silence_degradation_to_behavior(preset)
    assert result["audio_silence_behavior"] == "hold"


def test_migrate_silence_degradation_skips_already_migrated():
    from custom_components.aqara_advanced_lighting.preset_store import (
        _migrate_silence_degradation_to_behavior,
    )
    preset = {"id": "test-3", "name": "Test", "audio_silence_behavior": "decay_min", "_migrated_silence_v1": True}
    result = _migrate_silence_degradation_to_behavior(preset)
    assert result["audio_silence_behavior"] == "decay_min"


def test_migrate_silence_degradation_noop_without_field():
    from custom_components.aqara_advanced_lighting.preset_store import (
        _migrate_silence_degradation_to_behavior,
    )
    preset = {"id": "test-4", "name": "Test"}
    result = _migrate_silence_degradation_to_behavior(preset)
    assert "_migrated_silence_v1" not in result


def test_migrate_brightness_response_preset_rewrites_field():
    """Eager migration should replace bool field with curve params in stored preset."""
    from custom_components.aqara_advanced_lighting.preset_store import (
        _migrate_brightness_response_to_curve,
    )
    preset = {"id": "test-5", "name": "Test", "audio_brightness_response": True}
    result = _migrate_brightness_response_to_curve(preset)
    assert "audio_brightness_response" not in result
    assert result["audio_brightness_curve"] == "linear"
    assert result["audio_brightness_min"] == 30
    assert result["audio_brightness_max"] == 100
    assert result["_migrated_brightness_response_v1"] is True


def test_migrate_brightness_response_false_sets_none():
    from custom_components.aqara_advanced_lighting.preset_store import (
        _migrate_brightness_response_to_curve,
    )
    preset = {"id": "test-6", "name": "Test", "audio_brightness_response": False}
    result = _migrate_brightness_response_to_curve(preset)
    assert result["audio_brightness_curve"] is None

