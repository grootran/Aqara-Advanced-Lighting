import { describe, it, expect } from 'vitest';
import { resolveFavorites } from './preset-resolver';
import type {
  FavoritePresetRef,
  PresetsData,
  UserPresetsData,
  DynamicEffectPreset,
  SegmentPatternPreset,
  CCTSequencePreset,
  SegmentSequencePreset,
  DynamicScenePreset,
  UserEffectPreset,
  UserSegmentPatternPreset,
  UserCCTSequencePreset,
  UserSegmentSequencePreset,
  UserDynamicScenePreset,
} from '../types';

const emptyPresets = (): PresetsData => ({
  dynamic_effects: { t2_bulb: [], t1m: [], t1_strip: [] },
  segment_patterns: [],
  cct_sequences: [],
  segment_sequences: [],
  dynamic_scenes: [],
});

const emptyUserPresets = (): UserPresetsData => ({
  effect_presets: [],
  segment_pattern_presets: [],
  cct_sequence_presets: [],
  segment_sequence_presets: [],
  dynamic_scene_presets: [],
});

describe('resolveFavorites', () => {
  it('resolves a built-in effect for t2_bulb', () => {
    const refs: FavoritePresetRef[] = [{ type: 'effect', id: 'rainbow' }];
    const presets = emptyPresets();
    presets.dynamic_effects.t2_bulb = [
      { id: 'rainbow', name: 'Rainbow' } as DynamicEffectPreset,
    ];
    const resolved = resolveFavorites(refs, presets, emptyUserPresets(), ['t2_bulb']);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].ref.id).toBe('rainbow');
    expect(resolved[0].isUser).toBe(false);
    expect(resolved[0].deviceType).toBe('t2_bulb');
  });

  it('resolves a built-in effect for t1m', () => {
    const refs: FavoritePresetRef[] = [{ type: 'effect', id: 'wave' }];
    const presets = emptyPresets();
    presets.dynamic_effects.t1m = [
      { id: 'wave', name: 'Wave' } as DynamicEffectPreset,
    ];
    const resolved = resolveFavorites(refs, presets, emptyUserPresets(), ['t1m']);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].deviceType).toBe('t1m');
  });

  it('resolves a built-in segment_pattern', () => {
    const refs: FavoritePresetRef[] = [{ type: 'segment_pattern', id: 'p1' }];
    const presets = emptyPresets();
    presets.segment_patterns = [{ id: 'p1', name: 'Pattern 1' } as SegmentPatternPreset];
    const resolved = resolveFavorites(refs, presets, emptyUserPresets(), ['t1m']);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].isUser).toBe(false);
    expect(resolved[0].deviceType).toBeUndefined();
  });

  it('resolves a built-in cct_sequence', () => {
    const refs: FavoritePresetRef[] = [{ type: 'cct_sequence', id: 'morning' }];
    const presets = emptyPresets();
    presets.cct_sequences = [{ id: 'morning', name: 'Morning' } as CCTSequencePreset];
    const resolved = resolveFavorites(refs, presets, emptyUserPresets(), ['t2_cct']);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].isUser).toBe(false);
  });

  it('resolves a built-in segment_sequence', () => {
    const refs: FavoritePresetRef[] = [{ type: 'segment_sequence', id: 's1' }];
    const presets = emptyPresets();
    presets.segment_sequences = [{ id: 's1', name: 'Seq 1' } as SegmentSequencePreset];
    const resolved = resolveFavorites(refs, presets, emptyUserPresets(), ['t1m']);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].isUser).toBe(false);
  });

  it('resolves a built-in dynamic_scene', () => {
    const refs: FavoritePresetRef[] = [{ type: 'dynamic_scene', id: 'sunset' }];
    const presets = emptyPresets();
    presets.dynamic_scenes = [{ id: 'sunset', name: 'Sunset' } as DynamicScenePreset];
    const resolved = resolveFavorites(refs, presets, emptyUserPresets(), ['t2_bulb']);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].isUser).toBe(false);
  });

  it('resolves a user effect with deviceType from preset', () => {
    const refs: FavoritePresetRef[] = [{ type: 'effect', id: 'u1' }];
    const userPresets = emptyUserPresets();
    userPresets.effect_presets = [
      { id: 'u1', name: 'My Effect', device_type: 't2_bulb' } as UserEffectPreset,
    ];
    const resolved = resolveFavorites(refs, emptyPresets(), userPresets, ['t2_bulb']);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].isUser).toBe(true);
    expect(resolved[0].deviceType).toBe('t2_bulb');
  });

  it('resolves a user segment_pattern with deviceType', () => {
    const refs: FavoritePresetRef[] = [{ type: 'segment_pattern', id: 'up1' }];
    const userPresets = emptyUserPresets();
    userPresets.segment_pattern_presets = [
      { id: 'up1', name: 'My Pattern', device_type: 't1m' } as UserSegmentPatternPreset,
    ];
    const resolved = resolveFavorites(refs, emptyPresets(), userPresets, ['t1m']);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].isUser).toBe(true);
    expect(resolved[0].deviceType).toBe('t1m');
  });

  it('resolves a user cct_sequence (no deviceType on preset)', () => {
    const refs: FavoritePresetRef[] = [{ type: 'cct_sequence', id: 'uc1' }];
    const userPresets = emptyUserPresets();
    userPresets.cct_sequence_presets = [
      { id: 'uc1', name: 'My CCT' } as UserCCTSequencePreset,
    ];
    const resolved = resolveFavorites(refs, emptyPresets(), userPresets, ['t2_cct']);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].isUser).toBe(true);
    expect(resolved[0].deviceType).toBeUndefined();
  });

  it('resolves a user segment_sequence with deviceType', () => {
    const refs: FavoritePresetRef[] = [{ type: 'segment_sequence', id: 'us1' }];
    const userPresets = emptyUserPresets();
    userPresets.segment_sequence_presets = [
      { id: 'us1', name: 'My Seg', device_type: 't1_strip' } as UserSegmentSequencePreset,
    ];
    const resolved = resolveFavorites(refs, emptyPresets(), userPresets, ['t1_strip']);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].isUser).toBe(true);
    expect(resolved[0].deviceType).toBe('t1_strip');
  });

  it('resolves a user dynamic_scene', () => {
    const refs: FavoritePresetRef[] = [{ type: 'dynamic_scene', id: 'ud1' }];
    const userPresets = emptyUserPresets();
    userPresets.dynamic_scene_presets = [
      { id: 'ud1', name: 'My Scene' } as UserDynamicScenePreset,
    ];
    const resolved = resolveFavorites(refs, emptyPresets(), userPresets, ['t2_bulb']);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].isUser).toBe(true);
  });

  it('drops a ref whose preset cannot be found', () => {
    const refs: FavoritePresetRef[] = [{ type: 'effect', id: 'missing' }];
    const resolved = resolveFavorites(refs, emptyPresets(), emptyUserPresets(), ['t2_bulb']);
    expect(resolved).toHaveLength(0);
  });

  it('drops a ref whose preset is not compatible with deviceTypes', () => {
    // A built-in t2_bulb effect should be dropped when only a t1_strip is selected with no matching preset there
    const refs: FavoritePresetRef[] = [{ type: 'effect', id: 'rainbow' }];
    const presets = emptyPresets();
    presets.dynamic_effects.t2_bulb = [
      { id: 'rainbow', name: 'Rainbow' } as DynamicEffectPreset,
    ];
    // Selected device is t1_strip only; preset's resolved deviceType is t2_bulb -> incompatible
    const resolved = resolveFavorites(refs, presets, emptyUserPresets(), ['t1_strip']);
    expect(resolved).toHaveLength(0);
  });

  it('drops an effect ref when only CCT-only devices are selected', () => {
    const refs: FavoritePresetRef[] = [{ type: 'effect', id: 'rainbow' }];
    const presets = emptyPresets();
    presets.dynamic_effects.t2_bulb = [
      { id: 'rainbow', name: 'Rainbow' } as DynamicEffectPreset,
    ];
    const resolved = resolveFavorites(refs, presets, emptyUserPresets(), ['t2_cct']);
    expect(resolved).toHaveLength(0);
  });

  it('preserves order of favorites in result', () => {
    const refs: FavoritePresetRef[] = [
      { type: 'cct_sequence', id: 'c1' },
      { type: 'dynamic_scene', id: 'd1' },
    ];
    const presets = emptyPresets();
    presets.cct_sequences = [{ id: 'c1', name: 'C1' } as CCTSequencePreset];
    presets.dynamic_scenes = [{ id: 'd1', name: 'D1' } as DynamicScenePreset];
    const resolved = resolveFavorites(refs, presets, emptyUserPresets(), ['t2_bulb']);
    expect(resolved.map(r => r.ref.id)).toEqual(['c1', 'd1']);
  });
});
