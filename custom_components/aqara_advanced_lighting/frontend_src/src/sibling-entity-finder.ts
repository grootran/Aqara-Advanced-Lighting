/**
 * Sibling entity finder — locates number entities belonging to the same
 * device as a light entity using 4 lookup strategies.
 */

import type { HomeAssistant } from './types';
import type { SupportedEntityMap } from './entity-utils';

export function findSiblingNumberEntity(
  hass: HomeAssistant,
  supportedEntities: SupportedEntityMap,
  lightEntityId: string,
  suffix: string,
): string | undefined {
  // Pattern 1: Direct name substitution (Z2M standard naming)
  const baseName = lightEntityId.replace('light.', '');
  const directId = `number.${baseName}_${suffix}`;
  if (hass.states[directId]) return directId;

  // Pattern 2: Z2M friendly name from backend metadata
  const supportedEntity = supportedEntities.get(lightEntityId);
  if (supportedEntity?.z2m_friendly_name) {
    const z2mBase = supportedEntity.z2m_friendly_name.toLowerCase().replace(/\s+/g, '_');
    const z2mId = `number.${z2mBase}_${suffix}`;
    if (hass.states[z2mId]) return z2mId;
  }

  // Pattern 3: HA device registry lookup (works for ZHA)
  if (hass.entities) {
    const lightEntry = hass.entities[lightEntityId];
    if (lightEntry?.device_id) {
      for (const [eid, entry] of Object.entries(hass.entities)) {
        if (
          entry.device_id === lightEntry.device_id &&
          eid.startsWith('number.') &&
          eid.endsWith(`_${suffix}`)
        ) {
          if (hass.states[eid]) return eid;
        }
      }
    }
  }

  // Pattern 4: Fuzzy word match (last resort)
  const deviceWords = baseName.toLowerCase().split('_');
  if (deviceWords.length >= 2) {
    for (const eid of Object.keys(hass.states)) {
      if (eid.startsWith('number.') && eid.endsWith(`_${suffix}`)) {
        const stateBase = eid.slice(7, eid.length - suffix.length - 1).toLowerCase();
        const stateWords = stateBase.split('_');
        if (stateWords.length >= 2 &&
            deviceWords[0] === stateWords[0] && deviceWords[1] === stateWords[1]) {
          return eid;
        }
      }
    }
  }

  return undefined;
}

export function findAllSiblingNumberEntities(
  hass: HomeAssistant,
  supportedEntities: SupportedEntityMap,
  lightEntityIds: string[],
  suffix: string,
): string[] {
  const results: string[] = [];
  for (const lightId of lightEntityIds) {
    const found = findSiblingNumberEntity(hass, supportedEntities, lightId, suffix);
    if (found && !results.includes(found)) {
      results.push(found);
    }
  }
  return results;
}
