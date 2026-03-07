"""Segment Sequence Manager for Aqara Advanced Lighting."""

from __future__ import annotations

import asyncio
import logging
import random
from typing import TYPE_CHECKING, Any

from .base_sequence_manager import BaseSequenceManager
from .const import (
    DATA_SEGMENT_ZONE_STORE,
    DOMAIN,
    SEQUENCE_TYPE_SEGMENT,
)
from .models import SegmentSequence, RGBColor, SegmentColor

if TYPE_CHECKING:
    from .models import SegmentSequenceStep

_LOGGER = logging.getLogger(__name__)


class SegmentSequenceManager(BaseSequenceManager[SegmentSequence]):
    """Manages RGB segment sequence execution as background tasks."""

    _sequence_type = SEQUENCE_TYPE_SEGMENT

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Initialize the segment sequence manager."""
        super().__init__(*args, **kwargs)
        self._total_segments: dict[str, int] = {}

    # -- BaseSequenceManager hooks --

    def _get_start_step(
        self, sequence: SegmentSequence, loops_executed: int
    ) -> int:
        """Skip first step on subsequent loops when skip_first_in_loop is set."""
        if (
            loops_executed > 0
            and sequence.skip_first_in_loop
            and len(sequence.steps) > 1
        ):
            _LOGGER.debug(
                "Skipping first step in loop %d (skip_first_in_loop=True)",
                loops_executed + 1,
            )
            return 1
        return 0

    async def _prepare_execution(
        self, entity_id: str, sequence: SegmentSequence
    ) -> bool:
        """Get segment count and optionally clear segments before starting."""
        total_segments = await self._get_device_segment_count(entity_id)
        _LOGGER.info("Segment count for %s: %d", entity_id, total_segments)
        if total_segments == 0:
            _LOGGER.error(
                "Could not determine segment count for %s", entity_id
            )
            return False

        self._total_segments[entity_id] = total_segments

        _LOGGER.info(
            "Checking clear_segments flag: %s", sequence.clear_segments
        )
        if sequence.clear_segments:
            _LOGGER.info(
                "Clearing all segments for %s before starting sequence",
                entity_id,
            )
            black_color = RGBColor(r=0, g=0, b=0)
            clear_segments = [
                SegmentColor(segment=seg, color=black_color)
                for seg in range(1, total_segments + 1)
            ]
            try:
                await self.backend.async_send_segment_pattern(
                    entity_id, clear_segments
                )
                await asyncio.sleep(0.1)
            except Exception as ex:
                _LOGGER.warning(
                    "Failed to clear segments for %s: %s", entity_id, ex
                )

        return True

    async def _apply_step(
        self,
        entity_id: str,
        sequence: SegmentSequence,
        step: Any,
        step_index: int,
        stop_event: asyncio.Event,
    ) -> bool:
        """Apply a single segment step.

        Handles segment color generation, activation patterns (all-at-once
        or sequential), and duration timing. Returns True if the step
        completed normally, False if interrupted.
        """
        seg_step: SegmentSequenceStep = step
        total_segments = self._total_segments.get(entity_id, 0)

        _LOGGER.debug(
            "Executing step %d/%d for %s: %d colors, mode=%s, pattern=%s",
            step_index + 1,
            len(sequence.steps),
            entity_id,
            len(seg_step.colors),
            seg_step.mode,
            seg_step.activation_pattern,
        )

        # Verify entity is supported by backend
        is_supported, _ = self.backend.is_entity_supported(entity_id)
        if not is_supported:
            _LOGGER.warning(
                "Entity %s not supported by backend, skipping step", entity_id
            )
            return True  # Continue to next step

        # Get segment color assignments
        if seg_step.segment_colors:
            segment_colors = seg_step.segment_colors
            _LOGGER.debug(
                "Using direct segment assignments: %d segments",
                len(segment_colors),
            )
        else:
            segments = self._parse_segment_range(
                seg_step.segments, total_segments, entity_id=entity_id
            )
            if not segments:
                _LOGGER.warning(
                    "No valid segments for step %d", step_index + 1
                )
                return True  # Continue to next step
            segment_colors = self._generate_segment_colors(
                segments, seg_step.colors, seg_step.mode
            )

        # Apply activation pattern
        if seg_step.activation_pattern == "all":
            try:
                await self.backend.async_send_segment_pattern(
                    entity_id, segment_colors
                )
            except Exception as ex:
                _LOGGER.warning(
                    "Failed to apply segment pattern for %s: %s",
                    entity_id,
                    ex,
                )

            # Wait for duration
            if seg_step.duration > 0:
                try:
                    await asyncio.wait_for(
                        stop_event.wait(), timeout=seg_step.duration
                    )
                    _LOGGER.debug(
                        "Sequence stopped during step duration for %s",
                        entity_id,
                    )
                    return False
                except asyncio.TimeoutError:
                    pass  # Normal - duration elapsed
        else:
            # Sequential activation
            segments = [
                sc.segment
                for sc in segment_colors
                if isinstance(sc.segment, int)
            ]
            ordered_segments = self._order_segments_by_pattern(
                segments, seg_step.activation_pattern
            )

            if seg_step.duration > 0 and len(ordered_segments) > 1:
                segment_delay = seg_step.duration / len(ordered_segments)
            else:
                segment_delay = 0

            color_map = {sc.segment: sc.color for sc in segment_colors}

            for segment in ordered_segments:
                if stop_event.is_set():
                    return False

                if segment in color_map:
                    segment_color = SegmentColor(
                        segment=segment, color=color_map[segment]
                    )
                    try:
                        await self.backend.async_send_segment_pattern(
                            entity_id, [segment_color]
                        )
                    except Exception as ex:
                        _LOGGER.warning(
                            "Failed to apply segment %d for %s: %s",
                            segment,
                            entity_id,
                            ex,
                        )

                if segment_delay > 0:
                    try:
                        await asyncio.wait_for(
                            stop_event.wait(), timeout=segment_delay
                        )
                        return False  # Stop event was set
                    except asyncio.TimeoutError:
                        pass  # Normal - delay elapsed

        return True

    # -- Segment-specific helpers --

    def _get_zones_for_entity(self, entity_id: str) -> dict[str, str] | None:
        """Get segment zones for the device associated with an entity.

        Args:
            entity_id: The light entity ID.

        Returns:
            Dict of lowercased zone name to segment range string, or None.
        """
        zone_store = self.hass.data.get(DOMAIN, {}).get(DATA_SEGMENT_ZONE_STORE)
        if not zone_store:
            return None

        aqara_device = self.backend.get_device_for_entity(entity_id)
        if not aqara_device:
            return None

        zones = zone_store.get_zones_for_resolution(aqara_device.identifier)
        return zones if zones else None

    def _parse_segment_range(
        self, segments_str: str, total_segments: int, entity_id: str | None = None
    ) -> list[int]:
        """Parse segment range string into list of segment numbers.

        Args:
            segments_str: Segment specification (e.g., "1-20", "odd", "even", "1,5,10", "all")
            total_segments: Total number of segments available
            entity_id: Optional entity ID for zone name resolution

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

        # Check if the input matches a zone name
        if entity_id:
            zones = self._get_zones_for_entity(entity_id)
            if zones and segments_str in zones:
                _LOGGER.debug(
                    "Resolving zone '%s' to segments '%s'",
                    segments_str,
                    zones[segments_str],
                )
                return self._parse_segment_range(
                    zones[segments_str], total_segments, entity_id=None
                )

        segments = []

        parts = segments_str.split(",")
        for part in parts:
            part = part.strip()
            if "-" in part:
                start_str, end_str = part.split("-", 1)
                start = int(start_str.strip())
                end = int(end_str.strip())
                segments.extend(range(start, end + 1))
            else:
                segments.append(int(part))

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
            for i in range(min(len(segments), len(colors))):
                segment_colors.append(
                    SegmentColor(segment=segments[i], color=colors[i])
                )

        elif mode == "blocks_repeat":
            for i, segment in enumerate(segments):
                color = colors[i % len(colors)]
                segment_colors.append(SegmentColor(segment=segment, color=color))

        elif mode == "blocks_expand":
            block_size = len(segments) // len(colors)
            remainder = len(segments) % len(colors)

            segment_idx = 0
            for color_idx, color in enumerate(colors):
                size = block_size + (1 if color_idx < remainder else 0)
                for _ in range(size):
                    if segment_idx < len(segments):
                        segment_colors.append(
                            SegmentColor(segment=segments[segment_idx], color=color)
                        )
                        segment_idx += 1

        elif mode == "gradient":
            if len(colors) < 2:
                for segment in segments:
                    segment_colors.append(
                        SegmentColor(segment=segment, color=colors[0])
                    )
            else:
                for i, segment in enumerate(segments):
                    position = i / max(len(segments) - 1, 1)
                    color_position = position * (len(colors) - 1)
                    color_idx = int(color_position)
                    color_idx = min(color_idx, len(colors) - 2)
                    local_position = color_position - color_idx

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
            forward = sorted(segments)
            reverse = sorted(segments, reverse=True)[1:-1] if len(segments) > 2 else []
            return forward + reverse
        elif pattern == "center_out":
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
            sorted_segments = sorted(segments)
            return sorted_segments

        return segments

    async def _get_device_segment_count(self, entity_id: str) -> int:
        """Get the segment count for a device.

        For T1 Strip, attempts to read the actual length from entity attributes.
        For fixed segment devices (T1M, T1), returns the fixed count.

        Args:
            entity_id: The light entity ID

        Returns:
            Number of segments, or 0 if unknown
        """
        from .light_capabilities import get_segment_count
        from .const import MODEL_T1_STRIP
        from homeassistant.helpers import entity_registry as er

        try:
            aqara_device = self.backend.get_device_for_entity(entity_id)
            if not aqara_device:
                _LOGGER.debug(
                    "Entity %s not mapped to any backend device", entity_id
                )
                return 0

            base_count = get_segment_count(aqara_device.model_id)

            if base_count != 0:
                return base_count

            if aqara_device.model_id == MODEL_T1_STRIP:
                state = self.hass.states.get(entity_id)
                length_meters = None

                if state and state.attributes:
                    length_meters = state.attributes.get("length")

                if length_meters is None:
                    base_name = (
                        entity_id.split(".", 1)[-1]
                        if "." in entity_id
                        else entity_id
                    )

                    for domain in ["number", "sensor"]:
                        length_entity_id = f"{domain}.{base_name}_length"
                        length_state = self.hass.states.get(length_entity_id)
                        if length_state and length_state.state not in (
                            "unknown",
                            "unavailable",
                        ):
                            try:
                                length_meters = float(length_state.state)
                                _LOGGER.debug(
                                    "Found T1 Strip length from entity %s: %s meters",
                                    length_entity_id,
                                    length_meters,
                                )
                                break
                            except (ValueError, TypeError):
                                pass

                    if length_meters is None:
                        entity_reg = er.async_get(self.hass)

                        light_entity_entry = entity_reg.async_get(entity_id)
                        if (
                            light_entity_entry
                            and light_entity_entry.device_id
                        ):
                            device_entities = er.async_entries_for_device(
                                entity_reg, light_entity_entry.device_id
                            )

                            for entity_entry in device_entities:
                                if entity_entry.domain in [
                                    "number",
                                    "sensor",
                                ]:
                                    if "length" in entity_entry.entity_id.lower() or (
                                        entity_entry.unique_id
                                        and "length"
                                        in entity_entry.unique_id.lower()
                                    ):
                                        length_state = self.hass.states.get(
                                            entity_entry.entity_id
                                        )
                                        if (
                                            length_state
                                            and length_state.state
                                            not in (
                                                "unknown",
                                                "unavailable",
                                            )
                                        ):
                                            try:
                                                length_meters = float(
                                                    length_state.state
                                                )
                                                _LOGGER.debug(
                                                    "Found T1 Strip length from device entity %s: %s meters",
                                                    entity_entry.entity_id,
                                                    length_meters,
                                                )
                                                break
                                            except (ValueError, TypeError):
                                                pass

                if length_meters is not None:
                    try:
                        segment_count = int(float(length_meters) * 5)
                        _LOGGER.debug(
                            "T1 Strip %s: %s meters = %s segments",
                            entity_id,
                            length_meters,
                            segment_count,
                        )
                        return segment_count
                    except (ValueError, TypeError):
                        pass

                _LOGGER.debug(
                    "Could not determine T1 Strip length for %s (no length entity or attribute found), defaulting to 10 segments (2 meters)",
                    entity_id,
                )
                return 10

            return 20

        except Exception as ex:
            _LOGGER.error(
                "Failed to get segment count for %s: %s", entity_id, ex
            )
            return 0
