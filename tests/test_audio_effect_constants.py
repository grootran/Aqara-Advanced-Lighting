"""Tests for audio-reactive effect constants."""
from custom_components.aqara_advanced_lighting.const import (
    AUDIO_EFFECT_MODE_VOLUME,
    AUDIO_EFFECT_MODE_TEMPO,
    AUDIO_EFFECT_MODE_COMBINED,
    VALID_AUDIO_EFFECT_MODES,
    AUDIO_SILENCE_HOLD,
    AUDIO_SILENCE_DECAY_MIN,
    AUDIO_SILENCE_DECAY_MID,
    AUDIO_SILENCE_SLOW_CYCLE,
    VALID_AUDIO_SILENCE_BEHAVIORS,
    SPEED_DEADBAND,
    DEFAULT_AUDIO_SILENCE_BEHAVIOR,
)


def test_audio_effect_modes():
    assert AUDIO_EFFECT_MODE_VOLUME == "volume"
    assert AUDIO_EFFECT_MODE_TEMPO == "tempo"
    assert AUDIO_EFFECT_MODE_COMBINED == "combined"
    assert len(VALID_AUDIO_EFFECT_MODES) == 3
    assert set(VALID_AUDIO_EFFECT_MODES) == {"volume", "tempo", "combined"}


def test_silence_behaviors():
    assert AUDIO_SILENCE_HOLD == "hold"
    assert AUDIO_SILENCE_DECAY_MIN == "decay_min"
    assert AUDIO_SILENCE_DECAY_MID == "decay_mid"
    assert AUDIO_SILENCE_SLOW_CYCLE == "slow_cycle"
    assert len(VALID_AUDIO_SILENCE_BEHAVIORS) == 4


def test_deadband():
    assert SPEED_DEADBAND == 4


def test_no_rate_limit_constants():
    """Rate limit constants should be removed."""
    import custom_components.aqara_advanced_lighting.const as c
    assert not hasattr(c, "AUDIO_EFFECT_RATE_LIMIT_T1M")
    assert not hasattr(c, "AUDIO_EFFECT_RATE_LIMIT_T1_STRIP")


def test_no_response_curve_constants_for_effects():
    """Response curve constants still exist (used by scenes) but effect modes don't reference them."""
    assert "linear" not in VALID_AUDIO_EFFECT_MODES
    assert "logarithmic" not in VALID_AUDIO_EFFECT_MODES


def test_defaults():
    assert DEFAULT_AUDIO_SILENCE_BEHAVIOR == "decay_min"


def test_silence_decay_duration():
    from custom_components.aqara_advanced_lighting.const import AUDIO_EFFECT_SILENCE_DECAY_SECONDS
    assert AUDIO_EFFECT_SILENCE_DECAY_SECONDS == 3.0
