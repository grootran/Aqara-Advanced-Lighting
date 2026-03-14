"""Tests for audio-reactive v2 model fields and mode handlers."""
import pytest
from custom_components.aqara_advanced_lighting.models import DynamicScene, DynamicSceneColor
from custom_components.aqara_advanced_lighting.const import (
    AUDIO_COLOR_ADVANCE_ON_ONSET,
    AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE,
    AUDIO_DETECTION_MODE_SPECTRAL_FLUX,
    AUDIO_DETECTION_MODE_BASS_ENERGY,
    DEFAULT_AUDIO_PREDICTION_AGGRESSIVENESS,
    DEFAULT_AUDIO_DETECTION_MODE,
)


def _make_scene(**overrides) -> DynamicScene:
    """Create a DynamicScene with sensible defaults for testing."""
    defaults = {
        "colors": [DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)],
        "transition_time": 2.0,
        "hold_time": 5.0,
        "distribution_mode": "synchronized",
        "offset_delay": 0.0,
        "random_order": False,
        "loop_mode": "continuous",
    }
    defaults.update(overrides)
    return DynamicScene(**defaults)


class TestDynamicSceneAudioFields:
    """Test new audio-reactive v2 fields on DynamicScene."""

    def test_default_detection_mode(self):
        scene = _make_scene()
        assert scene.audio_detection_mode == DEFAULT_AUDIO_DETECTION_MODE

    def test_default_frequency_zone(self):
        scene = _make_scene()
        assert scene.audio_frequency_zone is False

    def test_default_silence_degradation(self):
        scene = _make_scene()
        assert scene.audio_silence_degradation is True

    def test_default_prediction_aggressiveness(self):
        scene = _make_scene()
        assert scene.audio_prediction_aggressiveness == DEFAULT_AUDIO_PREDICTION_AGGRESSIVENESS

    def test_on_onset_mode(self):
        scene = _make_scene(audio_color_advance=AUDIO_COLOR_ADVANCE_ON_ONSET)
        assert scene.audio_color_advance == "on_onset"

    def test_beat_predictive_mode(self):
        scene = _make_scene(audio_color_advance=AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE)
        assert scene.audio_color_advance == "beat_predictive"

    def test_detection_mode_bass_energy(self):
        scene = _make_scene(audio_detection_mode=AUDIO_DETECTION_MODE_BASS_ENERGY)
        assert scene.audio_detection_mode == "bass_energy"

    def test_invalid_detection_mode_clamped(self):
        scene = _make_scene(audio_detection_mode="invalid_mode")
        assert scene.audio_detection_mode == DEFAULT_AUDIO_DETECTION_MODE

    def test_prediction_aggressiveness_clamped_high(self):
        scene = _make_scene(audio_prediction_aggressiveness=200)
        assert scene.audio_prediction_aggressiveness == 100

    def test_prediction_aggressiveness_clamped_low(self):
        scene = _make_scene(audio_prediction_aggressiveness=0)
        assert scene.audio_prediction_aggressiveness == 1

    def test_latency_compensation_clamped(self):
        scene = _make_scene(audio_latency_compensation_ms=1000)
        assert scene.audio_latency_compensation_ms == 500

    def test_latency_compensation_clamped_low(self):
        scene = _make_scene(audio_latency_compensation_ms=-50)
        assert scene.audio_latency_compensation_ms == 0
