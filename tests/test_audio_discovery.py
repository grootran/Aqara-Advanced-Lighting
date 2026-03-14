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
    assert determine_audio_tier("binary_sensor.onset_detected") == AUDIO_TIER_RICH


def test_t1_strip_params_on_onset_low_sensitivity():
    """On-onset mode with low sensitivity should map to blink + low."""
    scene = _make_scene(audio_color_advance="on_onset", audio_sensitivity=30)
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


def test_t1_strip_params_beat_predictive_maps_to_blink():
    """beat_predictive mode should map to blink effect."""
    scene = _make_scene(audio_color_advance="beat_predictive", audio_sensitivity=70)
    params = map_t1_strip_params(scene)
    assert params["audio_effect"] == "blink"
    assert params["sensitivity"] == "high"


def test_t1_strip_params_intensity_breathing_maps_to_wave():
    """intensity_breathing mode should map to wave effect."""
    scene = _make_scene(audio_color_advance="intensity_breathing", audio_sensitivity=40)
    params = map_t1_strip_params(scene)
    assert params["audio_effect"] == "wave"
    assert params["sensitivity"] == "low"


def test_t1_strip_params_onset_flash_maps_to_blink():
    """onset_flash mode should map to blink effect."""
    scene = _make_scene(audio_color_advance="onset_flash", audio_sensitivity=60)
    params = map_t1_strip_params(scene)
    assert params["audio_effect"] == "blink"
    assert params["sensitivity"] == "high"


def test_discover_companion_sensors_with_siblings():
    """Discovery should find sibling sensors by unique_id suffix."""
    hass = MagicMock()
    audio_entry = MagicMock()
    audio_entry.device_id = "device_123"

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

    onset_entry = MagicMock()
    onset_entry.unique_id = "aabbccddeeff-onset_detected"
    onset_entry.entity_id = "binary_sensor.audio_onset_detected"

    silence_entry = MagicMock()
    silence_entry.unique_id = "aabbccddeeff-silence"
    silence_entry.entity_id = "binary_sensor.audio_silence"

    sensitivity_entry = MagicMock()
    sensitivity_entry.unique_id = "aabbccddeeff-sensitivity"
    sensitivity_entry.entity_id = "number.audio_reactive_sensitivity"

    squelch_entry = MagicMock()
    squelch_entry.unique_id = "aabbccddeeff-squelch"
    squelch_entry.entity_id = "number.audio_reactive_squelch"

    detection_mode_entry = MagicMock()
    detection_mode_entry.unique_id = "aabbccddeeff-detection_mode"
    detection_mode_entry.entity_id = "select.audio_reactive_detection_mode"

    # Unrelated entity on same device (should not be discovered)
    other_entry = MagicMock()
    other_entry.unique_id = "aabbccddeeff-wifi_signal"
    other_entry.entity_id = "sensor.audio_wifi_signal"

    with patch(
        "custom_components.aqara_advanced_lighting.audio_discovery.er"
    ) as mock_er:
        mock_reg = MagicMock()
        mock_er.async_get.return_value = mock_reg
        mock_reg.async_get.return_value = audio_entry
        mock_er.async_entries_for_device.return_value = [
            bass_entry, amp_entry, bpm_entry, onset_entry, silence_entry,
            sensitivity_entry, squelch_entry, detection_mode_entry, other_entry,
        ]

        result = discover_companion_sensors(hass, "binary_sensor.onset_detected")

    assert result["bass_energy"] == "sensor.audio_bass_energy"
    assert result["amplitude"] == "sensor.audio_amplitude"
    assert result["bpm"] == "sensor.audio_bpm"
    assert result["onset_detected"] == "binary_sensor.audio_onset_detected"
    assert result["silence"] == "binary_sensor.audio_silence"
    assert result["sensitivity"] == "number.audio_reactive_sensitivity"
    assert result["squelch"] == "number.audio_reactive_squelch"
    assert result["detection_mode"] == "select.audio_reactive_detection_mode"
    assert "wifi_signal" not in result


