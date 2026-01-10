# Aqara Advanced Lighting

Home Assistant HACS integration for advanced control of the Aqara T1M Ceiling Light, T1 LED Strip, and T2 bulbs via Zigbee2MQTT.

## Overview

Easily control the more advanced features of the Aqara T1M Ceiling Light, T1 LED Strip, and T2 bulbs, with RGB dynamic effects, RGB segment patterns & gradients, CCT sequences, and state restoration. Create and save custom presets, target multiple lights at once.

Home Assistant backend services for easy integration into automations and scripts. Frontend sidebar accessible panel for easy creation and activation of presets, with builder UI for effects and segment patterns, plus sequencers for dynamic CCT control and animated segment patterns.

_Please :star: this integration if you find it useful_

_If you want to show your support please_

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)

### Supported Devices

| Device | Model | Segments | Dynamic Effects | Segment Control | CCT Sequences |
|-------|--------|----------|-----------------|-----------------|---------------|
| T1 Ceiling Light (20 segments) | ACN031 | 20 | ✓ 6 effects | ✓ | ✓ |
| T1M Ceiling Light (26 segments) | ACN032 | 26 | ✓ 6 effects | ✓ | ✓ |
| T1 LED Strip | ACN132 | Variable (5/meter) | ✓ 8 effects | ✓ | ✓ |
| T2 RGB Bulb (E26/E27/GU10) | AGL001/AGL003/AGL005/AGL007 | N/A | ✓ 4 effects | N/A | ✓ |
| T2 CCT Bulb (E26/E27/GU10) | AGL002/AGL004/AGL006/AGL008 | N/A | N/A | N/A | ✓ |

### Features

- **Sidebar Panel** - UI control panel for managing lights, effects, and sequences from the Home Assistant sidebar
  - Save favorite light targets for quick access
  - Light control tiles for turning lights on/off and adjusting brightness
  - Access to all effect and sequence presets
  - **Visual Editors** - Create custom effects, patterns, and sequences with interactive builders
    - Effect editor with color pickers and effect type selector
    - Segment pattern editor with visual segment selection
    - CCT sequence editor with multi-step timeline
    - RGB segment sequence editor with animation patterns
  - **User Preset System** - Save, edit, and manage your custom presets
    - Create and save unlimited custom presets for all feature types
    - Edit existing presets with full customization options
    - Duplicate presets to create variations
    - Delete unwanted presets
    - Persistent storage across Home Assistant restarts
- **Aqara App Effect Presets** - Quick access to 24 preset effect scenes from the Aqara Home app
  - 4 T2 Bulb presets (Candlelight, Breath, Colorful, Security)
  - 9 T1M presets (Dinner, Sunset, Autumn, Galaxy, Daydream, Holiday, Party, Meteor, Alert)
  - 7 T1 Strip presets (Rainbow, Heartbeat, Gala, Sea of Flowers, Rhythmic, Exciting, Colorful)
- **Segment Pattern Presets** - 12 T1M/T1 Strip segment color patterns from the Aqara Home app
- **Dynamic RGB Effects** - 13 different effects including breathing, fading, flowing, chasing, rainbow, and more
- **Effect Dropdown Selector** - UI dropdown showing all available effects and presets
- **RGB Color Pickers** - Color picker UI for all services (up to 8 colors for effects, 6 for gradients)
- **Individual Segment Control** - Set custom colors for each segment on T1M and T1 Strip lights
- **Smooth Color Gradients** - Create color gradients across segments with 2-6 colors
- **Color Block Patterns** - Generate evenly spaced or alternating color blocks
- **Flexible Segment Selection** - Support for ranges ("1-20"), individual segments, and special selectors ("odd", "even", "firs-half", "last-third" etc)
- **RGB Segment Sequences** - Create animated segment patterns with up to 20 customizable steps
  - Multiple activation patterns (sequential forward/reverse, random, simultaneous)
  - Support for gradients, blocks, and individual colors
  - Built-in presets: Loading bar, Wave, Sparkle and more
  - Pause and resume capability
- **CCT Dynamic Sequences** - Create multi-step color temperature and brightness sequences with smooth transitions
  - Enhanced with pause and resume functionality
- **T1 Strip Variable Length Support** - Automatically detects and adapts to T1 Strip's length (1-10 meters)
- **Light Group Support** - All services work with Home Assistant light groups for synchronized multi-light control
- **Auto Turn-On Option** - Optionally turn lights on automatically before applying effects or sequences
- **Unspecified Segment Control** - Option to turn off segments not included in patterns
- **Automatic Device Discovery** - Discovers supported Aqara lights through Zigbee2MQTT
- **Service-Based API** - All features accessible via Home Assistant services, automations, and scripts

## Requirements

