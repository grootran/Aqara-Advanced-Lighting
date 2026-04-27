import { describe, it, expect } from 'vitest';
import { filterActivePresets, type RunningOperation } from './card-running-ops';

describe('filterActivePresets', () => {
  it('returns empty map for empty/undefined operations', () => {
    expect(filterActivePresets(undefined, ['light.x']).size).toBe(0);
    expect(filterActivePresets([], ['light.x']).size).toBe(0);
  });

  it('matches effect operations via singular entity_id', () => {
    const ops: RunningOperation[] = [
      { type: 'effect', entity_id: 'light.x', preset_id: 'p1' },
    ];
    const m = filterActivePresets(ops, ['light.x']);
    expect(m.get('p1')).toBe('effect');
  });

  it('matches dynamic_scene operations via plural entity_ids', () => {
    const ops: RunningOperation[] = [
      { type: 'dynamic_scene', entity_ids: ['light.x', 'light.y'], preset_id: 'concert' },
    ];
    expect(filterActivePresets(ops, ['light.x']).get('concert')).toBe('dynamic_scene');
    expect(filterActivePresets(ops, ['light.y']).get('concert')).toBe('dynamic_scene');
    expect(filterActivePresets(ops, ['light.z']).has('concert')).toBe(false);
  });

  it('skips operations with no preset_id (e.g. music_sync)', () => {
    const ops: RunningOperation[] = [
      { type: 'music_sync', entity_id: 'light.x', preset_id: undefined } as RunningOperation,
    ];
    expect(filterActivePresets(ops, ['light.x']).size).toBe(0);
  });

  it('handles mixed effect + dynamic_scene operations on the same card', () => {
    const ops: RunningOperation[] = [
      { type: 'effect', entity_id: 'light.x', preset_id: 'rainbow' },
      { type: 'dynamic_scene', entity_ids: ['light.x'], preset_id: 'concert' },
    ];
    const m = filterActivePresets(ops, ['light.x']);
    expect(m.get('rainbow')).toBe('effect');
    expect(m.get('concert')).toBe('dynamic_scene');
    expect(m.size).toBe(2);
  });

  it('non-targeted entities filtered out for both shapes', () => {
    const ops: RunningOperation[] = [
      { type: 'effect', entity_id: 'light.other', preset_id: 'rainbow' },
      { type: 'dynamic_scene', entity_ids: ['light.other'], preset_id: 'concert' },
    ];
    expect(filterActivePresets(ops, ['light.x']).size).toBe(0);
  });
});
