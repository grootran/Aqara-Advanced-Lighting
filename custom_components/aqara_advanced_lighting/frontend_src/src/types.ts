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
  segments: string;  // Legacy field (unused when segment_colors is provided)
  colors: number[][];  // Legacy field (unused when segment_colors is provided)
  mode: string;  // Legacy field (unused when segment_colors is provided)
  duration: number;
  hold: number;
  activation_pattern: string;
  transition?: number;
  segment_colors?: SegmentColorEntry[];  // Direct segment assignments (preferred)
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
  hasT2: boolean;
  hasT1M: boolean;
  hasT1Strip: boolean;
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

// Dynamic scene color with XY coordinates and brightness
export interface DynamicSceneColor {
  x: number;
  y: number;
  brightness_pct: number;
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
    red: [0.6800, 0.3100],
    green: [0.1500, 0.0600],
    blue: [0.1500, 0.7000],
  },
  T1_STRIP: {
    red: [0.6800, 0.3100],
    green: [0.1500, 0.0600],
    blue: [0.1500, 0.7000],
  },
  T2_BULB: {
    red: [0.6800, 0.3100],
    green: [0.1500, 0.0600],
    blue: [0.1500, 0.7000],
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

export interface UserDynamicScenePreset {
  id: string;
  name: string;
  icon?: string;
  colors: DynamicSceneColor[];
  transition_time: number;
  hold_time: number;
  distribution_mode: string;
  offset_delay: number;
  random_order: boolean;
  scene_brightness_pct: number;
  loop_mode: string;
  loop_count?: number;
  end_behavior: string;
  created_at: string;
  modified_at: string;
}

export interface UserPresetsData {
  effect_presets: UserEffectPreset[];
  segment_pattern_presets: UserSegmentPatternPreset[];
  cct_sequence_presets: UserCCTSequencePreset[];
  segment_sequence_presets: UserSegmentSequencePreset[];
  dynamic_scene_presets: UserDynamicScenePreset[];
}

// Device context passed from Activate tab to editor tabs
export interface DeviceContext {
  deviceType: string | null;  // First compatible device type from selection
  hasSelection: boolean;       // Whether any entities are selected
  zones?: SegmentZoneResolved[];  // Resolved segment zones for the selected device
}

// Tab type for panel navigation
export type PanelTab = 'activate' | 'effects' | 'patterns' | 'cct' | 'segments' | 'presets' | 'config';

// Sort options for presets
export type PresetSortOption = 'name-asc' | 'name-desc' | 'date-new' | 'date-old';

export type PresetSortPreferences = Record<string, PresetSortOption>;

// Per-user preferences (backed by server-side storage)
export interface UserPreferences {
  color_history: XYColor[];
  sort_preferences: PresetSortPreferences;
  collapsed_sections: Record<string, boolean>;
}

// Draft state types for editor tab caching (in-memory only, not persisted)
export interface EffectEditorDraft {
  name: string;
  icon: string;
  deviceType: string;
  effect: string;
  speed: number;
  brightness: number;
  colors: XYColor[];
  segments: string;
}

export interface PatternEditorDraft {
  name: string;
  icon: string;
  deviceType: string;
  segments: Array<[number, XYColor]>;
  colorPalette: XYColor[];
  gradientColors: XYColor[];
  blockColors: XYColor[];
  expandBlocks: boolean;
  gradientMirror: boolean;
  gradientRepeat: number;
  gradientReverse: boolean;
  gradientInterpolation: string;
  gradientWave: boolean;
  gradientWaveCycles: number;
  turnOffUnspecified: boolean;
}

export interface CCTEditorDraft {
  name: string;
  icon: string;
  steps: CCTSequenceStep[];
  loopMode: string;
  loopCount: number;
  endBehavior: string;
}

export interface SegmentSequenceEditorDraft {
  name: string;
  icon: string;
  deviceType: string;
  steps: Array<{
    id: string;
    duration: number;
    hold: number;
    activation_pattern: string;
    transition?: number;
    coloredSegments: Array<[number, XYColor]>;
    colorPalette: XYColor[];
    gradientColors: XYColor[];
    blockColors: XYColor[];
    expandBlocks: boolean;
    patternMode: string;
    gradientMirror: boolean;
    gradientRepeat: number;
    gradientReverse: boolean;
    gradientInterpolation: string;
    gradientWave: boolean;
    gradientWaveCycles: number;
    turnOffUnspecified: boolean;
  }>;
  loopMode: string;
  loopCount: number;
  endBehavior: string;
  clearSegments: boolean;
  skipFirstInLoop: boolean;
}

export interface DynamicSceneEditorDraft {
  name: string;
  icon: string;
  colors: DynamicSceneColor[];
  transitionTime: number;
  holdTime: number;
  distributionMode: string;
  offsetDelay: number;
  randomOrder: boolean;
  sceneBrightness: number;
  loopMode: string;
  loopCount: number;
  endBehavior: string;
}

export interface EditorDraftCache {
  effects?: EffectEditorDraft;
  patterns?: PatternEditorDraft;
  cct?: CCTEditorDraft;
  segments?: SegmentSequenceEditorDraft;
  scenes?: DynamicSceneEditorDraft;
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

// Segment zone definition for a device
export interface SegmentZone {
  name: string;
  segments: string;  // Segment range string, e.g. "1-8"
}

// Segment zone for the segment selector (pre-resolved)
export interface SegmentZoneResolved {
  name: string;
  segmentIndices: number[];  // 0-based indices for segment selector
}
