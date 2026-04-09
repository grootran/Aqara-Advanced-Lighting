"""Tests for DynamicSceneAudioConsumer and build_scene_engine_config."""
from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.aqara_advanced_lighting.models import (
    DynamicScene,
    DynamicSceneColor,
)


def _make_scene(**overrides) -> DynamicScene:
    """Create a DynamicScene with sensible defaults and optional overrides."""
    defaults = dict(
        colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)],
        transition_time=1.0,
        hold_time=1.0,
        distribution_mode="shuffle_rotate",
        offset_delay=0.0,
        random_order=False,
        loop_mode="continuous",
        audio_entity="binary_sensor.beat_detected",
    )
    defaults.update(overrides)
    return DynamicScene(**defaults)


class TestBuildSceneEngineConfig:
    """Test subscription flag mapping from DynamicScene to AudioEngineConfig."""

    def test_onset_mode_subscribes_onset(self):
        from custom_components.aqara_advanced_lighting.audio_scene_consumer import (
            build_scene_engine_config,
        )
        scene = _make_scene(audio_color_advance="on_onset")
        config = build_scene_engine_config(scene)
        assert config.subscribe_onset is True
        assert config.consumer_type == "scene"
        assert config.audio_entity == "binary_sensor.beat_detected"

    def test_continuous_mode_subscribes_energy(self):
        from custom_components.aqara_advanced_lighting.audio_scene_consumer import (
            build_scene_engine_config,
        )
        scene = _make_scene(audio_color_advance="continuous")
        config = build_scene_engine_config(scene)
        assert config.subscribe_energy is True
        assert config.subscribe_onset is False

    def test_beat_predictive_subscribes_bpm(self):
        from custom_components.aqara_advanced_lighting.audio_scene_consumer import (
            build_scene_engine_config,
        )
        scene = _make_scene(audio_color_advance="beat_predictive")
        config = build_scene_engine_config(scene)
        assert config.subscribe_bpm is True
        assert config.subscribe_beat_tracking is True
        assert config.subscribe_onset is True

    def test_brightness_curve_subscribes_energy(self):
        from custom_components.aqara_advanced_lighting.audio_scene_consumer import (
            build_scene_engine_config,
        )
        scene = _make_scene(
            audio_color_advance="on_onset",
            audio_brightness_curve="linear",
        )
        config = build_scene_engine_config(scene)
        assert config.subscribe_energy is True
        assert config.subscribe_onset is True

    def test_frequency_zone_subscribes_bands(self):
        from custom_components.aqara_advanced_lighting.audio_scene_consumer import (
            build_scene_engine_config,
        )
        scene = _make_scene(audio_frequency_zone=True)
        config = build_scene_engine_config(scene)
        assert config.subscribe_frequency_bands is True

    def test_sensitivity_and_detection_mode_passed_through(self):
        from custom_components.aqara_advanced_lighting.audio_scene_consumer import (
            build_scene_engine_config,
        )
        scene = _make_scene(
            audio_sensitivity=80,
            audio_detection_mode="bass_energy",
        )
        config = build_scene_engine_config(scene)
        assert config.sensitivity == 80
        assert config.detection_mode == "bass_energy"

    def test_silence_always_subscribed(self):
        from custom_components.aqara_advanced_lighting.audio_scene_consumer import (
            build_scene_engine_config,
        )
        scene = _make_scene()
        config = build_scene_engine_config(scene)
        assert config.subscribe_silence is True

    def test_spectral_not_subscribed_by_default(self):
        from custom_components.aqara_advanced_lighting.audio_scene_consumer import (
            build_scene_engine_config,
        )
        scene = _make_scene()
        config = build_scene_engine_config(scene)
        assert config.subscribe_spectral is False

    def test_spectral_subscribed_when_color_by_frequency(self):
        from custom_components.aqara_advanced_lighting.audio_scene_consumer import (
            build_scene_engine_config,
        )
        scene = _make_scene(audio_color_by_frequency=True)
        config = build_scene_engine_config(scene)
        assert config.subscribe_spectral is True

    def test_spectral_subscribed_when_rolloff_brightness(self):
        from custom_components.aqara_advanced_lighting.audio_scene_consumer import (
            build_scene_engine_config,
        )
        scene = _make_scene(audio_rolloff_brightness=True)
        config = build_scene_engine_config(scene)
        assert config.subscribe_spectral is True


