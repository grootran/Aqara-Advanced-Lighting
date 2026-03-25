# Frontend panel

[Back to README](../README.md) | [Visual editors](visual-editors.md) | [Device configuration](device-configuration.md)

The Aqara Lighting panel is accessible from the Home Assistant sidebar and provides a visual interface for controlling your lights and managing presets.

![Aqara Advanced Lighting Frontend UI](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/activate.png "Aqara Advanced Lighting Frontend UI")

![Aqara Advanced Lighting Sidebar](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/sidebar.png "Aqara Advanced Lighting Sidebar")

## Favorite lights

Save your frequently used lights and light groups as favorites for quick access:

- Click the star icon next to any light to add it to favorites
- Favorite lights appear at the top of the panel
- Control tiles show current state and brightness
- Toggle lights on/off directly from the panel
- Adjust brightness with the slider

## Light selection

Control which lights appear in the entity selector:

- **Include non-Aqara lights toggle** -- Expand light selection beyond Aqara devices
  - When enabled, shows all Home Assistant light entities
  - Dynamic scenes work with any RGB light (LIFX, Philips Hue, generic RGB bulbs, etc.)
  - CCT sequences work with any CCT-capable light
  - Effects, segment patterns, and segment sequences remain Aqara-only
  - Useful for creating ambient scenes across your entire home lighting setup

## Active presets

Monitor and control all currently running effects, sequences, and scenes from a single view:

- **Real-time tracking**: See all active operations across selected lights
- **Operation cards**: Each running preset displays with its icon, name, and target entity
- **Control buttons**: Stop, pause, or resume any running operation with one click
- **Multi-entity support**: Track operations running on multiple lights simultaneously
- **Auto-refresh**: Status updates automatically when operations start, stop, or change state

**Operation types tracked:**

- Dynamic RGB effects
- CCT sequences (standard, schedule, and solar modes)
- RGB segment sequences
- Dynamic scenes

**Override status indicators**: When a running adaptive sequence (schedule or solar mode) detects that you manually changed a light, the active preset card shows the override status:

- **Paused**: You manually paused the sequence
- **Externally paused**: An external change was detected and the sequence paused automatically. If auto-resume is configured, a countdown shows the remaining seconds (e.g., "Externally paused (resuming in 45s)")
- **Brightness overridden**: You changed the brgihtness manually; color continues adapting
- **Color overridden**: You changed the color temperature manually; brightness continues adapting

You can click **Resume** on any paused preset to immediately resume control, or wait for the auto-resume timer if one is configured.

The Active Presets section appears when you have lights selected or operations running, making it easy to manage all your lighting automation from one place.

## Activation overrides

Customize how presets are applied with optional overrides:

- **Custom brightness**: Override the preset's default brightness (1-100%)
  - Toggle on to enable brightness override
  - Use the slider to set your preferred brightness level
  - Applies to all preset types when activated
- **Static scene mode**: For dynamic scenes only
  - Apply scene colors once without starting transitions
  - Colors are distributed according to the scene's distribution mode
  - Lights remain at the assigned colors without cycling
- **Scene color assignment**: For dynamic scenes only
  - Change the way colors are assigned to lights from the method specified in the preset
- **Audio reactive**: Make dynamic scenes respond to music in real time
  - Enabling audio reactive disables custom brightness, static scene mode, and scene color assignment (they are mutually exclusive)
  - Requires an [ESPHome audio-reactive sensor](audio-reactive-setup.md) entity

### Audio-reactive controls

When audio reactive mode is enabled, the following controls appear:

#### Audio preset and entity

- **Audio preset**: Select a pre-configured audio profile that sets sensible defaults for common use cases:

  | Preset  | Color advance       | Detection mode | Sensitivity | Transition speed |
  | ------- | ------------------- | -------------- | ----------- | ---------------- |
  | Beat    | Color cycle         | Spectral flux  | 60%         | 80%              |
  | Ambient | Intensity breathing | Spectral flux  | 50%         | 20%              |
  | Concert | Beat predictive     | Complex domain | 50%         | 50%              |
  | Chill   | Continuous          | Spectral flux  | 40%         | 30%              |
  | Club    | Brightness flash    | Bass energy    | 70%         | 95%              |
  | Custom  | _(manual settings)_ |                |             |                  |

- **Audio sensor entity**: Select the `binary_sensor` entity exposed by your ESPHome audio-reactive device

#### Detection mode and color advance

- **Detection mode**: Controls how audio onsets (beats) are detected
  - **Spectral flux (all genres)**: General-purpose onset detection based on spectral changes -- works well across most music
  - **Bass energy (rhythmic music)**: Focuses on low-frequency energy, best for bass-heavy or rhythmic music
  - **Complex domain (phase + magnitude)**: Uses both phase and magnitude information for the most precise onset detection

- **Color advance**: Controls how scene colors change in response to audio
  - **Color cycle**: Advance to the next scene color on each detected onset
  - **Continuous**: Smoothly blend between colors based on audio intensity
  - **Beat predictive**: Anticipate beats and pre-position color transitions for tighter sync
  - **Intensity breathing**: Pulse brightness with audio intensity for a breathing effect
  - **Brightness flash**: Flash brightness on each detected onset

