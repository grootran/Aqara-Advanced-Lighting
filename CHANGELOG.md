# Changelog

All notable changes to the Aqara Advanced Lighting integration will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-01-09

## What's New

Version 0.5.0 is a major feature release that transforms the Aqara Advanced Lighting integration with powerful visual editors, and a comprehensive preset management system. This release focuses on enhancing the user experience with intuitive creation tools while maintaining full backward compatibility.

### User Preset System

Create, save, and manage your own custom presets for all feature types:

- **Preset Management** - Full CRUD operations for user-created presets
  - Create unlimited custom presets
  - Edit existing presets with full customization
  - Duplicate presets to create variations
  - Delete unwanted presets
  - Search and filter presets by type
- **Supported Preset Types** - Save presets for all features
  - Effect presets (dynamic RGB effects with colors and settings)
  - Segment pattern presets (custom segment color arrangements)
  - CCT sequence presets (multi-step color temperature sequences)
  - RGB segment sequence presets (animated segment patterns)
- **Persistent Storage** - Presets stored across Home Assistant restarts
  - Automatic save on creation/update/delete
  - UUID-based preset IDs for reliable tracking
  - Timestamps for created and modified dates

### Enhanced Panel UI with Visual Editors

The sidebar panel now includes interactive visual editors for creating custom effects, patterns, and sequences:

- **Effect Editor** - Create custom dynamic RGB effects
  - Effect type selector
  - Up to 8 color pickers for effect colors
  - Speed and brightness sliders
  - Segment selector for T1 Strip effects
  - Live preview of effect settings
  - Save as custom preset
- **Segment Pattern Editor** - Design custom segment color patterns
  - Visual segment selector showing all available segments
  - Color picker for each segment or range
  - Gradient and block pattern generators
  - Turn off unspecified segments option
  - Save as custom preset
- **CCT Sequence Editor** - Build multi-step CCT sequences
  - Up to 20 steps with visual timeline
  - Color temperature and brightness sliders for each step
  - Transition and hold duration controls
  - Loop mode and end behavior settings
  - Live step preview
  - Save as custom preset
- **RGB Segment Sequence Editor** - Create animated segment sequences
  - Up to 20 steps with animation patterns
  - Multiple color modes (gradient, blocks, individual)
  - Activation pattern selector with 8 options (all at once, sequential forward/reverse, random, ping pong, centre out, edges in, paired)
  - Duration and hold controls
  - Loop settings with skip first step option
  - Clear segments before starting option
  - Save as custom preset

### API Enhancements

Backend improvements to support new frontend features:

- **Panel API Endpoints** - RESTful API for preset management
  - GET /api/aqara_advanced_lighting/presets - List all presets
  - GET /api/aqara_advanced_lighting/presets/{type}/{id} - Get single preset
  - POST /api/aqara_advanced_lighting/presets/{type} - Create preset
  - PUT /api/aqara_advanced_lighting/presets/{type}/{id} - Update preset
  - DELETE /api/aqara_advanced_lighting/presets/{type}/{id} - Delete preset
  - POST /api/aqara_advanced_lighting/presets/{type}/{id}/duplicate - Duplicate preset
- **Color Format Support** - Services accept both RGB and XY formats
  - Automatic conversion between formats
  - XY format preferred for new presets
  - RGB format maintained for backward compatibility
- **Color Gamut Validation** - Server-side validation of color values
  - Ensures colors are within device gamut
  - Automatic clamping to valid range
- **Z2M Topic Access** - Frontend can read Z2M base topic for light discovery

## Technical Changes

### New Files

- **preset_store.py** - User preset storage and management
  - PresetStore class for CRUD operations
  - Automatic RGB to XY migration
  - Persistent JSON storage
