import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

/**
 * Unified Segment Selector Component
 *
 * A reusable visual segment selector for Aqara lights with addressable segments.
 * Supports three modes:
 * - 'selection': Simple segment selection (Effect Editor)
 * - 'color': Full color application with palette and pattern generation (Pattern Editor)
 * - 'sequence': Combined selection and color per step (Segment Sequence Editor)
 *
 * @fires value-changed - Fired when selection changes (selection/sequence modes)
 *   detail: { value: string } - Comma-separated segment ranges (e.g., "1-5,10,15-20")
 * @fires color-value-changed - Fired when colors change (color/sequence modes)
 *   detail: { value: Map<number, XYColor>, segments: string }
 */

// ============================================================================
// COLOR UTILITIES (inline for standalone component)
// ============================================================================

/**
 * Convert XY color to RGB
 */
function xyToRgb(x, y, brightness = 255) {
  const z = 1.0 - x - y;
  const Y = brightness / 255;
  const X = (Y / y) * x;
  const Z = (Y / y) * z;

  let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
  let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
  let b = X * 0.051713 - Y * 0.121364 + Z * 1.011530;

  r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
  g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
  b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;

  // Convert to 0-255 range and clamp
  let rVal = Math.max(0, Math.min(255, Math.round(r * 255)));
  let gVal = Math.max(0, Math.min(255, Math.round(g * 255)));
  let bVal = Math.max(0, Math.min(255, Math.round(b * 255)));

  // Snap to pure colors when very close (fixes blue/red/green precision issues)
  // This helps achieve exact rgb(0, 0, 255) instead of rgb(0, 3, 255)
  if (rVal < 5) rVal = 0;
  if (gVal < 5) gVal = 0;
  if (bVal < 5) bVal = 0;
  if (rVal > 250) rVal = 255;
  if (gVal > 250) gVal = 255;
  if (bVal > 250) bVal = 255;

  return {
    r: rVal,
    g: gVal,
    b: bVal,
  };
}

/**
 * Convert XY color to hex string
 */
