"""Dynamic Scene Manager for Aqara Advanced Lighting."""

from __future__ import annotations

import asyncio
import logging
import math
import random
import uuid
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant

from .const import (
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
    MAX_COLOR_TEMP_KELVIN,
    MIN_COLOR_TEMP_KELVIN,
    MIN_TRANSITION_STEPS,
    OverrideAttributes,
    SEQUENCE_TYPE_DYNAMIC_SCENE,
    SOFTWARE_TRANSITION_MODELS,
    brightness_percent_to_device,
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

            result[scene_id] = ActiveSceneInfo(
                scene_id=scene_id,
                entity_ids=state.entity_ids,
                preset_name=state.preset_name,
                paused=state.paused,
                loop_iteration=state.loop_iteration,
                current_color_index=state.current_color_index,
                entity_capabilities=entity_capabilities,
            )
        return result

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
    ) -> None:
        """Apply colors to lights with ripple offset timing."""
        scene = scene_state.scene
        light_order = scene_state.light_order

        # Use instant transition for initial application (immediate visual feedback)
        # Subsequent transitions use the configured transition_time
        is_initial = not scene_state.initial_applied
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
