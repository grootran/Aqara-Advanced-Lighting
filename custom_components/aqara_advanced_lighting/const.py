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
ATTR_PRESET: Final = "preset"
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
ATTR_BRIGHTNESS: Final = "brightness"
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

# Brightness constraints
MIN_BRIGHTNESS: Final = 1
MAX_BRIGHTNESS: Final = 255

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

# Effect presets from Aqara app
# T2 Bulb presets
PRESET_T2_CANDLELIGHT: Final = "t2_candlelight"
PRESET_T2_BREATH: Final = "t2_breath"
PRESET_T2_COLORFUL: Final = "t2_colorful"
PRESET_T2_SECURITY: Final = "t2_security"

# T1M presets
PRESET_T1M_DINNER: Final = "t1m_dinner"
PRESET_T1M_SUNSET: Final = "t1m_sunset"
PRESET_T1M_AUTUMN: Final = "t1m_autumn"
PRESET_T1M_GALAXY: Final = "t1m_galaxy"
PRESET_T1M_DAYDREAM: Final = "t1m_daydream"
PRESET_T1M_HOLIDAY: Final = "t1m_holiday"
PRESET_T1M_PARTY: Final = "t1m_party"
PRESET_T1M_METEOR: Final = "t1m_meteor"
PRESET_T1M_ALERT: Final = "t1m_alert"

# T1 Strip presets
PRESET_T1_RAINBOW: Final = "t1_rainbow"
PRESET_T1_HEARTBEAT: Final = "t1_heartbeat"
PRESET_T1_GALA: Final = "t1_gala"
PRESET_T1_SEA_OF_FLOWERS: Final = "t1_sea_of_flowers"
PRESET_T1_RHYTHMIC: Final = "t1_rhythmic"
PRESET_T1_EXCITING: Final = "t1_exciting"
PRESET_T1_COLORFUL: Final = "t1_colorful"

