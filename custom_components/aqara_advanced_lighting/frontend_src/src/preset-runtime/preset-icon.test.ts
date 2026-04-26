import { describe, it, expect } from 'vitest';
import { render, type TemplateResult } from 'lit';
import { renderPresetIcon } from './preset-icon';
import type {
  FavoritePresetRef,
  UserEffectPreset,
  DynamicScenePreset,
  UserDynamicScenePreset,
  AnyPreset,
} from '../types';

const renderToHTML = (template: TemplateResult): string => {
  const container = document.createElement('div');
  render(template, container);
  return container.innerHTML;
};

describe('renderPresetIcon', () => {
  it('user effect with audio_config.audio_entity AND no icon shows audio badge', () => {
    const ref: FavoritePresetRef = { type: 'effect', id: 'u1' };
    const preset = {
      id: 'u1',
      name: 'My',
      effect: 'jitter',
      effect_speed: 50,
      effect_colors: [{ x: 0.5, y: 0.5 }],
      audio_config: { audio_entity: 'sensor.audio' },
    } as unknown as UserEffectPreset;
    const html = renderToHTML(renderPresetIcon(ref, preset, true));
    expect(html).toContain('audio-badge');
  });

  it('user effect with audio_config.audio_entity AND custom icon does NOT show audio badge', () => {
    const ref: FavoritePresetRef = { type: 'effect', id: 'u1' };
    const preset = {
      id: 'u1',
      name: 'My',
      effect: 'jitter',
      effect_speed: 50,
      effect_colors: [{ x: 0.5, y: 0.5 }],
      icon: 'mdi:music',
      audio_config: { audio_entity: 'sensor.audio' },
    } as unknown as UserEffectPreset;
    const html = renderToHTML(renderPresetIcon(ref, preset, true));
    expect(html).not.toContain('audio-badge');
  });

  it('builtin dynamic scene with audio_color_advance shows audio badge', () => {
    const ref: FavoritePresetRef = { type: 'dynamic_scene', id: 'b1' };
    const preset = {
      name: 'Scene',
      colors: [{ x: 0.5, y: 0.5, brightness_pct: 50 }],
      audio_color_advance: 'continuous',
    } as unknown as DynamicScenePreset;
    const html = renderToHTML(renderPresetIcon(ref, preset, false));
    expect(html).toContain('audio-badge');
  });

  it('builtin dynamic scene without audio_color_advance does NOT show audio badge', () => {
    const ref: FavoritePresetRef = { type: 'dynamic_scene', id: 'b1' };
    const preset = {
      name: 'Scene',
      colors: [{ x: 0.5, y: 0.5, brightness_pct: 50 }],
    } as unknown as DynamicScenePreset;
    const html = renderToHTML(renderPresetIcon(ref, preset, false));
    expect(html).not.toContain('audio-badge');
  });

  it('user dynamic scene with audio_entity AND custom icon DOES show audio badge', () => {
    // Panel parity: user dynamic scenes show the badge on top of a custom icon
    // when audio is enabled (panel:4555-4559). Different from user effect.
    const ref: FavoritePresetRef = { type: 'dynamic_scene', id: 'ud1' };
    const preset = {
      name: 'My Scene',
      icon: 'mdi:lightbulb',
      colors: [{ x: 0.5, y: 0.5, brightness_pct: 50 }],
      audio_entity: 'sensor.audio',
    } as unknown as UserDynamicScenePreset;
    const html = renderToHTML(renderPresetIcon(ref, preset, true));
    expect(html).toContain('audio-badge');
  });

  it('falls back to mdi:star for unknown ref type', () => {
    const ref = { type: 'unknown' as FavoritePresetRef['type'], id: 'x' };
    const html = renderToHTML(renderPresetIcon(ref, {} as AnyPreset, false));
    expect(html).toContain('mdi:star');
  });
});
