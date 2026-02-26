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

import { LitElement, html, css, PropertyValues, CSSResultGroup, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { XYColor, HSColor, HomeAssistant, SegmentZoneResolved, Translations } from './types';
import {
  xyToRgb,
  rgbToXy,
  xyToHs,
  hsToXy,
  rgbToHex,
  getComplementaryColor,
} from './color-utils';
import { addColorToHistory } from './color-history';
import './color-history-swatches';

// Component mode types
type SegmentSelectorMode = 'selection' | 'color' | 'sequence';
type PatternMode = 'individual' | 'gradient' | 'blocks';
type ColorSource = 'palette' | 'gradient' | 'blocks' | null;
type InterpolationMode = 'shortest' | 'longest' | 'rgb';

// Default palettes
const DEFAULT_PALETTE: XYColor[] = [
  { x: 0.6800, y: 0.3100 },    // Red
  { x: 0.1700, y: 0.7000 },    // Green
  { x: 0.1500, y: 0.0600 },    // Blue
  { x: 0.4200, y: 0.5100 },    // Yellow
  { x: 0.3800, y: 0.1600 },    // Magenta
  { x: 0.2200, y: 0.3300 },    // Cyan
];

const DEFAULT_GRADIENT_COLORS: XYColor[] = [
  { x: 0.6800, y: 0.3100 },  // Red
  { x: 0.1500, y: 0.0600 },  // Blue
];

const DEFAULT_BLOCK_COLORS: XYColor[] = [
  { x: 0.6800, y: 0.3100 },  // Red
  { x: 0.1700, y: 0.7000 },  // Green
];

/**
 * Convert XY color to hex string
 */
function xyToHex(xy: XYColor, brightness: number = 255): string {
  const rgb = xyToRgb(xy.x, xy.y, brightness);
  return rgbToHex(rgb);
}

@customElement('segment-selector')
export class SegmentSelector extends LitElement {
  @property({ type: Object }) hass?: HomeAssistant;
  @property({ type: String }) mode: SegmentSelectorMode = 'selection';
  @property({ type: Number }) maxSegments = 10;
  @property({ type: String }) value = '';
  @property({ type: Object }) colorValue: Map<number, XYColor> = new Map();
  @property({ type: Array }) colorPalette: XYColor[] = [...DEFAULT_PALETTE];
  @property({ type: Array }) gradientColors: XYColor[] = [...DEFAULT_GRADIENT_COLORS];
  @property({ type: Array }) blockColors: XYColor[] = [...DEFAULT_BLOCK_COLORS];
  @property({ type: Boolean }) expandBlocks = false;
  @property({ type: Boolean }) gradientMirror = false;
  @property({ type: Number }) gradientRepeat = 1;
  @property({ type: Boolean }) gradientReverse = false;
  @property({ type: String }) gradientInterpolation: InterpolationMode = 'shortest';
  @property({ type: Boolean }) gradientWave = false;
  @property({ type: Number }) gradientWaveCycles = 1;
  @property({ type: String }) label = '';
  @property({ type: String }) description = '';
  @property({ type: Boolean }) disabled = false;
  @property({ type: Object }) translations: Translations = {};
  @property({ type: Array }) colorHistory: XYColor[] = [];
  @property({ type: String }) initialPatternMode?: PatternMode;
  @property({ type: Array }) zones: SegmentZoneResolved[] = [];
  @property({ type: Boolean }) turnOffUnspecified = true;
  @property({ type: Boolean }) hideControls = false;

  @state() private _selectedSegments: Set<number> = new Set();
  @state() private _coloredSegments: Map<number, XYColor> = new Map();
  @state() private _lastSelectedIndex: number | null = null;
  @state() private _selectedPaletteIndex = 0;
  @state() private _selectedZone = '';
  @state() private _clearMode = false;
  @state() private _selectMode = false;
  @state() private _patternMode: PatternMode = 'individual';
  private _initialPatternApplied = false;
  @state() private _editingColorSource: ColorSource = null;
  @state() private _editingColorIndex: number | null = null;
  @state() private _editingColor: HSColor | null = null;

  private _hsColorCache: Map<string, HSColor> = new Map();
  private _wheelIsDragging = false;
  private _wheelCanvasId: string | null = null;
  private _wheelMarkerId: string | null = null;
  private _wheelSize = 0;
  private _wheelPointerMoveBound: ((e: MouseEvent | TouchEvent) => void) | null = null;
  private _wheelPointerUpBound: (() => void) | null = null;

  static get styles(): CSSResultGroup {
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

      .segment-grid-container.compact {
        padding: 8px;
        margin-bottom: 0;
      }

      .segment-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
        gap: 4px;
        margin-bottom: 12px;
      }

      .compact .segment-grid {
        grid-template-columns: repeat(auto-fill, minmax(28px, 1fr));
        gap: 3px;
        margin-bottom: 0;
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

      .compact .segment-cell {
        font-size: 9px;
        border-width: 1px;
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
        color: var(--primary-color);
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
        color: var(--error-color);
      }

      /* Select mode toggle button */
      .select-mode-toggle.active {
        color: var(--info-color, #2196f3);
      }

      .zone-select {
        min-width: 200px;
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
        margin-top: 8px;
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
        color: var(--text-primary-color);
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

      .option-number-input {
        width: 60px;
        font-size: 13px;
      }

      .option-select {
        font-size: 13px;
      }

      /* Color picker ha-dialog styling
       * Fixed width sized for 8 color history swatches:
       * 8 x 32px swatches + 7 x 6px gaps = 298px content + 48px padding = 346px
       */
      ha-dialog {
        --ha-dialog-width-md: min(346px, calc(100vw - 32px));
        --ha-dialog-max-width: min(346px, calc(100vw - 32px));
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

        .mode-tabs {
          overflow-x: auto;
        }
      }
    `;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._wheelPointerMoveBound) {
      window.removeEventListener('mousemove', this._wheelPointerMoveBound as EventListener);
      window.removeEventListener('touchmove', this._wheelPointerMoveBound as EventListener);
      this._wheelPointerMoveBound = null;
    }
    if (this._wheelPointerUpBound) {
      window.removeEventListener('mouseup', this._wheelPointerUpBound);
      window.removeEventListener('touchend', this._wheelPointerUpBound);
      this._wheelPointerUpBound = null;
    }
  }

  protected updated(changedProps: PropertyValues): void {
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

    // Apply initial pattern mode once when loading a preset with gradient/blocks,
    // but only if no per-segment color data was loaded (colorValue takes priority
    // so editing a preset always shows the saved segment colors on Individual tab)
    if (this.initialPatternMode && !this._initialPatternApplied &&
        this.initialPatternMode !== 'individual' && this.maxSegments > 0) {
      this._initialPatternApplied = true;
      if (this._coloredSegments.size === 0) {
        this._patternMode = this.initialPatternMode;
        this._applyToGrid();
      }
    }

    // Validate selection against maxSegments
    if (changedProps.has('maxSegments')) {
      this._validateSelection();
    }
  }

  /**
   * Parse the value string into selected segments (selection mode)
   */
  private _parseValue(): void {
    const newSelected = new Set<number>();

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
        const parts = range.split('-').map(s => s.trim());
        const startStr = parts[0] ?? '';
        const endStr = parts[1] ?? '';
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
  private _parseColorValue(): void {
    if (this.colorValue instanceof Map) {
      this._coloredSegments = new Map(this.colorValue);
    } else {
      this._coloredSegments = new Map();
    }
  }

  /**
   * Validate selection and remove segments that exceed maxSegments
   */
  private _validateSelection(): void {
    const validated = new Set<number>();
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
    const validatedColors = new Map<number, XYColor>();
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
  private _segmentsToString(): string {
    if (this._selectedSegments.size === 0) {
      return '';
    }

    if (this._selectedSegments.size === this.maxSegments) {
      return 'all';
    }

    const sorted = Array.from(this._selectedSegments).sort((a, b) => a - b);
    const ranges: string[] = [];
    if (sorted.length === 0) return '';

    let start = sorted[0]!;
    let end = sorted[0]!;

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i]!;
      if (current === end + 1) {
        end = current;
      } else {
        ranges.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);
        start = end = current;
      }
    }

    ranges.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);
    return ranges.join(',');
  }

  /**
   * Handle segment cell click - mode aware
   */
  private _handleSegmentClick(index: number, event: MouseEvent): void {
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
  private _handleSelectionClick(index: number, event: MouseEvent): void {
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
  private _handleColorClick(index: number, event: MouseEvent): void {
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
   * Translation helper
   */
  private _localize(key: string, replacements?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: string | Translations | undefined = this.translations;
    for (const k of keys) {
      if (!value || typeof value !== 'object' || !(k in value)) {
        return key;
      }
      value = (value as Translations)[k];
    }
    let result = typeof value === 'string' ? value : key;
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, replacement]) => {
        result = result.replace(`{${placeholder}}`, String(replacement));
      });
    }
    return result;
  }

  /**
   * Quick actions
   */
  private _selectAll(): void {
    if (this.disabled) return;
    const newSelection = new Set<number>();
    for (let i = 0; i < this.maxSegments; i++) {
      newSelection.add(i);
    }
    this._selectedSegments = newSelection;
    this._lastSelectedIndex = null;
    if (this.mode === 'selection' || this.mode === 'sequence') {
      this._fireValueChanged();
    }
  }

  private _clearAll(): void {
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

  private _getBuiltInZoneIndices(name: string): number[] | null {
    const half = Math.floor(this.maxSegments / 2);
    switch (name) {
      case '__all':
        return Array.from({ length: this.maxSegments }, (_, i) => i);
      case '__first-half':
        return Array.from({ length: half }, (_, i) => i);
      case '__second-half':
        return Array.from({ length: this.maxSegments - half }, (_, i) => half + i);
      case '__odd':
        return Array.from({ length: this.maxSegments }, (_, i) => i).filter(i => i % 2 === 0);
      case '__even':
        return Array.from({ length: this.maxSegments }, (_, i) => i).filter(i => i % 2 === 1);
      default:
        return null;
    }
  }

  private _renderZoneListItems(): TemplateResult[] {
    const items: TemplateResult[] = [];
    if (this.zones.length > 0) {
      for (const z of this.zones) {
        items.push(html`<mwc-list-item value=${z.name}>${z.name}</mwc-list-item>`);
      }
    }
    items.push(html`<mwc-list-item value="__all">${this._localize('editors.select_all_button')}</mwc-list-item>`);
    items.push(html`<mwc-list-item value="__first-half">${this._localize('editors.first_half_button')}</mwc-list-item>`);
    items.push(html`<mwc-list-item value="__second-half">${this._localize('editors.second_half_button')}</mwc-list-item>`);
    items.push(html`<mwc-list-item value="__odd">${this._localize('editors.odd_button')}</mwc-list-item>`);
    items.push(html`<mwc-list-item value="__even">${this._localize('editors.even_button')}</mwc-list-item>`);
    return items;
  }

  private _handleZoneSelected(e: Event): void {
    const select = e.target as HTMLElement & { value: string };
    const zoneName = select.value;
    if (!zoneName || this.disabled) return;

    // Check built-in zones first
    const builtInIndices = this._getBuiltInZoneIndices(zoneName);
    let newSelected: Set<number>;
    if (builtInIndices) {
      newSelected = new Set<number>(builtInIndices);
    } else {
      const zone = this.zones.find(z => z.name === zoneName);
      if (!zone) return;
      newSelected = new Set<number>(zone.segmentIndices);
    }

    this._selectedSegments = newSelected;
    this._lastSelectedIndex = null;
    if (this.mode === 'selection' || this.mode === 'sequence') {
      this._fireValueChanged();
    }
  }

  private _handleZoneMenuClosed(e: Event): void {
    e.stopPropagation();
    // Reset to empty after menu closes so the same zone can be re-selected
    this._selectedZone = '';
  }

  private _clearSelected(): void {
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
  private _toggleClearMode(): void {
    this._clearMode = !this._clearMode;
    if (this._clearMode) {
      this._selectMode = false;
    }
  }

  private _toggleSelectMode(): void {
    this._selectMode = !this._selectMode;
    if (this._selectMode) {
      this._clearMode = false;
    }
  }

  private _selectPaletteColor(index: number): void {
    this._selectedPaletteIndex = index;
  }

  private _applyToSelected(): void {
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

  private _setPatternMode(mode: PatternMode): void {
    this._patternMode = mode;
    this._clearMode = false;
    this._selectMode = false;
  }

  private _addGradientColor(): void {
    if (this.gradientColors.length >= 6 || this.gradientColors.length === 0) return;
    const lastColor = this.gradientColors[this.gradientColors.length - 1];
    if (!lastColor) return;
    const newColor = getComplementaryColor(lastColor);
    this.gradientColors = [...this.gradientColors, newColor];
    this._fireGradientColorsChanged();
  }

  private _removeGradientColor(index: number): void {
    if (this.gradientColors.length <= 2) return;
    this.gradientColors = this.gradientColors.filter((_, i) => i !== index);
    this._fireGradientColorsChanged();
  }

  private _addBlockColor(): void {
    if (this.blockColors.length >= 6 || this.blockColors.length === 0) return;
    const lastColor = this.blockColors[this.blockColors.length - 1];
    if (!lastColor) return;
    const newColor = getComplementaryColor(lastColor);
    this.blockColors = [...this.blockColors, newColor];
    this._fireBlockColorsChanged();
  }

  private _removeBlockColor(index: number): void {
    if (this.blockColors.length <= 1) return;
    this.blockColors = this.blockColors.filter((_, i) => i !== index);
    this._fireBlockColorsChanged();
  }

  private _handleExpandBlocksChange(e: Event): void {
    this.expandBlocks = (e.target as HTMLInputElement).checked;
  }

  private _handleGradientReverseChange(e: Event): void {
    this.gradientReverse = (e.target as HTMLInputElement).checked;
  }

  private _handleGradientMirrorChange(e: Event): void {
    this.gradientMirror = (e.target as HTMLInputElement).checked;
  }

  private _handleGradientWaveChange(e: Event): void {
    this.gradientWave = (e.target as HTMLInputElement).checked;
  }

  private _handleGradientRepeatChange(e: Event): void {
    this.gradientRepeat = Math.max(1, Math.min(10, parseInt((e.target as HTMLInputElement).value) || 1));
  }

  private _handleGradientWaveCyclesChange(e: Event): void {
    this.gradientWaveCycles = Math.max(1, Math.min(5, parseInt((e.target as HTMLInputElement).value) || 1));
  }

  private _handleGradientInterpolationChange(e: Event): void {
    const target = e.target as HTMLElement & { value: string };
    if (target.value) {
      this.gradientInterpolation = target.value as InterpolationMode;
    }
  }

  private _handleInterpolationMenuClosed(e: Event): void {
    e.stopPropagation();
  }

  /**
   * Interpolate hue values, taking the shortest path around the color wheel
   */
  private _interpolateHue(h1: number, h2: number, t: number): number {
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
   * Interpolate hue values, taking the longest path around the color wheel
   */
  private _interpolateHueLongest(h1: number, h2: number, t: number): number {
    let diff = h2 - h1;

    // Invert the shortest path to get the longest path
    if (diff > 0 && diff <= 180) {
      diff -= 360;
    } else if (diff < 0 && diff >= -180) {
      diff += 360;
    }

    let result = h1 + diff * t;

    if (result < 0) result += 360;
    if (result >= 360) result -= 360;

    return result;
  }

  /**
   * Interpolate between two colors using the selected interpolation mode.
   * c1/c2 are HS objects, xy1/xy2 are the original XY colors (for RGB mode).
   */
  private _interpolateColorPair(c1: HSColor, c2: HSColor, xy1: XYColor, xy2: XYColor, t: number): XYColor {
    if (this.gradientInterpolation === 'rgb') {
      const rgb1 = xyToRgb(xy1.x, xy1.y, 255);
      const rgb2 = xyToRgb(xy2.x, xy2.y, 255);
      const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
      const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
      const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
      return rgbToXy(r, g, b);
    }

    const hueInterp = this.gradientInterpolation === 'longest'
      ? this._interpolateHueLongest(c1.h, c2.h, t)
      : this._interpolateHue(c1.h, c2.h, t);

    const interpolatedHS: HSColor = {
      h: Math.round(hueInterp),
      s: Math.round(c1.s + (c2.s - c1.s) * t),
    };

    return hsToXy(interpolatedHS);
  }

  /**
   * Apply wave/sinusoidal transform to a linear interpolation parameter.
   * Maps t in [0,1] through N sinusoidal cycles.
   */
  private _applyWaveTransform(t: number): number {
    return 0.5 - 0.5 * Math.cos(t * Math.PI * 2 * this.gradientWaveCycles);
  }

  /**
   * Generate an array of XY colors for a gradient across the given segment count.
   * Respects reverse, interpolation mode, mirror, repeat, and wave settings.
   */
  private _generateGradientColorArray(segmentCount: number): XYColor[] {
    if (segmentCount === 0 || this.gradientColors.length < 2) return [];

    // Apply reverse by copying and reversing the color array
    const xyColors = this.gradientReverse
      ? [...this.gradientColors].reverse()
      : [...this.gradientColors];
    const numColors = xyColors.length;
    const hsColors = xyColors.map(c => xyToHs(c));

    // Determine how many segments to generate before mirroring
    const halfCount = this.gradientMirror
      ? Math.ceil(segmentCount / 2)
      : segmentCount;

    // Determine tile size for repeating
    const tileSize = this.gradientRepeat > 1
      ? Math.max(2, Math.ceil(halfCount / this.gradientRepeat))
      : halfCount;

    // Generate one tile of colors
    const tile: XYColor[] = [];
    for (let i = 0; i < tileSize; i++) {
      let t = tileSize > 1 ? i / (tileSize - 1) : 0;

      // Apply wave transform if enabled
      if (this.gradientWave) {
        t = this._applyWaveTransform(t);
      }

      // Map t to a position in the color array
      const colorPosition = t * (numColors - 1);
      const colorIndex = Math.floor(colorPosition);
      const colorT = colorPosition - colorIndex;

      const idx1 = Math.min(colorIndex, numColors - 1);
      const idx2 = Math.min(colorIndex + 1, numColors - 1);
      const c1 = hsColors[idx1];
      const c2 = hsColors[idx2];
      const xy1 = xyColors[idx1];
      const xy2 = xyColors[idx2];
      if (!c1 || !c2 || !xy1 || !xy2) continue;

      tile.push(this._interpolateColorPair(c1, c2, xy1, xy2, colorT));
    }

    // Repeat tile to fill halfCount
    const halfPattern: XYColor[] = [];
    for (let i = 0; i < halfCount; i++) {
      const tileColor = tile[i % tileSize];
      if (tileColor) halfPattern.push(tileColor);
    }

    // Apply mirror if enabled
    if (this.gradientMirror) {
      const mirrored = [...halfPattern];
      // Reverse the half and append. For odd segment counts, skip the first
      // reversed element to avoid duplicating the center point. For even
      // counts, include all elements since there is no shared center.
      const reversed = [...halfPattern].reverse();
      const isOdd = segmentCount % 2 !== 0;
      const startIndex = (isOdd && halfPattern.length > 1) ? 1 : 0;
      for (let i = startIndex; i < reversed.length; i++) {
        const revColor = reversed[i];
        if (revColor) mirrored.push(revColor);
      }
      // Trim to exact segment count
      return mirrored.slice(0, segmentCount);
    }

    return halfPattern;
  }

  /**
   * Generate gradient pattern
   */
  private _generateGradientPattern(): Map<number, XYColor> {
    if (this.gradientColors.length < 2 || this.maxSegments === 0) return new Map();

    const colors = this._generateGradientColorArray(this.maxSegments);
    const pattern = new Map<number, XYColor>();
    colors.forEach((color, i) => pattern.set(i, color));
    return pattern;
  }

  /**
   * Generate blocks pattern
   */
  private _generateBlocksPattern(): Map<number, XYColor> {
    const colors = this.blockColors;
    const numColors = colors.length;
    const pattern = new Map<number, XYColor>();

    if (numColors === 0 || this.maxSegments === 0) return pattern;

    if (this.expandBlocks) {
      const segmentsPerColor = this.maxSegments / numColors;
      for (let i = 0; i < this.maxSegments; i++) {
        const colorIndex = Math.min(Math.floor(i / segmentsPerColor), numColors - 1);
        const color = colors[colorIndex]!;
        pattern.set(i, { x: color.x, y: color.y });
      }
    } else {
      for (let i = 0; i < this.maxSegments; i++) {
        const colorIndex = i % numColors;
        const color = colors[colorIndex]!;
        pattern.set(i, { x: color.x, y: color.y });
      }
    }

    return pattern;
  }

  /**
   * Apply generated pattern to grid
   */
  private _applyToGrid(): void {
    let generatedPattern: Map<number, XYColor>;

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
  private _applyToSelectedSegments(): void {
    if (this._selectedSegments.size === 0) return;

    const selectedArray = Array.from(this._selectedSegments).sort((a, b) => a - b);
    const selectedCount = selectedArray.length;

    let colors: XYColor[] = [];
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
      const gradientColors = this._generateGradientColorArray(selectedCount);
      for (let i = 0; i < selectedCount; i++) {
        const segNum = selectedArray[i];
        const gradColor = gradientColors[i];
        if (segNum === undefined || !gradColor) continue;
        newColored.set(segNum, gradColor);
      }
    } else if (this._patternMode === 'blocks') {
      if (this.expandBlocks) {
        const blockSize = Math.ceil(selectedCount / numColors);
        for (let i = 0; i < selectedCount; i++) {
          const segNum = selectedArray[i];
          if (segNum === undefined) continue;
          const colorIndex = Math.min(Math.floor(i / blockSize), numColors - 1);
          const color = colors[colorIndex];
          if (!color) continue;
          newColored.set(segNum, { x: color.x, y: color.y });
        }
      } else {
        for (let i = 0; i < selectedCount; i++) {
          const segNum = selectedArray[i];
          if (segNum === undefined) continue;
          const colorIndex = i % numColors;
          const color = colors[colorIndex];
          if (!color) continue;
          newColored.set(segNum, { x: color.x, y: color.y });
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
  private _openColorPicker(source: ColorSource, index: number): void {
    let xyColor: XYColor | undefined;
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
      // Use cached HS to avoid XY -> HS conversion loss
      this._editingColor = cachedHs;
    } else {
      // First time editing this color, convert XY -> HS
      this._editingColor = xyToHs(xyColor);
    }
  }

  private _confirmColorPicker(): void {
    if (this._editingColorIndex === null || this._editingColor === null || !this._editingColorSource) {
      this._closeColorPicker();
      return;
    }

    const xyColor = hsToXy(this._editingColor);

    // Update color history and notify parent
    const newHistory = addColorToHistory(this.colorHistory, xyColor);
    this.dispatchEvent(new CustomEvent('color-history-changed', {
      detail: { colorHistory: newHistory },
      bubbles: true,
      composed: true,
    }));

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

  private _closeColorPicker(): void {
    this._editingColorSource = null;
    this._editingColorIndex = null;
    this._editingColor = null;
  }

  private _handleHistoryColorSelected(e: CustomEvent): void {
    const color = e.detail.color as XYColor;
    const hs = xyToHs(color);
    this._editingColor = { h: hs.h, s: hs.s };

    // Update marker position and preview
    const wheelId = 'color-wheel-canvas';
    const markerId = 'color-wheel-marker';
    const size = 220;
    this._updateMarkerPosition(wheelId, markerId, size);

    // Update RGB input fields
    const rgb = xyToRgb(color.x, color.y, 255);
    const inputs = this.shadowRoot?.querySelectorAll('.color-picker-rgb-inputs .rgb-input-field');
    if (inputs && inputs.length === 3) {
      (inputs[0] as HTMLInputElement).value = String(rgb.r);
      (inputs[1] as HTMLInputElement).value = String(rgb.g);
      (inputs[2] as HTMLInputElement).value = String(rgb.b);
    }

    // Update preview
    const preview = this.shadowRoot?.querySelector('.color-picker-modal-preview') as HTMLElement;
    if (preview) {
      preview.style.backgroundColor = rgbToHex(rgb);
    }
  }

  private _handleRgbInput(e: Event, channel: 'r' | 'g' | 'b'): void {
    const input = e.target as HTMLInputElement;
    let value = parseInt(input.value, 10);

    // Validate and clamp input
    if (isNaN(value) || input.value === '') {
      return;
    }

    // Clamp value to valid range
    value = Math.max(0, Math.min(255, value));

    if (!this._editingColor) return;

    // Get current RGB values from current HS color
    const xyColor = hsToXy(this._editingColor);
    const currentRgb = xyToRgb(xyColor.x, xyColor.y, 255);

    // Update the specified channel
    const newRgb = {
      r: channel === 'r' ? value : currentRgb.r,
      g: channel === 'g' ? value : currentRgb.g,
      b: channel === 'b' ? value : currentRgb.b,
    };

    // Convert RGB -> XY -> HS
    const newXy = rgbToXy(newRgb.r, newRgb.g, newRgb.b);
    const newHs = xyToHs(newXy);

    // Update editing color
    this._editingColor = { h: newHs.h, s: newHs.s };

    // Update marker position and preview without full re-render
    const wheelId = 'color-wheel-canvas';
    const markerId = 'color-wheel-marker';
    const size = 220;

    this._updateMarkerPosition(wheelId, markerId, size);

    // Update preview color
    const preview = this.shadowRoot?.querySelector('.color-picker-modal-preview') as HTMLElement;
    if (preview) {
      const displayRgb = xyToRgb(newXy.x, newXy.y, 255);
      const hex = rgbToHex(displayRgb);
      preview.style.backgroundColor = hex;
    }

    // Update the OTHER RGB input fields to show what the device will actually display
    const rgbInputs = this.shadowRoot?.querySelectorAll('.rgb-input-field') as NodeListOf<HTMLInputElement> | undefined;
    if (rgbInputs && rgbInputs.length === 3) {
      const displayRgb = xyToRgb(newXy.x, newXy.y, 255);
      const channelIndex = channel === 'r' ? 0 : channel === 'g' ? 1 : 2;

      // Update all fields to show accurate converted values
      const rInput = rgbInputs[0];
      const gInput = rgbInputs[1];
      const bInput = rgbInputs[2];
      if (rInput) rInput.value = String(displayRgb.r);
      if (gInput) gInput.value = String(displayRgb.g);
      if (bInput) bInput.value = String(displayRgb.b);

      // If the displayed value differs from input, briefly highlight the field
      const displayValue = channel === 'r' ? displayRgb.r : channel === 'g' ? displayRgb.g : displayRgb.b;
      if (displayValue !== value) {
        const changedInput = rgbInputs[channelIndex];
        if (changedInput) {
          const originalBorder = changedInput.style.borderColor;
          changedInput.style.borderColor = 'var(--warning-color, #ff9800)';
          setTimeout(() => {
            changedInput.style.borderColor = originalBorder;
          }, 500);
        }
      }
    }
  }

  /**
   * Fire events
   */
  private _fireValueChanged(): void {
    const value = this._segmentsToString();
    this.dispatchEvent(
      new CustomEvent('value-changed', {
        detail: { value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _fireColorValueChanged(): void {
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

  private _fireColorPaletteChanged(): void {
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

  private _fireGradientColorsChanged(): void {
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

  private _handleTurnOffUnspecifiedChange(e: Event): void {
    this.turnOffUnspecified = (e.target as HTMLInputElement).checked;
    this.dispatchEvent(
      new CustomEvent('turn-off-unspecified-changed', {
        detail: { value: this.turnOffUnspecified },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _fireBlockColorsChanged(): void {
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
  private _renderGrid(): TemplateResult {
    const cells: TemplateResult[] = [];
    for (let i = 0; i < this.maxSegments; i++) {
      const isSelected = this._selectedSegments.has(i);
      const color = this._coloredSegments.get(i);
      const isColored = color !== undefined;

      const cellClasses: string[] = [];
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
          role="button"
          tabindex="0"
          style="${cellStyle}"
          @click=${(e: MouseEvent) => this._handleSegmentClick(i, e)}
          @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._handleSegmentClick(i, e as unknown as MouseEvent); } }}
          title="Segment ${i + 1}${isSelected ? ' (selected)' : ''}${isColored ? ' (colored)' : ''}"
          aria-label="Segment ${i + 1}"
          aria-pressed="${isSelected ? 'true' : 'false'}"
        >
          ${i + 1}
        </div>
      `);
    }

    return html`
      <div class="segment-grid-container ${this.hideControls ? 'compact' : ''}">
        <div
          class="segment-grid ${this._clearMode ? 'clear-mode' : ''} ${this._selectMode ? 'select-mode' : ''}"
          role="group"
          aria-label="${this._localize('editors.segment_grid_label') || 'Segment grid'}"
        >
          ${cells}
        </div>
        ${this.hideControls ? '' : this._renderControls()}
      </div>
    `;
  }

  private _renderControls(): TemplateResult | string {
    const count = this._selectedSegments.size;
    const hasSelection = count > 0;

    if (this.mode === 'selection') {
      return html`
        <div class="controls">
          <ha-button @click=${this._selectAll} .disabled=${this.disabled}>
            <ha-icon icon="mdi:select-all"></ha-icon>
            ${this._localize('editors.select_all_button')}
          </ha-button>
          <ha-button @click=${this._clearAll} .disabled=${this.disabled || !hasSelection}>
            <ha-icon icon="mdi:selection-off"></ha-icon>
            ${this._localize('editors.clear_all_button')}
          </ha-button>
          <div class="selection-info">
            <ha-icon icon="mdi:information-outline"></ha-icon>
            <span>${this._localize('editors.segments_selected', { count })}</span>
          </div>
        </div>
        <div class="options-row">
          <ha-select
            class="zone-select"
            .label=${this._localize('editors.zone_select_label')}
            .value=${this._selectedZone}
            .disabled=${this.disabled}
            @selected=${this._handleZoneSelected}
            @closed=${this._handleZoneMenuClosed}
          >
            ${this._renderZoneListItems()}
          </ha-select>
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
            ${this._selectMode ? this._localize('editors.select_mode_on') : this._localize('editors.select_mode_off')}
          </ha-button>
          <ha-button
            class="${this._clearMode ? 'clear-mode-toggle active' : 'clear-mode-toggle'}"
            @click=${this._toggleClearMode}
            .disabled=${this.disabled}
          >
            <ha-icon icon="${this._clearMode ? 'mdi:eraser' : 'mdi:eraser-variant'}"></ha-icon>
            ${this._clearMode ? this._localize('editors.clear_mode_on') : this._localize('editors.clear_mode_off')}
          </ha-button>
          <ha-button @click=${this._selectAll} .disabled=${this.disabled}>
            ${this._localize('editors.select_all_button')}
          </ha-button>
          <ha-button @click=${this._clearSelected} .disabled=${this.disabled || !hasSelection}>
            ${this._localize('editors.clear_selected_button')}
          </ha-button>
          <ha-button @click=${this._clearAll} .disabled=${this.disabled}>
            ${this._localize('editors.clear_all_button')}
          </ha-button>
          <div class="selection-info">
            <span>${this._localize('editors.segments_selected', { count })}</span>
          </div>
        </div>
        <div class="options-row">
          <ha-select
            class="zone-select"
            .label=${this._localize('editors.zone_select_label')}
            .value=${this._selectedZone}
            .disabled=${this.disabled}
            @selected=${this._handleZoneSelected}
            @closed=${this._handleZoneMenuClosed}
          >
            ${this._renderZoneListItems()}
          </ha-select>
          <label class="option-item">
            <ha-switch
              .checked=${this.turnOffUnspecified}
              @change=${this._handleTurnOffUnspecifiedChange}
            ></ha-switch>
            <span class="option-label">${this._localize('editors.turn_off_unspecified_label')}</span>
          </label>
        </div>
      `;
    }
    return '';
  }

  private _renderColorPalette(): TemplateResult | string {
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

  private _renderModeTabs(): TemplateResult {
    return html`
      <div class="mode-tabs" role="tablist">
        <button
          class="mode-tab ${this._patternMode === 'individual' ? 'active' : ''}"
          role="tab"
          aria-selected="${this._patternMode === 'individual' ? 'true' : 'false'}"
          @click=${() => this._setPatternMode('individual')}
        >
          ${this._localize('editors.individual_tab')}
        </button>
        <button
          class="mode-tab ${this._patternMode === 'gradient' ? 'active' : ''}"
          role="tab"
          aria-selected="${this._patternMode === 'gradient' ? 'true' : 'false'}"
          @click=${() => this._setPatternMode('gradient')}
        >
          ${this._localize('editors.gradient_tab')}
        </button>
        <button
          class="mode-tab ${this._patternMode === 'blocks' ? 'active' : ''}"
          role="tab"
          aria-selected="${this._patternMode === 'blocks' ? 'true' : 'false'}"
          @click=${() => this._setPatternMode('blocks')}
        >
          ${this._localize('editors.blocks_tab')}
        </button>
      </div>
    `;
  }

  private _renderModeContent(): TemplateResult {
    if (this.mode === 'sequence' || this._patternMode === 'individual') {
      return this._renderIndividualMode();
    } else if (this._patternMode === 'gradient') {
      return this._renderGradientMode();
    } else if (this._patternMode === 'blocks') {
      return this._renderBlocksMode();
    }
    return html``;
  }

  private _renderIndividualMode(): TemplateResult {
    return html`
      <div class="mode-description">
        Click a color to select it, then click segments to apply.
      </div>
      <div class="color-palette">
        ${this.colorPalette.map((color, index) => html`
          <div class="palette-color-wrapper">
            <div
              class="palette-color ${this._selectedPaletteIndex === index ? 'selected' : ''}"
              role="button"
              tabindex="0"
              style="background-color: ${xyToHex(color)}"
              @click=${() => this._selectPaletteColor(index)}
              @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._selectPaletteColor(index); } }}
              aria-label="${this._localize('editors.color_label') || 'Color'} ${index + 1}: ${xyToHex(color)}"
              aria-pressed="${this._selectedPaletteIndex === index ? 'true' : 'false'}"
            ></div>
            <button
              class="palette-edit-btn"
              @click=${() => this._openColorPicker('palette', index)}
            >
              <ha-icon icon="mdi:pencil"></ha-icon>
            </button>
          </div>
        `)}
      </div>
      <div class="generated-actions">
        <ha-button
          @click=${this._applyToSelected}
          .disabled=${this._selectedSegments.size === 0}
        >
          <ha-icon icon="mdi:selection"></ha-icon>
          ${this._localize('editors.apply_to_selected_button')}
        </ha-button>
      </div>
    `;
  }

  private _renderGradientMode(): TemplateResult {
    return html`
      <div class="mode-description">
        ${this._localize('editors.gradient_mode_description')}
      </div>
      <div class="color-array">
        ${this.gradientColors.map((color, index) => html`
          <div class="color-item">
            <div
              class="color-swatch"
              role="button"
              tabindex="0"
              style="background-color: ${xyToHex(color)}"
              @click=${() => this._openColorPicker('gradient', index)}
              @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._openColorPicker('gradient', index); } }}
              aria-label="${this._localize('editors.color_label') || 'Color'} ${index + 1}: ${xyToHex(color)}"
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
      <div class="options-row">
        <label class="option-item">
          <ha-switch
            .checked=${this.gradientReverse}
            @change=${this._handleGradientReverseChange}
          ></ha-switch>
          <span class="option-label">${this._localize('editors.gradient_reverse_label')}</span>
        </label>
        <label class="option-item">
          <ha-switch
            .checked=${this.gradientMirror}
            @change=${this._handleGradientMirrorChange}
          ></ha-switch>
          <span class="option-label">${this._localize('editors.gradient_mirror_label')}</span>
        </label>
        <label class="option-item">
          <ha-switch
            .checked=${this.gradientWave}
            @change=${this._handleGradientWaveChange}
          ></ha-switch>
          <span class="option-label">${this._localize('editors.gradient_wave_label')}</span>
        </label>
      </div>
      <div class="options-row">
        <label class="option-item">
          <span class="option-label">${this._localize('editors.gradient_repeat_label')}</span>
          <ha-textfield
            type="number"
            class="option-number-input"
            min="1"
            max="10"
            .value=${String(this.gradientRepeat)}
            @change=${this._handleGradientRepeatChange}
          ></ha-textfield>
        </label>
        <label class="option-item">
          <span class="option-label">${this._localize('editors.gradient_interpolation_label')}</span>
          <ha-select
            class="option-select"
            .value=${this.gradientInterpolation}
            @selected=${this._handleGradientInterpolationChange}
            @closed=${this._handleInterpolationMenuClosed}
          >
            <mwc-list-item value="shortest">${this._localize('editors.gradient_interp_shortest')}</mwc-list-item>
            <mwc-list-item value="longest">${this._localize('editors.gradient_interp_longest')}</mwc-list-item>
            <mwc-list-item value="rgb">${this._localize('editors.gradient_interp_rgb')}</mwc-list-item>
          </ha-select>
        </label>
        ${this.gradientWave ? html`
          <label class="option-item">
            <span class="option-label">${this._localize('editors.gradient_wave_cycles_label')}</span>
            <ha-textfield
              type="number"
              class="option-number-input"
              min="1"
              max="5"
              .value=${String(this.gradientWaveCycles)}
              @change=${this._handleGradientWaveCyclesChange}
            ></ha-textfield>
          </label>
        ` : ''}
      </div>
      <div class="generated-actions">
        <ha-button @click=${this._applyToGrid}>
          <ha-icon icon="mdi:grid"></ha-icon>
          ${this._localize('editors.apply_to_grid_button')}
        </ha-button>
        <ha-button
          @click=${this._applyToSelectedSegments}
          .disabled=${this._selectedSegments.size === 0}
        >
          <ha-icon icon="mdi:selection"></ha-icon>
          ${this._localize('editors.apply_to_selected_button')}
        </ha-button>
      </div>
    `;
  }

  private _renderBlocksMode(): TemplateResult {
    return html`
      <div class="mode-description">
        ${this._localize('editors.blocks_mode_description')}
      </div>
      <div class="color-array">
        ${this.blockColors.map((color, index) => html`
          <div class="color-item">
            <div
              class="color-swatch"
              role="button"
              tabindex="0"
              style="background-color: ${xyToHex(color)}"
              @click=${() => this._openColorPicker('blocks', index)}
              @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._openColorPicker('blocks', index); } }}
              aria-label="${this._localize('editors.color_label') || 'Color'} ${index + 1}: ${xyToHex(color)}"
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
          <ha-switch
            .checked=${this.expandBlocks}
            @change=${this._handleExpandBlocksChange}
          ></ha-switch>
          <span class="option-label">${this._localize('editors.expand_blocks_label')}</span>
        </label>
      </div>
      <div class="generated-actions">
        <ha-button @click=${this._applyToGrid}>
          <ha-icon icon="mdi:grid"></ha-icon>
          ${this._localize('editors.apply_to_grid_button')}
        </ha-button>
        <ha-button
          @click=${this._applyToSelectedSegments}
          .disabled=${this._selectedSegments.size === 0}
        >
          <ha-icon icon="mdi:selection"></ha-icon>
          ${this._localize('editors.apply_to_selected_button')}
        </ha-button>
      </div>
    `;
  }

  private _renderColorPickerModal(): TemplateResult | string {
    if (this._editingColorSource === null || this._editingColor === null) {
      return '';
    }

    // Convert HS -> XY -> RGB to show accurate color that will be sent to device
    const xyColor = hsToXy(this._editingColor);
    const accurateRgb = xyToRgb(xyColor.x, xyColor.y, 255);
    const accurateHex = rgbToHex(accurateRgb);

    return html`
      <ha-dialog
        open
        @closed=${this._closeColorPicker}
      >
        <div class="color-picker-modal-header">
          <span class="color-picker-modal-title">${this._localize('editors.color_picker_title')}</span>
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
              .value=${String(accurateRgb.r)}
              @input=${(e: Event) => this._handleRgbInput(e, 'r')}
            />
          </label>
          <label class="rgb-input-label">
            <span class="rgb-input-channel">G</span>
            <input
              type="number"
              class="rgb-input-field"
              min="0"
              max="255"
              .value=${String(accurateRgb.g)}
              @input=${(e: Event) => this._handleRgbInput(e, 'g')}
            />
          </label>
          <label class="rgb-input-label">
            <span class="rgb-input-channel">B</span>
            <input
              type="number"
              class="rgb-input-field"
              min="0"
              max="255"
              .value=${String(accurateRgb.b)}
              @input=${(e: Event) => this._handleRgbInput(e, 'b')}
            />
          </label>
        </div>
        <color-history-swatches
          .colorHistory=${this.colorHistory}
          .translations=${this.translations}
          @color-selected=${this._handleHistoryColorSelected}
        ></color-history-swatches>
        <ha-button slot="secondaryAction" @click=${this._closeColorPicker}>
          ${this._localize('editors.cancel_button')}
        </ha-button>
        <ha-button slot="primaryAction" @click=${this._confirmColorPicker}>
          <ha-icon icon="mdi:check"></ha-icon>
          ${this._localize('editors.apply_button')}
        </ha-button>
      </ha-dialog>
    `;
  }

  private _renderColorWheel(): TemplateResult {
    const size = 220;
    const wheelId = 'color-wheel-canvas';
    const markerId = 'color-wheel-marker';

    if (!this._editingColor) {
      return html``;
    }

    // Convert HS -> XY -> RGB for accurate color preview
    const xyColor = hsToXy(this._editingColor);
    const rgb = xyToRgb(xyColor.x, xyColor.y, 255);
    const accurateHex = rgbToHex(rgb);

    // Calculate initial marker position
    const { x, y } = this._hsToWheelPosition(this._editingColor, size);

    // Schedule canvas drawing and marker positioning after render
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
          @mousedown=${(e: MouseEvent) => this._onWheelPointerDown(e, wheelId, markerId, size)}
          @touchstart=${(e: TouchEvent) => this._onWheelPointerDown(e, wheelId, markerId, size)}
        ></canvas>
        <div
          id="${markerId}"
          style="position: absolute; left: ${x}px; top: ${y}px; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0, 0, 0, 0.5), inset 0 0 2px rgba(0, 0, 0, 0.3); pointer-events: none; transform: translate(-50%, -50%); transition: box-shadow 0.1s ease; background-color: ${accurateHex};"
        ></div>
      </div>
    `;
  }

  private _drawColorWheel(canvasId: string, size: number): void {
    const canvas = this.shadowRoot?.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    canvas.width = size;
    canvas.height = size;

    // Draw the color wheel using HSL gradients
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = ((angle - 1) * Math.PI) / 180;
      const endAngle = ((angle + 1) * Math.PI) / 180;

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

  private _updateMarkerPosition(_canvasId: string, markerId: string, size: number): void {
    const marker = this.shadowRoot?.getElementById(markerId) as HTMLElement;
    if (!marker || !this._editingColor) return;

    const { x, y } = this._hsToWheelPosition(this._editingColor, size);

    // Convert HS -> XY -> RGB for accurate color preview
    const xyColor = hsToXy(this._editingColor);
    const rgb = xyToRgb(xyColor.x, xyColor.y, 255);
    const accurateHex = rgbToHex(rgb);

    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
    marker.style.backgroundColor = accurateHex;
  }

  private _hsToWheelPosition(hs: HSColor, size: number): { x: number; y: number } {
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

  private _wheelPositionToHs(x: number, y: number, size: number): HSColor {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    const dx = x - centerX;
    const dy = y - centerY;

    // Calculate distance from center (saturation)
    let distance = Math.sqrt(dx * dx + dy * dy);
    distance = Math.min(distance, radius); // Clamp to wheel edge

    // Calculate angle (hue)
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    // Calculate saturation percentage
    let saturation = Math.round((distance / radius) * 100);

    // Snap to 100% saturation if very close to edge
    if (saturation >= 98) {
      saturation = 100;
    }

    return {
      h: Math.round(angle) % 360,
      s: saturation,
    };
  }

  private _onWheelPointerDown(e: MouseEvent | TouchEvent, canvasId: string, markerId: string, size: number): void {
    e.preventDefault();
    this._wheelIsDragging = true;
    this._wheelCanvasId = canvasId;
    this._wheelMarkerId = markerId;
    this._wheelSize = size;

    const marker = this.shadowRoot?.getElementById(markerId) as HTMLElement;
    if (marker) {
      marker.style.boxShadow = '0 0 8px rgba(0, 0, 0, 0.7), inset 0 0 2px rgba(0, 0, 0, 0.3)';
    }

    this._handleWheelInteraction(e, canvasId, markerId, size);

    if (e instanceof MouseEvent) {
      this._wheelPointerMoveBound = (evt: MouseEvent | TouchEvent) => this._onWheelPointerMove(evt);
      this._wheelPointerUpBound = () => this._onWheelPointerUp();
      window.addEventListener('mousemove', this._wheelPointerMoveBound as EventListener);
      window.addEventListener('mouseup', this._wheelPointerUpBound);
    } else {
      this._wheelPointerMoveBound = (evt: MouseEvent | TouchEvent) => this._onWheelPointerMove(evt);
      this._wheelPointerUpBound = () => this._onWheelPointerUp();
      window.addEventListener('touchmove', this._wheelPointerMoveBound as EventListener, { passive: false });
      window.addEventListener('touchend', this._wheelPointerUpBound);
    }
  }

  private _onWheelPointerMove(e: MouseEvent | TouchEvent): void {
    if (!this._wheelIsDragging || !this._wheelCanvasId || !this._wheelMarkerId) return;
    e.preventDefault();
    this._handleWheelInteraction(e, this._wheelCanvasId, this._wheelMarkerId, this._wheelSize);
  }

  private _onWheelPointerUp(): void {
    this._wheelIsDragging = false;

    const marker = this._wheelMarkerId ? this.shadowRoot?.getElementById(this._wheelMarkerId) as HTMLElement : null;
    if (marker) {
      marker.style.boxShadow = '0 0 4px rgba(0, 0, 0, 0.5), inset 0 0 2px rgba(0, 0, 0, 0.3)';
    }

    if (this._wheelPointerMoveBound) {
      window.removeEventListener('mousemove', this._wheelPointerMoveBound as EventListener);
      window.removeEventListener('touchmove', this._wheelPointerMoveBound as EventListener);
      this._wheelPointerMoveBound = null;
    }
    if (this._wheelPointerUpBound) {
      window.removeEventListener('mouseup', this._wheelPointerUpBound);
      window.removeEventListener('touchend', this._wheelPointerUpBound);
      this._wheelPointerUpBound = null;
    }
  }

  private _handleWheelInteraction(e: MouseEvent | TouchEvent, canvasId: string, markerId: string, size: number): void {
    const canvas = this.shadowRoot?.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
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

    // Update marker position immediately
    this._updateMarkerPosition(canvasId, markerId, size);

    // Update the preview in modal header
    const preview = this.shadowRoot?.querySelector('.color-picker-modal-preview') as HTMLElement;
    if (preview) {
      const xyColor = hsToXy(this._editingColor);
      const rgb = xyToRgb(xyColor.x, xyColor.y, 255);
      const hex = rgbToHex(rgb);
      preview.style.backgroundColor = hex;
    }

    // Update RGB input values
    const rgbInputs = this.shadowRoot?.querySelectorAll('.rgb-input-field') as NodeListOf<HTMLInputElement> | undefined;
    if (rgbInputs && rgbInputs.length === 3) {
      const xyColor = hsToXy(this._editingColor);
      const rgb = xyToRgb(xyColor.x, xyColor.y, 255);
      const rInput = rgbInputs[0];
      const gInput = rgbInputs[1];
      const bInput = rgbInputs[2];
      if (rInput) rInput.value = String(rgb.r);
      if (gInput) gInput.value = String(rgb.g);
      if (bInput) bInput.value = String(rgb.b);
    }
  }

  protected render(): TemplateResult {
    return html`
      <div class="segment-selector">
        ${this.label ? html`<span class="label">${this.label}</span>` : ''}
        ${this._renderGrid()}
        ${this._renderColorPalette()}
        ${this.description ? html`<span class="description">${this.description}</span>` : ''}
        ${this._renderColorPickerModal()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'segment-selector': SegmentSelector;
  }
}
