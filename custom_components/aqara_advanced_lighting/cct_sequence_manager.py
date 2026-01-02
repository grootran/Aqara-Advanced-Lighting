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

    async def start_sequence(
        self, entity_id: str, sequence: CCTSequence
    ) -> str:
        """Start a CCT sequence for an entity.

        Args:
            entity_id: The light entity ID to control
            sequence: The CCT sequence configuration

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
            self._execute_sequence(entity_id, sequence, stop_event, pause_event, sequence_id)
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
    ) -> None:
        """Execute a CCT sequence.

        Args:
            entity_id: The light entity ID to control
            sequence: The CCT sequence configuration
            stop_event: Event to signal sequence should stop
            pause_event: Event to signal sequence should pause
            sequence_id: Unique identifier for this sequence run
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
