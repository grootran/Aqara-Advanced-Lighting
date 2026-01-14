/**
 * Color conversion utilities for XY and RGB color spaces
 * Provides bidirectional conversion between CIE 1931 XY and sRGB color spaces
 */

import { RGBColor, XYColor, HSColor } from './types';

/**
 * Round XY coordinate to 4 decimal places for consistency
 * This matches industry standards and provides sufficient precision
 * for Zigbee color control while reducing storage overhead.
 *
 * @param value - Coordinate value to round
 * @returns Rounded value to 4 decimal places
 */
function roundXY(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * Convert XY color (CIE 1931) to RGB (sRGB color space)
 *
 * @param x - X coordinate (0.0-1.0)
 * @param y - Y coordinate (0.0-1.0)
 * @param brightness - Brightness value (0-255), defaults to 255
 * @returns RGB color object with values 0-255
 */
export function xyToRgb(x: number, y: number, brightness: number = 255): RGBColor {
  // Prevent division by zero
  if (y === 0) {
    return { r: 0, g: 0, b: 0 };
  }

  // Convert XY to XYZ color space (using Y=1 as reference)
  const z = 1.0 - x - y;
  const Y = 1.0;
  const X = (Y / y) * x;
  const Z = (Y / y) * z;

  // Convert XYZ to linear RGB using sRGB D65 transformation matrix
  let r = X *  3.2406 + Y * -1.5372 + Z * -0.4986;
  let g = X * -0.9689 + Y *  1.8758 + Z *  0.0415;
  let b = X *  0.0557 + Y * -0.2040 + Z *  1.0570;

  // Normalize so max component = 1.0 (preserves color ratios, fits in gamut)
  // This is critical for colors like blue where the natural luminance is low
  const maxComponent = Math.max(r, g, b);
  if (maxComponent > 1) {
    r /= maxComponent;
    g /= maxComponent;
    b /= maxComponent;
  }

  // Clamp negative values (out of gamut colors)
  r = Math.max(0, r);
  g = Math.max(0, g);
  b = Math.max(0, b);

  // Apply gamma correction for sRGB
  r = r <= 0.0031308 ? 12.92 * r : 1.055 * Math.pow(r, 1.0 / 2.4) - 0.055;
  g = g <= 0.0031308 ? 12.92 * g : 1.055 * Math.pow(g, 1.0 / 2.4) - 0.055;
  b = b <= 0.0031308 ? 12.92 * b : 1.055 * Math.pow(b, 1.0 / 2.4) - 0.055;

  // Apply brightness and convert to 0-255 range
  const brightnessFactor = brightness / 255;
  return {
    r: Math.max(0, Math.min(255, Math.round(r * 255 * brightnessFactor))),
    g: Math.max(0, Math.min(255, Math.round(g * 255 * brightnessFactor))),
    b: Math.max(0, Math.min(255, Math.round(b * 255 * brightnessFactor))),
  };
}

/**
 * Convert RGB (sRGB) to XY color (CIE 1931)
 *
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns XY color object with coordinates 0.0-1.0
 */
export function rgbToXy(r: number, g: number, b: number): XYColor {
  // Normalize to 0-1 range
  let red = r / 255.0;
  let green = g / 255.0;
  let blue = b / 255.0;

  // Apply inverse gamma correction
  red = red > 0.04045 ? Math.pow((red + 0.055) / 1.055, 2.4) : red / 12.92;
  green = green > 0.04045 ? Math.pow((green + 0.055) / 1.055, 2.4) : green / 12.92;
  blue = blue > 0.04045 ? Math.pow((blue + 0.055) / 1.055, 2.4) : blue / 12.92;

  // Convert RGB to XYZ using sRGB D65 transformation matrix
  const X = red * 0.4124 + green * 0.3576 + blue * 0.1805;
  const Y = red * 0.2126 + green * 0.7152 + blue * 0.0722;
  const Z = red * 0.0193 + green * 0.1192 + blue * 0.9505;

  // Convert XYZ to xy
  const sum = X + Y + Z;

  // Handle black/zero case
  if (sum === 0) {
    return { x: 0.3127, y: 0.3290 };  // Return D65 white point for black
  }

  return {
    x: roundXY(X / sum),
    y: roundXY(Y / sum),
  };
}

/**
 * Convert RGB to hex color string
 *
 * @param color - RGB color object
 * @returns Hex color string (e.g., "#ff0000")
 */
export function rgbToHex(color: RGBColor): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

/**
 * Convert hex color string to RGB
 *
 * @param hex - Hex color string (e.g., "#ff0000" or "ff0000")
 * @returns RGB color object
 */
export function hexToRgb(hex: string): RGBColor {
  const cleanHex = hex.replace('#', '');
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16),
  };
}

/**
 * Convert XY to hex color string
 *
 * @param color - XY color object
 * @param brightness - Brightness value (0-255), defaults to 255
 * @returns Hex color string (e.g., "#ff0000")
 */
export function xyToHex(color: XYColor, brightness: number = 255): string {
  const rgb = xyToRgb(color.x, color.y, brightness);
  return rgbToHex(rgb);
}

/**
 * Convert hex color string to XY
 *
 * @param hex - Hex color string (e.g., "#ff0000" or "ff0000")
 * @returns XY color object
 */
