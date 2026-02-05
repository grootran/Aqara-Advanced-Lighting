"""State management for effect restoration."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any

from homeassistant.const import (
    ATTR_ENTITY_ID,
    STATE_OFF,
    STATE_ON,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)
from homeassistant.core import HomeAssistant, State
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .models import DeviceState, DynamicEffect

_LOGGER = logging.getLogger(__name__)

# Storage configuration
STORAGE_VERSION = 1
STORAGE_KEY = f"{DOMAIN}.state_manager"
STATE_EXPIRY_HOURS = 24


class StateManager:
    """Manage device states for restoration after effects."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the state manager."""
        self.hass = hass
        self._states: dict[str, DeviceState] = {}
        self._store: Store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._loaded: bool = False

    async def async_load(self) -> None:
        """Load stored states from persistent storage."""
        if self._loaded:
            return

        try:
            stored_data = await self._store.async_load()
            if stored_data:
                self._load_states_from_data(stored_data)
            self._loaded = True
            _LOGGER.debug("Loaded %d stored states from persistent storage", len(self._states))
        except Exception as ex:
            _LOGGER.warning("Failed to load stored states: %s", ex)
            self._loaded = True

    def _load_states_from_data(self, data: dict[str, Any]) -> None:
        """Load states from stored data, expiring old entries."""
        states_data = data.get("states", {})
        expiry_threshold = dt_util.utcnow() - timedelta(hours=STATE_EXPIRY_HOURS)

        for entity_id, state_data in states_data.items():
            # Check if entry has expired
            timestamp_str = state_data.get("timestamp")
            if timestamp_str:
                try:
                    timestamp = datetime.fromisoformat(timestamp_str)
                    if timestamp < expiry_threshold:
                        _LOGGER.debug(
                            "Skipping expired state for %s (captured %s)",
                            entity_id,
                            timestamp_str,
                        )
                        continue
                except (ValueError, TypeError):
                    pass  # If timestamp is invalid, load anyway

            # Recreate DeviceState
            try:
                device_state = DeviceState(
                    entity_id=state_data["entity_id"],
                    z2m_friendly_name=state_data["z2m_friendly_name"],
                    previous_state=state_data["previous_state"],
                    effect_active=state_data.get("effect_active", False),
                    current_effect=None,  # Don't restore active effects on restart
                )
                self._states[entity_id] = device_state
            except (KeyError, TypeError) as ex:
                _LOGGER.debug("Skipping invalid state data for %s: %s", entity_id, ex)

    async def async_save(self) -> None:
        """Save states to persistent storage."""
        states_data = {}
        timestamp = dt_util.utcnow().isoformat()

        for entity_id, device_state in self._states.items():
            states_data[entity_id] = {
                "entity_id": device_state.entity_id,
                "z2m_friendly_name": device_state.z2m_friendly_name,
                "previous_state": device_state.previous_state,
                "effect_active": device_state.effect_active,
                "timestamp": timestamp,
            }

        try:
            await self._store.async_save({"states": states_data})
            _LOGGER.debug("Saved %d states to persistent storage", len(states_data))
        except Exception as ex:
            _LOGGER.warning("Failed to save states: %s", ex)

    def capture_state(
        self, entity_id: str, z2m_friendly_name: str
    ) -> DeviceState | None:
        """Capture current light state before applying effect.

        Returns:
            DeviceState object if successfully captured, None otherwise.
        """
        # Get current state from Home Assistant
        state = self.hass.states.get(entity_id)

        if not state or state.state in (STATE_UNKNOWN, STATE_UNAVAILABLE):
            _LOGGER.debug(
                "Cannot capture state for %s: state is %s (this is normal if the device is offline or Home Assistant just started)",
                entity_id,
                state.state if state else "None",
            )
            return None

        # Build state data for restoration
        state_data: dict[str, Any] = {}

        # Capture on/off state
        if state.state == STATE_ON:
            state_data["state"] = STATE_ON

            # Capture brightness if available
            if brightness := state.attributes.get("brightness"):
                state_data["brightness"] = brightness

            # Capture color if available (RGB)
            if rgb_color := state.attributes.get("rgb_color"):
                state_data["color"] = {
                    "r": rgb_color[0],
                    "g": rgb_color[1],
                    "b": rgb_color[2],
                }

            # Capture color temperature if available
            if color_temp := state.attributes.get("color_temp"):
                state_data["color_temp"] = color_temp

            # Capture color mode to know whether light was in RGB or CCT mode
            if color_mode := state.attributes.get("color_mode"):
                state_data["color_mode"] = color_mode

        else:
            state_data["state"] = STATE_OFF

        # Create device state object
        device_state = DeviceState(
            entity_id=entity_id,
            z2m_friendly_name=z2m_friendly_name,
            previous_state=state_data,
            effect_active=False,
        )

        # Store in registry
        self._states[entity_id] = device_state

        _LOGGER.debug(
            "Captured state for %s: %s", entity_id, state_data
        )

        # Schedule save to persistent storage
        self.hass.async_create_task(self.async_save())

        return device_state

    def mark_effect_active(
        self, entity_id: str, effect: DynamicEffect | None, preset: str | None = None
    ) -> None:
        """Mark an effect as active for an entity.

        Args:
            entity_id: The entity to mark active
            effect: The DynamicEffect object (None for segment patterns)
            preset: Optional preset name for event tracking
        """
        if entity_id not in self._states:
            _LOGGER.warning(
                "Cannot mark effect active: no state captured for %s", entity_id
            )
            return

        self._states[entity_id].effect_active = True
        self._states[entity_id].current_effect = effect
        self._states[entity_id].current_preset = preset

        _LOGGER.debug(
            "Marked effect %s active for %s (preset=%s)",
            effect.effect if effect else "segment_pattern",
            entity_id,
            preset,
        )

    def mark_effect_inactive(self, entity_id: str) -> str | None:
        """Mark effect as inactive for an entity.

        Returns:
            The preset name that was active, or None if no preset was set.
        """
        preset = None
        if entity_id in self._states:
            preset = self._states[entity_id].current_preset
            self._states[entity_id].effect_active = False
            self._states[entity_id].current_effect = None
            self._states[entity_id].current_preset = None
            _LOGGER.debug("Marked effect inactive for %s (was preset=%s)", entity_id, preset)
        return preset

    def get_device_state(self, entity_id: str) -> DeviceState | None:
        """Get stored device state."""
        return self._states.get(entity_id)

    def has_stored_state(self, entity_id: str) -> bool:
        """Check if there is a stored state for an entity."""
        return entity_id in self._states

    def is_effect_active(self, entity_id: str) -> bool:
        """Check if an effect is currently active for an entity."""
        if entity_id not in self._states:
            return False
        return self._states[entity_id].effect_active

    def get_restoration_payload(self, entity_id: str) -> dict[str, Any] | None:
        """Get MQTT payload to restore previous state.

        Uses color_mode to determine whether to send RGB or color_temp values,
        ensuring accurate restoration for lights that support both modes (e.g., T2 bulbs).

        Returns:
            Dict with MQTT payload for state restoration, or None if no state stored.
        """
        if entity_id not in self._states:
            _LOGGER.warning("No stored state for %s", entity_id)
            return None

        device_state = self._states[entity_id]
        previous_state = device_state.previous_state

        # Build restoration payload
        payload: dict[str, Any] = {}

        # Handle on/off state
        if previous_state.get("state") == STATE_OFF:
            payload["state"] = STATE_OFF
            return payload

        # Light was on, restore its properties
        payload["state"] = STATE_ON

        if brightness := previous_state.get("brightness"):
            payload["brightness"] = brightness

        # Use color_mode to determine what color values to restore
        color_mode = previous_state.get("color_mode")

        if color_mode in ("color_temp", "ct"):
            # Light was in CCT mode - only restore color_temp
            if color_temp := previous_state.get("color_temp"):
                payload["color_temp"] = color_temp
        elif color_mode in ("xy", "rgb", "hs", "rgbw", "rgbww"):
            # Light was in color mode - only restore color
            if color := previous_state.get("color"):
                payload["color"] = color
        else:
            # Unknown or no color_mode - restore both if available (legacy behavior)
            if color := previous_state.get("color"):
                payload["color"] = color
            if color_temp := previous_state.get("color_temp"):
                payload["color_temp"] = color_temp

        return payload

    def clear_state(self, entity_id: str) -> None:
        """Clear stored state for an entity."""
        if entity_id in self._states:
            del self._states[entity_id]
            _LOGGER.debug("Cleared stored state for %s", entity_id)
            # Schedule save to persistent storage
            self.hass.async_create_task(self.async_save())

    def clear_all_states(self) -> None:
        """Clear all stored states."""
        self._states.clear()
        _LOGGER.debug("Cleared all stored states")
        # Schedule save to persistent storage
        self.hass.async_create_task(self.async_save())

    def get_all_active_effects(self) -> dict[str, DeviceState]:
        """Get all entities with active effects."""
        return {
            entity_id: state
            for entity_id, state in self._states.items()
            if state.effect_active
        }
