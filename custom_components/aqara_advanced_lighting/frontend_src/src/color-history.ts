/**
 * Color history utility -- pure list manipulation functions
 * No localStorage side effects. Storage is handled by the server-backed
 * user preferences system (aqara-panel.ts manages load/save).
 */

import { XYColor } from './types';

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
 * Produce a new color history array with the given color added to the front.
 * Deduplicates by exact XY match (4 decimal places), moving existing matches
 * to front. Trims to MAX_HISTORY_SIZE.
 *
 * @param history - Current history array
 * @param color - XY color to add
 * @returns New history array (does not mutate the input)
 */
export function addColorToHistory(history: XYColor[], color: XYColor): XYColor[] {
  // Remove existing match if present
  let updated = history.filter(c => !colorsMatch(c, color));

  // Add to front with rounded coordinates
  updated = [
    { x: roundXY(color.x), y: roundXY(color.y) },
    ...updated,
  ];

  // Trim to max size
  if (updated.length > MAX_HISTORY_SIZE) {
    updated = updated.slice(0, MAX_HISTORY_SIZE);
  }

  return updated;
}
