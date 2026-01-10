# Aqara Advanced Lighting

Advanced control for Aqara T1M Ceiling Light, T1 LED Strip, and T2 bulbs via Zigbee2MQTT.

## Features

- **Sidebar Panel** - UI control panel with visual editors for effects, patterns, and sequences
- **User Preset System** - Create, save, edit, and manage unlimited custom presets
- **Aqara App Presets** - 24 preset effects from the Aqara Home app
- **Dynamic RGB Effects** - 13 different effects with up to 8 colors
- **Individual Segment Control** - Custom colors for each segment on T1M and T1 Strip
- **Smooth Color Gradients** - Create gradients across segments with 2-6 colors
- **Color Block Patterns** - Generate evenly spaced or alternating color blocks
- **RGB Segment Sequences** - Animated segment patterns with up to 20 customizable steps
- **CCT Dynamic Sequences** - Multi-step color temperature and brightness sequences
- **Light Group Support** - All services work with Home Assistant light groups
- **Service-Based API** - All features accessible via Home Assistant services

## Supported Devices

| Device | Model | Segments | Dynamic Effects | Segment Control | CCT Sequences |
|-------|--------|----------|-----------------|-----------------|---------------|
| T1 Ceiling Light (20 segments) | ACN031 | 20 | ✓ 6 effects | ✓ | ✓ |
| T1M Ceiling Light (26 segments) | ACN032 | 26 | ✓ 6 effects | ✓ | ✓ |
| T1 LED Strip | ACN132 | Variable (5/meter) | ✓ 8 effects | ✓ | ✓ |
| T2 RGB Bulb (E26/E27/GU10) | AGL001/AGL003/AGL005/AGL007 | N/A | ✓ 4 effects | N/A | ✓ |
| T2 CCT Bulb (E26/E27/GU10) | AGL002/AGL004/AGL006/AGL008 | N/A | N/A | N/A | ✓ |

## Requirements

- Home Assistant 2025.12.0 or newer
- MQTT integration configured and running
- Zigbee2MQTT 2.7.2 or newer
- Supported Aqara light devices

## Quick Start

1. Install via HACS (custom repository)
2. Go to Settings → Devices & Services → Add Integration
3. Search for "Aqara Advanced Lighting"
4. Enter your Zigbee2MQTT base topic (default: `zigbee2mqtt`)
5. Access the "Aqara Lighting" panel from the sidebar

## Services

All features are available as Home Assistant services:

- `set_dynamic_effect` - Activate RGB effects (presets or custom)
- `stop_effect` - Stop effects and restore previous state
- `set_segment_pattern` - Set individual segment colors (presets or custom)
- `create_gradient` - Create smooth color gradients
- `create_blocks` - Create color block patterns
- `start_cct_sequence` - Multi-step CCT sequences (presets or custom)
- `stop_cct_sequence` - Stop CCT sequences
- `pause_cct_sequence` - Pause CCT sequences
- `resume_cct_sequence` - Resume paused CCT sequences
- `start_segment_sequence` - Animated segment sequences (presets or custom)
- `stop_segment_sequence` - Stop segment sequences
- `pause_segment_sequence` - Pause segment sequences
- `resume_segment_sequence` - Resume paused segment sequences

## Documentation

Full documentation available in the [GitHub Repository](https://github.com/absent42/Aqara-Advanced-Lighting).

## Support

If you find this integration useful, please star the repository.

If you want to show your support:

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)

## Disclaimer

This is an unofficial integration and is not provided by or supported by Aqara.
