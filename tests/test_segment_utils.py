"""Test segment utility functions."""

import pytest

from custom_components.aqara_advanced_lighting.segment_utils import (
    parse_segment_range,
    generate_gradient_colors,
    generate_block_colors,
    expand_segment_colors,
)
from custom_components.aqara_advanced_lighting.models import RGBColor, SegmentColor


def test_parse_segment_range_single():
    """Test parsing a single segment number."""
    assert parse_segment_range("5", 20) == [5]
    assert parse_segment_range("1", 26) == [1]


def test_parse_segment_range_comma_separated():
    """Test parsing comma-separated segments."""
    assert parse_segment_range("1,3,5", 20) == [1, 3, 5]
    assert parse_segment_range("10,15,20", 26) == [10, 15, 20]


def test_parse_segment_range_range():
    """Test parsing segment ranges."""
    assert parse_segment_range("1-5", 20) == [1, 2, 3, 4, 5]
    assert parse_segment_range("18-20", 20) == [18, 19, 20]


def test_parse_segment_range_mixed():
    """Test parsing mixed segment specifications."""
    assert parse_segment_range("1,3-5,7", 20) == [1, 3, 4, 5, 7]
    assert parse_segment_range("1-3,10,15-17", 26) == [1, 2, 3, 10, 15, 16, 17]


def test_parse_segment_range_special_odd():
    """Test parsing 'odd' segments."""
    result = parse_segment_range("odd", 10)
    assert result == [1, 3, 5, 7, 9]


def test_parse_segment_range_special_even():
    """Test parsing 'even' segments."""
    result = parse_segment_range("even", 10)
    assert result == [2, 4, 6, 8, 10]


def test_parse_segment_range_special_first_half():
    """Test parsing 'first-half' segments."""
    result = parse_segment_range("first-half", 20)
    assert result == list(range(1, 11))  # 1-10


def test_parse_segment_range_special_last_half():
    """Test parsing 'last-half' segments."""
    result = parse_segment_range("last-half", 20)
    assert result == list(range(11, 21))  # 11-20


def test_parse_segment_range_special_first_third():
    """Test parsing 'first-third' segments."""
    result = parse_segment_range("first-third", 21)
    assert result == list(range(1, 8))  # 1-7


def test_parse_segment_range_special_last_third():
    """Test parsing 'last-third' segments."""
    result = parse_segment_range("last-third", 21)
    assert result == list(range(15, 22))  # 15-21


def test_parse_segment_range_all():
    """Test parsing 'all' segments."""
    result = parse_segment_range("all", 26)
    assert result == list(range(1, 27))


def test_parse_segment_range_invalid_range():
    """Test parsing invalid segment range."""
    with pytest.raises(ValueError, match="Invalid segment range"):
        parse_segment_range("25-30", 20)


def test_parse_segment_range_invalid_segment():
    """Test parsing invalid segment number."""
    with pytest.raises(ValueError, match="Segment .* is out of range"):
        parse_segment_range("30", 20)


def test_generate_gradient_colors_two_colors():
    """Test generating gradient with two colors."""
    colors = [
        RGBColor(r=255, g=0, b=0),  # Red
        RGBColor(r=0, g=0, b=255),  # Blue
    ]
    segments = [1, 2, 3, 4, 5]

    result = generate_gradient_colors(colors, segments)

    assert len(result) == 5
    assert result[0].segment == 1
    assert result[0].color.r == 255
    assert result[0].color.g == 0
    assert result[0].color.b == 0
    assert result[-1].segment == 5
    assert result[-1].color.r == 0
    assert result[-1].color.g == 0
    assert result[-1].color.b == 255


def test_generate_gradient_colors_three_colors():
    """Test generating gradient with three colors."""
    colors = [
        RGBColor(r=255, g=0, b=0),    # Red
        RGBColor(r=0, g=255, b=0),    # Green
        RGBColor(r=0, g=0, b=255),    # Blue
    ]
    segments = list(range(1, 11))  # 10 segments

    result = generate_gradient_colors(colors, segments)

    assert len(result) == 10
    assert result[0].segment == 1
    assert result[-1].segment == 10


def test_generate_block_colors_repeat():
    """Test generating block colors with repeat mode."""
    colors = [
        RGBColor(r=255, g=0, b=0),  # Red
        RGBColor(r=0, g=255, b=0),  # Green
    ]
    segments = list(range(1, 9))  # 8 segments

    result = generate_block_colors(colors, segments, expand=False)

    assert len(result) == 8
    # Should create blocks: RRRRGGGG
    assert result[0].color.r == 255  # Red
    assert result[4].color.g == 255  # Green


def test_generate_block_colors_expand():
    """Test generating block colors with expand mode."""
    colors = [
        RGBColor(r=255, g=0, b=0),  # Red
        RGBColor(r=0, g=255, b=0),  # Green
    ]
    segments = list(range(1, 9))  # 8 segments

    result = generate_block_colors(colors, segments, expand=True)

    assert len(result) == 8
    # Should alternate: RGRGRGRG
    assert result[0].color.r == 255  # Red
    assert result[1].color.g == 255  # Green
    assert result[2].color.r == 255  # Red


def test_expand_segment_colors():
    """Test expanding segment colors to specific segments."""
    segment_colors = [
        SegmentColor(segment=1, color=RGBColor(r=255, g=0, b=0)),
        SegmentColor(segment=2, color=RGBColor(r=0, g=255, b=0)),
    ]
    target_segments = [1, 2, 3, 4]

    result = expand_segment_colors(segment_colors, target_segments)

    assert len(result) == 4
    assert result[0].segment == 1
    assert result[0].color.r == 255
    assert result[1].segment == 2
    assert result[1].color.g == 255
    # Segments 3 and 4 should cycle back to the first colors
    assert result[2].segment == 3
    assert result[2].color.r == 255
    assert result[3].segment == 4
    assert result[3].color.g == 255
