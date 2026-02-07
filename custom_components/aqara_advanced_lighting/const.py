"""Constants for the Aqara Advanced Lighting integration."""

from typing import Final

# Integration domain
DOMAIN: Final = "aqara_advanced_lighting"

# Configuration constants
CONF_Z2M_BASE_TOPIC: Final = "z2m_base_topic"
CONF_PRESET_FILTER: Final = "preset"
DEFAULT_Z2M_BASE_TOPIC: Final = "zigbee2mqtt"

# Service names
SERVICE_SET_DYNAMIC_EFFECT: Final = "set_dynamic_effect"
SERVICE_STOP_EFFECT: Final = "stop_effect"
SERVICE_SET_SEGMENT_PATTERN: Final = "set_segment_pattern"
SERVICE_CREATE_GRADIENT: Final = "create_gradient"
SERVICE_CREATE_BLOCKS: Final = "create_blocks"
SERVICE_START_CCT_SEQUENCE: Final = "start_cct_sequence"
SERVICE_STOP_CCT_SEQUENCE: Final = "stop_cct_sequence"
SERVICE_PAUSE_CCT_SEQUENCE: Final = "pause_cct_sequence"
SERVICE_RESUME_CCT_SEQUENCE: Final = "resume_cct_sequence"
SERVICE_START_SEGMENT_SEQUENCE: Final = "start_segment_sequence"
SERVICE_STOP_SEGMENT_SEQUENCE: Final = "stop_segment_sequence"
SERVICE_PAUSE_SEGMENT_SEQUENCE: Final = "pause_segment_sequence"
SERVICE_RESUME_SEGMENT_SEQUENCE: Final = "resume_segment_sequence"

# Group synchronization delay (seconds between commands for synced groups)
GROUP_SYNC_DELAY: Final = 0.05

# Service attributes
ATTR_Z2M_BASE_TOPIC: Final = "z2m_base_topic"
ATTR_EFFECT: Final = "effect"
ATTR_SPEED: Final = "speed"
ATTR_SYNC: Final = "sync"
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
ATTR_STEPS: Final = "steps"
ATTR_COLOR_TEMP: Final = "color_temp"
ATTR_TRANSITION: Final = "transition"
ATTR_HOLD: Final = "hold"
ATTR_LOOP_MODE: Final = "loop_mode"
ATTR_LOOP_COUNT: Final = "loop_count"
ATTR_END_BEHAVIOR: Final = "end_behavior"
ATTR_CLEAR_SEGMENTS: Final = "clear_segments"
ATTR_SKIP_FIRST_IN_LOOP: Final = "skip_first_in_loop"
ATTR_RESTORE_STATE: Final = "restore_state"
ATTR_MODE: Final = "mode"
ATTR_DURATION: Final = "duration"
ATTR_ACTIVATION_PATTERN: Final = "activation_pattern"

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
# RGB + CCT models
MODEL_T1M_20_SEGMENT: Final = "lumi.light.acn031"
MODEL_T1M_26_SEGMENT: Final = "lumi.light.acn032"
MODEL_T1_STRIP: Final = "lumi.light.acn132"
MODEL_T2_BULB_E26: Final = "lumi.light.agl001"
MODEL_T2_BULB_E27: Final = "lumi.light.agl003"
MODEL_T2_BULB_GU10_230V: Final = "lumi.light.agl005"
MODEL_T2_BULB_GU10_110V: Final = "lumi.light.agl007"
# CCT-only models (support CCT sequences only, no RGB effects)
MODEL_T2_CCT_E26: Final = "lumi.light.agl002"
MODEL_T2_CCT_E27: Final = "lumi.light.agl004"
MODEL_T2_CCT_GU10_230V: Final = "lumi.light.agl006"
MODEL_T2_CCT_GU10_110V: Final = "lumi.light.agl008"

# CIE 1931 color gamut triangles for Aqara lights
# These define the actual color space the lights can produce
# Format: [(red_x, red_y), (green_x, green_y), (blue_x, blue_y)]
AQARA_COLOR_GAMUT_T1M: Final = [(0.68, 0.31), (0.15, 0.06), (0.15, 0.70)]
AQARA_COLOR_GAMUT_T1_STRIP: Final = [(0.68, 0.31), (0.15, 0.06), (0.15, 0.70)]
AQARA_COLOR_GAMUT_T2_BULB: Final = [(0.68, 0.31), (0.15, 0.06), (0.15, 0.70)]

# Map model IDs to gamuts
AQARA_COLOR_GAMUTS: Final = {
    MODEL_T1M_20_SEGMENT: AQARA_COLOR_GAMUT_T1M,
    MODEL_T1M_26_SEGMENT: AQARA_COLOR_GAMUT_T1M,
    MODEL_T1_STRIP: AQARA_COLOR_GAMUT_T1_STRIP,
    MODEL_T2_BULB_E26: AQARA_COLOR_GAMUT_T2_BULB,
    MODEL_T2_BULB_E27: AQARA_COLOR_GAMUT_T2_BULB,
    MODEL_T2_BULB_GU10_230V: AQARA_COLOR_GAMUT_T2_BULB,
    MODEL_T2_BULB_GU10_110V: AQARA_COLOR_GAMUT_T2_BULB,
}

# Brightness constraints (UI uses percentage, devices use 1-255)
MIN_BRIGHTNESS_PERCENT: Final = 1  # Minimum percentage for UI
MAX_BRIGHTNESS_PERCENT: Final = 100  # Maximum percentage for UI
MIN_BRIGHTNESS_DEVICE: Final = 1  # Minimum value for device
MAX_BRIGHTNESS_DEVICE: Final = 255  # Maximum value for device

