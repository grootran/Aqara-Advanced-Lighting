"""Data models for the Aqara Advanced Lighting integration."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

from homeassistant.config_entries import ConfigEntry


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
class AqaraLightingRuntimeData:
    """Runtime data for the Aqara Advanced Lighting integration."""

    config_entry: ConfigEntry
    z2m_base_topic: str
    devices: dict[str, Z2MDevice] = field(default_factory=dict)
    entity_to_z2m_map: dict[str, str] = field(default_factory=dict)
    device_states: dict[str, DeviceState] = field(default_factory=dict)


# Type alias for typed config entry
type AqaraLightingConfigEntry = ConfigEntry[AqaraLightingRuntimeData]