"""Segment utility functions for parsing and expanding segment ranges."""

from __future__ import annotations

import logging
import re

_LOGGER = logging.getLogger(__name__)


def parse_segment_range(segment_str: str | int, max_segments: int = 100) -> list[int]:
    """Parse a segment string or int into a list of segment numbers.

    Supports:
    - Single segment: 5 -> [5]
    - Range: "1-10" -> [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    - Multiple ranges: "1-5,10-15" -> [1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15]
    - Odd segments: "odd" -> [1, 3, 5, 7, ...]
    - Even segments: "even" -> [2, 4, 6, 8, ...]
    - First half: "first-half" -> first half of segments
    - Second half: "second-half" -> second half of segments

    Args:
        segment_str: Segment specification (int or string)
        max_segments: Maximum number of segments available

    Returns:
        List of segment numbers
    """
    # Handle integer input
    if isinstance(segment_str, int):
        return [segment_str]

    # Convert to string and strip whitespace
    segment_str = str(segment_str).strip().lower()

    segments: list[int] = []

    # Handle special keywords
    if segment_str == "odd":
        return list(range(1, max_segments + 1, 2))

    if segment_str == "even":
        return list(range(2, max_segments + 1, 2))

    if segment_str == "first-half":
        half = max_segments // 2
        return list(range(1, half + 1))

    if segment_str == "second-half":
        half = max_segments // 2
        return list(range(half + 1, max_segments + 1))

    if segment_str == "all":
        return list(range(1, max_segments + 1))

    # Split by comma for multiple ranges
    parts = segment_str.split(",")

    for part in parts:
        part = part.strip()

        # Check if it's a range (e.g., "1-10")
        if "-" in part and not part.startswith("-"):
            range_match = re.match(r"^(\d+)-(\d+)$", part)
            if range_match:
                start = int(range_match.group(1))
                end = int(range_match.group(2))
                if start <= end:
                    segments.extend(range(start, end + 1))
                else:
                    _LOGGER.warning(
                        "Invalid range %s: start > end, skipping", part
                    )
            else:
                _LOGGER.warning("Invalid range format: %s, skipping", part)
        else:
            # Single segment number
            try:
                seg_num = int(part)
                segments.append(seg_num)
            except ValueError:
                _LOGGER.warning("Invalid segment number: %s, skipping", part)

    # Remove duplicates and sort
    segments = sorted(set(segments))

    # Filter out segments beyond max_segments
    segments = [s for s in segments if 0 < s <= max_segments]

    return segments


def expand_segment_colors(
    segment_colors: list[dict[str, any]], max_segments: int = 100
) -> list[dict[str, any]]:
    """Expand segment color definitions with ranges into individual segments.

    Args:
        segment_colors: List of segment/color pairs (may include ranges)
        max_segments: Maximum number of segments

    Returns:
        List of individual segment/color pairs
    """
    expanded = []

    for item in segment_colors:
        segment = item.get("segment")
        color = item.get("color")

        if not color:
            _LOGGER.warning("Segment color item missing color: %s", item)
            continue

        # Parse segment(s)
        segment_list = parse_segment_range(segment, max_segments)

        # Create individual entries for each segment
        for seg_num in segment_list:
            expanded.append({"segment": seg_num, "color": color})

    return expanded


def generate_gradient_colors(
    colors: list[dict[str, int]], segment_count: int
) -> list[dict[str, any]]:
    """Generate gradient segment colors from a list of colors.

    Creates a smooth gradient by interpolating between the provided colors
    across all segments.

    Args:
        colors: List of RGB color dicts (r, g, b)
        segment_count: Number of segments to generate gradient for

    Returns:
        List of segment/color pairs for each segment
    """
    if segment_count < 1:
        return []

    if len(colors) < 2:
        # Not enough colors for gradient, just fill with the single color
        return [
            {"segment": i, "color": colors[0]} for i in range(1, segment_count + 1)
        ]

    segment_colors = []

    # Calculate how many segments per color transition
    num_transitions = len(colors) - 1
    segments_per_transition = segment_count / num_transitions

    for i in range(segment_count):
        # Determine which color pair we're interpolating between
        position = i / (segment_count - 1) if segment_count > 1 else 0
        color_index = position * num_transitions

        # Get the two colors to interpolate between
        color1_idx = int(color_index)
        color2_idx = min(color1_idx + 1, len(colors) - 1)

        # Calculate interpolation factor
        factor = color_index - color1_idx

        # Get the two colors
        color1 = colors[color1_idx]
        color2 = colors[color2_idx]

        # Interpolate RGB values
        r = int(color1["r"] + (color2["r"] - color1["r"]) * factor)
        g = int(color1["g"] + (color2["g"] - color1["g"]) * factor)
        b = int(color1["b"] + (color2["b"] - color1["b"]) * factor)

        # Clamp to valid range
        r = max(0, min(255, r))
        g = max(0, min(255, g))
        b = max(0, min(255, b))

        segment_colors.append({"segment": i + 1, "color": {"r": r, "g": g, "b": b}})

    return segment_colors


def generate_block_colors(
    colors: list[dict[str, int]], segment_count: int, expand: bool = False
) -> list[dict[str, any]]:
    """Generate block pattern segment colors from a list of colors.

    Creates evenly spaced blocks of color across all segments.

    Args:
        colors: List of RGB color dicts (r, g, b)
        segment_count: Number of segments to generate blocks for
        expand: If True, expand colors to fill segment_count evenly (e.g., 2 colors
                across 20 segments = 10 segments per color). If False, repeat colors
                in alternating pattern (e.g., 2 colors across 20 segments = alternating
                every segment).

    Returns:
        List of segment/color pairs for each segment
    """
    if segment_count < 1:
        return []

    if len(colors) < 1:
        return []

    segment_colors = []
    num_colors = len(colors)

    if expand:
        # Expand mode: divide segments evenly among colors
        segments_per_color = segment_count / num_colors

        for i in range(segment_count):
            # Determine which color this segment belongs to
            color_idx = min(int(i / segments_per_color), num_colors - 1)
            segment_colors.append(
                {"segment": i + 1, "color": colors[color_idx]}
            )
    else:
        # Repeat mode: alternate colors across segments
        for i in range(segment_count):
            color_idx = i % num_colors
            segment_colors.append(
                {"segment": i + 1, "color": colors[color_idx]}
            )

    return segment_colors


def scale_segment_pattern(
    source_colors: list[list[int]], target_count: int
) -> list[list[int]]:
    """Scale a segment pattern to a different number of segments.

    Uses nearest-neighbor resampling to map each target segment index
    proportionally back to the source array, preserving the relative
    widths of color blocks at any target count.

    Args:
        source_colors: List of RGB color arrays [[r, g, b], ...]
        target_count: Number of segments in the target device

    Returns:
        List of RGB color arrays scaled to target_count length
    """
    source_count = len(source_colors)
    if target_count < 1 or source_count < 1:
        return []

    if target_count == source_count:
        return list(source_colors)

    return [
        source_colors[int(i * source_count / target_count)]
        for i in range(target_count)
    ]
