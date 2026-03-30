"""Tests for AudioEffectConfig dataclass."""
import pytest

from custom_components.aqara_advanced_lighting.models import AudioEffectConfig


class TestAudioEffectConfigDefaults:
    """Test default values."""

    def test_minimal_creation(self):
        config = AudioEffectConfig(audio_entity="binary_sensor.beat", audio_speed_mode="continuous")
        assert config.audio_entity == "binary_sensor.beat"
        assert config.audio_sensitivity == 50
        assert config.audio_detection_mode == "spectral_flux"
        assert config.audio_silence_behavior == "decay_min"
        assert config.audio_speed_mode == "continuous"
        assert config.audio_brightness_mode is None

    def test_speed_defaults(self):
        config = AudioEffectConfig(audio_entity="binary_sensor.beat", audio_speed_mode="on_onset")
        assert config.audio_speed_min == 1
        assert config.audio_speed_max == 100
        assert config.audio_speed_curve == "linear"

    def test_brightness_defaults(self):
        config = AudioEffectConfig(audio_entity="binary_sensor.beat", audio_brightness_mode="on_onset")
        assert config.audio_brightness_min == 1
        assert config.audio_brightness_max == 100
        assert config.audio_brightness_curve == "linear"


class TestAudioEffectConfigValidation:
    """Test validation rules."""

    def test_invalid_speed_mode_rejected(self):
        with pytest.raises(ValueError, match="audio_speed_mode"):
            AudioEffectConfig(
                audio_entity="binary_sensor.beat",
                audio_speed_mode="invalid",
            )

    def test_invalid_brightness_mode_rejected(self):
        with pytest.raises(ValueError, match="audio_brightness_mode"):
            AudioEffectConfig(
                audio_entity="binary_sensor.beat",
                audio_brightness_mode="invalid",
            )

    def test_invalid_response_curve_rejected(self):
        with pytest.raises(ValueError, match="audio_speed_curve"):
            AudioEffectConfig(
                audio_entity="binary_sensor.beat",
                audio_speed_mode="continuous",
                audio_speed_curve="cubic",
            )

    def test_invalid_silence_behavior_rejected(self):
        with pytest.raises(ValueError, match="audio_silence_behavior"):
            AudioEffectConfig(
                audio_entity="binary_sensor.beat",
                audio_silence_behavior="explode",
            )

    def test_sensitivity_clamped_high(self):
        config = AudioEffectConfig(audio_entity="binary_sensor.beat", audio_sensitivity=200, audio_speed_mode="continuous")
        assert config.audio_sensitivity == 100

    def test_sensitivity_clamped_low(self):
        config = AudioEffectConfig(audio_entity="binary_sensor.beat", audio_sensitivity=0, audio_speed_mode="continuous")
        assert config.audio_sensitivity == 1

    def test_speed_min_max_clamped(self):
        config = AudioEffectConfig(
            audio_entity="binary_sensor.beat",
            audio_speed_mode="continuous",
            audio_speed_min=0,
            audio_speed_max=150,
        )
        assert config.audio_speed_min == 1
        assert config.audio_speed_max == 100

    def test_speed_min_greater_than_max_raises(self):
        with pytest.raises(ValueError, match="audio_speed_min.*must be less"):
            AudioEffectConfig(
                audio_entity="binary_sensor.beat",
                audio_speed_mode="continuous",
                audio_speed_min=80,
                audio_speed_max=20,
            )

    def test_brightness_min_greater_than_max_raises(self):
        with pytest.raises(ValueError, match="audio_brightness_min.*must be less"):
            AudioEffectConfig(
                audio_entity="binary_sensor.beat",
                audio_brightness_mode="continuous",
                audio_brightness_min=80,
                audio_brightness_max=20,
            )

    def test_at_least_one_mode_required(self):
        """audio_entity set but both modes None should raise."""
        with pytest.raises(ValueError, match="at least one.*mode"):
            AudioEffectConfig(
                audio_entity="binary_sensor.beat",
                audio_speed_mode=None,
                audio_brightness_mode=None,
            )

    def test_valid_modes_accepted(self):
        for mode in ("on_onset", "continuous", "intensity_breathing", "onset_flash"):
            config = AudioEffectConfig(
                audio_entity="binary_sensor.beat",
                audio_speed_mode=mode,
            )
            assert config.audio_speed_mode == mode


