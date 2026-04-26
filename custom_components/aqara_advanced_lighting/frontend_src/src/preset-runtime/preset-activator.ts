/**
 * Preset activation dispatcher.
 *
 * Ports from the panel's 10 _activate* methods (aqara-panel.ts:1670-2127) plus
 * two private helpers (_applyPresetAudioFields panel:1810-1832 and
 * _applyAudioOverrides panel:1833-1850). Panel is the source of truth.
 *
 * Card v2 passes only `{ brightness }` when its slider is enabled; all other
 * panel-only options are undefined and the activator falls through to
 * preset-default behavior. The panel will eventually migrate to call this
 * shared activator with its full prefs.state shape mapped onto
 * ActivatePresetOptions.
 *
 * Brightness rules (matches panel):
 *  - effects, patterns, segment_sequences, dynamic_scenes: apply options.brightness
 *  - effects only: per-preset preset.effect_brightness wins over options.brightness
 *    (matches panel.ts:1905-1909)
 *  - cct_sequences: NEVER pass brightness (per-step brightness is part of CCT semantics)
 *  - dynamic_scenes: when options.brightness is set, replace each color's brightness_pct
 *
 * The trailing `await this._loadRunningOperations()` calls from the panel are
 * removed - the subscription mechanism (Chunk 6) handles state refresh.
 */

import type {
  HomeAssistant,
  FavoritePresetRef,
  AnyPreset,
  DynamicEffectPreset,
  UserEffectPreset,
  SegmentPatternPreset,
  UserSegmentPatternPreset,
  CCTSequencePreset,
  UserCCTSequencePreset,
  SegmentSequencePreset,
  UserSegmentSequencePreset,
  DynamicScenePreset,
  UserDynamicScenePreset,
} from '../types';

export interface ActivatePresetOptions {
  // Brightness override (applies to effects, patterns, dynamic scenes, segment sequences;
  // not applied to CCT sequences). Honors per-preset overrides such as
  // UserEffectPreset.effect_brightness, which take precedence over this value
  // (matching aqara-panel.ts:1905-1909).
  brightness?: number;

  // Dynamic-scene-only override fields (panel-specific; card v2 does not pass these)
  staticSceneMode?: boolean;
  distributionModeOverride?: string;
  useStaticSceneMode?: boolean;
  useDistributionModeOverride?: boolean;

  // Audio overrides for effects (panel-specific; card v2 does not pass these)
  useEffectAudioReactive?: boolean;
  audioOverrideEntity?: string | null;
  effectAudioOverrideSensitivity?: number;

  // Audio overrides for dynamic scenes (panel-specific; card v2 does not pass these)
  useAudioReactive?: boolean;
  audioOverrideBrightnessCurve?: string | null;
  audioOverrideBrightnessMin?: number;
  audioOverrideBrightnessMax?: number;
  audioOverrideRolloffBrightness?: boolean;
}

const DOMAIN = 'aqara_advanced_lighting';

export async function activatePreset(
  hass: HomeAssistant,
  entityIds: string[],
  ref: FavoritePresetRef,
  preset: AnyPreset,
  isUser: boolean,
  options: ActivatePresetOptions = {},
): Promise<void> {
  if (entityIds.length === 0) return;

  switch (ref.type) {
    case 'effect':
      return isUser
        ? activateUserEffect(hass, entityIds, preset as UserEffectPreset, options)
        : activateBuiltinEffect(hass, entityIds, preset as DynamicEffectPreset, options);
    case 'segment_pattern':
      return isUser
        ? activateUserPattern(hass, entityIds, preset as UserSegmentPatternPreset, options)
        : activateBuiltinPattern(hass, entityIds, preset as SegmentPatternPreset, options);
    case 'cct_sequence':
      return isUser
        ? activateUserCCTSequence(hass, entityIds, preset as UserCCTSequencePreset)
        : activateBuiltinCCTSequence(hass, entityIds, preset as CCTSequencePreset);
    case 'segment_sequence':
      return isUser
        ? activateUserSegmentSequence(hass, entityIds, preset as UserSegmentSequencePreset, options)
        : activateBuiltinSegmentSequence(hass, entityIds, preset as SegmentSequencePreset, options);
    case 'dynamic_scene':
      return isUser
        ? activateUserDynamicScene(hass, entityIds, preset as UserDynamicScenePreset, options)
        : activateBuiltinDynamicScene(hass, entityIds, preset as DynamicScenePreset, options);
  }
}

// -------------------------------------------------------------------------
// built-in helpers
// -------------------------------------------------------------------------

