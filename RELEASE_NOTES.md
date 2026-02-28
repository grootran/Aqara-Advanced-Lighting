# Aqara Advanced Lighting v1.0.0

## Upgrade Instructions

**Upgrading from v0.13.x:**

1. Update via HACS to v1.0.0
2. Restart Home Assistant
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R), clear HA app cache

Your existing configuration, presets, and favorites are automatically preserved.

*Note: For users of Zigbee2MQTT, it is recommended to update to Z2M v2.9.0, that release contains optimizations for effect and segment payloads.*

---

### What's New

Version 1.0.0 is the first stable release. It includes full Home Assistant 2026.3 compatibility, security hardening, a major UI overhaul with native HA components and accessibility support, expanded diagnostics, and significant backend refactoring.

### Improvements

#### **Restore State End Behavior for Sequences**

**CCT and segment sequences can now restore lights to their pre-sequence state**

- New "restore state" end behavior for both CCT and segment sequences
- Captures light state before sequence starts and restores it on completion
- State capture and restore also works with cancel and stop-preview

#### **Expanded Diagnostics**

- Added diagnostics for segment sequences, music sync, entity controller, and all stores

### Home Assistant 2026.3 Compatibility

- Migrated all MWC (Material Web Components) to native HA components
- Migrated `ha-dialog` to 2026.3 API with backwards compatibility for 2026.2
- Replaced custom form controls with HA native components
- Replaced deprecated mired attributes with kelvin
- Added brand icons and logos for HA 2026.3 brand registry

### Security

- Fixed SSRF vulnerability in image color extractor URL fetch
- Hardened all API endpoints and MQTT input handling
- Added input validation and storage limits across API and backend

### UI/UX Improvements

- Redesigned segement selector
- Converted custom modals to `ha-dialog`
- Redesigned instance cards and active preset cards
- Improved mobile layout
- Added ARIA attributes across all frontend components for screen reader support

### Bug Fixes

- Fixed CCT sequence not affecting T1 Strips in RGB mode
- Fixed CCT editor loop count field not showing when loop mode is count
- Fixed zone selector event leak
- Fixed `start_dynamic_scene` service not finding built-in presets
- Fixed `loop_mode` value mismatch between frontend editors and backend schema

### Code Quality and Refactoring

#### **Backend Refactoring**

- Extracted `BaseStore` to consolidate shared storage infrastructure
- Extracted `BaseSequenceManager` to eliminate duplicate sequence lifecycle code
- Consolidated duplicate CCT transition and light control into `transition_utils`
- Refactored `services.py`: extracted schema helpers, cached segment count, deduplicated lookups
- Consolidated duplicate RGB-to-XY conversion into single source
- Deduplicated shared logic

#### **Frontend Refactoring**

- Extracted shared editor constants, localization, and form CSS into `editor-constants.ts`
- Added frontend performance optimizations and type safety improvements

### Breaking Changes

None. This release is fully backward compatible with v0.13.x.

### Compatibility

- Home Assistant 2026.2 and 2026.3 supported
- All existing presets, favorites, and configurations preserved
- No configuration changes required

## Full Changelog

[View full changelog](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CHANGELOG.md#100---2026-02-28)

## Support

- [Report Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- [Documentation](https://github.com/absent42/Aqara-Advanced-Lighting)
- [Contributing Guidelines](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CONTRIBUTING.md)

---

If you find this integration useful, please star the repository

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)