#### Sliders

- **Sensitivity** (1--100%): How responsive the system is to audio events. Higher values trigger on quieter sounds
- **Transition speed** (1--100%): How quickly lights transition between colors. Disabled for _Continuous_ and _Intensity breathing_ modes since those derive timing from the audio signal
- **Prediction aggressiveness** (1--100%): How far ahead the system predicts beats. Only available in _Beat predictive_ mode
- **Latency compensation** (0--500 ms): Offset to account for network and hardware delay. Only available in _Beat predictive_ mode

#### Toggle controls

- **Brightness response**: Modulate light brightness with audio intensity. Available for _Color cycle_, _Continuous_, and _Beat predictive_ modes
- **Frequency zone**: Assign different lights to different frequency bands so each light responds to a distinct part of the spectrum
- **Silence degradation**: Gradually fade lights during silence instead of holding the last color
- **Color by frequency**: Choose scene colors based on the dominant frequency rather than cycling sequentially
- **Rolloff brightness**: Reduce brightness for higher-frequency content, giving bass more visual weight

All audio-reactive settings are persisted as user preferences and restored across sessions.

These overrides apply when activating presets from the panel and provide quick ways to adjust preset behavior without editing the preset itself.

## Change detection

The change detection panel controls how the integration responds when your lights are changed outside of a running sequence -- for example, by a physical dimmer, the manufacturer app, another automation, or manual control in Home Assistant.

- **Ignore external changes**: Toggle off all change detection. When enabled, running sequences and scenes continue without interruption regardless of external changes. This is a **persistent global preference** that remains active across sessions and restarts until you turn it off. When a light is paused due to external changes, use the [resume entity control](services.md#19-resume-entity-control) service to re-add it to the running sequence.
- **Detect non-HA changes**: Detect changes made outside Home Assistant (manufacturer app, physical dimmer) by comparing the light's current state against the last values the integration applied. This catches changes that don't come through Home Assistant's service call system
- **Change control mode**: Controls what happens when a change is detected during an adaptive (schedule or solar) sequence:
  - **Pause all**: Pauses the entire sequence for that light when any attribute changes
  - **Pause changed only**: Pauses only the attribute that was changed, allowing the other to keep adapting. For example, if you manually adjust brightness, brightness pauses but color temperature continues following the schedule
- **Treat parameterized turn-on as override**: When enabled, turning on a light with specific parameters (e.g., `light.turn_on` with brightness or color_temp) overrides those attributes instead of applying the current adaptive values. When disabled, only a bare `light.turn_on` (with no parameters) applies adaptive values

## Dashboard card

The **Aqara Preset Favorites Card** is a custom Lovelace card that displays your favorited presets on any Home Assistant dashboard. Tap a preset to activate it instantly on the configured light(s).

### Adding the card

1. Open any dashboard and click **Edit**
2. Click **Add Card**
3. Search for **Aqara Advanced Lighting Presets** card
4. Select a light entity and configure the card options

### Card configuration

| Option                  | Default              | Description                                                      |
| ----------------------- | -------------------- | ---------------------------------------------------------------- |
| **Entities**            | _(required)_         | One or more light entities -- the card shows presets compatible with the selected device type |
| **Title**               | Favorite Presets     | Custom card title                                                |
| **Columns**             | 0 (auto)             | Number of grid columns (0 = responsive auto-layout)              |
| **Compact mode**        | Off                  | Condensed visual style with smaller preset buttons               |
| **Show preset names**   | On                   | Display preset name labels below each button                     |
| **Highlight user presets** | Off               | Visual distinction for custom user presets vs. built-in presets   |

### How it works

- The card fetches your favorited presets and filters them by the configured entity's device type
- Preset buttons display the thumbnail and optionally the preset name
- Active presets are highlighted

### Tips

- Favorite presets in the sidebar panel and they automatically appear in the card
- Use multiple cards on the same dashboard for different lights or rooms
- Compact mode works well in narrow columns or mobile dashboards

## Preset management

![Aqara Advanced Lighting Presets Manager](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/presets.png "Aqara Advanced Lighting Presets Manager")

Create, organize, and use custom presets for all features.

### Built-in presets

- 20 effect presets from the Aqara Home app
- 12 segment pattern presets
- 7 CCT sequence presets (Goodnight, Wakeup, Mindful Breathing, Power Nap, Circadian, Warm Day, Productive Day)
- 6 RGB segment sequence presets (Loading Bar, Wave, Sparkle, Theater Chase, Rainbow Fill, Comet)
- 58 dynamic scene presets (Sunset Glow, Ocean Waves, Northern Lights, Fireplace, and many more)

### User presets

- Create unlimited custom presets for any feature
- Edit existing presets to fine-tune settings
- Duplicate presets to create variations
- Delete presets you no longer need
- Sort presets alphabetically or by date
- All presets persist across restarts
- Backup and restore functions for user saved presets

### Applying presets

1. Select target light(s) from favorites or target searchbar
2. Choose a preset from any category
3. Click the preset to apply immediately

---

**Next**: [Visual editors](visual-editors.md) | [Services reference](services.md)
