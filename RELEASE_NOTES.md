# Aqara Advanced Lighting v1.2.0

## Upgrade Instructions

**Upgrading from v1.1.0:**

1. Update via HACS to v1.2.0
2. Restart Home Assistant
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R), clear HA app cache

Your existing configuration, presets, and favorites are automatically preserved.

---

### Breaking Changes

- **Minimum Home Assistant version raised to 2026.3.0** — Users on HA 2025.12.x–2026.2.x must upgrade Home Assistant before updating this integration. Removes legacy backwards compatibility for pre-WebAwesome components, and adds Python 3.1.4 optimisations.

---

### What's New

Version 1.2.0 introduces audio-reactive lighting for dynamic scenes, a Lovelace preset favorites card, the ability to hide build-in presets, and a major codebase refactor for maintainability. It also adds CCT slider support in the color picker, allows CCT-only lights in dynamic scenes, and selected Favorite lights now presist across reloads and devices.

### **Audio-Reactive Lighting**

**Dynamic scene changes can now be synced to music through an ESPHome audio sensor**

This new feature works in tandem with an ESPHome device flashed with [custom firmware](https://github.com/absent42/esphome-audio-reactive) that analyses environmental sound and outputs a variety of sensors such as beat detection and amplitude to Home Assistant, which this new feature then translates into music reactive dynamic scenes. It can work with any pre-existing dynamic scene preset by overriding the transition and hold time settings.

Initial firmware builds for 4 cheap off-the-shelf ESP32 devices are included, the M5Stack Atom Echo ($13/£13), M5Stack Atom Echo S3R ($15/£15), Waveshare ESP32-S3 Audio Board ($18/£18), and M5StickC Plus2 ($20/£20). These can be flashed with the custom firmware using a simple [web installer](https://absent42.github.io/esphome-audio-reactive/), no specialist ESP32 knowledge is needed. The firmware can also be adapted to any ESP32 device with a microphone.

For more detailed information on how this feature works please see the dedicated [documentation page](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/docs/audio-reactive-setup.md).

  - Audio-reactive lighting mode with ESP32-based on-device audio analysis
  - New ESPHome sensor integration
  - Responsive audio overrides
  - On-device audio mode opt-in for T1 Strip non-Aqara devices with built-in music sync functions
  - 12 new audio-reative presets

### **Preset Favorites Lovelace Card**

**A new dashboard card for quick access to your favorite presets**

  - Aqara Preset Favorites card for Lovelace dashboards
  - Active preset highlighting with toggle behavior

### **Hide and restore built-in presets**

  - Hide/restore built-in presets you don't use

### **Dynamic Scenes & Color Picker**

  - CCT-only lights now supported in dynamic scenes via XY-to-CCT conversion
  - CCT slider added to the color picker panel

### Improvements

  - Favorite light and entity selection added to user persistent storage
  - Replace externally paused text with color-coded entity chips
  - More ZHA attributes exposed for native HA controls
  - Pause solar/schedule sequences on new preset activation instead of stopping
  - Unify auto-generated icons to circular style

### Fixes
- Eliminate forced reflow during drag in transition curve graph
- RGB input fields snap back
- Off-state restoration for stopping presets on lights with segments
- Align solar/schedule CCT timeline labels with bar markers
- Solar/schedule sequence restarts for lights in on-state during HA reboot

## Full Changelog

[View full changelog](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CHANGELOG.md#120---2026-03-24)

## Support

- [Report Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- [Documentation](https://github.com/absent42/Aqara-Advanced-Lighting)
- [Contributing Guidelines](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CONTRIBUTING.md)

---

If you find this integration useful, please star the repository

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)
