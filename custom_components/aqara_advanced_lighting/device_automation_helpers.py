"""Shared helpers for device automation (triggers and conditions)."""

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr

from .const import (
    DATA_PRESET_STORE,
    DOMAIN,
)
from .presets import (
    CCT_SEQUENCE_PRESETS,
    DYNAMIC_SCENE_PRESETS,
    EFFECT_PRESETS,
    SEGMENT_PATTERN_PRESETS,
    SEGMENT_SEQUENCE_PRESETS,
)

def add_user_presets(
    hass: HomeAssistant,
    options: list[dict[str, str]],
    preset_key: str,
) -> None:
    """Add user presets from the global preset store to options list.

    Args:
        hass: Home Assistant instance
        options: List to append options to
        preset_key: Key in preset store (e.g., "cct_sequence_presets")
    """
    preset_store = hass.data.get(DOMAIN, {}).get(DATA_PRESET_STORE)
    if preset_store is None:
        return

    all_presets = preset_store.get_all_presets()
    for preset in all_presets.get(preset_key, []):
        preset_name = preset.get("name")
        if preset_name:
            options.append({"value": preset_name, "label": f"{preset_name} (user)"})

def get_preset_options(
    hass: HomeAssistant,
    automation_type: str,
    cct_types: set[str],
    segment_types: set[str],
    effect_types: set[str],
    dynamic_scene_types: set[str] | None = None,
) -> list[dict[str, str]]:
    """Get preset options relevant to a trigger or condition type.

    Args:
        hass: Home Assistant instance
        automation_type: The trigger or condition type string
        cct_types: Set of CCT-related type strings
        segment_types: Set of segment-related type strings
        effect_types: Set of effect-related type strings
        dynamic_scene_types: Set of dynamic scene-related type strings

    Returns:
        List of SelectOptionDict with value/label pairs
    """
    options: list[dict[str, str]] = []

    if automation_type in cct_types:
        for preset_key, preset_data in CCT_SEQUENCE_PRESETS.items():
            options.append({"value": preset_key, "label": preset_data["name"]})
        add_user_presets(hass, options, "cct_sequence_presets")

    elif automation_type in segment_types:
        for preset_key, preset_data in SEGMENT_SEQUENCE_PRESETS.items():
            options.append({"value": preset_key, "label": preset_data["name"]})
        add_user_presets(hass, options, "segment_sequence_presets")

    elif automation_type in effect_types:
        for preset_key, preset_data in EFFECT_PRESETS.items():
            options.append({"value": preset_key, "label": preset_data["name"]})
        for preset_key, preset_data in SEGMENT_PATTERN_PRESETS.items():
            options.append({"value": preset_key, "label": preset_data["name"]})
        add_user_presets(hass, options, "effect_presets")
        add_user_presets(hass, options, "segment_pattern_presets")

    elif dynamic_scene_types and automation_type in dynamic_scene_types:
        for preset_key, preset_data in DYNAMIC_SCENE_PRESETS.items():
            options.append({"value": preset_key, "label": preset_data["name"]})
        add_user_presets(hass, options, "dynamic_scene_presets")

    return options

def get_entity_ids_for_device(hass: HomeAssistant, device_id: str) -> set[str]:
    """Get all entity IDs that map to a device via our integration.

    Resolves the device's IEEE address from our device registry identifiers,
    then finds entity IDs mapped to that device through the integration's
    entity-to-Z2M mapping.

    Args:
        hass: Home Assistant instance
        device_id: The device ID to look up

    Returns:
        Set of entity IDs belonging to the device
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
