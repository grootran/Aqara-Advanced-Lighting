import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef, Ref } from 'lit/directives/ref.js';
import { panelStyles } from './styles';
import { xyToRgb } from './color-utils';
import {
  HomeAssistant,
  PresetsData,
  FilteredPresets,
  DynamicEffectPreset,
  SegmentPatternPreset,
  CCTSequencePreset,
  SegmentSequencePreset,
  Favorite,
  PanelTab,
  UserPresetsData,
  UserEffectPreset,
  UserSegmentPatternPreset,
  UserCCTSequencePreset,
  UserSegmentSequencePreset,
  PresetSortOption,
  PresetSortPreferences,
} from './types';
import './effect-editor';
import './pattern-editor';
import './cct-sequence-editor';
import './segment-sequence-editor';

@customElement('aqara-advanced-lighting-panel')
export class AqaraPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Boolean, reflect: true }) public narrow = false;

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
  @state() private _activeTab: PanelTab = 'activate';
  @state() private _userPresets?: UserPresetsData;
  @state() private _editingPreset?: { type: string; preset: UserEffectPreset | UserSegmentPatternPreset | UserCCTSequencePreset | UserSegmentSequencePreset };
  @state() private _effectPreviewActive = false;
  @state() private _cctPreviewActive = false;
  @state() private _segmentSequencePreviewActive = false;
  @state() private _sortPreferences: PresetSortPreferences = {
    effects: 'name-asc',
    patterns: 'name-asc',
    cct: 'name-asc',
    segments: 'name-asc',
  };

  private _tileCardRef: Ref<HTMLElement> = createRef();
  private _tileCards: Map<string, any> = new Map();

  static styles = panelStyles;

  protected firstUpdated(): void {
    this._loadPresets();
    this._loadFavorites();
    this._loadUserPresets();
    this._loadSortPreferences();
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    if (changedProps.has('hass') && changedProps.get('hass') === undefined) {
      // Initial hass load
      this._loadPresets();
      this._loadFavorites();
      this._loadUserPresets();
    }

    // Update tile card when selection or hass changes
    this._updateTileCard();
  }

  private async _updateTileCard(): Promise<void> {
    const container = this._tileCardRef.value;
    if (!container || !this.hass) {
      // Container not available (probably on a different tab), clear orphaned card references
      if (this._tileCards.size > 0) {
        this._tileCards.clear();
      }
      return;
    }

    // If no entities selected, clear all cards
    if (!this._selectedEntities.length) {
      this._tileCards.forEach((card) => {
        if (card.parentElement) {
          card.remove();
        }
      });
      this._tileCards.clear();
      return;
    }

    // Wait for hui-tile-card to be defined
    await customElements.whenDefined('hui-tile-card');

    // Track which entities are currently selected
    const selectedSet = new Set(this._selectedEntities);

    // Remove cards for entities that are no longer selected or orphaned
    for (const [entityId, card] of this._tileCards.entries()) {
      if (!selectedSet.has(entityId) || card.parentElement !== container) {
        if (card.parentElement) {
          card.remove();
        }
        this._tileCards.delete(entityId);
      }
    }

    // Create or update cards for each selected entity
    for (const entityId of this._selectedEntities) {
      let card = this._tileCards.get(entityId);

      // Check if card exists and is attached to the current container
      if (!card || card.parentElement !== container) {
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

  private async _loadUserPresets(): Promise<void> {
    if (!this.hass?.auth?.data?.access_token) {
      console.warn('No auth token available, skipping user presets load');
      return;
    }

    try {
      const response = await fetch('/api/aqara_advanced_lighting/user_presets', {
        credentials: 'same-origin',
        headers: {
          Authorization: `Bearer ${this.hass.auth.data.access_token}`,
        },
      });
      if (!response.ok) {
        console.warn('Failed to load user presets:', response.status);
        return;
      }
      this._userPresets = await response.json();
    } catch (err) {
      console.warn('Failed to load user presets:', err);
    }
  }

  private _loadSortPreferences(): void {
    try {
      const stored = localStorage.getItem('aqara_lighting_sort_preferences');
      if (stored) {
        const parsed = JSON.parse(stored) as PresetSortPreferences;
        this._sortPreferences = {
          effects: parsed.effects || 'name-asc',
          patterns: parsed.patterns || 'name-asc',
          cct: parsed.cct || 'name-asc',
          segments: parsed.segments || 'name-asc',
        };
      }
    } catch (err) {
      console.warn('Failed to load sort preferences:', err);
    }
  }

  private _saveSortPreferences(): void {
    try {
      localStorage.setItem('aqara_lighting_sort_preferences', JSON.stringify(this._sortPreferences));
    } catch (err) {
      console.warn('Failed to save sort preferences:', err);
    }
  }

  private _setSortPreference(category: keyof PresetSortPreferences, value: PresetSortOption): void {
    this._sortPreferences = {
      ...this._sortPreferences,
      [category]: value,
    };
    this._saveSortPreferences();
  }

  // Sorting utility functions
  private _sortUserEffectPresets(presets: UserEffectPreset[], sortOption: PresetSortOption): UserEffectPreset[] {
    const sorted = [...presets];
    switch (sortOption) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'date-new':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'date-old':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      default:
        return sorted;
    }
  }

  private _sortUserPatternPresets(presets: UserSegmentPatternPreset[], sortOption: PresetSortOption): UserSegmentPatternPreset[] {
    const sorted = [...presets];
    switch (sortOption) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'date-new':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'date-old':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      default:
        return sorted;
    }
  }

  private _sortUserCCTSequencePresets(presets: UserCCTSequencePreset[], sortOption: PresetSortOption): UserCCTSequencePreset[] {
    const sorted = [...presets];
    switch (sortOption) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'date-new':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'date-old':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      default:
        return sorted;
    }
  }

  private _sortUserSegmentSequencePresets(presets: UserSegmentSequencePreset[], sortOption: PresetSortOption): UserSegmentSequencePreset[] {
    const sorted = [...presets];
    switch (sortOption) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'date-new':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'date-old':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      default:
        return sorted;
    }
  }

  private _sortDynamicEffectPresets(presets: DynamicEffectPreset[], sortOption: PresetSortOption): DynamicEffectPreset[] {
    const sorted = [...presets];
    switch (sortOption) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      // Built-in presets don't have dates, so fall back to name sort
      case 'date-new':
      case 'date-old':
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  private _sortSegmentPatternPresets(presets: SegmentPatternPreset[], sortOption: PresetSortOption): SegmentPatternPreset[] {
    const sorted = [...presets];
    switch (sortOption) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      // Built-in presets don't have dates
      case 'date-new':
      case 'date-old':
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  private _sortCCTSequencePresets(presets: CCTSequencePreset[], sortOption: PresetSortOption): CCTSequencePreset[] {
    const sorted = [...presets];
    switch (sortOption) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      // Built-in presets don't have dates
      case 'date-new':
      case 'date-old':
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  private _sortSegmentSequencePresets(presets: SegmentSequencePreset[], sortOption: PresetSortOption): SegmentSequencePreset[] {
    const sorted = [...presets];
    switch (sortOption) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      // Built-in presets don't have dates
      case 'date-new':
      case 'date-old':
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  private async _saveUserPreset(type: string, data: Record<string, unknown>): Promise<void> {
    if (!this.hass?.auth?.data?.access_token) {
      console.error('No auth token available');
      return;
    }

    try {
      const response = await fetch('/api/aqara_advanced_lighting/user_presets', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.hass.auth.data.access_token}`,
        },
        body: JSON.stringify({ type, data }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      await this._loadUserPresets();
    } catch (err) {
      console.error('Failed to save user preset:', err);
    }
  }

  private async _updateUserPreset(type: string, id: string, data: Record<string, unknown>): Promise<void> {
    if (!this.hass?.auth?.data?.access_token) {
      console.error('No auth token available');
      return;
    }

    try {
      const response = await fetch(`/api/aqara_advanced_lighting/user_presets/${type}/${id}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.hass.auth.data.access_token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      await this._loadUserPresets();
    } catch (err) {
      console.error('Failed to update user preset:', err);
    }
  }

  private async _deleteUserPreset(type: string, id: string): Promise<void> {
    if (!this.hass?.auth?.data?.access_token) {
      console.error('No auth token available');
      return;
    }

    try {
      const response = await fetch(`/api/aqara_advanced_lighting/user_presets/${type}/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
          Authorization: `Bearer ${this.hass.auth.data.access_token}`,
        },
      });
      if (!response.ok && response.status !== 204) {
        throw new Error(`HTTP error ${response.status}`);
      }
      await this._loadUserPresets();
    } catch (err) {
      console.error('Failed to delete user preset:', err);
    }
  }

  private _setActiveTab(tab: PanelTab): void {
    this._activeTab = tab;
  }

  private _handleTabChange(ev: CustomEvent<{ name: string }>): void {
    const newTab = ev.detail.name as PanelTab;
    if (!newTab) {
      return;
    }
    if (newTab !== this._activeTab) {
      this._activeTab = newTab;
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

  private _getT1StripSegmentCount(): number {
    // Default to 50 segments (10 meters max)
    const defaultSegments = 50;

    if (!this._selectedEntities.length || !this.hass) {
      return defaultSegments;
    }

    // Look for T1 Strip entities and get the "length" attribute
    for (const entityId of this._selectedEntities) {
      const entity = this.hass.states[entityId];
      if (!entity) continue;

      // Check if this is a T1 Strip by looking at effect_list
      const effectList = entity.attributes.effect_list as string[] | undefined;
      if (effectList && Array.isArray(effectList)) {
        if (effectList.includes('rainbow1') || effectList.includes('rainbow2') || effectList.includes('chasing') || effectList.includes('flicker') || effectList.includes('dash')) {
          // This is a T1 Strip - try to get the length
          let lengthMeters: number | undefined;

          // Method 1: Check direct attribute on light entity
          const attrLength = entity.attributes.length as number | undefined;
          if (attrLength && typeof attrLength === 'number' && attrLength > 0) {
            lengthMeters = attrLength;
          }

          // Method 2: Look for separate length entity (number.xxx_length or sensor.xxx_length)
          if (lengthMeters === undefined) {
            const baseName = entityId.split('.')[1] || '';
            for (const domain of ['number', 'sensor']) {
              const lengthEntityId = `${domain}.${baseName}_length`;
              const lengthEntity = this.hass.states[lengthEntityId];
              if (lengthEntity && lengthEntity.state && lengthEntity.state !== 'unknown' && lengthEntity.state !== 'unavailable') {
                const parsed = parseFloat(lengthEntity.state);
                if (!isNaN(parsed) && parsed > 0) {
                  lengthMeters = parsed;
                  break;
                }
              }
            }
          }

          if (lengthMeters !== undefined && lengthMeters > 0) {
            // 5 segments per meter
            return Math.round(lengthMeters * 5);
          }
        }
      }
    }

    return defaultSegments;
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

  private _handleTargetChanged(e: CustomEvent): void {
    const value = e.detail.value;
    if (!value) {
      this._selectedEntities = [];
      return;
    }

    // Target selector returns { entity_id: string | string[], device_id?: ..., area_id?: ... }
    const entityIds = value.entity_id;
    if (!entityIds) {
      this._selectedEntities = [];
      return;
    }

    // Normalize to array
    if (Array.isArray(entityIds)) {
      this._selectedEntities = entityIds;
    } else {
      this._selectedEntities = [entityIds];
    }
  }

  private _handleBrightnessChange(e: CustomEvent): void {
    this._brightness = e.detail.value;
  }

  private _handleCustomBrightnessToggle(e: Event): void {
    this._useCustomBrightness = (e.target as HTMLInputElement).checked;
  }

  private _handleExpansionChange(sectionId: string, e: CustomEvent): void {
    const expanded = e.detail.expanded;
    this._collapsed = {
      ...this._collapsed,
      [sectionId]: !expanded,
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

  // Filter user effect presets for a specific device type section
  private _getUserEffectPresetsForDeviceType(deviceType: string): UserEffectPreset[] {
    if (!this._userPresets?.effect_presets) return [];

    return this._userPresets.effect_presets.filter((preset) => {
      // If preset has no device_type, show in all sections
      if (!preset.device_type) return true;
      // Match t1 and t1m presets
      if (deviceType === 't1m' && (preset.device_type === 't1' || preset.device_type === 't1m')) {
        return true;
      }
      return preset.device_type === deviceType;
    });
  }

  private _getFilteredUserPatternPresets(): UserSegmentPatternPreset[] {
    if (!this._userPresets?.segment_pattern_presets) return [];
    const deviceTypes = this._getSelectedDeviceTypes();
    if (deviceTypes.length === 0) return [];

    // Patterns only apply to T1, T1M, and T1 Strip
    const hasSegmentDevice = deviceTypes.includes('t1m') || deviceTypes.includes('t1_strip');
    if (!hasSegmentDevice) return [];

    return this._userPresets.segment_pattern_presets.filter((preset) => {
      if (!preset.device_type) return true;
      if (preset.device_type === 't1' || preset.device_type === 't1m') {
        return deviceTypes.includes('t1m');
      }
      return deviceTypes.includes(preset.device_type);
    });
  }

  private _getFilteredUserCCTSequencePresets(): UserCCTSequencePreset[] {
    if (!this._userPresets?.cct_sequence_presets) return [];
    const deviceTypes = this._getSelectedDeviceTypes();
    // CCT sequences apply to all lights
    return deviceTypes.length > 0 ? this._userPresets.cct_sequence_presets : [];
  }

  private _getFilteredUserSegmentSequencePresets(): UserSegmentSequencePreset[] {
    if (!this._userPresets?.segment_sequence_presets) return [];
    const deviceTypes = this._getSelectedDeviceTypes();
    if (deviceTypes.length === 0) return [];

    // Segment sequences only apply to T1, T1M, and T1 Strip
    const hasSegmentDevice = deviceTypes.includes('t1m') || deviceTypes.includes('t1_strip');
    if (!hasSegmentDevice) return [];

    return this._userPresets.segment_sequence_presets.filter((preset) => {
      if (!preset.device_type) return true;
      if (preset.device_type === 't1' || preset.device_type === 't1m') {
        return deviceTypes.includes('t1m');
      }
      return deviceTypes.includes(preset.device_type);
    });
  }

  // Activate user presets
  private async _activateUserEffectPreset(preset: UserEffectPreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    const serviceData: Record<string, unknown> = {
      entity_id: this._selectedEntities,
      effect: preset.effect,
      speed: preset.effect_speed,
      turn_on: true,
      sync: true,
    };

    // Add individual color parameters (color_1, color_2, etc.) as XY colors
    preset.effect_colors.forEach((c, index) => {
      if (index < 8) {
        serviceData[`color_${index + 1}`] = { x: c.x, y: c.y };
      }
    });

    if (preset.effect_brightness !== undefined) {
      serviceData.brightness = preset.effect_brightness;
    } else if (this._useCustomBrightness) {
      serviceData.brightness = this._brightness;
    }

    if (preset.effect_segments) {
      serviceData.segments = preset.effect_segments;
    }

    await this.hass.callService('aqara_advanced_lighting', 'set_dynamic_effect', serviceData);
  }

  private async _activateUserPatternPreset(preset: UserSegmentPatternPreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    // Validate preset has segments
    if (!preset.segments || !Array.isArray(preset.segments) || preset.segments.length === 0) {
      console.warn('Pattern preset has no segments:', preset.name);
      return;
    }

    const segment_colors = preset.segments
      .filter((s) => s && s.color)
      .map((s) => ({
        segment: s.segment,
        color: { r: s.color.r, g: s.color.g, b: s.color.b },
      }));

    if (segment_colors.length === 0) {
      console.warn('Pattern preset has no valid segments after filtering:', preset.name);
      return;
    }

    const serviceData: Record<string, unknown> = {
      entity_id: this._selectedEntities,
      segment_colors,
      turn_on: true,
      sync: true,
      turn_off_unspecified: true,
    };

    if (this._useCustomBrightness) {
      serviceData.brightness = this._brightness;
    }

    try {
      await this.hass.callService('aqara_advanced_lighting', 'set_segment_pattern', serviceData);
    } catch (err) {
      console.error('Failed to activate pattern preset:', err);
    }
  }

  private async _activateUserCCTSequencePreset(preset: UserCCTSequencePreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    const serviceData: Record<string, unknown> = {
      entity_id: this._selectedEntities,
      loop_mode: preset.loop_mode,
      end_behavior: preset.end_behavior,
      turn_on: true,
      sync: true,
    };

    // Add loop_count only if loop_mode is 'count'
    if (preset.loop_mode === 'count' && preset.loop_count !== undefined) {
      serviceData.loop_count = preset.loop_count;
    }

    // Convert steps array to individual step fields (step_1_color_temp, step_1_brightness, etc.)
    preset.steps.forEach((step, index) => {
      const stepNum = index + 1;
      if (stepNum <= 20) {
        serviceData[`step_${stepNum}_color_temp`] = step.color_temp;
        serviceData[`step_${stepNum}_brightness`] = step.brightness;
        serviceData[`step_${stepNum}_transition`] = step.transition;
        serviceData[`step_${stepNum}_hold`] = step.hold;
      }
    });

    await this.hass.callService('aqara_advanced_lighting', 'start_cct_sequence', serviceData);
  }

  private async _activateUserSegmentSequencePreset(preset: UserSegmentSequencePreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    const serviceData: Record<string, unknown> = {
      entity_id: this._selectedEntities,
      loop_mode: preset.loop_mode,
      end_behavior: preset.end_behavior,
      turn_on: true,
      sync: true,
    };

    // Add loop_count only if loop_mode is 'count'
    if (preset.loop_mode === 'count' && preset.loop_count !== undefined) {
      serviceData.loop_count = preset.loop_count;
    }

    // Convert steps array to individual step fields
    preset.steps.forEach((step, index) => {
      const stepNum = index + 1;
      if (stepNum <= 20) {
        serviceData[`step_${stepNum}_segments`] = step.segments;
        serviceData[`step_${stepNum}_mode`] = step.mode;
        serviceData[`step_${stepNum}_duration`] = step.duration;
        serviceData[`step_${stepNum}_hold`] = step.hold;
        serviceData[`step_${stepNum}_activation_pattern`] = step.activation_pattern;

        // Add individual color parameters (up to 6 colors per step)
        if (step.colors && Array.isArray(step.colors)) {
          step.colors.forEach((color: number[], colorIndex: number) => {
            if (colorIndex < 6) {
              serviceData[`step_${stepNum}_color_${colorIndex + 1}`] = color;
            }
          });
        }
      }
    });

    await this.hass.callService('aqara_advanced_lighting', 'start_segment_sequence', serviceData);
  }

  protected render() {
    if (this._loading) {
      return html`
        <div class="header">
          <div class="toolbar">
            <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
            <div class="main-title">Aqara Advanced Lighting</div>
          </div>
        </div>
        <div class="content">
          <div class="loading">Loading presets...</div>
        </div>
      `;
    }

    if (this._error) {
      return html`
        <div class="header">
          <div class="toolbar">
            <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
            <div class="main-title">Aqara Advanced Lighting</div>
          </div>
        </div>
        <div class="content">
          <ha-alert alert-type="error" title="Error">
            ${this._error}
          </ha-alert>
        </div>
      `;
    }

    if (!this._presets) {
      return html`
        <div class="header">
          <div class="toolbar">
            <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
            <div class="main-title">Aqara Advanced Lighting</div>
          </div>
        </div>
        <div class="content">
          <ha-alert alert-type="warning" title="No presets available">
            Presets could not be loaded. Please check your configuration.
          </ha-alert>
        </div>
      `;
    }

    return html`
      <div class="header">
        <div class="toolbar">
          <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
          <div class="main-title">Aqara Advanced Lighting</div>
        </div>
        <ha-tab-group @wa-tab-show=${this._handleTabChange}>
          <ha-tab-group-tab slot="nav" panel="activate" .active=${this._activeTab === 'activate'}>
            Activate
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="effects" .active=${this._activeTab === 'effects'}>
            Effects
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="patterns" .active=${this._activeTab === 'patterns'}>
            Patterns
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="cct" .active=${this._activeTab === 'cct'}>
            CCT
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="segments" .active=${this._activeTab === 'segments'}>
            Segments
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="presets" .active=${this._activeTab === 'presets'}>
            My Presets
          </ha-tab-group-tab>
        </ha-tab-group>
      </div>
      <div class="content">
        <div class="tab-content">
          ${this._renderTabContent()}
        </div>
      </div>
    `;
  }

  private _renderTabContent() {
    switch (this._activeTab) {
      case 'activate':
        return this._renderActivateTab();
      case 'effects':
        return this._renderEffectsTab();
      case 'patterns':
        return this._renderPatternsTab();
      case 'cct':
        return this._renderCCTTab();
      case 'segments':
        return this._renderSegmentsTab();
      case 'presets':
        return this._renderPresetsTab();
      default:
        return this._renderActivateTab();
    }
  }

  private _renderActivateTab() {
    const filtered = this._filterPresets();
    const hasSelection = this._selectedEntities.length > 0;

    const targetSectionId = 'target_controls';
    const isTargetExpanded = !this._collapsed[targetSectionId];

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${isTargetExpanded}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange(targetSectionId, e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">Target</div>
            <div class="section-subtitle">${hasSelection ? `${this._selectedEntities.length} light${this._selectedEntities.length !== 1 ? 's' : ''} selected` : 'Select lights to control'}</div>
          </div>
        </div>
        <div class="section-content controls-content">
          <div class="target-favorites-grid">
            <div class="control-row">
              <span class="control-label">Lights</span>
              <div class="control-input target-input">
                <div class="target-selector">
                  <ha-selector
                    .hass=${this.hass}
                    .selector=${{
                      target: {
                        entity: {
                          domain: 'light',
                        },
                      },
                    }}
                    .value=${{ entity_id: this._selectedEntities }}
                    @value-changed=${this._handleTargetChanged}
                  ></ha-selector>
                </div>
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
                    <div class="favorite-input-buttons">
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

                <div class="form-section">
                  <span class="form-label">Custom Brightness</span>
                  <ha-switch
                    .checked=${this._useCustomBrightness}
                    @change=${this._handleCustomBrightnessToggle}
                  ></ha-switch>
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
      </ha-expansion-panel>

      ${!hasSelection
        ? html`<div class="no-lights">Please select one or more lights to view available presets</div>`
        : ''}

      ${this._hasIncompatibleLights
        ? html`
            <ha-alert alert-type="error" title="Incompatible light selected">
              Please select a compatible Aqara light (T1, T1M, T1 Strip, or T2 Bulb).
            </ha-alert>
          `
        : ''}

      ${filtered.showDynamicEffects && !this._hasIncompatibleLights
        ? html`
            ${filtered.t2Presets.length > 0 || this._getUserEffectPresetsForDeviceType('t2_bulb').length > 0
              ? this._renderDynamicEffectsSection('T2 Bulb', filtered.t2Presets, 't2_bulb')
              : ''}
            ${filtered.t1mPresets.length > 0 || this._getUserEffectPresetsForDeviceType('t1m').length > 0
              ? this._renderDynamicEffectsSection('T1M', filtered.t1mPresets, 't1m')
              : ''}
            ${filtered.t1StripPresets.length > 0 || this._getUserEffectPresetsForDeviceType('t1_strip').length > 0
              ? this._renderDynamicEffectsSection('T1 Strip', filtered.t1StripPresets, 't1_strip')
              : ''}
          `
        : ''}

      ${filtered.showSegmentPatterns && ((this._presets?.segment_patterns?.length ?? 0) > 0 || this._getFilteredUserPatternPresets().length > 0) && !this._hasIncompatibleLights
        ? this._renderSegmentPatternsSection()
        : ''}

      ${filtered.showCCTSequences && ((this._presets?.cct_sequences?.length ?? 0) > 0 || this._getFilteredUserCCTSequencePresets().length > 0) && !this._hasIncompatibleLights
        ? this._renderCCTSequencesSection()
        : ''}

      ${filtered.showSegmentSequences && ((this._presets?.segment_sequences?.length ?? 0) > 0 || this._getFilteredUserSegmentSequencePresets().length > 0) && !this._hasIncompatibleLights
        ? this._renderSegmentSequencesSection()
        : ''}
    `;
  }

  private _renderEffectsTab() {
    const editingEffect = this._editingPreset?.type === 'effect' ? this._editingPreset.preset as UserEffectPreset : undefined;

    return html`
      <ha-card class="editor-form">
        <h2>${editingEffect ? 'Edit Effect Preset' : 'Create Effect Preset'}</h2>
        <p class="editor-description">
          ${editingEffect ? 'Update your effect preset settings.' : 'Create custom dynamic effect presets with your choice of colors, speed, and brightness.'}
        </p>
        <effect-editor
          .hass=${this.hass}
          .preset=${editingEffect}
          .editMode=${!!editingEffect}
          .hasSelectedEntities=${this._selectedEntities.length > 0}
          .previewActive=${this._effectPreviewActive}
          @save=${this._handleEffectSave}
          @preview=${this._handleEffectPreview}
          @stop-preview=${this._handleEffectStopPreview}
          @cancel=${this._handleEditorCancel}
        ></effect-editor>
      </ha-card>
    `;
  }

  private async _handleEffectSave(e: CustomEvent): Promise<void> {
    if (this._editingPreset?.type === 'effect') {
      const existingPreset = this._editingPreset.preset as UserEffectPreset;
      await this._updateUserPreset('effect', existingPreset.id, e.detail);
    } else {
      await this._saveUserPreset('effect', e.detail);
    }
    this._editingPreset = undefined;
    this._setActiveTab('presets');
  }

  private _handleEditorCancel(): void {
    this._editingPreset = undefined;
    this._setActiveTab('activate');
  }

  private async _handleEffectPreview(e: CustomEvent): Promise<void> {
    if (!this._selectedEntities.length) {
      console.warn('No entities selected for preview');
      return;
    }

    const data = e.detail;
    const serviceData: Record<string, unknown> = {
      entity_id: this._selectedEntities,
      effect: data.effect,
      speed: data.effect_speed,
      turn_on: true,
      sync: true,
    };

    // Add individual color parameters (color_1, color_2, etc.)
    // Colors can be either XY format {x, y} or RGB format {r, g, b}
    // Service expects RGB array format [r, g, b]
    if (data.effect_colors) {
      data.effect_colors.forEach((c: { x?: number; y?: number; r?: number; g?: number; b?: number }, index: number) => {
        if (index < 8) {
          // Check if it's XY format or RGB format and convert to RGB array
          if ('x' in c && 'y' in c && c.x !== undefined && c.y !== undefined) {
            // XY format - convert to RGB array
            const rgb = xyToRgb(c.x, c.y, 255);
            serviceData[`color_${index + 1}`] = [rgb.r, rgb.g, rgb.b];
          } else if ('r' in c && 'g' in c && 'b' in c) {
            // RGB format - send as array
            serviceData[`color_${index + 1}`] = [c.r, c.g, c.b];
          }
        }
      });
    }

    if (data.effect_brightness !== undefined) {
      serviceData.brightness = data.effect_brightness;
    }

    if (data.effect_segments) {
      serviceData.segments = data.effect_segments;
    }

    await this.hass.callService('aqara_advanced_lighting', 'set_dynamic_effect', serviceData);
    this._effectPreviewActive = true;
  }

  private async _handleEffectStopPreview(): Promise<void> {
    if (!this._selectedEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'stop_effect', {
      entity_id: this._selectedEntities,
      restore_state: true,
    });
    this._effectPreviewActive = false;
  }

  private _renderPatternsTab() {
    const editingPattern = this._editingPreset?.type === 'pattern' ? this._editingPreset.preset as UserSegmentPatternPreset : undefined;

    return html`
      <ha-card class="editor-form">
        <h2>${editingPattern ? 'Edit Segment Pattern' : 'Create Segment Pattern'}</h2>
        <p class="editor-description">
          ${editingPattern ? 'Update your segment pattern settings.' : 'Design custom segment patterns by setting individual segment colors.'}
        </p>
        <pattern-editor
          .hass=${this.hass}
          .preset=${editingPattern}
          .editMode=${!!editingPattern}
          .hasSelectedEntities=${this._selectedEntities.length > 0}
          .stripSegmentCount=${this._getT1StripSegmentCount()}
          @save=${this._handlePatternSave}
          @preview=${this._handlePatternPreview}
          @cancel=${this._handleEditorCancel}
        ></pattern-editor>
      </ha-card>
    `;
  }

  private async _handlePatternSave(e: CustomEvent): Promise<void> {
    if (this._editingPreset?.type === 'pattern') {
      const existingPreset = this._editingPreset.preset as UserSegmentPatternPreset;
      await this._updateUserPreset('segment_pattern', existingPreset.id, e.detail);
    } else {
      await this._saveUserPreset('segment_pattern', e.detail);
    }
    this._editingPreset = undefined;
    this._setActiveTab('presets');
  }

  private async _handlePatternPreview(e: CustomEvent): Promise<void> {
    if (!this._selectedEntities.length) {
      console.warn('No entities selected for preview');
      return;
    }

    const data = e.detail;

    if (!data.segments || !Array.isArray(data.segments)) {
      console.error('Pattern preview: No segments in data');
      return;
    }

    const segment_colors = data.segments.map((s: { segment: number; color: { r: number; g: number; b: number } }) => ({
      segment: s.segment,
      color: { r: s.color.r, g: s.color.g, b: s.color.b },
    }));

    try {
      await this.hass.callService('aqara_advanced_lighting', 'set_segment_pattern', {
        entity_id: this._selectedEntities,
        segment_colors,
        turn_on: true,
        turn_off_unspecified: true,
        sync: true,
      });
    } catch (err) {
      console.error('Pattern preview service call failed:', err);
    }
  }

  private _renderCCTTab() {
    const editingCCT = this._editingPreset?.type === 'cct' ? this._editingPreset.preset as UserCCTSequencePreset : undefined;

    return html`
      <ha-card class="editor-form">
        <h2>${editingCCT ? 'Edit CCT Sequence' : 'Create CCT Sequence'}</h2>
        <p class="editor-description">
          ${editingCCT ? 'Update your CCT sequence settings.' : 'Build color temperature sequences with multiple steps and timing controls.'}
        </p>
        <cct-sequence-editor
          .hass=${this.hass}
          .preset=${editingCCT}
          .editMode=${!!editingCCT}
          .hasSelectedEntities=${this._selectedEntities.length > 0}
          .selectedEntities=${this._selectedEntities}
          .previewActive=${this._cctPreviewActive}
          @save=${this._handleCCTSave}
          @preview=${this._handleCCTPreview}
          @stop-preview=${this._handleCCTStopPreview}
          @cancel=${this._handleEditorCancel}
        ></cct-sequence-editor>
      </ha-card>
    `;
  }

  private async _handleCCTSave(e: CustomEvent): Promise<void> {
    if (this._editingPreset?.type === 'cct') {
      const existingPreset = this._editingPreset.preset as UserCCTSequencePreset;
      await this._updateUserPreset('cct_sequence', existingPreset.id, e.detail);
    } else {
      await this._saveUserPreset('cct_sequence', e.detail);
    }
    this._editingPreset = undefined;
    this._setActiveTab('presets');
  }

  private async _handleCCTPreview(e: CustomEvent): Promise<void> {
    if (!this._selectedEntities.length) {
      console.warn('No entities selected for preview');
      return;
    }

    const data = e.detail;
    const serviceData: Record<string, unknown> = {
      entity_id: this._selectedEntities,
      loop_mode: data.loop_mode,
      end_behavior: data.end_behavior,
      turn_on: true,
      sync: true,
    };

    // Add loop_count only if loop_mode is 'count'
    if (data.loop_mode === 'count' && data.loop_count !== undefined) {
      serviceData.loop_count = data.loop_count;
    }

    // Convert steps array to individual step fields
    if (data.steps && Array.isArray(data.steps)) {
      data.steps.forEach((step: { color_temp: number; brightness: number; transition: number; hold: number }, index: number) => {
        const stepNum = index + 1;
        if (stepNum <= 20) {
          serviceData[`step_${stepNum}_color_temp`] = step.color_temp;
          serviceData[`step_${stepNum}_brightness`] = step.brightness;
          serviceData[`step_${stepNum}_transition`] = step.transition;
          serviceData[`step_${stepNum}_hold`] = step.hold;
        }
      });
    }

    await this.hass.callService('aqara_advanced_lighting', 'start_cct_sequence', serviceData);
    this._cctPreviewActive = true;
  }

  private async _handleCCTStopPreview(): Promise<void> {
    if (!this._selectedEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'stop_cct_sequence', {
      entity_id: this._selectedEntities,
    });
    this._cctPreviewActive = false;
  }

  private _renderSegmentsTab() {
    const editingSegment = this._editingPreset?.type === 'segment' ? this._editingPreset.preset as UserSegmentSequencePreset : undefined;

    return html`
      <ha-card class="editor-form">
        <h2>${editingSegment ? 'Edit Segment Sequence' : 'Create Segment Sequence'}</h2>
        <p class="editor-description">
          ${editingSegment ? 'Update your segment sequence settings.' : 'Design animated segment sequences with multiple steps and transition effects.'}
        </p>
        <segment-sequence-editor
          .hass=${this.hass}
          .preset=${editingSegment}
          .editMode=${!!editingSegment}
          .hasSelectedEntities=${this._selectedEntities.length > 0}
          .previewActive=${this._segmentSequencePreviewActive}
          @save=${this._handleSegmentSequenceSave}
          @preview=${this._handleSegmentSequencePreview}
          @stop-preview=${this._handleSegmentSequenceStopPreview}
          @cancel=${this._handleEditorCancel}
        ></segment-sequence-editor>
      </ha-card>
    `;
  }

  private async _handleSegmentSequenceSave(e: CustomEvent): Promise<void> {
    if (this._editingPreset?.type === 'segment') {
      const existingPreset = this._editingPreset.preset as UserSegmentSequencePreset;
      await this._updateUserPreset('segment_sequence', existingPreset.id, e.detail);
    } else {
      await this._saveUserPreset('segment_sequence', e.detail);
    }
    this._editingPreset = undefined;
    this._setActiveTab('presets');
  }

  private async _handleSegmentSequencePreview(e: CustomEvent): Promise<void> {
    if (!this._selectedEntities.length) {
      console.warn('No entities selected for preview');
      return;
    }

    const data = e.detail;
    const serviceData: Record<string, unknown> = {
      entity_id: this._selectedEntities,
      loop_mode: data.loop_mode,
      end_behavior: data.end_behavior,
      clear_segments: data.clear_segments || false,
      skip_first_in_loop: data.skip_first_in_loop || false,
      turn_on: true,
      sync: true,
    };

    // Add loop_count only if loop_mode is 'count'
    if (data.loop_mode === 'count' && data.loop_count !== undefined) {
      serviceData.loop_count = data.loop_count;
    }

    // Convert steps array to individual step fields
    if (data.steps && Array.isArray(data.steps)) {
      data.steps.forEach((step: { segments: string; mode: string; colors: number[][]; duration: number; hold: number; activation_pattern: string }, index: number) => {
        const stepNum = index + 1;
        if (stepNum <= 20) {
          serviceData[`step_${stepNum}_segments`] = step.segments;
          serviceData[`step_${stepNum}_mode`] = step.mode;
          serviceData[`step_${stepNum}_duration`] = step.duration;
          serviceData[`step_${stepNum}_hold`] = step.hold;
          serviceData[`step_${stepNum}_activation_pattern`] = step.activation_pattern;

          // Add individual color parameters (up to 6 colors per step)
          if (step.colors && Array.isArray(step.colors)) {
            step.colors.forEach((color: number[], colorIndex: number) => {
              if (colorIndex < 6) {
                serviceData[`step_${stepNum}_color_${colorIndex + 1}`] = color;
              }
            });
          }
        }
      });
    }

    await this.hass.callService('aqara_advanced_lighting', 'start_segment_sequence', serviceData);
    this._segmentSequencePreviewActive = true;
  }

  private async _handleSegmentSequenceStopPreview(): Promise<void> {
    if (!this._selectedEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'stop_segment_sequence', {
      entity_id: this._selectedEntities,
    });
    this._segmentSequencePreviewActive = false;
  }

  private _renderPresetsTab() {
    const effectPresets = this._userPresets?.effect_presets || [];
    const patternPresets = this._userPresets?.segment_pattern_presets || [];
    const cctPresets = this._userPresets?.cct_sequence_presets || [];
    const segmentPresets = this._userPresets?.segment_sequence_presets || [];
    const totalCount = effectPresets.length + patternPresets.length + cctPresets.length + segmentPresets.length;
    const hasSelection = this._selectedEntities.length > 0;

    // Apply sorting
    const sortedEffects = this._sortUserEffectPresets(effectPresets, this._sortPreferences.effects);
    const sortedPatterns = this._sortUserPatternPresets(patternPresets, this._sortPreferences.patterns);
    const sortedCCT = this._sortUserCCTSequencePresets(cctPresets, this._sortPreferences.cct);
    const sortedSegments = this._sortUserSegmentSequencePresets(segmentPresets, this._sortPreferences.segments);

    return html`
      <ha-card class="editor-form">
        <h2>My Presets</h2>
        <p class="editor-description">
          Manage your saved presets. ${hasSelection ? 'Click a preset to activate it, or use the edit/delete buttons.' : 'Select lights in the Activate tab to enable activation.'}
        </p>

        ${totalCount === 0
          ? html`
              <div class="no-presets">
                <ha-icon icon="mdi:folder-open-outline"></ha-icon>
                <p>No saved presets yet.</p>
                <p>Use the other tabs to create and save your custom presets.</p>
              </div>
            `
          : html`
              ${effectPresets.length > 0
                ? html`
                    <div class="preset-category">
                      <div class="preset-category-header">
                        <h3>Effect Presets (${effectPresets.length})</h3>
                        ${this._renderSortDropdown('effects')}
                      </div>
                      <div class="preset-grid">
                        ${sortedEffects.map(
                          (preset) => html`
                            <div
                              class="user-preset-card ${hasSelection ? '' : 'disabled'}"
                              @click=${hasSelection ? () => this._activateUserEffectPreset(preset) : null}
                              title="${preset.name}"
                            >
                              <div class="preset-card-actions">
                                <ha-icon-button
                                  @click=${(e: Event) => { e.stopPropagation(); this._editEffectPreset(preset); }}
                                  title="Edit preset"
                                >
                                  <ha-icon icon="mdi:pencil"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button
                                  @click=${(e: Event) => { e.stopPropagation(); this._deleteUserPreset('effect', preset.id); }}
                                  title="Delete preset"
                                >
                                  <ha-icon icon="mdi:delete"></ha-icon>
                                </ha-icon-button>
                              </div>
                              <div class="preset-icon">
                                <ha-icon icon="${preset.icon || 'mdi:lightbulb-on'}"></ha-icon>
                              </div>
                              <div class="preset-name">${preset.name}</div>
                            </div>
                          `
                        )}
                      </div>
                    </div>
                  `
                : ''}

              ${patternPresets.length > 0
                ? html`
                    <div class="preset-category">
                      <div class="preset-category-header">
                        <h3>Segment Pattern Presets (${patternPresets.length})</h3>
                        ${this._renderSortDropdown('patterns')}
                      </div>
                      <div class="preset-grid">
                        ${sortedPatterns.map(
                          (preset) => html`
                            <div
                              class="user-preset-card ${hasSelection ? '' : 'disabled'}"
                              @click=${hasSelection ? () => this._activateUserPatternPreset(preset) : null}
                              title="${preset.name}"
                            >
                              <div class="preset-card-actions">
                                <ha-icon-button
                                  @click=${(e: Event) => { e.stopPropagation(); this._editPatternPreset(preset); }}
                                  title="Edit preset"
                                >
                                  <ha-icon icon="mdi:pencil"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button
                                  @click=${(e: Event) => { e.stopPropagation(); this._deleteUserPreset('segment_pattern', preset.id); }}
                                  title="Delete preset"
                                >
                                  <ha-icon icon="mdi:delete"></ha-icon>
                                </ha-icon-button>
                              </div>
                              <div class="preset-icon">
                                <ha-icon icon="${preset.icon || 'mdi:palette'}"></ha-icon>
                              </div>
                              <div class="preset-name">${preset.name}</div>
                            </div>
                          `
                        )}
                      </div>
                    </div>
                  `
                : ''}

              ${cctPresets.length > 0
                ? html`
                    <div class="preset-category">
                      <div class="preset-category-header">
                        <h3>CCT Sequence Presets (${cctPresets.length})</h3>
                        ${this._renderSortDropdown('cct')}
                      </div>
                      <div class="preset-grid">
                        ${sortedCCT.map(
                          (preset) => html`
                            <div
                              class="user-preset-card ${hasSelection ? '' : 'disabled'}"
                              @click=${hasSelection ? () => this._activateUserCCTSequencePreset(preset) : null}
                              title="${preset.name}"
                            >
                              <div class="preset-card-actions">
                                <ha-icon-button
                                  @click=${(e: Event) => { e.stopPropagation(); this._editCCTSequencePreset(preset); }}
                                  title="Edit preset"
                                >
                                  <ha-icon icon="mdi:pencil"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button
                                  @click=${(e: Event) => { e.stopPropagation(); this._deleteUserPreset('cct_sequence', preset.id); }}
                                  title="Delete preset"
                                >
                                  <ha-icon icon="mdi:delete"></ha-icon>
                                </ha-icon-button>
                              </div>
                              <div class="preset-icon">
                                <ha-icon icon="${preset.icon || 'mdi:temperature-kelvin'}"></ha-icon>
                              </div>
                              <div class="preset-name">${preset.name}</div>
                            </div>
                          `
                        )}
                      </div>
                    </div>
                  `
                : ''}

              ${segmentPresets.length > 0
                ? html`
                    <div class="preset-category">
                      <div class="preset-category-header">
                        <h3>Segment Sequence Presets (${segmentPresets.length})</h3>
                        ${this._renderSortDropdown('segments')}
                      </div>
                      <div class="preset-grid">
                        ${sortedSegments.map(
                          (preset) => html`
                            <div
                              class="user-preset-card ${hasSelection ? '' : 'disabled'}"
                              @click=${hasSelection ? () => this._activateUserSegmentSequencePreset(preset) : null}
                              title="${preset.name}"
                            >
                              <div class="preset-card-actions">
                                <ha-icon-button
                                  @click=${(e: Event) => { e.stopPropagation(); this._editSegmentSequencePreset(preset); }}
                                  title="Edit preset"
                                >
                                  <ha-icon icon="mdi:pencil"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button
                                  @click=${(e: Event) => { e.stopPropagation(); this._deleteUserPreset('segment_sequence', preset.id); }}
                                  title="Delete preset"
                                >
                                  <ha-icon icon="mdi:delete"></ha-icon>
                                </ha-icon-button>
                              </div>
                              <div class="preset-icon">
                                <ha-icon icon="${preset.icon || 'mdi:animation-play'}"></ha-icon>
                              </div>
                              <div class="preset-name">${preset.name}</div>
                            </div>
                          `
                        )}
                      </div>
                    </div>
                  `
                : ''}
            `}
      </ha-card>
    `;
  }

  // Edit preset methods - navigate to editor tab with preset loaded
  private _editEffectPreset(preset: UserEffectPreset): void {
    this._editingPreset = { type: 'effect', preset };
    this._setActiveTab('effects');
  }

  private _editPatternPreset(preset: UserSegmentPatternPreset): void {
    this._editingPreset = { type: 'pattern', preset };
    this._setActiveTab('patterns');
  }

  private _editCCTSequencePreset(preset: UserCCTSequencePreset): void {
    this._editingPreset = { type: 'cct', preset };
    this._setActiveTab('cct');
  }

  private _editSegmentSequencePreset(preset: UserSegmentSequencePreset): void {
    this._editingPreset = { type: 'segment', preset };
    this._setActiveTab('segments');
  }

  private _renderSortDropdown(category: keyof PresetSortPreferences) {
    const currentSort = this._sortPreferences[category];
    return html`
      <select
        class="sort-select"
        .value=${currentSort}
        @change=${(e: Event) => {
          e.stopPropagation();
          this._setSortPreference(category, (e.target as HTMLSelectElement).value as PresetSortOption);
        }}
        @click=${(e: Event) => e.stopPropagation()}
      >
        <option value="name-asc">Name (A-Z)</option>
        <option value="name-desc">Name (Z-A)</option>
        <option value="date-new">Newest First</option>
        <option value="date-old">Oldest First</option>
      </select>
    `;
  }

  private _renderDynamicEffectsSection(title: string, presets: DynamicEffectPreset[], deviceType: string) {
    const sectionId = `dynamic_${title.toLowerCase().replace(/\s+/g, '_')}`;
    const isExpanded = !this._collapsed[sectionId];
    const userPresets = this._getUserEffectPresetsForDeviceType(deviceType);
    const totalCount = userPresets.length + presets.length;

    // Apply sorting
    const sortedUserPresets = this._sortUserEffectPresets(userPresets, this._sortPreferences.effects);
    const sortedBuiltinPresets = this._sortDynamicEffectPresets(presets, this._sortPreferences.effects);

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${isExpanded}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange(sectionId, e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">Dynamic Effects: ${title}</div>
            <div class="section-subtitle">${totalCount} presets${userPresets.length > 0 ? ` (${userPresets.length} custom)` : ''}</div>
          </div>
          <div class="section-header-controls" @click=${(e: Event) => e.stopPropagation()}>
            ${this._renderSortDropdown('effects')}
          </div>
        </div>
        <div class="section-content">
          ${sortedUserPresets.map(
            (preset) => html`
              <div class="preset-button user-preset" @click=${() => this._activateUserEffectPreset(preset)}>
                <div class="preset-icon">
                  <ha-icon icon="${preset.icon || 'mdi:lightbulb-on'}"></ha-icon>
                </div>
                <div class="preset-name">${preset.name}</div>
              </div>
            `
          )}
          ${sortedBuiltinPresets.map(
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
      </ha-expansion-panel>
    `;
  }

  private _renderSegmentPatternsSection() {
    const sectionId = 'segment_patterns';
    const isExpanded = !this._collapsed[sectionId];
    const userPresets = this._getFilteredUserPatternPresets();
    const builtinPresets = this._presets!.segment_patterns;
    const totalCount = userPresets.length + builtinPresets.length;

    // Apply sorting
    const sortedUserPresets = this._sortUserPatternPresets(userPresets, this._sortPreferences.patterns);
    const sortedBuiltinPresets = this._sortSegmentPatternPresets(builtinPresets, this._sortPreferences.patterns);

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${isExpanded}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange(sectionId, e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">Segment Patterns</div>
            <div class="section-subtitle">${totalCount} presets${userPresets.length > 0 ? ` (${userPresets.length} custom)` : ''}</div>
          </div>
          <div class="section-header-controls" @click=${(e: Event) => e.stopPropagation()}>
            ${this._renderSortDropdown('patterns')}
          </div>
        </div>
        <div class="section-content">
          ${sortedUserPresets.map(
            (preset) => html`
              <div class="preset-button user-preset" @click=${() => this._activateUserPatternPreset(preset)}>
                <div class="preset-icon">
                  <ha-icon icon="${preset.icon || 'mdi:palette'}"></ha-icon>
                </div>
                <div class="preset-name">${preset.name}</div>
              </div>
            `
          )}
          ${sortedBuiltinPresets.map(
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
      </ha-expansion-panel>
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
    const isExpanded = !this._collapsed[sectionId];
    const userPresets = this._getFilteredUserCCTSequencePresets();
    const builtinPresets = this._presets!.cct_sequences;
    const totalCount = userPresets.length + builtinPresets.length;

    // Apply sorting
    const sortedUserPresets = this._sortUserCCTSequencePresets(userPresets, this._sortPreferences.cct);
    const sortedBuiltinPresets = this._sortCCTSequencePresets(builtinPresets, this._sortPreferences.cct);

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${isExpanded}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange(sectionId, e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">CCT Sequences</div>
            <div class="section-subtitle">${totalCount} presets${userPresets.length > 0 ? ` (${userPresets.length} custom)` : ''}</div>
          </div>
          <div class="section-header-controls" @click=${(e: Event) => e.stopPropagation()}>
            ${this._renderSortDropdown('cct')}
          </div>
        </div>
        <div class="section-content">
          ${sortedUserPresets.map(
            (preset) => html`
              <div class="preset-button user-preset" @click=${() => this._activateUserCCTSequencePreset(preset)}>
                <div class="preset-icon">
                  <ha-icon icon="${preset.icon || 'mdi:temperature-kelvin'}"></ha-icon>
                </div>
                <div class="preset-name">${preset.name}</div>
              </div>
            `
          )}
          ${sortedBuiltinPresets.map(
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
      </ha-expansion-panel>
    `;
  }

  private _renderSegmentSequencesSection() {
    const sectionId = 'segment_sequences';
    const isExpanded = !this._collapsed[sectionId];
    const userPresets = this._getFilteredUserSegmentSequencePresets();
    const builtinPresets = this._presets!.segment_sequences;
    const totalCount = userPresets.length + builtinPresets.length;

    // Apply sorting
    const sortedUserPresets = this._sortUserSegmentSequencePresets(userPresets, this._sortPreferences.segments);
    const sortedBuiltinPresets = this._sortSegmentSequencePresets(builtinPresets, this._sortPreferences.segments);

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${isExpanded}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange(sectionId, e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">Segment Sequences</div>
            <div class="section-subtitle">${totalCount} presets${userPresets.length > 0 ? ` (${userPresets.length} custom)` : ''}</div>
          </div>
          <div class="section-header-controls" @click=${(e: Event) => e.stopPropagation()}>
            ${this._renderSortDropdown('segments')}
          </div>
        </div>
        <div class="section-content">
          ${sortedUserPresets.map(
            (preset) => html`
              <div class="preset-button user-preset" @click=${() => this._activateUserSegmentSequencePreset(preset)}>
                <div class="preset-icon">
                  <ha-icon icon="${preset.icon || 'mdi:animation-play'}"></ha-icon>
                </div>
                <div class="preset-name">${preset.name}</div>
              </div>
            `
          )}
          ${sortedBuiltinPresets.map(
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
      </ha-expansion-panel>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'aqara-advanced-lighting-panel': AqaraPanel;
  }
}
