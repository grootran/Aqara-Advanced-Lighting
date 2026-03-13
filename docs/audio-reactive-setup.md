# Audio-reactive lighting setup

[Back to README](../README.md) | [Services](services.md) | [Frontend panel](frontend-panel.md)

Audio-reactive mode makes your lights respond to music and sound in real time. Colors advance on beats, brightness pulses with volume, and the palette flows with the music. This guide covers the hardware you need, how to set it up, and how to use it with the integration.

## Table of contents

- [How it works](#how-it-works)
- [Recommended hardware](#recommended-hardware)
- [Setting up the sensor](#setting-up-the-sensor)
  - [One-click install (recommended)](#one-click-install-recommended)
  - [Manual ESPHome setup](#manual-esphome-setup)
- [Verifying in Home Assistant](#verifying-in-home-assistant)
- [Using audio-reactive mode](#using-audio-reactive-mode)
  - [From the frontend panel](#from-the-frontend-panel)
  - [From a service call](#from-a-service-call)
  - [Audio parameters](#audio-parameters)
  - [Sensitivity](#sensitivity)
  - [Color advance mode](#color-advance-mode)
  - [Transition speed](#transition-speed)
  - [Brightness response](#brightness-response)
- [How audio detection works](#how-audio-detection-works)
- [T1 Strip on-device audio sync](#t1-strip-on-device-audio-sync)
- [On-device audio for other lights](#on-device-audio-for-other-lights)
- [Sensor placement tips](#sensor-placement-tips)
- [Troubleshooting](#troubleshooting)

---

## How it works

Audio-reactive mode replaces the fixed timing of a dynamic scene (transition time, hold time) with live audio data from an ESPHome device running the `esphome-audio-reactive` component. The component performs on-device FFT analysis and exposes beat detection and frequency band data to Home Assistant. The integration uses these to:

- **Detect beats** and advance colors on each beat
- **Modulate brightness** so lights pulse louder with the music
- **Map amplitude to palette position** for a continuous color flow that tracks the sound

You need an ESP32 device with a microphone running ESPHome and the `esphome-audio-reactive` component. The device sits near your speaker and streams beat detection and audio analysis data to Home Assistant over your local network.

---

## Recommended hardware

You need an ESP32 device with a microphone. Two options are listed below:

### M5Stack ATOM Echo

The best starting point for most users.

| | |
|---|---|
| **Price** | ~$13 |
| **Chipset** | ESP32-PICO-D4 |
| **Microphone** | Built-in PDM |
| **Power** | USB-C |
| **Size** | 24 x 24 x 17mm |
| **Where to buy** | [M5Stack store](https://shop.m5stack.com/products/atom-echo-smart-speaker-dev-kit), Amazon, AliExpress |

The ATOM Echo is tiny enough to sit on a shelf near your speaker without being noticed. It is the primary tested device for this feature and supports the one-click installer.

### M5StickC Plus2

A compact development kit with a built-in screen, battery, and PDM microphone.

| | |
|---|---|
| **Price** | ~$20 |
| **Chipset** | ESP32-PICO-V3-02 |
| **Microphone** | Built-in SPM1423 PDM |
| **Power** | USB-C, built-in battery |
| **Size** | 54 x 25 x 16mm |
| **Where to buy** | [M5Stack store](https://shop.m5stack.com/products/m5stickc-plus2-esp32-mini-iot-development-kit), Amazon, AliExpress |

The Plus2 includes a 1.14" display and 200mAh battery, but for audio sensing the key component is the SPM1423 PDM microphone. The display and battery are not used by this feature.

---

## Setting up the sensor

The [`esphome-audio-reactive`](https://github.com/absent42/esphome-audio-reactive) component runs on your ESP32 and performs on-device FFT analysis, beat detection, and frequency band energy measurement. It exposes a `binary_sensor.beat_detected` entity (the audio trigger for dynamic scenes) and companion sensors for bass energy, mid energy, high energy, amplitude, and BPM.

### One-click install (recommended)

The fastest way to get started -- no ESPHome knowledge required.

1. Visit **[absent42.github.io/esphome-audio-reactive](https://absent42.github.io/esphome-audio-reactive/)**
2. Connect your ESP32 device via USB (requires Chrome or Edge browser)
3. Click **Install** and follow the prompts
4. After flashing, connect to the "audio-reactive" WiFi hotspot to configure your network credentials
5. The device will appear in Home Assistant automatically

The one-click installer currently supports the **M5Stack ATOM Echo**. For other devices, use the manual ESPHome setup below.

### Manual ESPHome setup

If you prefer to compile yourself, need a custom configuration, or are using a device other than the ATOM Echo, you can add the `esphome-audio-reactive` external component to any ESPHome configuration.

**Prerequisites:**

- [ESPHome](https://esphome.io/guides/getting_started_command_line/) installed (via pip, Docker, or your preferred method)
- A USB data cable for first-time device flash (not a charge-only cable)

Add the external component source and the `audio_reactive` platform to your device's ESPHome YAML. The per-device configurations below provide complete, ready-to-flash examples. You also need the ESPHome integration in Home Assistant (**Settings > Devices & services > ESPHome**) to receive sensor data from the device.

### A note about secrets

The YAML configurations below use `!secret` tags to keep sensitive values (Wi-Fi password, API key) out of the configuration file. These values are stored in a separate `secrets.yaml` file in the same directory as your ESPHome configurations. It looks like this:

```yaml
wifi_ssid: "YourNetworkName"
wifi_password: "YourWiFiPassword"
api_encryption_key: "a-base64-encoded-key"
```

For more details, see the [ESPHome YAML guide](https://esphome.io/guides/yaml/).

### M5Stack ATOM Echo configuration

Create a new YAML file (for example, `audio-reactive.yaml`) with this complete configuration:

```yaml
esphome:
  name: audio-reactive
  friendly_name: Audio Reactive Sensor

esp32:
  board: m5stack-atom
  framework:
    type: arduino

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

api:
  encryption:
    key: !secret api_encryption_key

logger:

external_components:
  - source: github://absent42/esphome-audio-reactive
    components: [audio_reactive]

i2s_audio:
  i2s_lrclk_pin: GPIO33
  i2s_bclk_pin: GPIO19

microphone:
  - platform: i2s_audio
    id: mic
    adc_type: external
    pdm: true
    i2s_din_pin: GPIO23
    sample_rate: 16000
    bits_per_sample: 16bit

audio_reactive:
  id: audio_analysis
  microphone: mic
  update_interval: 50ms
  beat_sensitivity: 50

sensor:
  - platform: audio_reactive
    audio_reactive_id: audio_analysis
    bass_energy:
      name: "Bass Energy"
    mid_energy:
      name: "Mid Energy"
    high_energy:
      name: "High Energy"
    amplitude:
      name: "Amplitude"
    bpm:
      name: "BPM"

binary_sensor:
  - platform: audio_reactive
    audio_reactive_id: audio_analysis
    beat_detected:
      name: "Beat Detected"

number:
  - platform: audio_reactive
    audio_reactive_id: audio_analysis
    beat_sensitivity:
      name: "Beat Sensitivity"
```

> **Note:** The pre-built web installer firmware uses the `esp-idf` framework. The `arduino` framework shown above also works for manual builds.

This creates the following entities:
- `binary_sensor.audio_reactive_beat_detected` -- pulses on when a beat is detected (use this as your `audio_entity`)
- `sensor.audio_reactive_bass_energy` -- normalized bass band energy (0-1)
- `sensor.audio_reactive_mid_energy` -- normalized mid band energy (0-1)
- `sensor.audio_reactive_high_energy` -- normalized high band energy (0-1)
- `sensor.audio_reactive_amplitude` -- overall normalized amplitude (0-1)
- `sensor.audio_reactive_bpm` -- estimated beats per minute
- `number.audio_reactive_beat_sensitivity` -- adjustable beat detection sensitivity (1-100, set automatically by integration)

### M5StickC Plus2 configuration

Replace the generated YAML with this complete configuration:

```yaml
esphome:
  name: audio-reactive
  friendly_name: Audio Reactive Sensor

esp32:
  board: m5stick-c
  framework:
    type: arduino

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

api:
  encryption:
    key: !secret api_encryption_key

logger:

external_components:
  - source: github://absent42/esphome-audio-reactive
    components: [audio_reactive]

i2s_audio:
  - id: i2s_mic
    i2s_lrclk_pin: GPIO0
    i2s_bclk_pin: GPIO26

microphone:
  - platform: i2s_audio
    id: mic
    i2s_audio_id: i2s_mic
    adc_type: external
    pdm: true
    i2s_din_pin: GPIO34
    sample_rate: 16000
    bits_per_sample: 16bit
    channel: left

audio_reactive:
  id: audio_analysis
  microphone: mic
  update_interval: 50ms
  beat_sensitivity: 50

sensor:
  - platform: audio_reactive
    audio_reactive_id: audio_analysis
    bass_energy:
      name: "Bass Energy"
    mid_energy:
      name: "Mid Energy"
    high_energy:
      name: "High Energy"
    amplitude:
      name: "Amplitude"
    bpm:
      name: "BPM"

binary_sensor:
  - platform: audio_reactive
    audio_reactive_id: audio_analysis
    beat_detected:
      name: "Beat Detected"

number:
  - platform: audio_reactive
    audio_reactive_id: audio_analysis
    beat_sensitivity:
      name: "Beat Sensitivity"
```

The SPM1423 is a PDM microphone with the clock on GPIO0 and data on GPIO34. PDM mode does not use the BCLK pin, but ESPHome requires one to be assigned -- GPIO26 is an available external pin on the Plus2 that serves as a placeholder here.

### Flashing the device

**First-time flash (USB required):**

Make sure you are using a USB data cable, not a charge-only cable (a common issue).

```bash
esphome run audio-reactive.yaml
```

Select the serial port when prompted. The firmware will compile, flash, and the device will reboot and connect to your Wi-Fi.

**Subsequent updates (over-the-air):**

Once a device has been flashed and is connected to your network, subsequent updates can be done wirelessly. Run the same command and ESPHome will detect the device on the network automatically.

---

## Verifying in Home Assistant

After flashing (via one-click install or manual ESPHome setup), the device should auto-discover in Home Assistant within a minute.

1. Go to **Settings > Devices & services**
2. The ESPHome device should appear as a new integration or under your existing ESPHome integration
3. Click **Configure** if prompted
4. Go to **Settings > Devices & services > Entities** and search for "beat detected" or "bass energy"
5. You should see a binary sensor (`Beat Detected`) and five sensors (`Bass Energy`, `Mid Energy`, `High Energy`, `Amplitude`, `BPM`)

### Testing the sensor

1. Open the `Beat Detected` binary sensor entity in the HA UI
2. Play music near the device
3. You should see the binary sensor pulse on/off with beats in the music
4. Check the `Bass Energy` and `Amplitude` sensors -- they should fluctuate in real time
5. The `BPM` sensor should settle on an approximate tempo after a few seconds of music
6. If the values stay flat, check that the device is near enough to the sound source and that the microphone is not obstructed

---

## Using audio-reactive mode

Audio-reactive mode works with any dynamic scene. You enable it by selecting an audio sensor entity, which replaces the fixed transition and hold timing with live audio-driven updates.

### From the frontend panel

1. Open the **Aqara Advanced Lighting** panel in Home Assistant
2. Create or edit a dynamic scene preset with the colors you want
3. Expand the **Audio reactive** section in the editor
4. Toggle **Enable audio** on
5. Select your beat detection binary sensor entity (for example, `binary_sensor.audio_reactive_beat_detected`)
6. Adjust sensitivity, color advance mode, transition speed, and brightness response to taste
7. Save the preset

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
  audio_entity: binary_sensor.audio_reactive_beat_detected
  audio_sensitivity: 60
  audio_color_advance: on_beat
  audio_transition_speed: 70
  audio_brightness_response: true
```

When `audio_entity` is set, the `transition_time` and `hold_time` values are ignored. Color changes are driven entirely by the audio data.

### Audio parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `audio_entity` | entity_id | none | Beat detection binary sensor from the `esphome-audio-reactive` component. Setting this enables audio mode. |
| `audio_sensitivity` | 1-100 | 50 | How responsive beat detection is to sound. Higher values detect quieter beats. |
| `audio_color_advance` | `on_beat` or `continuous` | `on_beat` | How colors advance through the palette (see below). |
| `audio_transition_speed` | 1-100 | 50 | How fast colors fade between changes. Higher values = faster transitions. |
| `audio_brightness_response` | boolean | true | When enabled, brightness pulses with the music's volume. |

### Sensitivity

Sensitivity controls how easily the ESPHome device detects a beat. The value (1-100) is sent directly to the device's beat detection algorithm, where it sets the threshold for distinguishing beats from background noise.

- **Low values (1-30):** Only strong, prominent beats trigger a color change. Good for loud environments or when you want a calmer, less frequent response.
- **Mid values (40-60):** A balanced default. Reacts to clear beats in most music.
- **High values (70-100):** Reacts to subtle sounds. Good for quiet listening or ambient music with soft dynamics. Can feel chaotic with loud, bass-heavy music.

**Runtime adjustment:** When an audio scene is running, a sensitivity slider appears on the active operation card in the frontend panel. Drag the slider to adjust sensitivity in real time without stopping the scene. The new value is sent to the ESPHome device immediately, so you can tune the responsiveness to match what you're listening to. The slider changes the running scene's sensitivity only -- it does not modify the saved preset.

**How it works internally:** The sensitivity value maps to a threshold multiplier on the ESPHome device. The beat detector compares each audio frame's bass energy against a rolling average, multiplied by this threshold. Higher sensitivity lowers the threshold, making it easier for a frame to be classified as a beat. Changing the sensitivity at runtime resets the beat interval tracking (so BPM re-calibrates) but preserves the energy calibration window, so the device adjusts immediately without a warmup period.

### Color advance mode

Color advance mode determines how your scene's color palette responds to audio. The two modes produce very different visual effects and are suited to different situations.

**on_beat** (default)

Each time the device detects a beat, the lights advance to the next color in the palette. The pattern cycles through your colors in order, one beat at a time. This produces a rhythmic, punchy look that follows the tempo of the music.

Best for:
- Music with a clear, steady beat (pop, electronic, rock, hip-hop)
- Palettes with high contrast between colors (the color jump is the visual effect)
- Party or active listening situations where you want the lights to "hit" with the music

**continuous**

Instead of waiting for beats, the lights subscribe to the amplitude sensor and continuously map the current energy level to a position in the palette. Silence or very quiet sounds show the first color, loud sounds show the last color, and everything in between blends through the middle of the palette. Color updates arrive approximately 20 times per second, rate-limited by the transition speed to avoid flooding your lights.

Best for:
- Ambient, classical, or jazz music where beats are not prominent
- Palettes with smooth gradients between adjacent colors (the energy flow is the visual effect)
- Background or relaxation settings where a gentle color flow feels more natural than sharp color jumps

**Tip:** The number of colors in your palette matters. With 2-3 colors, on_beat gives dramatic jumps and continuous gives a simple low-to-high sweep. With 6-8 colors, on_beat cycles through a wider variety and continuous can paint a richer gradient across the energy range.

### Transition speed

Transition speed (1-100) controls how fast the lights fade from one color to the next after a beat or energy change. It maps to a transition duration:

- **1** (slowest): 2-second fade. Colors blend gradually. Gives a soft, dreamy quality.
- **50** (default): ~1-second fade. A balanced middle ground.
- **100** (fastest): 0.1-second snap. Colors change almost instantly. Gives a sharp, punchy look.

In **on_beat** mode, the transition speed determines how quickly the light reaches the new color after each beat. Slow transitions can create an interesting effect where the light is still fading to one color when the next beat arrives, producing overlapping blends. Fast transitions give each beat a distinct, crisp color change.

In **continuous** mode, the transition speed also sets the minimum interval between color updates (the rate limit). At speed 100, color updates can happen as fast as every 100ms. At speed 1, updates are throttled to every 2 seconds. This prevents the lights from being overwhelmed with rapid commands while still allowing smooth tracking at higher speeds.

### Brightness response

When brightness response is enabled, the lights' brightness pulses with the volume of the music. Louder passages increase brightness, quieter passages dim. The modulation range is clamped between 30% and 100% of the scene's configured brightness, so lights never go completely dark.

- In **on_beat** mode, the brightness is read from the amplitude (or bass energy) companion sensor at the moment each beat is detected. This means brightness changes once per beat, giving a "pumping" effect synchronized with the rhythm.
- In **continuous** mode, the brightness updates on every energy event (~20 times per second), giving a smooth, real-time volume meter effect where the lights breathe with the music's dynamics.

Disable brightness response if you want a consistent brightness level regardless of volume, or if the pulsing effect is distracting for your use case.

---

## How audio detection works

The `esphome-audio-reactive` component performs on-device FFT analysis and exposes a set of entities to Home Assistant:

- `binary_sensor.beat_detected` -- pulses on when a beat is detected
- `sensor.bass_energy` -- normalized bass band energy (0.0 to 1.0)
- `sensor.mid_energy` -- normalized mid band energy
- `sensor.high_energy` -- normalized high band energy
- `sensor.amplitude` -- overall normalized amplitude
- `sensor.bpm` -- estimated BPM

You select the beat detection binary sensor as your `audio_entity`. The integration automatically discovers the companion sensors on the same device by looking up sibling entities in the HA device registry. No manual configuration is needed beyond selecting the binary sensor.

**Why on-device FFT?** Running FFT analysis on the ESP32 means beat detection is frequency-aware -- it reacts to bass hits, not door slams. The pre-calculated beat timing avoids HA-side threshold computation, and the companion sensors provide richer data for brightness modulation and continuous color advance mode. The estimated BPM is displayed in the active operation card in the frontend.

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
| `audio_color_advance` "on_beat" | "blink" effect |
| `audio_color_advance` "continuous" | "wave" effect |

**Things to be aware of:**

- The T1 Strip uses its own built-in microphone, while software-driven lights react to the external ESPHome sensor. They may not be perfectly in sync.
- The T1 Strip's built-in effects (random, blink, rainbow, wave) do not use your scene's color palette. The palette only applies to software-driven lights.
- The `audio_brightness_response` and `audio_transition_speed` parameters are not supported by the T1 Strip hardware and are ignored for on-device entities.

---

## On-device audio for other lights

Lights with native audio-reactive modes (beyond the T1 Strip) can be configured to use their built-in capabilities alongside software-driven lights:

1. Open the **Aqara Advanced Lighting** panel and go to **Global Preferences**
2. Under **On-device audio mode**, select the light entity
3. Enter the service call to activate and deactivate the device's native audio mode
4. When the light is part of an audio-reactive scene, the integration activates native mode instead of driving it via software

---

## Sensor placement tips

The quality of the audio-reactive experience depends heavily on where you place the microphone sensor.

- **Close to the speaker.** Place the device within 1 meter of your speaker or sound source. Further away, the signal-to-noise ratio drops and beat detection becomes unreliable.
- **Away from noise sources.** Keep it away from air conditioning vents, fans, and windows where ambient noise could interfere.
- **Stable surface.** Vibrations from a subwoofer or rattling shelf can cause false triggers. Place the device on a stable, vibration-dampened surface.
- **Line of sight.** Avoid placing the device inside a cabinet or behind furniture where the sound is muffled.
- **Test with your music.** After placing the device, play your typical music and check the sensor values in HA. The `Beat Detected` binary sensor should pulse clearly on beats, and `Bass Energy` should show a visible difference between loud and quiet passages.

---

## Troubleshooting

### Sensor values stay flat or don't change

- Check that the ESPHome device is powered and connected to Wi-Fi
- Verify the microphone pin configuration matches your device
- Try moving the device closer to the sound source
- Check the ESPHome logs for errors related to `audio_reactive` or `i2s_audio`

### Lights don't react to audio

- Verify the binary sensor entity is updating in HA (check the entity history)
- Make sure you selected the correct `binary_sensor.*` entity in the `audio_entity` field
- Try increasing `audio_sensitivity` (higher values react to quieter sounds)
- Check the active operation card in the panel for the audio indicator and any warnings

### Beats are detected too frequently (flickering)

- Lower the `audio_sensitivity` value (try 30-40)
- The minimum beat interval of 150ms prevents the fastest flicker, but high sensitivity with loud music can still feel chaotic
- Try switching to `continuous` color advance mode for a smoother experience

### Beats are not detected (lights stay static)

- Increase `audio_sensitivity` (try 70-80)
- Make sure the music has clear dynamic range. Heavily compressed or ambient tracks may not produce enough variation for beat detection
- Verify you are using the `binary_sensor.beat_detected` entity from the `esphome-audio-reactive` component

### "Audio sensor unavailable" warning

- The binary sensor entity went offline or reported an unavailable state
- Check that the ESPHome device is powered and connected
- The scene will wait up to 60 seconds for the sensor to recover, then stop automatically

### T1 Strip not reacting to audio

- The T1 Strip uses its own built-in microphone, not the external ESPHome sensor
- Make sure the T1 Strip can hear the music (its mic is on the device itself)
- Verify that `set_music_sync` works independently by calling it directly from Developer Tools

### Latency feels too high

Audio-reactive latency depends on the full chain: microphone capture, ESPHome processing, network transport to HA, event propagation, integration processing, and the Zigbee command to the light.

| Step | Typical time |
|---|---|
| Audio capture and FFT analysis | ~50ms |
| ESPHome to Home Assistant | ~50-100ms |
| Integration processing | ~5-10ms |
| Zigbee command to light | ~50-200ms |
| **Total** | **~150-360ms** |

This latency is inherent to the architecture. To minimize it:

- Use a wired Ethernet connection for the ESPHome device if possible
- Place the Zigbee coordinator close to the lights to reduce Zigbee hop latency
- Use `audio_transition_speed: 100` for instant color snaps (no fade)
