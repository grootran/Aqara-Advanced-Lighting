"""Tests for schedule CCT sequence mode."""

import pytest

from custom_components.aqara_advanced_lighting.sun_utils import ScheduleStep


def test_schedule_step_fixed_time() -> None:
    """ScheduleStep should accept fixed time strings."""
    step = ScheduleStep(time="12:00", color_temp=5500, brightness=255, label="Midday")
    assert step.time == "12:00"
    assert step.color_temp == 5500
    assert step.brightness == 255
    assert step.label == "Midday"


def test_schedule_step_relative_sunrise() -> None:
    """ScheduleStep should accept sunrise-relative time strings."""
    step = ScheduleStep(time="sunrise+30", color_temp=3500, brightness=178, label="Morning")
    assert step.time == "sunrise+30"


def test_schedule_step_relative_sunset() -> None:
    """ScheduleStep should accept sunset-relative time strings."""
    step = ScheduleStep(time="sunset-120", color_temp=4500, brightness=230, label="Afternoon")
    assert step.time == "sunset-120"


def test_schedule_step_relative_sunset_zero_offset() -> None:
    """ScheduleStep should accept zero offset."""
    step = ScheduleStep(time="sunset+0", color_temp=3000, brightness=153, label="Evening")
    assert step.time == "sunset+0"


def test_schedule_step_invalid_time_format() -> None:
    """ScheduleStep should reject invalid time formats."""
    with pytest.raises(ValueError, match="Invalid time format"):
        ScheduleStep(time="noon", color_temp=5500, brightness=255, label="Bad")


def test_schedule_step_invalid_color_temp() -> None:
    """ScheduleStep should reject out-of-range color temp."""
    with pytest.raises(ValueError, match="Color temp"):
        ScheduleStep(time="12:00", color_temp=500, brightness=255, label="Bad")


def test_schedule_step_invalid_brightness() -> None:
    """ScheduleStep should reject out-of-range brightness."""
    with pytest.raises(ValueError, match="Brightness"):
        ScheduleStep(time="12:00", color_temp=5500, brightness=0, label="Bad")


def test_schedule_step_empty_label_allowed() -> None:
    """ScheduleStep should allow empty label."""
    step = ScheduleStep(time="12:00", color_temp=5500, brightness=255, label="")
    assert step.label == ""


# -- Task 2: resolve_step_time and interpolate_schedule_values tests --

from unittest.mock import MagicMock
from datetime import datetime, timezone

from custom_components.aqara_advanced_lighting.sun_utils import (
    resolve_step_time,
    interpolate_schedule_values,
)


