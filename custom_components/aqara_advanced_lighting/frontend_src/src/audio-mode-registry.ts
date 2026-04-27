/**
 * Shared audio-mode-registry helpers.
 *
 * Single source of truth for scene-side audio mode metadata is the Python
 * MODE_REGISTRY in audio_mode_handlers.py, exposed via the REST endpoint
 * /api/aqara_advanced_lighting/audio_mode_registry. This module provides
 * the fetch, tier-detection, and options-transformation helpers that every
 * frontend component rendering the mode dropdown should use.
 *
 * Using these helpers from every consumer ensures there is no TypeScript-
 * internal drift: adding a new mode in Python automatically propagates to
 * all dropdowns with zero TS changes. Do not create a parallel hardcoded
 * options array in any component.
 */

import type { HomeAssistant } from './types';

/**
 * One mode entry as returned by the backend.
 */
export interface AudioModeEntry {
  constant: string;
  requires_pro: boolean;
  display_label: string;
  /**
   * Hidden modes are filtered out of user-facing dropdowns by
   * buildAudioModeOptions(). The backend still dispatches the handler if
   * an existing scene's config references the mode value, so existing
   * scenes continue to work; users just can't pick the mode for new
   * scenes. Used to descope in-progress features from a release without
   * ripping out underlying code.
   *
   * Optional in the type so older backends that pre-date the field still
   * deserialise — undefined is treated as "not hidden".
   */
  hidden?: boolean;
}

/**
 * Pro-tier companion-sensor entity_id suffixes. Used by device-tier
 * detection: if a device exposes any entity whose entity_id ends with
 * one of these, it's a pro-tier audio device.
 *
 * The codebase's HomeAssistant type exposes entities without unique_id,
 * so we match against entity_id (underscore-prefixed) rather than
 * unique_id (hyphen-prefixed). Slightly less robust against user renames
 * but avoids a WebSocket call to the extended entity registry.
 *
 * Keep in sync with COMPANION_*_SUFFIXES in audio_discovery.py.
 */
export const PRO_TIER_ENTITY_ID_SUFFIXES = [
  '_sub_bass_energy',
  '_low_mid_energy',
  '_upper_mid_energy',
  '_air_energy',
  '_beat_event',
  '_calibration_stale',
] as const;

/**
 * Fetch the audio mode registry from the backend. Intended to be called
 * once per component mount — the registry is stable for the HA process
 * lifetime (changes only on integration reload).
 *
 * Returns null on fetch failure; callers should render an empty dropdown
 * rather than crashing.
 */
export async function fetchAudioModeRegistry(
  hass: HomeAssistant | undefined,
): Promise<AudioModeEntry[] | null> {
  if (!hass) return null;
  try {
    const response = await hass.callApi<{ modes: AudioModeEntry[] }>(
      'GET',
      'aqara_advanced_lighting/audio_mode_registry',
    );
    return response.modes;
  } catch (err) {
    console.error('Failed to fetch audio mode registry', err);
    return null;
  }
}

/**
 * Determine the DSP tier of an audio entity's device by inspecting
 * sibling companion sensors in the HA entity registry.
 *
 *   'pro'     — at least one pro-tier suffix sensor is present on the device
 *   'basic'   — device resolved but no pro sensors
 *   'unknown' — couldn't resolve the device (no entity selected, registry
 *               not yet populated, entity missing device_id, etc.)
 */
export function audioDeviceTier(
  hass: HomeAssistant | undefined,
  entityId: string | undefined,
): 'pro' | 'basic' | 'unknown' {
  if (!entityId) return 'unknown';
  if (!hass?.entities) return 'unknown';
  const entity = hass.entities[entityId];
  if (!entity?.device_id) return 'unknown';
  const deviceId = entity.device_id;

  const siblings = Object.values(hass.entities).filter(
    (e) => e.device_id === deviceId,
  );
  if (siblings.length === 0) return 'unknown';

  const hasProSensor = siblings.some((e) => {
    const eid = e.entity_id ?? '';
    return PRO_TIER_ENTITY_ID_SUFFIXES.some((suffix) => eid.endsWith(suffix));
  });
  return hasProSensor ? 'pro' : 'basic';
}

/**
 * Build the `{value, label}[]` array consumed by ha-selector from a fetched
 * mode registry plus a tier. Labels are derived from translation keys of
 * the form `dynamic_scene.audio_mode_<constant>`, falling back to the
 * backend-provided `display_label`, then to the raw `constant`.
 *
 * When a mode is `requires_pro=true` AND the bound device isn't pro, the
 * label is suffixed with ` (<proBadge>)` — the frontend's informational
 * indication that the mode will run in fallback mode.
 *
 * @param registry   Result of fetchAudioModeRegistry(); pass null/[] for
 *                   a still-loading or failed state to render an empty
 *                   dropdown.
 * @param tier       Output of audioDeviceTier() for the bound entity.
 * @param localize   The component's translation function. Passed rather
 *                   than imported so each component uses its own
 *                   translation context (scene editor vs panel may have
 *                   different bases).
 */
export function buildAudioModeOptions(
  registry: AudioModeEntry[] | null,
  tier: 'pro' | 'basic' | 'unknown',
  localize: (key: string) => string | undefined,
): Array<{ value: string; label: string }> {
  if (!registry) return [];
  const proBadge = localize('dynamic_scene.audio_mode_pro_badge') || 'pro';
  return registry
    // Filter out hidden modes — see AudioModeEntry.hidden docstring.
    .filter((mode) => !mode.hidden)
    .map((mode) => {
      const translationKey = `dynamic_scene.audio_mode_${mode.constant}`;
      const baseLabel = localize(translationKey) || mode.display_label || mode.constant;
      const needsBadge = mode.requires_pro && tier !== 'pro';
      return {
        value: mode.constant,
        label: needsBadge ? `${baseLabel} (${proBadge})` : baseLabel,
      };
    });
}

/**
 * Test whether a given mode constant is hidden in the current registry.
 * Used to filter the AUDIO_PRESETS template list (the kick / spectrum
 * presets reference hidden modes; surfacing them as preset choices would
 * let the user pick a preset that locks them into a hidden mode).
 *
 * Returns false when the registry hasn't loaded yet or doesn't list the
 * constant — fail-open so the user-facing dropdown isn't accidentally
 * blank during boot.
 */
export function isAudioModeHidden(
  registry: AudioModeEntry[] | null,
  constant: string,
): boolean {
  if (!registry) return false;
  const entry = registry.find((m) => m.constant === constant);
  return entry?.hidden === true;
}
