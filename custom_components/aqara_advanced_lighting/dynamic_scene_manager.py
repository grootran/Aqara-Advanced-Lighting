"""Dynamic Scene Manager for Aqara Advanced Lighting."""

from __future__ import annotations

import asyncio
import json
import logging
import math
import random
import time
import uuid
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from homeassistant.const import ATTR_ENTITY_ID, EVENT_STATE_CHANGED
from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback

from .const import (
    ATTR_AUDIO_EFFECT,
    ATTR_ENABLED,
    ATTR_SENSITIVITY,
    AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE,
    AUDIO_COLOR_ADVANCE_CONTINUOUS,
    AUDIO_COLOR_ADVANCE_INTENSITY_BREATHING,
    AUDIO_COLOR_ADVANCE_ON_ONSET,
    AUDIO_COLOR_ADVANCE_ONSET_FLASH,
    AUDIO_SENSOR_UNAVAILABLE_TIMEOUT,
    AUDIO_TIER_RICH,
    CONF_AUDIO_OFF_SERVICE,
    CONF_AUDIO_OFF_SERVICE_DATA,
    CONF_AUDIO_ON_SERVICE,
    CONF_AUDIO_ON_SERVICE_DATA,
    DATA_USER_PREFERENCES_STORE,
    DOMAIN,
    EVENT_ATTR_ENTITY_ID,
    EVENT_ATTR_LOOP_ITERATION,
    EVENT_ATTR_PRESET,
    EVENT_ATTR_REASON,
    EVENT_ATTR_SEQUENCE_ID,
    EVENT_ATTR_SEQUENCE_TYPE,
    EVENT_DYNAMIC_SCENE_FINISHED,
    EVENT_DYNAMIC_SCENE_LOOP_COMPLETED,
    EVENT_DYNAMIC_SCENE_PAUSED,
    EVENT_DYNAMIC_SCENE_RESUMED,
    EVENT_DYNAMIC_SCENE_STARTED,
    EVENT_DYNAMIC_SCENE_STOPPED,
    MAX_AUDIO_SENSITIVITY,
    MAX_COLOR_TEMP_KELVIN,
    MIN_AUDIO_SENSITIVITY,
    MIN_COLOR_TEMP_KELVIN,
    MIN_TRANSITION_STEPS,
    MODEL_T1_STRIP,
    OverrideAttributes,
    SEQUENCE_TYPE_DYNAMIC_SCENE,
    SERVICE_SET_MUSIC_SYNC,
    SOFTWARE_TRANSITION_MODELS,
    brightness_percent_to_device,
)
from .audio_mode_handlers import (
    AudioModeHandler,
    BeatPredictiveHandler,
    ContinuousHandler,
    IntensityBreathingHandler,
    OnsetFlashHandler,
    OnsetHandler,
)
from .audio_discovery import (
    discover_companion_sensors,
    map_t1_strip_params,
)
from .capability_profile import (
    CapabilityProfile,
    LightCapabilityLevel,
    adapt_xy_for_cct_light,
    build_capability_profile,
)
from .models import DynamicScene, DynamicSceneColor
from .transition_utils import (
    ease_in_out_cubic,
    get_entity_model_id,
    get_software_step_interval,
)

if TYPE_CHECKING:
    from .entity_controller import EntityController
    from .state_manager import StateManager

_LOGGER = logging.getLogger(__name__)


@dataclass
class ActiveSceneInfo:
    """Information about an active dynamic scene."""

    scene_id: str
    entity_ids: list[str]
    preset_name: str | None
    paused: bool
    loop_iteration: int
    current_color_index: int
    entity_capabilities: dict[str, str] = field(default_factory=dict)
    audio_tier: str | None = None
    audio_entity: str | None = None
    audio_waiting: bool = False
    audio_bpm: float | None = None
    audio_sensitivity: int | None = None


@dataclass
class SceneState:
    """Internal state tracking for a scene running on specific entities."""

    scene_id: str
    entity_ids: list[str]
    scene: DynamicScene
    preset_name: str | None
    paused: bool = False
    loop_iteration: int = 1
    current_color_index: int = 0
    light_color_indices: dict[str, int] = field(default_factory=dict)
    light_order: list[str] = field(default_factory=list)
    # Hue-sorted color indices for shuffle_rotate mode (smooth color wheel rotation)
    hue_sorted_indices: list[int] = field(default_factory=list)
    # Track whether initial colors have been applied (for instant first transition)
    initial_applied: bool = False
    # Entities paused by external changes or detached by cross-type conflicts
    externally_paused_entities: set[str] = field(default_factory=set)
    # T1-family entities needing software-interpolated transitions
    # Maps entity_id -> model_id for per-entity interval calculation
    software_transition_entities: dict[str, str] = field(default_factory=dict)
    # Capability profiles for adapting service calls per entity
    capability_profiles: dict[str, CapabilityProfile] = field(default_factory=dict)
    # Audio reactive fields
    brightness_modifier: float = 1.0
    audio_tier: str | None = None
    audio_unsub: CALLBACK_TYPE | None = None
    audio_companion_sensors: dict[str, str | None] = field(default_factory=dict)
    audio_waiting: bool = False