- Home Assistant 2025.12.0 or newer (older versions not tested)
- MQTT integration configured and running
- Zigbee2MQTT 2.7.2 or newer
- Supported Aqara light devices (see table above)

## Installation

### HACS

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=absent42&repository=Aqara-Advanced-Lighting&category=Integration)

Restart Home Assistant

Alternatively:
1. Open HACS in Home Assistant
2. Go to "Integrations"
3. Click the three dots menu (top right) → "Custom repositories"
4. Add repository URL: `https://github.com/absent42/Aqara-Advanced-Lighting`
5. Category: "Integration"
6. Click "Add"
7. Find "Aqara Advanced Lighting" in HACS and click "Download"
8. Restart Home Assistant

### Manual Installation

1. Copy the `custom_components/aqara_advanced_lighting` folder to your Home Assistant `custom_components` directory
2. Restart Home Assistant

## Configuration

### Setup

1. Go to **Settings** → **Devices & Services** → **Add Integration**
2. Search for "Aqara Advanced Lighting"
3. Enter your Zigbee2MQTT base topic (default: `zigbee2mqtt`)
4. Click "Submit"

The integration will automatically discover your Aqara lights through Zigbee2MQTT.

### Reconfiguration

To change the Z2M base topic:
1. Go to **Settings** → **Devices & Services**
2. Find "Aqara Advanced Lighting"
3. Click the three dots menu → "Reconfigure"
4. Update the base topic
5. Click "Submit"

## Usage

The features of Advanced Aqara Lighting can be used in multiple ways: with the frontend sidebar UI panel for quick access and preset creation through visual editors, or through Home Assistant services for use in automations and scripts. Presets created in the frontend are also available in backend services.

### Frontend Panel

Access the Aqara Lighting panel from the Home Assistant sidebar for a user-friendly interface to control your lights and create effects and patterns.

#### Favorite Lights

Save your frequently used lights and light groups as favorites for quick access:
- Click the star icon next to any light to add it to favorites
- Favorite lights appear at the top of the panel
- Control tiles show current state and brightness
- Toggle lights on/off directly from the panel
- Adjust brightness with the slider

#### Preset Management

Create, organize, and use custom presets for all features:

**Built-in Aqara Presets**
- 24 effect presets from the Aqara Home app
- 12 segment pattern presets
- 4 CCT sequence presets (Goodnight, Wakeup, Mindful Breathing, Circadian)
- 6 RGB segment sequence presets (Loading Bar, Wave, Sparkle, Theater Chase, Rainbow Fill, Comet)

**User Presets**
- Create unlimited custom presets for any feature
- Edit existing presets to fine-tune settings
- Duplicate presets to create variations
- Delete presets you no longer need
- Sort presets alphabetically or by date
- All presets persist across restarts

**Applying Presets**
1. Select target light(s) from favorites or the dropdown
2. Choose a preset from any category
3. Click "Activate" to apply immediately
4. Optionally enable "Turn on light" for automatic activation

#### Visual Editors

Create custom effects and patterns with interactive builders:

**Effect Editor**
- Select from 13 effect types
- Add up to 8 colors using color pickers
- Adjust speed and brightness with sliders
- Preview colors as you design
- For T1 Strip: specify which segments to light
- Save as custom preset for reuse

**Segment Pattern Editor**
- Visual segment selector shows all available segments
- Click segments to assign colors
- Create gradients across multiple segments
- Generate color block patterns
- Option to turn off unspecified segments
- Works with T1M and T1 Strip lights
- Save patterns as custom presets

**CCT Sequence Editor**
- Build multi-step sequences (up to 20 steps)
- Set color temperature and brightness per step
- Configure transition and hold durations
- Choose loop mode: once, count, or continuous
- Set end behavior: maintain or turn off
- Visual timeline shows sequence flow
- Save sequences as custom presets

**RGB Segment Sequence Editor**
- Create animated segment patterns (up to 20 steps)
- Choose color mode: gradient, blocks, or individual
- Select activation pattern: sequential, random, simultaneous, and more
- Set duration and hold times per step
- Configure loop settings
- Option to clear segments before starting
- Skip first step option for initialization
- Save sequences as custom presets

#### Quick Actions

- **Stop Effects**: Stop any running effect and optionally restore previous light state
- **Pause/Resume**: Control sequence playback mid-execution
- **Light Control**: Direct on/off and brightness control from the panel

### Backend Services

Call these services from automations, scripts, or the Developer Tools.

<details>
<summary>
1. Set Dynamic Effect
</summary>
  
Activate a dynamic RGB effect on your lights - choose from Aqara app presets or create your own custom effect.

**Service:** `aqara_advanced_lighting.set_dynamic_effect`

**Example (Using Preset):**
```yaml
service: aqara_advanced_lighting.set_dynamic_effect
target:
  entity_id: light.aqara_ceiling_light
data:
  preset: "t1m_sunset"
```

