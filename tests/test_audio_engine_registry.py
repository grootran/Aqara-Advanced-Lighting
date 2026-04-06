"""Tests for AudioEngineRegistry — central tracking of active audio engines."""
from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

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
    """Create a mock engine with config but no real HA connection."""
    engine = MagicMock(spec=AudioEngine)
    engine.config = _make_config(audio_entity, consumer_type)
    engine.stop = AsyncMock()
    return engine


class TestAudioEngineRegistry:
    """Test registry lifecycle tracking."""

    def test_register_and_lookup(self):
        registry = AudioEngineRegistry()
        engine = _make_mock_engine()
        registry.register(engine)
        assert registry.get_engines_for_sensor("binary_sensor.beat", "effect") == [engine]

    def test_unregister(self):
        registry = AudioEngineRegistry()
        engine = _make_mock_engine()
        registry.register(engine)
        registry.unregister(engine)
        assert registry.get_engines_for_sensor("binary_sensor.beat", "effect") == []

    def test_multiple_engines_same_sensor(self):
        registry = AudioEngineRegistry()
        e1 = _make_mock_engine()
        e2 = _make_mock_engine()
        registry.register(e1)
        registry.register(e2)
        engines = registry.get_engines_for_sensor("binary_sensor.beat", "effect")
        assert len(engines) == 2
        assert e1 in engines
        assert e2 in engines

    def test_different_sensors_isolated(self):
        registry = AudioEngineRegistry()
        e1 = _make_mock_engine(audio_entity="sensor.a")
        e2 = _make_mock_engine(audio_entity="sensor.b")
        registry.register(e1)
        registry.register(e2)
        assert registry.get_engines_for_sensor("sensor.a", "effect") == [e1]
        assert registry.get_engines_for_sensor("sensor.b", "effect") == [e2]

    def test_cross_type_isolated(self):
        registry = AudioEngineRegistry()
        e_effect = _make_mock_engine(consumer_type="effect")
        e_scene = _make_mock_engine(consumer_type="scene")
        registry.register(e_effect)
        registry.register(e_scene)
        assert registry.get_engines_for_sensor("binary_sensor.beat", "effect") == [e_effect]
        assert registry.get_engines_for_sensor("binary_sensor.beat", "scene") == [e_scene]

    @pytest.mark.asyncio
    async def test_stop_engines_for_sensor(self):
        registry = AudioEngineRegistry()
        e1 = _make_mock_engine()
        e2 = _make_mock_engine()
        registry.register(e1)
        registry.register(e2)
        stopped = await registry.stop_engines_for_sensor("binary_sensor.beat", "effect")
        assert stopped == 2
        e1.stop.assert_awaited_once()
        e2.stop.assert_awaited_once()
        assert registry.get_engines_for_sensor("binary_sensor.beat", "effect") == []

    @pytest.mark.asyncio
    async def test_stop_engines_excludes_self(self):
        registry = AudioEngineRegistry()
        e1 = _make_mock_engine()
        e2 = _make_mock_engine()
        registry.register(e1)
        registry.register(e2)
        stopped = await registry.stop_engines_for_sensor(
            "binary_sensor.beat", "effect", exclude=e2
        )
        assert stopped == 1
        e1.stop.assert_awaited_once()
        e2.stop.assert_not_awaited()
        assert registry.get_engines_for_sensor("binary_sensor.beat", "effect") == [e2]

    def test_unregister_idempotent(self):
        registry = AudioEngineRegistry()
        engine = _make_mock_engine()
        registry.register(engine)
        registry.unregister(engine)
        registry.unregister(engine)  # Should not raise
        assert registry.get_engines_for_sensor("binary_sensor.beat", "effect") == []

    def test_all_active_engines(self):
        registry = AudioEngineRegistry()
        e1 = _make_mock_engine(audio_entity="sensor.a")
        e2 = _make_mock_engine(audio_entity="sensor.b", consumer_type="scene")
        registry.register(e1)
        registry.register(e2)
        all_engines = registry.all_active()
        assert len(all_engines) == 2

    @pytest.mark.asyncio
    async def test_stop_all(self):
        registry = AudioEngineRegistry()
        e1 = _make_mock_engine(audio_entity="sensor.a")
        e2 = _make_mock_engine(audio_entity="sensor.b")
        registry.register(e1)
        registry.register(e2)
        await registry.stop_all()
        e1.stop.assert_awaited_once()
        e2.stop.assert_awaited_once()
        assert registry.all_active() == []

    def test_double_register_same_engine(self):
        """Registering the same engine twice should not duplicate it."""
        registry = AudioEngineRegistry()
        engine = _make_mock_engine()
        registry.register(engine)
        registry.register(engine)
        assert len(registry.get_engines_for_sensor("binary_sensor.beat", "effect")) == 1

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
