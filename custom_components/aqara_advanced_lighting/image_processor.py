"""Image processing utilities for color extraction and thumbnails."""

from __future__ import annotations

import colorsys
import io
import logging
import math

from PIL import Image, ImageOps, UnidentifiedImageError

from homeassistant.core import HomeAssistant

from .const import (
    DEFAULT_EXTRACTED_COLORS,
    THUMBNAIL_JPEG_QUALITY,
    THUMBNAIL_MAX_DIMENSION,
)
from .models import RGBColor, round_xy
from .payload_builder import rgb_to_xy

_LOGGER = logging.getLogger(__name__)

# Minimum max-channel value for a color to be usable by a light.
# Pure black has no chromaticity and cannot be reproduced.
_MIN_CHANNEL = 5

# D65 white point (returned for black/zero-luminance inputs)
_D65_X = 0.3127
_D65_Y = 0.3290


def _rgb_to_xy(r: int, g: int, b: int) -> tuple[float, float]:
    """Convert sRGB to CIE 1931 xy chromaticity using the sRGB D65 matrix.

    Delegates to ``payload_builder.rgb_to_xy`` for the core conversion.
    For black/zero-luminance inputs (where chromaticity is undefined),
    returns the D65 white point instead of (0, 0) since color extraction
    needs a usable fallback.
    """
    x, y = rgb_to_xy(r, g, b)
    if x == 0.0 and y == 0.0:
        return (_D65_X, _D65_Y)
    return (x, y)


def _color_distance(c1: RGBColor, c2: RGBColor) -> float:
    """Perceptual color distance using the redmean approximation.

    More accurate than plain Euclidean RGB distance, cheaper than Lab.
    """
    rmean = (c1.r + c2.r) / 2
    dr = c1.r - c2.r
    dg = c1.g - c2.g
    db = c1.b - c2.b
    return math.sqrt(
        (2 + rmean / 256) * dr * dr
        + 4 * dg * dg
        + (2 + (255 - rmean) / 256) * db * db
    )


def _select_diverse_colors(
    candidates: list[tuple[int, RGBColor]],
    num_colors: int,
    min_distance: float = 40.0,
) -> list[tuple[int, RGBColor]]:
    """Select diverse colors from frequency-sorted candidates.

    Walks the candidates in frequency order and keeps each color only if
    it is sufficiently different from all already-selected colors. If
    strict selection yields fewer than num_colors, fills remaining slots
    with the most frequent unused colors.
    """
    selected: list[tuple[int, RGBColor]] = []
    used_indices: set[int] = set()

    for i, (count, rgb) in enumerate(candidates):
        if len(selected) >= num_colors:
            break
        if all(
            _color_distance(rgb, sel_rgb) >= min_distance
            for _, sel_rgb in selected
        ):
            selected.append((count, rgb))
            used_indices.add(i)

    # Fill remaining slots with most frequent unused colors
    if len(selected) < num_colors:
        for i, (count, rgb) in enumerate(candidates):
            if len(selected) >= num_colors:
                break
            if i not in used_indices:
                selected.append((count, rgb))

    return selected


