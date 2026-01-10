# Preset Submissions

This directory contains community-submitted presets for review and potential inclusion in the default preset collection.

## How to Submit a Preset

1. Create your preset using the Aqara Advanced Lighting UI in Home Assistant
2. Test it thoroughly on your actual hardware
3. Export the preset configuration from Developer Tools > States
4. Create a JSON file using the template below
5. Submit a pull request with your preset file

## File Naming Convention

- **Dynamic Effects**: `effect_descriptive_name.json`
- **Segment Patterns**: `pattern_descriptive_name.json`
- **CCT Sequences**: `cct_descriptive_name.json`
- **Segment Sequences**: `segment_descriptive_name.json`

Examples:
- `effect_ocean_waves.json`
- `pattern_rainbow_ring.json`
- `cct_sunrise_alarm.json`
- `segment_police_lights.json`

## Preset Template

See `TEMPLATE.json` for a complete template.

## Submission Guidelines

### Quality Standards

Your preset should:
- Work reliably on the specified device type(s)
- Be tested on actual hardware
- Have a clear, descriptive name
- Include a helpful description
- Demonstrate a unique or useful pattern
- Use appropriate parameter values

### What We're Looking For

**Great Presets:**
- Simulate real-world lighting (sunrise, sunset, candlelight)
- Create useful ambiance (reading, movie watching, party)
- Show creative use of segmented lighting
- Provide practical sequences (wake-up, wind-down)

**Avoid:**
- Generic test patterns without clear purpose
- Extremely fast/flashy effects that may trigger photosensitivity
- Presets too similar to existing ones
- Poorly named or undocumented presets

### Device Types

Specify which device types your preset is designed for:
- `t2_bulb` - Aqara T2 Bulb
- `t1` - Aqara T1 (20 segments)
- `t1m` - Aqara T1M (26 segments)
- `t1_strip` - Aqara T1 Strip (variable segments)

### Icons

Use Material Design Icons (mdi:*) that represent your preset:
- `mdi:weather-sunset` - Sunset effects
- `mdi:waves` - Wave patterns
- `mdi:fire` - Fire/flame effects
- `mdi:star` - Sparkle effects
- `mdi:palm-tree` - Tropical themes
- `mdi:spa` - Relaxation themes

Browse icons at: https://pictogrammers.com/library/mdi/

## Review Process

1. Pull request submitted with preset file(s)
2. Maintainer reviews for quality and compatibility
3. Testing on actual hardware (if available)
4. Feedback provided or approval given
5. Preset added to default collection or suggestions for improvement

## Example Submissions

Check the example presets in this directory for reference.

## Questions?

Open an issue or discussion on GitHub if you have questions about submitting presets.
