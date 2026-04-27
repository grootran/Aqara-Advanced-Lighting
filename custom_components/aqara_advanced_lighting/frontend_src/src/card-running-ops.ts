/**
 * Aqara Preset Favorites Card — running-operations subscription wrapper.
 *
 * Subscribes to the backend's `aqara_advanced_lighting_operations_changed`
 * event and refetches `getRunningOperations({bypassCache: true})` on each
 * event, invoking the supplied callback with a Map<preset_id -> op type>
 * filtered to the entities the card targets.
 *
 * Spec Section 1.3: subscription-only model with no periodic polling
 * fallback. If the initial subscribe fails, the caller falls back to
 * `fetchRunningOnceOnAction` after each user-visible activate/stop. Failures
 * are logged once per page load via the module-scoped flags below.
 */

import type { HomeAssistant } from './types';
import { getRunningOperations } from './data-client/aqara-api';

const EVENT_NAME = 'aqara_advanced_lighting_operations_changed';

// Module-scoped flags: log subscription/refetch failures only once per page
// load (spec Section 1.3) so a sustained outage does not spam the console.
let _subscriptionFailureLogged = false;
let _refetchFailureLogged = false;

export interface RunningOperation {
  type: string;
  entity_id?: string;
  entity_ids?: string[];
  preset_id?: string;
  [k: string]: unknown;
}

/**
 * Filter a running-operations response to active presets on the given entities.
 * Returns a map of preset_id -> operation type.
 *
 * Operation entity-field shape varies by type:
 * - effect, cct_sequence, segment_sequence, music_sync, circadian use `entity_id` (string)
 * - dynamic_scene uses `entity_ids` (string[]) because scenes are grouped
 *   per-scene rather than per-entity (panel.py:2144).
 *
 * An operation is "on" the configured entities if either:
 * - its `entity_id` is in the entitySet, OR
 * - any element of its `entity_ids` is in the entitySet.
 */
export function filterActivePresets(
  operations: RunningOperation[] | undefined,
  entityIds: string[],
): Map<string, string> {
  const entitySet = new Set(entityIds);
  const active = new Map<string, string>();
  if (!operations) return active;
  for (const op of operations) {
    if (!op.preset_id) continue;
    const matchesEntity =
      (typeof op.entity_id === 'string' && entitySet.has(op.entity_id)) ||
      (Array.isArray(op.entity_ids) && op.entity_ids.some((eid) => entitySet.has(eid)));
    if (matchesEntity) {
      active.set(op.preset_id, op.type);
    }
  }
  return active;
}

/**
 * Subscribe to running-operations changes for the given entities.
 *
 * Resolves with an unsubscribe function only when the subscription is live.
 * Rejects (with the error already logged once per page load) if either the
 * initial getRunningOperations fetch fails or the WebSocket subscribeEvents
 * call rejects. Callers should treat a rejection as a signal to enable
 * degraded mode (one-shot fetches on user actions).
 *
 * Per spec Section 1.3: subscription-only commitment, no periodic polling
 * fallback under any condition.
 */
export async function subscribeRunningOperations(
  hass: HomeAssistant,
  entityIds: string[],
  callback: (active: Map<string, string>) => void,
): Promise<() => void> {
  let unsub: (() => void) | undefined;

  const refresh = async (): Promise<void> => {
    try {
      const resp = await getRunningOperations(hass, { bypassCache: true });
      callback(filterActivePresets(resp.operations as RunningOperation[] | undefined, entityIds));
    } catch (err) {
      if (!_refetchFailureLogged) {
        console.error('subscribeRunningOperations: refetch failed', err);
        _refetchFailureLogged = true;
      }
    }
  };

  // Initial fetch so the UI reflects current state immediately.
  await refresh();

  try {
    unsub = await hass.connection.subscribeEvents(refresh, EVENT_NAME);
  } catch (err) {
    if (!_subscriptionFailureLogged) {
      console.error('subscribeRunningOperations: subscribe failed; degraded mode', err);
      _subscriptionFailureLogged = true;
    }
    // Re-throw so the caller can flip into degraded mode. Without this the
    // caller's try/catch never sees the failure and silently returns a no-op
    // unsubscribe, leaving neither real-time updates nor degraded fallback.
    throw err;
  }

  return () => {
    if (unsub) {
      unsub();
      unsub = undefined;
    }
  };
}

/**
 * One-shot fetch helper for the degraded path. Call after a user-visible
 * activation/stop when the subscription is unavailable so the UI still
 * refreshes promptly without periodic polling.
 *
 * Silent on failure - the card stays functional with stale state until the
 * next user action.
 */
export async function fetchRunningOnceOnAction(
  hass: HomeAssistant,
  entityIds: string[],
  callback: (active: Map<string, string>) => void,
): Promise<void> {
  const resp = await getRunningOperations(hass, { bypassCache: true }).catch(() => undefined);
  if (!resp) return;
  callback(filterActivePresets(resp.operations as RunningOperation[] | undefined, entityIds));
}
