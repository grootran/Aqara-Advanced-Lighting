# Aqara Advanced Lighting v1.3.0

## Upgrade Instructions

**Upgrading from v1.2.0:**

1. Update via HACS to v1.3.0
2. Restart Home Assistant
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R), clear HA app cache

Your existing configuration, presets, and favorites are automatically preserved. Audio-reactive presets using the old boolean silence and brightness parameters are migrated automatically.

---

### What's New

Version 1.3.0 introduces audio-reactive effects for Aqara devices, allowing T1M and T1 Strip lights to run their native device effects speed modulated live by music. It also unifies the audio parameter model across scenes and effects for a consistent editing experience, and introduces a central engine registry that eliminates orphaned audio engines.

### **Audio-Reactive Effects**

T1M and T1 Strip lights can now run their built-in color effects (rainbow, flow, breathing, and more) with speed driven live by an ESPHome audio sensor.

  - Speed modulation channel
  - 3 modulation modes: temp, volume, and combined
  - Configurable min/max ranges for modulation
  - Silence behavior: hold last state  or decay toward minimum/mid point
  - Deadband filtering and rate limiting prevent flicker during quiet passages
  - Waveform badge on preset icons when audio-reactive is enabled
  - Live sensitivity slider in running-operation cards
  - Effect audio reactive override panel with per-entity sensor and sensitivity controls
  - 8 new audio-reactive effects presets for T1M/T1 Strip

### Audio Engine Reliability

  - Central `AudioEngineRegistry` tracks all active engines and resolves conflicts before starting new ones, eliminating the orphaned-engine bug where two effects on different lights sharing the same sensor would silently strand the first engine
  - `AudioEngine` shared class now powers both scenes and effects, replacing ~430 lines of inline subscription/queue/silence code in the scene manager
  - Sensor unavailability warning in running-operation cards when the audio entity goes offline

### Improvements

  - Stale devices automatically removed from the HA device registry when Z2M drops them from its device list or ZHA no longer reports them at startup
  - Repair issues raised in Settings → System → Repairs when the configured backend is unreachable (Z2M: bridge not responding after 2 minutes; ZHA: integration not installed); auto-clear when resolved
  - Auto-populate audio sensor in both scene editor and effect editor when the default sensor preference is set
  - Activation overrides panel reordered: all toggles at top, parameters below
  - Panel section descriptions updated throughout
  - EMA filter extracted to shared `EMAFilter` class; alpha and decay constants centralised in `const.py`
  - Implement spectral features, beat-phase prediction
  - Implement decay_min/decay_mid silence behaviors for audio scenes
  - Add drag-and-drop reordering for effect editor color swatches
  - Add drag-and-drop reordering for segment-selector gradient/blocks swatches
  - Default audio sensor selector moved to Device Config tab for easier discovery
  - `audio_silence_behavior` enum replaces the old boolean toggle: `hold`, `slow_cycle`, `decay_min`, `decay_mid`
  - `audio_brightness_curve` (linear/logarithmic/exponential) with configurable min/max replaces the boolean brightness-response toggle

### Fixes

  - Preserve original light state when switching between dynamic scene presets — preset B no longer restores to preset A's captured state baseline
  - On-device audio modes (T1 Strip music sync, generic on-device) now correctly cleaned up when a scene is detached, not left running
  - Stop orphaned audio engine and modulator when a new effect replaces a running audio-reactive effect
  - Audio modulator brightness writes now tagged with integration context, eliminating false pause-detection log spam
  - Apply audio waveform badge to scene presets with custom icons
  - Prevent false external change detection during scene transitions
  - Add missing audio fields to dynamic scene preset store whitelist
  - Dynamic scene preview audio
  - Add ESPHome name-derived unique_id aliases for companion sensor discovery
  - Migrate ha-textfield to ha-input for HA 2026.5+ compatibility

## Full Changelog

[View full changelog](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CHANGELOG.md#130---2026-04-06)

## Support

- [Report Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- [Documentation](https://github.com/absent42/Aqara-Advanced-Lighting)
- [Contributing Guidelines](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CONTRIBUTING.md)

---

If you find this integration useful, please star the repository

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)
