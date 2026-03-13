"""End-to-end tests for rich tier audio-reactive scenes."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from custom_components.aqara_advanced_lighting.audio_discovery import (
    determine_audio_tier,
    discover_companion_sensors,
)
from custom_components.aqara_advanced_lighting.const import (
    AUDIO_TIER_RICH,
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
        audio_color_advance="on_beat",
        audio_transition_speed=50,
        audio_brightness_response=True,
    )
    defaults.update(kwargs)
    return DynamicScene(**defaults)


def test_rich_tier_detected_for_binary_sensor():
    """binary_sensor entity should route to rich tier."""
    assert determine_audio_tier("binary_sensor.beat_detected") == AUDIO_TIER_RICH



def test_companion_discovery_maps_all_roles():
    """All companion sensor roles should be discoverable."""
    hass = MagicMock()
    beat_entry = MagicMock()
    beat_entry.device_id = "device_audio"

    # Unique IDs use dash separators as registered by ESPHome in HA
    entries = []
    for unique_suffix, entity_suffix in [
        ("-bass_energy", "_bass_energy"),
        ("-mid_energy", "_mid_energy"),
        ("-high_energy", "_high_energy"),
        ("-amplitude", "_amplitude"),
        ("-bpm", "_bpm"),
        ("-beat_sensitivity", "_beat_sensitivity"),
    ]:
        e = MagicMock()
        e.unique_id = f"esphome_audio{unique_suffix}"
        e.entity_id = f"sensor.audio{entity_suffix}"
        entries.append(e)

    with patch(
        "custom_components.aqara_advanced_lighting.audio_discovery.er"
    ) as mock_er:
        mock_reg = MagicMock()
        mock_er.async_get.return_value = mock_reg
        mock_reg.async_get.return_value = beat_entry
        mock_er.async_entries_for_device.return_value = entries

        result = discover_companion_sensors(hass, "binary_sensor.beat_detected")

    assert len(result) == 6
    assert result["bass_energy"] == "sensor.audio_bass_energy"
    assert result["bpm"] == "sensor.audio_bpm"
    assert result["beat_sensitivity"] == "sensor.audio_beat_sensitivity"


def test_rich_scene_model_accepts_binary_sensor():
    """DynamicScene should accept binary_sensor as audio_entity."""
    scene = _make_rich_scene()
    assert scene.audio_entity == "binary_sensor.beat_detected"
    assert scene.audio_sensitivity == 50


def test_continuous_mode_with_rich_tier():
    """Rich tier continuous mode scene should be valid."""
    scene = _make_rich_scene(audio_color_advance="continuous")
    assert scene.audio_color_advance == "continuous"
