# Changelog

All notable changes to the Aqara Advanced Lighting integration will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
