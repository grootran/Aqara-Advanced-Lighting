# Aqara Advanced Lighting v0.12.0

## Upgrade Instructions

**Upgrading from v0.11.x:**
1. Update via HACS to v0.12.0
2. Restart Home Assistant
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R), clear HA app cache

Your existing configuration, presets, and favorites are automatically preserved.

---

### What's New

Version 0.12.0 introduces Dynamic Scenes for ambient lighting across multiple lights, Device Conditions for advanced automations, Active Presets monitoring, Activation Overrides for quick preset customization, and Favorite Presets for easy access to your most-used configurations.

### New Features

#### Dynamic Scenes

**Ambient lighting scenes across multiple lights** - Create slow color transitions that work with any RGB light entity
  - Up to 8 colors with XY color pickers and per-color brightness control (1-100%)
  - Transition time (30-3600 seconds) for smooth color changes
  - Hold time (0-3600 seconds) to pause at each color
  - Three distribution modes:
    - Shuffle and rotate - Each light gets a different color, then colors rotate smoothly through all lights along the color wheel
    - Synchronized - All lights transition through the same colors together
    - Random - Each light picks random colors from the palette
  - Transition stagger (0-10 seconds) to create wave effects across lights
  - Loop modes: once, count (1-1000), or continuous
  - End behavior: restore to previous state or maintain last color
  - Static mode option to apply colors once without transitions
  - Works with any RGB light entity, not limited to Aqara devices
**58 built-in dynamic scene presets**
  - Nature themes: Sunset Glow, Ocean Waves, Northern Lights, Forest Canopy, Fireplace
  - Relaxation: Relax, Cozy Embrace, Tranquil Waters, Evening Sundown
  - Vibrant: Rio Carnival, Ibiza Sunset, Cancun Party, Miami Nights, Tokyo Neon
  - Cosmic: Deep Space, Cosmic Galaxy, Starlit Night, Stellar Nebula
  - Seasonal: Spring Awakening, Summer Solstice, Golden Autumn, Winter Wonderland
  - And many more
**Dynamic scene editor** - Visual editor in the Scenes tab for creating custom dynamic scenes
  - XY color pickers with per-color brightness
  - Preview gradient thumbnails
  - Loop and end behavior configuration
  - Save as custom presets
**Dynamic scene services**
  - `start_dynamic_scene` - Start a dynamic scene with preset or manual configuration
  - `stop_dynamic_scene` - Stop running scene(s) with optional state restoration
  - `pause_dynamic_scene` - Pause a running scene
  - `resume_dynamic_scene` - Resume a paused scene
**Dynamic scene triggers** - 6 device triggers for scene lifecycle events
  - Scene started, stopped, paused, resumed
  - Loop completed, finished
- **REST API support** - Trigger dynamic scene presets via REST API endpoint

#### Device Conditions

**7 device conditions for automations** - Check current state of lights in automation conditions
  - CCT sequence is running / paused
  - Segment sequence is running / paused
  - Dynamic effect is active
  - Dynamic scene is running / paused
**Preset filter support** - Optional filter to check for specific preset by name
  - Allows precise condition matching for specific effects, sequences, or scenes
  - Example: "Only turn on fan if goodnight sequence is running"

#### Active Presets Monitoring

**Running presets display** - Real-time monitoring of all active operations
  - Shows all running effects, sequences, and scenes
  - Operation cards display preset icon, name, and target entity
  - Control buttons: stop, pause, resume for each operation
  - Multi-entity support with auto-refresh when operations change
  - Replaces the previous Quick Actions section

#### Activation Overrides

**Custom brightness override** - Override preset brightness when activating (1-100%)
  - Toggle to enable/disable
  - Slider for brightness adjustment
  - Applies to all preset types
**Static scene mode** - For dynamic scenes only
  - Apply scene colors once without starting transitions
  - Colors distributed according to scene's distribution mode
  - Lights remain at assigned colors without cycling

#### Favorite Presets

**Star your favorite presets** - Quick access to most-used presets
  - Mark any preset as favorite with star icon
  - Favorites appear in dedicated section for quick activation
  - Device-type-level filtering - only show presets compatible with selected lights
  - Sorting options: alphabetical or by date
  - Consistent icon styling across all preset types

#### Preset Management Improvements

**Consolidated preset storage** - All built-in presets now in single `presets.py` module
  - Simplified maintenance and updates
  - Better organization of 100+ built-in presets
**Dynamic preset population** - Service action dropdowns now populated with current presets
  - Always shows up-to-date preset lists
  - Includes both built-in and user-created presets
**Gradient thumbnails** - Visual preview thumbnails for CCT sequences and dynamic scenes
  - Automatically generated gradient previews
  - Helps identify presets at a glance

### Improvements

#### Frontend Enhancements

**Setup status indicator** - Shows when integration is still initializing
  - Prevents confusion during initial setup
  - Clear feedback when backend is not ready
**Include-all-lights toggle** - Light selection control
  - Option to include non-Aqara RGB/CCT lights for dynamic scenes and CCT sequences
  - Improved generic light compatibility
**Entity conflict resolution** - Cross-type conflict detection and handling
  - Prevents conflicts between different operation types
  - External change detection pauses affected entities
  - Entities can rejoin operations after manual changes
**Touch device improvements**
  - Removed click-to-activate from My Presets tab
  - Better touch target sizing
  - Improved gesture support
**Config tab visibility** - Hide segment zone config when no compatible device selected

### Bug Fixes

- **Fixed entity conflict resolution** - Proper handling of conflicts between operation types
- **Fixed state restoration** - Correct restoration of light states after effects/scenes
- **Fixed Circadian Rhythm preset** - Corrected timing and color temperature values
- **Fixed falsy value handling** - Editor change handlers now use nullish coalescing (??) instead of logical OR (||)
- **Fixed device automation translation format** - Proper translation for extra fields in device triggers/conditions
- **Fixed editor cancel button** - Reset editor to default state when cancel is clicked

### Breaking Changes

None. This release is fully backward compatible with v0.11.0.

- All existing presets and configurations preserved
- No configuration changes required
- All previous features and APIs unchanged

### Compatibility

- Fully backward compatible with v0.11.0
- All existing features and APIs unchanged
- No configuration changes required
- All presets and favorites preserved
- Dynamic scenes are an additive feature - existing functionality unchanged

## Full Changelog

[View full changelog](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CHANGELOG.md#0120---2026-02-08)

## Support

- [Report Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- [Documentation](https://github.com/absent42/Aqara-Advanced-Lighting)
- [Contributing Guidelines](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CONTRIBUTING.md)

---

If you find this integration useful, please star the repository

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)
