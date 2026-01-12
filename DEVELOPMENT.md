# Aqara Advanced Lighting - Architecture Reference

Version: 0.5.0

This document provides a comprehensive reference of the integration's architecture, structure, and components. Use this as a quick reference when implementing new features to understand how components interact without analyzing the codebase from scratch.

## Integration Overview

A Home Assistant service-based integration that provides advanced control over Aqara RGB lights through Zigbee2MQTT. Enables dynamic effects, segment patterns, and automated CCT/RGB sequences without requiring users to edit YAML or understand MQTT topics.

**Type**: Service integration (no entity platforms)
**Dependencies**: MQTT
**Communication**: Home Assistant -> MQTT -> Zigbee2MQTT -> Aqara Lights
**IoT Class**: local_push

## Data Flow Architecture

```
Home Assistant UI/Automation
        |
    Service Call
        |
  State Manager -----------> Persistent Storage (.storage/)
        |                    (captures pre-effect state)
        |
Effect/Sequence Managers
    (background tasks)
        |
    MQTT Client
        |
  Zigbee2MQTT
        |
  Aqara Light Device
```

## Core Files Reference

### Integration Entry Point
- **__init__.py** - Integration setup, service registration, component initialization
  - Verifies MQTT availability
  - Creates runtime data structure
  - Initializes all managers (MQTT, State, CCT, Segment)
  - Stores components in hass.data for service access

### Configuration and Metadata
- **manifest.json** - Integration metadata (domain, version, dependencies)
- **const.py** - All constants (services, attributes, presets, constraints, model IDs)
- **models.py** - Data structures (RGBColor, DynamicEffect, CCTSequence, SegmentSequence, DeviceState)
- **config_flow.py** - UI configuration (Z2M base topic setup)
- **translations/en.json** - Translations for UI and exceptions (HA internationalization)
- **services.yaml** - Service definitions for UI service calls

### Communication Layer
- **mqtt_client.py** - Zigbee2MQTT communication
  - Device discovery via bridge/devices topic
  - Multi-strategy entity-to-Z2M mapping (IEEE, MAC, name matching)
  - Effect/segment pattern MQTT publishing
  - Batch operations for synchronized group effects

### Device Capabilities
- **light_capabilities.py** - Device model definitions
  - Supported models: T1M (20/26 seg), T1 Strip, T2 RGB/CCT bulbs
  - Per-model effects, segment counts, addressing support
  - Validation functions (cached with @lru_cache)

### State Management
- **state_manager.py** - Light state capture and restoration
  - Captures state before effects (brightness, color, temp)
  - Persists to .storage/aqara_advanced_lighting.state_manager
  - 24-hour expiry for stored states
  - Restoration payload generation

### Sequence Execution
- **cct_sequence_manager.py** - CCT sequence background execution
  - Manages asyncio tasks for multi-step sequences
  - Loop modes: once, count, continuous
  - Pause/resume/stop controls
  - Event firing for automation triggers

- **segment_sequence_manager.py** - RGB segment sequence execution
  - Similar to CCT manager but for RGB segments
  - Activation patterns (sequential, random, ping-pong, etc.)
  - Rendering modes (gradient, blocks_repeat, blocks_expand)

### Service Handlers
- **services.py** - All service implementations
  - Validation using voluptuous schemas
  - Group resolution (expands HA light groups)
  - Parallel MQTT publishing for synchronized effects
  - Preset handling and manual parameter processing

### Utilities
- **segment_utils.py** - Segment addressing and color generation
  - parse_segment_range: Converts "1-5", "odd", "even" to int lists
  - generate_gradient_colors: Linear RGB interpolation
  - generate_block_colors: Evenly-spaced color blocks
  - expand_segment_colors: Expands ranges to individual segments

- **diagnostics.py** - Diagnostic data collection
  - Config entry info
  - Device discovery status
  - Entity mappings
  - Active effects and sequences

- **panel.py** - Sidebar panel registration
  - Frontend dashboard integration

- **favorites_store.py** - User favorites persistence
  - Per-user favorite light storage
  - Persistent storage in .storage/aqara_advanced_lighting.favorites_store
  - Add/remove/list favorite operations

## Services API

### Dynamic Effects

**set_dynamic_effect** - Activate RGB dynamic effect
- Parameters: entity_id, preset OR (effect + colors + speed), segments (T1 Strip), brightness, turn_on, sync
- Effect colors: 1-8 RGB colors
- Speed: 1-100
- Segments: "1-10", "odd", "even", "all" (T1 Strip only)
- Preset examples: t2_candlelight, t1m_sunset, t1_strip_rainbow

**stop_effect** - Stop effect and optionally restore pre-effect state
- Parameters: entity_id, restore_state (default: true)

### Segment Patterns

**set_segment_pattern** - Set individual segment colors
- Parameters: entity_id, preset OR segment_colors, turn_off_unspecified, brightness, sync
- Segment colors: list of {segment, color} pairs
- Supports range syntax in segment field
- 12 built-in presets (segment_1 through segment_12)

**create_gradient** - Smooth color gradient across all segments
- Parameters: entity_id, color_1 through color_6 (min 2, max 6), brightness, sync
- Linear RGB interpolation between colors

**create_blocks** - Evenly-spaced color blocks
- Parameters: entity_id, color_1 through color_6, expand (default: false), brightness, sync
- expand=true: distribute colors evenly (color1=first half, color2=second half)
- expand=false: repeat colors in alternating pattern

### CCT Sequences

**start_cct_sequence** - Start color temperature + brightness sequence
- Parameters: entity_id, preset OR steps, loop_mode, loop_count, end_behavior
- Steps: 1-20 steps, each with color_temp (2700-6500K), brightness (1-255), transition (0-3600s), hold (0-3600s)
- Loop modes: once, count (with loop_count), continuous
- End behaviors: maintain (keep final state), turn_off
- Presets: goodnight (30min fade), wakeup (30min sunrise), mindful_breathing (continuous), circadian (5-step daily cycle)

**stop_cct_sequence** - Stop sequence and optionally restore state
- Parameters: entity_id, restore_state

**pause_cct_sequence** - Pause at current step
- Parameters: entity_id

**resume_cct_sequence** - Resume from paused step
- Parameters: entity_id

### Segment Sequences

**start_segment_sequence** - Start RGB segment animation sequence
- Parameters: entity_id, preset OR steps, loop_mode, loop_count, end_behavior
- Steps: 1-20 steps, each with segments, colors (1-6), mode, duration (0-3600s), hold (0-3600s), activation_pattern
- Modes: gradient, blocks_repeat, blocks_expand
- Activation patterns: all, sequential_forward, sequential_reverse, random, ping_pong, center_out, edges_in, paired
- Presets: loading_bar, wave, sparkle, theater_chase, rainbow_fill, comet

**stop_segment_sequence** / **pause_segment_sequence** / **resume_segment_sequence**
- Same pattern as CCT sequence controls

## Supported Devices

### Device Models

| Model ID | Device | Segments | RGB Effects | Segment Addressing | Effect Segments | CCT |
|----------|--------|----------|-------------|-------------------|----------------|-----|
| lumi.light.acn031 | T1M 20-seg | 20 | 6 types | Yes | No | Yes |
| lumi.light.acn032 | T1M 26-seg | 26 | 6 types | Yes | No | Yes |
| lumi.light.acn132 | T1 Strip | 5/meter | 8 types | Yes | Yes | Yes |
| lumi.light.agl001/003/005/007 | T2 RGB Bulb | 0 | 4 types | No | No | Yes |
| lumi.light.agl002/004/006/008 | T2 CCT Bulb | 0 | None | No | No | Yes |

### Effect Types by Device

**T1M Effects**: flow1, flow2, fading, hopping, breathing, rolling
**T1 Strip Effects**: breathing, rainbow1, chasing, flash, hopping, rainbow2, flicker, dash
**T2 Bulb Effects**: breathing, candlelight, fading, flash

### Device Capabilities (light_capabilities.py)

Functions available (all @lru_cache decorated):
- `is_supported_model(model_id)` - Check if Z2M model is supported
- `get_device_capabilities(model_id)` - Get DeviceCapabilities dataclass
- `validate_effect_for_model(model_id, effect)` - Verify effect supported
- `supports_segment_addressing(model_id)` - Can address individual segments
- `supports_effect_segments(model_id)` - Can target segments in effects (T1 Strip only)
- `get_segment_count(model_id)` - Number of addressable segments

## MQTT Communication

### Device Discovery

1. Subscribe to `{z2m_base_topic}/bridge/devices`
2. Publish request to `{z2m_base_topic}/bridge/request/devices`
3. Z2M responds with device list (IEEE address, friendly name, model, manufacturer)
4. Filter by supported model IDs
5. Store in runtime_data.devices dict

### Entity-to-Z2M Mapping (4 strategies)

The integration needs to map HA entity IDs to Z2M friendly names for MQTT publishing.

1. **IEEE Address in unique_id** - Check if device IEEE appears in entity unique_id
2. **Device Registry MAC Connection** - Use MAC address from HA device registry
3. **Device Name Matching** - Normalize and compare Z2M device name with HA device name
4. **Entity ID Pattern Matching** - Match entity ID substring with Z2M friendly name

Example: `light.living_room_ceiling` -> Z2M device "Living Room Ceiling" -> Z2M friendly name "living_room_ceiling"

### MQTT Payload Publishing

**Effect Payload** (order matters per Z2M requirements):
```json
{
  "effect": "breathing",
  "effect_speed": 75,
  "effect_colors": [
    {"r": 255, "g": 0, "b": 0},
    {"r": 0, "g": 0, "b": 255}
  ],
  "effect_segments": "1-20"  // T1 Strip only
}
```

**Segment Pattern Payload**:
```json
{
  "segment_colors": [
    {"segment": 1, "color": {"r": 255, "g": 0, "b": 0}},
    {"segment": 2, "color": {"r": 0, "g": 255, "b": 0}}
  ]
}
```

**CCT Control**:
- Uses Home Assistant `light.turn_on` service with color_temp and brightness
- NOT sent via MQTT to avoid "No converter available" errors with CCT lights

### Batch Publishing

For synchronized group effects:
- `async_publish_batch_effects()` - Parallel MQTT publishes using asyncio.gather
- `async_publish_batch_segments()` - Parallel segment pattern publishes
- GROUP_SYNC_DELAY = 0.05s between commands for time synchronization

## State Management Flow

### Capture Process

When effect/sequence starts:
1. Read HA entity state (brightness, RGB color, color temp, on/off)
2. Create DeviceState object with entity_id, z2m_friendly_name, previous_state dict
3. Store in StateManager._device_states dict
4. Persist to .storage/aqara_advanced_lighting.state_manager (JSON format)

### Storage Structure

