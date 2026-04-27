"""Tests for the shared AudioEngine class."""
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.aqara_advanced_lighting.audio_engine import (
    AudioEngine,
    AudioEngineConfig,
    AudioConsumer,
)


class MockConsumer(AudioConsumer):
    """Test consumer that records events."""

    def __init__(self):
        self.events_received: list[dict] = []
        self.silence_entered = False
        self.silence_exited = False
        self.sensor_available = False

    async def on_audio_events(self, events: dict) -> None:
        self.events_received.append(events)

    async def on_silence_enter(self) -> None:
        self.silence_entered = True

    async def on_silence_exit(self) -> None:
        self.silence_exited = True

    async def on_unavailable_timeout(self) -> None:
        pass

    async def on_sensor_available(self) -> None:
        self.sensor_available = True


class TestAudioEngineConfig:
    """Test engine configuration."""

    def test_config_requires_audio_entity(self):
        config = AudioEngineConfig(
            audio_entity="binary_sensor.beat",
            consumer_type="effect",
            sensitivity=50,
            detection_mode="spectral_flux",
            subscribe_onset=True,
            subscribe_energy=True,
        )
        assert config.audio_entity == "binary_sensor.beat"
        assert config.consumer_type == "effect"

    def test_config_subscription_flags(self):
        config = AudioEngineConfig(
            audio_entity="binary_sensor.beat",
            consumer_type="scene",
            subscribe_onset=True,
            subscribe_energy=False,
            subscribe_bpm=True,
        )
        assert config.subscribe_onset is True
        assert config.subscribe_energy is False
        assert config.subscribe_bpm is True


class TestAudioEngineClaim:
    """Test concurrent audio entity claim logic."""

    def test_claim_key_includes_consumer_type(self):
        """Claims should be keyed by (entity, consumer_type)."""
        key_scene = AudioEngine._make_claim_key("binary_sensor.beat", "scene")
        key_effect = AudioEngine._make_claim_key("binary_sensor.beat", "effect")
        assert key_scene != key_effect

    def test_same_type_conflicts(self):
        """Two scenes on same sensor should conflict."""
        key1 = AudioEngine._make_claim_key("binary_sensor.beat", "scene")
        key2 = AudioEngine._make_claim_key("binary_sensor.beat", "scene")
        assert key1 == key2

    def test_cross_type_coexists(self):
        """Scene + effect on same sensor should not conflict."""
        key_scene = AudioEngine._make_claim_key("binary_sensor.beat", "scene")
        key_effect = AudioEngine._make_claim_key("binary_sensor.beat", "effect")
        assert key_scene != key_effect


import logging


class TestSubscriptionValidation:
    """Test that missing sensors produce warnings."""

    def test_warns_on_missing_requested_spectral(self, caplog):
        """Engine should warn when spectral sensors aren't found."""
        config = AudioEngineConfig(
            audio_entity="binary_sensor.beat",
            consumer_type="scene",
            subscribe_spectral=True,
        )
        engine = AudioEngine.__new__(AudioEngine)
        engine.config = config
        engine._companions = {}

        with caplog.at_level(logging.WARNING):
            subscribe, role_map = engine._build_subscriptions()

        assert "centroid" in caplog.text
        assert "rolloff" in caplog.text

    def test_warns_on_missing_beat_tracking(self, caplog):
        """Engine should warn when beat_confidence sensor isn't found."""
        config = AudioEngineConfig(
            audio_entity="binary_sensor.beat",
            consumer_type="scene",
            subscribe_beat_tracking=True,
        )
        engine = AudioEngine.__new__(AudioEngine)
        engine.config = config
        engine._companions = {}

        with caplog.at_level(logging.WARNING):
            engine._build_subscriptions()

        assert "beat_confidence" in caplog.text

    def test_no_warning_when_sensors_present(self, caplog):
        """No warning when requested sensors exist."""
        config = AudioEngineConfig(
            audio_entity="binary_sensor.beat",
            consumer_type="scene",
            subscribe_spectral=True,
        )
        engine = AudioEngine.__new__(AudioEngine)
        engine.config = config
        engine._companions = {
            "centroid": "sensor.centroid",
            "rolloff": "sensor.rolloff",
        }

        with caplog.at_level(logging.WARNING):
            engine._build_subscriptions()

        assert "centroid" not in caplog.text
        assert "rolloff" not in caplog.text
