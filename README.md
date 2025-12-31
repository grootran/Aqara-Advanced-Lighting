# Aqara Advanced Lighting

Home Assistant HACS integration for advanced control of Aqara lights via Zigbee2MQTT.

## Overview

Control Aqara lights with advanced RGB dynamic effects, individual segment patterns, gradients, and state restoration.

### Supported Devices

| Device | Model | Segments | Dynamic Effects | Segment Control |
|-------|--------|----------|-----------------|-----------------|
| T1 Ceiling Light (20 segments) | ACN031 | 20 | ✅ 6 effects | ✅ |
| T1M Ceiling Light (26 segments) | ACN032 | 26 | ✅ 6 effects | ✅ |
| T1 LED Strip | ACN132 | Variable (5/meter) | ✅ 8 effects | ✅ |
| T2 RGB Bulb (E26/E27/GU10) | AGL001/AGL003/AGL005/AGL007 | N/A | ✅ 4 effects | ❌ |

### Features

- **Aqara App Effect Presets** - Quick access to 24 preset effects from the Aqara mobile app
  - 4 T2 Bulb presets (Candlelight, Breath, Colorful, Security)
  - 9 T1M presets (Dinner, Sunset, Autumn, Galaxy, Daydream, Holiday, Party, Meteor, Alert)
  - 7 T1 Strip presets (Rainbow, Heartbeat, Gala, Sea of Flowers, Rhythmic, Exciting, Colorful)
- **Segment Pattern Presets** - 12 beautiful T1M/T1 Strip segment color patterns from the Aqara app
- **Dynamic RGB Effects** - 13 different manual effects including breathing, fading, flowing, chasing, rainbow, and more
- **Effect Dropdown Selector** - Easy-to-use UI dropdown showing all available effects and presets
- **RGB Color Pickers** - Intuitive color picker UI for all services (up to 8 colors for effects, 6 for gradients)
- **Individual Segment Control** - Set custom colors for each segment on T1M and T1 Strip lights
- **Smooth Color Gradients** - Create beautiful color transitions across segments with 2-6 colors
- **Color Block Patterns** - Generate evenly spaced or alternating color blocks
- **Flexible Segment Selection** - Support for ranges ("1-20"), individual segments, and special selectors ("odd", "even")
- **T1 Strip Variable Length Support** - Automatically detects and adapts to your T1 Strip's length (1-10 meters)
- **Auto Turn-On Option** - Optionally turn lights on automatically before applying effects
- **Unspecified Segment Control** - Option to turn off segments not included in patterns
- **Automatic Device Discovery** - Discovers supported Aqara lights through Zigbee2MQTT
- **Service-Based API** - All features accessible via Home Assistant services, automations, and scripts

## Requirements

- Home Assistant 2025.12.0 or newer
- MQTT integration configured and running
- Zigbee2MQTT 2.7.2 or newer
- Supported Aqara light devices (see table above)

## Installation

### Via HACS (Recommended)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=absent42&repository=Aqara-Advanced-Lighting&category=Integration)

**Or manually:**

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

All features are available as Home Assistant services. Call these services from automations, scripts, or the Developer Tools.

### Services

#### 1. Set Dynamic Effect

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

#### 2. Set Segment Pattern

Set individual segment colors (T1M and T1 Strip only) - choose from 12 Aqara app presets or create your own custom pattern.

**Service:** `aqara_advanced_lighting.set_segment_pattern`

**Example (Using Preset):**
```yaml
service: aqara_advanced_lighting.set_segment_pattern
target:
  entity_id: light.aqara_ceiling_light
data:
  preset: "t1m_segment_1"
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

#### 3. Create Gradient

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

#### 4. Create Color Blocks

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

### Available Effects

#### T1M Ceiling Light (ACN031/ACN032)
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

## Example Automations

### Sunset Effect

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

### Party Mode

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

### Morning Routine

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
- Ensure your T1 Strip's `length` attribute is correctly set in Z2M
- The integration reads this to calculate segment count (5 segments per meter)
- If unavailable, it defaults to 10 segments (2 meters) with a warning

### Device firmware
- Make sure your device firmware is up to date
- T1M: 0.0.0_0027
- T1 strip: 0.0.0_0027
- T2 bulb: 0.0.0_0030

## Support

- **Issues**: [GitHub Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- **Documentation**: [GitHub Repository](https://github.com/absent42/Aqara-Advanced-Lighting)
