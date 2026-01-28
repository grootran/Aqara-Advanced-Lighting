"""Data models for the Aqara Advanced Lighting integration."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import TYPE_CHECKING, Any, TypeAlias

from homeassistant.config_entries import ConfigEntry

if TYPE_CHECKING:
    pass  # TypeAlias import used for type definitions


def round_xy(value: float) -> float:
    """Round XY coordinate to 4 decimal places for consistency.

    This matches industry standards and provides sufficient precision
    for Zigbee color control while reducing storage overhead.

    Args:
        value: Coordinate value to round

    Returns:
        Rounded value to 4 decimal places
    """
    return round(value, 4)


class AqaraLightModel(StrEnum):
    """Supported Aqara light models."""

    T1M_20_SEGMENT = "ACN031"
    T1M_26_SEGMENT = "ACN032"
    T1_STRIP = "STRIP1"
    T2_BULB = "ACN003"


class EffectType(StrEnum):
    """Dynamic effect types across all Aqara light models."""

    # T1M specific effects
    FLOW1 = "flow1"
    FLOW2 = "flow2"
    FADING = "fading"
    HOPPING = "hopping"
    BREATHING = "breathing"
    ROLLING = "rolling"

    # T1 Strip specific effects
    RAINBOW1 = "rainbow1"
    CHASING = "chasing"
    FLASH = "flash"
    RAINBOW2 = "rainbow2"
    FLICKER = "flicker"
    DASH = "dash"

    # T2 Bulb specific effects
    CANDLELIGHT = "candlelight"


@dataclass
class RGBColor:
    """RGB color representation."""

    r: int  # 0-255
    g: int  # 0-255
    b: int  # 0-255

    def to_dict(self) -> dict[str, int]:
        """Convert to dictionary for MQTT payload."""
        return {"r": self.r, "g": self.g, "b": self.b}

    @classmethod
    def from_dict(cls, data: dict[str, int]) -> RGBColor:
        """Create from dictionary."""
        return cls(r=data["r"], g=data["g"], b=data["b"])

    def __post_init__(self) -> None:
        """Validate RGB values."""
        if not (0 <= self.r <= 255):
            msg = f"Red value must be 0-255, got {self.r}"
            raise ValueError(msg)
        if not (0 <= self.g <= 255):
            msg = f"Green value must be 0-255, got {self.g}"
            raise ValueError(msg)
        if not (0 <= self.b <= 255):
            msg = f"Blue value must be 0-255, got {self.b}"
            raise ValueError(msg)


@dataclass
class XYColor:
    """CIE 1931 XY color representation with brightness.

    XY coordinates represent chromaticity (hue and saturation) without brightness.
    This matches how Aqara lights actually work - color is separate from brightness.
    """

    x: float  # 0.0-1.0
    y: float  # 0.0-1.0
    brightness: int = 255  # 1-255 (optional, for display purposes)

    def to_dict(self) -> dict[str, float]:
        """Convert to dictionary for API/storage."""
        return {"x": round_xy(self.x), "y": round_xy(self.y)}

    @classmethod
    def from_dict(cls, data: dict[str, float | int]) -> XYColor:
        """Create from dictionary."""
        return cls(x=data["x"], y=data["y"], brightness=data.get("brightness", 255))

    def to_rgb(self) -> RGBColor:
        """Convert XY to RGB using the same algorithm as frontend.

        Returns RGB at full brightness (0-255 range) suitable for MQTT.
        Uses normalization to ensure vivid colors (matching frontend behavior).
        """
        import math

        # Prevent division by zero
        if self.y == 0:
            return RGBColor(r=0, g=0, b=0)

        # Convert XY to XYZ color space (using Y=1 as reference)
        z = 1.0 - self.x - self.y
        Y = 1.0
        X = (Y / self.y) * self.x
        Z = (Y / self.y) * z

        # Convert XYZ to linear RGB using sRGB D65 transformation matrix
        r_linear = X * 3.2406 + Y * -1.5372 + Z * -0.4986
        g_linear = X * -0.9689 + Y * 1.8758 + Z * 0.0415
        b_linear = X * 0.0557 + Y * -0.2040 + Z * 1.0570

        # Normalize so max component = 1.0 (preserves color ratios, fits in gamut)
        # This is critical for vivid colors - without it, colors appear washed out
        max_component = max(r_linear, g_linear, b_linear)
        if max_component > 1:
            r_linear /= max_component
            g_linear /= max_component
            b_linear /= max_component

        # Clamp negative values (out of gamut colors)
        r_linear = max(0, r_linear)
        g_linear = max(0, g_linear)
        b_linear = max(0, b_linear)

        # Apply gamma correction for sRGB
        r_srgb = (
            12.92 * r_linear
            if r_linear <= 0.0031308
            else 1.055 * math.pow(r_linear, 1.0 / 2.4) - 0.055
        )
        g_srgb = (
            12.92 * g_linear
            if g_linear <= 0.0031308
            else 1.055 * math.pow(g_linear, 1.0 / 2.4) - 0.055
        )
        b_srgb = (
            12.92 * b_linear
            if b_linear <= 0.0031308
            else 1.055 * math.pow(b_linear, 1.0 / 2.4) - 0.055
        )

        # Convert to 0-255 range (full brightness)
        return RGBColor(
            r=max(0, min(255, round(r_srgb * 255))),
            g=max(0, min(255, round(g_srgb * 255))),
            b=max(0, min(255, round(b_srgb * 255))),
        )

    @classmethod
    def from_rgb(cls, rgb: RGBColor) -> XYColor:
        """Convert RGB to XY using Home Assistant's built-in utilities."""
        from homeassistant.util.color import color_RGB_to_xy

        x, y = color_RGB_to_xy(rgb.r, rgb.g, rgb.b)
        # Calculate brightness from RGB (max channel value)
        brightness = max(rgb.r, rgb.g, rgb.b)
        return cls(x=round_xy(x), y=round_xy(y), brightness=brightness)

    def __post_init__(self) -> None:
        """Validate XY values."""
        if not (0.0 <= self.x <= 1.0):
            msg = f"X value must be 0.0-1.0, got {self.x}"
            raise ValueError(msg)
        if not (0.0 <= self.y <= 1.0):
            msg = f"Y value must be 0.0-1.0, got {self.y}"
            raise ValueError(msg)
        if not (1 <= self.brightness <= 255):
            msg = f"Brightness must be 1-255, got {self.brightness}"
            raise ValueError(msg)


