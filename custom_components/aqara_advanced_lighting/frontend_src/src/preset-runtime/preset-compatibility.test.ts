import { describe, it, expect } from 'vitest';
import { getCapabilityFlags, isPresetCompatible } from './preset-compatibility';
import type { FavoritePresetRef } from '../types';

describe('getCapabilityFlags', () => {
  it('returns false flags for empty deviceTypes', () => {
    const flags = getCapabilityFlags([]);
    expect(flags.showDynamicEffects).toBe(false);
    expect(flags.showCCTSequences).toBe(false);
    expect(flags.showDynamicScenes).toBe(false);
  });

  it('enables RGB flags for t2_bulb', () => {
    const flags = getCapabilityFlags(['t2_bulb']);
    expect(flags.showDynamicEffects).toBe(true);
    expect(flags.showSegmentPatterns).toBe(false);
    expect(flags.showSegmentSequences).toBe(false);
    expect(flags.showCCTSequences).toBe(true);
    expect(flags.showDynamicScenes).toBe(true);
    expect(flags.showMusicSync).toBe(false);
    expect(flags.hasT2).toBe(true);
  });

  it('enables segment flags for t1m', () => {
    const flags = getCapabilityFlags(['t1m']);
    expect(flags.showSegmentPatterns).toBe(true);
    expect(flags.showSegmentSequences).toBe(true);
    expect(flags.hasT1M).toBe(true);
  });

  it('enables music sync only for t1_strip', () => {
    expect(getCapabilityFlags(['t1_strip']).showMusicSync).toBe(true);
    expect(getCapabilityFlags(['t1m']).showMusicSync).toBe(false);
    expect(getCapabilityFlags(['t2_bulb']).showMusicSync).toBe(false);
  });

  it('enables CCT for generic_cct only', () => {
    const flags = getCapabilityFlags(['generic_cct']);
    expect(flags.showCCTSequences).toBe(true);
    expect(flags.showDynamicScenes).toBe(true);
    expect(flags.showDynamicEffects).toBe(false);
  });
});

describe('isPresetCompatible', () => {
  const ref = (type: FavoritePresetRef['type'], id = 'p1'): FavoritePresetRef => ({ type, id });

  it('with empty deviceTypes, only universal preset types pass', () => {
    expect(isPresetCompatible(ref('cct_sequence'), [])).toBe(true);
    expect(isPresetCompatible(ref('dynamic_scene'), [])).toBe(true);
    expect(isPresetCompatible(ref('effect'), [])).toBe(false);
    expect(isPresetCompatible(ref('segment_pattern'), [])).toBe(false);
    expect(isPresetCompatible(ref('segment_sequence'), [])).toBe(false);
  });

  it('effect requires RGB', () => {
    expect(isPresetCompatible(ref('effect'), ['t2_bulb'])).toBe(true);
    expect(isPresetCompatible(ref('effect'), ['t1m'])).toBe(true);
    expect(isPresetCompatible(ref('effect'), ['t1_strip'])).toBe(true);
    expect(isPresetCompatible(ref('effect'), ['generic_rgb'])).toBe(false);
    expect(isPresetCompatible(ref('effect'), ['t2_cct'])).toBe(false);
    expect(isPresetCompatible(ref('effect'), ['generic_cct'])).toBe(false);
  });

  it('segment_pattern requires segment-capable device', () => {
    expect(isPresetCompatible(ref('segment_pattern'), ['t1m'])).toBe(true);
    expect(isPresetCompatible(ref('segment_pattern'), ['t1_strip'])).toBe(true);
    expect(isPresetCompatible(ref('segment_pattern'), ['t2_bulb'])).toBe(false);
  });

  it('respects per-preset deviceType when provided', () => {
    // A preset tagged for t2_bulb should not be compatible with a t1m-only target
    expect(isPresetCompatible(ref('effect'), ['t1m'], 't2_bulb')).toBe(false);
    expect(isPresetCompatible(ref('effect'), ['t2_bulb'], 't2_bulb')).toBe(true);
  });

  it('treats t1 device-type alias as t1m', () => {
    // A user preset with device_type='t1' (legacy) should still pass
    // compatibility against a t1m-targeted entity selection.
    expect(isPresetCompatible(ref('effect'), ['t1m'], 't1')).toBe(true);
    // But not against a non-t1m selection.
    expect(isPresetCompatible(ref('effect'), ['t2_bulb'], 't1')).toBe(false);
  });

  it('cct_sequence requires CCT-capable device', () => {
    expect(isPresetCompatible(ref('cct_sequence'), ['t2_cct'])).toBe(true);
    expect(isPresetCompatible(ref('cct_sequence'), ['t1m_white'])).toBe(true);
    expect(isPresetCompatible(ref('cct_sequence'), ['t1_strip'])).toBe(true);
    expect(isPresetCompatible(ref('cct_sequence'), ['generic_cct'])).toBe(true);
    expect(isPresetCompatible(ref('cct_sequence'), ['t1m'])).toBe(false); // t1m RGB endpoint, not white
  });

  it('dynamic_scene works on CCT-only lights (panel-aligned, broader than card)', () => {
    // Panel's _filterPresets returns showDynamicScenes: true for CCT-only lights.
    // Card's old check was RGB-only; this helper aligns with the panel.
    expect(isPresetCompatible(ref('dynamic_scene'), ['t2_cct'])).toBe(true);
    expect(isPresetCompatible(ref('dynamic_scene'), ['generic_cct'])).toBe(true);
    expect(isPresetCompatible(ref('dynamic_scene'), ['t1m_white'])).toBe(true);
  });
});
