"""Centralized entity control for Aqara Advanced Lighting.

Manages cross-type conflict resolution and external change detection
for all continuous action types (dynamic scenes, CCT sequences,
segment sequences). Replaces per-manager state listeners with a single
centralized listener that uses HA Context to distinguish integration
service calls from external changes.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.const import STATE_OFF
from homeassistant.core import Context, Event, HomeAssistant, callback

from .const import (
    DATA_CCT_SEQUENCE_MANAGER,
    DATA_DYNAMIC_SCENE_MANAGER,
    DATA_SEGMENT_SEQUENCE_MANAGER,
    DOMAIN,
    EVENT_ATTR_ENTITY_ID,
    EVENT_ATTR_REASON,
    EVENT_ENTITY_CONTROL_RESUMED,
    EVENT_ENTITY_EXTERNALLY_CONTROLLED,
    INTEGRATION_CONTEXT_PARENT_ID,
)

if TYPE_CHECKING:
    from .cct_sequence_manager import CCTSequenceManager
    from .dynamic_scene_manager import DynamicSceneManager
    from .segment_sequence_manager import SegmentSequenceManager

_LOGGER = logging.getLogger(__name__)


class EntityController:
    """Centralized controller for entity conflict resolution and external change detection.

    This is an integration-level singleton (stored in hass.data[DOMAIN])
    that coordinates across all config entry instances.
    """

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the entity controller."""
        self.hass = hass
        self._externally_paused: set[str] = set()
        self._state_listener_remove: Any | None = None

    def setup(self) -> None:
        """Set up the centralized state change listener."""

        @callback
        def _async_state_changed(event: Event) -> None:
            """Handle state changes for light entities controlled by this integration."""
            entity_id: str | None = event.data.get("entity_id")
            new_state = event.data.get("new_state")
            if not entity_id or not new_state:
                return

            # Only process light entities
            if not entity_id.startswith("light."):
                return

            # Check if this entity is under control of any manager
            if not self._is_entity_controlled(entity_id):
                return

            # Check if the state change came from this integration
            if event.context.parent_id == INTEGRATION_CONTEXT_PARENT_ID:
                return

            # External change detected
            if new_state.state == STATE_OFF:
                # Light turned off externally - stop the controlling action
                _LOGGER.info(
                    "Light %s turned off externally, stopping controlling action",
                    entity_id,
                )
                self.hass.async_create_task(
                    self._stop_entity_action(entity_id, reason="external_off")
                )
            else:
                # Attribute change (brightness, color, etc.) - pause entity
                _LOGGER.info(
                    "External change detected on %s, pausing entity control",
                    entity_id,
                )
                self._pause_entity(entity_id)

        self._state_listener_remove = self.hass.bus.async_listen(
            "state_changed", _async_state_changed
        )
        _LOGGER.debug("Entity controller state listener registered")

    def create_context(self) -> Context:
        """Create a Context tagged with the integration marker.

        Each call gets a unique auto-generated ULID as its id,
        but shares the parent_id marker for identification.
        """
        return Context(parent_id=INTEGRATION_CONTEXT_PARENT_ID)

    async def stop_all_for_entity(self, entity_id: str) -> None:
        """Stop all running continuous actions on an entity across all instances.

        Called before starting a new continuous action to ensure no
        conflicting actions are running on the same entity.

        For dynamic scenes: detaches entity (scene continues for others).
        For CCT/segment sequences: stops the sequence for that entity.
        """
        self._externally_paused.discard(entity_id)

        for instance_data in self.hass.data[DOMAIN].get("entries", {}).values():
            # Detach from dynamic scene (scene continues for other entities)
            dsm: DynamicSceneManager | None = instance_data.get(
                DATA_DYNAMIC_SCENE_MANAGER
            )
            if dsm and dsm.is_scene_running(entity_id):
                dsm.detach_entity(entity_id)

            # Stop CCT sequence
            cct: CCTSequenceManager | None = instance_data.get(
                DATA_CCT_SEQUENCE_MANAGER
            )
            if cct and cct.is_sequence_running(entity_id):
                await cct.stop_sequence(entity_id)

            # Stop segment sequence
            seg: SegmentSequenceManager | None = instance_data.get(
                DATA_SEGMENT_SEQUENCE_MANAGER
            )
            if seg and seg.is_sequence_running(entity_id):
                await seg.stop_sequence(entity_id)

    def is_entity_externally_paused(self, entity_id: str) -> bool:
        """Check if an entity is paused due to external change."""
        return entity_id in self._externally_paused

    async def resume_entity(self, entity_id: str) -> bool:
        """Resume control of an externally paused entity.

        Returns True if the entity was resumed, False if it wasn't paused.
        """
        if entity_id not in self._externally_paused:
            _LOGGER.debug("Entity %s is not externally paused", entity_id)
            return False

        self._externally_paused.discard(entity_id)

        # Resume in the controlling manager
        for instance_data in self.hass.data[DOMAIN].get("entries", {}).values():
            dsm: DynamicSceneManager | None = instance_data.get(
                DATA_DYNAMIC_SCENE_MANAGER
            )
            if dsm and dsm.is_scene_running(entity_id):
                dsm.externally_resume_entity(entity_id)
                break

            cct: CCTSequenceManager | None = instance_data.get(
                DATA_CCT_SEQUENCE_MANAGER
            )
            if cct and cct.is_sequence_running(entity_id):
                cct.resume_sequence(entity_id)
                break

            seg: SegmentSequenceManager | None = instance_data.get(
                DATA_SEGMENT_SEQUENCE_MANAGER
            )
            if seg and seg.is_sequence_running(entity_id):
                seg.resume_sequence(entity_id)
                break

        self.hass.bus.async_fire(
            EVENT_ENTITY_CONTROL_RESUMED,
            {EVENT_ATTR_ENTITY_ID: entity_id},
        )

        _LOGGER.info("Resumed entity control for %s", entity_id)
        return True

    def clear_entity(self, entity_id: str) -> None:
        """Clear tracking when an entity's controlling action stops.

        Called by managers during cleanup to remove stale tracking.
        """
        self._externally_paused.discard(entity_id)

    def cleanup(self) -> None:
        """Remove listener and clear state.

        Called when the last config entry unloads.
        """
        if self._state_listener_remove:
            self._state_listener_remove()
            self._state_listener_remove = None
        self._externally_paused.clear()
        _LOGGER.debug("Entity controller cleaned up")

    def _is_entity_controlled(self, entity_id: str) -> bool:
        """Check if an entity is currently controlled by any continuous action manager."""
        for instance_data in self.hass.data[DOMAIN].get("entries", {}).values():
            dsm: DynamicSceneManager | None = instance_data.get(
                DATA_DYNAMIC_SCENE_MANAGER
            )
            if dsm and dsm.is_scene_running(entity_id):
                return True

            cct: CCTSequenceManager | None = instance_data.get(
                DATA_CCT_SEQUENCE_MANAGER
            )
            if cct and cct.is_sequence_running(entity_id):
                return True

            seg: SegmentSequenceManager | None = instance_data.get(
                DATA_SEGMENT_SEQUENCE_MANAGER
            )
            if seg and seg.is_sequence_running(entity_id):
                return True

        return False

    def _pause_entity(self, entity_id: str) -> None:
        """Pause control of a single entity due to external change."""
        if entity_id in self._externally_paused:
            return

        self._externally_paused.add(entity_id)

        # Pause in the controlling manager
        for instance_data in self.hass.data[DOMAIN].get("entries", {}).values():
            dsm: DynamicSceneManager | None = instance_data.get(
                DATA_DYNAMIC_SCENE_MANAGER
            )
            if dsm and dsm.is_scene_running(entity_id):
                dsm.externally_pause_entity(entity_id)
                break

            cct: CCTSequenceManager | None = instance_data.get(
                DATA_CCT_SEQUENCE_MANAGER
            )
            if cct and cct.is_sequence_running(entity_id):
                cct.pause_sequence(entity_id)
                break

            seg: SegmentSequenceManager | None = instance_data.get(
                DATA_SEGMENT_SEQUENCE_MANAGER
            )
            if seg and seg.is_sequence_running(entity_id):
                seg.pause_sequence(entity_id)
                break

        self.hass.bus.async_fire(
            EVENT_ENTITY_EXTERNALLY_CONTROLLED,
            {
                EVENT_ATTR_ENTITY_ID: entity_id,
                EVENT_ATTR_REASON: "external_change",
            },
        )

    async def _stop_entity_action(self, entity_id: str, reason: str) -> None:
        """Stop the controlling action for an entity entirely.

        Used when a light is turned off externally.
        """
        self._externally_paused.discard(entity_id)

        for instance_data in self.hass.data[DOMAIN].get("entries", {}).values():
            dsm: DynamicSceneManager | None = instance_data.get(
                DATA_DYNAMIC_SCENE_MANAGER
            )
            if dsm and dsm.is_scene_running(entity_id):
                dsm.detach_entity(entity_id)

            cct: CCTSequenceManager | None = instance_data.get(
                DATA_CCT_SEQUENCE_MANAGER
            )
            if cct and cct.is_sequence_running(entity_id):
                await cct.stop_sequence(entity_id)

            seg: SegmentSequenceManager | None = instance_data.get(
                DATA_SEGMENT_SEQUENCE_MANAGER
            )
            if seg and seg.is_sequence_running(entity_id):
                await seg.stop_sequence(entity_id)

        self.hass.bus.async_fire(
            EVENT_ENTITY_EXTERNALLY_CONTROLLED,
            {
                EVENT_ATTR_ENTITY_ID: entity_id,
                EVENT_ATTR_REASON: reason,
            },
        )
