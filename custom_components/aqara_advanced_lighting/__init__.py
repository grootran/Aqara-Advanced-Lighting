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
    DATA_DYNAMIC_SCENE_MANAGER,
    DATA_ENTITY_CONTROLLER,
    DATA_FAVORITES_STORE,
    DATA_PRESET_STORE,
    DATA_SEGMENT_SEQUENCE_MANAGER,
    DATA_SEGMENT_ZONE_STORE,
    DATA_SERVICE_SCHEMA_MANAGER,
    DATA_USER_PREFERENCES_STORE,
    DEFAULT_Z2M_BASE_TOPIC,
    DOMAIN,
)
from .entity_controller import EntityController
from .dynamic_scene_manager import DynamicSceneManager
from .favorites_store import FavoritesStore
from .preset_store import PresetStore
from .segment_zone_store import SegmentZoneStore
from .user_preferences_store import UserPreferencesStore
from .segment_sequence_manager import SegmentSequenceManager
from .models import AqaraLightingConfigEntry, AqaraLightingRuntimeData
from .mqtt_client import MQTTClient
from .panel import async_register_panel
from .service_schema_manager import ServiceSchemaManager
from .services import async_setup_services, async_unload_services
from .state_manager import StateManager

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = []

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_migrate_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Migrate old config entries to new format."""
    _LOGGER.debug("Migrating entry %s from version %s", entry.entry_id, entry.version)

    # Migrate from version 1.0 to 1.1: Add unique_id based on z2m_base_topic
    if entry.version == 1 and entry.minor_version < 1:
        # Get the z2m_base_topic from entry data
        z2m_base_topic = entry.data.get(CONF_Z2M_BASE_TOPIC, DEFAULT_Z2M_BASE_TOPIC)

        # Set unique_id if not already set
        if not entry.unique_id:
            _LOGGER.info(
                "Migrating config entry %s to add unique_id: %s",
                entry.entry_id,
                z2m_base_topic,
            )
            hass.config_entries.async_update_entry(
                entry,
                unique_id=z2m_base_topic,
                minor_version=1,
            )

        return True

    return True


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the Aqara Advanced Lighting integration."""
    # Initialize domain data storage with multi-instance support
    hass.data.setdefault(DOMAIN, {
        "entries": {},  # entry_id -> instance components (mqtt_client, managers, etc.)
        "entity_routing": {},  # entity_id -> entry_id (for service routing)
    })

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

    # Initialize user preferences store (per-user color history + sort preferences)
    # Only initialize if not already present (handles config entry removal/re-add)
    if DATA_USER_PREFERENCES_STORE not in hass.data[DOMAIN]:
        user_prefs_store = UserPreferencesStore(hass)
        await user_prefs_store.async_load()
        hass.data[DOMAIN][DATA_USER_PREFERENCES_STORE] = user_prefs_store
        _LOGGER.debug("User preferences store initialized")

    # Initialize segment zone store (per-device zone definitions)
    # Only initialize if not already present (handles config entry removal/re-add)
    if DATA_SEGMENT_ZONE_STORE not in hass.data[DOMAIN]:
        zone_store = SegmentZoneStore(hass)
        await zone_store.async_load()
        hass.data[DOMAIN][DATA_SEGMENT_ZONE_STORE] = zone_store
        _LOGGER.debug("Segment zone store initialized")

    # Initialize entity controller for cross-type conflict resolution
    # and external change detection (integration-level singleton)
    if DATA_ENTITY_CONTROLLER not in hass.data[DOMAIN]:
        entity_controller = EntityController(hass)
        entity_controller.setup()
        hass.data[DOMAIN][DATA_ENTITY_CONTROLLER] = entity_controller
        _LOGGER.debug("Entity controller initialized")

    # Register services
    await async_setup_services(hass)

    # Set up dynamic service schema updates for preset dropdowns
    # Must run after services are registered so descriptions are cached
    if DATA_SERVICE_SCHEMA_MANAGER not in hass.data[DOMAIN]:
        schema_manager = ServiceSchemaManager(hass)
        await schema_manager.async_setup()
        hass.data[DOMAIN][DATA_SERVICE_SCHEMA_MANAGER] = schema_manager
        _LOGGER.debug("Service schema manager initialized")

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

    # Get integration-level entity controller
    entity_controller = hass.data[DOMAIN].get(DATA_ENTITY_CONTROLLER)

    # Initialize MQTT client (pass entity controller for context tagging)
    mqtt_client = MQTTClient(hass, entry, entity_controller)
    await mqtt_client.async_setup()

    # Initialize state manager and load persisted states
    state_manager = StateManager(hass)
    await state_manager.async_load()

    # Initialize CCT sequence manager (needs mqtt_client for direct Z2M communication)
    cct_sequence_manager = CCTSequenceManager(hass, mqtt_client, entity_controller)

    # Initialize segment sequence manager (needs mqtt_client for direct Z2M communication)
    segment_sequence_manager = SegmentSequenceManager(hass, mqtt_client, entity_controller)

    # Initialize dynamic scene manager (uses HA light.turn_on for transitions)
    dynamic_scene_manager = DynamicSceneManager(hass, state_manager, entity_controller)

    # Ensure domain data structure exists (handles case where async_setup wasn't called)
    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {
            "entries": {},
            "entity_routing": {},
        }
    if "entries" not in hass.data[DOMAIN]:
        hass.data[DOMAIN]["entries"] = {}
    if "entity_routing" not in hass.data[DOMAIN]:
        hass.data[DOMAIN]["entity_routing"] = {}

    # Store components per-entry for multi-instance support
    hass.data[DOMAIN]["entries"][entry.entry_id] = {
        "mqtt_client": mqtt_client,
        "state_manager": state_manager,
        DATA_CCT_SEQUENCE_MANAGER: cct_sequence_manager,
        DATA_SEGMENT_SEQUENCE_MANAGER: segment_sequence_manager,
        DATA_DYNAMIC_SCENE_MANAGER: dynamic_scene_manager,
    }

    _LOGGER.info(
        "Aqara Advanced Lighting instance setup complete (entry: %s, topic: %s)",
        entry.entry_id,
        z2m_base_topic,
    )

    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: AqaraLightingConfigEntry
) -> bool:
    """Unload a config entry."""
    _LOGGER.info("Unloading Aqara Advanced Lighting instance: %s", entry.entry_id)

    # Get instance data for this entry
    instance_data = hass.data[DOMAIN].get("entries", {}).get(entry.entry_id)
    if instance_data:
        # Get managers from instance data and cleanup
        cct_manager = instance_data.get(DATA_CCT_SEQUENCE_MANAGER)
        if cct_manager:
            # Stop all running sequences
            await cct_manager.stop_all_sequences()
            # Cleanup state listeners
            cct_manager.cleanup()

        segment_manager = instance_data.get(DATA_SEGMENT_SEQUENCE_MANAGER)
        if segment_manager:
            # Stop all running sequences
            await segment_manager.stop_all_sequences()
            # Cleanup state listeners
            segment_manager.cleanup()

        dynamic_scene_manager = instance_data.get(DATA_DYNAMIC_SCENE_MANAGER)
        if dynamic_scene_manager:
            # Stop all running scenes and cleanup (cleanup is synchronous)
            dynamic_scene_manager.cleanup()

        # Get MQTT client from instance data
        mqtt_client = instance_data.get("mqtt_client")
        if mqtt_client:
            await mqtt_client.async_teardown()

        # Remove this entry's data
        del hass.data[DOMAIN]["entries"][entry.entry_id]

    # Clean up entity routing for this entry
    entity_routing = hass.data[DOMAIN].get("entity_routing", {})
    entities_to_remove = [
        entity_id
        for entity_id, eid in entity_routing.items()
        if eid == entry.entry_id
    ]
    for entity_id in entities_to_remove:
        del entity_routing[entity_id]

    # Clean up entity controller when the last config entry is unloaded
    if not hass.data[DOMAIN].get("entries"):
        entity_controller = hass.data[DOMAIN].get(DATA_ENTITY_CONTROLLER)
        if entity_controller:
            entity_controller.cleanup()
            del hass.data[DOMAIN][DATA_ENTITY_CONTROLLER]
            _LOGGER.debug("Entity controller cleaned up (last entry unloaded)")

    # NOTE: Services are NOT unloaded here because they are integration-level
    # (registered in async_setup) and should persist even when config entries
    # are removed or reloaded. Unloading services during config entry reload
    # causes "Unable to remove unknown service" warnings because async_setup()
    # is not called again during reload to re-register them.
    #
    # Integration-level resources (preset_store, favorites_store, services, panel)
    # persist for the lifetime of the integration in Home Assistant and are
    # automatically cleaned up when HA shuts down.

    _LOGGER.info(
        "Config entry %s unloaded, integration-level resources preserved",
        entry.entry_id,
    )

    return True


async def async_reload_entry(
    hass: HomeAssistant, entry: AqaraLightingConfigEntry
) -> None:
    """Reload config entry."""
    await async_unload_entry(hass, entry)
    await async_setup_entry(hass, entry)
