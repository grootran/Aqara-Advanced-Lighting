/**
 * Shared API client for the Aqara Advanced Lighting integration.
 *
 * Owns a single module-level cache for static (presets, supported entities)
 * and short-lived user (user_presets, user_preferences) endpoints. The cache
 * is shared across all callers (card instances and the panel's favorites
 * code path), so endpoints are fetched once per TTL window and reused.
 *
 * In-flight deduplication: concurrent calls for the same endpoint share a
 * single underlying network request (Promise) and resolve to the same data.
 *
 * Cache bypass: every getter accepts an optional `{ bypassCache: true }`
 * option. Callers that just mutated server state (POST/PUT/DELETE) should
 * pass it on the subsequent refresh so the cached entry and any in-flight
 * request are cleared, forcing a guaranteed-fresh fetch.
 *
 * Phase 1 scope: this client is consumed by the card and the panel's
 * favorites-related call sites only. Other panel call sites continue to
 * use direct hass.callApi / hass.fetchWithAuth.
 */
import type { HomeAssistant } from '../types';
import type { PresetsData, UserPresetsData, UserPreferences } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheOpts {
  bypassCache?: boolean;
}

const CACHE_TTL_STATIC = 60 * 60 * 1000; // 60 min
const CACHE_TTL_USER = 2 * 60 * 1000; //  2 min

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function getCached<T>(key: string, ttl: number): T | undefined {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < ttl) return entry.data as T;
  return undefined;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Clear both the cached entry and any in-flight request for `key`. Used by
 * the `bypassCache` option to guarantee the next fetcher call hits the
 * network rather than reusing a Promise that started before the bypass.
 */
function clearCache(key: string): void {
  cache.delete(key);
  inflight.delete(key);
}

async function cachedFetch<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = getCached<T>(key, ttl);
  if (cached !== undefined) return cached;
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const promise = fetcher()
    .then((result) => {
      setCache(key, result);
      return result;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

/**
 * Fetch built-in presets data. Uses fetchWithAuth because this endpoint
 * returns raw JSON (not the callApi wrapper format). 60-minute TTL.
 */
export async function getPresets(
  hass: HomeAssistant,
  opts: CacheOpts = {},
): Promise<PresetsData> {
  if (opts.bypassCache) clearCache('presets');
  return cachedFetch('presets', CACHE_TTL_STATIC, async () => {
    const resp = await hass.fetchWithAuth('/api/aqara_advanced_lighting/presets');
    if (!resp.ok) throw new Error(`Presets fetch failed: ${resp.status}`);
    return resp.json() as Promise<PresetsData>;
  });
}

/** Fetch the user's custom presets. 2-minute TTL. */
export async function getUserPresets(
  hass: HomeAssistant,
  opts: CacheOpts = {},
): Promise<UserPresetsData> {
  if (opts.bypassCache) clearCache('user_presets');
  return cachedFetch('user_presets', CACHE_TTL_USER, () =>
    hass.callApi<UserPresetsData>('GET', 'aqara_advanced_lighting/user_presets'),
  );
}

/** Fetch the user's preferences (incl. favorite presets). 2-minute TTL. */
export async function getUserPreferences(
  hass: HomeAssistant,
  opts: CacheOpts = {},
): Promise<UserPreferences> {
  if (opts.bypassCache) clearCache('user_preferences');
  return cachedFetch('user_preferences', CACHE_TTL_USER, () =>
    hass.callApi<UserPreferences>('GET', 'aqara_advanced_lighting/user_preferences'),
  );
}

/**
 * Response shape from the supported_entities endpoint. The card only consumes
 * `entities`, but the panel additionally consumes `light_groups` and `instances`
 * from the same response. Fields match the backend (panel.py SupportedEntitiesView).
 */
interface SupportedEntityItem {
  entity_id: string;
  device_type: string;
  model_id: string;
  z2m_friendly_name: string;
  ieee_address?: string;
  segment_count?: number;
  entry_id?: string;
}

interface LightGroupItem {
  entity_id: string;
  friendly_name: string;
  is_group: boolean;
  device_type: string;
  member_count: number;
  member_ids?: string[];
  member_device_types?: string[];
}

interface Z2MInstanceItem {
  entry_id: string;
  title: string;
  backend_type: string;
  z2m_base_topic: string | null;
  device_counts: {
    t2_rgb: number;
    t2_cct: number;
    t1m: number;
    t1_strip: number;
    other: number;
    total: number;
  };
  devices: string[];
}

interface SupportedEntitiesResp {
  entities: SupportedEntityItem[];
  light_groups?: LightGroupItem[];
  instances?: Z2MInstanceItem[];
}

/** Fetch the list of supported entities, light groups, and instances. 60-minute TTL. */
export async function getSupportedEntities(
  hass: HomeAssistant,
  opts: CacheOpts = {},
): Promise<SupportedEntitiesResp> {
  if (opts.bypassCache) clearCache('supported_entities');
  return cachedFetch('supported_entities', CACHE_TTL_STATIC, () =>
    hass.callApi<SupportedEntitiesResp>('GET', 'aqara_advanced_lighting/supported_entities'),
  );
}

interface RunningOpsResp {
  operations: Array<{
    type: string;
    entity_id: string;
    preset_id?: string;
    [k: string]: unknown;
  }>;
}

/**
 * Fetch running operations.
 *
 * Caching semantics differ from the static-data getters: there is no TTL.
 * - With `bypassCache: false` (default), returns the cached entry if one
 *   exists (no expiration check). Falls back to a fresh fetch only if no
 *   entry exists yet (e.g. on first call).
 * - With `bypassCache: true`, forces a fresh fetch and overwrites the cache.
 *   Uses the shared `clearCache` helper so any in-flight request is also
 *   discarded, matching the bypass semantics of the other getters.
 *
 * The subscription mechanism (Chunk 6: subscribeRunningOperations) is the
 * primary freshness driver; this function is invoked only on initial load
 * and on user actions where freshness must be forced. Concurrent forced
 * refreshes are not expected, so this function intentionally skips the
 * inflight-dedup pattern used by the other getters. If that assumption
 * changes, add dedup the same way `cachedFetch` does it.
 */
export async function getRunningOperations(
  hass: HomeAssistant,
  opts: CacheOpts = {},
): Promise<RunningOpsResp> {
  if (opts.bypassCache) {
    clearCache('running_operations');
  } else {
    const cached = cache.get('running_operations');
    if (cached) return cached.data as RunningOpsResp;
  }
  const data = await hass.callApi<RunningOpsResp>(
    'GET',
    'aqara_advanced_lighting/running_operations',
  );
  setCache('running_operations', data);
  return data;
}

/** Test-only helper: clear the entire cache and inflight map. */
export function _resetCacheForTests(): void {
  cache.clear();
  inflight.clear();
}