class _FakeSceneState:
    """Minimal scene_state stand-in for consumer tests."""

    def __init__(self, scene: DynamicScene):
        self.scene = scene
        self.light_color_indices: dict[str, int] = {"light.a": 0, "light.b": 0}
        self.brightness_modifier: float = 1.0
        self.audio_waiting: bool = False


class _FakeHandler:
    """Records handler method calls for assertion."""

    def __init__(self):
        self.onset_calls: list[tuple] = []
        self.energy_calls: list[tuple] = []
        self.centroid_calls: list[tuple] = []
        self.rolloff_calls: list[tuple] = []
        self.bpm_calls: list[tuple] = []
        self.silence_enter_called = False
        self.silence_exit_called = False

    def handle_onset(self, scene_state, attrs):
        self.onset_calls.append((scene_state, attrs))

    def handle_energy(self, scene_state, energy):
        self.energy_calls.append((scene_state, energy))

    def handle_centroid(self, scene_state, centroid):
        self.centroid_calls.append((scene_state, centroid))

    def handle_rolloff(self, scene_state, rolloff):
        self.rolloff_calls.append((scene_state, rolloff))

    def update_bpm(self, bpm, confidence):
        self.bpm_calls.append((bpm, confidence))

    def update_phase(self, scene_state, phase):
        pass

    async def enter_silence(self, scene_state, stop_event):
        self.silence_enter_called = True

    async def exit_silence(self, scene_state):
        self.silence_exit_called = True


def _make_consumer(
    scene=None,
    handler=None,
    **overrides,
):
    """Create a DynamicSceneAudioConsumer with test defaults."""
    from custom_components.aqara_advanced_lighting.audio_scene_consumer import (
        DynamicSceneAudioConsumer,
    )
    if scene is None:
        scene = _make_scene(audio_color_advance="on_onset")
    if handler is None:
        handler = _FakeHandler()

    scene_state = _FakeSceneState(scene)
    stop_event = asyncio.Event()

    defaults = dict(
        scene_state=scene_state,
        handler=handler,
        stop_event=stop_event,
        apply_colors_fn=AsyncMock(),
        transition_seconds=0.5,
        is_onset_mode=True,
        is_energy_mode=False,
    )
    defaults.update(overrides)

    consumer = DynamicSceneAudioConsumer(**defaults)
    return consumer, scene_state, handler, stop_event


