"""The Aqara Advanced Lighting integration."""

from __future__ import annotations

import logging

from homeassistant.components import mqtt
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady
from homeassistant.helpers import config_validation as cv

from .const import CONF_Z2M_BASE_TOPIC, DEFAULT_Z2M_BASE_TOPIC, DOMAIN
from .models import AqaraLightingConfigEntry, AqaraLightingRuntimeData
from .mqtt_client import MQTTClient
from .services import async_setup_services, async_unload_services
from .state_manager import StateManager

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = []

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the Aqara Advanced Lighting integration."""
    # Initialize domain data storage
    hass.data.setdefault(DOMAIN, {})

    # Register services
    await async_setup_services(hass)

    return True


async def async_setup_entry(
    hass: HomeAssistant, entry: AqaraLightingConfigEntry
) -> bool:
    """Set up Aqara Advanced Lighting from a config entry."""
    # Verify MQTT integration is loaded
    try:
        await mqtt.async_wait_for_mqtt_client(hass)
    except Exception as ex:
        _LOGGER.error("MQTT integration is not available: %s", ex)
        raise ConfigEntryNotReady("MQTT integration not loaded") from ex

    # Get Z2M base topic from config entry
    z2m_base_topic = entry.data.get(CONF_Z2M_BASE_TOPIC, DEFAULT_Z2M_BASE_TOPIC)

    # Initialize runtime data
    runtime_data = AqaraLightingRuntimeData(
        config_entry=entry,
        z2m_base_topic=z2m_base_topic,
    )

    # Store runtime data in config entry
    entry.runtime_data = runtime_data

    _LOGGER.info(
        "Setting up Aqara Advanced Lighting integration with Z2M topic: %s",
        z2m_base_topic,
    )

    # Initialize MQTT client
    mqtt_client = MQTTClient(hass, entry)
    await mqtt_client.async_setup()

    # Initialize state manager
    state_manager = StateManager(hass)

    # Store components in hass.data for service access
    # Ensure DOMAIN key exists in hass.data
    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {}

    hass.data[DOMAIN]["mqtt_client"] = mqtt_client
    hass.data[DOMAIN]["state_manager"] = state_manager

    _LOGGER.info("Aqara Advanced Lighting integration setup complete")

    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: AqaraLightingConfigEntry
) -> bool:
    """Unload a config entry."""
    _LOGGER.info("Unloading Aqara Advanced Lighting integration")

    # Get MQTT client from hass.data
    mqtt_client = hass.data[DOMAIN].get("mqtt_client")
    if mqtt_client:
        await mqtt_client.async_teardown()

    # Clean up hass.data
    if "mqtt_client" in hass.data[DOMAIN]:
        del hass.data[DOMAIN]["mqtt_client"]
    if "state_manager" in hass.data[DOMAIN]:
        del hass.data[DOMAIN]["state_manager"]

    # Check if this is the last config entry
    remaining_entries = [
        e for e in hass.config_entries.async_entries(DOMAIN) if e.entry_id != entry.entry_id
    ]

    # Unload services only if no more config entries
    if not remaining_entries:
        await async_unload_services(hass)
        hass.data.pop(DOMAIN, None)

    return True


async def async_reload_entry(
    hass: HomeAssistant, entry: AqaraLightingConfigEntry
) -> None:
    """Reload config entry."""
    await async_unload_entry(hass, entry)
    await async_setup_entry(hass, entry)
