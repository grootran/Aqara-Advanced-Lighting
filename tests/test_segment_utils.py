"""Test segment utility functions."""

import pytest

from custom_components.aqara_advanced_lighting.segment_utils import (
    parse_segment_range,
    generate_gradient_colors,
    generate_block_colors,
    expand_segment_colors,
)


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
        {"r": 255, "g": 0, "b": 0},  # Red
        {"r": 0, "g": 0, "b": 255},  # Blue
    ]

    result = generate_gradient_colors(colors, 5)

    assert len(result) == 5
    assert result[0]["segment"] == 1
    assert result[0]["color"]["r"] == 255
    assert result[0]["color"]["g"] == 0
    assert result[0]["color"]["b"] == 0
    assert result[-1]["segment"] == 5
    assert result[-1]["color"]["r"] == 0
    assert result[-1]["color"]["g"] == 0
    assert result[-1]["color"]["b"] == 255


def test_generate_gradient_colors_three_colors():
    """Test generating gradient with three colors."""
    colors = [
        {"r": 255, "g": 0, "b": 0},  # Red
        {"r": 0, "g": 255, "b": 0},  # Green
        {"r": 0, "g": 0, "b": 255},  # Blue
    ]

    result = generate_gradient_colors(colors, 10)

    assert len(result) == 10
    assert result[0]["segment"] == 1
    assert result[-1]["segment"] == 10


def test_generate_block_colors_repeat():
    """Test generating block colors with repeat (alternating) mode."""
    colors = [
        {"r": 255, "g": 0, "b": 0},  # Red
        {"r": 0, "g": 255, "b": 0},  # Green
    ]

    result = generate_block_colors(colors, 8, expand=False)

    assert len(result) == 8
    # Alternates: R, G, R, G, R, G, R, G
    assert result[0]["color"]["r"] == 255  # Red
    assert result[1]["color"]["g"] == 255  # Green
    assert result[2]["color"]["r"] == 255  # Red


def test_generate_block_colors_expand():
    """Test generating block colors with expand (block) mode."""
    colors = [
        {"r": 255, "g": 0, "b": 0},  # Red
        {"r": 0, "g": 255, "b": 0},  # Green
    ]

    result = generate_block_colors(colors, 8, expand=True)

    assert len(result) == 8
    # Blocks: RRRRGGGG
    assert result[0]["color"]["r"] == 255  # Red
    assert result[3]["color"]["r"] == 255  # Red (still in first block)
    assert result[4]["color"]["g"] == 255  # Green (second block)


def test_expand_segment_colors():
    """Test expanding segment color ranges into individual segments."""
    segment_colors = [
        {"segment": "1-2", "color": {"r": 255, "g": 0, "b": 0}},
        {"segment": "4", "color": {"r": 0, "g": 255, "b": 0}},
    ]

    result = expand_segment_colors(segment_colors, max_segments=20)

    assert len(result) == 3
    assert result[0] == {"segment": 1, "color": {"r": 255, "g": 0, "b": 0}}
    assert result[1] == {"segment": 2, "color": {"r": 255, "g": 0, "b": 0}}
    assert result[2] == {"segment": 4, "color": {"r": 0, "g": 255, "b": 0}}
