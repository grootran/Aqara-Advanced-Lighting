"""Tests for audio tier detection and device-registry sibling discovery."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from custom_components.aqara_advanced_lighting.audio_discovery import (
    determine_audio_tier,
    discover_companion_sensors,
    map_t1_strip_params,
)
from custom_components.aqara_advanced_lighting.const import (
    AUDIO_TIER_RICH,
)
from custom_components.aqara_advanced_lighting.models import (
    DynamicScene,
    DynamicSceneColor,
)


def test_determine_tier_binary_sensor():
    """Binary sensor domain entity should return rich tier."""
    assert determine_audio_tier("binary_sensor.beat_detected") == AUDIO_TIER_RICH


def test_t1_strip_params_on_beat_low_sensitivity():
    """On-beat mode with low sensitivity should map to blink + low."""
    scene = _make_scene(audio_color_advance="on_beat", audio_sensitivity=30)
    params = map_t1_strip_params(scene)
    assert params["sensitivity"] == "low"
    assert params["audio_effect"] == "blink"


def test_t1_strip_params_continuous_high_sensitivity():
    """Continuous mode with high sensitivity should map to wave + high."""
    scene = _make_scene(audio_color_advance="continuous", audio_sensitivity=80)
    params = map_t1_strip_params(scene)
    assert params["sensitivity"] == "high"
    assert params["audio_effect"] == "wave"


def test_t1_strip_params_sensitivity_cutoff():
    """Sensitivity at cutoff (50) should map to low; 51 should map to high."""
    scene = _make_scene(audio_sensitivity=50)
    params = map_t1_strip_params(scene)
    assert params["sensitivity"] == "low"

    scene_above = _make_scene(audio_sensitivity=51)
    params_above = map_t1_strip_params(scene_above)
    assert params_above["sensitivity"] == "high"


def test_discover_companion_sensors_with_siblings():
    """Discovery should find sibling sensors by unique_id suffix."""
    hass = MagicMock()
    beat_entry = MagicMock()
    beat_entry.device_id = "device_123"

    # Sibling entities on the same device
    bass_entry = MagicMock()
    bass_entry.unique_id = "aabbccddeeff-bass_energy"
    bass_entry.entity_id = "sensor.audio_bass_energy"

    amp_entry = MagicMock()
    amp_entry.unique_id = "aabbccddeeff-amplitude"
    amp_entry.entity_id = "sensor.audio_amplitude"

    bpm_entry = MagicMock()
    bpm_entry.unique_id = "aabbccddeeff-bpm"
    bpm_entry.entity_id = "sensor.audio_bpm"

    sensitivity_entry = MagicMock()
    sensitivity_entry.unique_id = "aabbccddeeff-beat_sensitivity"
    sensitivity_entry.entity_id = "number.audio_reactive_beat_sensitivity"

    # Unrelated entity on same device (should not be discovered)
    other_entry = MagicMock()
    other_entry.unique_id = "aabbccddeeff-wifi_signal"
    other_entry.entity_id = "sensor.audio_wifi_signal"

    with patch(
        "custom_components.aqara_advanced_lighting.audio_discovery.er"
    ) as mock_er:
        mock_reg = MagicMock()
        mock_er.async_get.return_value = mock_reg
        mock_reg.async_get.return_value = beat_entry
        mock_er.async_entries_for_device.return_value = [
            bass_entry, amp_entry, bpm_entry, sensitivity_entry, other_entry,
        ]

        result = discover_companion_sensors(hass, "binary_sensor.beat_detected")

    assert result["bass_energy"] == "sensor.audio_bass_energy"
    assert result["amplitude"] == "sensor.audio_amplitude"
    assert result["bpm"] == "sensor.audio_bpm"
    assert result["beat_sensitivity"] == "number.audio_reactive_beat_sensitivity"
    assert "wifi_signal" not in result


def test_discover_companion_sensors_no_number_entity():
    """Discovery should work when number entity is not present (old firmware)."""
    hass = MagicMock()
    beat_entry = MagicMock()
    beat_entry.device_id = "device_123"

    bass_entry = MagicMock()
    bass_entry.unique_id = "aabbccddeeff-bass_energy"
    bass_entry.entity_id = "sensor.audio_bass_energy"

    with patch(
        "custom_components.aqara_advanced_lighting.audio_discovery.er"
    ) as mock_er:
        mock_reg = MagicMock()
        mock_er.async_get.return_value = mock_reg
        mock_reg.async_get.return_value = beat_entry
        mock_er.async_entries_for_device.return_value = [bass_entry]

        result = discover_companion_sensors(hass, "binary_sensor.beat_detected")

    assert result["bass_energy"] == "sensor.audio_bass_energy"
    assert "beat_sensitivity" not in result


def test_discover_companion_sensors_no_device():
    """Entity without a device should return empty dict."""
    hass = MagicMock()
    entry_no_device = MagicMock()
    entry_no_device.device_id = None

    with patch(
        "custom_components.aqara_advanced_lighting.audio_discovery.er"
    ) as mock_er:
        mock_reg = MagicMock()
        mock_er.async_get.return_value = mock_reg
        mock_reg.async_get.return_value = entry_no_device

        result = discover_companion_sensors(hass, "binary_sensor.beat_detected")

    assert result == {}


def test_discover_companion_sensors_no_siblings():
    """Device with only the beat sensor should return empty dict."""
    hass = MagicMock()
    beat_entry = MagicMock()
    beat_entry.device_id = "device_123"

    # Only unrelated entities
    other_entry = MagicMock()
    other_entry.unique_id = "aabbccddeeff-wifi_signal"
    other_entry.entity_id = "sensor.audio_wifi_signal"

    with patch(
        "custom_components.aqara_advanced_lighting.audio_discovery.er"
    ) as mock_er:
        mock_reg = MagicMock()
        mock_er.async_get.return_value = mock_reg
        mock_reg.async_get.return_value = beat_entry
        mock_er.async_entries_for_device.return_value = [other_entry]

        result = discover_companion_sensors(hass, "binary_sensor.beat_detected")

    assert result == {}


def _make_scene(
    audio_color_advance: str = "on_beat",
    audio_sensitivity: int = 50,
) -> DynamicScene:
    """Create a minimal DynamicScene for testing."""
    return DynamicScene(
        colors=[DynamicSceneColor(x=0.3, y=0.3, brightness_pct=100)],
        transition_time=1.0,
        hold_time=1.0,
        distribution_mode="shuffle_rotate",
        offset_delay=0.0,
        random_order=False,
        loop_mode="continuous",
        audio_entity="binary_sensor.test",
        audio_sensitivity=audio_sensitivity,
        audio_color_advance=audio_color_advance,
    )
