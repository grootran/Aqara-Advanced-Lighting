"""Tests for AudioEffectConfig dataclass."""
import pytest

from custom_components.aqara_advanced_lighting.models import AudioEffectConfig


class TestAudioEffectConfigDefaults:
    """Test default values."""

    def test_minimal_creation(self):
        config = AudioEffectConfig(audio_entity="binary_sensor.beat", audio_speed_mode="volume")
        assert config.audio_entity == "binary_sensor.beat"
        assert config.audio_sensitivity == 50
        assert config.audio_silence_behavior == "decay_min"
        assert config.audio_speed_mode == "volume"

    def test_speed_defaults(self):
        config = AudioEffectConfig(audio_entity="binary_sensor.beat", audio_speed_mode="tempo")
        assert config.audio_speed_min == 1
        assert config.audio_speed_max == 100

    def test_no_detection_mode_field(self):
        """audio_detection_mode should not exist on AudioEffectConfig."""
        config = AudioEffectConfig(audio_entity="binary_sensor.beat", audio_speed_mode="volume")
        assert not hasattr(config, "audio_detection_mode")

    def test_no_speed_curve_field(self):
        """audio_speed_curve should not exist on AudioEffectConfig."""
        config = AudioEffectConfig(audio_entity="binary_sensor.beat", audio_speed_mode="volume")
        assert not hasattr(config, "audio_speed_curve")


class TestAudioEffectConfigValidation:
    """Test validation rules."""

    def test_invalid_speed_mode_rejected(self):
        with pytest.raises(ValueError, match="audio_speed_mode"):
            AudioEffectConfig(audio_entity="binary_sensor.beat", audio_speed_mode="invalid")

    def test_old_modes_rejected(self):
        for old_mode in ("on_onset", "continuous", "intensity_breathing", "onset_flash"):
            with pytest.raises(ValueError, match="audio_speed_mode"):
                AudioEffectConfig(audio_entity="binary_sensor.beat", audio_speed_mode=old_mode)

    def test_invalid_silence_behavior_rejected(self):
        with pytest.raises(ValueError, match="audio_silence_behavior"):
            AudioEffectConfig(audio_entity="binary_sensor.beat", audio_speed_mode="volume", audio_silence_behavior="explode")

    def test_sensitivity_clamped_high(self):
        config = AudioEffectConfig(audio_entity="binary_sensor.beat", audio_sensitivity=200, audio_speed_mode="volume")
        assert config.audio_sensitivity == 100

    def test_sensitivity_clamped_low(self):
        config = AudioEffectConfig(audio_entity="binary_sensor.beat", audio_sensitivity=0, audio_speed_mode="volume")
        assert config.audio_sensitivity == 1

    def test_speed_min_max_clamped(self):
        config = AudioEffectConfig(audio_entity="binary_sensor.beat", audio_speed_mode="volume", audio_speed_min=0, audio_speed_max=150)
        assert config.audio_speed_min == 1
        assert config.audio_speed_max == 100

    def test_speed_min_greater_than_max_raises(self):
        with pytest.raises(ValueError, match="audio_speed_min.*must be less"):
            AudioEffectConfig(audio_entity="binary_sensor.beat", audio_speed_mode="volume", audio_speed_min=80, audio_speed_max=20)

    def test_speed_mode_required(self):
        with pytest.raises(ValueError, match="requires audio_speed_mode"):
            AudioEffectConfig(audio_entity="binary_sensor.beat", audio_speed_mode=None)

    def test_valid_modes_accepted(self):
        for mode in ("volume", "tempo", "combined"):
            config = AudioEffectConfig(audio_entity="binary_sensor.beat", audio_speed_mode=mode)
            assert config.audio_speed_mode == mode


class TestAudioEffectConfigImmutability:
    def test_frozen(self):
        config = AudioEffectConfig(audio_entity="binary_sensor.beat", audio_speed_mode="volume")
        with pytest.raises(AttributeError):
            config.audio_speed_mode = "tempo"


class TestAudioEffectConfigSerialization:
    def test_to_dict(self):
        config = AudioEffectConfig(audio_entity="binary_sensor.beat", audio_sensitivity=75, audio_speed_mode="volume", audio_speed_min=20, audio_speed_max=80)
        d = config.to_dict()
        assert d["audio_entity"] == "binary_sensor.beat"
        assert d["audio_sensitivity"] == 75
        assert d["audio_speed_mode"] == "volume"
        assert d["audio_speed_min"] == 20
        assert d["audio_speed_max"] == 80
        assert "audio_speed_curve" not in d
        assert "audio_detection_mode" not in d

    def test_from_dict(self):
        d = {"audio_entity": "binary_sensor.beat", "audio_sensitivity": 75, "audio_speed_mode": "volume", "audio_speed_min": 20, "audio_speed_max": 80}
        config = AudioEffectConfig.from_dict(d)
        assert config.audio_entity == "binary_sensor.beat"
        assert config.audio_sensitivity == 75
        assert config.audio_speed_mode == "volume"

    def test_from_dict_with_defaults(self):
        d = {"audio_entity": "binary_sensor.beat", "audio_speed_mode": "tempo"}
        config = AudioEffectConfig.from_dict(d)
        assert config.audio_sensitivity == 50
        assert config.audio_speed_min == 1
        assert config.audio_speed_max == 100

    def test_from_dict_ignores_legacy_fields(self):
        d = {"audio_entity": "binary_sensor.beat", "audio_speed_mode": "volume", "audio_speed_curve": "logarithmic", "audio_detection_mode": "bass_energy", "audio_brightness_mode": "on_onset"}
        config = AudioEffectConfig.from_dict(d)
        assert config.audio_speed_mode == "volume"


from custom_components.aqara_advanced_lighting.models import DynamicEffect, EffectType, RGBColor


class TestDynamicEffectAudioConfig:
    def _make_effect(self, **kwargs):
        defaults = {"effect": EffectType.BREATHING, "effect_speed": 50, "effect_colors": [RGBColor(255, 0, 0)]}
        defaults.update(kwargs)
        return DynamicEffect(**defaults)

    def test_default_no_audio(self):
        effect = self._make_effect()
        assert effect.audio_config is None

    def test_with_audio_config(self):
        config = AudioEffectConfig(audio_entity="binary_sensor.beat", audio_speed_mode="volume")
        effect = self._make_effect(audio_config=config)
        assert effect.audio_config is not None
        assert effect.audio_config.audio_entity == "binary_sensor.beat"

    def test_backwards_compatible(self):
        effect = DynamicEffect(effect=EffectType.RAINBOW1, effect_speed=75, effect_colors=[RGBColor(255, 0, 0), RGBColor(0, 255, 0)], effect_segments="1-10")
        assert effect.audio_config is None
        assert effect.effect_speed == 75

    def test_to_mqtt_payload_unaffected(self):
        config = AudioEffectConfig(audio_entity="binary_sensor.beat", audio_speed_mode="volume")
        effect = self._make_effect(audio_config=config)
        payload = effect.to_mqtt_payload()
        assert "audio_config" not in payload
        assert "audio_entity" not in payload
