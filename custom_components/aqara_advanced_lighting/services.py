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
    ACTIVATION_ALL,
    ACTIVATION_CENTER_OUT,
    ACTIVATION_EDGES_IN,
    ACTIVATION_PAIRED,
    ACTIVATION_PING_PONG,
    ACTIVATION_RANDOM,
    ACTIVATION_SEQUENTIAL_FORWARD,
    ACTIVATION_SEQUENTIAL_REVERSE,
    ATTR_BRIGHTNESS,
    ATTR_CLEAR_SEGMENTS,
    ATTR_COLOR_1,
    ATTR_COLOR_2,
    ATTR_COLOR_3,
    ATTR_COLOR_4,
    ATTR_COLOR_5,
    ATTR_COLOR_6,
    ATTR_COLOR_7,
    ATTR_COLOR_8,
    ATTR_EFFECT,
    ATTR_END_BEHAVIOR,
    ATTR_EXPAND,
    ATTR_LOOP_COUNT,
    ATTR_LOOP_MODE,
    ATTR_PRESET,
    ATTR_RESTORE_STATE,
    ATTR_SEGMENT_COLORS,
    ATTR_SEGMENTS,
    ATTR_SKIP_FIRST_IN_LOOP,
    ATTR_SPEED,
    ATTR_SYNC,
    ATTR_TURN_OFF_UNSPECIFIED,
    ATTR_TURN_ON,
    ATTR_Z2M_BASE_TOPIC,
    CCT_SEQUENCE_PRESETS,
    DATA_CCT_SEQUENCE_MANAGER,
    DATA_DYNAMIC_SCENE_MANAGER,
    DATA_ENTITY_CONTROLLER,
    DATA_PRESET_STORE,
    DATA_SEGMENT_SEQUENCE_MANAGER,
    DATA_SEGMENT_ZONE_STORE,
    DEFAULT_DYNAMIC_SCENE_HOLD_TIME,
    DEFAULT_DYNAMIC_SCENE_TRANSITION_TIME,
    DEFAULT_SCENE_BRIGHTNESS_PCT,
    DISTRIBUTION_SHUFFLE_ROTATE,
    DOMAIN,
    EFFECT_PRESETS,
    PRESET_TYPE_CCT_SEQUENCE,
    PRESET_TYPE_DYNAMIC_SCENE,
    PRESET_TYPE_EFFECT,
    PRESET_TYPE_SEGMENT_PATTERN,
    PRESET_TYPE_SEGMENT_SEQUENCE,
    END_BEHAVIOR_MAINTAIN,
    END_BEHAVIOR_TURN_OFF,
    EVENT_ATTR_EFFECT_TYPE,
    EVENT_ATTR_ENTITY_ID,
    EVENT_ATTR_PRESET,
    EVENT_EFFECT_ACTIVATED,
    EVENT_EFFECT_STOPPED,
    LOOP_MODE_CONTINUOUS,
    LOOP_MODE_COUNT,
    LOOP_MODE_ONCE,
    MAX_BRIGHTNESS_PERCENT,
    MAX_COLOR_TEMP_KELVIN,
    MAX_DURATION,
    MAX_HOLD_TIME,
    MAX_LOOP_COUNT,
    MAX_RGB_VALUE,
    MAX_SPEED,
    MAX_TRANSITION_TIME,
    MIN_BRIGHTNESS_PERCENT,
    MIN_COLOR_TEMP_KELVIN,
    MIN_DURATION,
    MIN_HOLD_TIME,
    MIN_LOOP_COUNT,
    MIN_RGB_VALUE,
    MIN_SPEED,
    MIN_TRANSITION_TIME,
    SERVICE_PAUSE_DYNAMIC_SCENE,
    SERVICE_RESUME_DYNAMIC_SCENE,
    SERVICE_START_DYNAMIC_SCENE,
    SERVICE_STOP_DYNAMIC_SCENE,
    VALID_DISTRIBUTION_MODES,
    MODEL_T1_STRIP,
    SEGMENT_MODE_BLOCKS_EXPAND,
    SEGMENT_MODE_BLOCKS_REPEAT,
    SEGMENT_MODE_GRADIENT,
    SEGMENT_PATTERN_PRESETS,
    SEGMENT_SEQUENCE_PRESETS,
    SERVICE_CREATE_BLOCKS,
    SERVICE_CREATE_GRADIENT,
    SERVICE_PAUSE_CCT_SEQUENCE,
    SERVICE_PAUSE_SEGMENT_SEQUENCE,
    SERVICE_RESUME_CCT_SEQUENCE,
    SERVICE_RESUME_ENTITY_CONTROL,
    SERVICE_RESUME_SEGMENT_SEQUENCE,
    SERVICE_SET_DYNAMIC_EFFECT,
    SERVICE_SET_SEGMENT_PATTERN,
    SERVICE_START_CCT_SEQUENCE,
    SERVICE_START_SEGMENT_SEQUENCE,
    SERVICE_STOP_CCT_SEQUENCE,
    SERVICE_STOP_EFFECT,
    SERVICE_STOP_SEGMENT_SEQUENCE,
    brightness_percent_to_device,
)
from .light_capabilities import (
    get_device_capabilities,
    get_segment_count,
    supports_effect_segments,
    supports_segment_addressing,
    validate_effect_for_model,
)
from .models import (
    CCTSequence,
    CCTSequenceStep,
    DynamicEffect,
    DynamicScene,
    DynamicSceneColor,
    EffectType,
    RGBColor,
    SegmentColor,
    SegmentSequence,
    SegmentSequenceStep,
    XYColor,
)
from .mqtt_client import MQTTClient
from .segment_utils import (
    expand_segment_colors,
    generate_block_colors,
    generate_gradient_colors,
    parse_segment_range,
    scale_segment_pattern,
)
from .state_manager import StateManager

_LOGGER = logging.getLogger(__name__)

# RGB color schema (for dict format - backward compatibility)
RGB_COLOR_SCHEMA = vol.Schema(
    {
        vol.Required("r"): vol.All(vol.Coerce(int), vol.Range(MIN_RGB_VALUE, MAX_RGB_VALUE)),
        vol.Required("g"): vol.All(vol.Coerce(int), vol.Range(MIN_RGB_VALUE, MAX_RGB_VALUE)),
        vol.Required("b"): vol.All(vol.Coerce(int), vol.Range(MIN_RGB_VALUE, MAX_RGB_VALUE)),
    }
)

# XY color schema (for CIE 1931 color space)
XY_COLOR_SCHEMA = vol.Schema(
    {
        vol.Required("x"): vol.All(vol.Coerce(float), vol.Range(min=0.0, max=1.0)),
        vol.Required("y"): vol.All(vol.Coerce(float), vol.Range(min=0.0, max=1.0)),
    }
)

# RGB color list schema (for color picker [r, g, b] format - backward compatibility)
RGB_COLOR_LIST_SCHEMA = vol.All(
    [vol.All(vol.Coerce(int), vol.Range(MIN_RGB_VALUE, MAX_RGB_VALUE))],
    vol.Length(min=3, max=3),
)

# Flexible color schema that accepts both RGB and XY formats
COLOR_SCHEMA = vol.Any(RGB_COLOR_SCHEMA, XY_COLOR_SCHEMA, RGB_COLOR_LIST_SCHEMA)

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
        # Accept RGB list [r,g,b], RGB dict {r,g,b}, or XY dict {x,y}
        vol.Optional(ATTR_COLOR_1): COLOR_SCHEMA,
        vol.Optional(ATTR_COLOR_2): COLOR_SCHEMA,
        vol.Optional(ATTR_COLOR_3): COLOR_SCHEMA,
        vol.Optional(ATTR_COLOR_4): COLOR_SCHEMA,
        vol.Optional(ATTR_COLOR_5): COLOR_SCHEMA,
        vol.Optional(ATTR_COLOR_6): COLOR_SCHEMA,
        vol.Optional(ATTR_COLOR_7): COLOR_SCHEMA,
        vol.Optional(ATTR_COLOR_8): COLOR_SCHEMA,
        vol.Optional(ATTR_SEGMENTS): cv.string,
        vol.Optional(ATTR_BRIGHTNESS): vol.All(
            vol.Coerce(int), vol.Range(min=MIN_BRIGHTNESS_PERCENT, max=MAX_BRIGHTNESS_PERCENT)
        ),
        vol.Optional(ATTR_TURN_ON, default=False): cv.boolean,
        vol.Optional(ATTR_SYNC, default=True): cv.boolean,
        vol.Optional(ATTR_Z2M_BASE_TOPIC): cv.string,
    }
)

SERVICE_STOP_EFFECT_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        vol.Optional(ATTR_RESTORE_STATE, default=True): cv.boolean,
        vol.Optional(ATTR_Z2M_BASE_TOPIC): cv.string,
    }
)

SERVICE_SET_SEGMENT_PATTERN_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        vol.Optional(ATTR_PRESET): cv.string,
        vol.Optional(ATTR_SEGMENT_COLORS): [SEGMENT_COLOR_SCHEMA],
        vol.Optional(ATTR_BRIGHTNESS): vol.All(
            vol.Coerce(int), vol.Range(min=MIN_BRIGHTNESS_PERCENT, max=MAX_BRIGHTNESS_PERCENT)
        ),
        vol.Optional(ATTR_TURN_ON, default=False): cv.boolean,
        vol.Optional(ATTR_TURN_OFF_UNSPECIFIED, default=False): cv.boolean,
        vol.Optional(ATTR_SYNC, default=True): cv.boolean,
        vol.Optional(ATTR_Z2M_BASE_TOPIC): cv.string,
    }
)

SERVICE_CREATE_GRADIENT_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        # Individual color pickers (color_1 and color_2 are required, 3-6 are optional)
        # Accept RGB list [r,g,b], RGB dict {r,g,b}, or XY dict {x,y}
        vol.Required(ATTR_COLOR_1): COLOR_SCHEMA,
        vol.Required(ATTR_COLOR_2): COLOR_SCHEMA,
        vol.Optional(ATTR_COLOR_3): COLOR_SCHEMA,
        vol.Optional(ATTR_COLOR_4): COLOR_SCHEMA,
        vol.Optional(ATTR_COLOR_5): COLOR_SCHEMA,
        vol.Optional(ATTR_COLOR_6): COLOR_SCHEMA,
        vol.Optional(ATTR_SEGMENTS): cv.string,
        vol.Optional(ATTR_BRIGHTNESS): vol.All(
            vol.Coerce(int), vol.Range(min=MIN_BRIGHTNESS_PERCENT, max=MAX_BRIGHTNESS_PERCENT)
        ),
        vol.Optional(ATTR_TURN_ON, default=False): cv.boolean,
        vol.Optional(ATTR_TURN_OFF_UNSPECIFIED, default=False): cv.boolean,
        vol.Optional(ATTR_SYNC, default=True): cv.boolean,
        vol.Optional(ATTR_Z2M_BASE_TOPIC): cv.string,
    }
)

SERVICE_CREATE_BLOCKS_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        # Individual color pickers (color_1 is required, 2-6 are optional)
        # Accept RGB list [r,g,b], RGB dict {r,g,b}, or XY dict {x,y}
        vol.Required(ATTR_COLOR_1): COLOR_SCHEMA,
        vol.Optional(ATTR_COLOR_2): COLOR_SCHEMA,
        vol.Optional(ATTR_COLOR_3): COLOR_SCHEMA,
        vol.Optional(ATTR_COLOR_4): COLOR_SCHEMA,
        vol.Optional(ATTR_COLOR_5): COLOR_SCHEMA,
        vol.Optional(ATTR_COLOR_6): COLOR_SCHEMA,
        vol.Optional(ATTR_SEGMENTS): cv.string,
        vol.Optional(ATTR_BRIGHTNESS): vol.All(
            vol.Coerce(int), vol.Range(min=MIN_BRIGHTNESS_PERCENT, max=MAX_BRIGHTNESS_PERCENT)
        ),
        vol.Optional(ATTR_TURN_ON, default=False): cv.boolean,
        vol.Optional(ATTR_EXPAND, default=False): cv.boolean,
        vol.Optional(ATTR_TURN_OFF_UNSPECIFIED, default=False): cv.boolean,
        vol.Optional(ATTR_SYNC, default=True): cv.boolean,
        vol.Optional(ATTR_Z2M_BASE_TOPIC): cv.string,
    }
)

