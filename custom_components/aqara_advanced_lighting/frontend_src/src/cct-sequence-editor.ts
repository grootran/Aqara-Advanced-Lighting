import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, CCTSequenceStep, UserCCTSequencePreset, DeviceContext, CCTEditorDraft, Translations } from './types';
import { ReorderableStepsMixin, reorderableStepStyles } from './reorderable-steps-mixin';
import { editorFormStyles, localize } from './editor-constants';

interface EditableStep extends CCTSequenceStep {
  id: string;
}

@customElement('cct-sequence-editor')
export class CCTSequenceEditor extends ReorderableStepsMixin(LitElement) {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Object }) public preset?: UserCCTSequencePreset;
  @property({ type: Object }) public translations: Translations = {};
  @property({ type: Boolean }) public editMode = false;
  @property({ type: Boolean }) public hasSelectedEntities = false;
  @property({ type: Boolean }) public isCompatible = true;
  @property({ type: Array }) public selectedEntities: string[] = [];
  @property({ type: Boolean }) public previewActive = false;
  @property({ type: Object }) public deviceContext?: DeviceContext;
  @property({ type: Object }) public draft?: CCTEditorDraft;

  @state() private _name = '';
  @state() private _icon = '';
  @state() protected _steps: EditableStep[] = [];
  @state() private _loopMode = 'once';
  @state() private _loopCount = 3;
  @state() private _endBehavior = 'maintain';
  @state() private _saving = false;
  @state() private _previewing = false;
  @state() private _hasUserInteraction = false;

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
      { value: 'restore', label: this._localize('options.end_behavior_restore') },
    ];
  }

  static styles = [reorderableStepStyles, editorFormStyles, css`
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
      flex: 1;
      font-weight: 600;
      font-size: 14px;
      color: var(--primary-color);
    }

    .step-actions {
      display: flex;
      gap: 4px;
    }

    .step-actions ha-icon-button {
      --ha-icon-button-size: 32px;
      --mdc-icon-button-size: 32px;
      --mdc-icon-size: 18px;
    }

    .step-actions .step-delete {
      color: var(--secondary-text-color);
      transition: color 0.2s ease;
    }

    .step-actions .step-delete:hover:not([disabled]) {
      color: var(--error-color);
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
      .step-fields {
        grid-template-columns: 1fr;
      }
    }

    .form-hint {
      font-size: var(--ha-font-size-s, 12px);
      color: var(--secondary-text-color);
      margin-top: -4px;
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

    // Draft takes priority over preset (contains user's unsaved edits)
    if (changedProps.has('draft') && this.draft) {
      this._restoreDraft(this.draft);
    } else if (changedProps.has('preset') && this.preset) {
      this._hasUserInteraction = true;
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

  public getDraftState(): CCTEditorDraft {
    return {
      name: this._name,
      icon: this._icon,
      steps: this._steps.map(s => ({
        color_temp: s.color_temp,
        brightness: s.brightness,
        transition: s.transition,
        hold: s.hold,
      })),
      loopMode: this._loopMode,
      loopCount: this._loopCount,
      endBehavior: this._endBehavior,
      hasUserInteraction: this._hasUserInteraction,
    };
  }

  public resetToDefaults(): void {
    this._name = '';
    this._icon = '';
    this._loopMode = 'once';
    this._loopCount = 3;
    this._endBehavior = 'maintain';
    this._hasUserInteraction = false;
    this._addDefaultStep();
  }

  private _restoreDraft(draft: CCTEditorDraft): void {
    this._name = draft.name;
    this._icon = draft.icon;
    this._loopMode = draft.loopMode;
    this._loopCount = draft.loopCount;
    this._endBehavior = draft.endBehavior;
    this._steps = draft.steps.map((step, index) => ({
      ...step,
      id: `step-${index}-${Date.now()}`,
    }));
    this._hasUserInteraction = draft.hasUserInteraction ?? false;
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
    this._hasUserInteraction = true;
  }

  private _handleIconChange(e: CustomEvent): void {
    this._icon = e.detail.value || '';
    this._hasUserInteraction = true;
  }

  private _handleLoopModeChange(e: CustomEvent): void {
    this._loopMode = e.detail.value || 'once';
    this._hasUserInteraction = true;
  }

  private _handleLoopCountChange(e: CustomEvent): void {
    this._loopCount = e.detail.value ?? 3;
    this._hasUserInteraction = true;
  }

  private _handleEndBehaviorChange(e: CustomEvent): void {
    this._endBehavior = e.detail.value || 'maintain';
    this._hasUserInteraction = true;
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
    this._hasUserInteraction = true;
  }

  private _handleStepColorTempChange(stepId: string, e: CustomEvent): void {
    const kelvin = Math.round(e.detail.value / 100) * 100;
    this._steps = this._steps.map((step) =>
      step.id === stepId ? { ...step, color_temp: kelvin } : step
    );
    this._hasUserInteraction = true;
  }

  private _addStep(): void {
    if (this._steps.length >= 20) return;

    const previousStep = this._steps[this._steps.length - 1];

    const newStep: EditableStep = {
      id: this._generateStepId(),
      color_temp: previousStep?.color_temp ?? 4000,
      brightness: previousStep?.brightness ?? 50,
      transition: previousStep?.transition ?? 15,
      hold: previousStep?.hold ?? 60,
    };

    this._steps = [...this._steps, newStep];
    this._hasUserInteraction = true;
  }

  private _removeStep(stepId: string): void {
    if (this._steps.length <= 1) return;
    this._steps = this._steps.filter((s) => s.id !== stepId);
    this._hasUserInteraction = true;
  }

  private _moveStepUp(index: number): void {
    if (index <= 0) return;
    const newSteps = [...this._steps];
    const temp = newSteps[index - 1]!;
    newSteps[index - 1] = newSteps[index]!;
    newSteps[index] = temp;
    this._steps = newSteps;
    this._hasUserInteraction = true;
  }

  private _moveStepDown(index: number): void {
    if (index >= this._steps.length - 1) return;
    const newSteps = [...this._steps];
    const temp = newSteps[index]!;
    newSteps[index] = newSteps[index + 1]!;
    newSteps[index + 1] = temp;
    this._steps = newSteps;
    this._hasUserInteraction = true;
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
    this._hasUserInteraction = true;
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

    if (this._loopMode === 'count') {
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
    this._hasUserInteraction = false;
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
          ${this._renderDragHandle(index)}
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
              class="step-delete"
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
            <span class="step-field-label">${this._localize('editors.color_temperature_label', { value: step.color_temp.toString() })}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                color_temp: {
                  unit: 'kelvin',
                  min: 2700,
                  max: 6500,
                },
              }}
              .value=${step.color_temp}
              @value-changed=${(e: CustomEvent) => this._handleStepColorTempChange(step.id, e)}
            ></ha-selector>
          </div>
          <div class="step-field">
            <span class="step-field-label">${this._localize('editors.brightness_percent_label')}</span>
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
            <span class="step-field-label">${this._localize('editors.transition_time_label')}</span>
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
              .value=${step.transition}
              @value-changed=${(e: CustomEvent) => this._handleStepFieldChange(step.id, 'transition', e)}
            ></ha-selector>
          </div>
          <div class="step-field">
            <span class="step-field-label">${this._localize('editors.hold_time_label')}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                number: {
                  min: 0,
                  max: 43200,
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

  private _localize(key: string, replacements?: Record<string, string>): string {
    return localize(this.translations, key, replacements);
  }

  protected render() {
    return html`
      <div class="editor-content">
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

        <div class="form-section">
          <span class="form-label">${this._localize('editors.steps_label')}</span>
          <div class="step-list">
            ${this._steps.length === 0
              ? html`
                  <div class="empty-steps">
                    ${this._localize('editors.no_steps_message')}
                  </div>
                `
              : this._steps.map((step, index) => html`
                  ${this._renderDropIndicator(index)}
                  ${this._renderStep(step, index)}
                `)}
            ${this._renderDropIndicator(this._steps.length)}

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

        ${this._hasIncompatibleEndpoints()
          ? html`
              <div class="error-warning">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                <span>${this._localize('editors.incompatible_cct_endpoints')}</span>
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
                  .disabled=${this._previewing || this._steps.length === 0 || !this.hasSelectedEntities || !this.isCompatible || this._hasIncompatibleEndpoints()}
                  title=${!this.hasSelectedEntities ? this._localize('editors.tooltip_select_lights_first') : !this.isCompatible ? this._localize('editors.tooltip_light_not_compatible') : this._hasIncompatibleEndpoints() ? this._localize('editors.tooltip_light_no_cct') : ''}
                >
                  <ha-icon icon="mdi:play"></ha-icon>
                  <span class="btn-text">${this._localize('editors.preview_button')}</span>
                </ha-button>
              `}
          <ha-button
            @click=${this._save}
            .disabled=${!this._name.trim() || this._steps.length === 0 || this._saving}
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
    'cct-sequence-editor': CCTSequenceEditor;
  }
}
