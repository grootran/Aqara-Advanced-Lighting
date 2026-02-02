"""Device triggers for Aqara Advanced Lighting."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.components.device_automation import DEVICE_TRIGGER_BASE_SCHEMA
from homeassistant.components.homeassistant.triggers import event as event_trigger
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import CONF_DEVICE_ID, CONF_DOMAIN, CONF_PLATFORM, CONF_TYPE
from homeassistant.core import CALLBACK_TYPE, HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.trigger import TriggerActionType, TriggerInfo
from homeassistant.helpers.typing import ConfigType

from .const import (
    DOMAIN,
    EVENT_EFFECT_ACTIVATED,
    EVENT_EFFECT_STOPPED,
    EVENT_SEQUENCE_COMPLETED,
    EVENT_SEQUENCE_PAUSED,
    EVENT_SEQUENCE_RESUMED,
    EVENT_SEQUENCE_STARTED,
    EVENT_SEQUENCE_STOPPED,
    EVENT_STEP_CHANGED,
    EVENT_ATTR_ENTITY_ID,
    EVENT_ATTR_SEQUENCE_TYPE,
    SEQUENCE_TYPE_CCT,
    SEQUENCE_TYPE_SEGMENT,
    TRIGGER_TYPE_CCT_SEQUENCE_COMPLETED,
    TRIGGER_TYPE_CCT_SEQUENCE_PAUSED,
    TRIGGER_TYPE_CCT_SEQUENCE_RESUMED,
    TRIGGER_TYPE_CCT_SEQUENCE_STARTED,
    TRIGGER_TYPE_CCT_SEQUENCE_STEP_CHANGED,
    TRIGGER_TYPE_CCT_SEQUENCE_STOPPED,
    TRIGGER_TYPE_EFFECT_ACTIVATED,
    TRIGGER_TYPE_EFFECT_STOPPED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_COMPLETED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_PAUSED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_RESUMED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STARTED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STEP_CHANGED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STOPPED,
    TRIGGER_TYPES,
)

_LOGGER = logging.getLogger(__name__)

TRIGGER_SCHEMA = DEVICE_TRIGGER_BASE_SCHEMA.extend(
    {vol.Required(CONF_TYPE): vol.In(TRIGGER_TYPES)}
)

# Map trigger types to (event_type, sequence_type_filter).
# sequence_type_filter is None for effect triggers (no filtering needed).
_TRIGGER_EVENT_MAP: dict[str, tuple[str, str | None]] = {
    TRIGGER_TYPE_CCT_SEQUENCE_STARTED: (EVENT_SEQUENCE_STARTED, SEQUENCE_TYPE_CCT),
    TRIGGER_TYPE_CCT_SEQUENCE_COMPLETED: (
        EVENT_SEQUENCE_COMPLETED,
        SEQUENCE_TYPE_CCT,
    ),
    TRIGGER_TYPE_CCT_SEQUENCE_STOPPED: (EVENT_SEQUENCE_STOPPED, SEQUENCE_TYPE_CCT),
    TRIGGER_TYPE_CCT_SEQUENCE_STEP_CHANGED: (EVENT_STEP_CHANGED, SEQUENCE_TYPE_CCT),
    TRIGGER_TYPE_CCT_SEQUENCE_PAUSED: (EVENT_SEQUENCE_PAUSED, SEQUENCE_TYPE_CCT),
    TRIGGER_TYPE_CCT_SEQUENCE_RESUMED: (EVENT_SEQUENCE_RESUMED, SEQUENCE_TYPE_CCT),
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STARTED: (
        EVENT_SEQUENCE_STARTED,
        SEQUENCE_TYPE_SEGMENT,
    ),
    TRIGGER_TYPE_SEGMENT_SEQUENCE_COMPLETED: (
        EVENT_SEQUENCE_COMPLETED,
        SEQUENCE_TYPE_SEGMENT,
    ),
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STOPPED: (
        EVENT_SEQUENCE_STOPPED,
        SEQUENCE_TYPE_SEGMENT,
    ),
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STEP_CHANGED: (
        EVENT_STEP_CHANGED,
        SEQUENCE_TYPE_SEGMENT,
    ),
    TRIGGER_TYPE_SEGMENT_SEQUENCE_PAUSED: (
        EVENT_SEQUENCE_PAUSED,
        SEQUENCE_TYPE_SEGMENT,
    ),
    TRIGGER_TYPE_SEGMENT_SEQUENCE_RESUMED: (
        EVENT_SEQUENCE_RESUMED,
        SEQUENCE_TYPE_SEGMENT,
    ),
    TRIGGER_TYPE_EFFECT_ACTIVATED: (EVENT_EFFECT_ACTIVATED, None),
    TRIGGER_TYPE_EFFECT_STOPPED: (EVENT_EFFECT_STOPPED, None),
}


def get_entity_ids_for_device(
    hass: HomeAssistant, device_id: str
) -> set[str]:
    """Get all entity IDs that map to a device via our integration.

    Resolves the device's IEEE address from our device registry identifiers,
    then finds entity IDs mapped to that device through the integration's
    entity-to-Z2M mapping.
    """
    device_registry = dr.async_get(hass)
    device = device_registry.async_get(device_id)
    if not device:
        return set()

    # Find our integration's IEEE address identifier for this device
    ieee_address: str | None = None
    for domain, identifier in device.identifiers:
        if domain == DOMAIN:
            ieee_address = identifier
            break

    if not ieee_address:
        return set()

    # Look through all loaded config entries to find entity mappings
    entity_ids: set[str] = set()
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.state is not ConfigEntryState.LOADED:
            continue

        runtime_data = entry.runtime_data
        z2m_device = runtime_data.devices.get(ieee_address)
        if not z2m_device:
            continue

        # Find entity IDs that map to this Z2M device's friendly name
        for entity_id, friendly_name in runtime_data.entity_to_z2m_map.items():
            if friendly_name == z2m_device.friendly_name:
                entity_ids.add(entity_id)

    return entity_ids


async def async_get_triggers(
    hass: HomeAssistant, device_id: str
) -> list[dict[str, Any]]:
    """Return a list of triggers for this device."""
    device_registry = dr.async_get(hass)
    device = device_registry.async_get(device_id)
    if not device:
        return []

    # Verify this device belongs to our integration
    has_our_identifier = any(
        domain == DOMAIN for domain, _ in device.identifiers
    )
    if not has_our_identifier:
        return []

    return [
        {
            CONF_PLATFORM: "device",
            CONF_DOMAIN: DOMAIN,
            CONF_DEVICE_ID: device_id,
            CONF_TYPE: trigger_type,
        }
        for trigger_type in sorted(TRIGGER_TYPES)
    ]


async def async_attach_trigger(
    hass: HomeAssistant,
    config: ConfigType,
    action: TriggerActionType,
    trigger_info: TriggerInfo,
) -> CALLBACK_TYPE:
    """Attach a trigger.

    Connects device triggers to the Home Assistant event bus. Filters events
    by entity_id (belonging to this device) and sequence_type to match only
    relevant events for the configured trigger type.
    """
    trigger_type: str = config[CONF_TYPE]
    device_id: str = config[CONF_DEVICE_ID]

    event_type, sequence_type_filter = _TRIGGER_EVENT_MAP[trigger_type]

    # Get entity IDs belonging to this device
    entity_ids = get_entity_ids_for_device(hass, device_id)

    # Build base event data filter
    event_data: dict[str, Any] = {}
    if sequence_type_filter is not None:
        event_data[EVENT_ATTR_SEQUENCE_TYPE] = sequence_type_filter

    if not entity_ids:
        _LOGGER.debug(
            "No entity mappings found for device %s, trigger %s will not"
            " fire until entity mapping is established and automations"
            " are reloaded",
            device_id,
            trigger_type,
        )
        # Return a no-op unsub callback since there is nothing to listen for.
        # When entity mapping completes (after Z2M discovery), the integration
        # will reload and triggers will be reattached with valid entity IDs.
        return lambda: None

    if len(entity_ids) == 1:
        # Single entity: use direct event_data matching
        event_data[EVENT_ATTR_ENTITY_ID] = next(iter(entity_ids))
        event_config = event_trigger.TRIGGER_SCHEMA(
            {
                event_trigger.CONF_PLATFORM: "event",
                event_trigger.CONF_EVENT_TYPE: event_type,
                event_trigger.CONF_EVENT_DATA: event_data,
            }
        )
        return await event_trigger.async_attach_trigger(
            hass, event_config, action, trigger_info, platform_type="device"
        )

    # Multiple entities: attach a listener per entity
    unsubs: list[CALLBACK_TYPE] = []
    for entity_id in entity_ids:
        per_entity_data = {**event_data, EVENT_ATTR_ENTITY_ID: entity_id}
        event_config = event_trigger.TRIGGER_SCHEMA(
            {
                event_trigger.CONF_PLATFORM: "event",
                event_trigger.CONF_EVENT_TYPE: event_type,
                event_trigger.CONF_EVENT_DATA: per_entity_data,
            }
        )
        unsub = await event_trigger.async_attach_trigger(
            hass, event_config, action, trigger_info, platform_type="device"
        )
        unsubs.append(unsub)

    def _unsub_all() -> None:
        for unsub in unsubs:
            unsub()

    return _unsub_all
