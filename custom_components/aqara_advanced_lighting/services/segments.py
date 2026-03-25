"""Segment service handlers for Aqara Advanced Lighting."""

import asyncio
import logging
from typing import Any

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError

from ..const import (
    ATTR_BRIGHTNESS,
    ATTR_COLOR_1,
    ATTR_COLOR_2,
    ATTR_COLOR_3,
    ATTR_COLOR_4,
    ATTR_COLOR_5,
    ATTR_COLOR_6,
    ATTR_EXPAND,
    ATTR_PRESET,
    ATTR_SEGMENT_COLORS,
    ATTR_SEGMENTS,
    ATTR_TURN_OFF_UNSPECIFIED,
    ATTR_TURN_ON,
    DATA_DYNAMIC_SCENE_MANAGER,
    DATA_ENTITY_CONTROLLER,
    DOMAIN,
    EVENT_ATTR_EFFECT_TYPE,
    EVENT_ATTR_ENTITY_ID,
    EVENT_ATTR_PRESET,
    EVENT_EFFECT_ACTIVATED,
    MODEL_T1_STRIP,
    PRESET_TYPE_SEGMENT_PATTERN,
    brightness_percent_to_device,
)
from ..light_capabilities import (
    get_device_capabilities,
    supports_segment_addressing,
)
from ..models import (
    RGBColor,
    SegmentColor,
)
from ..preset_store import get_preset_store
from ..presets import SEGMENT_PATTERN_PRESETS
from ..segment_utils import (
    expand_segment_colors,
    generate_block_colors,
    generate_gradient_colors,
    parse_segment_range,
    scale_segment_pattern,
)

from ._helpers import (
    _ensure_light_on,
    _get_actual_segment_count,
    _get_context_and_record,
    _get_instance_components_for_entity,
    _get_zones_for_device,
    _normalize_color_to_rgb,
    _resolve_entity_ids,
    _validate_supported_entities,
)

_LOGGER = logging.getLogger(__name__)

