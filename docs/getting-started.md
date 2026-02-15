# Getting started

[Back to README](../README.md)

This guide covers installation, updating, and configuring the Aqara Advanced Lighting integration for Home Assistant.

## Requirements

- Home Assistant 2025.12.0 or newer (older versions not tested)
- Supported Aqara light devices with Zigbee firmware (see [supported devices](../README.md#supported-devices))
- **One or both** of the following Zigbee backends:

**For Zigbee2MQTT:**

- MQTT integration configured and running
- Zigbee2MQTT 2.7.2 or newer

**For ZHA (Zigbee Home Automation):**

- ZHA integration installed and configured

## Installation

### HACS

1. Open HACS in Home Assistant
2. Search for Aqara Advanced Lighting
3. Click the 3 dots
4. Select Download
5. Restart Home Assistant

Alternatively click:

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=absent42&repository=Aqara-Advanced-Lighting&category=Integration)

Restart Home Assistant

### Manual installation

1. Copy the `custom_components/aqara_advanced_lighting` folder to your Home Assistant `custom_components` directory
2. Restart Home Assistant

## Updating

### Update via HACS

1. A notification will appear in Home Assistant when an update is available
2. Click **Update**
3. **Restart Home Assistant**
4. **Clear your browser/app cache** (see version mismatch warning below)

### Manual update

If you installed manually:

1. Download the latest release from [GitHub Releases](https://github.com/absent42/Aqara-Advanced-Lighting/releases)
2. Replace the `custom_components/aqara_advanced_lighting` folder
3. Restart Home Assistant
4. Clear browser cache (see below)

### Version mismatch warning

If you see a version mismatch warning in the panel after updating, this means the backend and frontend versions don't match. This can happen when the browser cache is serving an old version of the frontend.

**To resolve:**

**Desktop browser:**

1. Perform a hard refresh to clear the cache:
   - **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
   - **Mac**: `Cmd + Shift + R`
2. If the warning persists, clear your browser cache completely:
   - **Chrome/Edge**: Settings > Privacy and security > Clear browsing data > Cached images and files
   - **Firefox**: Settings > Privacy & Security > Cookies and Site Data > Clear Data > Cached Web Content
   - **Safari**: Develop > Empty Caches (or Settings > Advanced > Show Develop menu)
3. Close and reopen the browser tab
4. If still showing, restart Home Assistant

**Mobile app (Home Assistant Companion):**

1. **iOS**: Go to **Settings** > **Apps** > **Home Assistant** > **Clear cache**. Force close the app and reopen.
2. **Android**: Go to **Settings** > **Apps** > **Home Assistant** > **Clear cache**. Force close the app and reopen.

## Configuration

The integration supports two Zigbee backends: **Zigbee2MQTT** and **ZHA** (Zigbee Home Automation). During setup you choose which backend to use. You can run both simultaneously if you have lights on each.

1. Go to **Settings** > **Devices & Services** > **Add Integration**
2. Search for "Aqara Advanced Lighting"
3. Select your backend: **Zigbee2MQTT** or **ZHA**
4. Follow the backend-specific steps below

### Zigbee2MQTT setup

1. Select **Zigbee2MQTT** as the backend
2. Enter your Zigbee2MQTT base topic (default: `zigbee2mqtt`)
3. Click "Submit"

The integration will automatically discover your Aqara lights through Zigbee2MQTT.

#### Zigbee2MQTT configuration parameters

The Zigbee2MQTT backend requires one configuration parameter during setup:

**Zigbee2MQTT base topic**

- **Default**: `zigbee2mqtt`
- **Required**: Yes
- **Type**: String

The MQTT base topic used by your Zigbee2MQTT installation. This integration subscribes to MQTT messages under this topic to discover and communicate with Aqara lights. The base topic must match the `base_topic` configured in your Zigbee2MQTT `configuration.yaml`.

**Examples**:

- Default installation: `zigbee2mqtt`
- Custom topic: `z2m`
- Hierarchical topic: `home/zigbee2mqtt`

**Finding your Z2M base topic**:

1. Open your Zigbee2MQTT `configuration.yaml` file
2. Look for the `mqtt` section
3. Find the `base_topic` setting
4. Use that exact value in this integration

#### Multiple Zigbee2MQTT instances

The integration supports connecting to multiple Zigbee2MQTT instances simultaneously, perfect for complex smart home setups with distributed Zigbee networks.

**Adding additional instances**

To add another Zigbee2MQTT instance after initial setup:

1. Go to **Settings** > **Devices & Services**
2. Click **Add Integration**
3. Search for "Aqara Advanced Lighting"
4. Enter the **Z2M base topic** for the new instance (e.g., `zigbee2mqtt2`)
5. Click "Submit"

Each instance is automatically titled based on its base topic (e.g., "Aqara Lighting (zigbee2mqtt2)").

The integration will:

- Validate the Z2M instance is running (5-second timeout)
- Prevent duplicate instances with the same base topic
- Automatically route service calls to the correct instance
- Show devices from all instances in the frontend panel

**Multi-instance features**

*Automatic entity routing*

- Service calls automatically find the correct Z2M instance for each entity
- Fast O(1) lookup using entity routing map
- No manual instance selection needed

*Instance validation*

- Subscribes to `bridge/state` topic during setup to confirm Z2M is running
- Clear error messages if Z2M instance not found
- 5-second validation timeout

*Instance management*

- Each instance maintains its own MQTT client and state managers
- Shared presets and favorites work across all instances
- Independent configuration and reconfiguration per instance

**Use cases**

Multiple locations:

```
Instance 1: zigbee2mqtt (Main Floor)
Instance 2: zigbee2mqtt_upstairs (Upstairs)
Instance 3: zigbee2mqtt_garage (Garage)
```

Zone separation:

```
Instance 1: zigbee2mqtt_indoor (Indoor Lights)
Instance 2: zigbee2mqtt_outdoor (Outdoor Lights)
```

Device type separation:

```
Instance 1: zigbee2mqtt (Smart Bulbs)
Instance 2: zigbee2mqtt_strips (LED Strips)
```

#### Z2M troubleshooting

- If devices are not discovered, verify the base topic matches your Z2M configuration
- Check that MQTT integration is properly configured and connected
- Ensure Zigbee2MQTT is running and connected to the same MQTT broker
- The integration validates the Z2M instance by subscribing to the `bridge/state` topic during setup
- Use the Reconfigure option to update the base topic if needed

### ZHA setup

1. Select **ZHA** as the backend
2. The integration validates that the ZHA integration is loaded and finds supported Aqara devices
3. Click "Submit"
4. Wait for the integration to discover the ZHA devices

The integration automatically discovers all supported Aqara lights that are paired with ZHA. No additional configuration parameters are required.

**Prerequisites:**

- The ZHA integration must be installed and configured in Home Assistant
- Your Aqara lights must already be paired through ZHA
- MQTT integration is **not** required for ZHA-only setups

**How it works:**

- The integration registers custom Zigbee cluster definitions so that ZHA can communicate with Aqara-specific features (effects, segments, device configuration)
- Supported devices are automatically detected from the ZHA device list
- If ZHA was already running when the integration is installed, a one-time ZHA reload is triggered to apply the custom cluster definitions
- Light entities are mapped to their ZHA devices for service routing

#### ZHA troubleshooting

- **"No supported Aqara devices found"**: Ensure your lights are paired through ZHA and are one of the supported models (see [supported devices](../README.md#supported-devices))
- **ZHA gateway not ready**: If the ZHA integration is still initializing, wait a moment and try adding the integration again
- **Effects not applying after initial setup**: The integration triggers a ZHA reload to register custom cluster definitions. If effects still do not work, restart Home Assistant once, and wait for Home Assistant to fully load and setup
- **Device not recognized**: ZHA v2 quirks may override the device model name. The integration handles this automatically, but if a device is not detected, check that its Zigbee model ID matches a supported model (e.g., `lumi.light.acn032` for T1M)

#### ZHA notes

- Only one ZHA config entry is supported per Home Assistant instance (ZHA itself only supports one gateway)
- ZHA entries do not have a reconfiguration option since no user-configurable parameters are needed

### Mixed backend environments

You can run both Z2M and ZHA simultaneously. For example, you might have some Aqara lights on Zigbee2MQTT and others on ZHA. The integration routes service calls to the correct backend automatically. Presets, favorites, and the frontend panel work across both backends.

## Reconfiguration

To change the Z2M base topic for an existing instance:

1. Go to **Settings** > **Devices & Services**
2. Find the "Aqara Advanced Lighting" instance you want to reconfigure
3. Click the three dots menu > "Reconfigure"
4. Update the base topic
5. Click "Submit"

## Removal

To remove the integration from Home Assistant:

1. **Remove the integration**:

   - Go to **Settings** > **Devices & Services**
   - Find "Aqara Advanced Lighting"
   - Click the three dots menu > **Delete**
   - Confirm the removal
2. **Remove associated devices** (optional):

   - After removing the integration, associated Aqara light devices will remain in the device registry
   - To remove devices, go to **Settings** > **Devices & Services** > **Devices**
   - Find each Aqara light device
   - Click the device > Click the three dots menu > **Delete**
   - Confirm the removal for each device
3. **Uninstall integration files**:

   **If installed via HACS**:

   - Go to **HACS**
   - Find "Aqara Advanced Lighting"
   - Click the three dots menu > **Remove**
   - Restart Home Assistant

   **If installed manually**:

   - Delete the `custom_components/aqara_advanced_lighting` folder from your Home Assistant configuration directory
   - Restart Home Assistant

**Note**: Removing the integration does not affect your Zigbee2MQTT or ZHA configuration, nor your Aqara lights themselves. The lights will continue to work with their respective Zigbee backend and standard Home Assistant light entities.

---

**Next**: [Frontend panel](frontend-panel.md) | [Troubleshooting](troubleshooting.md)
