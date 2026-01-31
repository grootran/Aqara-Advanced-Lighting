/**
 * Color history utility for tracking recently used colors across editors
 * Persists to localStorage, shared globally across all color pickers
 */

import { XYColor } from './types';

const STORAGE_KEY = 'aqara_lighting_color_history';
const MAX_HISTORY_SIZE = 8;

/**
 * Round XY coordinate to 4 decimal places for comparison
 */
function roundXY(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * Check if two XY colors match at 4 decimal precision
 */
function colorsMatch(a: XYColor, b: XYColor): boolean {
  return roundXY(a.x) === roundXY(b.x) && roundXY(a.y) === roundXY(b.y);
}

/**
 * Get the color history from localStorage
 *
 * @returns Array of XY colors, most recent first
 */
export function getColorHistory(): XYColor[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Add a color to the history
 * Deduplicates by exact XY match (4 decimal places), moving existing matches to front.
 * Trims to MAX_HISTORY_SIZE.
 *
 * @param color - XY color to add
 */
export function addColorToHistory(color: XYColor): void {
  try {
    let history = getColorHistory();

    // Remove existing match if present
    history = history.filter(c => !colorsMatch(c, color));

    // Add to front with rounded coordinates
    history.unshift({
      x: roundXY(color.x),
      y: roundXY(color.y),
    });

    // Trim to max size
    if (history.length > MAX_HISTORY_SIZE) {
      history = history.slice(0, MAX_HISTORY_SIZE);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Clear all color history
 */
export function clearColorHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail if localStorage is unavailable
  }
}
