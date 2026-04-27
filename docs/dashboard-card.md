# Dashboard card

The **Aqara Preset Favorites Card** is a custom Lovelace card that puts your favorited presets on any Home Assistant dashboard. Tap a preset to activate it instantly on the configured light(s); tap an active preset again to stop it.

The card supports five layouts, per-card preset curation with drag-reorder, an optional inline brightness slider, and live active-state highlighting via WebSocket events.

![Aqara Advanced Lighting Dashboard Card](https://raw.githubusercontent.com/absent42/Aqara-Advanced-Lighting/refs/heads/main/images/dashboard-card.png "Aqara Advanced Lighting Dashboard Card")

## Adding the card

1. Open any dashboard and click **Edit dashboard**.
2. Click **Add card**.
3. Search for **Aqara Advanced Lighting Presets** and select it.
4. Pick one or more light entities and configure the card options.

## Card configuration

| Option                   | Default              | Description                                                                                              |
| ------------------------ | -------------------- | -------------------------------------------------------------------------------------------------------- |
| **Entities**             | _(required)_         | One or more light entities. The card shows favorites compatible with the selected device types.         |
| **Title**                | Favorite Presets     | Custom card title. Set blank to hide the title row.                                                       |
| **Layout**               | Grid                 | One of Grid, Compact grid, List, Hero, Carousel. See [Layouts](#layouts) below.                          |
| **Grid columns**         | 0 (auto)             | Number of grid columns; 0 = responsive auto-layout. Only applies to the Grid and Compact grid layouts.   |
| **Show preset names**    | On                   | Display preset name labels with each tile.                                                                |
| **Highlight user presets** | On                 | Apply a dashed border to user-defined presets to distinguish them from built-in ones.                    |
| **Presets shown**        | All favorites        | Optional curation list. Check which favorites appear on this card and drag to reorder. Leave all checked and unmoved to use your global favorites order. |
| **Brightness slider**    | Off                  | Show an inline brightness slider (1-100%) that overrides preset brightness when set. See [Brightness slider](#brightness-slider) below. |
| **Slider position**      | Header               | Header (above the presets) or Footer (below). Only visible when Brightness slider is on.                  |

The "Presets shown" curation list is the editor's drag-reorder list. Each row has a drag handle (left), a checkbox (middle), the preset icon, and the preset name. Only checked presets appear on the live card, in the exact order you arranged them. A "Reset to global order" button clears the curation, restoring the global favorites order from the panel.

## Layouts

| Layout | Description |
|--------|-------------|
| **Grid** (default) | Standard grid with auto-fill 140px tiles. Mobile-responsive. Configurable column count via Grid columns. |
| **Compact grid** | Same grid layout with smaller tiles (auto-fill 80px). Good for narrow sidebar slots or dense displays. |
| **List** | Single-column rows with icon, name, and active indicator. Good for many favorites or narrow cards. |
| **Hero** | First preset rendered large with name beneath; remaining presets in a horizontal strip below. The first preset in your curation order (or global favorites order) is the hero - reorder to change which preset is featured. |
| **Carousel** | Horizontal scroll-snap strip with all presets at compact size. Native scrollbar visible on desktop, swipe on touch. |

The legacy `compact: true` config field is auto-migrated to `layout: 'compact-grid'` for back-compat with v1 cards.

## Brightness slider

When enabled, an inline slider appears above (Header) or below (Footer) the preset display, allowing you to set an override brightness for any preset activated from this card.

The slider value is applied per preset type:

- **Effects, segment patterns, segment sequences**: applied as `brightness` in the activation service call.
- **Dynamic scenes**: replaces every color's `brightness_pct`.
- **CCT sequences**: NOT applied (per-step brightness is part of CCT step semantics; the slider has no effect on these).
- **User effects with a saved `effect_brightness`**: per-preset value wins over the slider.

The slider is card-instance-local in-memory only - it defaults to 100% on each page load and is never persisted.

## Per-card curation

By default the card shows all your global favorites in the order they appear in the panel's Favorites section. To curate a subset for this card:

1. Open the card editor.
2. In the "Presets shown" list, uncheck presets you don't want on this card.
3. Drag rows to reorder them. Only checked rows persist; unchecked rows are visible during reorder but ignored when saving.
4. Save the card.

Newly favorited presets are not auto-added to a curated card - they appear in the editor's list ready for you to check them. Use "Reset to global order" to clear the curation and revert to showing all favorites.

If a curated preset is later unfavorited, deleted, or becomes incompatible with the configured entities (e.g. you swap an RGB light for a CCT light), the card silently drops it from the display. The curation list itself is left untouched, so re-favoriting / re-enabling restores the preset on the card.

## How it works

- The card subscribes to a WebSocket event (`aqara_advanced_lighting_operations_changed`) for live active-state updates - active presets highlight within milliseconds of operations starting or stopping, anywhere in the system.
- Tap a preset to activate. Tap again while active to stop.
- Multi-entity cards target all configured entities at once - one tap activates the preset on every selected light simultaneously.
- The card filters favorites by the configured entities' device types. Only presets compatible with at least one configured entity are displayed.
- Active highlighting tracks both the preset id and the running scene name, so dynamic scenes and user-defined presets both show as active when running.
- The audio sensor entity from your panel preferences is automatically passed to audio-reactive presets, so built-in presets like Concert and Kick activate audio-reactively when triggered from the card.

## Reordering favorites in the panel

The card's default order (when no curation is set) follows the global favorites order from the panel. To reorder globally, in the panel's Favorites section, set the sort dropdown to **Custom** (the default for new users) and drag preset cards by their drag handle (top-right corner, visible on hover). Reordering writes back to your user preferences and affects every dashboard card that uses the global order.

If you previously had the favorites sort set to "Old", it auto-migrates to "Custom" on next page load - identical display order, but with drag handles unlocked.
