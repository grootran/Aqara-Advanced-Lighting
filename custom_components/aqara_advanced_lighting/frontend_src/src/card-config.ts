/**
 * Aqara Preset Favorites — Card configuration types and migrations.
 *
 * This module owns the card config shape and any backward-compatibility
 * shims that translate older configs into the current schema. Both the
 * card element and its editor element import from here so the source of
 * truth lives in one place.
 */

export type CardLayout = 'grid' | 'compact-grid' | 'list' | 'hero' | 'carousel';

export interface AqaraFavoritesCardConfig {
  type: string;
  entity?: string;
  entities?: string[];
  title?: string;

  // Phase 2 - curation
  preset_ids?: string[];

  // Phase 2 - layout
  layout?: CardLayout;
  columns?: number;
  show_names?: boolean;
  highlight_user_presets?: boolean;

  // Phase 2 - brightness override
  brightness_override?: boolean;
  brightness_override_position?: 'header' | 'footer';

  // Deprecated - migrated on read
  compact?: boolean;
}

/**
 * Apply backward-compatibility normalizations to a card config.
 * Returns the original object reference if no migration was needed;
 * otherwise returns a new object with the migrated fields. Does not
 * mutate the input.
 *
 * Phase 2 migration: legacy `compact: true` config (without explicit
 * `layout`) is treated as `layout: 'compact-grid'` so existing cards
 * keep working after the layout enum is introduced.
 */
export function normalizeCardConfig(config: AqaraFavoritesCardConfig): AqaraFavoritesCardConfig {
  if (config.compact === true && config.layout === undefined) {
    return { ...config, layout: 'compact-grid' };
  }
  return config;
}

/**
 * Returns true when the configured layout uses the preset grid (so layout-
 * grid-only fields like `columns` apply). Treats `undefined` as grid (the
 * default when no layout is set). Convenience helper for runtime code in
 * Chunk 9.
 */
export function isGridLayout(layout: CardLayout | undefined): boolean {
  return layout === 'grid' || layout === 'compact-grid' || layout === undefined;
}

/**
 * Apply a new layout choice to a card config, also dropping the deprecated
 * `compact` field if present. Used by the editor when the user explicitly
 * picks a layout. Returns a new object; does not mutate the input.
 */
export function setCardLayout(
  config: AqaraFavoritesCardConfig,
  layout: CardLayout | undefined,
): AqaraFavoritesCardConfig {
  const next = { ...config };
  if (layout === undefined) {
    delete (next as Record<string, unknown>).layout;
  } else {
    next.layout = layout;
  }
  if (next.compact !== undefined) {
    delete (next as Record<string, unknown>).compact;
  }
  return next;
}
