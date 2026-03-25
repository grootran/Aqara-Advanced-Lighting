"""Tests for generic on-device audio opt-in."""
from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.aqara_advanced_lighting.const import (
    CONF_AUDIO_ON_SERVICE,
    CONF_AUDIO_OFF_SERVICE,
    CONF_AUDIO_ON_SERVICE_DATA,
    CONF_AUDIO_OFF_SERVICE_DATA,
    DATA_USER_PREFERENCES_STORE,
    DOMAIN,
)


def test_on_device_config_keys_exist():
    """Constants for on-device audio config should be defined."""
    assert CONF_AUDIO_ON_SERVICE == "audio_on_service"
    assert CONF_AUDIO_OFF_SERVICE == "audio_off_service"


def test_entity_audio_config_round_trips_through_json():
    """Entity audio config should be JSON-serializable for storage."""
    config = {
        "light.nanoleaf_panel": {
            CONF_AUDIO_ON_SERVICE: "light.turn_on",
            CONF_AUDIO_ON_SERVICE_DATA: '{"effect": "music_sync"}',
            CONF_AUDIO_OFF_SERVICE: "light.turn_on",
            CONF_AUDIO_OFF_SERVICE_DATA: '{"effect": "none"}',
        },
    }
    deserialized = json.loads(json.dumps(config))
    assert deserialized["light.nanoleaf_panel"][CONF_AUDIO_ON_SERVICE] == "light.turn_on"


def test_get_entity_audio_config_reads_global_preferences():
    """_get_entity_audio_config should read from UserPreferencesStore via hass.data."""
    from custom_components.aqara_advanced_lighting.dynamic_scene_manager import (
        DynamicSceneManager,
    )

    hass = MagicMock()
    manager = DynamicSceneManager.__new__(DynamicSceneManager)
    manager.hass = hass

    mock_store = MagicMock()
    mock_store.get_global_preference.return_value = {
        "light.nanoleaf_panel": {
            "audio_on_service": "light.turn_on",
            "audio_on_service_data": '{"effect": "music_sync"}',
            "audio_off_service": "light.turn_on",
            "audio_off_service_data": '{"effect": "none"}',
        },
    }
    hass.data = {DOMAIN: {DATA_USER_PREFERENCES_STORE: mock_store}}

    result = manager._get_entity_audio_config()
    assert "light.nanoleaf_panel" in result
    assert result["light.nanoleaf_panel"]["audio_on_service"] == "light.turn_on"
    mock_store.get_global_preference.assert_called_once_with("entity_audio_config")


def test_get_entity_audio_config_empty_when_no_config():
    """Should return empty dict when no entity audio config exists."""
    from custom_components.aqara_advanced_lighting.dynamic_scene_manager import (
        DynamicSceneManager,
    )

    hass = MagicMock()
    manager = DynamicSceneManager.__new__(DynamicSceneManager)
    manager.hass = hass

    mock_store = MagicMock()
    mock_store.get_global_preference.return_value = {}
    hass.data = {DOMAIN: {DATA_USER_PREFERENCES_STORE: mock_store}}

    result = manager._get_entity_audio_config()
    assert result == {}


def test_get_entity_audio_config_empty_when_no_store():
    """Should return empty dict when store is not available."""
    from custom_components.aqara_advanced_lighting.dynamic_scene_manager import (
        DynamicSceneManager,
    )

    hass = MagicMock()
    manager = DynamicSceneManager.__new__(DynamicSceneManager)
    manager.hass = hass
    hass.data = {}

    result = manager._get_entity_audio_config()
    assert result == {}
