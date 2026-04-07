"""Tests for audio-reactive built-in effect presets."""
import pytest

from custom_components.aqara_advanced_lighting.const import (
    PRESET_T1M_LITTLE_FLUFFY_CLOUDS,
    PRESET_T1M_WAREHOUSE,
    PRESET_T1M_TANGERINE_DREAM,
    PRESET_T1M_RIDE_THE_LIGHTNING,
    PRESET_T1_STRIP_THUNDERSTRUCK,
    PRESET_T1_STRIP_LUCY_IN_THE_SKY,
    PRESET_T1_STRIP_RUNNING_UP_THAT_HILL,
    PRESET_T1_STRIP_NEON,
    MODEL_T1M_20_SEGMENT,
    MODEL_T1M_26_SEGMENT,
    MODEL_T1_STRIP,
    VALID_AUDIO_DETECTION_MODES,
    VALID_AUDIO_EFFECT_MODES,
    VALID_AUDIO_RESPONSE_CURVES,
    VALID_AUDIO_SILENCE_BEHAVIORS,
)
from custom_components.aqara_advanced_lighting.presets import EFFECT_PRESETS
from custom_components.aqara_advanced_lighting.models import EffectType

NEW_T1M_PRESET_IDS = [
    PRESET_T1M_LITTLE_FLUFFY_CLOUDS,
    PRESET_T1M_WAREHOUSE,
    PRESET_T1M_TANGERINE_DREAM,
    PRESET_T1M_RIDE_THE_LIGHTNING,
]

NEW_T1_STRIP_PRESET_IDS = [
    PRESET_T1_STRIP_THUNDERSTRUCK,
    PRESET_T1_STRIP_LUCY_IN_THE_SKY,
    PRESET_T1_STRIP_RUNNING_UP_THAT_HILL,
    PRESET_T1_STRIP_NEON,
]

ALL_NEW_PRESET_IDS = NEW_T1M_PRESET_IDS + NEW_T1_STRIP_PRESET_IDS

T1M_VALID_EFFECTS = {
    EffectType.FLOW1, EffectType.FLOW2, EffectType.FADING,
    EffectType.HOPPING, EffectType.BREATHING, EffectType.ROLLING,
}
T1_STRIP_VALID_EFFECTS = {
    EffectType.BREATHING, EffectType.RAINBOW1, EffectType.CHASING,
    EffectType.FLASH, EffectType.HOPPING, EffectType.RAINBOW2,
    EffectType.FLICKER, EffectType.DASH,
}


def test_preset_constants_have_correct_values():
    """Each constant should follow the naming pattern."""
    assert PRESET_T1M_LITTLE_FLUFFY_CLOUDS == "t1m_little_fluffy_clouds"
    assert PRESET_T1M_WAREHOUSE == "t1m_warehouse"
    assert PRESET_T1M_TANGERINE_DREAM == "t1m_tangerine_dream"
    assert PRESET_T1M_RIDE_THE_LIGHTNING == "t1m_ride_the_lightning"
    assert PRESET_T1_STRIP_THUNDERSTRUCK == "t1_strip_thunderstruck"
    assert PRESET_T1_STRIP_LUCY_IN_THE_SKY == "t1_strip_lucy_in_the_sky"
    assert PRESET_T1_STRIP_RUNNING_UP_THAT_HILL == "t1_strip_running_up_that_hill"
    assert PRESET_T1_STRIP_NEON == "t1_strip_neon"


# Task 2: Structural preset tests


def test_all_new_presets_in_effect_presets():
    for pid in ALL_NEW_PRESET_IDS:
        assert pid in EFFECT_PRESETS, f"Missing preset: {pid}"


@pytest.mark.parametrize("preset_id", ALL_NEW_PRESET_IDS)
def test_preset_has_required_base_fields(preset_id):
    preset = EFFECT_PRESETS[preset_id]
    for field in ["name", "icon", "effect", "colors", "speed", "brightness", "device_types"]:
        assert field in preset, f"{preset_id} missing field: {field}"


@pytest.mark.parametrize("preset_id", NEW_T1M_PRESET_IDS)
def test_t1m_preset_effect_valid(preset_id):
    effect = EFFECT_PRESETS[preset_id]["effect"]
    assert effect in T1M_VALID_EFFECTS, f"{preset_id} has invalid T1M effect: {effect}"


@pytest.mark.parametrize("preset_id", NEW_T1_STRIP_PRESET_IDS)
def test_t1_strip_preset_effect_valid(preset_id):
    effect = EFFECT_PRESETS[preset_id]["effect"]
    assert effect in T1_STRIP_VALID_EFFECTS, f"{preset_id} has invalid T1 Strip effect: {effect}"


