import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { panelStyles } from './styles';
import {
  HomeAssistant,
  PresetsData,
  FilteredPresets,
  DynamicEffectPreset,
  SegmentPatternPreset,
  CCTSequencePreset,
  SegmentSequencePreset,
} from './types';

@customElement('aqara-advanced-lighting-panel')
export class AqaraPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Boolean }) public narrow = false;

  @state() private _presets?: PresetsData;
  @state() private _loading = true;
  @state() private _error?: string;
  @state() private _selectedEntities: string[] = [];
  @state() private _brightness = 100;
  @state() private _useCustomBrightness = false;
  @state() private _collapsed: Record<string, boolean> = {};
  @state() private _hasIncompatibleLights = false;

  static styles = panelStyles;

  protected firstUpdated(): void {
    this._loadPresets();
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    if (changedProps.has('hass') && changedProps.get('hass') === undefined) {
      // Initial hass load
      this._loadPresets();
    }
  }

  private async _loadPresets(): Promise<void> {
    try {
      const response = await fetch('/api/aqara_advanced_lighting/presets');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      this._presets = await response.json();
      this._loading = false;
    } catch (err) {
      this._error = err instanceof Error ? err.message : 'Failed to load presets';
      this._loading = false;
    }
  }

  private _getSelectedDeviceTypes(): string[] {
    if (!this._selectedEntities.length || !this.hass) {
      this._hasIncompatibleLights = false;
      return [];
    }

    const deviceTypes = new Set<string>();
    let hasIncompatible = false;

    for (const entityId of this._selectedEntities) {
      const entity = this.hass.states[entityId];
      if (!entity) {
        continue;
      }

      // Try to detect device type from effect_list (Zigbee2MQTT doesn't expose model in entity attributes)
      const effectList = entity.attributes.effect_list as string[] | undefined;

      if (effectList && Array.isArray(effectList)) {
        // Unique effects per device type:
        // T1M: flow1, flow2, rolling
        // T1 Strip: rainbow1, rainbow2, chasing, flicker, dash
        // T2 Bulb: candlelight

        if (effectList.includes('flow1') || effectList.includes('flow2') || effectList.includes('rolling')) {
          deviceTypes.add('t1m');
        } else if (effectList.includes('rainbow1') || effectList.includes('rainbow2') || effectList.includes('chasing') || effectList.includes('flicker') || effectList.includes('dash')) {
          deviceTypes.add('t1_strip');
        } else if (effectList.includes('candlelight')) {
          deviceTypes.add('t2_bulb');
        } else {
          // Unknown device with effects - mark as incompatible
          hasIncompatible = true;
        }
      } else if (!effectList && entity.attributes.color_temp !== undefined) {
        // CCT-only light (no RGB effects)
        deviceTypes.add('t2_cct');
      } else {
        // No effect list and no detection possible - incompatible
        hasIncompatible = true;
      }
    }

    this._hasIncompatibleLights = hasIncompatible;
    return Array.from(deviceTypes);
  }

  private _filterPresets(): FilteredPresets {
    const deviceTypes = this._getSelectedDeviceTypes();
    const hasSelection = deviceTypes.length > 0;

    // Determine what sections to show
    const hasT2 = deviceTypes.includes('t2_bulb');
    const hasT1M = deviceTypes.includes('t1m');
    const hasT1Strip = deviceTypes.includes('t1_strip');

    const showDynamicEffects = hasSelection && (hasT2 || hasT1M || hasT1Strip);
    const showSegmentPatterns = hasSelection && (hasT1M || hasT1Strip);
    const showCCTSequences = hasSelection; // All lights support CCT
    const showSegmentSequences = hasSelection && (hasT1M || hasT1Strip);

    return {
      showDynamicEffects,
      showSegmentPatterns,
      showCCTSequences,
      showSegmentSequences,
      t2Presets: hasT2 ? (this._presets?.dynamic_effects.t2_bulb || []) : [],
      t1mPresets: hasT1M ? (this._presets?.dynamic_effects.t1m || []) : [],
      t1StripPresets: hasT1Strip ? (this._presets?.dynamic_effects.t1_strip || []) : [],
    };
  }

  private _handleEntityChange(e: CustomEvent): void {
    const value = e.detail.value;
    // Handle both single entity and multiple entities
    if (typeof value === 'string') {
      this._selectedEntities = value ? [value] : [];
    } else if (Array.isArray(value)) {
      this._selectedEntities = value;
    } else {
      this._selectedEntities = [];
    }
  }

  private _handleBrightnessChange(e: CustomEvent): void {
    this._brightness = e.detail.value;
  }

  private _handleCustomBrightnessToggle(e: CustomEvent): void {
    this._useCustomBrightness = e.detail.value;
  }

  private _toggleSection(section: string): void {
    this._collapsed = {
      ...this._collapsed,
      [section]: !this._collapsed[section],
    };
  }

  private async _activateDynamicEffect(preset: DynamicEffectPreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    const serviceData: any = {
      entity_id: this._selectedEntities,
      preset: preset.id,
      turn_on: true,
      sync: true,
    };

    // Only include brightness if custom brightness is enabled
    if (this._useCustomBrightness) {
      serviceData.brightness = this._brightness;
    }

    await this.hass.callService('aqara_advanced_lighting', 'set_dynamic_effect', serviceData);
  }

  private async _activateSegmentPattern(preset: SegmentPatternPreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    const serviceData: any = {
      entity_id: this._selectedEntities,
      preset: preset.id,
      turn_on: true,
      sync: true,
    };

    // Only include brightness if custom brightness is enabled
    if (this._useCustomBrightness) {
      serviceData.brightness = this._brightness;
    }

    await this.hass.callService('aqara_advanced_lighting', 'set_segment_pattern', serviceData);
  }

  private async _activateCCTSequence(preset: CCTSequencePreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'start_cct_sequence', {
      entity_id: this._selectedEntities,
      preset: preset.id,
      turn_on: true,
      sync: true,
    });
  }

  private async _activateSegmentSequence(preset: SegmentSequencePreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'start_segment_sequence', {
      entity_id: this._selectedEntities,
      preset: preset.id,
      turn_on: true,
      sync: true,
    });
  }

  private async _stopEffect(): Promise<void> {
    if (!this._selectedEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'stop_effect', {
      entity_id: this._selectedEntities,
      restore_state: true,
    });
  }

  private async _pauseCCTSequence(): Promise<void> {
    if (!this._selectedEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'pause_cct_sequence', {
      entity_id: this._selectedEntities,
    });
  }

  private async _resumeCCTSequence(): Promise<void> {
    if (!this._selectedEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'resume_cct_sequence', {
      entity_id: this._selectedEntities,
    });
  }

  private async _stopCCTSequence(): Promise<void> {
    if (!this._selectedEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'stop_cct_sequence', {
      entity_id: this._selectedEntities,
    });
  }

  private async _pauseSegmentSequence(): Promise<void> {
    if (!this._selectedEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'pause_segment_sequence', {
      entity_id: this._selectedEntities,
    });
  }

  private async _resumeSegmentSequence(): Promise<void> {
    if (!this._selectedEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'resume_segment_sequence', {
      entity_id: this._selectedEntities,
    });
  }

  private async _stopSegmentSequence(): Promise<void> {
    if (!this._selectedEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'stop_segment_sequence', {
      entity_id: this._selectedEntities,
    });
  }

  protected render() {
    if (this._loading) {
      return html`<div class="loading">Loading presets...</div>`;
    }

    if (this._error) {
      return html`<div class="error">Error: ${this._error}</div>`;
    }

    if (!this._presets) {
      return html`<div class="error">No presets available</div>`;
    }

    const filtered = this._filterPresets();
    const hasSelection = this._selectedEntities.length > 0;

    return html`
      <div class="panel-header">
        <h1 class="panel-title">Aqara Advanced Lighting</h1>
      </div>

      <div class="controls">
        <div class="control-row">
          <span class="control-label">Target</span>
          <div class="control-input">
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                entity: {
                  multiple: true,
                  filter: { domain: 'light' },
                },
              }}
              .value=${this._selectedEntities}
              @value-changed=${this._handleEntityChange}
            ></ha-selector>
          </div>
        </div>

        <div class="control-row">
          <span class="control-label">Custom Brightness</span>
          <div class="control-input">
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                boolean: {},
              }}
              .value=${this._useCustomBrightness}
              @value-changed=${this._handleCustomBrightnessToggle}
            ></ha-selector>
          </div>
        </div>

        ${this._useCustomBrightness
          ? html`
              <div class="control-row">
                <span class="control-label">Brightness</span>
                <div class="control-input">
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
            `
          : ''}

        ${hasSelection
          ? html`
              <div class="control-row">
                <span class="control-label">Quick Controls</span>
                <div class="control-input control-buttons">
                  <ha-button @click=${this._stopEffect}>
                    <ha-icon icon="mdi:stop"></ha-icon>
                    Stop Effect
                  </ha-button>
                  <ha-button @click=${this._pauseCCTSequence}>
                    <ha-icon icon="mdi:pause"></ha-icon>
                    Pause CCT
                  </ha-button>
                  <ha-button @click=${this._resumeCCTSequence}>
                    <ha-icon icon="mdi:play"></ha-icon>
                    Resume CCT
                  </ha-button>
                  <ha-button @click=${this._stopCCTSequence}>
                    <ha-icon icon="mdi:stop"></ha-icon>
                    Stop CCT
                  </ha-button>
                  <ha-button @click=${this._pauseSegmentSequence}>
                    <ha-icon icon="mdi:pause"></ha-icon>
                    Pause Segment
                  </ha-button>
                  <ha-button @click=${this._resumeSegmentSequence}>
                    <ha-icon icon="mdi:play"></ha-icon>
                    Resume Segment
                  </ha-button>
                  <ha-button @click=${this._stopSegmentSequence}>
                    <ha-icon icon="mdi:stop"></ha-icon>
                    Stop Segment
                  </ha-button>
                </div>
              </div>
            `
          : ''}
      </div>

      ${!hasSelection
        ? html`<div class="no-lights">Please select one or more lights to view available presets</div>`
        : ''}

      ${this._hasIncompatibleLights
        ? html`<div class="error">Incompatible light selected. Please select a compatible Aqara light (T1, T1M, T1 Strip, or T2 Bulb).</div>`
        : ''}

      ${filtered.showDynamicEffects && !this._hasIncompatibleLights
        ? html`
            ${filtered.t2Presets.length > 0
              ? this._renderDynamicEffectsSection('T2 Bulb', filtered.t2Presets)
              : ''}
            ${filtered.t1mPresets.length > 0
              ? this._renderDynamicEffectsSection('T1M', filtered.t1mPresets)
              : ''}
            ${filtered.t1StripPresets.length > 0
              ? this._renderDynamicEffectsSection('T1 Strip', filtered.t1StripPresets)
              : ''}
          `
        : ''}

      ${filtered.showSegmentPatterns && this._presets.segment_patterns.length > 0 && !this._hasIncompatibleLights
        ? this._renderSegmentPatternsSection()
        : ''}

      ${filtered.showCCTSequences && this._presets.cct_sequences.length > 0 && !this._hasIncompatibleLights
        ? this._renderCCTSequencesSection()
        : ''}

      ${filtered.showSegmentSequences && this._presets.segment_sequences.length > 0 && !this._hasIncompatibleLights
        ? this._renderSegmentSequencesSection()
        : ''}
    `;
  }

  private _renderDynamicEffectsSection(title: string, presets: DynamicEffectPreset[]) {
    const sectionId = `dynamic_${title.toLowerCase().replace(/\s+/g, '_')}`;
    const isCollapsed = this._collapsed[sectionId];

    return html`
      <div class="section">
        <div class="section-header" @click=${() => this._toggleSection(sectionId)}>
          <div>
            <div class="section-title">Dynamic Effects: ${title}</div>
            <div class="section-subtitle">${presets.length} presets</div>
          </div>
          <ha-icon .icon=${isCollapsed ? 'mdi:chevron-down' : 'mdi:chevron-up'}></ha-icon>
        </div>
        <div class="section-content ${isCollapsed ? 'collapsed' : ''}">
          ${presets.map(
            (preset) => html`
              <div class="preset-button" @click=${() => this._activateDynamicEffect(preset)}>
                <div class="preset-icon">
                  ${this._renderPresetIcon(preset.icon, 'mdi:lightbulb-on')}
                </div>
                <div class="preset-name">${preset.name}</div>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }

  private _renderSegmentPatternsSection() {
    const sectionId = 'segment_patterns';
    const isCollapsed = this._collapsed[sectionId];

    return html`
      <div class="section">
        <div class="section-header" @click=${() => this._toggleSection(sectionId)}>
          <div>
            <div class="section-title">Segment Patterns</div>
            <div class="section-subtitle">${this._presets!.segment_patterns.length} presets</div>
          </div>
          <ha-icon .icon=${isCollapsed ? 'mdi:chevron-down' : 'mdi:chevron-up'}></ha-icon>
        </div>
        <div class="section-content ${isCollapsed ? 'collapsed' : ''}">
          ${this._presets!.segment_patterns.map(
            (preset) => html`
              <div class="preset-button" @click=${() => this._activateSegmentPattern(preset)}>
                <div class="preset-icon">
                  ${this._renderPresetIcon(preset.icon, 'mdi:palette')}
                </div>
                <div class="preset-name">${preset.name}</div>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }

  private _renderPresetIcon(icon: string | undefined, fallbackIcon: string) {
    if (!icon) {
      return html`<ha-icon icon="${fallbackIcon}"></ha-icon>`;
    }

    // Check if it's a custom icon file (has file extension)
    if (icon.includes('.')) {
      return html`<img src="/api/aqara_advanced_lighting/icons/${icon}" alt="preset icon" />`;
    }

    // Otherwise treat as MDI icon
    return html`<ha-icon icon="${icon}"></ha-icon>`;
  }

  private _renderCCTSequencesSection() {
    const sectionId = 'cct_sequences';
    const isCollapsed = this._collapsed[sectionId];

    return html`
      <div class="section">
        <div class="section-header" @click=${() => this._toggleSection(sectionId)}>
          <div>
            <div class="section-title">CCT Sequences</div>
            <div class="section-subtitle">${this._presets!.cct_sequences.length} presets</div>
          </div>
          <ha-icon .icon=${isCollapsed ? 'mdi:chevron-down' : 'mdi:chevron-up'}></ha-icon>
        </div>
        <div class="section-content ${isCollapsed ? 'collapsed' : ''}">
          ${this._presets!.cct_sequences.map(
            (preset) => html`
              <div class="preset-button" @click=${() => this._activateCCTSequence(preset)}>
                <div class="preset-icon">
                  ${this._renderPresetIcon(preset.icon, 'mdi:temperature-kelvin')}
                </div>
                <div class="preset-name">${preset.name}</div>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }

  private _renderSegmentSequencesSection() {
    const sectionId = 'segment_sequences';
    const isCollapsed = this._collapsed[sectionId];

    return html`
      <div class="section">
        <div class="section-header" @click=${() => this._toggleSection(sectionId)}>
          <div>
            <div class="section-title">Segment Sequences</div>
            <div class="section-subtitle">${this._presets!.segment_sequences.length} presets</div>
          </div>
          <ha-icon .icon=${isCollapsed ? 'mdi:chevron-down' : 'mdi:chevron-up'}></ha-icon>
        </div>
        <div class="section-content ${isCollapsed ? 'collapsed' : ''}">
          ${this._presets!.segment_sequences.map(
            (preset) => html`
              <div class="preset-button" @click=${() => this._activateSegmentSequence(preset)}>
                <div class="preset-icon">
                  ${this._renderPresetIcon(preset.icon, 'mdi:animation-play')}
                </div>
                <div class="preset-name">${preset.name}</div>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aqara-advanced-lighting-panel': AqaraPanel;
  }
}
