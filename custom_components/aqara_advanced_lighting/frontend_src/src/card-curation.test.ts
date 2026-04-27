import { describe, it, expect } from 'vitest';
import { applyCuration } from './card-curation';
import type { ResolvedFavorite } from './preset-runtime/preset-resolver';

const fav = (id: string): ResolvedFavorite => ({
  ref: { type: 'effect', id },
  preset: { id, name: id } as any,
  isUser: false,
});

describe('applyCuration', () => {
  it('returns the input unchanged when presetIds is undefined', () => {
    const resolved = [fav('a'), fav('b')];
    expect(applyCuration(resolved, undefined)).toBe(resolved);
  });

  it('returns the input unchanged when presetIds is empty', () => {
    const resolved = [fav('a'), fav('b')];
    expect(applyCuration(resolved, [])).toBe(resolved);
  });

  it('filters and orders by presetIds when set', () => {
    const resolved = [fav('a'), fav('b'), fav('c'), fav('d')];
    const result = applyCuration(resolved, ['c', 'a']);
    expect(result.map(r => r.ref.id)).toEqual(['c', 'a']);
  });

  it('silently drops IDs in presetIds that do not resolve', () => {
    const resolved = [fav('a'), fav('b')];
    const result = applyCuration(resolved, ['a', 'missing', 'b']);
    expect(result.map(r => r.ref.id)).toEqual(['a', 'b']);
  });

  it('returns empty array when presetIds matches none of resolved', () => {
    const resolved = [fav('a'), fav('b')];
    const result = applyCuration(resolved, ['x', 'y']);
    expect(result).toEqual([]);
  });
});