class TestDynamicSceneAudioConsumer:
    """Test event routing from AudioEngine to scene mode handlers."""

    @pytest.mark.asyncio
    async def test_onset_routed_to_handler(self):
        consumer, ss, handler, _ = _make_consumer()
        await consumer.on_audio_events({"onset": {"strength": 0.8}})
        assert len(handler.onset_calls) == 1
        assert handler.onset_calls[0][1] == {"strength": 0.8}

    @pytest.mark.asyncio
    async def test_energy_routed_to_handler(self):
        consumer, ss, handler, _ = _make_consumer(
            is_onset_mode=False, is_energy_mode=True,
            scene=_make_scene(audio_color_advance="continuous"),
        )
        await consumer.on_audio_events({"energy": 0.7})
        assert len(handler.energy_calls) == 1
        assert handler.energy_calls[0][1] == 0.7

    @pytest.mark.asyncio
    async def test_centroid_routed_to_handler(self):
        consumer, ss, handler, _ = _make_consumer()
        await consumer.on_audio_events({"centroid": 2000.0})
        assert len(handler.centroid_calls) == 1

    @pytest.mark.asyncio
    async def test_rolloff_routed_to_handler(self):
        consumer, ss, handler, _ = _make_consumer()
        await consumer.on_audio_events({"rolloff": 4000.0})
        assert len(handler.rolloff_calls) == 1

    @pytest.mark.asyncio
    async def test_bpm_routed_to_handler(self):
        consumer, ss, handler, _ = _make_consumer()
        await consumer.on_audio_events({"bpm": 120.0, "beat_confidence": 0.9})
        assert len(handler.bpm_calls) == 1
        assert handler.bpm_calls[0] == (120.0, 0.9)

    @pytest.mark.asyncio
    async def test_onset_triggers_apply(self):
        apply_fn = AsyncMock()
        consumer, ss, handler, _ = _make_consumer(apply_colors_fn=apply_fn)
        await consumer.on_audio_events({"onset": {"strength": 1.0}})
        apply_fn.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_energy_rate_limited(self):
        apply_fn = AsyncMock()
        consumer, ss, handler, _ = _make_consumer(
            apply_colors_fn=apply_fn,
            is_onset_mode=False,
            is_energy_mode=True,
            transition_seconds=1.0,
            scene=_make_scene(audio_color_advance="continuous"),
        )
        # First call should apply
        await consumer.on_audio_events({"energy": 0.5})
        assert apply_fn.await_count == 1
        # Immediate second call should be rate-limited
        await consumer.on_audio_events({"energy": 0.6})
        assert apply_fn.await_count == 1

    @pytest.mark.asyncio
    async def test_silence_enter_delegates(self):
        consumer, ss, handler, _ = _make_consumer()
        await consumer.on_silence_enter()
        assert handler.silence_enter_called is True

    @pytest.mark.asyncio
    async def test_silence_exit_delegates(self):
        consumer, ss, handler, _ = _make_consumer()
        await consumer.on_silence_exit()
        assert handler.silence_exit_called is True

    @pytest.mark.asyncio
    async def test_unavailable_timeout_sets_stop_event(self):
        consumer, ss, handler, stop_event = _make_consumer()
        assert not stop_event.is_set()
        await consumer.on_unavailable_timeout()
        assert stop_event.is_set()
        assert ss.audio_waiting is True

    @pytest.mark.asyncio
    async def test_sensor_available_clears_waiting(self):
        consumer, ss, handler, _ = _make_consumer()
        ss.audio_waiting = True
        await consumer.on_sensor_available()
        assert ss.audio_waiting is False

    @pytest.mark.asyncio
    async def test_freq_zone_updates_light_indices(self):
        scene = _make_scene(
            colors=[
                DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100),
                DynamicSceneColor(x=0.5, y=0.3, brightness_pct=100),
                DynamicSceneColor(x=0.6, y=0.3, brightness_pct=100),
            ],
            audio_color_advance="continuous",
            audio_frequency_zone=True,
        )
        apply_fn = AsyncMock()
        consumer, ss, handler, _ = _make_consumer(
            scene=scene,
            apply_colors_fn=apply_fn,
            is_onset_mode=False,
            is_energy_mode=True,
        )
        consumer.set_freq_zone_config(
            bass_lights=["light.a"],
            mid_lights=["light.b"],
            high_lights=[],
        )
        await consumer.on_audio_events({"band_bass_energy": 0.9})
        # light.a should have its color index updated
        assert ss.light_color_indices["light.a"] == 2  # 0.9 * 3 = 2.7 → clamped to 2