# CCT sequence constraints
MIN_COLOR_TEMP_KELVIN: Final = 2700
MAX_COLOR_TEMP_KELVIN: Final = 6500
MIN_TRANSITION_TIME: Final = 0.0
MAX_TRANSITION_TIME: Final = 3600.0  # 1 hour
MIN_HOLD_TIME: Final = 0.0
MAX_HOLD_TIME: Final = 43200.0  # 12 hours
MIN_SEQUENCE_STEPS: Final = 1
MAX_SEQUENCE_STEPS: Final = 20
MIN_LOOP_COUNT: Final = 1
MAX_LOOP_COUNT: Final = 100

# Smooth transition settings using light's built-in transition capability
# These values balance smoothness with command overhead
TRANSITION_STEP_INTERVAL: Final = 0.1  # Seconds between transition steps (100ms for smooth easing curve)
MIN_TRANSITION_STEPS: Final = 10  # Minimum steps for any transition (ensures smooth easing even for short transitions)

# CCT sequence loop modes
LOOP_MODE_ONCE: Final = "once"
LOOP_MODE_COUNT: Final = "count"
LOOP_MODE_CONTINUOUS: Final = "continuous"

# Sequence end behaviors (used by CCT sequences, dynamic scenes, and segment sequences)
END_BEHAVIOR_MAINTAIN: Final = "maintain"
END_BEHAVIOR_RESTORE: Final = "restore"
END_BEHAVIOR_TURN_OFF: Final = "turn_off"

# Segment sequence modes
SEGMENT_MODE_BLOCKS_REPEAT: Final = "blocks_repeat"
SEGMENT_MODE_BLOCKS_EXPAND: Final = "blocks_expand"
SEGMENT_MODE_GRADIENT: Final = "gradient"

# Segment sequence activation patterns
ACTIVATION_ALL: Final = "all"
ACTIVATION_SEQUENTIAL_FORWARD: Final = "sequential_forward"
ACTIVATION_SEQUENTIAL_REVERSE: Final = "sequential_reverse"
ACTIVATION_RANDOM: Final = "random"
ACTIVATION_PING_PONG: Final = "ping_pong"
ACTIVATION_CENTER_OUT: Final = "center_out"
ACTIVATION_EDGES_IN: Final = "edges_in"
ACTIVATION_PAIRED: Final = "paired"

# Segment sequence constraints
MIN_SEGMENT_COLORS: Final = 1
MAX_SEGMENT_COLORS: Final = 6
MIN_DURATION: Final = 0.0
MAX_DURATION: Final = 3600.0  # 1 hour

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
DATA_CCT_SEQUENCE_MANAGER: Final = "cct_sequence_manager"
DATA_SEGMENT_SEQUENCE_MANAGER: Final = "segment_sequence_manager"
DATA_FAVORITES_STORE: Final = "favorites_store"
DATA_PRESET_STORE: Final = "preset_store"
DATA_USER_PREFERENCES_STORE: Final = "user_preferences_store"
DATA_SEGMENT_ZONE_STORE: Final = "segment_zone_store"

# Valid sort options for user preferences (validated in backend)
VALID_SORT_OPTIONS: Final = {"name-asc", "name-desc", "date-new", "date-old"}

# Color history constraints
MAX_COLOR_HISTORY_SIZE: Final = 8

# User preset type constants
PRESET_TYPE_EFFECT: Final = "effect"
PRESET_TYPE_SEGMENT_PATTERN: Final = "segment_pattern"
PRESET_TYPE_CCT_SEQUENCE: Final = "cct_sequence"
PRESET_TYPE_SEGMENT_SEQUENCE: Final = "segment_sequence"

# Dynamic scene preset type
PRESET_TYPE_DYNAMIC_SCENE: Final = "dynamic_scene"

VALID_PRESET_TYPES: Final = [
    PRESET_TYPE_EFFECT,
    PRESET_TYPE_SEGMENT_PATTERN,
    PRESET_TYPE_CCT_SEQUENCE,
    PRESET_TYPE_SEGMENT_SEQUENCE,
    PRESET_TYPE_DYNAMIC_SCENE,
]

# Dynamic scene distribution modes
DISTRIBUTION_SHUFFLE_ROTATE: Final = "shuffle_rotate"
DISTRIBUTION_SYNCHRONIZED: Final = "synchronized"
DISTRIBUTION_RANDOM: Final = "random"

VALID_DISTRIBUTION_MODES: Final = [
    DISTRIBUTION_SHUFFLE_ROTATE,
    DISTRIBUTION_SYNCHRONIZED,
    DISTRIBUTION_RANDOM,
]

# Dynamic scene timing constraints (seconds)
MIN_DYNAMIC_SCENE_TRANSITION_TIME: Final = 30.0
MAX_DYNAMIC_SCENE_TRANSITION_TIME: Final = 3600.0  # 1 hour
MIN_DYNAMIC_SCENE_HOLD_TIME: Final = 0.0
MAX_DYNAMIC_SCENE_HOLD_TIME: Final = 3600.0  # 1 hour
DEFAULT_DYNAMIC_SCENE_TRANSITION_TIME: Final = 120.0  # 2 minutes
DEFAULT_DYNAMIC_SCENE_HOLD_TIME: Final = 180.0  # 3 minutes

