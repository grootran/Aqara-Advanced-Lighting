"""State management for effect restoration."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any

from collections.abc import Callable

from homeassistant.const import (
    EVENT_STATE_CHANGED,
    STATE_OFF,
    STATE_ON,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)
from homeassistant.core import Context, Event, HomeAssistant, callback
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

    _SAVE_DEBOUNCE_SECONDS = 0.5

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the state manager."""
        self.hass = hass
        self._states: dict[str, DeviceState] = {}
        self._last_on_attributes: dict[str, dict[str, Any]] = {}
        self._store: Store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._loaded: bool = False
        self._unsub_state_listener: Callable[[], None] | None = None
        self._save_timer: asyncio.TimerHandle | None = None

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

    def _schedule_save(self) -> None:
        """Schedule a debounced save — coalesces rapid mutations into one write."""
        if self._save_timer is not None:
            self._save_timer.cancel()
        loop = self.hass.loop
        self._save_timer = loop.call_later(
            self._SAVE_DEBOUNCE_SECONDS,
            lambda: self.hass.async_create_task(self.async_save()),
        )

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

    def start_tracking(self) -> None:
        """Start tracking light state changes to cache last-known on-state.

        HA's light entity framework strips color attributes when a light is
        off, so we listen for state changes and cache the attributes while
        the light is still on. This allows accurate state capture for lights
        that are off when an effect/scene is started.
        """
        if self._unsub_state_listener:
            return

        @callback
        def _handle_state_changed(event: Event) -> None:
            entity_id = event.data.get("entity_id", "")
            if not entity_id.startswith("light."):
                return
            new_state = event.data.get("new_state")
            if not new_state or new_state.state != STATE_ON:
                return
            self._cache_on_attributes(entity_id, new_state.attributes)

        self._unsub_state_listener = self.hass.bus.async_listen(
            EVENT_STATE_CHANGED, _handle_state_changed
        )

    def stop_tracking(self) -> None:
        """Stop tracking light state changes."""
        if self._unsub_state_listener:
            self._unsub_state_listener()
            self._unsub_state_listener = None

    def _cache_on_attributes(
        self, entity_id: str, attributes: dict[str, Any]
    ) -> None:
        """Cache color/brightness attributes from an on-state light."""
        cached: dict[str, Any] = {}

        if brightness := attributes.get("brightness"):
            cached["brightness"] = brightness
        if xy_color := attributes.get("xy_color"):
            cached["xy_color"] = {"x": xy_color[0], "y": xy_color[1]}
        if rgb_color := attributes.get("rgb_color"):
            cached["color"] = {
                "r": rgb_color[0], "g": rgb_color[1], "b": rgb_color[2],
            }
        if color_temp_kelvin := attributes.get("color_temp_kelvin"):
            cached["color_temp_kelvin"] = color_temp_kelvin
        if color_mode := attributes.get("color_mode"):
            cached["color_mode"] = color_mode

        if cached:
            self._last_on_attributes[entity_id] = cached

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
        state_data["state"] = STATE_ON if state.state == STATE_ON else STATE_OFF

        if state.state == STATE_ON:
            # Light is on - read color attributes directly from HA state
            # and update the cache for future off-state captures
            if brightness := state.attributes.get("brightness"):
                state_data["brightness"] = brightness
            if xy_color := state.attributes.get("xy_color"):
                state_data["xy_color"] = {
                    "x": xy_color[0],
                    "y": xy_color[1],
                }
            if rgb_color := state.attributes.get("rgb_color"):
                state_data["color"] = {
                    "r": rgb_color[0],
                    "g": rgb_color[1],
                    "b": rgb_color[2],
                }
            if color_temp_kelvin := state.attributes.get("color_temp_kelvin"):
                state_data["color_temp_kelvin"] = color_temp_kelvin
            if color_mode := state.attributes.get("color_mode"):
                state_data["color_mode"] = color_mode

            self._cache_on_attributes(entity_id, state.attributes)
        else:
            # Light is off - HA strips color attributes for off lights.
            # Use cached last-known on-state so we can restore the original
            # color when the effect/scene is stopped.
            if cached := self._last_on_attributes.get(entity_id):
                for key in (
                    "brightness", "xy_color", "color",
                    "color_temp_kelvin", "color_mode",
                ):
                    if key in cached:
                        state_data[key] = cached[key]

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
        self._schedule_save()

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
        """Get payload to restore previous state.

        Uses color_mode to determine whether to send RGB or color_temp_kelvin values,
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
        payload["state"] = previous_state.get("state", STATE_OFF)

        # Build color/brightness restoration data from captured attributes.
        # These are populated for both on and off captures (Z2M/ZHA retain
        # last-known values when off).
        if brightness := previous_state.get("brightness"):
            payload["brightness"] = brightness

        # Use color_mode to determine what color values to restore
        color_mode = previous_state.get("color_mode")

        if color_mode in ("color_temp", "ct"):
            # Light was in CCT mode - only restore color temperature
            if color_temp_kelvin := previous_state.get("color_temp_kelvin"):
                payload["color_temp_kelvin"] = color_temp_kelvin
        elif color_mode in ("xy", "rgb", "hs", "rgbw", "rgbww"):
            # Light was in color mode - prefer xy_color for precision
            if xy_color := previous_state.get("xy_color"):
                payload["xy_color"] = xy_color
            elif color := previous_state.get("color"):
                payload["color"] = color
        else:
            # Unknown or no color_mode - prefer color over color_temp to avoid
            # sending conflicting color instructions in the same service call
            if xy_color := previous_state.get("xy_color"):
                payload["xy_color"] = xy_color
            elif color := previous_state.get("color"):
                payload["color"] = color
            elif color_temp_kelvin := previous_state.get("color_temp_kelvin"):
                payload["color_temp_kelvin"] = color_temp_kelvin

        return payload

    async def async_restore_entity_state(
        self,
        entity_id: str,
        *,
        blocking: bool = True,
        context: Context | None = None,
    ) -> bool:
        """Restore a light entity to its previously captured state.

        Reads the stored restoration payload and applies it via HA light
        service calls. Handles on/off, brightness, color, and color
        temperature based on the original color_mode.

        Args:
            entity_id: The Home Assistant light entity ID
            blocking: Whether to wait for the service call to complete
            context: Optional HA context for the service call

        Returns:
            True if state was restored, False if no stored state found.
        """
        payload = self.get_restoration_payload(entity_id)
        if not payload:
            return False

        service_data: dict[str, Any] = {"entity_id": entity_id}

        # Build color/brightness fields from payload
        has_color_data = False

        if "brightness" in payload:
            service_data["brightness"] = payload["brightness"]
            has_color_data = True

        if "xy_color" in payload:
            xy = payload["xy_color"]
            service_data["xy_color"] = [xy["x"], xy["y"]]
            has_color_data = True
        elif "color" in payload:
            color = payload["color"]
            service_data["rgb_color"] = [color["r"], color["g"], color["b"]]
            has_color_data = True

        if "color_temp_kelvin" in payload:
            service_data["color_temp_kelvin"] = payload["color_temp_kelvin"]
            has_color_data = True

        if payload.get("state") == STATE_OFF:
            if has_color_data:
                # Write original color back to hardware before turning off so
                # the device's registers are reset. Without this, the next
                # manual turn-on would show whatever color the effect last
                # programmed. The light is still on from the effect/scene at
                # this point, so this just updates the color in-place.
                await self.hass.services.async_call(
                    "light", "turn_on", service_data,
                    blocking=True, context=context,
                )
                # Brief delay to let the hardware process the color write
                # before turning off. Without this, Zigbee devices (especially
                # segment-capable T1M/T1 Strip) can receive the off command
                # before the color reset finishes, leaving segments in a
                # partially-lit state.
                await asyncio.sleep(0.5)
            await self.hass.services.async_call(
                "light", "turn_off", {"entity_id": entity_id},
                blocking=blocking, context=context,
            )
            return True

        await self.hass.services.async_call(
            "light", "turn_on", service_data,
            blocking=blocking, context=context,
        )
        return True

    def clear_state(self, entity_id: str) -> None:
        """Clear stored state for an entity."""
        if entity_id in self._states:
            del self._states[entity_id]
            _LOGGER.debug("Cleared stored state for %s", entity_id)
            # Schedule save to persistent storage
            self._schedule_save()

    def clear_all_states(self) -> None:
        """Clear all stored states."""
        self._states.clear()
        _LOGGER.debug("Cleared all stored states")
        # Schedule save to persistent storage
        self._schedule_save()

    def get_all_active_effects(self) -> dict[str, DeviceState]:
        """Get all entities with active effects."""
        return {
            entity_id: state
            for entity_id, state in self._states.items()
            if state.effect_active
        }
