# Aqara Advanced Lighting v0.13.1

## Upgrade Instructions

**Upgrading from v0.13.0:**
1. Update via HACS to v0.13.1
2. Restart Home Assistant
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R), clear HA app cache

Your existing configuration, presets, and favorites are automatically preserved.

---

### What's New

Version 0.13.1 adds software-interpolated transitions for T1-family devices, optimizes effect attribute write order per device type, and reduces activation timing delays.

### New Features

#### **Software-Interpolated Transitions for T1-Family Devices**

**CCT and color transitions on T1M and T1 Strip**

T1M and T1 Strip devices don't fully support hardware transitions (T1M has a fixed ~2s transition that ignores requested duration; T1 Strip supports brightness transitions but not color temperature). This release adds software interpolation to simulate smoother longer transitions on these devices.

  - Cubic easing for natural-looking transitions
  - Per-device step intervals: T1M minimum 2.0s (hardware smooths between steps), T1 Strip minimum 0.5s
  - CCT transitions in both MQTT and ZHA backends
  - XY color transitions in both MQTT and ZHA backends
  - Interruptible at any sub-step via stop events

### Improvements

#### **Device-Specific Effect Attribute Write Order**

**Optimized MQTT payload and ZCL write order per device type**

  - T2 bulbs: speed before colors (writing speed restarts the effect with default colors on T2 firmware)
  - T1M and T1 Strip: colors before speed (speed is a live adjustment, colors render faster this way)
  - ZHA backend combines related attributes into single ZCL frames to reduce Zigbee round-trips

#### **Reduced Activation Timing Delays**

  - Light turn-on delay reduced from 0.5s to 0.25s
  - T1 Strip brightness pre-set delay reduced from 0.1s to 0.05s
  - Removed unnecessary inter-group delays between ZHA segment writes

### Breaking Changes

None. This release is fully backward compatible with v0.13.0. If updrading from an earlier version, see breaking changes in v0.13.0 changelog.

### Compatibility

- All existing presets, favorites, and configurations preserved
- No configuration changes required
- All previous features and APIs unchanged

## Full Changelog

[View full changelog](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CHANGELOG.md#0131---2026-02-21)

## Support

- [Report Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- [Documentation](https://github.com/absent42/Aqara-Advanced-Lighting)
- [Contributing Guidelines](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CONTRIBUTING.md)

---

If you find this integration useful, please star the repository

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)
