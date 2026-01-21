# Aqara Advanced Lighting

[![GitHub Release][releases-shield]][releases]
[![License][license-shield]](LICENSE)
[![hacs][hacsbadge]][hacs]

![Aqara Advanced Lighting](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/main/images/aqara-advanced-lighting.png "Aqara Advanced Lighting")

[Home Assistant](https://www.home-assistant.io/) integration for advanced control of the Aqara [T1M Ceiling Light](https://www.aqara.com/en/product/ceiling-light-t1m/), [T1 LED Strip](https://www.aqara.com/en/product/led-strip-t1/), and [T2 bulbs](https://www.aqara.com/en/product/led-bulb-t2/) via [Zigbee2MQTT](https://www.zigbee2mqtt.io/).

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
  - **Device Configuration Panel** - Configure device-specific settings directly from the panel
    - **Multi-Device Configuration** - Push parameters to multiple devices simultaneously
    - Transition curve editor for T2 bulbs (visual curve adjustment, 0.2-6.0 range)
    - Initial brightness configuration for T2 bulbs (0-50%)
    - Dimming settings for all devices (on-to-off duration, off-to-on duration, dimming range)
    - T1 Strip length configuration with automatic segment count calculation
    - Device detection shows only relevant settings for selected device type
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

### Manual Installation

1. Copy the `custom_components/aqara_advanced_lighting` folder to your Home Assistant `custom_components` directory
2. Restart Home Assistant

## Updating

### Update via HACS

1. Go to **HACS**
2. Find "Aqara Advanced Lighting"
3. Click **Update** if an update is available
4. **Restart Home Assistant**
5. **Clear your browser cache** (see below)

### Manual Update

If you installed manually:
1. Download the latest release from [GitHub Releases](https://github.com/absent42/Aqara-Advanced-Lighting/releases)
2. Replace the `custom_components/aqara_advanced_lighting` folder
3. Restart Home Assistant
4. Clear browser cache (see above)

<details>
<summary>Version Mismatch Warning
</summary>

If you see a version mismatch warning in the panel after updating, this means the backend and frontend versions don't match. This can happen when the browser cache is serving an old version of the frontend.

**To resolve:**

**Desktop Browser:**
1. Perform a hard refresh to clear the cache:
   - **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
   - **Mac**: `Cmd + Shift + R`
2. If the warning persists, clear your browser cache completely:
   - **Chrome/Edge**: Settings → Privacy and security → Clear browsing data → Cached images and files
   - **Firefox**: Settings → Privacy & Security → Cookies and Site Data → Clear Data → Cached Web Content
   - **Safari**: Develop → Empty Caches (or Settings → Advanced → Show Develop menu)
3. Close and reopen the browser tab
4. If still showing, restart Home Assistant

**Mobile App (Home Assistant Companion):**
1. **iOS**:
   - Go to **Settings** → **Apps** → **Home Assistant** → **Clear cache**
   - Force close the app and reopen
2. **Android**:
   - Go to **Settings** → **Apps** → **Home Assistant** → **Clear cache**
   - Force close the app and reopen
</details>

## Configuration

### Setup

1. Go to **Settings** → **Devices & Services** → **Add Integration**
2. Search for "Aqara Advanced Lighting"
3. Enter your Zigbee2MQTT base topic (default: `zigbee2mqtt`)
4. Optionally add a friendly name for this instance (e.g., "Main Floor", "Garage")
5. Click "Submit"

The integration will automatically discover your Aqara lights through Zigbee2MQTT.

### Configuration Parameters

The integration requires one configuration parameter during setup:

#### Zigbee2MQTT Base Topic

- **Parameter**: `Zigbee2MQTT base topic`
- **Default**: `zigbee2mqtt`
- **Required**: Yes
- **Type**: String

**Description**:
The MQTT base topic used by your Zigbee2MQTT installation. This integration subscribes to MQTT messages under this topic to discover and communicate with Aqara lights. The base topic must match the `base_topic` configured in your Zigbee2MQTT `configuration.yaml`.

**Examples**:
- Default installation: `zigbee2mqtt`
- Custom topic: `z2m`
- Hierarchical topic: `home/zigbee2mqtt`

**Finding your Z2M base topic**:

1. Open your Zigbee2MQTT `configuration.yaml` file
2. Look for the `mqtt` section
3. Find the `base_topic` setting
4. Use that exact value in this integration

**Troubleshooting**:
- If devices are not discovered, verify the base topic matches your Z2M configuration
- Check that MQTT integration is properly configured and connected
- Ensure Zigbee2MQTT is running and connected to the same MQTT broker
- The integration validates the Z2M instance by subscribing to the `bridge/state` topic during setup
- Use the Reconfigure option to update the base topic or friendly name if needed

#### Friendly Name (Optional)

- **Parameter**: `Friendly name`
- **Default**: None (uses base topic if not provided)
- **Required**: No
- **Type**: String

**Description**:
An optional friendly name to identify this Zigbee2MQTT instance in logs and error messages. Useful when managing multiple Z2M coordinators to quickly identify which instance owns specific devices.

**Examples**:
- Location-based: "Upstairs", "Main Floor", "Garage", "Outdoor"
- Zone-based: "Living Area", "Bedrooms", "Workshop"
- Function-based: "RGB Lights", "CCT Lights", "LED Strips"

### Multiple Zigbee2MQTT Instances

The integration supports connecting to multiple Zigbee2MQTT instances simultaneously, perfect for complex smart home setups with distributed Zigbee networks.

#### Adding Additional Instances

To add another Zigbee2MQTT instance after initial setup:

1. Go to **Settings** → **Devices & Services**
2. Click **Add Integration**
3. Search for "Aqara Advanced Lighting"
4. Enter the **Z2M base topic** for the new instance (e.g., `zigbee2mqtt2`)
5. Add a **friendly name** to distinguish it (e.g., "Garage", "Upstairs")
6. Click "Submit"

The integration will:
- Validate the Z2M instance is running (5-second timeout)
- Prevent duplicate instances with the same base topic
- Automatically route service calls to the correct instance
- Show devices from all instances in the frontend panel

#### Multi-Instance Features

**Automatic Entity Routing**
- Service calls automatically find the correct Z2M instance for each entity
- Fast O(1) lookup using entity routing map
- No manual instance selection needed

**Instance Validation**
- Subscribes to `bridge/state` topic during setup to confirm Z2M is running
- Clear error messages if Z2M instance not found
- 5-second validation timeout

**Instance Management**
- Each instance maintains its own MQTT client and state managers
- Shared presets and favorites work across all instances
- Independent configuration and reconfiguration per instance

#### Use Cases

**Multiple Locations**
```
Instance 1: zigbee2mqtt (Main Floor)
Instance 2: zigbee2mqtt_upstairs (Upstairs)
Instance 3: zigbee2mqtt_garage (Garage)
```

**Zone Separation**
```
Instance 1: zigbee2mqtt_indoor (Indoor Lights)
Instance 2: zigbee2mqtt_outdoor (Outdoor Lights)
```

**Device Type Separation**
```
Instance 1: zigbee2mqtt (Smart Bulbs)
Instance 2: zigbee2mqtt_strips (LED Strips)
```

### Reconfiguration

To change the Z2M base topic or friendly name for an existing instance:

1. Go to **Settings** → **Devices & Services**
2. Find the "Aqara Advanced Lighting" instance you want to reconfigure
3. Click the three dots menu → "Reconfigure"
4. Update the base topic and/or friendly name
5. Click "Submit"

### Removal

To remove the integration from Home Assistant:

1. **Remove the Integration**:
   - Go to **Settings** → **Devices & Services**
   - Find "Aqara Advanced Lighting"
   - Click the three dots menu → **Delete**
   - Confirm the removal

2. **Remove Associated Devices** (Optional):
   - After removing the integration, associated Aqara light devices will remain in the device registry
   - To remove devices, go to **Settings** → **Devices & Services** → **Devices**
   - Find each Aqara light device
   - Click the device → Click the three dots menu → **Delete**
   - Confirm the removal for each device

3. **Uninstall Integration Files**:

   **If installed via HACS**:
   - Go to **HACS**
   - Find "Aqara Advanced Lighting"
   - Click the three dots menu → **Remove**
   - Restart Home Assistant

   **If installed manually**:
   - Delete the `custom_components/aqara_advanced_lighting` folder from your Home Assistant configuration directory
   - Restart Home Assistant

**Note**: Removing the integration does not affect your Zigbee2MQTT configuration or your Aqara lights themselves. The lights will continue to work with Zigbee2MQTT and the standard Home Assistant MQTT Light integration.


## Usage

The features of Advanced Aqara Lighting can be used in multiple ways: with the frontend sidebar UI panel for quick access and preset creation through visual editors, or through Home Assistant services for use in automations and scripts. Presets created in the frontend are also available in backend services.

### Frontend Panel

![Aqara Advanced Lighting Frontend UI](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/activate.png "Aqara Advanced Lighting Frontend UI")

Access the Aqara Lighting panel from the Home Assistant sidebar for a user-friendly interface to control your lights and create effects and patterns.

![Aqara Advanced Lighting Sidebar](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/sidebar.png "Aqara Advanced Lighting Sidebar")

#### Favorite Lights

Save your frequently used lights and light groups as favorites for quick access:
- Click the star icon next to any light to add it to favorites
- Favorite lights appear at the top of the panel
- Control tiles show current state and brightness
- Toggle lights on/off directly from the panel
- Adjust brightness with the slider

#### Preset Management

![Aqara Advanced Lighting Presets Manager](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/presets.png " Aqara Advanced Lighting Presets Manager")

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
- Backup and restore functions for user saved presets

**Applying Presets**
1. Select target light(s) from favorites or target searchbar
2. Choose a preset from any category
3. Click the preset to apply immediately

### Visual Editors

Create custom effects and patterns with interactive builders:

**Effect Editor**

![Aqara Advanced Lighting Effects Editor](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/effects.png " Aqara Advanced Lighting Effects Editor")

- Select from 13 effect types
- Add up to 8 colors using color pickers
- Adjust speed and brightness with sliders
- Preview colors as you design
- For T1 Strip: specify which segments to light
- Save as custom preset for reuse

**Segment Pattern Editor**

![Aqara Advanced Lighting Pattern Editor](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/pattern.png " Aqara Advanced Lighting Pattern Editor")

- Visual segment selector shows all available segments
- Click segments to assign colors
- Create gradients across multiple segments
- Generate color block patterns
- Option to turn off unspecified segments
- Works with T1M and T1 Strip lights
- Save patterns as custom presets

**CCT Sequence Editor**

![Aqara Advanced Lighting CCT Sequencer](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/cct.png " Aqara Advanced Lighting CCT Sequencer")

- Build multi-step sequences (up to 20 steps)
- Set color temperature and brightness per step
- Configure transition and hold durations
- Choose loop mode: once, count, or continuous
- Set end behavior: maintain or turn off
- Visual timeline shows sequence flow
- Save sequences as custom presets

**RGB Segment Sequence Editor**

![Aqara Advanced Lighting Segment Sequencer](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/segments.png " Aqara Advanced Lighting Segment Sequencer")

- Create animated segment patterns (up to 20 steps)
- Choose color mode: gradient, blocks, or individual
- Select activation pattern: sequential, random, simultaneous, and more
- Set duration and hold times per step
- Configure loop settings
- Option to clear segments before starting
- Skip first step option for initialization
- Save sequences as custom presets

#### Device Configuration

![Aqara Advanced Lighting evice Configuration](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/devices.png " Aqara Advanced Lighting evice Configuration")

Configure device-specific settings directly from the Device Config tab in the panel:

**Multi-Device Configuration**
- **Select multiple devices** to configure them simultaneously
- Push the same settings to all selected devices at once
- Ideal for maintaining consistent settings across multiple lights

**For T2 Bulbs**

**Transition Curve Editor**
- Visual curve editor with interactive graph showing brightness vs time
- Adjust transition curvature from 0.2 to 6.0
- Three curve types:
  - **0.2-1.0**: Fast then slow (quick start, gentle finish)
  - **1.0**: Linear (constant speed)
  - **1.0-6.0**: Slow then fast (gentle start, quick finish)
- Supports multiple devices simultaneously for synchronized behavior
- Apply button sends settings directly to your selected T2 bulbs

**Initial Brightness**
- Set startup brightness from 0-50%
- Direct entity control via slider
- Immediate feedback and updates
- Apply to multiple devices simultaneously for synchronized behavior

**For All Devices**

**Dimming Settings**
- **On-to-off duration**: Fade time when turning light off (0-10 seconds)
- **Off-to-on duration**: Fade time when turning light on (0-10 seconds)
- **Dimming range minimum**: Lowest brightness level (1-99%)
- **Dimming range maximum**: Highest brightness level (2-100%)
- Apply to multiple devices simultaneously for synchronized behavior

**For T1 Strip**

**Strip Length Configuration**
- Set T1 Strip length directly from the panel
- Automatic segment count calculation (5 segments per meter)

**Smart Features**
- Config tab automatically shows only settings relevant to your selected device type
- Automatic entity discovery for configuration parameters
- Clear messaging when entities are not found
- Device type awareness adapts settings based on T2 RGB, T2 CCT, T1M, T1, or T1 Strip selection

#### Quick Actions

- **Stop Effects**: Stop any running effect and optionally restore previous light state
- **Pause/Resume**: Control sequence playback mid-execution
- **Light Control**: Direct on/off and brightness control from the panel

### Backend Services

In addition to the frontend, features are also available as service actions from within Home Assistant. Call these services from automations, scripts, or the Developer Tools.

To use the services within an automation, when adding a "Then do" action scroll down to other actions - Aqara Advanced Lighting, and select an action.

![Aqara Advanced Lighting Automation](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/main/images/automation.png "Aqara Advanced Lighting Automation")

A UI will pop up showing the parameters for configuring the action. To edit the YAML directly, click the 3 dots on the upper right and select "Edit in YAML". To use a saved preset that was created via the frontend, tick Preset, type the name of the preset (case insensitive) and click "Add custom item".

![Aqara Advanced Lighting Action](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/main/images/action.png "Aqara Advanced Lighting Action")


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
- `preset` (optional): Aqara app preset effect - dropdown selector with 24 built-in presets. You can also type the name of a custom preset you created in the frontend panel (case-insensitive)
- `effect` (required if no preset): Effect type - dropdown selector with all available effects
- `speed` (required if no preset): Animation speed (1-100%)
- `color_1` through `color_8`: RGB color pickers (color_1 required if no preset, others optional)
- `segments` (optional): For T1 Strip only - segments to apply effect to (e.g., "1-20", "odd", "even")
- `brightness` (optional): Brightness level (1-255)
- `turn_on` (optional): Turn light on before applying effect (default: false)

**Note:** When using `preset`, manual `effect`, `speed`, and `color` parameters are ignored. Custom presets created in the frontend panel can be used by typing their name exactly as you saved it (case doesn't matter).
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
- `preset` (optional): Aqara app segment pattern preset (Preset 1 through Preset 12) - dropdown selector with 12 built-in presets. You can also type the name of a custom pattern preset you created in the frontend panel (case-insensitive)
- `segment_colors` (required if no preset): List of segment/color pairs
  - `segment`: Segment number or range (e.g., 1, "5-10", "odd", "even")
  - `color`: RGB color dict with r, g, b values (0-255)
- `brightness` (optional): Brightness level (1-255)
- `turn_on` (optional): Turn light on before applying pattern (default: false)
- `turn_off_unspecified` (optional): Turn off segments not specified (default: false)

**Note:** When using `preset`, the `segment_colors` parameter is ignored. Presets work on T1M (20 & 26 segment) and T1 Strip devices. Custom presets created in the frontend panel can be used by typing their name exactly as you saved it (case doesn't matter).
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
- `preset` (optional): Use a built-in preset ("goodnight", "wakeup", "mindful_breathing", "circadian") - dropdown selector with 4 built-in presets. You can also type the name of a custom CCT sequence preset you created in the frontend panel (case-insensitive). When preset is selected, manual step/loop/end_behavior parameters are ignored
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
- `preset` (optional): Use a built-in preset ("loading_bar", "wave", "sparkle", "theater_chase", "rainbow_fill", "comet") - dropdown selector with 6 built-in presets. You can also type the name of a custom RGB segment sequence preset you created in the frontend panel (case-insensitive). When preset is selected, manual step parameters are ignored
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
- Routes each entity to the correct Zigbee2MQTT instance automatically
- Applies the effect/pattern to all lights simultaneously
- Uses batch MQTT publishing for optimal performance

**Multi-Instance Support:**
Light groups can contain entities from multiple Zigbee2MQTT instances. The integration automatically:
- Identifies which Z2M instance owns each entity
- Routes service calls to the appropriate instance
- Processes all entities in parallel for synchronized effects

**Example - Applying an effect to a group:**
```yaml
service: aqara_advanced_lighting.set_dynamic_effect
target:
  entity_id: light.living_room_group  # Your light group (can span multiple Z2M instances)
data:
  preset: "sunset"
```

**Example - Multi-instance group:**
```yaml
# light.whole_house_group contains:
#   - light.living_room (from zigbee2mqtt instance)
#   - light.bedroom (from zigbee2mqtt instance)
#   - light.garage (from zigbee2mqtt_garage instance)
#   - light.outdoor (from zigbee2mqtt_outdoor instance)

service: aqara_advanced_lighting.set_dynamic_effect
target:
  entity_id: light.whole_house_group
data:
  effect: "breathing"
  speed: 50
  color_1: [255, 100, 0]
  # All lights receive the effect, routed to their respective Z2M instances
```

### Custom Icons for Presets

You can use custom icons with your user presets using the [Custom Icons integration](https://github.com/thomasloven/hass-custom_icons).

**Using custom icons:**
1. Install and configure the Custom Icons integration
2. When creating or editing a preset, set the icon field to your custom icon identifier (e.g., `local:my_preset_icon`)
3. Standard MDI icons use the format `mdi:icon-name`, while custom icons use `local:icon-name`

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

[releases-shield]: https://img.shields.io/github/release/absent42/Aqara-Advanced-Lighting?style=for-the-badge
[releases]: https://github.com/absent42/Aqara-Advanced-Lighting/releases
[license-shield]: https://img.shields.io/github/license/absent42/Aqara-Advanced-Lighting?style=for-the-badge
[hacsbadge]: https://img.shields.io/badge/HACS-Default-41BDF5?style=for-the-badge
[hacs]: https://github.com/hacs/integration