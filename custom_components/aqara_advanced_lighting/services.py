"""Service implementations for Aqara Advanced Lighting."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import voluptuous as vol

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers import config_validation as cv

from .const import (
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
    ATTR_EXPAND,
    ATTR_PRESET,
    ATTR_SEGMENT_COLORS,
    ATTR_SEGMENTS,
    ATTR_SPEED,
    ATTR_TURN_OFF_UNSPECIFIED,
    ATTR_TURN_ON,
    DOMAIN,
    EFFECT_PRESETS,
    MAX_BRIGHTNESS,
    MAX_EFFECT_COLORS,
    MAX_GRADIENT_COLORS,
    MAX_RGB_VALUE,
    MAX_SPEED,
    MIN_BRIGHTNESS,
    MIN_EFFECT_COLORS,
    MIN_GRADIENT_COLORS,
    MIN_RGB_VALUE,
    MIN_SPEED,
    MODEL_T1_STRIP,
    SEGMENT_PATTERN_PRESETS,
    SERVICE_CREATE_BLOCKS,
    SERVICE_CREATE_GRADIENT,
    SERVICE_SET_DYNAMIC_EFFECT,
    SERVICE_SET_SEGMENT_PATTERN,
)
from .light_capabilities import (
    get_device_capabilities,
    get_segment_count,
    supports_effect_segments,
    supports_segment_addressing,
    validate_effect_for_model,
)
from .models import DynamicEffect, EffectType, RGBColor, SegmentColor
from .mqtt_client import MQTTClient
from .segment_utils import (
    expand_segment_colors,
    generate_block_colors,
    generate_gradient_colors,
    parse_segment_range,
)
from .state_manager import StateManager

_LOGGER = logging.getLogger(__name__)

# RGB color schema (for dict format)
RGB_COLOR_SCHEMA = vol.Schema(
    {
        vol.Required("r"): vol.All(vol.Coerce(int), vol.Range(MIN_RGB_VALUE, MAX_RGB_VALUE)),
        vol.Required("g"): vol.All(vol.Coerce(int), vol.Range(MIN_RGB_VALUE, MAX_RGB_VALUE)),
        vol.Required("b"): vol.All(vol.Coerce(int), vol.Range(MIN_RGB_VALUE, MAX_RGB_VALUE)),
    }
)

# RGB color list schema (for color picker [r, g, b] format)
RGB_COLOR_LIST_SCHEMA = vol.All(
    [vol.All(vol.Coerce(int), vol.Range(MIN_RGB_VALUE, MAX_RGB_VALUE))],
    vol.Length(min=3, max=3),
)

# Segment color schema
SEGMENT_COLOR_SCHEMA = vol.Schema(
    {
        vol.Required("segment"): vol.Any(vol.Coerce(int), cv.string),
        vol.Required("color"): RGB_COLOR_SCHEMA,
    }
)

# Service schemas
SERVICE_SET_DYNAMIC_EFFECT_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        vol.Optional(ATTR_PRESET): cv.string,
        vol.Optional(ATTR_EFFECT): cv.string,
        vol.Optional(ATTR_SPEED): vol.All(
            vol.Coerce(int), vol.Range(MIN_SPEED, MAX_SPEED)
        ),
        # Individual color pickers (optional when using preset)
        vol.Optional(ATTR_COLOR_1): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_COLOR_2): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_COLOR_3): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_COLOR_4): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_COLOR_5): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_COLOR_6): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_COLOR_7): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_COLOR_8): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_SEGMENTS): cv.string,
        vol.Optional(ATTR_BRIGHTNESS): vol.All(
            vol.Coerce(int), vol.Range(min=MIN_BRIGHTNESS, max=MAX_BRIGHTNESS)
        ),
        vol.Optional(ATTR_TURN_ON, default=False): cv.boolean,
    }
)

SERVICE_SET_SEGMENT_PATTERN_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        vol.Optional(ATTR_PRESET): cv.string,
        vol.Optional(ATTR_SEGMENT_COLORS): [SEGMENT_COLOR_SCHEMA],
        vol.Optional(ATTR_BRIGHTNESS): vol.All(
            vol.Coerce(int), vol.Range(min=MIN_BRIGHTNESS, max=MAX_BRIGHTNESS)
        ),
        vol.Optional(ATTR_TURN_ON, default=False): cv.boolean,
        vol.Optional(ATTR_TURN_OFF_UNSPECIFIED, default=False): cv.boolean,
    }
)

SERVICE_CREATE_GRADIENT_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        # Individual color pickers (color_1 and color_2 are required, 3-6 are optional)
        vol.Required(ATTR_COLOR_1): RGB_COLOR_LIST_SCHEMA,
        vol.Required(ATTR_COLOR_2): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_COLOR_3): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_COLOR_4): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_COLOR_5): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_COLOR_6): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_SEGMENTS): cv.string,
        vol.Optional(ATTR_BRIGHTNESS): vol.All(
            vol.Coerce(int), vol.Range(min=MIN_BRIGHTNESS, max=MAX_BRIGHTNESS)
        ),
        vol.Optional(ATTR_TURN_ON, default=False): cv.boolean,
        vol.Optional(ATTR_TURN_OFF_UNSPECIFIED, default=False): cv.boolean,
    }
)

SERVICE_CREATE_BLOCKS_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        # Individual color pickers (color_1 is required, 2-6 are optional)
        vol.Required(ATTR_COLOR_1): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_COLOR_2): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_COLOR_3): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_COLOR_4): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_COLOR_5): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_COLOR_6): RGB_COLOR_LIST_SCHEMA,
        vol.Optional(ATTR_SEGMENTS): cv.string,
        vol.Optional(ATTR_BRIGHTNESS): vol.All(
            vol.Coerce(int), vol.Range(min=MIN_BRIGHTNESS, max=MAX_BRIGHTNESS)
        ),
        vol.Optional(ATTR_TURN_ON, default=False): cv.boolean,
        vol.Optional(ATTR_EXPAND, default=False): cv.boolean,
        vol.Optional(ATTR_TURN_OFF_UNSPECIFIED, default=False): cv.boolean,
    }
)


def _get_mqtt_client_and_state_manager(
    hass: HomeAssistant,
) -> tuple[MQTTClient, StateManager]:
    """Get MQTT client and state manager from hass.data."""
    if DOMAIN not in hass.data:
        msg = "Aqara Advanced Lighting integration not initialized"
        raise ServiceValidationError(msg)

    mqtt_client = hass.data[DOMAIN].get("mqtt_client")
    state_manager = hass.data[DOMAIN].get("state_manager")

    if not mqtt_client or not state_manager:
        msg = "Integration components not initialized"
        raise ServiceValidationError(msg)

    return mqtt_client, state_manager


def _get_actual_segment_count(
    hass: HomeAssistant, entity_id: str, model_id: str
) -> int:
    """Get actual segment count for a device, considering T1 Strip variable length.

    For T1 Strip, attempts to read the length attribute from entity state.
    Falls back to reasonable defaults if unavailable.
    """
    base_count = get_segment_count(model_id)

    # If not T1 Strip (base_count != 0), return the fixed count
    if base_count != 0:
        return base_count

    # For T1 Strip, try to get actual length from entity attributes or separate length entity
    if model_id == MODEL_T1_STRIP:
        state = hass.states.get(entity_id)
        length_meters = None

        # Try to get length from main entity attributes first
        if state and state.attributes:
            length_meters = state.attributes.get("length")

        # If not in attributes, try to find separate length entity
        if length_meters is None:
            # Method 1: Try to build entity ID from light entity name
            # e.g., light.t1_led_strip -> number.t1_led_strip_length
            base_name = entity_id.split(".", 1)[-1] if "." in entity_id else entity_id

            for domain in ["number", "sensor"]:
                length_entity_id = f"{domain}.{base_name}_length"
                length_state = hass.states.get(length_entity_id)
                if length_state and length_state.state not in ("unknown", "unavailable"):
                    try:
                        length_meters = float(length_state.state)
                        _LOGGER.debug(
                            "Found T1 Strip length from entity %s: %s meters",
                            length_entity_id,
                            length_meters
                        )
                        break
                    except (ValueError, TypeError):
                        pass

            # Method 2: If still not found, search device registry for length entity on same device
            if length_meters is None:
                from homeassistant.helpers import entity_registry as er, device_registry as dr

                entity_reg = er.async_get(hass)
                device_reg = dr.async_get(hass)

                # Get the light entity's entry to find its device
                light_entity_entry = entity_reg.async_get(entity_id)
                if light_entity_entry and light_entity_entry.device_id:
                    # Get all entities for this device
                    device_entities = er.async_entries_for_device(
                        entity_reg, light_entity_entry.device_id
                    )

                    # Look for a length entity (number or sensor with "length" in unique_id or entity_id)
                    for entity_entry in device_entities:
                        if entity_entry.domain in ["number", "sensor"]:
                            # Check if it's a length entity by looking at unique_id or entity_id
                            if (
                                "length" in entity_entry.entity_id.lower()
                                or (entity_entry.unique_id and "length" in entity_entry.unique_id.lower())
                            ):
                                length_state = hass.states.get(entity_entry.entity_id)
                                if length_state and length_state.state not in ("unknown", "unavailable"):
                                    try:
                                        length_meters = float(length_state.state)
                                        _LOGGER.debug(
                                            "Found T1 Strip length from device entity %s: %s meters",
                                            entity_entry.entity_id,
                                            length_meters
                                        )
                                        break
                                    except (ValueError, TypeError):
                                        pass

        # Calculate segment count from length if we found it
        if length_meters is not None:
            try:
                # T1 Strip has 5 segments per meter
                segment_count = int(float(length_meters) * 5)
                _LOGGER.debug(
                    "T1 Strip %s: %s meters = %s segments",
                    entity_id,
                    length_meters,
                    segment_count
                )
                return segment_count
            except (ValueError, TypeError):
                pass

        # Default to 2 meters (10 segments) if length unavailable
        _LOGGER.debug(
            "Could not determine T1 Strip length for %s (no length entity or attribute found), defaulting to 10 segments (2 meters)",
            entity_id
        )
        return 10

    # For other unknown devices, return a reasonable default
    return 20


async def _ensure_light_on(
    hass: HomeAssistant,
    mqtt_client: MQTTClient,
    entity_id: str,
    z2m_name: str,
    turn_on_if_off: bool,
) -> bool:
    """Ensure light is on if requested, checking current state first.

    Returns:
        True if light is on or was turned on, False if light is off and turn_on_if_off is False
    """
    if not turn_on_if_off:
        return True  # Don't check or turn on, proceed regardless

    # Check current light state
    state = hass.states.get(entity_id)
    if not state:
        _LOGGER.warning("Could not get state for %s", entity_id)
        return True  # Proceed anyway

    # If light is already on, no need to turn it on
    if state.state == "on":
        _LOGGER.debug("Light %s is already on", entity_id)
        return True

    # Light is off, turn it on using HA service (not direct MQTT)
    _LOGGER.info("Turning on light %s before applying effect", entity_id)
    try:
        await hass.services.async_call(
            "light",
            "turn_on",
            {"entity_id": entity_id},
            blocking=True,
        )

        # Give the light a moment to turn on
        await asyncio.sleep(0.5)

        return True
    except Exception as ex:
        _LOGGER.warning("Failed to turn on light %s: %s", entity_id, ex)
        return True  # Proceed anyway


async def async_setup_services(hass: HomeAssistant) -> None:
    """Set up services for Aqara Advanced Lighting."""
    _LOGGER.debug("Setting up Aqara Advanced Lighting services")

    async def handle_set_dynamic_effect(call: ServiceCall) -> None:
        """Handle set_dynamic_effect service call."""
        mqtt_client, state_manager = _get_mqtt_client_and_state_manager(hass)

        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]
        preset: str | None = call.data.get(ATTR_PRESET)
        segments: str | None = call.data.get(ATTR_SEGMENTS)
        turn_on: bool = call.data.get(ATTR_TURN_ON, False)

        # Store preset data for device validation
        preset_data = None
        if preset:
            if preset not in EFFECT_PRESETS:
                msg = f"Invalid preset: {preset}"
                raise ServiceValidationError(msg)

            preset_data = EFFECT_PRESETS[preset]
            effect_str: str = preset_data["effect"]
            speed: int = preset_data["speed"]
            brightness: int | None = preset_data.get("brightness")

            # Convert preset colors to expected format
            colors_data: list[dict[str, int]] = [
                {"r": color[0], "g": color[1], "b": color[2]}
                for color in preset_data["colors"]
            ]
        else:
            # Manual mode - require effect, speed, and at least color_1
            effect_str_opt: str | None = call.data.get(ATTR_EFFECT)
            speed_opt: int | None = call.data.get(ATTR_SPEED)

            if not effect_str_opt:
                msg = "Effect type is required when not using a preset"
                raise ServiceValidationError(msg)
            if speed_opt is None:
                msg = "Speed is required when not using a preset"
                raise ServiceValidationError(msg)

            effect_str = effect_str_opt
            speed = speed_opt
            brightness: int | None = call.data.get(ATTR_BRIGHTNESS)

            # Collect colors from individual color picker parameters
            colors_data: list[dict[str, int]] = []
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
                color_rgb = call.data.get(color_attr)
                if color_rgb:
                    # Color picker returns [r, g, b] list, convert to dict
                    colors_data.append({"r": color_rgb[0], "g": color_rgb[1], "b": color_rgb[2]})

            if not colors_data:
                msg = "At least one color (color_1) is required when not using a preset"
                raise ServiceValidationError(msg)

        # Convert effect string to EffectType
        try:
            effect = EffectType(effect_str)
        except ValueError as ex:
            msg = f"Invalid effect type: {effect_str}"
            raise ServiceValidationError(msg) from ex

        # Convert color data to RGBColor objects
        colors = [RGBColor(**color_data) for color_data in colors_data]

        # Process each entity
        for entity_id in entity_ids:
            # Get Z2M friendly name
            z2m_name = mqtt_client.get_z2m_friendly_name(entity_id)
            if not z2m_name:
                _LOGGER.warning(
                    "Entity %s not mapped to Z2M device, skipping", entity_id
                )
                continue

            # Get device model from Z2M device registry
            device = next(
                (
                    d
                    for d in mqtt_client.entry.runtime_data.devices.values()
                    if d.friendly_name == z2m_name
                ),
                None,
            )
            if not device:
                _LOGGER.warning(
                    "Z2M device %s not found in registry, skipping", z2m_name
                )
                continue

            # Validate preset is compatible with device type if using preset
            if preset_data and "device_types" in preset_data:
                allowed_device_types = preset_data["device_types"]
                if device.model_id not in allowed_device_types:
                    preset_name = preset_data.get("name", preset)
                    msg = f"Preset '{preset_name}' is not compatible with device {z2m_name} (model: {device.model_id})"
                    raise ServiceValidationError(msg)

            # Validate effect is supported for this model
            is_valid, error_msg = validate_effect_for_model(device.model_id, effect)
            if not is_valid:
                raise ServiceValidationError(error_msg or "Effect validation failed")

            # Check if device supports effect_segments parameter
            if segments and not supports_effect_segments(device.model_id):
                _LOGGER.warning(
                    "Device %s does not support effect_segments parameter, ignoring",
                    z2m_name,
                )
                segments = None

            # Ensure light is on if requested
            await _ensure_light_on(hass, mqtt_client, entity_id, z2m_name, turn_on)

            # Capture current state before applying effect
            state_manager.capture_state(entity_id, z2m_name)

            # Create dynamic effect
            dynamic_effect = DynamicEffect(
                effect=effect,
                effect_speed=speed,
                effect_colors=colors,
                effect_segments=segments,
            )

            # Publish to MQTT
            try:
                await mqtt_client.async_publish_dynamic_effect(z2m_name, dynamic_effect)
                state_manager.mark_effect_active(entity_id, dynamic_effect)
                _LOGGER.info("Applied effect %s to %s", effect, entity_id)
            except Exception as ex:
                msg = f"Failed to publish effect to {z2m_name}"
                raise HomeAssistantError(msg) from ex

            # Set brightness using HA service if specified
            if brightness is not None:
                try:
                    await hass.services.async_call(
                        "light",
                        "turn_on",
                        {"entity_id": entity_id, "brightness": brightness},
                        blocking=True,
                    )
                    _LOGGER.debug("Set brightness to %s for %s", brightness, entity_id)
                except Exception as ex:
                    _LOGGER.warning("Failed to set brightness for %s: %s", entity_id, ex)

    async def handle_set_segment_pattern(call: ServiceCall) -> None:
        """Handle set_segment_pattern service call."""
        mqtt_client, state_manager = _get_mqtt_client_and_state_manager(hass)

        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]
        preset: str | None = call.data.get(ATTR_PRESET)
        segment_colors_data: list[dict[str, Any]] | None = call.data.get(ATTR_SEGMENT_COLORS)
        brightness: int | None = call.data.get(ATTR_BRIGHTNESS)
        turn_on: bool = call.data.get(ATTR_TURN_ON, False)
        turn_off_unspecified: bool = call.data.get(ATTR_TURN_OFF_UNSPECIFIED, False)

        # Get preset data if preset is specified
        preset_data = None
        if preset:
            preset_data = SEGMENT_PATTERN_PRESETS.get(preset)
            if not preset_data:
                msg = f"Invalid preset: {preset}"
                raise ServiceValidationError(msg)

        # Require either preset or segment_colors
        if not preset and not segment_colors_data:
            msg = "Either preset or segment_colors must be specified"
            raise ServiceValidationError(msg)

        # Process each entity
        for entity_id in entity_ids:
            z2m_name = mqtt_client.get_z2m_friendly_name(entity_id)
            if not z2m_name:
                _LOGGER.warning(
                    "Entity %s not mapped to Z2M device, skipping", entity_id
                )
                continue

            # Get device and check if it supports segment addressing
            device = next(
                (
                    d
                    for d in mqtt_client.entry.runtime_data.devices.values()
                    if d.friendly_name == z2m_name
                ),
                None,
            )
            if not device:
                _LOGGER.warning(
                    "Z2M device %s not found in registry, skipping", z2m_name
                )
                continue

            if not supports_segment_addressing(device.model_id):
                msg = f"Device {z2m_name} does not support segment addressing"
                raise ServiceValidationError(msg)

            # Get segment count for this device
            max_segments = _get_actual_segment_count(hass, entity_id, device.model_id)

            # Validate preset is compatible with device type if using preset
            if preset_data and "device_types" in preset_data:
                allowed_device_types = preset_data["device_types"]
                if device.model_id not in allowed_device_types:
                    preset_name = preset_data.get("name", preset)
                    msg = f"Preset '{preset_name}' is not compatible with device {z2m_name} (model: {device.model_id})"
                    raise ServiceValidationError(msg)

            # Ensure light is on if requested
            await _ensure_light_on(hass, mqtt_client, entity_id, z2m_name, turn_on)

            # For T1 Strip, set brightness BEFORE sending segment pattern
            # Z2M converter reads brightness from device state, not from segment objects
            if brightness is not None and device.model_id == MODEL_T1_STRIP:
                try:
                    await hass.services.async_call(
                        "light",
                        "turn_on",
                        {"entity_id": entity_id, "brightness": brightness},
                        blocking=True,
                    )
                    _LOGGER.debug("Set brightness to %s for T1 Strip %s before segment pattern", brightness, entity_id)
                    # Small delay to ensure state is updated before segment command
                    await asyncio.sleep(0.1)
                except Exception as ex:
                    _LOGGER.warning("Failed to set brightness for %s: %s", entity_id, ex)

            # If using preset, build segment_colors from preset data
            if preset_data:
                preset_segments = preset_data["segments"]
                # Build segment_colors_data from preset
                segment_colors_data = [
                    {"segment": i + 1, "color": {"r": color[0], "g": color[1], "b": color[2]}}
                    for i, color in enumerate(preset_segments[:max_segments])
                ]

            # Expand segment ranges into individual segments
            expanded_data = expand_segment_colors(segment_colors_data, max_segments)

            # If turn_off_unspecified is enabled, add black to all unspecified segments
            if turn_off_unspecified:
                specified_segments = {sc["segment"] for sc in expanded_data}
                for seg_num in range(1, max_segments + 1):
                    if seg_num not in specified_segments:
                        expanded_data.append({"segment": seg_num, "color": {"r": 0, "g": 0, "b": 0}})

            # Convert to SegmentColor objects (no brightness - T1 Strip uses light's global brightness)
            segment_colors = [
                SegmentColor(
                    segment=sc["segment"],
                    color=RGBColor(**sc["color"]),
                )
                for sc in expanded_data
            ]

            # Capture state and publish pattern
            state_manager.capture_state(entity_id, z2m_name)

            try:
                await mqtt_client.async_publish_segment_pattern(z2m_name, segment_colors)
                _LOGGER.info("Applied segment pattern to %s", entity_id)
            except Exception as ex:
                msg = f"Failed to publish segment pattern to {z2m_name}"
                raise HomeAssistantError(msg) from ex

            # Set brightness using HA service for T1M only (T1 Strip brightness was already set above)
            if brightness is not None and device.model_id != MODEL_T1_STRIP:
                try:
                    await hass.services.async_call(
                        "light",
                        "turn_on",
                        {"entity_id": entity_id, "brightness": brightness},
                        blocking=True,
                    )
                    _LOGGER.debug("Set brightness to %s for %s", brightness, entity_id)
                except Exception as ex:
                    _LOGGER.warning("Failed to set brightness for %s: %s", entity_id, ex)

    async def handle_create_gradient(call: ServiceCall) -> None:
        """Handle create_gradient service call."""
        mqtt_client, state_manager = _get_mqtt_client_and_state_manager(hass)

        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]
        segments_str: str | None = call.data.get(ATTR_SEGMENTS)
        brightness: int | None = call.data.get(ATTR_BRIGHTNESS)
        turn_on: bool = call.data.get(ATTR_TURN_ON, False)
        turn_off_unspecified: bool = call.data.get(ATTR_TURN_OFF_UNSPECIFIED, False)

        # Collect colors from individual color picker parameters
        colors_data: list[dict[str, int]] = []
        for color_attr in [
            ATTR_COLOR_1,
            ATTR_COLOR_2,
            ATTR_COLOR_3,
            ATTR_COLOR_4,
            ATTR_COLOR_5,
            ATTR_COLOR_6,
        ]:
            color_rgb = call.data.get(color_attr)
            if color_rgb:
                # Color picker returns [r, g, b] list, convert to dict
                colors_data.append({"r": color_rgb[0], "g": color_rgb[1], "b": color_rgb[2]})

        # Process each entity
        for entity_id in entity_ids:
            z2m_name = mqtt_client.get_z2m_friendly_name(entity_id)
            if not z2m_name:
                _LOGGER.warning(
                    "Entity %s not mapped to Z2M device, skipping", entity_id
                )
                continue

            # Get device capabilities
            device = next(
                (
                    d
                    for d in mqtt_client.entry.runtime_data.devices.values()
                    if d.friendly_name == z2m_name
                ),
                None,
            )
            if not device:
                _LOGGER.warning(
                    "Z2M device %s not found in registry, skipping", z2m_name
                )
                continue

            capabilities = get_device_capabilities(device.model_id)
            if not capabilities or not capabilities.supports_segment_addressing:
                msg = f"Device {z2m_name} does not support segment addressing"
                raise ServiceValidationError(msg)

            # Ensure light is on if requested
            await _ensure_light_on(hass, mqtt_client, entity_id, z2m_name, turn_on)

            # For T1 Strip, set brightness BEFORE sending gradient
            # Z2M converter reads brightness from device state, not from segment objects
            if brightness is not None and device.model_id == MODEL_T1_STRIP:
                try:
                    await hass.services.async_call(
                        "light",
                        "turn_on",
                        {"entity_id": entity_id, "brightness": brightness},
                        blocking=True,
                    )
                    _LOGGER.debug("Set brightness to %s for T1 Strip %s before gradient", brightness, entity_id)
                    # Small delay to ensure state is updated before segment command
                    await asyncio.sleep(0.1)
                except Exception as ex:
                    _LOGGER.warning("Failed to set brightness for %s: %s", entity_id, ex)

            # Determine segments to use
            if segments_str:
                # Parse segment range
                max_segments = _get_actual_segment_count(hass, entity_id, device.model_id)
                segment_list = parse_segment_range(segments_str, max_segments)
                segment_count = len(segment_list)
            else:
                # Use all segments
                segment_count = _get_actual_segment_count(hass, entity_id, device.model_id)
                segment_list = list(range(1, segment_count + 1))

            # Generate gradient
            gradient_data = generate_gradient_colors(colors_data, segment_count)

            # Map gradient positions to actual segment numbers
            if segments_str:
                # gradient_data has segments 1, 2, 3... but we need to map to actual segment_list
                for i, item in enumerate(gradient_data):
                    if i < len(segment_list):
                        item["segment"] = segment_list[i]

            # If turn_off_unspecified is enabled, add black to all unspecified segments
            if turn_off_unspecified and segments_str:
                max_segments_total = _get_actual_segment_count(hass, entity_id, device.model_id)
                specified_segments = {sc["segment"] for sc in gradient_data}
                for seg_num in range(1, max_segments_total + 1):
                    if seg_num not in specified_segments:
                        gradient_data.append({"segment": seg_num, "color": {"r": 0, "g": 0, "b": 0}})

            # Convert to SegmentColor objects (no brightness - T1 Strip uses light's global brightness)
            segment_colors = [
                SegmentColor(
                    segment=sc["segment"],
                    color=RGBColor(**sc["color"]),
                )
                for sc in gradient_data
            ]

            # Capture state and publish gradient
            state_manager.capture_state(entity_id, z2m_name)

            try:
                await mqtt_client.async_publish_segment_pattern(z2m_name, segment_colors)
                _LOGGER.info("Applied gradient to %s", entity_id)
            except Exception as ex:
                msg = f"Failed to publish gradient to {z2m_name}"
                raise HomeAssistantError(msg) from ex

            # Set brightness using HA service for T1M only (T1 Strip brightness was already set above)
            if brightness is not None and device.model_id != MODEL_T1_STRIP:
                try:
                    await hass.services.async_call(
                        "light",
                        "turn_on",
                        {"entity_id": entity_id, "brightness": brightness},
                        blocking=True,
                    )
                    _LOGGER.debug("Set brightness to %s for %s", brightness, entity_id)
                except Exception as ex:
                    _LOGGER.warning("Failed to set brightness for %s: %s", entity_id, ex)

    async def handle_create_blocks(call: ServiceCall) -> None:
        """Handle create_blocks service call."""
        mqtt_client, state_manager = _get_mqtt_client_and_state_manager(hass)

        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]
        segments_str: str | None = call.data.get(ATTR_SEGMENTS)
        brightness: int | None = call.data.get(ATTR_BRIGHTNESS)
        turn_on: bool = call.data.get(ATTR_TURN_ON, False)
        expand: bool = call.data.get(ATTR_EXPAND, False)
        turn_off_unspecified: bool = call.data.get(ATTR_TURN_OFF_UNSPECIFIED, False)

        # Collect colors from individual color picker parameters
        colors_data: list[dict[str, int]] = []
        for color_attr in [
            ATTR_COLOR_1,
            ATTR_COLOR_2,
            ATTR_COLOR_3,
            ATTR_COLOR_4,
            ATTR_COLOR_5,
            ATTR_COLOR_6,
        ]:
            color_rgb = call.data.get(color_attr)
            if color_rgb:
                # Color picker returns [r, g, b] list, convert to dict
                colors_data.append({"r": color_rgb[0], "g": color_rgb[1], "b": color_rgb[2]})

        # Process each entity
        for entity_id in entity_ids:
            z2m_name = mqtt_client.get_z2m_friendly_name(entity_id)
            if not z2m_name:
                _LOGGER.warning(
                    "Entity %s not mapped to Z2M device, skipping", entity_id
                )
                continue

            # Get device capabilities
            device = next(
                (
                    d
                    for d in mqtt_client.entry.runtime_data.devices.values()
                    if d.friendly_name == z2m_name
                ),
                None,
            )
            if not device:
                _LOGGER.warning(
                    "Z2M device %s not found in registry, skipping", z2m_name
                )
                continue

            capabilities = get_device_capabilities(device.model_id)
            if not capabilities or not capabilities.supports_segment_addressing:
                msg = f"Device {z2m_name} does not support segment addressing"
                raise ServiceValidationError(msg)

            # Ensure light is on if requested
            await _ensure_light_on(hass, mqtt_client, entity_id, z2m_name, turn_on)

            # For T1 Strip, set brightness BEFORE sending blocks
            # Z2M converter reads brightness from device state, not from segment objects
            if brightness is not None and device.model_id == MODEL_T1_STRIP:
                try:
                    await hass.services.async_call(
                        "light",
                        "turn_on",
                        {"entity_id": entity_id, "brightness": brightness},
                        blocking=True,
                    )
                    _LOGGER.debug("Set brightness to %s for T1 Strip %s before blocks", brightness, entity_id)
                    # Small delay to ensure state is updated before segment command
                    await asyncio.sleep(0.1)
                except Exception as ex:
                    _LOGGER.warning("Failed to set brightness for %s: %s", entity_id, ex)

            # Determine segments to use
            if segments_str:
                # Parse segment range
                max_segments = _get_actual_segment_count(hass, entity_id, device.model_id)
                segment_list = parse_segment_range(segments_str, max_segments)
                segment_count = len(segment_list)
            else:
                # Use all segments
                segment_count = _get_actual_segment_count(hass, entity_id, device.model_id)
                segment_list = list(range(1, segment_count + 1))

            # Generate blocks
            blocks_data = generate_block_colors(colors_data, segment_count, expand)

            # Map block positions to actual segment numbers
            if segments_str:
                # blocks_data has segments 1, 2, 3... but we need to map to actual segment_list
                for i, item in enumerate(blocks_data):
                    if i < len(segment_list):
                        item["segment"] = segment_list[i]

            # If turn_off_unspecified is enabled, add black to all unspecified segments
            if turn_off_unspecified and segments_str:
                max_segments_total = _get_actual_segment_count(hass, entity_id, device.model_id)
                specified_segments = {sc["segment"] for sc in blocks_data}
                for seg_num in range(1, max_segments_total + 1):
                    if seg_num not in specified_segments:
                        blocks_data.append({"segment": seg_num, "color": {"r": 0, "g": 0, "b": 0}})

            # Convert to SegmentColor objects (no brightness - T1 Strip uses light's global brightness)
            segment_colors = [
                SegmentColor(
                    segment=sc["segment"],
                    color=RGBColor(**sc["color"]),
                )
                for sc in blocks_data
            ]

            # Capture state and publish blocks
            state_manager.capture_state(entity_id, z2m_name)

            try:
                await mqtt_client.async_publish_segment_pattern(z2m_name, segment_colors)
                _LOGGER.info("Applied block pattern to %s", entity_id)
            except Exception as ex:
                msg = f"Failed to publish blocks to {z2m_name}"
                raise HomeAssistantError(msg) from ex

            # Set brightness using HA service for T1M only (T1 Strip brightness was already set above)
            if brightness is not None and device.model_id != MODEL_T1_STRIP:
                try:
                    await hass.services.async_call(
                        "light",
                        "turn_on",
                        {"entity_id": entity_id, "brightness": brightness},
                        blocking=True,
                    )
                    _LOGGER.debug("Set brightness to %s for %s", brightness, entity_id)
                except Exception as ex:
                    _LOGGER.warning("Failed to set brightness for %s: %s", entity_id, ex)

    # Register services
    hass.services.async_register(
        DOMAIN,
        SERVICE_SET_DYNAMIC_EFFECT,
        handle_set_dynamic_effect,
        schema=SERVICE_SET_DYNAMIC_EFFECT_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_SET_SEGMENT_PATTERN,
        handle_set_segment_pattern,
        schema=SERVICE_SET_SEGMENT_PATTERN_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_CREATE_GRADIENT,
        handle_create_gradient,
        schema=SERVICE_CREATE_GRADIENT_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_CREATE_BLOCKS,
        handle_create_blocks,
        schema=SERVICE_CREATE_BLOCKS_SCHEMA,
    )

    _LOGGER.info("Aqara Advanced Lighting services registered")


async def async_unload_services(hass: HomeAssistant) -> None:
    """Unload services."""
    hass.services.async_remove(DOMAIN, SERVICE_SET_DYNAMIC_EFFECT)
    hass.services.async_remove(DOMAIN, SERVICE_SET_SEGMENT_PATTERN)
    hass.services.async_remove(DOMAIN, SERVICE_CREATE_GRADIENT)
    hass.services.async_remove(DOMAIN, SERVICE_CREATE_BLOCKS)

    _LOGGER.info("Aqara Advanced Lighting services unloaded")
