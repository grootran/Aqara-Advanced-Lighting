"""End-to-end tests for rich tier audio-reactive scenes."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from custom_components.aqara_advanced_lighting.audio_discovery import (
    discover_companion_sensors,
)
from custom_components.aqara_advanced_lighting.const import (
    DEFAULT_AUDIO_SENSITIVITY,
)
from custom_components.aqara_advanced_lighting.models import (
    DynamicScene,
    DynamicSceneColor,
)


def _make_rich_scene(**kwargs) -> DynamicScene:
    """Create a DynamicScene configured for rich tier audio."""
    defaults = dict(
        colors=[
            DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100),
            DynamicSceneColor(x=0.5, y=0.3, brightness_pct=80),
            DynamicSceneColor(x=0.2, y=0.4, brightness_pct=90),
        ],
        transition_time=1.0,
        hold_time=1.0,
        distribution_mode="synchronized",
        offset_delay=0.0,
        random_order=False,
        loop_mode="continuous",
        audio_entity="binary_sensor.beat_detected",
        audio_sensitivity=50,
        audio_color_advance="on_onset",
        audio_transition_speed=50,
        audio_brightness_response=True,
    )
    defaults.update(kwargs)
    return DynamicScene(**defaults)


def test_companion_discovery_maps_all_roles():
    """All companion sensor roles should be discoverable."""
    hass = MagicMock()
    audio_entry = MagicMock()
    audio_entry.device_id = "device_audio"

    # Unique IDs use dash separators as registered by ESPHome in HA.
    # v2 suffixes: sensors, binary_sensors, numbers, selects.
    sensor_entries = []
    for unique_suffix, entity_id in [
        ("-bass_energy", "sensor.audio_bass_energy"),
        ("-mid_energy", "sensor.audio_mid_energy"),
        ("-high_energy", "sensor.audio_high_energy"),
        ("-amplitude", "sensor.audio_amplitude"),
        ("-bpm", "sensor.audio_bpm"),
        ("-onset_detected", "binary_sensor.audio_onset_detected"),
        ("-silence", "binary_sensor.audio_silence"),
        ("-sensitivity", "number.audio_sensitivity"),
        ("-squelch", "number.audio_squelch"),
        ("-detection_mode", "select.audio_detection_mode"),
    ]:
        e = MagicMock()
        e.unique_id = f"esphome_audio{unique_suffix}"
        e.entity_id = entity_id
        sensor_entries.append(e)

    with patch(
        "custom_components.aqara_advanced_lighting.audio_discovery.er"
    ) as mock_er:
        mock_reg = MagicMock()
        mock_er.async_get.return_value = mock_reg
        mock_reg.async_get.return_value = audio_entry
        mock_er.async_entries_for_device.return_value = sensor_entries

        result = discover_companion_sensors(hass, "binary_sensor.onset_detected")

    assert len(result) == 10
    assert result["bass_energy"] == "sensor.audio_bass_energy"
    assert result["bpm"] == "sensor.audio_bpm"
    assert result["onset_detected"] == "binary_sensor.audio_onset_detected"
    assert result["silence"] == "binary_sensor.audio_silence"
    assert result["sensitivity"] == "number.audio_sensitivity"
    assert result["squelch"] == "number.audio_squelch"
    assert result["detection_mode"] == "select.audio_detection_mode"


def test_rich_scene_model_accepts_binary_sensor():
    """DynamicScene should accept binary_sensor as audio_entity."""
    scene = _make_rich_scene()
    assert scene.audio_entity == "binary_sensor.beat_detected"
    assert scene.audio_sensitivity == 50


def test_continuous_mode_with_rich_tier():
    """Rich tier continuous mode scene should be valid."""
    scene = _make_rich_scene(audio_color_advance="continuous")
    assert scene.audio_color_advance == "continuous"