def _make_sun_state(
    sunrise_hour: int = 7,
    sunrise_min: int = 0,
    sunset_hour: int = 19,
    sunset_min: int = 0,
) -> MagicMock:
    """Create a mock sun.sun state with next_rising/next_setting."""
    now = datetime.now(tz=timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    state = MagicMock()
    state.attributes = {
        "next_rising": today.replace(hour=sunrise_hour, minute=sunrise_min),
        "next_setting": today.replace(hour=sunset_hour, minute=sunset_min),
    }
    return state


# -- resolve_step_time tests --


def test_resolve_fixed_time() -> None:
    """Fixed time should return minutes from midnight."""
    sun = _make_sun_state()
    assert resolve_step_time("12:00", sun) == 720.0
    assert resolve_step_time("07:30", sun) == 450.0
    assert resolve_step_time("00:00", sun) == 0.0


def test_resolve_sunrise_relative() -> None:
    """Sunrise-relative times should use next_rising."""
    sun = _make_sun_state(sunrise_hour=7, sunrise_min=0)
    assert resolve_step_time("sunrise+30", sun) == 450.0  # 7*60 + 30
    assert resolve_step_time("sunrise-30", sun) == 390.0  # 7*60 - 30


def test_resolve_sunset_relative() -> None:
    """Sunset-relative times should use next_setting."""
    sun = _make_sun_state(sunset_hour=19, sunset_min=0)
    assert resolve_step_time("sunset+0", sun) == 1140.0  # 19*60
    assert resolve_step_time("sunset+90", sun) == 1230.0  # 19*60 + 90
    assert resolve_step_time("sunset-120", sun) == 1020.0  # 19*60 - 120


# -- interpolate_schedule_values tests --


def test_interpolate_midpoint() -> None:
    """Interpolation at midpoint between two steps."""
    steps = [
        ScheduleStep(time="06:00", color_temp=2700, brightness=102, label="Dawn"),
        ScheduleStep(time="12:00", color_temp=5500, brightness=255, label="Midday"),
    ]
    sun = _make_sun_state()
    # At 09:00 (540 min): progress = (540-360)/(720-360) = 0.5
    ct, br = interpolate_schedule_values(steps, sun, minutes_now=540.0)
    assert ct == 4100  # 2700 + 0.5 * 2800
    assert br == 178   # round(102 + 0.5 * 153) = round(178.5) = 178 (banker's rounding)


def test_interpolate_at_step_boundary() -> None:
    """Interpolation at exact step time returns that step's values."""
    steps = [
        ScheduleStep(time="06:00", color_temp=2700, brightness=102, label="Dawn"),
        ScheduleStep(time="12:00", color_temp=5500, brightness=255, label="Midday"),
    ]
    sun = _make_sun_state()
    ct, br = interpolate_schedule_values(steps, sun, minutes_now=360.0)
    assert ct == 2700
    assert br == 102


def test_interpolate_wraps_midnight() -> None:
    """Interpolation should wrap from last step back to first across midnight."""
    steps = [
        ScheduleStep(time="06:00", color_temp=4000, brightness=200, label="Morning"),
        ScheduleStep(time="22:00", color_temp=2700, brightness=100, label="Night"),
    ]
    sun = _make_sun_state()
    # At 02:00 (120 min): between Night(22:00) and Morning(06:00)
    # Gap: 22:00->06:00 = 8h = 480 min
    # Elapsed from 22:00 to 02:00 = 4h = 240 min
    # Progress = 240/480 = 0.5
    ct, br = interpolate_schedule_values(steps, sun, minutes_now=120.0)
    assert ct == 3350  # 2700 + 0.5 * (4000-2700)
    assert br == 150   # 100 + 0.5 * (200-100)


def test_interpolate_with_relative_times() -> None:
    """Interpolation should resolve relative times before interpolating."""
    steps = [
        ScheduleStep(time="sunrise+0", color_temp=2700, brightness=102, label="Dawn"),
        ScheduleStep(time="12:00", color_temp=5500, brightness=255, label="Midday"),
    ]
    sun = _make_sun_state(sunrise_hour=7, sunrise_min=0)
    # sunrise+0 = 07:00 = 420 min
    # At 09:30 = 570 min: progress = (570-420)/(720-420) = 150/300 = 0.5
    ct, br = interpolate_schedule_values(steps, sun, minutes_now=570.0)
    assert ct == 4100
    assert br == 178  # round(178.5) = 178 (banker's rounding)


def test_interpolate_requires_two_steps() -> None:
    """Interpolation should require at least 2 steps."""
    steps = [
        ScheduleStep(time="12:00", color_temp=5500, brightness=255, label="Midday"),
    ]
    sun = _make_sun_state()
    with pytest.raises(ValueError, match="At least 2"):
        interpolate_schedule_values(steps, sun, minutes_now=720.0)


# -- Tasks 3 & 4: CCTSequence model and service helper tests --

from custom_components.aqara_advanced_lighting.models import CCTSequence
from custom_components.aqara_advanced_lighting.services import _build_schedule_sequence


def test_cct_sequence_accepts_schedule_mode() -> None:
    """CCTSequence should accept mode='schedule' with schedule_steps."""
    steps = [
        ScheduleStep(time="06:00", color_temp=2700, brightness=102, label="Dawn"),
        ScheduleStep(time="12:00", color_temp=5500, brightness=255, label="Midday"),
    ]
    seq = CCTSequence(
        steps=[],
        loop_mode="continuous",
        end_behavior="maintain",
        mode="schedule",
        schedule_steps=steps,
    )
    assert seq.mode == "schedule"
    assert len(seq.schedule_steps) == 2


def test_schedule_mode_requires_schedule_steps() -> None:
    """Schedule mode without schedule_steps should raise ValueError."""
    with pytest.raises(ValueError, match="at least 2 schedule steps"):
        CCTSequence(
            steps=[],
            loop_mode="continuous",
            end_behavior="maintain",
            mode="schedule",
            schedule_steps=[],
        )


def test_schedule_mode_enforces_maintain() -> None:
    """Schedule mode should only allow end_behavior='maintain'."""
    steps = [
        ScheduleStep(time="06:00", color_temp=2700, brightness=102, label="Dawn"),
        ScheduleStep(time="12:00", color_temp=5500, brightness=255, label="Midday"),
    ]
    with pytest.raises(ValueError, match="maintain"):
        CCTSequence(
            steps=[],
            loop_mode="continuous",
            end_behavior="turn_off",
            mode="schedule",
            schedule_steps=steps,
        )


def test_build_schedule_sequence() -> None:
    """_build_schedule_sequence should create a valid CCTSequence."""
    steps_data = [
        {"time": "06:00", "color_temp": 2700, "brightness": 102, "label": "Dawn"},
        {"time": "12:00", "color_temp": 5500, "brightness": 255, "label": "Midday"},
    ]
    seq = _build_schedule_sequence(steps_data, auto_resume_delay=120)
    assert seq.mode == "schedule"
    assert len(seq.schedule_steps) == 2
    assert seq.schedule_steps[0].time == "06:00"
    assert seq.schedule_steps[0].label == "Dawn"
    assert seq.auto_resume_delay == 120
    assert seq.loop_mode == "continuous"
    assert seq.end_behavior == "maintain"


# -- Task 7: Preset conversion tests --

from custom_components.aqara_advanced_lighting.presets import CCT_SEQUENCE_PRESETS
from custom_components.aqara_advanced_lighting.const import (
    PRESET_CCT_CIRCADIAN,
    PRESET_CCT_SOLAR_WARM,
    PRESET_CCT_SOLAR_PRODUCTIVE,
)


def test_circadian_preset_is_schedule_mode() -> None:
    """Circadian Rhythm preset should use schedule mode."""
    preset = CCT_SEQUENCE_PRESETS[PRESET_CCT_CIRCADIAN]
    assert preset["mode"] == "schedule"
    assert "schedule_steps" in preset
    assert len(preset["schedule_steps"]) >= 2
    assert "time" in preset["schedule_steps"][0]


def test_solar_warm_preset_is_schedule_mode() -> None:
    """Warm Day preset should use schedule mode."""
    preset = CCT_SEQUENCE_PRESETS[PRESET_CCT_SOLAR_WARM]
    assert preset["mode"] == "schedule"
    assert "schedule_steps" in preset


def test_solar_productive_preset_is_schedule_mode() -> None:
    """Productive Day preset should use schedule mode."""
    preset = CCT_SEQUENCE_PRESETS[PRESET_CCT_SOLAR_PRODUCTIVE]
    assert preset["mode"] == "schedule"
    assert "schedule_steps" in preset
