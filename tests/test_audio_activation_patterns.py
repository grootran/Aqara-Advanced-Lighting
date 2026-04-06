"""Tests for audio engine activation patterns and orphan prevention.

Covers the full matrix of scenarios where engines can conflict,
be orphaned, or leak resources.
"""
from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.aqara_advanced_lighting.audio_engine import (
    AudioEngine,
    AudioEngineConfig,
)
from custom_components.aqara_advanced_lighting.audio_engine_registry import (
    AudioEngineRegistry,
)


def _make_config(audio_entity="binary_sensor.beat", consumer_type="effect"):
    return AudioEngineConfig(
        audio_entity=audio_entity,
        consumer_type=consumer_type,
        subscribe_onset=True,
        subscribe_energy=True,
    )


def _make_mock_engine(audio_entity="binary_sensor.beat", consumer_type="effect"):
    engine = MagicMock(spec=AudioEngine)
    engine.config = _make_config(audio_entity, consumer_type)
    engine.stop = AsyncMock()
    return engine


class TestEffectActivationPatterns:
    """Test effect engine lifecycle with registry."""

    @pytest.mark.asyncio
    async def test_same_entity_same_sensor_replaces(self):
        """Effect on light.A replaces previous effect on light.A (same sensor)."""
        registry = AudioEngineRegistry()
        e1 = _make_mock_engine()
        registry.register(e1)
        stopped = await registry.stop_engines_for_sensor("binary_sensor.beat", "effect")
        assert stopped == 1
        e1.stop.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_different_entity_same_sensor_stops_first(self):
        """Effect on light.B (same sensor as light.A) stops light.A's engine."""
        registry = AudioEngineRegistry()
        e1 = _make_mock_engine()
        registry.register(e1)
        stopped = await registry.stop_engines_for_sensor("binary_sensor.beat", "effect")
        assert stopped == 1
        e1.stop.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_different_sensor_coexists(self):
        """Effects on different sensors don't conflict."""
        registry = AudioEngineRegistry()
        e1 = _make_mock_engine(audio_entity="sensor.a")
        registry.register(e1)
        stopped = await registry.stop_engines_for_sensor("sensor.b", "effect")
        assert stopped == 0
        e1.stop.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_cross_type_coexists(self):
        """Effect and scene on same sensor don't conflict."""
        registry = AudioEngineRegistry()
        e_effect = _make_mock_engine(consumer_type="effect")
        registry.register(e_effect)
        stopped = await registry.stop_engines_for_sensor("binary_sensor.beat", "scene")
        assert stopped == 0
        e_effect.stop.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_stop_clears_from_registry(self):
        """Stopping an engine removes it from the registry."""
        registry = AudioEngineRegistry()
        engine = _make_mock_engine()
        registry.register(engine)
        await registry.stop_engines_for_sensor("binary_sensor.beat", "effect")
        assert registry.get_engines_for_sensor("binary_sensor.beat", "effect") == []

    @pytest.mark.asyncio
    async def test_rapid_start_stop_no_leak(self):
        """Rapidly starting and stopping engines should leave registry empty."""
        registry = AudioEngineRegistry()
        for _ in range(10):
            engine = _make_mock_engine()
            registry.register(engine)
            await registry.stop_engines_for_sensor("binary_sensor.beat", "effect")
        assert registry.all_active() == []


class TestSceneActivationPatterns:
    """Test scene engine lifecycle with registry."""

    @pytest.mark.asyncio
    async def test_scene_same_sensor_stops_first(self):
        """Second scene on same sensor stops the first."""
        registry = AudioEngineRegistry()
        e1 = _make_mock_engine(consumer_type="scene")
        registry.register(e1)
        stopped = await registry.stop_engines_for_sensor("binary_sensor.beat", "scene")
        assert stopped == 1

    @pytest.mark.asyncio
    async def test_scene_different_sensor_coexists(self):
        """Scenes on different sensors coexist."""
        registry = AudioEngineRegistry()
        e1 = _make_mock_engine(audio_entity="sensor.a", consumer_type="scene")
        registry.register(e1)
        stopped = await registry.stop_engines_for_sensor("sensor.b", "scene")
        assert stopped == 0


class TestRegistryEdgeCases:
    """Test edge cases and error handling."""

    @pytest.mark.asyncio
    async def test_stop_engine_that_throws(self):
        """Registry should handle engine.stop() exceptions gracefully."""
        registry = AudioEngineRegistry()
        engine = _make_mock_engine()
        engine.stop = AsyncMock(side_effect=Exception("connection lost"))
        registry.register(engine)
        stopped = await registry.stop_engines_for_sensor("binary_sensor.beat", "effect")
        assert stopped == 1
        assert registry.get_engines_for_sensor("binary_sensor.beat", "effect") == []

    @pytest.mark.asyncio
    async def test_stop_all_on_shutdown(self):
        """stop_all should clean up everything during integration unload."""
        registry = AudioEngineRegistry()
        engines = []
        for sensor in ["sensor.a", "sensor.b", "sensor.c"]:
            engine = _make_mock_engine(audio_entity=sensor)
            registry.register(engine)
            engines.append(engine)
        await registry.stop_all()
        for engine in engines:
            engine.stop.assert_awaited_once()
        assert registry.all_active() == []

    def test_double_register_same_engine(self):
        """Registering the same engine twice should not duplicate it."""
        registry = AudioEngineRegistry()
        engine = _make_mock_engine()
        registry.register(engine)
        registry.register(engine)
        assert len(registry.get_engines_for_sensor("binary_sensor.beat", "effect")) == 1
