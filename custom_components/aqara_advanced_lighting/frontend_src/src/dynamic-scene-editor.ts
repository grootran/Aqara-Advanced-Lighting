/**
 * Dynamic Scene Editor Component
 * Creates and edits dynamic scene presets with slow color transitions across lights.
 */

import { LitElement, html, css, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, XYColor, UserDynamicScenePreset, DynamicSceneEditorDraft, DynamicSceneColor, Translations } from './types';
import { xyToHex, getAnalogousColor } from './color-utils';
import { colorPickerStyles } from './styles';
import { addColorToHistory } from './color-history';
import { ReorderableStepsMixin, reorderableStepStyles, ReorderableStepItem } from './reorderable-steps-mixin';
import { editorFormStyles, localize } from './editor-constants';
import './xy-color-picker';
import './color-history-swatches';
import './image-color-extractor';
import { ColorsExtractedDetail } from './image-color-extractor';

// Editable color slot with unique ID for drag/drop
interface EditableColor extends DynamicSceneColor, ReorderableStepItem {}

@customElement('dynamic-scene-editor')
export class DynamicSceneEditor extends ReorderableStepsMixin(LitElement) {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Object }) public preset?: UserDynamicScenePreset;
  @property({ type: Object }) public translations: Translations = {};
  @property({ type: Boolean }) public editMode = false;
  @property({ type: Boolean }) public hasSelectedEntities = false;
  @property({ type: Boolean }) public isCompatible = true;
  @property({ type: Array }) public selectedEntities: string[] = [];
  @property({ type: Boolean }) public previewActive = false;
  @property({ type: Array }) public colorHistory: XYColor[] = [];
  @property({ type: Object }) public draft?: DynamicSceneEditorDraft;

  @state() private _name = '';
  @state() private _icon = '';
  // Note: _steps is used by ReorderableStepsMixin, but we also expose as _colors for clarity
  @state() protected _steps: EditableColor[] = [];
  @state() private _transitionTime = 600;  // seconds (default 10 minutes)
  @state() private _holdTime = 0;  // seconds
  @state() private _distributionMode = 'shuffle_rotate';
  @state() private _offsetDelay = 0;
  @state() private _randomOrder = false;
  @state() private _loopMode = 'continuous';
  @state() private _loopCount = 3;
  @state() private _endBehavior = 'restore';
  @state() private _saving = false;
  @state() private _previewing = false;
  @state() private _hasUserInteraction = false;
  @state() private _editingColorIndex: number | null = null;
  @state() private _editingColor: XYColor | null = null;
  @state() private _showExtractor = false;
  @state() private _extractorMode: 'upload' | 'url' = 'upload';
  @state() private _thumbnail?: string;

  // Alias for cleaner code
  private get _colors(): EditableColor[] {
    return this._steps;
  }

  private set _colors(value: EditableColor[]) {
    this._steps = value;
  }

  private get _loopModeOptions() {
    return [
      { value: 'once', label: this._localize('options.loop_mode_once') },
      { value: 'count', label: this._localize('options.loop_mode_count') },
      { value: 'continuous', label: this._localize('options.loop_mode_continuous') },
    ];
  }

  private get _endBehaviorOptions() {
    return [
      { value: 'maintain', label: this._localize('options.end_behavior_maintain') },
      { value: 'restore', label: this._localize('dynamic_scene.end_behavior_restore') || 'Restore previous state' },
    ];
  }

  private get _distributionModeOptions() {
    return [
      { value: 'shuffle_rotate', label: this._localize('dynamic_scene.distribution_shuffle_rotate') || 'Shuffle and rotate' },
      { value: 'synchronized', label: this._localize('dynamic_scene.distribution_synchronized') || 'Synchronized' },
      { value: 'random', label: this._localize('dynamic_scene.distribution_random') || 'Random' },
    ];
  }

  static styles = [
    colorPickerStyles,
    reorderableStepStyles,
    editorFormStyles,
    css`
    .boolean-left ha-selector {
      display: flex;
      justify-content: flex-start;
    }

    /* Color slots section */
    .color-slots-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .color-slot {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
    }

    .color-slot.dragging {
      opacity: 0.4;
    }

    .color-preview {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      cursor: pointer;
      border: 2px solid var(--divider-color);
      flex-shrink: 0;
    }

    .color-slot-number {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-color);
      min-width: 20px;
      flex-shrink: 0;
    }

    .brightness-control {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      overflow: hidden;
    }

    .brightness-control ha-selector {
      flex: 1;
      min-width: 80px;
    }

    .brightness-value {
      font-size: 13px;
      color: var(--secondary-text-color);
      min-width: 40px;
      text-align: right;
    }

    .color-slot-actions {
      display: flex;
      gap: 4px;
    }

    .color-slot-actions ha-icon-button {
      --ha-icon-button-size: 32px;
      --mdc-icon-size: 18px;
    }

    .add-color-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border: 2px dashed var(--divider-color);
      border-radius: 8px;
      cursor: pointer;
      color: var(--secondary-text-color);
      transition: all 0.2s ease;
      background: transparent;
    }

    .add-color-btn:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
      background: var(--secondary-background-color);
    }

    .add-color-btn.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .color-action-buttons {
      display: flex;
      gap: 8px;
    }

    .color-action-buttons .add-color-btn {
      flex: 1;
    }

    .extract-btn {
      border-style: dashed;
    }

    /* Timing sliders */
    .timing-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .timing-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .timing-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .timing-value {
      font-size: 13px;
      font-weight: 500;
      color: var(--primary-color);
    }

    /* Distribution section */
    .distribution-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .toggle-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 4px;
    }

    .toggle-label {
      font-size: 12px;
      color: var(--secondary-text-color);
    }

    @media (max-width: 600px) {
      .timing-section {
        grid-template-columns: 1fr;
      }

      .color-slots-container {
        gap: 8px;
      }

      .color-slot {
        gap: 8px;
        padding: 8px;
      }

      .color-preview {
        width: 40px;
        height: 40px;
      }

      .color-slot-number {
        min-width: 16px;
        font-size: 13px;
      }

      .brightness-control {
        gap: 4px;
      }

      .brightness-control ha-selector {
        min-width: 60px;
      }

      .color-slot-actions ha-icon-button {
        --ha-icon-button-size: 28px;
        --mdc-icon-size: 16px;
      }
    }
  `];

  connectedCallback(): void {
    super.connectedCallback();
    if (this._colors.length === 0 && !this.preset) {
      this._addDefaultColors();
    }
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    // Draft takes priority over preset (contains user's unsaved edits)
    if (changedProps.has('draft') && this.draft) {
      this._restoreDraft(this.draft);
    } else if (changedProps.has('preset') && this.preset) {
      this._hasUserInteraction = true;
      this._loadPreset(this.preset);
    }
  }

  private _loadPreset(preset: UserDynamicScenePreset): void {
    this._name = preset.name;
    this._icon = preset.icon || '';
    this._thumbnail = preset.thumbnail;
    this._transitionTime = preset.transition_time;
    this._holdTime = preset.hold_time;
    this._distributionMode = preset.distribution_mode;
    this._offsetDelay = preset.offset_delay;
    this._randomOrder = preset.random_order;
    this._loopMode = preset.loop_mode;
    this._loopCount = preset.loop_count || 3;
    this._endBehavior = preset.end_behavior;
    this._colors = preset.colors.map((color, index) => ({
      ...color,
      id: `color-${index}-${Date.now()}`,
    }));
  }

  public getDraftState(): DynamicSceneEditorDraft {
    return {
      name: this._name,
      icon: this._icon,
      thumbnail: this._thumbnail,
      colors: this._colors.map(c => ({
        x: c.x,
        y: c.y,
        brightness_pct: c.brightness_pct,
      })),
      transitionTime: this._transitionTime,
      holdTime: this._holdTime,
      distributionMode: this._distributionMode,
      offsetDelay: this._offsetDelay,
      randomOrder: this._randomOrder,
      loopMode: this._loopMode,
      loopCount: this._loopCount,
      endBehavior: this._endBehavior,
      hasUserInteraction: this._hasUserInteraction,
    };
  }

  public resetToDefaults(): void {
    this._name = '';
    this._icon = '';
    this._thumbnail = undefined;
    this._transitionTime = 120;
    this._holdTime = 0;
    this._distributionMode = 'shuffle_rotate';
    this._offsetDelay = 0;
    this._randomOrder = false;
    this._loopMode = 'continuous';
    this._loopCount = 3;
    this._endBehavior = 'restore';
    this._hasUserInteraction = false;
    this._addDefaultColors();
  }

  private _restoreDraft(draft: DynamicSceneEditorDraft): void {
    this._name = draft.name;
    this._icon = draft.icon;
    this._thumbnail = draft.thumbnail;
    this._transitionTime = draft.transitionTime;
    this._holdTime = draft.holdTime;
    this._distributionMode = draft.distributionMode;
    this._offsetDelay = draft.offsetDelay;
    this._randomOrder = draft.randomOrder;
    this._loopMode = draft.loopMode;
    this._loopCount = draft.loopCount;
    this._endBehavior = draft.endBehavior;
    this._colors = draft.colors.map((color, index) => ({
      ...color,
      id: `color-${index}-${Date.now()}`,
    }));
    this._hasUserInteraction = draft.hasUserInteraction ?? false;
  }

  private _addDefaultColors(): void {
    // Start with two complementary colors (warm orange and cool blue)
    this._colors = [
      { id: `color-0-${Date.now()}`, x: 0.5500, y: 0.4100, brightness_pct: 100 },  // Warm orange
      { id: `color-1-${Date.now() + 1}`, x: 0.1500, y: 0.0600, brightness_pct: 100 },  // Cool blue
    ];
  }

  private _colorIdCounter = 0;

  private _generateColorId(): string {
    return `color-${++this._colorIdCounter}-${Date.now()}`;
  }

  private _handleNameChange(e: CustomEvent): void {
    this._name = e.detail.value || '';
    this._hasUserInteraction = true;
  }

  private _handleIconChange(e: CustomEvent): void {
    this._icon = e.detail.value || '';
    this._hasUserInteraction = true;
  }

  private _handleTransitionTimeChange(e: CustomEvent): void {
    this._transitionTime = e.detail.value ?? 120;
    this._hasUserInteraction = true;
  }

  private _handleHoldTimeChange(e: CustomEvent): void {
    this._holdTime = e.detail.value ?? 0;
    this._hasUserInteraction = true;
  }

  private _handleDistributionModeChange(e: CustomEvent): void {
    this._distributionMode = e.detail.value || 'shuffle_rotate';
    this._hasUserInteraction = true;
  }

  private _handleOffsetDelayChange(e: CustomEvent): void {
    this._offsetDelay = e.detail.value ?? 0;
    this._hasUserInteraction = true;
  }

  private _handleRandomOrderChange(e: CustomEvent): void {
    this._randomOrder = e.detail.value ?? false;
    this._hasUserInteraction = true;
  }

  private _handleLoopModeChange(e: CustomEvent): void {
    this._loopMode = e.detail.value || 'continuous';
    this._hasUserInteraction = true;
  }

  private _handleLoopCountChange(e: CustomEvent): void {
    this._loopCount = e.detail.value ?? 3;
    this._hasUserInteraction = true;
  }

  private _handleEndBehaviorChange(e: CustomEvent): void {
    this._endBehavior = e.detail.value || 'restore';
    this._hasUserInteraction = true;
  }

  private _handleColorBrightnessChange(colorId: string, e: CustomEvent): void {
    const brightness = e.detail.value ?? 100;
    this._colors = this._colors.map(c =>
      c.id === colorId ? { ...c, brightness_pct: brightness } : c
    );
    this._hasUserInteraction = true;
  }

  private _openColorPicker(index: number): void {
    const color = this._colors[index];
    if (!color) return;
    this._editingColorIndex = index;
    this._editingColor = { x: color.x, y: color.y };
  }

  private _handleColorPickerChange(e: CustomEvent): void {
    this._editingColor = e.detail.color;
  }

  private _confirmColorPicker(): void {
    if (this._editingColorIndex !== null && this._editingColor !== null) {
      // Update color history and notify parent
      const newHistory = addColorToHistory(this.colorHistory, this._editingColor);
      this.dispatchEvent(new CustomEvent('color-history-changed', {
        detail: { colorHistory: newHistory },
        bubbles: true,
        composed: true,
      }));

      // Update the color in the list
      this._colors = this._colors.map((c, i) =>
        i === this._editingColorIndex
          ? { ...c, x: this._editingColor!.x, y: this._editingColor!.y }
          : c
      );
      this._hasUserInteraction = true;
    }
    this._closeColorPicker();
  }

  private _handleHistoryColorSelected(e: CustomEvent): void {
    const color = e.detail.color as XYColor;
    this._editingColor = { x: color.x, y: color.y };
  }

  private _closeColorPicker(): void {
    this._editingColorIndex = null;
    this._editingColor = null;
  }

  private _addColor(): void {
    if (this._colors.length >= 8) return;

    // Get the last color and calculate an analogous color (30 degree hue shift)
    const lastColor = this._colors[this._colors.length - 1];
    const baseColor = lastColor
      ? { x: lastColor.x, y: lastColor.y }
      : { x: 0.6800, y: 0.3100 };  // Default to red
    const newColor = getAnalogousColor(baseColor);

    this._colors = [...this._colors, {
      id: this._generateColorId(),
      x: newColor.x,
      y: newColor.y,
      brightness_pct: lastColor?.brightness_pct ?? 100,
    }];
    this._hasUserInteraction = true;
  }

  private _handleColorsExtracted(e: CustomEvent<ColorsExtractedDetail>): void {
    const { colors, thumbnailId } = e.detail;

    // Replace all color slots with extracted colors
    this._colors = colors.map(c => ({
      id: this._generateColorId(),
      x: c.x,
      y: c.y,
      brightness_pct: c.brightness_pct,
    }));

    if (thumbnailId) {
      // Delete previous unsaved thumbnail before storing the new one
      const originalThumb = this.preset?.thumbnail;
      if (this._thumbnail && this._thumbnail !== originalThumb) {
        this._deleteThumbnail(this._thumbnail);
      }
      this._thumbnail = thumbnailId;
    }

    this._showExtractor = false;
    this._hasUserInteraction = true;
  }

  private _removeColor(colorId: string): void {
    if (this._colors.length <= 1) return;
    this._colors = this._colors.filter(c => c.id !== colorId);
    this._hasUserInteraction = true;
  }

  private _getPresetData(): Record<string, unknown> {
    const data: Record<string, unknown> = {
      name: this._name,
      icon: this._icon || undefined,
      thumbnail: this._thumbnail || undefined,
      colors: this._colors.map(c => ({
        x: c.x,
        y: c.y,
        brightness_pct: c.brightness_pct,
      })),
      transition_time: this._transitionTime,
      hold_time: this._holdTime,
      distribution_mode: this._distributionMode,
      offset_delay: this._offsetDelay,
      random_order: this._randomOrder,
      loop_mode: this._loopMode,
      end_behavior: this._endBehavior,
    };

    if (this._loopMode === 'loop') {
      data.loop_count = this._loopCount;
    }

    return data;
  }

  private async _preview(): Promise<void> {
    if (!this.hass || this._previewing || this._colors.length === 0) return;

    this._previewing = true;
    try {
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

  private _stopPreview(): void {
    this.dispatchEvent(
      new CustomEvent('stop-preview', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private async _save(): Promise<void> {
    if (!this._name.trim() || this._colors.length === 0) return;

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
    this._hasUserInteraction = false;

    // Clean up unsaved thumbnail (one that was extracted but not yet persisted to a preset)
    const originalThumb = this.preset?.thumbnail;
    if (this._thumbnail && this._thumbnail !== originalThumb) {
      this._deleteThumbnail(this._thumbnail);
    }

    this.dispatchEvent(
      new CustomEvent('cancel', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private _deleteThumbnail(thumbnailId: string): void {
    const token = this.hass?.auth?.data?.access_token;
    if (!token) return;
    fetch(`/api/aqara_advanced_lighting/thumbnails/${thumbnailId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {
      // Best-effort cleanup
    });
  }

  /**
   * Format time value for display (converts seconds to human-readable format)
   */
  private _formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  }

  private _renderColorSlot(color: EditableColor, index: number): TemplateResult {
    const hexColor = xyToHex({ x: color.x, y: color.y }, 255);

    return html`
      <div class="color-slot step-item">
        ${this._renderDragHandle(index)}
        <span class="color-slot-number">${index + 1}</span>
        <div
          class="color-preview"
          role="button"
          tabindex="0"
          style="background-color: ${hexColor}"
          @click=${() => this._openColorPicker(index)}
          @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._openColorPicker(index); } }}
          title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.color_edit')}"
          aria-label="${this._localize('editors.color_label') || 'Color'} ${index + 1}: ${hexColor}"
        ></div>
        <div class="brightness-control">
          <ha-selector
            .hass=${this.hass}
            .selector=${{
              number: {
                min: 1,
                max: 100,
                mode: 'slider',
                unit_of_measurement: '%',
              },
            }}
            .value=${color.brightness_pct}
            @value-changed=${(e: CustomEvent) => this._handleColorBrightnessChange(color.id, e)}
          ></ha-selector>
        </div>
        <div class="color-slot-actions">
          ${this._colors.length > 1 ? html`
            <ha-icon-button
              @click=${() => this._removeColor(color.id)}
              title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.color_remove')}"
            >
              <ha-icon icon="mdi:close"></ha-icon>
            </ha-icon-button>
          ` : ''}
        </div>
      </div>
    `;
  }

  private _localize(key: string, replacements?: Record<string, string>): string {
    return localize(this.translations, key, replacements);
  }

  protected render() {
    return html`
      <div class="editor-content">
        <!-- Header: Name and Icon -->
        <div class="form-row-pair">
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
            <div class="icon-field-row">
              <ha-selector
                .hass=${this.hass}
                .selector=${{ icon: {} }}
                .value=${this._icon}
                @value-changed=${this._handleIconChange}
              ></ha-selector>
              ${this._icon ? html`
                <ha-icon-button
                  class="icon-clear-btn"
                  @click=${() => { this._icon = ''; this._hasUserInteraction = true; }}
                  title=${this._localize('editors.icon_clear_tooltip')}
                >
                  <ha-icon icon="mdi:close"></ha-icon>
                </ha-icon-button>
              ` : ''}
            </div>
            ${!this._icon ? html`<span class="form-hint">${this._localize('editors.icon_auto_hint')}</span>` : ''}
          </div>
        </div>

        <!-- Colors Section (1-8 reorderable) -->
        <div class="form-section">
          <span class="form-label">${this._localize('editors.colors_brightness_label') || 'Colors and brightness (1-8)'}</span>
          <div class="color-slots-container step-list">
            ${this._colors.map((color, index) => html`
              ${this._renderDropIndicator(index)}
              ${this._renderColorSlot(color, index)}
            `)}
            ${this._renderDropIndicator(this._colors.length)}

            <div class="color-action-buttons">
              <button
                class="add-color-btn ${this._colors.length >= 8 ? 'disabled' : ''}"
                @click=${this._addColor}
                ?disabled=${this._colors.length >= 8}
              >
                <ha-icon icon="mdi:plus"></ha-icon>
                ${this._localize('dynamic_scene.add_color_button') || 'Add color'}
              </button>
              <button
                class="add-color-btn extract-btn"
                @click=${() => { this._showExtractor = true; }}
              >
                <ha-icon icon="mdi:image-search-outline"></ha-icon>
                ${this._localize('dynamic_scene.extract_from_image') || 'Extract from image'}
              </button>
            </div>
          </div>
        </div>

        <!-- Image Color Extractor Dialog -->
        <ha-dialog
          class="extractor-dialog"
          .open=${this._showExtractor}
          @closed=${() => { this._showExtractor = false; }}
          .headerTitle=${this._localize('dynamic_scene.extract_from_image') || 'Extract from image'}
        >
          <span slot="headerNavigationIcon"></span>
          <div slot="headerActionItems" class="extractor-mode-toggle">
            <button
              class="mode-btn ${this._extractorMode === 'upload' ? 'active' : ''}"
              @click=${() => { this._extractorMode = 'upload'; }}
            >
              <ha-icon icon="mdi:upload"></ha-icon>
              ${this._localize('image_extractor.upload_tab')}
            </button>
            <button
              class="mode-btn ${this._extractorMode === 'url' ? 'active' : ''}"
              @click=${() => { this._extractorMode = 'url'; }}
            >
              <ha-icon icon="mdi:link"></ha-icon>
              ${this._localize('image_extractor.url_tab')}
            </button>
          </div>
          <image-color-extractor
            .hass=${this.hass}
            .translations=${this.translations}
            .mode=${this._extractorMode}
            @colors-extracted=${this._handleColorsExtracted}
            @extractor-cancelled=${() => { this._showExtractor = false; }}
          ></image-color-extractor>
          <div slot="footer">
            <ha-button @click=${() => { this._showExtractor = false; }}>
              ${this._localize('image_extractor.cancel_button')}
            </ha-button>
            <ha-button
              @click=${() => { (this.shadowRoot!.querySelector('image-color-extractor') as any)?.extract(); }}
            >
              <ha-icon icon="mdi:palette-swatch"></ha-icon>
              ${this._localize('image_extractor.extract_button')}
            </ha-button>
          </div>
        </ha-dialog>

        <!-- Timing Section -->
        <div class="form-section">
          <span class="form-label">${this._localize('dynamic_scene.timing_label') || 'Timing'}</span>
          <div class="timing-section">
            <div class="timing-field">
              <div class="timing-label">
                <span class="form-label">${this._localize('editors.transition_time_label')}</span>
                <span class="timing-value">${this._formatTime(this._transitionTime)}</span>
              </div>
              <ha-selector
                .hass=${this.hass}
                .selector=${{
                  number: {
                    min: 30,
                    max: 3600,
                    step: 5,
                    mode: 'slider',
                    unit_of_measurement: 's',
                  },
                }}
                .value=${this._transitionTime}
                @value-changed=${this._handleTransitionTimeChange}
              ></ha-selector>
            </div>
            <div class="timing-field">
              <div class="timing-label">
                <span class="form-label">${this._localize('editors.hold_time_label')}</span>
                <span class="timing-value">${this._formatTime(this._holdTime)}</span>
              </div>
              <ha-selector
                .hass=${this.hass}
                .selector=${{
                  number: {
                    min: 0,
                    max: 3600,
                    step: 5,
                    mode: 'slider',
                    unit_of_measurement: 's',
                  },
                }}
                .value=${this._holdTime}
                @value-changed=${this._handleHoldTimeChange}
              ></ha-selector>
            </div>
          </div>
        </div>

        <!-- Color Assignment + Randomize Light Order -->
        <div class="form-row-pair">
          <div class="form-section">
            <span class="form-label">${this._localize('dynamic_scene.distribution_mode_label') || 'Color assignment'}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                select: {
                  options: this._distributionModeOptions,
                  mode: 'dropdown',
                },
              }}
              .value=${this._distributionMode}
              @value-changed=${this._handleDistributionModeChange}
            ></ha-selector>
          </div>
          <div class="form-section boolean-left">
            <span class="form-label">${this._localize('dynamic_scene.random_order_label') || 'Randomize light order'}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ boolean: {} }}
              .value=${this._randomOrder}
              @value-changed=${this._handleRandomOrderChange}
            ></ha-selector>
          </div>
        </div>

        <!-- Ripple Effect + Maximum Scene Brightness -->
        <div class="form-row-pair">
          <div class="form-section">
            <span class="form-label">${this._localize('dynamic_scene.ripple_effect_label') || 'Ripple effect'}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                number: {
                  min: 0,
                  max: 120,
                  step: 1,
                  mode: 'slider',
                  unit_of_measurement: 's',
                },
              }}
              .value=${this._offsetDelay}
              @value-changed=${this._handleOffsetDelayChange}
            ></ha-selector>
          </div>
        </div>

        <!-- Loop Behavior -->
        <div class="form-row-pair">
          <div class="form-field">
            <span class="form-label">${this._localize('editors.loop_mode_label')}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                select: {
                  options: this._loopModeOptions,
                  mode: 'dropdown',
                },
              }}
              .value=${this._loopMode}
              @value-changed=${this._handleLoopModeChange}
            ></ha-selector>
          </div>
          <div class="form-field">
            <span class="form-label">${this._localize('editors.end_behavior_label')}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                select: {
                  options: this._endBehaviorOptions,
                  mode: 'dropdown',
                },
              }}
              .value=${this._endBehavior}
              @value-changed=${this._handleEndBehaviorChange}
            ></ha-selector>
          </div>
        </div>

        ${this._loopMode === 'loop' ? html`
          <div class="form-row">
            <span class="form-label">${this._localize('editors.loop_count_label')}</span>
            <div class="form-input">
              <ha-selector
                .hass=${this.hass}
                .selector=${{
                  number: {
                    min: 1,
                    max: 100,
                    mode: 'box',
                  },
                }}
                .value=${this._loopCount}
                @value-changed=${this._handleLoopCountChange}
              ></ha-selector>
            </div>
          </div>
        ` : ''}

        <!-- Color Picker Modal -->
        <ha-dialog
          .open=${this._editingColorIndex !== null && this._editingColor !== null}
          @closed=${this._closeColorPicker}
          .headerTitle=${this._localize('editors.color_picker_title')}
        >
          <span slot="headerNavigationIcon"></span>
          ${this._editingColor ? html`
            <div
              slot="headerActionItems"
              class="color-picker-modal-preview"
              style="background-color: ${xyToHex(this._editingColor, 255)}"
            ></div>
          ` : ''}
          ${this._editingColor ? html`
            <xy-color-picker
              .color=${this._editingColor}
              .size=${220}
              .showRgbInputs=${true}
              @color-changed=${this._handleColorPickerChange}
            ></xy-color-picker>
            <color-history-swatches
              .colorHistory=${this.colorHistory}
              .translations=${this.translations}
              @color-selected=${this._handleHistoryColorSelected}
            ></color-history-swatches>
          ` : ''}
          <div slot="footer">
            <ha-button @click=${this._closeColorPicker}>
              ${this._localize('editors.cancel_button')}
            </ha-button>
            <ha-button @click=${this._confirmColorPicker}>
              <ha-icon icon="mdi:check"></ha-icon>
              ${this._localize('editors.apply_button')}
            </ha-button>
          </div>
        </ha-dialog>

        <!-- Preview Warning -->
        ${!this.hasSelectedEntities ? html`
          <div class="preview-warning">
            <ha-icon icon="mdi:information"></ha-icon>
            <span>${this._localize('dynamic_scene.select_lights_for_preview') || 'Select light entities in the Activate tab to preview dynamic scenes on your devices.'}</span>
          </div>
        ` : ''}

        <!-- Form Actions -->
        <div class="form-actions">
          <div class="form-actions-left">
            <ha-button @click=${this._cancel}>${this._localize('editors.cancel_button')}</ha-button>
            ${this._hasUserInteraction ? html`
              <span class="unsaved-indicator">
                <span class="unsaved-dot"></span>
                ${this._localize('editors.unsaved_changes')}
              </span>
            ` : ''}
          </div>
          ${this.previewActive ? html`
            <ha-button @click=${this._stopPreview}>
              <ha-icon icon="mdi:stop"></ha-icon>
              <span class="btn-text">${this._localize('editors.stop_button')}</span>
            </ha-button>
          ` : html`
            <ha-button
              @click=${this._preview}
              .disabled=${this._previewing || this._colors.length === 0 || !this.hasSelectedEntities || !this.isCompatible}
              title=${!this.hasSelectedEntities ? this._localize('editors.tooltip_select_lights_first') : !this.isCompatible ? this._localize('editors.tooltip_light_not_compatible') : ''}
            >
              <ha-icon icon="mdi:play"></ha-icon>
              <span class="btn-text">${this._localize('editors.preview_button')}</span>
            </ha-button>
          `}
          <ha-button
            @click=${this._save}
            .disabled=${!this._name.trim() || this._colors.length === 0 || this._saving}
          >
            <ha-icon icon="mdi:content-save"></ha-icon>
            <span class="btn-text">${this.editMode ? this._localize('editors.update_button') : this._localize('editors.save_button')}</span>
          </ha-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dynamic-scene-editor': DynamicSceneEditor;
  }
}
