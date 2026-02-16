# Device configuration

[Back to README](../README.md) | [Visual editors](visual-editors.md)

Configure device-specific settings directly from the Device Config tab in the panel.

![Aqara Advanced Lighting Device Configuration](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/devices.png "Aqara Advanced Lighting Device Configuration")

## Multi-device configuration

- **Select multiple devices** to configure them simultaneously
- Push the same settings to all selected devices at once
- Ideal for maintaining consistent settings across multiple lights

## T2 bulb settings

### Transition curve editor

- Visual curve editor with interactive graph showing brightness vs time
- Adjust transition curvature from 0.2 to 6.0
- Three curve types:
  - **0.2-1.0**: Fast then slow (quick start, gentle finish)
  - **1.0**: Linear (constant speed)
  - **1.0-6.0**: Slow then fast (gentle start, quick finish)
- Supports multiple devices simultaneously for synchronized behavior
- Apply button sends settings directly to your selected T2 bulbs

### Initial brightness

- Set startup brightness from 0-50%
- Direct entity control via slider
- Immediate feedback and updates
- Apply to multiple devices simultaneously for synchronized behavior

## Dimming settings (all devices)

- **On-to-off duration**: Fade time when turning light off (0-10 seconds)
- **Off-to-on duration**: Fade time when turning light on (0-10 seconds)
- **Dimming range minimum**: Lowest brightness level (1-99%)
- **Dimming range maximum**: Highest brightness level (2-100%)
- Apply to multiple devices simultaneously for synchronized behavior

## T1, T1M, and T1 Strip settings

### Segment zones

- Create named zones to group segments for quick selection in the pattern and sequence editors
- Each zone maps a name (e.g., "Left Side", "Accent") to a segment range (e.g., `1-8`, `1-5,10,15-20`)
- Zones are saved per device and persist across sessions
- Zone names must be unique per device (case-insensitive) and cannot conflict with built-in keywords (all, odd, even, first-half, second-half)
- Up to 20 zones per device
- **Zone names work in service calls**: Use a zone name directly as the `segments` parameter in service calls and automations. The integration resolves the zone name to its segment range automatically. Zone names are matched case-insensitively.

**Example -- using a zone name in an automation:**

```yaml
service: aqara_advanced_lighting.create_gradient
target:
  entity_id: light.ceiling_light
data:
  color_1: [255, 0, 0]
  color_2: [0, 0, 255]
  segments: "left side"  # Resolves to the segment range defined for this zone
```

## T1 Strip settings

### Strip length configuration

- Set T1 Strip length directly from the panel
- Automatic segment count calculation (5 segments per meter)

## Smart features

- Config tab automatically shows only settings relevant to your selected device type
- Automatic entity discovery for configuration parameters
- Clear messaging when entities are not found
- Device type awareness adapts settings based on T2 RGB, T2 CCT, T1M, T1, or T1 Strip selection

---

**Next**: [Services reference](services.md) | [Troubleshooting](troubleshooting.md)
