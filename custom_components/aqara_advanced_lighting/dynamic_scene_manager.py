"""Dynamic Scene Manager for Aqara Advanced Lighting."""

from __future__ import annotations

import asyncio
import logging
import random
import uuid
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant

from .const import (
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
    SEQUENCE_TYPE_DYNAMIC_SCENE,
    brightness_percent_to_device,
)
from .models import DynamicScene, XYColor

if TYPE_CHECKING:
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


class DynamicSceneManager:
    """Manages dynamic scene execution as background tasks."""

    def __init__(
        self,
        hass: HomeAssistant,
        state_manager: StateManager,
    ) -> None:
        """Initialize the dynamic scene manager."""
        self.hass = hass
        self.state_manager = state_manager
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

        # Determine light order for ripple effect
        light_order = list(entity_ids)
        if scene.random_order:
            random.shuffle(light_order)

        # Initialize color indices based on distribution mode
        light_color_indices = self._initialize_color_indices(
            light_order, len(scene.colors), scene.distribution_mode
        )

        # Create scene state
        scene_state = SceneState(
            scene_id=scene_id,
            entity_ids=entity_ids,
            scene=scene,
            preset_name=preset_name,
            light_color_indices=light_color_indices,
            light_order=light_order,
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

    async def stop_scene(
        self,
        entity_ids: list[str] | None = None,
        scene_id: str | None = None,
    ) -> None:
        """Stop running dynamic scene(s).

        Args:
            entity_ids: Optional list of entity IDs to stop scenes for
            scene_id: Optional specific scene ID to stop
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
            await self._stop_single_scene(sid, reason="manual_stop")

    async def _stop_single_scene(
        self, scene_id: str, reason: str = "manual_stop"
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

        # Restore state if needed
        if scene_state and scene_state.scene.end_behavior == "restore":
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
            result[scene_id] = ActiveSceneInfo(
                scene_id=scene_id,
                entity_ids=state.entity_ids,
                preset_name=state.preset_name,
                paused=state.paused,
                loop_iteration=state.loop_iteration,
                current_color_index=state.current_color_index,
            )
        return result

    def cleanup(self) -> None:
        """Cleanup all resources."""
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

        self._active_scenes.pop(scene_id, None)
        self._stop_flags.pop(scene_id, None)
        self._pause_flags.pop(scene_id, None)
        self._scene_states.pop(scene_id, None)

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
                if scene.end_behavior == "restore":
                    await self._restore_states(scene_state.entity_ids)

                # Cleanup
                self._cleanup_scene(scene_id)

    async def _apply_colors_with_offset(
        self,
        scene_state: SceneState,
        stop_event: asyncio.Event,
    ) -> None:
        """Apply colors to lights with ripple offset timing."""
        scene = scene_state.scene
        light_order = scene_state.light_order

        for i, entity_id in enumerate(light_order):
            if stop_event.is_set():
                return

            # Apply offset delay between lights (skip first light)
            if i > 0 and scene.offset_delay > 0:
                try:
                    await asyncio.wait_for(
                        stop_event.wait(), timeout=scene.offset_delay
                    )
                    return  # Stop event was set
                except TimeoutError:
                    pass  # Normal - delay elapsed

            # Get color for this light
            color_index = scene_state.light_color_indices[entity_id]
            color = scene.colors[color_index]

            # Calculate effective brightness (per-color * scene brightness)
            effective_brightness_pct = (
                color.brightness_pct * scene.scene_brightness_pct
            ) // 100
            effective_brightness = brightness_percent_to_device(
                effective_brightness_pct
            )

            # Convert XY to RGB for the light.turn_on call
            xy_color = XYColor(x=color.x, y=color.y)
            rgb_color = xy_color.to_rgb()

            # Send command via HA light service
            await self.hass.services.async_call(
                "light",
                "turn_on",
                {
                    ATTR_ENTITY_ID: entity_id,
                    "rgb_color": [rgb_color.r, rgb_color.g, rgb_color.b],
                    "brightness": effective_brightness,
                    "transition": scene.transition_time,
                },
                blocking=False,
            )

            _LOGGER.debug(
                "Applied color %d to %s: RGB(%d,%d,%d) brightness=%d transition=%ss",
                color_index,
                entity_id,
                rgb_color.r,
                rgb_color.g,
                rgb_color.b,
                effective_brightness,
                scene.transition_time,
            )

        # Wait for transition to complete
        if scene.transition_time > 0:
            try:
                await asyncio.wait_for(
                    stop_event.wait(), timeout=scene.transition_time
                )
            except TimeoutError:
                pass  # Normal - transition time elapsed

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
            # Each light picks a new random color
            scene_state.current_color_index = (
                scene_state.current_color_index + 1
            ) % num_colors
            for entity_id in scene_state.light_color_indices:
                scene_state.light_color_indices[entity_id] = random.randint(
                    0, num_colors - 1
                )

    async def _restore_states(self, entity_ids: list[str]) -> None:
        """Restore light states from StateManager."""
        for entity_id in entity_ids:
            payload = self.state_manager.get_restoration_payload(entity_id)
            if not payload:
                continue

            try:
                service_data: dict[str, Any] = {ATTR_ENTITY_ID: entity_id}

                if payload.get("state") == "off":
                    await self.hass.services.async_call(
                        "light", "turn_off", service_data, blocking=False
                    )
                else:
                    if "brightness" in payload:
                        service_data["brightness"] = payload["brightness"]
                    if "color" in payload:
                        color = payload["color"]
                        service_data["rgb_color"] = [
                            color["r"],
                            color["g"],
                            color["b"],
                        ]
                    if "color_temp" in payload:
                        service_data["color_temp"] = payload["color_temp"]

                    await self.hass.services.async_call(
                        "light", "turn_on", service_data, blocking=False
                    )

                _LOGGER.debug("Restored state for %s", entity_id)
            except Exception:
                _LOGGER.warning("Failed to restore state for %s", entity_id, exc_info=True)
