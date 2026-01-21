# Aqara Advanced Lighting v0.8.0

## What's New

Version 0.8.0 introduces **support for multiple Zigbee2MQTT instances**, allowing you to control Aqara lights across multiple Z2M coordinators from a single integration. This release also includes intelligent entity routing, improved device detection, and enhanced error messages.

## New Features

### Multiple Zigbee2MQTT Instance Support

The integration now supports connecting to multiple Zigbee2MQTT instances simultaneously for users with:
- Multiple Zigbee coordinators in different locations (upstairs/downstairs, home/garage, etc.)
- Separate Z2M instances for different device types or zones
- Complex smart home setups with distributed Zigbee networks

#### Key Capabilities

**Add Multiple Instances**
- Create separate config entries for each Z2M instance
- Each instance identified by its unique MQTT base topic
- Optional friendly names for easy identification (e.g., "Upstairs", "Garage")
- Automatic detection and validation of Z2M instances during setup

**Automatic Entity Routing**
- Service calls automatically routed to the correct Z2M instance
- Entity-to-instance mapping built during setup
- Fast lookup using entity routing map
- Seamless operation across multiple instances

**Instance Management**
- Add, remove, or reconfigure individual instances independently
- Each instance maintains its own MQTT client and state managers
- Prevents duplicate instances with the same base topic
- Per-instance device discovery and mapping

### Enhanced Config Flow

**Z2M Instance Validation**
- Automatic validation during config flow setup
- Subscribes to bridge/state topic to confirm Z2M is running
- 5-second timeout for Z2M response
- Clear error messages if Z2M instance not found

**Friendly Instance Naming**
- Optional friendly name field for each instance
- Use descriptive names like "Main Floor", "Workshop", or "Outdoor"
- Falls back to base topic if name not provided
- Helps distinguish instances in logs and error messages

**Duplicate Prevention**
- Prevents adding the same Z2M base topic twice
- Unique ID based on base topic ensures no conflicts
- Clear error message when attempting to add duplicate instance

### Improved Entity Detection

**Supported Entities API**
- New `/api/aqara_advanced_lighting/supported_entities` endpoint
- Returns all supported entities across all Z2M instances
- Includes device type, model ID, and Z2M friendly name for each entity
- Instance summary with device counts by type

**Backend-Driven Entity Filtering**
- Frontend uses backend data for device detection
- Replaces frontend-only heuristic detection with reliable backend info
- Entity selector in panel shows only supported Aqara devices
- Eliminates confusion from unsupported entities in dropdown

**Enhanced Device Type Detection**
- Fallback to frontend heuristics if backend data unavailable
- More accurate device type identification
- Better compatibility validation before service calls

### Better Error Messages

**Instance-Aware Error Reporting**
- Errors now report which Z2M instance has the issue
- Lists all configured instances when entity not found
- Helpful context for troubleshooting multi-instance setups
- Clear guidance on which instance to check

**Service Call Validation**
- Validates entities exist in configured instances before processing
- Provides specific error when entity not found in any instance
- Lists available instances in error message for reference

## Improvements

### Entity Routing Performance

**Fast Instance Lookup**
- Entity routing map provides O(1) lookup time
- Map updated automatically during device discovery
- Falls back to searching all instances if needed
- Routing map cached for subsequent lookups

### Logging Enhancements

**Instance-Specific Logging**
- Setup logs include entry ID and base topic
- Mapping logs show which instance owns each entity
- Warning logs for unmapped Z2M devices
- Debug logs for troubleshooting entity routing

**Better Visibility**
- Logs all light entities in Home Assistant during mapping
- Reports which Z2M devices matched HA entities
- Warns about Z2M devices without matching entities
- Displays final entity-to-Z2M mapping for verification

### Frontend Updates

**Entity Selector Improvements**
- Shows only supported Aqara entities from all instances
- Entity list updated when new instances added
- Faster entity selection with pre-filtered list
- Better user experience with relevant entities only

**Instance Data Display**
- Backend provides instance information to frontend
- Device counts by type for each instance
- List of devices per instance
- Foundation for future instance selection UI

### Sequence Synchronization

**Group Synchronization for Sequences**
- CCT and RGB segment sequences now support synchronized playback across multiple lights
- Uses asyncio barriers to coordinate step timing between entities
- All lights in a group transition steps together with perfect timing
- Ideal for synchronized animations and effects across multiple fixtures
- Automatic cleanup when sequences stop or entities are removed
- Works seamlessly across multiple Z2M instances

## Bug Fixes