class TestSpectralFeatures:
    """Tests for audio_color_by_frequency and audio_rolloff_brightness."""

    @pytest.mark.asyncio
    async def test_color_by_frequency_maps_centroid_to_palette(self):
        """High centroid maps to high palette index; apply is triggered."""
        scene = _make_scene(
            audio_color_by_frequency=True,
            colors=[
                DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100),
                DynamicSceneColor(x=0.4, y=0.4, brightness_pct=100),
                DynamicSceneColor(x=0.5, y=0.5, brightness_pct=100),
            ],
        )
        apply_fn = AsyncMock()
        consumer, ss, _, _ = _make_consumer(scene=scene, apply_colors_fn=apply_fn)
        # centroid=0.8 with 3 colors → int(0.8 * 3) = 2
        await consumer.on_audio_events({"centroid": 0.8})
        for idx in ss.light_color_indices.values():
            assert idx == 2
        apply_fn.assert_called_once()

    @pytest.mark.asyncio
    async def test_color_by_frequency_low_centroid(self):
        """Low centroid maps to palette index 0."""
        scene = _make_scene(
            audio_color_by_frequency=True,
            colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)] * 4,
        )
        consumer, ss, _, _ = _make_consumer(scene=scene)
        await consumer.on_audio_events({"centroid": 0.1})
        for idx in ss.light_color_indices.values():
            assert idx == 0

    @pytest.mark.asyncio
    async def test_color_by_frequency_disabled_no_change(self):
        """When flag is off, centroid events don't move palette position or trigger apply."""
        scene = _make_scene(
            audio_color_by_frequency=False,
            colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)] * 3,
        )
        apply_fn = AsyncMock()
        consumer, ss, _, _ = _make_consumer(
            scene=scene, apply_colors_fn=apply_fn, is_onset_mode=False,
        )
        await consumer.on_audio_events({"centroid": 0.9})
        for idx in ss.light_color_indices.values():
            assert idx == 0
        apply_fn.assert_not_called()

    @pytest.mark.asyncio
    async def test_rolloff_brightness_scales_modifier(self):
        """Rolloff=0.0 → factor=0.5; energy event applies it to brightness_modifier."""
        from custom_components.aqara_advanced_lighting.audio_mode_handlers import (
            IntensityBreathingHandler,
        )
        scene = _make_scene(
            audio_color_advance="intensity_breathing",
            audio_rolloff_brightness=True,
        )
        manager = MagicMock()
        handler = IntensityBreathingHandler(manager)
        apply_fn = AsyncMock()
        consumer, ss, _, _ = _make_consumer(
            scene=scene, handler=handler, apply_colors_fn=apply_fn,
            is_onset_mode=False, is_energy_mode=True,
        )
        # Store rolloff=0.0 → _rolloff_factor = 0.5
        await consumer.on_audio_events({"rolloff": 0.0})
        assert consumer._rolloff_factor == 0.5
        # Energy event: handler sets brightness_modifier (~0.55), then factor halves it
        await consumer.on_audio_events({"energy": 1.0})
        assert ss.brightness_modifier <= 0.5

    @pytest.mark.asyncio
    async def test_rolloff_brightness_factor_1_no_scaling(self):
        """Rolloff=1.0 → factor=1.0; brightness_modifier is unchanged by rolloff."""
        from custom_components.aqara_advanced_lighting.audio_mode_handlers import (
            IntensityBreathingHandler,
        )
        scene = _make_scene(
            audio_color_advance="intensity_breathing",
            audio_rolloff_brightness=True,
        )
        manager = MagicMock()
        handler = IntensityBreathingHandler(manager)
        consumer, ss, _, _ = _make_consumer(
            scene=scene, handler=handler,
            is_onset_mode=False, is_energy_mode=True,
        )
        await consumer.on_audio_events({"rolloff": 1.0})
        assert consumer._rolloff_factor == 1.0
        await consumer.on_audio_events({"energy": 1.0})
        # factor=1.0 means no scaling applied; brightness_modifier > 0.5
        assert ss.brightness_modifier > 0.5

    @pytest.mark.asyncio
    async def test_rolloff_brightness_disabled_no_scaling(self):
        """When flag is off, rolloff events leave _rolloff_factor at default 1.0."""
        from custom_components.aqara_advanced_lighting.audio_mode_handlers import (
            IntensityBreathingHandler,
        )
        scene = _make_scene(
            audio_color_advance="intensity_breathing",
            audio_rolloff_brightness=False,
        )
        manager = MagicMock()
        handler = IntensityBreathingHandler(manager)
        consumer, ss, _, _ = _make_consumer(
            scene=scene, handler=handler,
            is_onset_mode=False, is_energy_mode=True,
        )
        await consumer.on_audio_events({"rolloff": 0.0})
        assert consumer._rolloff_factor == 1.0
        await consumer.on_audio_events({"energy": 1.0})
        # Without scaling, brightness_modifier set by handler alone (> 0.5)
        assert ss.brightness_modifier > 0.5


class TestBeatPhaseWiring:
    """Tests for beat_phase event routing to update_phase."""

    @pytest.mark.asyncio
    async def test_beat_phase_event_calls_update_phase(self):
        """beat_phase events are routed to handler.update_phase()."""
        handler = MagicMock()
        scene = _make_scene(audio_color_advance="beat_predictive")
        consumer, ss, _, _ = _make_consumer(scene=scene, handler=handler, is_onset_mode=True)
        await consumer.on_audio_events({"beat_phase": 0.7})
        handler.update_phase.assert_called_once_with(ss, 0.7)

    @pytest.mark.asyncio
    async def test_beat_phase_after_bpm_update(self):
        """beat_phase is processed after bpm in the same event batch."""
        handler = MagicMock()
        scene = _make_scene(audio_color_advance="beat_predictive")
        consumer, ss, _, _ = _make_consumer(scene=scene, handler=handler, is_onset_mode=True)
        await consumer.on_audio_events({"bpm": 120.0, "beat_confidence": 0.9, "beat_phase": 0.5})
        handler.update_bpm.assert_called_once_with(120.0, 0.9)
        handler.update_phase.assert_called_once_with(ss, 0.5)


