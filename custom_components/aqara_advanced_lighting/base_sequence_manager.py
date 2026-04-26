"""Base sequence manager for Aqara Advanced Lighting.

Provides the shared infrastructure for CCT and segment sequence execution:
state tracking, start/stop/pause/resume lifecycle, event firing, loop control,
group synchronization, and the core execution loop. Subclasses override
_apply_step() (and optionally _prepare_execution / _get_start_step) to
implement sequence-type-specific behavior.
"""

import asyncio
import logging
import uuid
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any

from .const import (
    EVENT_SEQUENCE_COMPLETED,
    EVENT_SEQUENCE_PAUSED,
    EVENT_SEQUENCE_RESUMED,
    EVENT_SEQUENCE_STARTED,
    EVENT_SEQUENCE_STOPPED,
    EVENT_STEP_CHANGED,
    EVENT_ATTR_ENTITY_ID,
    EVENT_ATTR_LOOP_ITERATION,
    EVENT_ATTR_PRESET,
    EVENT_ATTR_REASON,
    EVENT_ATTR_SEQUENCE_ID,
    EVENT_ATTR_SEQUENCE_TYPE,
    EVENT_ATTR_STEP_INDEX,
    EVENT_ATTR_TOTAL_STEPS,
)
from .events import fire_operations_changed

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .backend_protocol import DeviceBackend
    from .entity_controller import EntityController
    from .state_manager import StateManager

_LOGGER = logging.getLogger(__name__)