**Example (Custom Effect):**
```yaml
service: aqara_advanced_lighting.set_dynamic_effect
target:
  entity_id: light.aqara_ceiling_light
data:
  effect: "breathing"
  speed: 75
  color_1: [255, 0, 0]      # Red (required)
  color_2: [0, 0, 255]      # Blue (optional)
  color_3: [0, 255, 0]      # Green (optional)
```

**Parameters:**
- `entity_id` (required): Light entity or group to control
- `preset` (optional): Aqara app preset effect - dropdown selector with 24 presets
- `effect` (required if no preset): Effect type - dropdown selector with all available effects
- `speed` (required if no preset): Animation speed (1-100%)
- `color_1` through `color_8`: RGB color pickers (color_1 required if no preset, others optional)
- `segments` (optional): For T1 Strip only - segments to apply effect to (e.g., "1-20", "odd", "even")
- `brightness` (optional): Brightness level (1-255)
- `turn_on` (optional): Turn light on before applying effect (default: false)

**Note:** When using `preset`, manual `effect`, `speed`, and `color` parameters are ignored.
</details>

<details>
<summary>
2. Stop Dynamic Effect
</summary>

Stop a running dynamic effect and optionally restore the light to its previous state before the effect was applied.

**Service:** `aqara_advanced_lighting.stop_effect`

**Example:**
```yaml
service: aqara_advanced_lighting.stop_effect
target:
  entity_id: light.aqara_ceiling_light
data:
  restore_state: true
```

**Parameters:**
- `entity_id` (required): Light entity or group to stop effect on
- `restore_state` (optional): Restore light to pre-effect state (default: true)
  - When true: Restores brightness, color (RGB), and color temperature
  - When false: Simply stops the effect, leaving light in current state
  - Falls back to warm white if no previous state is saved

**Note:** The integration automatically saves light state when applying effects or patterns. Saved states persist for 24 hours and across Home Assistant restarts.
</details>

<details>
<summary>
3. Set Segment Pattern
</summary>
Set individual segment colors (T1M and T1 Strip only) - choose from 12 Aqara app presets or create your own custom pattern.

**Service:** `aqara_advanced_lighting.set_segment_pattern`

**Example (Using Preset):**
```yaml
service: aqara_advanced_lighting.set_segment_pattern
target:
  entity_id: light.aqara_ceiling_light
data:
  preset: "segment_1"
  brightness: 200
```

**Example (Custom Pattern):**
```yaml
service: aqara_advanced_lighting.set_segment_pattern
target:
  entity_id: light.aqara_ceiling_light
data:
  segment_colors:
    - segment: 1
      color:
        r: 255
        g: 0
        b: 0
    - segment: "5-10"
      color:
        r: 0
        g: 255
        b: 0
    - segment: 20
      color:
        r: 0
        g: 0
        b: 255
```

**Parameters:**
- `entity_id` (required): Light entity with segment support
- `preset` (optional): Aqara app segment pattern preset (Preset 1 through Preset 12) - dropdown selector
- `segment_colors` (required if no preset): List of segment/color pairs
  - `segment`: Segment number or range (e.g., 1, "5-10", "odd", "even")
  - `color`: RGB color dict with r, g, b values (0-255)
- `brightness` (optional): Brightness level (1-255)
- `turn_on` (optional): Turn light on before applying pattern (default: false)
- `turn_off_unspecified` (optional): Turn off segments not specified (default: false)

**Note:** When using `preset`, the `segment_colors` parameter is ignored. Presets work on T1M (20 & 26 segment) and T1 Strip devices.
</details>

<details>
<summary>
4. Create Gradient
</summary>
Create a smooth color gradient across segments.

**Service:** `aqara_advanced_lighting.create_gradient`

**Example:**
```yaml
service: aqara_advanced_lighting.create_gradient
target:
  entity_id: light.aqara_ceiling_light
data:
  color_1: [255, 0, 0]
  color_2: [255, 255, 0]
  color_3: [0, 0, 255]
  segments: "1-20"
```

**Parameters:**
- `entity_id` (required): Light entity with segment support
- `color_1` (required): First gradient color - RGB color picker
- `color_2` (required): Second gradient color - RGB color picker
- `color_3` through `color_6` (optional): Additional gradient colors - RGB color pickers
- `segments` (optional): Segments to apply gradient to (e.g., "1-20", "5-15")
- `brightness` (optional): Brightness level (1-255)
- `turn_on` (optional): Turn light on before applying gradient (default: false)
- `turn_off_unspecified` (optional): Turn off segments not specified (default: false)
</details>

<details>
<summary>
5. Create Color Blocks
</summary>
Create evenly spaced blocks of color.

**Service:** `aqara_advanced_lighting.create_blocks`