```python
{
  "version": 1,
  "minor_version": 1,
  "data": {
    "light.kitchen": {
      "entity_id": "light.kitchen",
      "z2m_friendly_name": "kitchen_light",
      "previous_state": {
        "state": "on",
        "brightness": 200,
        "color": {"r": 255, "g": 200, "b": 100},
        "color_temp": 4000
      },
      "effect_active": true,
      "current_effect": {...},
      "paused_cct_sequence": false,
      "paused_segment_sequence": false,
      "timestamp": "2025-01-05T12:00:00Z"
    }
  }
}
```

### Restoration Process

When stop_effect called with restore_state=true:
1. Look up DeviceState by entity_id
2. Generate MQTT payload with previous_state values
3. Publish to `{z2m_base_topic}/{z2m_friendly_name}/set`
4. Call HA light.turn_on service with brightness/color/temp
5. Clear stored state from manager
6. Save updated storage file

### State Expiry

- States expire after 24 hours (STATE_EXPIRY_HOURS constant)
- On load (async_load), expired entries discarded
- Prevents restoring stale states from before HA restart

## Sequence Managers

### Architecture Pattern

Both CCT and Segment managers follow identical patterns:
- Background asyncio.Task per entity
- Pause/resume/stop controls
- Loop mode handling (once/count/continuous)
- Event firing for automation triggers
- State listener for light off detection

### CCT Sequence Manager

