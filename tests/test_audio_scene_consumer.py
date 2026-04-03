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
        assert config.subscribe_beat_confidence is True
        assert config.subscribe_beat_phase is True
        assert config.subscribe_onset is True

    def test_brightness_response_subscribes_energy(self):
        from custom_components.aqara_advanced_lighting.audio_scene_consumer import (
            build_scene_engine_config,
        )
        scene = _make_scene(
            audio_color_advance="on_onset",
            audio_brightness_response=True,
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

    def test_centroid_and_rolloff_always_subscribed(self):
        from custom_components.aqara_advanced_lighting.audio_scene_consumer import (
            build_scene_engine_config,
        )
        scene = _make_scene()
        config = build_scene_engine_config(scene)
        assert config.subscribe_centroid is True
        assert config.subscribe_rolloff is True


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