export function hexToXy(hex: string): XYColor {
  const rgb = hexToRgb(hex);
  return rgbToXy(rgb.r, rgb.g, rgb.b);
}

/**
 * Convert RGB to HS (Hue-Saturation) color
 *
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns HS color object with h (0-360) and s (0-100)
 */
export function rgbToHs(r: number, g: number, b: number): HSColor {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = 0;

  // Calculate saturation
  if (max !== 0) {
    s = (delta / max) * 100;
  }

  // Calculate hue
  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  return { h, s: Math.round(s) };
}

/**
 * Convert HS (Hue-Saturation) to RGB color
 * Uses full brightness (value = 1) since brightness is controlled separately
 *
 * @param h - Hue value (0-360)
 * @param s - Saturation value (0-100)
 * @returns RGB color object with values 0-255
 */
export function hsToRgb(h: number, s: number): RGBColor {
  const sNorm = s / 100;
  const v = 1; // Full brightness - brightness controlled separately

  const c = v * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let rPrime = 0, gPrime = 0, bPrime = 0;

  if (h >= 0 && h < 60) {
    rPrime = c; gPrime = x; bPrime = 0;
  } else if (h >= 60 && h < 120) {
    rPrime = x; gPrime = c; bPrime = 0;
  } else if (h >= 120 && h < 180) {
    rPrime = 0; gPrime = c; bPrime = x;
  } else if (h >= 180 && h < 240) {
    rPrime = 0; gPrime = x; bPrime = c;
  } else if (h >= 240 && h < 300) {
    rPrime = x; gPrime = 0; bPrime = c;
  } else {
    rPrime = c; gPrime = 0; bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  };
}

/**
 * Convert XY color to HS color
 *
 * @param color - XY color object
 * @returns HS color object
 */
export function xyToHs(color: XYColor): HSColor {
  const rgb = xyToRgb(color.x, color.y, 255);
  return rgbToHs(rgb.r, rgb.g, rgb.b);
}

/**
 * Convert HS color to XY color
 *
 * @param color - HS color object
 * @returns XY color object
 */
export function hsToXy(color: HSColor): XYColor {
  const rgb = hsToRgb(color.h, color.s);
  return rgbToXy(rgb.r, rgb.g, rgb.b);
}

/**
 * Convert HS color to hex string
 *
 * @param color - HS color object
 * @returns Hex color string
 */
export function hsToHex(color: HSColor): string {
  const rgb = hsToRgb(color.h, color.s);
  return rgbToHex(rgb);
}

/**
 * Convert hex string to HS color
 *
 * @param hex - Hex color string
 * @returns HS color object
 */
export function hexToHs(hex: string): HSColor {
  const rgb = hexToRgb(hex);
  return rgbToHs(rgb.r, rgb.g, rgb.b);
}

/**
 * Check if a point (x, y) is inside a triangle defined by three vertices
 * Used for gamut validation
 *
 * @param point - Point to check [x, y]
 * @param triangle - Triangle vertices [[x1, y1], [x2, y2], [x3, y3]]
 * @returns True if point is inside triangle
 */
export function pointInTriangle(
  point: [number, number],
  triangle: [[number, number], [number, number], [number, number]]
): boolean {
  const [x, y] = point;
  const [[x1, y1], [x2, y2], [x3, y3]] = triangle;

  // Calculate barycentric coordinates
  const denominator = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
  const a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / denominator;
  const b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / denominator;
  const c = 1 - a - b;

  // Point is inside if all barycentric coordinates are between 0 and 1
  return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
}

/**
 * Find the closest point on a line segment to a given point
 * Used to clamp colors to gamut boundary
 *
 * @param point - Point to find closest point to [x, y]
 * @param lineStart - Start of line segment [x, y]
 * @param lineEnd - End of line segment [x, y]
 * @returns Closest point on line segment [x, y]
 */
function closestPointOnLine(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): [number, number] {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return lineStart;
  }

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));

  return [x1 + t * dx, y1 + t * dy];
}

/**
 * Clamp XY color to the specified gamut
 * If the color is outside the gamut, return the closest point on the gamut boundary
 *
 * @param color - XY color to clamp
 * @param gamut - Gamut triangle vertices {red, green, blue}
 * @returns Clamped XY color
 */
export function clampToGamut(
  color: XYColor,
  gamut: { red: [number, number]; green: [number, number]; blue: [number, number] }
): XYColor {
  const point: [number, number] = [color.x, color.y];
  const triangle: [[number, number], [number, number], [number, number]] = [
    gamut.red,
    gamut.green,
    gamut.blue,
  ];

  // If already in gamut, return as-is
  if (pointInTriangle(point, triangle)) {
    return color;
  }

  // Find closest point on each edge of the triangle
  const edges: [[number, number], [number, number]][] = [
    [gamut.red, gamut.green],
    [gamut.green, gamut.blue],
    [gamut.blue, gamut.red],
  ];

  let closestPoint = point;
  let minDistance = Infinity;

  for (const [start, end] of edges) {
    const closest = closestPointOnLine(point, start, end);
    const distance = Math.sqrt(
      Math.pow(closest[0] - point[0], 2) + Math.pow(closest[1] - point[1], 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = closest;
    }
  }

  return { x: closestPoint[0], y: closestPoint[1] };
}
