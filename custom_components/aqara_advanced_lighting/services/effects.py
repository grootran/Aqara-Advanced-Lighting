"""Effect service handlers for Aqara Advanced Lighting."""

import asyncio
import logging
from typing import Any

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError

from ..const import (
    ATTR_AUDIO_ENTITY,
    ATTR_AUDIO_SENSITIVITY,
    ATTR_AUDIO_SILENCE_BEHAVIOR,
    ATTR_AUDIO_SPEED_MAX,
    ATTR_AUDIO_SPEED_MIN,
    ATTR_AUDIO_SPEED_MODE,
    ATTR_BRIGHTNESS,
    ATTR_COLOR_1,
    ATTR_COLOR_2,
    ATTR_COLOR_3,
    ATTR_COLOR_4,
    ATTR_COLOR_5,
    ATTR_COLOR_6,
    ATTR_COLOR_7,
    ATTR_COLOR_8,
    ATTR_EFFECT,
    ATTR_PRESET,
    ATTR_RESTORE_STATE,
    ATTR_SEGMENTS,
    ATTR_SPEED,
    ATTR_SYNC,
    ATTR_TURN_ON,
    AUDIO_EFFECT_MODE_COMBINED,
    AUDIO_EFFECT_MODE_TEMPO,
    AUDIO_EFFECT_MODE_VOLUME,
    DATA_ACTIVE_MUSIC_SYNC,
    DATA_ENTITY_CONTROLLER,
    DATA_USER_PREFERENCES_STORE,
    DEFAULT_AUDIO_SENSITIVITY,
    DEFAULT_AUDIO_SILENCE_BEHAVIOR,
    DOMAIN,
    EVENT_ATTR_EFFECT_TYPE,
    EVENT_ATTR_ENTITY_ID,
    EVENT_ATTR_PRESET,
    EVENT_EFFECT_ACTIVATED,
    EVENT_EFFECT_STOPPED,
    PRESET_TYPE_EFFECT,
    T2_RGB_MODELS,
    brightness_percent_to_device,
)
from ..light_capabilities import (
    supports_effect_segments,
    validate_effect_for_model,
)
from ..models import (
    AudioEffectConfig,
    DynamicEffect,
    EffectType,
    RGBColor,
)
from ..preset_store import get_preset_store
from ..presets import EFFECT_PRESETS
from ..state_manager import StateManager

from ._helpers import (
    _ensure_light_on,
    _get_context_and_record,
    _get_instance_components_for_entity,
    _get_zones_for_device,
    _normalize_color_to_rgb,
    _resolve_entity_ids,
    _validate_supported_entities,
)

_LOGGER = logging.getLogger(__name__)


def _resolve_preset_audio_entity(
    preset_data: dict[str, Any],
    call_audio_entity: str | None,
    hass_data: dict[str, Any],
    user_id: str,
) -> str | None:
    """Resolve the audio entity for a built-in audio-reactive effect preset.

    Precedence: call override → user preference default → None.
    Returns None if the preset has no audio_speed_mode (not audio-reactive).
    Uses the same entity-resolution approach as dynamic_scene (different signature:
    takes raw hass_data and user_id to resolve prefs internally).
    """
    if "audio_speed_mode" not in preset_data:
        return None

    if call_audio_entity:
        return call_audio_entity

    prefs_store = hass_data.get(DATA_USER_PREFERENCES_STORE)
    if prefs_store:
        prefs = prefs_store.get_preferences(user_id)
        return prefs.get("audio_override_entity") or None

    return None


