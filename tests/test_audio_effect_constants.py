"""Tests for audio-reactive effect constants."""
from custom_components.aqara_advanced_lighting.const import (
    AUDIO_EFFECT_MODE_ON_ONSET,
    AUDIO_EFFECT_MODE_CONTINUOUS,
    AUDIO_EFFECT_MODE_INTENSITY_BREATHING,
    AUDIO_EFFECT_MODE_ONSET_FLASH,
    VALID_AUDIO_EFFECT_MODES,
    AUDIO_RESPONSE_CURVE_LINEAR,
    AUDIO_RESPONSE_CURVE_LOGARITHMIC,
    AUDIO_RESPONSE_CURVE_EXPONENTIAL,
    VALID_AUDIO_RESPONSE_CURVES,
    AUDIO_SILENCE_HOLD,
    AUDIO_SILENCE_DECAY_MIN,
    AUDIO_SILENCE_DECAY_MID,
    AUDIO_SILENCE_SLOW_CYCLE,
    VALID_AUDIO_SILENCE_BEHAVIORS,
    AUDIO_EFFECT_RATE_LIMIT_T1M,
    AUDIO_EFFECT_RATE_LIMIT_T1_STRIP,
    SPEED_DEADBAND,
    BRIGHTNESS_DEADBAND,
    DEFAULT_AUDIO_SILENCE_BEHAVIOR,
    DEFAULT_AUDIO_RESPONSE_CURVE,
)


def test_audio_effect_modes():
    assert AUDIO_EFFECT_MODE_ON_ONSET == "on_onset"
    assert AUDIO_EFFECT_MODE_CONTINUOUS == "continuous"
    assert AUDIO_EFFECT_MODE_INTENSITY_BREATHING == "intensity_breathing"
    assert AUDIO_EFFECT_MODE_ONSET_FLASH == "onset_flash"
    assert len(VALID_AUDIO_EFFECT_MODES) == 4
    assert set(VALID_AUDIO_EFFECT_MODES) == {
        "on_onset", "continuous", "intensity_breathing", "onset_flash",
    }


def test_response_curves():
    assert AUDIO_RESPONSE_CURVE_LINEAR == "linear"
    assert AUDIO_RESPONSE_CURVE_LOGARITHMIC == "logarithmic"
    assert AUDIO_RESPONSE_CURVE_EXPONENTIAL == "exponential"
    assert len(VALID_AUDIO_RESPONSE_CURVES) == 3


def test_silence_behaviors():
    assert AUDIO_SILENCE_HOLD == "hold"
    assert AUDIO_SILENCE_DECAY_MIN == "decay_min"
    assert AUDIO_SILENCE_DECAY_MID == "decay_mid"
    assert AUDIO_SILENCE_SLOW_CYCLE == "slow_cycle"
    assert len(VALID_AUDIO_SILENCE_BEHAVIORS) == 4


def test_rate_limits():
    assert AUDIO_EFFECT_RATE_LIMIT_T1M == 2.0
    assert AUDIO_EFFECT_RATE_LIMIT_T1_STRIP == 0.5


def test_deadbands():
    assert SPEED_DEADBAND == 2
    assert BRIGHTNESS_DEADBAND == 5


def test_defaults():
    assert DEFAULT_AUDIO_SILENCE_BEHAVIOR == "decay_min"
    assert DEFAULT_AUDIO_RESPONSE_CURVE == "linear"


def test_silence_decay_duration():
    from custom_components.aqara_advanced_lighting.const import AUDIO_EFFECT_SILENCE_DECAY_SECONDS
    assert AUDIO_EFFECT_SILENCE_DECAY_SECONDS == 3.0