**Sequence Execution**:
1. Turn on light if needed
2. Loop through steps based on loop_mode
3. For each step:
   - Apply color_temp and brightness via HA light.turn_on service
   - Wait transition time (smooth change using light's built-in transition)
   - Hold for hold_time
   - Check stop/pause flags
4. Execute end_behavior (maintain final state or turn_off)
5. Fire completion event

**State Tracking** (_sequence_state dict):
```python
{
  "entity_id": "light.bedroom",
  "paused": False,
  "current_step": 2,
  "total_steps": 5,
  "loop_iteration": 1,
  "loop_mode": "count",
  "loop_count": 3
}
```

**Events Fired**:
- `aqara_advanced_lighting_sequence_started` - On sequence start
- `aqara_advanced_lighting_step_changed` - On each step transition (includes step_index, total_steps, loop_iteration)
- `aqara_advanced_lighting_sequence_completed` - On natural completion
- `aqara_advanced_lighting_sequence_stopped` - On manual stop

### Segment Sequence Manager

**Rendering Modes**:
- `gradient`: Linear interpolation between colors across all segments
- `blocks_repeat`: Alternating color pattern (color1, color2, color1, color2...)
- `blocks_expand`: Even distribution (first N/2 segments = color1, last N/2 = color2)

**Activation Patterns**:
- `all`: Apply to all segments simultaneously
- `sequential_forward`: Segments 1->N in order over duration time
- `sequential_reverse`: Segments N->1 in reverse over duration time
- `random`: Random order over duration time
- `ping_pong`: Forward then reverse (1->N->1)
- `center_out`: Start from center, expand to edges
- `edges_in`: Start from edges, converge to center
- `paired`: Light segments in pairs (1&N, 2&(N-1), etc.)

**Step Execution**:
1. Parse segment range ("1-20", "odd", "all")
2. Generate colors based on mode (gradient/blocks)
3. Apply activation pattern over duration time
4. Hold for hold_time
5. Move to next step

## Preset System

### Three Preset Categories

**1. Effect Presets (EFFECT_PRESETS)**
- Pre-configured effect + colors + speed + brightness
- Device-type filtered (only show compatible presets)
- 23 total presets:
  - T2 Bulb: 4 presets (candlelight, breath, colorful, security)
  - T1M: 9 presets (dinner, sunset, autumn, galaxy, daydream, holiday, party, meteor, alert)
  - T1 Strip: 7 presets (rainbow, heartbeat, gala, sea_of_flowers, rhythmic, exciting, colorful)
  - CCT: 4 sequence presets (goodnight, wakeup, mindful_breathing, circadian)

**2. Segment Pattern Presets (SEGMENT_PATTERN_PRESETS)**
- 12 visual presets with pre-calculated segment colors
- Each preset has 26-element color array (supports T1M-20, T1M-26, T1 Strip)
- Icon references for UI display (SVG files)

**3. Sequence Presets (SEGMENT_SEQUENCE_PRESETS)**
- 6 animated sequence presets
- Pre-configured multi-step sequences
- Examples: loading_bar, wave, sparkle, theater_chase, rainbow_fill, comet

### Preset Usage in Services

Priority order:
1. If `preset` parameter provided -> use preset (ignore manual params)
2. Else use manual parameters (effect, colors, speed, etc.)
3. If neither -> validation error

Example:
```yaml
# Using preset
service: aqara_advanced_lighting.set_dynamic_effect
data:
  entity_id: light.bedroom
  preset: t1m_sunset

# Using manual parameters
service: aqara_advanced_lighting.set_dynamic_effect
data:
  entity_id: light.bedroom
  effect: breathing
  speed: 75
  color_1: [255, 0, 0]
  color_2: [0, 0, 255]
```

## Key Data Models (models.py)

### RGBColor
```python
@dataclass
class RGBColor:
    r: int  # 0-255
    g: int  # 0-255
    b: int  # 0-255
```

### DynamicEffect
```python
@dataclass
class DynamicEffect:
    effect: EffectType
    effect_speed: int  # 1-100
    effect_colors: list[RGBColor]  # 1-8 colors
    effect_segments: str | None  # T1 Strip only: "1-10", "odd"
```

### CCTSequence
```python
@dataclass
class CCTSequence:
    steps: list[CCTSequenceStep]  # 1-20 steps
    loop_mode: str  # "once", "count", "continuous"
    loop_count: int | None  # if mode == "count"
    end_behavior: str  # "maintain" or "turn_off"

@dataclass
class CCTSequenceStep:
    color_temp: int  # 2700-6500K
    brightness: int  # 1-255
    transition: float  # seconds (0-3600)
    hold: float  # seconds (0-3600)
```

### SegmentSequence
```python
@dataclass
class SegmentSequence:
    steps: list[SegmentSequenceStep]  # 1-20 steps
    loop_mode: str
    loop_count: int | None
    end_behavior: str

@dataclass
class SegmentSequenceStep:
    segments: str  # "1-20", "odd", "even", "all"
    colors: list[RGBColor]  # 1-6 colors
    mode: str  # "gradient", "blocks_repeat", "blocks_expand"
    duration: float  # seconds (0-3600)
    hold: float  # seconds (0-3600)
    activation_pattern: str  # "all", "sequential_forward", etc.
```

### DeviceCapabilities
```python
@dataclass
class DeviceCapabilities:
    model: AqaraLightModel
    segment_count: int
    supported_effects: list[EffectType]
    supports_segment_addressing: bool
    supports_effect_segments: bool
    model_name: str
```

## Segment Utilities (segment_utils.py)

### parse_segment_range(segment_str, max_segments)
Converts flexible syntax to int lists:
- `"5"` -> `[5]`
- `"1-10"` -> `[1, 2, 3, ..., 10]`
- `"1-5,10-15"` -> `[1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15]`
- `"odd"` -> `[1, 3, 5, 7, ...]`
- `"even"` -> `[2, 4, 6, 8, ...]`
- `"first-half"` -> `[1, ..., max/2]`
- `"second-half"` -> `[max/2+1, ..., max]`
- `"all"` -> `[1, 2, ..., max]`

### generate_gradient_colors(colors, segment_count)
Linear RGB interpolation:
1. Calculate position (0.0-1.0) for each segment
2. Find two nearest colors
3. Calculate blend factor
4. Interpolate RGB values: `value = color1_value + (color2_value - color1_value) * factor`
5. Clamp to 0-255

Returns list of RGBColor objects (one per segment).

### generate_block_colors(colors, segment_count, expand)
Even block distribution:
- `expand=True`: Divide segments evenly (2 colors, 20 segs = 10 per color)
- `expand=False`: Repeat pattern (2 colors = alternate on each segment)

Returns list of RGBColor objects.

### expand_segment_colors(segment_colors, max_segments)
Expands range syntax in segment_colors list to individual entries:
```python
# Input
[{"segment": "1-5", "color": {...}}]

# Output
[
  {"segment": 1, "color": {...}},
  {"segment": 2, "color": {...}},
  ...
]
```

## Translations and Internationalization

### ⚠️ CRITICAL RULE: All UI Text Must Be Localized

**MANDATORY FOR HA COMPLIANCE (GOLD TIER REQUIREMENT):**

All user-facing text in both frontend and backend components MUST use the translation system. Hardcoded English strings are NOT allowed.

**This applies to:**
- ✅ All tab labels, section titles, button text
- ✅ Form labels, field names, placeholders
- ✅ Error messages, warnings, alerts
- ✅ Dialog titles and descriptions
- ✅ Tooltips, help text, subtitles
- ✅ Service names and descriptions
- ✅ Config flow prompts and messages

**The ONLY exceptions are:**
- Console debug messages (`console.log`, `_LOGGER.debug`)
- Code comments and documentation
- Variable names and constants

### Backend Translation System (HA Compliance)

Home Assistant requires translations to be stored in the `translations/` directory, not `strings.json`. The integration must use the modern HA internationalization approach.

**Required Directory Structure:**
```
custom_components/aqara_advanced_lighting/
├── translations/
│   └── en.json
└── manifest.json
```

**Translation File Format (translations/en.json):**
```json
{
  "config": {
    "step": {
      "user": {
        "title": "Set up integration",
        "description": "Configure the integration settings.",
        "data": {
          "z2m_base_topic": "Zigbee2MQTT base topic"
        }
      }
    },
    "error": {
      "mqtt_not_loaded": "MQTT integration is not loaded.",
      "unknown": "An unexpected error occurred."
    },
    "abort": {
      "single_instance_allowed": "Only a single instance is allowed.",
      "already_configured": "This integration is already configured."
    }
  },
  "exceptions": {
    "integration_not_initialized": {
      "message": "The integration is not initialized. Please reload."
    }
  },
  "services": {
    "set_dynamic_effect": {
      "name": "Set dynamic effect",
      "description": "Activate a dynamic RGB effect.",
      "fields": {
        "entity_id": {
          "name": "Light entity",
          "description": "The light entity to control."
        },
        "effect": {
          "name": "Effect type",
          "description": "The effect pattern to activate."
        }
      }
    }
  }
}
```

**Backend Usage - Raising Exceptions with Translations:**

Use `ServiceValidationError` for user input errors with translation keys:

```python
from homeassistant.exceptions import ServiceValidationError

# Raise exception with translation
raise ServiceValidationError(
    translation_domain=DOMAIN,
    translation_key="effect_required",
)

# With placeholders
raise ServiceValidationError(
    translation_domain=DOMAIN,
    translation_key="preset_not_compatible",
    translation_placeholders={
        "preset": preset_name,
        "device": entity_id,
        "model": model_id,
    },
)
```

**Adding New Translations:**

1. Add the key to `translations/en.json` under appropriate section
2. Use the translation key in code with `translation_domain=DOMAIN`
3. Include translation placeholders for dynamic values using `{variable_name}` syntax
4. Always use American English spelling and sentence case

**Translation Placeholders:**

In translations/en.json:
```json
"exceptions": {
  "device_not_found": {
    "message": "Device {device} was not found. Please ensure it is paired."
  }
}
```

In Python code:
```python
raise ServiceValidationError(
    translation_domain=DOMAIN,
    translation_key="device_not_found",
    translation_placeholders={"device": z2m_friendly_name},
)
```

### HACS Translation Compliance

**CRITICAL FOR HACS APPROVAL:** The integration must strictly separate backend and frontend translations to maintain HACS compliance.

#### The HACS Validation Rule

HACS validates that custom integrations only use standard Home Assistant translation keys in the backend `translations/*.json` files. The **only allowed top-level keys** are:

**✅ Allowed Keys:**
- `config` - Configuration flow steps, data fields, errors, abort reasons
- `options` - Options flow (reconfiguration)
- `services` - Service names, descriptions, field definitions
- `exceptions` - Exception messages with translation keys
- `entity` - Entity names and attributes
- `entity_component` - Entity component translations
- `issues` - Repair issue descriptions
- `selector` - Selector labels and descriptions
- `state` - Entity state translations
- `state_attributes` - Entity state attribute translations
- `device_automation` - Device automation trigger/condition/action names

**❌ Forbidden Keys:**
- `panel` - Custom panel UI translations
- `dashboard` - Custom dashboard text
- Any other custom keys

#### Why This Matters

Home Assistant's translation API endpoint (`/api/translations/{language}/{integration}`) only serves the standard keys listed above for custom integrations. Custom keys like `panel` are:
1. **Filtered out by HA's API** - Not accessible via `hass.localize()`
2. **Rejected by HACS validation** - Integration will fail HACS approval
3. **Not part of HA's translation standard** - Violates platform conventions

#### The Solution: Separate Translation Systems

The integration uses **two independent translation systems**:

**1. Backend Translations** (HACS Compliant)
- **Location:** `custom_components/aqara_advanced_lighting/translations/en.json`
- **Contains:** Only standard HA keys (config, services, exceptions)
- **Validated by:** HACS GitHub Action on every push
- **Accessed via:** Home Assistant's translation API

**2. Frontend Panel Translations** (Embedded)
- **Location:** `custom_components/aqara_advanced_lighting/frontend_src/translations/panel.en.json`
- **Contains:** All panel UI text (tabs, buttons, labels, tooltips)
- **Compiled into:** `frontend/aqara_panel.js` (embedded in JavaScript bundle)
- **Accessed via:** Direct import in TypeScript code

#### File Structure Requirements

```
custom_components/aqara_advanced_lighting/
├── translations/
│   └── en.json                     ← Backend only (HACS validated)
│       {
│         "config": {...},
│         "exceptions": {...},
│         "services": {...}         ← Only allowed keys
│       }
├── frontend_src/
│   ├── translations/
│   │   ├── panel.en.json          ← Frontend panel translations
│   │   ├── panel.de.json          ← Future: German
│   │   ├── panel.fr.json          ← Future: French
│   │   └── README.md              ← Multi-language instructions
│   └── src/
│       └── panel-translations.ts   ← Imports JSON, exports embedded translations
└── frontend/
    └── aqara_panel.js              ← Compiled bundle with embedded translations
```

#### Maintaining Compliance

**When adding new backend translations:**

1. **Check key validity** - Only use allowed top-level keys
2. **Add to translations/en.json:**
   ```json
   {
     "exceptions": {
       "new_error": {
         "message": "Error message here."
       }
     },
     "services": {
       "new_service": {
         "name": "Service name",
         "description": "Service description"
       }
     }
   }
   ```
3. **Use in Python code:**
   ```python
   raise ServiceValidationError(
       translation_domain=DOMAIN,
       translation_key="new_error",
   )
   ```

**When adding new frontend translations:**

1. **Add to frontend_src/translations/panel.en.json:**
   ```json
   {
     "title": "Aqara Advanced Lighting",
     "your_section": {
       "new_label": "Your label text"
     }
   }
   ```

2. **Update frontend_src/src/panel-translations.ts:**
   ```typescript
   import panelTranslationsEn from '../translations/panel.en.json';
   export const PANEL_TRANSLATIONS = panelTranslationsEn;
   ```

3. **Rebuild frontend:**
   ```bash
   cd custom_components/aqara_advanced_lighting/frontend_src
   npm run build
   ```

4. **Use in TypeScript code:**
   ```typescript
   ${this._localize('your_section.new_label')}
   ```

#### Validation Workflow

The integration uses GitHub Actions to validate HACS compliance on every push:

```yaml
# .github/workflows/validate.yaml
jobs:
  validate-hacs:
    runs-on: "ubuntu-latest"
    steps:
      - name: HACS validation
        uses: "hacs/action@main"
        with:
          category: "Integration"
```

**What Gets Validated:**
- ✅ `translations/en.json` contains only allowed keys
- ✅ `manifest.json` structure is valid
- ✅ Required files exist (README, info.md, etc.)
- ✅ No deprecated patterns or antipatterns

**Common Validation Failures:**
```json
// ❌ This will fail HACS validation
{
  "config": {...},
  "services": {...},
  "panel": {              // ← NOT ALLOWED in backend translations
    "title": "My Panel"
  }
}
```

**Fix:** Move `panel` section to `frontend_src/translations/panel.en.json`

#### Testing Compliance Locally

Before pushing commits:

1. **Validate JSON syntax:**
   ```bash
   python -c "import json; json.load(open('custom_components/aqara_advanced_lighting/translations/en.json'))"
   ```

2. **Check for forbidden keys:**
   ```bash
   python -c "
   import json
   data = json.load(open('custom_components/aqara_advanced_lighting/translations/en.json'))
   allowed = {'config', 'options', 'services', 'exceptions', 'entity', 'issues', 'selector'}
   forbidden = set(data.keys()) - allowed
   if forbidden:
       print(f'ERROR: Forbidden keys found: {forbidden}')
       exit(1)
   print('✓ All keys are HACS compliant')
   "
   ```

3. **Verify frontend is rebuilt after translation changes:**
   ```bash
   cd custom_components/aqara_advanced_lighting/frontend_src
   npm run build
   git status  # Should show frontend/aqara_panel.js modified
   ```

#### Multi-Language Support

When adding translations for additional languages:

**Backend (HACS Compliant):**
1. Copy `translations/en.json` to `translations/de.json` (German example)
2. Translate all values while keeping keys unchanged
3. Submit PR with new file

**Frontend Panel:**
1. Copy `frontend_src/translations/panel.en.json` to `panel.de.json`
2. Translate all values while keeping keys unchanged
3. Update `panel-translations.ts` to import and select based on user locale:
   ```typescript
   import panelEn from '../translations/panel.en.json';
   import panelDe from '../translations/panel.de.json';

   const userLocale = hass?.language?.substring(0, 2) || 'en';
   const translations = { en: panelEn, de: panelDe };
   export const PANEL_TRANSLATIONS = translations[userLocale] || panelEn;
   ```
4. Rebuild frontend
5. Submit PR with `panel.de.json` and rebuilt `frontend/aqara_panel.js`

**See:** `frontend_src/translations/README.md` for detailed multi-language instructions

#### Quick Reference

| Translation Type | File Location | Contains | Build Required | HACS Validated |
|------------------|---------------|----------|----------------|----------------|
| Backend | `translations/en.json` | config, services, exceptions | No | ✅ Yes |
| Frontend Panel | `frontend_src/translations/panel.en.json` | UI text, labels, buttons | ✅ Yes | ❌ No |

**Golden Rule:** If it's user-facing text in the **backend** (config flow, services, errors), it goes in `translations/en.json` with standard keys only. If it's UI text in the **frontend panel**, it goes in `frontend_src/translations/panel.*.json` and requires a rebuild.

### Keeping Services.yaml and Translations in Sync

Home Assistant's translation system for services works as a **two-layer overlay**:
1. **Base Layer**: `services.yaml` contains full English text + schema (selectors, constraints, defaults)
2. **Translation Layer**: `translations/en.json` can override/supplement the English text

**Translation Precedence**:
- When both files have text for the same field, **translations/en.json takes priority**
- When a translation key is missing, Home Assistant falls back to services.yaml
- This allows updating English text without modifying services.yaml

**Why Maintain Both Files?**

While it may seem redundant to have English text in both files, this approach:
- Provides a fallback if translations fail to load
- Keeps schema (selectors, constraints) separate from translatable text
- Maintains consistency with multi-language translation files
- Follows Home Assistant's standard translation pattern

**Synchronization Rules**:

1. **services.yaml**: Contains complete service definitions with:
   - Service name and description (English)
   - Field names and descriptions (English)
   - Full schema: selectors, constraints, defaults, examples
   - Dropdown options with label/value pairs

2. **translations/en.json**: Contains parallel structure with:
   - Service name and description (can override services.yaml)
   - Field names and descriptions (can override services.yaml)
   - NO schema elements (selectors, constraints handled in services.yaml)

**Example Structure**:

services.yaml:
```yaml
set_dynamic_effect:
  name: Set dynamic effect
  description: Activate a dynamic RGB effect on Aqara lights.
  fields:
    effect:
      name: Effect type
      description: Choose effect type manually.
      selector:
        select:
          options:
            - label: "Breathing"
              value: "breathing"
```

translations/en.json:
```json
{
  "services": {
    "set_dynamic_effect": {
      "name": "Set dynamic effect",
      "description": "Activate a dynamic RGB effect on Aqara lights.",
      "fields": {
        "effect": {
          "name": "Effect type",
          "description": "Choose effect type manually."
        }
      }
    }
  }
}
```

**When to Update**:

- **Adding a new service**: Update both services.yaml (full definition) AND translations/en.json (service name, description, field names/descriptions)
- **Adding a new field**: Update both files
- **Changing text only**: Update translations/en.json only (will override services.yaml)
- **Changing schema** (selectors, constraints): Update services.yaml only
- **Adding dropdown options**: Update services.yaml only (schema-level, not translatable text)

**Important Notes**:

- Dropdown option labels in services.yaml are NOT overridden by translations
- Schema elements (selectors, min/max, units) are never in translations/en.json
- Always test after changes to ensure text displays correctly in UI
- Use `python -m script.translations develop --all` to validate translation files (if using HA core dev environment)

**Capitalization Rules**:

All text in services.yaml, translations/*.json, and panel translations must follow these capitalization standards:

- **Dialog/Section Titles**: Use Title Case (capitalize major words)
  - Examples: "Create Effect Preset", "Transition Settings", "Version Information"
  - Used for: Dialog titles, section headers, collapsible group names

- **Field Labels**: Use sentence case (capitalize only the first word and proper nouns)
  - Examples: "Light entity", "Color temperature", "Loop mode", "Initial brightness"
  - Used for: Service field names, form labels, configuration parameter names

- **Button Text**: Use sentence case
  - Examples: "Add step", "Select all", "Stop preview", "Apply to selected"
  - Used for: Buttons, links, action text

- **Descriptions**: Use sentence case
  - Examples: "Select the light device to control", "Brightness level for the effect"
  - Used for: Help text, field descriptions, tooltip content

**Note**: These rules apply to all three locations (services.yaml, translations/en.json, panel-translations.ts) to maintain consistency across the integration.

### Testing Compliance and Quality Scale

When adding or updating features, you must maintain test coverage to comply with the integration's quality scale requirements. The integration targets **Silver tier** with several **Gold tier** features implemented.

**Quality Scale Status**: Track compliance in `quality_scale.yaml`

**Testing Requirements**:

1. **Config Flow Tests** (Bronze - MANDATORY):
   - 100% coverage of all config flow paths
   - Location: `tests/test_config_flow.py`
   - Update when:
     - Adding new config flow steps
     - Modifying validation logic
     - Changing error handling
   - Must test:
     - User flow with successful configuration
     - User flow with errors (MQTT not loaded, validation failures)
     - Single instance enforcement
     - Reconfigure flow (successful update, validation, preserving values)

2. **Integration Setup/Unload Tests** (Silver):
   - Location: `tests/test_init.py`
   - Update when:
     - Modifying `async_setup_entry` logic
     - Changing service registration
     - Adding new managers or components
     - Modifying cleanup/unload logic
   - Must test:
     - Successful setup with MQTT available
     - Setup failure scenarios (MQTT unavailable, coordinator failures)
     - Config entry unload
     - Config entry reload

3. **Service Tests** (Silver):
   - Update when:
     - Adding new services
     - Modifying service schemas
     - Changing service validation logic
     - Adding new service parameters
   - Must test:
     - Service call validation (required fields, constraints)
     - Error handling (invalid parameters, device not found)
     - Group entity resolution
     - Preset vs manual parameter handling

4. **Utility Function Tests** (Silver):
   - Location: `tests/test_segment_utils.py`
   - Update when:
     - Adding new segment parsing patterns
     - Modifying color generation algorithms
     - Changing segment range validation
   - Must test:
     - All segment range patterns (single, ranges, comma-separated, special selectors)
     - Gradient generation (2-6 colors)
     - Block generation (repeat and expand modes)
     - Edge cases and error handling

**Running Tests**:

```bash
# Install test dependencies (first time only)
pip install -r requirements_test.txt

# Run all tests
pytest

# Run specific test file
pytest tests/test_config_flow.py

# Run with coverage report
pytest --cov=custom_components.aqara_advanced_lighting --cov-report=term-missing

# Run with verbose output
pytest -v

# Run specific test
pytest tests/test_config_flow.py::test_user_flow_success -v
```

**When to Update Tests**:

| Change Type | Required Test Updates |
|-------------|----------------------|
| New service | Add service schema tests, validation tests, error handling tests |
| New field in existing service | Add field validation tests, update schema tests |
| New config flow step | Add config flow tests for new step, error cases |
| New segment selector (e.g., "thirds") | Add segment utils tests for new pattern |
| New preset | Add preset validation tests (if applicable) |
| New error condition | Add error handling tests |
| Modified validation logic | Update existing tests, add edge case tests |

**Test Coverage Goals** (from quality_scale.yaml):

- **Config Flow**: 100% coverage ✅ Achieved
- **Overall**: 95%+ coverage ✅ Achieved
- **Critical Paths**: 100% coverage (service validation, MQTT publishing, state management)

**Updating quality_scale.yaml**:

After updating tests, verify compliance tracking:

```yaml
# Example: After adding service tests
test-coverage:
  status: done
  comment: Automated tests implemented with comprehensive coverage - config flow tests (100%), integration setup/unload tests, segment utility tests (comprehensive), service validation tests (new_service), test infrastructure with pytest, pytest-homeassistant-custom-component, and coverage tooling configured
```

**Test Best Practices**:

1. **Use Fixtures**: Defined in `tests/conftest.py`
   - `hass` - Mock Home Assistant instance
   - `mock_config_entry` - Pre-configured config entry
   - `mock_mqtt_client` - Mocked MQTT client

2. **Async Tests**: All tests must be async
   ```python
   async def test_my_feature(hass: HomeAssistant):
       """Test my feature."""
       result = await my_async_function()
       assert result is True
   ```

3. **Mock External Dependencies**: Never make real MQTT calls or network requests
   ```python
   @pytest.fixture
   def mock_mqtt_publish(hass):
       """Mock MQTT publish."""
       with patch("homeassistant.components.mqtt.async_publish") as mock:
           yield mock
   ```

4. **Test Isolation**: Each test should be independent and not rely on other tests

5. **Clear Assertions**: Use descriptive assertion messages
   ```python
   assert result["type"] == FlowResultType.CREATE_ENTRY, "Config flow should create entry"
   ```

6. **Test Documentation**: Add docstrings explaining what each test validates

**Continuous Integration**:

Before committing:
1. Run all tests locally: `pytest`
2. Check coverage: `pytest --cov --cov-report=term-missing`
3. Ensure no test failures
4. Review coverage report for any gaps
5. Update quality_scale.yaml if needed

**Debugging Failed Tests**:

```bash
# Show print statements
pytest -s

# Use PDB debugger
# Add to test: import pdb; pdb.set_trace()

# Show short traceback
pytest --tb=short

# Run only failed tests
pytest --lf
```

See `tests/README.md` for detailed testing documentation.

### Frontend Localization

**IMPORTANT:** All frontend UI text MUST use the translation system. This is required for Home Assistant Gold tier compliance.

#### Embedded Translations Architecture

**CRITICAL IMPLEMENTATION DETAIL:** Due to Home Assistant's translation API limitations for custom integrations, panel translations are **embedded directly in the compiled JavaScript bundle** rather than fetched from the API at runtime.

**Why This Approach:**
- Home Assistant's `/api/translations/en/{domain}` endpoint **only serves standard sections** (config, services, exceptions) for custom integrations
- Custom sections like `panel` are filtered out by HA's translation API
- Attempting to use `hass.localize()` for panel translations results in translation keys displaying as raw strings

**Implementation:**
1. **Source of Truth:** All panel translations are maintained in `translations/en.json` under the `panel` key (standard HA format)
2. **Embedded Copy:** Panel translations are duplicated in `frontend_src/src/panel-translations.ts` as TypeScript constants
3. **Main Panel:** `aqara-panel.ts` imports `PANEL_TRANSLATIONS` and initializes the `_translations` property with this embedded data
4. **Child Components:** All editor components receive translations via the `.translations` property passed from the main panel
5. **Runtime Access:** Components use a local `_localize()` helper method that reads from the embedded translations object

**File Structure:**
```
custom_components/aqara_advanced_lighting/
├── translations/
│   └── en.json                    # Source of truth - all translations
├── frontend_src/src/
│   ├── panel-translations.ts      # Embedded copy of panel section
│   ├── aqara-panel.ts            # Imports PANEL_TRANSLATIONS
│   ├── effect-editor.ts          # Receives via .translations property
│   ├── pattern-editor.ts         # Receives via .translations property
│   ├── cct-sequence-editor.ts    # Receives via .translations property
│   └── segment-sequence-editor.ts # Receives via .translations property
└── frontend/
    └── aqara_panel.js            # Compiled bundle with embedded translations
```

**Keeping Translations in Sync:**
When updating panel translations, you must update **both** files:
1. Update `translations/en.json` (primary source)
2. Update `frontend_src/src/panel-translations.ts` (embedded copy)
3. Rebuild frontend: `cd frontend_src && npm run build`

**Translation Structure:**

Frontend panel translations are organized under the `panel` key in `translations/en.json`:

```json
{
  "panel": {
    "title": "Aqara Advanced Lighting",
    "tabs": {
      "activate": "Activate",
      "effects": "Effects",
      "config": "Device Config"
    },
    "errors": {
      "title": "Error",
      "loading_presets": "Failed to load presets. Please refresh the page."
    },
    "target": {
      "section_title": "Target",
      "lights_label": "Lights",
      "brightness_label": "Brightness"
    }
  }
}
```

**Accessing Translations in Frontend Code:**

```typescript
// In aqara-panel.ts - main component
import { PANEL_TRANSLATIONS } from './panel-translations';

@customElement('aqara-advanced-lighting-panel')
export class AqaraPanel extends LitElement {
  // Initialize with embedded translations
  private _translations: Record<string, any> = PANEL_TRANSLATIONS;

  // Helper method to access translations
  private _localize(key: string, values?: Record<string, string>): string {
    const keys = key.split('.');
    let value: any = this._translations;

    // Navigate nested object structure
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if not found
      }
    }

    let translated = typeof value === 'string' ? value : key;

    // Replace placeholders like {count} with actual values
    if (values) {
      Object.keys(values).forEach(placeholder => {
        const val = values[placeholder];
        if (val !== undefined) {
          translated = translated.replace(`{${placeholder}}`, val);
        }
      });
    }

    return translated;
  }

  render() {
    return html`
      <div class="main-title">${this._localize('title')}</div>
      <ha-tab-group-tab>${this._localize('tabs.activate')}</ha-tab-group-tab>
      <span class="control-label">${this._localize('target.lights_label')}</span>
      <ha-alert title="${this._localize('errors.title')}">
        ${this._localize('errors.loading_presets')}
      </ha-alert>
    `;
  }
}

// In child components (effect-editor.ts, pattern-editor.ts, etc.)
export class EffectEditor extends LitElement {
  // Receive translations from parent via property
  @property({ type: Object }) public translations: Record<string, any> = {};

  // Same _localize helper method
  private _localize(key: string, values?: Record<string, string>): string {
    const keys = key.split('.');
    let value: any = this.translations;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    // ... rest of method
  }

  render() {
    return html`
      <span class="form-label">${this._localize('editors.brightness_label')}</span>
    `;
  }
}

// Pass translations to child components in parent render
<effect-editor
  .hass=${this.hass}
  .translations=${this._translations}
></effect-editor>
```

**With Placeholders:**

```typescript
// In translations/en.json
{
  "panel": {
    "target": {
      "lights_selected": "{count} light selected",
      "lights_selected_plural": "{count} lights selected"
    }
  }
}

// In component
const message = this._localize(
  count === 1 ? 'target.lights_selected' : 'target.lights_selected_plural',
  { count: count.toString() }
);
```

**Accessing Backend Translations:**

Backend service and exception translations can also be accessed from the frontend:

```typescript
// Access service translations
const serviceName = this.hass.localize(
  'component.aqara_advanced_lighting.services.set_dynamic_effect.name'
);

// Access exception messages
const errorMsg = this.hass.localize(
  'component.aqara_advanced_lighting.exceptions.effect_required.message'
);
```

### Translation Best Practices

1. **Use Sentence Case**: "Set dynamic effect" not "Set Dynamic Effect"
2. **Be Descriptive**: "The light entity or group to control" not just "Entity"
3. **No Emojis**: Plain text only, no emojis or icons in translation strings
4. **American English**: Use "color" not "colour", "organize" not "organise"
5. **Placeholders**: Use `{variable}` syntax for dynamic values
6. **Error Context**: Include what went wrong AND how to fix it

**Good Translation Examples:**

```json
{
  "exceptions": {
    "mqtt_not_loaded": {
      "message": "MQTT integration is not loaded. Please set up the MQTT integration first."
    },
    "device_not_found": {
      "message": "Device {device} was not found in the Zigbee2MQTT registry. Please ensure the device is properly paired."
    }
  }
}
```

**Bad Translation Examples:**

```json
{
  "exceptions": {
    "mqtt_error": {
      "message": "Error"  // Too vague
    },
    "device_error": {
      "message": "Device not found"  // No context or solution
    }
  }
}
```

### Adding New UI Elements - Translation Workflow

**REQUIRED STEPS when adding any new panel UI text:**

1. **Add translations to `translations/en.json`** (source of truth):
   ```json
   {
     "panel": {
       "your_section": {
         "new_label": "Your New Label Text",
         "new_button": "Click Me",
         "new_error": "Something went wrong with {item}."
       }
     }
   }
   ```

2. **Add same translations to `frontend_src/src/panel-translations.ts`** (embedded copy):
   ```typescript
   export const PANEL_TRANSLATIONS = {
     // ... existing translations ...
     "your_section": {
       "new_label": "Your New Label Text",
       "new_button": "Click Me",
       "new_error": "Something went wrong with {item}."
     }
   } as const;
   ```

3. **Rebuild frontend** to compile embedded translations:
   ```bash
   cd custom_components/aqara_advanced_lighting/frontend_src
   npm run build
   ```

4. **Use the translation key in code**:
   ```typescript
   // Frontend panel
   ${this._localize('your_section.new_label')}
   ${this._localize('your_section.new_error', { item: itemName })}

   // Backend (standard sections: config, services, exceptions)
   raise ServiceValidationError(
       translation_domain=DOMAIN,
       translation_key="new_error",
       translation_placeholders={"item": item_name},
   )
   ```

5. **NEVER commit hardcoded strings**:
   ```typescript
   // ❌ WRONG - Will fail code review
   return html`<div class="title">My New Feature</div>`;

   // ✅ CORRECT
   return html`<div class="title">${this._localize('your_section.title')}</div>`;
   ```

6. **Test in Home Assistant**:
   - Restart Home Assistant
   - Clear browser cache or use incognito window
   - Verify all text displays correctly
   - Check placeholder substitution works
   - Test with both light and dark themes

**Quick Checklist Before Committing:**
- [ ] All user-visible text added to `translations/en.json`
- [ ] Panel translations also added to `panel-translations.ts`
- [ ] Frontend rebuilt after translation changes
- [ ] No hardcoded English strings in UI code
- [ ] Placeholders used for dynamic values
- [ ] Tested in running Home Assistant instance
- [ ] Used sentence case in translations

### Testing Translations

**Backend:**
1. Raise exceptions in code with translation keys
2. Verify they display properly in HA UI
3. Check that placeholders are replaced correctly

**Frontend:**
1. Call services from Developer Tools → Services
2. Verify service names and field descriptions appear correctly
3. Trigger error conditions to see exception messages

## Color Formats and Conversion

### Color Space Architecture

The integration uses **CIE 1931 XY color space** for internal color storage and conversion, NOT RGB. This decision ensures:
- **Consistent color representation** across different devices and color gamuts
- **Perceptually accurate colors** that match what users select in color pickers
- **Vivid, saturated colors** through proper normalization

### Why XY Color Space?

**RGB is device-dependent and ambiguous:**
- RGB values don't specify which red, green, or blue primaries are used
- Different displays show different colors for the same RGB values
- No standard way to represent color saturation vs. brightness

**XY (CIE 1931) is standardized and device-independent:**
- Represents chromaticity (hue + saturation) independently from brightness
- Based on human color perception research
- Allows accurate conversion between different color representations

### Color Data Models

```python
# Frontend stores colors as XY
@dataclass
class XYColor:
    x: float  # 0.0-1.0 (chromaticity coordinate)
    y: float  # 0.0-1.0 (chromaticity coordinate)
    brightness: int  # 0-255 (NOT used in conversion, managed separately)

# Backend converts to RGB for MQTT
@dataclass
class RGBColor:
    r: int  # 0-255
    g: int  # 0-255
    b: int  # 0-255
```

### Critical Conversion Algorithm

**XY → RGB conversion requires normalization to prevent washed-out colors.**

The conversion process:

1. **XY → XYZ color space** (using Y=1 reference)
   ```python
   z = 1.0 - x - y
   Y = 1.0
   X = (Y / y) * x
   Z = (Y / y) * z
   ```

2. **XYZ → Linear RGB** (sRGB D65 transformation matrix)
   ```python
   r_linear = X * 3.2406 + Y * -1.5372 + Z * -0.4986
   g_linear = X * -0.9689 + Y * 1.8758 + Z * 0.0415
   b_linear = X * 0.0557 + Y * -0.2040 + Z * 1.0570
   ```

3. **⚠️ CRITICAL: Normalization** (preserves color ratios, ensures vividness)
   ```python
   # Without this step, colors appear washed out!
   max_component = max(r_linear, g_linear, b_linear)
   if max_component > 1:
       r_linear /= max_component
       g_linear /= max_component
       b_linear /= max_component
   ```

4. **Clamp out-of-gamut values**
   ```python
   r_linear = max(0, r_linear)
   g_linear = max(0, g_linear)
   b_linear = max(0, b_linear)
   ```

5. **Apply gamma correction** (linear RGB → sRGB)
   ```python
   r_srgb = (12.92 * r_linear) if r_linear <= 0.0031308 else (1.055 * r_linear^(1/2.4) - 0.055)
   # Same for g and b
   ```

6. **Convert to 0-255 range**
   ```python
   r = round(r_srgb * 255)  # Result: 0-255
   ```

### Why Normalization is Critical

The XY→RGB conversion can produce linear RGB values greater than 1.0 for saturated colors. Without normalization, these values get clamped to 1.0, which dims the color and makes it appear washed out.

**The Problem:**

When converting saturated colors from XY to linear RGB, the math often produces values like:
- r_linear = 2.5
- g_linear = 1.2
- b_linear = 0.3

Simply clamping these to the valid range (0.0-1.0) gives:
- r_linear = 1.0 (was 2.5 ← lost intensity!)
- g_linear = 1.0 (was 1.2 ← lost intensity!)
- b_linear = 0.3 (unchanged)

This preserves the hue but reduces saturation, making colors appear pale and washed out.

**The Solution:**

Normalization divides all channels by the maximum value before clamping:
```python
max_component = max(2.5, 1.2, 0.3)  # = 2.5
r_linear = 2.5 / 2.5 = 1.0  # ✓ Full intensity
g_linear = 1.2 / 2.5 = 0.48  # ✓ Correct ratio preserved
b_linear = 0.3 / 2.5 = 0.12  # ✓ Correct ratio preserved
```

This ensures:
- The **brightest channel is always at maximum** (1.0 → 255 after gamma)
- **Color ratios are preserved** (hue and saturation maintained)
- **Vivid, saturated colors** instead of pale/washed out

**Real-World Example:**

Pure red from color picker:
- XY coordinates: (0.68, 0.31)
- Linear RGB before normalization: (5.5, -1.5, -0.5)
- **Without normalization**: Clamp → (1.0, 0, 0) → gamma → (255, 0, 0) ← Correct, but only for pure primaries
- **With normalization**: (5.5/5.5, -1.5/5.5, -0.5/5.5) = (1.0, -0.27, -0.09) → Clamp → (1.0, 0, 0) → (255, 0, 0) ← Same result

Vibrant orange:
- XY coordinates: (0.55, 0.42)
- Linear RGB before normalization: (2.67, 1.95, 0.15)
- **Without normalization**: Clamp → (1.0, 1.0, 0.15) → gamma → (255, 255, 100) ← Pale yellow!
- **With normalization**: (2.67/2.67, 1.95/2.67, 0.15/2.67) = (1.0, 0.73, 0.06) → gamma → (255, 210, 45) ← Vivid orange!

**Key Takeaway:** Normalization ensures the brightest color channel reaches full intensity (255), preventing dim/washed-out colors while preserving the correct hue and saturation.

### Frontend Implementation

**Location:** `frontend_src/src/color-utils.ts`

```typescript
export function xyToRgb(x: number, y: number, brightness: number = 255): RGBColor {
  // Full conversion including normalization step
  // Returns RGB at specified brightness level
}

export function rgbToXy(r: number, g: number, b: number): XYColor {
  // Reverse conversion for color picker initialization
}
```

**Usage in frontend:**
- Color picker stores selections as XY coordinates
- Preview converts XY → RGB for display
- Saving stores preset with XY colors
- Activation sends XY colors to backend

### Backend Implementation

**Location:** `custom_components/aqara_advanced_lighting/models.py`

```python
class XYColor:
    def to_rgb(self) -> RGBColor:
        """Convert XY to RGB using same algorithm as frontend.

        CRITICAL: Includes normalization step to prevent washed-out colors.
        This MUST match the frontend algorithm exactly to ensure preview
        colors match activated preset colors.
        """
        # Full conversion with normalization (lines 95-153)
```

### Color Format Acceptance

The integration accepts **three color formats** in service calls:

1. **RGB List** (legacy, direct MQTT format):
   ```yaml
   color_1: [255, 0, 0]  # Red
   ```

2. **RGB Dict**:
   ```yaml
   color_1:
     r: 255
     g: 0
     b: 0
   ```

3. **XY Dict** (preferred, used by frontend):
   ```yaml
   color_1:
     x: 0.68
     y: 0.31
   ```

**Service Schema** (`services.py`):
```python
COLOR_SCHEMA = vol.Any(
    RGB_COLOR_SCHEMA,      # {"r": int, "g": int, "b": int}
    XY_COLOR_SCHEMA,       # {"x": float, "y": float}
    RGB_COLOR_LIST_SCHEMA  # [int, int, int]
)
```

### Color Conversion Flow

**Frontend → Backend:**
1. User selects color in picker (HS color space)
2. Frontend converts HS → XY, stores in preset
3. Frontend sends XY dict to service
4. Backend validates with COLOR_SCHEMA
5. Backend converts XY → RGB for MQTT payload
6. Aqara light receives RGB values

**Preview vs. Activation:**
- **Preview**: Frontend converts XY → RGB using `xyToRgb()` function
- **Activation**: Backend converts XY → RGB using `XYColor.to_rgb()` method
- **CRITICAL**: Both must use identical algorithms (including normalization) to ensure colors match

### Common Pitfall: Mismatched Conversion Algorithms

**Problem:** If frontend and backend use different XY→RGB algorithms, preview colors won't match activated colors.

**Previous Bug:**
- Frontend used sophisticated conversion with normalization
- Backend used Home Assistant's `color_xy_to_RGB()` WITHOUT normalization
- Result: Preview showed vivid colors, activation showed washed-out colors

**Fix:**
- Backend now implements the same algorithm as frontend
- Both include the critical normalization step
- Colors now match exactly between preview and activation

### Testing Color Accuracy

To verify color conversion is working correctly:

1. **Create preset with pure colors:**
   - Pure red: Should be vibrant (255, 0, 0)
   - Pure blue: Should be vivid (0, 0, 255)
   - Pure green: Should be saturated (0, 255, 0)

2. **Compare preview vs. activation:**
   - Select light, preview effect
   - Save as preset
   - Activate saved preset
   - Colors should match exactly (no washing out)

3. **Check color picker accuracy:**
   - Select a specific color in picker
   - Verify activated color matches selection
   - Should not shift hue or lose saturation

## Constraints and Limits

### Color Constraints
- RGB values: 0-255
- Effect colors: 1-8 per effect
- Gradient colors: 2-6
- Block colors: 1-6
- Segment sequence colors: 1-6

### Timing Constraints
- Speed: 1-100
- Brightness: 1-100% (UI) -> converted to 1-255 (device) via brightness_percent_to_device()
- Color temperature: 2700-6500K
- Transition time: 0-3600 seconds (1 hour max)
- Hold time: 0-3600 seconds
- Duration: 0-3600 seconds

### Sequence Constraints
- Steps per sequence: 1-20
- Loop count (when mode=count): 1-100

### Device Constraints
- T1M-20: 20 segments
- T1M-26: 26 segments
- T1 Strip: 5 segments per meter (variable length, up to 10 meters = 50 segments)
- T2 Bulb: 0 segments

## Runtime Data Storage

Integration stores components in hass.data[DOMAIN]:
- `mqtt_client` - MQTTClient instance
- `state_manager` - StateManager instance
- `cct_sequence_manager` - CCTSequenceManager instance
- `segment_sequence_manager` - SegmentSequenceManager instance
- `favorites_store` - FavoritesStore instance (per-user favorites)

Config entry stores runtime_data:
```python
@dataclass
class AqaraLightingRuntimeData:
    config_entry: ConfigEntry
    z2m_base_topic: str
    devices: dict[str, Z2MDevice]  # IEEE address -> Z2MDevice
    entity_to_z2m_map: dict[str, str]  # entity_id -> z2m_friendly_name
    device_states: dict[str, DeviceState]  # entity_id -> DeviceState
```

## Group Synchronization

Services support Home Assistant light groups:

1. **Group Detection**: Check if entity state has "entity_id" attribute (indicates light group)
2. **Entity Resolution**: Extract all member entity IDs from group
3. **Deduplication**: Remove duplicate entities (preserving order)
4. **Parallel Publishing**: Use asyncio.gather for synchronized MQTT publishes
5. **Brightness Control**: Parallel light.turn_on calls with GROUP_SYNC_DELAY (0.05s)

Example:
```python
# User calls service on group
entity_id: light.living_room_group

# Resolves to
["light.ceiling_1", "light.ceiling_2", "light.strip_1"]

# All three lights receive effect simultaneously
```

## Development Patterns

### Adding New Service

1. Define service constant in const.py
2. Add schema in services.py (SERVICE_*_SCHEMA)
3. Implement handler function in services.py
4. Register in async_setup_services()
5. Add definition to services.yaml
6. Add translations to translations/en.json (service name, description, field names/descriptions)

### Adding New Preset

1. Define preset constant in const.py (PRESET_*)
2. Add to appropriate preset dict (EFFECT_PRESETS, SEGMENT_PATTERN_PRESETS, etc.)
3. Specify device_types for filtering
4. Include icon reference

### Adding New Device Model

1. Add model ID constant to const.py
2. Create DeviceCapabilities entry in light_capabilities.py (MODEL_CAPABILITIES dict)
3. Specify segment_count, supported_effects, addressing capabilities
4. Effect types may need addition to EffectType enum in models.py

### Adding New Activation Pattern

1. Add constant to const.py (ACTIVATION_*)
2. Implement pattern logic in segment_sequence_manager.py (_get_activation_order method)
3. Update voluptuous schema validation in services.py
4. Add to SegmentSequenceStep validation in models.py

### Adding New Frontend UI Components

**⚠️ CRITICAL: Always add translations BEFORE implementing UI**

1. **Add all translations first** to translations/en.json under `panel` section:
   ```json
   {
     "panel": {
       "your_feature": {
         "title": "Feature Title",
         "description": "Feature description",
         "button_label": "Click Here",
         "error_message": "Something went wrong"
       }
     }
   }
   ```

2. **Create helper method** (if not already exists):
   ```typescript
   private _localize(key: string, values?: Record<string, string>): string {
     let translated = this.hass.localize(`component.aqara_advanced_lighting.panel.${key}`) || key;
     if (values) {
       Object.keys(values).forEach(placeholder => {
         const value = values[placeholder];
         if (value !== undefined) {
           translated = translated.replace(`{${placeholder}}`, value);
         }
       });
     }
     return translated;
   }
   ```

3. **Use translations in all UI text**:
   ```typescript
   render() {
     return html`
       <div class="title">${this._localize('your_feature.title')}</div>
       <button>${this._localize('your_feature.button_label')}</button>
     `;
   }
   ```

4. **Rebuild frontend**: `cd frontend_src && npm run build`

5. **Test in Home Assistant**: Verify all text displays correctly

**NEVER use hardcoded strings like `"My Title"` in UI code - this will fail compliance checks.**

## Testing the Integration

### Manual Testing Flow

1. Install MQTT integration in Home Assistant
2. Configure Zigbee2MQTT with supported Aqara light
3. Add integration via UI: Settings -> Devices & Services -> Add Integration -> "Aqara Advanced Lighting"
4. Configure Z2M base topic (default: "zigbee2mqtt")
5. Call services via Developer Tools -> Services

### Example Service Calls

**Effect with preset**:
```yaml
service: aqara_advanced_lighting.set_dynamic_effect
data:
  entity_id: light.bedroom_ceiling
  preset: t1m_sunset
```

**Custom effect**:
```yaml
service: aqara_advanced_lighting.set_dynamic_effect
data:
  entity_id: light.bedroom_ceiling
  effect: breathing
  speed: 75
  color_1: [255, 0, 0]
  color_2: [0, 0, 255]
```

**CCT sequence**:
```yaml
service: aqara_advanced_lighting.start_cct_sequence
data:
  entity_id: light.bedroom_ceiling
  preset: goodnight
```

**Segment pattern**:
```yaml
service: aqara_advanced_lighting.set_segment_pattern
data:
  entity_id: light.living_room_ceiling
  preset: segment_1
```

**Custom gradient**:
```yaml
service: aqara_advanced_lighting.create_gradient
data:
  entity_id: light.living_room_ceiling
  color_1: [255, 0, 0]
  color_2: [255, 255, 0]
  color_3: [0, 255, 0]
```

## Troubleshooting Reference

### Common Issues

**"extra keys not allowed" error in service calls**:
This error occurs when the frontend sends parameters that don't match the service schema defined in services.py. When adding new services or updating frontend code:
- Check the voluptuous schema in services.py for exact parameter names (e.g., `speed` not `effect_speed`)
- Effect services use individual color parameters (`color_1`, `color_2`, etc.) not an array (`effect_colors`)
- Pattern services use `segment_colors` not `segments`
- Sequence services use individual step fields (`step_1_color_temp`, `step_2_brightness`, etc.) not a `steps` array
- Always verify parameter names against the ATTR_* constants in const.py

**Device not discovered**:
- Check Z2M base topic matches config
- Verify device appears in Z2M UI
- Check model ID in MODEL_CAPABILITIES dict
- Review mqtt_client discovery logs

**Effect not working**:
- Validate effect type for device model (use validate_effect_for_model)
- Check MQTT payload order (effect, effect_speed, effect_colors)
- Verify Z2M friendly name mapping succeeded

**Segments not responding**:
- Verify device supports_segment_addressing
- Check segment range is within max_segments
- Review segment_utils parse_segment_range output

**Sequence stops unexpectedly**:
- Check if light was manually turned off (triggers auto-stop)
- Review sequence manager logs for errors
- Verify sequence parameters within constraints

**State restoration fails**:
- Check .storage/aqara_advanced_lighting.state_manager exists
- Verify state timestamp is within 24 hours
- Review state_manager logs for load errors

### Home Assistant Theme Styling Standards

The frontend must use Home Assistant's CSS custom properties (variables) to ensure consistent appearance with the user's selected theme. Never use hardcoded colors - always reference HA theme variables.

**Core Color Variables:**
| Variable | Usage |
|----------|-------|
| `--primary-color` | Main accent color (buttons, active states, links) |
| `--accent-color` | Secondary accent color |
| `--primary-text-color` | Main text color |
| `--secondary-text-color` | Muted/helper text color |
| `--text-primary-color` | Text on primary-color backgrounds (contrast text) |
| `--disabled-text-color` | Disabled/inactive text |

**Background Variables:**
| Variable | Usage |
|----------|-------|
| `--card-background-color` | Card/container backgrounds |
| `--primary-background-color` | Section/panel backgrounds |
| `--secondary-background-color` | Hover states, alternate backgrounds |

**UI Element Variables:**
| Variable | Usage |
|----------|-------|
| `--divider-color` | Borders, separators, inactive outlines |
| `--error-color` | Error states, delete actions |
| `--warning-color` | Warning states, caution indicators |
| `--ha-card-border-radius` | Standard card border radius |

**Usage Example in LitElement:**
```typescript
static get styles() {
  return css`
    .my-card {
      background: var(--card-background-color);
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 8px);
    }

    .my-button:hover {
      background: var(--primary-color);
      color: var(--text-primary-color);  /* Contrast text on primary */
    }

    .helper-text {
      color: var(--secondary-text-color);
    }
  `;
}
```

