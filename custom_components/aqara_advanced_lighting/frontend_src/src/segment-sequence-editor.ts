import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, SegmentSequenceStep, XYColor, HSColor, UserSegmentSequencePreset } from './types';
import { xyToHex, xyToRgb, rgbToXy, xyToHs, hsToXy, hsToRgb } from './color-utils';
import { colorPickerStyles } from './styles';
import './hs-color-picker';

const DEVICE_LABELS: Record<string, string> = {
  t1: 'T1 (20 segments)',
  t1m: 'T1M (26 segments)',
  t1_strip: 'T1 Strip (up to 50 segments)',
};

interface EditableStep extends SegmentSequenceStep {
  id: string;
  colorsArray: XYColor[];
}

@customElement('segment-sequence-editor')
export class SegmentSequenceEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Object }) public preset?: UserSegmentSequencePreset;
  @property({ type: Object }) public translations: Record<string, any> = {};
  @property({ type: Boolean }) public editMode = false;
  @property({ type: Boolean }) public hasSelectedEntities = false;
  @property({ type: Boolean }) public isCompatible = true;
  @property({ type: Boolean }) public previewActive = false;

  @state() private _name = '';
  @state() private _icon = '';
  @state() private _deviceType = 't1m';
  @state() private _steps: EditableStep[] = [];
  @state() private _loopMode = 'once';
  @state() private _loopCount = 3;
  @state() private _endBehavior = 'maintain';
  @state() private _clearSegments = false;
  @state() private _skipFirstInLoop = false;
  @state() private _saving = false;
  @state() private _previewing = false;

  // Color picker modal state
  @state() private _editingStepId: string | null = null;
  @state() private _editingColorIndex: number | null = null;
  @state() private _editingColor: HSColor | null = null;

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
      { value: 'turn_off', label: this._localize('options.end_behavior_turn_off') },
    ];
  }

  private get _stepModeOptions() {
    return [
      { value: 'blocks_repeat', label: this._localize('options.pattern_mode_blocks_repeat') },
      { value: 'blocks_expand', label: this._localize('options.pattern_mode_blocks_expand') },
      { value: 'gradient', label: this._localize('options.pattern_mode_gradient') },
    ];
  }

  private get _activationPatternOptions() {
    return [
      { value: 'all', label: this._localize('options.activation_all') },
      { value: 'sequential_forward', label: this._localize('options.activation_sequential_forward') },
      { value: 'sequential_reverse', label: this._localize('options.activation_sequential_reverse') },
      { value: 'random', label: this._localize('options.activation_random') },
      { value: 'ping_pong', label: this._localize('options.activation_ping_pong') },
      { value: 'center_out', label: this._localize('options.activation_center_out') },
      { value: 'edges_in', label: this._localize('options.activation_edges_in') },
      { value: 'paired', label: this._localize('options.activation_paired') },
    ];
  }

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

    .form-section.toggle-row {
      flex-direction: row;
      gap: 24px;
      flex-wrap: wrap;
    }

    .toggle-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toggle-label {
      font-size: 14px;
      color: var(--secondary-text-color);
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

    .step-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .step-item {
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      padding: 16px;
    }

    .step-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .step-number {
      font-weight: 600;
      font-size: 14px;
      color: var(--primary-color);
    }

    .step-actions {
      display: flex;
      gap: 4px;
    }

    .step-actions ha-icon-button {
      --mdc-icon-button-size: 32px;
      --mdc-icon-size: 18px;
    }

    .step-fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }

    .step-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .step-field-label {
      font-size: 12px;
      color: var(--secondary-text-color);
    }

    .step-field.full-width {
      grid-column: 1 / -1;
    }

    /* Color picker styles (color-picker-grid, color-item, color-swatch,
       color-picker-modal, color-remove, add-color-btn) are inherited
       from panelStyles (styles.ts) */

    .add-step-btn {
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

    .add-step-btn:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
      background: var(--secondary-background-color);
    }

    .add-step-btn.disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

    .error-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
      border: 1px solid var(--divider-color);
      border-left: 4px solid var(--error-color, #db4437);
      border-radius: 4px;
      font-size: 13px;
    }

    .error-warning ha-icon {
      flex-shrink: 0;
      --mdc-icon-size: 18px;
    }

    .empty-steps {
      text-align: center;
      padding: 40px 20px;
      color: var(--secondary-text-color);
      background: var(--card-background-color);
      border-radius: 8px;
      border: 2px dashed var(--divider-color);
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

      .step-fields {
        grid-template-columns: 1fr;
      }
    }
  `];

  connectedCallback(): void {
    super.connectedCallback();
    if (this._steps.length === 0 && !this.preset) {
      this._addDefaultStep();
    }
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    if (changedProps.has('preset') && this.preset) {
      this._loadPreset(this.preset);
    }
  }

  private _loadPreset(preset: UserSegmentSequencePreset): void {
    this._name = preset.name;
    this._icon = preset.icon || '';
    this._deviceType = preset.device_type || 't1m';
    this._loopMode = preset.loop_mode;
    this._loopCount = preset.loop_count || 3;
    this._endBehavior = preset.end_behavior;
    this._clearSegments = preset.clear_segments || false;
    this._skipFirstInLoop = preset.skip_first_in_loop || false;
    this._steps = preset.steps.map((step, index) => ({
      ...step,
      id: `step-${index}-${Date.now()}`,
      // Convert RGB arrays from preset to XY colors
      colorsArray: step.colors.map((c) => {
        const rgb = { r: c[0] ?? 0, g: c[1] ?? 0, b: c[2] ?? 0 };
        return rgbToXy(rgb.r, rgb.g, rgb.b);
      }),
    }));
  }

  private _addDefaultStep(): void {
    this._steps = [
      {
        id: `step-0-${Date.now()}`,
        segments: '1-5',
        colors: [[255, 0, 0]],
        colorsArray: [{ x: 0.6800, y: 0.3100 }],  // Red in XY space
        mode: 'blocks_expand',
        duration: 15,
        hold: 60,
        activation_pattern: 'all',
      },
    ];
  }

  private _generateStepId(): string {
    return `step-${this._steps.length}-${Date.now()}`;
  }

  private _handleNameChange(e: CustomEvent): void {
    this._name = e.detail.value || '';
  }

  private _handleIconChange(e: CustomEvent): void {
    this._icon = e.detail.value || '';
  }

  private _handleDeviceTypeChange(e: CustomEvent): void {
    this._deviceType = e.detail.value || 't1m';
  }

  private _handleLoopModeChange(e: CustomEvent): void {
    this._loopMode = e.detail.value || 'once';
  }

  private _handleLoopCountChange(e: CustomEvent): void {
    this._loopCount = e.detail.value || 3;
  }

  private _handleEndBehaviorChange(e: CustomEvent): void {
    this._endBehavior = e.detail.value || 'maintain';
  }

  private _handleClearSegmentsChange(e: Event): void {
    this._clearSegments = (e.target as HTMLInputElement).checked;
  }

  private _handleSkipFirstInLoopChange(e: Event): void {
    this._skipFirstInLoop = (e.target as HTMLInputElement).checked;
  }

  private _hasInvalidGradientSteps(): boolean {
    // Check if any steps use gradient mode with less than 2 colors
    return this._steps.some((step) => step.mode === 'gradient' && step.colorsArray.length < 2);
  }

  private _handleStepFieldChange(stepId: string, field: string, e: CustomEvent): void {
    this._steps = this._steps.map((step) =>
      step.id === stepId ? { ...step, [field]: e.detail.value } : step
    );
  }

  private _openStepColorPicker(stepId: string, colorIndex: number): void {
    const step = this._steps.find((s) => s.id === stepId);
    if (!step) return;

    const xyColor = step.colorsArray[colorIndex];
    if (!xyColor) return;
    this._editingStepId = stepId;
    this._editingColorIndex = colorIndex;
    this._editingColor = xyToHs(xyColor);
  }

  private _handleColorPickerChange(e: CustomEvent): void {
    this._editingColor = e.detail.color;
  }

  private _confirmColorPicker(): void {
    if (this._editingStepId === null || this._editingColorIndex === null || this._editingColor === null) {
      this._closeColorPicker();
      return;
    }

    const xyColor = hsToXy(this._editingColor);
    const stepId = this._editingStepId;
    const colorIndex = this._editingColorIndex;

    this._steps = this._steps.map((step) => {
      if (step.id !== stepId) return step;

      const newColorsArray = step.colorsArray.map((c, i) =>
        i === colorIndex ? xyColor : c
      );
      // Convert XY to RGB for the colors array (backend format)
      const newColors = newColorsArray.map((c) => {
        const rgb = xyToRgb(c.x, c.y, 255);
        return [rgb.r, rgb.g, rgb.b] as number[];
      });

      return { ...step, colorsArray: newColorsArray, colors: newColors };
    });

    this._closeColorPicker();
  }

  private _closeColorPicker(): void {
    this._editingStepId = null;
    this._editingColorIndex = null;
    this._editingColor = null;
  }

  private _addStepColor(stepId: string): void {
    this._steps = this._steps.map((step) => {
      if (step.id !== stepId || step.colorsArray.length >= 8) return step;

      // Add white in XY space (D65 white point)
      const newColorsArray = [...step.colorsArray, { x: 0.3127, y: 0.3290 }];
      // Convert XY to RGB for the colors array (backend format)
      const newColors = newColorsArray.map((c) => {
        const rgb = xyToRgb(c.x, c.y, 255);
        return [rgb.r, rgb.g, rgb.b] as number[];
      });

      return { ...step, colorsArray: newColorsArray, colors: newColors };
    });
  }

  private _removeStepColor(stepId: string, colorIndex: number): void {
    this._steps = this._steps.map((step) => {
      if (step.id !== stepId || step.colorsArray.length <= 1) return step;

      const newColorsArray = step.colorsArray.filter((_, i) => i !== colorIndex);
      // Convert XY to RGB for the colors array (backend format)
      const newColors = newColorsArray.map((c) => {
        const rgb = xyToRgb(c.x, c.y, 255);
        return [rgb.r, rgb.g, rgb.b] as number[];
      });

      return { ...step, colorsArray: newColorsArray, colors: newColors };
    });
  }

  private _addStep(): void {
    if (this._steps.length >= 20) return;

    const newStep: EditableStep = {
      id: this._generateStepId(),
      segments: '1-5',
      colors: [[255, 0, 0]],
      colorsArray: [{ x: 0.6800, y: 0.3100 }],  // Red in XY space
      mode: 'blocks_expand',
      duration: 15,
      hold: 60,
      activation_pattern: 'all',
    };

    this._steps = [...this._steps, newStep];
  }

  private _removeStep(stepId: string): void {
    if (this._steps.length <= 1) return;
    this._steps = this._steps.filter((s) => s.id !== stepId);
  }

  private _moveStepUp(index: number): void {
    if (index <= 0) return;
    const newSteps = [...this._steps];
    const temp = newSteps[index - 1]!;
    newSteps[index - 1] = newSteps[index]!;
    newSteps[index] = temp;
    this._steps = newSteps;
  }

  private _moveStepDown(index: number): void {
    if (index >= this._steps.length - 1) return;
    const newSteps = [...this._steps];
    const temp = newSteps[index]!;
    newSteps[index] = newSteps[index + 1]!;
    newSteps[index + 1] = temp;
    this._steps = newSteps;
  }

  private _duplicateStep(step: EditableStep): void {
    if (this._steps.length >= 20) return;

    const newStep: EditableStep = {
      ...step,
      id: this._generateStepId(),
      colorsArray: step.colorsArray.map((c) => ({ ...c })),
      colors: step.colors.map((c) => [...c]),
    };

    const index = this._steps.findIndex((s) => s.id === step.id);
    const newSteps = [...this._steps];
    newSteps.splice(index + 1, 0, newStep);
    this._steps = newSteps;
  }


  private _getPresetData(): Record<string, unknown> {
    const steps = this._steps.map(({ id, colorsArray, ...step }) => ({
      ...step,
      // Convert XY colors to RGB arrays for backend
      colors: colorsArray.map((c) => {
        const rgb = xyToRgb(c.x, c.y, 255);
        return [rgb.r, rgb.g, rgb.b];
      }),
    }));

    const data: Record<string, unknown> = {
      name: this._name,
      icon: this._icon || undefined,
      device_type: this._deviceType,
      steps,
      loop_mode: this._loopMode,
      end_behavior: this._endBehavior,
      clear_segments: this._clearSegments,
      skip_first_in_loop: this._skipFirstInLoop,
    };

    if (this._loopMode === 'count') {
      data.loop_count = this._loopCount;
    }

    return data;
  }

  // Convert XY color to hex for display
  private _colorToHex(color: XYColor): string {
    return xyToHex(color, 255);
  }

  private async _preview(): Promise<void> {
    if (!this.hass || this._previewing) return;

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
    if (!this._name.trim() || this._steps.length === 0) return;

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

  private _renderStep(step: EditableStep, index: number) {
    return html`
      <div class="step-item">
        <div class="step-header">
          <span class="step-number">Step ${index + 1}</span>
          <div class="step-actions">
            <ha-icon-button
              @click=${() => this._moveStepUp(index)}
              .disabled=${index === 0}
              title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.step_move_up')}"
            >
              <ha-icon icon="mdi:arrow-up"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${() => this._moveStepDown(index)}
              .disabled=${index === this._steps.length - 1}
              title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.step_move_down')}"
            >
              <ha-icon icon="mdi:arrow-down"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${() => this._duplicateStep(step)}
              .disabled=${this._steps.length >= 20}
              title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.step_duplicate')}"
            >
              <ha-icon icon="mdi:content-copy"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${() => this._removeStep(step.id)}
              .disabled=${this._steps.length <= 1}
              title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.step_remove')}"
            >
              <ha-icon icon="mdi:delete"></ha-icon>
            </ha-icon-button>
          </div>
        </div>
        <div class="step-fields">
          <div class="step-field">
            <span class="step-field-label">${this._localize('editors.segments_input_label')}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ text: {} }}
              .value=${step.segments}
              @value-changed=${(e: CustomEvent) => this._handleStepFieldChange(step.id, 'segments', e)}
            ></ha-selector>
          </div>
          <div class="step-field">
            <span class="step-field-label">${this._localize('editors.mode_label')}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                select: {
                  options: this._stepModeOptions,
                  mode: 'dropdown',
                },
              }}
              .value=${step.mode}
              @value-changed=${(e: CustomEvent) => this._handleStepFieldChange(step.id, 'mode', e)}
            ></ha-selector>
          </div>
          <div class="step-field">
            <span class="step-field-label">${this._localize('editors.activation_pattern_label')}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                select: {
                  options: this._activationPatternOptions,
                  mode: 'dropdown',
                },
              }}
              .value=${step.activation_pattern}
              @value-changed=${(e: CustomEvent) => this._handleStepFieldChange(step.id, 'activation_pattern', e)}
            ></ha-selector>
          </div>
          <div class="step-field">
            <span class="step-field-label">${this._localize('editors.duration_label')}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                number: {
                  min: 0,
                  max: 3600,
                  step: 0.5,
                  mode: 'box',
                  unit_of_measurement: 's',
                },
              }}
              .value=${step.duration}
              @value-changed=${(e: CustomEvent) => this._handleStepFieldChange(step.id, 'duration', e)}
            ></ha-selector>
          </div>
          <div class="step-field">
            <span class="step-field-label">${this._localize('editors.hold_time_label')}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                number: {
                  min: 0,
                  max: 3600,
                  step: 1,
                  mode: 'box',
                  unit_of_measurement: 's',
                },
              }}
              .value=${step.hold}
              @value-changed=${(e: CustomEvent) => this._handleStepFieldChange(step.id, 'hold', e)}
            ></ha-selector>
          </div>
          <div class="step-field full-width">
            <span class="step-field-label">${this._localize('editors.colors_label')}</span>
            <div class="color-picker-grid">
              ${step.colorsArray.map(
                (color, colorIndex) => html`
                  <div class="color-item">
                    <div
                      class="color-swatch"
                      style="background-color: ${this._colorToHex(color)}"
                      @click=${() => this._openStepColorPicker(step.id, colorIndex)}
                      title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.color_edit')}"
                    ></div>
                    ${step.colorsArray.length > 1
                      ? html`
                          <ha-icon-button
                            class="color-remove"
                            @click=${() => this._removeStepColor(step.id, colorIndex)}
                            title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.color_remove')}"
                          >
                            <ha-icon icon="mdi:close"></ha-icon>
                          </ha-icon-button>
                        `
                      : ''}
                  </div>
                `
              )}
              ${step.colorsArray.length < 8
                ? html`
                    <div
                      class="add-color-btn"
                      @click=${() => this._addStepColor(step.id)}
                      title="${this.hass.localize('component.aqara_advanced_lighting.panel.tooltips.color_add')}"
                    >
                      <ha-icon icon="mdi:plus"></ha-icon>
                    </div>
                  `
                : ''}
            </div>
          </div>
        </div>
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
    const deviceOptions = Object.entries(DEVICE_LABELS).map(([value, label]) => ({
      value,
      label,
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

        ${this._loopMode === 'count'
          ? html`
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
            `
          : ''}

        <div class="form-section toggle-row">
          <div class="toggle-item">
            <span class="toggle-label">Clear Segments</span>
            <ha-switch
              .checked=${this._clearSegments}
              @change=${this._handleClearSegmentsChange}
            ></ha-switch>
          </div>
          <div class="toggle-item">
            <span class="toggle-label">${this._localize('editors.skip_first_step_label')}</span>
            <ha-switch
              .checked=${this._skipFirstInLoop}
              @change=${this._handleSkipFirstInLoopChange}
            ></ha-switch>
          </div>
        </div>

        <div class="form-section">
          <span class="form-label">${this._localize('editors.steps_label')}</span>
          <div class="step-list">
            ${this._steps.length === 0
              ? html`
                  <div class="empty-steps">
                    ${this._localize('editors.no_steps_message')}
                  </div>
                `
              : this._steps.map((step, index) => this._renderStep(step, index))}

            <button
              class="add-step-btn ${this._steps.length >= 20 ? 'disabled' : ''}"
              @click=${this._addStep}
              ?disabled=${this._steps.length >= 20}
            >
              <ha-icon icon="mdi:plus"></ha-icon>
              ${this._localize('editors.add_step_button')}
            </button>
          </div>
        </div>

        ${this._hasInvalidGradientSteps()
          ? html`
              <div class="error-warning">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                <span>Gradient mode requires at least 2 colors. Please add more colors to steps using gradient mode or change the mode.</span>
              </div>
            `
          : ''}

        ${!this.hasSelectedEntities
          ? html`
              <div class="preview-warning">
                <ha-icon icon="mdi:information"></ha-icon>
                <span>${this._localize('editors.select_lights_for_preview_sequences')}</span>
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
                  .disabled=${this._previewing || this._steps.length === 0 || !this.hasSelectedEntities || !this.isCompatible || this._hasInvalidGradientSteps()}
                  title=${!this.hasSelectedEntities ? 'Select entities in Activate tab first' : !this.isCompatible ? 'Selected light is not compatible' : this._hasInvalidGradientSteps() ? 'Fix gradient validation errors first' : ''}
                >
                  <ha-icon icon="mdi:play"></ha-icon>
                  Preview
                </ha-button>
              `}
          <ha-button
            @click=${this._save}
            .disabled=${!this._name.trim() || this._steps.length === 0 || this._saving || this._hasInvalidGradientSteps()}
          >
            <ha-icon icon="mdi:content-save"></ha-icon>
            ${this.editMode ? 'Update' : 'Save'}
          </ha-button>
        </div>

        ${this._editingStepId !== null && this._editingColor !== null
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
                  <div class="color-picker-value-display">
                    ${this._editingColor ? (() => {
                      const rgb = hsToRgb(this._editingColor.h, this._editingColor.s);
                      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                    })() : ''}
                  </div>
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
    'segment-sequence-editor': SegmentSequenceEditor;
  }
}