@pytest.mark.parametrize("preset_id", NEW_T1M_PRESET_IDS)
def test_t1m_preset_device_types(preset_id):
    dt = EFFECT_PRESETS[preset_id]["device_types"]
    assert MODEL_T1M_20_SEGMENT in dt
    assert MODEL_T1M_26_SEGMENT in dt


@pytest.mark.parametrize("preset_id", NEW_T1_STRIP_PRESET_IDS)
def test_t1_strip_preset_device_types(preset_id):
    dt = EFFECT_PRESETS[preset_id]["device_types"]
    assert MODEL_T1_STRIP in dt


@pytest.mark.parametrize("preset_id", ALL_NEW_PRESET_IDS)
def test_preset_colors_valid(preset_id):
    colors = EFFECT_PRESETS[preset_id]["colors"]
    assert 1 <= len(colors) <= 8
    for color in colors:
        assert len(color) == 3
        assert all(0 <= c <= 255 for c in color), f"{preset_id} has out-of-range RGB: {color}"


@pytest.mark.parametrize("preset_id", ALL_NEW_PRESET_IDS)
def test_preset_speed_in_range(preset_id):
    speed = EFFECT_PRESETS[preset_id]["speed"]
    assert 1 <= speed <= 100, f"{preset_id} speed out of range: {speed}"


def test_preset_each_uses_distinct_effect_type():
    """New T1M presets must each use a different effect type from each other."""
    t1m_effects = [EFFECT_PRESETS[pid]["effect"] for pid in NEW_T1M_PRESET_IDS]
    assert len(t1m_effects) == len(set(t1m_effects)), "T1M new presets have duplicate effect types"
    strip_effects = [EFFECT_PRESETS[pid]["effect"] for pid in NEW_T1_STRIP_PRESET_IDS]
    assert len(strip_effects) == len(set(strip_effects)), "T1 Strip new presets have duplicate effect types"


# Task 3: Audio defaults tests


@pytest.mark.parametrize("preset_id", ALL_NEW_PRESET_IDS)
def test_preset_has_audio_defaults(preset_id):
    preset = EFFECT_PRESETS[preset_id]
    required_audio_fields = [
        "audio_detection_mode",
        "audio_sensitivity",
        "audio_silence_behavior",
    ]
    for field in required_audio_fields:
        assert field in preset, f"{preset_id} missing audio field: {field}"


@pytest.mark.parametrize("preset_id", ALL_NEW_PRESET_IDS)
def test_preset_audio_detection_mode_valid(preset_id):
    mode = EFFECT_PRESETS[preset_id]["audio_detection_mode"]
    assert mode in VALID_AUDIO_DETECTION_MODES


@pytest.mark.parametrize("preset_id", ALL_NEW_PRESET_IDS)
def test_preset_audio_silence_behavior_valid(preset_id):
    behavior = EFFECT_PRESETS[preset_id]["audio_silence_behavior"]
    assert behavior in VALID_AUDIO_SILENCE_BEHAVIORS


@pytest.mark.parametrize("preset_id", ALL_NEW_PRESET_IDS)
def test_preset_audio_sensitivity_in_range(preset_id):
    sensitivity = EFFECT_PRESETS[preset_id]["audio_sensitivity"]
    assert 1 <= sensitivity <= 100


@pytest.mark.parametrize("preset_id", ALL_NEW_PRESET_IDS)
def test_preset_audio_at_least_one_mode_non_none(preset_id):
    preset = EFFECT_PRESETS[preset_id]
    speed_mode = preset.get("audio_speed_mode")
    brightness_mode = preset.get("audio_brightness_mode")
    assert speed_mode is not None or brightness_mode is not None, \
        f"{preset_id}: both speed_mode and brightness_mode are None"


@pytest.mark.parametrize("preset_id", ALL_NEW_PRESET_IDS)
def test_preset_audio_speed_mode_valid_if_set(preset_id):
    mode = EFFECT_PRESETS[preset_id].get("audio_speed_mode")
    if mode is not None:
        assert mode in VALID_AUDIO_EFFECT_MODES


@pytest.mark.parametrize("preset_id", ALL_NEW_PRESET_IDS)
def test_preset_audio_brightness_mode_valid_if_set(preset_id):
    mode = EFFECT_PRESETS[preset_id].get("audio_brightness_mode")
    if mode is not None:
        assert mode in VALID_AUDIO_EFFECT_MODES


@pytest.mark.parametrize("preset_id", ALL_NEW_PRESET_IDS)
def test_preset_audio_speed_min_max_valid(preset_id):
    preset = EFFECT_PRESETS[preset_id]
    if preset.get("audio_speed_mode") is not None:
        lo = preset["audio_speed_min"]
        hi = preset["audio_speed_max"]
        assert 1 <= lo < hi <= 100, f"{preset_id} invalid speed range: {lo}-{hi}"