// Ported from aqara-panel.ts:1670-1710 (_activateDynamicEffect)
async function activateBuiltinEffect(
  hass: HomeAssistant,
  entityIds: string[],
  preset: DynamicEffectPreset,
  options: ActivatePresetOptions,
): Promise<void> {
  const serviceData: Record<string, unknown> = {
    entity_id: entityIds,
    preset: preset.id,
    turn_on: true,
    sync: true,
  };

  if (options.brightness !== undefined) {
    serviceData.brightness = options.brightness;
  }

  // Effect audio override
  if (options.useEffectAudioReactive) {
    if (options.audioOverrideEntity) {
      serviceData.audio_entity = options.audioOverrideEntity;
      serviceData.audio_sensitivity = preset.audio_sensitivity ?? options.effectAudioOverrideSensitivity;
      serviceData.audio_silence_behavior = preset.audio_silence_behavior ?? 'decay_min';
      // Use preset's configured speed mode, fall back to 'volume' for non-audio presets
      serviceData.audio_speed_mode = preset.audio_speed_mode || 'volume';
      // Pass through preset's speed min/max when available
      if (preset.audio_speed_min !== undefined) serviceData.audio_speed_min = preset.audio_speed_min;
      if (preset.audio_speed_max !== undefined) serviceData.audio_speed_max = preset.audio_speed_max;
    } else {
      console.warn('Effect audio reactive override is enabled but no audio sensor entity is configured');
    }
  } else if (preset.audio_speed_mode) {
    // Built-in audio-reactive preset - inject user's default entity when configured.
    const fallbackEntity = options.audioOverrideEntity;
    if (fallbackEntity) {
      serviceData.audio_entity = fallbackEntity;
    }
  }

  await hass.callService(DOMAIN, 'set_dynamic_effect', serviceData);
}

// Ported from aqara-panel.ts:1712-1729 (_activateSegmentPattern)
async function activateBuiltinPattern(
  hass: HomeAssistant,
  entityIds: string[],
  preset: SegmentPatternPreset,
  options: ActivatePresetOptions,
): Promise<void> {
  const serviceData: Record<string, unknown> = {
    entity_id: entityIds,
    preset: preset.id,
    turn_on: true,
    sync: true,
  };

  if (options.brightness !== undefined) {
    serviceData.brightness = options.brightness;
  }

  await hass.callService(DOMAIN, 'set_segment_pattern', serviceData);
}

// Ported from aqara-panel.ts:1731-1742 (_activateCCTSequence)
async function activateBuiltinCCTSequence(
  hass: HomeAssistant,
  entityIds: string[],
  preset: CCTSequencePreset,
): Promise<void> {
  const isAdaptive = preset.mode === 'solar' || preset.mode === 'schedule';
  await hass.callService(DOMAIN, 'start_cct_sequence', {
    entity_id: entityIds,
    preset: preset.id,
    ...(!isAdaptive && { turn_on: true }),
    sync: true,
  });
}

// Ported from aqara-panel.ts:1744-1760 (_activateSegmentSequence)
async function activateBuiltinSegmentSequence(
  hass: HomeAssistant,
  entityIds: string[],
  preset: SegmentSequencePreset,
  options: ActivatePresetOptions,
): Promise<void> {
  const serviceData: Record<string, unknown> = {
    entity_id: entityIds,
    preset: preset.id,
    turn_on: true,
    sync: true,
  };

  if (options.brightness !== undefined) {
    serviceData.brightness = options.brightness;
  }

  await hass.callService(DOMAIN, 'start_segment_sequence', serviceData);
}

// Ported from aqara-panel.ts:1762-1807 (_activateDynamicScene)
async function activateBuiltinDynamicScene(
  hass: HomeAssistant,
  entityIds: string[],
  preset: DynamicScenePreset,
  options: ActivatePresetOptions,
): Promise<void> {
  // When brightness override is provided, replace all per-color brightness
  const overrideBrightness = options.brightness ?? null;

  const serviceData: Record<string, unknown> = {
    entity_id: entityIds,
    scene_name: preset.name,
    transition_time: preset.transition_time,
    hold_time: preset.hold_time,
    distribution_mode: options.useDistributionModeOverride
      ? options.distributionModeOverride
      : preset.distribution_mode,
    random_order: preset.random_order,
    loop_mode: preset.loop_mode,
    end_behavior: preset.end_behavior,
  };

  if (preset.offset_delay !== undefined && preset.offset_delay > 0) {
    serviceData.offset_delay = preset.offset_delay;
  }

  if (preset.loop_mode === 'count' && preset.loop_count !== undefined) {
    serviceData.loop_count = preset.loop_count;
  }

  serviceData.colors = preset.colors.map((color) => ({
    x: color.x,
    y: color.y,
    brightness_pct: overrideBrightness ?? color.brightness_pct,
  }));

  if (options.useStaticSceneMode) {
    serviceData.static = true;
  }

  applyAudioOverrides(serviceData, options);
  applyPresetAudioFields(serviceData, preset, options);

  await hass.callService(DOMAIN, 'start_dynamic_scene', serviceData);
}