# Build CCT sequence service schema with individual step fields
_cct_sequence_schema_dict = {
    vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
    vol.Optional(ATTR_PRESET): cv.string,  # Preset name (optional)
    vol.Optional(ATTR_TURN_ON, default=False): cv.boolean,
    vol.Optional(ATTR_SYNC, default=True): cv.boolean,
}

# Add step 1 fields (optional - required only when not using a preset)
_cct_sequence_schema_dict["step_1_color_temp"] = vol.Optional(vol.All(
    vol.Coerce(int), vol.Range(min=MIN_COLOR_TEMP_KELVIN, max=MAX_COLOR_TEMP_KELVIN)
))
_cct_sequence_schema_dict["step_1_brightness"] = vol.Optional(vol.All(
    vol.Coerce(int), vol.Range(min=MIN_BRIGHTNESS_PERCENT, max=MAX_BRIGHTNESS_PERCENT)
))
_cct_sequence_schema_dict["step_1_transition"] = vol.Optional(vol.All(
    vol.Coerce(float), vol.Range(min=MIN_TRANSITION_TIME, max=MAX_TRANSITION_TIME)
))
_cct_sequence_schema_dict["step_1_hold"] = vol.Optional(vol.All(
    vol.Coerce(float), vol.Range(min=MIN_HOLD_TIME, max=MAX_HOLD_TIME)
))

# Add steps 2-20 fields (optional)
for step_num in range(2, 21):
    _cct_sequence_schema_dict[f"step_{step_num}_color_temp"] = vol.Optional(vol.All(
        vol.Coerce(int), vol.Range(min=MIN_COLOR_TEMP_KELVIN, max=MAX_COLOR_TEMP_KELVIN)
    ))
    _cct_sequence_schema_dict[f"step_{step_num}_brightness"] = vol.Optional(vol.All(
        vol.Coerce(int), vol.Range(min=MIN_BRIGHTNESS_PERCENT, max=MAX_BRIGHTNESS_PERCENT)
    ))
    _cct_sequence_schema_dict[f"step_{step_num}_transition"] = vol.Optional(vol.All(
        vol.Coerce(float), vol.Range(min=MIN_TRANSITION_TIME, max=MAX_TRANSITION_TIME)
    ))
    _cct_sequence_schema_dict[f"step_{step_num}_hold"] = vol.Optional(vol.All(
        vol.Coerce(float), vol.Range(min=MIN_HOLD_TIME, max=MAX_HOLD_TIME)
    ))

# Add loop/end behavior fields
_cct_sequence_schema_dict[vol.Optional(ATTR_LOOP_MODE, default=LOOP_MODE_ONCE)] = vol.In(
    [LOOP_MODE_ONCE, LOOP_MODE_COUNT, LOOP_MODE_CONTINUOUS]
)
_cct_sequence_schema_dict[vol.Optional(ATTR_LOOP_COUNT)] = vol.All(
    vol.Coerce(int), vol.Range(min=MIN_LOOP_COUNT, max=MAX_LOOP_COUNT)
)
_cct_sequence_schema_dict[vol.Optional(ATTR_END_BEHAVIOR, default=END_BEHAVIOR_MAINTAIN)] = vol.In(
    [END_BEHAVIOR_MAINTAIN, END_BEHAVIOR_TURN_OFF]
)
_cct_sequence_schema_dict[vol.Optional(ATTR_Z2M_BASE_TOPIC)] = cv.string

SERVICE_START_CCT_SEQUENCE_SCHEMA = vol.Schema(_cct_sequence_schema_dict)

SERVICE_STOP_CCT_SEQUENCE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        vol.Optional(ATTR_Z2M_BASE_TOPIC): cv.string,
    }
)

SERVICE_PAUSE_CCT_SEQUENCE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        vol.Optional(ATTR_Z2M_BASE_TOPIC): cv.string,
    }
)

SERVICE_RESUME_CCT_SEQUENCE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        vol.Optional(ATTR_Z2M_BASE_TOPIC): cv.string,
    }
)

# Build segment sequence service schema with individual step fields
_segment_sequence_schema_dict = {
    vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
    vol.Optional(ATTR_PRESET): cv.string,  # Preset name (optional)
    vol.Optional(ATTR_TURN_ON, default=False): cv.boolean,
    vol.Optional(ATTR_SYNC, default=True): cv.boolean,
}

# Add step 1 fields (optional - required only when not using a preset)
_segment_sequence_schema_dict["step_1_segments"] = vol.Optional(cv.string)
_segment_sequence_schema_dict["step_1_mode"] = vol.Optional(
    vol.In([SEGMENT_MODE_BLOCKS_REPEAT, SEGMENT_MODE_BLOCKS_EXPAND, SEGMENT_MODE_GRADIENT])
)
_segment_sequence_schema_dict["step_1_color_1"] = vol.Optional(COLOR_SCHEMA)
_segment_sequence_schema_dict["step_1_color_2"] = vol.Optional(COLOR_SCHEMA)
_segment_sequence_schema_dict["step_1_color_3"] = vol.Optional(COLOR_SCHEMA)
_segment_sequence_schema_dict["step_1_color_4"] = vol.Optional(COLOR_SCHEMA)
_segment_sequence_schema_dict["step_1_color_5"] = vol.Optional(COLOR_SCHEMA)
_segment_sequence_schema_dict["step_1_color_6"] = vol.Optional(COLOR_SCHEMA)
_segment_sequence_schema_dict["step_1_segment_colors"] = vol.Optional(
    vol.All(cv.ensure_list, [vol.Schema({
        vol.Required("segment"): vol.Coerce(int),
        vol.Required("color"): RGB_COLOR_SCHEMA,
    })])
)
_segment_sequence_schema_dict["step_1_duration"] = vol.Optional(
    vol.All(vol.Coerce(float), vol.Range(min=MIN_DURATION, max=MAX_DURATION))
)
_segment_sequence_schema_dict["step_1_hold"] = vol.Optional(
    vol.All(vol.Coerce(float), vol.Range(min=MIN_HOLD_TIME, max=MAX_HOLD_TIME))
)
_segment_sequence_schema_dict["step_1_activation_pattern"] = vol.Optional(
    vol.In([
        ACTIVATION_ALL,
        ACTIVATION_SEQUENTIAL_FORWARD,
        ACTIVATION_SEQUENTIAL_REVERSE,
        ACTIVATION_RANDOM,
        ACTIVATION_PING_PONG,
        ACTIVATION_CENTER_OUT,
        ACTIVATION_EDGES_IN,
        ACTIVATION_PAIRED,
    ])
)

# Add steps 2-20 fields (optional)
for step_num in range(2, 21):
    _segment_sequence_schema_dict[f"step_{step_num}_segments"] = vol.Optional(cv.string)
    _segment_sequence_schema_dict[f"step_{step_num}_mode"] = vol.Optional(
        vol.In([SEGMENT_MODE_BLOCKS_REPEAT, SEGMENT_MODE_BLOCKS_EXPAND, SEGMENT_MODE_GRADIENT])
    )
    _segment_sequence_schema_dict[f"step_{step_num}_color_1"] = vol.Optional(COLOR_SCHEMA)
    _segment_sequence_schema_dict[f"step_{step_num}_color_2"] = vol.Optional(COLOR_SCHEMA)
    _segment_sequence_schema_dict[f"step_{step_num}_color_3"] = vol.Optional(COLOR_SCHEMA)
    _segment_sequence_schema_dict[f"step_{step_num}_color_4"] = vol.Optional(COLOR_SCHEMA)
    _segment_sequence_schema_dict[f"step_{step_num}_color_5"] = vol.Optional(COLOR_SCHEMA)
    _segment_sequence_schema_dict[f"step_{step_num}_color_6"] = vol.Optional(COLOR_SCHEMA)
    _segment_sequence_schema_dict[f"step_{step_num}_segment_colors"] = vol.Optional(
        vol.All(cv.ensure_list, [vol.Schema({
            vol.Required("segment"): vol.Coerce(int),
            vol.Required("color"): RGB_COLOR_SCHEMA,
        })])
    )
    _segment_sequence_schema_dict[f"step_{step_num}_duration"] = vol.Optional(
        vol.All(vol.Coerce(float), vol.Range(min=MIN_DURATION, max=MAX_DURATION))
    )
    _segment_sequence_schema_dict[f"step_{step_num}_hold"] = vol.Optional(
        vol.All(vol.Coerce(float), vol.Range(min=MIN_HOLD_TIME, max=MAX_HOLD_TIME))
    )
    _segment_sequence_schema_dict[f"step_{step_num}_activation_pattern"] = vol.Optional(
        vol.In([
            ACTIVATION_ALL,
            ACTIVATION_SEQUENTIAL_FORWARD,
            ACTIVATION_SEQUENTIAL_REVERSE,
            ACTIVATION_RANDOM,
            ACTIVATION_PING_PONG,
            ACTIVATION_CENTER_OUT,
            ACTIVATION_EDGES_IN,
            ACTIVATION_PAIRED,
        ])
    )

# Add loop/end behavior fields
_segment_sequence_schema_dict[vol.Optional(ATTR_LOOP_MODE, default=LOOP_MODE_ONCE)] = vol.In(
    [LOOP_MODE_ONCE, LOOP_MODE_COUNT, LOOP_MODE_CONTINUOUS]
)
_segment_sequence_schema_dict[vol.Optional(ATTR_LOOP_COUNT)] = vol.All(
    vol.Coerce(int), vol.Range(min=MIN_LOOP_COUNT, max=MAX_LOOP_COUNT)
)
_segment_sequence_schema_dict[vol.Optional(ATTR_END_BEHAVIOR, default=END_BEHAVIOR_MAINTAIN)] = vol.In(
    [END_BEHAVIOR_MAINTAIN, END_BEHAVIOR_TURN_OFF]
)
_segment_sequence_schema_dict[vol.Optional(ATTR_CLEAR_SEGMENTS, default=False)] = cv.boolean
_segment_sequence_schema_dict[vol.Optional(ATTR_SKIP_FIRST_IN_LOOP, default=False)] = cv.boolean
_segment_sequence_schema_dict[vol.Optional(ATTR_Z2M_BASE_TOPIC)] = cv.string

SERVICE_START_SEGMENT_SEQUENCE_SCHEMA = vol.Schema(_segment_sequence_schema_dict)

SERVICE_STOP_SEGMENT_SEQUENCE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        vol.Optional(ATTR_Z2M_BASE_TOPIC): cv.string,
    }
)

SERVICE_PAUSE_SEGMENT_SEQUENCE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        vol.Optional(ATTR_Z2M_BASE_TOPIC): cv.string,
    }
)

SERVICE_RESUME_SEGMENT_SEQUENCE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        vol.Optional(ATTR_Z2M_BASE_TOPIC): cv.string,
    }
)

# Dynamic scene color schema with optional brightness percentage
DYNAMIC_SCENE_COLOR_SCHEMA = vol.Schema(
    {
        vol.Required("x"): vol.All(vol.Coerce(float), vol.Range(min=0.0, max=1.0)),
        vol.Required("y"): vol.All(vol.Coerce(float), vol.Range(min=0.0, max=1.0)),
        vol.Optional("brightness_pct", default=100): vol.All(
            vol.Coerce(int), vol.Range(min=1, max=100)
        ),
    }
)

