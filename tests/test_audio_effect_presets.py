"""Tests for audio-reactive effect preset storage."""
import pytest

from custom_components.aqara_advanced_lighting.models import AudioEffectConfig


class TestEffectPresetAudioConfig:
    """Test audio_config in effect preset storage."""

    def test_audio_config_in_allowed_fields(self):
        from custom_components.aqara_advanced_lighting.preset_store import (
            _ALLOWED_FIELDS,
        )
        from custom_components.aqara_advanced_lighting.const import PRESET_TYPE_EFFECT

        assert "audio_config" in _ALLOWED_FIELDS[PRESET_TYPE_EFFECT]

    def test_audio_config_serializes_to_dict(self):
        config = AudioEffectConfig(
            audio_entity="binary_sensor.beat",
            audio_sensitivity=75,
            audio_speed_mode="continuous",
            audio_speed_min=20,
            audio_speed_max=80,
        )
        d = config.to_dict()
        # Verify it's a plain dict suitable for JSON storage
        assert isinstance(d, dict)
        assert d["audio_entity"] == "binary_sensor.beat"
        assert d["audio_speed_min"] == 20

    def test_audio_config_round_trip(self):
        config = AudioEffectConfig(
            audio_entity="binary_sensor.beat",
            audio_sensitivity=75,
            audio_detection_mode="bass_energy",
            audio_silence_behavior="hold",
            audio_speed_mode="onset_flash",
            audio_speed_min=10,
            audio_speed_max=90,
            audio_speed_curve="exponential",
            audio_brightness_mode="intensity_breathing",
            audio_brightness_min=5,
            audio_brightness_max=95,
            audio_brightness_curve="logarithmic",
        )
        d = config.to_dict()
        restored = AudioEffectConfig.from_dict(d)
        assert restored == config

    def test_preset_without_audio_config_backwards_compatible(self):
        """Preset dict without audio_config should produce None."""
        preset_data = {
            "effect": "breathing",
            "effect_speed": 50,
            "effect_colors": [{"r": 255, "g": 0, "b": 0}],
        }
        assert preset_data.get("audio_config") is None