// -------------------------------------------------------------------------
// user helpers
// -------------------------------------------------------------------------

// Ported from aqara-panel.ts:1886-1948 (_activateUserEffectPreset)
async function activateUserEffect(
  hass: HomeAssistant,
  entityIds: string[],
  preset: UserEffectPreset,
  options: ActivatePresetOptions,
): Promise<void> {
  const serviceData: Record<string, unknown> = {
    entity_id: entityIds,
    effect: preset.effect,
    speed: preset.effect_speed,
    preset: preset.name,
    turn_on: true,
    sync: true,
  };

  // Add individual color parameters (color_1, color_2, etc.) as XY colors
  preset.effect_colors.forEach((c, index) => {
    if (index < 8) {
      serviceData[`color_${index + 1}`] = { x: c.x, y: c.y };
    }
  });

  // Per-preset effect_brightness wins over options.brightness (panel:1905-1909)
  if (preset.effect_brightness !== undefined) {
    serviceData.brightness = preset.effect_brightness;
  } else if (options.brightness !== undefined) {
    serviceData.brightness = options.brightness;
  }

  if (preset.effect_segments) {
    serviceData.segments = preset.effect_segments;
  }

  // Effect audio override takes precedence, but merge with preset's audio config
  if (options.useEffectAudioReactive) {
    if (options.audioOverrideEntity) {
      const ac = preset.audio_config;
      serviceData.audio_entity = options.audioOverrideEntity;
      serviceData.audio_sensitivity = ac?.audio_sensitivity ?? options.effectAudioOverrideSensitivity;
      serviceData.audio_silence_behavior = ac?.audio_silence_behavior ?? 'decay_min';
      // Use preset's configured speed mode, fall back to 'volume' for non-audio presets
      serviceData.audio_speed_mode = ac?.audio_speed_mode || 'volume';
      // Pass through preset's speed min/max when available
      if (ac?.audio_speed_min !== undefined) serviceData.audio_speed_min = ac.audio_speed_min;
      if (ac?.audio_speed_max !== undefined) serviceData.audio_speed_max = ac.audio_speed_max;
    } else {
      console.warn('Effect audio reactive override is enabled but no audio sensor entity is configured');
    }
  } else if (preset.audio_config?.audio_entity) {
    // Fall back to preset's saved audio config (only when override is OFF)
    const ac = preset.audio_config;
    // Vestigial fallback ported from panel; ac.audio_entity is always truthy here due to the outer gate, but kept for panel parity in case future panel changes reach this branch differently.
    const fallbackEntity = ac.audio_entity || options.audioOverrideEntity;
    if (fallbackEntity) {
      serviceData.audio_entity = fallbackEntity;
      serviceData.audio_sensitivity = ac.audio_sensitivity ?? 50;
      serviceData.audio_silence_behavior = ac.audio_silence_behavior ?? 'decay_min';
      if (ac.audio_speed_mode) {
        serviceData.audio_speed_mode = ac.audio_speed_mode;
        serviceData.audio_speed_min = ac.audio_speed_min ?? 1;
        serviceData.audio_speed_max = ac.audio_speed_max ?? 100;
      }
    }
  }

  await hass.callService(DOMAIN, 'set_dynamic_effect', serviceData);
}

// Ported from aqara-panel.ts:1950-1990 (_activateUserPatternPreset)
async function activateUserPattern(
  hass: HomeAssistant,
  entityIds: string[],
  preset: UserSegmentPatternPreset,
  options: ActivatePresetOptions,
): Promise<void> {
  if (!preset.segments || !Array.isArray(preset.segments) || preset.segments.length === 0) {
    console.warn('Pattern preset has no segments:', preset.name);
    return;
  }

  const segment_colors = preset.segments
    .filter((s) => s && s.color)
    .map((s) => ({
      segment: s.segment,
      color: { r: s.color.r, g: s.color.g, b: s.color.b },
    }));

  if (segment_colors.length === 0) {
    console.warn('Pattern preset has no valid segments after filtering:', preset.name);
    return;
  }

  const serviceData: Record<string, unknown> = {
    entity_id: entityIds,
    segment_colors,
    preset: preset.name,
    turn_on: true,
    sync: true,
    turn_off_unspecified: true,
  };

  if (options.brightness !== undefined) {
    serviceData.brightness = options.brightness;
  }

  try {
    await hass.callService(DOMAIN, 'set_segment_pattern', serviceData);
  } catch (err) {
    console.error('Failed to activate pattern preset:', err);
  }
}