# Dynamic scene color constraints
MIN_DYNAMIC_SCENE_COLORS: Final = 1
MAX_DYNAMIC_SCENE_COLORS: Final = 8

# Dynamic scene ripple offset constraints (seconds)
MIN_OFFSET_DELAY: Final = 0.0
MAX_OFFSET_DELAY: Final = 120.0  # 2 minutes

# Dynamic scene brightness constraints (percentage)
MIN_SCENE_BRIGHTNESS_PCT: Final = 1
MAX_SCENE_BRIGHTNESS_PCT: Final = 100
DEFAULT_SCENE_BRIGHTNESS_PCT: Final = 100

# Dynamic scene sequence type for events
SEQUENCE_TYPE_DYNAMIC_SCENE: Final = "dynamic_scene"

# Dynamic scene service names
SERVICE_START_DYNAMIC_SCENE: Final = "start_dynamic_scene"
SERVICE_STOP_DYNAMIC_SCENE: Final = "stop_dynamic_scene"
SERVICE_PAUSE_DYNAMIC_SCENE: Final = "pause_dynamic_scene"
SERVICE_RESUME_DYNAMIC_SCENE: Final = "resume_dynamic_scene"

# Dynamic scene event types
EVENT_DYNAMIC_SCENE_STARTED: Final = f"{DOMAIN}_dynamic_scene_started"
EVENT_DYNAMIC_SCENE_PAUSED: Final = f"{DOMAIN}_dynamic_scene_paused"
EVENT_DYNAMIC_SCENE_RESUMED: Final = f"{DOMAIN}_dynamic_scene_resumed"
EVENT_DYNAMIC_SCENE_STOPPED: Final = f"{DOMAIN}_dynamic_scene_stopped"
EVENT_DYNAMIC_SCENE_LOOP_COMPLETED: Final = f"{DOMAIN}_dynamic_scene_loop_completed"
EVENT_DYNAMIC_SCENE_FINISHED: Final = f"{DOMAIN}_dynamic_scene_finished"

# Dynamic scene runtime data key
DATA_DYNAMIC_SCENE_MANAGER: Final = "dynamic_scene_manager"

# Entity controller constants
INTEGRATION_CONTEXT_PARENT_ID: Final = "aal_entity_control"
DATA_ENTITY_CONTROLLER: Final = "entity_controller"
EVENT_ENTITY_EXTERNALLY_CONTROLLED: Final = f"{DOMAIN}_entity_externally_controlled"
EVENT_ENTITY_CONTROL_RESUMED: Final = f"{DOMAIN}_entity_control_resumed"
SERVICE_RESUME_ENTITY_CONTROL: Final = "resume_entity_control"

# Event types for automation triggers
EVENT_SEQUENCE_STARTED: Final = f"{DOMAIN}_sequence_started"
EVENT_SEQUENCE_COMPLETED: Final = f"{DOMAIN}_sequence_completed"
EVENT_SEQUENCE_STOPPED: Final = f"{DOMAIN}_sequence_stopped"
EVENT_STEP_CHANGED: Final = f"{DOMAIN}_step_changed"
EVENT_SEQUENCE_PAUSED: Final = f"{DOMAIN}_sequence_paused"
EVENT_SEQUENCE_RESUMED: Final = f"{DOMAIN}_sequence_resumed"
EVENT_EFFECT_ACTIVATED: Final = f"{DOMAIN}_effect_activated"
EVENT_EFFECT_STOPPED: Final = f"{DOMAIN}_effect_stopped"

# Event data keys
EVENT_ATTR_ENTITY_ID: Final = "entity_id"
EVENT_ATTR_SEQUENCE_ID: Final = "sequence_id"
EVENT_ATTR_STEP_INDEX: Final = "step_index"
EVENT_ATTR_TOTAL_STEPS: Final = "total_steps"
EVENT_ATTR_LOOP_ITERATION: Final = "loop_iteration"
EVENT_ATTR_EFFECT_TYPE: Final = "effect_type"
EVENT_ATTR_PRESET: Final = "preset"
EVENT_ATTR_REASON: Final = "reason"
EVENT_ATTR_SEQUENCE_TYPE: Final = "sequence_type"

# Sequence type values (used in event data to distinguish CCT from segment sequences)
SEQUENCE_TYPE_CCT: Final = "cct"
SEQUENCE_TYPE_SEGMENT: Final = "segment"

# Device trigger types for HA automation UI
TRIGGER_TYPE_CCT_SEQUENCE_STARTED: Final = "cct_sequence_started"
TRIGGER_TYPE_CCT_SEQUENCE_COMPLETED: Final = "cct_sequence_completed"
TRIGGER_TYPE_CCT_SEQUENCE_STOPPED: Final = "cct_sequence_stopped"
TRIGGER_TYPE_CCT_SEQUENCE_STEP_CHANGED: Final = "cct_sequence_step_changed"
TRIGGER_TYPE_SEGMENT_SEQUENCE_STARTED: Final = "segment_sequence_started"
TRIGGER_TYPE_SEGMENT_SEQUENCE_COMPLETED: Final = "segment_sequence_completed"
TRIGGER_TYPE_SEGMENT_SEQUENCE_STOPPED: Final = "segment_sequence_stopped"
TRIGGER_TYPE_SEGMENT_SEQUENCE_STEP_CHANGED: Final = "segment_sequence_step_changed"
TRIGGER_TYPE_CCT_SEQUENCE_PAUSED: Final = "cct_sequence_paused"
TRIGGER_TYPE_CCT_SEQUENCE_RESUMED: Final = "cct_sequence_resumed"
TRIGGER_TYPE_SEGMENT_SEQUENCE_PAUSED: Final = "segment_sequence_paused"
TRIGGER_TYPE_SEGMENT_SEQUENCE_RESUMED: Final = "segment_sequence_resumed"
TRIGGER_TYPE_EFFECT_ACTIVATED: Final = "effect_activated"
TRIGGER_TYPE_EFFECT_STOPPED: Final = "effect_stopped"
TRIGGER_TYPE_DYNAMIC_SCENE_STARTED: Final = "dynamic_scene_started"
TRIGGER_TYPE_DYNAMIC_SCENE_PAUSED: Final = "dynamic_scene_paused"
TRIGGER_TYPE_DYNAMIC_SCENE_RESUMED: Final = "dynamic_scene_resumed"
TRIGGER_TYPE_DYNAMIC_SCENE_STOPPED: Final = "dynamic_scene_stopped"
TRIGGER_TYPE_DYNAMIC_SCENE_LOOP_COMPLETED: Final = "dynamic_scene_loop_completed"
TRIGGER_TYPE_DYNAMIC_SCENE_FINISHED: Final = "dynamic_scene_finished"

