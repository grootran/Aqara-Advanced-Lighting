"""Sun elevation calculation engine for solar-adaptive CCT."""

import re
from dataclasses import dataclass
from datetime import datetime, timezone

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

_FIXED_TIME_RE = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")
_RELATIVE_TIME_RE = re.compile(r"^(?:sunrise|sunset)[+-]\d{1,3}$")

@dataclass(frozen=True, slots=True)
class ScheduleStep:
    """A CCT step anchored to a wall-clock or sun-relative time."""

    time: str
    color_temp: int
    brightness: int
    label: str = ""

    def __post_init__(self) -> None:
        """Validate schedule step parameters."""
        if not (_FIXED_TIME_RE.match(self.time) or _RELATIVE_TIME_RE.match(self.time)):
            msg = f"Invalid time format: {self.time!r}"
            raise ValueError(msg)
        if not (1000 <= self.color_temp <= 10000):
            msg = f"Color temp must be 1000-10000K, got {self.color_temp}"
            raise ValueError(msg)
        if not (1 <= self.brightness <= 255):
            msg = f"Brightness must be 1-255, got {self.brightness}"
            raise ValueError(msg)

_CYCLE_MINUTES = 1440  # 24 hours in minutes

def resolve_step_time(time_str: str, sun_state: State) -> float:
    """Resolve a schedule time string to minutes from midnight.

    Accepts fixed times ("HH:MM") and sun-relative times ("sunrise+N",
    "sunset-N").  Returns a float representing minutes from midnight.
    """
    if _FIXED_TIME_RE.match(time_str):
        hours, minutes = time_str.split(":")
        return int(hours) * 60 + int(minutes)

    match = _RELATIVE_TIME_RE.match(time_str)
    if not match:
        msg = f"Invalid time format: {time_str!r}"
        raise ValueError(msg)

    # Determine which sun attribute to use
    if time_str.startswith("sunrise"):
        attr_key = "next_rising"
        offset_str = time_str[len("sunrise"):]
    else:
        attr_key = "next_setting"
        offset_str = time_str[len("sunset"):]

    sun_val = sun_state.attributes.get(attr_key)
    if sun_val is None:
        msg = f"Sun entity missing attribute {attr_key!r}"
        raise ValueError(msg)

    # HA stores next_rising/next_setting as ISO strings; parse if needed
    if isinstance(sun_val, str):
        sun_dt = datetime.fromisoformat(sun_val)
    else:
        sun_dt = sun_val

    base_minutes = sun_dt.hour * 60 + sun_dt.minute
    offset = int(offset_str)
    return float(base_minutes + offset)

def interpolate_schedule_values(
    steps: list[ScheduleStep],
    sun_state: State,
    minutes_now: float | None = None,
) -> tuple[int, int]:
    """Interpolate color_temp and brightness for a schedule-based sequence.

    Resolves all step times, sorts them, and performs linear interpolation
    on a 1440-minute (24h) cycle with midnight wrap-around.

    Returns (color_temp, brightness) tuple.
    """
    if len(steps) < 2:
        msg = "At least 2 ScheduleSteps are required"
        raise ValueError(msg)

    # Resolve all step times and pair them with the original step data
    resolved: list[tuple[float, ScheduleStep]] = [
        (resolve_step_time(s.time, sun_state), s)
        for s in steps
    ]
    resolved.sort(key=lambda pair: pair[0])

    if minutes_now is None:
        now = datetime.now(tz=timezone.utc)
        minutes_now = now.hour * 60 + now.minute + now.second / 60.0

    # Normalize to [0, 1440)
    minutes_now = minutes_now % _CYCLE_MINUTES

    # Find the two bracketing steps on the circular timeline
    n = len(resolved)
    for i in range(n):
        t_curr = resolved[i][0]
        t_next = resolved[(i + 1) % n][0]
        step_curr = resolved[i][1]
        step_next = resolved[(i + 1) % n][1]

        # Compute the gap between current step and the next step (wrapping)
        if t_next > t_curr:
            gap = t_next - t_curr
        else:
            gap = (_CYCLE_MINUTES - t_curr) + t_next

        # Compute elapsed time from current step to now (wrapping)
        elapsed = (minutes_now - t_curr) % _CYCLE_MINUTES

        if elapsed <= gap or (gap == 0 and elapsed == 0):
            # minutes_now falls within this segment
            if gap == 0:
                progress = 0.0
            else:
                progress = elapsed / gap

            ct = round(
                step_curr.color_temp
                + progress * (step_next.color_temp - step_curr.color_temp)
            )
            br = round(
                step_curr.brightness
                + progress * (step_next.brightness - step_curr.brightness)
            )
            return ct, br

    # Fallback (should not reach here with valid data)
    last_step = resolved[-1][1]
    return last_step.color_temp, last_step.brightness

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
