/**
 * Resolves an array of FavoritePresetRef into concrete preset objects.
 * Ported from aqara-panel.ts:481-551 (`_getResolvedFavoritePresets`).
 *
 * Panel is the source of truth. Non-trivial divergences from the card's
 * old `_resolvedFavorites` (aqara-preset-favorites-card.ts:446-509):
 *  - The panel skips builtin presets that have been hidden via
 *    `_isBuiltinPresetHidden` (panel:491). That filter depends on user
 *    preferences and stays panel-side; this pure helper does not apply it.
 *    Callers (the panel) filter hidden refs upstream before calling
 *    resolveFavorites.
 *  - The panel does NOT filter by compatibility inside the resolver
 *    (it does that later, in `_renderFavoritesSection`). The card did.
 *    The shared module merges both concerns and applies `isPresetCompatible`
 *    as the final filter (panel's downstream rule).
 */

import type {
  FavoritePresetRef,
  AnyPreset,
  PresetsData,
  UserPresetsData,
  UserEffectPreset,
  UserSegmentPatternPreset,
  UserSegmentSequencePreset,
} from '../types';
import { isPresetCompatible } from './preset-compatibility';

export interface ResolvedFavorite {
  ref: FavoritePresetRef;
  preset: AnyPreset;
  isUser: boolean;
  deviceType?: string;
}

export function resolveFavorites(
  refs: FavoritePresetRef[],
  presets: PresetsData,
  userPresets: UserPresetsData,
  deviceTypes: string[],
): ResolvedFavorite[] {
  const resolved: ResolvedFavorite[] = [];

  for (const ref of refs) {
    let preset: AnyPreset | null = null;
    let isUser = false;
    let deviceType: string | undefined;

    switch (ref.type) {
      case 'effect': {
        for (const key of ['t2_bulb', 't1m', 't1_strip'] as const) {
          const found = presets.dynamic_effects?.[key]?.find(p => p.id === ref.id);
          if (found) { preset = found; deviceType = key; break; }
        }
        if (!preset) {
          const userPreset = userPresets.effect_presets?.find(p => p.id === ref.id);
          if (userPreset) {
            preset = userPreset;
            isUser = true;
            deviceType = (userPreset as UserEffectPreset).device_type;
          }
        }
        break;
      }
      case 'segment_pattern': {
        preset = presets.segment_patterns?.find(p => p.id === ref.id) || null;
        if (!preset) {
          const userPreset = userPresets.segment_pattern_presets?.find(p => p.id === ref.id);
          if (userPreset) {
            preset = userPreset;
            isUser = true;
            deviceType = (userPreset as UserSegmentPatternPreset).device_type;
          }
        }
        break;
      }
      case 'cct_sequence': {
        preset = presets.cct_sequences?.find(p => p.id === ref.id) || null;
        if (!preset) {
          preset = userPresets.cct_sequence_presets?.find(p => p.id === ref.id) || null;
          if (preset) isUser = true;
        }
        break;
      }
      case 'segment_sequence': {
        preset = presets.segment_sequences?.find(p => p.id === ref.id) || null;
        if (!preset) {
          const userPreset = userPresets.segment_sequence_presets?.find(p => p.id === ref.id);
          if (userPreset) {
            preset = userPreset;
            isUser = true;
            deviceType = (userPreset as UserSegmentSequencePreset).device_type;
          }
        }
        break;
      }
      case 'dynamic_scene': {
        preset = presets.dynamic_scenes?.find(p => p.id === ref.id) || null;
        if (!preset) {
          preset = userPresets.dynamic_scene_presets?.find(p => p.id === ref.id) || null;
          if (preset) isUser = true;
        }
        break;
      }
    }

    if (preset && isPresetCompatible(ref, deviceTypes, deviceType)) {
      resolved.push({ ref, preset, isUser, deviceType });
    }
  }

  return resolved;
}