async def handle_set_segment_pattern(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle set_segment_pattern service call."""
    entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

    # Resolve groups to individual entities
    resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

    # Validate all entities are supported Aqara devices
    _validate_supported_entities(hass, resolved_entity_ids)

    preset: str | None = call.data.get(ATTR_PRESET)
    segment_colors_data_input: list[dict[str, Any]] | None = call.data.get(
        ATTR_SEGMENT_COLORS
    )
    brightness_percent: int | None = call.data.get(ATTR_BRIGHTNESS)
    # Convert brightness percentage to device value (1-255)
    brightness = (
        brightness_percent_to_device(brightness_percent)
        if brightness_percent is not None
        else None
    )
    turn_on: bool = call.data.get(ATTR_TURN_ON, False)
    turn_off_unspecified: bool = call.data.get(ATTR_TURN_OFF_UNSPECIFIED, False)

    # Get preset data if preset is specified
    preset_data = None
    user_preset = None
    if preset:
        # Check user presets first
        preset_store = get_preset_store(hass)
        if preset_store:
            user_preset = preset_store.get_preset_by_name(
                PRESET_TYPE_SEGMENT_PATTERN, preset
            )

        if not user_preset:
            # Fall back to built-in presets
            preset_data = SEGMENT_PATTERN_PRESETS.get(preset)

        if not user_preset and not preset_data:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="invalid_preset",
                translation_placeholders={"preset": preset},
            )

    # Require either preset or segment_colors
    if not preset and not segment_colors_data_input:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="segment_colors_required",
        )

    # Process each entity
    for entity_id in resolved_entity_ids:
        # Get the correct instance components for this entity
        entity_backend, entity_state_manager, entry_id = (
            _get_instance_components_for_entity(hass, entity_id)
        )

        aqara_device = entity_backend.get_device_for_entity(entity_id)
        if not aqara_device:
            _LOGGER.warning(
                "Entity %s not mapped to any Aqara device, skipping", entity_id
            )
            continue

        if not supports_segment_addressing(aqara_device.model_id):
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="segment_addressing_not_supported",
                translation_placeholders={"device": aqara_device.name},
            )

        # Get segment count for this device
        max_segments = _get_actual_segment_count(
            hass, entity_id, aqara_device.model_id
        )

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

        # Stop all conflicting continuous actions (sequences, scenes)
        entity_controller = hass.data[DOMAIN].get(DATA_ENTITY_CONTROLLER)
        if entity_controller:
            await entity_controller.stop_all_for_entity(entity_id)

        # Capture state before turning on so off state is preserved for restore
        entity_state_manager.capture_state(entity_id, aqara_device.name)

        # Ensure light is on if requested (after capture)
        await _ensure_light_on(hass, entity_id, turn_on)

        # For T1 Strip, set brightness BEFORE sending segment pattern
        # Z2M converter reads brightness from device state, not from segment objects
        if brightness is not None and aqara_device.model_id == MODEL_T1_STRIP:
            try:
                await hass.services.async_call(
                    "light",
                    "turn_on",
                    {"entity_id": entity_id, "brightness": brightness},
                    blocking=True,
                    context=_get_context_and_record(hass, entity_id),
                )
                _LOGGER.debug(
                    "Set brightness to %s for T1 Strip %s before segment pattern",
                    brightness,
                    entity_id,
                )
                # Brief delay for Z2M state propagation (blocking=True confirms dispatch)
                await asyncio.sleep(0.05)
            except Exception as ex:
                _LOGGER.warning(
                    "Failed to set brightness for %s: %s", entity_id, ex
                )

        # If using preset, build segment_colors from preset data
        # Use local variable for segment data to allow modification per-entity
        segment_colors_data: list[dict[str, Any]] = []
        if user_preset:
            # User presets store segments as list of dicts already
            try:
                segments_list = user_preset["segments"]
            except KeyError as ex:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="user_preset_missing_field",
                    translation_placeholders={"preset": preset, "field": str(ex)},
                ) from ex

            if not segments_list:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="user_preset_no_segments",
                    translation_placeholders={"preset": preset},
                )

            segment_colors_data = segments_list[:max_segments]
            _LOGGER.debug(
                "Using user segment pattern preset '%s' with %d segments",
                preset,
                len(segment_colors_data),
            )
        elif preset_data:
            preset_segments = preset_data["segments"]
            # Scale preset to device segment count (nearest-neighbor resampling)
            scaled_segments = scale_segment_pattern(preset_segments, max_segments)
            segment_colors_data = [
                {
                    "segment": i + 1,
                    "color": {"r": color[0], "g": color[1], "b": color[2]},
                }
                for i, color in enumerate(scaled_segments)
            ]
        elif segment_colors_data_input:
            segment_colors_data = segment_colors_data_input

        # Expand segment ranges into individual segments
        device_zones = _get_zones_for_device(hass, aqara_device.identifier)
        expanded_data = expand_segment_colors(
            segment_colors_data, max_segments, zones=device_zones
        )

        # If turn_off_unspecified is enabled, add black to all unspecified segments
        if turn_off_unspecified:
            specified_segments = {sc["segment"] for sc in expanded_data}
            for seg_num in range(1, max_segments + 1):
                if seg_num not in specified_segments:
                    expanded_data.append(
                        {"segment": seg_num, "color": {"r": 0, "g": 0, "b": 0}}
                    )

        # Convert to SegmentColor objects (no brightness - T1 Strip uses light's global brightness)
        segment_colors = [
            SegmentColor(
                segment=sc["segment"],
                color=RGBColor(**sc["color"]),
            )
            for sc in expanded_data
        ]

        try:
            await entity_backend.async_send_segment_pattern(
                entity_id, segment_colors
            )
            _LOGGER.info("Applied segment pattern to %s", entity_id)

            # Mark effect active and fire event
            entity_state_manager.mark_effect_active(entity_id, None, preset)

            hass.bus.async_fire(
                EVENT_EFFECT_ACTIVATED,
                {
                    EVENT_ATTR_ENTITY_ID: entity_id,
                    EVENT_ATTR_EFFECT_TYPE: "segment_pattern",
                    EVENT_ATTR_PRESET: preset,
                },
            )
        except Exception as ex:
            raise HomeAssistantError(
                translation_domain=DOMAIN,
                translation_key="publish_pattern_failed",
                translation_placeholders={"device": aqara_device.name},
            ) from ex

        # Set brightness using HA service for T1M only (T1 Strip brightness was already set above)
        if brightness is not None and aqara_device.model_id != MODEL_T1_STRIP:
            try:
                await hass.services.async_call(
                    "light",
                    "turn_on",
                    {"entity_id": entity_id, "brightness": brightness},
                    blocking=True,
                    context=_get_context_and_record(hass, entity_id),
                )
                _LOGGER.debug("Set brightness to %s for %s", brightness, entity_id)
            except Exception as ex:
                _LOGGER.warning(
                    "Failed to set brightness for %s: %s", entity_id, ex
                )

async def handle_create_gradient(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle create_gradient service call."""
    entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

    # Resolve groups to individual entities
    resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

    # Validate all entities are supported Aqara devices
    _validate_supported_entities(hass, resolved_entity_ids)

    segments_str: str | None = call.data.get(ATTR_SEGMENTS)
    brightness_percent: int | None = call.data.get(ATTR_BRIGHTNESS)
    # Convert brightness percentage to device value (1-255)
    brightness = (
        brightness_percent_to_device(brightness_percent)
        if brightness_percent is not None
        else None
    )
    turn_on: bool = call.data.get(ATTR_TURN_ON, False)
    turn_off_unspecified: bool = call.data.get(ATTR_TURN_OFF_UNSPECIFIED, False)

    # Collect colors from individual color picker parameters
    # Supports both RGB and XY color formats
    colors_rgb: list[RGBColor] = []
    for color_attr in [
        ATTR_COLOR_1,
        ATTR_COLOR_2,
        ATTR_COLOR_3,
        ATTR_COLOR_4,
        ATTR_COLOR_5,
        ATTR_COLOR_6,
    ]:
        color_data = call.data.get(color_attr)
        if color_data:
            # Convert to RGBColor (handles XY, RGB dict, and RGB list)
            colors_rgb.append(_normalize_color_to_rgb(color_data))

    # Process each entity
    for entity_id in resolved_entity_ids:
        # Get the correct instance components for this entity
        entity_backend, entity_state_manager, entry_id = (
            _get_instance_components_for_entity(hass, entity_id)
        )

        aqara_device = entity_backend.get_device_for_entity(entity_id)
        if not aqara_device:
            _LOGGER.warning(
                "Entity %s not mapped to any Aqara device, skipping", entity_id
            )
            continue

        capabilities = get_device_capabilities(aqara_device.model_id)
        if not capabilities or not capabilities.supports_segment_addressing:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="segment_addressing_not_supported",
                translation_placeholders={"device": aqara_device.name},
            )

        # Detach from dynamic scene if running (one-time gradient overrides scene)
        instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
        dsm = instance_data.get(DATA_DYNAMIC_SCENE_MANAGER)
        if dsm and dsm.is_scene_running(entity_id):
            _LOGGER.debug(
                "Detaching %s from dynamic scene before applying gradient",
                entity_id,
            )
            dsm.detach_entity(entity_id)

        # Ensure light is on if requested
        await _ensure_light_on(hass, entity_id, turn_on)

        # For T1 Strip, set brightness BEFORE sending gradient
        # Z2M converter reads brightness from device state, not from segment objects
        if brightness is not None and aqara_device.model_id == MODEL_T1_STRIP:
            try:
                await hass.services.async_call(
                    "light",
                    "turn_on",
                    {"entity_id": entity_id, "brightness": brightness},
                    blocking=True,
                    context=_get_context_and_record(hass, entity_id),
                )
                _LOGGER.debug(
                    "Set brightness to %s for T1 Strip %s before gradient",
                    brightness,
                    entity_id,
                )
                # Brief delay for Z2M state propagation (blocking=True confirms dispatch)
                await asyncio.sleep(0.05)
            except Exception as ex:
                _LOGGER.warning(
                    "Failed to set brightness for %s: %s", entity_id, ex
                )

        # Determine segments to use
        device_zones = _get_zones_for_device(hass, aqara_device.identifier)
        if segments_str:
            # Parse segment range
            max_segments = _get_actual_segment_count(
                hass, entity_id, aqara_device.model_id
            )
            segment_list = parse_segment_range(
                segments_str, max_segments, zones=device_zones
            )
            segment_count = len(segment_list)
        else:
            # Use all segments
            segment_count = _get_actual_segment_count(
                hass, entity_id, aqara_device.model_id
            )
            segment_list = list(range(1, segment_count + 1))

        # Generate gradient (convert RGBColor objects to dicts)
        gradient_data = generate_gradient_colors(
            [c.to_dict() for c in colors_rgb], segment_count
        )

        # Map gradient positions to actual segment numbers
        if segments_str:
            # gradient_data has segments 1, 2, 3... but we need to map to actual segment_list
            for i, item in enumerate(gradient_data):
                if i < len(segment_list):
                    item["segment"] = segment_list[i]

        # If turn_off_unspecified is enabled, add black to all unspecified segments
        if turn_off_unspecified and segments_str:
            max_segments_total = _get_actual_segment_count(
                hass, entity_id, aqara_device.model_id
            )
            specified_segments = {sc["segment"] for sc in gradient_data}
            for seg_num in range(1, max_segments_total + 1):
                if seg_num not in specified_segments:
                    gradient_data.append(
                        {"segment": seg_num, "color": {"r": 0, "g": 0, "b": 0}}
                    )

        # Convert to SegmentColor objects (no brightness - T1 Strip uses light's global brightness)
        segment_colors = [
            SegmentColor(
                segment=sc["segment"],
                color=RGBColor(**sc["color"]),
            )
            for sc in gradient_data
        ]

        # Capture state and publish gradient
        entity_state_manager.capture_state(entity_id, aqara_device.name)

        try:
            await entity_backend.async_send_segment_pattern(
                entity_id, segment_colors
            )
            _LOGGER.info("Applied gradient to %s", entity_id)

            # Mark effect active and fire event
            entity_state_manager.mark_effect_active(entity_id, None, None)

            hass.bus.async_fire(
                EVENT_EFFECT_ACTIVATED,
                {
                    EVENT_ATTR_ENTITY_ID: entity_id,
                    EVENT_ATTR_EFFECT_TYPE: "gradient",
                    EVENT_ATTR_PRESET: None,
                },
            )
        except Exception as ex:
            raise HomeAssistantError(
                translation_domain=DOMAIN,
                translation_key="publish_gradient_failed",
                translation_placeholders={"device": aqara_device.name},
            ) from ex

        # Set brightness using HA service for T1M only (T1 Strip brightness was already set above)
        if brightness is not None and aqara_device.model_id != MODEL_T1_STRIP:
            try:
                await hass.services.async_call(
                    "light",
                    "turn_on",
                    {"entity_id": entity_id, "brightness": brightness},
                    blocking=True,
                    context=_get_context_and_record(hass, entity_id),
                )
                _LOGGER.debug("Set brightness to %s for %s", brightness, entity_id)
            except Exception as ex:
                _LOGGER.warning(
                    "Failed to set brightness for %s: %s", entity_id, ex
                )

