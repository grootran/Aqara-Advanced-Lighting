import { describe, it, expect, vi } from 'vitest';
import { activatePreset } from './preset-activator';
import type {
  FavoritePresetRef,
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

const makeHass = () => ({
  callService: vi.fn().mockResolvedValue(undefined),
});

const DOMAIN = 'aqara_advanced_lighting';

describe('activatePreset', () => {
  // -------------------------------------------------------------------------
  // built-in effect
  // -------------------------------------------------------------------------
  it('built-in effect with brightness override sets brightness in payload', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'effect', id: 'rainbow' };
    const preset = { id: 'rainbow', name: 'Rainbow', icon: 'mdi:lightbulb' } as DynamicEffectPreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, false, { brightness: 50 });

    expect(hass.callService).toHaveBeenCalledWith(
      DOMAIN,
      'set_dynamic_effect',
      expect.objectContaining({
        entity_id: ['light.bulb'],
        preset: 'rainbow',
        turn_on: true,
        sync: true,
        brightness: 50,
      }),
    );
  });

  it('built-in effect without brightness option omits brightness', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'effect', id: 'rainbow' };
    const preset = { id: 'rainbow', name: 'Rainbow' } as DynamicEffectPreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, false, {});
    const payload = hass.callService.mock.calls[0][2];
    expect(payload.brightness).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // user effect
  // -------------------------------------------------------------------------
  it('user effect builds full color payload and uses options.brightness when no per-preset brightness', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'effect', id: 'u1' };
    const preset = {
      id: 'u1',
      name: 'My Effect',
      effect: 'jitter',
      effect_speed: 50,
      effect_colors: [
        { x: 0.1, y: 0.2 },
        { x: 0.3, y: 0.4 },
      ],
    } as UserEffectPreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, true, { brightness: 30 });
    const payload = hass.callService.mock.calls[0][2];
    expect(hass.callService).toHaveBeenCalledWith(DOMAIN, 'set_dynamic_effect', expect.anything());
    expect(payload.effect).toBe('jitter');
    expect(payload.speed).toBe(50);
    expect(payload.preset).toBe('My Effect');
    expect(payload.color_1).toEqual({ x: 0.1, y: 0.2 });
    expect(payload.color_2).toEqual({ x: 0.3, y: 0.4 });
    expect(payload.brightness).toBe(30);
  });

  it('per-preset effect_brightness takes precedence over options.brightness', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'effect', id: 'u1' };
    const preset = {
      id: 'u1',
      name: 'My Effect',
      effect: 'jitter',
      effect_speed: 50,
      effect_colors: [{ x: 0.5, y: 0.5 }],
      effect_brightness: 75,
    } as UserEffectPreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, true, { brightness: 30 });
    const payload = hass.callService.mock.calls[0][2];
    expect(payload.brightness).toBe(75);
  });

  // -------------------------------------------------------------------------
  // built-in segment_pattern
  // -------------------------------------------------------------------------
  it('built-in segment_pattern uses set_segment_pattern with optional brightness', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'segment_pattern', id: 'p1' };
    const preset = { id: 'p1', name: 'Pattern' } as SegmentPatternPreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, false, { brightness: 60 });
    expect(hass.callService).toHaveBeenCalledWith(
      DOMAIN,
      'set_segment_pattern',
      expect.objectContaining({ entity_id: ['light.bulb'], preset: 'p1', turn_on: true, sync: true, brightness: 60 }),
    );
  });

  // -------------------------------------------------------------------------
  // user segment_pattern
  // -------------------------------------------------------------------------
  it('user segment_pattern builds segment_colors payload with turn_off_unspecified', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'segment_pattern', id: 'up1' };
    const preset = {
      id: 'up1',
      name: 'My Pattern',
      segments: [
        { segment: 1, color: { r: 255, g: 0, b: 0 } },
        { segment: 2, color: { r: 0, g: 255, b: 0 } },
      ],
    } as UserSegmentPatternPreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, true, { brightness: 50 });
    const payload = hass.callService.mock.calls[0][2];
    expect(hass.callService).toHaveBeenCalledWith(DOMAIN, 'set_segment_pattern', expect.anything());
    expect(payload.segment_colors).toEqual([
      { segment: 1, color: { r: 255, g: 0, b: 0 } },
      { segment: 2, color: { r: 0, g: 255, b: 0 } },
    ]);
    expect(payload.preset).toBe('My Pattern');
    expect(payload.turn_off_unspecified).toBe(true);
    expect(payload.brightness).toBe(50);
  });

  // -------------------------------------------------------------------------
  // built-in cct_sequence (NEVER passes brightness)
  // -------------------------------------------------------------------------
  it('built-in cct_sequence ignores brightness option', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'cct_sequence', id: 'morning' };
    const preset = { id: 'morning', name: 'Morning' } as CCTSequencePreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, false, { brightness: 50 });
    expect(hass.callService).toHaveBeenCalledWith(DOMAIN, 'start_cct_sequence', expect.anything());
    const payload = hass.callService.mock.calls[0][2];
    expect(payload.brightness).toBeUndefined();
    expect(payload.preset).toBe('morning');
    expect(payload.turn_on).toBe(true);
    expect(payload.sync).toBe(true);
  });

  it('built-in cct_sequence in solar/schedule mode omits turn_on', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'cct_sequence', id: 'sun' };
    const preset = { id: 'sun', name: 'Solar', mode: 'solar' } as CCTSequencePreset;
    await activatePreset(hass as any, ['light.bulb'], ref, preset, false, {});
    const payload = hass.callService.mock.calls[0][2];
    expect(payload.turn_on).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // user cct_sequence (NEVER passes brightness as override; per-step brightness is part of step semantics)
  // -------------------------------------------------------------------------
  it('user cct_sequence ignores brightness option, builds step fields', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'cct_sequence', id: 'uc1' };
    const preset = {
      id: 'uc1',
      name: 'My CCT',
      loop_mode: 'count',
      loop_count: 3,
      end_behavior: 'hold',
      steps: [
        { color_temp: 300, brightness: 80, transition: 5, hold: 10 },
        { color_temp: 400, brightness: 60, transition: 5, hold: 10 },
      ],
    } as UserCCTSequencePreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, true, { brightness: 50 });
    const payload = hass.callService.mock.calls[0][2];
    expect(hass.callService).toHaveBeenCalledWith(DOMAIN, 'start_cct_sequence', expect.anything());
    // No top-level brightness override
    expect(payload.brightness).toBeUndefined();
    // Step fields wired up
    expect(payload.step_1_color_temp).toBe(300);
    expect(payload.step_1_brightness).toBe(80);
    expect(payload.step_2_color_temp).toBe(400);
    expect(payload.loop_count).toBe(3);
  });

  it('user cct_sequence in solar/schedule mode just resolves by name', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'cct_sequence', id: 'uc1' };
    const preset = {
      id: 'uc1',
      name: 'Adaptive',
      mode: 'solar',
      steps: [],
      loop_mode: 'forever',
      end_behavior: 'hold',
    } as UserCCTSequencePreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, true, {});
    const payload = hass.callService.mock.calls[0][2];
    expect(payload.preset).toBe('Adaptive');
    expect(payload.turn_on).toBeUndefined();
    expect(payload.step_1_color_temp).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // built-in segment_sequence
  // -------------------------------------------------------------------------
  it('built-in segment_sequence supports brightness option', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'segment_sequence', id: 's1' };
    const preset = { id: 's1', name: 'Seq' } as SegmentSequencePreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, false, { brightness: 70 });
    expect(hass.callService).toHaveBeenCalledWith(
      DOMAIN,
      'start_segment_sequence',
      expect.objectContaining({ entity_id: ['light.bulb'], preset: 's1', brightness: 70 }),
    );
  });

  // -------------------------------------------------------------------------
  // user segment_sequence
  // -------------------------------------------------------------------------
  it('user segment_sequence builds step fields with optional brightness', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'segment_sequence', id: 'us1' };
    const preset = {
      id: 'us1',
      name: 'My Seg',
      loop_mode: 'forever',
      end_behavior: 'hold',
      steps: [
        {
          segments: '1-4',
          colors: [[255, 0, 0], [0, 255, 0]],
          mode: 'shuffle',
          duration: 5,
          hold: 1,
          activation_pattern: 'sequential',
        },
      ],
    } as UserSegmentSequencePreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, true, { brightness: 80 });
    const payload = hass.callService.mock.calls[0][2];
    expect(hass.callService).toHaveBeenCalledWith(DOMAIN, 'start_segment_sequence', expect.anything());
    expect(payload.step_1_segments).toBe('1-4');
    expect(payload.step_1_color_1).toEqual([255, 0, 0]);
    expect(payload.step_1_color_2).toEqual([0, 255, 0]);
    expect(payload.brightness).toBe(80);
  });

  // -------------------------------------------------------------------------
  // built-in dynamic_scene
  // -------------------------------------------------------------------------
  it('built-in dynamic_scene replaces per-color brightness_pct with options.brightness', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'dynamic_scene', id: 'sunset' };
    const preset = {
      id: 'sunset',
      name: 'Sunset',
      transition_time: 5,
      hold_time: 3,
      distribution_mode: 'shuffle_rotate',
      offset_delay: 0,
      random_order: false,
      loop_mode: 'forever',
      end_behavior: 'hold',
      colors: [
        { x: 0.5, y: 0.5, brightness_pct: 100 },
        { x: 0.6, y: 0.4, brightness_pct: 80 },
      ],
    } as DynamicScenePreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, false, { brightness: 50 });
    expect(hass.callService).toHaveBeenCalledWith(DOMAIN, 'start_dynamic_scene', expect.anything());
    const payload = hass.callService.mock.calls[0][2];
    expect(payload.colors).toEqual([
      { x: 0.5, y: 0.5, brightness_pct: 50 },
      { x: 0.6, y: 0.4, brightness_pct: 50 },
    ]);
  });

  it('built-in dynamic_scene preserves per-color brightness_pct when no override', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'dynamic_scene', id: 'sunset' };
    const preset = {
      id: 'sunset',
      name: 'Sunset',
      transition_time: 5,
      hold_time: 3,
      distribution_mode: 'shuffle_rotate',
      offset_delay: 0,
      random_order: false,
      loop_mode: 'forever',
      end_behavior: 'hold',
      colors: [{ x: 0.5, y: 0.5, brightness_pct: 100 }],
    } as DynamicScenePreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, false, {});
    const payload = hass.callService.mock.calls[0][2];
    expect(payload.colors).toEqual([{ x: 0.5, y: 0.5, brightness_pct: 100 }]);
  });

  // -------------------------------------------------------------------------
  // user dynamic_scene
  // -------------------------------------------------------------------------
  it('user dynamic_scene applies brightness override to colors', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'dynamic_scene', id: 'ud1' };
    const preset = {
      id: 'ud1',
      name: 'My Scene',
      transition_time: 5,
      hold_time: 2,
      distribution_mode: 'shuffle_rotate',
      offset_delay: 0,
      random_order: false,
      loop_mode: 'forever',
      end_behavior: 'hold',
      colors: [
        { x: 0.2, y: 0.3, brightness_pct: 100 },
      ],
    } as UserDynamicScenePreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, true, { brightness: 40 });
    const payload = hass.callService.mock.calls[0][2];
    expect(hass.callService).toHaveBeenCalledWith(DOMAIN, 'start_dynamic_scene', expect.anything());
    expect(payload.colors).toEqual([{ x: 0.2, y: 0.3, brightness_pct: 40 }]);
    expect(payload.scene_name).toBe('My Scene');
  });

  // -------------------------------------------------------------------------
  // misc
  // -------------------------------------------------------------------------
  it('returns early without callService when entityIds is empty', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'effect', id: 'r' };
    const preset = { id: 'r', name: 'R' } as DynamicEffectPreset;
    await activatePreset(hass as any, [], ref, preset, false, {});
    expect(hass.callService).not.toHaveBeenCalled();
  });

  it('passes distribution_mode override when useDistributionModeOverride is set', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'dynamic_scene', id: 's1' };
    const preset = {
      id: 's1',
      name: 'S1',
      transition_time: 5,
      hold_time: 2,
      distribution_mode: 'shuffle_rotate',
      offset_delay: 0,
      random_order: false,
      loop_mode: 'forever',
      end_behavior: 'hold',
      colors: [{ x: 0.1, y: 0.2, brightness_pct: 100 }],
    } as DynamicScenePreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, false, {
      useDistributionModeOverride: true,
      distributionModeOverride: 'broadcast',
    });
    const payload = hass.callService.mock.calls[0][2];
    expect(payload.distribution_mode).toBe('broadcast');
  });

  // -------------------------------------------------------------------------
  // audio paths
  // -------------------------------------------------------------------------
  it('built-in effect audio override sets audio_entity from override', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'effect', id: 'rainbow' };
    const preset = { id: 'rainbow', name: 'Rainbow' } as DynamicEffectPreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, false, {
      useEffectAudioReactive: true,
      audioOverrideEntity: 'sensor.x',
    });
    const payload = hass.callService.mock.calls[0][2];
    expect(payload.audio_entity).toBe('sensor.x');
  });

  it('user effect uses preset audio_config.audio_entity when override is off', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'effect', id: 'u1' };
    const preset = {
      id: 'u1',
      name: 'My',
      effect: 'jitter',
      effect_speed: 50,
      effect_colors: [{ x: 0.5, y: 0.5 }],
      audio_config: { audio_entity: 'sensor.preset', audio_sensitivity: 60 },
    } as unknown as UserEffectPreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, true, {});
    const payload = hass.callService.mock.calls[0][2];
    expect(payload.audio_entity).toBe('sensor.preset');
  });

  it('dynamic scene audio override sets audio_entity and brightness curve fields', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'dynamic_scene', id: 's1' };
    const preset = {
      id: 's1',
      name: 'S1',
      transition_time: 5,
      hold_time: 2,
      distribution_mode: 'shuffle_rotate',
      offset_delay: 0,
      random_order: false,
      loop_mode: 'forever',
      end_behavior: 'hold',
      colors: [{ x: 0.1, y: 0.2, brightness_pct: 100 }],
    } as DynamicScenePreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, false, {
      useAudioReactive: true,
      audioOverrideEntity: 'sensor.x',
      audioOverrideBrightnessCurve: 'logarithmic',
      audioOverrideBrightnessMin: 10,
      audioOverrideBrightnessMax: 90,
      audioOverrideRolloffBrightness: true,
    });
    const payload = hass.callService.mock.calls[0][2];
    expect(payload.audio_entity).toBe('sensor.x');
    expect(payload.audio_brightness_curve).toBe('logarithmic');
    expect(payload.audio_brightness_min).toBe(10);
    expect(payload.audio_brightness_max).toBe(90);
    expect(payload.audio_rolloff_brightness).toBe(true);
  });

  it('dynamic scene full audio override writes all panel-equivalent audio fields', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'dynamic_scene', id: 's1' };
    const preset = {
      id: 's1',
      name: 'S1',
      transition_time: 5,
      hold_time: 2,
      distribution_mode: 'shuffle_rotate',
      offset_delay: 0,
      random_order: false,
      loop_mode: 'forever',
      end_behavior: 'hold',
      colors: [{ x: 0.1, y: 0.2, brightness_pct: 100 }],
    } as DynamicScenePreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, false, {
      useAudioReactive: true,
      audioOverrideEntity: 'sensor.mic',
      audioOverrideSensitivity: 70,
      audioOverrideColorAdvance: 'continuous',
      audioOverrideTransitionSpeed: 25,
      audioOverrideBrightnessCurve: 'logarithmic',
      audioOverrideBrightnessMin: 5,
      audioOverrideBrightnessMax: 95,
      audioOverrideDetectionMode: 'spectral_flux',
      audioOverrideFrequencyZone: true,
      audioOverrideSilenceBehavior: 'decay_min',
      audioOverridePredictionAggressiveness: 80,
      audioOverrideLatencyCompensationMs: 120,
      audioOverrideColorByFrequency: true,
      audioOverrideRolloffBrightness: false,
    });
    const payload = hass.callService.mock.calls[0][2];
    expect(payload.audio_entity).toBe('sensor.mic');
    expect(payload.audio_sensitivity).toBe(70);
    expect(payload.audio_color_advance).toBe('continuous');
    expect(payload.audio_transition_speed).toBe(25);
    expect(payload.audio_brightness_curve).toBe('logarithmic');
    expect(payload.audio_brightness_min).toBe(5);
    expect(payload.audio_brightness_max).toBe(95);
    expect(payload.audio_detection_mode).toBe('spectral_flux');
    expect(payload.audio_frequency_zone).toBe(true);
    expect(payload.audio_silence_behavior).toBe('decay_min');
    expect(payload.audio_prediction_aggressiveness).toBe(80);
    expect(payload.audio_latency_compensation_ms).toBe(120);
    expect(payload.audio_color_by_frequency).toBe(true);
    expect(payload.audio_rolloff_brightness).toBe(false);
  });

  it('dynamic scene with no override propagates preset audio_entity via _applyPresetAudioFields', async () => {
    const hass = makeHass();
    const ref: FavoritePresetRef = { type: 'dynamic_scene', id: 's1' };
    const preset = {
      id: 's1',
      name: 'S1',
      transition_time: 5,
      hold_time: 2,
      distribution_mode: 'shuffle_rotate',
      offset_delay: 0,
      random_order: false,
      loop_mode: 'forever',
      end_behavior: 'hold',
      colors: [{ x: 0.1, y: 0.2, brightness_pct: 100 }],
      audio_entity: 'sensor.preset',
      audio_color_advance: 'continuous',
    } as unknown as DynamicScenePreset;

    await activatePreset(hass as any, ['light.bulb'], ref, preset, false, {});
    const payload = hass.callService.mock.calls[0][2];
    expect(payload.audio_entity).toBe('sensor.preset');
  });
});