**Example:**
```yaml
service: aqara_advanced_lighting.create_blocks
target:
  entity_id: light.aqara_ceiling_light
data:
  color_1: [255, 0, 0]      # Red (required)
  color_2: [0, 255, 0]      # Green (optional)
  color_3: [0, 0, 255]      # Blue (optional)
  segments: "1-20"
  expand: false
```

**Parameters:**
- `entity_id` (required): Light entity with segment support
- `color_1` (required): First block color - RGB color picker
- `color_2` through `color_6` (optional): Additional block colors - RGB color pickers
- `segments` (optional): Segments to apply blocks to (e.g., "1-20", "odd", "even")
- `expand` (optional): Expand colors to fill segments evenly vs. alternating (default: false)
- `brightness` (optional): Brightness level (1-255)
- `turn_on` (optional): Turn light on before applying blocks (default: false)
- `turn_off_unspecified` (optional): Turn off segments not specified (default: false)
</details>

<details>
<summary>
6. Start CCT Sequence
</summary>
Create and run dynamic CCT (color temperature) sequences with up to 20 customizable steps, or use built-in presets for common scenarios.

**Service:** `aqara_advanced_lighting.start_cct_sequence`

**Usage:** Choose a preset from the dropdown, or use the Home Assistant UI to configure each step individually. Step 1 is required, steps 2-20 are optional and collapsed by default (click "Show advanced fields" to access them).

**Available Presets:**
- **Goodnight**: Gently fade from neutral white to warm dim light over 30 minutes, ideal for falling asleep
- **Wakeup**: Gradually brighten from warm dim to cool daylight over 30 minutes, simulating sunrise
- **Mindful breathing**: Smooth breathing pattern alternating between warm and cool tones, continuous loop

**Example YAML - Using a preset:**
```yaml
service: aqara_advanced_lighting.start_cct_sequence
target:
  entity_id: light.bedroom_ceiling
data:
  preset: "goodnight"        # Use built-in Goodnight preset
  turn_on: true              # Turn on light before starting sequence
```

**Example YAML - Custom sequence (for automations/scripts):**
```yaml
service: aqara_advanced_lighting.start_cct_sequence
target:
  entity_id: light.aqara_ceiling_light
data:
  turn_on: true              # Turn on light before starting sequence
  step_1_color_temp: 2700    # Warm white
  step_1_brightness: 128
  step_1_transition: 2.0     # Fade to this setting over 2 seconds
  step_1_hold: 10.0          # Hold for 10 seconds after transition completes
  step_2_color_temp: 5000    # Cool white
  step_2_brightness: 255
  step_2_transition: 3.0     # Fade over 3 seconds
  step_2_hold: 15.0          # Hold for 15 seconds after transition completes
  step_3_color_temp: 3500    # Neutral white
  step_3_brightness: 200
  step_3_transition: 1.0
  step_3_hold: 8.0
  loop_mode: "count"
  loop_count: 3
  end_behavior: "maintain"
```

**Parameters:**
- `entity_id` (required): Light entity or group to control
- `preset` (optional): Use a built-in preset ("goodnight", "wakeup", "mindful_breathing"). When preset is selected, manual step/loop/end_behavior parameters are ignored
- `turn_on` (optional): Turn light on before starting sequence (default: false)
- **Step 1 fields** (required if not using preset):
  - `step_1_color_temp`: Color temperature in kelvin (2700-6500)
  - `step_1_brightness`: Brightness level (1-255)
  - `step_1_transition`: Time in seconds to transition to this step (0-3600)
  - `step_1_hold`: Time to hold at this step after transition completes (0-3600)
- **Steps 2-20 fields** (optional): Same format as step 1, access via "Show advanced fields" in UI
- `loop_mode` (optional): How to loop the sequence (default: "once", ignored when using preset)
  - `"once"`: Run sequence one time
  - `"count"`: Loop X times (requires loop_count)
  - `"continuous"`: Loop indefinitely until stopped
- `loop_count` (optional): Number of times to repeat (1-1000, required when loop_mode is "count", ignored when using preset)
- `end_behavior` (optional): Action when sequence completes (default: "maintain", ignored when using preset)
  - `"maintain"`: Keep light at last step's settings
  - `"turn_off"`: Turn off the light

**Note:** Each step consists of a transition period followed by a hold period. For example, if transition is 2s and hold is 10s, the light will fade for 2s then remain at those settings for 10s before the next step starts. Transitions use smooth step-based interpolation for gradual brightness and color temperature changes.
</details>

<details>
<summary>
7. Stop CCT Sequence
</summary>
Stop a running CCT sequence on a light.

**Service:** `aqara_advanced_lighting.stop_cct_sequence`

**Example:**
```yaml
service: aqara_advanced_lighting.stop_cct_sequence
target:
  entity_id: light.aqara_ceiling_light
```

