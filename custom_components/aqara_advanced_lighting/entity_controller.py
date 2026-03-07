"""Centralized entity control for Aqara Advanced Lighting.

Manages cross-type conflict resolution and external change detection
for all continuous action types (dynamic scenes, CCT sequences,
segment sequences). Replaces per-manager state listeners with a single
centralized listener that uses HA Context to distinguish integration
service calls from external changes.
"""

from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Callable, Coroutine
from typing import TYPE_CHECKING, Any

from homeassistant.const import STATE_OFF, STATE_UNAVAILABLE
from homeassistant.core import Context, Event, HomeAssistant, State, callback

from .const import (
    DATA_CCT_SEQUENCE_MANAGER,
    DATA_DYNAMIC_SCENE_MANAGER,
    DATA_SEGMENT_SEQUENCE_MANAGER,
    DATA_STATE_MANAGER,
    DATA_USER_PREFERENCES_STORE,
    DOMAIN,
    EVENT_ATTR_ENTITY_ID,
    EVENT_ATTR_PRESET,
    EVENT_ATTR_REASON,
    EVENT_EFFECT_STOPPED,
    EVENT_ENTITY_CONTROL_RESUMED,
    EVENT_ENTITY_EXTERNALLY_CONTROLLED,
    INTEGRATION_CONTEXT_PARENT_ID,
    OverrideAttributes,
)

if TYPE_CHECKING:
    from .backend_protocol import DeviceBackend
    from .cct_sequence_manager import CCTSequenceManager
    from .dynamic_scene_manager import DynamicSceneManager
    from .segment_sequence_manager import SegmentSequenceManager
    from .state_manager import StateManager

_LOGGER = logging.getLogger(__name__)

_WATCHED_ATTRS = ("brightness", "color_temp_kelvin", "xy_color", "rgb_color", "hs_color")

_BRIGHTNESS_KEYS = frozenset({
    "brightness", "brightness_pct", "brightness_step", "brightness_step_pct",
})
_COLOR_KEYS = frozenset({
    "color_temp", "color_temp_kelvin", "kelvin",
    "rgb_color", "hs_color", "xy_color",
    "rgbw_color", "rgbww_color", "color_name",
})


def _state_attributes_equal(old_state: State, new_state: State) -> bool:
    """Check if light-relevant attributes are unchanged between two states."""
    for attr in _WATCHED_ATTRS:
        if old_state.attributes.get(attr) != new_state.attributes.get(attr):
            return False
    return True


def _detect_changed_attributes(old_state: State, new_state: State) -> OverrideAttributes:
    """Detect which attribute categories changed between two states.

    Uses tolerance thresholds so that hardware side-effects (e.g. a small
    brightness shift when only color temp was changed) are not counted as
    an independent attribute change.
    """
    old_br = old_state.attributes.get("brightness")
    new_br = new_state.attributes.get("brightness")
    brightness_changed = old_br != new_br

    color_changed = False
    color_attrs = ("color_temp_kelvin", "xy_color", "rgb_color", "hs_color")
    for attr in color_attrs:
        if old_state.attributes.get(attr) != new_state.attributes.get(attr):
            color_changed = True
            break

    if not brightness_changed and not color_changed:
        return OverrideAttributes.NONE

    # When both changed, check if one is just a hardware side-effect.
    # Zigbee lights often report small brightness shifts when color temp
    # changes, or small color temp rounding when brightness changes.
    if brightness_changed and color_changed:
        br_delta = abs((new_br or 0) - (old_br or 0))
        old_ct = old_state.attributes.get("color_temp_kelvin")
        new_ct = new_state.attributes.get("color_temp_kelvin")
        ct_delta = abs((new_ct or 0) - (old_ct or 0)) if old_ct and new_ct else None

        # Small brightness drift alongside a color change: treat as color-only
        if br_delta <= 5 and (ct_delta is None or ct_delta > 50):
            return OverrideAttributes.COLOR
        # Small color temp drift alongside a brightness change: treat as brightness-only
        if ct_delta is not None and ct_delta <= 50 and br_delta > 5:
            return OverrideAttributes.BRIGHTNESS

    changed = OverrideAttributes.NONE
    if brightness_changed:
        changed |= OverrideAttributes.BRIGHTNESS
    if color_changed:
        changed |= OverrideAttributes.COLOR
    return changed