# Preset definitions
EFFECT_PRESETS: Final = {
    # T2 Bulb presets
    PRESET_T2_CANDLELIGHT: {
        "name": "T2: Candlelight",
        "effect": EFFECT_T2_CANDLELIGHT,
        "colors": [[255, 125, 18]],
        "speed": 50,
        "brightness": 255,
    },
    PRESET_T2_BREATH: {
        "name": "T2: Breath",
        "effect": EFFECT_T2_BREATHING,
        "colors": [[255, 125, 18]],
        "speed": 50,
        "brightness": 255,
    },
    PRESET_T2_COLORFUL: {
        "name": "T2: Colorful",
        "effect": EFFECT_T2_FADING,
        "colors": [
            [255, 0, 0],
            [255, 125, 0],
            [255, 255, 0],
            [0, 255, 0],
            [0, 255, 255],
            [0, 0, 255],
            [255, 0, 255],
        ],
        "speed": 50,
        "brightness": 255,
    },
    PRESET_T2_SECURITY: {
        "name": "T2: Security",
        "effect": EFFECT_T2_FLASH,
        "colors": [[255, 0, 0]],
        "speed": 100,
        "brightness": 255,
    },
    # T1M presets
    PRESET_T1M_DINNER: {
        "name": "T1M: Dinner",
        "effect": EFFECT_T1M_BREATHING,
        "colors": [[255, 98, 0]],
        "speed": 50,
        "brightness": 255,
    },
    PRESET_T1M_SUNSET: {
        "name": "T1M: Sunset",
        "effect": EFFECT_T1M_FADING,
        "colors": [[255, 98, 0], [255, 0, 0]],
        "speed": 50,
        "brightness": 255,
    },
    PRESET_T1M_AUTUMN: {
        "name": "T1M: Autumn",
        "effect": EFFECT_T1M_HOPPING,
        "colors": [[255, 125, 0], [255, 0, 0]],
        "speed": 50,
        "brightness": 255,
    },
    PRESET_T1M_GALAXY: {
        "name": "T1M: Galaxy",
        "effect": EFFECT_T1M_BREATHING,
        "colors": [[0, 0, 255], [255, 0, 255]],
        "speed": 50,
        "brightness": 255,
    },
    PRESET_T1M_DAYDREAM: {
        "name": "T1M: Daydream",
        "effect": EFFECT_T1M_FLOW1,
        "colors": [[255, 0, 255], [0, 255, 255]],
        "speed": 50,
        "brightness": 255,
    },
    PRESET_T1M_HOLIDAY: {
        "name": "T1M: Holiday",
        "effect": EFFECT_T1M_FLOW2,
        "colors": [[255, 0, 0], [0, 255, 0], [0, 0, 255]],
        "speed": 50,
        "brightness": 255,
    },
    PRESET_T1M_PARTY: {
        "name": "T1M: Party",
        "effect": EFFECT_T1M_HOPPING,
        "colors": [[255, 0, 0], [255, 255, 0], [0, 255, 0], [0, 255, 255], [0, 0, 255]],
        "speed": 100,
        "brightness": 255,
    },
    PRESET_T1M_METEOR: {
        "name": "T1M: Meteor",
        "effect": EFFECT_T1M_ROLLING,
        "colors": [[0, 128, 255], [255, 0, 128]],
        "speed": 50,
        "brightness": 255,
    },
    PRESET_T1M_ALERT: {
        "name": "T1M: Alert",
        "effect": EFFECT_T1M_BREATHING,
        "colors": [[255, 0, 0], [0, 0, 255]],
        "speed": 100,
        "brightness": 255,
    },
    # T1 Strip presets (all use same decoded colors)
    PRESET_T1_RAINBOW: {
        "name": "T1 Strip: Rainbow",
        "effect": EFFECT_T1_RAINBOW1,
        "colors": [
            [163, 214, 84],
            [122, 76, 204],
            [153, 153, 38],
            [102, 15, 92],
            [104, 245, 127],
            [255, 56, 81],
            [81, 232, 81],
        ],
        "speed": 50,
        "brightness": 255,
    },
    PRESET_T1_HEARTBEAT: {
        "name": "T1 Strip: Heartbeat",
        "effect": EFFECT_T1_BREATHING,
        "colors": [
            [163, 214, 84],
            [122, 76, 204],
            [153, 153, 38],
            [102, 15, 92],
            [104, 245, 127],
            [255, 56, 81],
            [81, 232, 81],
        ],
        "speed": 50,
        "brightness": 255,
    },
    PRESET_T1_GALA: {
        "name": "T1 Strip: Gala",
        "effect": EFFECT_T1_CHASING,
        "colors": [
            [163, 214, 84],
            [122, 76, 204],
            [153, 153, 38],
            [102, 15, 92],
            [104, 245, 127],
            [255, 56, 81],
            [81, 232, 81],
        ],
        "speed": 50,
        "brightness": 255,
    },
    PRESET_T1_SEA_OF_FLOWERS: {
        "name": "T1 Strip: Sea of flowers",
        "effect": EFFECT_T1_HOPPING,
        "colors": [
            [163, 214, 84],
            [122, 76, 204],
            [153, 153, 38],
            [102, 15, 92],
            [104, 245, 127],
            [255, 56, 81],
            [81, 232, 81],
        ],
        "speed": 50,
        "brightness": 255,
    },
    PRESET_T1_RHYTHMIC: {
        "name": "T1 Strip: Rhythmic",
        "effect": EFFECT_T1_FLASH,
        "colors": [
            [163, 214, 84],
            [122, 76, 204],
            [153, 153, 38],
            [102, 15, 92],
            [104, 245, 127],
            [255, 56, 81],
            [81, 232, 81],
        ],
        "speed": 50,
        "brightness": 255,
    },
    PRESET_T1_EXCITING: {
        "name": "T1 Strip: Exciting",
        "effect": EFFECT_T1_DASH,
        "colors": [
            [163, 214, 84],
            [122, 76, 204],
            [153, 153, 38],
            [102, 15, 92],
            [104, 245, 127],
            [255, 56, 81],
            [81, 232, 81],
        ],
        "speed": 100,
        "brightness": 255,
    },
    PRESET_T1_COLORFUL: {
        "name": "T1 Strip: Colorful",
        "effect": EFFECT_T1_RAINBOW2,
        "colors": [
            [163, 214, 84],
            [122, 76, 204],
            [153, 153, 38],
            [102, 15, 92],
            [104, 245, 127],
            [255, 56, 81],
            [81, 232, 81],
        ],
        "speed": 50,
        "brightness": 255,
    },
}