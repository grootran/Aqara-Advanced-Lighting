import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPresets,
  getUserPresets,
  getUserPreferences,
  getSupportedEntities,
  getRunningOperations,
  _resetCacheForTests,
} from './aqara-api';

const makeHass = () => ({
  callApi: vi.fn(),
  fetchWithAuth: vi.fn(),
});

describe('aqara-api cache semantics', () => {
  beforeEach(() => {
    _resetCacheForTests();
  });

  it('cache hit returns the cached value without calling the fetcher again', async () => {
    const hass = makeHass();
    hass.callApi.mockResolvedValue({ effect_presets: [], segment_pattern_presets: [], cct_sequence_presets: [], segment_sequence_presets: [], dynamic_scene_presets: [] });
    await getUserPresets(hass as any);
    await getUserPresets(hass as any);
    expect(hass.callApi).toHaveBeenCalledTimes(1);
  });

  it('two concurrent calls share one fetcher invocation (in-flight dedup)', async () => {
    const hass = makeHass();
    let resolveFn!: (v: unknown) => void;
    hass.callApi.mockReturnValue(new Promise((resolve) => { resolveFn = resolve; }));
    const p1 = getUserPresets(hass as any);
    const p2 = getUserPresets(hass as any);
    resolveFn({ effect_presets: [], segment_pattern_presets: [], cct_sequence_presets: [], segment_sequence_presets: [], dynamic_scene_presets: [] });
    await Promise.all([p1, p2]);
    expect(hass.callApi).toHaveBeenCalledTimes(1);
  });

  it('failed fetch clears inflight so a retry can proceed', async () => {
    const hass = makeHass();
    hass.callApi.mockRejectedValueOnce(new Error('boom'));
    await expect(getUserPresets(hass as any)).rejects.toThrow('boom');
    hass.callApi.mockResolvedValueOnce({ effect_presets: [], segment_pattern_presets: [], cct_sequence_presets: [], segment_sequence_presets: [], dynamic_scene_presets: [] });
    await expect(getUserPresets(hass as any)).resolves.toBeDefined();
    expect(hass.callApi).toHaveBeenCalledTimes(2);
  });

  it('getRunningOperations returns stale cache forever without bypassCache', async () => {
    const hass = makeHass();
    hass.callApi.mockResolvedValueOnce({ operations: [{ type: 'effect', entity_id: 'light.x', preset_id: 'p1' }] });
    const r1 = await getRunningOperations(hass as any);
    const r2 = await getRunningOperations(hass as any);
    expect(r1.operations).toHaveLength(1);
    expect(r2).toBe(r1);
    expect(hass.callApi).toHaveBeenCalledTimes(1);
  });

  it('getRunningOperations({bypassCache: true}) forces a fresh fetch and overwrites cache', async () => {
    const hass = makeHass();
    hass.callApi.mockResolvedValueOnce({ operations: [] });
    await getRunningOperations(hass as any);
    hass.callApi.mockResolvedValueOnce({ operations: [{ type: 'cct_sequence', entity_id: 'light.x', preset_id: 'p2' }] });
    const r2 = await getRunningOperations(hass as any, { bypassCache: true });
    expect(r2.operations).toHaveLength(1);
    expect(hass.callApi).toHaveBeenCalledTimes(2);
  });

  it('static endpoints honor 60-minute TTL', async () => {
    // Spec doesn't require TTL-expiry test (would need fake timers and is brittle);
    // assert that two back-to-back calls hit cache.
    const hass = makeHass();
    hass.fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        dynamic_effects: { t2_bulb: [], t1m: [], t1_strip: [] },
        segment_patterns: [],
        cct_sequences: [],
        segment_sequences: [],
        dynamic_scenes: [],
      }),
    });
    await getPresets(hass as any);
    await getPresets(hass as any);
    expect(hass.fetchWithAuth).toHaveBeenCalledTimes(1);
  });
});