def _detect_service_call_attributes(service_data: dict[str, Any]) -> OverrideAttributes:
    """Detect which attribute categories a service call is setting.

    Unlike _detect_changed_attributes (which infers from state deltas),
    this uses the explicit service data keys to determine exactly which
    attributes the caller intended to change.
    """
    attributes = OverrideAttributes.NONE
    keys = set(service_data.keys()) - {"entity_id", "transition"}
    if keys & _BRIGHTNESS_KEYS:
        attributes |= OverrideAttributes.BRIGHTNESS
    if keys & _COLOR_KEYS:
        attributes |= OverrideAttributes.COLOR
    # effect/flash affect everything
    if keys & {"effect", "flash"}:
        attributes = OverrideAttributes.ALL
    return attributes


NON_HA_BRIGHTNESS_THRESHOLD = 25   # ~10% of 0-255 range
NON_HA_COLOR_TEMP_THRESHOLD = 100  # 100K


def detect_drift(
    expected_ct: int,
    expected_br: int,
    actual_ct: int | None,
    actual_br: int | None,
) -> OverrideAttributes:
    """Detect significant drift between expected and actual values.

    Uses wider thresholds than _detect_changed_attributes since we're
    comparing against values we sent, not consecutive state reports.
    Hardware rounding and transition timing can cause small differences.
    """
    override = OverrideAttributes.NONE
    if actual_br is not None and abs(actual_br - expected_br) > NON_HA_BRIGHTNESS_THRESHOLD:
        override |= OverrideAttributes.BRIGHTNESS
    if actual_ct is not None and abs(actual_ct - expected_ct) > NON_HA_COLOR_TEMP_THRESHOLD:
        override |= OverrideAttributes.COLOR
    return override


class AutoResumeTimer:
    """Cancellable single-shot timer for automatic resume after manual override."""

    def __init__(
        self,
        delay: float,
        callback: Callable[[], Coroutine[Any, Any, Any]],
    ) -> None:
        """Initialize the timer."""
        self.delay = delay
        self._callback: Callable[[], Coroutine[Any, Any, Any]] | None = callback
        self.start_time: float = 0
        self._task: asyncio.Task[None] | None = None

    @property
    def is_running(self) -> bool:
        """Check if the timer is currently running."""
        return self._task is not None and not self._task.done()

    @property
    def remaining(self) -> float:
        """Get remaining seconds until the timer fires."""
        if not self.is_running:
            return 0
        return max(0.0, self.delay - (time.monotonic() - self.start_time))

    def start(self) -> None:
        """Start or restart the timer."""
        self.cancel_task()
        self.start_time = time.monotonic()
        self._task = asyncio.ensure_future(self._run())

    def cancel(self) -> None:
        """Cancel the timer and prevent callback execution."""
        self.cancel_task()
        self._callback = None

    def cancel_task(self) -> None:
        """Cancel the running task without clearing the callback."""
        if self._task and not self._task.done():
            self._task.cancel()
        self._task = None

    async def _run(self) -> None:
        """Wait for the delay then execute the callback."""
        try:
            await asyncio.sleep(self.delay)
            if self._callback:
                await self._callback()
        except asyncio.CancelledError:
            pass