function xyToHex(xy, brightness = 255) {
  const rgb = xyToRgb(xy.x, xy.y, brightness);
  return `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
}

/**
 * Convert XY to HS color space
 */
function xyToHs(xy) {
  const rgb = xyToRgb(xy.x, xy.y, 255);
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6;
    } else {
      h = ((r - g) / delta + 4) / 6;
    }
  }

  const s = max === 0 ? 0 : delta / max;

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
  };
}

/**
 * Convert HS to XY color space
 */
function hsToXy(hs) {
  const rgb = hsToRgb(hs.h, hs.s);
  return rgbToXy(rgb.r, rgb.g, rgb.b);
}

/**
 * Convert HS to RGB
 */
function hsToRgb(h, s) {
  const hNorm = h / 360;
  const sNorm = s / 100;

  const c = sNorm;
  const x = c * (1 - Math.abs(((hNorm * 6) % 2) - 1));
  const m = 1 - c;

  let r, g, b;
  if (hNorm < 1 / 6) {
    [r, g, b] = [c, x, 0];
  } else if (hNorm < 2 / 6) {
    [r, g, b] = [x, c, 0];
  } else if (hNorm < 3 / 6) {
    [r, g, b] = [0, c, x];
  } else if (hNorm < 4 / 6) {
    [r, g, b] = [0, x, c];
  } else if (hNorm < 5 / 6) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * Convert RGB to XY color space
 */
function rgbToXy(r, g, b) {
  r = r / 255;
  g = g / 255;
  b = b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  const X = r * 0.664511 + g * 0.154324 + b * 0.162028;
  const Y = r * 0.283881 + g * 0.668433 + b * 0.047685;
  const Z = r * 0.000088 + g * 0.072310 + b * 0.986039;

  const sum = X + Y + Z;
  if (sum === 0) {
    return { x: 0.3127, y: 0.3290 }; // D65 white point
  }

  return {
    x: parseFloat((X / sum).toFixed(4)),
    y: parseFloat((Y / sum).toFixed(4)),
  };
}

/**
 * Convert HS to hex string
 */
// Note: hsToHex removed - use HS → XY → RGB → Hex for accurate device colors

// ============================================================================
// DEFAULT PALETTES
// ============================================================================

const DEFAULT_PALETTE = [
  { x: 0.6800, y: 0.3100 },    // Red
  { x: 0.1700, y: 0.7000 },    // Green
  { x: 0.1500, y: 0.0600 },    // Blue
  { x: 0.4200, y: 0.5100 },    // Yellow
  { x: 0.3800, y: 0.1600 },    // Magenta
  { x: 0.2200, y: 0.3300 },    // Cyan
];

const DEFAULT_GRADIENT_COLORS = [
  { x: 0.6800, y: 0.3100 },  // Red
  { x: 0.1500, y: 0.0600 },  // Blue
];

const DEFAULT_BLOCK_COLORS = [
  { x: 0.6800, y: 0.3100 },  // Red
  { x: 0.1700, y: 0.7000 },  // Green
];

// ============================================================================
// SEGMENT SELECTOR COMPONENT
// ============================================================================

class SegmentSelector extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      mode: { type: String }, // 'selection' | 'color' | 'sequence'
      maxSegments: { type: Number },
      value: { type: String }, // For selection mode
      colorValue: { type: Object }, // For color mode (Map)
      colorPalette: { type: Array },
      gradientColors: { type: Array },
      blockColors: { type: Array },
      expandBlocks: { type: Boolean },
      label: { type: String },
      description: { type: String },
      disabled: { type: Boolean },
      translations: { type: Object },
      _selectedSegments: { type: Object },
      _coloredSegments: { type: Object },
      _lastSelectedIndex: { type: Number },
      _selectedPaletteIndex: { type: Number },
      _clearMode: { type: Boolean },
      _selectMode: { type: Boolean },
      _patternMode: { type: String }, // 'individual' | 'gradient' | 'blocks'
      _editingColorSource: { type: String }, // 'palette' | 'gradient' | 'blocks'
      _editingColorIndex: { type: Number },
      _editingColor: { type: Object }, // HS color being edited
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .segment-selector {
        width: 100%;
      }

      .label {
        display: block;
        font-weight: 500;
        margin-bottom: 8px;
        color: var(--primary-text-color);
      }

      .segment-grid-container {
        background: var(--card-background-color);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 8px;
      }

      .segment-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
        gap: 4px;
        margin-bottom: 12px;
      }

      .segment-cell {
        aspect-ratio: 1;
        border-radius: 4px;
        cursor: pointer;
        border: 2px solid var(--divider-color);
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 600;
        color: var(--secondary-text-color);
        background: var(--primary-background-color);
        user-select: none;
      }

      .segment-cell:hover {
        transform: scale(1.1);
        z-index: 1;
        border-color: var(--primary-color);
      }

      .segment-cell.selected {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px var(--primary-color);
      }

      .segment-cell.colored {
        border-color: transparent;
        color: transparent;
      }

      .segment-cell.disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      /* Clear mode cursor */
      .segment-grid.clear-mode .segment-cell.colored {
        cursor: not-allowed;
      }

      .segment-grid.clear-mode .segment-cell.colored:hover {
        opacity: 0.7;
      }

      /* Select mode cursor */
      .segment-grid.select-mode .segment-cell {
        cursor: crosshair;
      }

      .segment-grid.select-mode .segment-cell:hover {
        border-color: var(--info-color, #2196f3);
      }

      .controls {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin-bottom: 8px;
      }

      .controls ha-button {
        --mdc-theme-primary: var(--primary-color);
      }

      .selection-info {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: var(--primary-background-color);
        border-radius: 4px;
        font-size: 12px;
        color: var(--secondary-text-color);
      }

      .selection-info ha-icon {
        --mdc-icon-size: 16px;
      }

      /* Clear mode toggle button */
      .clear-mode-toggle.active {
        --mdc-theme-primary: var(--error-color);
        color: var(--error-color);
      }

      /* Select mode toggle button */
      .select-mode-toggle.active {
        --mdc-theme-primary: var(--info-color, #2196f3);
        color: var(--info-color, #2196f3);
      }

      .description {
        display: block;
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-top: 4px;
      }

      .hint {
        display: block;
        font-size: 11px;
        color: var(--secondary-text-color);
        margin-top: 8px;
        font-style: italic;
      }

      /* Color palette styles */
      .color-palette-container {
        margin-top: 16px;
        padding: 16px;
        background: var(--card-background-color);
        border-radius: 8px;
      }

      .mode-tabs {
        display: flex;
        gap: 4px;
        margin-bottom: 16px;
        border-bottom: 2px solid var(--divider-color);
      }

      .mode-tab {
        padding: 8px 16px;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        color: var(--secondary-text-color);
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition: all 0.2s ease;
      }

      .mode-tab:hover {
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
      }

      .mode-tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }

      .mode-description {
        font-size: 13px;
        color: var(--secondary-text-color);
        margin-bottom: 16px;
        padding: 8px 12px;
        background: var(--secondary-background-color);
        border-radius: 4px;
      }

      .color-palette {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .palette-label {
        font-size: 13px;
        color: var(--secondary-text-color);
        margin-right: 8px;
      }

      .palette-color-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .palette-color {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        cursor: pointer;
        border: 3px solid var(--divider-color);
        transition: all 0.2s ease;
        position: relative;
      }

      .palette-color:hover {
        transform: scale(1.1);
        border-color: var(--primary-color);
      }

      .palette-color.selected {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px var(--primary-color);
      }

      .palette-edit-btn {
        padding: 4px;
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .palette-edit-btn:hover {
        background: var(--primary-color);
        color: var(--text-primary-color);
      }

      .palette-edit-btn ha-icon {
        --mdc-icon-size: 16px;
      }

      /* Color array for gradient/blocks modes */
      .color-array {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin-bottom: 16px;
      }

      .color-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .color-swatch {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        cursor: pointer;
        border: 2px solid var(--divider-color);
        transition: all 0.2s ease;
      }

      .color-swatch:hover {
        transform: scale(1.05);
        border-color: var(--primary-color);
      }

      .color-remove {
        padding: 4px;
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .color-remove:hover {
        background: var(--error-color);
        color: white;
      }

      .color-remove ha-icon {
        --mdc-icon-size: 16px;
      }

      .color-remove-spacer {
        height: 26px;
        visibility: hidden;
      }

      .add-color-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 4px;
      }

      .add-color-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border: 2px dashed var(--divider-color);
        border-radius: 8px;
        cursor: pointer;
        color: var(--secondary-text-color);
        transition: all 0.2s ease;
      }

      .add-color-btn:hover .add-color-icon {
        border-color: var(--primary-color);
        color: var(--primary-color);
        transform: scale(1.05);
      }

      .add-color-icon ha-icon {
        --mdc-icon-size: 24px;
      }

      .generated-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 16px;
      }

      .options-row {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-top: 12px;
        flex-wrap: wrap;
      }

      .option-item {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .option-label {
        font-size: 13px;
        color: var(--secondary-text-color);
      }

      /* Color picker modal */
      .color-picker-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .color-picker-modal {
        background: var(--card-background-color);
        border-radius: 8px;
        padding: 24px;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      .color-picker-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .color-picker-modal-title {
        font-size: 18px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .color-picker-modal-preview {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        border: 2px solid var(--divider-color);
      }

      .color-picker-canvas-container {
        display: flex;
        justify-content: center;
        margin: 20px 0;
      }

      .color-picker-rgb-inputs {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin: 16px 0;
      }

      .rgb-input-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .rgb-input-channel {
        font-size: 12px;
        font-weight: 500;
        color: var(--secondary-text-color);
        text-transform: uppercase;
      }

      .rgb-input-field {
        width: 60px;
        padding: 6px 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 14px;
        font-family: monospace;
        text-align: center;
      }

      .rgb-input-field:focus {
        outline: none;
        border-color: var(--primary-color);
      }

      .color-picker-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 20px;
      }

      @media (max-width: 600px) {
        .segment-grid {
          grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
          gap: 3px;
        }

        .segment-cell {
          font-size: 9px;
        }

        .controls ha-button {
          width: calc(50% - 4px);
        }

        .color-palette {
          justify-content: center;
        }

        .mode-tabs {
          overflow-x: auto;
        }
      }
    `;
  }

  constructor() {
    super();
    this.mode = 'selection';
    this.maxSegments = 10;
    this.value = '';
    this.colorValue = new Map();
    this.colorPalette = [...DEFAULT_PALETTE];
    this.gradientColors = [...DEFAULT_GRADIENT_COLORS];
    this.blockColors = [...DEFAULT_BLOCK_COLORS];
    this.expandBlocks = false;
    this.label = '';
    this.description = '';
    this.disabled = false;
    this.translations = {};
    this._selectedSegments = new Set();
    this._coloredSegments = new Map();
    this._lastSelectedIndex = null;
    this._selectedPaletteIndex = 0;
    this._clearMode = false;
    this._selectMode = false;
    this._patternMode = 'individual';
    this._editingColorSource = null;
    this._editingColorIndex = null;
    this._editingColor = null;
    this._hsColorCache = new Map(); // Cache HS for XY colors to preserve precision
    this._wheelIsDragging = false;
    this._wheelCanvasId = null;
    this._wheelMarkerId = null;
    this._wheelSize = 0;
    this._wheelPointerMoveBound = null;
    this._wheelPointerUpBound = null;
  }

  updated(changedProps) {
    // Parse value string to selection when in selection/sequence mode
    if ((changedProps.has('value') && changedProps.get('value') !== this.value) &&
        (this.mode === 'selection' || this.mode === 'sequence')) {
      this._parseValue();
    }

    // Parse colorValue Map when in color/sequence mode
    if ((changedProps.has('colorValue') && changedProps.get('colorValue') !== this.colorValue) &&
        (this.mode === 'color' || this.mode === 'sequence')) {
      this._parseColorValue();
    }

    // Validate selection against maxSegments
    if (changedProps.has('maxSegments')) {
      this._validateSelection();
    }
  }

  /**
   * Parse the value string into selected segments (selection mode)
   */
  _parseValue() {
    const newSelected = new Set();

    if (!this.value || this.value.trim() === '') {
      this._selectedSegments = newSelected;
      return;
    }

    const trimmed = this.value.trim().toLowerCase();

    if (trimmed === 'all') {
      for (let i = 0; i < this.maxSegments; i++) {
        newSelected.add(i);
      }
      this._selectedSegments = newSelected;
      return;
    }

    const parts = trimmed.split(',');
    for (const part of parts) {
      const range = part.trim();
      if (!range) continue;

      if (range.includes('-')) {
        const [startStr, endStr] = range.split('-').map(s => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (!isNaN(start) && !isNaN(end)) {
          const startIdx = Math.max(0, start - 1);
          const endIdx = Math.min(this.maxSegments - 1, end - 1);

          for (let i = startIdx; i <= endIdx; i++) {
            newSelected.add(i);
          }
        }
      } else {
        const num = parseInt(range, 10);
        if (!isNaN(num)) {
          const idx = num - 1;
          if (idx >= 0 && idx < this.maxSegments) {
            newSelected.add(idx);
          }
        }
      }
    }

    this._selectedSegments = newSelected;
  }

  /**
   * Parse colorValue Map (color mode)
   */
  _parseColorValue() {
    if (this.colorValue instanceof Map) {
      this._coloredSegments = new Map(this.colorValue);
    } else {
      this._coloredSegments = new Map();
    }
  }

  /**
   * Validate selection and remove segments that exceed maxSegments
   */
  _validateSelection() {
    const validated = new Set();
    for (const idx of this._selectedSegments) {
      if (idx < this.maxSegments) {
        validated.add(idx);
      }
    }
    if (validated.size !== this._selectedSegments.size) {
      this._selectedSegments = validated;
      if (this.mode === 'selection' || this.mode === 'sequence') {
        this._fireValueChanged();
      }
    }

    // Also validate colored segments
    const validatedColors = new Map();
    for (const [idx, color] of this._coloredSegments) {
      if (idx < this.maxSegments) {
        validatedColors.set(idx, color);
      }
    }
    if (validatedColors.size !== this._coloredSegments.size) {
      this._coloredSegments = validatedColors;
      if (this.mode === 'color' || this.mode === 'sequence') {
        this._fireColorValueChanged();
      }
    }
  }

  /**
   * Convert selected segments Set to string format
   */
  _segmentsToString() {
    if (this._selectedSegments.size === 0) {
      return '';
    }

    if (this._selectedSegments.size === this.maxSegments) {
      return 'all';
    }

    const sorted = Array.from(this._selectedSegments).sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        ranges.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);
        start = end = sorted[i];
      }
    }

    ranges.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);
    return ranges.join(',');
  }

  /**
   * Handle segment cell click - mode aware
   */
  _handleSegmentClick(index, event) {
    if (this.disabled) return;
    event.preventDefault();

    if (this.mode === 'selection') {
      this._handleSelectionClick(index, event);
    } else if (this.mode === 'color' || this.mode === 'sequence') {
      this._handleColorClick(index, event);
    }
  }

  /**
   * Handle click in selection mode
   */
  _handleSelectionClick(index, event) {
    const newSelected = new Set(this._selectedSegments);

    if (event.shiftKey && this._lastSelectedIndex !== null) {
      const start = Math.min(this._lastSelectedIndex, index);
      const end = Math.max(this._lastSelectedIndex, index);
      for (let i = start; i <= end; i++) {
        newSelected.add(i);
      }
    } else if (event.ctrlKey || event.metaKey) {
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }
    } else {
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }
    }

    this._lastSelectedIndex = index;
    this._selectedSegments = newSelected;
    this._fireValueChanged();
  }

  /**
   * Handle click in color/sequence mode
   */
  _handleColorClick(index, event) {
    if (this._clearMode) {
      const newColored = new Map(this._coloredSegments);
      newColored.delete(index);
      this._coloredSegments = newColored;
      this._fireColorValueChanged();
      return;
    }

    if (this._selectMode || event.shiftKey) {
      const newSelection = new Set(this._selectedSegments);
      if (newSelection.has(index)) {
        newSelection.delete(index);
      } else {
        newSelection.add(index);
      }
      this._selectedSegments = newSelection;
    } else if (event.ctrlKey || event.metaKey) {
      this._selectedSegments = new Set([...this._selectedSegments, index]);
    } else {
      // Regular click: apply current palette color
      const currentColor = this.colorPalette[this._selectedPaletteIndex];
      if (!currentColor) return;
      const newColored = new Map(this._coloredSegments);
      newColored.set(index, { ...currentColor });
      this._coloredSegments = newColored;
      this._fireColorValueChanged();
    }
  }

  /**
   * Quick actions
   */
  _selectAll() {
    if (this.disabled) return;
    const newSelection = new Set();
    for (let i = 0; i < this.maxSegments; i++) {
      newSelection.add(i);
    }
    this._selectedSegments = newSelection;
    this._lastSelectedIndex = null;
    if (this.mode === 'selection' || this.mode === 'sequence') {
      this._fireValueChanged();
    }
  }

  _clearAll() {
    if (this.disabled) return;
    this._selectedSegments = new Set();
    this._coloredSegments = new Map();
    this._lastSelectedIndex = null;
    if (this.mode === 'selection' || this.mode === 'sequence') {
      this._fireValueChanged();
    }
    if (this.mode === 'color' || this.mode === 'sequence') {
      this._fireColorValueChanged();
    }
  }

  _selectFirstHalf() {
    if (this.disabled) return;
    const newSelected = new Set();
    const half = Math.floor(this.maxSegments / 2);
    for (let i = 0; i < half; i++) {
      newSelected.add(i);
    }
    this._selectedSegments = newSelected;
    this._lastSelectedIndex = null;
    this._fireValueChanged();
  }

  _selectSecondHalf() {
    if (this.disabled) return;
    const newSelected = new Set();
    const half = Math.floor(this.maxSegments / 2);
    for (let i = half; i < this.maxSegments; i++) {
      newSelected.add(i);
    }
    this._selectedSegments = newSelected;
    this._lastSelectedIndex = null;
    this._fireValueChanged();
  }

  _selectOdd() {
    if (this.disabled) return;
    const newSelected = new Set();
    for (let i = 0; i < this.maxSegments; i += 2) {
      newSelected.add(i);
    }
    this._selectedSegments = newSelected;
    this._lastSelectedIndex = null;
    this._fireValueChanged();
  }

  _selectEven() {
    if (this.disabled) return;
    const newSelected = new Set();
    for (let i = 1; i < this.maxSegments; i += 2) {
      newSelected.add(i);
    }
    this._selectedSegments = newSelected;
    this._lastSelectedIndex = null;
    this._fireValueChanged();
  }

  _clearSelected() {
    if (this.disabled || this._selectedSegments.size === 0) return;

    if (this.mode === 'color' || this.mode === 'sequence') {
      const newColored = new Map(this._coloredSegments);
      for (const seg of this._selectedSegments) {
        newColored.delete(seg);
      }
      this._coloredSegments = newColored;
      this._fireColorValueChanged();
    }

    this._selectedSegments = new Set();
  }

  /**
   * Color mode specific methods
   */
  _toggleClearMode() {
    this._clearMode = !this._clearMode;
    if (this._clearMode) {
      this._selectMode = false;
    }
  }

  _toggleSelectMode() {
    this._selectMode = !this._selectMode;
    if (this._selectMode) {
      this._clearMode = false;
    }
  }

  _selectPaletteColor(index) {
    this._selectedPaletteIndex = index;
  }

  _applyToSelected() {
    if (this._selectedSegments.size === 0) return;

    const currentColor = this.colorPalette[this._selectedPaletteIndex];
    if (!currentColor) return;

    const newColored = new Map(this._coloredSegments);
    for (const seg of this._selectedSegments) {
      newColored.set(seg, { ...currentColor });
    }
    this._coloredSegments = newColored;
    this._selectedSegments = new Set();
    this._fireColorValueChanged();
  }

  _setPatternMode(mode) {
    this._patternMode = mode;
    this._clearMode = false;
    this._selectMode = false;
  }

  _addGradientColor() {
    if (this.gradientColors.length >= 6) return;
    this.gradientColors = [...this.gradientColors, { x: 0.4200, y: 0.5100 }];
    this._fireGradientColorsChanged();
  }

  _removeGradientColor(index) {
    if (this.gradientColors.length <= 2) return;
    this.gradientColors = this.gradientColors.filter((_, i) => i !== index);
    this._fireGradientColorsChanged();
  }

  _addBlockColor() {
    if (this.blockColors.length >= 6) return;
    this.blockColors = [...this.blockColors, { x: 0.2200, y: 0.3300 }];
    this._fireBlockColorsChanged();
  }

  _removeBlockColor(index) {
    if (this.blockColors.length <= 1) return;
    this.blockColors = this.blockColors.filter((_, i) => i !== index);
    this._fireBlockColorsChanged();
  }

  _handleExpandBlocksChange(e) {
    this.expandBlocks = e.target.checked;
  }

  /**
   * Interpolate hue values, taking the shortest path around the color wheel
   */
  _interpolateHue(h1, h2, t) {
    let diff = h2 - h1;

    if (diff > 180) {
      diff -= 360;
    } else if (diff < -180) {
      diff += 360;
    }

    let result = h1 + diff * t;

    if (result < 0) result += 360;
    if (result >= 360) result -= 360;

    return result;
  }

  /**
   * Generate gradient pattern
   */
  _generateGradientPattern() {
    const colors = this.gradientColors;
    const numColors = colors.length;
    const pattern = new Map();

    if (numColors < 2 || this.maxSegments === 0) return pattern;

    const hsColors = colors.map(c => xyToHs(c));

    for (let i = 0; i < this.maxSegments; i++) {
      const t = i / (this.maxSegments - 1);
      const colorPosition = t * (numColors - 1);
      const colorIndex = Math.floor(colorPosition);
      const colorT = colorPosition - colorIndex;

      const c1 = hsColors[Math.min(colorIndex, numColors - 1)];
      const c2 = hsColors[Math.min(colorIndex + 1, numColors - 1)];

      const interpolatedHS = {
        h: Math.round(this._interpolateHue(c1.h, c2.h, colorT)),
        s: Math.round(c1.s + (c2.s - c1.s) * colorT),
      };

      pattern.set(i, hsToXy(interpolatedHS));
    }

    return pattern;
  }

  /**
   * Generate blocks pattern
   */
  _generateBlocksPattern() {
    const colors = this.blockColors;
    const numColors = colors.length;
    const pattern = new Map();

    if (numColors === 0 || this.maxSegments === 0) return pattern;

    if (this.expandBlocks) {
      const segmentsPerColor = this.maxSegments / numColors;
      for (let i = 0; i < this.maxSegments; i++) {
        const colorIndex = Math.min(Math.floor(i / segmentsPerColor), numColors - 1);
        pattern.set(i, { ...colors[colorIndex] });
      }
    } else {
      for (let i = 0; i < this.maxSegments; i++) {
        const colorIndex = i % numColors;
        pattern.set(i, { ...colors[colorIndex] });
      }
    }

    return pattern;
  }

  /**
   * Apply generated pattern to grid
   */
  _applyToGrid() {
    let generatedPattern;

    if (this._patternMode === 'gradient') {
      generatedPattern = this._generateGradientPattern();
    } else if (this._patternMode === 'blocks') {
      generatedPattern = this._generateBlocksPattern();
    } else {
      return;
    }

    this._coloredSegments = generatedPattern;
    this._fireColorValueChanged();
  }

  /**
   * Apply generated pattern to selected segments only
   */
  _applyToSelectedSegments() {
    if (this._selectedSegments.size === 0) return;

    const selectedArray = Array.from(this._selectedSegments).sort((a, b) => a - b);
    const selectedCount = selectedArray.length;

    let colors = [];
    if (this._patternMode === 'gradient') {
      colors = this.gradientColors;
    } else if (this._patternMode === 'blocks') {
      colors = this.blockColors;
    } else {
      return;
    }

    const numColors = colors.length;
    const newColored = new Map(this._coloredSegments);

    if (this._patternMode === 'gradient') {
      const hsColors = colors.map(c => xyToHs(c));

      for (let i = 0; i < selectedCount; i++) {
        const segNum = selectedArray[i];
        const t = selectedCount > 1 ? i / (selectedCount - 1) : 0;
        const colorPosition = t * (numColors - 1);
        const colorIndex = Math.floor(colorPosition);
        const colorT = colorPosition - colorIndex;

        const c1 = hsColors[Math.min(colorIndex, numColors - 1)];
        const c2 = hsColors[Math.min(colorIndex + 1, numColors - 1)];

        const interpolatedHS = {
          h: Math.round(this._interpolateHue(c1.h, c2.h, colorT)),
          s: Math.round(c1.s + (c2.s - c1.s) * colorT),
        };

        newColored.set(segNum, hsToXy(interpolatedHS));
      }
    } else if (this._patternMode === 'blocks') {
      if (this.expandBlocks) {
        const blockSize = Math.ceil(selectedCount / numColors);
        for (let i = 0; i < selectedCount; i++) {
          const segNum = selectedArray[i];
          const colorIndex = Math.min(Math.floor(i / blockSize), numColors - 1);
          newColored.set(segNum, { ...colors[colorIndex] });
        }
      } else {
        for (let i = 0; i < selectedCount; i++) {
          const segNum = selectedArray[i];
          const colorIndex = i % numColors;
          newColored.set(segNum, { ...colors[colorIndex] });
        }
      }
    }

    this._coloredSegments = newColored;
    this._selectedSegments = new Set();
    this._fireColorValueChanged();
  }

  /**
   * Color picker methods
   */
  _openColorPicker(source, index) {
    let xyColor;
    if (source === 'palette') {
      xyColor = this.colorPalette[index];
    } else if (source === 'gradient') {
      xyColor = this.gradientColors[index];
    } else if (source === 'blocks') {
      xyColor = this.blockColors[index];
    }

    if (!xyColor) return;

    this._editingColorSource = source;
    this._editingColorIndex = index;

    // Try to use cached HS for this XY color to preserve precision
    const cacheKey = `${xyColor.x.toFixed(4)},${xyColor.y.toFixed(4)}`;
    const cachedHs = this._hsColorCache.get(cacheKey);

    if (cachedHs) {
      // Use cached HS to avoid XY → HS conversion loss
      this._editingColor = cachedHs;
    } else {
      // First time editing this color, convert XY → HS
      this._editingColor = xyToHs(xyColor);
    }
  }

  _handleColorPickerChange(e) {
    this._editingColor = e.detail.color;
  }

  _confirmColorPicker() {
    if (this._editingColorIndex === null || this._editingColor === null || !this._editingColorSource) {
      this._closeColorPicker();
      return;
    }

    const xyColor = hsToXy(this._editingColor);

    // Cache the HS color for this XY to preserve precision on reopening
    const cacheKey = `${xyColor.x.toFixed(4)},${xyColor.y.toFixed(4)}`;
    this._hsColorCache.set(cacheKey, { h: this._editingColor.h, s: this._editingColor.s });

    if (this._editingColorSource === 'palette') {
      this.colorPalette = this.colorPalette.map((c, i) =>
        i === this._editingColorIndex ? xyColor : c
      );
      this._fireColorPaletteChanged();
    } else if (this._editingColorSource === 'gradient') {
      this.gradientColors = this.gradientColors.map((c, i) =>
        i === this._editingColorIndex ? xyColor : c
      );
      this._fireGradientColorsChanged();
    } else if (this._editingColorSource === 'blocks') {
      this.blockColors = this.blockColors.map((c, i) =>
        i === this._editingColorIndex ? xyColor : c
      );
      this._fireBlockColorsChanged();
    }

    this._closeColorPicker();
  }

  _closeColorPicker() {
    this._editingColorSource = null;
    this._editingColorIndex = null;
    this._editingColor = null;
  }

  _handleRgbInput(e, channel) {
    // Handle RGB text input changes - convert RGB → XY → HS to update editing color
    let value = parseInt(e.target.value, 10);

    // Validate and clamp input
    if (isNaN(value) || e.target.value === '') {
      // If invalid or empty, just ignore (don't trigger re-render which would reset all fields)
      return;
    }

    // Clamp value to valid range
    value = Math.max(0, Math.min(255, value));

    // Get current RGB values from current HS color
    const xyColor = hsToXy(this._editingColor);
    const currentRgb = xyToRgb(xyColor.x, xyColor.y, 255);

    // Update the specified channel
    const newRgb = {
      r: channel === 'r' ? value : currentRgb.r,
      g: channel === 'g' ? value : currentRgb.g,
      b: channel === 'b' ? value : currentRgb.b,
    };

    // Convert RGB → XY → HS
    const newXy = rgbToXy(newRgb.r, newRgb.g, newRgb.b);

    // Convert back to check what the device will actually display
    const newHs = xyToHs(newXy);

    // Update editing color
    this._editingColor = { h: newHs.h, s: newHs.s };

    // Update marker position and preview without full re-render
    const wheelId = 'color-wheel-canvas';
    const markerId = 'color-wheel-marker';
    const size = 220;

    this._updateMarkerPosition(wheelId, markerId, size);

    // Update preview color
    const preview = this.shadowRoot.querySelector('.color-picker-modal-preview');
    if (preview) {
      const displayRgb = xyToRgb(newXy.x, newXy.y, 255);
      const hex = `#${displayRgb.r.toString(16).padStart(2, '0')}${displayRgb.g.toString(16).padStart(2, '0')}${displayRgb.b.toString(16).padStart(2, '0')}`;
      preview.style.backgroundColor = hex;
    }

    // Update the OTHER RGB input fields to show what the device will actually display
    // This prevents confusion when color space conversion changes the values
    const rgbInputs = this.shadowRoot.querySelectorAll('.rgb-input-field');
    if (rgbInputs.length === 3) {
      const displayRgb = xyToRgb(newXy.x, newXy.y, 255);
      const channelIndex = channel === 'r' ? 0 : channel === 'g' ? 1 : 2;

      // Update all fields to show accurate converted values
      rgbInputs[0].value = displayRgb.r;
      rgbInputs[1].value = displayRgb.g;
      rgbInputs[2].value = displayRgb.b;

      // If the displayed value differs from input, briefly highlight the field to indicate conversion
      if (channelIndex === 0 && displayRgb.r !== value ||
          channelIndex === 1 && displayRgb.g !== value ||
          channelIndex === 2 && displayRgb.b !== value) {
        const changedInput = rgbInputs[channelIndex];
        const originalBorder = changedInput.style.borderColor;
        changedInput.style.borderColor = 'var(--warning-color, #ff9800)';
        setTimeout(() => {
          changedInput.style.borderColor = originalBorder;
        }, 500);
      }
    }
  }

  /**
   * Fire events
   */
  _fireValueChanged() {
    const value = this._segmentsToString();
    this.dispatchEvent(
      new CustomEvent('value-changed', {
        detail: { value },
        bubbles: true,
        composed: true,
      })
    );
  }

  _fireColorValueChanged() {
    this.dispatchEvent(
      new CustomEvent('color-value-changed', {
        detail: {
          value: this._coloredSegments,
          segments: this._segmentsToString(),
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _fireColorPaletteChanged() {
    this.dispatchEvent(
      new CustomEvent('color-palette-changed', {
        detail: {
          colors: this.colorPalette,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _fireGradientColorsChanged() {
    this.dispatchEvent(
      new CustomEvent('gradient-colors-changed', {
        detail: {
          colors: this.gradientColors,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _fireBlockColorsChanged() {
    this.dispatchEvent(
      new CustomEvent('block-colors-changed', {
        detail: {
          colors: this.blockColors,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Rendering methods
   */
  _renderGrid() {
    const cells = [];
    for (let i = 0; i < this.maxSegments; i++) {
      const isSelected = this._selectedSegments.has(i);
      const color = this._coloredSegments.get(i);
      const isColored = color !== undefined;

      const cellClasses = [];
      if (isSelected) cellClasses.push('selected');
      if (isColored && (this.mode === 'color' || this.mode === 'sequence')) {
        cellClasses.push('colored');
      }
      if (this.disabled) cellClasses.push('disabled');

      const cellStyle = isColored && (this.mode === 'color' || this.mode === 'sequence')
        ? `background-color: ${xyToHex(color)}`
        : '';

      cells.push(html`
        <div
          class="segment-cell ${cellClasses.join(' ')}"
          style="${cellStyle}"
          @click=${(e) => this._handleSegmentClick(i, e)}
          title="Segment ${i + 1}${isSelected ? ' (selected)' : ''}${isColored ? ' (colored)' : ''}"
        >
          ${i + 1}
        </div>
      `);
    }

    return html`
      <div class="segment-grid-container">
        <div class="segment-grid ${this._clearMode ? 'clear-mode' : ''} ${this._selectMode ? 'select-mode' : ''}">
          ${cells}
        </div>
        ${this._renderControls()}
      </div>
    `;
  }

  _renderControls() {
    const count = this._selectedSegments.size;
    const hasSelection = count > 0;

    if (this.mode === 'selection') {
      return html`
        <div class="controls">
          <ha-button @click=${this._selectAll} .disabled=${this.disabled}>
            <ha-icon icon="mdi:select-all"></ha-icon>
            Select All
          </ha-button>
          <ha-button @click=${this._clearAll} .disabled=${this.disabled || !hasSelection}>
            <ha-icon icon="mdi:selection-off"></ha-icon>
            Clear
          </ha-button>
          <ha-button @click=${this._selectFirstHalf} .disabled=${this.disabled}>
            <ha-icon icon="mdi:arrow-left-bold"></ha-icon>
            First Half
          </ha-button>
          <ha-button @click=${this._selectSecondHalf} .disabled=${this.disabled}>
            <ha-icon icon="mdi:arrow-right-bold"></ha-icon>
            Second Half
          </ha-button>
          <ha-button @click=${this._selectOdd} .disabled=${this.disabled}>
            <ha-icon icon="mdi:numeric-1"></ha-icon>
            Odd
          </ha-button>
          <ha-button @click=${this._selectEven} .disabled=${this.disabled}>
            <ha-icon icon="mdi:numeric-2"></ha-icon>
            Even
          </ha-button>
          <div class="selection-info">
            <ha-icon icon="mdi:information-outline"></ha-icon>
            <span>${count} of ${this.maxSegments} selected</span>
          </div>
        </div>
      `;
    } else if (this.mode === 'color' || this.mode === 'sequence') {
      return html`
        <div class="controls">
          <ha-button
            class="${this._selectMode ? 'select-mode-toggle active' : 'select-mode-toggle'}"
            @click=${this._toggleSelectMode}
            .disabled=${this.disabled}
          >
            <ha-icon icon="${this._selectMode ? 'mdi:selection-multiple' : 'mdi:selection'}"></ha-icon>
            ${this._selectMode ? 'Select On' : 'Select Off'}
          </ha-button>
          <ha-button
            class="${this._clearMode ? 'clear-mode-toggle active' : 'clear-mode-toggle'}"
            @click=${this._toggleClearMode}
            .disabled=${this.disabled}
          >
            <ha-icon icon="${this._clearMode ? 'mdi:eraser' : 'mdi:eraser-variant'}"></ha-icon>
            ${this._clearMode ? 'Clear On' : 'Clear Off'}
          </ha-button>
          <ha-button @click=${this._selectAll} .disabled=${this.disabled}>
            Select All
          </ha-button>
          <ha-button @click=${this._clearSelected} .disabled=${this.disabled || !hasSelection}>
            Clear Selected
          </ha-button>
          <ha-button @click=${this._clearAll} .disabled=${this.disabled}>
            Clear All
          </ha-button>
          <div class="selection-info">
            <span>${count} selected</span>
          </div>
        </div>
      `;
    }
  }

  _renderColorPalette() {
    if (this.mode !== 'color' && this.mode !== 'sequence') {
      return '';
    }

    return html`
      <div class="color-palette-container">
        ${this.mode === 'color' ? this._renderModeTabs() : ''}
        ${this._renderModeContent()}
      </div>
    `;
  }

  _renderModeTabs() {
    return html`
      <div class="mode-tabs">
        <button
          class="mode-tab ${this._patternMode === 'individual' ? 'active' : ''}"
          @click=${() => this._setPatternMode('individual')}
        >
          Individual
        </button>
        <button
          class="mode-tab ${this._patternMode === 'gradient' ? 'active' : ''}"
          @click=${() => this._setPatternMode('gradient')}
        >
          Gradient
        </button>
        <button
          class="mode-tab ${this._patternMode === 'blocks' ? 'active' : ''}"
          @click=${() => this._setPatternMode('blocks')}
        >
          Blocks
        </button>
      </div>
    `;
  }

  _renderModeContent() {
    if (this.mode === 'sequence' || this._patternMode === 'individual') {
      return this._renderIndividualMode();
    } else if (this._patternMode === 'gradient') {
      return this._renderGradientMode();
    } else if (this._patternMode === 'blocks') {
      return this._renderBlocksMode();
    }
  }

  _renderIndividualMode() {
    return html`
      <div class="mode-description">
        Click a color to select it, then click segments to apply.
      </div>
      <div class="color-palette">
        ${this.colorPalette.map((color, index) => html`
          <div class="palette-color-wrapper">
            <div
              class="palette-color ${this._selectedPaletteIndex === index ? 'selected' : ''}"
              style="background-color: ${xyToHex(color)}"
              @click=${() => this._selectPaletteColor(index)}
            ></div>
            <button
              class="palette-edit-btn"
              @click=${() => this._openColorPicker('palette', index)}
            >
              <ha-icon icon="mdi:pencil"></ha-icon>
            </button>
          </div>
        `)}
        <ha-button
          @click=${this._applyToSelected}
          .disabled=${this._selectedSegments.size === 0}
        >
          <ha-icon icon="mdi:selection"></ha-icon>
          Apply to Selected
        </ha-button>
      </div>
    `;
  }

  _renderGradientMode() {
    return html`
      <div class="mode-description">
        Create a smooth color gradient. Add 2-6 colors to blend.
      </div>
      <div class="color-array">
        ${this.gradientColors.map((color, index) => html`
          <div class="color-item">
            <div
              class="color-swatch"
              style="background-color: ${xyToHex(color)}"
              @click=${() => this._openColorPicker('gradient', index)}
            ></div>
            ${this.gradientColors.length > 2 ? html`
              <button class="color-remove" @click=${() => this._removeGradientColor(index)}>
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            ` : html`<div class="color-remove-spacer"></div>`}
          </div>
        `)}
        ${this.gradientColors.length < 6 ? html`
          <div class="add-color-btn">
            <div class="add-color-icon" @click=${this._addGradientColor}>
              <ha-icon icon="mdi:plus"></ha-icon>
            </div>
            <div class="color-remove-spacer"></div>
          </div>
        ` : ''}
      </div>
      <div class="generated-actions">
        <ha-button @click=${this._applyToGrid}>
          <ha-icon icon="mdi:grid"></ha-icon>
          Apply to Grid
        </ha-button>
        <ha-button
          @click=${this._applyToSelectedSegments}
          .disabled=${this._selectedSegments.size === 0}
        >
          <ha-icon icon="mdi:selection"></ha-icon>
          Apply to Selected
        </ha-button>
      </div>
    `;
  }

  _renderBlocksMode() {
    return html`
      <div class="mode-description">
        Create evenly spaced blocks of color. Add 1-6 colors.
      </div>
      <div class="color-array">
        ${this.blockColors.map((color, index) => html`
          <div class="color-item">
            <div
              class="color-swatch"
              style="background-color: ${xyToHex(color)}"
              @click=${() => this._openColorPicker('blocks', index)}
            ></div>
            ${this.blockColors.length > 1 ? html`
              <button class="color-remove" @click=${() => this._removeBlockColor(index)}>
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            ` : html`<div class="color-remove-spacer"></div>`}
          </div>
        `)}
        ${this.blockColors.length < 6 ? html`
          <div class="add-color-btn">
            <div class="add-color-icon" @click=${this._addBlockColor}>
              <ha-icon icon="mdi:plus"></ha-icon>
            </div>
            <div class="color-remove-spacer"></div>
          </div>
        ` : ''}
      </div>
      <div class="options-row">
        <label class="option-item">
          <input
            type="checkbox"
            .checked=${this.expandBlocks}
            @change=${this._handleExpandBlocksChange}
          />
          <span class="option-label">Expand blocks to fill segments evenly</span>
        </label>
      </div>
      <div class="generated-actions">
        <ha-button @click=${this._applyToGrid}>
          <ha-icon icon="mdi:grid"></ha-icon>
          Apply to Grid
        </ha-button>
        <ha-button
          @click=${this._applyToSelectedSegments}
          .disabled=${this._selectedSegments.size === 0}
        >
          <ha-icon icon="mdi:selection"></ha-icon>
          Apply to Selected
        </ha-button>
      </div>
    `;
  }

  _renderHint() {
    if (this.mode === 'selection') {
      return html`
        <span class="hint">
          Click to select, Shift+click for range, Ctrl/Cmd+click to toggle multiple
        </span>
      `;
    } else if (this.mode === 'color' || this.mode === 'sequence') {
      return html`
        <span class="hint">
          Select a color from palette, then click segments to apply. Use Select/Clear modes for bulk operations.
        </span>
      `;
    }
    return '';
  }

  _renderColorPickerModal() {
    if (this._editingColorSource === null || this._editingColor === null) {
      return '';
    }

    // Convert HS → XY → RGB to show accurate color that will be sent to device
    // This prevents color washout by matching the actual color conversion path
    const xyColor = hsToXy(this._editingColor);
    const accurateRgb = xyToRgb(xyColor.x, xyColor.y, 255);
    const accurateHex = `#${accurateRgb.r.toString(16).padStart(2, '0')}${accurateRgb.g.toString(16).padStart(2, '0')}${accurateRgb.b.toString(16).padStart(2, '0')}`;

    return html`
      <div class="color-picker-modal-overlay" @click=${this._closeColorPicker}>
        <div class="color-picker-modal" @click=${(e) => e.stopPropagation()}>
          <div class="color-picker-modal-header">
            <span class="color-picker-modal-title">Select Color</span>
            <div
              class="color-picker-modal-preview"
              style="background-color: ${accurateHex}"
            ></div>
          </div>
          <div class="color-picker-canvas-container">
            ${this._renderColorWheel()}
          </div>
          <div class="color-picker-rgb-inputs">
            <label class="rgb-input-label">
              <span class="rgb-input-channel">R</span>
              <input
                type="number"
                class="rgb-input-field"
                min="0"
                max="255"
                .value=${accurateRgb.r}
                @input=${(e) => this._handleRgbInput(e, 'r')}
              />
            </label>
            <label class="rgb-input-label">
              <span class="rgb-input-channel">G</span>
              <input
                type="number"
                class="rgb-input-field"
                min="0"
                max="255"
                .value=${accurateRgb.g}
                @input=${(e) => this._handleRgbInput(e, 'g')}
              />
            </label>
            <label class="rgb-input-label">
              <span class="rgb-input-channel">B</span>
              <input
                type="number"
                class="rgb-input-field"
                min="0"
                max="255"
                .value=${accurateRgb.b}
                @input=${(e) => this._handleRgbInput(e, 'b')}
              />
            </label>
          </div>
          <div class="color-picker-modal-actions">
            <ha-button @click=${this._closeColorPicker}>Cancel</ha-button>
            <ha-button @click=${this._confirmColorPicker}>
              <ha-icon icon="mdi:check"></ha-icon>
              Apply
            </ha-button>
          </div>
        </div>
      </div>
    `;
  }

  _renderColorWheel() {
    // Full HS color wheel picker with stable IDs
    const size = 220;
    const wheelId = 'color-wheel-canvas';
    const markerId = 'color-wheel-marker';

    // Convert HS → XY → RGB for accurate color preview
    const xyColor = hsToXy(this._editingColor);
    const rgb = xyToRgb(xyColor.x, xyColor.y, 255);
    const accurateHex = `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;

    // Calculate initial marker position to prevent duplicate marker at (0,0)
    const { x, y } = this._hsToWheelPosition(this._editingColor, size);

    // Schedule canvas drawing and marker positioning after render
    // Only update marker if NOT currently dragging (prevents flickering)
    setTimeout(() => {
      this._drawColorWheel(wheelId, size);
      if (!this._wheelIsDragging) {
        this._updateMarkerPosition(wheelId, markerId, size);
      }
    }, 0);

    return html`
      <div class="hs-color-picker-container" style="width: ${size}px; height: ${size}px; position: relative; margin: 0 auto; touch-action: none;">
        <canvas
          id="${wheelId}"
          width="${size}"
          height="${size}"
          style="border-radius: 50%; cursor: crosshair; display: block;"
          @mousedown=${(e) => this._onWheelPointerDown(e, wheelId, markerId, size)}
          @touchstart=${(e) => this._onWheelPointerDown(e, wheelId, markerId, size)}
        ></canvas>
        <div
          id="${markerId}"
          style="position: absolute; left: ${x}px; top: ${y}px; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0, 0, 0, 0.5), inset 0 0 2px rgba(0, 0, 0, 0.3); pointer-events: none; transform: translate(-50%, -50%); transition: box-shadow 0.1s ease; background-color: ${accurateHex};"
        ></div>
      </div>
    `;
  }

  _drawColorWheel(canvasId, size) {
    const canvas = this.shadowRoot.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    canvas.width = size;
    canvas.height = size;

    // Draw the color wheel using HSL gradients (efficient, no RGB conversion needed during rendering)
    // This matches the original working hs-color-picker.ts implementation
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = ((angle - 1) * Math.PI) / 180;
      const endAngle = ((angle + 1) * Math.PI) / 180;

      // Draw saturation gradient for this hue slice
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );

      // Center is white (saturation = 0)
      gradient.addColorStop(0, `hsl(${angle}, 0%, 100%)`);
      // Edge is full saturation
      gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  _updateMarkerPosition(canvasId, markerId, size) {
    const marker = this.shadowRoot.getElementById(markerId);
    if (!marker || !this._editingColor) return;

    const { x, y } = this._hsToWheelPosition(this._editingColor, size);

    // Convert HS → XY → RGB for accurate color preview
    const xyColor = hsToXy(this._editingColor);
    const rgb = xyToRgb(xyColor.x, xyColor.y, 255);
    const accurateHex = `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;

    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
    marker.style.backgroundColor = accurateHex;
  }

  _hsToWheelPosition(hs, size) {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    // Convert hue to radians (0 degrees = right, going clockwise)
    const angleRad = (hs.h * Math.PI) / 180;
    // Saturation determines distance from center (0 = center, 100 = edge)
    const distance = (hs.s / 100) * radius;

    return {
      x: centerX + distance * Math.cos(angleRad),
      y: centerY + distance * Math.sin(angleRad),
    };
  }

  _wheelPositionToHs(x, y, size) {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    const dx = x - centerX;
    const dy = y - centerY;

    // Calculate distance from center (saturation)
    let distance = Math.sqrt(dx * dx + dy * dy);
    distance = Math.min(distance, radius); // Clamp to wheel edge

    // Calculate angle (hue) - atan2 returns -180 to 180, convert to 0-360
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    // Calculate saturation percentage
    let saturation = Math.round((distance / radius) * 100);

    // Snap to 100% saturation if very close to edge (helps select pure colors)
    if (saturation >= 98) {
      saturation = 100;
    }

    return {
      h: Math.round(angle) % 360,
      s: saturation,
    };
  }

  _onWheelPointerDown(e, canvasId, markerId, size) {
    e.preventDefault();
    this._wheelIsDragging = true;
    this._wheelCanvasId = canvasId;
    this._wheelMarkerId = markerId;
    this._wheelSize = size;

    const marker = this.shadowRoot.getElementById(markerId);
    if (marker) {
      marker.style.boxShadow = '0 0 8px rgba(0, 0, 0, 0.7), inset 0 0 2px rgba(0, 0, 0, 0.3)';
    }

    this._handleWheelInteraction(e, canvasId, markerId, size);

    if (e instanceof MouseEvent) {
      this._wheelPointerMoveBound = (evt) => this._onWheelPointerMove(evt);
      this._wheelPointerUpBound = () => this._onWheelPointerUp();
      window.addEventListener('mousemove', this._wheelPointerMoveBound);
      window.addEventListener('mouseup', this._wheelPointerUpBound);
    } else {
      this._wheelPointerMoveBound = (evt) => this._onWheelPointerMove(evt);
      this._wheelPointerUpBound = () => this._onWheelPointerUp();
      window.addEventListener('touchmove', this._wheelPointerMoveBound, { passive: false });
      window.addEventListener('touchend', this._wheelPointerUpBound);
    }
  }

  _onWheelPointerMove(e) {
    if (!this._wheelIsDragging) return;
    e.preventDefault();
    this._handleWheelInteraction(e, this._wheelCanvasId, this._wheelMarkerId, this._wheelSize);
  }

  _onWheelPointerUp() {
    this._wheelIsDragging = false;

    const marker = this.shadowRoot.getElementById(this._wheelMarkerId);
    if (marker) {
      marker.style.boxShadow = '0 0 4px rgba(0, 0, 0, 0.5), inset 0 0 2px rgba(0, 0, 0, 0.3)';
    }

    if (this._wheelPointerMoveBound) {
      window.removeEventListener('mousemove', this._wheelPointerMoveBound);
      window.removeEventListener('touchmove', this._wheelPointerMoveBound);
      this._wheelPointerMoveBound = null;
    }
    if (this._wheelPointerUpBound) {
      window.removeEventListener('mouseup', this._wheelPointerUpBound);
      window.removeEventListener('touchend', this._wheelPointerUpBound);
      this._wheelPointerUpBound = null;
    }
  }

  _handleWheelInteraction(e, canvasId, markerId, size) {
    const canvas = this.shadowRoot.getElementById(canvasId);
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e instanceof TouchEvent) {
      const touch = e.touches[0];
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const newColor = this._wheelPositionToHs(x, y, size);
    this._editingColor = newColor;

    // Update marker position immediately (smooth dragging)
    this._updateMarkerPosition(canvasId, markerId, size);

    // Update the preview in modal header without full re-render
    const preview = this.shadowRoot.querySelector('.color-picker-modal-preview');
    if (preview) {
      const xyColor = hsToXy(this._editingColor);
      const rgb = xyToRgb(xyColor.x, xyColor.y, 255);
      const hex = `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
      preview.style.backgroundColor = hex;
    }

    // Update RGB input values without triggering full re-render
    const rgbInputs = this.shadowRoot.querySelectorAll('.rgb-input-field');
    if (rgbInputs.length === 3) {
      const xyColor = hsToXy(this._editingColor);
      const rgb = xyToRgb(xyColor.x, xyColor.y, 255);
      rgbInputs[0].value = rgb.r;
      rgbInputs[1].value = rgb.g;
      rgbInputs[2].value = rgb.b;
    }
  }

  render() {
    return html`
      <div class="segment-selector">
        ${this.label ? html`<span class="label">${this.label}</span>` : ''}
        ${this._renderGrid()}
        ${this._renderColorPalette()}
        ${this.description ? html`<span class="description">${this.description}</span>` : ''}
        ${this._renderHint()}
        ${this._renderColorPickerModal()}
      </div>
    `;
  }
}

customElements.define('segment-selector', SegmentSelector);
