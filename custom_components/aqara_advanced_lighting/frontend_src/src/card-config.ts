/**
 * Aqara Preset Favorites — Card configuration types and migrations.
 *
 * This module owns the card config shape and any backward-compatibility
 * shims that translate older configs into the current schema. Both the
 * card element and its editor element import from here so the source of
 * truth lives in one place.
 */

export interface AqaraFavoritesCardConfig {
  type: string;
  entity?: string;
  entities?: string[];
  title?: string;
  columns?: number;
  show_names?: boolean;
  highlight_user_presets?: boolean;
  compact?: boolean;
}

/**
 * Apply backward-compatibility normalizations to a card config.
 * Returns the original object reference if no migration was needed;
 * otherwise returns a new object with the migrated fields. Does not
 * mutate the input.
 *
 * Phase 2 will add `compact: true` -> `layout: 'compact-grid'` migration
 * here. For now this is identity.
 */
export function normalizeCardConfig(config: AqaraFavoritesCardConfig): AqaraFavoritesCardConfig {
  return config;
}