- **Frontend Components** (TypeScript)
  - effect-editor.ts - Effect creation interface
  - pattern-editor.ts - Segment pattern builder
  - cct-sequence-editor.ts - CCT sequence timeline
  - segment-sequence-editor.ts - Segment sequence animator
  - hs-color-picker.ts - Custom HS color picker component
  - color-utils.ts - Color conversion utilities
- **Effect Icons** (SVG) - 13 custom effect icons in frontend/icons/

### Updated Files

- **models.py** - Added XYColor class with RGB↔XY conversion methods
- **const.py** - Added color gamut definitions and preset type constants
- **services.py** - Enhanced color handling to support both RGB and XY formats
- **panel.py** - Added API endpoints for preset management
- **mqtt_client.py** - Color conversion for MQTT payloads
- **__init__.py** - Initialize preset store on integration setup
- **aqara-panel.ts** - Major UI overhaul with editors and preset management
- **styles.ts** - Extensive style updates for new components
- **types.ts** - Added XY color and gamut type definitions

### Code Structure

- Added DATA_PRESET_STORE constant in const.py
- Added PRESET_TYPE_* constants for preset categorization
- Added AQARA_COLOR_GAMUTS mapping models to color gamuts
- Added ATTR_CLEAR_SEGMENTS and ATTR_SKIP_FIRST_IN_LOOP service attributes in const.py
- PresetStore initialized in async_setup() in __init__.py
- Presets stored in .storage/aqara_advanced_lighting.presets
- Panel API uses HomeAssistant's web framework

### RGB Segment Sequence Enhancements

- **Clear Segments Toggle** - Option to clear existing segment patterns before starting sequence
  - Ensures clean slate for new sequences
  - Prevents interference from previous patterns
  - Configurable per sequence via `clear_segments` parameter
- **Skip First in Loop** - Option to skip first step when looping sequences
  - Useful for initialization steps that should only run once
  - First step runs on initial execution, then skipped in subsequent loops
  - Configurable per sequence via `skip_first_in_loop` parameter

## Breaking Changes

None - This release is fully backward compatible with v0.4.1.

- Existing RGB service calls continue to work (automatically converted to XY internally)
- Old RGB presets automatically migrate to XY on first load
- All existing automations and scripts remain compatible
- Panel favorites from v0.4.1 are preserved

## Requirements

- Home Assistant 2025.12.0 or newer
- MQTT integration configured
- Zigbee2MQTT 2.7.2 or newer
- Supported Aqara devices (see README for full list)

## Upgrade from v0.4.1

1. Update the integration through HACS
2. Reload the integration (Settings > Devices & Services > Aqara Advanced Lighting > Three dots > Reload)
3. RGB presets will automatically migrate to XY format
4. No configuration changes required

## [0.4.1] - 2026-01-05

## New Features

### Panel Enhancements
- **Favorite Light Targets** - Save favorite lights for quick access in the panel
  - Favorites are stored per-user in Home Assistant storage
  - Add/remove favorites
  - Favorites persist across browser sessions and restarts
  - Accessible through the favorites store (FavoritesStore class)
- **Light Control Tiles** - Direct light control from the panel
  - Turn lights on/off
  - Brightness slider for quick brightness adjustments
  - Real-time status indicators showing current light state
  - Works with individual lights and light groups

## Technical Changes

### Code Structure
- Added FavoritesStore class in favorites_store.py for persistent favorites storage
- Added DATA_FAVORITES_STORE constant in const.py
- FavoritesStore initialized in async_setup() in __init__.py
- Favorites stored in .storage/aqara_advanced_lighting.favorites_store
- Panel UI updated with favorites and light control components

## Breaking Changes

None - This release is fully backward compatible with v0.4.0.

## [0.4.0] - 2026-01-04

## What's New

Version 0.4.0 introduces frontend enhancement and new RGB segment sequence capabilities.

### Frontend Panel

A new UI panel has been added to the Home Assistant sidebar for easy access to presets:

