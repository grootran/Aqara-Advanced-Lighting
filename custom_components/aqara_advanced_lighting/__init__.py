"""The Aqara Advanced Lighting integration."""

from __future__ import annotations

import logging

from homeassistant.components import mqtt
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady
from homeassistant.helpers import config_validation as cv

from .cct_sequence_manager import CCTSequenceManager
from .const import (
    CONF_Z2M_BASE_TOPIC,
    DATA_CCT_SEQUENCE_MANAGER,
    DATA_FAVORITES_STORE,
    DATA_PRESET_STORE,
    DATA_SEGMENT_SEQUENCE_MANAGER,
    DEFAULT_Z2M_BASE_TOPIC,
    DOMAIN,
)
from .favorites_store import FavoritesStore
from .preset_store import PresetStore
from .segment_sequence_manager import SegmentSequenceManager
from .models import AqaraLightingConfigEntry, AqaraLightingRuntimeData
from .mqtt_client import MQTTClient
from .panel import async_register_panel
from .services import async_setup_services, async_unload_services
from .state_manager import StateManager

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = []

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the Aqara Advanced Lighting integration."""
    # Initialize domain data storage
    hass.data.setdefault(DOMAIN, {})

    # Initialize favorites store (per-user favorites for the panel)
    # Only initialize if not already present (handles config entry removal/re-add)
    if DATA_FAVORITES_STORE not in hass.data[DOMAIN]:
        favorites_store = FavoritesStore(hass)
        await favorites_store.async_load()
        hass.data[DOMAIN][DATA_FAVORITES_STORE] = favorites_store
        _LOGGER.debug("Favorites store initialized")

    # Initialize preset store (global user-created presets)
    # Only initialize if not already present (handles config entry removal/re-add)
    if DATA_PRESET_STORE not in hass.data[DOMAIN]:
        preset_store = PresetStore(hass)
        await preset_store.async_load()
        hass.data[DOMAIN][DATA_PRESET_STORE] = preset_store
        _LOGGER.debug("Preset store initialized")

    # Register services
    await async_setup_services(hass)

    # Register sidebar panel
    await async_register_panel(hass)

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

    # Initialize state manager and load persisted states
    state_manager = StateManager(hass)
    await state_manager.async_load()

    # Initialize CCT sequence manager (needs mqtt_client for direct Z2M communication)
    cct_sequence_manager = CCTSequenceManager(hass, mqtt_client)

    # Initialize segment sequence manager (needs mqtt_client for direct Z2M communication)
    segment_sequence_manager = SegmentSequenceManager(hass, mqtt_client)

    # Store components in hass.data for service access
    # Ensure DOMAIN key exists in hass.data
    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {}

    hass.data[DOMAIN]["mqtt_client"] = mqtt_client
    hass.data[DOMAIN]["state_manager"] = state_manager
    hass.data[DOMAIN][DATA_CCT_SEQUENCE_MANAGER] = cct_sequence_manager
    hass.data[DOMAIN][DATA_SEGMENT_SEQUENCE_MANAGER] = segment_sequence_manager

    _LOGGER.info("Aqara Advanced Lighting integration setup complete")

    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: AqaraLightingConfigEntry
) -> bool:
    """Unload a config entry."""
    _LOGGER.info("Unloading Aqara Advanced Lighting integration")

    # Get managers from hass.data and cleanup
    cct_manager = hass.data[DOMAIN].get(DATA_CCT_SEQUENCE_MANAGER)
    if cct_manager:
        # Stop all running sequences
        await cct_manager.stop_all_sequences()
        # Cleanup state listeners
        cct_manager.cleanup()

    segment_manager = hass.data[DOMAIN].get(DATA_SEGMENT_SEQUENCE_MANAGER)
    if segment_manager:
        # Stop all running sequences
        await segment_manager.stop_all_sequences()
        # Cleanup state listeners
        segment_manager.cleanup()

    # Get MQTT client from hass.data
    mqtt_client = hass.data[DOMAIN].get("mqtt_client")
    if mqtt_client:
        await mqtt_client.async_teardown()

    # Clean up hass.data
    if "mqtt_client" in hass.data[DOMAIN]:
        del hass.data[DOMAIN]["mqtt_client"]
    if "state_manager" in hass.data[DOMAIN]:
        del hass.data[DOMAIN]["state_manager"]
    if DATA_CCT_SEQUENCE_MANAGER in hass.data[DOMAIN]:
        del hass.data[DOMAIN][DATA_CCT_SEQUENCE_MANAGER]
    if DATA_SEGMENT_SEQUENCE_MANAGER in hass.data[DOMAIN]:
        del hass.data[DOMAIN][DATA_SEGMENT_SEQUENCE_MANAGER]

    # Check if this is the last config entry
    remaining_entries = [
        e for e in hass.config_entries.async_entries(DOMAIN) if e.entry_id != entry.entry_id
    ]

    # Unload services only if no more config entries
    # NOTE: Do NOT remove hass.data[DOMAIN] entirely because it contains
    # integration-level data (preset_store, favorites_store) that should
    # persist even when no config entries exist. The panel and services
    # still need access to these stores.
    if not remaining_entries:
        await async_unload_services(hass)
        _LOGGER.info(
            "Last config entry removed, but keeping integration-level data (presets, favorites)"
        )

    return True


async def async_reload_entry(
    hass: HomeAssistant, entry: AqaraLightingConfigEntry
) -> None:
    """Reload config entry."""
    await async_unload_entry(hass, entry)
    await async_setup_entry(hass, entry)
