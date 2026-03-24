"""Zigbee payload encoding for Aqara manufacturer-specific cluster writes.

This module is the Python equivalent of the Z2M external converter encoding
functions (lumiEncodeRgbColor, lumiBuildSegmentPacket, lumiGenerateSegmentMask).
Used by the ZHA backend to build raw byte payloads for direct cluster writes.
The MQTT backend does not use this module (Z2M converters handle encoding).
"""

import math
import struct
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .models import RGBColor

def rgb_to_xy(r: int, g: int, b: int) -> tuple[float, float]:
    """Convert RGB to CIE 1931 XY chromaticity coordinates.

    Uses sRGB D65 transformation matrix. Matches lumiRgbToXY() from
    the Z2M external converters.

    Args:
        r: Red value (0-255)
        g: Green value (0-255)
        b: Blue value (0-255)

    Returns:
        Tuple of (x, y) chromaticity coordinates
    """
    # Normalize to 0-1 range
    red = r / 255.0
    green = g / 255.0
    blue = b / 255.0

    # Apply inverse sRGB companding (gamma linearization)
    red = ((red + 0.055) / 1.055) ** 2.4 if red > 0.04045 else red / 12.92
    green = ((green + 0.055) / 1.055) ** 2.4 if green > 0.04045 else green / 12.92
    blue = ((blue + 0.055) / 1.055) ** 2.4 if blue > 0.04045 else blue / 12.92

    # Convert to XYZ using sRGB D65 matrix
    x_val = red * 0.4124564 + green * 0.3575761 + blue * 0.1804375
    y_val = red * 0.2126729 + green * 0.7151522 + blue * 0.0721750
    z_val = red * 0.0193339 + green * 0.1191920 + blue * 0.9503041

    # Convert to chromaticity coordinates
    total = x_val + y_val + z_val
    if total == 0:
        return (0.0, 0.0)

    return (x_val / total, y_val / total)

def rgb_to_xy_bytes(r: int, g: int, b: int) -> bytes:
    """Convert RGB to CIE XY and encode as 4 bytes.

    Matches lumiEncodeRgbColor() from Z2M converters.
    Output format: [x_high, x_low, y_high, y_low] (big-endian uint16 each).

    Args:
        r: Red value (0-255)
        g: Green value (0-255)
        b: Blue value (0-255)

    Returns:
        4 bytes encoding the XY color
    """
    x, y = rgb_to_xy(r, g, b)

    x_scaled = round(x * 65535)
    y_scaled = round(y * 65535)

    return struct.pack(">HH", x_scaled, y_scaled)

def encode_rgb_color(color: RGBColor) -> bytes:
    """Encode an RGBColor object as 4 XY bytes.

    Args:
        color: RGBColor to encode

    Returns:
        4 bytes encoding the XY color
    """
    return rgb_to_xy_bytes(color.r, color.g, color.b)

def build_effect_colors_payload(colors: list[RGBColor]) -> bytes:
    """Build effect colors packet for attribute 0x0523.

    Format: [0x00, color_count, ...4_xy_bytes_per_color]
    Matches the Z2M converter: Buffer.from([0x00, colors.length, ...colorBytes])

    Args:
        colors: List of 1-8 RGBColor objects

    Returns:
        Encoded payload bytes
    """
    if not colors or len(colors) > 8:
        msg = f"Must provide 1-8 colors, got {len(colors) if colors else 0}"
        raise ValueError(msg)

    color_bytes = b""
    for color in colors:
        color_bytes += encode_rgb_color(color)

    return bytes([0x00, len(colors)]) + color_bytes

def build_segment_mask(
    segments: list[int],
    device_type: str,
    max_segments: int,
) -> bytes:
    """Build segment bitmask.

    T1M uses 4 bytes (up to 32 segments), Strip uses 8 bytes (up to 64).
    Matches lumiGenerateSegmentMask() from Z2M converters.

    Args:
        segments: List of 1-based segment numbers
        device_type: "t1m" or "strip"
        max_segments: Maximum segment count for the device

    Returns:
        Bitmask bytes (4 or 8 bytes)
    """
    mask_size = 4 if device_type == "t1m" else 8
    mask = bytearray(mask_size)

    for seg in segments:
        if seg < 1 or seg > max_segments:
            msg = f"Invalid segment: {seg}. Must be 1-{max_segments}"
            raise ValueError(msg)

        bit_pos = seg - 1
        byte_index = bit_pos // 8
        bit_index = 7 - (bit_pos % 8)

        mask[byte_index] |= 1 << bit_index

    return bytes(mask)

def build_t1m_segment_packet(
    segments: list[int],
    color: RGBColor,
    max_segments: int,
) -> bytes:
    """Build T1M segment control packet for attribute 0x0522.

    Format: [4-byte mask, 4x 0x00, 4 XY bytes] = 12 bytes total.
    Matches lumiBuildSegmentPacket() with deviceType="t1m".

    Args:
        segments: List of 1-based segment numbers
        color: RGB color for these segments
        max_segments: Maximum segment count (20 or 26)

    Returns:
        12-byte payload
    """
    segment_mask = build_segment_mask(segments, "t1m", max_segments)
    color_bytes = encode_rgb_color(color)

    return segment_mask + b"\x00\x00\x00\x00" + color_bytes

def build_strip_segment_packet(
    segments: list[int],
    color: RGBColor,
    max_segments: int,
    brightness: int = 254,
) -> bytes:
    """Build Strip segment control packet for attribute 0x0527.

    Format: [0x01, 0x01, 0x01, 0x0f, brightness, 8-byte mask, 4 XY bytes, 0x00, 0x14]
    = 18 bytes total. Matches lumiBuildSegmentPacket() with deviceType="strip".

    Args:
        segments: List of 1-based segment numbers
        color: RGB color for these segments
        max_segments: Maximum segment count (5 per meter)
        brightness: Brightness value (0-254)

    Returns:
        18-byte payload
    """
    segment_mask = build_segment_mask(segments, "strip", max_segments)
    color_bytes = encode_rgb_color(color)
    brightness_byte = max(0, min(254, round(brightness)))

    return (
        bytes([0x01, 0x01, 0x01, 0x0F, brightness_byte])
        + segment_mask
        + color_bytes
        + bytes([0x00, 0x14])
    )

def build_effect_segments_mask(
    segments: list[int],
    max_segments: int,
) -> bytes:
    """Build effect segments mask for attribute 0x0530 (T1 Strip only).

    An 8-byte bitmask selecting which segments participate in the effect.

    Args:
        segments: List of 1-based segment numbers
        max_segments: Maximum segment count

    Returns:
        8-byte bitmask
    """
    return build_segment_mask(segments, "strip", max_segments)
