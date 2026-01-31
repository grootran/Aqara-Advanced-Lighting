# Aqara Advanced Lighting v0.10.0

## Upgrade Instructions

**Upgrading from v0.9.x:**
1. Update via HACS to v0.10.0
2. Restart Home Assistant
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)

Your existing configuration, presets, and favorites are automatically preserved.

---

## What's New

Version 0.10.0 adds device triggers for Home Assistant automations, preset management improvements including duplicate and edit, dynamic SVG preview thumbnails, recent color history in color pickers, and improved device type handling for T1M.

## Changes

### Device Triggers and Registry

- Aqara lighting devices now appear in the HA automation UI device trigger selector for native trigger-based automations
- Devices are registered in the HA device registry with sequence event metadata

### Preset Management

- **Duplicate and edit presets** - Duplicate existing presets and edit saved presets directly
- **Dynamic SVG preview thumbnails** - Presets display dynamically generated SVG thumbnails showing the actual color pattern

### Activate Tab

- Selected device on the Activate tab now carries over to editor tabs
- Activate tab split by device type (T1, T1M, T2) with per-section sorting

### Color Picker

- Color picker modals now remember recently used colors for quick reuse

### Effects panel

- Updated icons for dynamic effects

### Improvements

- Features filtered by T1M endpoint capabilities to prevent unsupported operations
- Faster device name lookups with `devices_by_name` index
- Pattern presets automatically scale to fit device segment count
- Sequence preset hold time limit raised to 12 hours

### Bug Fixes

- Fixed pattern mode not loading correctly when opening saved presets
- Fixed brightness conversion when activating user presets
- Fixed unspecified segments turning white when editing saved presets

## Breaking Changes

None. This release is fully backward compatible with v0.9.0.

## Compatibility

- Fully backward compatible with v0.9.0
- All existing features and APIs unchanged
- No configuration changes required
- All presets and favorites preserved

## Full Changelog

[View full changelog](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CHANGELOG.md#0100---2026-01-31)

## Support

- [Report Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- [Documentation](https://github.com/absent42/Aqara-Advanced-Lighting)
- [Contributing Guidelines](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CONTRIBUTING.md)

---

If you find this integration useful, please star the repository

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)
