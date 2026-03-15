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
- [How audio detection works](#how-audio-detection-works)
- [T1 Strip on-device audio sync](#t1-strip-on-device-audio-sync)
- [On-device audio for other lights](#on-device-audio-for-other-lights)
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

You need an ESP32 device with a microphone running ESPHome and the [esphome-audio-reactive](https://github.com/absent42/esphome-audio-reactive) component. The device sits near your speaker and streams audio analysis data to Home Assistant over your local network.

---

## Recommended hardware

You need an ESP32 device with a microphone. Four options are listed below:

### M5Stack ATOM Echo

The best starting point for most users, readily available.

![M5Stack ATOM Echo](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/dev/images/atom-echo.jpg)

| | |
|---|---|
| **Price** | ~$13 |
| **Chipset** | ESP32-PICO-D4 |
| **Microphone** | Built-in SPM1423 PDM |
| **Power** | USB-C |
| **Size** | 24 x 24 x 17mm |
| **Where to buy** | [M5Stack store](https://shop.m5stack.com/products/atom-echo-smart-speaker-dev-kit), [Pi Hut](https://thepihut.com/products/atom-echo-smart-speaker-dev-kit), [Amazon US](https://amzn.to/4dnA7GH), [Amazon UK](https://amzn.to/4bdYJQM) |

### M5Stack ATOM Echo S3R

Higher-quality audio with an ES8311 codec and speaker feedback for on-device status tones.

![M5Stack ATOM Echo S3R](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/dev/images/atom-echo-s3r.jpg)

| | |
|---|---|
| **Price** | ~$15 |
| **Chipset** | ESP32-S3 |
| **Microphone** | MEMS via ES8311 ADC (I2S, 44.1kHz) |
| **Audio codec** | ES8311 (mic ADC + speaker DAC) |
| **Feedback** | Speaker tones (no LED) |
| **Power** | USB-C |
| **Where to buy** | [M5Stack store](https://shop.m5stack.com/products/atom-echo-s3r), [Pi Hut](https://thepihut.com/products/atom-echos3r-smart-speaker-dev-kit) |

### Waveshare ESP32-S3 Audio Board

Feature-rich board with dual MEMS microphones, 7-LED ring, and optional battery power.

![Waveshare ESP32-S3](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/dev/images/waveshare-esp32-s3.jpg)

| | |
|---|---|
| **Price** | ~$16 |
| **Chipset** | ESP32-S3R8 (8MB PSRAM) |
| **Microphone** | Dual MEMS via ES7210 ADC (I2S, 44.1kHz) |
| **Audio codec** | ES7210 (mic) + ES8311 (speaker) |
| **Feedback** | 7x WS2812 LED ring |
| **Power** | USB-C, optional battery |
| **Where to buy** | [Waveshare store](https://www.waveshare.com/esp32-s3-audio-board.htm), [Amazon US](https://amzn.to/4lqAoKU), [Amazon UK](https://amzn.to/414SkRU) |

### M5StickC Plus2

A compact development kit with a built-in screen, battery, and PDM microphone.

![M5StickC Plus2](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/dev/images/m5stack-stick2.jpg)

| | |
|---|---|
| **Price** | ~$20 |
| **Chipset** | ESP32-PICO-V3-02 |
| **Microphone** | Built-in SPM1423 PDM |
| **Power** | USB-C, built-in battery |
| **Size** | 54 x 25 x 16mm |
| **Where to buy** | [M5Stack store](https://shop.m5stack.com/products/m5stickc-plus2-esp32-mini-iot-development-kit), [Pi Hut](https://thepihut.com/products/m5stickc-plus2-esp32-mini-iot-development-kit), [Amazon US](https://amzn.to/470ydYE), [Amazon UK](https://amzn.to/4brZ0i4) |

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

**ATOM Echo / ATOM Echo S3R / M5StickC Plus2** — single button, click pattern:

| Action | ATOM Echo | ATOM Echo S3R | M5StickC Plus2 |
|--------|-----------|---------------|----------------|
| **Double click** | Calibrate quiet (green LED) | Calibrate quiet (speaker tone) | Calibrate quiet (red LED) |
| **Triple click** | Calibrate music (blue LED) | Calibrate music (speaker tone) | Calibrate music (red LED) |
| **Long press (1s+)** | Toggle mute (red LED) | Toggle mute (speaker tone) | Toggle mute (red LED) |

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

### From the frontend panel

1. Open the **Aqara Advanced Lighting** panel in Home Assistant
2. Create or edit a dynamic scene preset with the colors you want
3. Expand the **Audio reactive** section in the editor
4. Toggle **Enable audio** on
5. Select your audio sensor entity (for example, `binary_sensor.audio_reactive_audio_sensor`)
6. Choose a **color advance mode** and **detection mode**
7. Adjust sensitivity, transition speed, and other parameters to taste
8. Save the preset

When activating a preset, you can also override audio settings at activation time without changing the saved preset:

1. Select a dynamic scene preset to activate
2. In the activation overrides section, toggle **Audio reactive** on
3. Select the audio entity and adjust parameters
4. Click activate -- the scene will run with your audio overrides

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
  audio_brightness_response: true
  audio_frequency_zone: false
  audio_silence_degradation: true
```

When `audio_entity` is set, the `transition_time` and `hold_time` values are ignored. Color changes are driven entirely by the audio data.

### Audio parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `audio_entity` | entity_id | none | Audio sensor binary sensor from the `esphome-audio-reactive` component. Setting this enables audio mode. |
| `audio_sensitivity` | 1-100 | 50 | How responsive onset detection is to sound. Higher values detect quieter events. |
| `audio_color_advance` | string | `on_onset` | How colors advance through the palette (see color advance modes below). |
| `audio_detection_mode` | string | `spectral_flux` | Detection algorithm: `spectral_flux` (all genres) or `bass_energy` (rhythmic music). |
| `audio_transition_speed` | 1-100 | 50 | How fast colors fade between changes. Higher = faster. |
| `audio_brightness_response` | boolean | true | When enabled, brightness pulses with the music's volume. |
| `audio_frequency_zone` | boolean | false | Auto-distribute lights across bass/mid/high frequency bands. Requires 3+ lights. |
| `audio_silence_degradation` | boolean | true | Gradually transition to slow palette cycling during silence. |
| `audio_prediction_aggressiveness` | 1-100 | 50 | How aggressively to predict beats (beat_predictive mode only). |
| `audio_latency_compensation_ms` | 0-500 | 150 | Milliseconds to send commands early to compensate for Zigbee latency (beat_predictive mode only). |

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

---

## How audio detection works

The `esphome-audio-reactive` component performs on-device audio analysis using a dedicated FreeRTOS processing task:

1. Audio is captured at the device's configured sample rate (22,050 Hz for ATOM Echo, 44,100 Hz for S3R and Waveshare)
2. A ring buffer feeds samples to the FFT task running on ESP32 core 0
3. Configurable FFT window (256, 512, or 1024 samples; default 512) with 75% overlap produces frequency magnitudes
4. 16 frequency bands are computed with pink noise correction
5. PI-controller automatic gain control normalizes values to 0-1 range
6. Spectral flux onset detection identifies musical events across all bands
7. Dynamics limiter and asymmetric smoothing produce clean, stable sensor output

You select the `Audio Sensor` binary sensor as your `audio_entity`. The integration automatically discovers the companion sensors (energy bands, BPM, silence, sensitivity, squelch, detection mode) on the same device by looking up sibling entities in the HA device registry. No manual configuration is needed beyond selecting the binary sensor.

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
- The `audio_brightness_response` and `audio_transition_speed` parameters are not supported by the T1 Strip hardware and are ignored for on-device entities.

---

## On-device audio for other lights

Lights with native audio-reactive modes (beyond the T1 Strip) can be configured to use their built-in capabilities alongside software-driven lights:

1. Open the **Aqara Advanced Lighting** panel and go to **Config**
2. Under **On-device audio mode**, select the light entity
3. Enter the service call to activate and deactivate the device's native audio mode
4. When the light is part of an audio-reactive scene, the integration activates native mode instead of driving it via software

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