class BaseSequenceManager[SequenceT](ABC):
    """Base class for sequence managers with shared lifecycle and execution loop."""

    _sequence_type: str  # Subclass sets to SEQUENCE_TYPE_CCT or SEQUENCE_TYPE_SEGMENT

    def __init__(
        self,
        hass: HomeAssistant,
        backend: DeviceBackend,
        entity_controller: EntityController | None = None,
        state_manager: StateManager | None = None,
    ) -> None:
        """Initialize the sequence manager."""
        self.hass = hass
        self.backend = backend
        self._entity_controller = entity_controller
        self._state_manager = state_manager
        self._active_sequences: dict[str, asyncio.Task] = {}
        self._stop_flags: dict[str, asyncio.Event] = {}
        self._sequence_ids: dict[str, str] = {}
        self._pause_flags: dict[str, asyncio.Event] = {}
        self._sequence_state: dict[str, dict] = {}
        self._sequence_presets: dict[str, str | None] = {}
        self._group_barriers: dict[str, asyncio.Barrier] = {}
        self._entity_to_group: dict[str, str] = {}

    def cleanup(self) -> None:
        """Clean up resources.

        State change listening is now managed by the centralized EntityController.
        """

    # -- Public lifecycle methods --

    async def start_sequence(
        self,
        entity_id: str,
        sequence: SequenceT,
        preset: str | None = None,
    ) -> str:
        """Start a sequence for an entity.

        Args:
            entity_id: The light entity ID to control
            sequence: The sequence configuration
            preset: Optional preset name for event tracking

        Returns:
            The unique sequence ID for this sequence run
        """
        try:
            await self.stop_sequence(entity_id)
        except Exception as ex:
            _LOGGER.debug("Error stopping existing sequence for %s: %s", entity_id, ex)

        sequence_id = str(uuid.uuid4())
        self._sequence_ids[entity_id] = sequence_id
        self._sequence_presets[entity_id] = preset

        stop_event = asyncio.Event()
        pause_event = asyncio.Event()
        self._stop_flags[entity_id] = stop_event
        self._pause_flags[entity_id] = pause_event

        self._sequence_state[entity_id] = {
            "paused": False,
            "current_step": 0,
            "total_steps": len(sequence.steps),  # type: ignore[attr-defined]
            "loop_iteration": 1,
            "loop_mode": sequence.loop_mode,  # type: ignore[attr-defined]
            "loop_count": sequence.loop_count,  # type: ignore[attr-defined]
        }

        task = asyncio.create_task(
            self._run_loop(entity_id, sequence, stop_event, pause_event, sequence_id)
        )
        self._active_sequences[entity_id] = task

        self.hass.bus.async_fire(
            EVENT_SEQUENCE_STARTED,
            {
                EVENT_ATTR_ENTITY_ID: entity_id,
                EVENT_ATTR_SEQUENCE_ID: sequence_id,
                EVENT_ATTR_TOTAL_STEPS: len(sequence.steps),  # type: ignore[attr-defined]
                EVENT_ATTR_SEQUENCE_TYPE: self._sequence_type,
                EVENT_ATTR_PRESET: preset,
            },
        )

        _LOGGER.info(
            "Started %s sequence for %s (sequence_id=%s)",
            self._sequence_type,
            entity_id,
            sequence_id,
        )
        fire_operations_changed(self.hass)
        return sequence_id

    async def start_synchronized_group(
        self,
        entity_ids: list[str],
        sequence: SequenceT,
        preset: str | None = None,
    ) -> dict[str, str]:
        """Start synchronized sequences for multiple entities.

        All entities will coordinate their step timing to stay in sync.

        Args:
            entity_ids: List of light entity IDs to control
            sequence: The sequence configuration (same for all)
            preset: Optional preset name for event tracking

        Returns:
            Dict mapping entity_id to sequence_id for all started sequences
        """
        if not entity_ids:
            return {}

        if len(entity_ids) == 1:
            seq_id = await self.start_sequence(entity_ids[0], sequence, preset)
            return {entity_ids[0]: seq_id}

        group_id = str(uuid.uuid4())

        stop_tasks = [self.stop_sequence(entity_id) for entity_id in entity_ids]
        await asyncio.gather(*stop_tasks, return_exceptions=True)

        barrier = asyncio.Barrier(len(entity_ids))
        self._group_barriers[group_id] = barrier

        sequence_ids: dict[str, str] = {}

        for entity_id in entity_ids:
            sequence_id = str(uuid.uuid4())
            self._sequence_ids[entity_id] = sequence_id
            self._sequence_presets[entity_id] = preset
            sequence_ids[entity_id] = sequence_id

            self._entity_to_group[entity_id] = group_id

            stop_event = asyncio.Event()
            pause_event = asyncio.Event()
            self._stop_flags[entity_id] = stop_event
            self._pause_flags[entity_id] = pause_event

            self._sequence_state[entity_id] = {
                "paused": False,
                "current_step": 0,
                "total_steps": len(sequence.steps),  # type: ignore[attr-defined]
                "loop_iteration": 1,
                "loop_mode": sequence.loop_mode,  # type: ignore[attr-defined]
                "loop_count": sequence.loop_count,  # type: ignore[attr-defined]
                "group_id": group_id,
            }

            task = asyncio.create_task(
                self._run_loop(
                    entity_id, sequence, stop_event, pause_event,
                    sequence_id, group_id=group_id,
                )
            )
            self._active_sequences[entity_id] = task

            self.hass.bus.async_fire(
                EVENT_SEQUENCE_STARTED,
                {
                    EVENT_ATTR_ENTITY_ID: entity_id,
                    EVENT_ATTR_SEQUENCE_ID: sequence_id,
                    EVENT_ATTR_TOTAL_STEPS: len(sequence.steps),  # type: ignore[attr-defined]
                    EVENT_ATTR_SEQUENCE_TYPE: self._sequence_type,
                    EVENT_ATTR_PRESET: preset,
                },
            )

        _LOGGER.info(
            "Started synchronized %s sequence group %s for %d entities",
            self._sequence_type,
            group_id,
            len(entity_ids),
        )
        fire_operations_changed(self.hass)
        return sequence_ids

    async def stop_sequence(self, entity_id: str) -> None:
        """Stop a running sequence.

        Args:
            entity_id: The light entity ID
        """
        if entity_id not in self._active_sequences:
            _LOGGER.debug("No active sequence to stop for %s", entity_id)
            return

        sequence_id = self._sequence_ids.get(entity_id)
        preset = self._sequence_presets.get(entity_id)

        if entity_id in self._stop_flags:
            self._stop_flags[entity_id].set()

        task = self._active_sequences[entity_id]
        task.cancel()
        try:
            await task
        except (asyncio.CancelledError, Exception) as ex:
            if not isinstance(ex, asyncio.CancelledError):
                _LOGGER.debug(
                    "Exception while stopping sequence for %s: %s", entity_id, ex
                )

        self._cleanup_entity(entity_id)

        self.hass.bus.async_fire(
            EVENT_SEQUENCE_STOPPED,
            {
                EVENT_ATTR_ENTITY_ID: entity_id,
                EVENT_ATTR_SEQUENCE_ID: sequence_id,
                EVENT_ATTR_REASON: "manual_stop",
                EVENT_ATTR_SEQUENCE_TYPE: self._sequence_type,
                EVENT_ATTR_PRESET: preset,
            },
        )

        _LOGGER.info("Stopped %s sequence for %s", self._sequence_type, entity_id)
        fire_operations_changed(self.hass)

    async def stop_all_sequences(self) -> None:
        """Stop all running sequences."""
        entity_ids = list(self._active_sequences.keys())
        for entity_id in entity_ids:
            await self.stop_sequence(entity_id)
        # No trailing fire needed: each stop_sequence call above fires individually
        # (coalescer merges them into one event for subscribers).

    # -- Query methods --

    def is_sequence_running(self, entity_id: str) -> bool:
        """Check if a sequence is running for an entity."""
        return entity_id in self._active_sequences

    def get_sequence_id(self, entity_id: str) -> str | None:
        """Get the sequence ID for an entity."""
        return self._sequence_ids.get(entity_id)

    def get_sequence_preset(self, entity_id: str) -> str | None:
        """Get the preset name for a running sequence."""
        return self._sequence_presets.get(entity_id)

    def get_running_sequences(self) -> dict[str, str]:
        """Get all running sequences as entity_id -> sequence_id."""
        return dict(self._sequence_ids)

    def get_active_sequence_entities(self) -> set[str]:
        """Get all entity IDs with active sequences."""
        return set(self._active_sequences.keys())

    # -- Pause / resume --

    def pause_sequence(self, entity_id: str) -> bool:
        """Pause a running sequence.

        Returns:
            True if sequence was paused, False if no sequence is running
        """
        if entity_id not in self._active_sequences:
            _LOGGER.warning("No active sequence for %s to pause", entity_id)
            return False

        if entity_id in self._sequence_state and self._sequence_state[entity_id].get(
            "paused"
        ):
            _LOGGER.debug("Sequence for %s is already paused", entity_id)
            return True

        if entity_id in self._pause_flags:
            self._pause_flags[entity_id].set()
            if entity_id in self._sequence_state:
                self._sequence_state[entity_id]["paused"] = True

            sequence_id = self._sequence_ids.get(entity_id, "")
            preset = self._sequence_presets.get(entity_id)
            self.hass.bus.async_fire(
                EVENT_SEQUENCE_PAUSED,
                {
                    EVENT_ATTR_ENTITY_ID: entity_id,
                    EVENT_ATTR_SEQUENCE_ID: sequence_id,
                    EVENT_ATTR_SEQUENCE_TYPE: self._sequence_type,
                    EVENT_ATTR_PRESET: preset,
                },
            )

            _LOGGER.info(
                "Paused %s sequence for %s", self._sequence_type, entity_id
            )
            fire_operations_changed(self.hass)
            return True

        return False

    def resume_sequence(self, entity_id: str) -> bool:
        """Resume a paused sequence.

        Returns:
            True if sequence was resumed, False if no sequence is paused
        """
        if entity_id not in self._active_sequences:
            _LOGGER.warning("No active sequence for %s to resume", entity_id)
            return False

        if entity_id in self._sequence_state and not self._sequence_state[
            entity_id
        ].get("paused"):
            _LOGGER.debug("Sequence for %s is not paused", entity_id)
            return True

        if entity_id in self._pause_flags:
            self._pause_flags[entity_id].clear()
            if entity_id in self._sequence_state:
                self._sequence_state[entity_id]["paused"] = False

            sequence_id = self._sequence_ids.get(entity_id, "")
            preset = self._sequence_presets.get(entity_id)
            self.hass.bus.async_fire(
                EVENT_SEQUENCE_RESUMED,
                {
                    EVENT_ATTR_ENTITY_ID: entity_id,
                    EVENT_ATTR_SEQUENCE_ID: sequence_id,
                    EVENT_ATTR_SEQUENCE_TYPE: self._sequence_type,
                    EVENT_ATTR_PRESET: preset,
                },
            )

            _LOGGER.info(
                "Resumed %s sequence for %s", self._sequence_type, entity_id
            )
            fire_operations_changed(self.hass)
            return True

        return False

    def is_sequence_paused(self, entity_id: str) -> bool:
        """Check if a sequence is paused."""
        if entity_id not in self._sequence_state:
            return False
        return self._sequence_state[entity_id].get("paused", False)

    def get_sequence_status(self, entity_id: str) -> dict | None:
        """Get the current status of a sequence."""
        if entity_id not in self._active_sequences:
            return None

        state = self._sequence_state.get(entity_id, {})
        return {
            "entity_id": entity_id,
            "sequence_id": self._sequence_ids.get(entity_id),
            "running": True,
            "paused": state.get("paused", False),
            "current_step": state.get("current_step", 0),
            "total_steps": state.get("total_steps", 0),
            "loop_iteration": state.get("loop_iteration", 1),
            "loop_mode": state.get("loop_mode"),
            "loop_count": state.get("loop_count"),
        }

    # -- Internal helpers --

    def _cleanup_entity(self, entity_id: str) -> None:
        """Remove all tracking data for an entity."""
        for d in (
            self._active_sequences,
            self._stop_flags,
            self._pause_flags,
            self._sequence_ids,
            self._sequence_state,
            self._sequence_presets,
        ):
            d.pop(entity_id, None)  # type: ignore[arg-type]

        if self._entity_controller:
            self._entity_controller.clear_entity(entity_id)

    def _cleanup_group(self, group_id: str) -> None:
        """Clean up group synchronization resources."""
        self._group_barriers.pop(group_id, None)

        entities_to_remove = [
            eid for eid, gid in self._entity_to_group.items() if gid == group_id
        ]
        for eid in entities_to_remove:
            del self._entity_to_group[eid]

    async def _restore_entity_state(self, entity_id: str) -> None:
        """Restore a single entity to its previously captured state."""
        if not self._state_manager:
            _LOGGER.warning(
                "Cannot restore state for %s: no state manager available",
                entity_id,
            )
            return

        context = (
            self._entity_controller.create_context()
            if self._entity_controller
            else None
        )

        try:
            restored = await self._state_manager.async_restore_entity_state(
                entity_id, blocking=False, context=context,
            )
            if restored:
                _LOGGER.info(
                    "%s sequence completed, restored previous state for %s",
                    self._sequence_type.upper(),
                    entity_id,
                )
            else:
                _LOGGER.warning(
                    "No stored state found for %s, skipping restoration",
                    entity_id,
                )
        except Exception:
            _LOGGER.warning(
                "Failed to restore state for %s after %s sequence",
                entity_id,
                self._sequence_type,
                exc_info=True,
            )

    # -- Subclass hooks --

    @abstractmethod
    async def _apply_step(
        self,
        entity_id: str,
        sequence: SequenceT,
        step: Any,
        step_index: int,
        stop_event: asyncio.Event,
    ) -> bool:
        """Apply a single sequence step.

        Returns True if the step completed normally and the loop should
        continue to the hold wait + next step. Returns False if the step
        was interrupted and the sequence should exit immediately.
        """

    async def _prepare_execution(
        self, entity_id: str, sequence: SequenceT
    ) -> bool:
        """Pre-loop setup hook. Return False to abort the sequence."""
        return True

    def _get_start_step(self, sequence: SequenceT, loops_executed: int) -> int:
        """Get the starting step index for a loop iteration.

        Override to skip steps on subsequent loops (e.g. skip_first_in_loop).
        """
        return 0

    # -- Core execution loop --

    async def _run_loop(
        self,
        entity_id: str,
        sequence: SequenceT,
        stop_event: asyncio.Event,
        pause_event: asyncio.Event,
        sequence_id: str,
        *,
        group_id: str | None = None,
    ) -> None:
        """Core sequence execution loop with optional group synchronization.

        Handles stop/pause checks, state updates, event firing, loop conditions,
        end behavior, and cleanup. Delegates step application to _apply_step().
        """
        _LOGGER.debug(
            "Starting %s sequence for %s (sequence_id=%s%s)",
            self._sequence_type,
            entity_id,
            sequence_id,
            f", group={group_id}" if group_id else "",
        )
        completed_naturally = False
        barrier = self._group_barriers.get(group_id) if group_id else None

        try:
            if not await self._prepare_execution(entity_id, sequence):
                return

            loops_executed = 0
            max_loops = (
                sequence.loop_count  # type: ignore[attr-defined]
                if sequence.loop_mode == "count"  # type: ignore[attr-defined]
                else None
            )

            while True:
                start_step = self._get_start_step(sequence, loops_executed)
                steps = sequence.steps  # type: ignore[attr-defined]

                for step_index, step in enumerate(
                    steps[start_step:], start=start_step
                ):
                    # Check for stop
                    if stop_event.is_set():
                        _LOGGER.debug(
                            "Sequence stopped for %s", entity_id
                        )
                        return

                    # Check for pause
                    while pause_event.is_set():
                        if stop_event.is_set():
                            _LOGGER.debug(
                                "Sequence stopped while paused for %s", entity_id
                            )
                            return
                        await asyncio.sleep(0.1)

                    # Barrier synchronization for group sequences
                    if barrier is not None:
                        try:
                            await asyncio.wait_for(barrier.wait(), timeout=5.0)
                        except asyncio.TimeoutError:
                            _LOGGER.warning(
                                "Barrier timeout for %s at step %d, continuing",
                                entity_id,
                                step_index + 1,
                            )
                        except asyncio.BrokenBarrierError:
                            _LOGGER.debug(
                                "Barrier broken for %s, continuing independently",
                                entity_id,
                            )
                            barrier = None

                    # Update sequence state
                    if entity_id in self._sequence_state:
                        self._sequence_state[entity_id]["current_step"] = (
                            step_index + 1
                        )
                        self._sequence_state[entity_id]["loop_iteration"] = (
                            loops_executed + 1
                        )

                    # Fire step changed event
                    self.hass.bus.async_fire(
                        EVENT_STEP_CHANGED,
                        {
                            EVENT_ATTR_ENTITY_ID: entity_id,
                            EVENT_ATTR_SEQUENCE_ID: sequence_id,
                            EVENT_ATTR_STEP_INDEX: step_index + 1,
                            EVENT_ATTR_TOTAL_STEPS: len(steps),
                            EVENT_ATTR_LOOP_ITERATION: loops_executed + 1,
                            EVENT_ATTR_SEQUENCE_TYPE: self._sequence_type,
                            EVENT_ATTR_PRESET: self._sequence_presets.get(
                                entity_id
                            ),
                        },
                    )

                    # Apply the step (subclass-specific)
                    step_completed = await self._apply_step(
                        entity_id, sequence, step, step_index, stop_event
                    )
                    if not step_completed:
                        return

                    # Wait for hold time after step completes
                    if step.hold > 0:
                        try:
                            await asyncio.wait_for(
                                stop_event.wait(), timeout=step.hold
                            )
                            _LOGGER.debug(
                                "Sequence stopped during step hold for %s",
                                entity_id,
                            )
                            return
                        except asyncio.TimeoutError:
                            pass  # Normal - hold time elapsed

                # Check loop conditions
                loops_executed += 1

                match sequence.loop_mode:  # type: ignore[attr-defined]
                    case "once":
                        break
                    case "count" if loops_executed >= max_loops:
                        break
                    # "continuous" continues indefinitely

            # Sequence completed naturally
            completed_naturally = True

            match sequence.end_behavior:  # type: ignore[attr-defined]
                case "turn_off":
                    try:
                        await self.backend.async_turn_off_light(entity_id)
                        _LOGGER.info(
                            "%s sequence completed, turned off %s",
                            self._sequence_type.upper(),
                            entity_id,
                        )
                    except Exception as ex:
                        _LOGGER.warning(
                            "Failed to turn off %s after sequence: %s", entity_id, ex
                        )
                case "restore":
                    await self._restore_entity_state(entity_id)
                case _:
                    _LOGGER.info(
                        "%s sequence completed, maintaining state for %s",
                        self._sequence_type.upper(),
                        entity_id,
                    )

        except Exception as ex:
            _LOGGER.error(
                "Error executing %s sequence for %s: %s",
                self._sequence_type,
                entity_id,
                ex,
                exc_info=True,
            )
        finally:
            preset = self._sequence_presets.get(entity_id)

            self._cleanup_entity(entity_id)

            # Group cleanup for synchronized sequences
            if group_id:
                self._entity_to_group.pop(entity_id, None)
                if not any(
                    gid == group_id for gid in self._entity_to_group.values()
                ):
                    self._cleanup_group(group_id)

            if completed_naturally:
                self.hass.bus.async_fire(
                    EVENT_SEQUENCE_COMPLETED,
                    {
                        EVENT_ATTR_ENTITY_ID: entity_id,
                        EVENT_ATTR_SEQUENCE_ID: sequence_id,
                        EVENT_ATTR_SEQUENCE_TYPE: self._sequence_type,
                        EVENT_ATTR_PRESET: preset,
                    },
                )

            # Sequence run ended (naturally, cancelled, or errored). Either
            # way the running-operations snapshot just changed because
            # _cleanup_entity removed this entity from the active maps.
            fire_operations_changed(self.hass)