# Dynamic scene service schemas
SERVICE_START_DYNAMIC_SCENE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
        vol.Exclusive(ATTR_PRESET, "scene_source"): cv.string,
        vol.Exclusive("colors", "scene_source"): vol.All(
            cv.ensure_list,
            [DYNAMIC_SCENE_COLOR_SCHEMA],
        ),
        vol.Optional(
            "transition_time", default=DEFAULT_DYNAMIC_SCENE_TRANSITION_TIME
        ): vol.Coerce(float),
        vol.Optional(
            "hold_time", default=DEFAULT_DYNAMIC_SCENE_HOLD_TIME
        ): vol.Coerce(float),
        vol.Optional(
            "distribution_mode", default=DISTRIBUTION_SHUFFLE_ROTATE
        ): vol.In(VALID_DISTRIBUTION_MODES),
        vol.Optional("offset_delay", default=0.0): vol.Coerce(float),
        vol.Optional("random_order", default=False): cv.boolean,
        vol.Optional(
            "scene_brightness_pct", default=DEFAULT_SCENE_BRIGHTNESS_PCT
        ): vol.All(vol.Coerce(int), vol.Range(min=1, max=100)),
        vol.Optional(ATTR_LOOP_MODE, default="continuous"): vol.In(
            ["once", "count", "continuous"]
        ),
        vol.Optional(ATTR_LOOP_COUNT): vol.All(
            vol.Coerce(int), vol.Range(min=1, max=100)
        ),
        vol.Optional(ATTR_END_BEHAVIOR, default="maintain"): vol.In(
            ["maintain", "restore"]
        ),
        vol.Optional("scene_name"): cv.string,
        vol.Optional("static", default=False): cv.boolean,
    }
)

SERVICE_STOP_DYNAMIC_SCENE_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_ENTITY_ID): cv.entity_ids,
    }
)

SERVICE_PAUSE_DYNAMIC_SCENE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
    }
)

SERVICE_RESUME_DYNAMIC_SCENE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
    }
)


def _normalize_color_to_rgb(color_data: dict[str, Any] | list[int]) -> RGBColor:
    """Convert color input (XY, RGB dict, or RGB list) to RGBColor.

    Accepts three formats for backward compatibility and XY support:
    - XY format: {"x": 0.5, "y": 0.5}
    - RGB dict: {"r": 255, "g": 0, "b": 0}
    - RGB list: [255, 0, 0]

    Args:
        color_data: Color in any supported format

    Returns:
        RGBColor object suitable for MQTT

    Raises:
        ServiceValidationError: If color format is invalid
    """
    if isinstance(color_data, list):
        # RGB list format [r, g, b]
        if len(color_data) == 3:
            return RGBColor(r=color_data[0], g=color_data[1], b=color_data[2])
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="rgb_list_invalid_length",
            translation_placeholders={"count": str(len(color_data))},
        )

    if isinstance(color_data, dict):
        # Check for XY format
        if "x" in color_data and "y" in color_data:
            # XY format - convert to RGB
            xy_color = XYColor.from_dict(color_data)
            return xy_color.to_rgb()

        # Check for RGB dict format
        if "r" in color_data and "g" in color_data and "b" in color_data:
            # RGB dict format - use directly
            return RGBColor.from_dict(color_data)

        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="color_dict_invalid_format",
        )

    raise ServiceValidationError(
        translation_domain=DOMAIN,
        translation_key="color_invalid_type",
        translation_placeholders={"type": str(type(color_data).__name__)},
    )


def _get_instance_for_entity(
    hass: HomeAssistant, entity_id: str
) -> tuple[str | None, dict | None]:
    """Get the config entry ID and instance data for an entity.

    Looks up the entity in all instances to find which one owns it.

    Args:
        hass: Home Assistant instance
        entity_id: Entity ID to look up

    Returns:
        Tuple of (entry_id, instance_data) or (None, None) if not found
    """
    if DOMAIN not in hass.data:
        return None, None

    # First try the entity routing map for fast lookup
    entity_routing = hass.data[DOMAIN].get("entity_routing", {})
    if entity_id in entity_routing:
        entry_id = entity_routing[entity_id]
        instance_data = hass.data[DOMAIN].get("entries", {}).get(entry_id)
        if instance_data:
            return entry_id, instance_data

    # Fall back to searching all instances
    entries = hass.data[DOMAIN].get("entries", {})
    for entry_id, instance_data in entries.items():
        mqtt_client = instance_data.get("mqtt_client")
        if mqtt_client and mqtt_client.get_z2m_friendly_name(entity_id):
            # Found it - update the routing map for faster future lookups
            entity_routing[entity_id] = entry_id
            return entry_id, instance_data

    return None, None


def _get_any_instance(hass: HomeAssistant) -> tuple[str | None, dict | None]:
    """Get any available instance (for backward compatibility).

    Returns the first available instance or (None, None) if none exist.
    """
    if DOMAIN not in hass.data:
        return None, None

    entries = hass.data[DOMAIN].get("entries", {})
    if entries:
        entry_id = next(iter(entries))
        return entry_id, entries[entry_id]

    return None, None


def _get_mqtt_client_for_entity(
    hass: HomeAssistant, entity_id: str
) -> MQTTClient | None:
    """Get the MQTT client for an entity.

    Args:
        hass: Home Assistant instance
        entity_id: Entity ID to look up

    Returns:
        MQTTClient for the instance that owns this entity, or None
    """
    _, instance_data = _get_instance_for_entity(hass, entity_id)
    if instance_data:
        return instance_data.get("mqtt_client")
    return None


def _get_mqtt_client_and_state_manager(
    hass: HomeAssistant,
) -> tuple[MQTTClient, StateManager]:
    """Get any MQTT client and state manager from hass.data.

    This is used for validation that doesn't require entity-specific routing.
    For entity-specific operations, use _get_instance_for_entity instead.
    """
    if DOMAIN not in hass.data:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="integration_not_initialized",
        )

    # Get any instance (for backward compatibility and general validation)
    _, instance_data = _get_any_instance(hass)
    if not instance_data:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="components_not_initialized",
        )

    mqtt_client = instance_data.get("mqtt_client")
    state_manager = instance_data.get("state_manager")

    if not mqtt_client or not state_manager:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="components_not_initialized",
        )

    return mqtt_client, state_manager


def _get_instance_components_for_entity(
    hass: HomeAssistant, entity_id: str
) -> tuple[MQTTClient, StateManager, str]:
    """Get MQTT client, state manager, and entry_id for a specific entity.

    Args:
        hass: Home Assistant instance
        entity_id: Entity ID to look up

    Returns:
        Tuple of (mqtt_client, state_manager, entry_id)

    Raises:
        ServiceValidationError: If entity not found in any instance
    """
    entry_id, instance_data = _get_instance_for_entity(hass, entity_id)

    if not entry_id or not instance_data:
        # List all configured instances for helpful error message
        entries = hass.data.get(DOMAIN, {}).get("entries", {})
        instance_topics = []
        for eid, idata in entries.items():
            mc = idata.get("mqtt_client")
            if mc:
                topic = mc.entry.runtime_data.z2m_base_topic
                instance_topics.append(topic)

        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="entity_not_found_in_any_instance",
            translation_placeholders={
                "entity_id": entity_id,
                "instances": ", ".join(instance_topics) if instance_topics else "none",
            },
        )

    mqtt_client = instance_data.get("mqtt_client")
    state_manager = instance_data.get("state_manager")

    if not mqtt_client or not state_manager:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="components_not_initialized",
        )

    return mqtt_client, state_manager, entry_id


def _get_preset_store(hass: HomeAssistant):
    """Get the preset store from hass.data.

    Returns:
        PresetStore instance or None if not initialized.
    """
    if DOMAIN not in hass.data:
        _LOGGER.error(
            "Integration domain not found in hass.data - integration may not be set up"
        )
        return None
    preset_store = hass.data[DOMAIN].get(DATA_PRESET_STORE)
    if preset_store is None:
        _LOGGER.error(
            "Preset store not found in hass.data[%s] - this should not happen. "
            "Available keys: %s",
            DOMAIN,
            list(hass.data[DOMAIN].keys()),
        )
    return preset_store


def _get_zones_for_device(
    hass: HomeAssistant, ieee_address: str
) -> dict[str, str] | None:
    """Get segment zones for a device, formatted for parse_segment_range().

    Args:
        hass: Home Assistant instance.
        ieee_address: Device IEEE address.

    Returns:
        Dict of lowercased zone name to segment range string, or None.
    """
    if DOMAIN not in hass.data:
        return None
    zone_store = hass.data[DOMAIN].get(DATA_SEGMENT_ZONE_STORE)
    if not zone_store:
        return None
    zones = zone_store.get_zones_for_resolution(ieee_address)
    return zones if zones else None


def _resolve_entity_ids(hass: HomeAssistant, entity_ids: list[str]) -> list[str]:
    """Resolve entity IDs, expanding groups to individual lights.

    Args:
        hass: Home Assistant instance
        entity_ids: List of entity IDs (may include groups)

    Returns:
        List of individual light entity IDs
    """
    resolved = []
    for entity_id in entity_ids:
        state = hass.states.get(entity_id)
        if state and state.domain == "light":
            # Check if this is a group by looking for entity_id attribute
            if group_entities := state.attributes.get("entity_id"):
                # This is a light group - add all member entities
                resolved.extend(group_entities)
                _LOGGER.debug(
                    "Resolved group %s to %d entities: %s",
                    entity_id,
                    len(group_entities),
                    group_entities,
                )
            else:
                # Single light entity
                resolved.append(entity_id)
        else:
            # Entity not found or not a light - add anyway for validation
            resolved.append(entity_id)

    # Remove duplicates while preserving order
    seen = set()
    unique_resolved = []
    for entity_id in resolved:
        if entity_id not in seen:
            seen.add(entity_id)
            unique_resolved.append(entity_id)

    return unique_resolved


def _validate_supported_entities(
    hass: HomeAssistant, entity_ids: list[str]
) -> None:
    """Validate that all entities are supported Aqara devices.

    Checks across all configured Z2M instances to find each entity.

    Args:
        hass: Home Assistant instance
        entity_ids: List of entity IDs to validate

    Raises:
        ServiceValidationError: If any entity is not supported
    """
    unsupported_entities = []

    for entity_id in entity_ids:
        # Try to find entity in any instance
        mqtt_client = _get_mqtt_client_for_entity(hass, entity_id)
        if mqtt_client:
            is_supported, reason = mqtt_client.is_supported_entity(entity_id)
            if not is_supported:
                unsupported_entities.append({"entity_id": entity_id, "reason": reason})
        else:
            # Entity not found in any instance
            unsupported_entities.append(
                {"entity_id": entity_id, "reason": "not_found_in_any_instance"}
            )

    if unsupported_entities:
        # Build detailed error message
        entity_list = ", ".join([e["entity_id"] for e in unsupported_entities])

        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="unsupported_entities",
            translation_placeholders={"entity_list": entity_list},
        )


def _is_aqara_entity(hass: HomeAssistant, entity_id: str) -> bool:
    """Check if an entity is a supported Aqara device.

    Args:
        hass: Home Assistant instance
        entity_id: Entity ID to check

    Returns:
        True if entity is a supported Aqara device
    """
    mqtt_client = _get_mqtt_client_for_entity(hass, entity_id)
    if not mqtt_client:
        return False
    is_supported, _ = mqtt_client.is_supported_entity(entity_id)
    return is_supported


def _is_valid_light_entity(hass: HomeAssistant, entity_id: str) -> bool:
    """Check if an entity is a valid light entity in Home Assistant.

    Args:
        hass: Home Assistant instance
        entity_id: Entity ID to check

    Returns:
        True if entity exists and is a light
    """
    state = hass.states.get(entity_id)
    return state is not None and state.domain == "light"


_RGB_COLOR_MODES = {"xy", "hs", "rgb", "rgbw", "rgbww"}


def _has_rgb_color_mode(hass: HomeAssistant, entity_id: str) -> bool:
    """Check if a light entity supports RGB color modes.

    Args:
        hass: Home Assistant instance
        entity_id: Entity ID to check

    Returns:
        True if entity supports at least one RGB color mode
    """
    state = hass.states.get(entity_id)
    if state is None:
        return False
    color_modes = state.attributes.get("supported_color_modes")
    if not isinstance(color_modes, list):
        return False
    return bool(_RGB_COLOR_MODES.intersection(color_modes))


