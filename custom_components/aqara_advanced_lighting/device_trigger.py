"""Device triggers for Aqara Advanced Lighting."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.components.device_automation import DEVICE_TRIGGER_BASE_SCHEMA
from homeassistant.components.homeassistant.triggers import event as event_trigger
from homeassistant.const import CONF_DEVICE_ID, CONF_DOMAIN, CONF_PLATFORM, CONF_TYPE
from homeassistant.core import CALLBACK_TYPE, HomeAssistant
from homeassistant.helpers import config_validation as cv, device_registry as dr
from homeassistant.helpers.selector import SelectSelector, SelectSelectorConfig
from homeassistant.helpers.trigger import TriggerActionType, TriggerInfo
from homeassistant.helpers.typing import ConfigType

from .const import (
    CCT_TRIGGER_TYPES,
    CONF_PRESET_FILTER,
    DOMAIN,
    DYNAMIC_SCENE_TRIGGER_TYPES,
    EFFECT_TRIGGER_TYPES,
    EVENT_ATTR_ENTITY_ID,
    EVENT_ATTR_PRESET,
    EVENT_ATTR_SEQUENCE_TYPE,
    EVENT_DYNAMIC_SCENE_FINISHED,
    EVENT_DYNAMIC_SCENE_LOOP_COMPLETED,
    EVENT_DYNAMIC_SCENE_PAUSED,
    EVENT_DYNAMIC_SCENE_RESUMED,
    EVENT_DYNAMIC_SCENE_STARTED,
    EVENT_DYNAMIC_SCENE_STOPPED,
    EVENT_EFFECT_ACTIVATED,
    EVENT_EFFECT_STOPPED,
    EVENT_MUSIC_SYNC_DISABLED,
    EVENT_MUSIC_SYNC_ENABLED,
    EVENT_SEQUENCE_COMPLETED,
    EVENT_SEQUENCE_PAUSED,
    EVENT_SEQUENCE_RESUMED,
    EVENT_SEQUENCE_STARTED,
    EVENT_SEQUENCE_STOPPED,
    EVENT_STEP_CHANGED,
    SEGMENT_TRIGGER_TYPES,
    SEQUENCE_TYPE_CCT,
    SEQUENCE_TYPE_DYNAMIC_SCENE,
    SEQUENCE_TYPE_SEGMENT,
    TRIGGER_TYPE_CCT_SEQUENCE_COMPLETED,
    TRIGGER_TYPE_CCT_SEQUENCE_PAUSED,
    TRIGGER_TYPE_CCT_SEQUENCE_RESUMED,
    TRIGGER_TYPE_CCT_SEQUENCE_STARTED,
    TRIGGER_TYPE_CCT_SEQUENCE_STEP_CHANGED,
    TRIGGER_TYPE_CCT_SEQUENCE_STOPPED,
    TRIGGER_TYPE_DYNAMIC_SCENE_FINISHED,
    TRIGGER_TYPE_DYNAMIC_SCENE_LOOP_COMPLETED,
    TRIGGER_TYPE_DYNAMIC_SCENE_PAUSED,
    TRIGGER_TYPE_DYNAMIC_SCENE_RESUMED,
    TRIGGER_TYPE_DYNAMIC_SCENE_STARTED,
    TRIGGER_TYPE_DYNAMIC_SCENE_STOPPED,
    TRIGGER_TYPE_EFFECT_ACTIVATED,
    TRIGGER_TYPE_EFFECT_STOPPED,
    TRIGGER_TYPE_MUSIC_SYNC_DISABLED,
    TRIGGER_TYPE_MUSIC_SYNC_ENABLED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_COMPLETED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_PAUSED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_RESUMED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STARTED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STEP_CHANGED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STOPPED,
    TRIGGER_TYPES,
)
from .device_automation_helpers import get_entity_ids_for_device, get_preset_options

_LOGGER = logging.getLogger(__name__)

TRIGGER_SCHEMA = DEVICE_TRIGGER_BASE_SCHEMA.extend(
    {
        vol.Required(CONF_TYPE): vol.In(TRIGGER_TYPES),
        vol.Optional(CONF_PRESET_FILTER): vol.All(cv.ensure_list, [cv.string]),
    }
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
    TRIGGER_TYPE_DYNAMIC_SCENE_STARTED: (
        EVENT_DYNAMIC_SCENE_STARTED,
        SEQUENCE_TYPE_DYNAMIC_SCENE,
    ),
    TRIGGER_TYPE_DYNAMIC_SCENE_STOPPED: (
        EVENT_DYNAMIC_SCENE_STOPPED,
        SEQUENCE_TYPE_DYNAMIC_SCENE,
    ),
    TRIGGER_TYPE_DYNAMIC_SCENE_PAUSED: (
        EVENT_DYNAMIC_SCENE_PAUSED,
        SEQUENCE_TYPE_DYNAMIC_SCENE,
    ),
    TRIGGER_TYPE_DYNAMIC_SCENE_RESUMED: (
        EVENT_DYNAMIC_SCENE_RESUMED,
        SEQUENCE_TYPE_DYNAMIC_SCENE,
    ),
    TRIGGER_TYPE_DYNAMIC_SCENE_LOOP_COMPLETED: (
        EVENT_DYNAMIC_SCENE_LOOP_COMPLETED,
        SEQUENCE_TYPE_DYNAMIC_SCENE,
    ),
    TRIGGER_TYPE_DYNAMIC_SCENE_FINISHED: (
        EVENT_DYNAMIC_SCENE_FINISHED,
        SEQUENCE_TYPE_DYNAMIC_SCENE,
    ),
    TRIGGER_TYPE_MUSIC_SYNC_ENABLED: (EVENT_MUSIC_SYNC_ENABLED, None),
    TRIGGER_TYPE_MUSIC_SYNC_DISABLED: (EVENT_MUSIC_SYNC_DISABLED, None),
}


async def async_get_trigger_capabilities(
    hass: HomeAssistant, config: ConfigType
) -> dict[str, vol.Schema]:
    """Return extra fields for trigger configuration.

    Provides a multi-select dropdown of available presets filtered by trigger type.
    Users can select specific presets to filter triggers, or leave empty for any preset.
    """
    trigger_type = config.get(CONF_TYPE)
    if not trigger_type:
        return {}

    options = get_preset_options(
        hass,
        trigger_type,
        CCT_TRIGGER_TYPES,
        SEGMENT_TRIGGER_TYPES,
        EFFECT_TRIGGER_TYPES,
        DYNAMIC_SCENE_TRIGGER_TYPES,
    )

    if not options:
        return {}

    return {
        "extra_fields": vol.Schema(
            {
                vol.Optional(CONF_PRESET_FILTER): SelectSelector(
                    SelectSelectorConfig(
                        options=options,
                        multiple=True,
                        custom_value=True,
                        sort=True,
                    )
                ),
            }
        )
    }


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
    by entity_id (belonging to this device), sequence_type, and optionally
    preset name(s) to match only relevant events for the configured trigger type.
    """
    trigger_type: str = config[CONF_TYPE]
    device_id: str = config[CONF_DEVICE_ID]
    preset_filter: list[str] | None = config.get(CONF_PRESET_FILTER)

    event_type, sequence_type_filter = _TRIGGER_EVENT_MAP[trigger_type]

    # Get entity IDs belonging to this device
    entity_ids = get_entity_ids_for_device(hass, device_id)

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

    unsubs: list[CALLBACK_TYPE] = []

    for entity_id in entity_ids:
        # Build base event data filter for this entity
        base_event_data: dict[str, Any] = {EVENT_ATTR_ENTITY_ID: entity_id}
        if sequence_type_filter is not None:
            base_event_data[EVENT_ATTR_SEQUENCE_TYPE] = sequence_type_filter

        if preset_filter:
            # Create one listener per preset in the filter
            for preset_name in preset_filter:
                event_data = {**base_event_data, EVENT_ATTR_PRESET: preset_name}
                event_config = event_trigger.TRIGGER_SCHEMA(
                    {
                        event_trigger.CONF_PLATFORM: "event",
                        event_trigger.CONF_EVENT_TYPE: event_type,
                        event_trigger.CONF_EVENT_DATA: event_data,
                    }
                )
                unsub = await event_trigger.async_attach_trigger(
                    hass, event_config, action, trigger_info, platform_type="device"
                )
                unsubs.append(unsub)
        else:
            # No preset filter - fires for any preset (or no preset)
            event_config = event_trigger.TRIGGER_SCHEMA(
                {
                    event_trigger.CONF_PLATFORM: "event",
                    event_trigger.CONF_EVENT_TYPE: event_type,
                    event_trigger.CONF_EVENT_DATA: base_event_data,
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