async def handle_create_blocks(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle create_blocks service call."""
    entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

    # Resolve groups to individual entities
    resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

    # Validate all entities are supported Aqara devices
    _validate_supported_entities(hass, resolved_entity_ids)

    segments_str: str | None = call.data.get(ATTR_SEGMENTS)
    brightness_percent: int | None = call.data.get(ATTR_BRIGHTNESS)
    # Convert brightness percentage to device value (1-255)
    brightness = (
        brightness_percent_to_device(brightness_percent)
        if brightness_percent is not None
        else None
    )
    turn_on: bool = call.data.get(ATTR_TURN_ON, False)
    expand: bool = call.data.get(ATTR_EXPAND, False)
    turn_off_unspecified: bool = call.data.get(ATTR_TURN_OFF_UNSPECIFIED, False)

    # Collect colors from individual color picker parameters
    # Supports both RGB and XY color formats
    colors_rgb: list[RGBColor] = []
    for color_attr in [
        ATTR_COLOR_1,
        ATTR_COLOR_2,
        ATTR_COLOR_3,
        ATTR_COLOR_4,
        ATTR_COLOR_5,
        ATTR_COLOR_6,
    ]:
        color_data = call.data.get(color_attr)
        if color_data:
            # Convert to RGBColor (handles XY, RGB dict, and RGB list)
            colors_rgb.append(_normalize_color_to_rgb(color_data))

    # Process each entity
    for entity_id in resolved_entity_ids:
        # Get the correct instance components for this entity
        entity_backend, entity_state_manager, entry_id = (
            _get_instance_components_for_entity(hass, entity_id)
        )

        aqara_device = entity_backend.get_device_for_entity(entity_id)
        if not aqara_device:
            _LOGGER.warning(
                "Entity %s not mapped to any Aqara device, skipping", entity_id
            )
            continue

        capabilities = get_device_capabilities(aqara_device.model_id)
        if not capabilities or not capabilities.supports_segment_addressing:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="segment_addressing_not_supported",
                translation_placeholders={"device": aqara_device.name},
            )

        # Detach from dynamic scene if running (one-time blocks overrides scene)
        instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
        dsm = instance_data.get(DATA_DYNAMIC_SCENE_MANAGER)
        if dsm and dsm.is_scene_running(entity_id):
            _LOGGER.debug(
                "Detaching %s from dynamic scene before applying blocks", entity_id
            )
            dsm.detach_entity(entity_id)

        # Ensure light is on if requested
        await _ensure_light_on(hass, entity_id, turn_on)

        # For T1 Strip, set brightness BEFORE sending blocks
        # Z2M converter reads brightness from device state, not from segment objects
        if brightness is not None and aqara_device.model_id == MODEL_T1_STRIP:
            try:
                await hass.services.async_call(
                    "light",
                    "turn_on",
                    {"entity_id": entity_id, "brightness": brightness},
                    blocking=True,
                    context=_get_context_and_record(hass, entity_id),
                )
                _LOGGER.debug(
                    "Set brightness to %s for T1 Strip %s before blocks",
                    brightness,
                    entity_id,
                )
                # Brief delay for Z2M state propagation (blocking=True confirms dispatch)
                await asyncio.sleep(0.05)
            except Exception as ex:
                _LOGGER.warning(
                    "Failed to set brightness for %s: %s", entity_id, ex
                )

        # Determine segments to use
        device_zones = _get_zones_for_device(hass, aqara_device.identifier)
        if segments_str:
            # Parse segment range
            max_segments = _get_actual_segment_count(
                hass, entity_id, aqara_device.model_id
            )
            segment_list = parse_segment_range(
                segments_str, max_segments, zones=device_zones
            )
            segment_count = len(segment_list)
        else:
            # Use all segments
            segment_count = _get_actual_segment_count(
                hass, entity_id, aqara_device.model_id
            )
            segment_list = list(range(1, segment_count + 1))

        # Generate blocks (convert RGBColor objects to dicts)
        blocks_data = generate_block_colors(
            [c.to_dict() for c in colors_rgb], segment_count, expand
        )

        # Map block positions to actual segment numbers
        if segments_str:
            # blocks_data has segments 1, 2, 3... but we need to map to actual segment_list
            for i, item in enumerate(blocks_data):
                if i < len(segment_list):
                    item["segment"] = segment_list[i]

        # If turn_off_unspecified is enabled, add black to all unspecified segments
        if turn_off_unspecified and segments_str:
            max_segments_total = _get_actual_segment_count(
                hass, entity_id, aqara_device.model_id
            )
            specified_segments = {sc["segment"] for sc in blocks_data}
            for seg_num in range(1, max_segments_total + 1):
                if seg_num not in specified_segments:
                    blocks_data.append(
                        {"segment": seg_num, "color": {"r": 0, "g": 0, "b": 0}}
                    )

        # Convert to SegmentColor objects (no brightness - T1 Strip uses light's global brightness)
        segment_colors = [
            SegmentColor(
                segment=sc["segment"],
                color=RGBColor(**sc["color"]),
            )
            for sc in blocks_data
        ]

        # Capture state and publish blocks
        entity_state_manager.capture_state(entity_id, aqara_device.name)

        try:
            await entity_backend.async_send_segment_pattern(
                entity_id, segment_colors
            )
            _LOGGER.info("Applied block pattern to %s", entity_id)

            # Mark effect active and fire event
            entity_state_manager.mark_effect_active(entity_id, None, None)

            hass.bus.async_fire(
                EVENT_EFFECT_ACTIVATED,
                {
                    EVENT_ATTR_ENTITY_ID: entity_id,
                    EVENT_ATTR_EFFECT_TYPE: "blocks",
                    EVENT_ATTR_PRESET: None,
                },
            )
        except Exception as ex:
            raise HomeAssistantError(
                translation_domain=DOMAIN,
                translation_key="publish_blocks_failed",
                translation_placeholders={"device": aqara_device.name},
            ) from ex

        # Set brightness using HA service for T1M only (T1 Strip brightness was already set above)
        if brightness is not None and aqara_device.model_id != MODEL_T1_STRIP:
            try:
                await hass.services.async_call(
                    "light",
                    "turn_on",
                    {"entity_id": entity_id, "brightness": brightness},
                    blocking=True,
                    context=_get_context_and_record(hass, entity_id),
                )
                _LOGGER.debug("Set brightness to %s for %s", brightness, entity_id)
            except Exception as ex:
                _LOGGER.warning(
                    "Failed to set brightness for %s: %s", entity_id, ex
                )
