# Troubleshooting

[Back to README](../README.md) | [Getting started](getting-started.md)

## Integration won't load

**Zigbee2MQTT backend:**

- Verify MQTT integration is configured and running
- Check that Zigbee2MQTT is connected
- Review Home Assistant logs for specific errors

**ZHA backend:**

- Verify the ZHA integration is loaded and running
- Check that at least one supported Aqara device is paired
- Review Home Assistant logs for ZHA-related errors

## Lights not discovered

**Zigbee2MQTT backend:**

- Ensure lights are paired with Zigbee2MQTT
- Verify Z2M base topic matches your configuration
- Check that lights are one of the [supported models](../README.md#supported-devices)

**ZHA backend:**

- Ensure lights are paired through ZHA (visible in **Settings** > **Devices & Services** > **ZHA**)
- Verify the device model matches a supported model. ZHA v2 quirks may show a friendly name instead of the raw model ID, but the integration resolves this automatically
- If a device was paired after the integration was set up, reload the integration entry

## Effects not working

**Zigbee2MQTT backend:**

- Verify the effect type is supported for your light model
- Check Z2M logs for MQTT communication errors
- Ensure light entity IDs are correct

**ZHA backend:**

- Verify the effect type is supported for your light model
- If effects do not work after initial setup, restart Home Assistant to ensure the custom Zigbee cluster definitions are registered
- Check Home Assistant logs for "Failed to write attribute" errors, which indicate cluster communication issues

## Service calls failing

- Check that `entity_id` exists and is correct
- Verify RGB color values are 0-255
- Ensure speed is 1-100
- Confirm the entity is associated with a configured integration entry (check diagnostics for entity mappings)

## T1 Strip segment count issues

- Ensure your T1 Strip's `length` attribute is correctly set
  - **Zigbee2MQTT**: Check the `length` attribute in Z2M or HA
  - **ZHA**: Use the Device Config tab in the panel to set strip length
- The integration reads this to calculate segment count (5 segments per meter)
- If unavailable, it defaults to 10 segments (2 meters) with a warning

## Device firmware

Make sure your device firmware is up to date:

- T1M: 0.0.0_0027
- T1 strip: 0.0.0_0027
- T2 bulb: 0.0.0_0030

## ZHA-specific troubleshooting

### Entity mapping delays

After adding the ZHA backend, the integration waits up to 30 seconds for ZHA to create light entities. If you see "0 entities mapped" in the logs, reload the integration entry after ZHA has fully started.

### Checking ZHA logs

For debugging ZHA communication issues, look for these log entries:

- `Resolved ZHA quirk model ... via zigpy device` -- successful model resolution
- `ZHA device discovery complete: found X supported devices` -- device count at setup
- `Skipping Aqara device ... not in SUPPORTED_MODELS` -- unsupported device filtered out
- `Failed to write attribute` -- cluster write error (check coordinator connectivity)

## Diagnostics

The integration provides downloadable diagnostics data to help with troubleshooting. This includes discovered devices, entity mappings, backend type, active effects and sequences, and configuration details. Sensitive data is automatically redacted.

To download diagnostics:

1. Go to **Settings** > **Devices & Services**
2. Find "Aqara Advanced Lighting" and click the three dots menu
3. Select **Download diagnostics**

Include this file when reporting issues on GitHub.

## Known limitations

- **Effects, segment patterns, and segment sequences are Aqara-only** -- These features use Aqara-specific Zigbee attributes and only work with supported Aqara devices. Dynamic scenes and CCT sequences use standard Home Assistant light services and work with any RGB or CCT light respectively.
- **One ZHA gateway** -- ZHA supports only one Zigbee coordinator per Home Assistant instance. If you need multiple coordinators, use Zigbee2MQTT for the additional ones.
- **Music sync is T1 LED Strip only** -- The built-in microphone audio-reactive mode is a hardware feature exclusive to the T1 LED Strip (ACN132).
- **Maximum 20 steps per sequence** -- Both CCT sequences and RGB segment sequences support up to 20 steps. The Home Assistant service UI shows 10 steps; steps 11-20 are available in YAML mode.
- **T1 Strip segment count depends on length attribute** -- If the strip length is not set correctly, the integration defaults to 10 segments (2 meters). Set the correct length via the Device Config tab or your Zigbee backend.
- **Preset names are case-insensitive** -- When referencing presets in service calls or the REST API, names are matched case-insensitively. Two presets that differ only in case would conflict.

---

**Back to**: [README](../README.md) | [Getting started](getting-started.md)
