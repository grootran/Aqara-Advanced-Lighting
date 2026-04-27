/**
 * Pure entity utility functions extracted from aqara-panel.ts.
 * All functions take hass and entity data as parameters — no component state.
 */

import { hsToRgb } from './color-utils';
import type { HomeAssistant } from './types';

export type SupportedEntityMap = Map<string, {
  device_type: string; model_id: string; z2m_friendly_name: string;
  ieee_address?: string; segment_count?: number; is_group?: boolean; member_count?: number;
}>;

export function getEntityFriendlyName(hass: HomeAssistant, entityId: string): string {
  const state = hass.states[entityId];
  if (state && state.attributes.friendly_name) {
    return state.attributes.friendly_name as string;
  }
  return entityId.split('.')[1]?.replace(/_/g, ' ') || entityId;
}

export function getEntityDeviceName(hass: HomeAssistant, entityId: string): string {
  const entry = hass.entities?.[entityId];
  if (entry?.device_id && hass.devices) {
    const device = hass.devices[entry.device_id];
    if (device) {
      return device.name_by_user || device.name || getEntityFriendlyName(hass, entityId);
    }
  }
  return getEntityFriendlyName(hass, entityId);
}

export function getEntityIcon(hass: HomeAssistant, entityId: string): string {
  const state = hass.states[entityId];
  if (state) {
    if (state.attributes.icon) {
      return state.attributes.icon as string;
    }
    const domain = entityId.split('.')[0];
    if (domain === 'light') {
      return 'mdi:lightbulb';
    }
  }
  return 'mdi:lightbulb';
}

export function getEntityState(hass: HomeAssistant, entityId: string): string {
  const state = hass.states[entityId];
  return state ? state.state : 'unavailable';
}

export function getEntityColor(hass: HomeAssistant, entityId: string): string | null {
  const state = hass.states[entityId];
  if (!state || state.state !== 'on') return null;

  if (state.attributes.rgb_color) {
    const [r, g, b] = state.attributes.rgb_color as number[];
    return `rgb(${r}, ${g}, ${b})`;
  }

  if (state.attributes.hs_color && Array.isArray(state.attributes.hs_color)) {
    const hsColor = state.attributes.hs_color as number[];
    if (hsColor.length >= 2 && typeof hsColor[0] === 'number' && typeof hsColor[1] === 'number') {
      const rgb = hsToRgb(hsColor[0], hsColor[1]);
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }
  }

  return null;
}

export function hasRGBColorMode(entity: { attributes: Record<string, unknown> }): boolean {
  const colorModes = entity.attributes.supported_color_modes as string[] | undefined;
  return !!colorModes && Array.isArray(colorModes) &&
    colorModes.some(mode => ['xy', 'hs', 'rgb', 'rgbw', 'rgbww'].includes(mode));
}

export function hasCCTColorMode(entity: { attributes: Record<string, unknown> }): boolean {
  const colorModes = entity.attributes.supported_color_modes as string[] | undefined;
  return !!colorModes && Array.isArray(colorModes) && colorModes.includes('color_temp');
}

export function getEntityDeviceType(
  hass: HomeAssistant,
  entityId: string,
  supportedEntities: SupportedEntityMap,
  includeAllLights: boolean,
): string | null {
  const entity = hass.states[entityId];
  if (!entity) return null;

  const supportedEntity = supportedEntities.get(entityId);
  if (supportedEntity) {
    if (supportedEntity.device_type === 't1m') {
      return hasRGBColorMode(entity) ? 't1m' : 't1m_white';
    }
    if (supportedEntity.device_type && supportedEntity.device_type !== 'unknown') {
      return supportedEntity.device_type;
    }
  }

  if (includeAllLights) {
    if (hasRGBColorMode(entity)) return 'generic_rgb';
    const colorModes = entity.attributes.supported_color_modes as string[] | undefined;
    if (colorModes?.includes('color_temp')) return 'generic_cct';
  }

  const effectList = entity.attributes.effect_list as string[] | undefined;
  if (effectList && Array.isArray(effectList)) {
    if (effectList.includes('flow1') || effectList.includes('flow2') || effectList.includes('rolling')) return 't1m';
    if (effectList.includes('rainbow1') || effectList.includes('rainbow2') || effectList.includes('chasing') || effectList.includes('flicker') || effectList.includes('dash')) return 't1_strip';
    if (effectList.includes('candlelight')) return 't2_bulb';
  } else if (!effectList && entity.attributes.color_temp_kelvin !== undefined) {
    return 't2_cct';
  }

  return null;
}