@pytest.mark.parametrize("preset_id", ALL_NEW_PRESET_IDS)
def test_preset_audio_brightness_min_max_valid(preset_id):
    preset = EFFECT_PRESETS[preset_id]
    if preset.get("audio_brightness_mode") is not None:
        lo = preset["audio_brightness_min"]
        hi = preset["audio_brightness_max"]
        assert 1 <= lo < hi <= 100, f"{preset_id} invalid brightness range: {lo}-{hi}"


@pytest.mark.parametrize("preset_id", ALL_NEW_PRESET_IDS)
def test_preset_audio_speed_curve_valid_if_set(preset_id):
    curve = EFFECT_PRESETS[preset_id].get("audio_speed_curve")
    if curve is not None:
        assert curve in VALID_AUDIO_RESPONSE_CURVES


@pytest.mark.parametrize("preset_id", ALL_NEW_PRESET_IDS)
def test_preset_audio_brightness_curve_valid_if_set(preset_id):
    curve = EFFECT_PRESETS[preset_id].get("audio_brightness_curve")
    if curve is not None:
        assert curve in VALID_AUDIO_RESPONSE_CURVES


@pytest.mark.parametrize("preset_id", ALL_NEW_PRESET_IDS)
def test_preset_no_audio_entity(preset_id):
    """Built-in presets must NOT embed an audio_entity."""
    assert EFFECT_PRESETS[preset_id].get("audio_entity") is None


from custom_components.aqara_advanced_lighting.services.effects import (
    _resolve_preset_audio_entity,
)
from custom_components.aqara_advanced_lighting.const import (
    DATA_USER_PREFERENCES_STORE,
    DOMAIN,
)


class FakePrefsStore:
    def __init__(self, entity: str):
        self._entity = entity

    def get_preferences(self, user_id: str) -> dict:
        return {"audio_override_entity": self._entity}


def _make_hass_data(entity: str = "") -> dict:
    """Build a minimal hass.data[DOMAIN] dict with a prefs store."""
    return {DATA_USER_PREFERENCES_STORE: FakePrefsStore(entity)}


AUDIO_PRESET = {
    "audio_detection_mode": "bass_energy",
    "audio_sensitivity": 70,
    "audio_silence_behavior": "decay_min",
    "audio_speed_mode": "on_onset",
    "audio_speed_min": 40,
    "audio_speed_max": 100,
    "audio_speed_curve": "linear",
    "audio_brightness_mode": "intensity_breathing",
    "audio_brightness_min": 50,
    "audio_brightness_max": 100,
    "audio_brightness_curve": "linear",
}

NON_AUDIO_PRESET = {
    "effect": "hopping",
    "colors": [[255, 0, 0]],
    "speed": 50,
}


class TestResolvePresetAudioEntity:

    def test_returns_none_for_non_audio_preset(self):
        """Preset without audio_detection_mode is not audio-reactive — entity is None."""
        result = _resolve_preset_audio_entity(
            NON_AUDIO_PRESET,
            call_audio_entity=None,
            hass_data=_make_hass_data("binary_sensor.beat"),
            user_id="user1",
        )
        assert result is None

    def test_user_default_entity_used_when_no_call_entity(self):
        """User's saved default entity is used for audio-reactive presets."""
        result = _resolve_preset_audio_entity(
            AUDIO_PRESET,
            call_audio_entity=None,
            hass_data=_make_hass_data("binary_sensor.beat"),
            user_id="user1",
        )
        assert result == "binary_sensor.beat"

    def test_call_entity_overrides_user_default(self):
        """Explicit call entity wins over the user's default."""
        result = _resolve_preset_audio_entity(
            AUDIO_PRESET,
            call_audio_entity="binary_sensor.override",
            hass_data=_make_hass_data("binary_sensor.beat"),
            user_id="user1",
        )
        assert result == "binary_sensor.override"

    def test_returns_none_when_no_entity_anywhere(self):
        """No call entity and no user default → None (preset runs without audio)."""
        result = _resolve_preset_audio_entity(
            AUDIO_PRESET,
            call_audio_entity=None,
            hass_data={},  # no prefs store
            user_id="user1",
        )
        assert result is None

    def test_returns_none_when_user_default_is_empty_string(self):
        """Empty string in user prefs counts as not configured."""
        result = _resolve_preset_audio_entity(
            AUDIO_PRESET,
            call_audio_entity=None,
            hass_data=_make_hass_data(""),  # empty — should not be returned
            user_id="user1",
        )
        assert result is None
