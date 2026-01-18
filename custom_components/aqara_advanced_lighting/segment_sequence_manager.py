"""Segment Sequence Manager for Aqara Advanced Lighting."""

from __future__ import annotations

import asyncio
import logging
import random
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
from .models import SegmentSequence, RGBColor, SegmentColor

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .mqtt_client import MQTTClient

_LOGGER = logging.getLogger(__name__)


class SegmentSequenceManager:
    """Manages RGB segment sequence execution as background tasks."""

    def __init__(self, hass: HomeAssistant, mqtt_client: MQTTClient) -> None:
        """Initialize the segment sequence manager."""
        self.hass = hass
        self.mqtt_client = mqtt_client
        self._active_sequences: dict[str, asyncio.Task] = {}  # entity_id -> task
        self._stop_flags: dict[str, asyncio.Event] = {}  # entity_id -> stop event
        self._sequence_ids: dict[str, str] = {}  # entity_id -> sequence_id
        self._pause_flags: dict[str, asyncio.Event] = {}  # entity_id -> pause event
        self._sequence_state: dict[str, dict] = {}  # entity_id -> state info
        self._state_listener_remove = None  # State change listener cleanup function

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
                    "Light %s turned off, stopping segment sequence", entity_id
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
        self, entity_id: str, sequence: SegmentSequence, z2m_base_topic: str | None = None
    ) -> str:
        """Start a segment sequence for an entity.

        Args:
            entity_id: The light entity ID to control
            sequence: The segment sequence configuration
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

        _LOGGER.info("Started segment sequence for %s (sequence_id=%s)", entity_id, sequence_id)

        return sequence_id

    async def stop_sequence(self, entity_id: str) -> None:
        """Stop a running segment sequence.

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

        _LOGGER.info("Stopped segment sequence for %s", entity_id)

    async def stop_all_sequences(self) -> None:
        """Stop all running segment sequences."""
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
        """Pause a running segment sequence.

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
            _LOGGER.info("Paused segment sequence for %s", entity_id)
            return True

        return False

    def resume_sequence(self, entity_id: str) -> bool:
        """Resume a paused segment sequence.

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
            _LOGGER.info("Resumed segment sequence for %s", entity_id)
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

    def _parse_segment_range(self, segments_str: str, total_segments: int) -> list[int]:
        """Parse segment range string into list of segment numbers.

        Args:
            segments_str: Segment specification (e.g., "1-20", "odd", "even", "1,5,10", "all")
            total_segments: Total number of segments available

        Returns:
            List of segment numbers to control
        """
        segments_str = segments_str.lower().strip()

        if segments_str == "all":
            return list(range(1, total_segments + 1))
        if segments_str == "odd":
            return list(range(1, total_segments + 1, 2))
        if segments_str == "even":
            return list(range(2, total_segments + 1, 2))

        segments = []

        # Handle comma-separated values
        parts = segments_str.split(",")
        for part in parts:
            part = part.strip()
            if "-" in part:
                # Range: "1-5"
                start_str, end_str = part.split("-", 1)
                start = int(start_str.strip())
                end = int(end_str.strip())
                segments.extend(range(start, end + 1))
            else:
                # Single segment
                segments.append(int(part))

        # Filter out invalid segment numbers and remove duplicates
        valid_segments = sorted(set(s for s in segments if 1 <= s <= total_segments))
        return valid_segments

    def _generate_segment_colors(
        self, segments: list[int], colors: list[RGBColor], mode: str
    ) -> list[SegmentColor]:
        """Generate segment color assignments based on mode.

        Args:
            segments: List of segment numbers to assign colors to
            colors: List of RGB colors to use
            mode: "individual", "blocks_repeat", "blocks_expand", or "gradient"

        Returns:
            List of SegmentColor assignments
        """
        if not segments or not colors:
            return []

        segment_colors = []

        if mode == "individual":
            # Direct 1:1 mapping - colors[i] maps to segments[i]
            # Only map as many segments as we have colors for
            for i in range(min(len(segments), len(colors))):
                segment_colors.append(
                    SegmentColor(segment=segments[i], color=colors[i])
                )

        elif mode == "blocks_repeat":
            # Repeat color pattern across segments
            for i, segment in enumerate(segments):
                color = colors[i % len(colors)]
                segment_colors.append(SegmentColor(segment=segment, color=color))

        elif mode == "blocks_expand":
            # Distribute colors evenly across segments
            block_size = len(segments) // len(colors)
            remainder = len(segments) % len(colors)

            segment_idx = 0
            for color_idx, color in enumerate(colors):
                # Add 1 extra segment to first 'remainder' blocks
                size = block_size + (1 if color_idx < remainder else 0)
                for _ in range(size):
                    if segment_idx < len(segments):
                        segment_colors.append(
                            SegmentColor(segment=segments[segment_idx], color=color)
                        )
                        segment_idx += 1

        elif mode == "gradient":
            # Create gradient between colors
            if len(colors) < 2:
                # Single color - just apply to all
                for segment in segments:
                    segment_colors.append(SegmentColor(segment=segment, color=colors[0]))
            else:
                # Interpolate between colors
                for i, segment in enumerate(segments):
                    # Calculate position in gradient (0.0 to 1.0)
                    position = i / max(len(segments) - 1, 1)
                    # Determine which color pair to interpolate between
                    color_position = position * (len(colors) - 1)
                    color_idx = int(color_position)
                    color_idx = min(color_idx, len(colors) - 2)
                    local_position = color_position - color_idx

                    # Interpolate between adjacent colors
                    color1 = colors[color_idx]
                    color2 = colors[color_idx + 1]

                    r = int(color1.r + (color2.r - color1.r) * local_position)
                    g = int(color1.g + (color2.g - color1.g) * local_position)
                    b = int(color1.b + (color2.b - color1.b) * local_position)

                    interpolated_color = RGBColor(r=r, g=g, b=b)
                    segment_colors.append(
                        SegmentColor(segment=segment, color=interpolated_color)
                    )

        return segment_colors

    def _order_segments_by_pattern(
        self, segments: list[int], pattern: str
    ) -> list[int]:
        """Order segments based on activation pattern.

        Args:
            segments: List of segment numbers
            pattern: Activation pattern name

        Returns:
            Reordered list of segments
        """
        if pattern == "all":
            return segments
        elif pattern == "sequential_forward":
            return sorted(segments)
        elif pattern == "sequential_reverse":
            return sorted(segments, reverse=True)
        elif pattern == "random":
            shuffled = segments.copy()
            random.shuffle(shuffled)
            return shuffled
        elif pattern == "ping_pong":
            # Forward then reverse
            forward = sorted(segments)
            reverse = sorted(segments, reverse=True)[1:-1] if len(segments) > 2 else []
            return forward + reverse
        elif pattern == "center_out":
            # Start from center, move outwards
            sorted_segments = sorted(segments)
            mid = len(sorted_segments) // 2
            result = []
            left, right = mid - 1, mid
            while left >= 0 or right < len(sorted_segments):
                if right < len(sorted_segments):
                    result.append(sorted_segments[right])
                    right += 1
                if left >= 0:
                    result.append(sorted_segments[left])
                    left -= 1
            return result
        elif pattern == "edges_in":
            # Start from edges, move inwards
            sorted_segments = sorted(segments)
            result = []
            left, right = 0, len(sorted_segments) - 1
            while left <= right:
                result.append(sorted_segments[left])
                if left != right:
                    result.append(sorted_segments[right])
                left += 1
                right -= 1
            return result
        elif pattern == "paired":
            # Activate segments in pairs
            sorted_segments = sorted(segments)
            return sorted_segments

        return segments

    async def _execute_sequence(
        self,
        entity_id: str,
        sequence: SegmentSequence,
        stop_event: asyncio.Event,
        pause_event: asyncio.Event,
        sequence_id: str,
        z2m_base_topic: str | None = None,
    ) -> None:
        """Execute a segment sequence.

        Args:
            entity_id: The light entity ID to control
            sequence: The segment sequence configuration
            stop_event: Event to signal sequence should stop
            pause_event: Event to signal sequence should pause
            sequence_id: Unique identifier for this sequence run
            z2m_base_topic: Optional custom Z2M base topic override
        """
        _LOGGER.debug("Starting segment sequence for %s (sequence_id=%s)", entity_id, sequence_id)
        completed_naturally = False

        try:
            # Get total segment count for this device
            total_segments = await self._get_device_segment_count(entity_id)
            _LOGGER.info("Segment count for %s: %d", entity_id, total_segments)
            if total_segments == 0:
                _LOGGER.error("Could not determine segment count for %s", entity_id)
                return

            # Clear all segments if requested (set all to black/off)
            _LOGGER.info("Checking clear_segments flag: %s", sequence.clear_segments)
            if sequence.clear_segments:
                _LOGGER.info("Clearing all segments for %s before starting sequence", entity_id)
                z2m_name = self.mqtt_client.get_z2m_friendly_name(entity_id)
                if z2m_name:
                    # Create black color for all segments
                    black_color = RGBColor(r=0, g=0, b=0)
                    clear_segments = [
                        SegmentColor(segment=seg, color=black_color)
                        for seg in range(1, total_segments + 1)
                    ]
                    try:
                        await self.mqtt_client.async_publish_segment_pattern(
                            z2m_name, clear_segments, z2m_base_topic
                        )
                        # Small delay to ensure segments are cleared before sequence starts
                        await asyncio.sleep(0.1)
                    except Exception as ex:
                        _LOGGER.warning(
                            "Failed to clear segments for %s: %s", entity_id, ex
                        )

            loops_executed = 0
            max_loops = (
                sequence.loop_count if sequence.loop_mode == "count" else None
            )

            while True:
                # Determine starting step index
                # Skip first step on loops after the first iteration if skip_first_in_loop is enabled
                start_step = 0
                if loops_executed > 0 and sequence.skip_first_in_loop and len(sequence.steps) > 1:
                    start_step = 1
                    _LOGGER.debug(
                        "Skipping first step in loop %d for %s (skip_first_in_loop=True)",
                        loops_executed + 1,
                        entity_id
                    )

                # Execute steps (starting from start_step)
                for step_index, step in enumerate(sequence.steps[start_step:], start=start_step):
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
                        "Executing step %d/%d for %s: %d colors, mode=%s, pattern=%s",
                        step_index + 1,
                        len(sequence.steps),
                        entity_id,
                        len(step.colors),
                        step.mode,
                        step.activation_pattern,
                    )

                    # Get Z2M friendly name for publishing
                    z2m_name = self.mqtt_client.get_z2m_friendly_name(entity_id)
                    if not z2m_name:
                        _LOGGER.warning(
                            "Entity %s not mapped to Z2M device, skipping step", entity_id
                        )
                        continue

                    # Use direct segment assignments if provided (like pattern editor)
                    # Otherwise generate from mode (legacy)
                    if step.segment_colors:
                        segment_colors = step.segment_colors
                        _LOGGER.debug(
                            "Using direct segment assignments: %d segments",
                            len(segment_colors),
                        )
                    else:
                        # Parse segments
                        segments = self._parse_segment_range(step.segments, total_segments)
                        if not segments:
                            _LOGGER.warning("No valid segments for step %d", step_index + 1)
                            continue

                        # Generate segment colors
                        segment_colors = self._generate_segment_colors(
                            segments, step.colors, step.mode
                        )

                    # Apply activation pattern
                    if step.activation_pattern == "all":
                        # Activate all segments at once
                        try:
                            await self.mqtt_client.async_publish_segment_pattern(
                                z2m_name, segment_colors, z2m_base_topic
                            )
                        except Exception as ex:
                            _LOGGER.warning(
                                "Failed to apply segment pattern for %s: %s",
                                entity_id,
                                ex,
                            )

                        # Wait for duration (transition/application time)
                        if step.duration > 0:
                            try:
                                await asyncio.wait_for(
                                    stop_event.wait(), timeout=step.duration
                                )
                                _LOGGER.debug("Sequence stopped during step duration for %s", entity_id)
                                return
                            except asyncio.TimeoutError:
                                pass  # Normal - duration elapsed
                    else:
                        # Sequential activation
                        # Extract segment numbers from segment_colors for ordering
                        segments = [sc.segment for sc in segment_colors if isinstance(sc.segment, int)]
                        ordered_segments = self._order_segments_by_pattern(
                            segments, step.activation_pattern
                        )

                        # Calculate delay between segments
                        if step.duration > 0 and len(ordered_segments) > 1:
                            segment_delay = step.duration / len(ordered_segments)
                        else:
                            segment_delay = 0

                        # Create segment color map for lookup
                        color_map = {sc.segment: sc.color for sc in segment_colors}

                        # Activate segments sequentially
                        for segment in ordered_segments:
                            if stop_event.is_set():
                                return

                            if segment in color_map:
                                segment_color = SegmentColor(
                                    segment=segment, color=color_map[segment]
                                )
                                try:
                                    await self.mqtt_client.async_publish_segment_pattern(
                                        z2m_name, [segment_color], z2m_base_topic
                                    )
                                except Exception as ex:
                                    _LOGGER.warning(
                                        "Failed to apply segment %d for %s: %s",
                                        segment,
                                        entity_id,
                                        ex,
                                    )

                            # Wait before next segment
                            if segment_delay > 0:
                                try:
                                    await asyncio.wait_for(
                                        stop_event.wait(), timeout=segment_delay
                                    )
                                    return  # Stop event was set
                                except asyncio.TimeoutError:
                                    pass  # Normal - delay elapsed

                    # Wait for hold time after activation completes
                    if step.hold > 0:
                        try:
                            await asyncio.wait_for(
                                stop_event.wait(), timeout=step.hold
                            )
                            _LOGGER.debug("Sequence stopped during step hold for %s", entity_id)
                            return
                        except asyncio.TimeoutError:
                            pass  # Normal - hold time elapsed

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
                    _LOGGER.info("Segment sequence completed, turned off %s", entity_id)
                except Exception as ex:
                    _LOGGER.warning("Failed to turn off %s after sequence: %s", entity_id, ex)
            else:
                _LOGGER.info(
                    "Segment sequence completed, maintaining state for %s", entity_id
                )

        except Exception as ex:
            _LOGGER.error(
                "Error executing segment sequence for %s: %s", entity_id, ex, exc_info=True
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

    async def _get_device_segment_count(self, entity_id: str) -> int:
        """Get the segment count for a device.

        For T1 Strip, attempts to read the actual length from entity attributes.
        For fixed segment devices (T1M, T1), returns the fixed count.

        Args:
            entity_id: The light entity ID

        Returns:
            Number of segments, or 0 if unknown
        """
        # Import here to avoid circular import
        from .light_capabilities import get_segment_count
        from .const import MODEL_T1_STRIP
        from homeassistant.helpers import entity_registry as er

        try:
            # Get Z2M friendly name from entity
            z2m_name = self.mqtt_client.get_z2m_friendly_name(entity_id)
            if not z2m_name:
                _LOGGER.debug("Entity %s not mapped to Z2M device", entity_id)
                return 0

            # Get device from registry
            device = next(
                (
                    d
                    for d in self.mqtt_client.entry.runtime_data.devices.values()
                    if d.friendly_name == z2m_name
                ),
                None,
            )
            if not device:
                _LOGGER.debug("Z2M device %s not found in registry", z2m_name)
                return 0

            # Get base segment count from model_id
            base_count = get_segment_count(device.model_id)

            # If not T1 Strip (base_count != 0), return the fixed count
            if base_count != 0:
                return base_count

            # For T1 Strip, try to get actual length from entity attributes or separate length entity
            if device.model_id == MODEL_T1_STRIP:
                state = self.hass.states.get(entity_id)
                length_meters = None

                # Try to get length from main entity attributes first
                if state and state.attributes:
                    length_meters = state.attributes.get("length")

                # If not in attributes, try to find separate length entity
                if length_meters is None:
                    # Method 1: Try to build entity ID from light entity name
                    # e.g., light.t1_led_strip -> number.t1_led_strip_length
                    base_name = entity_id.split(".", 1)[-1] if "." in entity_id else entity_id

                    for domain in ["number", "sensor"]:
                        length_entity_id = f"{domain}.{base_name}_length"
                        length_state = self.hass.states.get(length_entity_id)
                        if length_state and length_state.state not in ("unknown", "unavailable"):
                            try:
                                length_meters = float(length_state.state)
                                _LOGGER.debug(
                                    "Found T1 Strip length from entity %s: %s meters",
                                    length_entity_id,
                                    length_meters
                                )
                                break
                            except (ValueError, TypeError):
                                pass

                    # Method 2: If still not found, search device registry for length entity on same device
                    if length_meters is None:
                        entity_reg = er.async_get(self.hass)

                        # Get the light entity's entry to find its device
                        light_entity_entry = entity_reg.async_get(entity_id)
                        if light_entity_entry and light_entity_entry.device_id:
                            # Get all entities for this device
                            device_entities = er.async_entries_for_device(
                                entity_reg, light_entity_entry.device_id
                            )

                            # Look for a length entity (number or sensor with "length" in unique_id or entity_id)
                            for entity_entry in device_entities:
                                if entity_entry.domain in ["number", "sensor"]:
                                    # Check if it's a length entity by looking at unique_id or entity_id
                                    if (
                                        "length" in entity_entry.entity_id.lower()
                                        or (entity_entry.unique_id and "length" in entity_entry.unique_id.lower())
                                    ):
                                        length_state = self.hass.states.get(entity_entry.entity_id)
                                        if length_state and length_state.state not in ("unknown", "unavailable"):
                                            try:
                                                length_meters = float(length_state.state)
                                                _LOGGER.debug(
                                                    "Found T1 Strip length from device entity %s: %s meters",
                                                    entity_entry.entity_id,
                                                    length_meters
                                                )
                                                break
                                            except (ValueError, TypeError):
                                                pass

                # Calculate segment count from length if we found it
                if length_meters is not None:
                    try:
                        # T1 Strip has 5 segments per meter
                        segment_count = int(float(length_meters) * 5)
                        _LOGGER.debug(
                            "T1 Strip %s: %s meters = %s segments",
                            entity_id,
                            length_meters,
                            segment_count
                        )
                        return segment_count
                    except (ValueError, TypeError):
                        pass

                # Default to 2 meters (10 segments) if length unavailable
                _LOGGER.debug(
                    "Could not determine T1 Strip length for %s (no length entity or attribute found), defaulting to 10 segments (2 meters)",
                    entity_id
                )
                return 10

            # For other unknown devices, return a reasonable default
            return 20

        except Exception as ex:
            _LOGGER.error("Failed to get segment count for %s: %s", entity_id, ex)
            return 0