// Ported from aqara-panel.ts:1992-2034 (_activateUserCCTSequencePreset)
async function activateUserCCTSequence(
  hass: HomeAssistant,
  entityIds: string[],
  preset: UserCCTSequencePreset,
): Promise<void> {
  // Adaptive presets (solar/schedule) are resolved by name on the backend.
  // Don't turn on lights -- the loop waits for them to be turned on.
  if (preset.mode === 'solar' || preset.mode === 'schedule') {
    await hass.callService(DOMAIN, 'start_cct_sequence', {
      entity_id: entityIds,
      preset: preset.name,
      sync: true,
    });
    return;
  }

  const serviceData: Record<string, unknown> = {
    entity_id: entityIds,
    preset: preset.name,
    loop_mode: preset.loop_mode,
    end_behavior: preset.end_behavior,
    turn_on: true,
    sync: true,
  };

  if (preset.loop_mode === 'count' && preset.loop_count !== undefined) {
    serviceData.loop_count = preset.loop_count;
  }

  // Convert steps array to individual step fields (step_1_color_temp, step_1_brightness, etc.)
  preset.steps.forEach((step, index) => {
    const stepNum = index + 1;
    if (stepNum <= 20) {
      serviceData[`step_${stepNum}_color_temp`] = step.color_temp;
      serviceData[`step_${stepNum}_brightness`] = step.brightness;
      serviceData[`step_${stepNum}_transition`] = step.transition;
      serviceData[`step_${stepNum}_hold`] = step.hold;
    }
  });

  await hass.callService(DOMAIN, 'start_cct_sequence', serviceData);
}

// Ported from aqara-panel.ts:2036-2080 (_activateUserSegmentSequencePreset)
async function activateUserSegmentSequence(
  hass: HomeAssistant,
  entityIds: string[],
  preset: UserSegmentSequencePreset,
  options: ActivatePresetOptions,
): Promise<void> {
  const serviceData: Record<string, unknown> = {
    entity_id: entityIds,
    preset: preset.name,
    loop_mode: preset.loop_mode,
    end_behavior: preset.end_behavior,
    turn_on: true,
    sync: true,
  };

  if (options.brightness !== undefined) {
    serviceData.brightness = options.brightness;
  }

  if (preset.loop_mode === 'count' && preset.loop_count !== undefined) {
    serviceData.loop_count = preset.loop_count;
  }

  preset.steps.forEach((step, index) => {
    const stepNum = index + 1;
    if (stepNum <= 20) {
      serviceData[`step_${stepNum}_segments`] = step.segments;
      serviceData[`step_${stepNum}_mode`] = step.mode;
      serviceData[`step_${stepNum}_duration`] = step.duration;
      serviceData[`step_${stepNum}_hold`] = step.hold;
      serviceData[`step_${stepNum}_activation_pattern`] = step.activation_pattern;

      // Add individual color parameters (up to 6 colors per step)
      if (step.colors && Array.isArray(step.colors)) {
        step.colors.forEach((color, colorIndex) => {
          if (colorIndex < 6) {
            serviceData[`step_${stepNum}_color_${colorIndex + 1}`] = color;
          }
        });
      }
    }
  });

  await hass.callService(DOMAIN, 'start_segment_sequence', serviceData);
}

// Ported from aqara-panel.ts:2082-2127 (_activateUserDynamicScenePreset)
async function activateUserDynamicScene(
  hass: HomeAssistant,
  entityIds: string[],
  preset: UserDynamicScenePreset,
  options: ActivatePresetOptions,
): Promise<void> {
  const overrideBrightness = options.brightness ?? null;

  const serviceData: Record<string, unknown> = {
    entity_id: entityIds,
    scene_name: preset.name,
    transition_time: preset.transition_time,
    hold_time: preset.hold_time,
    distribution_mode: options.useDistributionModeOverride
      ? options.distributionModeOverride
      : preset.distribution_mode,
    random_order: preset.random_order,
    loop_mode: preset.loop_mode,
    end_behavior: preset.end_behavior,
  };

  if (preset.offset_delay !== undefined && preset.offset_delay > 0) {
    serviceData.offset_delay = preset.offset_delay;
  }

  if (preset.loop_mode === 'count' && preset.loop_count !== undefined) {
    serviceData.loop_count = preset.loop_count;
  }

  serviceData.colors = preset.colors.map((color) => ({
    x: color.x,
    y: color.y,
    brightness_pct: overrideBrightness ?? color.brightness_pct,
  }));

  if (options.useStaticSceneMode) {
    serviceData.static = true;
  }

  applyAudioOverrides(serviceData, options);
  applyPresetAudioFields(serviceData, preset, options);

  await hass.callService(DOMAIN, 'start_dynamic_scene', serviceData);
}

