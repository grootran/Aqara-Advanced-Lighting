# Aqara Advanced Lighting v0.13.0

## Upgrade Instructions

**Upgrading from v0.12.x:**
1. Update via HACS to v0.13.0
2. Restart Home Assistant
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R), clear HA app cache

Your existing configuration, presets, and favorites are automatically preserved.

---

### What's New

Version 0.13.0 adds ZHA backend support as an alternative to Zigbee2MQTT, an image color extractor for dynamic scene presets, T1 Strip audio sync controls, dynamic scene color assignment overrides, and an ignore external changes toggle.

### New Features

#### **ZHA Backend Support**

**Full ZHA integration alongside Zigbee2MQTT**

Use Aqara advanced lighting features through the ZHA integration without requiring Zigbee2MQTT

  - Custom zigpy quirks for each supported device type (T2 bulbs, T1M, T1 Strip)
  - Direct Zigbee cluster attribute writes for effects, segment patterns, and segment sequences
  - Config flow support for quirked ZHA devices
  - ZHA installation instructions added to README

#### **Image Color Extractor**

**Extract colors from images for dynamic scene presets**

  - Upload or link an image to automatically extract a color palette
  - Extracted colors populate directly into the dynamic scene editor

#### **T1 Strip Audio Sync**

**Frontend controls for T1 Strip music synchronization mode**

  - Audio sync toggle, sensitivity, and effect controls in the panel
  - 2 device triggers: music sync enabled, music sync disabled (with sensitivity and audio effect in event data)
  - 1 device condition: music sync is active

#### **Dynamic Scene Color Assignment Override**

**Override color-to-light assignment when activating scenes**

  - Manually assign scene color distribution
  - Brightness activation override for per-scene control

#### **Ignore External Changes Toggle**

**Prevent external changes from pausing running operations**

  - Toggle to ignore external state changes on entities running sequences or scenes
  - Prevents false external pause detection from other automations or manual adjustments

### Improvements

#### **Device Registry Merging**

**Aqara Advanced Lighting devices now share the existing MQTT/ZHA device instead of creating duplicates**

  - The integration now merges into the existing MQTT or ZHA device in the Home Assistant device registry rather than creating a separate device for each light
  - For Z2M: uses shared MQTT identifiers so Home Assistant recognizes both integrations belong to the same physical device
  - For ZHA: uses Zigbee IEEE connection matching for automatic device merging
  - Users see one device per physical light with both integrations listed
  - Old standalone devices from previous versions are automatically removed on upgrade
  - Installing the integration does not affect existing MQTT/ZHA device setups
  - See [Breaking Changes](#breaking-changes) for upgrade notes on device automations

#### **Unified State Restoration**

**Shared StateManager helper for all operation types**

  - Consolidated state restoration logic into a shared StateManager helper
  - Consistent save/restore behavior across effects, sequences, and scenes
  - Cleaner codebase with reduced duplication

### Bug Fixes

- **Fixed auto-fill for new sequence steps** - New CCT and segment sequence steps now auto-fill with the previous step's settings instead of defaults
- **Fixed false external pause detection** - Operations no longer incorrectly detect external changes and pause themselves
- **Fixed deprecated `color_temp` usage** - State restore service calls now use the correct color temperature attribute
- **Fixed tab compatibility detection** - Frontend now uses `device_type` from the backend API for reliable tab compatibility checks
- **Fixed device type dropdown** - Device type dropdown now correctly updates when changing the selected entity
- **Fixed brightness override persistence** - Brightness override setting is now properly stored in user preferences
- **Fixed effects and patterns stopping sequences** - Effects and patterns now call `stop_all_for_entity` to fully stop running sequences instead of pausing and resuming them

### Breaking Changes

#### **Device Automation Re-selection**

**Device triggers and conditions require re-selection after upgrading**

  - The old standalone Aqara Advanced Lighting device is removed during upgrade and replaced by the merged MQTT/ZHA device (see [Improvements](#improvements))
  - **Action required:** If you have device automations (triggers or conditions) targeting the old standalone Aqara Advanced Lighting device, you will need to re-select the device in those automations after upgrading

### Compatibility

- All existing presets, favorites, and configurations preserved
- No configuration changes required
- All previous features and APIs unchanged
- ZHA support works alongside existing Zigbee2MQTT setups
- Device automations using triggers or conditions need device re-selection (see breaking changes above)

## Full Changelog

[View full changelog](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CHANGELOG.md#0130---2026-02-15)

## Support

- [Report Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- [Documentation](https://github.com/absent42/Aqara-Advanced-Lighting)
- [Contributing Guidelines](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CONTRIBUTING.md)

---

If you find this integration useful, please star the repository

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)
