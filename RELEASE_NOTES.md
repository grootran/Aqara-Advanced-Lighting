# Aqara Advanced Lighting v1.3.0

## Upgrade Instructions

**Upgrading from v1.2.0:**

1. Update via HACS to v1.3.0
2. Restart Home Assistant
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R), clear HA app cache

Your existing configuration, presets, and favorites are automatically preserved. Audio-reactive presets using the old boolean silence and brightness parameters are migrated automatically.

---

### What's New

Version 1.3.0 introduces audio-reactive effects for Aqara devices, allowing T1M and T1 Strip lights to run their native device effects with speed and brightness modulated live by music. It also unifies the audio parameter model across scenes and effects for a consistent editing experience, and introduces a central engine registry that eliminates orphaned audio engines.

### **Audio-Reactive Effects**

**Native device effects that pulse, breathe, and react to music**

T1M and T1 Strip lights can now run their built-in color effects (rainbow, flow, breathing, and more) with speed and brightness driven live by an ESPHome audio sensor.

  - Speed and brightness modulation channels, each independently configurable
  - 4 modulation modes per channel: continuous (tracks audio level), on-onset (triggers on beat), intensity-breathing (smooth pulsing), and onset-flash (sharp beat flash)
  - Response curves — linear, logarithmic, and exponential — for natural-feeling modulation
  - Configurable min/max ranges for speed and brightness modulation
  - Silence behavior: hold last state, slow-cycle through the effect, or decay toward minimum
  - Deadband filtering and rate limiting prevent flicker during quiet passages
  - Waveform badge on preset icons when audio-reactive is enabled
  - Live sensitivity slider in running-operation cards
  - Effect audio reactive override panel with per-entity sensor and sensitivity controls
  - 8 new audio-reactive effects presets for T1M/T1 Strip

### **Unified Audio Parameters**

Scenes and effects now share the same richer audio controls:

  - **Silence behavior** — replaces the old on/off toggle with four options: `Hold`, `Slow cycle`, `Decay to min`, `Decay to mid`
  - **Brightness response curve** — linear, logarithmic, or exponential, with configurable min/max bounds; replaces the old boolean brightness-response toggle
  - All existing audio-reactive presets are migrated automatically — no manual changes needed
  - Default audio sensor selector moved to the Device Config tab for easier access

### **Audio Engine Reliability**

  - A new central `AudioEngineRegistry` tracks all active engines and stops conflicting engines before starting new ones — fixing the bug where two audio-reactive effects on different lights sharing the same sensor would silently orphan the first engine
  - The shared `AudioEngine` class now handles both scenes and effects, bringing consistent pause/resume, silence detection, and sensor reconnection across both features
  - Running-operation cards show a warning when the audio sensor goes unavailable

### Improvements

  - Devices removed from Zigbee2MQTT or ZHA are now automatically cleaned up from the HA device registry
  - Setup problems with your configured backend now surface in **Settings → System → Repairs** with clear guidance on how to fix them
  - Default audio sensor auto-populated in both the scene editor and effect editor
  - Activation overrides panel reordered: all toggles grouped at the top, parameters below
  - Brightness override automatically disabled when effect audio-reactive is enabled (they conflict)

### Fixes

  - Preserve original light state when switching between dynamic scene presets — preset B no longer restores to preset A's captured state baseline
  - On-device audio modes (T1 Strip music sync, generic on-device) now correctly cleaned up when a scene is detached, not left running
  - Stop orphaned audio engine and modulator when a new effect replaces a running audio-reactive effect
  - Audio modulator brightness writes now tagged with integration context, eliminating false pause-detection log spam

## Full Changelog

[View full changelog](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CHANGELOG.md#130---2026-04-06)

## Support

- [Report Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- [Documentation](https://github.com/absent42/Aqara-Advanced-Lighting)
- [Contributing Guidelines](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CONTRIBUTING.md)

---

If you find this integration useful, please star the repository

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)
