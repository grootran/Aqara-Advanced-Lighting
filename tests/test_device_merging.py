"""Test HA device registry merging behavior for Aqara Advanced Lighting.

These tests validate that Home Assistant's device registry correctly merges
devices when multiple integrations register the same physical device using
MAC-based connections. This is the mechanism that prevents duplicate devices
when both Z2M/ZHA and our integration register the same Aqara light.
"""

import pytest

from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr

from custom_components.aqara_advanced_lighting.const import (
    CONF_Z2M_BASE_TOPIC,
    DOMAIN,
)

from pytest_homeassistant_custom_component.common import MockConfigEntry

# Test constants matching a typical Aqara Zigbee device
TEST_IEEE = "0x00158d0001abcdef"
TEST_MAC = "00:15:8d:00:01:ab:cd:ef"


@pytest.fixture
def z2m_config_entry() -> MockConfigEntry:
    """Create a mock config entry simulating Zigbee2MQTT."""
    return MockConfigEntry(
        domain="mqtt",
        title="Zigbee2MQTT",
        data={"broker": "localhost"},
        unique_id="z2m_bridge",
    )


@pytest.fixture
def aal_config_entry() -> MockConfigEntry:
    """Create a mock config entry for Aqara Advanced Lighting."""
    return MockConfigEntry(
        domain=DOMAIN,
        title="Aqara Lighting (zigbee2mqtt)",
        data={CONF_Z2M_BASE_TOPIC: "zigbee2mqtt"},
        unique_id="zigbee2mqtt",
    )


async def test_mqtt_backend_registers_device_with_mac_connection(
    hass: HomeAssistant,
    z2m_config_entry: MockConfigEntry,
    aal_config_entry: MockConfigEntry,
) -> None:
    """Test that devices merge when Z2M and our integration share a MAC connection.

    When Z2M discovers a Zigbee device, it registers it with a MAC connection
    and its own identifier. When our integration later registers the same
    physical device with the same MAC connection (plus our own identifier),
    HA should merge them into a single device entry.
    """
    z2m_config_entry.add_to_hass(hass)
    aal_config_entry.add_to_hass(hass)

    device_reg = dr.async_get(hass)

    # Step 1: Z2M discovers and registers the device first
    z2m_device = device_reg.async_get_or_create(
        config_entry_id=z2m_config_entry.entry_id,
        connections={(dr.CONNECTION_NETWORK_MAC, TEST_MAC)},
        identifiers={("mqtt", f"zigbee2mqtt_bridge_{TEST_IEEE}")},
        name="Bedroom Light",
        manufacturer="Aqara",
        model="T2 RGB+CCT bulb (E27)",
    )

    # Step 2: Our integration registers the same device with the same MAC
    aal_device = device_reg.async_get_or_create(
        config_entry_id=aal_config_entry.entry_id,
        connections={(dr.CONNECTION_NETWORK_MAC, TEST_MAC)},
        identifiers={(DOMAIN, TEST_IEEE)},
    )

    # Both calls should return the SAME device (merged by MAC connection)
    assert z2m_device.id == aal_device.id, (
        "Devices were not merged. Z2M and AAL created separate device entries "
        "despite sharing the same MAC connection."
    )

    # Both config entries should be associated with the merged device
    assert z2m_config_entry.entry_id in aal_device.config_entries
    assert aal_config_entry.entry_id in aal_device.config_entries

    # Our identifier should be present on the merged device
    assert (DOMAIN, TEST_IEEE) in aal_device.identifiers

    # The Z2M identifier should also still be present
    assert ("mqtt", f"zigbee2mqtt_bridge_{TEST_IEEE}") in aal_device.identifiers


async def test_mqtt_backend_creates_device_when_z2m_not_loaded_yet(
    hass: HomeAssistant,
    z2m_config_entry: MockConfigEntry,
    aal_config_entry: MockConfigEntry,
) -> None:
    """Test that devices merge regardless of registration order.

    Our integration may load before Z2M has discovered the device. When our
    integration registers first with a MAC connection, and Z2M registers later
    with the same MAC, HA should still merge them into one device.
    """
    z2m_config_entry.add_to_hass(hass)
    aal_config_entry.add_to_hass(hass)

    device_reg = dr.async_get(hass)

    # Step 1: Our integration loads first and registers the device
    aal_device = device_reg.async_get_or_create(
        config_entry_id=aal_config_entry.entry_id,
        connections={(dr.CONNECTION_NETWORK_MAC, TEST_MAC)},
        identifiers={(DOMAIN, TEST_IEEE)},
    )

    # Step 2: Z2M discovers the same physical device later
    z2m_device = device_reg.async_get_or_create(
        config_entry_id=z2m_config_entry.entry_id,
        connections={(dr.CONNECTION_NETWORK_MAC, TEST_MAC)},
        identifiers={("mqtt", f"zigbee2mqtt_bridge_{TEST_IEEE}")},
        name="Bedroom Light",
        manufacturer="Aqara",
        model="T2 RGB+CCT bulb (E27)",
    )

    # Both calls should return the SAME device (merged by MAC connection)
    assert aal_device.id == z2m_device.id, (
        "Devices were not merged when AAL loaded before Z2M. Load order "
        "should not prevent merging via MAC connection."
    )

    # Both config entries should be associated with the merged device
    assert z2m_config_entry.entry_id in z2m_device.config_entries
    assert aal_config_entry.entry_id in z2m_device.config_entries

    # Our identifier should be present on the merged device
    assert (DOMAIN, TEST_IEEE) in z2m_device.identifiers

    # The Z2M identifier should also be present
    assert ("mqtt", f"zigbee2mqtt_bridge_{TEST_IEEE}") in z2m_device.identifiers