class DynamicSceneManager:
    """Manages dynamic scene execution as background tasks."""

    def __init__(
        self,
        hass: HomeAssistant,
        state_manager: StateManager,
        entity_controller: EntityController | None = None,
    ) -> None:
        """Initialize the dynamic scene manager."""
        self.hass = hass
        self.state_manager = state_manager
        self._entity_controller = entity_controller
        self._active_scenes: dict[str, asyncio.Task[None]] = {}  # scene_id -> task
        self._stop_flags: dict[str, asyncio.Event] = {}  # scene_id -> stop event
        self._pause_flags: dict[str, asyncio.Event] = {}  # scene_id -> pause event
        self._scene_states: dict[str, SceneState] = {}  # scene_id -> state
        self._entity_to_scene: dict[str, str] = {}  # entity_id -> scene_id

    async def start_scene(
        self,
        entity_ids: list[str],
        scene: DynamicScene,
        preset_name: str | None = None,
    ) -> str:
        """Start a dynamic scene on target lights.

        Args:
            entity_ids: List of light entity IDs to control
            scene: The dynamic scene configuration
            preset_name: Optional preset name for event tracking

        Returns:
            The unique scene ID for this scene run
        """
        if not entity_ids:
            _LOGGER.warning("No entity IDs provided for dynamic scene")
            return ""

        # Stop any conflicting scenes on these entities
        await self._stop_conflicting_scenes(entity_ids)

        # Generate unique scene ID
        scene_id = str(uuid.uuid4())

        # Capture state for all entities if end_behavior is restore
        if scene.end_behavior == "restore":
            for entity_id in entity_ids:
                # Get Z2M friendly name (simplified - may need lookup)
                z2m_name = entity_id.split(".")[-1]
                self.state_manager.capture_state(entity_id, z2m_name)

        # Determine light order (affects ripple offset and shuffle_rotate assignment)
        light_order = list(entity_ids)
        if scene.random_order:
            random.shuffle(light_order)

        # Initialize color indices based on distribution mode
        light_color_indices = self._initialize_color_indices(
            light_order, len(scene.colors), scene.distribution_mode
        )

        # Pre-compute hue-sorted indices for shuffle_rotate mode
        # This ensures smooth color wheel rotation instead of random jumps
        hue_sorted_indices: list[int] = []
        if scene.distribution_mode == "shuffle_rotate":
            hue_sorted_indices = self._get_hue_sorted_indices(scene.colors)

        # Resolve which entities need software-interpolated transitions
        software_transition_entities: dict[str, str] = {}
        for entity_id in light_order:
            model_id = get_entity_model_id(self.hass, entity_id)
            if model_id and model_id in SOFTWARE_TRANSITION_MODELS:
                software_transition_entities[entity_id] = model_id

        # Check for user-opted software transition entities
        pref_store = self.hass.data.get(DOMAIN, {}).get(
            DATA_USER_PREFERENCES_STORE
        )
        if pref_store:
            user_sw_entities = set(
                pref_store.get_global_preference("software_transition_entities")
                or []
            )
            for eid in light_order:
                if eid in user_sw_entities and eid not in software_transition_entities:
                    software_transition_entities[eid] = "generic_software"

        if software_transition_entities:
            _LOGGER.debug(
                "Software transitions for %d entities in scene",
                len(software_transition_entities),
            )

        # Build capability profiles for all entities
        capability_profiles: dict[str, CapabilityProfile] = {}
        for eid in light_order:
            entity_state = self.hass.states.get(eid)
            if entity_state:
                capability_profiles[eid] = build_capability_profile(entity_state)

        # Create scene state
        scene_state = SceneState(
            scene_id=scene_id,
            entity_ids=entity_ids,
            scene=scene,
            preset_name=preset_name,
            light_color_indices=light_color_indices,
            light_order=light_order,
            hue_sorted_indices=hue_sorted_indices,
            software_transition_entities=software_transition_entities,
            capability_profiles=capability_profiles,
        )
        self._scene_states[scene_id] = scene_state

        # Set up audio reactive state if an audio entity is configured
        if scene.audio_entity:
            scene_state.audio_tier = AUDIO_TIER_RICH
            scene_state.audio_companion_sensors = discover_companion_sensors(
                self.hass, scene.audio_entity
            )

        # Map entities to this scene
        for entity_id in entity_ids:
            self._entity_to_scene[entity_id] = scene_id

        # Create stop and pause flags
        stop_event = asyncio.Event()
        pause_event = asyncio.Event()
        self._stop_flags[scene_id] = stop_event
        self._pause_flags[scene_id] = pause_event

        # Create and store task
        task = asyncio.create_task(
            self._execute_scene(scene_id, stop_event, pause_event)
        )
        self._active_scenes[scene_id] = task

        # Fire scene started event
        self.hass.bus.async_fire(
            EVENT_DYNAMIC_SCENE_STARTED,
            {
                EVENT_ATTR_ENTITY_ID: entity_ids,
                EVENT_ATTR_SEQUENCE_ID: scene_id,
                EVENT_ATTR_SEQUENCE_TYPE: SEQUENCE_TYPE_DYNAMIC_SCENE,
                EVENT_ATTR_PRESET: preset_name,
            },
        )

        _LOGGER.info(
            "Started dynamic scene for %d lights (scene_id=%s, preset=%s)",
            len(entity_ids),
            scene_id,
            preset_name,
        )

        return scene_id

    async def apply_static_scene(
        self,
        entity_ids: list[str],
        scene: DynamicScene,
        preset_name: str | None = None,
    ) -> None:
        """Apply scene colors to lights once without starting a transition loop.

        Uses the same distribution logic as dynamic scenes but applies colors
        immediately and returns. No background task, no events, no state tracking.

        Args:
            entity_ids: List of light entity IDs to control.
            scene: The dynamic scene configuration (colors + distribution).
            preset_name: Optional preset name for logging.
        """
        if not entity_ids:
            _LOGGER.warning("No entity IDs provided for static scene")
            return

        # Determine light order (shuffle if random_order enabled)
        light_order = list(entity_ids)
        if scene.random_order:
            random.shuffle(light_order)

        # Initialize color indices based on distribution mode
        light_color_indices = self._initialize_color_indices(
            light_order, len(scene.colors), scene.distribution_mode
        )

        # Pre-compute hue-sorted indices for shuffle_rotate mode
        hue_sorted_indices: list[int] = []
        if scene.distribution_mode == "shuffle_rotate":
            hue_sorted_indices = self._get_hue_sorted_indices(scene.colors)

        # Build context for service calls (identifies as integration-originated)
        context = (
            self._entity_controller.create_context()
            if self._entity_controller
            else None
        )

        # Apply colors to all lights with instant transition
        for entity_id in light_order:
            position = light_color_indices[entity_id]
            if scene.distribution_mode == "shuffle_rotate" and hue_sorted_indices:
                color_index = hue_sorted_indices[position]
            else:
                color_index = position
            color = scene.colors[color_index]

            # Convert per-color brightness percentage to device value (1-255)
            effective_brightness = brightness_percent_to_device(
                color.brightness_pct
            )

            await self.hass.services.async_call(
                "light",
                "turn_on",
                {
                    ATTR_ENTITY_ID: entity_id,
                    "xy_color": [color.x, color.y],
                    "brightness": effective_brightness,
                    "transition": 0,
                },
                blocking=False,
                context=context,
            )

            _LOGGER.debug(
                "Static scene: applied color %d to %s: XY(%.4f,%.4f) brightness=%d",
                color_index,
                entity_id,
                color.x,
                color.y,
                effective_brightness,
            )

        _LOGGER.info(
            "Applied static scene to %d lights (preset=%s)",
            len(entity_ids),
            preset_name,
        )

    async def stop_scene(
        self,
        entity_ids: list[str] | None = None,
        scene_id: str | None = None,
        restore_override: bool | None = None,
    ) -> None:
        """Stop running dynamic scene(s).

        Args:
            entity_ids: Optional list of entity IDs to stop scenes for
            scene_id: Optional specific scene ID to stop
            restore_override: If True, force state restoration regardless of
                end_behavior. If False, skip restoration. If None, use the
                scene's end_behavior setting.
        """
        scenes_to_stop: set[str] = set()

        if scene_id:
            scenes_to_stop.add(scene_id)
        elif entity_ids:
            for entity_id in entity_ids:
                if sid := self._entity_to_scene.get(entity_id):
                    scenes_to_stop.add(sid)
        else:
            # Stop all scenes
            scenes_to_stop = set(self._active_scenes.keys())

        for sid in scenes_to_stop:
            await self._stop_single_scene(
                sid, reason="manual_stop", restore_override=restore_override
            )

    async def _stop_single_scene(
        self,
        scene_id: str,
        reason: str = "manual_stop",
        restore_override: bool | None = None,
    ) -> None:
        """Stop a single scene by ID."""
        if scene_id not in self._active_scenes:
            return

        scene_state = self._scene_states.get(scene_id)
        preset_name = scene_state.preset_name if scene_state else None
        entity_ids = scene_state.entity_ids if scene_state else []

        # Set stop flag
        if scene_id in self._stop_flags:
            self._stop_flags[scene_id].set()

        # Cancel task
        task = self._active_scenes[scene_id]
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

        # Restore state if needed (override takes precedence over scene setting)
        should_restore = (
            restore_override
            if restore_override is not None
            else (scene_state and scene_state.scene.end_behavior == "restore")
        )
        if should_restore:
            # Capture state now if not already captured (for restore_override=True
            # on scenes that didn't have end_behavior="restore")
            await self._restore_states(entity_ids)

        # Cleanup
        self._cleanup_scene(scene_id)

        # Fire stopped event
        self.hass.bus.async_fire(
            EVENT_DYNAMIC_SCENE_STOPPED,
            {
                EVENT_ATTR_ENTITY_ID: entity_ids,
                EVENT_ATTR_SEQUENCE_ID: scene_id,
                EVENT_ATTR_SEQUENCE_TYPE: SEQUENCE_TYPE_DYNAMIC_SCENE,
                EVENT_ATTR_PRESET: preset_name,
                EVENT_ATTR_REASON: reason,
            },
        )

        _LOGGER.info("Stopped dynamic scene %s", scene_id)

    def pause_scene(self, entity_ids: list[str]) -> bool:
        """Pause scene(s) for the given entities.

        Args:
            entity_ids: List of entity IDs to pause scenes for

        Returns:
            True if any scene was paused
        """
        paused_any = False
        scenes_paused: set[str] = set()

        for entity_id in entity_ids:
            scene_id = self._entity_to_scene.get(entity_id)
            if not scene_id or scene_id in scenes_paused:
                continue

            if scene_id in self._pause_flags and scene_id in self._scene_states:
                self._pause_flags[scene_id].set()
                self._scene_states[scene_id].paused = True
                scenes_paused.add(scene_id)
                paused_any = True

                # Unsubscribe audio listener if present (audio loop re-subscribes on resume)
                if self._scene_states[scene_id].audio_unsub:
                    self._scene_states[scene_id].audio_unsub()
                    self._scene_states[scene_id].audio_unsub = None

                # Fire paused event
                scene_state = self._scene_states[scene_id]
                self.hass.bus.async_fire(
                    EVENT_DYNAMIC_SCENE_PAUSED,
                    {
                        EVENT_ATTR_ENTITY_ID: scene_state.entity_ids,
                        EVENT_ATTR_SEQUENCE_ID: scene_id,
                        EVENT_ATTR_SEQUENCE_TYPE: SEQUENCE_TYPE_DYNAMIC_SCENE,
                        EVENT_ATTR_PRESET: scene_state.preset_name,
                    },
                )

                _LOGGER.info("Paused dynamic scene %s", scene_id)

        return paused_any

    def resume_scene(self, entity_ids: list[str]) -> bool:
        """Resume paused scene(s) for the given entities.

        Args:
            entity_ids: List of entity IDs to resume scenes for

        Returns:
            True if any scene was resumed
        """
        resumed_any = False
        scenes_resumed: set[str] = set()

        for entity_id in entity_ids:
            scene_id = self._entity_to_scene.get(entity_id)
            if not scene_id or scene_id in scenes_resumed:
                continue

            if scene_id in self._pause_flags and scene_id in self._scene_states:
                self._pause_flags[scene_id].clear()
                self._scene_states[scene_id].paused = False
                scenes_resumed.add(scene_id)
                resumed_any = True

                # Fire resumed event
                scene_state = self._scene_states[scene_id]
                self.hass.bus.async_fire(
                    EVENT_DYNAMIC_SCENE_RESUMED,
                    {
                        EVENT_ATTR_ENTITY_ID: scene_state.entity_ids,
                        EVENT_ATTR_SEQUENCE_ID: scene_id,
                        EVENT_ATTR_SEQUENCE_TYPE: SEQUENCE_TYPE_DYNAMIC_SCENE,
                        EVENT_ATTR_PRESET: scene_state.preset_name,
                    },
                )

                _LOGGER.info("Resumed dynamic scene %s", scene_id)

        return resumed_any

    def is_scene_running(self, entity_id: str) -> bool:
        """Check if a scene is running for an entity."""
        return entity_id in self._entity_to_scene

    def is_scene_paused(self, entity_id: str) -> bool:
        """Check if a scene is paused for an entity."""
        scene_id = self._entity_to_scene.get(entity_id)
        if not scene_id:
            return False
        scene_state = self._scene_states.get(scene_id)
        return scene_state.paused if scene_state else False

    def detach_entity(self, entity_id: str) -> None:
        """Detach an entity from its running scene permanently.

        Used for cross-type conflict resolution. The entity is removed from
        the scene's control but the scene continues for other entities.
        If no entities remain, the scene is stopped.
        """
        scene_id = self._entity_to_scene.pop(entity_id, None)
        if not scene_id:
            return

        scene_state = self._scene_states.get(scene_id)
        if not scene_state:
            return

        # Mark entity as paused so the loop skips it
        scene_state.externally_paused_entities.add(entity_id)

        # Remove from the scene's active entity list
        scene_state.entity_ids = [
            eid for eid in scene_state.entity_ids if eid != entity_id
        ]

        # Clean up per-entity data structures to prevent stale entries
        scene_state.light_color_indices.pop(entity_id, None)
        scene_state.light_order = [
            eid for eid in scene_state.light_order if eid != entity_id
        ]

        # Clear entity controller tracking
        if self._entity_controller:
            self._entity_controller.clear_entity(entity_id)

        _LOGGER.info(
            "Detached entity %s from scene %s (%d entities remaining)",
            entity_id,
            scene_id,
            len(scene_state.entity_ids),
        )

        # If no entities remain, stop the scene
        if not scene_state.entity_ids:
            _LOGGER.info(
                "All entities detached from scene %s, stopping", scene_id
            )
            self.hass.async_create_task(
                self._stop_single_scene(scene_id, reason="all_entities_detached")
            )

    def externally_pause_entity(self, entity_id: str) -> None:
        """Pause a single entity due to external change.

        The entity stays in the scene and can be resumed later.
        The scene loop will skip this entity.
        """
        scene_id = self._entity_to_scene.get(entity_id)
        if not scene_id:
            return

        scene_state = self._scene_states.get(scene_id)
        if scene_state:
            scene_state.externally_paused_entities.add(entity_id)
            _LOGGER.info(
                "Entity %s externally paused in scene %s", entity_id, scene_id
            )

    def externally_resume_entity(self, entity_id: str) -> None:
        """Resume a single externally paused entity.

        The entity will rejoin the scene's color cycle on the next iteration.
        """
        scene_id = self._entity_to_scene.get(entity_id)
        if not scene_id:
            return

        scene_state = self._scene_states.get(scene_id)
        if scene_state:
            scene_state.externally_paused_entities.discard(entity_id)
            _LOGGER.info(
                "Entity %s resumed in scene %s", entity_id, scene_id
            )

    async def force_apply_current(self, entity_id: str) -> bool:
        """Immediately apply current scene color to an entity.

        Used for instant resume so the entity gets correct values without
        waiting for the next color cycle. Respects per-attribute overrides
        and capability profiles.

        Returns True if values were applied.
        """
        scene_id = self._entity_to_scene.get(entity_id)
        if not scene_id:
            return False

        scene_state = self._scene_states.get(scene_id)
        if not scene_state:
            return False

        # Get the entity's current assigned color
        position = scene_state.light_color_indices.get(entity_id)
        if position is None:
            return False

        scene = scene_state.scene
        if scene.distribution_mode == "shuffle_rotate" and scene_state.hue_sorted_indices:
            color_index = scene_state.hue_sorted_indices[position]
        else:
            color_index = position
        color = scene.colors[color_index]

        effective_brightness = brightness_percent_to_device(color.brightness_pct)

        profile = scene_state.capability_profiles.get(entity_id)
        if profile and profile.level == LightCapabilityLevel.ON_OFF_ONLY:
            return False

        service_data = self._build_adapted_service_data(
            entity_id, color.x, color.y, effective_brightness, profile, transition=0,
        )
        if not service_data:
            return False

        # Filter overridden attributes
        override = OverrideAttributes.NONE
        if self._entity_controller:
            override = self._entity_controller.get_override_attributes(entity_id)

        if override != OverrideAttributes.NONE:
            if OverrideAttributes.BRIGHTNESS in override:
                service_data.pop("brightness", None)
            if OverrideAttributes.COLOR in override:
                service_data.pop("xy_color", None)
                service_data.pop("color_temp_kelvin", None)
            value_keys = {"brightness", "xy_color", "color_temp_kelvin"}
            if not (set(service_data.keys()) & value_keys):
                return False

        context = (
            self._entity_controller.create_context()
            if self._entity_controller
            else None
        )
        await self.hass.services.async_call(
            "light", "turn_on", service_data, blocking=False, context=context,
        )
        _LOGGER.info(
            "Force-applied scene color for %s (color index %d)",
            entity_id,
            color_index,
        )
        return True

    def get_scene_preset(self, entity_id: str) -> str | None:
        """Get the preset name for a running scene on an entity."""
        scene_id = self._entity_to_scene.get(entity_id)
        if not scene_id:
            return None
        scene_state = self._scene_states.get(scene_id)
        return scene_state.preset_name if scene_state else None

    def get_active_scenes(self) -> dict[str, ActiveSceneInfo]:
        """Get all active scenes."""
        result = {}
        for scene_id, state in self._scene_states.items():
            entity_capabilities: dict[str, str] = {}
            for eid, profile in state.capability_profiles.items():
                if profile.level == LightCapabilityLevel.CCT_ONLY:
                    entity_capabilities[eid] = "cct_mode"
                elif profile.level == LightCapabilityLevel.BRIGHTNESS_ONLY:
                    entity_capabilities[eid] = "brightness_only"
                elif profile.level == LightCapabilityLevel.ON_OFF_ONLY:
                    entity_capabilities[eid] = "on_off_only"

            # Mark entities using software-interpolated transitions
            for eid in state.software_transition_entities:
                if eid not in entity_capabilities:
                    entity_capabilities[eid] = "software_transition"
                else:
                    entity_capabilities[eid] += ",software_transition"

            # Look up current BPM from companion sensor
            audio_bpm = None
            if state.audio_companion_sensors:
                bpm_eid = state.audio_companion_sensors.get("bpm")
                if bpm_eid:
                    bpm_state = self.hass.states.get(bpm_eid)
                    if bpm_state and bpm_state.state not in (
                        "unavailable",
                        "unknown",
                    ):
                        try:
                            audio_bpm = float(bpm_state.state)
                        except (ValueError, TypeError):
                            pass

            result[scene_id] = ActiveSceneInfo(
                scene_id=scene_id,
                entity_ids=state.entity_ids,
                preset_name=state.preset_name,
                paused=state.paused,
                loop_iteration=state.loop_iteration,
                current_color_index=state.current_color_index,
                entity_capabilities=entity_capabilities,
                audio_tier=state.audio_tier,
                audio_entity=state.scene.audio_entity,
                audio_waiting=state.audio_waiting,
                audio_bpm=audio_bpm,
                audio_sensitivity=state.scene.audio_sensitivity if state.scene.audio_entity else None,
            )
        return result

    async def update_audio_sensitivity(
        self, scene_id: str, sensitivity: int
    ) -> bool:
        """Update beat sensitivity on a running audio scene.

        Sends the new value to the ESPHome device via the companion
        sensitivity number entity.
        """
        state = self._scene_states.get(scene_id)
        if state is None or state.scene.audio_entity is None:
            return False

        clamped = max(MIN_AUDIO_SENSITIVITY, min(MAX_AUDIO_SENSITIVITY, sensitivity))
        state.scene.audio_sensitivity = clamped

        sensitivity_eid = state.audio_companion_sensors.get("sensitivity")
        if sensitivity_eid:
            try:
                await self.hass.services.async_call(
                    "number", "set_value",
                    {"entity_id": sensitivity_eid, "value": clamped},
                    blocking=False,
                )
            except Exception:
                _LOGGER.warning(
                    "Failed to update sensitivity on %s",
                    sensitivity_eid,
                    exc_info=True,
                )
                return False
        return True

    def cleanup(self) -> None:
        """Cleanup all resources."""
        # Clear entity controller tracking for all controlled entities
        if self._entity_controller:
            for entity_id in self._entity_to_scene:
                self._entity_controller.clear_entity(entity_id)

        for scene_id in list(self._active_scenes.keys()):
            if scene_id in self._stop_flags:
                self._stop_flags[scene_id].set()
            task = self._active_scenes[scene_id]
            task.cancel()
        self._active_scenes.clear()
        self._stop_flags.clear()
        self._pause_flags.clear()
        self._scene_states.clear()
        self._entity_to_scene.clear()

    async def _stop_conflicting_scenes(self, entity_ids: list[str]) -> None:
        """Stop any scenes running on the given entities."""
        scenes_to_stop: set[str] = set()
        for entity_id in entity_ids:
            if scene_id := self._entity_to_scene.get(entity_id):
                scenes_to_stop.add(scene_id)

        for scene_id in scenes_to_stop:
            await self._stop_single_scene(scene_id, reason="conflict")

    def _cleanup_scene(self, scene_id: str) -> None:
        """Clean up resources for a stopped scene."""
        scene_state = self._scene_states.get(scene_id)
        if scene_state:
            # Unsubscribe audio listener if still active
            if scene_state.audio_unsub:
                scene_state.audio_unsub()
                scene_state.audio_unsub = None

            for entity_id in scene_state.entity_ids:
                if self._entity_to_scene.get(entity_id) == scene_id:
                    del self._entity_to_scene[entity_id]
                # Clear entity controller tracking for this entity
                if self._entity_controller:
                    self._entity_controller.clear_entity(entity_id)

        self._active_scenes.pop(scene_id, None)
        self._stop_flags.pop(scene_id, None)
        self._pause_flags.pop(scene_id, None)
        self._scene_states.pop(scene_id, None)

    # -------------------------------------------------------------------------
    # Color transition helpers (Smart Shuffle implementation)
    # -------------------------------------------------------------------------

    # CIE 1931 D65 white point coordinates
    _WHITE_POINT_X = 0.3127
    _WHITE_POINT_Y = 0.3290

    @staticmethod
    def _xy_to_hue(x: float, y: float) -> float:
        """Convert XY color to hue angle (0-360 degrees).

        Calculates hue by measuring the angle from white point to the color
        in CIE xy chromaticity space.

        Args:
            x: CIE x coordinate
            y: CIE y coordinate

        Returns:
            Hue angle in degrees (0-360)
        """
        # Vector from white point to color
        dx = x - DynamicSceneManager._WHITE_POINT_X
        dy = y - DynamicSceneManager._WHITE_POINT_Y

        # Calculate angle in radians, convert to degrees
        angle_rad = math.atan2(dy, dx)
        angle_deg = math.degrees(angle_rad)

        # Normalize to 0-360 range
        if angle_deg < 0:
            angle_deg += 360

        return angle_deg

    @staticmethod
    def _angle_through_white(
        from_x: float, from_y: float, to_x: float, to_y: float
    ) -> float:
        """Calculate the angle between two colors as seen from the white point.

        This determines whether a transition would pass through or near white.
        A large angle (close to 180) means the transition passes through white.
        A small angle means the colors are close together on the color wheel.

        Based on Smart Shuffle algorithm from hass-scene_presets.

        Args:
            from_x: Starting color CIE x coordinate
            from_y: Starting color CIE y coordinate
            to_x: Target color CIE x coordinate
            to_y: Target color CIE y coordinate

        Returns:
            Angle in degrees (0-180)
        """
        white_x = DynamicSceneManager._WHITE_POINT_X
        white_y = DynamicSceneManager._WHITE_POINT_Y

        # Vectors from white point to each color
        vec_from_x = from_x - white_x
        vec_from_y = from_y - white_y
        vec_to_x = to_x - white_x
        vec_to_y = to_y - white_y

        # Calculate magnitudes
        mag_from = math.sqrt(vec_from_x**2 + vec_from_y**2)
        mag_to = math.sqrt(vec_to_x**2 + vec_to_y**2)

        # Handle edge case of colors at white point
        if mag_from < 0.001 or mag_to < 0.001:
            return 0.0

        # Dot product gives cos(angle)
        dot = vec_from_x * vec_to_x + vec_from_y * vec_to_y
        cos_angle = dot / (mag_from * mag_to)

        # Clamp to valid range for acos (floating point errors can exceed -1,1)
        cos_angle = max(-1.0, min(1.0, cos_angle))

        # Return angle in degrees
        return math.degrees(math.acos(cos_angle))

    def _get_smart_next_color(
        self,
        current_index: int,
        colors: list[DynamicSceneColor],
    ) -> int:
        """Select the next color using smart angle-based filtering.

        Avoids selecting colors that would cause a transition through or near
        the white point, which causes undesirable bright flashes.

        Based on Smart Shuffle algorithm from hass-scene_presets.

        Args:
            current_index: Index of current color
            colors: List of available colors

        Returns:
            Index of the selected next color
        """
        if len(colors) <= 1:
            return 0

        current = colors[current_index]
        candidates: list[int] = []

        # Thresholds from Smart Shuffle algorithm
        # Reject colors > 150 degrees apart (would pass through white)
        # Reject colors < 2 degrees apart (essentially the same color)
        max_angle = 150.0
        min_angle = 2.0

        for i, candidate in enumerate(colors):
            if i == current_index:
                continue

            angle = self._angle_through_white(
                current.x, current.y, candidate.x, candidate.y
            )

            # Accept if angle is between min and max thresholds
            if min_angle <= angle <= max_angle:
                candidates.append(i)

        # If no candidates passed filtering, fall back to random selection
        # (but still avoid current color)
        if not candidates:
            candidates = [i for i in range(len(colors)) if i != current_index]

        return random.choice(candidates)

    def _get_hue_sorted_indices(
        self, colors: list[DynamicSceneColor]
    ) -> list[int]:
        """Get color indices sorted by hue for smooth color wheel rotation.

        Sorting colors by their hue angle ensures that shuffle_rotate mode
        produces visually pleasing transitions around the color wheel instead
        of jumping across colors randomly.

        Args:
            colors: List of DynamicSceneColor objects

        Returns:
            List of indices sorted by hue angle
        """
        # Calculate hue for each color and pair with index
        hue_index_pairs = [
            (self._xy_to_hue(c.x, c.y), i) for i, c in enumerate(colors)
        ]

        # Sort by hue angle
        hue_index_pairs.sort(key=lambda pair: pair[0])

        # Return just the indices
        return [pair[1] for pair in hue_index_pairs]

    # -------------------------------------------------------------------------
    # Color index initialization and advancement
    # -------------------------------------------------------------------------

    def _initialize_color_indices(
        self,
        light_order: list[str],
        num_colors: int,
        distribution_mode: str,
    ) -> dict[str, int]:
        """Initialize color indices for each light based on distribution mode."""
        indices: dict[str, int] = {}

        if distribution_mode == "synchronized":
            # All lights start at color 0
            for entity_id in light_order:
                indices[entity_id] = 0
        elif distribution_mode == "shuffle_rotate":
            # Distribute lights across colors
            for i, entity_id in enumerate(light_order):
                indices[entity_id] = i % num_colors
        elif distribution_mode == "random":
            # Random starting color for each light
            for entity_id in light_order:
                indices[entity_id] = random.randint(0, num_colors - 1)

        return indices

    async def _execute_scene(
        self,
        scene_id: str,
        stop_event: asyncio.Event,
        pause_event: asyncio.Event,
    ) -> None:
        """Execute the dynamic scene loop."""
        scene_state = self._scene_states.get(scene_id)
        if not scene_state:
            return

        # Branch to audio execution path when an audio entity is configured
        if scene_state.scene.audio_entity:
            await self._execute_audio_scene(scene_id, stop_event, pause_event)
            return

        scene = scene_state.scene
        completed_naturally = False

        try:
            max_loops = scene.loop_count if scene.loop_mode == "count" else None

            while True:
                # Check for stop
                if stop_event.is_set():
                    return

                # Check for pause
                while pause_event.is_set():
                    if stop_event.is_set():
                        return
                    await asyncio.sleep(0.1)

                # Apply colors to all lights with ripple offset
                await self._apply_colors_with_offset(scene_state, stop_event)

                if stop_event.is_set():
                    return

                # Wait for hold time
                if scene.hold_time > 0:
                    try:
                        await asyncio.wait_for(
                            stop_event.wait(), timeout=scene.hold_time
                        )
                        return  # Stop event was set
                    except TimeoutError:
                        pass  # Normal - hold time elapsed

                # Advance to next color
                self._advance_colors(scene_state)

                # Check if loop completed
                if scene_state.current_color_index == 0:
                    # Fire loop completed event
                    self.hass.bus.async_fire(
                        EVENT_DYNAMIC_SCENE_LOOP_COMPLETED,
                        {
                            EVENT_ATTR_ENTITY_ID: scene_state.entity_ids,
                            EVENT_ATTR_SEQUENCE_ID: scene_id,
                            EVENT_ATTR_SEQUENCE_TYPE: SEQUENCE_TYPE_DYNAMIC_SCENE,
                            EVENT_ATTR_PRESET: scene_state.preset_name,
                            EVENT_ATTR_LOOP_ITERATION: scene_state.loop_iteration,
                        },
                    )

                    scene_state.loop_iteration += 1

                    # Check loop conditions
                    if scene.loop_mode == "once":
                        break
                    if (
                        scene.loop_mode == "count"
                        and max_loops
                        and scene_state.loop_iteration > max_loops
                    ):
                        break
                    # "continuous" keeps going

            completed_naturally = True

        except asyncio.CancelledError:
            _LOGGER.debug("Scene %s cancelled", scene_id)
        except Exception:
            _LOGGER.exception("Error executing scene %s", scene_id)
        finally:
            if completed_naturally:
                # Fire finished event
                self.hass.bus.async_fire(
                    EVENT_DYNAMIC_SCENE_FINISHED,
                    {
                        EVENT_ATTR_ENTITY_ID: scene_state.entity_ids,
                        EVENT_ATTR_SEQUENCE_ID: scene_id,
                        EVENT_ATTR_SEQUENCE_TYPE: SEQUENCE_TYPE_DYNAMIC_SCENE,
                        EVENT_ATTR_PRESET: scene_state.preset_name,
                    },
                )

                # Handle end behavior
                if scene.end_behavior == "turn_off":
                    await self._turn_off_entities(scene_state.entity_ids)
                elif scene.end_behavior == "restore":
                    await self._restore_states(scene_state.entity_ids)

                # Cleanup
                self._cleanup_scene(scene_id)

    @staticmethod
    def _build_adapted_service_data(
        entity_id: str,
        x: float,
        y: float,
        brightness: int,
        profile: CapabilityProfile | None,
        transition: float | None = None,
    ) -> dict[str, Any] | None:
        """Build capability-adapted service call data for a light entity.

        Returns None for ON_OFF_ONLY entities (should be skipped).
        """
        if profile and profile.level == LightCapabilityLevel.ON_OFF_ONLY:
            return None

        base: dict[str, Any] = {ATTR_ENTITY_ID: entity_id}

        if profile and profile.level == LightCapabilityLevel.CCT_ONLY:
            cct = adapt_xy_for_cct_light(
                x,
                y,
                profile.min_color_temp_kelvin or MIN_COLOR_TEMP_KELVIN,
                profile.max_color_temp_kelvin or MAX_COLOR_TEMP_KELVIN,
            )
            base["color_temp_kelvin"] = cct
            base["brightness"] = brightness
        elif profile and profile.level == LightCapabilityLevel.BRIGHTNESS_ONLY:
            base["brightness"] = brightness
        else:
            base["xy_color"] = [x, y]
            base["brightness"] = brightness

        if transition is not None:
            base["transition"] = transition

        return base

    async def _apply_colors_with_offset(
        self,
        scene_state: SceneState,
        stop_event: asyncio.Event,
        transition: float | None = None,
    ) -> None:
        """Apply colors to lights with ripple offset timing.

        Args:
            scene_state: The active scene state.
            stop_event: Event to signal interruption.
            transition: Optional override for transition time in seconds.
                When provided, bypasses the scene's configured transition_time.
        """
        scene = scene_state.scene
        light_order = scene_state.light_order

        # Use instant transition for initial application (immediate visual feedback)
        # Subsequent transitions use the configured transition_time (or override)
        is_initial = not scene_state.initial_applied
        if transition is not None:
            transition_time = transition
        else:
            transition_time = 0 if is_initial else scene.transition_time

        # Build context for service calls (identifies these as integration-originated)
        context = (
            self._entity_controller.create_context()
            if self._entity_controller
            else None
        )

        # Collect software transition tasks for T1-family devices
        software_tasks: list[asyncio.Task[None]] = []

        for i, entity_id in enumerate(light_order):
            if stop_event.is_set():
                return

            # Skip entities that are externally paused or detached
            if entity_id in scene_state.externally_paused_entities:
                continue

            # Check for partial attribute overrides
            override = OverrideAttributes.NONE
            if self._entity_controller:
                override = self._entity_controller.get_override_attributes(entity_id)

            # Resolve capability profile for this entity early so we can
            # skip ON_OFF_ONLY entities before waiting on the offset delay.
            profile = scene_state.capability_profiles.get(entity_id)

            # Skip entities that cannot display color transitions at all
            if profile and profile.level == LightCapabilityLevel.ON_OFF_ONLY:
                continue

            # Apply offset delay between lights (skip first light, skip on initial)
            if not is_initial and i > 0 and scene.offset_delay > 0:
                try:
                    await asyncio.wait_for(
                        stop_event.wait(), timeout=scene.offset_delay
                    )
                    return  # Stop event was set
                except TimeoutError:
                    pass  # Normal - delay elapsed

            # Get color for this light
            # For shuffle_rotate mode, map through hue-sorted indices for smooth transitions
            position = scene_state.light_color_indices[entity_id]
            if scene.distribution_mode == "shuffle_rotate" and scene_state.hue_sorted_indices:
                color_index = scene_state.hue_sorted_indices[position]
            else:
                color_index = position
            color = scene.colors[color_index]

            # Convert per-color brightness percentage to device value (1-255)
            effective_brightness = brightness_percent_to_device(
                color.brightness_pct
            )

            # Apply audio brightness modifier if active
            if scene_state.brightness_modifier != 1.0:
                effective_brightness = max(
                    1,
                    min(
                        255,
                        round(
                            effective_brightness * scene_state.brightness_modifier
                        ),
                    ),
                )

            # Check if this entity needs software-interpolated transitions
            model_id = scene_state.software_transition_entities.get(entity_id)
            if model_id and transition_time > 0 and override == OverrideAttributes.NONE:
                # Launch async task for software interpolation
                task = asyncio.create_task(
                    self._software_color_transition(
                        entity_id,
                        color.x,
                        color.y,
                        effective_brightness,
                        transition_time,
                        model_id,
                        stop_event,
                        context,
                        profile,
                    )
                )
                software_tasks.append(task)

                _LOGGER.debug(
                    "Software transition for color %d on %s: "
                    "XY(%.4f,%.4f) brightness=%d transition=%ss",
                    color_index,
                    entity_id,
                    color.x,
                    color.y,
                    effective_brightness,
                    transition_time,
                )
            else:
                # Hardware transition path (T2, generic, or initial instant)
                # Build service data adapted to entity capability
                service_data = self._build_adapted_service_data(
                    entity_id,
                    color.x,
                    color.y,
                    effective_brightness,
                    profile,
                    transition=transition_time,
                )
                # ON_OFF_ONLY already filtered above, so service_data
                # will not be None here.

                # Filter overridden attributes from service data
                if override != OverrideAttributes.NONE and service_data:
                    if OverrideAttributes.BRIGHTNESS in override:
                        service_data.pop("brightness", None)
                    if OverrideAttributes.COLOR in override:
                        service_data.pop("xy_color", None)
                        service_data.pop("color_temp_kelvin", None)
                    # If all value keys removed, skip this entity
                    value_keys = {"brightness", "xy_color", "color_temp_kelvin"}
                    if not (set(service_data.keys()) & value_keys):
                        continue

                await self.hass.services.async_call(
                    "light",
                    "turn_on",
                    service_data,
                    blocking=False,
                    context=context,
                )

                _LOGGER.debug(
                    "Applied color %d to %s: XY(%.4f,%.4f) brightness=%d "
                    "transition=%ss%s",
                    color_index,
                    entity_id,
                    color.x,
                    color.y,
                    effective_brightness,
                    transition_time,
                    " (initial)" if is_initial else "",
                )

        # Mark initial application complete
        if is_initial:
            scene_state.initial_applied = True

        # Wait for transitions to complete (skip wait on initial instant transition)
        if software_tasks:
            # Software transition tasks each take transition_time seconds;
            # gather waits for all to finish (or stop early via stop_event)
            await asyncio.gather(*software_tasks, return_exceptions=True)
        elif transition_time > 0:
            # Hardware-only: wait for transition to complete
            try:
                await asyncio.wait_for(
                    stop_event.wait(), timeout=transition_time
                )
            except TimeoutError:
                pass  # Normal - transition time elapsed

            # Refresh grace window after transition completes so the
    async def _software_color_transition(
        self,
        entity_id: str,
        target_x: float,
        target_y: float,
        target_brightness: int,
        transition_time: float,
        model_id: str,
        stop_event: asyncio.Event,
        context: Any | None,
        profile: CapabilityProfile | None = None,
    ) -> None:
        """Perform software-interpolated color transition for T1-family devices.

        T1M and T1 Strip devices don't fully support hardware transitions
        for color changes. This method sends incremental light commands with
        cubic easing to simulate smooth XY color and brightness transitions.

        Args:
            entity_id: The Home Assistant light entity ID
            target_x: Target CIE x coordinate
            target_y: Target CIE y coordinate
            target_brightness: Target brightness level (1-255)
            transition_time: Total transition time in seconds
            model_id: Device model ID for interval selection
            stop_event: Event to signal interruption
            context: HA context for service calls
            profile: Optional capability profile for color adaptation
        """
        # Read current state as starting point
        state = self.hass.states.get(entity_id)
        if state is None or state.state == "unavailable":
            _LOGGER.debug(
                "Entity %s unavailable, applying target directly", entity_id
            )
            # Build adapted service data for unavailable fallback
            fallback_data = self._build_adapted_service_data(
                entity_id,
                target_x,
                target_y,
                target_brightness,
                profile,
            )
            if fallback_data is None:
                return
            await self.hass.services.async_call(
                "light",
                "turn_on",
                fallback_data,
                blocking=False,
                context=context,
            )
            return

        # Get current XY color and brightness
        current_xy = state.attributes.get("xy_color")
        if current_xy and len(current_xy) == 2:
            start_x, start_y = current_xy
        else:
            start_x, start_y = target_x, target_y

        start_brightness = state.attributes.get("brightness", target_brightness)

        # Calculate step interval and count
        step_interval = get_software_step_interval(model_id, transition_time)
        num_steps = max(
            MIN_TRANSITION_STEPS, round(transition_time / step_interval)
        )
        actual_interval = transition_time / num_steps

        # Ensure actual_interval never drops below model minimum
        if actual_interval < step_interval:
            num_steps = max(1, round(transition_time / step_interval))
            actual_interval = transition_time / num_steps

        _LOGGER.debug(
            "Software color transition for %s (%s): %d steps, %.2fs interval, "
            "XY(%.4f,%.4f)->XY(%.4f,%.4f), brightness %d->%d",
            entity_id,
            model_id,
            num_steps,
            actual_interval,
            start_x,
            start_y,
            target_x,
            target_y,
            start_brightness,
            target_brightness,
        )

        for step in range(1, num_steps + 1):
            # Check for stop before each sub-step
            if stop_event.is_set():
                _LOGGER.debug(
                    "Software color transition stopped for %s", entity_id
                )
                return

            # Calculate eased progress
            t = step / num_steps
            eased_t = ease_in_out_cubic(t)

            # Interpolate XY coordinates and brightness
            x = start_x + (target_x - start_x) * eased_t
            y = start_y + (target_y - start_y) * eased_t
            brightness = round(
                start_brightness
                + (target_brightness - start_brightness) * eased_t
            )

            # Build adapted service data for this step
            step_data = self._build_adapted_service_data(
                entity_id, x, y, brightness, profile
            )
            if step_data is None:
                return

            await self.hass.services.async_call(
                "light",
                "turn_on",
                step_data,
                blocking=False,
                context=context,
            )

            # Wait before next sub-step (interruptible)
            if step < num_steps:
                try:
                    await asyncio.wait_for(
                        stop_event.wait(), timeout=actual_interval
                    )
                    _LOGGER.debug(
                        "Software color transition interrupted for %s at"
                        " step %d/%d",
                        entity_id,
                        step,
                        num_steps,
                    )
                    return
                except TimeoutError:
                    pass  # Normal - step interval elapsed

        _LOGGER.debug(
            "Software color transition complete for %s", entity_id
        )

    def _advance_colors(self, scene_state: SceneState) -> None:
        """Advance color indices for the next iteration."""
        scene = scene_state.scene
        num_colors = len(scene.colors)

        if scene.distribution_mode == "synchronized":
            # All lights move to next color together
            scene_state.current_color_index = (
                scene_state.current_color_index + 1
            ) % num_colors
            for entity_id in scene_state.light_color_indices:
                scene_state.light_color_indices[entity_id] = (
                    scene_state.current_color_index
                )

        elif scene.distribution_mode == "shuffle_rotate":
            # All lights advance by 1
            scene_state.current_color_index = (
                scene_state.current_color_index + 1
            ) % num_colors
            for entity_id in scene_state.light_color_indices:
                scene_state.light_color_indices[entity_id] = (
                    scene_state.light_color_indices[entity_id] + 1
                ) % num_colors

        elif scene.distribution_mode == "random":
            # Each light picks a new color using smart selection
            # (avoids transitions through white point)
            scene_state.current_color_index = (
                scene_state.current_color_index + 1
            ) % num_colors
            for entity_id in scene_state.light_color_indices:
                current_idx = scene_state.light_color_indices[entity_id]
                scene_state.light_color_indices[entity_id] = (
                    self._get_smart_next_color(current_idx, scene.colors)
                )

    async def _activate_music_sync(
        self, entity_id: str, t1_params: dict[str, str]
    ) -> None:
        """Activate on-device music sync on a T1 Strip entity.

        Routes through the existing set_music_sync service so that the
        service handler can properly validate the device, capture pre-sync
        state, and fire the expected HA events.
        """
        try:
            await self.hass.services.async_call(
                DOMAIN,
                SERVICE_SET_MUSIC_SYNC,
                {
                    ATTR_ENTITY_ID: entity_id,
                    ATTR_ENABLED: True,
                    ATTR_SENSITIVITY: t1_params["sensitivity"],
                    ATTR_AUDIO_EFFECT: t1_params["audio_effect"],
                },
                blocking=False,
            )
        except Exception:
            _LOGGER.warning(
                "Failed to activate music sync on %s", entity_id, exc_info=True
            )

    async def _deactivate_music_sync(self, entity_id: str) -> None:
        """Deactivate on-device music sync on a T1 Strip entity."""
        try:
            await self.hass.services.async_call(
                DOMAIN,
                SERVICE_SET_MUSIC_SYNC,
                {
                    ATTR_ENTITY_ID: entity_id,
                    ATTR_ENABLED: False,
                },
                blocking=False,
            )
        except Exception:
            _LOGGER.warning(
                "Failed to deactivate music sync on %s", entity_id, exc_info=True
            )

    def _get_entity_audio_config(self) -> dict[str, dict[str, str]]:
        """Load per-entity on-device audio config from GlobalPreferences."""
        store = self.hass.data.get(DOMAIN, {}).get(DATA_USER_PREFERENCES_STORE)
        if store is None:
            return {}
        config = store.get_global_preference("entity_audio_config")
        return config if isinstance(config, dict) else {}

    async def _call_entity_audio_service(
        self,
        entity_id: str,
        config: dict[str, str],
        service_key: str,
        data_key: str,
    ) -> None:
        """Call an on-device audio activate/deactivate service."""
        service = config.get(service_key, "")
        if not service:
            return
        try:
            domain, service_name = service.split(".", 1)
            service_data: dict[str, Any] = {ATTR_ENTITY_ID: entity_id}
            data_str = config.get(data_key, "")
            if data_str:
                extra_data = json.loads(data_str)
                if not isinstance(extra_data, dict):
                    _LOGGER.warning(
                        "Service data for %s is not a dict, ignoring",
                        entity_id,
                    )
                    return
                service_data.update(extra_data)
                service_data[ATTR_ENTITY_ID] = entity_id
            await self.hass.services.async_call(
                domain, service_name, service_data, blocking=False
            )
        except Exception:
            _LOGGER.warning(
                "Failed to call %s on %s", service, entity_id, exc_info=True
            )

    def _create_audio_handler(self, scene: DynamicScene) -> AudioModeHandler:
        """Create the appropriate audio mode handler for the scene."""
        mode = scene.audio_color_advance
        if mode == AUDIO_COLOR_ADVANCE_CONTINUOUS:
            return ContinuousHandler(self)
        elif mode == AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE:
            handler = BeatPredictiveHandler(self, self.hass)
            handler.configure(scene)
            return handler
        elif mode == AUDIO_COLOR_ADVANCE_INTENSITY_BREATHING:
            return IntensityBreathingHandler(self)
        elif mode == AUDIO_COLOR_ADVANCE_ONSET_FLASH:
            return OnsetFlashHandler(self)
        else:  # on_onset is default
            return OnsetHandler(self)

    @staticmethod
    def _split_frequency_zones(
        lights: list[str],
    ) -> tuple[list[str], list[str], list[str]]:
        """Split lights into bass/mid/high groups for frequency zone mode."""
        if len(lights) < 3:
            return lights, [], []
        third = len(lights) // 3
        remainder = len(lights) % 3
        bass_count = third + remainder
        return (
            lights[:bass_count],
            lights[bass_count:bass_count + third],
            lights[bass_count + third:],
        )

    async def _execute_audio_scene(
        self,
        scene_id: str,
        stop_event: asyncio.Event,
        pause_event: asyncio.Event,
    ) -> None:
        """Execute a dynamic scene driven by audio sensor data."""
        scene_state = self._scene_states[scene_id]
        scene = scene_state.scene

        # -- Concurrent audio scene constraint --
        # Only one audio scene may use a given audio entity at a time.
        audio_entity_id = scene.audio_entity
        active_audio_key = f"audio_active_{audio_entity_id}"
        domain_data = self.hass.data.setdefault(DOMAIN, {})
        if active_audio_key in domain_data:
            existing_scene_id = domain_data[active_audio_key]
            _LOGGER.warning(
                "Stopping existing audio scene %s — audio entity %s claimed by %s",
                existing_scene_id,
                audio_entity_id,
                scene_id,
            )
            await self.stop_scene(existing_scene_id)
        domain_data[active_audio_key] = scene_id

        # Partition entities into on-device (T1 Strip), generic on-device, and
        # software-driven lists
        on_device_entities: list[str] = []
        generic_on_device_entities: list[str] = []
        software_entities: list[str] = []

        entity_audio_config = self._get_entity_audio_config()

        for eid in scene_state.entity_ids:
            model_id = get_entity_model_id(self.hass, eid)
            if model_id == MODEL_T1_STRIP:
                on_device_entities.append(eid)
            elif eid in entity_audio_config and entity_audio_config[eid].get(
                CONF_AUDIO_ON_SERVICE
            ):
                generic_on_device_entities.append(eid)
            else:
                software_entities.append(eid)

        # Exclude on-device entities from software color commands by marking
        # them as externally paused — _apply_colors_with_offset skips these.
        on_device_all = set(on_device_entities) | set(generic_on_device_entities)
        scene_state.externally_paused_entities |= on_device_all

        # Activate T1 Strip native music sync for on-device entities
        if on_device_entities:
            t1_params = map_t1_strip_params(scene)
            for eid in on_device_entities:
                await self._activate_music_sync(eid, t1_params)

        # Activate generic on-device audio mode
        for eid in generic_on_device_entities:
            await self._call_entity_audio_service(
                eid, entity_audio_config[eid],
                CONF_AUDIO_ON_SERVICE, CONF_AUDIO_ON_SERVICE_DATA,
            )

        # Map transition speed 1-100 to seconds 2.0-0.1
        transition_seconds = 2.0 - (scene.audio_transition_speed / 100.0) * 1.9

        # Apply initial colors to software-driven entities
        if software_entities:
            await self._apply_colors_with_offset(scene_state, stop_event)

        # Discover companion sensors and configure the ESP32 device
        companions = scene_state.audio_companion_sensors

        # Set detection mode on device
        detection_mode_entity = companions.get("detection_mode")
        if detection_mode_entity:
            await self.hass.services.async_call(
                "select", "select_option",
                {"entity_id": detection_mode_entity, "option": scene.audio_detection_mode},
                blocking=False,
            )

        # Set sensitivity on device
        sensitivity_entity = companions.get("sensitivity")
        if sensitivity_entity:
            try:
                await self.hass.services.async_call(
                    "number", "set_value",
                    {"entity_id": sensitivity_entity, "value": scene.audio_sensitivity},
                    blocking=False,
                )
            except Exception:
                _LOGGER.warning(
                    "Failed to set sensitivity on %s", sensitivity_entity,
                    exc_info=True,
                )
        else:
            _LOGGER.debug(
                "Sensitivity entity not found for %s; using device default",
                scene.audio_entity,
            )

        # Create mode handler
        handler = self._create_audio_handler(scene)

        # -- Frequency zone setup --
        freq_zone_mode = (
            scene.audio_frequency_zone
            and companions.get("bass_energy")
            and companions.get("mid_energy")
            and companions.get("high_energy")
        )
        bass_lights: list[str] = []
        mid_lights: list[str] = []
        high_lights: list[str] = []
        if freq_zone_mode:
            bass_lights, mid_lights, high_lights = self._split_frequency_zones(
                software_entities
            )

        # -- Audio subscription setup --
        # Tagged queue: (event_type, data)
        queue: asyncio.Queue[tuple[str, Any]] = asyncio.Queue(maxsize=50)
        unavailable_since: float | None = None

        # Determine which entities to subscribe to based on mode
        # Build set of entity_ids we care about
        subscribe_entities: set[str] = set()

        # Onset entity for beat-based modes
        onset_entity = companions.get("onset_detected") or scene.audio_entity
        is_onset_mode = scene.audio_color_advance in (
            AUDIO_COLOR_ADVANCE_ON_ONSET,
            AUDIO_COLOR_ADVANCE_ONSET_FLASH,
            AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE,
        )
        is_energy_mode = scene.audio_color_advance in (
            AUDIO_COLOR_ADVANCE_CONTINUOUS,
            AUDIO_COLOR_ADVANCE_INTENSITY_BREATHING,
            AUDIO_COLOR_ADVANCE_ONSET_FLASH,
        )

        if is_onset_mode:
            subscribe_entities.add(onset_entity)

        # Energy entity for continuous/breathing/flash modes
        energy_entity = (
            companions.get("amplitude")
            or companions.get("bass_energy")
        )
        if energy_entity and (is_energy_mode or scene.audio_brightness_response):
            subscribe_entities.add(energy_entity)

        # BPM entity for predictive mode
        bpm_entity = companions.get("bpm")
        if scene.audio_color_advance == AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE and bpm_entity:
            subscribe_entities.add(bpm_entity)

        # Silence entity for all modes if available
        silence_entity = companions.get("silence")
        if silence_entity:
            subscribe_entities.add(silence_entity)

        # Frequency zone band entities
        if freq_zone_mode:
            for band_key in ("bass_energy", "mid_energy", "high_energy"):
                band_eid = companions.get(band_key)
                if band_eid:
                    subscribe_entities.add(band_eid)

        # Fall back if no subscribe entities found (shouldn't happen, but be safe)
        if not subscribe_entities:
            _LOGGER.warning(
                "No audio entities to subscribe to for '%s'; "
                "falling back to audio_entity",
                scene.audio_entity,
            )
            subscribe_entities.add(scene.audio_entity)

        @callback
        def _audio_state_changed(event: Event) -> None:
            """Handle audio sensor state changes."""
            entity_id_val = event.data.get("entity_id")
            if entity_id_val not in subscribe_entities:
                return
            new_state = event.data.get("new_state")
            if new_state is None:
                return
            state_val = new_state.state
            if state_val in ("unavailable", "unknown"):
                try:
                    queue.put_nowait(("unavailable", True))
                except asyncio.QueueFull:
                    pass
                return
            try:
                if entity_id_val == onset_entity and is_onset_mode:
                    if state_val == "on":
                        attrs = {
                            "strength": float(
                                new_state.attributes.get("strength", 1.0)
                            ),
                            "dominant_band": new_state.attributes.get(
                                "dominant_band", "unknown"
                            ),
                            "type": new_state.attributes.get("type", "beat"),
                        }
                        queue.put_nowait(("onset", attrs))
                elif entity_id_val == silence_entity:
                    queue.put_nowait(("silence", state_val == "on"))
                elif entity_id_val == bpm_entity:
                    bpm_val = float(state_val)
                    confidence_attr = int(
                        new_state.attributes.get("confidence", 0)
                    )
                    queue.put_nowait(("bpm", (bpm_val, confidence_attr)))
                elif freq_zone_mode and entity_id_val in (
                    companions.get("bass_energy"),
                    companions.get("mid_energy"),
                    companions.get("high_energy"),
                ):
                    # Tag with band name for frequency zone routing
                    for band_key in ("bass_energy", "mid_energy", "high_energy"):
                        if entity_id_val == companions.get(band_key):
                            queue.put_nowait((f"band_{band_key}", float(state_val)))
                            break
                elif entity_id_val == energy_entity:
                    queue.put_nowait(("energy", float(state_val)))
            except (asyncio.QueueFull, ValueError, TypeError):
                pass

        scene_state.audio_unsub = self.hass.bus.async_listen(
            EVENT_STATE_CHANGED, _audio_state_changed
        )

        def drain_queue() -> dict[str, Any]:
            """Drain queue, keeping only the most recent event of each type."""
            events: dict[str, Any] = {}
            while not queue.empty():
                try:
                    event_type, data = queue.get_nowait()
                    events[event_type] = data
                except asyncio.QueueEmpty:
                    break
            return events

        # Rate limiting for energy-based modes
        last_apply_time = 0.0
        min_apply_interval = max(transition_seconds, 0.1)

        # Track silence state
        in_silence = False

        # -- Main audio loop --
        # Audio scenes always run continuously (loop_mode is ignored) because
        # they react to live audio input until explicitly stopped.
        try:
            while not stop_event.is_set():
                # Check pause state
                if pause_event.is_set():
                    # Unsub while paused; the pause_scene() caller may have
                    # already done this, but guard here too
                    if scene_state.audio_unsub:
                        scene_state.audio_unsub()
                        scene_state.audio_unsub = None
                    while pause_event.is_set() and not stop_event.is_set():
                        await asyncio.sleep(0.1)
                    if stop_event.is_set():
                        break
                    # Re-subscribe on resume
                    scene_state.audio_unsub = self.hass.bus.async_listen(
                        EVENT_STATE_CHANGED, _audio_state_changed
                    )
                    unavailable_since = None
                    scene_state.audio_waiting = False
                    in_silence = False

                # Wait for at least one event, then drain
                try:
                    first_event = await asyncio.wait_for(
                        queue.get(), timeout=1.0
                    )
                except asyncio.TimeoutError:
                    if unavailable_since is not None:
                        elapsed = time.monotonic() - unavailable_since
                        if elapsed > AUDIO_SENSOR_UNAVAILABLE_TIMEOUT:
                            _LOGGER.warning(
                                "Audio sensor '%s' unavailable for %ds, stopping scene",
                                scene.audio_entity,
                                int(elapsed),
                            )
                            break
                    continue

                # Drain remaining events, keeping most recent of each type
                events = drain_queue()
                # Include the first event (drain may have overwritten it)
                first_type, first_data = first_event
                if first_type not in events:
                    events[first_type] = first_data

                # Handle unavailability
                if "unavailable" in events:
                    if unavailable_since is None:
                        unavailable_since = time.monotonic()
                        scene_state.audio_waiting = True
                        _LOGGER.warning(
                            "Audio sensor '%s' unavailable", scene.audio_entity
                        )
                    # If only unavailable events, continue waiting
                    if len(events) == 1:
                        continue

                # Sensor recovered from unavailability (got a real event)
                real_events = {k: v for k, v in events.items() if k != "unavailable"}
                if real_events and unavailable_since is not None:
                    unavailable_since = None
                    scene_state.audio_waiting = False

                # -- Process silence transitions --
                if "silence" in events:
                    silence_val = events["silence"]
                    if silence_val and not in_silence:
                        in_silence = True
                        await handler.enter_silence(scene_state, stop_event)
                    elif not silence_val and in_silence:
                        in_silence = False
                        await handler.exit_silence(scene_state)

                # Skip further processing while in silence (handler manages
                # its own silence cycling via the task spawned in enter_silence)
                if in_silence:
                    continue

                # -- Process BPM updates --
                if "bpm" in events:
                    bpm_val, confidence_val = events["bpm"]
                    if isinstance(handler, BeatPredictiveHandler):
                        handler.update_bpm(bpm_val, confidence_val)

                # -- Process onset events --
                needs_apply = False
                if "onset" in events:
                    handler.handle_onset(scene_state, events["onset"])
                    if is_onset_mode:
                        needs_apply = True

                # -- Process energy events --
                if "energy" in events:
                    handler.handle_energy(scene_state, events["energy"])
                    if is_energy_mode or scene.audio_brightness_response:
                        needs_apply = True

                # -- Process frequency zone band events --
                if freq_zone_mode:
                    for band_key, light_group in [
                        ("bass_energy", bass_lights),
                        ("mid_energy", mid_lights),
                        ("high_energy", high_lights),
                    ]:
                        event_key = f"band_{band_key}"
                        if event_key in events and light_group:
                            band_energy = events[event_key]
                            num_colors = len(scene.colors)
                            if num_colors > 0:
                                pos = max(
                                    0,
                                    min(
                                        int(band_energy * num_colors),
                                        num_colors - 1,
                                    ),
                                )
                                for eid in light_group:
                                    scene_state.light_color_indices[eid] = pos
                            needs_apply = True

                # -- Apply colors with rate limiting --
                if needs_apply:
                    now_mono = time.monotonic()
                    # Rate-limit continuous updates (energy modes, or
                    # brightness-response updates in onset modes)
                    rate_limit = is_energy_mode or (
                        "energy" in events and scene.audio_brightness_response
                        and "onset" not in events
                    )
                    if rate_limit:
                        if (now_mono - last_apply_time) >= min_apply_interval:
                            await self._apply_colors_with_offset(
                                scene_state,
                                stop_event,
                                transition=transition_seconds,
                            )
                            last_apply_time = now_mono
                    else:
                        # Onset-based modes apply immediately
                        await self._apply_colors_with_offset(
                            scene_state,
                            stop_event,
                            transition=transition_seconds,
                        )
                        last_apply_time = now_mono

        finally:
            # Clean up handler
            handler.cleanup()
            # Release audio entity claim
            self.hass.data.get(DOMAIN, {}).pop(active_audio_key, None)
            # Always unsubscribe the audio state listener
            if scene_state.audio_unsub:
                scene_state.audio_unsub()
                scene_state.audio_unsub = None
            # Deactivate T1 Strip music sync for on-device entities
            for eid in on_device_entities:
                await self._deactivate_music_sync(eid)
            # Deactivate generic on-device audio mode
            for eid in generic_on_device_entities:
                await self._call_entity_audio_service(
                    eid, entity_audio_config[eid],
                    CONF_AUDIO_OFF_SERVICE, CONF_AUDIO_OFF_SERVICE_DATA,
                )
            # Restore on-device entities so they're no longer marked as paused
            scene_state.externally_paused_entities -= on_device_all

        # Handle scene end behavior (skip if externally stopped via stop_scene)
        if stop_event.is_set():
            return
        scene_state_final = self._scene_states.get(scene_id)
        if scene_state_final:
            self.hass.bus.async_fire(
                EVENT_DYNAMIC_SCENE_STOPPED,
                {
                    EVENT_ATTR_ENTITY_ID: scene_state_final.entity_ids,
                    EVENT_ATTR_SEQUENCE_ID: scene_id,
                    EVENT_ATTR_SEQUENCE_TYPE: SEQUENCE_TYPE_DYNAMIC_SCENE,
                    EVENT_ATTR_PRESET: scene_state_final.preset_name,
                },
            )
            if scene.end_behavior == "turn_off":
                await self._turn_off_entities(scene_state_final.entity_ids)
            elif scene.end_behavior == "restore":
                await self._restore_states(scene_state_final.entity_ids)
            self._cleanup_scene(scene_id)

    async def _restore_states(self, entity_ids: list[str]) -> None:
        """Restore light states from StateManager."""
        context = (
            self._entity_controller.create_context()
            if self._entity_controller
            else None
        )

        for entity_id in entity_ids:
            try:
                restored = await self.state_manager.async_restore_entity_state(
                    entity_id, blocking=False, context=context,
                )
                if restored:
                    _LOGGER.debug("Restored state for %s", entity_id)
                else:
                    _LOGGER.warning(
                        "No stored state found for %s, skipping restoration",
                        entity_id,
                    )
            except Exception:
                _LOGGER.warning(
                    "Failed to restore state for %s", entity_id, exc_info=True
                )

    async def _turn_off_entities(self, entity_ids: list[str]) -> None:
        """Turn off lights after scene completes."""
        context = (
            self._entity_controller.create_context()
            if self._entity_controller
            else None
        )

        service_data: dict[str, Any] = {ATTR_ENTITY_ID: entity_ids}

        try:
            await self.hass.services.async_call(
                "light",
                "turn_off",
                service_data,
                blocking=True,
                context=context,
            )
            _LOGGER.info(
                "Dynamic scene completed, turned off %d lights", len(entity_ids)
            )
        except Exception:
            _LOGGER.warning(
                "Failed to turn off lights after dynamic scene",
                exc_info=True,
            )
