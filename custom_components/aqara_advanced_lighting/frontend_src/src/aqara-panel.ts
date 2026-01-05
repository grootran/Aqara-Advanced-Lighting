import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef, Ref } from 'lit/directives/ref.js';
import { panelStyles } from './styles';
import {
  HomeAssistant,
  PresetsData,
  FilteredPresets,
  DynamicEffectPreset,
  SegmentPatternPreset,
  CCTSequencePreset,
  SegmentSequencePreset,
  Favorite,
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
  @state() private _favorites: Favorite[] = [];
  @state() private _showFavoriteInput = false;
  @state() private _favoriteInputName = '';

  private _tileCardRef: Ref<HTMLElement> = createRef();
  private _tileCards: Map<string, any> = new Map();

  static styles = panelStyles;

  protected firstUpdated(): void {
    this._loadPresets();
    this._loadFavorites();
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    if (changedProps.has('hass') && changedProps.get('hass') === undefined) {
      // Initial hass load
      this._loadPresets();
      this._loadFavorites();
    }

    // Update tile card when selection or hass changes
    this._updateTileCard();
  }

  private async _updateTileCard(): Promise<void> {
    const container = this._tileCardRef.value;
    if (!container || !this.hass) {
      return;
    }

    // If no entities selected, clear all cards
    if (!this._selectedEntities.length) {
      this._tileCards.forEach((card) => card.remove());
      this._tileCards.clear();
      return;
    }

    // Wait for hui-tile-card to be defined
    await customElements.whenDefined('hui-tile-card');

    // Track which entities are currently selected
    const selectedSet = new Set(this._selectedEntities);

    // Remove cards for entities that are no longer selected
    for (const [entityId, card] of this._tileCards.entries()) {
      if (!selectedSet.has(entityId)) {
        card.remove();
        this._tileCards.delete(entityId);
      }
    }

    // Create or update cards for each selected entity
    for (const entityId of this._selectedEntities) {
      let card = this._tileCards.get(entityId);

      if (!card) {
        // Create new card for this entity
        card = document.createElement('hui-tile-card');
        container.appendChild(card);
        this._tileCards.set(entityId, card);
      }

      // Update the card config and hass
      try {
        card.setConfig({
          type: 'tile',
          entity: entityId,
          features: [{ type: 'light-brightness' }],
        });
        card.hass = this.hass;
      } catch (e) {
        console.warn('Failed to configure tile card for', entityId, ':', e);
      }
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

  private async _loadFavorites(): Promise<void> {
    if (!this.hass?.auth?.data?.access_token) {
      console.warn('No auth token available, skipping favorites load');
      return;
    }

    try {
      const response = await fetch('/api/aqara_advanced_lighting/favorites', {
        credentials: 'same-origin',
        headers: {
          Authorization: `Bearer ${this.hass.auth.data.access_token}`,
        },
      });
      if (!response.ok) {
        console.warn('Failed to load favorites:', response.status);
        return;
      }
      const data = await response.json();
      this._favorites = data.favorites || [];
    } catch (err) {
      console.warn('Failed to load favorites:', err);
    }
  }

  private _addFavorite(): void {
    if (!this._selectedEntities.length) return;

    // Set default name and show inline input
    const firstEntity = this._selectedEntities[0];
    const defaultName = this._selectedEntities.length === 1 && firstEntity
      ? this._getEntityFriendlyName(firstEntity)
      : `${this._selectedEntities.length} lights`;

    this._favoriteInputName = defaultName;
    this._showFavoriteInput = true;
  }

  private async _saveFavorite(): Promise<void> {
    if (!this._selectedEntities.length || !this.hass?.auth?.data?.access_token) {
      this._cancelFavoriteInput();
      return;
    }

    try {
      const response = await fetch('/api/aqara_advanced_lighting/favorites', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.hass.auth.data.access_token}`,
        },
        body: JSON.stringify({
          entities: this._selectedEntities,
          name: this._favoriteInputName || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      this._favorites = [...this._favorites, data.favorite];
    } catch (err) {
      console.error('Failed to add favorite:', err);
    }

    this._cancelFavoriteInput();
  }

  private _cancelFavoriteInput(): void {
    this._showFavoriteInput = false;
    this._favoriteInputName = '';
  }

  private _handleFavoriteNameChange(e: CustomEvent): void {
    this._favoriteInputName = e.detail.value || '';
  }

  private _handleFavoriteNameKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._saveFavorite();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this._cancelFavoriteInput();
    }
  }

  private async _removeFavorite(favoriteId: string): Promise<void> {
    if (!this.hass?.auth?.data?.access_token) {
      console.error('No auth token available');
      return;
    }

    try {
      const response = await fetch(`/api/aqara_advanced_lighting/favorites/${favoriteId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
          Authorization: `Bearer ${this.hass.auth.data.access_token}`,
        },
      });

      if (!response.ok && response.status !== 204) {
        throw new Error(`HTTP error ${response.status}`);
      }

      this._favorites = this._favorites.filter((f) => f.id !== favoriteId);
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  }

  private _selectFavorite(favorite: Favorite): void {
    this._selectedEntities = [...favorite.entities];
  }

  private _getEntityFriendlyName(entityId: string): string {
    if (!this.hass) return entityId;
    const state = this.hass.states[entityId];
    if (state && state.attributes.friendly_name) {
      return state.attributes.friendly_name as string;
    }
    return entityId.split('.')[1]?.replace(/_/g, ' ') || entityId;
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
          <div class="control-input target-input">
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
            ${hasSelection && !this._showFavoriteInput
              ? html`
                  <ha-icon-button
                    class="add-favorite-btn"
                    @click=${this._addFavorite}
                    title="Save as favorite"
                  >
                    <ha-icon icon="mdi:star-plus"></ha-icon>
                  </ha-icon-button>
                `
              : ''}
          </div>
        </div>

        ${this._showFavoriteInput
          ? html`
              <div class="control-row">
                <span class="control-label">Favorite Name</span>
                <div class="control-input favorite-input-container">
                  <ha-selector
                    .hass=${this.hass}
                    .selector=${{ text: {} }}
                    .value=${this._favoriteInputName}
                    @value-changed=${this._handleFavoriteNameChange}
                    @keydown=${this._handleFavoriteNameKeydown}
                  ></ha-selector>
                  <ha-button @click=${this._saveFavorite}>
                    <ha-icon icon="mdi:check"></ha-icon>
                    Save
                  </ha-button>
                  <ha-button @click=${this._cancelFavoriteInput}>
                    <ha-icon icon="mdi:close"></ha-icon>
                    Cancel
                  </ha-button>
                </div>
              </div>
            `
          : ''}

        ${this._favorites.length > 0
          ? html`
              <div class="control-row">
                <span class="control-label">Favorites</span>
                <div class="control-input favorites-container">
                  ${this._favorites.map(
                    (favorite) => html`
                      <div class="favorite-chip" @click=${() => this._selectFavorite(favorite)}>
                        <ha-icon icon="mdi:star" class="favorite-icon"></ha-icon>
                        <span class="favorite-name">${favorite.name}</span>
                        <ha-icon-button
                          class="remove-favorite-btn"
                          @click=${(e: Event) => {
                            e.stopPropagation();
                            this._removeFavorite(favorite.id);
                          }}
                          title="Remove favorite"
                        >
                          <ha-icon icon="mdi:close"></ha-icon>
                        </ha-icon-button>
                      </div>
                    `
                  )}
                </div>
              </div>
            `
          : ''}

        ${hasSelection
          ? html`
              <div class="control-row">
                <span class="control-label">Light Control</span>
                <div class="control-input light-tile-container" ${ref(this._tileCardRef)}>
                </div>
              </div>

              <div class="control-row">
                <span class="control-label">Quick Controls</span>
                <div class="control-input control-buttons">
                  ${filtered.showDynamicEffects
                    ? html`
                        <ha-button @click=${this._stopEffect}>
                          <ha-icon icon="mdi:stop"></ha-icon>
                          Effect
                        </ha-button>
                      `
                    : ''}
                  <ha-button @click=${this._pauseCCTSequence}>
                    <ha-icon icon="mdi:pause"></ha-icon>
                    CCT
                  </ha-button>
                  <ha-button @click=${this._resumeCCTSequence}>
                    <ha-icon icon="mdi:play"></ha-icon>
                    CCT
                  </ha-button>
                  <ha-button @click=${this._stopCCTSequence}>
                    <ha-icon icon="mdi:stop"></ha-icon>
                    CCT
                  </ha-button>
                  ${filtered.showSegmentSequences
                    ? html`
                        <ha-button @click=${this._pauseSegmentSequence}>
                          <ha-icon icon="mdi:pause"></ha-icon>
                          Segment
                        </ha-button>
                        <ha-button @click=${this._resumeSegmentSequence}>
                          <ha-icon icon="mdi:play"></ha-icon>
                          Segment
                        </ha-button>
                        <ha-button @click=${this._stopSegmentSequence}>
                          <ha-icon icon="mdi:stop"></ha-icon>
                          Segment
                        </ha-button>
                      `
                    : ''}
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
