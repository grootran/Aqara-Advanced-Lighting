"""Sun elevation calculation engine for solar-adaptive CCT."""

from __future__ import annotations

from dataclasses import dataclass

from homeassistant.core import HomeAssistant, State

SUN_ENTITY_ID = "sun.sun"


@dataclass(frozen=True, slots=True)
class SolarStep:
    """A CCT step anchored to a sun elevation angle."""

    sun_elevation: float
    color_temp: int
    brightness: int
    phase: str = "any"  # "rising", "setting", or "any"

    def __post_init__(self) -> None:
        """Validate solar step parameters."""
        if not (1000 <= self.color_temp <= 10000):
            msg = f"Color temp must be 1000-10000K, got {self.color_temp}"
            raise ValueError(msg)
        if not (1 <= self.brightness <= 255):
            msg = f"Brightness must be 1-255, got {self.brightness}"
            raise ValueError(msg)
        if self.phase not in ("rising", "setting", "any"):
            msg = f"Phase must be 'rising', 'setting', or 'any', got {self.phase}"
            raise ValueError(msg)
        if not (-90 <= self.sun_elevation <= 90):
            msg = f"Sun elevation must be -90 to 90, got {self.sun_elevation}"
            raise ValueError(msg)


def get_sun_state(hass: HomeAssistant) -> State | None:
    """Get the current sun.sun entity state."""
    return hass.states.get(SUN_ENTITY_ID)


def interpolate_solar_values(
    steps: list[SolarStep],
    sun_state: State,
) -> tuple[int, int]:
    """Interpolate color_temp and brightness from sun elevation.

    Returns (color_temp, brightness) for the current sun position.
    """
    if len(steps) < 2:
        raise ValueError("At least 2 SolarSteps are required")

    elevation = sun_state.attributes.get("elevation", 0.0)
    rising = sun_state.attributes.get("rising", True)

    # Filter steps by phase
    phase_filter = "rising" if rising else "setting"
    applicable = [
        s for s in steps
        if s.phase == "any" or s.phase == phase_filter
    ]

    if not applicable:
        applicable = [s for s in steps if s.phase == "any"]

    if not applicable:
        applicable = list(steps)

    # Sort by elevation
    applicable.sort(key=lambda s: s.sun_elevation)

    # Below lowest step: hold
    if elevation <= applicable[0].sun_elevation:
        return applicable[0].color_temp, applicable[0].brightness

    # Above highest step: hold
    if elevation >= applicable[-1].sun_elevation:
        return applicable[-1].color_temp, applicable[-1].brightness

    # Find the two bracketing steps and interpolate
    for i in range(len(applicable) - 1):
        lower = applicable[i]
        upper = applicable[i + 1]
        if lower.sun_elevation <= elevation <= upper.sun_elevation:
            span = upper.sun_elevation - lower.sun_elevation
            if span == 0:
                t = 0.0
            else:
                t = (elevation - lower.sun_elevation) / span

            ct = round(lower.color_temp + t * (upper.color_temp - lower.color_temp))
            br = round(lower.brightness + t * (upper.brightness - lower.brightness))
            return ct, br

    # Fallback (should not reach here)
    return applicable[-1].color_temp, applicable[-1].brightness
