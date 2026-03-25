"""Diagnostics support for Aqara Advanced Lighting."""

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.const import CONF_API_KEY, CONF_PASSWORD, CONF_TOKEN, CONF_USERNAME
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr

from .const import (
    DATA_ACTIVE_MUSIC_SYNC,
    DATA_CCT_SEQUENCE_MANAGER,
    DATA_DYNAMIC_SCENE_MANAGER,
    DATA_ENTITY_CONTROLLER,
    DATA_FAVORITES_STORE,
    DATA_PRESET_STORE,
    DATA_SEGMENT_SEQUENCE_MANAGER,
    DATA_SEGMENT_ZONE_STORE,
    DATA_USER_PREFERENCES_STORE,
    DOMAIN,
)
from .device_automation_helpers import get_entity_ids_for_device
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

    # Get instance data for this entry
    entry_data = hass.data.get(DOMAIN, {}).get("entries", {}).get(entry.entry_id, {})
    backend = entry_data.get("backend")

    # Build discovered devices list using backend protocol
    discovered_devices = []
    if backend:
        for identifier, aqara_device in backend.get_all_devices().items():
            discovered_devices.append({
                "identifier": identifier,
                "name": aqara_device.name,
                "model_id": aqara_device.model_id,
                "manufacturer": aqara_device.manufacturer,
                "backend_type": aqara_device.backend_type,
            })

    # Build entity mappings from entity routing
    entity_mappings = []
    entity_routing = hass.data.get(DOMAIN, {}).get("entity_routing", {})
    entry_entity_ids = [
        eid for eid, e_entry_id in entity_routing.items()
        if e_entry_id == entry.entry_id
    ]
    for entity_id in entry_entity_ids:
        mapping_info: dict[str, Any] = {"entity_id": entity_id}
        if backend:
            aqara_device = backend.get_device_for_entity(entity_id)
            if aqara_device:
                mapping_info["device_name"] = aqara_device.name
                mapping_info["device_identifier"] = aqara_device.identifier
        # Include Z2M-specific mapping method if available
        if hasattr(runtime_data, "entity_mapping_methods"):
            mapping_info["match_method"] = runtime_data.entity_mapping_methods.get(
                entity_id, "unknown"
            )
        entity_mappings.append(mapping_info)
    state_manager = entry_data.get("state_manager")
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

    # Get CCT sequence manager data for this specific entry
    cct_manager = entry_data.get(DATA_CCT_SEQUENCE_MANAGER)
    active_cct_sequences = []
    if cct_manager:
        for entity_id in cct_manager.get_active_sequence_entities():
            status = cct_manager.get_sequence_status(entity_id)
            if status:
                active_cct_sequences.append(status)

    # Get segment sequence manager data for this specific entry
    segment_manager = entry_data.get(DATA_SEGMENT_SEQUENCE_MANAGER)
    active_segment_sequences = []
    if segment_manager:
        for entity_id in segment_manager.get_active_sequence_entities():
            status = segment_manager.get_sequence_status(entity_id)
            if status:
                active_segment_sequences.append(status)

    # Get dynamic scene manager data for this specific entry
    dynamic_scene_manager = entry_data.get(DATA_DYNAMIC_SCENE_MANAGER)
    active_dynamic_scenes = []
    if dynamic_scene_manager:
        active_scenes = dynamic_scene_manager.get_active_scenes()
        for scene_id, scene_info in active_scenes.items():
            active_dynamic_scenes.append({
                "scene_id": scene_id,
                "entity_ids": list(scene_info.entity_ids),
                "preset_name": scene_info.preset_name,
                "paused": scene_info.paused,
                "loop_iteration": scene_info.loop_iteration,
                "current_color_index": scene_info.current_color_index,
            })

    # Get active music sync entities for this entry
    active_music_sync = entry_data.get(DATA_ACTIVE_MUSIC_SYNC, {})
    music_sync_entities = [
        {"entity_id": eid, **sync_data}
        for eid, sync_data in active_music_sync.items()
    ]

    # Entity controller state (integration-level singleton)
    entity_controller_info: dict[str, Any] = {}
    entity_controller = hass.data.get(DOMAIN, {}).get(DATA_ENTITY_CONTROLLER)
    if entity_controller:
        entity_controller_info = {
            "externally_paused_entities": sorted(
                entity_controller._externally_paused
            ),
            "pending_restore_entities": sorted(
                entity_controller._pending_restore
            ),
            "preset_paused_solar_entities": sorted(
                entity_controller._preset_paused_solar
            ),
        }

    # Store statistics (integration-level singletons)
    store_stats: dict[str, Any] = {}
    domain_data = hass.data.get(DOMAIN, {})

    preset_store = domain_data.get(DATA_PRESET_STORE)
    if preset_store:
        all_presets = preset_store.get_all_presets()
        store_stats["presets"] = {
            preset_type: len(presets)
            for preset_type, presets in all_presets.items()
        }

    favorites_store = domain_data.get(DATA_FAVORITES_STORE)
    if favorites_store:
        store_stats["favorites_users"] = len(favorites_store._data)

    user_prefs_store = domain_data.get(DATA_USER_PREFERENCES_STORE)
    if user_prefs_store:
        store_stats["user_preferences_users"] = len(user_prefs_store._data)

    zone_store = domain_data.get(DATA_SEGMENT_ZONE_STORE)
    if zone_store:
        store_stats["segment_zone_devices"] = len(zone_store._data)

    # Device trigger readiness - shows which devices can resolve entity IDs
    device_registry = dr.async_get(hass)
    device_trigger_info = []
    for device_entry in dr.async_entries_for_config_entry(
        device_registry, entry.entry_id
    ):
        entity_ids = get_entity_ids_for_device(hass, device_entry.id)
        device_trigger_info.append({
            "device_id": device_entry.id,
            "name": device_entry.name,
            "entity_ids_resolved": len(entity_ids),
            "trigger_ready": len(entity_ids) > 0,
        })

    # Build ZHA-specific Zigbee device details
    zha_device_details: list[dict[str, Any]] = []
    if runtime_data.backend_type == "zha" and backend:
        try:
            from homeassistant.components.zha.helpers import get_zha_gateway
            from zigpy.types import EUI64

            gateway = get_zha_gateway(hass)
            for ieee_str, aqara_device in backend.get_all_devices().items():
                ieee = EUI64.convert(ieee_str)
                zha_device = gateway.devices.get(ieee)
                if not zha_device:
                    continue
                zigpy_dev = zha_device.device
                endpoints_info: dict[str, Any] = {}
                for ep_id, ep in zigpy_dev.endpoints.items():
                    if ep_id == 0:
                        continue
                    endpoints_info[str(ep_id)] = {
                        "in_clusters": sorted(ep.in_clusters.keys()),
                        "out_clusters": sorted(ep.out_clusters.keys()),
                        "has_lumi_cluster": 0xFCC0 in ep.in_clusters,
                    }
                zha_device_details.append({
                    "ieee": ieee_str,
                    "name": aqara_device.name,
                    "resolved_model": aqara_device.model_id,
                    "zha_model": zha_device.model,
                    "endpoints": endpoints_info,
                })
        except Exception:  # noqa: BLE001
            zha_device_details = [{"error": "Failed to read ZHA device details"}]

    # Build runtime info
    runtime_info: dict[str, Any] = {
        "backend_type": runtime_data.backend_type,
        "device_count": len(backend.get_all_devices()) if backend else 0,
        "mapped_entity_count": len(entry_entity_ids),
        "entity_mapping_ready": backend.entity_mapping_ready if backend else False,
    }
    if runtime_data.backend_type == "z2m":
        runtime_info["z2m_base_topic"] = runtime_data.z2m_base_topic

    result: dict[str, Any] = {
        "config_entry": {
            "entry_id": entry.entry_id,
            "title": entry.title,
            "version": entry.version,
            "data": async_redact_data(dict(entry.data), TO_REDACT),
        },
        "runtime": runtime_info,
        "discovered_devices": discovered_devices,
        "entity_mappings": entity_mappings,
        "active_effects": active_effects,
        "active_cct_sequences": active_cct_sequences,
        "active_segment_sequences": active_segment_sequences,
        "active_dynamic_scenes": active_dynamic_scenes,
        "active_music_sync": music_sync_entities,
        "entity_controller": entity_controller_info,
        "stores": store_stats,
        "device_triggers": device_trigger_info,
    }

    if zha_device_details:
        result["zha_devices"] = zha_device_details

    return result
