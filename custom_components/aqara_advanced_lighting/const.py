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
        "device_types": [MODEL_T2_BULB_E26, MODEL_T2_BULB_E27, MODEL_T2_BULB_GU10_110V, MODEL_T2_BULB_GU10_230V],
    },
    PRESET_T2_BREATH: {
        "name": "T2: Breath",
        "effect": EFFECT_T2_BREATHING,
        "colors": [[255, 125, 18]],
        "speed": 50,
        "brightness": 255,
        "device_types": [MODEL_T2_BULB_E26, MODEL_T2_BULB_E27, MODEL_T2_BULB_GU10_110V, MODEL_T2_BULB_GU10_230V],
    },
    PRESET_T2_COLORFUL: {
        "name": "T2: Colorful",
        "effect": EFFECT_T2_FADING,
        "colors": [
            [92, 87, 255],
            [0, 187, 255],
            [51, 255, 153],
            [204, 255, 51],
            [255, 102, 204],
            [255, 51, 51],
            [170, 0, 255],
        ],
        "speed": 50,
        "brightness": 255,
        "device_types": [MODEL_T2_BULB_E26, MODEL_T2_BULB_E27, MODEL_T2_BULB_GU10_110V, MODEL_T2_BULB_GU10_230V],
    },
    PRESET_T2_SECURITY: {
        "name": "T2: Security",
        "effect": EFFECT_T2_FLASH,
        "colors": [[255, 0, 0]],
        "speed": 100,
        "brightness": 255,
        "device_types": [MODEL_T2_BULB_E26, MODEL_T2_BULB_E27, MODEL_T2_BULB_GU10_110V, MODEL_T2_BULB_GU10_230V],
    },
    # T1M presets
    PRESET_T1M_DINNER: {
        "name": "T1M: Dinner",
        "effect": EFFECT_T1M_FLOW1,
        "colors": [[214, 235, 255], [92, 86, 255], [93, 0, 255]],
        "speed": 75,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
    },
    PRESET_T1M_SUNSET: {
        "name": "T1M: Sunset",
        "effect": EFFECT_T1M_FLOW2,
        "colors": [[255, 0, 0], [255, 138, 138], [179, 191, 255], [0, 0, 255]],
        "speed": 10,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
    },
    PRESET_T1M_AUTUMN: {
        "name": "T1M: Autumn",
        "effect": EFFECT_T1M_FLOW1,
        "colors": [[255, 71, 0], [255, 119, 0], [255, 154, 0], [255, 225, 0]],
        "speed": 60,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
    },
    PRESET_T1M_GALAXY: {
        "name": "T1M: Galaxy",
        "effect": EFFECT_T1M_FADING,
        "colors": [[0, 137, 255], [198, 0, 255], [255, 0, 255], [0, 0, 255]],
        "speed": 40,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
    },
    PRESET_T1M_DAYDREAM: {
        "name": "T1M: Daydream",
        "effect": EFFECT_T1M_FADING,
        "colors": [[255, 0, 0], [255, 155, 143], [255, 0, 255], [255, 163, 249]],
        "speed": 70,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
    },
    PRESET_T1M_HOLIDAY: {
        "name": "T1M: Holiday",
        "effect": EFFECT_T1M_BREATHING,
        "colors": [[7, 255, 36], [255, 97, 0], [55, 184, 255], [0, 6, 255]],
        "speed": 10,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
    },
    PRESET_T1M_PARTY: {
        "name": "T1M: Party",
        "effect": EFFECT_T1M_HOPPING,
        "colors": [[255, 0, 0], [255, 94, 0], [255, 255, 0], [255, 0, 255], [0, 255, 255], [0, 0, 255], [255, 0, 255]],
        "speed": 50,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
    },
    PRESET_T1M_METEOR: {
        "name": "T1M: Meteor",
        "effect": EFFECT_T1M_ROLLING,
        "colors": [[255, 148, 0], [89, 255, 0], [0, 255, 252], [175, 7, 255]],
        "speed": 50,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
    },
    PRESET_T1M_ALERT: {
        "name": "T1M: Alert",
        "effect": EFFECT_T1M_HOPPING,
        "colors": [[255, 0, 0]],
        "speed": 100,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
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
        "speed": 60,
        "brightness": 255,
        "device_types": [MODEL_T1_STRIP],
    },
    PRESET_T1_HEARTBEAT: {
        "name": "T1 Strip: Heartbeat",
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
        "speed": 60,
        "brightness": 255,
        "device_types": [MODEL_T1_STRIP],
    },
    PRESET_T1_GALA: {
        "name": "T1 Strip: Gala",
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
        "speed": 85,
        "brightness": 255,
        "device_types": [MODEL_T1_STRIP],
    },
    PRESET_T1_SEA_OF_FLOWERS: {
        "name": "T1 Strip: Sea of flowers",
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
        "device_types": [MODEL_T1_STRIP],
    },
    PRESET_T1_RHYTHMIC: {
        "name": "T1 Strip: Rhythmic",
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
        "device_types": [MODEL_T1_STRIP],
    },
    PRESET_T1_EXCITING: {
        "name": "T1 Strip: Exciting",
        "effect": EFFECT_T1_FLICKER,
        "colors": [
            [163, 214, 84],
            [122, 76, 204],
            [153, 153, 38],
            [102, 15, 92],
            [104, 245, 127],
            [255, 56, 81],
            [81, 232, 81],
        ],
        "speed": 40,
        "brightness": 255,
        "device_types": [MODEL_T1_STRIP],
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
        "speed": 60,
        "brightness": 255,
        "device_types": [MODEL_T1_STRIP],
    },
}

