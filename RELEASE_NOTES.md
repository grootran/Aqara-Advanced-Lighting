# Aqara Advanced Lighting v1.3.0

## Upgrade Instructions

**Upgrading from v1.2.0:**

1. Update via HACS to v1.3.0
2. Restart Home Assistant
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R), clear HA app cache

Your existing configuration, presets, and favorites are automatically preserved. Audio-reactive presets using the old boolean silence and brightness parameters are migrated automatically.

If you are using the audio-reactive features, please update your device firmware to v0.4.2 via [web installer](https://absent42.github.io/esphome-audio-reactive/).

---

### What's New

Version 1.3.0 introduces an updated dashboard card, preset favorites custom sorting, drag and drop color swatches in effect and segments editors, and audio-reactive effects for Aqara devices, allowing T1M and T1 Strip lights to run their native device effects speed modulated live by music.

It also unifies the audio parameter model across scenes and effects for a consistent editing experience, and introduces a central engine registry that eliminates orphaned audio engines. Integration-side support for the ESPHome Audio Reactive v0.4.2 pro DSP tier adds per-musical-band sensors, and a beat-event binary sensor.

### **Dashboard Card v2**

The Aqara Preset Favorites card has been redesigned with new layout options and per-card customization.

  - **Pick which favorites appear on each card** — the card editor now has a curation list with checkboxes and drag handles, so each card can show a different subset of your favorites in any order you choose. Leave it untouched on existing cards to keep showing all favorites in their global order.
  - **Five layout choices** — grid (default), compact grid, list, hero (one large preset with the rest in a strip), and carousel (horizontal scroll). Existing cards using the old "compact" toggle automatically migrate to the new compact-grid layout.
  - **Optional brightness slider** — turn on a per-card slider above or below the preset display. Tap a preset and the slider's value applies to effects, segment patterns, segment sequences, and dynamic scenes. (CCT sequences keep their own per-step brightness.)
  - **Drag to reorder favorites in the panel** — favorites now default to a new "Custom" sort order. Hover any favorite tile in custom mode to reveal a drag handle, drop it where you want, and the order persists across browsers and reloads. Switching to "A-Z" or any other sort temporarily reorders the display without losing your custom order.
  - **Faster live updates** — the card now updates active-preset highlighting in real time when presets start or stop from anywhere (panel, automation, voice, another browser).

**Migration note:** if you previously had your favorites sort set to "Date added (oldest first)", it will switch to "Custom" automatically on next page load. The order stays the same; the rename simply unlocks the drag handles.

### **Audio-Reactive Effects**

T1M and T1 Strip lights can now run their built-in color effects (rainbow, flow, breathing, and more) with speed driven live by an ESPHome audio sensor.

  - Speed modulation channel — amplitude maps to effect speed (`volume` mode)
  - Configurable min/max ranges for modulation
  - Silence behavior: hold last state  or decay toward minimum/mid point
  - Deadband filtering and rate limiting prevent flicker during quiet passages
  - Waveform badge on preset icons when audio-reactive is enabled
  - Live sensitivity slider in running-operation cards
  - Effect audio reactive override panel with per-entity sensor and sensitivity controls
  - 8 new audio-reactive effects presets for T1M/T1 Strip

### **Better beat tracking for v1.2.x audio scenes**

The BTrack beat tracker has been rewritten in the firmware (esphome-audio-reactive v0.4.2). Existing audio scenes you set up in v1.2.0 using `beat_predictive` color advance now lock onto a wider range of music tempos than they did under v1.2.0. No config changes required — flash the new firmware and existing scenes track better.

### Audio Engine Reliability

  - Central `AudioEngineRegistry` tracks all active engines and resolves conflicts before starting new ones, eliminating the orphaned-engine bug where two effects on different lights sharing the same sensor would silently strand the first engine
  - `AudioEngine` shared class now powers both scenes and effects, replacing ~430 lines of inline subscription/queue/silence code in the scene manager
  - Sensor unavailability warning in running-operation cards when the audio entity goes offline

  ### Pro-tier DSP Integration (ESPHome Audio Reactive v0.4.2)

  - Auto-discovery of pro-tier companion sensors on any ESPHome audio device: `sub_bass_energy`, `low_mid_energy`, `upper_mid_energy`, `air_energy`, `beat_event` binary sensor, `calibration_stale` binary sensor, and the optional `fft_task_cycle_mean_us` / `fft_task_cycle_peak_us` diagnostic sensors. Basic-tier devices continue to work unchanged. The pro-tier sensors are exposed in HA for use in custom automations.
  - Calibration-stale warning logged once per device when a pro-tier audio device transitions its `calibration_stale` binary sensor to on, prompting the user to re-run quiet-room and music-level calibration after upgrading from v0.3.x firmware.

### Deferred to a future release

The following pro-tier features were planned for v1.3.0 but are temporarily hidden from the selectors while their upstream firmware DSP is stabilised. Existing scenes/effects with these values continue to load and run; you just can't pick them in new scenes/effects until a follow-up release.

  - **Effect speed modes** — `tempo` (BPM-driven) and `combined` (BPM + amplitude). The `volume` mode is the production speed-modulation channel for v1.3.0.
  - **Color-advance modes** — `bass_kick` (low-bass-band pulse) and `freq_to_hue` (spectral-centroid hue). The five other color-advance modes — `on_onset`, `continuous`, `beat_predictive`, `intensity_breathing`, `onset_flash` — are unaffected.

### Improvements

  - Stale devices automatically removed from the HA device registry when Z2M drops them from its device list or ZHA no longer reports them at startup
  - Repair issues raised in Settings → System → Repairs when the configured backend is unreachable (Z2M: bridge not responding after 2 minutes; ZHA: integration not installed); auto-clear when resolved
  - Auto-populate audio sensor in both scene editor and effect editor when the default sensor preference is set
  - Activation overrides panel reordered: all toggles at top, parameters below
  - Panel section descriptions updated throughout
  - EMA filter extracted to shared `EMAFilter` class; alpha and decay constants centralised in `const.py`
  - Implement spectral features, beat-phase prediction
  - Implement decay_min/decay_mid silence behaviors for audio scenes
  - Drag-and-drop reordering for effect editor color swatches
  - Drag-and-drop reordering for segment-selector gradient/blocks swatches
  - Default audio sensor selector moved to Device Config tab for easier discovery
  - `audio_silence_behavior` enum replaces the old boolean toggle: `hold`, `slow_cycle`, `decay_min`, `decay_mid`
  - `audio_brightness_curve` (linear/logarithmic/exponential) with configurable min/max replaces the boolean brightness-response toggle
  - Brightness override in the Activate tab now applies to segment sequences (built-in and user presets); dispatched once per entity at sequence start via `light.turn_on` so both T1M and T1 Strip honor it
  - Drag and drop sorting for favorite presets in frontend panel

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
  - Dashboard Card now propagates user audio-override preferences to activation
  - Effect favorite icons (built-in and user) now show the audio-reactive waveform badge correctly
  - User dynamic scenes with both an uploaded image thumbnail and a leftover MDI icon now show the thumbnail
  - Dynamic scenes activated from the dashboard card now highlight as active and are stoppable from the card

### Code Quality

  - Removed legacy preset-storage migration code introduced around 2026-02 (past the 3-month retention window): RGB-to-XY color format migration, `loop_mode: "loop"` → `"count"` rename migration, their flag constants, and the associated call sites in `PresetStore.async_load()`. Also removed the orphaned `XYColor.from_rgb()` classmethod.

## Full Changelog

[View full changelog](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CHANGELOG.md#130---2026-04-06)

## Support

- [Report Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- [Documentation](https://github.com/absent42/Aqara-Advanced-Lighting)
- [Contributing Guidelines](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CONTRIBUTING.md)

---

If you find this integration useful, please star the repository

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)
