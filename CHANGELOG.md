# Changelog

All notable changes to the Aqara Advanced Lighting integration will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-12-31

## New Features

### Aqara App Presets
- **24 Dynamic Effect Presets** - Quick access to Aqara mobile app's preset effects
  - 4 T2 Bulb presets: Candlelight, Breath, Colorful, Security
  - 9 T1M presets: Dinner, Sunset, Autumn, Galaxy, Daydream, Holiday, Party, Meteor, Alert
  - 7 T1 Strip presets: Rainbow, Heartbeat, Gala, Sea of Flowers, Rhythmic, Exciting, Colorful
  - All accessible via dropdown selector in `set_dynamic_effect` service

### Segment Pattern Presets
- **12 T1M/T1 Strip Segment Presets** - Beautiful segment color patterns from the Aqara app
  - Accessible via dropdown selector in `set_segment_pattern` service
  - Compatible with T1M (20 & 26 segment) and T1 Strip devices
  - Automatically scales to device segment count

### T1 Strip Variable Length Support
- **Automatic Length Detection** - Integration now reads T1 Strip's actual length from Z2M
  - Calculates correct segment count (5 segments per meter)
  - Supports strips from 1-10 meters (5-50 segments)
  - Falls back to 10 segments (2 meters) with warning if length unavailable
  - Affects all segment services: `set_segment_pattern`, `create_gradient`, `create_blocks`

### Brightness Control
- **Brightness Parameter** - Added to effect and all segment services (1-255 range)

## Bug Fixes

### T1 Strip Segment Calculations
- Fixed incorrect hardcoded segment count defaults (was 20/100, now reads actual length)
- Fixed brightness not being applied to T1 Strip segment patterns
- Added `_get_actual_segment_count()` helper function for accurate segment count

### Segment Service Improvements
- Made `segment_colors` parameter optional when using presets
- Made `effect` parameter optional when using presets
- Improved validation and error messages for preset compatibility

## Documentation Updates

### README.md
- Added HACS one-click install button
- Added preset documentation
- Updated all service examples with preset usage
- Added T1 Strip variable length documentation
- Updated troubleshooting guide

### Service Definitions
- Updated `services.yaml` with preset selectors
- Improved parameter descriptions
- Added brightness parameter documentation

## Technical Changes

### Code Structure
- Added `EFFECT_PRESETS` dictionary with 24 preset definitions in `const.py`
- Added `SEGMENT_PATTERN_PRESETS` dictionary with 12 preset definitions in `const.py`
- Added preset constants for all 36 presets
- Added `_get_actual_segment_count()` helper function in `services.py`
- Updated all segment services to use helper function for segment count
- Removed unused brightness field from SegmentColor objects (Z2M doesn't use it)
- Added brightness pre-setting for T1 Strip before segment pattern commands

### Service Handler Updates
- `handle_set_dynamic_effect`: Added preset support with device type validation
- `handle_set_segment_pattern`: Added preset support with automatic color generation
- `handle_create_gradient`: Added proper T1 Strip length detection
- `handle_create_blocks`: Added proper T1 Strip length detection
- All segment services: Set T1 Strip brightness before segment commands with 0.1s delay

## Breaking Changes

None - This release is fully backward compatible with v0.1.0.

## Requirements

- Home Assistant 2025.12.0 or newer
- MQTT integration configured
- Zigbee2MQTT 2.7.2 or newer
- Supported Aqara devices:
  - T1 Ceiling Light (ACN031) - 20 segments
  - T1M Ceiling Light (ACN032) - 26 segments
  - T1 LED Strip (ACN132) - Variable (5 segments/meter, 1-10m)
  - T2 RGB Bulb (AGL001/AGL003/AGL005/AGL007)

### New Installation

One click HACS cutton

### Upgrade from v0.1.0

1. Update the integration through HACS
2. Restart Home Assistant
3. No configuration changes required


## [0.1.0] - 2025-12-29

### Added
- Initial release of Aqara Advanced Lighting integration
- Support for Aqara T1M Ceiling Lights (ACN031 20-segment, ACN032 26-segment)
- Support for Aqara T1 LED Strip (ACN132)
- Support for Aqara T2 RGB Bulbs (AGL001, AGL003, AGL005, AGL007)
- Service: `set_dynamic_effect` - Activate dynamic RGB effects with dropdown selector
  - Up to 8 color pickers for effect colors
  - 13 different effects across all device types
  - Speed control (1-100%)
  - Segment selection support for T1 Strip
- Service: `set_segment_pattern` - Set individual segment colors
  - Segment range support ("1-20", "5-10", "odd", "even")
  - Turn off unspecified segments option
- Service: `create_gradient` - Create smooth color gradients
  - Up to 6 color pickers for gradient colors
  - Segment selection support
  - Turn off unspecified segments option
- Service: `create_blocks` - Create evenly spaced color blocks
  - Expand mode for even distribution vs. alternating pattern
  - Segment selection support
  - Turn off unspecified segments option
- Automatic device discovery through Zigbee2MQTT
- Device registration in Home Assistant device registry
- Configuration flow with Z2M base topic configuration
- Reconfiguration flow for updating Z2M base topic
- RGB color picker UI for all color inputs
- Effect dropdown selector showing all available effects
- Turn on option for all services (automatically turn light on before applying effects)
- Flexible segment selection supporting ranges, individual segments, and special selectors

### Features
- Works seamlessly with existing Zigbee2MQTT setup
- No YAML configuration required - fully UI-based setup
- Backend validation ensures only compatible effects are used for each device type
- Supports both individual light entities and light groups
- Filters and only registers supported Aqara light models

### Technical
- Home Assistant 2025.12.0+ compatibility
- MQTT integration dependency
- Zigbee2MQTT 2.7.2+ required
- Quality scale: custom
- Integration type: service
- IoT class: local_push

[0.1.0]: https://github.com/absent42/Aqara-Advanced-Lighting/releases/tag/v0.1.0
