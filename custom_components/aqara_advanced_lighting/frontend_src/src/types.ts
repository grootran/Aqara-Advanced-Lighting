/**
 * TypeScript type definitions for Aqara Advanced Lighting panel
 */

export interface HomeAssistant {
  callService: (
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>
  ) => Promise<void>;
  callApi: <T>(
    method: string,
    path: string,
    data?: Record<string, unknown>
  ) => Promise<T>;
  states: Record<string, HassEntity>;
  localize: (key: string) => string;
  user?: {
    is_admin?: boolean;
  };
  auth: {
    data: {
      access_token: string;
    };
  };
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
  context: {
    id: string;
    parent_id: string | null;
    user_id: string | null;
  };
}

export interface DynamicEffectPreset {
  id: string;
  name: string;
  icon?: string;
  effect: string;
  speed: number;
  brightness?: number;
  colors: number[][];
  device_types: string[];
}

export interface SegmentPatternPreset {
  id: string;
  name: string;
  icon?: string;
  segments: number[][];
  device_types: string[];
}

export interface CCTSequenceStep {
  color_temp: number;
  brightness: number;
  transition: number;
  hold: number;
}

export interface CCTSequencePreset {
  id: string;
  name: string;
  icon?: string;
  steps: CCTSequenceStep[];
  loop_mode: string;
  loop_count?: number;
  end_behavior: string;
}

export interface SegmentSequenceStep {
  segments: string;
  colors: number[][];
  mode: string;
  duration: number;
  hold: number;
  activation_pattern: string;
  transition?: number;
}

export interface SegmentSequencePreset {
  id: string;
  name: string;
  icon?: string;
  steps: SegmentSequenceStep[];
  loop_mode: string;
  loop_count?: number;
  end_behavior: string;
}

export interface PresetsData {
  dynamic_effects: {
    t2_bulb: DynamicEffectPreset[];
    t1m: DynamicEffectPreset[];
    t1_strip: DynamicEffectPreset[];
  };
  segment_patterns: SegmentPatternPreset[];
  cct_sequences: CCTSequencePreset[];
  segment_sequences: SegmentSequencePreset[];
}

export interface FilteredPresets {
  showDynamicEffects: boolean;
  showSegmentPatterns: boolean;
  showCCTSequences: boolean;
  showSegmentSequences: boolean;
  t2Presets: DynamicEffectPreset[];
  t1mPresets: DynamicEffectPreset[];
  t1StripPresets: DynamicEffectPreset[];
}

export interface Favorite {
  id: string;
  name: string;
  entities: string[];
}

export const SUPPORTED_MODELS = {
  T2_BULB: [
    'lumi.light.agl001',
    'lumi.light.agl003',
    'lumi.light.agl005',
    'lumi.light.agl007',
  ] as string[],
  T2_CCT: [
    'lumi.light.agl002',
    'lumi.light.agl004',
    'lumi.light.agl006',
    'lumi.light.agl008',
  ] as string[],
  T1M: ['lumi.light.acn031', 'lumi.light.acn032'] as string[],
  T1_STRIP: ['lumi.light.acn132'] as string[],
};
