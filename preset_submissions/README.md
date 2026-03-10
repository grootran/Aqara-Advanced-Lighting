# Preset submissions

This directory contains community-submitted presets for review and potential inclusion in the default preset collection.

## How to submit a preset

1. Create your preset using the Aqara Advanced Lighting UI in Home Assistant
2. Test it thoroughly on your actual hardware
3. Export the preset using the selective export feature (see below)
4. Create a JSON file using the appropriate template
5. Submit a pull request with your preset file

### Exporting your preset

The easiest way to get your preset data is the **selective preset export** feature:

1. Open the Aqara Lighting panel in Home Assistant
2. Navigate to the **My Presets** tab
3. Click the **Select** button to enter selection mode
4. Select the preset(s) you want to submit using the checkboxes
5. Click **Export Selected** to download a JSON file
6. Open the file and copy the preset data into a submission template

The exported file organizes presets by category: `effect_presets`, `segment_pattern_presets`, `cct_sequence_presets`, `segment_sequence_presets`, and `dynamic_scene_presets`.

**Alternative methods:**
- Access the storage file directly at `.storage/aqara_advanced_lighting.presets` in your HA config directory
- Use the HTTP API: `GET /api/aqara_advanced_lighting/user_presets?type=effect` (replace `type` as needed)

## File naming convention

- **Dynamic Effects**: `effect_descriptive_name.json`
- **Segment Patterns**: `pattern_descriptive_name.json`
- **CCT Sequences (Standard)**: `cct_descriptive_name.json`
- **CCT Sequences (Solar)**: `cct_solar_descriptive_name.json`
- **CCT Sequences (Schedule)**: `cct_schedule_descriptive_name.json`
- **Segment Sequences**: `segment_descriptive_name.json`
- **Dynamic Scenes**: `scene_descriptive_name.json`

Examples:
- `effect_ocean_waves.json`
- `pattern_rainbow_ring.json`
- `cct_sunrise_alarm.json`
- `cct_solar_daylight_tracking.json`
- `cct_schedule_work_day_rhythm.json`
- `segment_police_lights.json`
- `scene_sunset_glow.json`

## Templates

See the template files in this directory for each preset type:

- `TEMPLATE_effect.json` - Dynamic RGB effects
- `TEMPLATE_pattern.json` - Segment color patterns
- `TEMPLATE_cct_sequence.json` - Standard timed CCT sequences
- `TEMPLATE_cct_solar.json` - Sun elevation-based CCT sequences
- `TEMPLATE_cct_schedule.json` - Clock/sunrise/sunset CCT sequences
- `TEMPLATE_segment_sequence.json` - Animated segment sequences
- `TEMPLATE_dynamic_scene.json` - Multi-light color transition scenes

## Submission guidelines

### Quality standards

Your preset should:
- Work reliably on the specified device type(s)
- Be tested on actual hardware
- Have a clear, descriptive name
- Include a helpful description
- Demonstrate a unique or useful pattern
- Use appropriate parameter values

### What we are looking for

**Great presets:**
- Simulate real-world lighting (sunrise, sunset, candlelight)
- Create useful ambiance (reading, movie watching, party)
- Show creative use of segmented lighting
- Provide practical sequences (wake-up, wind-down)
- Use solar/schedule modes for adaptive day-long lighting

**Avoid:**
- Generic test patterns without clear purpose
- Extremely fast/flashy effects that may trigger photosensitivity
- Presets too similar to existing ones
- Poorly named or undocumented presets

### Device types

Specify which device types your preset is designed for:
- `t2_bulb` - Aqara T2 Bulb (RGB + CCT)
- `t2_cct` - Aqara T2 Bulb (CCT only)
- `t1m` - Aqara T1M (26 segments)
- `t1m_white` - Aqara T1M (CCT only)
- `t1_strip` - Aqara T1 Strip (variable segments)
- `generic_rgb` - Any RGB-capable light
- `generic_cct` - Any CCT-capable light

### Icons

Use Material Design Icons (mdi:*) that represent your preset:
- `mdi:weather-sunset` - Sunset effects
- `mdi:white-balance-sunny` - Solar/daylight presets
- `mdi:clock-outline` - Schedule-based presets
- `mdi:waves` - Wave patterns
- `mdi:fire` - Fire/flame effects
- `mdi:star` - Sparkle effects
- `mdi:palm-tree` - Tropical themes
- `mdi:spa` - Relaxation themes
- `mdi:palette` - Color patterns

Browse icons at: https://pictogrammers.com/library/mdi/

## Review process

1. Pull request submitted with preset file(s)
2. Maintainer reviews for quality and compatibility
3. Testing on actual hardware (if available)
4. Feedback provided or approval given
5. Preset added to default collection or suggestions for improvement

## Example submissions

Check `EXAMPLE_effect_ocean_waves.json` in this directory for reference.

## Questions?

Open an issue or discussion on GitHub if you have questions about submitting presets.
