# Audio-reactive lighting setup

[Back to README](../README.md) | [Services](services.md) | [Frontend panel](frontend-panel.md)

Audio-reactive mode makes your lights respond to music and sound in real time. Colors advance on musical onsets, brightness pulses with volume, and the palette flows with the music. This guide covers the hardware you need, how to set it up, and how to use it with the integration.

## Table of contents

- [How it works](#how-it-works)
- [Recommended hardware](#recommended-hardware)
- [Setting up the sensor](#setting-up-the-sensor)
  - [One-click install (recommended)](#one-click-install-recommended)
  - [Manual ESPHome setup](#manual-esphome-setup)
- [Calibrating the device](#calibrating-the-device)
- [Verifying in Home Assistant](#verifying-in-home-assistant)
- [Using audio-reactive mode](#using-audio-reactive-mode)
  - [Audio presets](#audio-presets)
  - [From the frontend panel](#from-the-frontend-panel)
  - [From a service call](#from-a-service-call)
  - [Audio parameters](#audio-parameters)
  - [Color advance modes](#color-advance-modes)
  - [Detection modes](#detection-modes)
  - [Sensitivity](#sensitivity)
  - [Transition speed](#transition-speed)
  - [Brightness response](#brightness-response)
  - [Frequency zone distribution](#frequency-zone-distribution)
  - [Silence degradation](#silence-degradation)
  - [Beat prediction](#beat-prediction)
  - [Color by frequency](#color-by-frequency)
  - [Rolloff brightness](#rolloff-brightness)
- [Audio-reactive effects](#audio-reactive-effects)
  - [Effect audio parameters](#effect-audio-parameters)
  - [Speed modulation modes](#speed-modulation-modes)
  - [Brightness modulation modes](#brightness-modulation-modes)
  - [Effect audio from a service call](#effect-audio-from-a-service-call)
- [How audio detection works](#how-audio-detection-works)
- [T1 Strip on-device audio sync](#t1-strip-on-device-audio-sync)
- [On-device audio for other lights](#on-device-audio-for-other-lights)
- [Sharing a sensor between scenes and effects](#sharing-a-sensor-between-scenes-and-effects)
- [Sensor placement tips](#sensor-placement-tips)
- [Troubleshooting](#troubleshooting)

---

## How it works

Audio-reactive mode replaces the fixed timing of a dynamic scene (transition time, hold time) with live audio data from an ESPHome device running the [esphome-audio-reactive](https://github.com/absent42/esphome-audio-reactive) component. The component performs on-device FFT analysis with a dedicated processing task and exposes onset detection and frequency band data to Home Assistant. The integration uses these to:

- **Detect musical onsets** (beats, cymbal hits, vocal entrances) and advance colors
- **Modulate brightness** so lights pulse with the music's dynamics
- **Map amplitude to palette position** for continuous color flow that tracks the sound
- **Predict beats** by learning the tempo and sending commands early to compensate for Zigbee latency
- **Distribute lights by frequency** so different lights react to bass, mid, and treble
- **Map spectral brightness to color** using real-time spectral centroid analysis
- **Scale brightness by timbre** using spectral rolloff for timbral responsiveness

You need an ESP32 device with a microphone running ESPHome and the [esphome-audio-reactive](https://github.com/absent42/esphome-audio-reactive) component. The device sits near your speaker and streams audio analysis data to Home Assistant over your local network.

---

## Recommended hardware

You need an ESP32 device with a microphone. Four options are listed below:

### M5Stack ATOM Echo

The best starting point for most users, readily available.

![M5Stack ATOM Echo](https://raw.githubusercontent.com/absent42/esphome-audio-reactive/refs/heads/main/static/images/atom-echo.jpg)

| | |
|---|---|
| **Price** | ~$13 |
| **Chipset** | ESP32-PICO-D4 |
| **Microphone** | Built-in SPM1423 PDM |
| **Feedback** | LED |
| **Power** | USB-C |
| **Size** | 24 x 24 x 17mm |
| **Where to buy** | [M5Stack store](https://shop.m5stack.com/products/atom-echo-smart-speaker-dev-kit), [Pi Hut](https://thepihut.com/products/atom-echo-smart-speaker-dev-kit), [Amazon US](https://amzn.to/4dnA7GH), [Amazon UK](https://amzn.to/4bdYJQM), [Amazon DE](https://amzn.to/47lapii), [Amazon FR](https://amzn.to/4rU1Ja6), [Amazon IT](https://amzn.to/4rSoJWO), [AliExpress](https://s.click.aliexpress.com/e/_c3ULpt9b) |

### M5Stack ATOM Echo S3R

Higher-quality audio with an ES8311 codec and speaker feedback for on-device status tones.

![M5Stack ATOM Echo S3R](https://raw.githubusercontent.com/absent42/esphome-audio-reactive/refs/heads/main/static/images/atom-echo-s3r.jpg)

| | |
|---|---|
| **Price** | ~$15 |
| **Chipset** | ESP32-S3 |
| **Microphone** | MEMS via ES8311 ADC (I2S, 44.1kHz) |
| **Audio codec** | ES8311 (mic ADC + speaker DAC) |
| **Feedback** | Speaker tones (no LED) |
| **Power** | USB-C |
| **Size** | 24 x 24 x 17mm |
| **Where to buy** | [M5Stack store](https://shop.m5stack.com/products/atom-echos3r-smart-speaker-dev-kit?variant=46751279710465), [Pi Hut](https://thepihut.com/products/atom-echos3r-smart-speaker-dev-kit), [AliExpress](https://s.click.aliexpress.com/e/_c4oQ7XMD) |

### Waveshare ESP32-S3 Audio Board

Feature-rich board with dual MEMS microphones, 7-LED ring, and optional battery power.

![Waveshare ESP32-S3](https://raw.githubusercontent.com/absent42/esphome-audio-reactive/refs/heads/main/static/images/waveshare-esp32-s3.jpg)

| | |
|---|---|
| **Price** | ~$16 |
| **Chipset** | ESP32-S3R8 (8MB PSRAM) |
| **Microphone** | Dual MEMS via ES7210 ADC (I2S, 44.1kHz) |
| **Audio codec** | ES7210 (mic) + ES8311 (speaker) |
| **Feedback** | LED ring |
| **Power** | USB-C, optional battery |
| **Size** | 58 x 58 x 49mm |
| **Where to buy** | [Waveshare store](https://www.waveshare.com/esp32-s3-audio-board.htm), [Amazon US](https://amzn.to/4lqAoKU), [Amazon UK](https://amzn.to/414SkRU), [Amazon DE](https://amzn.to/4bvKK9b), [Amazon FR](https://amzn.to/4uQIu3U), [AliExpress](https://s.click.aliexpress.com/e/_c3nj7nSd) |

### M5StickC Plus2

A compact development kit with a built-in screen, battery, and PDM microphone.

![M5StickC Plus2](https://raw.githubusercontent.com/absent42/esphome-audio-reactive/refs/heads/main/static/images/m5stack-stick2.jpg)

| | |
|---|---|
| **Price** | ~$20 |
| **Chipset** | ESP32-PICO-V3-02 |
| **Microphone** | Built-in SPM1423 PDM |
| **Feedback** | Screen |
| **Power** | USB-C, built-in battery |
| **Size** | 54 x 25 x 16mm |
| **Where to buy** | [M5Stack store](https://shop.m5stack.com/products/m5stickc-plus2-esp32-mini-iot-development-kit), [Pi Hut](https://thepihut.com/products/m5stickc-plus2-esp32-mini-iot-development-kit), [Amazon US](https://amzn.to/470ydYE), [Amazon UK](https://amzn.to/4brZ0i4), [Amazon DE](https://amzn.to/3PZFwde), [Amazon FR](https://amzn.to/4uM3Dwh), [Amazon IT](https://amzn.to/4c3nJdU), [AliExpress](https://s.click.aliexpress.com/e/_c3liKXJr) |

---

## Setting up the sensor

The [esphome-audio-reactive](https://github.com/absent42/esphome-audio-reactive) component runs on your ESP32 and performs on-device FFT analysis, onset detection, and frequency band energy measurement. It exposes an `Audio Sensor` binary sensor entity (the audio trigger for dynamic scenes) and companion sensors for bass energy, mid energy, high energy, amplitude, BPM, silence state, and control entities for sensitivity, squelch, detection mode, mute, and calibration.

### One-click install (recommended)

The fastest way to get started -- no ESPHome knowledge required.

1. Visit **[absent42.github.io/esphome-audio-reactive](https://absent42.github.io/esphome-audio-reactive/)**
2. Connect your ESP32 device via USB (requires Chrome or Edge browser)
3. Click **Install** and follow the prompts
4. Install the [ESPHome](https://www.home-assistant.io/integrations/esphome/) integration in Home Assistant
5. The device will appear in the Home Assistant ESPHome integration automatically

The one-click installer supports the **M5Stack ATOM Echo**, **ATOM Echo S3R**, and **Waveshare ESP32-S3 Audio Board**. For other devices, use the manual ESPHome setup below.

**ESP32-S3 devices (S3R, Waveshare):** If the installer can't connect, hold the BOOT button on the device while plugging in the USB cable, then click Install.

### Manual ESPHome setup

If you prefer to compile yourself, need a custom configuration, or are using a device other than the ATOM Echo, you can add the `esphome-audio-reactive` external component to any ESPHome configuration.

**Prerequisites:**

- [ESPHome](https://esphome.io/guides/getting_started_command_line/) installed (via pip, Docker, or your preferred method)
- A USB data cable for first-time device flash (not a charge-only cable)

Add the external component source and the `audio_reactive` platform to your device's ESPHome YAML. See the device-specific YAML files in the component repository for complete, ready-to-flash examples: `atom-echo.yaml`, `atom-echo-s3r.yaml`, and `waveshare-s3-audio.yaml`. You also need the ESPHome integration in Home Assistant (**Settings > Devices & services > ESPHome**) to receive sensor data from the device.

### Flashing the device

**First-time flash (USB required):**

Make sure you are using a USB data cable, not a charge-only cable (a common issue). For ESP32-S3 devices (S3R, Waveshare), if the serial port is not detected, hold the BOOT button while plugging in the USB cable to enter download mode.

```bash
esphome run atom-echo.yaml
```

Select the serial port when prompted. The firmware will compile, flash, and the device will reboot and connect to your Wi-Fi.

**Subsequent updates (over-the-air):**

Once a device has been flashed and is connected to your network, subsequent updates can be done wirelessly. Run the same command and ESPHome will detect the device on the network automatically.

---

## Calibrating the device

For best results, calibrate the device to your specific environment after initial setup. Calibration data is stored on the device and survives power cycles.

### Quiet room calibration

Ensures the device correctly identifies silence and doesn't react to ambient noise (AC hum, fan noise, etc.).

1. Make sure the room is quiet (no music, minimal background noise)
2. **Double-click** the device button, or press **Calibrate Quiet Room** in Home Assistant
3. The LED glows green for 3 seconds while sampling (ATOM Echo / Waveshare). The ATOM Echo S3R plays a tone instead.
4. The LED brightens briefly to confirm calibration is complete

### Music level calibration

Teaches the device what typical music levels look like in your setup, so the sensors produce a useful 0-1 range instead of being stuck at maximum.

1. Play music at your typical listening volume
2. **Triple-click** the device button, or press **Calibrate Music Level** in Home Assistant
3. The LED glows blue for 5 seconds while sampling (ATOM Echo / Waveshare). The ATOM Echo S3R plays a tone instead.
4. The LED brightens briefly to confirm calibration is complete

**Run quiet room calibration first, then music calibration.** If you change rooms, speaker setup, or device placement, re-run both calibrations.

### Button actions

**ATOM Echo / ATOM Echo S3R** — single button, click pattern:

| Action | ATOM Echo | ATOM Echo S3R |
|--------|-----------|---------------|
| **Double click** | Calibrate quiet (green LED) | Calibrate quiet (speaker tone) |
| **Triple click** | Calibrate music (blue LED) | Calibrate music (speaker tone) |
| **Long press (1s+)** | Toggle mute (red LED) | Toggle mute (speaker tone) |

**M5StickC Plus2** — Button A (front), click pattern. Button B (side) exposed for custom use:

| Action | Button A | Feedback |
|--------|----------|----------|
| **Double click** | Calibrate quiet room | Green screen |
| **Triple click** | Calibrate music level | Blue screen |
| **Long press (1s+)** | Toggle mute | Red screen |

**Waveshare ESP32-S3 Audio Board** — three dedicated buttons:

| Button | Action | Feedback |
|--------|--------|----------|
| **K1** | Calibrate quiet room | Green LEDs |
| **K2** | Calibrate music level | Blue LEDs |
| **K3** | Toggle mute | Red LEDs |

AGC reset is available from Home Assistant only (button entity).

---

## Verifying in Home Assistant

After flashing and calibrating, the device should auto-discover in Home Assistant within a minute.

1. Go to **Settings > Devices & services**
2. The ESPHome device should appear as a new integration or under your existing ESPHome integration
3. Click **Configure** if prompted
4. Go to **Settings > Devices & services > Entities** and search for "audio sensor" or "bass energy"
5. You should see the Audio Sensor binary sensor, five measurement sensors (Bass Energy, Mid Energy, High Energy, Amplitude, BPM), a Silence binary sensor, and control entities (Beat Sensitivity, Squelch, Detection Mode, Microphone Mute)

### Testing the sensor

1. Open the `Audio Sensor` binary sensor entity in the HA UI
2. Play music near the device
3. You should see the binary sensor pulse on/off with musical events
4. Check the `Bass Energy` and `Amplitude` sensors -- they should fluctuate between 0 and 1
5. The `BPM` sensor should settle on an approximate tempo after a few seconds of music
6. The `Silence` binary sensor should be off when music is playing and on when the room is quiet
7. If the values stay flat or stuck at 1.0, run the calibration steps above

---

## Using audio-reactive mode

Audio-reactive mode works with any dynamic scene. You enable it by selecting an audio sensor entity, which replaces the fixed transition and hold timing with live audio-driven updates.

### Audio presets

For most users, start with an audio preset instead of configuring individual parameters. Presets bundle all audio settings into a single selection:

| Preset | Best for | What it does |
|---|---|---|
| **Beat** | Pop, electronic, rock | Color cycle on each beat, high speed, responsive |
| **Ambient** | Background listening, ambient | Slow brightness breathing with rolloff response |
| **Concert** | Live music, complex audio | Beat prediction, frequency zone distribution, color by frequency |
| **Chill** | Lounge, jazz, relaxation | Continuous palette drift, gentle sensitivity |
| **Club** | EDM, dance, high energy | Brightness flash on bass beats, maximum speed |

Select a preset and it auto-fills all parameters. Changing any individual parameter switches to **Custom**. You can start with a preset and tweak from there.

#### Built-in audio-reactive presets

The integration includes 12 built-in dynamic scene presets designed for audio-reactive use. These presets have pre-configured audio modes, detection algorithms, and color palettes — just set a **Default Audio Sensor** in the My Presets panel and activate them:

**Energetic** — colors advance on beats, high energy:

| Preset | Audio mode | Detection | Best for |
|---|---|---|---|
| **Beat Drop** | On onset | Bass energy | EDM, hip-hop, heavy bass |
| **Neon Pulse** | On onset | Spectral flux | Pop, funk, live music |
| **Dance** | Beat predictive | Bass energy | Club, electronic dance |
| **Concert** | Beat predictive | Complex domain | Live instruments, rock |

**Ambient** — colors flow with energy, subtle:

| Preset | Audio mode | Detection | Best for |
|---|---|---|---|
| **Lounge** | Continuous | Spectral flux | Jazz, lo-fi, downtempo |
| **Tidal Flow** | Continuous | Bass energy | Ambient, drone, soundscapes |
| **Deep Breath** | Intensity breathing | Spectral flux | Meditation, classical, ASMR |
| **Ember Glow** | Intensity breathing | Bass energy | Acoustic, folk |

**Experimental** — advanced spectral features:

| Preset | Audio mode | Special feature | Best for |
|---|---|---|---|
| **Synesthesia** | Onset flash | Color by frequency | "See" the frequency spectrum |
| **Spectral Cascade** | Onset flash | Rolloff brightness | Dynamic, varied music |

**Crossover** — frequency zone distribution (3+ lights recommended):

| Preset | Audio mode | Special feature | Best for |
|---|---|---|---|
| **Frequency Split** | Continuous | Frequency zones | Sound system visualizer |
| **Deee-Lite** | Beat predictive | Frequency zones | Funk, house, disco |

### From the frontend panel

> **Tip:** Set a **Default Audio Sensor** in the **My Presets** panel header to avoid selecting your sensor every time. This default is automatically used when activating any built-in audio-reactive preset, and pre-fills the sensor field in the dynamic scene editor.

1. Open the **Aqara Advanced Lighting** panel in Home Assistant
2. Create or edit a dynamic scene preset with the colors you want
3. Expand the **Audio reactive** section in the editor
4. Toggle **Enable audio** on
5. Select an **audio preset** (Beat, Ambient, Concert, Chill, or Club)
6. Select your audio sensor entity (for example, `binary_sensor.audio_reactive_audio_sensor`)
7. Adjust individual parameters if needed (switches preset to Custom)
8. Save the preset

When activating a preset, you can also override audio settings at activation time without changing the saved preset:

1. In the activation overrides section, toggle **Audio reactive** on
2. Select an audio preset or configure individually
3. Select the audio entity
4. Click activate — the scene will run with your audio overrides

> **Note:** Enabling audio reactive automatically disables the Brightness, Static scene mode, and Scene color assignment overrides, as these conflict with audio-driven control.

### From a service call

Call `aqara_advanced_lighting.start_dynamic_scene` with the `audio_entity` parameter to enable audio mode:

```yaml
service: aqara_advanced_lighting.start_dynamic_scene
data:
  entity_id:
    - light.living_room_bulb
    - light.tv_backlight
  colors:
    - x: 0.68
      y: 0.31
      brightness_pct: 100
    - x: 0.17
      y: 0.04
      brightness_pct: 80
    - x: 0.15
      y: 0.06
      brightness_pct: 90
    - x: 0.21
      y: 0.71
      brightness_pct: 85
  transition_time: 1.0
  hold_time: 0.5
  distribution_mode: shuffle_rotate
  loop_mode: continuous
  audio_entity: binary_sensor.audio_reactive_audio_sensor
  audio_sensitivity: 60
  audio_color_advance: on_onset
  audio_detection_mode: spectral_flux
  audio_transition_speed: 70
  audio_brightness_curve: linear
  audio_brightness_min: 30
  audio_brightness_max: 100
  audio_frequency_zone: false
  audio_silence_behavior: slow_cycle
  audio_color_by_frequency: false
  audio_rolloff_brightness: false
```

When `audio_entity` is set, the `transition_time` and `hold_time` values are ignored. Color changes are driven entirely by the audio data.

### Audio parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `audio_entity` | entity_id | none | Audio sensor binary sensor from the `esphome-audio-reactive` component. Setting this enables audio mode. |
| `audio_sensitivity` | 1-100 | 50 | How responsive onset detection is to sound. Higher values detect quieter events. |
| `audio_color_advance` | string | `on_onset` | How colors advance through the palette (see color advance modes below). |
| `audio_detection_mode` | string | `spectral_flux` | Detection algorithm: `spectral_flux` (all genres), `bass_energy` (rhythmic music), or `complex_domain` (phase+magnitude, soft onsets). |
| `audio_transition_speed` | 1-100 | 50 | How fast colors fade between changes. Higher = faster. |
| `audio_brightness_curve` | string/null | `linear` | Response curve for brightness modulation: `linear`, `logarithmic`, `exponential`, or `null` to disable. |
| `audio_brightness_min` | 1-100 | 30 | Minimum brightness percent when audio is quiet. |
| `audio_brightness_max` | 1-100 | 100 | Maximum brightness percent when audio is loud. |
| `audio_frequency_zone` | boolean | false | Auto-distribute lights across bass/mid/high frequency bands. Requires 3+ lights. |
| `audio_silence_behavior` | string | `slow_cycle` | Behavior during silence: `slow_cycle` (gradual palette cycling), `hold` (freeze), `decay_min` (fade to minimum), `decay_mid` (fade to midpoint). |
| `audio_prediction_aggressiveness` | 1-100 | 50 | How aggressively to predict beats (beat_predictive mode only). |
| `audio_latency_compensation_ms` | 0-500 | 150 | Milliseconds to send commands early to compensate for Zigbee latency (beat_predictive mode only). |
| `audio_color_by_frequency` | boolean | false | Map spectral centroid to palette position. Low frequencies select warm colors, high frequencies select cool. |
| `audio_rolloff_brightness` | boolean | false | Scale brightness based on spectral rolloff. Brighter timbres produce brighter lights. |

### Color advance modes

| Mode | Description | Best for |
|---|---|---|
| **Color cycle** (`on_onset`) | Each musical onset advances to the next color in the palette. Rhythmic, punchy. | Music with clear beats (pop, electronic, rock) |
| **Continuous** (`continuous`) | Energy level maps continuously to palette position. Smooth color flow. | Ambient, classical, jazz |
| **Beat predictive** (`beat_predictive`) | Learns the tempo and sends light commands early to compensate for Zigbee latency. | Steady-tempo music where tight sync matters |
| **Intensity breathing** (`intensity_breathing`) | Slow brightness envelope tracks overall loudness. Ignores individual beats. | Background/ambient listening |
| **Brightness flash** (`onset_flash`) | Slow color drift with brightness spikes on each onset. | Combining ambient flow with reactive punch |

### Detection modes

**Spectral flux** (default) detects any sudden change across all frequency bands — kick drums, snare hits, cymbal crashes, piano attacks, violin pizzicato, vocal entrances. Works with all music genres.

**Bass energy** only detects bass energy threshold crossings. Optimized for rhythmic music with a prominent low-frequency beat. Includes hysteresis to prevent rapid re-triggering.

**Complex domain** tracks both magnitude and phase evolution across consecutive FFT frames (based on Dixon 2006). Particularly effective at detecting soft onsets that pure magnitude-based methods miss — gentle piano notes, bowed strings, vocal entrances without consonants. Uses adaptive spectral whitening to reduce false positives from sustained tones.

### Sensitivity

Sensitivity controls how easily the device detects musical events. The value (1-100) is sent directly to the device's onset detection algorithm.

- **Low values (1-30):** Only strong, prominent events trigger a color change.
- **Mid values (40-60):** A balanced default. Reacts to clear beats in most music.
- **High values (70-100):** Reacts to subtle sounds. Good for quiet listening or ambient music.

**Runtime adjustment:** When an audio scene is running, a sensitivity slider appears in the active scene controls. Drag the slider to adjust sensitivity in real time without stopping the scene.

### Transition speed

Transition speed (1-100) controls how fast the lights fade from one color to the next:

- **1** (slowest): 2-second fade. Soft, dreamy quality.
- **50** (default): ~1-second fade. Balanced.
- **100** (fastest): 0.1-second snap. Sharp, punchy.

Not applicable to intensity breathing mode (which uses its own slow envelope).

### Brightness response

When brightness response is enabled, the lights' brightness pulses with the volume. The modulation range is clamped between 30% and 100% of the scene's configured brightness, so lights never go completely dark.

Not applicable to intensity breathing or brightness flash modes (where brightness modulation is inherent to the mode).

### Frequency zone distribution

When enabled with 3 or more lights, the lights are automatically distributed into bass, mid, and high frequency groups based on their order. Each group reacts to its assigned frequency band's energy independently. Onset events still advance colors for all groups simultaneously.

With fewer than 3 lights, frequency zone mode falls back to normal (all lights react the same).

### Silence degradation

When enabled, the scene gradually transitions to slow palette cycling during silence (over ~5 seconds). When music resumes, it snaps back to audio-reactive mode. This keeps the lights alive and moving instead of freezing during quiet passages or pauses between songs.

Disable this if you prefer lights to hold their last color during silence.

### Beat prediction

Beat predictive mode learns the tempo (BPM) of the music and sends light commands early to compensate for Zigbee transmission latency. This makes the lights appear to change on the beat rather than 200ms after.

- **Prediction aggressiveness** (1-100): Higher values enter predictive mode with less confidence, and tolerate more misses before falling back. Lower values require very steady tempo before predicting.
- **Latency compensation** (0-500ms): How far ahead to send commands. Default 150ms works for most setups.

The mode has a state machine: starts reactive, transitions to tracking when BPM confidence is high, then switches to predictive after enough consecutive matches. Falls back to reactive instantly on missed predictions.

### Color by frequency

When enabled, the spectral centroid (a measure of the spectrum's "center of gravity") maps to palette position. Low centroid values (bass-heavy music, dark timbres) select colors from the start of the palette, while high centroid values (bright timbres, treble-heavy passages) select colors from the end.

This works alongside onset-based color advance — the centroid selects the color region, and onsets trigger changes within that region. The effect is that different instruments and timbres produce different colors naturally.

### Rolloff brightness

When enabled, spectral rolloff (the frequency below which 85% of the spectral energy is concentrated) scales the brightness. Higher rolloff values (brighter, more complex timbres) produce brighter lights, while lower rolloff values (darker, bass-heavy timbres) produce dimmer lights.

The rolloff maps to a 0.5-1.0 brightness multiplier, so lights never go below 50% from this effect alone. This supplements the amplitude-based brightness response with timbral information — a quiet but bright-sounding passage will be brighter than a quiet but dark-sounding one.

---

## Audio-reactive effects

In addition to dynamic scenes, hardware RGB effects on T1M and T1 Strip devices can be modulated by audio data. Audio-reactive effects modulate the effect's **speed** and **brightness** independently based on live audio analysis, rather than replacing the scene's color timing like audio-reactive scenes do.

### Effect audio parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `audio_entity` | entity_id | none | ESPHome audio sensor entity (`binary_sensor` or `sensor`). Setting this enables audio modulation. Only supported on T1M and T1 Strip devices. |
| `audio_sensitivity` | 1-100 | 50 | Beat detection sensitivity on the ESP32 device. |
| `audio_detection_mode` | string | `spectral_flux` | Detection algorithm: `spectral_flux`, `bass_energy`, or `complex_domain`. |
| `audio_silence_behavior` | string | `decay_min` | What happens when music stops: `hold` (keep last values), `decay_min` (fade to minimum), `decay_mid` (fade to midpoint). |
| `audio_speed_mode` | string | `continuous` | How audio drives effect speed (see speed modulation modes below). Set to `null` to disable. |
| `audio_speed_min` | 1-100 | 1 | Minimum speed in the modulation range. |
| `audio_speed_max` | 1-100 | 100 | Maximum speed in the modulation range. |
| `audio_speed_curve` | string | `linear` | How sensor values map to the speed range: `linear`, `logarithmic`, or `exponential`. |
| `audio_brightness_mode` | string | none | How audio drives brightness (see brightness modulation modes below). Omit or set to `null` to disable. |
| `audio_brightness_min` | 1-100% | 1 | Minimum brightness in the modulation range. |
| `audio_brightness_max` | 1-100% | 100 | Maximum brightness in the modulation range. |
| `audio_brightness_curve` | string | `linear` | How sensor values map to the brightness range: `linear`, `logarithmic`, or `exponential`. |

### Speed modulation modes

| Mode | Description |
|---|---|
| **On onset** (`on_onset`) | Speed jumps on each detected musical event. |
| **Continuous** (`continuous`) | Speed maps continuously to audio energy. Default when audio is enabled. |
| **Intensity breathing** (`intensity_breathing`) | Speed follows a slow intensity envelope. |
| **Onset flash** (`onset_flash`) | Speed spikes briefly on each onset then decays. |
| **Off** (`null`) | Speed is not modulated by audio. |

### Brightness modulation modes

Brightness modulation uses the same mode options as speed modulation (On onset, Continuous, Intensity breathing, Onset flash, Off). Brightness modulation is **off by default** — enable it by setting `audio_brightness_mode` to one of the modes above.

### Effect audio from a service call

Call `aqara_advanced_lighting.set_dynamic_effect` with the `audio_entity` parameter to enable audio modulation:

```yaml
service: aqara_advanced_lighting.set_dynamic_effect
target:
  entity_id: light.aqara_ceiling_light
data:
  effect: "breathing"
  speed: 50
  color_1: [255, 0, 0]
  color_2: [0, 0, 255]
  audio_entity: binary_sensor.audio_reactive_audio_sensor
  audio_sensitivity: 60
  audio_detection_mode: spectral_flux
  audio_silence_behavior: decay_min
  audio_speed_mode: continuous
  audio_speed_min: 10
  audio_speed_max: 100
  audio_speed_curve: linear
  audio_brightness_mode: continuous
  audio_brightness_min: 20
  audio_brightness_max: 100
  audio_brightness_curve: logarithmic
```

**Note:** Audio-reactive effects are not available for T2 bulbs. T2 devices do not support the required MQTT attributes for audio modulation.

---

## How audio detection works

The `esphome-audio-reactive` component performs on-device audio analysis using a dedicated FreeRTOS processing task:

1. Audio is captured at the device's configured sample rate (22,050 Hz for ATOM Echo, 44,100 Hz for S3R and Waveshare)
2. A ring buffer feeds samples to the FFT task running on ESP32 core 0
3. Configurable FFT window (256 or 512 samples; default 512) with 75% overlap produces frequency magnitudes
4. 16 frequency bands are computed with pink noise correction
5. Spectral descriptors are computed: centroid (spectral brightness) and rolloff (energy concentration)
6. Adaptive spectral whitening is applied for onset detection
7. Three onset detection modes: spectral flux (all-band), bass energy (bass-focused), and complex domain (phase+magnitude)
8. Autocorrelation beat tracker estimates BPM with confidence scoring and beat phase tracking
9. PI-controller automatic gain control normalizes values to 0-1 range
10. Dynamics limiter and asymmetric smoothing produce clean, stable sensor output

The device publishes the following sensors to Home Assistant:

| Sensor | Type | Description |
|---|---|---|
| Audio Sensor | binary_sensor | Onset detection — pulses on each detected musical event |
| Bass Energy | sensor (0-1) | Smoothed low-frequency energy |
| Mid Energy | sensor (0-1) | Smoothed mid-frequency energy |
| High Energy | sensor (0-1) | Smoothed high-frequency energy |
| Amplitude | sensor (0-1) | Overall smoothed amplitude |
| BPM | sensor | Estimated beats per minute |
| Beat Confidence | sensor (0-1) | How confident the BPM estimate is |
| Beat Phase | sensor (0-1) | Position in current beat cycle (0 = on beat, approaches 1.0 before next) |
| Spectral Centroid | sensor (0-1) | Spectral "brightness" — weighted average frequency |
| Spectral Rolloff | sensor (0-1) | Frequency below which 85% of energy is concentrated |
| Onset Strength | sensor (0-1) | Magnitude of the most recent onset |
| Silence | binary_sensor | On when room is quiet (noise gate active) |

You select the `Audio Sensor` binary sensor as your `audio_entity`. The integration automatically discovers all companion sensors on the same device by looking up sibling entities in the HA device registry. No manual configuration is needed beyond selecting the binary sensor.

---

## T1 Strip on-device audio sync

The Aqara T1 Strip (`lumi.light.acn132`) has a built-in microphone and firmware-level music sync mode. When you start an audio-reactive dynamic scene that includes a T1 Strip, the integration automatically routes it to on-device audio sync instead of the software-driven engine.

**What happens:**

1. The integration detects T1 Strip entities in the scene's entity list
2. T1 Strip entities are routed to the hardware `set_music_sync` service
3. All other lights in the scene use the software audio engine as normal
4. Both groups react to audio simultaneously, but independently

**Parameter mapping:**

| Scene parameter | T1 Strip equivalent |
|---|---|
| `audio_sensitivity` 1-50 | Low sensitivity |
| `audio_sensitivity` 51-100 | High sensitivity |
| Color cycle / Beat predictive / Brightness flash | "blink" effect |
| Continuous / Intensity breathing | "wave" effect |

**Things to be aware of:**

- The T1 Strip uses its own built-in microphone, while software-driven lights react to the external ESPHome sensor. They may not be perfectly in sync.
- The T1 Strip's built-in effects (random, blink, rainbow, wave) do not use your scene's color palette. The palette only applies to software-driven lights.
- The `audio_brightness_curve` and `audio_transition_speed` parameters are not supported by the T1 Strip hardware and are ignored for on-device entities.

---

## On-device audio for other lights

Lights with native audio-reactive modes (beyond the T1 Strip) can be configured to use their built-in capabilities alongside software-driven lights:

1. Open the **Aqara Advanced Lighting** panel and go to **Config**
2. Under **On-device audio mode**, select the light entity
3. Enter the service call to activate and deactivate the device's native audio mode
4. When the light is part of an audio-reactive scene, the integration activates native mode instead of driving it via software

---

## Sharing a sensor between scenes and effects

You can run an audio-reactive dynamic scene and an audio-reactive effect simultaneously using the same ESP32 sensor. The scene drives color transitions on software-controlled lights while the effect modulator adjusts speed and brightness on Aqara hardware effects — they control different aspects of your lights and work independently.

**ESP32 configuration:** Each feature can specify its own detection mode and sensitivity. However, the ESP32 device has a single DSP pipeline, so it can only run one detection mode and one sensitivity at a time. When both are active, the **most recently activated** feature's settings take effect on the device. The other feature continues to operate but receives audio data processed with the newer settings.

For the most predictable experience, use the same detection mode and sensitivity for both your scene presets and effect audio overrides when you plan to run them simultaneously.

---

## Sensor placement tips

The quality of the audio-reactive experience depends heavily on where you place the microphone sensor.

- **Close to the speaker.** Place the device within 1 meter of your speaker or sound source. Further away, the signal-to-noise ratio drops and detection becomes unreliable.
- **Away from noise sources.** Keep it away from air conditioning vents, fans, and windows where ambient noise could interfere.
- **Stable surface.** Vibrations from a subwoofer or rattling shelf can cause false triggers. Place the device on a stable, vibration-dampened surface.
- **Line of sight.** Avoid placing the device inside a cabinet or behind furniture where the sound is muffled.
- **Calibrate after placement.** After placing the device, run the quiet room and music calibrations to adapt to your specific environment.

---

## Troubleshooting

### Sensor values stay at 0.0 or 1.0

- Run the **Calibrate Quiet Room** and **Calibrate Music Level** calibrations (see above)
- If values are stuck at 1.0, the device needs music calibration to learn the signal scale
- If values are stuck at 0.0, try lowering the squelch value or re-running quiet room calibration in a quieter environment

### Phantom beats in quiet rooms

- Run the **Calibrate Quiet Room** calibration to set the noise floor
- The silence detector gates output when mid+high frequency energy is below the calibrated threshold
- Increase the squelch value if phantom beats persist

### Lights don't react to audio

- Verify the Audio Sensor binary sensor entity is updating in HA (check the entity history)
- Make sure you selected the correct binary sensor entity in the `audio_entity` field
- Try increasing `audio_sensitivity` (higher values react to quieter sounds)
- Check the active scene controls in the panel for any warnings

### Classical or non-rhythmic music doesn't trigger onsets

- Make sure **Detection mode** is set to **Spectral flux** (the default). This detects any musical event, not just bass beats.
- Bass energy mode only works well with rhythmic music that has prominent bass

### Beats are detected too frequently (flickering)

- Lower the `audio_sensitivity` value (try 30-40)
- Try switching to **Continuous** or **Intensity breathing** mode for a smoother experience
- The minimum onset interval of 150ms prevents the fastest flicker, but high sensitivity with loud music can still feel chaotic

### "Audio sensor unavailable" warning

- The binary sensor entity went offline or reported an unavailable state
- Check that the ESPHome device is powered and connected
- Check the **Microphone Mute** switch is not enabled
- The scene will wait up to 60 seconds for the sensor to recover, then stop automatically

### Latency feels too high

Audio-reactive latency depends on the full chain: microphone capture, ESPHome processing, network transport to HA, event propagation, integration processing, and the Zigbee command to the light.

| Step | Typical time |
|---|---|
| Audio capture and FFT analysis | ~5ms |
| ESPHome to Home Assistant | ~20-50ms |
| Integration processing | ~1ms |
| Zigbee command to light | ~50-200ms |
| **Total** | **~80-260ms** |

To minimize latency:

- Use **Beat predictive** mode to send commands early based on learned tempo
- Adjust the **Latency compensation** parameter (default 150ms) to match your setup
- Use `audio_transition_speed: 100` for instant color snaps (no fade)
- Place the Zigbee coordinator close to the lights to reduce Zigbee hop latency
