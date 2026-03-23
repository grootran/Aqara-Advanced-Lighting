/**
 * Builtin-to-user preset conversion functions.
 * Pure data transformations — no component state.
 */

import { rgbToXy } from './color-utils';
import type {
  CCTSequencePreset,
  DynamicEffectPreset,
  DynamicScenePreset,
  SegmentPatternPreset,
  SegmentSequencePreset,
  UserCCTSequencePreset,
  UserDynamicScenePreset,
  UserEffectPreset,
  UserSegmentPatternPreset,
  UserSegmentSequencePreset,
} from './types';

export function scaleSegmentPattern<T>(source: T[], targetCount: number): T[] {
  const sourceCount = source.length;
  if (targetCount < 1 || sourceCount < 1) return [];
  if (targetCount === sourceCount) return [...source];
  return Array.from({ length: targetCount }, (_, i) =>
    source[Math.floor(i * sourceCount / targetCount)]!
  );
}

export function builtinEffectToUser(
  preset: DynamicEffectPreset, deviceType: string, copyLabel: string,
): UserEffectPreset {
  return {
    id: '',
    name: `${preset.name} ${copyLabel}`,
    effect: preset.effect,
    effect_speed: preset.speed,
    effect_brightness: preset.brightness != null ? Math.round(preset.brightness / 255 * 100) : 100,
    effect_colors: preset.colors.map((c) => rgbToXy(c[0]!, c[1]!, c[2]!)),
    device_type: deviceType,
    created_at: '',
    modified_at: '',
  };
}

export function builtinPatternToUser(
  preset: SegmentPatternPreset, deviceType: string, targetSegmentCount: number, copyLabel: string,
): UserSegmentPatternPreset {
  const scaled = scaleSegmentPattern(preset.segments, targetSegmentCount);
  return {
    id: '',
    name: `${preset.name} ${copyLabel}`,
    device_type: deviceType,
    segments: scaled.map((seg, index) => ({
      segment: index + 1,
      color: { r: seg[0]!, g: seg[1]!, b: seg[2]! },
    })),
    created_at: '',
    modified_at: '',
  };
}

export function builtinCCTToUser(
  preset: CCTSequencePreset, copyLabel: string,
): UserCCTSequencePreset {
  const mode = (preset as any).mode as string | undefined;
  return {
    id: '',
    name: `${preset.name} ${copyLabel}`,
    steps: mode ? [] : (preset.steps || []).map((step) => ({
      ...step,
      brightness: Math.round(step.brightness / 255 * 100),
    })),
    loop_mode: preset.loop_mode,
    loop_count: preset.loop_count,
    end_behavior: preset.end_behavior,
    ...(mode === 'solar' ? { mode: 'solar', solar_steps: ((preset as any).solar_steps || []).map((s: any) => ({
      ...s,
      brightness: Math.round(s.brightness / 255 * 100),
    })) } : {}),
    ...(mode === 'schedule' ? { mode: 'schedule', schedule_steps: ((preset as any).schedule_steps || []).map((s: any) => ({
      ...s,
      brightness: Math.round(s.brightness / 255 * 100),
    })) } : {}),
    created_at: '',
    modified_at: '',
  };
}

export function builtinSegmentSequenceToUser(
  preset: SegmentSequencePreset, deviceType: string, copyLabel: string,
): UserSegmentSequencePreset {
  return {
    id: '',
    name: `${preset.name} ${copyLabel}`,
    device_type: deviceType,
    steps: preset.steps.map((step) => ({ ...step })),
    loop_mode: preset.loop_mode,
    loop_count: preset.loop_count,
    end_behavior: preset.end_behavior,
    created_at: '',
    modified_at: '',
  };
}

export function builtinDynamicSceneToUser(
  preset: DynamicScenePreset, copyLabel: string,
): UserDynamicScenePreset {
  return {
    id: '',
    name: `${preset.name} ${copyLabel}`,
    colors: preset.colors.map((color) => ({ ...color })),
    transition_time: preset.transition_time,
    hold_time: preset.hold_time,
    distribution_mode: preset.distribution_mode,
    offset_delay: preset.offset_delay,
    random_order: preset.random_order,
    loop_mode: preset.loop_mode,
    loop_count: preset.loop_count,
    end_behavior: preset.end_behavior,
    created_at: '',
    modified_at: '',
  };
}
