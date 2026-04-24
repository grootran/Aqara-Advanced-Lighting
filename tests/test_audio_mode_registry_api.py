"""Tests for the audio_mode_registry REST endpoint + serialiser."""

from custom_components.aqara_advanced_lighting.audio_mode_handlers import (
    MODE_REGISTRY,
    serialise_mode_registry,
)
from custom_components.aqara_advanced_lighting.const import (
    AUDIO_COLOR_ADVANCE_BASS_KICK,
    AUDIO_COLOR_ADVANCE_FREQ_TO_HUE,
    AUDIO_COLOR_ADVANCE_ON_ONSET,
)


class TestSerialiseModeRegistry:
    def test_returns_one_entry_per_mode(self):
        result = serialise_mode_registry()
        assert len(result) == len(MODE_REGISTRY)

    def test_each_entry_has_required_fields(self):
        result = serialise_mode_registry()
        for entry in result:
            assert set(entry.keys()) == {"constant", "requires_pro", "display_label"}
            assert isinstance(entry["constant"], str)
            assert isinstance(entry["requires_pro"], bool)
            assert isinstance(entry["display_label"], str)

    def test_bass_kick_marked_requires_pro(self):
        result = serialise_mode_registry()
        bass_kick = next(e for e in result if e["constant"] == AUDIO_COLOR_ADVANCE_BASS_KICK)
        assert bass_kick["requires_pro"] is True

    def test_freq_to_hue_not_marked_requires_pro(self):
        result = serialise_mode_registry()
        freq = next(e for e in result if e["constant"] == AUDIO_COLOR_ADVANCE_FREQ_TO_HUE)
        assert freq["requires_pro"] is False

    def test_on_onset_present_and_basic(self):
        result = serialise_mode_registry()
        on_onset = next(e for e in result if e["constant"] == AUDIO_COLOR_ADVANCE_ON_ONSET)
        assert on_onset["requires_pro"] is False

    def test_ordering_matches_registry_insertion(self):
        """Frontend relies on Python's registry order for UI display order."""
        result = serialise_mode_registry()
        registry_order = [spec.constant for spec in MODE_REGISTRY.values()]
        result_order = [e["constant"] for e in result]
        assert result_order == registry_order

    def test_consistency_with_mode_registry(self):
        """Every MODE_REGISTRY key appears exactly once in the serialised output."""
        result = serialise_mode_registry()
        registry_constants = set(MODE_REGISTRY.keys())
        result_constants = {e["constant"] for e in result}
        assert result_constants == registry_constants