def _extract_palette(
    image_bytes: bytes,
    num_colors: int = DEFAULT_EXTRACTED_COLORS,
    extract_brightness: bool = True,
) -> list[dict[str, float | int]]:
    """Extract dominant colors from image bytes using Pillow quantization.

    Runs in an executor thread -- no async calls allowed.

    Over-samples the quantization (3x requested colors) then uses a
    greedy diversity selection to ensure distinct colors are preserved
    rather than letting similar shades consume multiple slots.

    Args:
        image_bytes: Raw image file bytes.
        num_colors: Number of dominant colors to extract (1-8).
        extract_brightness: Whether to derive brightness from image luminance.
            When False, all colors are returned at 100% brightness.

    Returns:
        List of dicts with x, y, brightness_pct keys sorted by hue.

    Raises:
        UnidentifiedImageError: If the bytes are not a valid image.
        ValueError: If no colors could be extracted.
    """
    img = Image.open(io.BytesIO(image_bytes))

    # Normalise orientation from EXIF before any processing
    img = ImageOps.exif_transpose(img)

    # Convert to RGB (handles RGBA, palette, grayscale, etc.)
    if img.mode != "RGB":
        img = img.convert("RGB")

    # Down-sample large images for faster quantization
    max_dimension = 400
    if max(img.size) > max_dimension:
        img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

    # Over-sample: quantize to more colors than needed, then select the
    # most diverse subset. This prevents similar shades from dominating.
    oversample = min(num_colors * 3, 24)
    quantized = img.quantize(
        colors=oversample, method=Image.Quantize.MAXCOVERAGE
    )
    palette = quantized.getpalette()
    if palette is None:
        msg = "Failed to extract color palette from image"
        raise ValueError(msg)

    histogram = quantized.histogram()

    candidates: list[tuple[int, RGBColor]] = []
    for i in range(min(oversample, len(histogram))):
        count = histogram[i]
        if count == 0:
            continue
        r, g, b = palette[i * 3 : (i + 1) * 3]
        if max(r, g, b) < _MIN_CHANNEL:
            continue
        candidates.append((count, RGBColor(r=r, g=g, b=b)))

    if not candidates:
        msg = "No colors could be extracted from image"
        raise ValueError(msg)

    # Sort by pixel count (most dominant first) for diverse selection
    candidates.sort(key=lambda c: c[0], reverse=True)
    colors = _select_diverse_colors(candidates, num_colors)

    # Build result with XY chromaticity, brightness, and hue.
    raw: list[dict[str, float]] = []
    for _count, rgb in colors:
        x, y = _rgb_to_xy(rgb.r, rgb.g, rgb.b)
        luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b
        hue, _, _ = colorsys.rgb_to_hsv(rgb.r / 255, rgb.g / 255, rgb.b / 255)
        raw.append({
            "x": round_xy(x),
            "y": round_xy(y),
            "brightness_raw": luminance / 255 * 100,
            "hue": hue,
        })

    # Sort by hue so colors form a natural spectrum
    raw.sort(key=lambda c: c["hue"])

    result: list[dict[str, float | int]] = []
    for c in raw:
        brightness_pct = (
            max(10, min(100, round(c["brightness_raw"])))
            if extract_brightness
            else 100
        )
        result.append({
            "x": c["x"],
            "y": c["y"],
            "brightness_pct": brightness_pct,
        })

    return result


def _create_thumbnail(image_bytes: bytes) -> bytes:
    """Create an optimised JPEG thumbnail from image bytes.

    Runs in an executor thread -- no async calls allowed.

    Args:
        image_bytes: Raw image file bytes.

    Returns:
        JPEG bytes of the resized thumbnail.
    """
    img = Image.open(io.BytesIO(image_bytes))
    img = ImageOps.exif_transpose(img)

    # Convert to RGB (JPEG cannot hold alpha)
    if img.mode in ("RGBA", "LA", "P"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        converted = img.convert("RGBA")
        background.paste(converted, mask=converted.split()[-1])
        img = background
    elif img.mode != "RGB":
        img = img.convert("RGB")

    img.thumbnail(
        (THUMBNAIL_MAX_DIMENSION, THUMBNAIL_MAX_DIMENSION),
        Image.Resampling.LANCZOS,
    )

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=THUMBNAIL_JPEG_QUALITY, optimize=True)
    return buf.getvalue()


async def async_extract_colors(
    hass: HomeAssistant,
    image_bytes: bytes,
    num_colors: int = DEFAULT_EXTRACTED_COLORS,
    *,
    extract_brightness: bool = True,
) -> list[dict[str, float | int]]:
    """Extract dominant colors from an image (async wrapper).

    Args:
        hass: Home Assistant instance.
        image_bytes: Raw image file bytes.
        num_colors: Number of colors to extract.
        extract_brightness: Whether to derive brightness from image luminance.

    Returns:
        List of color dicts with x, y, brightness_pct.
    """
    return await hass.async_add_executor_job(
        _extract_palette, image_bytes, num_colors, extract_brightness
    )


async def async_create_thumbnail(
    hass: HomeAssistant,
    image_bytes: bytes,
) -> bytes:
    """Create an optimised JPEG thumbnail (async wrapper).

    Args:
        hass: Home Assistant instance.
        image_bytes: Raw image file bytes.

    Returns:
        JPEG bytes of the thumbnail.
    """
    return await hass.async_add_executor_job(_create_thumbnail, image_bytes)
