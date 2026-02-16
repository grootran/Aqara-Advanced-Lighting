# Visual editors

[Back to README](../README.md) | [Frontend panel](frontend-panel.md) | [Services reference](services.md)

Create custom effects and patterns with interactive builders accessible from the frontend panel.

## Dynamic scene editor

![Aqara Advanced Lighting Dynamic Scenes](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/scenes.png "Aqara Advanced Lighting Dynamic Scenes")

- Create ambient active lighting scenes that work across multiple lights
- Add up to 8 colors using XY color pickers with per-color brightness (1-100%)
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
- Add transition stagger (0-10 seconds) to create wave effects across lights
- Randomize light order for varied patterns
- Configure loop settings (once, count, or continuous)
- End behavior: restore to previous state or maintain last color
- Static mode option to apply colors once without transitions
- Works with any RGB light entity (not limited to Aqara devices)
- Save scenes as custom presets

## Effect editor

![Aqara Advanced Lighting Effects Editor](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/effects.png "Aqara Advanced Lighting Effects Editor")

- Select from 13 effect types
- Add up to 8 colors using color pickers
- Adjust speed and brightness with sliders
- Preview colors as you design
- For T1 Strip: specify which segments to light
- Save as custom preset for reuse

## Segment pattern editor

![Aqara Advanced Lighting Pattern Editor](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/pattern.png "Aqara Advanced Lighting Pattern Editor")

- Visual segment selector shows all available segments
- Click segments to assign colors
- Create gradients across multiple segments
- Gradient interpolation modes control how colors blend between gradient stops:
  - **Shortest path** (default): Transitions through the nearest hue on the color wheel (e.g., red to blue goes through purple)
  - **Longest path**: Transitions the long way around the color wheel, visiting all intermediate hues (e.g., red to blue goes through yellow, green, cyan)
  - **RGB**: Direct linear interpolation in RGB color space, ignoring the hue wheel
- Wave easing applies a sinusoidal curve to the gradient distribution, creating smooth oscillating color transitions instead of a linear blend. Configurable from 1 to 5 cycles across the gradient
- Gradient mirror, repeat (1-10 tiles), and reverse options
- Generate color block patterns
- Option to turn off unspecified segments
- Use the zone dropdown to quickly select saved segment zones or built-in presets (All, First Half, Second Half, Odd, Even)
- Works with T1, T1M, and T1 Strip lights
- Save patterns as custom presets

## CCT sequence editor

![Aqara Advanced Lighting CCT Sequencer](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/cct.png "Aqara Advanced Lighting CCT Sequencer")

- Build multi-step sequences (up to 20 steps)
- Set color temperature and brightness per step
- Each step has two timing phases:
  - **Transition time**: How long the light takes to fade from its current state to this step's color temperature and brightness (0-3600 seconds). The light smoothly interpolates between values during this period
  - **Hold time**: How long the light stays at this step's settings after the transition completes before moving to the next step (0-43200 seconds)
- Choose loop mode: once, count, or continuous
- Set end behavior: maintain or turn off
- Visual timeline shows sequence flow
- Works with any CCT light entity (not limited to Aqara devices)
- Save sequences as custom presets

## RGB segment sequence editor

![Aqara Advanced Lighting Segment Sequencer](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/segments.png "Aqara Advanced Lighting Segment Sequencer")

- Create animated segment patterns (up to 20 steps)
- Choose color mode: gradient, blocks, or individual
- Select activation pattern: sequential, random, simultaneous, and more
- Each step has two timing phases:
  - **Duration**: How long the activation pattern takes to complete (0-3600 seconds). During this period, segments light up according to the selected activation pattern (e.g., one by one for sequential, all at once for simultaneous)
  - **Hold time**: How long the completed pattern stays visible before the next step begins (0-43200 seconds)
- Configure loop settings
- Option to clear segments before starting
- Skip first step option for initialization
- Save sequences as custom presets

---

**Next**: [Device configuration](device-configuration.md) | [Services reference](services.md)