// -------------------------------------------------------------------------
// audio helper functions
// -------------------------------------------------------------------------

// Ported from aqara-panel.ts:1810-1832 (_applyPresetAudioFields)
function applyPresetAudioFields(
  serviceData: Record<string, unknown>,
  preset: DynamicScenePreset | UserDynamicScenePreset,
  options: ActivatePresetOptions,
): void {
  if (options.useAudioReactive && options.audioOverrideEntity) return;
  if (!preset.audio_color_advance) return;

  const audioEntity = preset.audio_entity || options.audioOverrideEntity;
  if (!audioEntity) return;

  serviceData.audio_entity = audioEntity;
  serviceData.audio_color_advance = preset.audio_color_advance;
  if (preset.audio_sensitivity != null) serviceData.audio_sensitivity = preset.audio_sensitivity;
  if (preset.audio_brightness_curve !== undefined) serviceData.audio_brightness_curve = preset.audio_brightness_curve;
  if (preset.audio_brightness_min != null) serviceData.audio_brightness_min = preset.audio_brightness_min;
  if (preset.audio_brightness_max != null) serviceData.audio_brightness_max = preset.audio_brightness_max;
  if (preset.audio_transition_speed != null) serviceData.audio_transition_speed = preset.audio_transition_speed;
  if (preset.audio_detection_mode != null) serviceData.audio_detection_mode = preset.audio_detection_mode;
  if (preset.audio_frequency_zone != null) serviceData.audio_frequency_zone = preset.audio_frequency_zone;
  if (preset.audio_silence_behavior != null) serviceData.audio_silence_behavior = preset.audio_silence_behavior;
  if (preset.audio_prediction_aggressiveness != null) serviceData.audio_prediction_aggressiveness = preset.audio_prediction_aggressiveness;
  if (preset.audio_latency_compensation_ms != null) serviceData.audio_latency_compensation_ms = preset.audio_latency_compensation_ms;
  if (preset.audio_color_by_frequency != null) serviceData.audio_color_by_frequency = preset.audio_color_by_frequency;
  if (preset.audio_rolloff_brightness != null) serviceData.audio_rolloff_brightness = preset.audio_rolloff_brightness;
}

// Ported from aqara-panel.ts:1833-1850 (_applyAudioOverrides)
//
// Note: the panel reads many additional audio override fields from prefs.state
// (audioOverrideSensitivity, audioOverrideColorAdvance, audioOverrideTransitionSpeed,
// audioOverrideDetectionMode, audioOverrideFrequencyZone, audioOverrideSilenceBehavior,
// audioOverridePredictionAggressiveness, audioOverrideLatencyCompensationMs) that
// are not modeled on ActivatePresetOptions yet. These are wired up as the panel
// migrates to call activatePreset (panel currently still calls its own methods).
// Card v2 does not pass any audio override options. The fields modeled on the
// options interface (audioOverrideEntity, audioOverrideBrightnessCurve,
// audioOverrideBrightnessMin/Max, audioOverrideRolloffBrightness) are honored.
function applyAudioOverrides(
  serviceData: Record<string, unknown>,
  options: ActivatePresetOptions,
): void {
  if (options.useAudioReactive && options.audioOverrideEntity) {
    serviceData.audio_entity = options.audioOverrideEntity;
    if (options.audioOverrideBrightnessCurve !== undefined) {
      serviceData.audio_brightness_curve = options.audioOverrideBrightnessCurve;
    }
    if (options.audioOverrideBrightnessMin !== undefined) {
      serviceData.audio_brightness_min = options.audioOverrideBrightnessMin;
    }
    if (options.audioOverrideBrightnessMax !== undefined) {
      serviceData.audio_brightness_max = options.audioOverrideBrightnessMax;
    }
    if (options.audioOverrideRolloffBrightness !== undefined) {
      serviceData.audio_rolloff_brightness = options.audioOverrideRolloffBrightness;
    }
  }
}