- **Sidebar Integration** - Access the "Aqara Lighting" panel directly from the Home Assistant sidebar
- **UI Buttons** - Interface for managing lights, effects, and sequences
- **Preset Buttons** - Access to all effect and sequence presets
- **Built with Lit** - Modern, lightweight web component framework for optimal performance
- More features to be added soon

The panel provides a centralized location for controlling Aqara lights without needing to use the Developer Tools or create automations.

### RGB Segment Sequences

Create animated segment patterns with the segment sequence feature:

**Key Features:**
- **Up to 20 Customizable Steps** - Build multi-step sequences
- **Multiple Activation Patterns:**
  - Sequential forward/reverse - Segments activate one by one
  - Random - Segments activate in random order
  - Simultaneous - All segments activate at once
- **Pattern Modes:**
  - Gradient - Smooth color transitions across segments
  - Blocks (repeat/expand) - Evenly spaced color blocks
  - Individual - Custom color per segment
- **Timing Control:**
  - Duration - Time to complete the activation pattern
  - Hold - Time to hold after activation completes
- **Loop Options:**
  - Run once, loop X times, or continuous loop
  - Choose to maintain state or turn off when complete
- **Pause and Resume** - Control sequence playback mid-execution

**Built-in Presets:**
- **Loading bar** - Sequential segment activation creating a loading bar effect
- **Wave** - Smooth color gradient wave flowing back and forth
- **Sparkle** - Random twinkling segments creating a sparkle effect
- and more

**New Services:**
- start_segment_sequence - Start an RGB segment sequence
- stop_segment_sequence - Stop a running sequence
- pause_segment_sequence - Pause a running sequence
- resume_segment_sequence - Resume a paused sequence

### CCT Sequence Enhancements

The existing CCT sequence feature has been enhanced with pause and resume functionality:

**New Services:**
- pause_cct_sequence - Pause a running CCT sequence while maintaining current state
- resume_cct_sequence - Resume a paused CCT sequence from where it was paused

This gives you better control over long-running sequences, allowing you to temporarily pause them without losing progress.

## Breaking Changes

None. This release is fully backward compatible with v0.3.0.

## New Services

### RGB Segment Sequences
- aqara_advanced_lighting.start_segment_sequence
- aqara_advanced_lighting.stop_segment_sequence
- aqara_advanced_lighting.pause_segment_sequence
- aqara_advanced_lighting.resume_segment_sequence

### CCT Sequence Control
- aqara_advanced_lighting.pause_cct_sequence
- aqara_advanced_lighting.resume_cct_sequence

## [0.3.0] - 2026-01-02

## New Features

### CCT Dynamic Sequences
- **Multi-Step CCT Sequences** - Create dynamic color temperature and brightness sequences
  - Up to 20 custom steps per sequence with individual color temperature, brightness, transition time, and hold duration
  - Three loop modes: once, count (repeat X times), continuous
  - Two end behaviors: maintain last state or turn off
  - Service: start_cct_sequence with manual or preset configuration
  - Service: stop_cct_sequence to stop running sequences
  - Service: pause_cct_sequence to pause sequences mid-execution
  - Service: resume_cct_sequence to resume paused sequences
- **CCT Sequence Presets** - Three built-in presets for common scenarios
  - Goodnight: 30-minute gradual dim from 4000K to 2700K, 50% to off
  - Wakeup: 30-minute sunrise simulation from 2700K to 6500K, 0% to 100%
  - Mindful Breathing: Continuous breathing cycle for meditation
- **Interruptible Sequences** - Sequences can be stopped or paused at any point
- **Event System** - Fires Home Assistant events for sequence lifecycle (started, completed, stopped, step changed)

### Effect and Pattern State Restoration
- **Stop Effect Service** - Restore lights to their pre-effect state
  - Service: stop_effect with optional state restoration
  - Automatically captures light state before applying effects or patterns
  - Restores brightness, color (RGB), and color temperature
  - Falls back to warm white if no previous state is saved
  - Works with all dynamic effects and segment patterns