class TestAudioEffectConfigImmutability:
    """Test frozen dataclass behavior."""

    def test_frozen(self):
        config = AudioEffectConfig(
            audio_entity="binary_sensor.beat",
            audio_speed_mode="continuous",
        )
        with pytest.raises(AttributeError):
            config.audio_speed_mode = "on_onset"


class TestAudioEffectConfigSerialization:
    """Test dict round-trip."""

    def test_to_dict(self):
        config = AudioEffectConfig(
            audio_entity="binary_sensor.beat",
            audio_sensitivity=75,
            audio_speed_mode="continuous",
            audio_speed_min=20,
            audio_speed_max=80,
            audio_speed_curve="logarithmic",
            audio_brightness_mode="on_onset",
        )
        d = config.to_dict()
        assert d["audio_entity"] == "binary_sensor.beat"
        assert d["audio_sensitivity"] == 75
        assert d["audio_speed_mode"] == "continuous"
        assert d["audio_speed_min"] == 20
        assert d["audio_speed_max"] == 80
        assert d["audio_speed_curve"] == "logarithmic"
        assert d["audio_brightness_mode"] == "on_onset"

    def test_from_dict(self):
        d = {
            "audio_entity": "binary_sensor.beat",
            "audio_sensitivity": 75,
            "audio_speed_mode": "continuous",
            "audio_speed_min": 20,
            "audio_speed_max": 80,
            "audio_speed_curve": "logarithmic",
            "audio_brightness_mode": "on_onset",
        }
        config = AudioEffectConfig.from_dict(d)
        assert config.audio_entity == "binary_sensor.beat"
        assert config.audio_sensitivity == 75
        assert config.audio_speed_mode == "continuous"

    def test_from_dict_with_defaults(self):
        d = {"audio_entity": "binary_sensor.beat", "audio_speed_mode": "on_onset"}
        config = AudioEffectConfig.from_dict(d)
        assert config.audio_sensitivity == 50
        assert config.audio_detection_mode == "spectral_flux"
        assert config.audio_speed_min == 1
        assert config.audio_speed_max == 100


from custom_components.aqara_advanced_lighting.models import (
    DynamicEffect,
    EffectType,
    RGBColor,
)


class TestDynamicEffectAudioConfig:
    """Test audio_config field on DynamicEffect."""

    def _make_effect(self, **kwargs):
        defaults = {
            "effect": EffectType.BREATHING,
            "effect_speed": 50,
            "effect_colors": [RGBColor(255, 0, 0)],
        }
        defaults.update(kwargs)
        return DynamicEffect(**defaults)

    def test_default_no_audio(self):
        effect = self._make_effect()
        assert effect.audio_config is None

    def test_with_audio_config(self):
        config = AudioEffectConfig(
            audio_entity="binary_sensor.beat",
            audio_speed_mode="continuous",
        )
        effect = self._make_effect(audio_config=config)
        assert effect.audio_config is not None
        assert effect.audio_config.audio_entity == "binary_sensor.beat"

    def test_backwards_compatible(self):
        """Existing code creating DynamicEffect without audio_config still works."""
        effect = DynamicEffect(
            effect=EffectType.RAINBOW1,
            effect_speed=75,
            effect_colors=[RGBColor(255, 0, 0), RGBColor(0, 255, 0)],
            effect_segments="1-10",
        )
        assert effect.audio_config is None
        assert effect.effect_speed == 75

    def test_to_mqtt_payload_unaffected(self):
        """audio_config should not appear in MQTT payload."""
        config = AudioEffectConfig(
            audio_entity="binary_sensor.beat",
            audio_speed_mode="on_onset",
        )
        effect = self._make_effect(audio_config=config)
        payload = effect.to_mqtt_payload()
        assert "audio_config" not in payload
        assert "audio_entity" not in payload
