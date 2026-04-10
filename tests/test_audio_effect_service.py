"""Tests for audio-reactive effect service integration."""
import pytest

from custom_components.aqara_advanced_lighting.const import T2_RGB_MODELS, T1M_MODELS
from custom_components.aqara_advanced_lighting.models import AudioEffectConfig


class TestAudioEffectValidation:
    """Test service-level validation for audio-reactive effects."""

    def test_t2_model_detected(self):
        """T2 models should be in the exclusion set."""
        for model in T2_RGB_MODELS:
            assert model not in T1M_MODELS

    def test_audio_config_from_service_data(self):
        """Service data should produce valid AudioEffectConfig."""
        service_data = {
            "audio_entity": "binary_sensor.beat",
            "audio_sensitivity": 75,
            "audio_speed_mode": "volume",
            "audio_speed_min": 20,
            "audio_speed_max": 80,
        }
        config = AudioEffectConfig(
            audio_entity=service_data["audio_entity"],
            audio_sensitivity=service_data.get("audio_sensitivity", 50),
            audio_speed_mode=service_data.get("audio_speed_mode"),
            audio_speed_min=service_data.get("audio_speed_min", 1),
            audio_speed_max=service_data.get("audio_speed_max", 100),
        )
        assert config.audio_entity == "binary_sensor.beat"
        assert config.audio_speed_mode == "volume"

    def test_audio_config_tempo_mode(self):
        """Tempo mode should be valid."""
        config = AudioEffectConfig(
            audio_entity="binary_sensor.beat",
            audio_speed_mode="tempo",
        )
        assert config.audio_speed_mode == "tempo"

    def test_audio_config_combined_mode(self):
        """Combined mode should be valid."""
        config = AudioEffectConfig(
            audio_entity="binary_sensor.beat",
            audio_speed_mode="combined",
        )
        assert config.audio_speed_mode == "combined"

    def test_audio_config_from_preset_override(self):
        """Preset audio_config should be overridable at activation."""
        preset_config = AudioEffectConfig(
            audio_entity="binary_sensor.beat",
            audio_speed_mode="volume",
            audio_speed_min=10,
            audio_speed_max=90,
        )
        # Override sensitivity at activation time
        override_data = preset_config.to_dict()
        override_data["audio_sensitivity"] = 80
        restored = AudioEffectConfig.from_dict(override_data)
        assert restored.audio_sensitivity == 80
        assert restored.audio_speed_mode == "volume"