# T1M Segment pattern presets
PRESET_T1M_SEGMENT_1: Final = "t1m_segment_1"
PRESET_T1M_SEGMENT_2: Final = "t1m_segment_2"
PRESET_T1M_SEGMENT_3: Final = "t1m_segment_3"
PRESET_T1M_SEGMENT_4: Final = "t1m_segment_4"
PRESET_T1M_SEGMENT_5: Final = "t1m_segment_5"
PRESET_T1M_SEGMENT_6: Final = "t1m_segment_6"
PRESET_T1M_SEGMENT_7: Final = "t1m_segment_7"
PRESET_T1M_SEGMENT_8: Final = "t1m_segment_8"
PRESET_T1M_SEGMENT_9: Final = "t1m_segment_9"
PRESET_T1M_SEGMENT_10: Final = "t1m_segment_10"
PRESET_T1M_SEGMENT_11: Final = "t1m_segment_11"
PRESET_T1M_SEGMENT_12: Final = "t1m_segment_12"

# T1M Segment pattern preset definitions
SEGMENT_PATTERN_PRESETS: Final = {
    PRESET_T1M_SEGMENT_1: {
        "name": "T1M Segment: Preset 1",
        "icon": "preset_01.svg",
        "segments": [
            [255, 205, 213], [255, 205, 213], [255, 205, 213], [255, 205, 213],
            [255, 205, 213], [255, 205, 213], [255, 205, 213], [255, 176, 190],
            [255, 176, 190], [255, 176, 190], [255, 176, 190], [255, 176, 190],
            [255, 176, 190], [255, 88, 136], [255, 88, 136], [255, 88, 136],
            [255, 88, 136], [255, 88, 136], [255, 88, 136], [255, 88, 136],
            [227, 57, 72], [227, 57, 72], [227, 57, 72], [227, 57, 72],
            [227, 57, 72], [227, 57, 72],
        ],
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT, MODEL_T1_STRIP],
    },
    PRESET_T1M_SEGMENT_2: {
        "name": "T1M Segment: Preset 2",
        "icon": "preset_02.svg",
        "segments": [
            [255, 235, 193], [255, 235, 193], [255, 235, 193], [255, 235, 193],
            [255, 235, 193], [255, 235, 193], [255, 235, 193], [255, 200, 111],
            [255, 200, 111], [255, 200, 111], [255, 200, 111], [255, 200, 111],
            [255, 200, 111], [255, 153, 29], [255, 153, 29], [255, 153, 29],
            [255, 153, 29], [255, 153, 29], [255, 153, 29], [255, 153, 29],
            [251, 125, 28], [251, 125, 28], [251, 125, 28], [251, 125, 28],
            [251, 125, 28], [251, 125, 28],
        ],
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT, MODEL_T1_STRIP],
    },
    PRESET_T1M_SEGMENT_3: {
        "name": "T1M Segment: Preset 3",
        "icon": "preset_03.svg",
        "segments": [
            [129, 235, 254], [129, 235, 254], [129, 235, 254], [129, 235, 254],
            [129, 235, 254], [129, 235, 254], [129, 235, 254], [108, 198, 251],
            [108, 198, 251], [108, 198, 251], [108, 198, 251], [108, 198, 251],
            [108, 198, 251], [26, 152, 249], [26, 152, 249], [26, 152, 249],
            [26, 152, 249], [26, 152, 249], [26, 152, 249], [26, 152, 249],
            [40, 137, 243], [40, 137, 243], [40, 137, 243], [40, 137, 243],
            [40, 137, 243], [40, 137, 243],
        ],
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT, MODEL_T1_STRIP],
    },
    PRESET_T1M_SEGMENT_4: {
        "name": "T1M Segment: Preset 4",
        "icon": "preset_04.svg",
        "segments": [
            [233, 202, 249], [233, 202, 249], [233, 202, 249], [233, 202, 249],
            [233, 202, 249], [233, 202, 249], [233, 202, 249], [199, 142, 237],
            [199, 142, 237], [199, 142, 237], [199, 142, 237], [199, 142, 237],
            [199, 142, 237], [162, 88, 255], [162, 88, 255], [162, 88, 255],
            [162, 88, 255], [162, 88, 255], [162, 88, 255], [162, 88, 255],
            [149, 70, 226], [149, 70, 226], [149, 70, 226], [149, 70, 226],
            [149, 70, 226], [149, 70, 226],
        ],
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT, MODEL_T1_STRIP],
    },
    PRESET_T1M_SEGMENT_5: {
        "name": "T1M Segment: Preset 5",
        "icon": "preset_05.svg",
        "segments": [
            [255, 83, 74], [255, 83, 74], [255, 83, 74], [255, 83, 74],
            [255, 83, 74], [255, 83, 74], [255, 83, 74], [255, 236, 112],
            [255, 236, 112], [255, 236, 112], [255, 236, 112], [255, 236, 112],
            [255, 236, 112], [127, 222, 150], [127, 222, 150], [127, 222, 150],
            [127, 222, 150], [127, 222, 150], [127, 222, 150], [127, 222, 150],
            [255, 135, 29], [255, 135, 29], [255, 135, 29], [255, 135, 29],
            [255, 135, 29], [255, 135, 29],
        ],
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT, MODEL_T1_STRIP],
    },
    PRESET_T1M_SEGMENT_6: {
        "name": "T1M Segment: Preset 6",
        "icon": "preset_06.svg",
        "segments": [
            [26, 152, 249], [26, 152, 249], [26, 152, 249], [26, 152, 249],
            [26, 152, 249], [26, 152, 249], [255, 88, 136], [255, 88, 136],
            [255, 88, 136], [255, 88, 136], [255, 88, 136], [255, 88, 136],
            [255, 88, 136], [255, 210, 30], [255, 210, 30], [255, 210, 30],
            [255, 210, 30], [255, 210, 30], [255, 210, 30], [180, 114, 232],
            [180, 114, 232], [180, 114, 232], [180, 114, 232], [180, 114, 232],
            [180, 114, 232], [180, 114, 232],
        ],
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT, MODEL_T1_STRIP],
    },
    PRESET_T1M_SEGMENT_7: {
        "name": "T1M Segment: Preset 7",
        "icon": "preset_07.svg",
        "segments": [
            [167, 188, 255], [167, 188, 255], [167, 188, 255], [167, 188, 255],
            [167, 188, 255], [167, 188, 255], [198, 234, 94], [198, 234, 94],
            [198, 234, 94], [198, 234, 94], [198, 234, 94], [255, 194, 95],
            [255, 194, 95], [255, 194, 95], [255, 194, 95], [255, 194, 95],
            [255, 134, 125], [255, 134, 125], [255, 134, 125], [255, 134, 125],
            [255, 134, 125], [70, 96, 255], [70, 96, 255], [70, 96, 255],
            [70, 96, 255], [70, 96, 255],
        ],
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT, MODEL_T1_STRIP],
    },
    PRESET_T1M_SEGMENT_8: {
        "name": "T1M Segment: Preset 8",
        "icon": "preset_08.svg",
        "segments": [
            [255, 221, 50], [255, 221, 50], [255, 221, 50], [255, 221, 50],
            [255, 221, 50], [138, 214, 252], [138, 214, 252], [138, 214, 252],
            [138, 214, 252], [138, 214, 252], [0, 140, 248], [0, 140, 248],
            [0, 140, 248], [0, 140, 248], [0, 140, 248], [146, 104, 232],
            [146, 104, 232], [146, 104, 232], [146, 104, 232], [146, 104, 232],
            [213, 162, 242], [213, 162, 242], [213, 162, 242], [213, 162, 242],
            [213, 162, 242], [213, 162, 242],
        ],
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT, MODEL_T1_STRIP],
    },
    PRESET_T1M_SEGMENT_9: {
        "name": "T1M Segment: Preset 9",
        "icon": "preset_09.svg",
        "segments": [
            [255, 134, 160], [255, 134, 160], [255, 134, 160], [255, 134, 160],
            [255, 134, 160], [198, 234, 94], [198, 234, 94], [198, 234, 94],
            [198, 234, 94], [198, 234, 94], [91, 192, 251], [91, 192, 251],
            [91, 192, 251], [91, 192, 251], [91, 192, 251], [255, 194, 95],
            [255, 194, 95], [255, 194, 95], [255, 194, 95], [255, 194, 95],
            [193, 192, 235], [193, 192, 235], [193, 192, 235], [193, 192, 235],
            [193, 192, 235], [193, 192, 235],
        ],
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT, MODEL_T1_STRIP],
    },
    PRESET_T1M_SEGMENT_10: {
        "name": "T1M Segment: Preset 10",
        "icon": "preset_10.svg",
        "segments": [
            [193, 129, 235], [193, 129, 235], [193, 129, 235], [193, 129, 235],
            [193, 129, 235], [151, 69, 222], [151, 69, 222], [151, 69, 222],
            [151, 69, 222], [151, 69, 222], [255, 69, 122], [255, 69, 122],
            [255, 69, 122], [255, 69, 122], [255, 69, 122], [255, 169, 49],
            [255, 169, 49], [255, 169, 49], [255, 169, 49], [255, 169, 49],
            [255, 215, 140], [255, 215, 140], [255, 215, 140], [255, 215, 140],
            [255, 215, 140], [255, 215, 140],
        ],
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT, MODEL_T1_STRIP],
    },
    PRESET_T1M_SEGMENT_11: {
        "name": "T1M Segment: Preset 11",
        "icon": "preset_11.svg",
        "segments": [
            [45, 168, 249], [45, 168, 249], [45, 168, 249], [45, 168, 249],
            [0, 140, 248], [0, 140, 248], [0, 140, 248], [0, 140, 248],
            [255, 244, 141], [255, 244, 141], [255, 244, 141], [255, 244, 141],
            [255, 244, 141], [255, 205, 5], [255, 205, 5], [255, 205, 5],
            [255, 205, 5], [255, 141, 3], [255, 141, 3], [255, 141, 3],
            [255, 141, 3], [185, 233, 254], [185, 233, 254], [185, 233, 254],
            [185, 233, 254], [185, 233, 254],
        ],
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT, MODEL_T1_STRIP],
    },
    PRESET_T1M_SEGMENT_12: {
        "name": "T1M Segment: Preset 12",
        "icon": "preset_12.svg",
        "segments": [
            [255, 170, 161], [255, 170, 161], [255, 170, 161], [255, 170, 161],
            [255, 134, 160], [255, 134, 160], [255, 134, 160], [255, 134, 160],
            [255, 103, 90], [255, 103, 90], [255, 103, 90], [255, 103, 90],
            [255, 103, 90], [255, 69, 122], [255, 69, 122], [255, 69, 122],
            [255, 69, 122], [224, 34, 51], [224, 34, 51], [224, 34, 51],
            [224, 34, 51], [255, 199, 208], [255, 199, 208], [255, 199, 208],
            [255, 199, 208], [255, 199, 208],
        ],
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT, MODEL_T1_STRIP],
    },
}