**Parameters:**
- `entity_id` (required): Light entity or group to stop sequence on
</details>

<details>
<summary>
8. Pause CCT Sequence
</summary>
Pause a running CCT sequence while maintaining its current state.

**Service:** `aqara_advanced_lighting.pause_cct_sequence`

**Example:**
```yaml
service: aqara_advanced_lighting.pause_cct_sequence
target:
  entity_id: light.aqara_ceiling_light
```

**Parameters:**
- `entity_id` (required): Light entity or group to pause sequence on
</details>

<details>
<summary>
9. Resume CCT Sequence
</summary>
Resume a paused CCT sequence from where it was paused.

**Service:** `aqara_advanced_lighting.resume_cct_sequence`

**Example:**
```yaml
service: aqara_advanced_lighting.resume_cct_sequence
target:
  entity_id: light.aqara_ceiling_light
```

**Parameters:**
- `entity_id` (required): Light entity or group to resume sequence on
</details>

<details>
<summary>
10. Start RGB Segment Sequence
</summary>
Create and run dynamic RGB segment sequences with up to 20 customizable steps on T1M and T1 Strip lights. Each step can have custom colors, activation patterns, and timing.

**Service:** `aqara_advanced_lighting.start_segment_sequence`

**Usage:** Choose a preset from the dropdown, or use the Home Assistant UI to configure each step individually. Step 1 is required, steps 2-20 are optional and collapsed by default (click "Show advanced fields" to access them).

**Available Presets:**
- **Loading bar**: Sequential segment activation creating a loading bar effect
- **Wave**: Smooth color gradient wave flowing back and forth
- **Sparkle**: Random twinkling segments creating a sparkle effect

**Example YAML - Using a preset:**
```yaml
service: aqara_advanced_lighting.start_segment_sequence
target:
  entity_id: light.aqara_ceiling_light
data:
  preset: "wave"
  turn_on: true
```

**Example YAML - Custom sequence:**
```yaml
service: aqara_advanced_lighting.start_segment_sequence
target:
  entity_id: light.aqara_ceiling_light
data:
  turn_on: true
  step_1_segments: "all"
  step_1_colors:
    - r: 255
      g: 0
      b: 0
    - r: 0
      g: 0
      b: 255
  step_1_mode: "gradient"
  step_1_duration: 3.0
  step_1_hold: 2.0
  step_1_activation_pattern: "sequential_forward"
  step_2_segments: "all"
  step_2_colors:
    - r: 0
      g: 255
      b: 0
  step_2_mode: "blocks_repeat"
  step_2_duration: 2.0
  step_2_hold: 1.0
  step_2_activation_pattern: "random"
  loop_mode: "continuous"
  end_behavior: "maintain"
```

**Parameters:**
- `entity_id` (required): Light entity with segment support (T1M or T1 Strip)
- `preset` (optional): Use a built-in preset ("loading_bar", "wave", "sparkle"). When preset is selected, manual step parameters are ignored
- `turn_on` (optional): Turn light on before starting sequence (default: false)
- `clear_segments` (optional): Clear existing segment pattern before starting sequence (default: false)
- `skip_first_in_loop` (optional): Skip the first step when looping (useful for initialization steps, default: false)
- **Step 1 fields** (required if not using preset):
  - `step_1_segments`: Segments to apply pattern to (e.g., "all", "1-20", "odd", "even")
  - `step_1_colors`: List of RGB colors (1-6 colors)
  - `step_1_mode`: Pattern mode ("gradient", "blocks_repeat", "blocks_expand", "individual")
  - `step_1_duration`: Time to complete the activation pattern (0-3600 seconds)
  - `step_1_hold`: Time to hold after activation completes (0-3600 seconds)
  - `step_1_activation_pattern`: How segments activate during the duration phase
    - `"all"`: All segments activate simultaneously (All at Once)
    - `"sequential_forward"`: Segments activate one by one from first to last
    - `"sequential_reverse"`: Segments activate one by one from last to first
    - `"random"`: Segments activate in random order
    - `"ping_pong"`: Segments activate forward then reverse in a ping pong pattern
    - `"centre_out"`: Segments activate from the center outward to both edges
    - `"edges_in"`: Segments activate from both edges inward to the center
    - `"paired"`: Segments activate in pairs (first and last, second and second-last, etc.)
- **Steps 2-20 fields** (optional): Same format as step 1, access via "Show advanced fields" in UI
- `loop_mode` (optional): How to loop the sequence (default: "once", ignored when using preset)
  - `"once"`: Run sequence one time
  - `"count"`: Loop X times (requires loop_count)
  - `"continuous"`: Loop indefinitely until stopped
- `loop_count` (optional): Number of times to repeat (1-1000, required when loop_mode is "count", ignored when using preset)
- `end_behavior` (optional): Action when sequence completes (default: "maintain", ignored when using preset)
  - `"maintain"`: Keep light at last step's settings
  - `"turn_off"`: Turn off the light