class EntityController:
    """Centralized controller for entity conflict resolution and external change detection.

    This is an integration-level singleton (stored in hass.data[DOMAIN])
    that coordinates across all config entry instances.
    """

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the entity controller."""
        self.hass = hass
        self._externally_paused: dict[str, OverrideAttributes] = {}
        self._pending_restore: set[str] = set()
        self._auto_resume_timers: dict[str, AutoResumeTimer] = {}
        self._service_pause_times: dict[str, float] = {}
        self._state_listener_remove: Any | None = None
        self._service_listener_remove: Any | None = None

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

            # Restore previous state when a light with a pending restore turns on.
            # This handles: effect was active -> user turned off -> user turns back on.
            # The restore sets a solid color which overrides the device effect.
            if (
                entity_id in self._pending_restore
                and new_state.state != STATE_OFF
            ):
                self.hass.async_create_task(
                    self._restore_pending_state(entity_id)
                )
                return

            # Check if this entity is under control of any manager
            if not self._is_entity_controlled(entity_id):
                return

            # Context-based detection: if the state change originated from
            # this integration, ignore it. All our commands are tagged with
            # INTEGRATION_CONTEXT_PARENT_ID via create_context().
            if event.context.parent_id == INTEGRATION_CONTEXT_PARENT_ID:
                return

            # External off/unavailable always stops the controlling action,
            # regardless of the ignore_external_changes toggle.
            # "unavailable" covers physical switches that cut power to the
            # bulb — the device can't send a Zigbee off report so HA marks
            # it unavailable after a timeout.
            if new_state.state in (STATE_OFF, STATE_UNAVAILABLE):
                _LOGGER.info(
                    "Light %s turned off/unavailable externally, stopping controlling action",
                    entity_id,
                )
                self.hass.async_create_task(
                    self._stop_entity_action(entity_id, reason="external_off")
                )
                return

            # When a light transitions from off/unavailable to on, the
            # startup attributes are device defaults, not a user override.
            # For solar sequences, immediately apply the correct values
            # so the user doesn't get blinded by cold/bright defaults.
            old_state = event.data.get("old_state")
            if old_state and old_state.state in (STATE_OFF, STATE_UNAVAILABLE):
                self.hass.async_create_task(
                    self._apply_solar_on_turn_on(entity_id)
                )
                return

            # Skip no-op attribute changes (state unchanged)
            if old_state and _state_attributes_equal(old_state, new_state):
                _LOGGER.debug(
                    "Ignoring no-op state change on %s",
                    entity_id,
                )
                return

            # Check if user has disabled external attribute change detection
            store = self.hass.data.get(DOMAIN, {}).get(
                DATA_USER_PREFERENCES_STORE
            )
            if store and store.get_global_preference("ignore_external_changes"):
                _LOGGER.debug(
                    "Ignoring external change on %s (user preference)",
                    entity_id,
                )
                return

            # If the service call listener already handled this entity
            # recently, skip state-delta detection to avoid overriding
            # the more precise service-data-based attribute detection.
            svc_time = self._service_pause_times.get(entity_id)
            if svc_time is not None and (time.monotonic() - svc_time) < 5.0:
                _LOGGER.debug(
                    "Skipping state-delta detection for %s (service call "
                    "listener handled %.1fs ago)",
                    entity_id,
                    time.monotonic() - svc_time,
                )
                return

            # Detect which attributes changed and pause
            changed = _detect_changed_attributes(old_state, new_state)
            if changed == OverrideAttributes.NONE:
                return

            _LOGGER.info(
                "External change detected on %s (attributes: %s), pausing",
                entity_id,
                changed,
            )
            self._pause_entity(entity_id, changed)

        @callback
        def _async_service_called(event: Event) -> None:
            """Handle external service calls targeting controlled light entities.

            Fires before the device responds, with the full service data.
            This gives more precise attribute detection than state deltas.
            """
            if event.data.get("domain") != "light":
                return
            service = event.data.get("service")
            if service not in ("turn_on", "toggle"):
                return

            # Skip our own service calls
            if event.context.parent_id == INTEGRATION_CONTEXT_PARENT_ID:
                return

            service_data = event.data.get("service_data", {})
            entity_ids = service_data.get("entity_id", [])
            if isinstance(entity_ids, str):
                entity_ids = [entity_ids]

            # Check if user has disabled external change detection
            store = self.hass.data.get(DOMAIN, {}).get(
                DATA_USER_PREFERENCES_STORE
            )
            if store and store.get_global_preference("ignore_external_changes"):
                return

            bare_turn_on_only = self._get_bare_turn_on_only()

            for entity_id in entity_ids:
                if not self._is_entity_controlled(entity_id):
                    continue

                attributes = _detect_service_call_attributes(service_data)
                if attributes == OverrideAttributes.NONE:
                    # Bare turn_on with no attributes -- not an override
                    continue

                # When bare_turn_on_only is disabled, off-to-on transitions
                # are never overrides -- the off-to-on handler will apply
                # solar values. Skip to avoid stale override flags.
                if not bare_turn_on_only:
                    state = self.hass.states.get(entity_id)
                    if state and state.state in (STATE_OFF, STATE_UNAVAILABLE):
                        continue

                _LOGGER.info(
                    "External service call detected on %s "
                    "(service: %s, attributes: %s), pausing",
                    entity_id,
                    service,
                    attributes,
                )
                self._service_pause_times[entity_id] = time.monotonic()
                self._pause_entity(entity_id, attributes)

        self._state_listener_remove = self.hass.bus.async_listen(
            "state_changed", _async_state_changed
        )
        self._service_listener_remove = self.hass.bus.async_listen(
            "call_service", _async_service_called
        )
        _LOGGER.debug("Entity controller listeners registered")

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
        Also clears effect_active flag so the frontend stops showing
        one-time actions (effects, patterns) as active.
        """
        self._externally_paused.pop(entity_id, None)
        self._pending_restore.discard(entity_id)
        if timer := self._auto_resume_timers.pop(entity_id, None):
            timer.cancel()

        for instance_data in self.hass.data[DOMAIN].get("entries", {}).values():
            # Clear effect/pattern active flag in state manager
            state_mgr = instance_data.get(DATA_STATE_MANAGER)
            if state_mgr and state_mgr.is_effect_active(entity_id):
                state_mgr.mark_effect_inactive(entity_id)

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

    def pause_entity(
        self,
        entity_id: str,
        attributes: OverrideAttributes = OverrideAttributes.ALL,
    ) -> None:
        """Pause control of an entity due to detected drift or external change.

        Public API for managers (e.g. solar loop drift detection).
        """
        self._pause_entity(entity_id, attributes)

    def is_entity_externally_paused(self, entity_id: str) -> bool:
        """Check if an entity is paused due to external change."""
        return self._externally_paused.get(entity_id, OverrideAttributes.NONE) != OverrideAttributes.NONE

    def get_override_attributes(self, entity_id: str) -> OverrideAttributes:
        """Get the override attribute flags for an entity."""
        return self._externally_paused.get(entity_id, OverrideAttributes.NONE)

    async def resume_entity(self, entity_id: str) -> bool:
        """Resume control of an externally paused entity.

        Returns True if the entity was resumed, False if it wasn't paused.
        """
        if self._externally_paused.get(entity_id, OverrideAttributes.NONE) == OverrideAttributes.NONE:
            _LOGGER.debug("Entity %s is not externally paused", entity_id)
            return False

        was_fully_paused = self._externally_paused.get(entity_id) == OverrideAttributes.ALL
        self._externally_paused.pop(entity_id, None)

        # Cancel auto-resume timer (manual or automatic resume)
        if timer := self._auto_resume_timers.pop(entity_id, None):
            timer.cancel()

        # Resume in the controlling manager
        if was_fully_paused:
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
        self._externally_paused.pop(entity_id, None)
        self._pending_restore.discard(entity_id)
        self._service_pause_times.pop(entity_id, None)
        if timer := self._auto_resume_timers.pop(entity_id, None):
            timer.cancel()

    def cleanup(self) -> None:
        """Remove listeners and clear state.

        Called when the last config entry unloads.
        """
        if self._state_listener_remove:
            self._state_listener_remove()
            self._state_listener_remove = None
        if self._service_listener_remove:
            self._service_listener_remove()
            self._service_listener_remove = None
        self._externally_paused.clear()
        self._pending_restore.clear()
        self._service_pause_times.clear()
        for timer in self._auto_resume_timers.values():
            timer.cancel()
        self._auto_resume_timers.clear()
        _LOGGER.debug("Entity controller cleaned up")

    def _is_entity_controlled(self, entity_id: str) -> bool:
        """Check if an entity is currently controlled by any action.

        Includes both continuous actions (scenes, sequences) and one-time
        actions (effects, segment patterns) tracked by the state manager.
        """
        for instance_data in self.hass.data[DOMAIN].get("entries", {}).values():
            state_mgr: StateManager | None = instance_data.get(
                DATA_STATE_MANAGER
            )
            if state_mgr and state_mgr.is_effect_active(entity_id):
                return True

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

    def get_auto_resume_remaining(self, entity_id: str) -> float | None:
        """Get remaining seconds on the auto-resume timer for an entity.

        Returns None if no timer is running.
        """
        timer = self._auto_resume_timers.get(entity_id)
        if timer and timer.is_running:
            return timer.remaining
        return None

    def _get_solar_auto_resume_delay(self, entity_id: str) -> float:
        """Get the per-preset auto-resume delay for a solar sequence entity.

        Returns 0 if the entity is not running a solar sequence or the
        preset has no auto-resume configured.
        """
        for instance_data in self.hass.data[DOMAIN].get("entries", {}).values():
            cct: CCTSequenceManager | None = instance_data.get(
                DATA_CCT_SEQUENCE_MANAGER
            )
            if cct and cct.is_solar_sequence(entity_id):
                return cct.get_auto_resume_delay(entity_id)
        return 0

    def _get_override_control_mode(self) -> str:
        """Get the override control mode preference."""
        store = self.hass.data.get(DOMAIN, {}).get(DATA_USER_PREFERENCES_STORE)
        if store:
            return store.get_global_preference("override_control_mode") or "pause_changed"
        return "pause_changed"

    def _get_bare_turn_on_only(self) -> bool:
        """Get the bare_turn_on_only preference."""
        store = self.hass.data.get(DOMAIN, {}).get(DATA_USER_PREFERENCES_STORE)
        if store:
            return bool(store.get_global_preference("bare_turn_on_only"))
        return False

    def get_detect_non_ha_changes(self) -> bool:
        """Get the detect_non_ha_changes preference."""
        store = self.hass.data.get(DOMAIN, {}).get(DATA_USER_PREFERENCES_STORE)
        if store:
            if store.get_global_preference("ignore_external_changes"):
                return False
            return bool(store.get_global_preference("detect_non_ha_changes"))
        return False

    def _supports_partial_override(self, entity_id: str) -> bool:
        """Check if the entity's controlling action supports per-attribute overrides.

        Only solar CCT sequences and dynamic scenes support partial overrides.
        Standard CCT/segment sequences always use full pause.
        """
        for instance_data in self.hass.data[DOMAIN].get("entries", {}).values():
            cct: CCTSequenceManager | None = instance_data.get(
                DATA_CCT_SEQUENCE_MANAGER
            )
            if cct and cct.is_solar_sequence(entity_id):
                return True

            dsm: DynamicSceneManager | None = instance_data.get(
                DATA_DYNAMIC_SCENE_MANAGER
            )
            if dsm and dsm.is_scene_running(entity_id):
                return True

        return False

    def _pause_in_manager(self, entity_id: str) -> None:
        """Pause the entity in its controlling manager (full pause only)."""
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

    def _pause_entity(
        self,
        entity_id: str,
        attributes: OverrideAttributes = OverrideAttributes.ALL,
    ) -> None:
        """Pause control of a single entity due to external change.

        In pause_changed mode, only the specified attributes are overridden
        for solar sequences and dynamic scenes. Standard CCT/segment
        sequences always use full pause regardless of mode.
        """
        mode = self._get_override_control_mode()
        supports_partial = self._supports_partial_override(entity_id)

        if mode != "pause_changed" or not supports_partial:
            attributes = OverrideAttributes.ALL

        current = self._externally_paused.get(entity_id, OverrideAttributes.NONE)
        merged = current | attributes

        if merged == current and current != OverrideAttributes.NONE:
            # No change -- restart auto-resume timer if running
            timer = self._auto_resume_timers.get(entity_id)
            if timer and timer.is_running:
                timer.start()
            return

        was_none = current == OverrideAttributes.NONE
        self._externally_paused[entity_id] = merged

        # Start/restart auto-resume timer
        delay = self._get_solar_auto_resume_delay(entity_id)
        if delay > 0:
            timer = self._auto_resume_timers.get(entity_id)
            if timer and timer.is_running:
                timer.start()
            else:
                timer = AutoResumeTimer(
                    delay,
                    lambda eid=entity_id: self.resume_entity(eid),
                )
                self._auto_resume_timers[entity_id] = timer
                timer.start()
                _LOGGER.debug(
                    "Auto-resume timer started for %s (%.0fs)",
                    entity_id,
                    delay,
                )

        # Only pause in manager when transitioning to full override
        # (partial overrides let the loop continue with filtered output)
        if merged == OverrideAttributes.ALL and current != OverrideAttributes.ALL:
            self._pause_in_manager(entity_id)

        if was_none:
            self.hass.bus.async_fire(
                EVENT_ENTITY_EXTERNALLY_CONTROLLED,
                {
                    EVENT_ATTR_ENTITY_ID: entity_id,
                    EVENT_ATTR_REASON: "external_change",
                },
            )

    async def _apply_solar_on_turn_on(self, entity_id: str) -> None:
        """Instantly apply current solar values when a light turns on.

        Called when a controlled light transitions from off/unavailable to on.
        For solar sequences this prevents the user seeing the bulb's cold/bright
        startup defaults before the solar loop's next 60-second poll.
        Non-solar entities are silently ignored.

        When bare_turn_on_only is enabled, a parameterized turn-on (detected
        by the service call listener) overrides the specified attributes.
        Only non-overridden solar values are applied.
        """
        for instance_data in self.hass.data[DOMAIN].get("entries", {}).values():
            cct: CCTSequenceManager | None = instance_data.get(
                DATA_CCT_SEQUENCE_MANAGER
            )
            if not cct or not cct.is_solar_sequence(entity_id):
                continue

            values = cct.get_current_solar_values(entity_id)
            if values is None:
                return

            ct, br = values

            # When bare_turn_on_only is enabled, the service call listener
            # may have already marked some attributes as overridden for a
            # parameterized turn-on. Only apply non-overridden values.
            override = self.get_override_attributes(entity_id)
            if override == OverrideAttributes.ALL:
                _LOGGER.info(
                    "Skipping solar apply on turn-on for %s "
                    "(fully overridden by parameterized turn-on)",
                    entity_id,
                )
                return

            service_data: dict[str, Any] = {"entity_id": entity_id}
            if OverrideAttributes.COLOR not in override:
                service_data["color_temp_kelvin"] = ct
            if OverrideAttributes.BRIGHTNESS not in override:
                service_data["brightness"] = br

            if len(service_data) == 1:
                # Only entity_id, nothing to apply
                return

            _LOGGER.info(
                "Applying solar values on turn-on for %s: %s",
                entity_id,
                {k: v for k, v in service_data.items() if k != "entity_id"},
            )
            await self.hass.services.async_call(
                "light",
                "turn_on",
                service_data,
                blocking=False,
                context=self.create_context(),
            )
            return

    async def _stop_entity_action(self, entity_id: str, reason: str) -> None:
        """Stop the controlling action for an entity entirely.

        Used when a light is turned off externally. Marks the effect inactive
        and schedules state restoration for when the light is next turned on.
        The restore sets a solid color which overrides the device effect in
        firmware (writing effect_type=0 is not universal -- on T1M, 0 means
        flow1, not off).
        """
        self._externally_paused.pop(entity_id, None)

        for instance_data in self.hass.data[DOMAIN].get("entries", {}).values():
            # Clear effect/pattern active flag and schedule restore on next turn-on
            state_mgr: StateManager | None = instance_data.get(DATA_STATE_MANAGER)
            if state_mgr and state_mgr.is_effect_active(entity_id):
                stopped_preset = state_mgr.mark_effect_inactive(entity_id)

                # Schedule state restoration for when the light is turned back on.
                # The captured state (color, brightness) will override the device
                # effect by setting a solid color.
                self._pending_restore.add(entity_id)

                # Fire effect stopped event so frontend updates
                self.hass.bus.async_fire(
                    EVENT_EFFECT_STOPPED,
                    {
                        EVENT_ATTR_ENTITY_ID: entity_id,
                        EVENT_ATTR_PRESET: stopped_preset,
                    },
                )

            dsm: DynamicSceneManager | None = instance_data.get(
                DATA_DYNAMIC_SCENE_MANAGER
            )
            if dsm and dsm.is_scene_running(entity_id):
                dsm.detach_entity(entity_id)

            cct: CCTSequenceManager | None = instance_data.get(
                DATA_CCT_SEQUENCE_MANAGER
            )
            if cct and cct.is_sequence_running(entity_id):
                # Solar sequences persist through off/on cycles;
                # the solar loop skips updates while the light is off
                if not cct.is_solar_sequence(entity_id):
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

    async def _restore_pending_state(self, entity_id: str) -> None:
        """Restore the captured state for an entity after it was turned back on.

        Called when a light with a pending restore transitions from off to on.
        Sends the previously captured color/brightness via light.turn_on,
        which overrides the device effect with a solid color.
        """
        self._pending_restore.discard(entity_id)

        for instance_data in self.hass.data[DOMAIN].get("entries", {}).values():
            state_mgr: StateManager | None = instance_data.get(DATA_STATE_MANAGER)
            if not state_mgr or not state_mgr.has_stored_state(entity_id):
                continue

            payload = state_mgr.get_restoration_payload(entity_id)
            if not payload or payload.get("state") == STATE_OFF:
                # Previous state was off -- don't turn the light back off
                _LOGGER.debug(
                    "Skipping restore for %s (previous state was off)", entity_id
                )
                break

            _LOGGER.info(
                "Restoring previous state for %s after effect cleared", entity_id
            )
            await state_mgr.async_restore_entity_state(
                entity_id,
                blocking=True,
                context=self.create_context(),
            )
            break
