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
  fetchWithAuth: (path: string, init?: RequestInit) => Promise<Response>;
  callWS: <T>(msg: Record<string, unknown>) => Promise<T>;
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
  connection: {
    subscribeEvents: (
      callback: (event: HassEvent) => void,
      eventType: string,
    ) => Promise<() => void>;
  };
  entities?: Record<string, { entity_id: string; device_id?: string; platform?: string }>;
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

// Recursive translation object: leaf values are strings, branches are nested objects
export interface Translations {
  [key: string]: string | Translations;
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

export interface SolarStep {
  sun_elevation: number;
  color_temp: number;
  brightness: number;
  phase: 'rising' | 'setting' | 'any';
}

export interface SolarCCTPreset {
  id: string;
  name: string;
  icon: string;
  mode: 'solar';
  solar_steps: SolarStep[];
  end_behavior: string;
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

// Bundled dynamic scene preset (from backend)
export interface DynamicScenePreset {
  id: string;
  name: string;
  icon?: string;
  colors: DynamicSceneColor[];
  transition_time: number;
  hold_time: number;
  distribution_mode: string;
  offset_delay: number;
  random_order: boolean;
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
  dynamic_scenes: DynamicScenePreset[];
}

export interface FilteredPresets {
  showDynamicEffects: boolean;
  showSegmentPatterns: boolean;
  showCCTSequences: boolean;
  showSegmentSequences: boolean;
  showDynamicScenes: boolean;
  showMusicSync: boolean;
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
  skip_first_in_loop?: boolean;
  mode?: string;
  solar_steps?: SolarStep[];
  auto_resume_delay?: number;
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
  thumbnail?: string;
  colors: DynamicSceneColor[];
  transition_time: number;
  hold_time: number;
  distribution_mode: string;
  offset_delay: number;
  random_order: boolean;
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

// Union type for any user-created preset
export type UserPreset =
  | UserEffectPreset
  | UserSegmentPatternPreset
  | UserCCTSequencePreset
  | UserSegmentSequencePreset
  | UserDynamicScenePreset;

// Union type for any built-in preset
export type BuiltinPreset =
  | DynamicEffectPreset
  | SegmentPatternPreset
  | CCTSequencePreset
  | SegmentSequencePreset
  | DynamicScenePreset;

// Union type for any preset (user or built-in)
export type AnyPreset = UserPreset | BuiltinPreset;

// Device context passed from Activate tab to editor tabs
export interface DeviceContext {
  deviceType: string | null;  // First compatible device type from selection
  hasSelection: boolean;       // Whether any entities are selected
  zones?: SegmentZoneResolved[];  // Resolved segment zones for the selected device
}

// Tab type for panel navigation
export type PanelTab = 'activate' | 'effects' | 'patterns' | 'cct' | 'segments' | 'scenes' | 'presets' | 'config';

// Sort options for presets
export type PresetSortOption = 'name-asc' | 'name-desc' | 'date-new' | 'date-old';

export type PresetSortPreferences = Record<string, PresetSortOption>;

// Preset category discriminator
export type PresetType = 'effect' | 'segment_pattern' | 'cct_sequence' | 'segment_sequence' | 'dynamic_scene';

// Reference to a favourited preset (type + id)
export interface FavoritePresetRef {
  type: PresetType;
  id: string;
}

// Per-user preferences (backed by server-side storage)
export interface UserPreferences {
  color_history: XYColor[];
  sort_preferences: PresetSortPreferences;
  collapsed_sections: Record<string, boolean>;
  include_all_lights?: boolean;
  favorite_presets: FavoritePresetRef[];
  static_scene_mode?: boolean;
  distribution_mode_override?: string;
  brightness_override?: number;
}

// Integration-wide preferences (not per-user)
export interface GlobalPreferences {
  ignore_external_changes?: boolean;
  software_transition_entities?: string[];
  override_control_mode?: 'pause_all' | 'pause_changed';
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
  hasUserInteraction: boolean;
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
  hasUserInteraction: boolean;
}

export interface CCTEditorDraft {
  name: string;
  icon: string;
  steps: CCTSequenceStep[];
  loopMode: string;
  loopCount: number;
  endBehavior: string;
  skipFirstInLoop: boolean;
  hasUserInteraction: boolean;
  mode: 'standard' | 'solar';
  solarSteps: SolarStep[];
  autoResumeDelay: number;
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
  hasUserInteraction: boolean;
}

export interface DynamicSceneEditorDraft {
  name: string;
  icon: string;
  thumbnail?: string;
  colors: DynamicSceneColor[];
  transitionTime: number;
  holdTime: number;
  distributionMode: string;
  offsetDelay: number;
  randomOrder: boolean;
  loopMode: string;
  loopCount: number;
  endBehavior: string;
  hasUserInteraction: boolean;
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

// HA event from websocket subscription
export interface HassEvent {
  event_type: string;
  data: Record<string, unknown>;
  origin: string;
  time_fired: string;
  context: {
    id: string;
    parent_id: string | null;
    user_id: string | null;
  };
}

// Running operation types for the active presets display
export type RunningOperationType = 'effect' | 'cct_sequence' | 'segment_sequence' | 'dynamic_scene' | 'music_sync' | 'circadian';

export interface RunningOperation {
  type: RunningOperationType;
  // Per-entity operations (effect, cct_sequence, segment_sequence)
  entity_id?: string;
  // Per-scene operations (dynamic_scene)
  scene_id?: string;
  entity_ids?: string[];
  externally_paused_entities?: string[];
  // Common
  preset_id: string | null;
  paused: boolean;
  externally_paused?: boolean;
  // Sequence progress
  current_step?: number;
  total_steps?: number;
  // Music sync
  sensitivity?: string;
  audio_effect?: string;
  // Capability indicators for dynamic scene entities
  entity_capabilities?: Record<string, string>;
  // CCT sequence mode
  mode?: string;
  // Circadian/solar operation state
  current_color_temp?: number;
  current_brightness?: number;
  // Auto-resume countdown (seconds remaining, present when externally paused)
  auto_resume_remaining?: number;
  override_attributes?: {
    brightness: boolean;
    color: boolean;
  } | Record<string, { brightness: boolean; color: boolean }>;
}

export interface RunningOperationsResponse {
  operations: RunningOperation[];
}