**Note:** Each step consists of an activation period (duration) followed by a hold period. Activation patterns determine how segments light up during the duration phase.
</details>

<details>
<summary>
11. Stop RGB Segment Sequence
</summary>
Stop a running RGB segment sequence on a light.

**Service:** `aqara_advanced_lighting.stop_segment_sequence`

**Example:**
```yaml
service: aqara_advanced_lighting.stop_segment_sequence
target:
  entity_id: light.aqara_ceiling_light
```

**Parameters:**
- `entity_id` (required): Light entity to stop sequence on
</details>

<details>
<summary>
12. Pause RGB Segment Sequence
</summary>
Pause a running RGB segment sequence while maintaining its current state.

**Service:** `aqara_advanced_lighting.pause_segment_sequence`

**Example:**
```yaml
service: aqara_advanced_lighting.pause_segment_sequence
target:
  entity_id: light.aqara_ceiling_light
```

**Parameters:**
- `entity_id` (required): Light entity to pause sequence on
</details>

<details>
<summary>
13. Resume RGB Segment Sequence
</summary>
Resume a paused RGB segment sequence from where it was paused.

**Service:** `aqara_advanced_lighting.resume_segment_sequence`

**Example:**
```yaml
service: aqara_advanced_lighting.resume_segment_sequence
target:
  entity_id: light.aqara_ceiling_light
```

**Parameters:**
- `entity_id` (required): Light entity to resume sequence on
</details>

### Available Effects

#### T1M Ceiling Light
- `flow1` - Flowing pattern 1
- `flow2` - Flowing pattern 2
- `fading` - Fading effect
- `hopping` - Color hopping
- `breathing` - Breathing effect
- `rolling` - Rolling pattern

#### T1 LED Strip
- `breathing` - Breathing effect
- `rainbow1` - Rainbow pattern 1
- `chasing` - Chasing lights
- `flash` - Flashing effect
- `hopping` - Color hopping
- `rainbow2` - Rainbow pattern 2
- `flicker` - Flickering effect
- `dash` - Dashing pattern

#### T2 RGB Bulb
- `breathing` - Breathing effect
- `candlelight` - Candlelight flicker
- `fading` - Fading effect
- `flash` - Flashing effect

### Working with Light Groups

All services support Home Assistant light groups. When you target a light group, the integration automatically:
- Detects the group and expands it to individual light entities
- Removes any duplicate entities
- Applies the effect/pattern to all lights simultaneously (when sync parameter is true)
- Uses batch MQTT publishing for optimal performance

**Example - Applying an effect to a group:**
```yaml
service: aqara_advanced_lighting.set_dynamic_effect
target:
  entity_id: light.living_room_group  # Your light group
data:
  preset: "sunset"
  sync: true  # Synchronized effect across all lights
```

## Example Automations YAML

### RGB Dynamic Effects

<details>
<summary>Sunset Effect</summary>

```yaml
automation:
  - alias: "Sunset effect at evening"
    trigger:
      - platform: sun
        event: sunset
    action:
      - service: aqara_advanced_lighting.set_dynamic_effect
        target:
          entity_id: light.living_room_ceiling
        data:
          effect: "breathing"
          speed: 30
          colors:
            - r: 255
              g: 100
              b: 0
            - r: 255
              g: 50
              b: 0
```
</details>

<details>
<summary>Party</summary>

```yaml
script:
  party_mode:
    alias: "Party Mode Lights"
    sequence:
      - service: aqara_advanced_lighting.set_dynamic_effect
        target:
          entity_id: light.led_strip
        data:
          effect: "rainbow1"
          speed: 90
          colors:
            - r: 255
              g: 0
              b: 0
            - r: 255
              g: 255
              b: 0
            - r: 0
              g: 255
              b: 0
            - r: 0
              g: 255
              b: 255
            - r: 0
              g: 0
              b: 255
            - r: 255
              g: 0
              b: 255
```
</details>

<details>
<summary>Morning Routine</summary>
```yaml
automation:
  - alias: "Morning wake up"
    trigger:
      - platform: time
        at: "07:00:00"
    action:
      - service: aqara_advanced_lighting.create_gradient
        target:
          entity_id: light.bedroom_ceiling
        data:
          color_1: [255, 200, 100]   # Warm orange
          color_2: [255, 255, 200]   # Soft white
          turn_on: true
```
</details>

### CCT Preset Automations

<details>
<summary>Wakeup Sequence</summary>
```yaml
automation:
  - alias: "Sunrise wakeup"
    trigger:
      - platform: time
        at: "06:30:00"
    action:
      - service: aqara_advanced_lighting.start_cct_sequence
        target:
          entity_id: light.bedroom_ceiling
        data:
          preset: "wakeup"
          turn_on: true
```
</details>

