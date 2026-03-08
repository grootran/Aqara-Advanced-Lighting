/**
 * SVG thumbnail generators for user preset previews
 *
 * Generates inline SVG visuals from preset color data, replacing generic MDI
 * fallback icons with color-accurate previews. Geometry matches the existing
 * static pie-chart SVGs used for built-in segment pattern presets (400x400
 * viewBox, center 200,200, radius 180).
 */

import { html, TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { xyToRgb, rgbToHex, rgbToHs } from './color-utils';
import type {
  DynamicSceneColor,
  DynamicScenePreset,
  RGBColor,
  SolarStep,
  XYColor,
  UserDynamicScenePreset,
  UserEffectPreset,
  UserSegmentPatternPreset,
  UserCCTSequencePreset,
  UserSegmentSequencePreset,
} from './types';

// Matches the existing static preset SVGs (preset_01.svg through preset_12.svg)
const SIZE = 400;
const CX = 200;
const CY = 200;
const R = 180;

// Donut ring radii for segment sequence thumbnails
const RING_OUTER = 180;
const RING_INNER = 80;

/**
 * Convert an angle in degrees to cartesian coordinates on the circle.
 * 0 degrees is the 12-o'clock position (top center), increasing clockwise.
 */
function toXY(angleDeg: number, radius: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [
    Math.round((CX + radius * Math.cos(rad)) * 100) / 100,
    Math.round((CY + radius * Math.sin(rad)) * 100) / 100,
  ];
}

/**
 * Build an SVG path string for a pie slice from the center.
 */
function pieSlice(startDeg: number, endDeg: number, color: string): string {
  if (endDeg - startDeg >= 360) {
    // Full circle -- use two arcs to avoid zero-length path
    return `<circle cx="${CX}" cy="${CY}" r="${R}" fill="${color}" />`;
  }
  const [x1, y1] = toXY(startDeg, R);
  const [x2, y2] = toXY(endDeg, R);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  // stroke matching fill eliminates anti-alias hairline gaps between segments
  return `<path fill="${color}" stroke="${color}" stroke-width="1" d="M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} Z" />`;
}

/**
 * Build an SVG path string for a donut arc (ring segment).
 */
function donutArc(startDeg: number, endDeg: number, color: string): string {
  if (endDeg - startDeg >= 360) {
    // Full ring
    return [
      `<circle cx="${CX}" cy="${CY}" r="${RING_OUTER}" fill="${color}" />`,
      `<circle cx="${CX}" cy="${CY}" r="${RING_INNER}" fill="var(--card-background-color, #fff)" />`,
    ].join('');
  }
  const [x1o, y1o] = toXY(startDeg, RING_OUTER);
  const [x2o, y2o] = toXY(endDeg, RING_OUTER);
  const [x2i, y2i] = toXY(endDeg, RING_INNER);
  const [x1i, y1i] = toXY(startDeg, RING_INNER);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  // stroke matching fill eliminates anti-alias hairline gaps between segments
  return (
    `<path fill="${color}" stroke="${color}" stroke-width="1" d="` +
    `M${x1o},${y1o} A${RING_OUTER},${RING_OUTER} 0 ${large},1 ${x2o},${y2o} ` +
    `L${x2i},${y2i} A${RING_INNER},${RING_INNER} 0 ${large},0 ${x1i},${y1i} Z" />`
  );
}

/**
 * Convert a CIE 1931 XY color to a hex string at full brightness.
 */
function xyToHex(c: XYColor): string {
  return rgbToHex(xyToRgb(c.x, c.y, 255));
}

/**
 * Convert a DynamicSceneColor (XY + brightness_pct) to a hex string.
 * Applies brightness_pct to dim the color appropriately.
 */
function dynamicSceneColorToHex(c: DynamicSceneColor): string {
  // Convert brightness_pct (0-100) to 0-255 range
  const brightness = Math.round((c.brightness_pct / 100) * 255);
  return rgbToHex(xyToRgb(c.x, c.y, brightness));
}

// ---------------------------------------------------------------------------
// Merge adjacent segments
// ---------------------------------------------------------------------------

interface MergedSlice {
  hex: string;
  startDeg: number;
  endDeg: number;
}

// Maximum distinct slices to render in a thumbnail
const MAX_SLICES = 8;

// Simple LRU-ish memoization cache for merged slices (avoids re-sorting during render)
const _mergeCache = new Map<string, MergedSlice[]>();
const MERGE_CACHE_MAX = 64;

/**
 * Merge consecutive segments that share the same color into wider slices.
 * Segments are sorted by index first to ensure spatial ordering.
 * If the result exceeds MAX_SLICES, uniformly sample down to MAX_SLICES.
 * Results are memoized to avoid re-sorting during Lit render cycles.
 */
function mergeSegments(
  segments: { segment: number | string; color: RGBColor }[],
): MergedSlice[] {
  if (segments.length === 0) return [];

  // Build a cache key from segment index + color
  const cacheKey = 'seg:' + segments.map(s => `${s.segment}:${s.color.r},${s.color.g},${s.color.b}`).join('|');
  const cached = _mergeCache.get(cacheKey);
  if (cached) return cached;

  const sorted = [...segments].sort((a, b) => {
    const ai = typeof a.segment === 'number' ? a.segment : parseInt(a.segment, 10);
    const bi = typeof b.segment === 'number' ? b.segment : parseInt(b.segment, 10);
    return ai - bi;
  });

  const degPerSeg = 360 / sorted.length;
  const slices: MergedSlice[] = [];

  let runHex = rgbToHex(sorted[0]!.color);
  let runStart = 0;

  for (let i = 1; i < sorted.length; i++) {
    const hex = rgbToHex(sorted[i]!.color);
    if (hex !== runHex) {
      slices.push({ hex: runHex, startDeg: runStart, endDeg: i * degPerSeg });
      runHex = hex;
      runStart = i * degPerSeg;
    }
  }
  // Close the final run
  slices.push({ hex: runHex, startDeg: runStart, endDeg: 360 });

  const result = capSlices(slices);

  // Evict oldest entries if cache is full
  if (_mergeCache.size >= MERGE_CACHE_MAX) {
    const firstKey = _mergeCache.keys().next().value;
    if (firstKey !== undefined) _mergeCache.delete(firstKey);
  }
  _mergeCache.set(cacheKey, result);

  return result;
}

/**
 * Merge consecutive hex colors into slices, then cap to MAX_SLICES.
 * Results are memoized to avoid re-computation during Lit render cycles.
 */
function mergeHexColors(hexColors: string[]): MergedSlice[] {
  if (hexColors.length === 0) return [];

  const cacheKey = 'hex:' + hexColors.join('|');
  const cached = _mergeCache.get(cacheKey);
  if (cached) return cached;

  const degPer = 360 / hexColors.length;
  const slices: MergedSlice[] = [];

  let runHex = hexColors[0]!;
  let runStart = 0;

  for (let i = 1; i < hexColors.length; i++) {
    if (hexColors[i] !== runHex) {
      slices.push({ hex: runHex, startDeg: runStart, endDeg: i * degPer });
      runHex = hexColors[i]!;
      runStart = i * degPer;
    }
  }
  slices.push({ hex: runHex, startDeg: runStart, endDeg: 360 });

  const result = capSlices(slices);

  if (_mergeCache.size >= MERGE_CACHE_MAX) {
    const firstKey = _mergeCache.keys().next().value;
    if (firstKey !== undefined) _mergeCache.delete(firstKey);
  }
  _mergeCache.set(cacheKey, result);

  return result;
}

/**
 * If there are more slices than MAX_SLICES, uniformly sample them down.
 */
function capSlices(slices: MergedSlice[]): MergedSlice[] {
  if (slices.length <= MAX_SLICES) return slices;

  const sampled: MergedSlice[] = [];
  const degPer = 360 / MAX_SLICES;
  for (let i = 0; i < MAX_SLICES; i++) {
    const idx = Math.round((i / MAX_SLICES) * slices.length) % slices.length;
    sampled.push({ hex: slices[idx]!.hex, startDeg: i * degPer, endDeg: (i + 1) * degPer });
  }
  return sampled;
}

// ---------------------------------------------------------------------------
// Kelvin to approximate sRGB
// ---------------------------------------------------------------------------

/**
 * Convert color temperature in Kelvin (2700-6500) to an approximate hex color.
 * Uses Tanner Helland's algorithm.
 */
function kelvinToHex(kelvin: number): string {
  const temp = kelvin / 100;
  let r: number;
  let g: number;
  let b: number;

  if (temp <= 66) {
    r = 255;
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
    r = Math.max(0, Math.min(255, r));
  }

  if (temp <= 66) {
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
  } else {
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
  }
  g = Math.max(0, Math.min(255, g));

  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
    b = Math.max(0, Math.min(255, b));
  }

  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ---------------------------------------------------------------------------
// Wrapping helper -- builds the <svg> tag once, used by every renderer
// ---------------------------------------------------------------------------

function wrapSvg(innerContent: string): string {
  return `<svg viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">${innerContent}</svg>`;
}

/**
 * Wrap SVG content with a class for rectangular gradient thumbnails.
 * The class allows CSS to override the default circular border-radius.
 */
function wrapGradientSvg(innerContent: string): string {
  return `<svg class="gradient-thumb" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">${innerContent}</svg>`;
}

// ---------------------------------------------------------------------------
// Public render functions
// ---------------------------------------------------------------------------

/**
 * Segment pattern preset -- pie chart with deduplicated adjacent colors.
 *
 * Matches the visual style of preset_01.svg through preset_12.svg but driven
 * by the preset's runtime color data.
 */
export function renderSegmentPatternThumbnail(
  preset: UserSegmentPatternPreset,
): TemplateResult | null {
  if (!preset.segments || preset.segments.length === 0) return null;

  const slices = mergeSegments(preset.segments);
  const paths = slices.map((s) => pieSlice(s.startDeg, s.endDeg, s.hex)).join('');

  return html`${unsafeSvg(wrapSvg(paths))}`;
}

/**
 * Effect preset -- color palette grid.
 *
 * Shows 1-8 XY colors as equal pie slices so the thumbnail is always circular
 * and visually consistent with segment pattern thumbnails.
 */
export function renderEffectThumbnail(
  preset: UserEffectPreset,
): TemplateResult | null {
  const colors = (preset.effect_colors ?? []).slice(0, 8);
  if (colors.length === 0) return null;

  if (colors.length === 1) {
    const hex = xyToHex(colors[0]!);
    return html`${unsafeSvg(wrapSvg(`<circle cx="${CX}" cy="${CY}" r="${R}" fill="${hex}" />`))}`;
  }

  const degPer = 360 / colors.length;
  const paths = colors
    .map((c, i) => pieSlice(i * degPer, (i + 1) * degPer, xyToHex(c)))
    .join('');

  return html`${unsafeSvg(wrapSvg(paths))}`;
}

/**
 * Segment sequence preset -- donut ring from first step's colors.
 *
 * Renders the colors of the first animation step as arcs in a ring to
 * distinguish these from solid-pie segment pattern thumbnails.
 */
export function renderSegmentSequenceThumbnail(
  preset: UserSegmentSequencePreset,
): TemplateResult | null {
  if (!preset.steps || preset.steps.length === 0) return null;

  const step = preset.steps[0]!;
  let hexColors: string[] = [];

  if (step.segment_colors && step.segment_colors.length > 0) {
    hexColors = step.segment_colors.map((sc) => rgbToHex(sc.color));
  } else if (step.colors && step.colors.length > 0) {
    // Legacy format: colors are number[][] (RGB arrays [r, g, b])
    hexColors = step.colors.map((c: number[]) => {
      return rgbToHex({ r: c[0] ?? 0, g: c[1] ?? 0, b: c[2] ?? 0 });
    });
  }

  if (hexColors.length === 0) return null;

  const slices = mergeHexColors(hexColors);

  if (slices.length === 1) {
    const arcs = [
      `<circle cx="${CX}" cy="${CY}" r="${RING_OUTER}" fill="${slices[0]!.hex}" />`,
      `<circle cx="${CX}" cy="${CY}" r="${RING_INNER}" fill="var(--card-background-color, #fff)" />`,
    ].join('');
    return html`${unsafeSvg(wrapSvg(arcs))}`;
  }

  const arcs = slices
    .map((s) => donutArc(s.startDeg, s.endDeg, s.hex))
    .join('');

  return html`${unsafeSvg(wrapSvg(arcs))}`;
}

// ---------------------------------------------------------------------------
// Solar mode -- arc gradient representing the sun's path
// ---------------------------------------------------------------------------

/** Arc geometry for the solar thumbnail. */
const ARC_CY = 290;
const ARC_OUTER = 180;
const ARC_INNER = 130;

/**
 * Order solar steps into a sunrise-to-sunset narrative.
 * Rising steps are sorted by elevation ascending (dawn to midday), followed
 * by any-phase steps at their natural elevation, then setting steps sorted by
 * elevation descending (midday back to dusk).
 */
function orderSolarSteps(steps: SolarStep[]): SolarStep[] {
  const rising = steps
    .filter((s) => s.phase === 'rising')
    .sort((a, b) => a.sun_elevation - b.sun_elevation);
  const any = steps
    .filter((s) => s.phase === 'any')
    .sort((a, b) => a.sun_elevation - b.sun_elevation);
  const setting = steps
    .filter((s) => s.phase === 'setting')
    .sort((a, b) => b.sun_elevation - a.sun_elevation);
  return [...rising, ...any, ...setting];
}

/**
 * Solar CCT preset -- semicircular arc gradient.
 *
 * Renders the color temperature steps as a thick arc band evoking the sun's
 * path from horizon to horizon. A thin horizon line sits below the arc.
 * Steps are ordered sunrise-to-sunset: rising (ascending elevation), any-phase,
 * then setting (descending elevation).
 */
function renderSolarThumbnail(
  preset: UserCCTSequencePreset,
): TemplateResult | null {
  const steps = preset.solar_steps ?? [];
  if (steps.length === 0) return null;

  const ordered = orderSolarSteps(steps);
  const temps = ordered.map((s) => s.color_temp);

  // Single temperature -- solid-fill arc
  if (temps.length === 1) {
    const hex = kelvinToHex(temps[0]!);
    const arcPath =
      `M ${CX - ARC_OUTER},${ARC_CY} ` +
      `A ${ARC_OUTER},${ARC_OUTER} 0 0,1 ${CX + ARC_OUTER},${ARC_CY} ` +
      `L ${CX + ARC_INNER},${ARC_CY} ` +
      `A ${ARC_INNER},${ARC_INNER} 0 0,0 ${CX - ARC_INNER},${ARC_CY} Z`;
    const horizon =
      `<line x1="15" y1="${ARC_CY}" x2="385" y2="${ARC_CY}" ` +
      `stroke="var(--secondary-text-color, #888)" stroke-width="2" stroke-opacity="0.4" />`;
    return html`${unsafeSvg(wrapGradientSvg(
      `<path fill="${hex}" d="${arcPath}" />${horizon}`,
    ))}`;
  }

  const gradientId = `solar-${preset.id}`;
  const stops = temps
    .map((t, i) => {
      const offset = Math.round((i / (temps.length - 1)) * 100);
      return `<stop offset="${offset}%" stop-color="${kelvinToHex(t)}" />`;
    })
    .join('');

  // Horizontal gradient mapped onto the arc band
  const arcPath =
    `M ${CX - ARC_OUTER},${ARC_CY} ` +
    `A ${ARC_OUTER},${ARC_OUTER} 0 0,1 ${CX + ARC_OUTER},${ARC_CY} ` +
    `L ${CX + ARC_INNER},${ARC_CY} ` +
    `A ${ARC_INNER},${ARC_INNER} 0 0,0 ${CX - ARC_INNER},${ARC_CY} Z`;

  const horizon =
    `<line x1="15" y1="${ARC_CY}" x2="385" y2="${ARC_CY}" ` +
    `stroke="var(--secondary-text-color, #888)" stroke-width="2" stroke-opacity="0.4" />`;

  const inner =
    `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient></defs>` +
    `<path fill="url(#${gradientId})" d="${arcPath}" />${horizon}`;

  return html`${unsafeSvg(wrapGradientSvg(inner))}`;
}

// ---------------------------------------------------------------------------
// Schedule mode -- vertical stacked bands representing time slots
// ---------------------------------------------------------------------------

/** Estimated minutes-since-midnight for sunrise/sunset (used only for icon ordering). */
const SUNRISE_MINUTES = 360;  // 06:00
const SUNSET_MINUTES = 1080;  // 18:00

/**
 * Parse a schedule time string into minutes-since-midnight for sorting.
 * Accepts "HH:MM", "sunrise", "sunset", and offset variants like "sunrise+30".
 */
function parseScheduleMinutes(time: string): number {
  const clock = time.match(/^(\d{1,2}):(\d{2})$/);
  if (clock) {
    return parseInt(clock[1]!, 10) * 60 + parseInt(clock[2]!, 10);
  }
  const sun = time.match(/^(sunrise|sunset)([+-]\d+)?$/);
  if (sun) {
    const base = sun[1] === 'sunrise' ? SUNRISE_MINUTES : SUNSET_MINUTES;
    const offset = sun[2] ? parseInt(sun[2], 10) : 0;
    return base + offset;
  }
  return 0;
}

/**
 * Schedule CCT preset -- vertical stacked color bands.
 *
 * Each schedule step becomes a horizontal band whose height is proportional
 * to the time gap until the next step. Hard edges between bands communicate
 * discrete scheduled time slots. A clipPath provides rounded corners.
 */
function renderScheduleThumbnail(
  preset: UserCCTSequencePreset,
): TemplateResult | null {
  const steps = preset.schedule_steps ?? [];
  if (steps.length === 0) return null;

  // Sort chronologically by parsed time
  const sorted = [...steps].sort(
    (a, b) => parseScheduleMinutes(a.time) - parseScheduleMinutes(b.time),
  );
  const temps = sorted.map((s) => s.color_temp);

  // Single step -- solid fill rectangle
  if (temps.length === 1) {
    const hex = kelvinToHex(temps[0]!);
    return html`${unsafeSvg(wrapGradientSvg(
      `<rect fill="${hex}" x="10" y="10" width="380" height="380" rx="8" />`,
    ))}`;
  }

  // Calculate proportional band heights from time gaps
  const minutes = sorted.map((s) => parseScheduleMinutes(s.time));
  const gaps: number[] = [];
  for (let i = 0; i < minutes.length; i++) {
    const next = i < minutes.length - 1 ? minutes[i + 1]! : minutes[i]! + 60;
    gaps.push(Math.max(next - minutes[i]!, 1));
  }
  const totalGap = gaps.reduce((sum, g) => sum + g, 0);

  // Build stacked rectangles clipped to a rounded rect
  const clipId = `sched-clip-${preset.id}`;
  const bandHeight = 380; // total available height
  let y = 10; // starting y position (matches rect inset)
  const rects = temps
    .map((t, i) => {
      const h = Math.max(Math.round((gaps[i]! / totalGap) * bandHeight), 2);
      const hex = kelvinToHex(t);
      const rect = `<rect fill="${hex}" x="10" y="${y}" width="380" height="${h}" />`;
      y += h;
      return rect;
    })
    .join('');

  const inner =
    `<defs><clipPath id="${clipId}">` +
    `<rect x="10" y="10" width="380" height="380" rx="8" />` +
    `</clipPath></defs>` +
    `<g clip-path="url(#${clipId})">${rects}</g>`;

  return html`${unsafeSvg(wrapGradientSvg(inner))}`;
}

// ---------------------------------------------------------------------------
// CCT sequence preset -- dispatches to mode-specific renderer
// ---------------------------------------------------------------------------

/**
 * CCT sequence preset -- renders based on mode.
 *
 * Standard mode: warm-to-cool horizontal gradient.
 * Solar mode: semicircular arc gradient (sun path).
 * Schedule mode: vertical stacked color bands (time slots).
 *
 * Uses a unique gradient/clip ID per preset to avoid DOM collisions when
 * multiple CCT thumbnails are rendered on the same page.
 */
export function renderCCTSequenceThumbnail(
  preset: UserCCTSequencePreset,
): TemplateResult | null {
  // Dispatch to mode-specific renderers
  if (preset.mode === 'solar') return renderSolarThumbnail(preset);
  if (preset.mode === 'schedule') return renderScheduleThumbnail(preset);

  // Standard mode: horizontal gradient from step color temperatures
  const temps = (preset.steps ?? [])
    .map((s) => s.color_temp)
    .filter((t): t is number => t !== undefined && t !== null);
  if (temps.length === 0) return null;

  // Single temperature -- solid fill rectangle
  if (temps.length === 1) {
    const hex = kelvinToHex(temps[0]!);
    return html`${unsafeSvg(wrapGradientSvg(
      `<rect fill="${hex}" x="10" y="10" width="380" height="380" rx="8" />`,
    ))}`;
  }

  const gradientId = `cct-${preset.id}`;
  const stops = temps
    .map((t, i) => {
      const offset = Math.round((i / (temps.length - 1)) * 100);
      return `<stop offset="${offset}%" stop-color="${kelvinToHex(t)}" />`;
    })
    .join('');

  // Horizontal gradient from left to right
  const inner =
    `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient></defs>` +
    `<rect fill="url(#${gradientId})" x="10" y="10" width="380" height="380" rx="8" />`;

  return html`${unsafeSvg(wrapGradientSvg(inner))}`;
}

/**
 * Get the hue angle from a DynamicSceneColor for sorting.
 * Achromatic colors (zero saturation) are placed at the end of the sort
 * order to keep chromatic colors grouped smoothly.
 */
function dynamicSceneColorHue(c: DynamicSceneColor): number {
  const rgb = xyToRgb(c.x, c.y, 255);
  const hs = rgbToHs(rgb.r, rgb.g, rgb.b);
  return hs.s === 0 ? 360 : hs.h;
}

/**
 * Dynamic scene preset -- diagonal gradient with hue-sorted colors.
 *
 * Renders colors as a smooth gradient flowing from top-left to bottom-right
 * in a rounded rectangle. Colors are sorted by hue angle for visual
 * smoothness, with per-color brightness applied to the stops.
 *
 * Accepts a DynamicSceneColor array, UserDynamicScenePreset, or DynamicScenePreset.
 */
export function renderDynamicSceneThumbnail(
  colorsOrPreset: DynamicSceneColor[] | UserDynamicScenePreset | DynamicScenePreset,
): TemplateResult | null {
  // If the preset has an image thumbnail, render it as an <img> instead of SVG
  if (!Array.isArray(colorsOrPreset) && (colorsOrPreset as UserDynamicScenePreset).thumbnail) {
    const thumbId = (colorsOrPreset as UserDynamicScenePreset).thumbnail;
    return html`<img
      src="/api/aqara_advanced_lighting/thumbnails/${thumbId}"
      alt="Preset thumbnail"
      style="width:100%;height:100%;object-fit:cover;border-radius:4px"
    />`;
  }

  let colors: DynamicSceneColor[];
  let gradientId: string;

  if (Array.isArray(colorsOrPreset)) {
    colors = colorsOrPreset.slice(0, 8);
    gradientId = `ds-${colors.map(c => `${c.x}${c.y}`).join('')}`;
  } else {
    colors = (colorsOrPreset.colors ?? []).slice(0, 8);
    gradientId = `ds-${colorsOrPreset.id}`;
  }

  if (colors.length === 0) return null;

  // Single color -- solid fill rectangle
  if (colors.length === 1) {
    const hex = dynamicSceneColorToHex(colors[0]!);
    return html`${unsafeSvg(wrapGradientSvg(
      `<rect fill="${hex}" x="10" y="10" width="380" height="380" rx="8" />`,
    ))}`;
  }

  // Sort colors by hue for smooth visual transitions
  const sorted = [...colors].sort(
    (a, b) => dynamicSceneColorHue(a) - dynamicSceneColorHue(b),
  );

  const stops = sorted
    .map((c, i) => {
      const offset = Math.round((i / (sorted.length - 1)) * 100);
      return `<stop offset="${offset}%" stop-color="${dynamicSceneColorToHex(c)}" />`;
    })
    .join('');

  // Diagonal gradient from top-left to bottom-right
  const inner =
    `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs>` +
    `<rect fill="url(#${gradientId})" x="10" y="10" width="380" height="380" rx="8" />`;

  return html`${unsafeSvg(wrapGradientSvg(inner))}`;
}

// ---------------------------------------------------------------------------
// Lit-safe SVG injection
// ---------------------------------------------------------------------------

/**
 * Wrap unsafeHTML for SVG string injection into Lit templates.
 */
function unsafeSvg(svgString: string): ReturnType<typeof unsafeHTML> {
  return unsafeHTML(svgString);
}
