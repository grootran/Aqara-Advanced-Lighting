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

// RGB color for user presets (backward compatibility)
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

// XY color for CIE 1931 color space
export interface XYColor {
  x: number;  // 0.0-1.0
  y: number;  // 0.0-1.0
}

// HS color for Hue-Saturation color space
export interface HSColor {
  h: number;  // Hue: 0-360 degrees
  s: number;  // Saturation: 0-100 percent
}

// Color gamut definition per device type
export interface ColorGamut {
  red: [number, number];    // [x, y]
  green: [number, number];
  blue: [number, number];
}

// Color gamut triangles for Aqara lights
export const AQARA_GAMUTS: Record<string, ColorGamut> = {
  T1M: {
    red: [0.68, 0.31],
    green: [0.15, 0.06],
    blue: [0.15, 0.70],
  },
  T1_STRIP: {
    red: [0.68, 0.31],
    green: [0.15, 0.06],
    blue: [0.15, 0.70],
  },
  T2_BULB: {
    red: [0.68, 0.31],
    green: [0.15, 0.06],
    blue: [0.15, 0.70],
  },
};

// Segment color entry for user presets
export interface SegmentColorEntry {
  segment: number | string;
  color: RGBColor;
}

// User preset interfaces
export interface UserEffectPreset {
  id: string;
  name: string;
  icon?: string;
  device_type?: string;
  effect: string;
  effect_speed: number;
  effect_brightness?: number;
  effect_colors: XYColor[];  // Changed to XYColor for accurate color representation
  effect_segments?: string;
  created_at: string;
  modified_at: string;
}

export interface UserSegmentPatternPreset {
  id: string;
  name: string;
  icon?: string;
  device_type?: string;
  segments: SegmentColorEntry[];
  created_at: string;
  modified_at: string;
}

export interface UserCCTSequencePreset {
  id: string;
  name: string;
  icon?: string;
  steps: CCTSequenceStep[];
  loop_mode: string;
  loop_count?: number;
  end_behavior: string;
  created_at: string;
  modified_at: string;
}

export interface UserSegmentSequencePreset {
  id: string;
  name: string;
  icon?: string;
  device_type?: string;
  steps: SegmentSequenceStep[];
  loop_mode: string;
  loop_count?: number;
  end_behavior: string;
  clear_segments?: boolean;
  skip_first_in_loop?: boolean;
  created_at: string;
  modified_at: string;
}

export interface UserPresetsData {
  effect_presets: UserEffectPreset[];
  segment_pattern_presets: UserSegmentPatternPreset[];
  cct_sequence_presets: UserCCTSequencePreset[];
  segment_sequence_presets: UserSegmentSequencePreset[];
}

// Tab type for panel navigation
export type PanelTab = 'activate' | 'effects' | 'patterns' | 'cct' | 'segments' | 'presets';

// Sort options for presets
export type PresetSortOption = 'name-asc' | 'name-desc' | 'date-new' | 'date-old';

export interface PresetSortPreferences {
  effects: PresetSortOption;
  patterns: PresetSortOption;
  cct: PresetSortOption;
  segments: PresetSortOption;
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
