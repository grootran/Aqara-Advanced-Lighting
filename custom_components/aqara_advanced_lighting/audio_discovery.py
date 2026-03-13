"""Audio tier detection, device-registry sibling discovery, and parameter mapping.

Discovers companion sensors via the HA device registry and maps audio
parameters for T1 Strip on-device routing.
"""
from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.helpers import entity_registry as er

from .const import (
    AUDIO_COLOR_ADVANCE_ON_BEAT,
    AUDIO_TIER_RICH,
    MUSIC_SYNC_EFFECT_BLINK,
    MUSIC_SYNC_EFFECT_WAVE,
    MUSIC_SYNC_SENSITIVITY_HIGH,
    MUSIC_SYNC_SENSITIVITY_LOW,
    T1_STRIP_AUDIO_SENSITIVITY_CUTOFF,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .models import DynamicScene

# Companion sensor unique_id suffixes expected from the
# esphome-audio-reactive component.
COMPANION_SENSOR_SUFFIXES: dict[str, str] = {
    "-bass_energy": "bass_energy",
    "-mid_energy": "mid_energy",
    "-high_energy": "high_energy",
    "-amplitude": "amplitude",
    "-bpm": "bpm",
}

COMPANION_NUMBER_SUFFIXES: dict[str, str] = {
    "-beat_sensitivity": "beat_sensitivity",
}


def determine_audio_tier(audio_entity_id: str) -> str:
    """All audio entities use the rich tier."""
    return AUDIO_TIER_RICH


def discover_companion_sensors(
    hass: HomeAssistant,
    beat_entity_id: str,
) -> dict[str, str | None]:
    """Discover companion audio sensors sharing the same HA device.

    Looks up the device that owns `beat_entity_id`, then iterates
    all enabled entities on that device. Any entity whose unique_id
    ends with a known suffix (bass_energy, mid_energy, etc.) is
    returned under its role key.

    Returns an empty dict when the entity has no associated device or
    no sibling sensors are found.
    """
    companions: dict[str, str | None] = {}

    ent_reg = er.async_get(hass)
    entry = ent_reg.async_get(beat_entity_id)
    if entry is None or entry.device_id is None:
        return companions

    device_entries = er.async_entries_for_device(
        ent_reg, entry.device_id, include_disabled_entities=False
    )

    for device_entry in device_entries:
        if device_entry.unique_id is None:
            continue
        for suffix, role in COMPANION_SENSOR_SUFFIXES.items():
            if device_entry.unique_id.endswith(suffix):
                companions[role] = device_entry.entity_id
                break
        for suffix, role in COMPANION_NUMBER_SUFFIXES.items():
            if device_entry.unique_id.endswith(suffix):
                companions[role] = device_entry.entity_id
                break

    return companions


def map_t1_strip_params(scene: DynamicScene) -> dict[str, str]:
    """Map dynamic scene audio parameters to T1 Strip music sync parameters.

    The T1 Strip uses on-device music sync with discrete sensitivity
    levels and effect names rather than software-driven beat processing.
    """
    sensitivity = (
        MUSIC_SYNC_SENSITIVITY_LOW
        if scene.audio_sensitivity <= T1_STRIP_AUDIO_SENSITIVITY_CUTOFF
        else MUSIC_SYNC_SENSITIVITY_HIGH
    )

    audio_effect = (
        MUSIC_SYNC_EFFECT_BLINK
        if scene.audio_color_advance == AUDIO_COLOR_ADVANCE_ON_BEAT
        else MUSIC_SYNC_EFFECT_WAVE
    )

    return {
        "sensitivity": sensitivity,
        "audio_effect": audio_effect,
    }