# All device trigger types
TRIGGER_TYPES: Final = {
    TRIGGER_TYPE_CCT_SEQUENCE_STARTED,
    TRIGGER_TYPE_CCT_SEQUENCE_COMPLETED,
    TRIGGER_TYPE_CCT_SEQUENCE_STOPPED,
    TRIGGER_TYPE_CCT_SEQUENCE_STEP_CHANGED,
    TRIGGER_TYPE_CCT_SEQUENCE_PAUSED,
    TRIGGER_TYPE_CCT_SEQUENCE_RESUMED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STARTED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_COMPLETED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STOPPED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STEP_CHANGED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_PAUSED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_RESUMED,
    TRIGGER_TYPE_EFFECT_ACTIVATED,
    TRIGGER_TYPE_EFFECT_STOPPED,
    TRIGGER_TYPE_DYNAMIC_SCENE_STARTED,
    TRIGGER_TYPE_DYNAMIC_SCENE_PAUSED,
    TRIGGER_TYPE_DYNAMIC_SCENE_RESUMED,
    TRIGGER_TYPE_DYNAMIC_SCENE_STOPPED,
    TRIGGER_TYPE_DYNAMIC_SCENE_LOOP_COMPLETED,
    TRIGGER_TYPE_DYNAMIC_SCENE_FINISHED,
}

# Trigger type groupings for preset filtering
CCT_TRIGGER_TYPES: Final = {
    TRIGGER_TYPE_CCT_SEQUENCE_STARTED,
    TRIGGER_TYPE_CCT_SEQUENCE_COMPLETED,
    TRIGGER_TYPE_CCT_SEQUENCE_STOPPED,
    TRIGGER_TYPE_CCT_SEQUENCE_STEP_CHANGED,
    TRIGGER_TYPE_CCT_SEQUENCE_PAUSED,
    TRIGGER_TYPE_CCT_SEQUENCE_RESUMED,
}

SEGMENT_TRIGGER_TYPES: Final = {
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STARTED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_COMPLETED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STOPPED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_STEP_CHANGED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_PAUSED,
    TRIGGER_TYPE_SEGMENT_SEQUENCE_RESUMED,
}

EFFECT_TRIGGER_TYPES: Final = {
    TRIGGER_TYPE_EFFECT_ACTIVATED,
    TRIGGER_TYPE_EFFECT_STOPPED,
}

DYNAMIC_SCENE_TRIGGER_TYPES: Final = {
    TRIGGER_TYPE_DYNAMIC_SCENE_STARTED,
    TRIGGER_TYPE_DYNAMIC_SCENE_PAUSED,
    TRIGGER_TYPE_DYNAMIC_SCENE_RESUMED,
    TRIGGER_TYPE_DYNAMIC_SCENE_STOPPED,
    TRIGGER_TYPE_DYNAMIC_SCENE_LOOP_COMPLETED,
    TRIGGER_TYPE_DYNAMIC_SCENE_FINISHED,
}

# Device condition types for HA automation UI
CONDITION_TYPE_CCT_SEQUENCE_RUNNING: Final = "cct_sequence_running"
CONDITION_TYPE_CCT_SEQUENCE_PAUSED: Final = "cct_sequence_paused"
CONDITION_TYPE_SEGMENT_SEQUENCE_RUNNING: Final = "segment_sequence_running"
CONDITION_TYPE_SEGMENT_SEQUENCE_PAUSED: Final = "segment_sequence_paused"
CONDITION_TYPE_EFFECT_ACTIVE: Final = "effect_active"
CONDITION_TYPE_DYNAMIC_SCENE_RUNNING: Final = "dynamic_scene_running"
CONDITION_TYPE_DYNAMIC_SCENE_PAUSED: Final = "dynamic_scene_paused"

# All device condition types
CONDITION_TYPES: Final = {
    CONDITION_TYPE_CCT_SEQUENCE_RUNNING,
    CONDITION_TYPE_CCT_SEQUENCE_PAUSED,
    CONDITION_TYPE_SEGMENT_SEQUENCE_RUNNING,
    CONDITION_TYPE_SEGMENT_SEQUENCE_PAUSED,
    CONDITION_TYPE_EFFECT_ACTIVE,
    CONDITION_TYPE_DYNAMIC_SCENE_RUNNING,
    CONDITION_TYPE_DYNAMIC_SCENE_PAUSED,
}

