import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, RGBColor, XYColor, HSColor, SegmentColorEntry, UserSegmentPatternPreset } from './types';
import { xyToHex, xyToRgb, rgbToXy, xyToHs, hsToXy } from './color-utils';
import { colorPickerStyles } from './styles';
import './hs-color-picker';

// Segment counts per device type
const SEGMENT_COUNTS: Record<string, number> = {
  t1: 20,
  t1m: 26,
  t1_strip: 50, // 10 meters x 5 segments per meter (max)
};

const DEVICE_LABELS: Record<string, string> = {
  t1: 'T1 (20 segments)',
  t1m: 'T1M (26 segments)',
  t1_strip: 'T1 Strip (up to 50 segments)',
};

// Default palette colors in XY space
const DEFAULT_PALETTE: XYColor[] = [
  { x: 0.68, y: 0.31 },    // Red
  { x: 0.17, y: 0.70 },    // Green
  { x: 0.15, y: 0.06 },    // Blue
  { x: 0.42, y: 0.51 },    // Yellow
  { x: 0.38, y: 0.16 },    // Magenta
  { x: 0.22, y: 0.33 },    // Cyan
];

type PatternMode = 'individual' | 'gradient' | 'blocks';

@customElement('pattern-editor')
export class PatternEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Object }) public preset?: UserSegmentPatternPreset;
  @property({ type: Object }) public translations: Record<string, any> = {};
  @property({ type: Boolean }) public editMode = false;
  @property({ type: Boolean }) public hasSelectedEntities = false;
  @property({ type: Boolean }) public isCompatible = true;
  @property({ type: Number }) public stripSegmentCount = 50;

  @state() private _name = '';
  @state() private _icon = '';
  @state() private _deviceType = 't1m';
  @state() private _segments: Map<number, XYColor> = new Map();
  @state() private _selectedSegments: Set<number> = new Set();
  @state() private _saving = false;
  @state() private _previewing = false;

  // Clear mode for mobile-friendly clearing (instead of right-click)
  @state() private _clearMode = false;
  // Select mode for mobile-friendly multi-select (instead of ctrl/shift-click)
  @state() private _selectMode = false;

  // Pattern mode state
  @state() private _patternMode: PatternMode = 'individual';

  // Color palette for Individual mode (6 colors)
  @state() private _colorPalette: XYColor[] = [...DEFAULT_PALETTE];
  @state() private _selectedPaletteIndex = 0;

  // Gradient colors (2-6) in XY space
  @state() private _gradientColors: XYColor[] = [
    { x: 0.68, y: 0.31 },  // Red
    { x: 0.15, y: 0.06 },  // Blue
  ];

  // Block colors (1-6) in XY space
  @state() private _blockColors: XYColor[] = [
    { x: 0.68, y: 0.31 },  // Red
    { x: 0.17, y: 0.70 },  // Green
  ];
  @state() private _expandBlocks = false;

  // Color picker modal state
  @state() private _editingColorSource: 'palette' | 'gradient' | 'blocks' | null = null;
  @state() private _editingColorIndex: number | null = null;
  @state() private _editingColor: HSColor | null = null;

  static styles = [
    colorPickerStyles,
    css`
    :host {
      display: block;
    }

    .editor-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .form-row-pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row-triple {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row-pair .form-field,
    .form-row-triple .form-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .form-section .form-label {
      min-width: unset;
    }

    .form-label {
      font-size: 14px;
      font-weight: 500;
      min-width: 120px;
      color: var(--secondary-text-color);
    }

    .form-input {
      flex: 1;
    }

    .segment-grid-container {
      background: var(--card-background-color);
      border-radius: 8px;
      padding: 16px;
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
    }

    .segment-cell:hover {
      transform: scale(1.1);
      z-index: 1;
    }

    .segment-cell.selected {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px var(--primary-color);
    }

    .segment-cell.colored {
      border-color: transparent;
      color: transparent;
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

    .grid-controls {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      padding-top: 8px;
      border-top: 1px solid var(--divider-color);
    }

    .grid-info {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin-top: 8px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--divider-color);
    }

    .preview-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
      border: 1px solid var(--divider-color);
      border-left: 4px solid var(--warning-color, #ffc107);
      border-radius: 4px;
      font-size: 13px;
    }

    .preview-warning ha-icon {
      flex-shrink: 0;
      --mdc-icon-size: 18px;
    }

    /* Sub-tabs for pattern modes */
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

    /* Color picker, palette, color-array, color-item, color-swatch,
       color-picker-modal, color-remove, add-color-btn styles
       are inherited from panelStyles (styles.ts) */

    .palette-label {
      font-size: 13px;
      color: var(--secondary-text-color);
      margin-right: 8px;
    }

    /* Use color-picker-grid as alias for color-array in gradient/blocks modes */
    .color-array {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    /* Options row */
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
    }

    .option-label {
      font-size: 13px;
      color: var(--secondary-text-color);
    }

    /* Mode description */
    .mode-description {
      font-size: 13px;
      color: var(--secondary-text-color);
      margin-bottom: 16px;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      border-radius: 4px;
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

    /* Generated pattern actions */
    .generated-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    /* Mode content container */
    .mode-content {
      background: var(--card-background-color);
      border-radius: 8px;
      padding: 16px;
    }

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        align-items: stretch;
      }

      .form-row-pair,
      .form-row-triple {
        grid-template-columns: 1fr;
      }

      .form-label {
        min-width: unset;
        margin-bottom: 4px;
      }

      .grid-controls {
        flex-direction: column;
      }

      .mode-tabs {
        overflow-x: auto;
      }

      .color-palette {
        justify-content: center;
      }
    }
  `];

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    if (changedProps.has('preset') && this.preset) {
      this._loadPreset(this.preset);
    }

    // When stripSegmentCount changes and device type is t1_strip, clean up segments beyond the new count
    if (changedProps.has('stripSegmentCount') && this._deviceType === 't1_strip') {
      const maxSegments = this._getMaxSegments();
      let needsUpdate = false;
      const newSegments = new Map<number, XYColor>();
      for (const [seg, color] of this._segments) {
        if (seg < maxSegments) {
          newSegments.set(seg, color);
        } else {
          needsUpdate = true;
        }
      }
      if (needsUpdate) {
        this._segments = newSegments;
        // Also clear selected segments that are beyond the new count
        const newSelection = new Set<number>();
        for (const seg of this._selectedSegments) {
          if (seg < maxSegments) {
            newSelection.add(seg);
          }
        }
        this._selectedSegments = newSelection;
      }
    }
  }

  private _getMaxSegments(): number {
    if (this._deviceType === 't1_strip') {
      return this.stripSegmentCount;
    }
    return SEGMENT_COUNTS[this._deviceType] || 26;
  }

  private _loadPreset(preset: UserSegmentPatternPreset): void {
    this._name = preset.name;
    this._icon = preset.icon || '';
    this._deviceType = preset.device_type || 't1m';
    this._segments = new Map();
    this._selectedSegments = new Set();
    this._patternMode = 'individual';
    this._clearMode = false;

    for (const entry of preset.segments) {
      // Convert from 1-based backend indexing to 0-based internal indexing
      const segNum = typeof entry.segment === 'string' ? parseInt(entry.segment, 10) : entry.segment;
      // Handle both XY (new) and RGB (legacy) color formats
      const color = entry.color as XYColor | RGBColor;
      if ('x' in color && 'y' in color) {
        // Already XY format
        this._segments.set(segNum - 1, { x: color.x, y: color.y });
      } else if ('r' in color && 'g' in color && 'b' in color) {
        // Legacy RGB format - convert to XY
        this._segments.set(segNum - 1, rgbToXy(color.r, color.g, color.b));
      }
    }
  }

  private _handleNameChange(e: CustomEvent): void {
    this._name = e.detail.value || '';
  }

  private _handleIconChange(e: CustomEvent): void {
    this._icon = e.detail.value || '';
  }

  private _handleDeviceTypeChange(e: CustomEvent): void {
    this._deviceType = e.detail.value || 't1m';
    // Clear segments that exceed new device segment count
    const maxSegments = this._getMaxSegments();
    const newSegments = new Map<number, XYColor>();
    for (const [seg, color] of this._segments) {
      if (seg < maxSegments) {
        newSegments.set(seg, color);
      }
    }
    this._segments = newSegments;
    this._selectedSegments = new Set();
  }

  private _handlePatternModeChange(mode: PatternMode): void {
    this._patternMode = mode;
    this._clearMode = false; // Reset clear mode when switching tabs
    this._selectMode = false; // Reset select mode when switching tabs
  }

  private _toggleClearMode(): void {
    this._clearMode = !this._clearMode;
    if (this._clearMode) {
      this._selectMode = false; // Disable select mode when enabling clear mode
    }
  }

  private _toggleSelectMode(): void {
    this._selectMode = !this._selectMode;
    if (this._selectMode) {
      this._clearMode = false; // Disable clear mode when enabling select mode
    }
  }

  private _handleSegmentClick(segNum: number, e: MouseEvent): void {
    // Clear mode: clicking clears the segment
    if (this._clearMode) {
      const newSegments = new Map(this._segments);
      newSegments.delete(segNum);
      this._segments = newSegments;
      return;
    }

    // Select mode or shift-click: toggle selection
    if (this._selectMode || e.shiftKey) {
      const newSelection = new Set(this._selectedSegments);
      if (newSelection.has(segNum)) {
        newSelection.delete(segNum);
      } else {
        newSelection.add(segNum);
      }
      this._selectedSegments = newSelection;
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl-click: add to selection
      this._selectedSegments = new Set([...this._selectedSegments, segNum]);
    } else {
      // Regular click: apply current palette color
      const currentColor = this._colorPalette[this._selectedPaletteIndex]!;
      const newSegments = new Map(this._segments);
      newSegments.set(segNum, { ...currentColor });
      this._segments = newSegments;
    }
  }

  // Palette color handlers
  private _selectPaletteColor(index: number): void {
    this._selectedPaletteIndex = index;
  }

  private _addGradientColor(): void {
    if (this._gradientColors.length >= 6) return;
    // Add yellow in XY space
    this._gradientColors = [...this._gradientColors, { x: 0.42, y: 0.51 }];
  }

  private _removeGradientColor(index: number): void {
    if (this._gradientColors.length <= 2) return;
    this._gradientColors = this._gradientColors.filter((_, i) => i !== index);
  }

  private _addBlockColor(): void {
    if (this._blockColors.length >= 6) return;
    // Add cyan in XY space
    this._blockColors = [...this._blockColors, { x: 0.22, y: 0.33 }];
  }

  private _removeBlockColor(index: number): void {
    if (this._blockColors.length <= 1) return;
    this._blockColors = this._blockColors.filter((_, i) => i !== index);
  }

  private _handleExpandBlocksChange(e: Event): void {
    const checkbox = e.target as HTMLInputElement;
    this._expandBlocks = checkbox.checked;
  }

  private _applyToSelected(): void {
    if (this._selectedSegments.size === 0) return;

    const currentColor = this._colorPalette[this._selectedPaletteIndex]!;
    const newSegments = new Map(this._segments);
    for (const seg of this._selectedSegments) {
      newSegments.set(seg, { ...currentColor });
    }
    this._segments = newSegments;
    this._selectedSegments = new Set();
  }

  private _clearSelected(): void {
    if (this._selectedSegments.size === 0) return;

    const newSegments = new Map(this._segments);
    for (const seg of this._selectedSegments) {
      newSegments.delete(seg);
    }
    this._segments = newSegments;
    this._selectedSegments = new Set();
  }

  private _selectAll(): void {
    const maxSegments = this._getMaxSegments();
    const newSelection = new Set<number>();
    for (let i = 0; i < maxSegments; i++) {
      newSelection.add(i);
    }
    this._selectedSegments = newSelection;
  }

  private _clearAll(): void {
    this._segments = new Map();
    this._selectedSegments = new Set();
  }

  // Interpolate hue values, taking the shortest path around the color wheel
  private _interpolateHue(h1: number, h2: number, t: number): number {
    // Calculate the difference
    let diff = h2 - h1;

    // Take the shortest path around the wheel
    if (diff > 180) {
      diff -= 360;
    } else if (diff < -180) {
      diff += 360;
    }

    let result = h1 + diff * t;

    // Normalize to 0-360 range
    if (result < 0) result += 360;
    if (result >= 360) result -= 360;

    return result;
  }

  // Generate gradient pattern - interpolates colors across all segments in HS space
  private _generateGradientPattern(): Map<number, XYColor> {
    const maxSegments = this._getMaxSegments();
    const colors = this._gradientColors;
    const numColors = colors.length;
    const pattern = new Map<number, XYColor>();

    if (numColors < 2 || maxSegments === 0) return pattern;

    // Convert all gradient colors to HS space for interpolation
    const hsColors = colors.map(c => xyToHs(c));

    for (let i = 0; i < maxSegments; i++) {
      // Calculate position in the gradient (0 to 1)
      const t = i / (maxSegments - 1);
      // Map to color index
      const colorPosition = t * (numColors - 1);
      const colorIndex = Math.floor(colorPosition);
      const colorT = colorPosition - colorIndex;

      // Get the two colors to interpolate between
      const c1 = hsColors[Math.min(colorIndex, numColors - 1)]!;
      const c2 = hsColors[Math.min(colorIndex + 1, numColors - 1)]!;

      // Interpolate in HS space (hue uses shortest path)
      const interpolatedHS: HSColor = {
        h: Math.round(this._interpolateHue(c1.h, c2.h, colorT)),
        s: Math.round(c1.s + (c2.s - c1.s) * colorT),
      };

      // Convert back to XY for storage
      pattern.set(i, hsToXy(interpolatedHS));
    }

    return pattern;
  }

  // Generate blocks pattern - evenly distributes color blocks across segments
  private _generateBlocksPattern(): Map<number, XYColor> {
    const maxSegments = this._getMaxSegments();
    const colors = this._blockColors;
    const numColors = colors.length;
    const pattern = new Map<number, XYColor>();

    if (numColors === 0 || maxSegments === 0) return pattern;

    if (this._expandBlocks) {
      // Expand: each color fills an equal portion of the strip
      const segmentsPerColor = maxSegments / numColors;
      for (let i = 0; i < maxSegments; i++) {
        const colorIndex = Math.min(Math.floor(i / segmentsPerColor), numColors - 1);
        pattern.set(i, { ...colors[colorIndex]! });
      }
    } else {
      // No expand: colors repeat in sequence
      for (let i = 0; i < maxSegments; i++) {
        const colorIndex = i % numColors;
        pattern.set(i, { ...colors[colorIndex]! });
      }
    }

    return pattern;
  }

  // Apply generated pattern to the grid (stays on current tab)
  private _applyToGrid(): void {
    let generatedPattern: Map<number, XYColor>;

    if (this._patternMode === 'gradient') {
      generatedPattern = this._generateGradientPattern();
    } else if (this._patternMode === 'blocks') {
      generatedPattern = this._generateBlocksPattern();
    } else {
      return;
    }

    this._segments = generatedPattern;
    // Don't switch tabs - user can see the grid update and continue editing
  }

  // Apply generated pattern only to selected segments
  private _applyToSelectedSegments(): void {
    if (this._selectedSegments.size === 0) return;

    // Get selected segments as sorted array
    const selectedArray = Array.from(this._selectedSegments).sort((a, b) => a - b);
    const selectedCount = selectedArray.length;

    let colors: XYColor[] = [];
    if (this._patternMode === 'gradient') {
      colors = this._gradientColors;
    } else if (this._patternMode === 'blocks') {
      colors = this._blockColors;
    } else {
      return;
    }

    const numColors = colors.length;
    const newSegments = new Map(this._segments);

    if (this._patternMode === 'gradient') {
      // Generate gradient across selected segments in HS space
      const hsColors = colors.map(c => xyToHs(c));

      for (let i = 0; i < selectedCount; i++) {
        const segNum = selectedArray[i]!;
        const t = selectedCount > 1 ? i / (selectedCount - 1) : 0;
        const colorPosition = t * (numColors - 1);
        const colorIndex = Math.floor(colorPosition);
        const colorT = colorPosition - colorIndex;

        const c1 = hsColors[Math.min(colorIndex, numColors - 1)]!;
        const c2 = hsColors[Math.min(colorIndex + 1, numColors - 1)]!;

        // Interpolate in HS space (hue uses shortest path)
        const interpolatedHS: HSColor = {
          h: Math.round(this._interpolateHue(c1.h, c2.h, colorT)),
          s: Math.round(c1.s + (c2.s - c1.s) * colorT),
        };

        newSegments.set(segNum, hsToXy(interpolatedHS));
      }
    } else if (this._patternMode === 'blocks') {
      // Generate blocks across selected segments
      if (this._expandBlocks) {
        const blockSize = Math.ceil(selectedCount / numColors);
        for (let i = 0; i < selectedCount; i++) {
          const segNum = selectedArray[i]!;
          const colorIndex = Math.min(Math.floor(i / blockSize), numColors - 1);
          newSegments.set(segNum, { ...colors[colorIndex]! });
        }
      } else {
        for (let i = 0; i < selectedCount; i++) {
          const segNum = selectedArray[i]!;
          const colorIndex = i % numColors;
          newSegments.set(segNum, { ...colors[colorIndex]! });
        }
      }
    }

    this._segments = newSegments;
    this._selectedSegments = new Set(); // Clear selection after applying
  }

  // Open color picker for a palette color
  private _openPaletteColorPicker(index: number): void {
    const xyColor = this._colorPalette[index];
    if (!xyColor) return;
    this._editingColorSource = 'palette';
    this._editingColorIndex = index;
    this._editingColor = xyToHs(xyColor);
  }

  // Open color picker for a gradient color
  private _openGradientColorPicker(index: number): void {
    const xyColor = this._gradientColors[index];
    if (!xyColor) return;
    this._editingColorSource = 'gradient';
    this._editingColorIndex = index;
    this._editingColor = xyToHs(xyColor);
  }

  // Open color picker for a block color
  private _openBlockColorPicker(index: number): void {
    const xyColor = this._blockColors[index];
    if (!xyColor) return;
    this._editingColorSource = 'blocks';
    this._editingColorIndex = index;
    this._editingColor = xyToHs(xyColor);
  }

  private _handleColorPickerChange(e: CustomEvent): void {
    this._editingColor = e.detail.color;
  }

  private _confirmColorPicker(): void {
    if (this._editingColorIndex === null || this._editingColor === null || !this._editingColorSource) {
      this._closeColorPicker();
      return;
    }

    const xyColor = hsToXy(this._editingColor);

    if (this._editingColorSource === 'palette') {
      this._colorPalette = this._colorPalette.map((c, i) =>
        i === this._editingColorIndex ? xyColor : c
      );
    } else if (this._editingColorSource === 'gradient') {
      this._gradientColors = this._gradientColors.map((c, i) =>
        i === this._editingColorIndex ? xyColor : c
      );
    } else if (this._editingColorSource === 'blocks') {
      this._blockColors = this._blockColors.map((c, i) =>
        i === this._editingColorIndex ? xyColor : c
      );
    }

    this._closeColorPicker();
  }

  private _closeColorPicker(): void {
    this._editingColorSource = null;
    this._editingColorIndex = null;
    this._editingColor = null;
  }


  // Get the current pattern data (always returns what's in the grid)
  private _getCurrentPattern(): Map<number, XYColor> {
    // Always return the segments grid - this is what's displayed and should be previewed/saved
    return this._segments;
  }

  // Convert XY color to hex for display
  private _colorToHex(color: XYColor): string {
    return xyToHex(color, 255);
  }

  private _getPresetData(): Record<string, unknown> {
    const pattern = this._getCurrentPattern();
    const segments: SegmentColorEntry[] = [];
    for (const [segment, xyColor] of pattern) {
      // Convert from 0-based internal indexing to 1-based backend indexing
      // Convert XY to RGB for backend (segment patterns need RGB for MQTT)
      const rgb = xyToRgb(xyColor.x, xyColor.y, 255);
      segments.push({ segment: segment + 1, color: { r: rgb.r, g: rgb.g, b: rgb.b } });
    }

    return {
      name: this._name,
      icon: this._icon || undefined,
      device_type: this._deviceType,
      segments,
    };
  }

  private async _preview(): Promise<void> {
    if (!this.hass || this._previewing) return;

    const pattern = this._getCurrentPattern();
    if (pattern.size === 0) return;

    this._previewing = true;
    try {
      // All modes now use the same preview event with generated pattern data
      this.dispatchEvent(
        new CustomEvent('preview', {
          detail: this._getPresetData(),
          bubbles: true,
          composed: true,
        })
      );
    } finally {
      this._previewing = false;
    }
  }

  private async _save(): Promise<void> {
    if (!this._name.trim()) return;

    const pattern = this._getCurrentPattern();
    if (pattern.size === 0) return;

    this._saving = true;
    try {
      this.dispatchEvent(
        new CustomEvent('save', {
          detail: this._getPresetData(),
          bubbles: true,
          composed: true,
        })
      );
    } finally {
      this._saving = false;
    }
  }

  private _cancel(): void {
    this.dispatchEvent(
      new CustomEvent('cancel', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private _canPreview(): boolean {
    const pattern = this._getCurrentPattern();
    return pattern.size > 0;
  }

  private _canSave(): boolean {
    if (!this._name.trim()) return false;
    const pattern = this._getCurrentPattern();
    return pattern.size > 0;
  }

  private _renderSegmentGrid() {
    const maxSegments = this._getMaxSegments();
    const segmentCells = [];

    for (let i = 0; i < maxSegments; i++) {
      const color = this._segments.get(i);
      const isSelected = this._selectedSegments.has(i);
      const isColored = color !== undefined;

      const segmentBaseKey = this._clearMode && isColored
        ? 'component.aqara_advanced_lighting.panel.tooltips.segment_clear'
        : 'component.aqara_advanced_lighting.panel.tooltips.segment_number';
      const segmentTitle = this.hass.localize(segmentBaseKey).replace('{number}', (i + 1).toString());

      segmentCells.push(html`
        <div
          class="segment-cell ${isSelected ? 'selected' : ''} ${isColored ? 'colored' : ''}"
          style="${isColored ? `background-color: ${this._colorToHex(color)}` : ''}"
          @click=${(e: MouseEvent) => this._handleSegmentClick(i, e)}
          title="${segmentTitle}"
        >
          ${i + 1}
        </div>
      `);
    }

    return html`
      <div class="segment-grid-container">
        <div class="segment-grid ${this._clearMode ? 'clear-mode' : ''} ${this._selectMode ? 'select-mode' : ''}">
          ${segmentCells}
        </div>
        <div class="grid-controls">
          <ha-button
            class="${this._selectMode ? 'select-mode-toggle active' : 'select-mode-toggle'}"
            @click=${this._toggleSelectMode}
            title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.mode_select')}"
          >
            <ha-icon icon="${this._selectMode ? 'mdi:selection-multiple' : 'mdi:selection'}"></ha-icon>
            ${this._selectMode ? this._localize('editors.select_mode_on') : this._localize('editors.select_mode_off')}
          </ha-button>
          <ha-button
            class="${this._clearMode ? 'clear-mode-toggle active' : 'clear-mode-toggle'}"
            @click=${this._toggleClearMode}
            title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.mode_clear')}"
          >
            <ha-icon icon="${this._clearMode ? 'mdi:eraser' : 'mdi:eraser-variant'}"></ha-icon>
            ${this._clearMode ? this._localize('editors.clear_mode_on') : this._localize('editors.clear_mode_off')}
          </ha-button>
          <ha-button @click=${this._selectAll}>${this._localize('editors.select_all_button')}</ha-button>
          <ha-button
            @click=${this._clearSelected}
            .disabled=${this._selectedSegments.size === 0}
          >
            ${this._localize('editors.clear_selected_button')}
          </ha-button>
          <ha-button @click=${this._clearAll}>${this._localize('editors.clear_all_button')}</ha-button>
        </div>
        <div class="grid-info">
          ${this._localize('editors.segments_selected', { count: this._selectedSegments.size.toString() })}
        </div>
      </div>
    `;
  }

  private _renderIndividualMode() {
    return html`
      <div class="mode-description">
        Click a color to select it, click the pencil to change it. Then click segments to apply.
      </div>
      <div class="color-palette">
        <span class="palette-label">Colors:</span>
        ${this._colorPalette.map((color, index) => html`
          <div class="palette-color-wrapper">
            <div
              class="palette-color ${this._selectedPaletteIndex === index ? 'selected' : ''}"
              style="background-color: ${this._colorToHex(color)}"
              @click=${() => this._selectPaletteColor(index)}
              title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.color_select').replace('{index}', (index + 1).toString())}"
            ></div>
            <button
              class="palette-edit-btn"
              @click=${() => this._openPaletteColorPicker(index)}
              title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.color_edit_index').replace('{index}', (index + 1).toString())}"
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
          ${this._localize('editors.apply_to_selected_button')}
        </ha-button>
      </div>
    `;
  }

  private _renderGradientMode() {
    return html`
      <div class="mode-description">
        Create a smooth color gradient across all segments. Add 2-6 colors to blend.
      </div>
      <div class="color-array">
        ${this._gradientColors.map((color, index) => html`
          <div class="color-item">
            <div
              class="color-swatch"
              style="background-color: ${this._colorToHex(color)}"
              @click=${() => this._openGradientColorPicker(index)}
              title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.color_edit')}"
            ></div>
            ${this._gradientColors.length > 2
              ? html`
                  <ha-icon-button
                    class="color-remove"
                    @click=${() => this._removeGradientColor(index)}
                  >
                    <ha-icon icon="mdi:close"></ha-icon>
                  </ha-icon-button>
                `
              : ''}
          </div>
        `)}
        ${this._gradientColors.length < 6
          ? html`
              <div
                class="add-color-btn"
                @click=${this._addGradientColor}
                title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.color_add')}"
              >
                <ha-icon icon="mdi:plus"></ha-icon>
              </div>
            `
          : ''}
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

  private _renderBlocksMode() {
    return html`
      <div class="mode-description">
        Create evenly spaced blocks of color across all segments. Add 1-6 colors.
      </div>
      <div class="color-array">
        ${this._blockColors.map((color, index) => html`
          <div class="color-item">
            <div
              class="color-swatch"
              style="background-color: ${this._colorToHex(color)}"
              @click=${() => this._openBlockColorPicker(index)}
              title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.color_edit')}"
            ></div>
            ${this._blockColors.length > 1
              ? html`
                  <ha-icon-button
                    class="color-remove"
                    @click=${() => this._removeBlockColor(index)}
                  >
                    <ha-icon icon="mdi:close"></ha-icon>
                  </ha-icon-button>
                `
              : ''}
          </div>
        `)}
        ${this._blockColors.length < 6
          ? html`
              <div
                class="add-color-btn"
                @click=${this._addBlockColor}
                title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.color_add')}"
              >
                <ha-icon icon="mdi:plus"></ha-icon>
              </div>
            `
          : ''}
      </div>
      <div class="options-row">
        <label class="option-item">
          <input
            type="checkbox"
            .checked=${this._expandBlocks}
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

  private _localize(key: string, replacements?: Record<string, string>): string {
    const keys = key.split('.');
    let value: any = this.translations;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    let result = typeof value === 'string' ? value : key;

    // Replace placeholders if provided
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, replacement]) => {
        result = result.replace(`{${placeholder}}`, replacement);
      });
    }

    return result;
  }

  protected render() {
    // Create device options with dynamic T1 Strip label based on detected segment count
    const deviceOptions = Object.entries(DEVICE_LABELS).map(([value, label]) => ({
      value,
      label: value === 't1_strip' ? `T1 Strip (${this.stripSegmentCount} segments)` : label,
    }));

    return html`
      <div class="editor-content">
        <div class="form-row-triple">
          <div class="form-field">
            <span class="form-label">${this._localize('editors.name_label')}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ text: {} }}
              .value=${this._name}
              @value-changed=${this._handleNameChange}
            ></ha-selector>
          </div>
          <div class="form-field">
            <span class="form-label">${this._localize('editors.icon_label')}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ icon: {} }}
              .value=${this._icon}
              @value-changed=${this._handleIconChange}
            ></ha-selector>
          </div>
          <div class="form-field">
            <span class="form-label">${this._localize('editors.device_type_label')}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                select: {
                  options: deviceOptions,
                  mode: 'dropdown',
                },
              }}
              .value=${this._deviceType}
              @value-changed=${this._handleDeviceTypeChange}
            ></ha-selector>
          </div>
        </div>

        <div class="form-section">
          <span class="form-label">${this._localize('editors.segment_grid_label')}</span>
          ${this._renderSegmentGrid()}
        </div>

        <div class="form-section">
          <span class="form-label">${this._localize('editors.pattern_mode_label')}</span>
          <div class="mode-content">
              <div class="mode-tabs">
                <button
                  class="mode-tab ${this._patternMode === 'individual' ? 'active' : ''}"
                  @click=${() => this._handlePatternModeChange('individual')}
                >
                  Individual
                </button>
                <button
                  class="mode-tab ${this._patternMode === 'gradient' ? 'active' : ''}"
                  @click=${() => this._handlePatternModeChange('gradient')}
                >
                  Gradient
                </button>
                <button
                  class="mode-tab ${this._patternMode === 'blocks' ? 'active' : ''}"
                  @click=${() => this._handlePatternModeChange('blocks')}
                >
                  Blocks
                </button>
              </div>

              ${this._patternMode === 'individual'
                ? this._renderIndividualMode()
                : this._patternMode === 'gradient'
                ? this._renderGradientMode()
                : this._renderBlocksMode()}
            </div>
        </div>

        ${!this.hasSelectedEntities
          ? html`
              <div class="preview-warning">
                <ha-icon icon="mdi:information"></ha-icon>
                <span>${this._localize('editors.select_lights_for_preview_patterns')}</span>
              </div>
            `
          : ''}

        <div class="form-actions">
          <ha-button @click=${this._cancel}>${this._localize('editors.cancel_button')}</ha-button>
          <ha-button
            @click=${this._preview}
            .disabled=${!this._canPreview() || this._previewing || !this.hasSelectedEntities || !this.isCompatible}
            title=${!this.hasSelectedEntities ? 'Select entities in Activate tab first' : !this.isCompatible ? 'Selected light is not compatible' : ''}
          >
            <ha-icon icon="mdi:play"></ha-icon>
            Preview
          </ha-button>
          <ha-button
            @click=${this._save}
            .disabled=${!this._canSave() || this._saving}
          >
            <ha-icon icon="mdi:content-save"></ha-icon>
            ${this.editMode ? 'Update' : 'Save'}
          </ha-button>
        </div>

        ${this._editingColorSource !== null && this._editingColor !== null
          ? html`
              <div class="color-picker-modal-overlay" @click=${this._closeColorPicker}>
                <div class="color-picker-modal" @click=${(e: Event) => e.stopPropagation()}>
                  <div class="color-picker-modal-header">
                    <span class="color-picker-modal-title">Select color</span>
                    <div
                      class="color-picker-modal-preview"
                      style="background-color: ${this._editingColor ? `hsl(${this._editingColor.h}, ${this._editingColor.s}%, 50%)` : '#fff'}"
                    ></div>
                  </div>
                  <hs-color-picker
                    .color=${this._editingColor}
                    .size=${220}
                    @color-changed=${this._handleColorPickerChange}
                  ></hs-color-picker>
                  <div class="color-picker-modal-actions">
                    <ha-button @click=${this._closeColorPicker}>${this._localize('editors.cancel_button')}</ha-button>
                    <ha-button @click=${this._confirmColorPicker}>
                      <ha-icon icon="mdi:check"></ha-icon>
                      Apply
                    </ha-button>
                  </div>
                </div>
              </div>
            `
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pattern-editor': PatternEditor;
  }
}
