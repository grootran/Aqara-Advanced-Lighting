"""Test the Aqara Advanced Lighting integration initialization."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant

from custom_components.aqara_advanced_lighting.const import (
    CONF_Z2M_BASE_TOPIC,
    DOMAIN,
)

from pytest_homeassistant_custom_component.common import MockConfigEntry


@pytest.fixture
def mock_config_entry() -> MockConfigEntry:
    """Create a mock config entry."""
    return MockConfigEntry(
        domain=DOMAIN,
        title="Aqara Lighting (zigbee2mqtt)",
        data={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
        unique_id="zigbee2mqtt",
    )


@pytest.fixture
def mock_mqtt_client():
    """Mock MQTTClient."""
    with patch(
        "custom_components.aqara_advanced_lighting.MQTTClient"
    ) as mock_client_class:
        mock_client = MagicMock()
        mock_client.async_setup = AsyncMock()
        mock_client.async_teardown = AsyncMock()
        mock_client_class.return_value = mock_client
        yield mock_client


@pytest.fixture
def mock_state_manager():
    """Mock StateManager."""
    with patch(
        "custom_components.aqara_advanced_lighting.StateManager"
    ) as mock_manager_class:
        mock_manager = MagicMock()
        mock_manager.async_load = AsyncMock()
        mock_manager_class.return_value = mock_manager
        yield mock_manager


@pytest.fixture
def mock_cct_sequence_manager():
    """Mock CCTSequenceManager."""
    with patch(
        "custom_components.aqara_advanced_lighting.CCTSequenceManager"
    ) as mock_manager_class:
        mock_manager = MagicMock()
        mock_manager.stop_all_sequences = AsyncMock()
        mock_manager.cleanup = MagicMock()
        mock_manager_class.return_value = mock_manager
        yield mock_manager


@pytest.fixture
def mock_segment_sequence_manager():
    """Mock SegmentSequenceManager."""
    with patch(
        "custom_components.aqara_advanced_lighting.SegmentSequenceManager"
    ) as mock_manager_class:
        mock_manager = MagicMock()
        mock_manager.stop_all_sequences = AsyncMock()
        mock_manager.cleanup = MagicMock()
        mock_manager_class.return_value = mock_manager
        yield mock_manager


@pytest.fixture
def mock_mqtt_wait():
    """Mock mqtt.async_wait_for_mqtt_client."""
    with patch(
        "custom_components.aqara_advanced_lighting.mqtt.async_wait_for_mqtt_client"
    ) as mock_wait:
        mock_wait.return_value = None
        yield mock_wait


async def test_setup_entry_success(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_mqtt_client: MagicMock,
    mock_state_manager: MagicMock,
    mock_cct_sequence_manager: MagicMock,
    mock_segment_sequence_manager: MagicMock,
    mock_mqtt_wait: AsyncMock,
) -> None:
    """Test successful setup of config entry."""
    mock_config_entry.add_to_hass(hass)

    assert await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    assert mock_config_entry.state is ConfigEntryState.LOADED
    assert DOMAIN in hass.data
    assert "entries" in hass.data[DOMAIN]
    assert mock_config_entry.entry_id in hass.data[DOMAIN]["entries"]

    # Verify components were initialized
    mock_mqtt_client.async_setup.assert_called_once()
    mock_state_manager.async_load.assert_called_once()


async def test_setup_entry_mqtt_not_available(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Test setup fails when MQTT is not available."""
    mock_config_entry.add_to_hass(hass)

    with patch(
        "custom_components.aqara_advanced_lighting.mqtt.async_wait_for_mqtt_client",
        side_effect=Exception("MQTT not available"),
    ):
        assert not await hass.config_entries.async_setup(mock_config_entry.entry_id)

    assert mock_config_entry.state is ConfigEntryState.SETUP_RETRY


async def test_unload_entry(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_mqtt_client: MagicMock,
    mock_state_manager: MagicMock,
    mock_cct_sequence_manager: MagicMock,
    mock_segment_sequence_manager: MagicMock,
    mock_mqtt_wait: AsyncMock,
) -> None:
    """Test unloading a config entry."""
    mock_config_entry.add_to_hass(hass)

    assert await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    assert mock_config_entry.state is ConfigEntryState.LOADED

    # Unload the entry
    assert await hass.config_entries.async_unload(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    assert mock_config_entry.state is ConfigEntryState.NOT_LOADED

    # Verify cleanup was called
    mock_cct_sequence_manager.stop_all_sequences.assert_called_once()
    mock_cct_sequence_manager.cleanup.assert_called_once()
    mock_segment_sequence_manager.stop_all_sequences.assert_called_once()
    mock_segment_sequence_manager.cleanup.assert_called_once()
    mock_mqtt_client.async_teardown.assert_called_once()


async def test_reload_entry(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_mqtt_client: MagicMock,
    mock_state_manager: MagicMock,
    mock_cct_sequence_manager: MagicMock,
    mock_segment_sequence_manager: MagicMock,
    mock_mqtt_wait: AsyncMock,
) -> None:
    """Test reloading a config entry."""
    mock_config_entry.add_to_hass(hass)

    # Initial setup
    assert await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()
    assert mock_config_entry.state is ConfigEntryState.LOADED

    # Reload
    assert await hass.config_entries.async_reload(mock_config_entry.entry_id)
    await hass.async_block_till_done()
    assert mock_config_entry.state is ConfigEntryState.LOADED
