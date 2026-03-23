"""Entity-to-config-entry routing helpers.

Centralises the two-phase lookup (fast routing map, then fallback scan)
that was previously duplicated in services.py, transition_utils.py, and
device_condition.py.
"""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant

from .const import DOMAIN


def get_instance_for_entity(
    hass: HomeAssistant, entity_id: str
) -> tuple[str | None, dict[str, Any] | None]:
    """Get the config entry ID and instance data for an entity.

    Uses the entity routing map for O(1) lookup, falling back to a
    linear scan of all loaded instances when the map is stale.

    Returns:
        Tuple of (entry_id, instance_data) or (None, None) if not found.
    """
    if DOMAIN not in hass.data:
        return None, None

    # Fast path: entity routing map
    entity_routing = hass.data[DOMAIN].get("entity_routing", {})
    if entity_id in entity_routing:
        entry_id = entity_routing[entity_id]
        instance_data = hass.data[DOMAIN].get("entries", {}).get(entry_id)
        if instance_data:
            return entry_id, instance_data

    # Fallback: search all instances
    entries = hass.data[DOMAIN].get("entries", {})
    for entry_id, instance_data in entries.items():
        backend = instance_data.get("backend")
        if backend and backend.get_device_for_entity(entity_id):
            # Cache for faster future lookups
            entity_routing[entity_id] = entry_id
            return entry_id, instance_data

    return None, None
