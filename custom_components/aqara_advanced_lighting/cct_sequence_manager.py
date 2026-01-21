"""CCT Sequence Manager for Aqara Advanced Lighting."""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import TYPE_CHECKING

from .const import (
    EVENT_SEQUENCE_COMPLETED,
    EVENT_SEQUENCE_STARTED,
    EVENT_SEQUENCE_STOPPED,
    EVENT_STEP_CHANGED,
    EVENT_ATTR_ENTITY_ID,
    EVENT_ATTR_LOOP_ITERATION,
    EVENT_ATTR_REASON,
    EVENT_ATTR_SEQUENCE_ID,
    EVENT_ATTR_STEP_INDEX,
    EVENT_ATTR_TOTAL_STEPS,
)
from .models import CCTSequence

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .mqtt_client import MQTTClient

_LOGGER = logging.getLogger(__name__)


class CCTSequenceManager:
    """Manages CCT sequence execution as background tasks."""

    def __init__(self, hass: HomeAssistant, mqtt_client: MQTTClient) -> None:
        """Initialize the CCT sequence manager."""
        self.hass = hass
        self.mqtt_client = mqtt_client
        self._active_sequences: dict[str, asyncio.Task] = {}  # entity_id -> task
        self._stop_flags: dict[str, asyncio.Event] = {}  # entity_id -> stop event
        self._sequence_ids: dict[str, str] = {}  # entity_id -> sequence_id
        self._pause_flags: dict[str, asyncio.Event] = {}  # entity_id -> pause event
        self._sequence_state: dict[str, dict] = {}  # entity_id -> state info
        self._state_listener_remove = None  # State change listener cleanup function
        # Group synchronization support
        self._group_barriers: dict[str, asyncio.Barrier] = {}  # group_id -> barrier
        self._entity_to_group: dict[str, str] = {}  # entity_id -> group_id

        # Setup state change listener to stop sequences when lights turn off
        self._setup_state_listener()

    def _setup_state_listener(self) -> None:
        """Setup state change listener to monitor light entities."""
        from homeassistant.core import callback
        from homeassistant.const import STATE_OFF

        @callback
        def _async_state_changed_listener(event):
            """Handle state changes for light entities."""
            entity_id = event.data.get("entity_id")
            new_state = event.data.get("new_state")

            # Check if entity has a running sequence and is now off
            if (
                entity_id
                and new_state
                and new_state.state == STATE_OFF
                and self.is_sequence_running(entity_id)
            ):
                _LOGGER.debug(
                    "Light %s turned off, stopping CCT sequence", entity_id
                )
                # Stop sequence asynchronously
                self.hass.async_create_task(self.stop_sequence(entity_id))

        # Register the listener for state changes
        self._state_listener_remove = self.hass.bus.async_listen(
            "state_changed", _async_state_changed_listener
        )

    def cleanup(self) -> None:
        """Cleanup resources and remove listeners."""
        # Remove state change listener
        if self._state_listener_remove:
            self._state_listener_remove()
            self._state_listener_remove = None

    async def start_sequence(
        self, entity_id: str, sequence: CCTSequence, z2m_base_topic: str | None = None
    ) -> str:
        """Start a CCT sequence for an entity.

        Args:
            entity_id: The light entity ID to control
            sequence: The CCT sequence configuration
            z2m_base_topic: Optional custom Z2M base topic override

        Returns:
            The unique sequence ID for this sequence run
        """
        # Cancel existing sequence if running
        try:
            await self.stop_sequence(entity_id)
        except Exception as ex:
            _LOGGER.debug("Error stopping existing sequence for %s: %s", entity_id, ex)

        # Generate unique sequence ID
        sequence_id = str(uuid.uuid4())
        self._sequence_ids[entity_id] = sequence_id

        # Create stop and pause flags
        stop_event = asyncio.Event()
        pause_event = asyncio.Event()
        self._stop_flags[entity_id] = stop_event
        self._pause_flags[entity_id] = pause_event

        # Initialize sequence state
        self._sequence_state[entity_id] = {
            "paused": False,
            "current_step": 0,
            "total_steps": len(sequence.steps),
            "loop_iteration": 1,
            "loop_mode": sequence.loop_mode,
            "loop_count": sequence.loop_count,
        }

        # Create and store task
        task = asyncio.create_task(
            self._execute_sequence(
                entity_id, sequence, stop_event, pause_event, sequence_id, z2m_base_topic
            )
        )
        self._active_sequences[entity_id] = task

        # Fire sequence started event
        self.hass.bus.async_fire(
            EVENT_SEQUENCE_STARTED,
            {
                EVENT_ATTR_ENTITY_ID: entity_id,
                EVENT_ATTR_SEQUENCE_ID: sequence_id,
                EVENT_ATTR_TOTAL_STEPS: len(sequence.steps),
            },
        )

        _LOGGER.info("Started CCT sequence for %s (sequence_id=%s)", entity_id, sequence_id)

        return sequence_id

    async def start_synchronized_group(
        self,
        entity_ids: list[str],
        sequence: CCTSequence,
        z2m_base_topic: str | None = None,
    ) -> dict[str, str]:
        """Start synchronized CCT sequences for multiple entities.

        All entities will coordinate their step timing to stay in sync.

        Args:
            entity_ids: List of light entity IDs to control
            sequence: The CCT sequence configuration (same for all)
            z2m_base_topic: Optional custom Z2M base topic override

        Returns:
            Dict mapping entity_id to sequence_id for all started sequences
        """
        if not entity_ids:
            return {}

        # For single entity, use regular start_sequence
        if len(entity_ids) == 1:
            seq_id = await self.start_sequence(entity_ids[0], sequence, z2m_base_topic)
            return {entity_ids[0]: seq_id}

        # Generate a group ID for synchronization
        group_id = str(uuid.uuid4())

        # Stop any existing sequences for these entities in parallel
        stop_tasks = [self.stop_sequence(entity_id) for entity_id in entity_ids]
        await asyncio.gather(*stop_tasks, return_exceptions=True)

        # Create a barrier for step synchronization
        # +1 for potential coordinator overhead, but we use len(entity_ids) parties
        barrier = asyncio.Barrier(len(entity_ids))
        self._group_barriers[group_id] = barrier

        # Prepare all entities
        sequence_ids: dict[str, str] = {}
        tasks: list[asyncio.Task] = []

        for entity_id in entity_ids:
            # Generate unique sequence ID
            sequence_id = str(uuid.uuid4())
            self._sequence_ids[entity_id] = sequence_id
            sequence_ids[entity_id] = sequence_id

            # Track group membership
            self._entity_to_group[entity_id] = group_id

            # Create stop and pause flags
            stop_event = asyncio.Event()
            pause_event = asyncio.Event()
            self._stop_flags[entity_id] = stop_event
            self._pause_flags[entity_id] = pause_event

            # Initialize sequence state
            self._sequence_state[entity_id] = {
                "paused": False,
                "current_step": 0,
                "total_steps": len(sequence.steps),
                "loop_iteration": 1,
                "loop_mode": sequence.loop_mode,
                "loop_count": sequence.loop_count,
                "group_id": group_id,
            }

            # Create task with group synchronization
            task = asyncio.create_task(
                self._execute_synchronized_sequence(
                    entity_id,
                    sequence,
                    stop_event,
                    pause_event,
                    sequence_id,
                    group_id,
                    z2m_base_topic,
                )
            )
            self._active_sequences[entity_id] = task
            tasks.append(task)

            # Fire sequence started event
            self.hass.bus.async_fire(
                EVENT_SEQUENCE_STARTED,
                {
                    EVENT_ATTR_ENTITY_ID: entity_id,
                    EVENT_ATTR_SEQUENCE_ID: sequence_id,
                    EVENT_ATTR_TOTAL_STEPS: len(sequence.steps),
                },
            )

        _LOGGER.info(
            "Started synchronized CCT sequence group %s for %d entities",
            group_id,
            len(entity_ids),
        )

        return sequence_ids

    def _cleanup_group(self, group_id: str) -> None:
        """Clean up group synchronization resources.

        Args:
            group_id: The group ID to clean up
        """
        # Remove barrier
        if group_id in self._group_barriers:
            del self._group_barriers[group_id]

        # Remove entity-to-group mappings for this group
        entities_to_remove = [
            entity_id
            for entity_id, gid in self._entity_to_group.items()
            if gid == group_id
        ]
        for entity_id in entities_to_remove:
            del self._entity_to_group[entity_id]

    async def stop_sequence(self, entity_id: str) -> None:
        """Stop a running CCT sequence.

        Args:
            entity_id: The light entity ID
        """
        # Check if there's actually a sequence running
        if entity_id not in self._active_sequences:
            _LOGGER.debug("No active sequence to stop for %s", entity_id)
            return

        sequence_id = self._sequence_ids.get(entity_id)

        # Set stop flag
        if entity_id in self._stop_flags:
            self._stop_flags[entity_id].set()

        # Cancel and cleanup task
        task = self._active_sequences[entity_id]
        task.cancel()
        try:
            await task
        except (asyncio.CancelledError, Exception) as ex:
            # Log any unexpected exceptions from the task
            if not isinstance(ex, asyncio.CancelledError):
                _LOGGER.debug("Exception while stopping sequence for %s: %s", entity_id, ex)

        # Cleanup all tracking data
        if entity_id in self._active_sequences:
            del self._active_sequences[entity_id]
        if entity_id in self._stop_flags:
            del self._stop_flags[entity_id]
        if entity_id in self._pause_flags:
            del self._pause_flags[entity_id]
        if entity_id in self._sequence_ids:
            del self._sequence_ids[entity_id]
        if entity_id in self._sequence_state:
            del self._sequence_state[entity_id]

        # Fire sequence stopped event
        self.hass.bus.async_fire(
            EVENT_SEQUENCE_STOPPED,
            {
                EVENT_ATTR_ENTITY_ID: entity_id,
                EVENT_ATTR_SEQUENCE_ID: sequence_id,
                EVENT_ATTR_REASON: "manual_stop",
            },
        )

        _LOGGER.info("Stopped CCT sequence for %s", entity_id)

    async def stop_all_sequences(self) -> None:
        """Stop all running CCT sequences."""
        entity_ids = list(self._active_sequences.keys())
        for entity_id in entity_ids:
            await self.stop_sequence(entity_id)

    def is_sequence_running(self, entity_id: str) -> bool:
        """Check if a sequence is running for an entity.

        Args:
            entity_id: The light entity ID

        Returns:
            True if a sequence is currently running
        """
        return entity_id in self._active_sequences

    def get_sequence_id(self, entity_id: str) -> str | None:
        """Get the sequence ID for an entity.

        Args:
            entity_id: The light entity ID

        Returns:
            The sequence ID if a sequence is running, None otherwise
        """
        return self._sequence_ids.get(entity_id)

    def get_running_sequences(self) -> dict[str, str]:
        """Get all running sequences.

        Returns:
            Dict mapping entity_id to sequence_id for all running sequences
        """
        return dict(self._sequence_ids)

    def pause_sequence(self, entity_id: str) -> bool:
        """Pause a running CCT sequence.

        Args:
            entity_id: The light entity ID

        Returns:
            True if sequence was paused, False if no sequence is running
        """
        if entity_id not in self._active_sequences:
            _LOGGER.warning("No active sequence for %s to pause", entity_id)
            return False

        if entity_id in self._sequence_state and self._sequence_state[entity_id].get("paused"):
            _LOGGER.debug("Sequence for %s is already paused", entity_id)
            return True

        # Set pause event
        if entity_id in self._pause_flags:
            self._pause_flags[entity_id].set()
            if entity_id in self._sequence_state:
                self._sequence_state[entity_id]["paused"] = True
            _LOGGER.info("Paused CCT sequence for %s", entity_id)
            return True

        return False

    def resume_sequence(self, entity_id: str) -> bool:
        """Resume a paused CCT sequence.

        Args:
            entity_id: The light entity ID

        Returns:
            True if sequence was resumed, False if no sequence is paused
        """
        if entity_id not in self._active_sequences:
            _LOGGER.warning("No active sequence for %s to resume", entity_id)
            return False

        if entity_id in self._sequence_state and not self._sequence_state[entity_id].get("paused"):
            _LOGGER.debug("Sequence for %s is not paused", entity_id)
            return True

        # Clear pause event
        if entity_id in self._pause_flags:
            self._pause_flags[entity_id].clear()
            if entity_id in self._sequence_state:
                self._sequence_state[entity_id]["paused"] = False
            _LOGGER.info("Resumed CCT sequence for %s", entity_id)
            return True

        return False

    def is_sequence_paused(self, entity_id: str) -> bool:
        """Check if a sequence is paused.

        Args:
            entity_id: The light entity ID

        Returns:
            True if sequence is paused, False otherwise
        """
        if entity_id not in self._sequence_state:
            return False
        return self._sequence_state[entity_id].get("paused", False)

    def get_sequence_status(self, entity_id: str) -> dict | None:
        """Get the current status of a sequence.

        Args:
            entity_id: The light entity ID

        Returns:
            Dict with sequence status info, or None if no sequence is running
        """
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

    async def _execute_sequence(
        self,
        entity_id: str,
        sequence: CCTSequence,
        stop_event: asyncio.Event,
        pause_event: asyncio.Event,
        sequence_id: str,
        z2m_base_topic: str | None = None,
    ) -> None:
        """Execute a CCT sequence.

        Args:
            entity_id: The light entity ID to control
            sequence: The CCT sequence configuration
            stop_event: Event to signal sequence should stop
            pause_event: Event to signal sequence should pause
            sequence_id: Unique identifier for this sequence run
            z2m_base_topic: Optional custom Z2M base topic override
        """
        _LOGGER.debug("Starting CCT sequence for %s (sequence_id=%s)", entity_id, sequence_id)
        completed_naturally = False

        try:
            loops_executed = 0
            max_loops = (
                sequence.loop_count if sequence.loop_mode == "count" else None
            )

            while True:
                # Execute all steps
                for step_index, step in enumerate(sequence.steps):
                    # Check for stop
                    if stop_event.is_set():
                        _LOGGER.debug("Sequence stopped for %s", entity_id)
                        return

                    # Check for pause - wait until unpaused
                    while pause_event.is_set():
                        if stop_event.is_set():
                            _LOGGER.debug("Sequence stopped while paused for %s", entity_id)
                            return
                        await asyncio.sleep(0.1)

                    # Update sequence state
                    if entity_id in self._sequence_state:
                        self._sequence_state[entity_id]["current_step"] = step_index + 1
                        self._sequence_state[entity_id]["loop_iteration"] = loops_executed + 1

                    # Fire step changed event
                    self.hass.bus.async_fire(
                        EVENT_STEP_CHANGED,
                        {
                            EVENT_ATTR_ENTITY_ID: entity_id,
                            EVENT_ATTR_SEQUENCE_ID: sequence_id,
                            EVENT_ATTR_STEP_INDEX: step_index + 1,
                            EVENT_ATTR_TOTAL_STEPS: len(sequence.steps),
                            EVENT_ATTR_LOOP_ITERATION: loops_executed + 1,
                        },
                    )

                    _LOGGER.debug(
                        "Executing step %d/%d for %s: %dK, brightness %d, transition %ss",
                        step_index + 1,
                        len(sequence.steps),
                        entity_id,
                        step.color_temp,
                        step.brightness,
                        step.transition,
                    )

                    # Apply step with software-based transition
                    # The transition is now handled inside async_publish_cct_step()
                    try:
                        transition_completed = await self.mqtt_client.async_publish_cct_step(
                            entity_id,
                            step.color_temp,
                            step.brightness,
                            step.transition,
                            stop_event,  # Pass stop_event for interruptible transitions
                            z2m_base_topic,
                        )
                        if not transition_completed:
                            # Transition was interrupted by stop_event
                            _LOGGER.debug("Transition interrupted for %s", entity_id)
                            return
                    except Exception as ex:
                        _LOGGER.warning(
                            "Failed to apply CCT step %d for %s: %s",
                            step_index + 1,
                            entity_id,
                            ex,
                        )
                        # Continue to next step per requirement

                    # Wait for hold time after transition completes
                    if step.hold > 0:
                        try:
                            await asyncio.wait_for(
                                stop_event.wait(), timeout=step.hold
                            )
                            # Stop event was set
                            _LOGGER.debug("Sequence stopped during step hold for %s", entity_id)
                            return
                        except asyncio.TimeoutError:
                            # Normal - hold time elapsed, continue to next step
                            pass

                # Check loop conditions
                loops_executed += 1

                if sequence.loop_mode == "once":
                    break
                elif sequence.loop_mode == "count" and loops_executed >= max_loops:
                    break
                # For "continuous", loop continues indefinitely

            # Sequence completed naturally
            completed_naturally = True

            if sequence.end_behavior == "turn_off":
                try:
                    await self.mqtt_client.async_turn_off_light(entity_id)
                    _LOGGER.info("CCT sequence completed, turned off %s", entity_id)
                except Exception as ex:
                    _LOGGER.warning("Failed to turn off %s after sequence: %s", entity_id, ex)
            else:
                _LOGGER.info(
                    "CCT sequence completed, maintaining state for %s", entity_id
                )

        except Exception as ex:
            _LOGGER.error(
                "Error executing CCT sequence for %s: %s", entity_id, ex, exc_info=True
            )
        finally:
            # Clean up
            if entity_id in self._active_sequences:
                del self._active_sequences[entity_id]
            if entity_id in self._stop_flags:
                del self._stop_flags[entity_id]
            if entity_id in self._pause_flags:
                del self._pause_flags[entity_id]
            if entity_id in self._sequence_ids:
                del self._sequence_ids[entity_id]
            if entity_id in self._sequence_state:
                del self._sequence_state[entity_id]

            # Fire sequence completed event if it finished naturally
            if completed_naturally:
                self.hass.bus.async_fire(
                    EVENT_SEQUENCE_COMPLETED,
                    {
                        EVENT_ATTR_ENTITY_ID: entity_id,
                        EVENT_ATTR_SEQUENCE_ID: sequence_id,
                    },
                )

    async def _execute_synchronized_sequence(
        self,
        entity_id: str,
        sequence: CCTSequence,
        stop_event: asyncio.Event,
        pause_event: asyncio.Event,
        sequence_id: str,
        group_id: str,
        z2m_base_topic: str | None = None,
    ) -> None:
        """Execute a synchronized CCT sequence with barrier-based step coordination.

        Args:
            entity_id: The light entity ID to control
            sequence: The CCT sequence configuration
            stop_event: Event to signal sequence should stop
            pause_event: Event to signal sequence should pause
            sequence_id: Unique identifier for this sequence run
            group_id: Group ID for barrier synchronization
            z2m_base_topic: Optional custom Z2M base topic override
        """
        _LOGGER.debug(
            "Starting synchronized CCT sequence for %s (sequence_id=%s, group=%s)",
            entity_id,
            sequence_id,
            group_id,
        )
        completed_naturally = False
        barrier = self._group_barriers.get(group_id)

        try:
            loops_executed = 0
            max_loops = (
                sequence.loop_count if sequence.loop_mode == "count" else None
            )

            while True:
                # Execute all steps
                for step_index, step in enumerate(sequence.steps):
                    # Check for stop
                    if stop_event.is_set():
                        _LOGGER.debug("Synchronized sequence stopped for %s", entity_id)
                        return

                    # Check for pause - wait until unpaused
                    while pause_event.is_set():
                        if stop_event.is_set():
                            _LOGGER.debug(
                                "Synchronized sequence stopped while paused for %s",
                                entity_id,
                            )
                            return
                        await asyncio.sleep(0.1)

                    # Synchronize at step boundary - all entities wait here
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
                            barrier = None  # Disable barrier for remaining steps

                    # Update sequence state
                    if entity_id in self._sequence_state:
                        self._sequence_state[entity_id]["current_step"] = step_index + 1
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
                            EVENT_ATTR_TOTAL_STEPS: len(sequence.steps),
                            EVENT_ATTR_LOOP_ITERATION: loops_executed + 1,
                        },
                    )

                    _LOGGER.debug(
                        "Executing synchronized step %d/%d for %s: %dK, brightness %d",
                        step_index + 1,
                        len(sequence.steps),
                        entity_id,
                        step.color_temp,
                        step.brightness,
                    )

                    # Apply step with hardware transition
                    try:
                        transition_completed = (
                            await self.mqtt_client.async_publish_cct_step(
                                entity_id,
                                step.color_temp,
                                step.brightness,
                                step.transition,
                                stop_event,
                                z2m_base_topic,
                            )
                        )
                        if not transition_completed:
                            _LOGGER.debug(
                                "Synchronized transition interrupted for %s", entity_id
                            )
                            return
                    except Exception as ex:
                        _LOGGER.warning(
                            "Failed to apply synchronized CCT step %d for %s: %s",
                            step_index + 1,
                            entity_id,
                            ex,
                        )

                    # Wait for hold time after transition completes
                    if step.hold > 0:
                        try:
                            await asyncio.wait_for(
                                stop_event.wait(), timeout=step.hold
                            )
                            _LOGGER.debug(
                                "Synchronized sequence stopped during hold for %s",
                                entity_id,
                            )
                            return
                        except asyncio.TimeoutError:
                            pass  # Normal - hold time elapsed

                # Check loop conditions
                loops_executed += 1

                if sequence.loop_mode == "once":
                    break
                elif sequence.loop_mode == "count" and loops_executed >= max_loops:
                    break

            # Sequence completed naturally
            completed_naturally = True

            if sequence.end_behavior == "turn_off":
                try:
                    await self.mqtt_client.async_turn_off_light(entity_id)
                    _LOGGER.info(
                        "Synchronized CCT sequence completed, turned off %s", entity_id
                    )
                except Exception as ex:
                    _LOGGER.warning(
                        "Failed to turn off %s after synchronized sequence: %s",
                        entity_id,
                        ex,
                    )
            else:
                _LOGGER.info(
                    "Synchronized CCT sequence completed, maintaining state for %s",
                    entity_id,
                )

        except Exception as ex:
            _LOGGER.error(
                "Error executing synchronized CCT sequence for %s: %s",
                entity_id,
                ex,
                exc_info=True,
            )
        finally:
            # Clean up entity resources
            if entity_id in self._active_sequences:
                del self._active_sequences[entity_id]
            if entity_id in self._stop_flags:
                del self._stop_flags[entity_id]
            if entity_id in self._pause_flags:
                del self._pause_flags[entity_id]
            if entity_id in self._sequence_ids:
                del self._sequence_ids[entity_id]
            if entity_id in self._sequence_state:
                del self._sequence_state[entity_id]
            if entity_id in self._entity_to_group:
                del self._entity_to_group[entity_id]

            # Check if this was the last entity in the group and clean up
            if group_id and not any(
                gid == group_id for gid in self._entity_to_group.values()
            ):
                self._cleanup_group(group_id)

            # Fire sequence completed event if it finished naturally
            if completed_naturally:
                self.hass.bus.async_fire(
                    EVENT_SEQUENCE_COMPLETED,
                    {
                        EVENT_ATTR_ENTITY_ID: entity_id,
                        EVENT_ATTR_SEQUENCE_ID: sequence_id,
                    },
                )