### Firefox Compatibility

**TouchEvent Detection Fix**
- Fixed touch event detection in xy-color-picker for Firefox compatibility
- Changed from `instanceof TouchEvent` to `'touches' in e` check
- Resolves issues with color picker not working on Firefox mobile/desktop
- Improves cross-browser compatibility for touch interactions in the frontend panel

## Technical Changes

### Architecture Updates

**Multi-Instance Data Structure**
```python
hass.data[DOMAIN] = {
    "entries": {
        entry_id_1: {
            "mqtt_client": MQTTClient(...),
            "state_manager": StateManager(...),
            "cct_sequence_manager": CCTSequenceManager(...),
            "segment_sequence_manager": SegmentSequenceManager(...),
        },
        entry_id_2: { ... },
    },
    "entity_routing": {
        "light.bedroom": "entry_id_1",
        "light.kitchen": "entry_id_2",
    },
    "preset_store": PresetStore(...),  # Shared across instances
    "favorites_store": FavoritesStore(...),  # Shared across instances
}
```

**Service Routing Functions**
- `_get_instance_for_entity()` - Find instance owning an entity
- `_get_mqtt_client_for_entity()` - Get MQTT client for entity
- `_get_instance_components_for_entity()` - Get all components for entity
- `_get_any_instance()` - Get any instance for backward compatibility

### New Files

None - all changes are updates to existing files.

### Updated Files

**Backend**
- `__init__.py` - Multi-instance data structure and per-entry setup
- `config_flow.py` - Z2M validation, friendly names, duplicate prevention
- `services.py` - Entity routing and instance-aware service handlers
- `mqtt_client.py` - Entity routing map updates during discovery
- `panel.py` - New supported entities API endpoint
- `translations/en.json` - New translations for multi-instance errors

**Frontend**
- `aqara-panel.ts` - Supported entities loading and backend-driven filtering
- `styles.ts` - Minor styling adjustments
- `aqara_panel.js` - Compiled frontend bundle

## Breaking Changes

None. This release is fully backward compatible with v0.7.0.

**Single Instance Users**
- No changes required for existing single-instance setups
- Behavior identical to v0.7.0
- Data structure changes are transparent
- All services work exactly as before

**Migration Path**
- Existing config entry automatically migrated to new data structure
- No manual configuration needed
- All presets and settings preserved
- Existing Z2M instances can be optionally updated with a friendly name by selecting "Reconfigure"

## Compatibility

- Fully backward compatible with v0.7.0
- All existing features and APIs unchanged
- No configuration changes required for single-instance users
- New multi-instance features optional and additive

### Upgrade from v0.7.0

1. Update the integration through HACS
2. **Restart Home Assistant**
3. **Clear your browser cache** (important - see instructions in README)
   - Desktop: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
   - Mobile: Settings → Apps → Home Assistant → Clear cache
4. Your existing configuration is automatically migrated
5. To add additional Z2M instances, go to Settings > Devices & Services > Add Integration > Aqara Advanced Lighting

All existing presets, favorites, and configurations are preserved during the update.

## Adding Additional Z2M Instances

After upgrading, you can add more Z2M instances:

1. Go to **Settings** > **Devices & Services**
2. Click **Add Integration**
3. Search for **Aqara Advanced Lighting**
4. Enter the **Z2M base topic** for the new instance (e.g., "zigbee2mqtt2")
5. Optionally add a **friendly name** (e.g., "Upstairs")
6. Click **Submit**

The integration will validate the Z2M instance exists and add it if successful. Repeat for each additional Z2M instance.

## Use Cases

### Multiple Locations
```yaml
# Config Entry 1: Main house (zigbee2mqtt)
# Config Entry 2: Garage (zigbee2mqtt_garage)
# Config Entry 3: Workshop (zigbee2mqtt_workshop)
```

### Zone Separation
```yaml
# Config Entry 1: Indoor lights (zigbee2mqtt_indoor)
# Config Entry 2: Outdoor lights (zigbee2mqtt_outdoor)
```

### Device Type Separation
```yaml
# Config Entry 1: Smart bulbs (zigbee2mqtt)
# Config Entry 2: LED strips (zigbee2mqtt_strips)
```

## Known Issues

None at this time.

## Full Changelog

[View full changelog](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CHANGELOG.md#080---2026-01-20)

## Support

- [Report Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- [Documentation](https://github.com/absent42/Aqara-Advanced-Lighting)
- [Contributing Guidelines](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CONTRIBUTING.md)

---

If you find this integration useful, please star the repository

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)