**Important Notes:**
- Never use hardcoded hex colors like `#ffffff` or `#000000`
- Use fallback values sparingly: `var(--ha-card-border-radius, 8px)`
- Test with both light and dark themes
- The `--text-primary-color` variable is for text ON primary-color backgrounds (high contrast)
- The `--primary-text-color` variable is for regular text on normal backgrounds

Reference: [HA Frontend Integration](https://www.home-assistant.io/integrations/frontend/)

### Warning and Error Message Styling Standards

All warning and error messages in the frontend must use a consistent styling pattern with a colored left border accent. This approach maintains visual consistency across all editor components and works well with both light and dark themes.

**Base Pattern:**
```css
.message-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--secondary-background-color);
  color: var(--secondary-text-color);
  border: 1px solid var(--divider-color);
  border-left: 4px solid <accent-color>;
  border-radius: 4px;
  font-size: 13px;
}

.message-box ha-icon {
  flex-shrink: 0;
  --mdc-icon-size: 18px;
}
```

**Message Types and Colors:**
| Type | Class Name | Left Border Color | Icon | Usage |
|------|------------|-------------------|------|-------|
| Information | `.preview-warning` | `--warning-color, #ffc107` | `mdi:information` | Helpful hints, missing prerequisites |
| Error | `.error-warning` | `--error-color, #db4437` | `mdi:alert-circle` | Incompatible selections, blocking issues |
| Success | `.success-message` | `--success-color, #4caf50` | `mdi:check-circle` | Confirmations (if needed) |

**Usage Example:**
```typescript
// Information message (yellow accent)
${!this.hasSelectedEntities
  ? html`
      <div class="preview-warning">
        <ha-icon icon="mdi:information"></ha-icon>
        <span>Select light entities in the Activate tab to preview.</span>
      </div>
    `
  : ''}

// Error message (red accent)
${this._hasIncompatibleDevice()
  ? html`
      <div class="error-warning">
        <ha-icon icon="mdi:alert-circle"></ha-icon>
        <span>Selected device is not compatible with this feature.</span>
      </div>
    `
  : ''}
```

**Important Notes:**
- Never use solid colored backgrounds with white text (poor accessibility in some themes)
- Always include an icon to reinforce the message type visually
- Place messages near the relevant controls or at the bottom of forms
- Use the same styling across all editor components for consistency

### ha-card Section Styling Standards

Use `<ha-card>` elements for content sections (preset grids, settings groups, etc.) to ensure compatibility with Home Assistant themes. The `ha-card` component automatically inherits theme variables for background, border-radius, and shadows.

**Basic Pattern:**

```typescript
// In render method
return html`
  <ha-card class="section">
    <div class="section-header" @click=${() => this._toggleSection(sectionId)}>
      <div>
        <div class="section-title">Section Title</div>
        <div class="section-subtitle">Optional subtitle</div>
      </div>
      <ha-icon .icon=${isCollapsed ? 'mdi:chevron-down' : 'mdi:chevron-up'}></ha-icon>
    </div>
    <div class="section-content ${isCollapsed ? 'collapsed' : ''}">
      <!-- Section content here -->
    </div>
  </ha-card>
`;
```

**Required CSS:**

```css
/* Use ha-card.section selector to style cards used as sections */
ha-card.section {
  --ha-card-background: var(--card-background-color, var(--primary-background-color));
  --ha-card-border-radius: var(--ha-card-border-radius, 8px);
  padding: 16px;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  cursor: pointer;
  user-select: none;
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--primary-text-color);
}

.section-subtitle {
  font-size: 12px;
  color: var(--secondary-text-color);
  margin-top: 4px;
}

.section-content.collapsed {
  display: none;
}
```

**Why Use ha-card:**

1. **Theme Compatibility**: Automatically inherits `--ha-card-background`, `--ha-card-border-radius`, and box shadow from HA themes
2. **Consistency**: Matches the visual style of other HA UI components
3. **Dark/Light Mode**: Handles theme switching automatically
4. **Custom Themes**: Respects user-installed custom themes

**CSS Custom Properties Used by ha-card:**

| Variable | Purpose | Fallback |
|----------|---------|----------|
| `--ha-card-background` | Card background color | `--card-background-color` |
| `--ha-card-border-radius` | Corner radius | `8px` |
| `--ha-card-box-shadow` | Drop shadow | Theme-dependent |

**Do NOT:**
- Use plain `<div class="section">` with manual background/border-radius styles
- Hardcode colors or border-radius values
- Create custom card-like elements when `ha-card` would work

### Home Assistant Frontend UI Components

This section documents how to implement HA-compliant frontend UI using the same components and patterns as Home Assistant's built-in panels (Developer Tools, History, etc.). Using these native components ensures automatic styling updates with future HA releases.

---

### Panel Header with Tabs (Developer Tools Pattern)

For panels with tab navigation, use a custom fixed header with `ha-tab-group` following HA's Developer Tools pattern. This provides proper mobile support and tab functionality.

**Recommended Pattern:**

```typescript
protected render() {
  return html`
    <div class="header">
      <div class="toolbar">
        <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
        <div class="main-title">Panel Title</div>
      </div>
      <ha-tab-group @wa-tab-show=${this._handleTabChange}>
        <ha-tab-group-tab slot="nav" panel="tab1" .active=${this._activeTab === 'tab1'}>
          Tab 1
        </ha-tab-group-tab>
        <ha-tab-group-tab slot="nav" panel="tab2" .active=${this._activeTab === 'tab2'}>
          Tab 2
        </ha-tab-group-tab>
      </ha-tab-group>
    </div>
    <div class="content">
      ${this._renderTabContent()}
    </div>
  `;
}

private _handleTabChange(ev: CustomEvent<{ name: string }>): void {
  const newTab = ev.detail.name;
  if (!newTab) {
    return;
  }
  if (newTab !== this._activeTab) {
    this._activeTab = newTab;
  }
}
```

**Required CSS:**

```css
:host {
  display: block;
  height: 100%;
  background-color: var(--primary-background-color);
  color: var(--primary-text-color);
}

/* Fixed header - follows HA developer-tools pattern */
.header {
  background-color: var(--app-header-background-color);
  color: var(--app-header-text-color, var(--text-primary-color));
  border-bottom: 1px solid var(--divider-color);
  position: fixed;
  top: env(safe-area-inset-top, 0px);
  left: var(--mdc-drawer-width, 0px);
  right: 0;
  z-index: 4;
}

:host([narrow]) .header {
  left: 0;
}

/* Toolbar - hamburger menu and title */
.toolbar {
  display: flex;
  align-items: center;
  height: var(--header-height, 56px);
  padding: 0 12px;
  box-sizing: border-box;
}

.main-title {
  margin-left: 8px;
  font-size: 20px;
  font-weight: 400;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ha-tab-group styling */
ha-tab-group {
  --track-color: var(--divider-color);
  --indicator-color: var(--primary-color);
}

ha-tab-group-tab {
  --ha-tab-active-text-color: var(--primary-color);
}

/* Content area with padding for fixed header */
.content {
  padding: calc(var(--header-height, 56px) + 48px + 16px + env(safe-area-inset-top, 0px)) 16px 16px;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
  min-height: 100vh;
}

/* Mobile responsive */
@media (max-width: 600px) {
  .content {
    padding: calc(var(--header-height, 56px) + 48px + 8px + env(safe-area-inset-top, 0px)) 8px 8px;
  }

  .toolbar {
    padding: 0 4px;
  }

  .main-title {
    font-size: 18px;
  }

  ha-tab-group-tab {
    font-size: 12px;
  }
}
```

**Key Points:**

1. **ha-tab-group with @wa-tab-show**: The event fires when a tab is selected, with `ev.detail.name` containing the `panel` attribute value
2. **ha-tab-group-tab attributes**: Use `slot="nav"`, `panel="tabname"`, and `.active=${condition}`
3. **Fixed header positioning**: Uses `position: fixed` with proper insets for sidebar and safe areas
4. **Content padding**: Must account for header height (56px) + tab height (48px) + safe-area-inset
5. **:host([narrow])**: When sidebar is collapsed, header extends to left edge

**The `narrow` Property:**

HA passes a `narrow` boolean property to panels indicating mobile/narrow viewport mode:
- `narrow = true`: Sidebar is collapsed, menu button shows hamburger icon
- `narrow = false`: Sidebar is visible, menu button may be hidden

**Important**: Declare the narrow property to receive it from HA:
```typescript
@property({ type: Boolean, reflect: true }) public narrow = false;
```

---

### ha-expansion-panel (Collapsible Sections)

Use `ha-expansion-panel` for collapsible content sections. This replaces custom toggle implementations and ensures consistent styling.

**Pattern:**

```typescript
<ha-expansion-panel
  outlined
  .expanded=${!this._collapsed[sectionId]}
  @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange(sectionId, e)}
>
  <div slot="header" class="section-header">
    <div>
      <div class="section-title">Section Title</div>
      <div class="section-subtitle">5 items</div>
    </div>
  </div>
  <div class="section-content">
    <!-- Content here -->
  </div>
</ha-expansion-panel>

private _handleExpansionChange(sectionId: string, e: CustomEvent): void {
  const expanded = e.detail.expanded;
  this._collapsed = {
    ...this._collapsed,
    [sectionId]: !expanded,
  };
}
```

**Required CSS:**

```css
ha-expansion-panel {
  --expansion-panel-content-padding: 0 16px 16px 16px;
  --ha-card-border-radius: var(--ha-card-border-radius, 12px);
  margin-bottom: 16px;
  display: block;
}

ha-expansion-panel[outlined] {
  border-radius: var(--ha-card-border-radius, 12px);
  border: 1px solid var(--divider-color);
  background: var(--card-background-color);
}

ha-expansion-panel .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px;
}

ha-expansion-panel .section-content {
  padding: 0;  /* Handled by --expansion-panel-content-padding */
}

.section-title {
  font-size: var(--ha-font-size-l, 18px);
  font-weight: var(--ha-font-weight-medium, 500);
  color: var(--primary-text-color);
}

.section-subtitle {
  font-size: var(--ha-font-size-s, 12px);
  color: var(--secondary-text-color);
  margin-top: 4px;
}
```

**Key Points:**

1. **outlined attribute**: Adds border styling
2. **@expanded-changed event**: Fires when panel is toggled, `e.detail.expanded` is boolean
3. **slot="header"**: Required for custom header content
4. **--expansion-panel-content-padding**: CSS variable controls content padding

---

### ha-card (Content Cards)

Use `ha-card` for distinct content sections like controls, forms, and preset grids.

**Pattern:**

```typescript
<ha-card class="controls">
  <div class="control-row">
    <span class="control-label">Setting Name</span>
    <div class="control-input">
      <ha-selector .hass=${this.hass} .selector=${{...}} ...></ha-selector>
    </div>
  </div>
</ha-card>
```

**Required CSS:**

```css
ha-card.controls {
  padding: 16px;
  margin-bottom: 24px;
}

ha-card.editor-form {
  padding: 16px;
}

.control-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.control-label {
  font-size: var(--ha-font-size-m, 14px);
  font-weight: var(--ha-font-weight-medium, 500);
  color: var(--primary-text-color);
}

.control-input {
  width: 100%;
}
```

**ha-card CSS Variables:**

| Variable | Purpose |
|----------|---------|
| `--ha-card-background` | Card background color |
| `--ha-card-border-radius` | Corner radius (default: 12px) |
| `--ha-card-box-shadow` | Drop shadow |

---

### ha-alert (Status Messages)

Use `ha-alert` for error, warning, and info messages instead of custom styled divs.

**Pattern:**

```typescript
<ha-alert alert-type="error" title="Error Title">
  Error message details here.
</ha-alert>

<ha-alert alert-type="warning" title="Warning">
  Warning message here.
</ha-alert>

<ha-alert alert-type="info">
  Informational message.
</ha-alert>
```

**Alert Types:**
- `error` - Red styling for errors
- `warning` - Yellow/orange styling for warnings
- `info` - Blue styling for information
- `success` - Green styling for success messages

**CSS:**

```css
ha-alert {
  display: block;
  margin-bottom: 16px;
}
```

---

### ha-selector (Form Inputs)

Use `ha-selector` for all form inputs to get HA-native input components.

**Common Selector Types:**

```typescript
// Target selector (entity/device/area picker)
<ha-selector
  .hass=${this.hass}
  .selector=${{ target: { entity: { domain: 'light' } } }}
  .value=${{ entity_id: this._selectedEntities }}
  @value-changed=${this._handleTargetChanged}
></ha-selector>

// Number slider
<ha-selector
  .hass=${this.hass}
  .selector=${{ number: { min: 1, max: 100, mode: 'slider', unit_of_measurement: '%' } }}
  .value=${this._brightness}
  @value-changed=${this._handleBrightnessChange}
></ha-selector>

// Boolean toggle
<ha-selector
  .hass=${this.hass}
  .selector=${{ boolean: {} }}
  .value=${this._enabled}
  @value-changed=${this._handleToggle}
></ha-selector>

// Text input
<ha-selector
  .hass=${this.hass}
  .selector=${{ text: {} }}
  .value=${this._name}
  @value-changed=${this._handleNameChange}
></ha-selector>

// Select dropdown
<ha-selector
  .hass=${this.hass}
  .selector=${{ select: { options: ['option1', 'option2'] } }}
  .value=${this._selected}
  @value-changed=${this._handleSelect}
></ha-selector>
```

**CSS:**

```css
ha-selector {
  display: block;
  width: 100%;
}
```

**Boolean Toggle Alignment Issue:**

When using `ha-selector` with `boolean: {}`, the toggle is wrapped in `ha-formfield` with shadow DOM that uses `display: flex` and `space-between` alignment, causing the toggle to appear right-aligned. This cannot be overridden with external CSS because of shadow DOM encapsulation.

**Solution:** For left-aligned boolean toggles, use `ha-switch` directly instead of `ha-selector`:

```typescript
// Instead of ha-selector with boolean (right-aligned, cannot be changed)
<ha-selector
  .hass=${this.hass}
  .selector=${{ boolean: {} }}
  .value=${this._enabled}
  @value-changed=${this._handleToggle}
></ha-selector>

// Use ha-switch directly (left-aligned, full control)
<ha-switch
  .checked=${this._enabled}
  @change=${this._handleToggle}
></ha-switch>
```

**Handler difference:**
```typescript
// ha-selector boolean handler
private _handleToggle(e: CustomEvent): void {
  this._enabled = e.detail.value;
}

// ha-switch handler
private _handleToggle(e: Event): void {
  this._enabled = (e.target as HTMLInputElement).checked;
}
```

---

### ha-button and ha-icon-button

Use HA button components for consistent button styling.

**Pattern:**

```typescript
// Standard button
<ha-button @click=${this._handleClick}>
  <ha-icon icon="mdi:play"></ha-icon>
  Play
</ha-button>

// Icon-only button
<ha-icon-button @click=${this._handleClick} title="Play">
  <ha-icon icon="mdi:play"></ha-icon>
</ha-icon-button>
```

---

### ha-svg-icon (SVG Path Icons)

For custom icons using SVG paths (when mdi icons aren't suitable):

```typescript
<ha-svg-icon .path=${'M8 5.14v14l11-7-11-7z'}></ha-svg-icon>
```

---

### HA Font Variables

Use HA's font CSS variables for consistent typography:

| Variable | Default | Usage |
|----------|---------|-------|
| `--ha-font-size-xs` | 11px | Very small text |
| `--ha-font-size-s` | 12-13px | Small text, subtitles |
| `--ha-font-size-m` | 14px | Body text |
| `--ha-font-size-l` | 16-18px | Section titles |
| `--ha-font-size-xl` | 20px | Page titles |
| `--ha-font-weight-medium` | 500 | Semi-bold text |
| `--ha-line-height-normal` | 1.5 | Standard line height |
| `--ha-line-height-condensed` | 1.2 | Tight line height |

---

### Component Summary

| Component | Use Case |
|-----------|----------|
| `ha-tab-group` + `ha-tab-group-tab` | Tab navigation |
| `ha-expansion-panel` | Collapsible sections |
| `ha-card` | Content containers |
| `ha-alert` | Status messages |
| `ha-selector` | Form inputs |
| `ha-button` | Action buttons |
| `ha-icon-button` | Icon-only buttons |
| `ha-icon` | MDI icons |
| `ha-svg-icon` | Custom SVG path icons |
| `ha-menu-button` | Sidebar menu toggle |

**Always prefer HA native components over custom implementations to ensure compatibility with future HA updates and theme consistency.**

### Frontend-Backend Integration Quirks

**Segment indexing mismatch**:
The frontend uses 0-based indexing internally (segment cells 0-25), but the backend expects 1-based indexing (segments 1-26). The backend's `parse_segment_range()` in segment_utils.py filters with `0 < s <= max_segments`, which rejects segment 0.
- When saving/previewing patterns: Add +1 to segment numbers (`segment: segment + 1`)
- When loading presets: Subtract 1 from segment numbers (`segNum - 1`)
- Example in pattern-editor.ts `_getPresetData()`: `segments.push({ segment: segment + 1, color })`

**T1 Strip length detection**:
The T1 Strip length may not be directly on the light entity's attributes. Z2M often exposes it as a separate entity. The frontend must check multiple sources (matching backend logic in `_get_actual_segment_count()`):
1. Direct attribute: `entity.attributes.length`
2. Separate entity: `number.{light_name}_length` or `sensor.{light_name}_length`
3. Default fallback: 50 segments (10 meters max)

Segment count calculation: `segments = Math.round(lengthMeters * 5)` (5 segments per meter)

**ha-selector dropdown behavior**:
Home Assistant's `ha-selector` with `select` type does not fire `value-changed` when clicking the already-selected first item. This can cause issues when the user wants to re-confirm a selection. Workaround: Start dropdowns with a placeholder option like `{ value: '', label: 'Select...' }`.

**Pattern preset activation - turn_off_unspecified**:
When activating segment patterns, unspecified segments retain their previous color unless `turn_off_unspecified: true` is passed to the service call. This parameter should be included in both preview and activation calls to ensure clean pattern display.

**LitElement property reactivity**:
When passing dynamic values like `stripSegmentCount` to child components:
- Use `@property({ type: Number })` in the child for the prop to be reactive
- Add `updated(changedProps)` handler if cleanup is needed when prop changes
- The render method will automatically re-run when any `@property` changes

## Quick Reference - Key Functions

### MQTT Client
- `async_setup()` - Initialize and discover devices
- `async_publish_dynamic_effect(z2m_name, effect)` - Send effect to device
- `async_publish_segment_pattern(z2m_name, segments)` - Send segment colors
- `async_publish_batch_effects(entities_effects)` - Parallel effect publishing
- `get_z2m_friendly_name(entity_id)` - Map entity to Z2M name

### State Manager
- `capture_state(entity_id, z2m_friendly_name)` - Store pre-effect state
- `get_restoration_payload(entity_id)` - Generate MQTT restore payload
- `clear_state(entity_id)` - Remove stored state
- `async_load()` - Load from storage
- `async_save()` - Persist to storage

### CCT Sequence Manager
- `start_sequence(entity_id, sequence)` - Begin sequence execution
- `stop_sequence(entity_id)` - Stop running sequence
- `pause_sequence(entity_id)` - Pause at current step
- `resume_sequence(entity_id)` - Resume paused sequence
- `is_running(entity_id)` - Check if sequence active
- `stop_all_sequences()` - Emergency stop all

### Segment Sequence Manager
- Same API as CCT Sequence Manager

### Light Capabilities
- `is_supported_model(model_id)` - Check support
- `get_device_capabilities(model_id)` - Get capabilities dataclass
- `validate_effect_for_model(model_id, effect)` - Validate effect
- `get_supported_effects_for_model(model_id)` - List effects
- `supports_segment_addressing(model_id)` - Check addressing support
- `get_segment_count(model_id)` - Get segment count

### Segment Utils
- `parse_segment_range(segment_str, max_segments)` - Parse to int list
- `generate_gradient_colors(colors, segment_count)` - Interpolate colors
- `generate_block_colors(colors, segment_count, expand)` - Block pattern
- `expand_segment_colors(segment_colors, max_segments)` - Expand ranges

### Favorites Store
- `async_load()` - Load favorites from storage
- `async_save()` - Persist favorites to storage
- `add_favorite(user_id, entity_id)` - Add entity to user's favorites
- `remove_favorite(user_id, entity_id)` - Remove entity from user's favorites
- `get_favorites(user_id)` - Get list of user's favorite entities
- `is_favorite(user_id, entity_id)` - Check if entity is favorited

## Version History

- **0.5.0** - Migrated to HA-compliant translations directory structure, added visual editors and preset system
- **0.4.1** - Added panel favorites and light control tiles
- **0.4.0** - Added segment sequences with activation patterns
- **0.3.0** - Added CCT sequences with pause/resume controls
- **0.2.0** - Added segment patterns with presets
- **0.1.0** - Initial release with dynamic effects

## Architecture Summary

The integration is a service-oriented backend that:
1. Bridges Home Assistant to Aqara lights via Zigbee2MQTT
2. Manages complex sequences through background asyncio tasks
3. Preserves and restores light state before/after effects
4. Supports 11 device models across 4 device types
5. Provides flexible segment addressing with intuitive syntax
6. Offers 39 built-in presets (23 effects + 12 patterns + 4 sequences)
7. Enables group synchronization with coordinated effects
8. Fires events for automation triggers on sequence lifecycle

No custom entities or platforms are created - all functionality is service-based.