<details>
<summary>Goodnight Sequence</summary>
```yaml
automation:
  - alias: "Bedtime routine"
    trigger:
      - platform: time
        at: "22:00:00"
    action:
      - service: aqara_advanced_lighting.start_cct_sequence
        target:
          entity_id: light.bedroom_ceiling
        data:
          preset: "goodnight"
          turn_on: true
```
</details>

<details>
<summary>Mindful Breathing</summary>
```yaml
script:
  meditation_mode:
    alias: "Meditation Breathing Light"
    sequence:
      - service: aqara_advanced_lighting.start_cct_sequence
        target:
          entity_id: light.living_room_ceiling
        data:
          preset: "mindful_breathing"
          turn_on: true
```
</details>

<details>
<summary>Circadian Rhythm</summary>

```yaml
automation:
  - alias: "Circadian lighting sequence"
    trigger:
      - platform: time
        at: "06:00:00"
    action:
      - service: aqara_advanced_lighting.start_cct_sequence
        target:
          entity_id: light.living_room_ceiling
        data:
          turn_on: true
          step_1_color_temp: 2700      # Warm morning light
          step_1_brightness: 100
          step_1_transition: 5.0
          step_1_hold: 7200.0          # Hold for 2 hours
          step_2_color_temp: 4000      # Midday neutral
          step_2_brightness: 200
          step_2_transition: 10.0
          step_2_hold: 14400.0         # Hold for 4 hours
          step_3_color_temp: 5500      # Afternoon cool
          step_3_brightness: 255
          step_3_transition: 10.0
          step_3_hold: 10800.0         # Hold for 3 hours
          step_4_color_temp: 3500      # Evening warm
          step_4_brightness: 150
          step_4_transition: 10.0
          step_4_hold: 7200.0          # Hold for 2 hours
          step_5_color_temp: 2200      # Night warm dim
          step_5_brightness: 50
          step_5_transition: 5.0
          step_5_hold: 3600.0          # Hold for 1 hour
          loop_mode: "once"
          end_behavior: "maintain"
```
</details>

<details>
<summary>Reading Light</summary>

```yaml
script:
  reading_mode:
    alias: "Reading Mode CCT Sequence"
    sequence:
      - service: aqara_advanced_lighting.start_cct_sequence
        target:
          entity_id: light.desk_lamp
        data:
          turn_on: true
          step_1_color_temp: 4500      # Focus light
          step_1_brightness: 255
          step_1_transition: 1.0
          step_1_hold: 1800.0          # Hold for 30 minutes
          step_2_color_temp: 3500      # Ease eyes
          step_2_brightness: 200
          step_2_transition: 2.0
          step_2_hold: 1800.0          # Hold for 30 minutes
          step_3_color_temp: 2700      # Relax
          step_3_brightness: 150
          step_3_transition: 3.0
          step_3_hold: 900.0           # Hold for 15 minutes
          loop_mode: "once"
          end_behavior: "maintain"
```
</details>

### RGB Segment Sequence Examples

<details>
<summary>Wave</summary>
```yaml
automation:
  - alias: "Party mode wave effect"
    trigger:
      - platform: state
        entity_id: input_boolean.party_mode
        to: "on"
    action:
      - service: aqara_advanced_lighting.start_segment_sequence
        target:
          entity_id: light.living_room_ceiling
        data:
          preset: "wave"
          turn_on: true
```
</details>

<details>
<summary>Loading Bar</summary>
```yaml
script:
  startup_sequence:
    alias: "Startup Loading Bar"
    sequence:
      - service: aqara_advanced_lighting.start_segment_sequence
        target:
          entity_id: light.led_strip
        data:
          preset: "loading_bar"
          turn_on: true
```
</details>

<details>
<summary>Alter</summary>
```yaml
automation:
  - alias: "Security alert sequence"
    trigger:
      - platform: state
        entity_id: binary_sensor.front_door
        to: "on"
    action:
      - service: aqara_advanced_lighting.start_segment_sequence
        target:
          entity_id: light.entrance_ceiling
        data:
          turn_on: true
          step_1_segments: "all"
          step_1_colors:
            - r: 255
              g: 0
              b: 0
          step_1_mode: "blocks_repeat"
          step_1_duration: 0.5
          step_1_hold: 0.5
          step_1_activation_pattern: "all"
          step_2_segments: "all"
          step_2_colors:
            - r: 0
              g: 0
              b: 0
          step_2_mode: "blocks_repeat"
          step_2_duration: 0.5
          step_2_hold: 0.5
          step_2_activation_pattern: "all"
          loop_mode: "count"
          loop_count: 5
          end_behavior: "turn_off"
```
</details>

