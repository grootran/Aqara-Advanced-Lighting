import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, CCTSequenceStep, UserCCTSequencePreset } from './types';

const LOOP_MODES = [
  { value: 'once', label: 'Run Once' },
  { value: 'loop', label: 'Loop N Times' },
  { value: 'continuous', label: 'Continuous Loop' },
];

const END_BEHAVIORS = [
  { value: 'maintain', label: 'Stay at Last Step' },
  { value: 'turn_off', label: 'Turn Off Light' },
];

interface EditableStep extends CCTSequenceStep {
  id: string;
}

@customElement('cct-sequence-editor')
export class CCTSequenceEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Object }) public preset?: UserCCTSequencePreset;
  @property({ type: Boolean }) public editMode = false;
  @property({ type: Boolean }) public hasSelectedEntities = false;
  @property({ type: Array }) public selectedEntities: string[] = [];
  @property({ type: Boolean }) public previewActive = false;

  @state() private _name = '';
  @state() private _icon = '';
  @state() private _steps: EditableStep[] = [];
  @state() private _loopMode = 'once';
  @state() private _loopCount = 3;
  @state() private _endBehavior = 'maintain';
  @state() private _saving = false;
  @state() private _previewing = false;

  static styles = css`
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

    .form-row-pair .form-field {
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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

      .form-row-pair {
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
  `;

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

  private _loadPreset(preset: UserCCTSequencePreset): void {
    this._name = preset.name;
    this._icon = preset.icon || '';
    this._loopMode = preset.loop_mode;
    this._loopCount = preset.loop_count || 3;
    this._endBehavior = preset.end_behavior;
    this._steps = preset.steps.map((step, index) => ({
      ...step,
      id: `step-${index}-${Date.now()}`,
    }));
  }

  private _addDefaultStep(): void {
    this._steps = [
      {
        id: `step-0-${Date.now()}`,
        color_temp: 4000,
        brightness: 50,
        transition: 15,
        hold: 60,
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

  private _handleLoopModeChange(e: CustomEvent): void {
    this._loopMode = e.detail.value || 'once';
  }

  private _handleLoopCountChange(e: CustomEvent): void {
    this._loopCount = e.detail.value || 3;
  }

  private _handleEndBehaviorChange(e: CustomEvent): void {
    this._endBehavior = e.detail.value || 'maintain';
  }

  private _hasIncompatibleEndpoints(): boolean {
    // Check if any selected entities lack color temperature support (required for CCT sequences)
    // This catches T1M RGB ring endpoints and any other RGB-only lights
    if (!this.hass || !this.selectedEntities.length) return false;

    for (const entityId of this.selectedEntities) {
      const entity = this.hass.states[entityId];
      if (!entity) continue;

      // Check supported_color_modes attribute - CCT sequences require color_temp support
      const supportedColorModes = entity.attributes.supported_color_modes as string[] | undefined;

      // If entity doesn't support color_temp mode, it cannot run CCT sequences
      if (!supportedColorModes || !supportedColorModes.includes('color_temp')) {
        return true;
      }
    }
    return false;
  }

  private _handleStepFieldChange(stepId: string, field: keyof CCTSequenceStep, e: CustomEvent): void {
    this._steps = this._steps.map((step) =>
      step.id === stepId ? { ...step, [field]: e.detail.value } : step
    );
  }

  private _handleStepColorTempChange(stepId: string, e: CustomEvent): void {
    const mireds = e.detail.value;
    const kelvin = Math.round(1000000 / mireds / 100) * 100;
    this._steps = this._steps.map((step) =>
      step.id === stepId ? { ...step, color_temp: kelvin } : step
    );
  }

  private _addStep(): void {
    if (this._steps.length >= 20) return;

    const newStep: EditableStep = {
      id: this._generateStepId(),
      color_temp: 4000,
      brightness: 50,
      transition: 15,
      hold: 60,
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
    };

    const index = this._steps.findIndex((s) => s.id === step.id);
    const newSteps = [...this._steps];
    newSteps.splice(index + 1, 0, newStep);
    this._steps = newSteps;
  }

  private _getPresetData(): Record<string, unknown> {
    const steps = this._steps.map(({ id, ...step }) => step);

    const data: Record<string, unknown> = {
      name: this._name,
      icon: this._icon || undefined,
      steps,
      loop_mode: this._loopMode,
      end_behavior: this._endBehavior,
    };

    if (this._loopMode === 'loop') {
      data.loop_count = this._loopCount;
    }

    return data;
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
              title="Move up"
            >
              <ha-icon icon="mdi:arrow-up"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${() => this._moveStepDown(index)}
              .disabled=${index === this._steps.length - 1}
              title="Move down"
            >
              <ha-icon icon="mdi:arrow-down"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${() => this._duplicateStep(step)}
              .disabled=${this._steps.length >= 20}
              title="Duplicate"
            >
              <ha-icon icon="mdi:content-copy"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${() => this._removeStep(step.id)}
              .disabled=${this._steps.length <= 1}
              title="Remove"
            >
              <ha-icon icon="mdi:delete"></ha-icon>
            </ha-icon-button>
          </div>
        </div>
        <div class="step-fields">
          <div class="step-field">
            <span class="step-field-label">Color Temperature (${step.color_temp}K)</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                color_temp: {
                  min_mireds: 153,
                  max_mireds: 370,
                },
              }}
              .value=${Math.round(1000000 / step.color_temp)}
              @value-changed=${(e: CustomEvent) => this._handleStepColorTempChange(step.id, e)}
            ></ha-selector>
          </div>
          <div class="step-field">
            <span class="step-field-label">Brightness (%)</span>
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
              .value=${step.brightness}
              @value-changed=${(e: CustomEvent) => this._handleStepFieldChange(step.id, 'brightness', e)}
            ></ha-selector>
          </div>
          <div class="step-field">
            <span class="step-field-label">Transition Time (seconds)</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                number: {
                  min: 0,
                  max: 60,
                  step: 0.5,
                  mode: 'box',
                  unit_of_measurement: 's',
                },
              }}
              .value=${step.transition}
              @value-changed=${(e: CustomEvent) => this._handleStepFieldChange(step.id, 'transition', e)}
            ></ha-selector>
          </div>
          <div class="step-field">
            <span class="step-field-label">Hold Time (seconds)</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                number: {
                  min: 0,
                  max: 300,
                  step: 1,
                  mode: 'box',
                  unit_of_measurement: 's',
                },
              }}
              .value=${step.hold}
              @value-changed=${(e: CustomEvent) => this._handleStepFieldChange(step.id, 'hold', e)}
            ></ha-selector>
          </div>
        </div>
      </div>
    `;
  }

  protected render() {
    return html`
      <div class="editor-content">
        <div class="form-row-pair">
          <div class="form-field">
            <span class="form-label">Name</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ text: {} }}
              .value=${this._name}
              @value-changed=${this._handleNameChange}
            ></ha-selector>
          </div>
          <div class="form-field">
            <span class="form-label">Icon</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ icon: {} }}
              .value=${this._icon}
              @value-changed=${this._handleIconChange}
            ></ha-selector>
          </div>
        </div>

        <div class="form-row-pair">
          <div class="form-field">
            <span class="form-label">Loop Mode</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                select: {
                  options: LOOP_MODES,
                  mode: 'dropdown',
                },
              }}
              .value=${this._loopMode}
              @value-changed=${this._handleLoopModeChange}
            ></ha-selector>
          </div>
          <div class="form-field">
            <span class="form-label">End Behavior</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                select: {
                  options: END_BEHAVIORS,
                  mode: 'dropdown',
                },
              }}
              .value=${this._endBehavior}
              @value-changed=${this._handleEndBehaviorChange}
            ></ha-selector>
          </div>
        </div>

        ${this._loopMode === 'loop'
          ? html`
              <div class="form-row">
                <span class="form-label">Loop Count</span>
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

        <div class="form-section">
          <span class="form-label">Steps (1-20)</span>
          <div class="step-list">
            ${this._steps.length === 0
              ? html`
                  <div class="empty-steps">
                    No steps defined. Click "Add Step" to create your first step.
                  </div>
                `
              : this._steps.map((step, index) => this._renderStep(step, index))}

            <button
              class="add-step-btn ${this._steps.length >= 20 ? 'disabled' : ''}"
              @click=${this._addStep}
              ?disabled=${this._steps.length >= 20}
            >
              <ha-icon icon="mdi:plus"></ha-icon>
              Add Step
            </button>
          </div>
        </div>

        ${this._hasIncompatibleEndpoints()
          ? html`
              <div class="error-warning">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                <span>One or more selected lights do not support color temperature control. CCT sequences require lights with color_temp capability. For T1M devices, select the white/CCT endpoint instead of the RGB ring endpoint.</span>
              </div>
            `
          : ''}

        ${!this.hasSelectedEntities
          ? html`
              <div class="preview-warning">
                <ha-icon icon="mdi:information"></ha-icon>
                <span>Select light entities in the Activate tab to preview sequences on your devices.</span>
              </div>
            `
          : ''}

        <div class="form-actions">
          <ha-button @click=${this._cancel}>Cancel</ha-button>
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
                  .disabled=${this._previewing || this._steps.length === 0 || !this.hasSelectedEntities || this._hasIncompatibleEndpoints()}
                  title=${!this.hasSelectedEntities ? 'Select entities in Activate tab first' : this._hasIncompatibleEndpoints() ? 'Selected light does not support color temperature' : ''}
                >
                  <ha-icon icon="mdi:play"></ha-icon>
                  Preview
                </ha-button>
              `}
          <ha-button
            @click=${this._save}
            .disabled=${!this._name.trim() || this._steps.length === 0 || this._saving}
          >
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
    'cct-sequence-editor': CCTSequenceEditor;
  }
}