async def handle_set_dynamic_effect(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle set_dynamic_effect service call."""
    entity_ids: list[str] = call.data[ATTR_ENTITY_ID]
    sync: bool = call.data.get(ATTR_SYNC, True)

    # Resolve groups to individual entities
    resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

    # Validate all entities are supported Aqara devices
    _validate_supported_entities(hass, resolved_entity_ids)

    preset: str | None = call.data.get(ATTR_PRESET)
    segments: str | None = call.data.get(ATTR_SEGMENTS)
    turn_on: bool = call.data.get(ATTR_TURN_ON, False)

    # Store preset data for device validation
    preset_data = None
    is_user_preset = False
    if preset:
        # Check user presets first
        preset_store = get_preset_store(hass)
        user_preset = None
        if preset_store:
            user_preset = preset_store.get_preset_by_name(
                PRESET_TYPE_EFFECT, preset
            )

        if user_preset:
            # Use user preset
            is_user_preset = True

            # Validate required preset fields
            try:
                effect_str: str = user_preset["effect"]
                speed: int = user_preset["effect_speed"]
                colors_data: list[dict[str, Any]] = user_preset["effect_colors"]
            except KeyError as ex:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="user_preset_missing_field",
                    translation_placeholders={"preset": preset, "field": str(ex)},
                ) from ex

            # Validate colors list is not empty
            if not colors_data:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="user_preset_no_colors",
                    translation_placeholders={"preset": preset},
                )

            # Use slider brightness if provided, otherwise use preset brightness
            brightness_percent: int | None = call.data.get(ATTR_BRIGHTNESS)
            brightness: int | None
            if brightness_percent is not None:
                brightness = brightness_percent_to_device(brightness_percent)
            else:
                preset_brightness = user_preset.get("effect_brightness")
                brightness = (
                    brightness_percent_to_device(preset_brightness)
                    if preset_brightness is not None
                    else None
                )

            # User presets may specify segments
            if user_preset.get("effect_segments"):
                segments = user_preset["effect_segments"]

            _LOGGER.debug(
                "Using user preset '%s': effect=%s, speed=%d, colors=%d, brightness=%s",
                preset,
                effect_str,
                speed,
                len(colors_data),
                brightness,
            )
        elif preset in EFFECT_PRESETS:
            # Use built-in preset
            preset_data = EFFECT_PRESETS[preset]
            effect_str = preset_data["effect"]
            speed = preset_data["speed"]

            # Use slider brightness if provided, otherwise use preset brightness
            brightness_percent = call.data.get(ATTR_BRIGHTNESS)
            if brightness_percent is not None:
                brightness = brightness_percent_to_device(brightness_percent)
            else:
                brightness = preset_data.get("brightness")

            # Convert preset colors to expected format
            colors_data = [
                {"r": color[0], "g": color[1], "b": color[2]}
                for color in preset_data["colors"]
            ]
        else:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="invalid_preset",
                translation_placeholders={"preset": preset},
            )
    else:
        # Manual mode - require effect, speed, and at least color_1
        effect_str_opt: str | None = call.data.get(ATTR_EFFECT)
        speed_opt: int | None = call.data.get(ATTR_SPEED)

        if not effect_str_opt:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="effect_required",
            )
        if speed_opt is None:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="speed_required",
            )

        effect_str = effect_str_opt
        speed = speed_opt
        brightness_percent: int | None = call.data.get(ATTR_BRIGHTNESS)
        # Convert brightness percentage to device value (1-255)
        brightness = (
            brightness_percent_to_device(brightness_percent)
            if brightness_percent is not None
            else None
        )

        # Collect colors from individual color picker parameters
        # Supports both RGB and XY color formats
        colors: list[RGBColor] = []
        for color_attr in [
            ATTR_COLOR_1,
            ATTR_COLOR_2,
            ATTR_COLOR_3,
            ATTR_COLOR_4,
            ATTR_COLOR_5,
            ATTR_COLOR_6,
            ATTR_COLOR_7,
            ATTR_COLOR_8,
        ]:
            color_data = call.data.get(color_attr)
            if color_data:
                # Convert to RGBColor (handles XY, RGB dict, and RGB list)
                colors.append(_normalize_color_to_rgb(color_data))

        if not colors:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="color_required",
            )

    # Convert colors_data to colors for preset path
    # (Manual path already has colors as list of RGBColor)
    if preset:
        colors = [_normalize_color_to_rgb(cd) for cd in colors_data]

    # Convert effect string to EffectType
    try:
        effect = EffectType(effect_str)
    except ValueError as ex:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="invalid_effect_type",
            translation_placeholders={"effect": effect_str},
        ) from ex

    # Colors are already RGBColor objects from _normalize_color_to_rgb

    # Build audio config if audio_entity is provided
    audio_config: AudioEffectConfig | None = None
    audio_entity = call.data.get(ATTR_AUDIO_ENTITY)

    if audio_entity is None and is_user_preset and user_preset.get("audio_config"):
        # Load from preset
        audio_config = AudioEffectConfig.from_dict(user_preset["audio_config"])
        audio_entity = audio_config.audio_entity
    elif preset_data and "audio_speed_mode" in preset_data and audio_entity is None:
        # Built-in audio-reactive preset with no explicit audio_entity:
        # resolve entity from user prefs
        user_id = call.context.user_id or "default"
        resolved_entity = _resolve_preset_audio_entity(
            preset_data,
            audio_entity,  # from call — may be None
            hass.data.get(DOMAIN, {}),
            user_id,
        )
        if resolved_entity:
            audio_config = AudioEffectConfig(
                audio_entity=resolved_entity,
                audio_sensitivity=preset_data.get("audio_sensitivity", DEFAULT_AUDIO_SENSITIVITY),
                audio_silence_behavior=preset_data.get("audio_silence_behavior", DEFAULT_AUDIO_SILENCE_BEHAVIOR),
                audio_speed_mode=preset_data.get("audio_speed_mode"),
                audio_speed_min=preset_data.get("audio_speed_min", 1),
                audio_speed_max=preset_data.get("audio_speed_max", 100),
            )
    elif audio_entity is not None:
        # Build from service call params, using preset data as defaults when a
        # built-in preset is specified (frontend may only send audio_entity
        # without the preset's audio params).
        raw_speed = call.data.get(ATTR_AUDIO_SPEED_MODE)
        speed_mode = raw_speed if raw_speed else None

        # When a built-in preset is active, use its audio params as defaults
        pd = preset_data if preset_data and "audio_speed_mode" in preset_data else None

        # Default speed to "volume" if not explicitly provided
        if speed_mode is None:
            if pd:
                speed_mode = pd.get("audio_speed_mode")
            if speed_mode is None:
                speed_mode = "volume"

        audio_config = AudioEffectConfig(
            audio_entity=audio_entity,
            audio_sensitivity=call.data.get(ATTR_AUDIO_SENSITIVITY, pd.get("audio_sensitivity", 50) if pd else 50),
            audio_silence_behavior=call.data.get(ATTR_AUDIO_SILENCE_BEHAVIOR, pd.get("audio_silence_behavior", "decay_min") if pd else "decay_min"),
            audio_speed_mode=speed_mode,
            audio_speed_min=call.data.get(ATTR_AUDIO_SPEED_MIN, pd.get("audio_speed_min", 1) if pd else 1),
            audio_speed_max=call.data.get(ATTR_AUDIO_SPEED_MAX, pd.get("audio_speed_max", 100) if pd else 100),
        )

    # Prepare effects for all entities, grouped by instance for multi-Z2M support
    # Structure: {entry_id: {"backend": client, "state_manager": mgr, "entities": [...]}}
    instance_groups: dict[str, dict] = {}

    # First pass: validate all entities and collect turn_on data
    validated_entities: list[
        tuple
    ] = []  # (entity_id, backend, aqara_device, entry_id, state_manager, entity_segments)

    for entity_id in resolved_entity_ids:
        # Get the correct instance components for this entity
        entity_backend, entity_state_manager, entry_id = (
            _get_instance_components_for_entity(hass, entity_id)
        )

        # Get device info from the backend
        aqara_device = entity_backend.get_device_for_entity(entity_id)
        if not aqara_device:
            _LOGGER.warning(
                "Entity %s not mapped to any Aqara device, skipping", entity_id
            )
            continue

        # Validate preset is compatible with device type if using preset
        if preset_data and "device_types" in preset_data:
            allowed_device_types = preset_data["device_types"]
            if aqara_device.model_id not in allowed_device_types:
                preset_name = preset_data.get("name", preset)
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="preset_not_compatible",
                    translation_placeholders={
                        "preset": preset_name,
                        "device": aqara_device.name,
                        "model": aqara_device.model_id,
                    },
                )

        # Validate effect is supported for this model
        is_valid, error_msg = validate_effect_for_model(
            aqara_device.model_id, effect
        )
        if not is_valid:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="effect_not_supported",
                translation_placeholders={
                    "effect": effect_str,
                    "device": aqara_device.name,
                    "reason": error_msg or "",
                },
            )

        # Check if device supports effect_segments parameter
        entity_segments = segments
        if entity_segments and not supports_effect_segments(aqara_device.model_id):
            _LOGGER.warning(
                "Device %s does not support effect_segments parameter, ignoring",
                aqara_device.name,
            )
            entity_segments = None

        # Resolve zone names in effect_segments
        if entity_segments:
            device_zones = _get_zones_for_device(hass, aqara_device.identifier)
            if device_zones and entity_segments.strip().lower() in device_zones:
                entity_segments = device_zones[entity_segments.strip().lower()]
                _LOGGER.debug(
                    "Resolved zone '%s' to '%s' for effect_segments",
                    segments,
                    entity_segments,
                )

        validated_entities.append(
            (
                entity_id,
                entity_backend,
                aqara_device,
                entry_id,
                entity_state_manager,
                entity_segments,
            )
        )

    # Validate T2 exclusion for audio-reactive effects
    if audio_config is not None:
        for entity_id, _, aqara_device, _, _, _ in validated_entities:
            if aqara_device.model_id in T2_RGB_MODELS:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="audio_effect_t2_not_supported",
                    translation_placeholders={
                        "device": aqara_device.name,
                    },
                )

    # Second pass: process each validated entity
    for (
        entity_id,
        entity_backend,
        aqara_device,
        entry_id,
        entity_state_manager,
        entity_segments,
    ) in validated_entities:
        segments = entity_segments  # Use per-entity segments value

        # Stop all conflicting continuous actions (sequences, scenes)
        instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
        entity_controller = hass.data[DOMAIN].get(DATA_ENTITY_CONTROLLER)
        if entity_controller:
            await entity_controller.stop_all_for_entity(entity_id)

        # Stop music sync if active on this entity
        active_music_sync = instance_data.get(DATA_ACTIVE_MUSIC_SYNC, {})
        if entity_id in active_music_sync:
            _LOGGER.debug(
                "Stopping music sync on %s before applying effect",
                entity_id,
            )
            try:
                await entity_backend.async_stop_music_sync(entity_id)
            except Exception:
                _LOGGER.exception("Failed to stop music sync on %s", entity_id)
            active_music_sync.pop(entity_id, None)

        # Clear local DeviceState audio references before capture_state replaces it.
        # Cross-entity conflicts are handled by the registry (see audio engine creation below).
        existing_state = entity_state_manager.get_device_state(entity_id)
        if existing_state and getattr(existing_state, "audio_engine", None):
            existing_state.audio_engine = None
            existing_state.audio_modulator = None

        # Capture current state before applying effect
        entity_state_manager.capture_state(entity_id, aqara_device.name)

        # Create dynamic effect
        dynamic_effect = DynamicEffect(
            effect=effect,
            effect_speed=speed,
            effect_colors=colors,
            effect_segments=segments,
        )

        # Group entities by instance for batch publishing
        if entry_id not in instance_groups:
            instance_groups[entry_id] = {
                "backend": entity_backend,
                "state_manager": entity_state_manager,
                "entities": [],
            }
        instance_groups[entry_id]["entities"].append((entity_id, dynamic_effect))

    # Send effects to all devices, grouped by instance
    all_entities_published: list[tuple[str, DynamicEffect, StateManager]] = []

    for entry_id, group_data in instance_groups.items():
        group_backend = group_data["backend"]
        group_state_manager = group_data["state_manager"]
        group_entities = group_data["entities"]

        if sync and len(group_entities) > 1:
            # Synchronized mode - send to all devices in this instance in parallel
            _LOGGER.debug(
                "Sending effects to %d devices in instance %s (synchronized)",
                len(group_entities),
                entry_id,
            )
            await group_backend.async_send_batch_effects(
                [(eid, eff) for eid, eff in group_entities],
            )
        else:
            # Non-synchronized or single device - send sequentially
            for eid, dynamic_effect in group_entities:
                try:
                    await group_backend.async_send_effect(eid, dynamic_effect)
                except Exception as ex:
                    _LOGGER.warning("Failed to send effect to %s: %s", eid, ex)
                    continue

        # Add to combined list for marking effects active
        for entity_data in group_entities:
            all_entities_published.append((*entity_data, group_state_manager))

    # Turn on lights after effect writes so the device has colors
    # configured before powering on, avoiding a brief flash of wrong colors
    if turn_on and validated_entities:
        turn_on_tasks = [
            _ensure_light_on(hass, entity_id, True)
            for entity_id, _, _, _, _, _ in validated_entities
        ]
        if turn_on_tasks:
            await asyncio.gather(*turn_on_tasks, return_exceptions=True)

    # Mark effects as active and fire events
    for entity_id, dynamic_effect, entity_state_mgr in all_entities_published:
        entity_state_mgr.mark_effect_active(entity_id, dynamic_effect, preset)
        _LOGGER.info("Applied effect %s to %s", effect, entity_id)

        # Fire effect activated event
        hass.bus.async_fire(
            EVENT_EFFECT_ACTIVATED,
            {
                EVENT_ATTR_ENTITY_ID: entity_id,
                EVENT_ATTR_EFFECT_TYPE: effect_str,
                EVENT_ATTR_PRESET: preset,
            },
        )

    # Set brightness using HA service if specified (in parallel for all entities)
    if brightness is not None:
        brightness_tasks = []
        for entity_id, _, _ in all_entities_published:
            brightness_tasks.append(
                hass.services.async_call(
                    "light",
                    "turn_on",
                    {"entity_id": entity_id, "brightness": brightness},
                    blocking=True,
                    context=_get_context_and_record(hass, entity_id),
                )
            )

        # Execute brightness changes in parallel
        if brightness_tasks:
            results = await asyncio.gather(
                *brightness_tasks, return_exceptions=True
            )
            for idx, result in enumerate(results):
                if isinstance(result, Exception):
                    entity_id = all_entities_published[idx][0]
                    _LOGGER.warning(
                        "Failed to set brightness for %s: %s", entity_id, result
                    )

    # Start audio-reactive modulation if configured
    if audio_config is not None:
        from ..audio_effect_modulator import AudioEffectModulator
        from ..audio_engine import AudioEngine, AudioEngineConfig

        # Determine subscription needs based on speed mode
        needs_energy = audio_config.audio_speed_mode in (
            AUDIO_EFFECT_MODE_VOLUME, AUDIO_EFFECT_MODE_COMBINED,
        )
        needs_bpm = audio_config.audio_speed_mode in (
            AUDIO_EFFECT_MODE_TEMPO, AUDIO_EFFECT_MODE_COMBINED,
        )

        engine_config = AudioEngineConfig(
            audio_entity=audio_config.audio_entity,
            consumer_type="effect",
            sensitivity=audio_config.audio_sensitivity,
            subscribe_onset=False,
            subscribe_energy=needs_energy,
            subscribe_bpm=needs_bpm,
            subscribe_silence=True,
        )

        # Build speed write function that dispatches to correct backend
        # Both MQTT and ZHA backends accept entity_id and resolve internally
        async def write_speed(entity_id: str, speed_val: int) -> None:
            backend, _, _ = _get_instance_components_for_entity(hass, entity_id)
            await backend.async_write_effect_speed(entity_id, speed_val)

        effect_entity_ids = [eid for eid, _, _ in all_entities_published]
        modulator = AudioEffectModulator(
            hass=hass,
            entity_ids=effect_entity_ids,
            audio_config=audio_config,
            backend_write_speed=write_speed,
        )

        # Stop any existing audio engines using the same sensor
        # (prevents orphaned engines when different lights share a sensor)
        from ..const import DATA_AUDIO_ENGINE_REGISTRY
        registry = hass.data.get(DOMAIN, {}).get(DATA_AUDIO_ENGINE_REGISTRY)
        if registry:
            await registry.stop_engines_for_sensor(
                audio_config.audio_entity, "effect"
            )

        engine = AudioEngine(hass, engine_config, modulator, registry=registry)
        await modulator.start(engine)
        await engine.start()

        # Store modulator reference for cleanup in stop_effect
        for eid in effect_entity_ids:
            for pub_eid, _, mgr in all_entities_published:
                if pub_eid == eid:
                    state = mgr.get_device_state(eid)
                    if state:
                        state.audio_modulator = modulator
                        state.audio_engine = engine
                    break

async def handle_stop_effect(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle stop_effect service call."""
    entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

    # Resolve groups to individual entities
    resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

    # Validate all entities are supported Aqara devices
    _validate_supported_entities(hass, resolved_entity_ids)

    restore_state: bool = call.data.get(ATTR_RESTORE_STATE, True)

    # Process each entity
    for entity_id in resolved_entity_ids:
        # Get the correct instance components for this entity
        entity_backend, entity_state_manager, entry_id = (
            _get_instance_components_for_entity(hass, entity_id)
        )

        # Verify entity is mapped in this backend
        aqara_device = entity_backend.get_device_for_entity(entity_id)
        if not aqara_device:
            _LOGGER.warning(
                "Entity %s not mapped to any Aqara device, skipping", entity_id
            )
            continue

        # Stop audio modulator if active
        device_state = entity_state_manager.get_device_state(entity_id)
        if device_state and hasattr(device_state, "audio_engine") and device_state.audio_engine:
            stopped_engine = device_state.audio_engine
            stopped_modulator = device_state.audio_modulator
            await stopped_engine.stop()
            await stopped_modulator.stop()
            # Clear reference from ALL entities sharing this engine
            for eid, state in entity_state_manager.iter_device_states():
                if state.audio_engine is stopped_engine:
                    state.audio_engine = None
                    state.audio_modulator = None

        # Stop the effect by restoring previous state using HA light service
        try:
            ctx = _get_context_and_record(hass, entity_id)
            restored = False

            if restore_state:
                restored = await entity_state_manager.async_restore_entity_state(
                    entity_id,
                    blocking=True,
                    context=ctx,
                )

            if restored:
                _LOGGER.info(
                    "Stopped effect and restored previous state for %s", entity_id
                )
            else:
                # No saved state - stop effect with a default warm white RGB color
                await hass.services.async_call(
                    "light",
                    "turn_on",
                    {"entity_id": entity_id, "rgb_color": [255, 200, 150]},
                    blocking=True,
                    context=ctx,
                )
                _LOGGER.info(
                    "Stopped effect for %s (set to default warm white)", entity_id
                )

            # Mark effect as inactive (returns the preset that was active)
            stopped_preset = entity_state_manager.mark_effect_inactive(entity_id)

            # Fire effect stopped event with preset info
            hass.bus.async_fire(
                EVENT_EFFECT_STOPPED,
                {
                    EVENT_ATTR_ENTITY_ID: entity_id,
                    EVENT_ATTR_PRESET: stopped_preset,
                },
            )

            # Resume preset-paused solar/schedule CCT if nothing else is running
            entity_controller = hass.data[DOMAIN].get(DATA_ENTITY_CONTROLLER)
            if entity_controller:
                await entity_controller.check_and_resume_solar(entity_id)
        except Exception as ex:
            _LOGGER.warning("Failed to stop effect for %s: %s", entity_id, ex)
            continue