@dataclass
class SegmentColor:
    """Segment color assignment for individual segment patterns."""

    segment: int | str  # int or range like "1-5", "odd", "even"
    color: RGBColor
    brightness: int | None = None  # 1-255, used for T1 Strip only

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for MQTT payload."""
        result = {"segment": self.segment, "color": self.color.to_dict()}
        if self.brightness is not None:
            result["brightness"] = self.brightness
        return result

    def __post_init__(self) -> None:
        """Validate brightness value."""
        if self.brightness is not None and not (1 <= self.brightness <= 255):
            msg = f"Brightness must be 1-255, got {self.brightness}"
            raise ValueError(msg)


@dataclass
class DynamicEffect:
    """Dynamic effect configuration."""

    effect: EffectType
    effect_speed: int  # 1-100
    effect_colors: list[RGBColor]
    effect_segments: str | None = None  # T1 Strip only, e.g., "1-10", "odd"

    def to_mqtt_payload(self) -> dict[str, Any]:
        """Convert to MQTT payload dictionary.

        IMPORTANT: Payload order matters per Z2M requirements.
        Order: effect, effect_speed, effect_colors, [effect_segments]
        """
        payload: dict[str, Any] = {
            "effect": self.effect.value,
            "effect_speed": self.effect_speed,
            "effect_colors": [color.to_dict() for color in self.effect_colors],
        }

        # Add effect_segments for T1 Strip if specified
        if self.effect_segments is not None:
            payload["effect_segments"] = self.effect_segments

        return payload

    def __post_init__(self) -> None:
        """Validate effect configuration."""
        if not (1 <= self.effect_speed <= 100):
            msg = f"Effect speed must be 1-100, got {self.effect_speed}"
            raise ValueError(msg)
        if not (1 <= len(self.effect_colors) <= 8):
            msg = f"Effect must have 1-8 colors, got {len(self.effect_colors)}"
            raise ValueError(msg)


@dataclass
class DeviceCapabilities:
    """Device capability definition for each Aqara light model."""

    model: AqaraLightModel
    segment_count: int
    supported_effects: list[EffectType]
    supports_segment_addressing: bool
    supports_effect_segments: bool
    model_name: str


@dataclass
class DeviceState:
    """Device state for restoration after effects."""

    entity_id: str
    z2m_friendly_name: str
    previous_state: dict[str, Any]  # Original state before effect
    effect_active: bool
    current_effect: DynamicEffect | None = None
    paused_cct_sequence: bool = False
    paused_segment_sequence: bool = False

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "entity_id": self.entity_id,
            "z2m_friendly_name": self.z2m_friendly_name,
            "previous_state": self.previous_state,
            "effect_active": self.effect_active,
            "current_effect": (
                {
                    "effect": self.current_effect.effect.value,
                    "effect_speed": self.current_effect.effect_speed,
                    "effect_colors": [
                        color.to_dict() for color in self.current_effect.effect_colors
                    ],
                    "effect_segments": self.current_effect.effect_segments,
                }
                if self.current_effect
                else None
            ),
            "paused_cct_sequence": self.paused_cct_sequence,
            "paused_segment_sequence": self.paused_segment_sequence,
        }


@dataclass
class Z2MDevice:
    """Zigbee2MQTT device information."""

    ieee_address: str
    friendly_name: str
    model_id: str
    manufacturer: str
    supported: bool = True


@dataclass
class CCTSequenceStep:
    """Single step in a CCT dynamic sequence."""

    color_temp: int  # Color temperature in kelvin (2700-6500)
    brightness: int  # Brightness 1-255
    transition: float  # Transition time to reach this step (seconds)
    hold: float  # Hold time after transition completes before next step (seconds)

    def __post_init__(self) -> None:
        """Validate step parameters."""
        if not (2700 <= self.color_temp <= 6500):
            msg = f"Color temp must be 2700-6500K, got {self.color_temp}"
            raise ValueError(msg)
        if not (1 <= self.brightness <= 255):
            msg = f"Brightness must be 1-255, got {self.brightness}"
            raise ValueError(msg)
        if self.transition < 0:
            msg = "Transition time cannot be negative"
            raise ValueError(msg)
        if self.hold < 0:
            msg = "Hold time cannot be negative"
            raise ValueError(msg)


@dataclass
class CCTSequence:
    """CCT dynamic effect sequence configuration."""

    steps: list[CCTSequenceStep]  # 1-20 steps
    loop_mode: str  # "once", "count", "continuous"
    loop_count: int | None = None  # Number of loops if mode is "count"
    end_behavior: str = "maintain"  # "maintain" or "turn_off"

    def __post_init__(self) -> None:
        """Validate sequence parameters."""
        if not (1 <= len(self.steps) <= 20):
            msg = f"Sequence must have 1-20 steps, got {len(self.steps)}"
            raise ValueError(msg)

        if self.loop_mode not in ("once", "count", "continuous"):
            msg = f"Loop mode must be 'once', 'count', or 'continuous', got {self.loop_mode}"
            raise ValueError(msg)

        if self.loop_mode == "count" and (
            self.loop_count is None or self.loop_count < 1
        ):
            msg = "Loop count must be >= 1 when loop_mode is 'count'"
            raise ValueError(msg)

        if self.end_behavior not in ("maintain", "turn_off"):
            msg = f"End behavior must be 'maintain' or 'turn_off', got {self.end_behavior}"
            raise ValueError(msg)


@dataclass
class SegmentSequenceStep:
    """Single step in an RGB segment sequence."""

    segments: str  # Segment range: "1-20", "odd", "even", "1,5,10" (legacy when using segment_colors)
    colors: list[RGBColor]  # 1-6 colors for blocks or gradient (legacy when using segment_colors)
    mode: str  # "blocks_repeat", "blocks_expand", or "gradient" (legacy when using segment_colors)
    duration: float  # Total time to activate all segments (seconds)
    hold: float  # Hold time after activation completes before next step (seconds)
    activation_pattern: str  # "all", "sequential_forward", "sequential_reverse", "random"
    segment_colors: list[SegmentColor] | None = None  # Direct segment assignments (preferred)

    def __post_init__(self) -> None:
        """Validate step parameters."""
        # If using direct segment_colors, skip legacy field validation
        if self.segment_colors is not None:
            if not self.segment_colors:
                msg = "segment_colors cannot be empty when provided"
                raise ValueError(msg)
        else:
            # Legacy mode validation
            if not (1 <= len(self.colors) <= 6):
                msg = f"Step must have 1-6 colors, got {len(self.colors)}"
                raise ValueError(msg)

            if self.mode not in ("blocks_repeat", "blocks_expand", "gradient"):
                msg = f"Mode must be 'blocks_repeat', 'blocks_expand', or 'gradient', got {self.mode}"
                raise ValueError(msg)

        if self.duration < 0:
            msg = "Duration cannot be negative"
            raise ValueError(msg)

        if self.hold < 0:
            msg = "Hold time cannot be negative"
            raise ValueError(msg)

        valid_patterns = (
            "all",
            "sequential_forward",
            "sequential_reverse",
            "random",
            "ping_pong",
            "center_out",
            "edges_in",
            "paired",
        )
        if self.activation_pattern not in valid_patterns:
            msg = f"Activation pattern must be one of {valid_patterns}, got {self.activation_pattern}"
            raise ValueError(msg)


@dataclass
class SegmentSequence:
    """RGB segment sequence configuration."""

    steps: list[SegmentSequenceStep]  # 1-20 steps
    loop_mode: str  # "once", "count", "continuous"
    loop_count: int | None = None  # Number of loops if mode is "count"
    end_behavior: str = "maintain"  # "maintain" or "turn_off"
    clear_segments: bool = False  # Clear all segments (set to black) before starting
    skip_first_in_loop: bool = False  # Skip first step when looping (after first iteration)

    def __post_init__(self) -> None:
        """Validate sequence parameters."""
        if not (1 <= len(self.steps) <= 20):
            msg = f"Sequence must have 1-20 steps, got {len(self.steps)}"
            raise ValueError(msg)

        if self.loop_mode not in ("once", "count", "continuous"):
            msg = f"Loop mode must be 'once', 'count', or 'continuous', got {self.loop_mode}"
            raise ValueError(msg)

        if self.loop_mode == "count" and (
            self.loop_count is None or self.loop_count < 1
        ):
            msg = "Loop count must be >= 1 when loop_mode is 'count'"
            raise ValueError(msg)

        if self.end_behavior not in ("maintain", "turn_off"):
            msg = f"End behavior must be 'maintain' or 'turn_off', got {self.end_behavior}"
            raise ValueError(msg)


@dataclass
class AqaraLightingRuntimeData:
    """Runtime data for the Aqara Advanced Lighting integration."""

    config_entry: ConfigEntry
    z2m_base_topic: str
    devices: dict[str, Z2MDevice] = field(default_factory=dict)
    entity_to_z2m_map: dict[str, str] = field(default_factory=dict)
    entity_mapping_methods: dict[str, str] = field(default_factory=dict)
    device_states: dict[str, DeviceState] = field(default_factory=dict)


# Type alias for typed config entry (Python 3.11+ compatible)
AqaraLightingConfigEntry: TypeAlias = ConfigEntry[AqaraLightingRuntimeData]