- **Persistent State Storage** - Light states are saved across Home Assistant restarts
  - States stored in .storage/aqara_advanced_lighting.state_manager
  - Automatic expiry of entries older than 24 hours
  - Loaded automatically on integration setup

### Performance Optimization
- **Batch MQTT Publishing** - Synchronized group effects now publish to all devices in parallel
  - Uses asyncio.gather for efficient parallel operations
  - Applies when sync parameter is true and multiple lights are targeted
  - Significantly reduces latency when controlling multiple lights simultaneously
- **LRU Caching** - Device capability lookups are now cached
  - Reduces overhead for repeated device validation
  - Improves service call performance
  - Cache size of 32 devices
- **Parallel Brightness Changes** - Brightness adjustments across multiple entities execute in parallel
  - Uses asyncio.gather for concurrent Home Assistant service calls
  - Faster execution when setting brightness for multiple lights

### Group Synchronization
- **Light Group Support** - All services now support Home Assistant light groups
  - Automatic group detection and entity resolution
  - Groups are expanded to individual light entities
  - Duplicate entities are automatically removed
  - Synchronized effects across all group members
  - Works with all 9 services: set_dynamic_effect, stop_effect, set_segment_pattern, create_gradient, create_blocks, start_cct_sequence, stop_cct_sequence, pause_cct_sequence, resume_cct_sequence

## Technical Changes

### Code Structure
- Added _resolve_entity_ids() helper function in services.py for group entity resolution
- Added async_publish_batch_effects() method in mqtt_client.py for parallel effect publishing
- Added async_publish_batch_segments() method in mqtt_client.py for parallel segment publishing
- Added @lru_cache decorator to get_device_capabilities() in light_capabilities.py
- Added @lru_cache decorator to is_supported_model() in light_capabilities.py
- Added @lru_cache decorator to supports_segment_addressing() in light_capabilities.py
- Added @lru_cache decorator to supports_effect_segments() in light_capabilities.py

### Service Handler Updates
- All 9 service handlers now use _resolve_entity_ids() for group support
- handle_set_dynamic_effect: Uses batch publishing when sync=true and multiple devices
- handle_set_dynamic_effect: Parallel brightness changes using asyncio.gather
- All segment services: Use batch publishing for synchronized group operations

## Breaking Changes

None - This release is fully backward compatible with v0.2.0.

Note: Segment pattern preset values have changed from "t1m_segment_X" to "segment_X". If you have automations or scripts using the old format, update them to the new format.

## Requirements

- Home Assistant 2025.12.0 or newer
- MQTT integration configured
- Zigbee2MQTT 2.7.2 or newer
- Supported Aqara devices:
  - T1 Ceiling Light (ACN031) - 20 segments
  - T1M Ceiling Light (ACN032) - 26 segments
  - T1 LED Strip (ACN132) - Variable (5 segments/meter, 1-10m)
  - T2 RGB Bulb (AGL001/AGL003/AGL005/AGL007)

### Upgrade from v0.2.0

1. Update the integration through HACS
2. Reload the integration (Settings > Devices & Services > Aqara Advanced Lighting > Three dots > Reload)
3. Update any automations/scripts using old segment preset format ("t1m_segment_1" to "segment_1")

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
[0.2.0]: https://github.com/absent42/Aqara-Advanced-Lighting/releases/tag/v0.2.0
[0.3.0]: https://github.com/absent42/Aqara-Advanced-Lighting/releases/tag/v0.3.0
[0.4.0]: https://github.com/absent42/Aqara-Advanced-Lighting/releases/tag/v0.4.0
[0.4.1]: https://github.com/absent42/Aqara-Advanced-Lighting/releases/tag/v0.4.1
[0.5.0]: https://github.com/absent42/Aqara-Advanced-Lighting/releases/tag/v0.5.0
