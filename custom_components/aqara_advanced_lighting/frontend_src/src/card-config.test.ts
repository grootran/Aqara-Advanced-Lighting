import { describe, it, expect } from 'vitest';
import {
  normalizeCardConfig,
  isGridLayout,
  setCardLayout,
  type AqaraFavoritesCardConfig,
} from './card-config';

describe('normalizeCardConfig', () => {
  it('returns the original reference when no migration is needed', () => {
    const config: AqaraFavoritesCardConfig = { type: 'aqara-card', entity: 'light.x' };
    expect(normalizeCardConfig(config)).toBe(config);
  });

  it('returns the original reference when compact is false', () => {
    const config: AqaraFavoritesCardConfig = { type: 'aqara-card', entity: 'light.x', compact: false };
    expect(normalizeCardConfig(config)).toBe(config);
  });

  it('migrates compact: true (no layout) to layout: compact-grid', () => {
    const config: AqaraFavoritesCardConfig = { type: 'aqara-card', entity: 'light.x', compact: true };
    const result = normalizeCardConfig(config);
    expect(result).not.toBe(config); // new object
    expect(result.layout).toBe('compact-grid');
    expect(result.compact).toBe(true); // input still has it; not stripped here
  });

  it('does not migrate when layout is explicitly set even with compact: true', () => {
    const config: AqaraFavoritesCardConfig = { type: 'aqara-card', entity: 'light.x', compact: true, layout: 'list' };
    expect(normalizeCardConfig(config)).toBe(config);
    expect(config.layout).toBe('list');
  });

  it('preserves unknown fields (forward compatibility)', () => {
    const config = { type: 'aqara-card', entity: 'light.x', compact: true, custom_future_field: 42 } as any;
    const result = normalizeCardConfig(config);
    expect((result as any).custom_future_field).toBe(42);
  });
});

describe('isGridLayout', () => {
  it('returns true for undefined (default)', () => {
    expect(isGridLayout(undefined)).toBe(true);
  });

  it('returns true for grid and compact-grid', () => {
    expect(isGridLayout('grid')).toBe(true);
    expect(isGridLayout('compact-grid')).toBe(true);
  });

  it('returns false for non-grid layouts', () => {
    expect(isGridLayout('list')).toBe(false);
    expect(isGridLayout('hero')).toBe(false);
    expect(isGridLayout('carousel')).toBe(false);
  });
});

describe('setCardLayout', () => {
  it('sets layout and drops compact', () => {
    const config: AqaraFavoritesCardConfig = { type: 'aqara-card', entity: 'light.x', compact: true };
    const result = setCardLayout(config, 'list');
    expect(result.layout).toBe('list');
    expect(result.compact).toBeUndefined();
    expect(result).not.toBe(config); // non-mutating
  });

  it('clears layout when undefined', () => {
    const config: AqaraFavoritesCardConfig = { type: 'aqara-card', entity: 'light.x', layout: 'list' };
    const result = setCardLayout(config, undefined);
    expect(result.layout).toBeUndefined();
  });

  it('preserves other fields', () => {
    const config: AqaraFavoritesCardConfig = { type: 'aqara-card', entity: 'light.x', title: 'My Card', preset_ids: ['a', 'b'] };
    const result = setCardLayout(config, 'hero');
    expect(result.title).toBe('My Card');
    expect(result.preset_ids).toEqual(['a', 'b']);
  });
});