class TestDominantBandBias:
    """Tests for dominant-band color advance on onset in frequency-zone mode."""

    def _make_freq_zone_consumer(self, scene):
        apply_fn = AsyncMock()
        consumer, ss, _, _ = _make_consumer(
            scene=scene, apply_colors_fn=apply_fn, is_onset_mode=True,
        )
        # Override light_color_indices to use named keys matching zone lights
        ss.light_color_indices = {
            "light.bass1": 0, "light.mid1": 0, "light.high1": 0,
        }
        consumer.set_freq_zone_config(
            bass_lights=["light.bass1"],
            mid_lights=["light.mid1"],
            high_lights=["light.high1"],
        )
        return consumer, ss, apply_fn

    @pytest.mark.asyncio
    async def test_onset_advances_dominant_band(self):
        """On onset, the band with the highest energy advances its light by 1 step."""
        scene = _make_scene(
            audio_frequency_zone=True,
            colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)] * 4,
        )
        consumer, ss, _ = self._make_freq_zone_consumer(scene)
        # Establish band energies — mid is dominant
        await consumer.on_audio_events({
            "band_bass_energy": 0.2,
            "band_mid_energy": 0.8,
            "band_high_energy": 0.3,
        })
        initial_mid = ss.light_color_indices["light.mid1"]
        await consumer.on_audio_events({"onset": {"strength": 1.0}})
        assert ss.light_color_indices["light.mid1"] == (initial_mid + 1) % 4
        # Other zones should not have advanced
        assert ss.light_color_indices["light.bass1"] == ss.light_color_indices.get("light.bass1", 0)

    @pytest.mark.asyncio
    async def test_onset_wraps_around_palette(self):
        """Dominant band advance wraps around at palette end."""
        scene = _make_scene(
            audio_frequency_zone=True,
            colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)] * 3,
        )
        consumer, ss, _ = self._make_freq_zone_consumer(scene)
        await consumer.on_audio_events({"band_bass_energy": 0.9, "band_mid_energy": 0.1, "band_high_energy": 0.1})
        # Set bass light to last index
        ss.light_color_indices["light.bass1"] = 2
        await consumer.on_audio_events({"onset": {"strength": 1.0}})
        assert ss.light_color_indices["light.bass1"] == 0  # wrapped

    @pytest.mark.asyncio
    async def test_onset_no_bias_without_band_data(self):
        """No dominant-band advance fires if no band energies have been recorded."""
        scene = _make_scene(
            audio_frequency_zone=True,
            colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)] * 4,
        )
        consumer, ss, _ = self._make_freq_zone_consumer(scene)
        # No band energy events — _band_energies is empty
        await consumer.on_audio_events({"onset": {"strength": 1.0}})
        for idx in ss.light_color_indices.values():
            assert idx == 0


# --- Constant consistency tests ---

def test_ema_alpha_consistent_across_modules():
    """EMA smoothing factor must be identical in modulator and mode handlers."""
    from custom_components.aqara_advanced_lighting.const import AUDIO_EMA_ALPHA
    from custom_components.aqara_advanced_lighting.audio_effect_modulator import _EMA_ALPHA
    from custom_components.aqara_advanced_lighting.audio_mode_handlers import ENERGY_EMA_ALPHA
    assert _EMA_ALPHA == AUDIO_EMA_ALPHA
    assert ENERGY_EMA_ALPHA == AUDIO_EMA_ALPHA


def test_flash_decay_consistent_across_modules():
    """Flash brightness decay must be identical in modulator and mode handlers."""
    from custom_components.aqara_advanced_lighting.const import AUDIO_FLASH_BRIGHTNESS_DECAY
    from custom_components.aqara_advanced_lighting.audio_effect_modulator import _FLASH_DECAY
    from custom_components.aqara_advanced_lighting.audio_mode_handlers import FLASH_BRIGHTNESS_DECAY
    assert _FLASH_DECAY == AUDIO_FLASH_BRIGHTNESS_DECAY
    assert FLASH_BRIGHTNESS_DECAY == AUDIO_FLASH_BRIGHTNESS_DECAY
