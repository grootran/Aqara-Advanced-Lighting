"""Constants for the Aqara Advanced Lighting integration."""

from typing import Final

# Integration domain
DOMAIN: Final = "aqara_advanced_lighting"

# Configuration constants
CONF_Z2M_BASE_TOPIC: Final = "z2m_base_topic"
DEFAULT_Z2M_BASE_TOPIC: Final = "zigbee2mqtt"

# Service names
SERVICE_SET_DYNAMIC_EFFECT: Final = "set_dynamic_effect"
SERVICE_SET_SEGMENT_PATTERN: Final = "set_segment_pattern"
SERVICE_CREATE_GRADIENT: Final = "create_gradient"
SERVICE_CREATE_BLOCKS: Final = "create_blocks"

# Service attributes
ATTR_EFFECT: Final = "effect"
ATTR_SPEED: Final = "speed"
ATTR_COLOR_1: Final = "color_1"
ATTR_COLOR_2: Final = "color_2"
ATTR_COLOR_3: Final = "color_3"
ATTR_COLOR_4: Final = "color_4"
ATTR_COLOR_5: Final = "color_5"
ATTR_COLOR_6: Final = "color_6"
ATTR_COLOR_7: Final = "color_7"
ATTR_COLOR_8: Final = "color_8"
ATTR_SEGMENTS: Final = "segments"
ATTR_SEGMENT_COLORS: Final = "segment_colors"
ATTR_TURN_ON: Final = "turn_on"
ATTR_EXPAND: Final = "expand"
ATTR_TURN_OFF_UNSPECIFIED: Final = "turn_off_unspecified"

# MQTT topics
TOPIC_Z2M_BRIDGE_DEVICES: Final = "bridge/devices"
TOPIC_Z2M_DEVICE_SET: Final = "{}/set"
TOPIC_Z2M_DEVICE_GET: Final = "{}/get"

# Z2M payload keys
PAYLOAD_EFFECT: Final = "effect"
PAYLOAD_EFFECT_SPEED: Final = "effect_speed"
PAYLOAD_EFFECT_COLORS: Final = "effect_colors"
PAYLOAD_SEGMENT_COLORS: Final = "segment_colors"
PAYLOAD_EFFECT_SEGMENTS: Final = "effect_segments"

# Color constraints
MIN_EFFECT_COLORS: Final = 1
MAX_EFFECT_COLORS: Final = 8
MIN_GRADIENT_COLORS: Final = 2
MAX_GRADIENT_COLORS: Final = 6
MIN_SPEED: Final = 1
MAX_SPEED: Final = 100

# RGB color constraints
MIN_RGB_VALUE: Final = 0
MAX_RGB_VALUE: Final = 255

# Supported Aqara light models (Z2M model identifiers)
MODEL_T1M_20_SEGMENT: Final = "lumi.light.acn031"
MODEL_T1M_26_SEGMENT: Final = "lumi.light.acn032"
MODEL_T1_STRIP: Final = "lumi.light.acn132"
MODEL_T2_BULB_E26: Final = "lumi.light.agl001"
MODEL_T2_BULB_E27: Final = "lumi.light.agl003"
MODEL_T2_BULB_GU10_230V: Final = "lumi.light.agl005"
MODEL_T2_BULB_GU10_110V: Final = "lumi.light.agl007"

# Effect types for T1M (ACN031/ACN032)
EFFECT_T1M_FLOW1: Final = "flow1"
EFFECT_T1M_FLOW2: Final = "flow2"
EFFECT_T1M_FADING: Final = "fading"
EFFECT_T1M_HOPPING: Final = "hopping"
EFFECT_T1M_BREATHING: Final = "breathing"
EFFECT_T1M_ROLLING: Final = "rolling"

# Effect types for T1 Strip
EFFECT_T1_BREATHING: Final = "breathing"
EFFECT_T1_RAINBOW1: Final = "rainbow1"
EFFECT_T1_CHASING: Final = "chasing"
EFFECT_T1_FLASH: Final = "flash"
EFFECT_T1_HOPPING: Final = "hopping"
EFFECT_T1_RAINBOW2: Final = "rainbow2"
EFFECT_T1_FLICKER: Final = "flicker"
EFFECT_T1_DASH: Final = "dash"

# Effect types for T2 Bulb
EFFECT_T2_BREATHING: Final = "breathing"
EFFECT_T2_CANDLELIGHT: Final = "candlelight"
EFFECT_T2_FADING: Final = "fading"
EFFECT_T2_FLASH: Final = "flash"

# Device capability keys
CAPABILITY_SEGMENT_COUNT: Final = "segment_count"
CAPABILITY_SUPPORTED_EFFECTS: Final = "supported_effects"
CAPABILITY_SUPPORTS_SEGMENT_ADDRESSING: Final = "supports_segment_addressing"
CAPABILITY_SUPPORTS_EFFECT_SEGMENTS: Final = "supports_effect_segments"
CAPABILITY_MODEL_NAME: Final = "model_name"

# Runtime data storage keys
DATA_COORDINATOR: Final = "coordinator"
DATA_STATE_MANAGER: Final = "state_manager"
DATA_DEVICE_REGISTRY: Final = "device_registry"
DATA_UNSUB: Final = "unsub"