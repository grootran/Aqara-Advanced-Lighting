"""Music sync service handlers."""

import logging

from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError

from ..const import (
    ATTR_AUDIO_EFFECT,
    ATTR_ENABLED,
    ATTR_SENSITIVITY,
    DATA_ACTIVE_MUSIC_SYNC,
    DOMAIN,
    EVENT_ATTR_AUDIO_EFFECT,
    EVENT_ATTR_ENTITY_ID,
    EVENT_ATTR_SENSITIVITY,
    EVENT_MUSIC_SYNC_DISABLED,
    EVENT_MUSIC_SYNC_ENABLED,
    MODEL_T1_STRIP,
    MUSIC_SYNC_EFFECT_RANDOM,
    MUSIC_SYNC_SENSITIVITY_LOW,
)
from ._helpers import (
    _get_context_and_record,
    _get_instance_components_for_entity,
    _resolve_entity_ids,
    _validate_supported_entities,
)

from homeassistant.const import ATTR_ENTITY_ID

_LOGGER = logging.getLogger(__name__)

async def handle_set_music_sync(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle set_music_sync service call.

    Controls audio-reactive mode on T1 Strip devices. When enabling,
    saves current state for later restoration. When disabling, restores
    the previously saved state.
    """
    entity_ids: list[str] = call.data[ATTR_ENTITY_ID]
    enabled: bool = call.data[ATTR_ENABLED]
    sensitivity: str = call.data.get(ATTR_SENSITIVITY, MUSIC_SYNC_SENSITIVITY_LOW)
    effect: str = call.data.get(ATTR_AUDIO_EFFECT, MUSIC_SYNC_EFFECT_RANDOM)

    # Resolve groups to individual entities
    resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

    # Validate all entities are supported Aqara devices
    _validate_supported_entities(hass, resolved_entity_ids)

    for entity_id in resolved_entity_ids:
        # Get the correct instance components for this entity
        entity_backend, entity_state_manager, entry_id = (
            _get_instance_components_for_entity(hass, entity_id)
        )

        # Validate this is a T1 Strip device
        aqara_device = entity_backend.get_device_for_entity(entity_id)
        if not aqara_device:
            _LOGGER.warning(
                "Entity %s not mapped to any Aqara device, skipping",
                entity_id,
            )
            continue

        if aqara_device.model_id != MODEL_T1_STRIP:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="music_sync_t1_strip_only",
                translation_placeholders={
                    "device": aqara_device.name,
                    "model": aqara_device.model_id,
                },
            )

        instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})

        if enabled:
            # Capture state before any changes, but preserve the existing
            # stored state if an effect is active (it was captured when the
            # effect started and is more accurate than the current effect state)
            has_existing_state = entity_state_manager.has_stored_state(entity_id)
            device_state = entity_state_manager.get_device_state(entity_id)
            effect_was_active = device_state and device_state.effect_active

            if not has_existing_state:
                entity_state_manager.capture_state(entity_id, aqara_device.name)

            # Stop any active effect on this entity
            if effect_was_active:
                _LOGGER.debug(
                    "Stopping active effect on %s before enabling music sync",
                    entity_id,
                )
                try:
                    await entity_backend.async_stop_effect(entity_id)
                except Exception:
                    _LOGGER.exception("Failed to stop effect on %s", entity_id)
                entity_state_manager.mark_effect_inactive(entity_id)

            # Send music sync command to device
            await entity_backend.async_send_music_sync(
                entity_id, True, sensitivity, effect
            )

            # Track active music sync
            active_music_sync = instance_data.setdefault(DATA_ACTIVE_MUSIC_SYNC, {})
            active_music_sync[entity_id] = {
                "sensitivity": sensitivity,
                "effect": effect,
            }

            hass.bus.async_fire(
                EVENT_MUSIC_SYNC_ENABLED,
                {
                    EVENT_ATTR_ENTITY_ID: entity_id,
                    EVENT_ATTR_SENSITIVITY: sensitivity,
                    EVENT_ATTR_AUDIO_EFFECT: effect,
                },
            )

            _LOGGER.info(
                "Enabled music sync on %s: effect=%s, sensitivity=%s",
                entity_id,
                effect,
                sensitivity,
            )
        else:
            # Disable music sync
            await entity_backend.async_stop_music_sync(entity_id)

            # Remove from active tracking
            active_music_sync = instance_data.get(DATA_ACTIVE_MUSIC_SYNC, {})
            active_music_sync.pop(entity_id, None)

            # Restore previous state
            await entity_state_manager.async_restore_entity_state(
                entity_id,
                blocking=True,
                context=_get_context_and_record(hass, entity_id),
            )
            entity_state_manager.clear_state(entity_id)

            hass.bus.async_fire(
                EVENT_MUSIC_SYNC_DISABLED,
                {EVENT_ATTR_ENTITY_ID: entity_id},
            )

            _LOGGER.info("Disabled music sync on %s", entity_id)
