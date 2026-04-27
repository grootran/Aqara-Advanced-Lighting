/**
 * Per-card preset curation for the Aqara Preset Favorites card.
 *
 * Extracted from `aqara-preset-favorites-card.ts:_applyCuration` so the pure
 * filter+order step is unit-testable without instantiating a Lit element.
 */

import type { ResolvedFavorite } from './preset-runtime/preset-resolver';

/**
 * Apply per-card curation to the resolved favorites list.
 *
 * When `presetIds` is set and non-empty, the result includes only the
 * presets in `presetIds`, in that exact order. Items in `presetIds` that
 * don't appear in `resolved` (preset deleted, no longer favorited, or
 * incompatible with the configured entities) are silently dropped.
 *
 * When `presetIds` is unset/undefined or empty, the resolved list is
 * returned unchanged (legacy "show all global favorites" behavior).
 */
export function applyCuration(
  resolved: ResolvedFavorite[],
  presetIds: readonly string[] | undefined,
): ResolvedFavorite[] {
  if (!presetIds || presetIds.length === 0) return resolved;
  const map = new Map(resolved.map(r => [r.ref.id, r]));
  const ordered: ResolvedFavorite[] = [];
  for (const id of presetIds) {
    const found = map.get(id);
    if (found) ordered.push(found);
  }
  return ordered;
}
