"""Shared utilities for software-interpolated transitions.

T1-family devices (T1M, T1 Strip) don't fully support hardware transitions.
These utilities provide cubic easing, step interval calculation, and entity
model resolution used by both Zigbee backends and the dynamic scene manager.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from .const import (
    DOMAIN,
    SOFTWARE_TRANSITION_T1M_INTERVAL,
    SOFTWARE_TRANSITION_T1_STRIP_INTERVAL,
    T1M_MODELS,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant


def ease_in_out_cubic(t: float) -> float:
    """Cubic easing function for smooth transitions.

    Args:
        t: Progress from 0.0 to 1.0

    Returns:
        Eased value from 0.0 to 1.0
    """
    if t < 0.5:
        return 4 * t * t * t
    return 1 - pow(-2 * t + 2, 3) / 2


def get_software_step_interval(model_id: str, transition: float) -> float:
    """Calculate the step interval for software-interpolated transitions.

    Balances visual smoothness against Zigbee network load. Shorter
    transitions use smaller intervals for smooth appearance, while longer
    transitions use larger intervals to reduce command traffic.

    Args:
        model_id: Device model ID to determine minimum interval
        transition: Total transition duration in seconds

    Returns:
        Step interval in seconds
    """
    if transition <= 10:
        interval = 0.5
    elif transition <= 60:
        interval = 1.0
    elif transition <= 300:
        interval = 2.0
    else:
        interval = 5.0

    # Enforce per-model minimum interval
    min_interval = (
        SOFTWARE_TRANSITION_T1M_INTERVAL
        if model_id in T1M_MODELS
        else SOFTWARE_TRANSITION_T1_STRIP_INTERVAL
    )
    return max(interval, min_interval)


def get_entity_model_id(hass: HomeAssistant, entity_id: str) -> str | None:
    """Resolve an entity ID to its Aqara device model ID.

    Uses entity routing and backend device lookup to find the model
    without requiring a direct backend reference.

    Args:
        hass: Home Assistant instance
        entity_id: The Home Assistant entity ID

    Returns:
        Model ID string (e.g. "lumi.light.acn031") or None if not found
    """
    if DOMAIN not in hass.data:
        return None

    # Fast path: use entity routing map
    entity_routing = hass.data[DOMAIN].get("entity_routing", {})
    entry_id = entity_routing.get(entity_id)

    if entry_id:
        instance_data = hass.data[DOMAIN].get("entries", {}).get(entry_id)
        if instance_data:
            backend = instance_data.get("backend")
            if backend:
                device = backend.get_device_for_entity(entity_id)
                if device:
                    return device.model_id

    # Fallback: search all instances
    entries = hass.data[DOMAIN].get("entries", {})
    for eid, instance_data in entries.items():
        backend = instance_data.get("backend")
        if backend:
            device = backend.get_device_for_entity(entity_id)
            if device:
                # Update routing cache for next time
                entity_routing[entity_id] = eid
                return device.model_id

    return None
