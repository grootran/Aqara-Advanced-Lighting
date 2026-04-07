import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, RGBColor, XYColor, UserEffectPreset, DeviceContext, EffectEditorDraft, Translations } from './types';
import { xyToHex, rgbToXy, getComplementaryColor } from './color-utils';
import { colorPickerStyles } from './styles/color-picker';
import { addColorToHistory } from './color-history';
import { ALL_DEVICE_LABELS, editorFormStyles, localize, dialogActions } from './editor-constants';
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
  @property({ type: Object }) public translations: Translations = {};
  @property({ type: Boolean }) public editMode = false;
  @property({ type: Boolean }) public hasSelectedEntities = false;
  @property({ type: Boolean }) public isCompatible = true;
  @property({ type: Boolean }) public previewActive = false;
  @property({ type: Number }) public stripSegmentCount = 10; // Default 2 meters (out-of-box T1 Strip length)
  @property({ type: Object }) public deviceContext?: DeviceContext;
  @property({ type: Array }) public colorHistory: XYColor[] = [];
  @property({ type: Object }) public draft?: EffectEditorDraft;
  @property({ type: String }) public defaultAudioEntity = '';

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

  // Audio-reactive state
  @state() private _audioEnabled = false;
  @state() private _audioEntity = '';
  @state() private _audioSensitivity = 50;
  @state() private _audioDetectionMode: 'spectral_flux' | 'bass_energy' | 'complex_domain' = 'spectral_flux';
  @state() private _audioSilenceBehavior: 'hold' | 'decay_min' | 'decay_mid' = 'decay_min';
  @state() private _audioSpeedMode: 'on_onset' | 'continuous' | 'intensity_breathing' | 'onset_flash' | 'off' = 'continuous';
  @state() private _audioSpeedMin = 1;
  @state() private _audioSpeedMax = 100;
  @state() private _audioSpeedCurve: 'linear' | 'logarithmic' | 'exponential' = 'linear';
  @state() private _audioBrightnessMode: 'on_onset' | 'continuous' | 'intensity_breathing' | 'onset_flash' | 'off' = 'off';
  @state() private _audioBrightnessMin = 1;
  @state() private _audioBrightnessMax = 100;
  @state() private _audioBrightnessCurve: 'linear' | 'logarithmic' | 'exponential' = 'linear';

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

    /* .color-remove and .add-color-btn inherited from colorPickerStyles (styles.ts) */

    .boolean-left ha-selector {
      display: flex;
      justify-content: flex-start;
    }
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

    // Load audio config
    if (preset.audio_config) {
      this._audioEnabled = true;
      this._audioEntity = preset.audio_config.audio_entity || '';
      this._audioSensitivity = preset.audio_config.audio_sensitivity ?? 50;
      this._audioDetectionMode = preset.audio_config.audio_detection_mode ?? 'spectral_flux';
      this._audioSilenceBehavior = preset.audio_config.audio_silence_behavior ?? 'decay_min';
      this._audioSpeedMode = preset.audio_config.audio_speed_mode || 'off';
      this._audioSpeedMin = preset.audio_config.audio_speed_min ?? 1;
      this._audioSpeedMax = preset.audio_config.audio_speed_max ?? 100;
      this._audioSpeedCurve = preset.audio_config.audio_speed_curve ?? 'linear';
      this._audioBrightnessMode = preset.audio_config.audio_brightness_mode || 'off';
      this._audioBrightnessMin = preset.audio_config.audio_brightness_min ?? 1;
      this._audioBrightnessMax = preset.audio_config.audio_brightness_max ?? 100;
      this._audioBrightnessCurve = preset.audio_config.audio_brightness_curve ?? 'linear';
    } else {
      this._audioEnabled = false;
      this._audioEntity = '';
    }
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
      hasUserInteraction: this._hasUserInteraction,
      audioConfig: this._audioEnabled ? {
        audio_entity: this._audioEntity,
        audio_sensitivity: this._audioSensitivity,
        audio_detection_mode: this._audioDetectionMode,
        audio_silence_behavior: this._audioSilenceBehavior,
        audio_speed_mode: this._audioSpeedMode === 'off' ? null : this._audioSpeedMode,
        audio_speed_min: this._audioSpeedMin,
        audio_speed_max: this._audioSpeedMax,
        audio_speed_curve: this._audioSpeedCurve,
        audio_brightness_mode: this._audioBrightnessMode === 'off' ? null : this._audioBrightnessMode,
        audio_brightness_min: this._audioBrightnessMin,
        audio_brightness_max: this._audioBrightnessMax,
        audio_brightness_curve: this._audioBrightnessCurve,
      } : undefined,
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
    this._audioEnabled = false;
    this._audioEntity = '';
    this._audioSensitivity = 50;
    this._audioDetectionMode = 'spectral_flux';
    this._audioSilenceBehavior = 'decay_min';
    this._audioSpeedMode = 'continuous';
    this._audioSpeedMin = 1;
    this._audioSpeedMax = 100;
    this._audioSpeedCurve = 'linear';
    this._audioBrightnessMode = 'off';
    this._audioBrightnessMin = 1;
    this._audioBrightnessMax = 100;
    this._audioBrightnessCurve = 'linear';
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
    this._hasUserInteraction = draft.hasUserInteraction ?? false;
    if (draft.audioConfig) {
      this._audioEnabled = true;
      this._audioEntity = draft.audioConfig.audio_entity || '';
      this._audioSensitivity = draft.audioConfig.audio_sensitivity ?? 50;
      this._audioDetectionMode = draft.audioConfig.audio_detection_mode ?? 'spectral_flux';
      this._audioSilenceBehavior = draft.audioConfig.audio_silence_behavior ?? 'decay_min';
      this._audioSpeedMode = draft.audioConfig.audio_speed_mode || 'off';
      this._audioSpeedMin = draft.audioConfig.audio_speed_min ?? 1;
      this._audioSpeedMax = draft.audioConfig.audio_speed_max ?? 100;
      this._audioSpeedCurve = draft.audioConfig.audio_speed_curve ?? 'linear';
      this._audioBrightnessMode = draft.audioConfig.audio_brightness_mode || 'off';
      this._audioBrightnessMin = draft.audioConfig.audio_brightness_min ?? 1;
      this._audioBrightnessMax = draft.audioConfig.audio_brightness_max ?? 100;
      this._audioBrightnessCurve = draft.audioConfig.audio_brightness_curve ?? 'linear';
    } else {
      this._audioEnabled = false;
    }
  }

  private _handleNameChange(e: CustomEvent): void {
    this._name = e.detail.value || '';
    this._hasUserInteraction = true;
  }

  private _handleIconChange(e: CustomEvent): void {
    this._icon = e.detail.value || '';
    this._hasUserInteraction = true;
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
    this._hasUserInteraction = true;
  }

  private _handleBrightnessChange(e: CustomEvent): void {
    this._brightness = e.detail.value ?? 100;
    this._hasUserInteraction = true;
  }

  private _handleSegmentsChange(e: CustomEvent): void {
    this._segments = e.detail.value || '';
    this._hasUserInteraction = true;
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
    if (this._colors.length < 8) {
      // Get the last color and calculate its complementary color
      const lastColor = this._colors[this._colors.length - 1] || { x: 0.6800, y: 0.3100 }; // Default to red if undefined
      const newColor = getComplementaryColor(lastColor);
      this._colors = [...this._colors, newColor];
      this._hasUserInteraction = true;
    }
  }

  private _removeColor(index: number): void {
    if (this._colors.length > 1) {
      this._colors = this._colors.filter((_, i) => i !== index);
      this._hasUserInteraction = true;
    }
  }



  // Audio reactive handlers
  private _handleAudioEnabledChange(e: CustomEvent): void {
    this._audioEnabled = e.detail.value ?? false;
    // Auto-fill audio entity from user's default when toggling on
    if (this._audioEnabled && !this._audioEntity && this.defaultAudioEntity) {
      this._audioEntity = this.defaultAudioEntity;
    }
    this._hasUserInteraction = true;
  }

  private _handleAudioEntityChange(e: CustomEvent): void {
    this._audioEntity = e.detail.value || '';
    this._hasUserInteraction = true;
  }

  private _handleAudioSensitivityChange(e: CustomEvent): void {
    this._audioSensitivity = e.detail.value ?? 50;
    this._hasUserInteraction = true;
  }

  private _handleAudioDetectionModeChange(e: CustomEvent): void {
    this._audioDetectionMode = e.detail.value || 'spectral_flux';
    this._hasUserInteraction = true;
  }

  private _handleAudioSilenceBehaviorChange(e: CustomEvent): void {
    this._audioSilenceBehavior = e.detail.value || 'decay_min';
    this._hasUserInteraction = true;
  }

  private _handleAudioSpeedModeChange(e: CustomEvent): void {
    this._audioSpeedMode = e.detail.value || 'off';
    this._hasUserInteraction = true;
  }

  private _handleAudioSpeedMinChange(e: CustomEvent): void {
    this._audioSpeedMin = e.detail.value ?? 1;
    this._hasUserInteraction = true;
  }

  private _handleAudioSpeedMaxChange(e: CustomEvent): void {
    this._audioSpeedMax = e.detail.value ?? 100;
    this._hasUserInteraction = true;
  }

  private _handleAudioSpeedCurveChange(e: CustomEvent): void {
    this._audioSpeedCurve = e.detail.value || 'linear';
    this._hasUserInteraction = true;
  }

  private _handleAudioBrightnessModeChange(e: CustomEvent): void {
    this._audioBrightnessMode = e.detail.value || 'off';
    this._hasUserInteraction = true;
  }

  private _handleAudioBrightnessMinChange(e: CustomEvent): void {
    this._audioBrightnessMin = e.detail.value ?? 1;
    this._hasUserInteraction = true;
  }

  private _handleAudioBrightnessMaxChange(e: CustomEvent): void {
    this._audioBrightnessMax = e.detail.value ?? 100;
    this._hasUserInteraction = true;
  }

  private _handleAudioBrightnessCurveChange(e: CustomEvent): void {
    this._audioBrightnessCurve = e.detail.value || 'linear';
    this._hasUserInteraction = true;
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

    if (this._audioEnabled && this._audioEntity) {
      data.audio_config = {
        audio_entity: this._audioEntity,
        audio_sensitivity: this._audioSensitivity,
        audio_detection_mode: this._audioDetectionMode,
        audio_silence_behavior: this._audioSilenceBehavior,
        audio_speed_mode: this._audioSpeedMode === 'off' ? null : this._audioSpeedMode,
        audio_speed_min: this._audioSpeedMin,
        audio_speed_max: this._audioSpeedMax,
        audio_speed_curve: this._audioSpeedCurve,
        audio_brightness_mode: this._audioBrightnessMode === 'off' ? null : this._audioBrightnessMode,
        audio_brightness_min: this._audioBrightnessMin,
        audio_brightness_max: this._audioBrightnessMax,
        audio_brightness_curve: this._audioBrightnessCurve,
      };
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

  private _hasAudioBothModesOff(): boolean {
    return (
      this._audioEnabled &&
      !!this._audioEntity &&
      this._audioSpeedMode === 'off' &&
      this._audioBrightnessMode === 'off'
    );
  }

  private async _save(): Promise<void> {
    if (!this._name.trim() || !this._effect || this._hasAudioBothModesOff()) {
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
    this._hasUserInteraction = false;
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
            <span class="form-hint">${this._localize('editors.icon_auto_hint')}</span>
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
                    role="button"
                    tabindex="0"
                    style="background-color: ${xyToHex(color)}"
                    @click=${() => this._openColorPicker(index)}
                    @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._openColorPicker(index); } }}
                    title="${this._localize('tooltips.color_edit')}"
                    aria-label="${this._localize('editors.color_label') || 'Color'} ${index + 1}: ${xyToHex(color)}"
                  ></div>
                  ${this._colors.length > 1
                    ? html`
                        <button
                          class="color-remove"
                          @click=${() => this._removeColor(index)}
                          title="${this._localize('tooltips.color_remove')}"
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
                title="${this._localize('tooltips.color_add')}"
              >
                <ha-icon icon="mdi:plus"></ha-icon>
              </div>
              <div class="color-remove-spacer"></div>
            </div>
          </div>
        </div>

        ${this._deviceType !== 't2_bulb' && this._deviceType !== 't2_cct' ? html`
        <!-- Audio Reactive Section -->
        <div class="form-section">
          <div class="form-section boolean-left">
            <span class="form-label">${this._localize('effect_editor.audio_reactive_label') || 'Audio reactive'}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ boolean: {} }}
              .value=${this._audioEnabled}
              @value-changed=${this._handleAudioEnabledChange}
            ></ha-selector>
          </div>

          ${this._audioEnabled ? html`
            <!-- Audio entity + Sensitivity -->
            <div class="form-row-pair">
              <div class="form-field">
                <span class="form-label">${this._localize('effect_editor.audio_entity_label') || 'Audio sensor entity'}</span>
                <ha-selector
                  .hass=${this.hass}
                  .selector=${{
                    entity: {
                      domain: ['binary_sensor', 'sensor'],
                    },
                  }}
                  .value=${this._audioEntity}
                  @value-changed=${this._handleAudioEntityChange}
                ></ha-selector>
              </div>
              <div class="form-field">
                <span class="form-label">${this._localize('effect_editor.audio_sensitivity_label') || 'Sensitivity'}</span>
                <ha-selector
                  .hass=${this.hass}
                  .disabled=${!this._audioEntity}
                  .selector=${{
                    number: {
                      min: 1,
                      max: 100,
                      mode: 'slider',
                    },
                  }}
                  .value=${this._audioSensitivity}
                  @value-changed=${this._handleAudioSensitivityChange}
                ></ha-selector>
              </div>
            </div>

            <!-- Detection mode + Silence behavior -->
            <div class="form-row-pair">
              <div class="form-field">
                <span class="form-label">${this._localize('effect_editor.audio_detection_mode_label') || 'Detection mode'}</span>
                <ha-selector
                  .hass=${this.hass}
                  .disabled=${!this._audioEntity}
                  .selector=${{
                    select: {
                      options: [
                        { value: 'spectral_flux', label: this._localize('effect_editor.detection_spectral_flux') || 'Spectral Flux' },
                        { value: 'bass_energy', label: this._localize('effect_editor.detection_bass_energy') || 'Bass Energy' },
                        { value: 'complex_domain', label: this._localize('effect_editor.detection_complex_domain') || 'Complex Domain' },
                      ],
                      mode: 'dropdown',
                    },
                  }}
                  .value=${this._audioDetectionMode}
                  @value-changed=${this._handleAudioDetectionModeChange}
                ></ha-selector>
              </div>
              <div class="form-field">
                <span class="form-label">${this._localize('effect_editor.audio_silence_behavior_label') || 'Silence behavior'}</span>
                <ha-selector
                  .hass=${this.hass}
                  .disabled=${!this._audioEntity}
                  .selector=${{
                    select: {
                      options: [
                        { value: 'hold', label: this._localize('effect_editor.silence_hold') || 'Hold last values' },
                        { value: 'decay_min', label: this._localize('effect_editor.silence_decay_min') || 'Decay to minimum' },
                        { value: 'decay_mid', label: this._localize('effect_editor.silence_decay_mid') || 'Decay to midpoint' },
                      ],
                      mode: 'dropdown',
                    },
                  }}
                  .value=${this._audioSilenceBehavior}
                  @value-changed=${this._handleAudioSilenceBehaviorChange}
                ></ha-selector>
              </div>
            </div>

            <!-- Speed Modulation -->
            <div>
              <span class="form-label" style="font-weight: 500;">${this._localize('effect_editor.speed_modulation_label') || 'Speed modulation'}</span>
              <div class="form-row-pair">
                <div class="form-field">
                  <span class="form-label">${this._localize('effect_editor.audio_mode_label') || 'Mode'}</span>
                  <ha-selector
                    .hass=${this.hass}
                    .disabled=${!this._audioEntity}
                    .selector=${{
                      select: {
                        options: [
                          { value: 'off', label: this._localize('effect_editor.mode_off') || 'Off' },
                          { value: 'on_onset', label: this._localize('effect_editor.mode_on_onset') || 'On Onset' },
                          { value: 'continuous', label: this._localize('effect_editor.mode_continuous') || 'Continuous' },
                          { value: 'intensity_breathing', label: this._localize('effect_editor.mode_intensity_breathing') || 'Intensity Breathing' },
                          { value: 'onset_flash', label: this._localize('effect_editor.mode_onset_flash') || 'Onset Flash' },
                        ],
                        mode: 'dropdown',
                      },
                    }}
                    .value=${this._audioSpeedMode}
                    @value-changed=${this._handleAudioSpeedModeChange}
                  ></ha-selector>
                </div>
                <div class="form-field">
                  <span class="form-label">${this._localize('effect_editor.response_curve_label') || 'Response curve'}</span>
                  <ha-selector
                    .hass=${this.hass}
                    .disabled=${!this._audioEntity || this._audioSpeedMode === 'off'}
                    .selector=${{
                      select: {
                        options: [
                          { value: 'linear', label: this._localize('effect_editor.curve_linear') || 'Linear' },
                          { value: 'logarithmic', label: this._localize('effect_editor.curve_logarithmic') || 'Logarithmic' },
                          { value: 'exponential', label: this._localize('effect_editor.curve_exponential') || 'Exponential' },
                        ],
                        mode: 'dropdown',
                      },
                    }}
                    .value=${this._audioSpeedCurve}
                    @value-changed=${this._handleAudioSpeedCurveChange}
                  ></ha-selector>
                </div>
              </div>
              <div class="form-row-pair">
                <div class="form-field">
                  <span class="form-label">${this._localize('effect_editor.range_min_label') || 'Range min'}</span>
                  <ha-selector
                    .hass=${this.hass}
                    .disabled=${!this._audioEntity || this._audioSpeedMode === 'off'}
                    .selector=${{ number: { min: 1, max: 99, mode: 'slider' } }}
                    .value=${this._audioSpeedMin}
                    @value-changed=${this._handleAudioSpeedMinChange}
                  ></ha-selector>
                </div>
                <div class="form-field">
                  <span class="form-label">${this._localize('effect_editor.range_max_label') || 'Range max'}</span>
                  <ha-selector
                    .hass=${this.hass}
                    .disabled=${!this._audioEntity || this._audioSpeedMode === 'off'}
                    .selector=${{ number: { min: 2, max: 100, mode: 'slider' } }}
                    .value=${this._audioSpeedMax}
                    @value-changed=${this._handleAudioSpeedMaxChange}
                  ></ha-selector>
                </div>
              </div>
            </div>

            <!-- Brightness Modulation -->
            <div>
              <span class="form-label" style="font-weight: 500;">${this._localize('effect_editor.brightness_modulation_label') || 'Brightness modulation'}</span>
              <div class="form-row-pair">
                <div class="form-field">
                  <span class="form-label">${this._localize('effect_editor.audio_mode_label') || 'Mode'}</span>
                  <ha-selector
                    .hass=${this.hass}
                    .disabled=${!this._audioEntity}
                    .selector=${{
                      select: {
                        options: [
                          { value: 'off', label: this._localize('effect_editor.mode_off') || 'Off' },
                          { value: 'on_onset', label: this._localize('effect_editor.mode_on_onset') || 'On Onset' },
                          { value: 'continuous', label: this._localize('effect_editor.mode_continuous') || 'Continuous' },
                          { value: 'intensity_breathing', label: this._localize('effect_editor.mode_intensity_breathing') || 'Intensity Breathing' },
                          { value: 'onset_flash', label: this._localize('effect_editor.mode_onset_flash') || 'Onset Flash' },
                        ],
                        mode: 'dropdown',
                      },
                    }}
                    .value=${this._audioBrightnessMode}
                    @value-changed=${this._handleAudioBrightnessModeChange}
                  ></ha-selector>
                </div>
                <div class="form-field">
                  <span class="form-label">${this._localize('effect_editor.response_curve_label') || 'Response curve'}</span>
                  <ha-selector
                    .hass=${this.hass}
                    .disabled=${!this._audioEntity || this._audioBrightnessMode === 'off'}
                    .selector=${{
                      select: {
                        options: [
                          { value: 'linear', label: this._localize('effect_editor.curve_linear') || 'Linear' },
                          { value: 'logarithmic', label: this._localize('effect_editor.curve_logarithmic') || 'Logarithmic' },
                          { value: 'exponential', label: this._localize('effect_editor.curve_exponential') || 'Exponential' },
                        ],
                        mode: 'dropdown',
                      },
                    }}
                    .value=${this._audioBrightnessCurve}
                    @value-changed=${this._handleAudioBrightnessCurveChange}
                  ></ha-selector>
                </div>
              </div>
              <div class="form-row-pair">
                <div class="form-field">
                  <span class="form-label">${this._localize('effect_editor.range_min_label') || 'Range min'}</span>
                  <ha-selector
                    .hass=${this.hass}
                    .disabled=${!this._audioEntity || this._audioBrightnessMode === 'off'}
                    .selector=${{ number: { min: 1, max: 99, mode: 'slider', unit_of_measurement: '%' } }}
                    .value=${this._audioBrightnessMin}
                    @value-changed=${this._handleAudioBrightnessMinChange}
                  ></ha-selector>
                </div>
                <div class="form-field">
                  <span class="form-label">${this._localize('effect_editor.range_max_label') || 'Range max'}</span>
                  <ha-selector
                    .hass=${this.hass}
                    .disabled=${!this._audioEntity || this._audioBrightnessMode === 'off'}
                    .selector=${{ number: { min: 2, max: 100, mode: 'slider', unit_of_measurement: '%' } }}
                    .value=${this._audioBrightnessMax}
                    @value-changed=${this._handleAudioBrightnessMaxChange}
                  ></ha-selector>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
        ` : ''}

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
              style="background-color: ${xyToHex(this._editingColor)}"
            ></div>
          ` : ''}
          ${this._editingColor ? html`
            <xy-color-picker
              .color=${this._editingColor}
              .size=${220}
              .showRgbInputs=${true}
              .translations=${this.translations}
              @color-changed=${this._handleColorPickerChange}
            ></xy-color-picker>
            <color-history-swatches
              .colorHistory=${this.colorHistory}
              .translations=${this.translations}
              @color-selected=${this._handleHistoryColorSelected}
            ></color-history-swatches>
          ` : ''}
          ${dialogActions(
            this._localize('editors.cancel_button'),
            this._localize('editors.apply_button'),
            () => this._closeColorPicker(),
            () => this._confirmColorPicker(),
            'mdi:check',
          )}
        </ha-dialog>

        ${!this.hasSelectedEntities
          ? html`
              <div class="preview-warning">
                <ha-icon icon="mdi:information"></ha-icon>
                <span>${this._localize('editors.select_lights_for_preview_effects')}</span>
              </div>
            `
          : ''}

        ${this._hasAudioBothModesOff()
          ? html`
              <div class="preview-warning">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                <span>${this._localize('effect_editor.audio_modulation_required')}</span>
              </div>
            `
          : ''}

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
          ${this.previewActive
            ? html`
                <ha-button @click=${this._stopPreview}>
                  <ha-icon icon="mdi:stop"></ha-icon>
                  <span class="btn-text">${this._localize('editors.stop_button')}</span>
                </ha-button>
              `
            : html`
                <ha-button
                  @click=${this._preview}
                  .disabled=${!this._effect || this._previewing || !this.hasSelectedEntities || !this.isCompatible}
                  title=${!this.hasSelectedEntities ? this._localize('editors.tooltip_select_lights_first') : !this.isCompatible ? this._localize('editors.tooltip_light_not_compatible') : ''}
                >
                  <ha-icon icon="mdi:play"></ha-icon>
                  <span class="btn-text">${this._localize('editors.preview_button')}</span>
                </ha-button>
              `}
          <ha-button @click=${this._save} .disabled=${!this._name.trim() || !this._effect || this._saving || this._hasAudioBothModesOff()}>
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
    'effect-editor': EffectEditor;
  }
}
