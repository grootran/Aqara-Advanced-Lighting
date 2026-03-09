# Aqara Advanced Lighting v1.1.0

## Upgrade Instructions

**Upgrading from v1.0.0:**

1. Update via HACS to v1.1.0
2. Restart Home Assistant
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R), clear HA app cache

Your existing configuration, presets, and favorites are automatically preserved.

---

### What's New

Version 1.1.0 adds solar and schedule-based adaptive circadian CCT sequences, capability-aware light adaptation for any Home Assistant light, and a new more comprehensive override detection system.

### Schedule/Solar Mode for Adaptive CCT Sequences

**Time-of-day schedule mode and sun-elevation solar mode**

- Schedule steps use fixed times (12:00) or sun-relative times (sunrise+30, sunset-60)
- Solar timeline maps elevation to time using sinusoidal sun trajectory with real sunrise/sunset positions
- Automatic interpolation between steps on a 24-hour cycle
- Dual-track timeline preview showing color temperature and brightness with step markers
- New backend services `start_circadian_mode` and `stop_circadian_mode`
- Active circadian sequences persist across Home Assistant restarts

### Capability-Aware Light Adaptation

**Imporved support for non-Aqara lights in dynamic scenes and CCT sequences**

- Capability profiles classify lights as full-color, CCT-only, brightness-only, or on/off-only
- Service calls adapted at runtime using XY-to-CCT conversion and color temp clamping
- Software transition opt-in for non-Aqara lights via device config panel
- Entity chips with capability badges on running scene cards

### Override Detection System

**Context-based override detection with per-attribute control for solar and schedule sequences**

- Detects overrides from service call data before state changes arrive
- Context-only detection replaces grace window system
- Per-attribute change detection with hardware drift tolerance
- Non-HA drift detection for changes made outside Home Assistant
- Bare turn-on adaptation fills unspecified attributes with solar/schedule values
- Per-attribute pause indicators in frontend

### Schedule/Solar CCT Persistence

- Running solar and schedule sequences persist across Home Assistant restarts
- Sequences are restored after entities are registered on startup

### Improvements

- Proactive adaptation: immediate value application on resume and turn-on
- Schedule/Solar off/on resilience: skip updates while lights are off, force-apply on turn-on
- Per-preset auto-resume delay (moved from global to per-preset)
- Turn off light end behavior for dynamic scenes
- Skip first step in loop for CCT sequences
- Added Power Nap CCT sequence preset
- Selective user preset exports

### Bug Fixes

- Fix Loop N Times count field in Scenes tab
- Fix Signed URL preset export with selective filtering
- Fix Preset export using signed URL WebSocket command
- Fix Auth errors on API calls
- Fix active presets panel not updating after activation
- Fix last-half, first-third, last-third keywords to parse_segment_range

## Full Changelog

[View full changelog](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CHANGELOG.md#110---2026-03-09)

## Support

- [Report Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- [Documentation](https://github.com/absent42/Aqara-Advanced-Lighting)
- [Contributing Guidelines](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CONTRIBUTING.md)

---

If you find this integration useful, please star the repository

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)
