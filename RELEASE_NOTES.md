# Aqara Advanced Lighting v0.11.0

## Upgrade Instructions

**Upgrading from v0.10.x:**
1. Update via HACS to v0.11.0
2. Restart Home Assistant
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R), clear HA app cache

Your existing configuration, presets, and favorites are automatically preserved.

---

## What's New

Version 0.11.0 introduces segment zone naming, a REST API trigger endpoint for external integrations, drag-and-drop step reordering in sequence editors, per-user preferences with server-side storage, and editor state preservation across tab switches.

## Changes

#### Segment Zone Naming

- **Per-device segment zone naming** - Assign custom names to segment zones on each device with a visual grid editor for intuitive zone configuration

#### State preservation across tab switching

- **Editor state preservation** - Editor state is preserved across tab switches with in-memory draft caching, so you don't lose work when switching tabs

#### User Preferences

- **Per-user preferences with server-side storage** - User preferences are stored on the server, persisting across browsers and devices
- **Collapsed section persistence** - Collapsed/expanded state of panel sections is saved to user preferences and restored on load

#### REST API Trigger Endpoint

- **External preset activation** - New REST API endpoint allows triggering presets from external systems, scripts, or third-party integrations without going through the HA UI

#### Sequence Editor Improvements

- **Drag-and-drop step reordering** - Reorder steps in CCT and segment sequence editors by dragging them into position

### Improvements

- **Device trigger diagnostics** - Device trigger readiness information added to diagnostics output

### Bug Fixes

- **Fixed preset colors not applied** when editing or duplicating segment sequences
- **Fixed effect selector** rendering issue
- **Fixed endpoint authentication** for API requests
## Breaking Changes

None. This release is fully backward compatible with v0.10.0.

## Compatibility

- Fully backward compatible with v0.10.0
- All existing features and APIs unchanged
- No configuration changes required
- All presets and favorites preserved

## Full Changelog

[View full changelog](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CHANGELOG.md#0110---2026-02-02)

## Support

- [Report Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- [Documentation](https://github.com/absent42/Aqara-Advanced-Lighting)
- [Contributing Guidelines](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CONTRIBUTING.md)

---

If you find this integration useful, please star the repository

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)