def _get_any_cct_manager(
    hass: HomeAssistant,
) -> tuple[Any, StateManager] | None:
    """Get any available CCT sequence manager and state manager.

    Used for generic (non-Aqara) lights that don't belong to a specific
    Z2M instance. CCT sequences use HA service calls so any manager works.

    Returns:
        Tuple of (cct_manager, state_manager) or None if unavailable
    """
    if DOMAIN not in hass.data:
        return None
    for instance_data in hass.data[DOMAIN].get("entries", {}).values():
        cct_manager = instance_data.get(DATA_CCT_SEQUENCE_MANAGER)
        state_manager = instance_data.get("state_manager")
        if cct_manager and state_manager:
            return cct_manager, state_manager
    return None


def _find_cct_manager_for_entity(
    hass: HomeAssistant, entity_id: str
) -> Any | None:
    """Find the CCT manager that has an active sequence for an entity.

    Searches all instances including generic routing. Used by stop/pause/resume
    handlers where the entity may be running on any manager.

    Args:
        hass: Home Assistant instance
        entity_id: Entity ID to find manager for

    Returns:
        CCT sequence manager or None
    """
    if DOMAIN not in hass.data:
        return None
    for instance_data in hass.data[DOMAIN].get("entries", {}).values():
        cct_manager = instance_data.get(DATA_CCT_SEQUENCE_MANAGER)
        if cct_manager and cct_manager.is_sequence_running(entity_id):
            return cct_manager
    return None


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
        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]
        sync: bool = call.data.get(ATTR_SYNC, True)
        z2m_base_topic: str | None = call.data.get(ATTR_Z2M_BASE_TOPIC)

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
            preset_store = _get_preset_store(hass)
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
                    preset, effect_str, speed, len(colors_data), brightness
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

        # Prepare effects for all entities, grouped by instance for multi-Z2M support
        # Structure: {entry_id: {"mqtt_client": client, "state_manager": mgr, "entities": [...]}}
        instance_groups: dict[str, dict] = {}

        # First pass: validate all entities and collect turn_on data
        validated_entities: list[tuple] = []  # (entity_id, mqtt_client, z2m_name, device, entry_id, state_manager, entity_segments)

        for entity_id in resolved_entity_ids:
            # Get the correct instance components for this entity
            entity_mqtt_client, entity_state_manager, entry_id = (
                _get_instance_components_for_entity(hass, entity_id)
            )

            # Get Z2M friendly name from the correct instance
            z2m_name = entity_mqtt_client.get_z2m_friendly_name(entity_id)
            if not z2m_name:
                _LOGGER.warning(
                    "Entity %s not mapped to Z2M device, skipping", entity_id
                )
                continue

            # Get device model from the correct instance's Z2M device registry
            device = entity_mqtt_client.entry.runtime_data.devices_by_name.get(
                z2m_name
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
                    raise ServiceValidationError(
                        translation_domain=DOMAIN,
                        translation_key="preset_not_compatible",
                        translation_placeholders={
                            "preset": preset_name,
                            "device": z2m_name,
                            "model": device.model_id,
                        },
                    )

            # Validate effect is supported for this model
            is_valid, error_msg = validate_effect_for_model(device.model_id, effect)
            if not is_valid:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="effect_not_supported",
                    translation_placeholders={
                        "effect": effect_str,
                        "device": z2m_name,
                        "reason": error_msg or "",
                    },
                )

            # Check if device supports effect_segments parameter
            entity_segments = segments
            if entity_segments and not supports_effect_segments(device.model_id):
                _LOGGER.warning(
                    "Device %s does not support effect_segments parameter, ignoring",
                    z2m_name,
                )
                entity_segments = None

            # Resolve zone names in effect_segments (Z2M doesn't know our zones)
            if entity_segments:
                device_zones = _get_zones_for_device(hass, device.ieee_address)
                if device_zones and entity_segments.strip().lower() in device_zones:
                    entity_segments = device_zones[entity_segments.strip().lower()]
                    _LOGGER.debug(
                        "Resolved zone '%s' to '%s' for effect_segments",
                        segments,
                        entity_segments,
                    )

            validated_entities.append(
                (entity_id, entity_mqtt_client, z2m_name, device, entry_id, entity_state_manager, entity_segments)
            )

        # Turn on all lights in parallel if requested
        if turn_on and validated_entities:
            turn_on_tasks = [
                _ensure_light_on(hass, mqtt_client, entity_id, z2m_name, True)
                for entity_id, mqtt_client, z2m_name, *_ in validated_entities
            ]
            await asyncio.gather(*turn_on_tasks, return_exceptions=True)

        # Second pass: process each validated entity
        for entity_id, entity_mqtt_client, z2m_name, device, entry_id, entity_state_manager, entity_segments in validated_entities:
            segments = entity_segments  # Use per-entity segments value

            # Get sequence managers from the correct instance
            instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
            cct_manager = instance_data.get(DATA_CCT_SEQUENCE_MANAGER)
            segment_manager = instance_data.get(DATA_SEGMENT_SEQUENCE_MANAGER)

            paused_cct = False
            paused_segment = False

            # Pause CCT sequence if running
            if cct_manager and cct_manager.is_sequence_running(entity_id):
                _LOGGER.debug("Pausing CCT sequence on %s before applying effect", entity_id)
                cct_manager.pause_sequence(entity_id)
                paused_cct = True

            # Pause segment sequence if running
            if segment_manager and segment_manager.is_sequence_running(entity_id):
                _LOGGER.debug("Pausing segment sequence on %s before applying effect", entity_id)
                segment_manager.pause_sequence(entity_id)
                paused_segment = True

            # Detach from dynamic scene if running (one-time effect overrides scene)
            dsm = instance_data.get(DATA_DYNAMIC_SCENE_MANAGER)
            if dsm and dsm.is_scene_running(entity_id):
                _LOGGER.debug("Detaching %s from dynamic scene before applying effect", entity_id)
                dsm.detach_entity(entity_id)

            # Capture current state before applying effect
            entity_state_manager.capture_state(entity_id, z2m_name)

            # Mark which sequences were paused so we can resume them later
            device_state = entity_state_manager.get_device_state(entity_id)
            if device_state:
                device_state.paused_cct_sequence = paused_cct
                device_state.paused_segment_sequence = paused_segment

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
                    "mqtt_client": entity_mqtt_client,
                    "state_manager": entity_state_manager,
                    "entities": [],
                }
            instance_groups[entry_id]["entities"].append(
                (entity_id, z2m_name, dynamic_effect)
            )

        # Publish effects to all devices, grouped by instance
        all_entities_published: list[tuple[str, str, DynamicEffect, StateManager]] = []

        for entry_id, group_data in instance_groups.items():
            group_mqtt_client = group_data["mqtt_client"]
            group_state_manager = group_data["state_manager"]
            group_entities = group_data["entities"]

            if sync and len(group_entities) > 1:
                # Synchronized mode - publish to all devices in this instance in parallel
                _LOGGER.debug(
                    "Publishing effects to %d devices in instance %s (synchronized)",
                    len(group_entities),
                    entry_id,
                )
                await group_mqtt_client.async_publish_batch_effects(
                    [(z2m_name, eff) for _, z2m_name, eff in group_entities],
                    z2m_base_topic,
                )
            else:
                # Non-synchronized or single device - publish sequentially
                for _, z2m_name, dynamic_effect in group_entities:
                    try:
                        await group_mqtt_client.async_publish_dynamic_effect(
                            z2m_name, dynamic_effect, z2m_base_topic
                        )
                    except Exception as ex:
                        _LOGGER.warning(
                            "Failed to publish effect to %s: %s", z2m_name, ex
                        )
                        continue

            # Add to combined list for marking effects active
            for entity_data in group_entities:
                all_entities_published.append(
                    (*entity_data, group_state_manager)
                )

        # Mark effects as active and fire events
        for entity_id, z2m_name, dynamic_effect, entity_state_mgr in all_entities_published:
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
            for entity_id, _, _, _ in all_entities_published:
                brightness_tasks.append(
                    hass.services.async_call(
                        "light",
                        "turn_on",
                        {"entity_id": entity_id, "brightness": brightness},
                        blocking=True,
                    )
                )

            # Execute brightness changes in parallel
            if brightness_tasks:
                results = await asyncio.gather(*brightness_tasks, return_exceptions=True)
                for idx, result in enumerate(results):
                    if isinstance(result, Exception):
                        entity_id = all_entities_published[idx][0]
                        _LOGGER.warning(
                            "Failed to set brightness for %s: %s", entity_id, result
                        )

    async def handle_stop_effect(call: ServiceCall) -> None:
        """Handle stop_effect service call."""
        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]
        z2m_base_topic: str | None = call.data.get(ATTR_Z2M_BASE_TOPIC)

        # Resolve groups to individual entities
        resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

        # Validate all entities are supported Aqara devices
        _validate_supported_entities(hass, resolved_entity_ids)

        restore_state: bool = call.data.get(ATTR_RESTORE_STATE, True)

        # Process each entity
        for entity_id in resolved_entity_ids:
            # Get the correct instance components for this entity
            entity_mqtt_client, entity_state_manager, entry_id = (
                _get_instance_components_for_entity(hass, entity_id)
            )

            # Get Z2M friendly name from the correct instance
            z2m_name = entity_mqtt_client.get_z2m_friendly_name(entity_id)
            if not z2m_name:
                _LOGGER.warning(
                    "Entity %s not mapped to Z2M device, skipping", entity_id
                )
                continue

            # Stop the effect by restoring previous state using HA light service
            try:
                if restore_state and entity_state_manager.has_stored_state(entity_id):
                    # Get stored state
                    device_state = entity_state_manager.get_device_state(entity_id)
                    if device_state and device_state.previous_state:
                        prev_state = device_state.previous_state

                        # Build service call data for HA light.turn_on
                        service_data = {"entity_id": entity_id}

                        # Restore brightness if it was set
                        if brightness := prev_state.get("brightness"):
                            service_data["brightness"] = brightness

                        # Restore color (RGB) if it was set
                        if color := prev_state.get("color"):
                            # Color should be in HA format: {"r": R, "g": G, "b": B}
                            if isinstance(color, dict) and "r" in color:
                                service_data["rgb_color"] = [color["r"], color["g"], color["b"]]

                        # Restore color temp if it was set (and no RGB color)
                        elif color_temp := prev_state.get("color_temp"):
                            service_data["color_temp"] = color_temp

                        # Call HA light service to restore state
                        # This uses standard Zigbee commands
                        await hass.services.async_call(
                            "light",
                            "turn_on",
                            service_data,
                            blocking=True,
                        )
                        _LOGGER.info("Stopped effect and restored previous state for %s", entity_id)
                else:
                    # No saved state - stop effect with a default warm white RGB color
                    # Use HA light service to set a solid color
                    await hass.services.async_call(
                        "light",
                        "turn_on",
                        {"entity_id": entity_id, "rgb_color": [255, 200, 150]},
                        blocking=True,
                    )
                    _LOGGER.info("Stopped effect for %s (set to default warm white)", entity_id)

                # Mark effect as inactive (returns the preset that was active)
                stopped_preset = entity_state_manager.mark_effect_inactive(entity_id)

                # Resume any sequences that were paused when effect started
                device_state = entity_state_manager.get_device_state(entity_id)
                if device_state:
                    # Get sequence managers from the correct instance
                    instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
                    cct_manager = instance_data.get(DATA_CCT_SEQUENCE_MANAGER)
                    segment_manager = instance_data.get(DATA_SEGMENT_SEQUENCE_MANAGER)

                    if device_state.paused_cct_sequence and cct_manager:
                        _LOGGER.debug("Resuming paused CCT sequence on %s", entity_id)
                        cct_manager.resume_sequence(entity_id)
                        device_state.paused_cct_sequence = False

                    if device_state.paused_segment_sequence and segment_manager:
                        _LOGGER.debug("Resuming paused segment sequence on %s", entity_id)
                        segment_manager.resume_sequence(entity_id)
                        device_state.paused_segment_sequence = False

                # Fire effect stopped event with preset info
                hass.bus.async_fire(
                    EVENT_EFFECT_STOPPED,
                    {
                        EVENT_ATTR_ENTITY_ID: entity_id,
                        EVENT_ATTR_PRESET: stopped_preset,
                    },
                )
            except Exception as ex:
                _LOGGER.warning("Failed to stop effect for %s: %s", entity_id, ex)
                continue

    async def handle_set_segment_pattern(call: ServiceCall) -> None:
        """Handle set_segment_pattern service call."""
        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]
        z2m_base_topic: str | None = call.data.get(ATTR_Z2M_BASE_TOPIC)

        # Resolve groups to individual entities
        resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

        # Validate all entities are supported Aqara devices
        _validate_supported_entities(hass, resolved_entity_ids)

        preset: str | None = call.data.get(ATTR_PRESET)
        segment_colors_data_input: list[dict[str, Any]] | None = call.data.get(ATTR_SEGMENT_COLORS)
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
            preset_store = _get_preset_store(hass)
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
            entity_mqtt_client, entity_state_manager, entry_id = (
                _get_instance_components_for_entity(hass, entity_id)
            )

            z2m_name = entity_mqtt_client.get_z2m_friendly_name(entity_id)
            if not z2m_name:
                _LOGGER.warning(
                    "Entity %s not mapped to Z2M device, skipping", entity_id
                )
                continue

            # Get device and check if it supports segment addressing
            device = entity_mqtt_client.entry.runtime_data.devices_by_name.get(
                z2m_name
            )
            if not device:
                _LOGGER.warning(
                    "Z2M device %s not found in registry, skipping", z2m_name
                )
                continue

            if not supports_segment_addressing(device.model_id):
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="segment_addressing_not_supported",
                    translation_placeholders={"device": z2m_name},
                )

            # Get segment count for this device
            max_segments = _get_actual_segment_count(hass, entity_id, device.model_id)

            # Validate preset is compatible with device type if using preset
            if preset_data and "device_types" in preset_data:
                allowed_device_types = preset_data["device_types"]
                if device.model_id not in allowed_device_types:
                    preset_name = preset_data.get("name", preset)
                    raise ServiceValidationError(
                        translation_domain=DOMAIN,
                        translation_key="preset_not_compatible",
                        translation_placeholders={
                            "preset": preset_name,
                            "device": z2m_name,
                            "model": device.model_id,
                        },
                    )

            # Ensure light is on if requested
            await _ensure_light_on(hass, entity_mqtt_client, entity_id, z2m_name, turn_on)

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
                    preset, len(segment_colors_data)
                )
            elif preset_data:
                preset_segments = preset_data["segments"]
                # Scale preset to device segment count (nearest-neighbor resampling)
                scaled_segments = scale_segment_pattern(preset_segments, max_segments)
                segment_colors_data = [
                    {"segment": i + 1, "color": {"r": color[0], "g": color[1], "b": color[2]}}
                    for i, color in enumerate(scaled_segments)
                ]
            elif segment_colors_data_input:
                segment_colors_data = segment_colors_data_input

            # Expand segment ranges into individual segments
            device_zones = _get_zones_for_device(hass, device.ieee_address)
            expanded_data = expand_segment_colors(segment_colors_data, max_segments, zones=device_zones)

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

            # Check and pause any running sequences before applying segment pattern
            # Get sequence managers from the correct instance
            instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
            cct_manager = instance_data.get(DATA_CCT_SEQUENCE_MANAGER)
            segment_manager = instance_data.get(DATA_SEGMENT_SEQUENCE_MANAGER)

            paused_cct = False
            paused_segment = False

            # Pause CCT sequence if running
            if cct_manager and cct_manager.is_sequence_running(entity_id):
                _LOGGER.debug("Pausing CCT sequence on %s before applying segment pattern", entity_id)
                cct_manager.pause_sequence(entity_id)
                paused_cct = True

            # Pause segment sequence if running
            if segment_manager and segment_manager.is_sequence_running(entity_id):
                _LOGGER.debug("Pausing segment sequence on %s before applying segment pattern", entity_id)
                segment_manager.pause_sequence(entity_id)
                paused_segment = True

            # Detach from dynamic scene if running (one-time pattern overrides scene)
            dsm = instance_data.get(DATA_DYNAMIC_SCENE_MANAGER)
            if dsm and dsm.is_scene_running(entity_id):
                _LOGGER.debug("Detaching %s from dynamic scene before applying segment pattern", entity_id)
                dsm.detach_entity(entity_id)

            # Capture state and publish pattern
            entity_state_manager.capture_state(entity_id, z2m_name)

            # Mark which sequences were paused so we can resume them later
            device_state = entity_state_manager.get_device_state(entity_id)
            if device_state:
                device_state.paused_cct_sequence = paused_cct
                device_state.paused_segment_sequence = paused_segment

            try:
                await entity_mqtt_client.async_publish_segment_pattern(
                    z2m_name, segment_colors, z2m_base_topic
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
                    translation_placeholders={"device": z2m_name},
                ) from ex

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
        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]
        z2m_base_topic: str | None = call.data.get(ATTR_Z2M_BASE_TOPIC)

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
            entity_mqtt_client, entity_state_manager, entry_id = (
                _get_instance_components_for_entity(hass, entity_id)
            )

            z2m_name = entity_mqtt_client.get_z2m_friendly_name(entity_id)
            if not z2m_name:
                _LOGGER.warning(
                    "Entity %s not mapped to Z2M device, skipping", entity_id
                )
                continue

            # Get device capabilities
            device = entity_mqtt_client.entry.runtime_data.devices_by_name.get(
                z2m_name
            )
            if not device:
                _LOGGER.warning(
                    "Z2M device %s not found in registry, skipping", z2m_name
                )
                continue

            capabilities = get_device_capabilities(device.model_id)
            if not capabilities or not capabilities.supports_segment_addressing:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="segment_addressing_not_supported",
                    translation_placeholders={"device": z2m_name},
                )

            # Detach from dynamic scene if running (one-time gradient overrides scene)
            instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
            dsm = instance_data.get(DATA_DYNAMIC_SCENE_MANAGER)
            if dsm and dsm.is_scene_running(entity_id):
                _LOGGER.debug("Detaching %s from dynamic scene before applying gradient", entity_id)
                dsm.detach_entity(entity_id)

            # Ensure light is on if requested
            await _ensure_light_on(hass, entity_mqtt_client, entity_id, z2m_name, turn_on)

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
            device_zones = _get_zones_for_device(hass, device.ieee_address)
            if segments_str:
                # Parse segment range
                max_segments = _get_actual_segment_count(hass, entity_id, device.model_id)
                segment_list = parse_segment_range(segments_str, max_segments, zones=device_zones)
                segment_count = len(segment_list)
            else:
                # Use all segments
                segment_count = _get_actual_segment_count(hass, entity_id, device.model_id)
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
            entity_state_manager.capture_state(entity_id, z2m_name)

            try:
                await entity_mqtt_client.async_publish_segment_pattern(
                    z2m_name, segment_colors, z2m_base_topic
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
                    translation_placeholders={"device": z2m_name},
                ) from ex

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
        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]
        z2m_base_topic: str | None = call.data.get(ATTR_Z2M_BASE_TOPIC)

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
            entity_mqtt_client, entity_state_manager, entry_id = (
                _get_instance_components_for_entity(hass, entity_id)
            )

            z2m_name = entity_mqtt_client.get_z2m_friendly_name(entity_id)
            if not z2m_name:
                _LOGGER.warning(
                    "Entity %s not mapped to Z2M device, skipping", entity_id
                )
                continue

            # Get device capabilities
            device = entity_mqtt_client.entry.runtime_data.devices_by_name.get(
                z2m_name
            )
            if not device:
                _LOGGER.warning(
                    "Z2M device %s not found in registry, skipping", z2m_name
                )
                continue

            capabilities = get_device_capabilities(device.model_id)
            if not capabilities or not capabilities.supports_segment_addressing:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="segment_addressing_not_supported",
                    translation_placeholders={"device": z2m_name},
                )

            # Detach from dynamic scene if running (one-time blocks overrides scene)
            instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
            dsm = instance_data.get(DATA_DYNAMIC_SCENE_MANAGER)
            if dsm and dsm.is_scene_running(entity_id):
                _LOGGER.debug("Detaching %s from dynamic scene before applying blocks", entity_id)
                dsm.detach_entity(entity_id)

            # Ensure light is on if requested
            await _ensure_light_on(hass, entity_mqtt_client, entity_id, z2m_name, turn_on)

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
            device_zones = _get_zones_for_device(hass, device.ieee_address)
            if segments_str:
                # Parse segment range
                max_segments = _get_actual_segment_count(hass, entity_id, device.model_id)
                segment_list = parse_segment_range(segments_str, max_segments, zones=device_zones)
                segment_count = len(segment_list)
            else:
                # Use all segments
                segment_count = _get_actual_segment_count(hass, entity_id, device.model_id)
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
            entity_state_manager.capture_state(entity_id, z2m_name)

            try:
                await entity_mqtt_client.async_publish_segment_pattern(
                    z2m_name, segment_colors, z2m_base_topic
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
                    translation_placeholders={"device": z2m_name},
                ) from ex

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

    async def handle_start_cct_sequence(call: ServiceCall) -> None:
        """Handle start_cct_sequence service call."""
        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]
        z2m_base_topic: str | None = call.data.get(ATTR_Z2M_BASE_TOPIC)

        # Resolve groups to individual entities
        resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

        # Separate Aqara and generic light entities
        aqara_entity_ids = []
        generic_entity_ids = []
        invalid_entity_ids = []
        for entity_id in resolved_entity_ids:
            if _is_aqara_entity(hass, entity_id):
                aqara_entity_ids.append(entity_id)
            elif _is_valid_light_entity(hass, entity_id):
                generic_entity_ids.append(entity_id)
            else:
                invalid_entity_ids.append(entity_id)

        if invalid_entity_ids:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="unsupported_entities",
                translation_placeholders={
                    "entity_list": ", ".join(invalid_entity_ids)
                },
            )

        turn_on: bool = call.data.get(ATTR_TURN_ON, False)
        preset: str | None = call.data.get(ATTR_PRESET)

        # Handle preset or manual configuration
        if preset:
            # Check user presets first
            preset_store = _get_preset_store(hass)
            user_preset = None
            if preset_store:
                user_preset = preset_store.get_preset_by_name(
                    PRESET_TYPE_CCT_SEQUENCE, preset
                )

            if user_preset:
                # Validate required preset fields
                try:
                    # Convert step brightness from percentage (1-100) to device
                    # value (1-255) since user presets store percentages
                    converted_steps = [
                        {
                            **step,
                            "brightness": brightness_percent_to_device(
                                step["brightness"]
                            ),
                        }
                        for step in user_preset["steps"]
                    ]
                    preset_data = {
                        "steps": converted_steps,
                        "loop_mode": user_preset["loop_mode"],
                        "loop_count": user_preset.get("loop_count"),
                        "end_behavior": user_preset["end_behavior"],
                    }
                except KeyError as ex:
                    raise ServiceValidationError(
                        translation_domain=DOMAIN,
                        translation_key="user_preset_missing_field",
                        translation_placeholders={"preset": preset, "field": str(ex)},
                    ) from ex

                if not preset_data["steps"]:
                    raise ServiceValidationError(
                        translation_domain=DOMAIN,
                        translation_key="user_preset_no_steps",
                        translation_placeholders={"preset": preset},
                    )

                _LOGGER.debug(
                    "Using user CCT sequence preset '%s' with %d steps",
                    preset, len(preset_data["steps"])
                )
            elif preset in CCT_SEQUENCE_PRESETS:
                preset_data = CCT_SEQUENCE_PRESETS[preset]
            else:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="invalid_preset",
                    translation_placeholders={"preset": preset},
                )

            # Create CCTSequenceStep objects from preset step data
            sequence_steps = []
            for step_data in preset_data["steps"]:
                try:
                    step = CCTSequenceStep(
                        color_temp=step_data["color_temp"],
                        brightness=step_data["brightness"],
                        transition=step_data["transition"],
                        hold=step_data["hold"],
                    )
                    sequence_steps.append(step)
                except ValueError as ex:
                    raise ServiceValidationError(
                        translation_domain=DOMAIN,
                        translation_key="invalid_sequence_configuration",
                        translation_placeholders={"error": str(ex)},
                    ) from ex

            # Get loop and end behavior from preset
            loop_mode: str = preset_data["loop_mode"]
            loop_count: int | None = preset_data.get("loop_count")
            end_behavior: str = preset_data["end_behavior"]
        else:
            # Manual configuration - extract from service call parameters
            loop_mode = call.data.get(ATTR_LOOP_MODE, LOOP_MODE_ONCE)
            loop_count = call.data.get(ATTR_LOOP_COUNT)
            end_behavior = call.data.get(ATTR_END_BEHAVIOR, END_BEHAVIOR_MAINTAIN)

            # Validate loop_count is provided when loop_mode is "count"
            if loop_mode == LOOP_MODE_COUNT and loop_count is None:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="loop_count_required",
                )

            # Extract steps from individual field inputs
            sequence_steps = []
            for step_num in range(1, 21):
                color_temp_key = f"step_{step_num}_color_temp"
                brightness_key = f"step_{step_num}_brightness"
                transition_key = f"step_{step_num}_transition"
                hold_key = f"step_{step_num}_hold"

                # Check if this step is provided (all 4 fields must be present)
                if color_temp_key in call.data:
                    # Validate all required fields for this step are present
                    if not all(key in call.data for key in [brightness_key, transition_key, hold_key]):
                        raise ServiceValidationError(
                            translation_domain=DOMAIN,
                            translation_key="step_incomplete",
                            translation_placeholders={"step": str(step_num)},
                        )

                    transition_val = call.data[transition_key]
                    hold_val = call.data[hold_key]

                    # Convert brightness percentage to device value (1-255)
                    brightness_percent = call.data[brightness_key]
                    brightness_device = brightness_percent_to_device(brightness_percent)

                    try:
                        step = CCTSequenceStep(
                            color_temp=call.data[color_temp_key],
                            brightness=brightness_device,
                            transition=transition_val,
                            hold=hold_val,
                        )
                        sequence_steps.append(step)
                    except ValueError as ex:
                        raise ServiceValidationError(
                            translation_domain=DOMAIN,
                            translation_key="invalid_sequence_configuration",
                            translation_placeholders={"error": str(ex)},
                        ) from ex

            # Validate we have at least one step
            if not sequence_steps:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="step_required",
                )

        # Create CCT sequence
        try:
            sequence = CCTSequence(
                steps=sequence_steps,
                loop_mode=loop_mode,
                loop_count=loop_count,
                end_behavior=end_behavior,
            )
        except ValueError as ex:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="invalid_sequence_configuration",
                translation_placeholders={"error": str(ex)},
            ) from ex

        # Group Aqara entities by their CCT manager instance for synchronized starting
        instance_groups: dict[str, dict] = {}  # entry_id -> {manager, entities, turn_on_data}

        for entity_id in aqara_entity_ids:
            # Get the correct instance components for this entity
            entity_mqtt_client, entity_state_manager, entry_id = (
                _get_instance_components_for_entity(hass, entity_id)
            )

            # Get CCT manager from the correct instance
            instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
            cct_manager = instance_data.get(DATA_CCT_SEQUENCE_MANAGER)
            if not cct_manager:
                _LOGGER.warning(
                    "CCT sequence manager not initialized for instance %s, skipping %s",
                    entry_id, entity_id
                )
                continue

            # Get Z2M friendly name
            z2m_name = entity_mqtt_client.get_z2m_friendly_name(entity_id)
            if not z2m_name:
                _LOGGER.warning(
                    "Entity %s not mapped to Z2M device, skipping", entity_id
                )
                continue

            # Add to instance group
            if entry_id not in instance_groups:
                instance_groups[entry_id] = {
                    "manager": cct_manager,
                    "entities": [],
                    "turn_on_data": [],
                }

            instance_groups[entry_id]["entities"].append(entity_id)
            instance_groups[entry_id]["turn_on_data"].append(
                (entity_mqtt_client, entity_id, z2m_name)
            )

        # Route generic entities through any available CCT manager
        # CCT sequences use HA service calls so any manager works
        generic_manager_pair = None
        if generic_entity_ids:
            generic_manager_pair = _get_any_cct_manager(hass)
            if not generic_manager_pair:
                raise HomeAssistantError(
                    "No integration instance available to manage generic lights. "
                    "Please ensure at least one Aqara Advanced Lighting instance "
                    "is configured."
                )

        # Turn on all lights in parallel if requested
        if turn_on:
            turn_on_tasks = []
            # Aqara lights
            for group_data in instance_groups.values():
                for mqtt_client, entity_id, z2m_name in group_data["turn_on_data"]:
                    turn_on_tasks.append(
                        _ensure_light_on(hass, mqtt_client, entity_id, z2m_name, True)
                    )
            # Generic lights - use HA service call directly
            for entity_id in generic_entity_ids:
                state = hass.states.get(entity_id)
                if state and state.state != "on":
                    turn_on_tasks.append(
                        hass.services.async_call(
                            "light", "turn_on",
                            {"entity_id": entity_id},
                            blocking=False,
                        )
                    )
            if turn_on_tasks:
                await asyncio.gather(*turn_on_tasks, return_exceptions=True)

        # Stop all conflicting continuous actions on these entities
        entity_controller = hass.data[DOMAIN].get(DATA_ENTITY_CONTROLLER)
        if entity_controller:
            for entity_id in aqara_entity_ids + generic_entity_ids:
                await entity_controller.stop_all_for_entity(entity_id)

        # Start synchronized sequences for each Aqara instance group
        start_tasks = []
        for entry_id, group_data in instance_groups.items():
            cct_manager = group_data["manager"]
            entity_list = group_data["entities"]
            start_tasks.append(
                cct_manager.start_synchronized_group(
                    entity_list, sequence, z2m_base_topic, preset
                )
            )

        # Start sequences for generic entities
        if generic_entity_ids and generic_manager_pair:
            generic_cct_manager, _ = generic_manager_pair
            start_tasks.append(
                generic_cct_manager.start_synchronized_group(
                    generic_entity_ids, sequence, None, preset
                )
            )

        # Start all sequences in parallel
        try:
            await asyncio.gather(*start_tasks)
            _LOGGER.info(
                "Started CCT sequences for %d Aqara + %d generic entities: loop_mode=%s",
                len(aqara_entity_ids),
                len(generic_entity_ids),
                loop_mode,
            )
        except Exception as ex:
            all_entities = aqara_entity_ids + generic_entity_ids
            raise HomeAssistantError(
                translation_domain=DOMAIN,
                translation_key="start_sequence_failed",
                translation_placeholders={"entity": ", ".join(all_entities)},
            ) from ex

    async def handle_stop_cct_sequence(call: ServiceCall) -> None:
        """Handle stop_cct_sequence service call."""
        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

        # Resolve groups to individual entities
        resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

        # Stop sequence for each entity - search all managers for running sequences
        for entity_id in resolved_entity_ids:
            cct_manager = _find_cct_manager_for_entity(hass, entity_id)
            if not cct_manager:
                _LOGGER.warning("No active CCT sequence for %s to stop", entity_id)
                continue

            try:
                await cct_manager.stop_sequence(entity_id)
                _LOGGER.info("Stopped CCT sequence for %s", entity_id)
            except Exception as ex:
                _LOGGER.error("Error stopping CCT sequence for %s: %s", entity_id, ex)
                raise HomeAssistantError(
                    translation_domain=DOMAIN,
                    translation_key="stop_sequence_failed",
                    translation_placeholders={"entity": entity_id},
                ) from ex

    async def handle_pause_cct_sequence(call: ServiceCall) -> None:
        """Handle pause_cct_sequence service call."""
        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

        # Resolve groups to individual entities
        resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

        # Pause sequence for each entity - search all managers
        for entity_id in resolved_entity_ids:
            cct_manager = _find_cct_manager_for_entity(hass, entity_id)
            if not cct_manager:
                _LOGGER.warning("No active CCT sequence for %s to pause", entity_id)
                continue

            success = cct_manager.pause_sequence(entity_id)
            if success:
                _LOGGER.info("Paused CCT sequence for %s", entity_id)
            else:
                _LOGGER.warning("Failed to pause CCT sequence for %s", entity_id)

    async def handle_resume_cct_sequence(call: ServiceCall) -> None:
        """Handle resume_cct_sequence service call."""
        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

        # Resolve groups to individual entities
        resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

        # Resume sequence for each entity - search all managers
        for entity_id in resolved_entity_ids:
            cct_manager = _find_cct_manager_for_entity(hass, entity_id)
            if not cct_manager:
                _LOGGER.warning("No active CCT sequence for %s to resume", entity_id)
                continue

            success = cct_manager.resume_sequence(entity_id)
            if success:
                _LOGGER.info("Resumed CCT sequence for %s", entity_id)
            else:
                _LOGGER.warning("Failed to resume CCT sequence for %s", entity_id)

    async def handle_start_segment_sequence(call: ServiceCall) -> None:
        """Handle start_segment_sequence service call."""
        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]
        z2m_base_topic: str | None = call.data.get(ATTR_Z2M_BASE_TOPIC)

        # Resolve groups to individual entities
        resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

        turn_on: bool = call.data.get(ATTR_TURN_ON, False)
        preset: str | None = call.data.get(ATTR_PRESET)

        # Handle preset or manual configuration
        if preset:
            # Check user presets first
            preset_store = _get_preset_store(hass)
            user_preset = None
            if preset_store:
                user_preset = preset_store.get_preset_by_name(
                    PRESET_TYPE_SEGMENT_SEQUENCE, preset
                )

            if user_preset:
                # Validate required preset fields
                try:
                    preset_data = {
                        "steps": user_preset["steps"],
                        "loop_mode": user_preset["loop_mode"],
                        "loop_count": user_preset.get("loop_count"),
                        "end_behavior": user_preset["end_behavior"],
                        "clear_segments": user_preset.get("clear_segments", False),
                        "skip_first_in_loop": user_preset.get("skip_first_in_loop", False),
                    }
                except KeyError as ex:
                    raise ServiceValidationError(
                        translation_domain=DOMAIN,
                        translation_key="user_preset_missing_field",
                        translation_placeholders={"preset": preset, "field": str(ex)},
                    ) from ex

                if not preset_data["steps"]:
                    raise ServiceValidationError(
                        translation_domain=DOMAIN,
                        translation_key="user_preset_no_steps",
                        translation_placeholders={"preset": preset},
                    )

                _LOGGER.debug(
                    "Using user segment sequence preset '%s' with %d steps",
                    preset, len(preset_data["steps"])
                )
            elif preset in SEGMENT_SEQUENCE_PRESETS:
                preset_data = SEGMENT_SEQUENCE_PRESETS[preset]
            else:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="invalid_preset",
                    translation_placeholders={"preset": preset},
                )

            # Create SegmentSequenceStep objects from preset step data
            sequence_steps = []
            for step_data in preset_data["steps"]:
                try:
                    # Check if step uses direct segment assignments (new method)
                    segment_colors = None
                    if "segment_colors" in step_data and step_data["segment_colors"]:
                        # Convert segment_colors from dicts to SegmentColor objects
                        segment_colors = [
                            SegmentColor(
                                segment=sc["segment"],
                                color=RGBColor(**sc["color"]),
                            )
                            for sc in step_data["segment_colors"]
                        ]
                        # For legacy compatibility, provide defaults for required fields
                        colors = [RGBColor(r=255, g=0, b=0)]  # Default, not used
                        segments = "all"  # Default, not used
                        mode = "individual"  # Default, not used
                    else:
                        # Legacy mode: use segments + colors + mode
                        colors = [RGBColor(**color) if isinstance(color, dict) else RGBColor(r=color[0], g=color[1], b=color[2]) for color in step_data["colors"]]
                        segments = step_data["segments"]
                        mode = step_data["mode"]

                    step = SegmentSequenceStep(
                        segments=segments,
                        colors=colors,
                        mode=mode,
                        duration=step_data["duration"],
                        hold=step_data["hold"],
                        activation_pattern=step_data["activation_pattern"],
                        segment_colors=segment_colors,
                    )
                    sequence_steps.append(step)
                except (ValueError, KeyError) as ex:
                    raise ServiceValidationError(
                        translation_domain=DOMAIN,
                        translation_key="invalid_sequence_configuration",
                        translation_placeholders={"error": str(ex)},
                    ) from ex

            # Get loop and end behavior from preset
            loop_mode: str = preset_data["loop_mode"]
            loop_count: int | None = preset_data.get("loop_count")
            end_behavior: str = preset_data["end_behavior"]
            clear_segments: bool = preset_data.get("clear_segments", False)
            skip_first_in_loop: bool = preset_data.get("skip_first_in_loop", False)
        else:
            # Manual configuration - extract from service call parameters
            loop_mode = call.data.get(ATTR_LOOP_MODE, LOOP_MODE_ONCE)
            loop_count = call.data.get(ATTR_LOOP_COUNT)
            end_behavior = call.data.get(ATTR_END_BEHAVIOR, END_BEHAVIOR_MAINTAIN)
            clear_segments = call.data.get(ATTR_CLEAR_SEGMENTS, False)
            skip_first_in_loop = call.data.get(ATTR_SKIP_FIRST_IN_LOOP, False)

            # Validate loop_count is provided when loop_mode is "count"
            if loop_mode == LOOP_MODE_COUNT and loop_count is None:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="loop_count_required",
                )

            # Extract steps from individual field inputs
            sequence_steps = []
            for step_num in range(1, 21):
                segments_key = f"step_{step_num}_segments"
                mode_key = f"step_{step_num}_mode"

                # Check if this step is provided
                if segments_key in call.data and mode_key in call.data:
                    # Check for new segment_colors format first
                    segment_colors_key = f"step_{step_num}_segment_colors"
                    segment_colors = None

                    if segment_colors_key in call.data and call.data[segment_colors_key]:
                        # Convert segment_colors from dicts to SegmentColor objects
                        segment_colors = [
                            SegmentColor(
                                segment=sc["segment"],
                                color=RGBColor(**sc["color"]),
                            )
                            for sc in call.data[segment_colors_key]
                        ]
                        # Provide defaults for required fields when using segment_colors
                        step_colors = [RGBColor(r=255, g=0, b=0)]  # Default, not used
                    else:
                        # Legacy format: Extract colors for this step (supports both RGB and XY formats)
                        step_colors = []
                        for color_num in range(1, 7):
                            color_key = f"step_{step_num}_color_{color_num}"
                            if color_key in call.data:
                                color_data = call.data[color_key]
                                step_colors.append(_normalize_color_to_rgb(color_data))

                        if not step_colors:
                            raise ServiceValidationError(
                                translation_domain=DOMAIN,
                                translation_key="step_requires_colors",
                                translation_placeholders={"step": str(step_num)},
                            )

                    duration = call.data.get(f"step_{step_num}_duration", 0.0)
                    hold = call.data.get(f"step_{step_num}_hold", 0.0)
                    activation_pattern = call.data.get(f"step_{step_num}_activation_pattern", ACTIVATION_ALL)

                    try:
                        step = SegmentSequenceStep(
                            segments=call.data[segments_key],
                            colors=step_colors,
                            mode=call.data[mode_key],
                            duration=duration,
                            hold=hold,
                            activation_pattern=activation_pattern,
                            segment_colors=segment_colors,
                        )
                        sequence_steps.append(step)
                    except ValueError as ex:
                        raise ServiceValidationError(
                            translation_domain=DOMAIN,
                            translation_key="invalid_sequence_configuration",
                            translation_placeholders={"error": str(ex)},
                        ) from ex

            # Validate we have at least one step
            if not sequence_steps:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="step_required",
                )

        # Create segment sequence
        try:
            sequence = SegmentSequence(
                steps=sequence_steps,
                loop_mode=loop_mode,
                loop_count=loop_count,
                end_behavior=end_behavior,
                clear_segments=clear_segments,
                skip_first_in_loop=skip_first_in_loop,
            )
        except ValueError as ex:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="invalid_sequence_configuration",
                translation_placeholders={"error": str(ex)},
            ) from ex

        # Group entities by their segment manager instance for synchronized starting
        instance_groups: dict[str, dict] = {}  # entry_id -> {manager, entities, turn_on_data}

        for entity_id in resolved_entity_ids:
            # Get the correct instance components for this entity
            entity_mqtt_client, entity_state_manager, entry_id = (
                _get_instance_components_for_entity(hass, entity_id)
            )

            # Get segment manager from the correct instance
            instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
            segment_manager = instance_data.get(DATA_SEGMENT_SEQUENCE_MANAGER)
            if not segment_manager:
                _LOGGER.warning(
                    "Segment sequence manager not initialized for instance %s, skipping %s",
                    entry_id, entity_id
                )
                continue

            # Get Z2M friendly name
            z2m_name = entity_mqtt_client.get_z2m_friendly_name(entity_id)
            if not z2m_name:
                _LOGGER.warning(
                    "Entity %s not mapped to Z2M device, skipping", entity_id
                )
                continue

            # Get device and check if it supports segment addressing
            device = entity_mqtt_client.entry.runtime_data.devices_by_name.get(
                z2m_name
            )
            if not device:
                _LOGGER.warning(
                    "Z2M device %s not found in registry, skipping", z2m_name
                )
                continue

            if not supports_segment_addressing(device.model_id):
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="device_no_segment_support",
                    translation_placeholders={"entity_id": entity_id},
                )

            # Add to instance group
            if entry_id not in instance_groups:
                instance_groups[entry_id] = {
                    "manager": segment_manager,
                    "entities": [],
                    "turn_on_data": [],
                }

            instance_groups[entry_id]["entities"].append(entity_id)
            instance_groups[entry_id]["turn_on_data"].append(
                (entity_mqtt_client, entity_id, z2m_name)
            )

        # Turn on all lights in parallel if requested
        if turn_on:
            turn_on_tasks = []
            for group_data in instance_groups.values():
                for mqtt_client, entity_id, z2m_name in group_data["turn_on_data"]:
                    turn_on_tasks.append(
                        _ensure_light_on(hass, mqtt_client, entity_id, z2m_name, True)
                    )
            if turn_on_tasks:
                await asyncio.gather(*turn_on_tasks, return_exceptions=True)

        # Stop all conflicting continuous actions on these entities
        entity_controller = hass.data[DOMAIN].get(DATA_ENTITY_CONTROLLER)
        if entity_controller:
            for entity_id in resolved_entity_ids:
                await entity_controller.stop_all_for_entity(entity_id)

        # Start synchronized sequences for each instance group
        for entry_id, group_data in instance_groups.items():
            segment_manager = group_data["manager"]
            entity_list = group_data["entities"]

            try:
                # Use synchronized group start for multiple entities
                sequence_ids = await segment_manager.start_synchronized_group(
                    entity_list, sequence, z2m_base_topic, preset
                )
                _LOGGER.info(
                    "Started synchronized segment sequence for %d entities",
                    len(entity_list),
                )
            except Exception as ex:
                _LOGGER.error(
                    "Failed to start synchronized segment sequence: %s", ex
                )
                raise HomeAssistantError(
                    translation_domain=DOMAIN,
                    translation_key="start_segment_sequence_failed",
                    translation_placeholders={
                        "entity_id": ", ".join(entity_list),
                        "error": str(ex),
                    },
                ) from ex

    async def handle_stop_segment_sequence(call: ServiceCall) -> None:
        """Handle stop_segment_sequence service call."""
        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

        # Resolve groups to individual entities
        resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

        # Validate all entities are supported Aqara devices
        _validate_supported_entities(hass, resolved_entity_ids)

        # Stop sequence for each entity
        for entity_id in resolved_entity_ids:
            # Get the correct instance components for this entity
            _, _, entry_id = _get_instance_components_for_entity(hass, entity_id)

            # Get segment manager from the correct instance
            instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
            segment_manager = instance_data.get(DATA_SEGMENT_SEQUENCE_MANAGER)
            if not segment_manager:
                _LOGGER.warning(
                    "Segment sequence manager not initialized for instance %s, skipping %s",
                    entry_id, entity_id
                )
                continue

            try:
                await segment_manager.stop_sequence(entity_id)
                _LOGGER.info("Stopped segment sequence for %s", entity_id)
            except Exception as ex:
                _LOGGER.warning("Failed to stop segment sequence for %s: %s", entity_id, ex)

    async def handle_pause_segment_sequence(call: ServiceCall) -> None:
        """Handle pause_segment_sequence service call."""
        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

        # Resolve groups to individual entities
        resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

        # Validate all entities are supported Aqara devices
        _validate_supported_entities(hass, resolved_entity_ids)

        # Pause sequence for each entity
        for entity_id in resolved_entity_ids:
            # Get the correct instance components for this entity
            _, _, entry_id = _get_instance_components_for_entity(hass, entity_id)

            # Get segment manager from the correct instance
            instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
            segment_manager = instance_data.get(DATA_SEGMENT_SEQUENCE_MANAGER)
            if not segment_manager:
                _LOGGER.warning(
                    "Segment sequence manager not initialized for instance %s, skipping %s",
                    entry_id, entity_id
                )
                continue

            if not segment_manager.is_sequence_running(entity_id):
                _LOGGER.warning("No active segment sequence for %s to pause", entity_id)
                continue

            success = segment_manager.pause_sequence(entity_id)
            if success:
                _LOGGER.info("Paused segment sequence for %s", entity_id)
            else:
                _LOGGER.warning("Failed to pause segment sequence for %s", entity_id)

    async def handle_resume_segment_sequence(call: ServiceCall) -> None:
        """Handle resume_segment_sequence service call."""
        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

        # Resolve groups to individual entities
        resolved_entity_ids = _resolve_entity_ids(hass, entity_ids)

        # Validate all entities are supported Aqara devices
        _validate_supported_entities(hass, resolved_entity_ids)

        # Resume sequence for each entity
        for entity_id in resolved_entity_ids:
            # Get the correct instance components for this entity
            _, _, entry_id = _get_instance_components_for_entity(hass, entity_id)

            # Get segment manager from the correct instance
            instance_data = hass.data[DOMAIN]["entries"].get(entry_id, {})
            segment_manager = instance_data.get(DATA_SEGMENT_SEQUENCE_MANAGER)
            if not segment_manager:
                _LOGGER.warning(
                    "Segment sequence manager not initialized for instance %s, skipping %s",
                    entry_id, entity_id
                )
                continue

            if not segment_manager.is_sequence_running(entity_id):
                _LOGGER.warning("No active segment sequence for %s to resume", entity_id)
                continue

            success = segment_manager.resume_sequence(entity_id)
            if success:
                _LOGGER.info("Resumed segment sequence for %s", entity_id)
            else:
                _LOGGER.warning("Failed to resume segment sequence for %s", entity_id)

    async def handle_start_dynamic_scene(call: ServiceCall) -> None:
        """Handle start_dynamic_scene service call.

        Dynamic scenes use HA service calls (light.turn_on with xy_color) and
        work with both Aqara and generic RGB-capable lights.
        """
        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]
        preset_name: str | None = call.data.get(ATTR_PRESET)
        # scene_name is used for display tracking when colors are passed
        # directly (not via preset lookup)
        display_name: str | None = preset_name or call.data.get("scene_name")

        # Resolve groups to individual entities
        entity_ids = _resolve_entity_ids(hass, entity_ids)

        # Filter to valid light entities (Aqara or generic)
        valid_entity_ids = [
            eid for eid in entity_ids if _is_valid_light_entity(hass, eid)
        ]
        if not valid_entity_ids:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="unsupported_entities",
                translation_placeholders={
                    "entity_list": ", ".join(entity_ids)
                },
            )

        # Dynamic scenes require RGB color capability (xy_color commands)
        rgb_entity_ids = [
            eid for eid in valid_entity_ids if _has_rgb_color_mode(hass, eid)
        ]
        if not rgb_entity_ids:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="no_rgb_entities",
                translation_placeholders={
                    "entity_list": ", ".join(valid_entity_ids)
                },
            )
        if len(rgb_entity_ids) < len(valid_entity_ids):
            skipped = set(valid_entity_ids) - set(rgb_entity_ids)
            _LOGGER.info(
                "Skipping CCT-only entities for dynamic scene: %s",
                ", ".join(skipped),
            )
        valid_entity_ids = rgb_entity_ids

        # Get dynamic scene manager from first available config entry
        # (scenes work across all Z2M instances so any manager will do)
        manager = None
        for instance_data in hass.data[DOMAIN].get("entries", {}).values():
            manager = instance_data.get(DATA_DYNAMIC_SCENE_MANAGER)
            if manager:
                break
        if not manager:
            raise HomeAssistantError("Dynamic scene manager not initialized")

        # Build scene from preset or manual parameters
        if preset_name:
            # Look up preset
            preset_store = hass.data[DOMAIN].get(DATA_PRESET_STORE)
            if not preset_store:
                raise HomeAssistantError("Preset store not initialized")

            preset = preset_store.get_preset_by_name(PRESET_TYPE_DYNAMIC_SCENE, preset_name)
            if not preset:
                preset = preset_store.get_preset(PRESET_TYPE_DYNAMIC_SCENE, preset_name)
            if not preset:
                raise ServiceValidationError(
                    f"Dynamic scene preset '{preset_name}' not found",
                    translation_domain=DOMAIN,
                    translation_key="preset_not_found",
                )

            colors = [
                DynamicSceneColor(
                    x=c["x"],
                    y=c["y"],
                    brightness_pct=c.get("brightness_pct", 100),
                )
                for c in preset["colors"]
            ]

            scene = DynamicScene(
                colors=colors,
                transition_time=preset["transition_time"],
                hold_time=preset["hold_time"],
                distribution_mode=preset["distribution_mode"],
                offset_delay=preset.get("offset_delay", 0.0),
                random_order=preset.get("random_order", False),
                scene_brightness_pct=preset["scene_brightness_pct"],
                loop_mode=preset["loop_mode"],
                loop_count=preset.get("loop_count"),
                end_behavior=preset["end_behavior"],
            )
        else:
            # Build from manual parameters
            colors_data = call.data.get("colors")
            if not colors_data:
                raise ServiceValidationError(
                    "Either preset or colors must be provided",
                    translation_domain=DOMAIN,
                    translation_key="missing_scene_source",
                )

            colors = [
                DynamicSceneColor(
                    x=c["x"],
                    y=c["y"],
                    brightness_pct=c.get("brightness_pct", 100),
                )
                for c in colors_data
            ]

            scene = DynamicScene(
                colors=colors,
                transition_time=call.data.get(
                    "transition_time", DEFAULT_DYNAMIC_SCENE_TRANSITION_TIME
                ),
                hold_time=call.data.get("hold_time", DEFAULT_DYNAMIC_SCENE_HOLD_TIME),
                distribution_mode=call.data.get(
                    "distribution_mode", DISTRIBUTION_SHUFFLE_ROTATE
                ),
                offset_delay=call.data.get("offset_delay", 0.0),
                random_order=call.data.get("random_order", False),
                scene_brightness_pct=call.data.get(
                    "scene_brightness_pct", DEFAULT_SCENE_BRIGHTNESS_PCT
                ),
                loop_mode=call.data.get(ATTR_LOOP_MODE, "continuous"),
                loop_count=call.data.get(ATTR_LOOP_COUNT),
                end_behavior=call.data.get(ATTR_END_BEHAVIOR, "maintain"),
            )

        # Stop all conflicting continuous actions on these entities
        entity_controller = hass.data[DOMAIN].get(DATA_ENTITY_CONTROLLER)
        if entity_controller:
            for entity_id in valid_entity_ids:
                await entity_controller.stop_all_for_entity(entity_id)

        static = call.data.get("static", False)
        if static:
            await manager.apply_static_scene(
                valid_entity_ids, scene, display_name
            )
        else:
            await manager.start_scene(valid_entity_ids, scene, display_name)

    async def handle_stop_dynamic_scene(call: ServiceCall) -> None:
        """Handle stop_dynamic_scene service call."""
        entity_ids: list[str] | None = call.data.get(ATTR_ENTITY_ID)

        # Get dynamic scene manager from first available config entry
        manager = None
        for instance_data in hass.data[DOMAIN].get("entries", {}).values():
            manager = instance_data.get(DATA_DYNAMIC_SCENE_MANAGER)
            if manager:
                break
        if not manager:
            raise HomeAssistantError("Dynamic scene manager not initialized")

        await manager.stop_scene(entity_ids=entity_ids)

    async def handle_pause_dynamic_scene(call: ServiceCall) -> None:
        """Handle pause_dynamic_scene service call."""
        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

        # Get dynamic scene manager from first available config entry
        manager = None
        for instance_data in hass.data[DOMAIN].get("entries", {}).values():
            manager = instance_data.get(DATA_DYNAMIC_SCENE_MANAGER)
            if manager:
                break
        if not manager:
            raise HomeAssistantError("Dynamic scene manager not initialized")

        manager.pause_scene(entity_ids)

    async def handle_resume_dynamic_scene(call: ServiceCall) -> None:
        """Handle resume_dynamic_scene service call."""
        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

        # Get dynamic scene manager from first available config entry
        manager = None
        for instance_data in hass.data[DOMAIN].get("entries", {}).values():
            manager = instance_data.get(DATA_DYNAMIC_SCENE_MANAGER)
            if manager:
                break
        if not manager:
            raise HomeAssistantError("Dynamic scene manager not initialized")

        manager.resume_scene(entity_ids)

    async def handle_resume_entity_control(call: ServiceCall) -> None:
        """Handle resume_entity_control service call.

        Resumes control of entities that were paused due to external changes.
        """
        entity_ids: list[str] = call.data[ATTR_ENTITY_ID]

        entity_controller = hass.data[DOMAIN].get(DATA_ENTITY_CONTROLLER)
        if not entity_controller:
            raise HomeAssistantError("Entity controller not initialized")

        for entity_id in entity_ids:
            resumed = await entity_controller.resume_entity(entity_id)
            if not resumed:
                _LOGGER.debug(
                    "Entity %s was not externally paused, nothing to resume",
                    entity_id,
                )

    # Register services
    hass.services.async_register(
        DOMAIN,
        SERVICE_SET_DYNAMIC_EFFECT,
        handle_set_dynamic_effect,
        schema=SERVICE_SET_DYNAMIC_EFFECT_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_STOP_EFFECT,
        handle_stop_effect,
        schema=SERVICE_STOP_EFFECT_SCHEMA,
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

    hass.services.async_register(
        DOMAIN,
        SERVICE_START_CCT_SEQUENCE,
        handle_start_cct_sequence,
        schema=SERVICE_START_CCT_SEQUENCE_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_STOP_CCT_SEQUENCE,
        handle_stop_cct_sequence,
        schema=SERVICE_STOP_CCT_SEQUENCE_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_PAUSE_CCT_SEQUENCE,
        handle_pause_cct_sequence,
        schema=SERVICE_PAUSE_CCT_SEQUENCE_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_RESUME_CCT_SEQUENCE,
        handle_resume_cct_sequence,
        schema=SERVICE_RESUME_CCT_SEQUENCE_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_START_SEGMENT_SEQUENCE,
        handle_start_segment_sequence,
        schema=SERVICE_START_SEGMENT_SEQUENCE_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_STOP_SEGMENT_SEQUENCE,
        handle_stop_segment_sequence,
        schema=SERVICE_STOP_SEGMENT_SEQUENCE_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_PAUSE_SEGMENT_SEQUENCE,
        handle_pause_segment_sequence,
        schema=SERVICE_PAUSE_SEGMENT_SEQUENCE_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_RESUME_SEGMENT_SEQUENCE,
        handle_resume_segment_sequence,
        schema=SERVICE_RESUME_SEGMENT_SEQUENCE_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_START_DYNAMIC_SCENE,
        handle_start_dynamic_scene,
        schema=SERVICE_START_DYNAMIC_SCENE_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_STOP_DYNAMIC_SCENE,
        handle_stop_dynamic_scene,
        schema=SERVICE_STOP_DYNAMIC_SCENE_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_PAUSE_DYNAMIC_SCENE,
        handle_pause_dynamic_scene,
        schema=SERVICE_PAUSE_DYNAMIC_SCENE_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_RESUME_DYNAMIC_SCENE,
        handle_resume_dynamic_scene,
        schema=SERVICE_RESUME_DYNAMIC_SCENE_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_RESUME_ENTITY_CONTROL,
        handle_resume_entity_control,
        schema=vol.Schema(
            {
                vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
            }
        ),
    )

    _LOGGER.info("Aqara Advanced Lighting services registered")


async def async_unload_services(hass: HomeAssistant) -> None:
    """Unload services."""
    hass.services.async_remove(DOMAIN, SERVICE_SET_DYNAMIC_EFFECT)
    hass.services.async_remove(DOMAIN, SERVICE_STOP_EFFECT)
    hass.services.async_remove(DOMAIN, SERVICE_SET_SEGMENT_PATTERN)
    hass.services.async_remove(DOMAIN, SERVICE_CREATE_GRADIENT)
    hass.services.async_remove(DOMAIN, SERVICE_CREATE_BLOCKS)
    hass.services.async_remove(DOMAIN, SERVICE_START_CCT_SEQUENCE)
    hass.services.async_remove(DOMAIN, SERVICE_STOP_CCT_SEQUENCE)
    hass.services.async_remove(DOMAIN, SERVICE_PAUSE_CCT_SEQUENCE)
    hass.services.async_remove(DOMAIN, SERVICE_RESUME_CCT_SEQUENCE)
    hass.services.async_remove(DOMAIN, SERVICE_START_SEGMENT_SEQUENCE)
    hass.services.async_remove(DOMAIN, SERVICE_STOP_SEGMENT_SEQUENCE)
    hass.services.async_remove(DOMAIN, SERVICE_PAUSE_SEGMENT_SEQUENCE)
    hass.services.async_remove(DOMAIN, SERVICE_RESUME_SEGMENT_SEQUENCE)
    hass.services.async_remove(DOMAIN, SERVICE_START_DYNAMIC_SCENE)
    hass.services.async_remove(DOMAIN, SERVICE_STOP_DYNAMIC_SCENE)
    hass.services.async_remove(DOMAIN, SERVICE_PAUSE_DYNAMIC_SCENE)
    hass.services.async_remove(DOMAIN, SERVICE_RESUME_DYNAMIC_SCENE)
    hass.services.async_remove(DOMAIN, SERVICE_RESUME_ENTITY_CONTROL)

    # Stop all running sequences across all instances
    entries = hass.data.get(DOMAIN, {}).get("entries", {})
    for entry_id, instance_data in entries.items():
        # Stop all running CCT sequences for this instance
        cct_manager = instance_data.get(DATA_CCT_SEQUENCE_MANAGER)
        if cct_manager:
            await cct_manager.stop_all_sequences()

        # Stop all running segment sequences for this instance
        segment_manager = instance_data.get(DATA_SEGMENT_SEQUENCE_MANAGER)
        if segment_manager:
            await segment_manager.stop_all_sequences()

        # Stop all running dynamic scenes for this instance
        dynamic_scene_manager = instance_data.get(DATA_DYNAMIC_SCENE_MANAGER)
        if dynamic_scene_manager:
            dynamic_scene_manager.cleanup()

    _LOGGER.info("Aqara Advanced Lighting services unloaded")
