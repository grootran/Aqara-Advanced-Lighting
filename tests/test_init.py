"""Test the Aqara Advanced Lighting integration initialization."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady

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
        title="Aqara Advanced Lighting",
        data={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
        unique_id=None,
    )


@pytest.fixture
def mock_mqtt_subscribe():
    """Mock MQTT subscribe."""
    with patch(
        "homeassistant.components.mqtt.async_subscribe"
    ) as mock_subscribe:
        yield mock_subscribe


async def test_setup_entry_success(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_mqtt_subscribe: AsyncMock,
) -> None:
    """Test successful setup of config entry."""
    # Register MQTT service
    hass.services.async_register("mqtt", "publish", lambda call: None)

    mock_config_entry.add_to_hass(hass)

    with patch(
        "custom_components.aqara_advanced_lighting.AqaraDeviceCoordinator"
    ) as mock_coordinator:
        mock_coordinator.return_value.async_config_entry_first_refresh = AsyncMock()

        assert await hass.config_entries.async_setup(mock_config_entry.entry_id)
        await hass.async_block_till_done()

    assert mock_config_entry.state is ConfigEntryState.LOADED
    assert DOMAIN in hass.data
    assert mock_config_entry.entry_id in hass.data[DOMAIN]


async def test_setup_entry_mqtt_not_available(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Test setup fails when MQTT is not available."""
    # Do not register MQTT service
    mock_config_entry.add_to_hass(hass)

    with pytest.raises(ConfigEntryNotReady):
        await hass.config_entries.async_setup(mock_config_entry.entry_id)


async def test_unload_entry(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_mqtt_subscribe: AsyncMock,
) -> None:
    """Test unloading a config entry."""
    hass.services.async_register("mqtt", "publish", lambda call: None)

    mock_config_entry.add_to_hass(hass)

    with patch(
        "custom_components.aqara_advanced_lighting.AqaraDeviceCoordinator"
    ) as mock_coordinator:
        mock_coordinator.return_value.async_config_entry_first_refresh = AsyncMock()

        assert await hass.config_entries.async_setup(mock_config_entry.entry_id)
        await hass.async_block_till_done()

        assert mock_config_entry.state is ConfigEntryState.LOADED

        # Unload the entry
        assert await hass.config_entries.async_unload(mock_config_entry.entry_id)
        await hass.async_block_till_done()

        assert mock_config_entry.state is ConfigEntryState.NOT_LOADED


async def test_setup_entry_coordinator_fails(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_mqtt_subscribe: AsyncMock,
) -> None:
    """Test setup fails when coordinator fails to refresh."""
    hass.services.async_register("mqtt", "publish", lambda call: None)

    mock_config_entry.add_to_hass(hass)

    with patch(
        "custom_components.aqara_advanced_lighting.AqaraDeviceCoordinator"
    ) as mock_coordinator:
        # Simulate coordinator refresh failure
        mock_coordinator.return_value.async_config_entry_first_refresh = AsyncMock(
            side_effect=Exception("Connection failed")
        )

        with pytest.raises(ConfigEntryNotReady):
            await hass.config_entries.async_setup(mock_config_entry.entry_id)


async def test_reload_entry(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_mqtt_subscribe: AsyncMock,
) -> None:
    """Test reloading a config entry."""
    hass.services.async_register("mqtt", "publish", lambda call: None)

    mock_config_entry.add_to_hass(hass)

    with patch(
        "custom_components.aqara_advanced_lighting.AqaraDeviceCoordinator"
    ) as mock_coordinator:
        mock_coordinator.return_value.async_config_entry_first_refresh = AsyncMock()

        # Initial setup
        assert await hass.config_entries.async_setup(mock_config_entry.entry_id)
        await hass.async_block_till_done()
        assert mock_config_entry.state is ConfigEntryState.LOADED

        # Reload
        assert await hass.config_entries.async_reload(mock_config_entry.entry_id)
        await hass.async_block_till_done()
        assert mock_config_entry.state is ConfigEntryState.LOADED
