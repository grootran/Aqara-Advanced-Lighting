import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, RGBColor, XYColor, UserEffectPreset, DeviceContext, EffectEditorDraft } from './types';
import { xyToHex, rgbToXy, getComplementaryColor } from './color-utils';
import { colorPickerStyles } from './styles';
import { addColorToHistory } from './color-history';
import { ALL_DEVICE_LABELS, editorFormStyles, localize } from './editor-constants';
import './xy-color-picker';
import './color-history-swatches';

// Effect types available for each device
const EFFECT_TYPES: Record<string, string[]> = {
  t2_bulb: ['breathing', 'candlelight', 'fading', 'flash'],
  t1: ['flow1', 'flow2', 'fading', 'hopping', 'breathing', 'rolling'],
  t1m: ['flow1', 'flow2', 'fading', 'hopping', 'breathing', 'rolling'],
  t1_strip: ['breathing', 'rainbow1', 'chasing', 'flash', 'hopping', 'rainbow2', 'flicker', 'dash'],
};

@customElement('effect-editor')
export class EffectEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Object }) public preset?: UserEffectPreset;
  @property({ type: Object }) public translations: Record<string, any> = {};
  @property({ type: Boolean }) public editMode = false;
  @property({ type: Boolean }) public hasSelectedEntities = false;
  @property({ type: Boolean }) public isCompatible = true;
  @property({ type: Boolean }) public previewActive = false;
  @property({ type: Number }) public stripSegmentCount = 10; // Default 2 meters (out-of-box T1 Strip length)
  @property({ type: Object }) public deviceContext?: DeviceContext;
  @property({ type: Array }) public colorHistory: XYColor[] = [];
  @property({ type: Object }) public draft?: EffectEditorDraft;

  @state() private _name = '';
  @state() private _icon = '';
  @state() private _deviceType = 't2_bulb';
  @state() private _effect = '';
  @state() private _speed = 50;
  @state() private _brightness = 100;
  @state() private _colors: XYColor[] = [{ x: 0.6800, y: 0.3100 }];  // Red in XY space
  @state() private _segments = '';
  @state() private _saving = false;
  @state() private _previewing = false;
  @state() private _editingColorIndex: number | null = null;
  @state() private _editingColor: XYColor | null = null;
  @state() private _hasUserInteraction = false;

  static styles = [
    colorPickerStyles,
    editorFormStyles,
    css`
    /* Effect icon grid selector */
    .effect-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .effect-icon-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8px;
      min-width: 70px;
      background: var(--card-background-color);
      border: 2px solid var(--divider-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .effect-icon-btn:hover {
      background: var(--secondary-background-color);
      border-color: var(--primary-color);
    }

    .effect-icon-btn.selected {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--text-primary-color);
    }

    .effect-icon {
      width: 32px;
      height: 32px;
      margin-bottom: 4px;
      background-color: var(--primary-text-color);
      -webkit-mask-size: contain;
      mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-position: center;
      mask-position: center;
    }

    .effect-icon-btn.selected .effect-icon {
      background-color: var(--text-primary-color);
    }

    .effect-icon-btn span {
      font-size: 11px;
      text-transform: capitalize;
      text-align: center;
    }

    /* .color-remove and .add-color-btn inherited from panelStyles (styles.ts) */
  `];

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    // Draft takes priority over preset (contains user's unsaved edits)
    if (changedProps.has('draft') && this.draft) {
      this._restoreDraft(this.draft);
    } else if (changedProps.has('preset')) {
      if (this.preset) {
        this._hasUserInteraction = true;
        this._loadPreset(this.preset);
      } else {
        this._hasUserInteraction = false;
      }
    }

    // Auto-set device type from context when no user interaction has occurred
    if (
      changedProps.has('deviceContext') &&
      !this._hasUserInteraction &&
      this.deviceContext?.deviceType
    ) {
      this._deviceType = this.deviceContext.deviceType;
      this._effect = '';
      // Default to all segments selected for T1 Strip
      if (this._deviceType === 't1_strip' && !this._segments) {
        this._segments = 'all';
      }
    }
  }

  private _loadPreset(preset: UserEffectPreset): void {
    this._name = preset.name;
    this._icon = preset.icon || '';
    this._deviceType = preset.device_type || 't2_bulb';
    this._effect = preset.effect;
    this._speed = preset.effect_speed;
    this._brightness = preset.effect_brightness || 100;
    // Handle both XY (new) and RGB (legacy) color formats
    this._colors = preset.effect_colors.map((c: XYColor | RGBColor) => {
      if ('x' in c && 'y' in c) {
        // Already XY format
        return { x: c.x, y: c.y };
      } else if ('r' in c && 'g' in c && 'b' in c) {
        // Legacy RGB format - convert to XY
        return rgbToXy((c as RGBColor).r, (c as RGBColor).g, (c as RGBColor).b);
      }
      // Fallback to red
      return { x: 0.6800, y: 0.3100 };
    });
    this._segments = preset.effect_segments || '';
  }

  public getDraftState(): EffectEditorDraft {
    return {
      name: this._name,
      icon: this._icon,
      deviceType: this._deviceType,
      effect: this._effect,
      speed: this._speed,
      brightness: this._brightness,
      colors: [...this._colors],
      segments: this._segments,
    };
  }

  public resetToDefaults(): void {
    this._name = '';
    this._icon = '';
    this._deviceType = 't2_bulb';
    this._effect = '';
    this._speed = 50;
    this._brightness = 100;
    this._colors = [{ x: 0.6800, y: 0.3100 }];
    this._segments = '';
    this._hasUserInteraction = false;
  }

  private _restoreDraft(draft: EffectEditorDraft): void {
    this._name = draft.name;
    this._icon = draft.icon;
    this._deviceType = draft.deviceType;
    this._effect = draft.effect;
    this._speed = draft.speed;
    this._brightness = draft.brightness;
    this._colors = [...draft.colors];
    this._segments = draft.segments;
    this._hasUserInteraction = true;
  }

  private _handleNameChange(e: CustomEvent): void {
    this._name = e.detail.value || '';
  }

  private _handleIconChange(e: CustomEvent): void {
    this._icon = e.detail.value || '';
  }

  private _handleDeviceTypeChange(e: CustomEvent): void {
    this._deviceType = e.detail.value || 't2_bulb';
    this._hasUserInteraction = true;
    // Reset effect to empty so user must select from new device's effects
    this._effect = '';
    // Default to all segments selected for T1 Strip
    if (this._deviceType === 't1_strip' && !this._segments) {
      this._segments = 'all';
    }
  }

  private _handleSpeedChange(e: CustomEvent): void {
    this._speed = e.detail.value ?? 50;
  }

  private _handleBrightnessChange(e: CustomEvent): void {
    this._brightness = e.detail.value ?? 100;
  }

  private _handleSegmentsChange(e: CustomEvent): void {
    this._segments = e.detail.value || '';
  }

  private _openColorPicker(index: number): void {
    const xyColor = this._colors[index];
    if (!xyColor) return;
    this._editingColorIndex = index;
    this._editingColor = xyColor;
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
      this._colors = this._colors.map((c, i) =>
        i === this._editingColorIndex ? this._editingColor! : c
      );
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
    if (this._colors.length < 8) {
      // Get the last color and calculate its complementary color
      const lastColor = this._colors[this._colors.length - 1] || { x: 0.6800, y: 0.3100 }; // Default to red if undefined
      const newColor = getComplementaryColor(lastColor);
      this._colors = [...this._colors, newColor];
    }
  }

  private _removeColor(index: number): void {
    if (this._colors.length > 1) {
      this._colors = this._colors.filter((_, i) => i !== index);
    }
  }

  private _colorToHex(color: XYColor): string {
    return xyToHex(color, 255);
  }

  private _getEffectIconUrl(effect: string): string {
    return `/api/aqara_advanced_lighting/icons/${effect}.svg`;
  }

  private _selectEffect(effect: string): void {
    this._effect = effect;
    this._hasUserInteraction = true;
  }

  private _getPresetData(): Record<string, unknown> {
    const data: Record<string, unknown> = {
      name: this._name,
      icon: this._icon || undefined,
      device_type: this._deviceType,
      effect: this._effect,
      effect_speed: this._speed,
      effect_brightness: this._brightness,
      effect_colors: this._colors,
    };

    if (this._deviceType === 't1_strip' && this._segments) {
      data.effect_segments = this._segments;
    }

    return data;
  }

  private async _preview(): Promise<void> {
    if (!this.hass || !this._effect || this._previewing) return;

    this._previewing = true;
    try {
      // Dispatch preview event to parent
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
    if (!this._name.trim() || !this._effect) {
      return;
    }

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

  private _localize(key: string, replacements?: Record<string, string>): string {
    return localize(this.translations, key, replacements);
  }

  protected render() {
    const deviceOptions = Object.entries(ALL_DEVICE_LABELS).map(([value, label]) => ({
      value,
      label,
    }));

    const availableEffects = EFFECT_TYPES[this._deviceType] || [];
    const showSegments = this._deviceType === 't1_strip';

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
            ${!this._icon ? html`<span class="form-hint">${this._localize('editors.icon_auto_hint')}</span>` : ''}
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

        <div class="form-row-pair">
          <div class="form-field">
            <span class="form-label">${this._localize('editors.speed_label')}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                number: {
                  min: 1,
                  max: 100,
                  mode: 'slider',
                },
              }}
              .value=${this._speed}
              @value-changed=${this._handleSpeedChange}
            ></ha-selector>
          </div>
          <div class="form-field">
            <span class="form-label">${this._localize('editors.brightness_label')}</span>
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
              .value=${this._brightness}
              @value-changed=${this._handleBrightnessChange}
            ></ha-selector>
          </div>
        </div>

        ${showSegments
          ? html`
              <div class="form-section">
                <segment-selector
                  .hass=${this.hass}
                  .mode=${'selection'}
                  .maxSegments=${this.stripSegmentCount}
                  .value=${this._segments}
                  .label=${this._localize('editors.segments_label')}
                  .translations=${this.translations}
                  .zones=${this.deviceContext?.zones || []}
                  @value-changed=${this._handleSegmentsChange}
                ></segment-selector>
              </div>
            `
          : ''}

        <div class="form-section">
          <span class="form-label">${this._localize('editors.effect_label')}</span>
          <div class="effect-grid">
            ${availableEffects.map(
              (effect) => html`
                <div
                  class="effect-icon-btn ${this._effect === effect ? 'selected' : ''}"
                  @click=${() => this._selectEffect(effect)}
                  title=${effect}
                >
                  <div
                    class="effect-icon"
                    style="
                      -webkit-mask-image: url('${this._getEffectIconUrl(effect)}');
                      mask-image: url('${this._getEffectIconUrl(effect)}');
                    "
                  ></div>
                  <span>${effect}</span>
                </div>
              `
            )}
          </div>
        </div>

        <div class="form-section">
          <span class="form-label">${this._localize('editors.colors_label')}</span>
          <div class="color-picker-grid">
            ${this._colors.map(
              (color, index) => html`
                <div class="color-item">
                  <div
                    class="color-swatch"
                    style="background-color: ${this._colorToHex(color)}"
                    @click=${() => this._openColorPicker(index)}
                    title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.color_edit')}"
                  ></div>
                  ${this._colors.length > 1
                    ? html`
                        <button
                          class="color-remove"
                          @click=${() => this._removeColor(index)}
                          title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.color_remove')}"
                        >
                          <ha-icon icon="mdi:close"></ha-icon>
                        </button>
                      `
                    : html`<div class="color-remove-spacer"></div>`}
                </div>
              `
            )}
            <div class="add-color-btn ${this._colors.length >= 8 ? 'disabled' : ''}">
              <div
                class="add-color-icon"
                @click=${this._addColor}
                title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.color_add')}"
              >
                <ha-icon icon="mdi:plus"></ha-icon>
              </div>
              <div class="color-remove-spacer"></div>
            </div>
          </div>
        </div>

        ${this._editingColorIndex !== null && this._editingColor !== null
          ? html`
              <div class="color-picker-modal-overlay" @click=${this._closeColorPicker}>
                <div class="color-picker-modal" @click=${(e: Event) => e.stopPropagation()}>
                  <div class="color-picker-modal-header">
                    <span class="color-picker-modal-title">${this._localize('editors.color_picker_title')}</span>
                    <div
                      class="color-picker-modal-preview"
                      style="background-color: ${this._colorToHex(this._editingColor)}"
                    ></div>
                  </div>
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
                  <div class="color-picker-modal-actions">
                    <ha-button @click=${this._closeColorPicker}>${this._localize('editors.cancel_button')}</ha-button>
                    <ha-button @click=${this._confirmColorPicker}>
                      <ha-icon icon="mdi:check"></ha-icon>
                      ${this._localize('editors.apply_button')}
                    </ha-button>
                  </div>
                </div>
              </div>
            `
          : ''}

        ${!this.hasSelectedEntities
          ? html`
              <div class="preview-warning">
                <ha-icon icon="mdi:information"></ha-icon>
                <span>${this._localize('editors.select_lights_for_preview_effects')}</span>
              </div>
            `
          : ''}

        <div class="form-actions">
          <ha-button @click=${this._cancel}>${this._localize('editors.cancel_button')}</ha-button>
          ${this.previewActive
            ? html`
                <ha-button @click=${this._stopPreview}>
                  <ha-icon icon="mdi:stop"></ha-icon>
                  ${this._localize('editors.stop_button')}
                </ha-button>
              `
            : html`
                <ha-button
                  @click=${this._preview}
                  .disabled=${!this._effect || this._previewing || !this.hasSelectedEntities || !this.isCompatible}
                  title=${!this.hasSelectedEntities ? this._localize('editors.tooltip_select_lights_first') : !this.isCompatible ? this._localize('editors.tooltip_light_not_compatible') : ''}
                >
                  <ha-icon icon="mdi:play"></ha-icon>
                  ${this._localize('editors.preview_button')}
                </ha-button>
              `}
          <ha-button @click=${this._save} .disabled=${!this._name.trim() || !this._effect || this._saving}>
            <ha-icon icon="mdi:content-save"></ha-icon>
            ${this.editMode ? this._localize('editors.update_button') : this._localize('editors.save_button')}
          </ha-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'effect-editor': EffectEditor;
  }
}
