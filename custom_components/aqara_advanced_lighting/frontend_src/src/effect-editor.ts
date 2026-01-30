import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, RGBColor, XYColor, UserEffectPreset, DeviceContext } from './types';
import { xyToHex, rgbToXy, getComplementaryColor } from './color-utils';
import { colorPickerStyles } from './styles';
import { getColorHistory, addColorToHistory, clearColorHistory } from './color-history';
import './xy-color-picker';

// Effect types available for each device
const EFFECT_TYPES: Record<string, string[]> = {
  t2_bulb: ['breathing', 'candlelight', 'fading', 'flash'],
  t1: ['flow1', 'flow2', 'fading', 'hopping', 'breathing', 'rolling'],
  t1m: ['flow1', 'flow2', 'fading', 'hopping', 'breathing', 'rolling'],
  t1_strip: ['breathing', 'rainbow1', 'chasing', 'flash', 'hopping', 'rainbow2', 'flicker', 'dash'],
};

// Map effect names to icon filenames (for cases where they differ)
const EFFECT_ICON_MAP: Record<string, string> = {};

const DEVICE_LABELS: Record<string, string> = {
  t2_bulb: 'T2 Bulb',
  t1: 'T1 (20 segments)',
  t1m: 'T1M (26 segments)',
  t1_strip: 'T1 Strip',
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

    .field-description {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin-top: 4px;
    }

    .form-input {
      flex: 1;
    }

    /* Color picker styles inherited from panelStyles (styles.ts) */

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
    }

    .form-hint {
      font-size: var(--ha-font-size-s, 12px);
      color: var(--secondary-text-color);
      margin-top: -4px;
    }
  `];

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    if (changedProps.has('preset')) {
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
  }

  private _handleSpeedChange(e: CustomEvent): void {
    this._speed = e.detail.value || 50;
  }

  private _handleBrightnessChange(e: CustomEvent): void {
    this._brightness = e.detail.value || 100;
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
      addColorToHistory(this._editingColor);
      this._colors = this._colors.map((c, i) =>
        i === this._editingColorIndex ? this._editingColor! : c
      );
    }
    this._closeColorPicker();
  }

  private _selectHistoryColor(color: XYColor): void {
    this._editingColor = { x: color.x, y: color.y };
  }

  private _clearColorHistory(): void {
    clearColorHistory();
    this.requestUpdate();
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

  private _renderColorHistory() {
    const history = getColorHistory();

    return html`
      <div class="color-history-section">
        <div class="color-history-header">
          <span class="color-history-label">${this._localize('color_history.recent_colors')}</span>
          ${history.length > 0 ? html`
            <button class="color-history-clear" @click=${this._clearColorHistory}>
              ${this._localize('color_history.clear')}
            </button>
          ` : ''}
        </div>
        <div class="color-history-swatches">
          ${history.map(color => html`
            <button
              class="color-history-swatch"
              style="background-color: ${xyToHex(color, 255)}"
              @click=${() => this._selectHistoryColor(color)}
            ></button>
          `)}
        </div>
      </div>
    `;
  }

  private _colorToHex(color: XYColor): string {
    return xyToHex(color, 255);
  }

  private _getEffectIconUrl(effect: string): string {
    const iconName = EFFECT_ICON_MAP[effect] || effect;
    return `/api/aqara_advanced_lighting/icons/${iconName}.svg`;
  }

  private _selectEffect(effect: string): void {
    this._effect = effect;
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
    const deviceOptions = Object.entries(DEVICE_LABELS).map(([value, label]) => ({
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
                  ${this._renderColorHistory()}
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
                  Stop
                </ha-button>
              `
            : html`
                <ha-button
                  @click=${this._preview}
                  .disabled=${!this._effect || this._previewing || !this.hasSelectedEntities || !this.isCompatible}
                  title=${!this.hasSelectedEntities ? 'Select entities in Activate tab first' : !this.isCompatible ? 'Selected light is not compatible' : ''}
                >
                  <ha-icon icon="mdi:play"></ha-icon>
                  Preview
                </ha-button>
              `}
          <ha-button @click=${this._save} .disabled=${!this._name.trim() || !this._effect || this._saving}>
            <ha-icon icon="mdi:content-save"></ha-icon>
            ${this.editMode ? 'Update' : 'Save'}
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
