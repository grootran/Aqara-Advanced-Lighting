"""Test the Aqara Advanced Lighting integration initialization."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr

from custom_components.aqara_advanced_lighting.const import (
    CONF_Z2M_BASE_TOPIC,
    DOMAIN,
)

from pytest_homeassistant_custom_component.common import MockConfigEntry


@pytest.fixture
def mock_config_entry() -> MockConfigEntry:
    """Create a mock config entry at current version (v1.3)."""
    return MockConfigEntry(
        domain=DOMAIN,
        title="Aqara Lighting (zigbee2mqtt)",
        data={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
        unique_id="zigbee2mqtt",
        version=1,
        minor_version=3,
    )


@pytest.fixture
def mock_config_entry_v1_2() -> MockConfigEntry:
    """Create a mock config entry at v1.2 (triggers v1.3 device migration)."""
    return MockConfigEntry(
        domain=DOMAIN,
        title="Aqara Lighting (zigbee2mqtt)",
        data={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
        unique_id="zigbee2mqtt",
        version=1,
        minor_version=2,
    )


@pytest.fixture
def mock_mqtt_client():
    """Mock MQTTBackend."""
    with patch(
        "custom_components.aqara_advanced_lighting.MQTTBackend"
    ) as mock_client_class:
        mock_client = MagicMock()
        mock_client.async_setup = AsyncMock()
        mock_client.async_shutdown = AsyncMock()
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
    mock_mqtt_client.async_shutdown.assert_called_once()


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


async def test_migrate_removes_sole_config_entry_devices(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_mqtt_client: MagicMock,
    mock_state_manager: MagicMock,
    mock_cct_sequence_manager: MagicMock,
    mock_segment_sequence_manager: MagicMock,
    mock_mqtt_wait: AsyncMock,
) -> None:
    """Test that devices where we are the sole config entry are removed.

    Old-style devices were created with only our identifier and config entry,
    resulting in duplicate devices in HA. The migration removes any device
    where our config entry is the only one, so the backends can re-register
    and properly merge with the MQTT/ZHA device.
    """
    mock_config_entry.add_to_hass(hass)

    device_reg = dr.async_get(hass)
    old_device = device_reg.async_get_or_create(
        config_entry_id=mock_config_entry.entry_id,
        identifiers={(DOMAIN, "0x00158d0001abcdef")},
        name="bedroom_light",
        manufacturer="Aqara",
        model="T2 LED strip controller",
    )
    old_device_id = old_device.id

    assert device_reg.async_get(old_device_id) is not None

    assert await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    assert device_reg.async_get(old_device_id) is None


async def test_migrate_removes_partial_merge_devices(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_mqtt_client: MagicMock,
    mock_state_manager: MagicMock,
    mock_cct_sequence_manager: MagicMock,
    mock_segment_sequence_manager: MagicMock,
    mock_mqtt_wait: AsyncMock,
) -> None:
    """Test that partially merged devices (both identifiers, sole config entry) are removed.

    A previous version could create devices with both our identifier and the
    mqtt identifier but only our config entry (failed merge). These must be
    removed so the backend can properly merge with the real MQTT device.
    """
    mock_config_entry.add_to_hass(hass)

    device_reg = dr.async_get(hass)
    partial_device = device_reg.async_get_or_create(
        config_entry_id=mock_config_entry.entry_id,
        identifiers={
            (DOMAIN, "0x00158d0001abcdef"),
            ("mqtt", "zigbee2mqtt_0x00158d0001abcdef"),
        },
        connections={(dr.CONNECTION_NETWORK_MAC, "00:15:8d:00:01:ab:cd:ef")},
        name="bedroom_light",
        manufacturer="Aqara",
        model="T2 LED strip controller",
    )
    partial_device_id = partial_device.id

    assert device_reg.async_get(partial_device_id) is not None

    assert await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    # Should be removed (only our config entry, even though it has mqtt identifiers)
    assert device_reg.async_get(partial_device_id) is None


async def test_migrate_preserves_truly_merged_devices(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_mqtt_client: MagicMock,
    mock_state_manager: MagicMock,
    mock_cct_sequence_manager: MagicMock,
    mock_segment_sequence_manager: MagicMock,
    mock_mqtt_wait: AsyncMock,
) -> None:
    """Test that truly merged devices (multiple config entries) are preserved.

    A device shared between our integration and MQTT/ZHA has multiple config
    entries. The migration must not remove these.
    """
    mock_config_entry.add_to_hass(hass)

    # Create a second config entry to simulate the MQTT integration
    mqtt_config_entry = MockConfigEntry(
        domain="mqtt",
        title="MQTT",
        data={},
        unique_id="mqtt",
    )
    mqtt_config_entry.add_to_hass(hass)

    device_reg = dr.async_get(hass)

    # Create device with MQTT config entry first
    merged_device = device_reg.async_get_or_create(
        config_entry_id=mqtt_config_entry.entry_id,
        identifiers={("mqtt", "zigbee2mqtt_0x00158d0001abcdef")},
        name="bedroom_light",
        manufacturer="Aqara",
        model="E27 CCT led bulb",
    )
    # Add our config entry to the same device
    device_reg.async_get_or_create(
        config_entry_id=mock_config_entry.entry_id,
        identifiers={("mqtt", "zigbee2mqtt_0x00158d0001abcdef")},
    )
    device_reg.async_update_device(
        merged_device.id,
        merge_identifiers={(DOMAIN, "0x00158d0001abcdef")},
    )
    merged_device_id = merged_device.id

    # Verify it has both config entries
    updated = device_reg.async_get(merged_device_id)
    assert len(updated.config_entries) == 2

    assert await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    # Truly merged device should still exist
    assert device_reg.async_get(merged_device_id) is not None


async def test_v1_3_migration_removes_all_devices(
    hass: HomeAssistant,
    mock_config_entry_v1_2: MockConfigEntry,
    mock_mqtt_client: MagicMock,
    mock_state_manager: MagicMock,
    mock_cct_sequence_manager: MagicMock,
    mock_segment_sequence_manager: MagicMock,
    mock_mqtt_wait: AsyncMock,
) -> None:
    """Test that v1.3 migration removes ALL devices for clean re-merge.

    Previous versions created devices that conflict with MQTT devices
    (duplicate identifiers). The v1.3 migration removes everything so
    the backend can re-create proper merges with MQTT/ZHA devices.
    """
    mock_config_entry_v1_2.add_to_hass(hass)

    device_reg = dr.async_get(hass)

    # Create an old standalone device (only our identifier)
    standalone = device_reg.async_get_or_create(
        config_entry_id=mock_config_entry_v1_2.entry_id,
        identifiers={(DOMAIN, "0x00158d0001aaaaaa")},
        name="standalone_light",
    )

    # Create a "fake merged" device (our identifier + mqtt identifier,
    # but still a separate device from the real MQTT device)
    fake_merged = device_reg.async_get_or_create(
        config_entry_id=mock_config_entry_v1_2.entry_id,
        identifiers={
            (DOMAIN, "0x00158d0001bbbbbb"),
            ("mqtt", "zigbee2mqtt_0x00158d0001bbbbbb"),
        },
        name="fake_merged_light",
    )

    # Create an old device with stale MAC connection
    mac_device = device_reg.async_get_or_create(
        config_entry_id=mock_config_entry_v1_2.entry_id,
        identifiers={(DOMAIN, "0x00158d0001cccccc")},
        connections={(dr.CONNECTION_NETWORK_MAC, "00:15:8d:00:01:cc:cc:cc")},
        name="mac_light",
    )

    assert device_reg.async_get(standalone.id) is not None
    assert device_reg.async_get(fake_merged.id) is not None
    assert device_reg.async_get(mac_device.id) is not None

    # Setup triggers v1.3 migration (entry is at v1.2)
    assert await hass.config_entries.async_setup(mock_config_entry_v1_2.entry_id)
    await hass.async_block_till_done()

    # ALL devices should have been removed by v1.3 migration
    assert device_reg.async_get(standalone.id) is None
    assert device_reg.async_get(fake_merged.id) is None
    assert device_reg.async_get(mac_device.id) is None
