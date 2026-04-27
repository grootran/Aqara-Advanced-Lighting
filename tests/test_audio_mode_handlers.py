"""Tests for audio-reactive v2 model fields and mode handlers."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
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

    def test_default_silence_behavior(self):
        scene = _make_scene()
        assert scene.audio_silence_behavior == "slow_cycle"

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


def _mock_scene_state(brightness_curve="linear", brightness_min=30, brightness_max=100, **extra):
    """Create a mock scene_state with brightness curve config."""
    scene_state = MagicMock()
    scene_state.scene.audio_brightness_curve = brightness_curve
    scene_state.scene.audio_brightness_min = brightness_min
    scene_state.scene.audio_brightness_max = brightness_max
    for k, v in extra.items():
        setattr(scene_state.scene, k, v)
    return scene_state


class TestOnsetHandler:
    def test_handle_onset_advances_colors(self):
        manager = MagicMock()
        handler = OnsetHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        attrs = {"strength": 0.8, "dominant_band": "bass", "type": "beat"}
        handler.handle_onset(scene_state, attrs)
        manager._advance_colors.assert_called_once_with(scene_state)

    def test_handle_energy_with_brightness_curve(self):
        manager = MagicMock()
        handler = OnsetHandler(manager)
        scene_state = _mock_scene_state(brightness_curve="linear", brightness_min=30, brightness_max=100)
        handler.handle_energy(scene_state, 0.6)
        # linear curve: 0.6 maps to 30 + 0.6*(100-30) = 72% → 0.72
        assert abs(scene_state.brightness_modifier - 0.72) < 0.01

    def test_handle_energy_brightness_floor(self):
        manager = MagicMock()
        handler = OnsetHandler(manager)
        scene_state = _mock_scene_state(brightness_curve="linear", brightness_min=30, brightness_max=100)
        handler.handle_energy(scene_state, 0.0)
        # 0.0 → 30% → 0.3
        assert abs(scene_state.brightness_modifier - 0.3) < 0.01

    def test_handle_energy_no_brightness_curve(self):
        manager = MagicMock()
        handler = OnsetHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        scene_state.brightness_modifier = 1.0
        handler.handle_energy(scene_state, 0.8)
        # brightness_modifier should remain unchanged when curve is None
        assert scene_state.brightness_modifier == 1.0


class TestContinuousHandler:
    def test_handle_energy_maps_palette(self):
        manager = MagicMock()
        handler = ContinuousHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        scene_state.scene.colors = [MagicMock()] * 5
        scene_state.light_color_indices = [0, 0, 0]
        handler.handle_energy(scene_state, 0.5)
        assert all(i == 2 for i in scene_state.light_color_indices)

    def test_handle_energy_with_brightness_curve(self):
        manager = MagicMock()
        handler = ContinuousHandler(manager)
        scene_state = _mock_scene_state(brightness_curve="linear", brightness_min=30, brightness_max=100)
        scene_state.scene.colors = [MagicMock()] * 5
        scene_state.light_color_indices = [0]
        handler.handle_energy(scene_state, 0.8)
        # linear: 30 + 0.8*70 = 86% → 0.86
        assert abs(scene_state.brightness_modifier - 0.86) < 0.01

    def test_handle_energy_empty_colors(self):
        manager = MagicMock()
        handler = ContinuousHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        scene_state.scene.colors = []
        handler.handle_energy(scene_state, 0.5)
        # Should not crash


class TestIntensityBreathingHandler:
    def test_envelope_tracks_energy(self):
        manager = MagicMock()
        handler = IntensityBreathingHandler(manager)
        scene_state = _mock_scene_state(brightness_curve="linear", brightness_min=30, brightness_max=100)
        # Feed high energy repeatedly
        for _ in range(50):
            handler.handle_energy(scene_state, 1.0)
        # Envelope should approach 1.0 → brightness modifier near 1.0
        assert scene_state.brightness_modifier > 0.8

    def test_envelope_decays(self):
        manager = MagicMock()
        handler = IntensityBreathingHandler(manager)
        scene_state = _mock_scene_state(brightness_curve="linear", brightness_min=30, brightness_max=100)
        # Pump up
        for _ in range(50):
            handler.handle_energy(scene_state, 1.0)
        # Then silence
        for _ in range(50):
            handler.handle_energy(scene_state, 0.0)
        assert scene_state.brightness_modifier < 0.5

    def test_breathing_without_curve_uses_legacy_bounds(self):
        """Breathing mode should still modulate even when curve is None."""
        manager = MagicMock()
        handler = IntensityBreathingHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        for _ in range(50):
            handler.handle_energy(scene_state, 1.0)
        # Should use legacy max(0.3, min(1.0, envelope))
        assert scene_state.brightness_modifier > 0.8


class TestOnsetFlashHandler:
    def test_onset_sets_flash(self):
        manager = MagicMock()
        handler = OnsetFlashHandler(manager)
        scene_state = _mock_scene_state(brightness_curve="linear", brightness_min=30, brightness_max=100)
        handler.handle_onset(scene_state, {"strength": 0.9})
        assert scene_state.brightness_modifier == 1.0

    def test_flash_decays_on_energy(self):
        manager = MagicMock()
        handler = OnsetFlashHandler(manager)
        scene_state = _mock_scene_state(brightness_curve="linear", brightness_min=30, brightness_max=100)
        handler.handle_onset(scene_state, {"strength": 0.9})
        # Several energy updates should decay the flash
        for _ in range(20):
            handler.handle_energy(scene_state, 0.3)
        # Flash should have decayed significantly
        assert scene_state.brightness_modifier < 1.0

    def test_flash_without_curve_uses_legacy_bounds(self):
        """Flash mode should still modulate even when curve is None."""
        manager = MagicMock()
        handler = OnsetFlashHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        handler.handle_onset(scene_state, {"strength": 0.9})
        for _ in range(5):
            handler.handle_energy(scene_state, 0.5)
        assert scene_state.brightness_modifier < 1.0


class TestBeatPredictiveHandler:
    def test_initial_state_reactive(self):
        handler = BeatPredictiveHandler(MagicMock())
        assert handler._state == BeatPredictiveHandler.REACTIVE

    def test_configure_sets_threshold(self):
        # Deprecated public shim path — still works (emits DeprecationWarning).
        # Threshold is a 0.0–1.0 fraction (matches the device's beat_confidence
        # sensor scale; was integer 30–90 percent which never compared correctly
        # against the actual 0..1 sensor value).
        import warnings
        handler = BeatPredictiveHandler(MagicMock())
        scene = MagicMock()
        scene.audio_prediction_aggressiveness = 100
        scene.audio_latency_compensation_ms = 200
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)
            handler.configure(scene)
        assert abs(handler._confidence_threshold - 0.30) < 1e-6  # 0.9 - (100/100)*0.6
        assert handler._latency_ms == 200

    def test_scene_config_applied_on_first_onset(self):
        # Lazy-init path — scene-derived config populated on first handle_* call.
        handler = BeatPredictiveHandler(MagicMock())
        scene_state = _mock_scene_state(brightness_curve=None)
        scene_state.scene.audio_prediction_aggressiveness = 75
        scene_state.scene.audio_latency_compensation_ms = 200
        handler.handle_onset(scene_state, {"strength": 0.5})
        assert abs(handler._confidence_threshold - 0.45) < 1e-6  # 0.9 - (75/100)*0.6
        assert handler._latency_ms == 200
        assert handler._scene_configured is scene_state.scene

    def test_scene_config_idempotent_on_same_scene(self):
        # Repeated calls with the same scene don't recompute.
        handler = BeatPredictiveHandler(MagicMock())
        scene_state = _mock_scene_state(brightness_curve=None)
        scene_state.scene.audio_prediction_aggressiveness = 50
        scene_state.scene.audio_latency_compensation_ms = 150
        handler.handle_onset(scene_state, {"strength": 0.5})
        scene_ref = handler._scene_configured
        # Second call should not change the cached scene ref even if the
        # MagicMock's attribute access creates a new value.
        handler.handle_onset(scene_state, {"strength": 0.5})
        assert handler._scene_configured is scene_ref

    def test_state_transitions_to_tracking(self):
        # Confidence and threshold are 0.0–1.0 fractions matching the device's
        # beat_confidence sensor. 0.7 ≥ 0.6 → enter TRACKING.
        handler = BeatPredictiveHandler(MagicMock())
        handler._confidence_threshold = 0.6
        handler.update_bpm(120.0, 0.7)
        assert handler._state == BeatPredictiveHandler.TRACKING

    def test_tracking_to_reactive_on_low_confidence(self):
        handler = BeatPredictiveHandler(MagicMock())
        handler._confidence_threshold = 0.6
        handler.update_bpm(120.0, 0.7)   # → TRACKING
        # below threshold - hysteresis (0.5) → REACTIVE
        handler.update_bpm(120.0, 0.45)
        assert handler._state == BeatPredictiveHandler.REACTIVE

    def test_tracking_to_predictive_after_matches(self):
        handler = BeatPredictiveHandler(MagicMock())
        handler._confidence_threshold = 0.6
        handler.update_bpm(120.0, 0.7)  # → TRACKING
        # handle_onset triggers _ensure_scene_configured, which derives
        # _confidence_threshold from scene.audio_prediction_aggressiveness.
        # Pin those explicitly so the threshold stays at 0.6 (matches the
        # 50% aggressiveness midpoint: 0.9 - 0.5*0.6 = 0.6).
        scene_state = _mock_scene_state(
            brightness_curve=None,
            audio_prediction_aggressiveness=50,
            audio_latency_compensation_ms=150,
        )
        # Simulate 4 onset matches while tracking
        for _ in range(4):
            handler.handle_onset(scene_state, {"strength": 0.8})
        handler.update_bpm(120.0, 0.75)  # trigger state update
        assert handler._state == BeatPredictiveHandler.PREDICTIVE

    def test_reactive_mode_advances_colors(self):
        manager = MagicMock()
        handler = BeatPredictiveHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        handler.handle_onset(scene_state, {"strength": 0.8})
        manager._advance_colors.assert_called_once()

    def test_predictive_mode_does_not_advance_on_onset(self):
        manager = MagicMock()
        handler = BeatPredictiveHandler(manager)
        handler._state = BeatPredictiveHandler.PREDICTIVE
        scene_state = _mock_scene_state(brightness_curve=None)
        handler.handle_onset(scene_state, {"strength": 0.8})
        manager._advance_colors.assert_not_called()

    def test_cleanup_cancels_handles(self):
        handler = BeatPredictiveHandler(MagicMock())
        mock_handle = MagicMock()
        handler._pending_handles.append(mock_handle)
        handler.cleanup()
        mock_handle.cancel.assert_called_once()
        assert len(handler._pending_handles) == 0


class TestSilenceBehavior:
    """Test silence behavior enum in enter_silence."""

    def test_silence_behavior_hold_does_not_start_cycle(self):
        manager = MagicMock()
        handler = OnsetHandler(manager)
        scene_state = _mock_scene_state(audio_silence_behavior="hold")
        import asyncio
        loop = asyncio.new_event_loop()
        try:
            loop.run_until_complete(handler.enter_silence(scene_state, asyncio.Event()))
        finally:
            loop.close()
        assert handler._silence_task is None

    def test_silence_behavior_slow_cycle_starts_cycle(self):
        import asyncio
        manager = MagicMock()
        manager._advance_colors = MagicMock()

        async def _fake_apply(*args, **kwargs):
            pass

        manager._apply_colors_with_offset = _fake_apply
        handler = OnsetHandler(manager)
        scene_state = _mock_scene_state(audio_silence_behavior="slow_cycle")
        loop = asyncio.new_event_loop()
        stop = asyncio.Event()
        try:
            loop.run_until_complete(handler.enter_silence(scene_state, stop))
            # Give the task a moment to start
            assert handler._silence_task is not None
        finally:
            if handler._silence_task and not handler._silence_task.done():
                handler._silence_task.cancel()
            loop.close()

    def test_silence_behavior_decay_min_starts_decay(self):
        import asyncio
        manager = MagicMock()

        async def _fake_apply(*args, **kwargs):
            pass

        manager._apply_colors_with_offset = _fake_apply
        handler = OnsetHandler(manager)
        scene_state = _mock_scene_state(
            audio_silence_behavior="decay_min",
            brightness_min=30,
            brightness_max=100,
        )
        scene_state.brightness_modifier = 0.8
        loop = asyncio.new_event_loop()
        stop = asyncio.Event()
        try:
            loop.run_until_complete(handler.enter_silence(scene_state, stop))
            assert handler._silence_task is not None
        finally:
            if handler._silence_task and not handler._silence_task.done():
                handler._silence_task.cancel()
            loop.close()

    def test_silence_behavior_decay_mid_starts_decay(self):
        import asyncio
        manager = MagicMock()

        async def _fake_apply(*args, **kwargs):
            pass

        manager._apply_colors_with_offset = _fake_apply
        handler = OnsetHandler(manager)
        scene_state = _mock_scene_state(
            audio_silence_behavior="decay_mid",
            brightness_min=30,
            brightness_max=100,
        )
        scene_state.brightness_modifier = 0.9
        loop = asyncio.new_event_loop()
        stop = asyncio.Event()
        try:
            loop.run_until_complete(handler.enter_silence(scene_state, stop))
            assert handler._silence_task is not None
        finally:
            if handler._silence_task and not handler._silence_task.done():
                handler._silence_task.cancel()
            loop.close()

    def test_silence_decay_min_reaches_target(self):
        import asyncio
        manager = MagicMock()

        async def _fake_apply(*args, **kwargs):
            pass

        manager._apply_colors_with_offset = _fake_apply
        handler = OnsetHandler(manager)
        scene_state = _mock_scene_state(
            audio_silence_behavior="decay_min",
            brightness_min=30,
            brightness_max=100,
        )
        scene_state.brightness_modifier = 0.8
        loop = asyncio.new_event_loop()
        stop = asyncio.Event()
        try:
            with patch("asyncio.sleep", new_callable=AsyncMock):
                loop.run_until_complete(handler.enter_silence(scene_state, stop))
                loop.run_until_complete(handler._silence_task)
            # brightness_modifier should have decayed to min (30/100 = 0.30)
            assert abs(scene_state.brightness_modifier - 0.30) < 0.02
        finally:
            loop.close()

    def test_silence_decay_mid_reaches_target(self):
        import asyncio
        manager = MagicMock()

        async def _fake_apply(*args, **kwargs):
            pass

        manager._apply_colors_with_offset = _fake_apply
        handler = OnsetHandler(manager)
        scene_state = _mock_scene_state(
            audio_silence_behavior="decay_mid",
            brightness_min=30,
            brightness_max=100,
        )
        scene_state.brightness_modifier = 0.9
        loop = asyncio.new_event_loop()
        stop = asyncio.Event()
        try:
            with patch("asyncio.sleep", new_callable=AsyncMock):
                loop.run_until_complete(handler.enter_silence(scene_state, stop))
                loop.run_until_complete(handler._silence_task)
            # Target = (30+100)/2/100 = 0.65
            assert abs(scene_state.brightness_modifier - 0.65) < 0.02
        finally:
            loop.close()

    def test_silence_decay_stops_mid_decay(self):
        import asyncio
        manager = MagicMock()
        apply_count = 0

        async def _counting_apply(*args, **kwargs):
            nonlocal apply_count
            apply_count += 1
            if apply_count >= 3:
                stop.set()

        manager._apply_colors_with_offset = _counting_apply
        handler = OnsetHandler(manager)
        scene_state = _mock_scene_state(
            audio_silence_behavior="decay_min",
            brightness_min=10,
            brightness_max=100,
        )
        scene_state.brightness_modifier = 1.0
        loop = asyncio.new_event_loop()
        stop = asyncio.Event()
        try:
            with patch("asyncio.sleep", new_callable=AsyncMock):
                loop.run_until_complete(handler.enter_silence(scene_state, stop))
                loop.run_until_complete(handler._silence_task)
            # Should have stopped after 3 applies, not all 15
            assert 3 <= apply_count < 15
            # brightness_modifier should be partially decayed (not at target)
            assert scene_state.brightness_modifier > 0.10
        finally:
            loop.close()


class TestBrightnessCurve:
    """Test _apply_brightness_curve static method."""

    def test_linear_curve_maps_correctly(self):
        scene = MagicMock()
        scene.audio_brightness_curve = "linear"
        scene.audio_brightness_min = 30
        scene.audio_brightness_max = 100
        # 0.5 → 30 + 0.5*70 = 65% → 0.65
        result = AudioModeHandler._apply_brightness_curve(scene, 0.5)
        assert abs(result - 0.65) < 0.01

    def test_disabled_returns_one(self):
        scene = MagicMock()
        scene.audio_brightness_curve = None
        result = AudioModeHandler._apply_brightness_curve(scene, 0.8)
        assert result == 1.0

    def test_full_energy_maps_to_max(self):
        scene = MagicMock()
        scene.audio_brightness_curve = "linear"
        scene.audio_brightness_min = 30
        scene.audio_brightness_max = 100
        result = AudioModeHandler._apply_brightness_curve(scene, 1.0)
        assert abs(result - 1.0) < 0.01

    def test_zero_energy_maps_to_min(self):
        scene = MagicMock()
        scene.audio_brightness_curve = "linear"
        scene.audio_brightness_min = 30
        scene.audio_brightness_max = 100
        result = AudioModeHandler._apply_brightness_curve(scene, 0.0)
        assert abs(result - 0.3) < 0.01

    def test_exponential_curve(self):
        scene = MagicMock()
        scene.audio_brightness_curve = "exponential"
        scene.audio_brightness_min = 10
        scene.audio_brightness_max = 100
        # 0.5 → exponential: 0.25 → 10 + 0.25*90 = 32.5% → 0.325
        result = AudioModeHandler._apply_brightness_curve(scene, 0.5)
        assert abs(result - 0.325) < 0.01


class TestBeatPredictivePhase:
    """Tests for BeatPredictiveHandler.update_phase()."""

    def _make_scene_state(self, aggressiveness: int = 50, latency_ms: int = 0) -> MagicMock:
        """Build a scene_state whose scene carries concrete numeric config.

        Required because lazy-init reads scene.audio_prediction_aggressiveness /
        audio_latency_compensation_ms on the first handle_* / update_* call.
        Without this, MagicMock attribute access returns new MagicMocks that
        break arithmetic inside update_phase.
        """
        scene_state = MagicMock()
        scene_state.scene.audio_prediction_aggressiveness = aggressiveness
        scene_state.scene.audio_latency_compensation_ms = latency_ms
        return scene_state

    def _make_handler(self, bpm=120.0, latency_ms=0):
        from custom_components.aqara_advanced_lighting.audio_mode_handlers import (
            BeatPredictiveHandler,
        )
        manager = MagicMock()
        manager._advance_colors = MagicMock()
        handler = BeatPredictiveHandler(manager)
        handler._bpm = bpm
        # Confidence is a 0.0–1.0 fraction matching the device's
        # beat_confidence sensor (was 0–100 percent — runtime mismatch).
        handler._confidence = 0.8
        handler._latency_ms = latency_ms
        handler._confidence_threshold = 0.6
        return handler, manager

    def test_update_phase_no_op_in_reactive_state(self):
        """update_phase does nothing when not in PREDICTIVE state."""
        from custom_components.aqara_advanced_lighting.audio_mode_handlers import (
            BeatPredictiveHandler,
        )
        handler, manager = self._make_handler()
        assert handler._state == BeatPredictiveHandler.REACTIVE
        handler.update_phase(MagicMock(), 0.9)
        manager._advance_colors.assert_not_called()
        assert len(handler._pending_handles) == 0

    def test_update_phase_no_op_in_tracking_state(self):
        """update_phase does nothing when in TRACKING state."""
        from custom_components.aqara_advanced_lighting.audio_mode_handlers import (
            BeatPredictiveHandler,
        )
        handler, manager = self._make_handler()
        handler._state = BeatPredictiveHandler.TRACKING
        handler.update_phase(MagicMock(), 0.9)
        assert len(handler._pending_handles) == 0

    def test_update_phase_schedules_in_predictive_state(self):
        """update_phase schedules a color advance at correct delay in PREDICTIVE state."""
        from custom_components.aqara_advanced_lighting.audio_mode_handlers import (
            BeatPredictiveHandler,
        )
        handler, manager = self._make_handler(bpm=120.0, latency_ms=0)
        handler._state = BeatPredictiveHandler.PREDICTIVE
        scene_state = self._make_scene_state(latency_ms=0)

        with patch("asyncio.get_event_loop") as mock_loop:
            mock_handle = MagicMock()
            mock_loop.return_value.call_later = MagicMock(return_value=mock_handle)
            handler.update_phase(scene_state, 0.5)
            mock_loop.return_value.call_later.assert_called_once()
            delay = mock_loop.return_value.call_later.call_args[0][0]
            # BPM=120 → beat_interval=0.5s; phase=0.5 → time_to_beat=0.25s; latency=0
            assert abs(delay - 0.25) < 0.01
            assert len(handler._pending_handles) == 1

    def test_update_phase_applies_latency_compensation(self):
        """Latency compensation reduces the scheduled delay."""
        from custom_components.aqara_advanced_lighting.audio_mode_handlers import (
            BeatPredictiveHandler,
        )
        handler, manager = self._make_handler(bpm=120.0, latency_ms=100)
        handler._state = BeatPredictiveHandler.PREDICTIVE

        with patch("asyncio.get_event_loop") as mock_loop:
            mock_loop.return_value.call_later = MagicMock(return_value=MagicMock())
            handler.update_phase(self._make_scene_state(latency_ms=100), 0.5)
            delay = mock_loop.return_value.call_later.call_args[0][0]
            # time_to_beat=0.25s - latency=0.1s = 0.15s
            assert abs(delay - 0.15) < 0.01

    def test_update_phase_skips_when_advance_too_close(self):
        """No scheduling when advance_in < 20ms (already past or too close)."""
        from custom_components.aqara_advanced_lighting.audio_mode_handlers import (
            BeatPredictiveHandler,
        )
        handler, manager = self._make_handler(bpm=120.0, latency_ms=240)
        handler._state = BeatPredictiveHandler.PREDICTIVE

        with patch("asyncio.get_event_loop") as mock_loop:
            mock_loop.return_value.call_later = MagicMock(return_value=MagicMock())
            # phase=0.5 → time_to_beat=0.25s - latency=0.24s = 0.01s < 0.02 → skip
            handler.update_phase(self._make_scene_state(latency_ms=240), 0.5)
            mock_loop.return_value.call_later.assert_not_called()

    def test_update_phase_cancels_previous_handle(self):
        """A new phase update cancels the previous pending handle before scheduling."""
        from custom_components.aqara_advanced_lighting.audio_mode_handlers import (
            BeatPredictiveHandler,
        )
        handler, manager = self._make_handler(bpm=120.0, latency_ms=0)
        handler._state = BeatPredictiveHandler.PREDICTIVE
        old_handle = MagicMock()
        handler._pending_handles.append(old_handle)

        with patch("asyncio.get_event_loop") as mock_loop:
            mock_loop.return_value.call_later = MagicMock(return_value=MagicMock())
            handler.update_phase(self._make_scene_state(latency_ms=0), 0.5)
            old_handle.cancel.assert_called_once()
            assert old_handle not in handler._pending_handles
            assert len(handler._pending_handles) == 1  # new handle registered

    def test_update_phase_no_op_when_bpm_zero(self):
        """update_phase does nothing if BPM is 0 (no tempo established)."""
        from custom_components.aqara_advanced_lighting.audio_mode_handlers import (
            BeatPredictiveHandler,
        )
        handler, manager = self._make_handler(bpm=0.0)
        handler._state = BeatPredictiveHandler.PREDICTIVE
        with patch("asyncio.get_event_loop") as mock_loop:
            mock_loop.return_value.call_later = MagicMock(return_value=MagicMock())
            handler.update_phase(MagicMock(), 0.5)
            mock_loop.return_value.call_later.assert_not_called()


# -----------------------------------------------------------------------------
# Pro-tier audio mode handlers (Chunk 7): BassKickHandler + FreqToHueHandler
# -----------------------------------------------------------------------------
from custom_components.aqara_advanced_lighting.audio_mode_handlers import (
    BassKickHandler,
    FreqToHueHandler,
    MODE_REGISTRY,
    ModeSpec,
    create_handler,
)
from custom_components.aqara_advanced_lighting.const import (
    AUDIO_COLOR_ADVANCE_BASS_KICK,
    AUDIO_COLOR_ADVANCE_FREQ_TO_HUE,
)


class TestBassKickHandler:
    """BassKickHandler fires pulses when the driver band dominates competitors."""

    def test_bass_kick_pulses_on_dominant_sub_bass_onset(self):
        """Pro-tier onset with sub_bass >> other bands -> brightness pulses to 1.0."""
        manager = MagicMock()
        handler = BassKickHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        attrs = {
            "sub_bass_energy": 0.8,
            "bass_energy": 0.3,
            "low_mid_energy": 0.2,
            "mid_energy": 0.2,
            "upper_mid_energy": 0.2,
            "high_energy": 0.2,
            "air_energy": 0.1,
        }
        handler.handle_onset(scene_state, attrs)
        assert scene_state.brightness_modifier == 1.0
        manager._advance_colors.assert_called_once_with(scene_state)
        assert handler._pulse_start_ms is not None

    def test_bass_kick_suppressed_when_not_dominant(self):
        """Pro-tier onset but sub_bass not dominant -> no pulse."""
        manager = MagicMock()
        handler = BassKickHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        scene_state.brightness_modifier = 0.5  # arbitrary prior value
        attrs = {
            "sub_bass_energy": 0.3,
            "bass_energy": 0.3,
            "mid_energy": 0.3,
            "high_energy": 0.3,
        }
        handler.handle_onset(scene_state, attrs)
        # brightness_modifier must not have been raised to 1.0
        assert scene_state.brightness_modifier != 1.0
        manager._advance_colors.assert_not_called()
        assert handler._pulse_start_ms is None

    def test_bass_kick_basic_tier_fallback(self):
        """Without sub_bass_energy, falls back to bass_energy vs mid/high."""
        manager = MagicMock()
        handler = BassKickHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        attrs = {"bass_energy": 0.8, "mid_energy": 0.2, "high_energy": 0.2}
        handler.handle_onset(scene_state, attrs)
        assert scene_state.brightness_modifier == 1.0
        manager._advance_colors.assert_called_once_with(scene_state)

    def test_bass_kick_basic_tier_suppressed_when_not_dominant(self):
        """Basic-tier onset where bass is not dominant -> no pulse."""
        manager = MagicMock()
        handler = BassKickHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        scene_state.brightness_modifier = 0.5
        attrs = {"bass_energy": 0.3, "mid_energy": 0.3, "high_energy": 0.3}
        handler.handle_onset(scene_state, attrs)
        assert scene_state.brightness_modifier == 0.5
        manager._advance_colors.assert_not_called()

    def test_bass_kick_silence_suppressed(self):
        """All bands near zero -> no pulse (avoid firing on silence)."""
        manager = MagicMock()
        handler = BassKickHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        attrs = {
            "sub_bass_energy": 0.005,
            "bass_energy": 0.001,
            "mid_energy": 0.001,
            "high_energy": 0.001,
        }
        handler.handle_onset(scene_state, attrs)
        manager._advance_colors.assert_not_called()

    def test_bass_kick_decay_reaches_floor_after_pulse(self):
        """handle_energy after pulse_ms should decay to floor_brightness."""
        manager = MagicMock()
        handler = BassKickHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        # Force a pulse
        attrs = {"bass_energy": 0.8, "mid_energy": 0.2, "high_energy": 0.2}
        handler.handle_onset(scene_state, attrs)
        assert scene_state.brightness_modifier == 1.0
        # Move pulse_start back so elapsed > pulse_ms
        handler._pulse_start_ms -= 10_000  # 10 seconds ago
        handler.handle_energy(scene_state, 0.1)
        assert scene_state.brightness_modifier == handler._defaults["floor_brightness"]
        assert handler._pulse_start_ms is None

    def test_bass_kick_no_pulse_holds_floor(self):
        """With no pulse active, handle_energy keeps brightness at floor."""
        manager = MagicMock()
        handler = BassKickHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        handler.handle_energy(scene_state, 0.5)
        assert scene_state.brightness_modifier == handler._defaults["floor_brightness"]


class TestFreqToHueHandler:
    """FreqToHueHandler maps spectral centroid to hue with silence gating."""

    # Centroid input is the device-published nyquist fraction (0-1), not Hz.
    # Defaults clip to [centroid_min=0.005, centroid_max=0.4] for tier-agnostic
    # behavior across pro (44.1 kHz) and basic (22.05 kHz) sample rates.
    def test_freq_to_hue_low_centroid_maps_to_hue_start(self):
        manager = MagicMock()
        handler = FreqToHueHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        # Seed amplitude above the silence gate
        handler.handle_energy(scene_state, 0.5)
        handler.handle_centroid(scene_state, 0.005)
        # centroid_min maps to hue_start (0.0); EMA from 0.0 initial stays ~0
        assert abs(handler._last_hue - 0.0) < 1.0

    def test_freq_to_hue_high_centroid_maps_to_hue_end(self):
        manager = MagicMock()
        handler = FreqToHueHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        handler.handle_energy(scene_state, 0.5)
        for _ in range(60):
            handler.handle_centroid(scene_state, 0.4)
        # centroid_max maps to hue_end (240.0); EMA should converge
        assert abs(handler._last_hue - 240.0) < 5.0

    def test_freq_to_hue_silence_holds_hue(self):
        """Amplitude below the gate should freeze hue."""
        manager = MagicMock()
        handler = FreqToHueHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        # Converge to high end
        handler.handle_energy(scene_state, 0.5)
        for _ in range(60):
            handler.handle_centroid(scene_state, 0.4)
        hue_before_silence = handler._last_hue
        # Drop amplitude below gate
        handler.handle_energy(scene_state, 0.001)
        # Would otherwise pull hue back toward 0, but gate should hold it
        handler.handle_centroid(scene_state, 0.005)
        assert handler._last_hue == hue_before_silence

    def test_freq_to_hue_calls_set_hue_on_manager(self):
        """handle_centroid should invoke manager._set_hue(scene_state, hue)."""
        manager = MagicMock()
        handler = FreqToHueHandler(manager)
        scene_state = _mock_scene_state(brightness_curve=None)
        handler.handle_energy(scene_state, 0.5)
        handler.handle_centroid(scene_state, 0.05)
        manager._set_hue.assert_called()
        call_args = manager._set_hue.call_args
        assert call_args[0][0] is scene_state
        assert 0.0 <= call_args[0][1] <= 240.0

    def test_freq_to_hue_energy_applies_brightness_curve(self):
        """handle_energy with a curve should set brightness_modifier."""
        manager = MagicMock()
        handler = FreqToHueHandler(manager)
        scene_state = _mock_scene_state(
            brightness_curve="linear", brightness_min=30, brightness_max=100
        )
        handler.handle_energy(scene_state, 0.6)
        # linear: 30 + 0.6*70 = 72 -> 0.72
        assert abs(scene_state.brightness_modifier - 0.72) < 0.01
        assert handler._last_amplitude == 0.6


class TestModeRegistry:
    """ModeSpec registry + create_handler factory."""

    def test_registry_contains_all_existing_modes(self):
        from custom_components.aqara_advanced_lighting.const import (
            AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE,
            AUDIO_COLOR_ADVANCE_CONTINUOUS,
            AUDIO_COLOR_ADVANCE_INTENSITY_BREATHING,
            AUDIO_COLOR_ADVANCE_ON_ONSET,
            AUDIO_COLOR_ADVANCE_ONSET_FLASH,
        )
        for mode in (
            AUDIO_COLOR_ADVANCE_ON_ONSET,
            AUDIO_COLOR_ADVANCE_CONTINUOUS,
            AUDIO_COLOR_ADVANCE_INTENSITY_BREATHING,
            AUDIO_COLOR_ADVANCE_ONSET_FLASH,
            AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE,
            AUDIO_COLOR_ADVANCE_BASS_KICK,
            AUDIO_COLOR_ADVANCE_FREQ_TO_HUE,
        ):
            assert mode in MODE_REGISTRY
            spec = MODE_REGISTRY[mode]
            assert isinstance(spec, ModeSpec)
            assert spec.constant == mode

    def test_bass_kick_marked_requires_pro(self):
        assert MODE_REGISTRY[AUDIO_COLOR_ADVANCE_BASS_KICK].requires_pro is True

    def test_freq_to_hue_marked_requires_pro(self):
        # freq_to_hue technically runs on basic-tier centroid (the sensor
        # publishes on both tiers), but the basic-tier centroid is computed
        # from a 512-point FFT vs pro's 2048 — too coarse to drive hue
        # cleanly. Marked requires_pro so the panel surfaces the (pro) badge.
        assert MODE_REGISTRY[AUDIO_COLOR_ADVANCE_FREQ_TO_HUE].requires_pro is True

    def test_create_handler_returns_bass_kick(self):
        manager = MagicMock()
        handler = create_handler(AUDIO_COLOR_ADVANCE_BASS_KICK, manager)
        assert isinstance(handler, BassKickHandler)

    def test_create_handler_returns_freq_to_hue(self):
        manager = MagicMock()
        handler = create_handler(AUDIO_COLOR_ADVANCE_FREQ_TO_HUE, manager)
        assert isinstance(handler, FreqToHueHandler)

    def test_create_handler_falls_back_to_onset_on_unknown_mode(self):
        # Unknown mode falls back to OnsetHandler (lenient default) and logs
        # a warning — preserves behaviour of the prior match/case dispatcher
        # for stale or typo'd scene configs.
        handler = create_handler("no_such_mode", MagicMock())
        assert isinstance(handler, OnsetHandler)

    def test_mode_registry_covers_all_audio_color_advance_constants(self):
        """Every AUDIO_COLOR_ADVANCE_* constant must have a MODE_REGISTRY entry.

        Catches drift when a new mode is added to const.py or to the scene
        manager without updating the registry (which the frontend reads for
        the requires_pro badge).
        """
        from custom_components.aqara_advanced_lighting import const
        mode_constants = {
            value for name, value in vars(const).items()
            if name.startswith("AUDIO_COLOR_ADVANCE_") and isinstance(value, str)
        }
        missing = mode_constants - set(MODE_REGISTRY.keys())
        assert not missing, f"Modes missing from MODE_REGISTRY: {missing}"

    # -----------------------------------------------------------------------
    # `hidden` flag — descope mechanism for in-progress pro features.
    # See docs/plans/2026-04-27-descope-pro-dsp-features-for-v1.3.0.md.
    # -----------------------------------------------------------------------

    def test_bass_kick_hidden_in_v1_3_0(self):
        # bass_kick is hidden from user-facing dropdowns in v1.3.0 while the
        # pro-tier DSP is stabilised. Handler still dispatches for any
        # existing scene config that references it.
        assert MODE_REGISTRY[AUDIO_COLOR_ADVANCE_BASS_KICK].hidden is True

    def test_freq_to_hue_hidden_in_v1_3_0(self):
        assert MODE_REGISTRY[AUDIO_COLOR_ADVANCE_FREQ_TO_HUE].hidden is True

    def test_beat_predictive_not_hidden(self):
        # beat_predictive shipped in v1.2.0; hiding it in v1.3.0 would be a
        # backwards-compat regression. Stays visible.
        from custom_components.aqara_advanced_lighting.const import (
            AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE,
        )
        assert MODE_REGISTRY[AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE].hidden is False

    def test_default_modes_not_hidden(self):
        # The four basic-tier modes that have always shipped should never
        # be marked hidden.
        from custom_components.aqara_advanced_lighting.const import (
            AUDIO_COLOR_ADVANCE_CONTINUOUS,
            AUDIO_COLOR_ADVANCE_INTENSITY_BREATHING,
            AUDIO_COLOR_ADVANCE_ON_ONSET,
            AUDIO_COLOR_ADVANCE_ONSET_FLASH,
        )
        for mode in (
            AUDIO_COLOR_ADVANCE_ON_ONSET,
            AUDIO_COLOR_ADVANCE_CONTINUOUS,
            AUDIO_COLOR_ADVANCE_INTENSITY_BREATHING,
            AUDIO_COLOR_ADVANCE_ONSET_FLASH,
        ):
            assert MODE_REGISTRY[mode].hidden is False, (
                f"{mode} must stay visible — never had a hidden state"
            )

    def test_hidden_modes_still_dispatched_by_create_handler(self):
        # Backwards-compat: existing scene configs storing a hidden mode
        # value still resolve to the correct handler. The hidden flag is a
        # frontend-display concern, not a dispatcher gate.
        manager = MagicMock()
        bass_kick = create_handler(AUDIO_COLOR_ADVANCE_BASS_KICK, manager)
        assert isinstance(bass_kick, BassKickHandler)
        freq_to_hue = create_handler(AUDIO_COLOR_ADVANCE_FREQ_TO_HUE, manager)
        assert isinstance(freq_to_hue, FreqToHueHandler)

    def test_serialise_mode_registry_includes_hidden_field(self):
        # Frontend's audio-mode-registry.ts reads this field; loss of the
        # field would silently un-hide the modes in the dropdown.
        from custom_components.aqara_advanced_lighting.audio_mode_handlers import (
            serialise_mode_registry,
        )
        serialised = serialise_mode_registry()
        by_constant = {entry["constant"]: entry for entry in serialised}
        assert by_constant[AUDIO_COLOR_ADVANCE_BASS_KICK]["hidden"] is True
        assert by_constant[AUDIO_COLOR_ADVANCE_FREQ_TO_HUE]["hidden"] is True
        # Spot-check a non-hidden mode too.
        from custom_components.aqara_advanced_lighting.const import (
            AUDIO_COLOR_ADVANCE_ON_ONSET,
        )
        assert by_constant[AUDIO_COLOR_ADVANCE_ON_ONSET]["hidden"] is False
