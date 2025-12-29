# Release Notes - Aqara Advanced Lighting v0.1.0

## Initial Release

This is the initial release of the **Aqara Advanced Lighting** Home Assistant custom integration, providing advanced control of Aqara lights through Zigbee2MQTT.

## What's New

### Supported Devices
- **Aqara T1M Ceiling Lights**
  - ACN031 (20 segments) - 6 dynamic effects
  - ACN032 (26 segments) - 6 dynamic effects
- **Aqara T1 LED Strip**
  - ACN132 (variable length, 5 segments/meter) - 8 dynamic effects
- **Aqara T2 RGB Bulbs**
  - AGL001 (E26), AGL003 (E27), AGL005 (GU10 230V), AGL007 (GU10 110V) - 4 dynamic effects

### Services

#### 1. Set Dynamic Effect (`aqara_advanced_lighting.set_dynamic_effect`)
- Dropdown selector with all 13 effects (breathing, fading, flow1, flow2, hopping, rolling, chasing, dash, flash, flicker, rainbow1, rainbow2, candlelight)
- Up to 8 RGB color pickers with rainbow defaults
- Speed control (1-100%)
- Segment selection for T1 Strip
- Auto turn-on option
- Backend validation for device compatibility

#### 2. Set Segment Pattern (`aqara_advanced_lighting.set_segment_pattern`)
- Individual segment color control
- Segment ranges ("1-20", "5-10")
- Special selectors ("odd", "even")
- Turn off unspecified segments option
- Auto turn-on option

#### 3. Create Gradient (`aqara_advanced_lighting.create_gradient`)
- Up to 6 RGB color pickers with primary/secondary defaults
- Smooth color transitions
- Segment selection support
- Turn off unspecified segments option
- Auto turn-on option

#### 4. Create Blocks (`aqara_advanced_lighting.create_blocks`)
- Multiple color blocks
- Expand mode (evenly distributed) vs. alternating mode
- Segment selection support
- Turn off unspecified segments option
- Auto turn-on option

### Features
- **Automatic Device Discovery** - Finds supported Aqara lights through Zigbee2MQTT
- **UI-Based Configuration** - No YAML required
- **Color Picker UI** - Intuitive RGB color selection
- **Flexible Segment Selection** - Ranges, individual segments, special selectors
- **Device Registry Integration** - Devices appear in HA device registry
- **Reconfiguration Flow** - Update Z2M base topic without removing integration
- **Effect Validation** - Backend ensures only compatible effects for each device type

## Installation

### Via HACS (Recommended)
1. Open HACS → Integrations
2. Click menu (⋮) → Custom repositories
3. Add: `https://github.com/absent42/Aqara-Advanced-Lighting`
4. Category: Integration
5. Click "Download"
6. Restart Home Assistant
7. Settings → Devices & Services → Add Integration
8. Search for "Aqara Advanced Lighting"

### Manual Installation
1. Copy `custom_components/aqara_advanced_lighting` to your HA `custom_components` directory
2. Restart Home Assistant
3. Settings → Devices & Services → Add Integration

## Requirements
- Home Assistant 2025.12.0 or newer
- MQTT integration configured
- Zigbee2MQTT 2.7.2 or newer
- Supported Aqara light devices

## Known Limitations
- State restoration not yet implemented (planned for future release)
- Effect turn-off service not yet implemented (planned for future release)
- Only filters Aqara lights from supported models list

## Technical Details
- **Domain**: `aqara_advanced_lighting`
- **Integration Type**: service
- **IoT Class**: local_push
- **Dependencies**: mqtt
- **Quality Scale**: custom

## Feedback & Support
- Report issues: https://github.com/absent42/Aqara-Advanced-Lighting/issues
- Documentation: https://github.com/absent42/Aqara-Advanced-Lighting

## What's Next
Future releases will include:
- State capture and restoration
- Effect turn-off with state restore option
- Additional effect types as they become available
- Enhanced segment control features
- Performance optimizations

---

**Full Changelog**: https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CHANGELOG.md
