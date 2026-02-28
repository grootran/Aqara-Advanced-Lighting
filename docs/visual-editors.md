# Visual editors

[Back to README](../README.md) | [Frontend panel](frontend-panel.md) | [Services reference](services.md)

Create custom effects and patterns with interactive builders accessible from the frontend panel.

## Dynamic scene editor

![Aqara Advanced Lighting Dynamic Scenes](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/scenes.png "Aqara Advanced Lighting Dynamic Scenes")

- Create ambient active lighting scenes that work across multiple lights
- Give each scene a name and optional icon for easy identification
- Add up to 8 colors using XY color pickers with per-color brightness (1-100%)
  - Reorder colors with drag-and-drop to control the color sequence
- **Image color extraction**: Create color palettes from uploaded images or image URLs
  - Upload an image file or paste a URL to automatically extract dominant colors
  - Uses k-means clustering to find up to 8 distinct colors from the image
  - Extracted colors are converted to CIE XY color space with brightness values
  - Optionally save the image as a preset thumbnail
  - Supports JPEG, PNG, and other common image formats (max 10 MB)
- Configure transition time (30-3600 seconds) for smooth color changes
- Set hold time (0-3600 seconds) to pause at each color
- Choose color assignment mode:
  - **Shuffle and rotate**: Each light gets a different color from the palette, then colors smoothly rotate through all lights along the color wheel
  - **Synchronized**: All lights transition through the same colors together
  - **Random**: Each light picks random colors from the palette
- Add ripple effect (0-120 seconds) to stagger light transitions and create wave effects across lights
- Randomize light order for varied patterns
- Configure loop settings (once, count, or continuous; specify loop count 1-100 for count mode)
- End behavior: restore to previous state or maintain last color
- Static mode option to apply colors once without transitions (available via services)
- Works with any RGB light entity (not limited to Aqara devices)
- Preview the scene before saving to see how it looks on your lights
- Save scenes as custom presets with color history for quick reuse

## Effect editor

![Aqara Advanced Lighting Effects Editor](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/effects.png "Aqara Advanced Lighting Effects Editor")

- Give each effect a name and optional icon for easy identification
- Select the target device type to see available effects:
  - **T2 Bulb**: Breathing, candlelight, fading, flash
  - **T1 / T1M**: Flow 1, flow 2, fading, hopping, breathing, rolling
  - **T1 Strip**: Breathing, rainbow 1, chasing, flash, hopping, rainbow 2, flicker, dash
- Add up to 8 colors using color pickers with color history for quick reuse
- Adjust speed (1-100) and brightness (1-100%) with sliders
- For T1 Strip: specify which segments to light using the segment selector
- Preview the effect before saving to see how it looks on your lights
- Save as custom preset for reuse

## Segment pattern editor

![Aqara Advanced Lighting Pattern Editor](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/pattern.png "Aqara Advanced Lighting Pattern Editor")

- Give each pattern a name and optional icon for easy identification
- Select the target device type (T1, T1M, or T1 Strip) to set the segment count
- Visual segment selector shows all available segments (count adjusts dynamically based on device type and strip length)
- Three color modes with distinct workflows:
  - **Individual**: Select segments and assign colors from a palette of up to 6 colors by clicking on them
  - **Gradient**: Define 2-6 color stops and generate smooth transitions across selected segments
  - **Blocks**: Create solid color block patterns with 1-6 colors that fill segments evenly
- Gradient and block options:
  - Interpolation modes control how colors blend between stops:
    - **Shortest path** (default): Transitions through the nearest hue on the color wheel (e.g., red to blue goes through purple)
    - **Longest path**: Transitions the long way around the color wheel, visiting all intermediate hues (e.g., red to blue goes through yellow, green, cyan)
    - **RGB**: Direct linear interpolation in RGB color space, ignoring the hue wheel
  - Wave easing applies a sinusoidal curve to the gradient distribution, creating smooth oscillating color transitions instead of a linear blend. Configurable from 1 to 5 cycles across the gradient
  - Mirror, repeat (1-10 tiles), and reverse options
  - Blocks mode includes an expand blocks toggle to stretch colors across segments