# Condition type groupings for preset filtering
CCT_CONDITION_TYPES: Final = {
    CONDITION_TYPE_CCT_SEQUENCE_RUNNING,
    CONDITION_TYPE_CCT_SEQUENCE_PAUSED,
}

SEGMENT_CONDITION_TYPES: Final = {
    CONDITION_TYPE_SEGMENT_SEQUENCE_RUNNING,
    CONDITION_TYPE_SEGMENT_SEQUENCE_PAUSED,
}

EFFECT_CONDITION_TYPES: Final = {
    CONDITION_TYPE_EFFECT_ACTIVE,
}

DYNAMIC_SCENE_CONDITION_TYPES: Final = {
    CONDITION_TYPE_DYNAMIC_SCENE_RUNNING,
    CONDITION_TYPE_DYNAMIC_SCENE_PAUSED,
}

# Friendly model names for device registry display
MODEL_FRIENDLY_NAMES: Final = {
    MODEL_T1M_20_SEGMENT: "T1M ceiling light (20 segments)",
    MODEL_T1M_26_SEGMENT: "T1M ceiling light (26 segments)",
    MODEL_T1_STRIP: "T1 LED strip",
    MODEL_T2_BULB_E26: "T2 RGB+CCT bulb (E26)",
    MODEL_T2_BULB_E27: "T2 RGB+CCT bulb (E27)",
    MODEL_T2_BULB_GU10_230V: "T2 RGB+CCT bulb (GU10 230V)",
    MODEL_T2_BULB_GU10_110V: "T2 RGB+CCT bulb (GU10 110V)",
    MODEL_T2_CCT_E26: "T2 CCT bulb (E26)",
    MODEL_T2_CCT_E27: "T2 CCT bulb (E27)",
    MODEL_T2_CCT_GU10_230V: "T2 CCT bulb (GU10 230V)",
    MODEL_T2_CCT_GU10_110V: "T2 CCT bulb (GU10 110V)",
}

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
PRESET_T1_STRIP_RAINBOW: Final = "t1_strip_rainbow"
PRESET_T1_STRIP_HEARTBEAT: Final = "t1_strip_heartbeat"
PRESET_T1_STRIP_GALA: Final = "t1_strip_gala"
PRESET_T1_STRIP_SEA_OF_FLOWERS: Final = "t1_strip_sea_of_flowers"
PRESET_T1_STRIP_RHYTHMIC: Final = "t1_strip_rhythmic"
PRESET_T1_STRIP_EXCITING: Final = "t1_strip_exciting"
PRESET_T1_STRIP_COLORFUL: Final = "t1_strip_colorful"

# CCT sequence presets
PRESET_CCT_GOODNIGHT: Final = "goodnight"
PRESET_CCT_WAKEUP: Final = "wakeup"
PRESET_CCT_MINDFUL_BREATHING: Final = "mindful_breathing"
PRESET_CCT_CIRCADIAN: Final = "circadian"

