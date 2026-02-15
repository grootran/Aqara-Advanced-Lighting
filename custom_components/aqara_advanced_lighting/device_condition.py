"""Device conditions for Aqara Advanced Lighting."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import CONF_DEVICE_ID, CONF_DOMAIN, CONF_TYPE
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv, device_registry as dr
from homeassistant.helpers.condition import ConditionCheckerType
from homeassistant.helpers.selector import SelectSelector, SelectSelectorConfig
from homeassistant.helpers.typing import ConfigType

from .const import (
    CCT_CONDITION_TYPES,
    CONDITION_TYPE_CCT_SEQUENCE_PAUSED,
    CONDITION_TYPE_CCT_SEQUENCE_RUNNING,
    CONDITION_TYPE_DYNAMIC_SCENE_PAUSED,
    CONDITION_TYPE_DYNAMIC_SCENE_RUNNING,
    CONDITION_TYPE_EFFECT_ACTIVE,
    CONDITION_TYPE_MUSIC_SYNC_ACTIVE,
    CONDITION_TYPE_SEGMENT_SEQUENCE_PAUSED,
    CONDITION_TYPE_SEGMENT_SEQUENCE_RUNNING,
    CONDITION_TYPES,
    CONF_PRESET_FILTER,
    DATA_ACTIVE_MUSIC_SYNC,
    DATA_CCT_SEQUENCE_MANAGER,
    DATA_DYNAMIC_SCENE_MANAGER,
    DATA_SEGMENT_SEQUENCE_MANAGER,
    DATA_STATE_MANAGER,
    DOMAIN,
    DYNAMIC_SCENE_CONDITION_TYPES,
    EFFECT_CONDITION_TYPES,
    SEGMENT_CONDITION_TYPES,
)
from .device_automation_helpers import get_entity_ids_for_device, get_preset_options

_LOGGER = logging.getLogger(__name__)

CONDITION_SCHEMA = cv.DEVICE_CONDITION_BASE_SCHEMA.extend(
    {
        vol.Required(CONF_TYPE): vol.In(CONDITION_TYPES),
        vol.Optional(CONF_PRESET_FILTER): cv.string,
    }
)


async def async_get_condition_capabilities(
    hass: HomeAssistant, config: ConfigType
) -> dict[str, vol.Schema]:
    """Return extra fields for condition configuration.

    Provides a dropdown of available presets filtered by condition type.
    Users can select a specific preset to check, or leave empty for any.
    """
    condition_type = config.get(CONF_TYPE)
    if not condition_type:
        return {}

    options = get_preset_options(
        hass,
        condition_type,
        CCT_CONDITION_TYPES,
        SEGMENT_CONDITION_TYPES,
        EFFECT_CONDITION_TYPES,
        DYNAMIC_SCENE_CONDITION_TYPES,
    )

    if not options:
        return {}

    return {
        "extra_fields": vol.Schema(
            {
                vol.Optional(CONF_PRESET_FILTER): SelectSelector(
                    SelectSelectorConfig(
                        options=options,
                        multiple=False,
                        custom_value=True,
                        sort=True,
                    )
                ),
            }
        )
    }


async def async_get_conditions(
    hass: HomeAssistant, device_id: str
) -> list[dict[str, Any]]:
    """Return a list of conditions for this device."""
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
            "condition": "device",
            CONF_DOMAIN: DOMAIN,
            CONF_DEVICE_ID: device_id,
            CONF_TYPE: condition_type,
        }
        for condition_type in sorted(CONDITION_TYPES)
    ]


def _get_managers_for_entity(
    hass: HomeAssistant, entity_id: str
) -> tuple[Any, Any, Any, Any] | None:
    """Get managers for an entity.

    Returns:
        Tuple of (cct_manager, segment_manager, state_manager, dynamic_scene_manager)
        or None if not found.
    """
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.state is not ConfigEntryState.LOADED:
            continue

        runtime_data = entry.runtime_data
        # Check if this entity belongs to this entry
        if entity_id in runtime_data.entity_to_z2m_map:
            instance_data = hass.data.get(DOMAIN, {}).get("entries", {}).get(
                entry.entry_id, {}
            )
            return (
                instance_data.get(DATA_CCT_SEQUENCE_MANAGER),
                instance_data.get(DATA_SEGMENT_SEQUENCE_MANAGER),
                instance_data.get(DATA_STATE_MANAGER),
                instance_data.get(DATA_DYNAMIC_SCENE_MANAGER),
            )

    return None


def _is_music_sync_active(hass: HomeAssistant, entity_id: str) -> bool:
    """Check if music sync is active for an entity.

    Searches across all config entries for active music sync state.
    """
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.state is not ConfigEntryState.LOADED:
            continue

        instance_data = hass.data.get(DOMAIN, {}).get("entries", {}).get(
            entry.entry_id, {}
        )
        active_music_sync = instance_data.get(DATA_ACTIVE_MUSIC_SYNC, {})
        if entity_id in active_music_sync:
            return True

    return False


@callback
def async_condition_from_config(
    hass: HomeAssistant, config: ConfigType
) -> ConditionCheckerType:
    """Create a function to test a device condition."""
    condition_type: str = config[CONF_TYPE]
    device_id: str = config[CONF_DEVICE_ID]
    preset_filter: str | None = config.get(CONF_PRESET_FILTER)

    @callback
    def test_condition(
        hass: HomeAssistant, variables: dict[str, Any] | None = None
    ) -> bool:
        """Test if the condition is satisfied."""
        # Get entity IDs for this device
        entity_ids = get_entity_ids_for_device(hass, device_id)

        if not entity_ids:
            _LOGGER.debug(
                "No entity mappings found for device %s, condition %s returns False",
                device_id,
                condition_type,
            )
            return False

        # Check condition for each entity
        for entity_id in entity_ids:
            managers = _get_managers_for_entity(hass, entity_id)
            if not managers:
                continue

            cct_manager, segment_manager, state_manager, dynamic_scene_manager = managers

            if condition_type == CONDITION_TYPE_CCT_SEQUENCE_RUNNING:
                if cct_manager and cct_manager.is_sequence_running(entity_id):
                    # Check preset filter if specified
                    if preset_filter:
                        current_preset = cct_manager.get_sequence_preset(entity_id)
                        if current_preset == preset_filter:
                            return True
                    else:
                        return True

            elif condition_type == CONDITION_TYPE_CCT_SEQUENCE_PAUSED:
                if cct_manager and cct_manager.is_sequence_paused(entity_id):
                    if preset_filter:
                        current_preset = cct_manager.get_sequence_preset(entity_id)
                        if current_preset == preset_filter:
                            return True
                    else:
                        return True

            elif condition_type == CONDITION_TYPE_SEGMENT_SEQUENCE_RUNNING:
                if segment_manager and segment_manager.is_sequence_running(entity_id):
                    if preset_filter:
                        current_preset = segment_manager.get_sequence_preset(entity_id)
                        if current_preset == preset_filter:
                            return True
                    else:
                        return True

            elif condition_type == CONDITION_TYPE_SEGMENT_SEQUENCE_PAUSED:
                if segment_manager and segment_manager.is_sequence_paused(entity_id):
                    if preset_filter:
                        current_preset = segment_manager.get_sequence_preset(entity_id)
                        if current_preset == preset_filter:
                            return True
                    else:
                        return True

            elif condition_type == CONDITION_TYPE_EFFECT_ACTIVE:
                if state_manager and state_manager.is_effect_active(entity_id):
                    if preset_filter:
                        device_state = state_manager.get_device_state(entity_id)
                        if device_state and device_state.current_preset == preset_filter:
                            return True
                    else:
                        return True

            elif condition_type == CONDITION_TYPE_DYNAMIC_SCENE_RUNNING:
                if dynamic_scene_manager and dynamic_scene_manager.is_scene_running(
                    entity_id
                ):
                    if preset_filter:
                        current_preset = dynamic_scene_manager.get_scene_preset(
                            entity_id
                        )
                        if current_preset == preset_filter:
                            return True
                    else:
                        return True

            elif condition_type == CONDITION_TYPE_DYNAMIC_SCENE_PAUSED:
                if dynamic_scene_manager and dynamic_scene_manager.is_scene_paused(
                    entity_id
                ):
                    if preset_filter:
                        current_preset = dynamic_scene_manager.get_scene_preset(
                            entity_id
                        )
                        if current_preset == preset_filter:
                            return True
                    else:
                        return True

            elif condition_type == CONDITION_TYPE_MUSIC_SYNC_ACTIVE:
                if _is_music_sync_active(hass, entity_id):
                    return True

        return False

    return test_condition
