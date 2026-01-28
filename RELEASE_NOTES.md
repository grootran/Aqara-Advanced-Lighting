# Aqara Advanced Lighting v0.9.0

## Upgrade Instructions

**Upgrading from v0.8.x:**
1. Update via HACS to v0.9.0
2. Restart Home Assistant
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)

Your existing configuration, presets, and favorites are automatically preserved.

---

## What's New

Version 0.9.0 introduces advanced gradient creation tools, improved color accuracy across the frontend, and a major code modernization converting the segment selector component to TypeScript.

## Changes

### Advanced Gradient Creation

Five new gradient options are now available in the segment selector's gradient mode:

- **Reverse direction** - Flip the gradient flow with a single toggle
- **Mirror gradient** - Create symmetric patterns from your color stops, with correct handling for both odd and even segment counts
- **Interpolation mode** - Choose between shortest hue, longest hue, or linear RGB blending
- **Repeating gradient** - Tile the gradient pattern across segments (1-10 repeats)
- **Wave easing** - Apply sinusoidal easing with configurable cycle count (1-5 cycles)

All options work with both "Apply to Grid" and "Apply to Selected" actions, and persist per-step in the segment sequence editor.

### Color Accuracy

- Improved XY-to-RGB conversion with max-component normalization, fixing washed-out blues and improving color fidelity across the entire color wheel
- All frontend components now use shared color utility functions, eliminating inconsistencies between components

### Frontend Architecture

- Segment selector converted from standalone JavaScript to bundled TypeScript
- Single frontend bundle reduces HTTP requests and simplifies deployment
- Removed separate segment-selector.js API endpoint

## Breaking Changes

None. This release is fully backward compatible with v0.8.2.

## Compatibility

- Fully backward compatible with v0.8.2
- All existing features and APIs unchanged
- No configuration changes required
- All presets and favorites preserved

## Full Changelog

[View full changelog](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CHANGELOG.md#090---2026-01-28)

## Support

- [Report Issues](https://github.com/absent42/Aqara-Advanced-Lighting/issues)
- [Documentation](https://github.com/absent42/Aqara-Advanced-Lighting)
- [Contributing Guidelines](https://github.com/absent42/Aqara-Advanced-Lighting/blob/main/CONTRIBUTING.md)

---

If you find this integration useful, please star the repository

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/absent42)
