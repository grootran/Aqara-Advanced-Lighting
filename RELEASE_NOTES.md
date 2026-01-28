# Aqara Advanced Lighting v0.8.2

## Upgrade Instructions

**Upgrading from v0.8.0:**
1. Update via HACS to v0.8.2
2. Restart Home Assistant
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)

Your existing configuration, presets, and favorites are automatically preserved.

---

## What's New

Version 0.8.2 is a code quality and reliability release. It removes the friendly name field from the config flow to align with Home Assistant guidelines, strengthens entity mapping to prevent false positives, and improves diagnostics transparency.

## Changes

### Config Flow Cleanup

The friendly name field has been removed from the config flow. Config entry titles are now auto-generated as "Aqara Lighting ({base_topic})".

**What this means for you:**
- Existing config entries keep their current titles
- Only reconfiguring an entry updates the title to the new format
- Any previously stored friendly name data is harmless and ignored
- Follows Home Assistant guidelines for non-helper integrations

### Entity Mapping Reliability

Strategy 4 (entity ID pattern matching) now only matches entities from the MQTT platform, preventing false-positive matches against non-MQTT entities with similar names.

### Enhanced Diagnostics

- Each mapped entity now shows which matching strategy was used (Strategy 1-4)
- Helps troubleshoot mapping issues in multi-instance setups
- CCT sequence manager uses public accessor method instead of private attribute access

### Code Quality

- **Timezone-aware datetimes** - State manager now uses `dt_util.utcnow()` instead of `datetime.now()`, preventing timezone-related issues in state expiry calculations
- **Improved test suite** - Config flow and init tests rewritten with correct mocks matching actual integration components

### Documentation

- README updated to remove friendly name references from setup and reconfiguration instructions

## Breaking Changes

None. This release is fully backward compatible with v0.8.0.

## Compatibility

- Fully backward compatible with v0.8.0
- All existing features and APIs unchanged
- No configuration changes required
- Existing config entries retain their titles

## Full Changelog

[View full changelog](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CHANGELOG.md#082---2026-01-28)

## Support

- [Report Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- [Documentation](https://github.com/absent42/Aqara-Advanced-Lighting)
- [Contributing Guidelines](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CONTRIBUTING.md)

---

If you find this integration useful, please star the repository

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)
