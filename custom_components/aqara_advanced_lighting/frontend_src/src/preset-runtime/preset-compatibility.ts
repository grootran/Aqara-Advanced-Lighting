import type { FavoritePresetRef, FilteredPresets } from '../types';

/**
 * Returns capability flags from a list of selected entity device types.
 * Mirrors aqara-panel.ts:1399-1438 (_filterPresets) but without the
 * `t2Presets` / `t1mPresets` / `t1StripPresets` arrays - those depend on
 * the loaded PresetsData and stay in the panel via a thin wrapper.
 *
 * Panel is the source of truth: showDynamicEffects requires Aqara hardware
 * (t2_bulb, t1m, t1_strip) - generic_rgb does NOT enable effects (effects
 * use MQTT custom converters or ZHA cluster writes; Aqara-only).
 */
export function getCapabilityFlags(deviceTypes: string[]): FilteredPresets {
  const hasSelection = deviceTypes.length > 0;
  const hasT2 = deviceTypes.includes('t2_bulb');
  const hasT2CCT = deviceTypes.includes('t2_cct');
  const hasT1M = deviceTypes.includes('t1m');
  const hasT1MWhite = deviceTypes.includes('t1m_white');
  const hasT1Strip = deviceTypes.includes('t1_strip');
  const hasGenericRGB = deviceTypes.includes('generic_rgb');
  const hasGenericCCT = deviceTypes.includes('generic_cct');

  return {
    // Effects, segment patterns, segment sequences: Aqara-only (require MQTT)
    showDynamicEffects: hasSelection && (hasT2 || hasT1M || hasT1Strip),
    showSegmentPatterns: hasSelection && (hasT1M || hasT1Strip),
    showSegmentSequences: hasSelection && (hasT1M || hasT1Strip),
    // CCT sequences: Aqara + generic lights with color_temp support
    showCCTSequences: hasSelection && (hasT2 || hasT2CCT || hasT1MWhite || hasT1Strip || hasGenericRGB || hasGenericCCT),
    // Dynamic scenes: Any light with color capability (RGB or CCT - backend adapts colors)
    showDynamicScenes: hasSelection && (hasT2 || hasT2CCT || hasT1M || hasT1MWhite || hasT1Strip || hasGenericRGB || hasGenericCCT),
    // Music sync: T1 Strip only
    showMusicSync: hasSelection && hasT1Strip,
    hasT2,
    hasT1M,
    hasT1Strip,
    t2Presets: [],
    t1mPresets: [],
    t1StripPresets: [],
  };
}

/**
 * Returns a per-ref boolean: is this favorite preset usable on the given target?
 * Ports from aqara-panel.ts:4149-4178 (the inline `isDeviceCompatible` closure
 * inside `_renderFavoritesSection`), aligning with the panel's broader rules.
 *
 * Behavior moved from card to match panel:
 *  - dynamic_scene now also passes for CCT-only lights (panel's
 *    showDynamicScenes is true for CCT lights; card's old check was RGB-only)
 *  - effect requires hardware Aqara devices (matches panel's showDynamicEffects);
 *    card's old check incorrectly accepted generic_rgb
 *
 * @param ref - the favorite reference (type + id)
 * @param deviceTypes - device types of all selected entities (deduped)
 * @param presetDeviceType - optional device type the preset is tagged for
 *   (user effects/patterns/sequences carry this; built-in CCT and dynamic
 *   scenes do not)
 */
export function isPresetCompatible(
  ref: FavoritePresetRef,
  deviceTypes: string[],
  presetDeviceType?: string,
): boolean {
  if (deviceTypes.length === 0) {
    return ref.type === 'cct_sequence' || ref.type === 'dynamic_scene';
  }

  const flags = getCapabilityFlags(deviceTypes);

  // Per-preset device-type compatibility check (panel:4159-4167)
  const isDeviceTypeMatch = (dt: string | undefined): boolean => {
    if (!dt) return true;
    switch (dt) {
      case 't2_bulb': return flags.hasT2;
      case 't1m':
      case 't1':
        return flags.hasT1M;
      case 't1_strip': return flags.hasT1Strip;
      default: return true;
    }
  };

  // Mirrors panel:4170-4178 switch
  switch (ref.type) {
    case 'effect': return flags.showDynamicEffects && isDeviceTypeMatch(presetDeviceType);
    case 'segment_pattern': return flags.showSegmentPatterns && isDeviceTypeMatch(presetDeviceType);
    case 'cct_sequence': return flags.showCCTSequences;
    case 'segment_sequence': return flags.showSegmentSequences && isDeviceTypeMatch(presetDeviceType);
    case 'dynamic_scene': return flags.showDynamicScenes;
    default: return false;
  }
}
