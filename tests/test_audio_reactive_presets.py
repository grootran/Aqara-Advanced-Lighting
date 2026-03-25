"""Tests for audio-reactive dynamic scene preset definitions."""

import pytest

from custom_components.aqara_advanced_lighting.presets import DYNAMIC_SCENE_PRESETS
from custom_components.aqara_advanced_lighting.const import (
    VALID_AUDIO_COLOR_ADVANCE,
    VALID_AUDIO_DETECTION_MODES,
    VALID_DISTRIBUTION_MODES,
    MIN_DYNAMIC_SCENE_TRANSITION_TIME,
    MAX_DYNAMIC_SCENE_TRANSITION_TIME,
)


AUDIO_PRESET_IDS = [
    "beat_drop", "neon_pulse", "dance", "concert",
    "lounge", "tidal_flow", "deep_breath", "ember_glow",
    "synesthesia", "spectral_cascade", "frequency_split", "deee_lite",
]


def test_all_audio_presets_exist():
    """All 12 audio-reactive presets should be in DYNAMIC_SCENE_PRESETS."""
    for preset_id in AUDIO_PRESET_IDS:
        assert preset_id in DYNAMIC_SCENE_PRESETS, f"Missing preset: {preset_id}"


@pytest.mark.parametrize("preset_id", AUDIO_PRESET_IDS)
def test_audio_preset_has_required_fields(preset_id: str):
    """Each audio preset should have all required dynamic scene fields."""
    preset = DYNAMIC_SCENE_PRESETS[preset_id]
    required = ["name", "icon", "colors", "transition_time", "hold_time",
                "distribution_mode", "loop_mode", "end_behavior",
                "audio_color_advance", "audio_detection_mode",
                "audio_sensitivity", "audio_transition_speed"]
    for field in required:
        assert field in preset, f"{preset_id} missing field: {field}"


@pytest.mark.parametrize("preset_id", AUDIO_PRESET_IDS)
def test_audio_preset_valid_audio_mode(preset_id: str):
    """Audio mode should be a valid constant."""
    preset = DYNAMIC_SCENE_PRESETS[preset_id]
    assert preset["audio_color_advance"] in VALID_AUDIO_COLOR_ADVANCE


@pytest.mark.parametrize("preset_id", AUDIO_PRESET_IDS)
def test_audio_preset_valid_detection_mode(preset_id: str):
    """Detection mode should be a valid constant."""
    preset = DYNAMIC_SCENE_PRESETS[preset_id]
    assert preset["audio_detection_mode"] in VALID_AUDIO_DETECTION_MODES


@pytest.mark.parametrize("preset_id", AUDIO_PRESET_IDS)
def test_audio_preset_valid_distribution_mode(preset_id: str):
    """Distribution mode should be a valid constant."""
    preset = DYNAMIC_SCENE_PRESETS[preset_id]
    assert preset["distribution_mode"] in VALID_DISTRIBUTION_MODES


@pytest.mark.parametrize("preset_id", AUDIO_PRESET_IDS)
def test_audio_preset_transition_time_in_range(preset_id: str):
    """Transition time should respect MIN/MAX constants."""
    preset = DYNAMIC_SCENE_PRESETS[preset_id]
    assert MIN_DYNAMIC_SCENE_TRANSITION_TIME <= preset["transition_time"] <= MAX_DYNAMIC_SCENE_TRANSITION_TIME


@pytest.mark.parametrize("preset_id", AUDIO_PRESET_IDS)
def test_audio_preset_sensitivity_in_range(preset_id: str):
    """Sensitivity should be 1-100."""
    preset = DYNAMIC_SCENE_PRESETS[preset_id]
    assert 1 <= preset["audio_sensitivity"] <= 100


@pytest.mark.parametrize("preset_id", AUDIO_PRESET_IDS)
def test_audio_preset_transition_speed_in_range(preset_id: str):
    """Transition speed should be 1-100."""
    preset = DYNAMIC_SCENE_PRESETS[preset_id]
    assert 1 <= preset["audio_transition_speed"] <= 100


@pytest.mark.parametrize("preset_id", AUDIO_PRESET_IDS)
def test_audio_preset_colors_valid(preset_id: str):
    """Colors should have 1-8 entries with valid CIE xy and brightness."""
    preset = DYNAMIC_SCENE_PRESETS[preset_id]
    colors = preset["colors"]
    assert 1 <= len(colors) <= 8
    for color in colors:
        assert 0.0 <= color["x"] <= 1.0
        assert 0.0 <= color["y"] <= 1.0
        assert 1 <= color["brightness_pct"] <= 100


@pytest.mark.parametrize("preset_id", AUDIO_PRESET_IDS)
def test_audio_preset_no_hardcoded_audio_entity(preset_id: str):
    """Built-in presets should NOT have audio_entity set."""
    preset = DYNAMIC_SCENE_PRESETS[preset_id]
    assert preset.get("audio_entity") is None


def test_audio_preset_count():
    """Should have exactly 12 audio-reactive presets."""
    audio_presets = [
        k for k, v in DYNAMIC_SCENE_PRESETS.items()
        if "audio_color_advance" in v
    ]
    assert len(audio_presets) == 12


def test_all_audio_modes_covered():
    """Every audio mode should be used by at least one preset."""
    modes_used = {
        DYNAMIC_SCENE_PRESETS[pid]["audio_color_advance"]
        for pid in AUDIO_PRESET_IDS
    }
    for mode in VALID_AUDIO_COLOR_ADVANCE:
        assert mode in modes_used, f"Audio mode not covered: {mode}"


def test_all_detection_modes_covered():
    """Every detection mode should be used by at least one preset."""
    modes_used = {
        DYNAMIC_SCENE_PRESETS[pid]["audio_detection_mode"]
        for pid in AUDIO_PRESET_IDS
    }
    for mode in VALID_AUDIO_DETECTION_MODES:
        assert mode in modes_used, f"Detection mode not covered: {mode}"