def test_discover_companion_sensors_no_optional_entities():
    """Discovery should work when optional entities are absent (old firmware)."""
    hass = MagicMock()
    audio_entry = MagicMock()
    audio_entry.device_id = "device_123"

    bass_entry = MagicMock()
    bass_entry.unique_id = "aabbccddeeff-bass_energy"
    bass_entry.entity_id = "sensor.audio_bass_energy"

    with patch(
        "custom_components.aqara_advanced_lighting.audio_discovery.er"
    ) as mock_er:
        mock_reg = MagicMock()
        mock_er.async_get.return_value = mock_reg
        mock_reg.async_get.return_value = audio_entry
        mock_er.async_entries_for_device.return_value = [bass_entry]

        result = discover_companion_sensors(hass, "binary_sensor.onset_detected")

    assert result["bass_energy"] == "sensor.audio_bass_energy"
    assert "sensitivity" not in result
    assert "squelch" not in result
    assert "detection_mode" not in result
    assert "onset_detected" not in result
    assert "silence" not in result


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

        result = discover_companion_sensors(hass, "binary_sensor.onset_detected")

    assert result == {}


def test_discover_companion_sensors_no_siblings():
    """Device with only the audio entity should return empty dict."""
    hass = MagicMock()
    audio_entry = MagicMock()
    audio_entry.device_id = "device_123"

    # Only unrelated entities
    other_entry = MagicMock()
    other_entry.unique_id = "aabbccddeeff-wifi_signal"
    other_entry.entity_id = "sensor.audio_wifi_signal"

    with patch(
        "custom_components.aqara_advanced_lighting.audio_discovery.er"
    ) as mock_er:
        mock_reg = MagicMock()
        mock_er.async_get.return_value = mock_reg
        mock_reg.async_get.return_value = audio_entry
        mock_er.async_entries_for_device.return_value = [other_entry]

        result = discover_companion_sensors(hass, "binary_sensor.onset_detected")

    assert result == {}


def test_discover_companion_sensors_binary_sensor_types():
    """Binary sensor companions (onset_detected, silence) should be discovered."""
    hass = MagicMock()
    audio_entry = MagicMock()
    audio_entry.device_id = "device_456"

    onset_entry = MagicMock()
    onset_entry.unique_id = "112233445566-onset_detected"
    onset_entry.entity_id = "binary_sensor.esphome_onset_detected"

    silence_entry = MagicMock()
    silence_entry.unique_id = "112233445566-silence"
    silence_entry.entity_id = "binary_sensor.esphome_silence"

    with patch(
        "custom_components.aqara_advanced_lighting.audio_discovery.er"
    ) as mock_er:
        mock_reg = MagicMock()
        mock_er.async_get.return_value = mock_reg
        mock_reg.async_get.return_value = audio_entry
        mock_er.async_entries_for_device.return_value = [onset_entry, silence_entry]

        result = discover_companion_sensors(hass, "binary_sensor.esphome_onset_detected")

    assert result["onset_detected"] == "binary_sensor.esphome_onset_detected"
    assert result["silence"] == "binary_sensor.esphome_silence"


def test_discover_companion_sensors_select_type():
    """Select companion (detection_mode) should be discovered."""
    hass = MagicMock()
    audio_entry = MagicMock()
    audio_entry.device_id = "device_789"

    detection_mode_entry = MagicMock()
    detection_mode_entry.unique_id = "aabbccddeeff-detection_mode"
    detection_mode_entry.entity_id = "select.esphome_detection_mode"

    with patch(
        "custom_components.aqara_advanced_lighting.audio_discovery.er"
    ) as mock_er:
        mock_reg = MagicMock()
        mock_er.async_get.return_value = mock_reg
        mock_reg.async_get.return_value = audio_entry
        mock_er.async_entries_for_device.return_value = [detection_mode_entry]

        result = discover_companion_sensors(hass, "binary_sensor.esphome_onset_detected")

    assert result["detection_mode"] == "select.esphome_detection_mode"


def _make_scene(
    audio_color_advance: str = "on_onset",
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