# Preset definitions
EFFECT_PRESETS: Final = {
    # T2 Bulb presets
    PRESET_T2_CANDLELIGHT: {
        "name": "Candlelight",
        "icon": "mdi:candle",
        "effect": EFFECT_T2_CANDLELIGHT,
        "colors": [[255, 125, 18]],
        "speed": 50,
        "brightness": 255,
        "device_types": [MODEL_T2_BULB_E26, MODEL_T2_BULB_E27, MODEL_T2_BULB_GU10_110V, MODEL_T2_BULB_GU10_230V],
    },
    PRESET_T2_BREATH: {
        "name": "Breath",
        "icon": "mdi:meditation",
        "effect": EFFECT_T2_BREATHING,
        "colors": [[255, 125, 18]],
        "speed": 50,
        "brightness": 255,
        "device_types": [MODEL_T2_BULB_E26, MODEL_T2_BULB_E27, MODEL_T2_BULB_GU10_110V, MODEL_T2_BULB_GU10_230V],
    },
    PRESET_T2_COLORFUL: {
        "name": "Colorful",
        "icon": "mdi:palette",
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
        "name": "Security",
        "icon": "mdi:shield-alert",
        "effect": EFFECT_T2_FLASH,
        "colors": [[255, 0, 0]],
        "speed": 100,
        "brightness": 255,
        "device_types": [MODEL_T2_BULB_E26, MODEL_T2_BULB_E27, MODEL_T2_BULB_GU10_110V, MODEL_T2_BULB_GU10_230V],
    },
    # T1M presets
    PRESET_T1M_DINNER: {
        "name": "Dinner",
        "icon": "mdi:silverware-fork-knife",
        "effect": EFFECT_T1M_FLOW1,
        "colors": [[214, 235, 255], [92, 86, 255], [93, 0, 255]],
        "speed": 75,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
    },
    PRESET_T1M_SUNSET: {
        "name": "Sunset",
        "icon": "mdi:weather-sunset",
        "effect": EFFECT_T1M_FLOW2,
        "colors": [[255, 0, 0], [255, 138, 138], [179, 191, 255], [0, 0, 255]],
        "speed": 10,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
    },
    PRESET_T1M_AUTUMN: {
        "name": "Autumn",
        "icon": "mdi:leaf-maple",
        "effect": EFFECT_T1M_FLOW1,
        "colors": [[255, 71, 0], [255, 119, 0], [255, 154, 0], [255, 225, 0]],
        "speed": 60,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
    },
    PRESET_T1M_GALAXY: {
        "name": "Galaxy",
        "icon": "mdi:star-circle",
        "effect": EFFECT_T1M_FADING,
        "colors": [[0, 137, 255], [198, 0, 255], [255, 0, 255], [0, 0, 255]],
        "speed": 40,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
    },
    PRESET_T1M_DAYDREAM: {
        "name": "Daydream",
        "icon": "mdi:cloud",
        "effect": EFFECT_T1M_FADING,
        "colors": [[255, 0, 0], [255, 155, 143], [255, 0, 255], [255, 163, 249]],
        "speed": 70,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
    },
    PRESET_T1M_HOLIDAY: {
        "name": "Holiday",
        "icon": "mdi:pine-tree",
        "effect": EFFECT_T1M_BREATHING,
        "colors": [[7, 255, 36], [255, 97, 0], [55, 184, 255], [0, 6, 255]],
        "speed": 10,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
    },
    PRESET_T1M_PARTY: {
        "name": "Party",
        "icon": "mdi:party-popper",
        "effect": EFFECT_T1M_HOPPING,
        "colors": [[255, 0, 0], [255, 94, 0], [255, 255, 0], [255, 0, 255], [0, 255, 255], [0, 0, 255], [255, 0, 255]],
        "speed": 50,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
    },
    PRESET_T1M_METEOR: {
        "name": "Meteor",
        "icon": "mdi:meteor",
        "effect": EFFECT_T1M_ROLLING,
        "colors": [[255, 148, 0], [89, 255, 0], [0, 255, 252], [175, 7, 255]],
        "speed": 50,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
    },
    PRESET_T1M_ALERT: {
        "name": "Alert",
        "icon": "mdi:alert",
        "effect": EFFECT_T1M_HOPPING,
        "colors": [[255, 0, 0]],
        "speed": 100,
        "brightness": 255,
        "device_types": [MODEL_T1M_20_SEGMENT, MODEL_T1M_26_SEGMENT],
    },
    # T1 Strip presets (all use same decoded colors)
    PRESET_T1_STRIP_RAINBOW: {
        "name": "Rainbow",
        "icon": "mdi:looks",
        "effect": EFFECT_T1_RAINBOW1,
        "colors": [
            [255, 0, 0],      # Red
            [255, 255, 0],    # Yellow
            [255, 192, 203],  # Pink
            [0, 255, 0],      # Green
            [128, 0, 128],    # Purple
            [255, 127, 0],    # Orange
            [0, 0, 255],      # Blue
        ],
        "speed": 60,
        "brightness": 255,
        "device_types": [MODEL_T1_STRIP],
    },
    PRESET_T1_STRIP_HEARTBEAT: {
        "name": "Heartbeat",
        "icon": "mdi:heart-pulse",
        "effect": EFFECT_T1_FLASH,
        "colors": [
            [139, 0, 0],      # Dark red
            [220, 20, 60],    # Crimson
            [255, 0, 0],      # Red
            [255, 69, 0],     # Red-orange
            [255, 99, 71],    # Tomato
        ],
        "speed": 60,
        "brightness": 255,
        "device_types": [MODEL_T1_STRIP],
    },
    PRESET_T1_STRIP_GALA: {
        "name": "Gala",
        "icon": "mdi:party-popper",
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
    PRESET_T1_STRIP_SEA_OF_FLOWERS: {
        "name": "Sea of flowers",
        "icon": "mdi:flower",
        "effect": EFFECT_T1_CHASING,
        "colors": [
            [135, 206, 235],  # Sky blue
            [64, 224, 208],   # Turquoise
            [255, 255, 0],    # Yellow
            [144, 238, 144],  # Light green
            [0, 100, 0],      # Dark green
            [0, 0, 139],      # Dark blue
            [173, 255, 47],   # Green-yellow
        ],
        "speed": 50,
        "brightness": 255,
        "device_types": [MODEL_T1_STRIP],
    },
    PRESET_T1_STRIP_RHYTHMIC: {
        "name": "Rhythmic",
        "icon": "mdi:sine-wave",
        "effect": EFFECT_T1_HOPPING,
        "colors": [
            [255, 0, 0],      # Red
            [255, 69, 0],     # Red-orange
            [255, 140, 0],    # Dark orange
            [255, 165, 0],    # Orange
            [255, 215, 0],    # Gold
            [255, 255, 0],    # Yellow
            [255, 200, 0],    # Golden yellow
        ],
        "speed": 50,
        "brightness": 255,
        "device_types": [MODEL_T1_STRIP],
    },
    PRESET_T1_STRIP_EXCITING: {
        "name": "Exciting",
        "icon": "mdi:flash",
        "effect": EFFECT_T1_FLICKER,
        "colors": [
            [255, 255, 255],  # White
            [255, 0, 0],      # Red
            [0, 0, 255],      # Blue
        ],
        "speed": 40,
        "brightness": 255,
        "device_types": [MODEL_T1_STRIP],
    },
    PRESET_T1_STRIP_COLORFUL: {
        "name": "Colorful",
        "icon": "mdi:palette",
        "effect": EFFECT_T1_RAINBOW2,
        "colors": [
            [255, 0, 0],      # Red
            [0, 255, 0],      # Green
            [0, 0, 255],      # Blue
            [255, 255, 0],    # Yellow
            [0, 255, 255],    # Cyan
            [255, 0, 255],    # Magenta
            [255, 128, 0],    # Orange (secondary)
        ],
        "speed": 60,
        "brightness": 255,
        "device_types": [MODEL_T1_STRIP],
    },
}

# Segment pattern presets (T1M and T1 Strip)
PRESET_SEGMENT_1: Final = "segment_1"
PRESET_SEGMENT_2: Final = "segment_2"
PRESET_SEGMENT_3: Final = "segment_3"
PRESET_SEGMENT_4: Final = "segment_4"
PRESET_SEGMENT_5: Final = "segment_5"
PRESET_SEGMENT_6: Final = "segment_6"
PRESET_SEGMENT_7: Final = "segment_7"
PRESET_SEGMENT_8: Final = "segment_8"
PRESET_SEGMENT_9: Final = "segment_9"
PRESET_SEGMENT_10: Final = "segment_10"
PRESET_SEGMENT_11: Final = "segment_11"
PRESET_SEGMENT_12: Final = "segment_12"

# Segment pattern preset definitions (T1M and T1 Strip)
SEGMENT_PATTERN_PRESETS: Final = {
    PRESET_SEGMENT_1: {
        "name": "Preset 1",
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
    PRESET_SEGMENT_2: {
        "name": "Preset 2",
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
    PRESET_SEGMENT_3: {
        "name": "Preset 3",
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
    PRESET_SEGMENT_4: {
        "name": "Preset 4",
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
    PRESET_SEGMENT_5: {
        "name": "Preset 5",
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
    PRESET_SEGMENT_6: {
        "name": "Preset 6",
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
    PRESET_SEGMENT_7: {
        "name": "Preset 7",
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
    PRESET_SEGMENT_8: {
        "name": "Preset 8",
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
    PRESET_SEGMENT_9: {
        "name": "Preset 9",
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
    PRESET_SEGMENT_10: {
        "name": "Preset 10",
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
    PRESET_SEGMENT_11: {
        "name": "Preset 11",
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
    PRESET_SEGMENT_12: {
        "name": "Preset 12",
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

# CCT sequence preset definitions
CCT_SEQUENCE_PRESETS: Final = {
    PRESET_CCT_GOODNIGHT: {
        "name": "Goodnight",
        "icon": "mdi:weather-night",
        "steps": [
            {
                "color_temp": 4000,
                "brightness": 126,  # 50%
                "transition": 0.0,
                "hold": 0.0,
            },
            {
                "color_temp": 2700,
                "brightness": 1,  # ~0% (minimum device value)
                "transition": 1800.0,  # 30 minutes
                "hold": 0.0,
            },
        ],
        "loop_mode": LOOP_MODE_ONCE,
        "end_behavior": END_BEHAVIOR_TURN_OFF,
    },
    PRESET_CCT_WAKEUP: {
        "name": "Wakeup",
        "icon": "mdi:weather-sunset-up",
        "steps": [
            {
                "color_temp": 2700,
                "brightness": 1,  # 1%
                "transition": 0.0,
                "hold": 0.0,
            },
            {
                "color_temp": 6500,
                "brightness": 255,  # 100%
                "transition": 1800.0,  # 30 minutes
                "hold": 0.0,
            },
        ],
        "loop_mode": LOOP_MODE_ONCE,
        "end_behavior": END_BEHAVIOR_MAINTAIN,
    },
    PRESET_CCT_MINDFUL_BREATHING: {
        "name": "Mindful Breathing",
        "icon": "mdi:meditation",
        "steps": [
            {
                "color_temp": 3500,
                "brightness": 50,  # 20%
                "transition": 1.5,
                "hold": 0.5,
            },
            {
                "color_temp": 4900,
                "brightness": 204,  # 80%
                "transition": 2.0,
                "hold": 0.5,
            },
        ],
        "loop_mode": LOOP_MODE_CONTINUOUS,
        "end_behavior": END_BEHAVIOR_MAINTAIN,
    },
    PRESET_CCT_CIRCADIAN: {
        "name": "Circadian Rhythm",
        "icon": "mdi:sun-clock",
        "steps": [
            {
                "color_temp": 2700,  # Warm morning light
                "brightness": 100,
                "transition": 5.0,
                "hold": 7200.0,  # Hold for 2 hours
            },
            {
                "color_temp": 4000,  # Midday neutral
                "brightness": 200,
                "transition": 10.0,
                "hold": 14400.0,  # Hold for 4 hours
            },
            {
                "color_temp": 5500,  # Afternoon cool
                "brightness": 255,
                "transition": 10.0,
                "hold": 10800.0,  # Hold for 3 hours
            },
            {
                "color_temp": 3500,  # Evening warm
                "brightness": 150,
                "transition": 10.0,
                "hold": 7200.0,  # Hold for 2 hours
            },
            {
                "color_temp": 2700,  # Night warm dim
                "brightness": 50,
                "transition": 5.0,
                "hold": 3600.0,  # Hold for 1 hour
            },
        ],
        "loop_mode": LOOP_MODE_ONCE,
        "end_behavior": END_BEHAVIOR_MAINTAIN,
    },
}

# Segment sequence presets
PRESET_SEGMENT_SEQ_LOADING_BAR: Final = "loading_bar"
PRESET_SEGMENT_SEQ_WAVE: Final = "wave"
PRESET_SEGMENT_SEQ_SPARKLE: Final = "sparkle"
PRESET_SEGMENT_SEQ_THEATER_CHASE: Final = "theater_chase"
PRESET_SEGMENT_SEQ_RAINBOW_FILL: Final = "rainbow_fill"
PRESET_SEGMENT_SEQ_COMET: Final = "comet"

SEGMENT_SEQUENCE_PRESETS: Final = {
    PRESET_SEGMENT_SEQ_LOADING_BAR: {
        "name": "Loading Bar",
        "icon": "mdi:progress-download",
        "steps": [
            {
                "segments": "all",
                "colors": [[0, 200, 255]],
                "mode": SEGMENT_MODE_BLOCKS_REPEAT,
                "duration": 3.0,
                "hold": 2.0,
                "activation_pattern": ACTIVATION_SEQUENTIAL_FORWARD,
            },
        ],
        "loop_mode": LOOP_MODE_CONTINUOUS,
        "end_behavior": END_BEHAVIOR_MAINTAIN,
    },
    PRESET_SEGMENT_SEQ_WAVE: {
        "name": "Wave",
        "icon": "mdi:wave",
        "steps": [
            {
                "segments": "all",
                "colors": [[255, 0, 100], [100, 0, 255]],
                "mode": SEGMENT_MODE_GRADIENT,
                "duration": 5.0,
                "hold": 1.0,
                "activation_pattern": ACTIVATION_SEQUENTIAL_FORWARD,
            },
            {
                "segments": "all",
                "colors": [[100, 0, 255], [255, 0, 100]],
                "mode": SEGMENT_MODE_GRADIENT,
                "duration": 5.0,
                "hold": 1.0,
                "activation_pattern": ACTIVATION_SEQUENTIAL_REVERSE,
            },
        ],
        "loop_mode": LOOP_MODE_CONTINUOUS,
        "end_behavior": END_BEHAVIOR_MAINTAIN,
    },
    PRESET_SEGMENT_SEQ_SPARKLE: {
        "name": "Sparkle",
        "icon": "mdi:star-four-points",
        "steps": [
            {
                "segments": "all",
                "colors": [[255, 255, 255], [255, 200, 0], [0, 0, 0]],
                "mode": SEGMENT_MODE_BLOCKS_REPEAT,
                "duration": 2.0,
                "hold": 1.0,
                "activation_pattern": ACTIVATION_RANDOM,
            },
        ],
        "loop_mode": LOOP_MODE_CONTINUOUS,
        "end_behavior": END_BEHAVIOR_TURN_OFF,
    },
    PRESET_SEGMENT_SEQ_THEATER_CHASE: {
        "name": "Theater Chase",
        "icon": "mdi:theater",
        "steps": [
            {
                "segments": "all",
                "colors": [[255, 0, 0], [0, 0, 255], [0, 255, 0]],
                "mode": SEGMENT_MODE_BLOCKS_REPEAT,
                "duration": 3.0,
                "hold": 0.5,
                "activation_pattern": ACTIVATION_SEQUENTIAL_FORWARD,
            },
        ],
        "loop_mode": LOOP_MODE_CONTINUOUS,
        "end_behavior": END_BEHAVIOR_MAINTAIN,
    },
    PRESET_SEGMENT_SEQ_RAINBOW_FILL: {
        "name": "Rainbow Fill",
        "icon": "mdi:format-color-fill",
        "steps": [
            {
                "segments": "all",
                "colors": [
                    [255, 0, 0],
                    [255, 127, 0],
                    [255, 255, 0],
                    [0, 255, 0],
                    [0, 0, 255],
                    [139, 0, 255],
                ],
                "mode": SEGMENT_MODE_GRADIENT,
                "duration": 10.0,
                "hold": 5.0,
                "activation_pattern": ACTIVATION_ALL,
            },
        ],
        "loop_mode": LOOP_MODE_ONCE,
        "end_behavior": END_BEHAVIOR_MAINTAIN,
    },
    PRESET_SEGMENT_SEQ_COMET: {
        "name": "Comet",
        "icon": "mdi:meteor",
        "steps": [
            {
                "segments": "all",
                "colors": [[255, 255, 255], [100, 150, 255], [0, 50, 100], [0, 0, 0]],
                "mode": SEGMENT_MODE_GRADIENT,
                "duration": 4.0,
                "hold": 0.5,
                "activation_pattern": ACTIVATION_SEQUENTIAL_FORWARD,
            },
        ],
        "loop_mode": LOOP_MODE_CONTINUOUS,
        "end_behavior": END_BEHAVIOR_TURN_OFF,
    },
}

# Dynamic scene bundled presets - see presets.py

# Utility functions
def brightness_percent_to_device(percent: int) -> int:
    """Convert brightness percentage (1-100) to device value (1-255).

    Args:
        percent: Brightness percentage (1-100)

    Returns:
        Device brightness value (1-255)
    """
    if percent < MIN_BRIGHTNESS_PERCENT or percent > MAX_BRIGHTNESS_PERCENT:
        msg = f"Brightness percentage must be {MIN_BRIGHTNESS_PERCENT}-{MAX_BRIGHTNESS_PERCENT}, got {percent}"
        raise ValueError(msg)

    # Linear conversion: 1% = 1, 100% = 255
    # Formula: device = round((percent / 100) * 254) + 1
    # This ensures: 1% -> 1, 100% -> 255
    return round(((percent - 1) / 99) * 254) + 1


def xy_in_gamut(x: float, y: float, gamut: list[tuple[float, float]]) -> bool:
    """Check if XY coordinates are within the specified gamut triangle.

    Args:
        x: X coordinate (0.0-1.0)
        y: Y coordinate (0.0-1.0)
        gamut: List of three tuples representing the gamut triangle vertices

    Returns:
        True if the point is within the gamut, False otherwise
    """
    from homeassistant.util.color import check_point_in_lamps_reach

    return check_point_in_lamps_reach((x, y), gamut)