- Option to turn off unspecified segments
- Use the zone dropdown to quickly select saved segment zones or built-in presets (All, First Half, Second Half, Odd, Even)
- Preview the pattern before saving to see how it looks on your lights
- Save patterns as custom presets

## CCT sequence editor

![Aqara Advanced Lighting CCT Sequencer](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/cct.png "Aqara Advanced Lighting CCT Sequencer")

- Give each sequence a name and optional icon for easy identification
- Build multi-step sequences (up to 20 steps)
- Set color temperature (2700-6500K) and brightness (1-100%) per step
- Reorder steps with drag-and-drop, or use the step controls to move, duplicate, and delete steps
- Each step has two timing phases:
  - **Transition time**: How long the light takes to fade from its current state to this step's color temperature and brightness (0-3600 seconds). The light smoothly interpolates between values during this period
  - **Hold time**: How long the light stays at this step's settings after the transition completes before moving to the next step (0-43200 seconds)
- Choose loop mode: once, count (1-100 loops), or continuous
- Set end behavior: maintain last state, turn off, or restore to previous state
- Visual timeline shows sequence flow
- Validates that selected entities support color temperature mode and warns about incompatible lights
- Works with any CCT light entity (not limited to Aqara devices)
- Preview the sequence before saving to see how it runs on your lights
- Save sequences as custom presets

## RGB segment sequence editor

![Aqara Advanced Lighting Segment Sequencer](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/segments.png "Aqara Advanced Lighting Segment Sequencer")

- Give each sequence a name and optional icon for easy identification
- Select the target device type (T1, T1M, or T1 Strip)
- Create animated segment patterns (up to 20 steps)
- Each step has its own segment pattern using any of the three color modes (individual, gradient, or blocks) with the full set of pattern options
- Reorder steps with drag-and-drop, or use the step controls to move, duplicate, and delete steps
- Select an activation pattern to control how segments light up during each step:
  - **All**: All segments light up simultaneously
  - **Sequential forward**: Segments light up one by one from first to last
  - **Sequential reverse**: Segments light up one by one from last to first
  - **Random**: Segments light up in random order
  - **Ping pong**: Segments light up forward then reverse
  - **Center out**: Segments light up from the center outward
  - **Edges in**: Segments light up from both edges toward the center
  - **Paired**: Segments light up in mirrored pairs from the edges inward
- Each step has two timing phases:
  - **Duration**: How long the activation pattern takes to complete (0-3600 seconds). During this period, segments light up according to the selected activation pattern (e.g., one by one for sequential, all at once for simultaneous)
  - **Hold time**: How long the completed pattern stays visible before the next step begins (0-43200 seconds)
- Choose loop mode: once, count (1-100 loops), or continuous
- Set end behavior: maintain last state, turn off, or restore to previous state
- Option to clear segments before starting
- Skip first step option for continuous loops (useful when the first step is an initialization pattern)
- Preview the sequence before saving to see how it runs on your lights
- Save sequences as custom presets

## Common editor features

All editors share a set of common features:

- **Name and icon**: Every editor has a name field and an optional icon selector for identifying presets. Leave the icon field blank to use an automatically generated icon, or pick one from Home Assistant's built-in icon library
- **Draft preservation**: Unsaved changes are preserved if you navigate away from the editor, so you can return without losing work
- **Preview**: All editors support previewing on your lights before saving, so you can see the result in real time
- **Presets**: Save your work as reusable presets that appear in the preset library. Existing presets can be loaded and edited
- **Unsaved changes indicator**: The editor shows when you have unsaved modifications
- **Color history**: Editors that use color pickers remember recently used colors for quick reuse across sessions

---

**Next**: [Device configuration](device-configuration.md) | [Services reference](services.md)
