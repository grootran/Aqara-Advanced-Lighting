"""Diagnostics support for Aqara Advanced Lighting."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.const import CONF_API_KEY, CONF_PASSWORD, CONF_TOKEN, CONF_USERNAME
from homeassistant.core import HomeAssistant

from .const import DATA_CCT_SEQUENCE_MANAGER, DOMAIN
from .models import AqaraLightingConfigEntry

# Fields to redact from diagnostics output
TO_REDACT = {
    CONF_API_KEY,
    CONF_PASSWORD,
    CONF_TOKEN,
    CONF_USERNAME,
    "api_key",
    "password",
    "token",
    "secret",
}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: AqaraLightingConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for a config entry.

    This provides useful information for debugging issues with the integration.
    Sensitive data is automatically redacted.
    """
    runtime_data = entry.runtime_data

    # Build discovered devices list with relevant info
    discovered_devices = []
    for ieee_address, device in runtime_data.devices.items():
        discovered_devices.append({
            "ieee_address": ieee_address,
            "friendly_name": device.friendly_name,
            "model_id": device.model_id,
            "manufacturer": device.manufacturer,
            "supported": device.supported,
        })

    # Build entity mappings
    entity_mappings = []
    for entity_id, z2m_name in runtime_data.entity_to_z2m_map.items():
        entity_mappings.append({
            "entity_id": entity_id,
            "z2m_friendly_name": z2m_name,
        })

    # Get state manager data
    state_manager = hass.data.get(DOMAIN, {}).get("state_manager")
    active_effects = []
    if state_manager:
        for entity_id, device_state in state_manager.get_all_active_effects().items():
            effect_info: dict[str, Any] = {
                "entity_id": entity_id,
                "z2m_friendly_name": device_state.z2m_friendly_name,
                "effect_active": device_state.effect_active,
            }
            if device_state.current_effect:
                effect_info["effect"] = {
                    "type": device_state.current_effect.effect.value,
                    "speed": device_state.current_effect.effect_speed,
                    "color_count": len(device_state.current_effect.effect_colors),
                    "segments": device_state.current_effect.effect_segments,
                }
            active_effects.append(effect_info)

    # Get CCT sequence manager data
    cct_manager = hass.data.get(DOMAIN, {}).get(DATA_CCT_SEQUENCE_MANAGER)
    active_sequences = []
    if cct_manager:
        for entity_id in cct_manager._active_sequences:
            active_sequences.append({
                "entity_id": entity_id,
                "running": True,
            })

    return {
        "config_entry": {
            "entry_id": entry.entry_id,
            "title": entry.title,
            "version": entry.version,
            "data": async_redact_data(dict(entry.data), TO_REDACT),
        },
        "runtime": {
            "z2m_base_topic": runtime_data.z2m_base_topic,
            "device_count": len(runtime_data.devices),
            "mapped_entity_count": len(runtime_data.entity_to_z2m_map),
        },
        "discovered_devices": discovered_devices,
        "entity_mappings": entity_mappings,
        "active_effects": active_effects,
        "active_cct_sequences": active_sequences,
    }
