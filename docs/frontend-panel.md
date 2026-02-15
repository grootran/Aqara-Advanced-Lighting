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
- CCT sequences
- RGB segment sequences
- Dynamic scenes

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
- **Ignore external changes**: For dynamic scenes and sequences
  - By default, when a light has changes applied to it through other HA services such as the user manually changing the color, this integration's sequences are paused or stopped. Enabling this toggle will ignore those changes and keep the sequence running.
  - This is a **persistent global preference** -- once enabled, it remains active across sessions and restarts until you turn it off. It is not a per-activation override like the other options above.
  - When a light is paused due to external changes, use the [resume entity control](services.md#19-resume-entity-control) service to re-add it to the running sequence.

These overrides apply when activating presets from the panel and provide quick ways to adjust preset behavior without editing the preset itself.

## Preset management

![Aqara Advanced Lighting Presets Manager](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/presets.png "Aqara Advanced Lighting Presets Manager")

Create, organize, and use custom presets for all features.

### Built-in presets

- 20 effect presets from the Aqara Home app
- 12 segment pattern presets
- 4 CCT sequence presets (Goodnight, Wakeup, Mindful Breathing, Circadian)
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
