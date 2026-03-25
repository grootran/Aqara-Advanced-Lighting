"""Tests for default audio entity fallback in dynamic scene presets."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from custom_components.aqara_advanced_lighting.services.dynamic_scene import (
    _resolve_audio_entity_fallback,
)


@pytest.fixture
def mock_hass():
    """Create a mock Home Assistant instance."""
    hass = MagicMock()
    hass.data = {}
    return hass


def test_fallback_returns_none_when_no_audio_params():
    """Non-audio presets should not get a fallback entity."""
    preset = {
        "name": "Sunset Glow",
        "colors": [],
        "transition_time": 120.0,
    }
    result = _resolve_audio_entity_fallback(preset, "binary_sensor.audio")
    assert result is None


def test_fallback_returns_default_when_audio_params_present():
    """Audio presets without audio_entity should get the default."""
    preset = {
        "name": "Beat Drop",
        "colors": [],
        "audio_color_advance": "on_onset",
    }
    result = _resolve_audio_entity_fallback(preset, "binary_sensor.audio")
    assert result == "binary_sensor.audio"


def test_fallback_preserves_explicit_audio_entity():
    """Audio presets with explicit audio_entity should keep it."""
    preset = {
        "name": "Beat Drop",
        "colors": [],
        "audio_color_advance": "on_onset",
        "audio_entity": "binary_sensor.custom_audio",
    }
    result = _resolve_audio_entity_fallback(preset, "binary_sensor.default")
    assert result == "binary_sensor.custom_audio"


def test_fallback_returns_none_when_no_default_set():
    """Audio presets should get None when no default is configured."""
    preset = {
        "name": "Beat Drop",
        "colors": [],
        "audio_color_advance": "on_onset",
    }
    result = _resolve_audio_entity_fallback(preset, "")
    assert result is None
