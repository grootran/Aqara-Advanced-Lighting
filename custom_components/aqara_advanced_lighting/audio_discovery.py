"""Audio tier detection, device-registry sibling discovery, and parameter mapping.

Discovers companion sensors via the HA device registry and maps audio
parameters for T1 Strip on-device routing.
"""

from typing import TYPE_CHECKING

from homeassistant.helpers import entity_registry as er

from .const import (
    AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE,
    AUDIO_COLOR_ADVANCE_CONTINUOUS,
    AUDIO_COLOR_ADVANCE_INTENSITY_BREATHING,
    AUDIO_COLOR_ADVANCE_ON_ONSET,
    AUDIO_COLOR_ADVANCE_ONSET_FLASH,
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
    "-centroid": "centroid",
    "-spectral_centroid": "centroid",
    "-rolloff": "rolloff",
    "-spectral_rolloff": "rolloff",
    "-beat_confidence": "beat_confidence",
    "-beat_phase": "beat_phase",
    "-onset_strength": "onset_strength",
    # Pro-tier musical-band energy sensors (audio-reactive pro DSP).
    "-sub_bass_energy": "sub_bass_energy",
    "-low_mid_energy": "low_mid_energy",
    "-upper_mid_energy": "upper_mid_energy",
    "-air_energy": "air_energy",
}

COMPANION_BINARY_SENSOR_SUFFIXES: dict[str, str] = {
    "-onset_detected": "onset_detected",
    "-audio_sensor": "onset_detected",
    "-silence": "silence",
    # Pro-tier: explicit beat event and calibration health signal.
    "-beat_event": "beat_event",
    "-calibration_stale": "calibration_stale",
}

COMPANION_NUMBER_SUFFIXES: dict[str, str] = {
    "-sensitivity": "sensitivity",
    "-beat_sensitivity": "sensitivity",
    "-squelch": "squelch",
}

COMPANION_SELECT_SUFFIXES: dict[str, str] = {
    "-detection_mode": "detection_mode",
}

def discover_companion_sensors(
    hass: HomeAssistant,
    audio_entity_id: str,
) -> dict[str, str | None]:
    """Discover companion audio sensors sharing the same HA device.

    Looks up the device that owns `audio_entity_id`, then iterates
    all enabled entities on that device. Any entity whose unique_id
    ends with a known suffix (bass_energy, mid_energy, onset_detected,
    silence, sensitivity, squelch, detection_mode, etc.) is returned
    under its role key.

    Returns an empty dict when the entity has no associated device or
    no sibling sensors are found.
    """
    companions: dict[str, str | None] = {}

    ent_reg = er.async_get(hass)
    entry = ent_reg.async_get(audio_entity_id)
    if entry is None or entry.device_id is None:
        return companions

    device_entries = er.async_entries_for_device(
        ent_reg, entry.device_id, include_disabled_entities=False
    )

    all_suffix_maps = [
        COMPANION_SENSOR_SUFFIXES,
        COMPANION_BINARY_SENSOR_SUFFIXES,
        COMPANION_NUMBER_SUFFIXES,
        COMPANION_SELECT_SUFFIXES,
    ]

    for device_entry in device_entries:
        if device_entry.unique_id is None:
            continue
        for suffix_map in all_suffix_maps:
            for suffix, role in suffix_map.items():
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

    mode = scene.audio_color_advance
    mode_to_effect = {
        AUDIO_COLOR_ADVANCE_ON_ONSET: MUSIC_SYNC_EFFECT_BLINK,
        AUDIO_COLOR_ADVANCE_CONTINUOUS: MUSIC_SYNC_EFFECT_WAVE,
        AUDIO_COLOR_ADVANCE_BEAT_PREDICTIVE: MUSIC_SYNC_EFFECT_BLINK,
        AUDIO_COLOR_ADVANCE_INTENSITY_BREATHING: MUSIC_SYNC_EFFECT_WAVE,
        AUDIO_COLOR_ADVANCE_ONSET_FLASH: MUSIC_SYNC_EFFECT_BLINK,
    }
    effect = mode_to_effect.get(mode, MUSIC_SYNC_EFFECT_BLINK)

    return {
        "sensitivity": sensitivity,
        "audio_effect": effect,
    }
