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


from unittest.mock import MagicMock
from custom_components.aqara_advanced_lighting.audio_mode_handlers import (
    AudioModeHandler,
    OnsetHandler,
    ContinuousHandler,
    IntensityBreathingHandler,
    OnsetFlashHandler,
    BeatPredictiveHandler,
)


class TestOnsetHandler:
    def test_handle_onset_advances_colors(self):
        manager = MagicMock()
        handler = OnsetHandler(manager)
        scene_state = MagicMock()
        scene_state.scene.audio_brightness_response = False
        attrs = {"strength": 0.8, "dominant_band": "bass", "type": "beat"}
        handler.handle_onset(scene_state, attrs)
        manager._advance_colors.assert_called_once_with(scene_state)

    def test_handle_energy_with_brightness_response(self):
        manager = MagicMock()
        handler = OnsetHandler(manager)
        scene_state = MagicMock()
        scene_state.scene.audio_brightness_response = True
        handler.handle_energy(scene_state, 0.6)
        assert scene_state.brightness_modifier == 0.6

    def test_handle_energy_brightness_floor(self):
        manager = MagicMock()
        handler = OnsetHandler(manager)
        scene_state = MagicMock()
        scene_state.scene.audio_brightness_response = True
        handler.handle_energy(scene_state, 0.1)
        assert scene_state.brightness_modifier == 0.3

    def test_handle_energy_no_brightness_response(self):
        manager = MagicMock()
        handler = OnsetHandler(manager)
        scene_state = MagicMock()
        scene_state.scene.audio_brightness_response = False
        scene_state.brightness_modifier = 1.0
        handler.handle_energy(scene_state, 0.8)
        # brightness_modifier should remain unchanged when response is disabled
        assert scene_state.brightness_modifier == 1.0


class TestContinuousHandler:
    def test_handle_energy_maps_palette(self):
        manager = MagicMock()
        handler = ContinuousHandler(manager)
        scene_state = MagicMock()
        scene_state.scene.colors = [MagicMock()] * 5
        scene_state.scene.audio_brightness_response = False
        scene_state.light_color_indices = [0, 0, 0]
        handler.handle_energy(scene_state, 0.5)
        assert all(i == 2 for i in scene_state.light_color_indices)

    def test_handle_energy_with_brightness(self):
        manager = MagicMock()
        handler = ContinuousHandler(manager)
        scene_state = MagicMock()
        scene_state.scene.colors = [MagicMock()] * 5
        scene_state.scene.audio_brightness_response = True
        scene_state.light_color_indices = [0]
        handler.handle_energy(scene_state, 0.8)
        assert scene_state.brightness_modifier == 0.8

    def test_handle_energy_empty_colors(self):
        manager = MagicMock()
        handler = ContinuousHandler(manager)
        scene_state = MagicMock()
        scene_state.scene.colors = []
        handler.handle_energy(scene_state, 0.5)
        # Should not crash


class TestIntensityBreathingHandler:
    def test_envelope_tracks_energy(self):
        manager = MagicMock()
        handler = IntensityBreathingHandler(manager)
        scene_state = MagicMock()
        # Feed high energy repeatedly
        for _ in range(50):
            handler.handle_energy(scene_state, 1.0)
        # Envelope should approach 1.0
        assert scene_state.brightness_modifier > 0.8

    def test_envelope_decays(self):
        manager = MagicMock()
        handler = IntensityBreathingHandler(manager)
        scene_state = MagicMock()
        # Pump up
        for _ in range(50):
            handler.handle_energy(scene_state, 1.0)
        # Then silence
        for _ in range(50):
            handler.handle_energy(scene_state, 0.0)
        assert scene_state.brightness_modifier < 0.5


class TestOnsetFlashHandler:
    def test_onset_sets_flash(self):
        manager = MagicMock()
        handler = OnsetFlashHandler(manager)
        scene_state = MagicMock()
        handler.handle_onset(scene_state, {"strength": 0.9})
        assert scene_state.brightness_modifier == 1.0

    def test_flash_decays_on_energy(self):
        manager = MagicMock()
        handler = OnsetFlashHandler(manager)
        scene_state = MagicMock()
        handler.handle_onset(scene_state, {"strength": 0.9})
        # Several energy updates should decay the flash
        for _ in range(20):
            handler.handle_energy(scene_state, 0.3)
        # Flash should have decayed significantly
        assert scene_state.brightness_modifier < 1.0


class TestBeatPredictiveHandler:
    def test_initial_state_reactive(self):
        handler = BeatPredictiveHandler(MagicMock())
        assert handler._state == BeatPredictiveHandler.REACTIVE

    def test_configure_sets_threshold(self):
        handler = BeatPredictiveHandler(MagicMock())
        scene = MagicMock()
        scene.audio_prediction_aggressiveness = 100
        scene.audio_latency_compensation_ms = 200
        handler.configure(scene)
        assert handler._confidence_threshold == 30  # 90 - (100/100)*60
        assert handler._latency_ms == 200

    def test_state_transitions_to_tracking(self):
        handler = BeatPredictiveHandler(MagicMock())
        handler._confidence_threshold = 60
        handler.update_bpm(120.0, 70)  # confidence above threshold
        assert handler._state == BeatPredictiveHandler.TRACKING

    def test_tracking_to_reactive_on_low_confidence(self):
        handler = BeatPredictiveHandler(MagicMock())
        handler._confidence_threshold = 60
        handler.update_bpm(120.0, 70)  # → TRACKING
        handler.update_bpm(120.0, 45)  # below threshold - 10 (50) → REACTIVE
        assert handler._state == BeatPredictiveHandler.REACTIVE

    def test_tracking_to_predictive_after_matches(self):
        handler = BeatPredictiveHandler(MagicMock())
        handler._confidence_threshold = 60
        handler.update_bpm(120.0, 70)  # → TRACKING
        scene_state = MagicMock()
        scene_state.scene.audio_brightness_response = False
        # Simulate 4 onset matches while tracking
        for _ in range(4):
            handler.handle_onset(scene_state, {"strength": 0.8})
        handler.update_bpm(120.0, 75)  # trigger state update
        assert handler._state == BeatPredictiveHandler.PREDICTIVE

    def test_reactive_mode_advances_colors(self):
        manager = MagicMock()
        handler = BeatPredictiveHandler(manager)
        scene_state = MagicMock()
        scene_state.scene.audio_brightness_response = False
        handler.handle_onset(scene_state, {"strength": 0.8})
        manager._advance_colors.assert_called_once()

    def test_predictive_mode_does_not_advance_on_onset(self):
        manager = MagicMock()
        handler = BeatPredictiveHandler(manager)
        handler._state = BeatPredictiveHandler.PREDICTIVE
        scene_state = MagicMock()
        scene_state.scene.audio_brightness_response = False
        handler.handle_onset(scene_state, {"strength": 0.8})
        manager._advance_colors.assert_not_called()

    def test_cleanup_cancels_handles(self):
        handler = BeatPredictiveHandler(MagicMock())
        mock_handle = MagicMock()
        handler._pending_handles.append(mock_handle)
        handler.cleanup()
        mock_handle.cancel.assert_called_once()
        assert len(handler._pending_handles) == 0