<details>
<summary>Chase</summary>
```yaml
script:
  rainbow_chase:
    alias: "Rainbow Chase Effect"
    sequence:
      - service: aqara_advanced_lighting.start_segment_sequence
        target:
          entity_id: light.led_strip
        data:
          turn_on: true
          step_1_segments: "all"
          step_1_colors:
            - r: 255
              g: 0
              b: 0
            - r: 255
              g: 127
              b: 0
            - r: 255
              g: 255
              b: 0
            - r: 0
              g: 255
              b: 0
            - r: 0
              g: 0
              b: 255
            - r: 148
              g: 0
              b: 211
          step_1_mode: "gradient"
          step_1_duration: 5.0
          step_1_hold: 0.0
          step_1_activation_pattern: "sequential_forward"
          step_2_segments: "all"
          step_2_colors:
            - r: 148
              g: 0
              b: 211
            - r: 0
              g: 0
              b: 255
            - r: 0
              g: 255
              b: 0
            - r: 255
              g: 255
              b: 0
            - r: 255
              g: 127
              b: 0
            - r: 255
              g: 0
              b: 0
          step_2_mode: "gradient"
          step_2_duration: 5.0
          step_2_hold: 0.0
          step_2_activation_pattern: "sequential_reverse"
          loop_mode: "continuous"
          end_behavior: "maintain"
```
</details>

<details>
<summary>Startup Intro with Looping Patterns</summary>
```yaml
automation:
  - alias: "Party lights with intro"
    trigger:
      - platform: state
        entity_id: input_boolean.party_mode
        to: "on"
    action:
      - service: aqara_advanced_lighting.start_segment_sequence
        target:
          entity_id: light.led_strip
        data:
          turn_on: true
          clear_segments: true  # Clear any existing patterns first
          # Step 1: Dramatic white flash intro (only runs once)
          step_1_segments: "all"
          step_1_colors:
            - r: 255
              g: 255
              b: 255
          step_1_mode: "blocks_repeat"
          step_1_duration: 0.2
          step_1_hold: 0.3
          step_1_activation_pattern: "all"
          # Step 2: Red chase (loops)
          step_2_segments: "all"
          step_2_colors:
            - r: 255
              g: 0
              b: 0
          step_2_mode: "blocks_repeat"
          step_2_duration: 1.0
          step_2_hold: 0.0
          step_2_activation_pattern: "sequential_forward"
          # Step 3: Blue chase (loops)
          step_3_segments: "all"
          step_3_colors:
            - r: 0
              g: 0
              b: 255
          step_3_mode: "blocks_repeat"
          step_3_duration: 1.0
          step_3_hold: 0.0
          step_3_activation_pattern: "sequential_reverse"
          loop_mode: "continuous"
          skip_first_in_loop: true  # Skip the white flash intro when looping
          end_behavior: "turn_off"
```
</details>

## Troubleshooting

### Integration won't load
- Verify MQTT integration is configured and running
- Check that Zigbee2MQTT is connected
- Review Home Assistant logs for specific errors

### Lights not discovered
- Ensure lights are paired with Zigbee2MQTT
- Verify Z2M base topic matches your configuration
- Check that lights are one of the supported models

### Effects not working
- Verify the effect type is supported for your light model
- Check Z2M logs for MQTT communication
- Ensure light entity IDs are correct

### Service calls failing
- Check that entity_id exists and is correct
- Verify RGB color values are 0-255
- Ensure speed is 1-100

### T1 Strip segment count issues
- Ensure your T1 Strip's `length` attribute is correctly set in Z2M or HA
- The integration reads this to calculate segment count (5 segments per meter)
- If unavailable, it defaults to 10 segments (2 meters) with a warning

### Device firmware
- Make sure your device firmware is up to date
- T1M: 0.0.0_0027
- T1 strip: 0.0.0_0027
- T2 bulb: 0.0.0_0030

## Contributing

We welcome contributions from the community! Whether you want to fix a bug, add a new feature, or submit custom presets, your contributions are appreciated.

### How to Contribute

- **Code Contributions**: Bug fixes, new features, performance improvements
- **Custom Presets**: Share your creative effect and sequence presets
- **Documentation**: Improve guides, fix typos, add examples
- **Testing**: Test on different hardware, report issues

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on:
- Development setup and workflow
- Code standards and best practices
- How to submit custom presets for inclusion
- Pull request process
- Testing requirements

### Preset Submissions

Created an awesome lighting effect or sequence? Share it with the community! Submit your preset for potential inclusion in the default collection. See the [preset submissions guide](preset_submissions/README.md) for details.

## Disclaimer

This is an unofficial integration and is not provided by or supported by Aqara.

## Support

- **Issues**: [GitHub Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- **Documentation**: [GitHub Repository](https://github.com/absent42/Aqara-Advanced-Lighting)
- **Contributing**: [Contribution Guidelines](CONTRIBUTING.md)
