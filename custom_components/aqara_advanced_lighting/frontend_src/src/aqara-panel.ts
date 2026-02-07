import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef, Ref } from 'lit/directives/ref.js';
import { panelStyles } from './styles';
import { xyToRgb, rgbToXy } from './color-utils';
import {
  renderEffectThumbnail,
  renderSegmentPatternThumbnail,
  renderCCTSequenceThumbnail,
  renderSegmentSequenceThumbnail,
  renderDynamicSceneThumbnail,
} from './preset-thumbnails';
import { PANEL_TRANSLATIONS } from './panel-translations';
import {
  HomeAssistant,
  PresetsData,
  FilteredPresets,
  DynamicEffectPreset,
  SegmentPatternPreset,
  CCTSequencePreset,
  SegmentSequencePreset,
  DynamicScenePreset,
  Favorite,
  PanelTab,
  DeviceContext,
  UserPresetsData,
  UserEffectPreset,
  UserSegmentPatternPreset,
  UserCCTSequencePreset,
  UserSegmentSequencePreset,
  UserDynamicScenePreset,
  UserPreferences,
  XYColor,
  PresetSortOption,
  PresetSortPreferences,
  SegmentZoneResolved,
  EditorDraftCache,
  FavoritePresetRef,
  RunningOperation,
  RunningOperationsResponse,
} from './types';
import './effect-editor';
import './pattern-editor';
import './cct-sequence-editor';
import './segment-sequence-editor';
import './dynamic-scene-editor';
import './transition-curve-editor';
import './color-history-swatches';

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
  @state() private _includeAllLights = false;
  @state() private _favorites: Favorite[] = [];
  @state() private _activeFavoriteId: string | null = null;
  @state() private _showFavoriteInput = false;
  @state() private _favoriteInputName = '';
  @state() private _activeTab: PanelTab = 'activate';
  @state() private _userPresets?: UserPresetsData;
  @state() private _editingPreset?: { type: string; preset: UserEffectPreset | UserSegmentPatternPreset | UserCCTSequencePreset | UserSegmentSequencePreset | UserDynamicScenePreset; isDuplicate?: boolean };
  @state() private _effectPreviewActive = false;
  @state() private _cctPreviewActive = false;
  @state() private _segmentSequencePreviewActive = false;
  @state() private _scenePreviewActive = false;
  @state() private _sortPreferences: PresetSortPreferences = {};
  @state() private _colorHistory: XYColor[] = [];
  @state() private _backendVersion?: string;
  @state() private _frontendVersion = '__FRONTEND_VERSION__';
  @state() private _supportedEntities: Map<string, { device_type: string; model_id: string; z2m_friendly_name: string; ieee_address?: string; segment_count?: number; is_group?: boolean; member_count?: number }> = new Map();
  @state() private _deviceZones: Map<string, Array<{ name: string; segments: string }>> = new Map();
  @state() private _zoneEditing: Map<string, Array<{ name: string; segments: string }>> = new Map();
  @state() private _zoneSaving = false;
  @state() private _z2mInstances: Array<{
    entry_id: string;
    title: string;
    z2m_base_topic: string;
    device_counts: { t2_rgb: number; t2_cct: number; t1m: number; t1_strip: number; other: number; total: number };
    devices: string[];
  }> = [];
  @state() private _localCurvature = 1.0;
  @state() private _applyingCurvature = false;
  @state() private _isExporting = false;
  @state() private _isImporting = false;
  @state() private _favoritePresets: FavoritePresetRef[] = [];
  @state() private _runningOperations: RunningOperation[] = [];
  private _translations: Record<string, any> = PANEL_TRANSLATIONS;
  private _fileInputRef: HTMLInputElement | null = null;
  private _eventUnsubscribers: Array<() => void> = [];

  private _tileCardRef: Ref<HTMLElement> = createRef();
  private _tileCards: Map<string, any> = new Map();
  private _preferencesSaveTimer?: ReturnType<typeof setTimeout>;
  private _editorDraftCache: EditorDraftCache = {};

  static styles = panelStyles;

  /**
   * Helper method to localize panel strings
   * Fetches translations from our stored translation object
   */
  private _localize(key: string, values?: Record<string, string>): string {
    // Navigate through nested translation keys
    const keys = key.split('.');
    let translated: any = this._translations;

    for (const k of keys) {
      if (translated && typeof translated === 'object' && k in translated) {
        translated = translated[k];
      } else {
        // Fallback to key if translation not found
        return key;
      }
    }

    // Ensure we got a string
    if (typeof translated !== 'string') {
      return key;
    }

    // Replace placeholders like {count} with actual values
    if (values) {
      Object.keys(values).forEach(placeholder => {
        const value = values[placeholder];
        if (value !== undefined) {
          translated = translated.replace(`{${placeholder}}`, value);
        }
      });
    }

    return translated;
  }

  protected firstUpdated(): void {
    this._loadPresets();
    this._loadFavorites();
    this._loadUserPresets();
    this._loadUserPreferences();
    this._loadBackendVersion();
    this._loadSupportedEntities();
    this._loadRunningOperations();
    this._subscribeToOperationEvents();

    // Listen for color history events from child editors (bubbles through shadow DOM)
    this.addEventListener('color-history-changed', this._handleColorHistoryChanged as EventListener);
    this.addEventListener('clear-history', this._handleClearColorHistory as EventListener);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('color-history-changed', this._handleColorHistoryChanged as EventListener);
    this.removeEventListener('clear-history', this._handleClearColorHistory as EventListener);
    if (this._preferencesSaveTimer !== undefined) {
      clearTimeout(this._preferencesSaveTimer);
      this._preferencesSaveTimer = undefined;
    }
    this._tileCards.clear();
    // Unsubscribe from HA events
    for (const unsub of this._eventUnsubscribers) {
      unsub();
    }
    this._eventUnsubscribers = [];
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    if (changedProps.has('hass') && changedProps.get('hass') === undefined) {
      // Initial hass load
      this._loadPresets();
      this._loadFavorites();
      this._loadUserPresets();
      this._loadSupportedEntities();
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
      this._error = err instanceof Error ? err.message : this._localize('errors.loading_presets_generic');
      this._loading = false;
    }
  }

  private async _loadFavorites(): Promise<void> {
    if (!this.hass) return;

    try {
      const data = await this.hass.callApi<{ favorites: Favorite[] }>('GET', 'aqara_advanced_lighting/favorites');
      this._favorites = data.favorites || [];
    } catch (err) {
      console.warn('Failed to load favorites:', err);
    }
  }

  private async _loadUserPresets(): Promise<void> {
    if (!this.hass) return;

    try {
      this._userPresets = await this.hass.callApi<UserPresetsData>('GET', 'aqara_advanced_lighting/user_presets');
    } catch (err) {
      console.warn('Failed to load user presets:', err);
    }
  }

  private async _loadUserPreferences(): Promise<void> {
    if (!this.hass) return;

    try {
      const prefs = await this.hass.callApi<UserPreferences>(
        'GET',
        'aqara_advanced_lighting/user_preferences'
      );

      // One-time migration from localStorage
      if (
        prefs.color_history.length === 0 &&
        Object.keys(prefs.sort_preferences).length === 0
      ) {
        const migrated = this._migrateLocalStoragePreferences();
        if (migrated) {
          const updated = await this.hass.callApi<UserPreferences>(
            'PUT',
            'aqara_advanced_lighting/user_preferences',
            migrated as unknown as Record<string, unknown>
          );
          this._colorHistory = updated.color_history;
          this._sortPreferences = updated.sort_preferences;
          // Clean up localStorage after successful migration
          localStorage.removeItem('aqara_lighting_color_history');
          localStorage.removeItem('aqara_lighting_sort_preferences');
          return;
        }
      }

      this._colorHistory = prefs.color_history;
      this._sortPreferences = prefs.sort_preferences;
      this._favoritePresets = prefs.favorite_presets || [];
      if (prefs.collapsed_sections) {
        this._collapsed = prefs.collapsed_sections;
      }
      if (prefs.include_all_lights !== undefined) {
        this._includeAllLights = prefs.include_all_lights;
      }
    } catch (err) {
      console.warn('Failed to load user preferences:', err);
      // Fall back to localStorage as read-only source if server unavailable
      this._loadSortPreferencesFromLocalStorage();
    }
  }

  private _migrateLocalStoragePreferences(): Partial<UserPreferences> | null {
    const migrated: Partial<UserPreferences> = {};
    let hasMigrationData = false;

    try {
      const localColors = localStorage.getItem('aqara_lighting_color_history');
      if (localColors) {
        const parsed = JSON.parse(localColors);
        if (Array.isArray(parsed) && parsed.length > 0) {
          migrated.color_history = parsed;
          hasMigrationData = true;
        }
      }
    } catch {
      // Ignore parse errors
    }

    try {
      const localSort = localStorage.getItem('aqara_lighting_sort_preferences');
      if (localSort) {
        const parsed = JSON.parse(localSort);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          migrated.sort_preferences = parsed;
          hasMigrationData = true;
        }
      }
    } catch {
      // Ignore parse errors
    }

    return hasMigrationData ? migrated : null;
  }

  private _loadSortPreferencesFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('aqara_lighting_sort_preferences');
      if (stored) {
        this._sortPreferences = JSON.parse(stored) as PresetSortPreferences;
      }
    } catch {
      // Ignore
    }
  }

  private _saveUserPreferences(immediate = false): void {
    if (!this.hass) return;

    // Clear any pending debounced save
    if (this._preferencesSaveTimer !== undefined) {
      clearTimeout(this._preferencesSaveTimer);
      this._preferencesSaveTimer = undefined;
    }

    const doSave = () => {
      this.hass.callApi<UserPreferences>(
        'PUT',
        'aqara_advanced_lighting/user_preferences',
        {
          color_history: this._colorHistory,
          sort_preferences: this._sortPreferences,
          collapsed_sections: this._collapsed,
          include_all_lights: this._includeAllLights,
          favorite_presets: this._favoritePresets,
        } as unknown as Record<string, unknown>
      ).catch(err => {
        console.warn('Failed to save user preferences:', err);
      });
    };

    if (immediate) {
      doSave();
    } else {
      this._preferencesSaveTimer = setTimeout(doSave, 500);
    }
  }

  private _handleColorHistoryChanged = (e: Event): void => {
    const detail = (e as CustomEvent).detail;
    if (detail && Array.isArray(detail.colorHistory)) {
      this._colorHistory = detail.colorHistory;
      this._saveUserPreferences();
    }
  };

  private _handleClearColorHistory = (_e: Event): void => {
    this._colorHistory = [];
    this._saveUserPreferences(true); // Immediate save for clear
  };

  /** Check if a preset is in the favorites list. */
  private _isPresetFavorited(type: string, id: string): boolean {
    return this._favoritePresets.some(fav => fav.type === type && fav.id === id);
  }

  /** Toggle favorite status for a preset. Stops propagation to prevent activation. */
  private _toggleFavoritePreset(type: string, id: string, event: Event): void {
    event.stopPropagation();
    const index = this._favoritePresets.findIndex(fav => fav.type === type && fav.id === id);
    if (index >= 0) {
      this._favoritePresets = [
        ...this._favoritePresets.slice(0, index),
        ...this._favoritePresets.slice(index + 1),
      ];
    } else {
      this._favoritePresets = [...this._favoritePresets, { type, id }];
    }
    this._saveUserPreferences(true);
  }

  /** Render a star icon for favorite toggling on preset buttons. */
  private _renderFavoriteStar(type: string, id: string) {
    const isFav = this._isPresetFavorited(type, id);
    return html`
      <ha-icon-button
        class="favorite-star ${isFav ? 'favorited' : ''}"
        @click=${(e: Event) => this._toggleFavoritePreset(type, id, e)}
        title="${isFav ? this._localize('tooltips.favorite_preset_remove') : this._localize('tooltips.favorite_preset_add')}"
      >
        <ha-icon icon="${isFav ? 'mdi:star' : 'mdi:star-outline'}"></ha-icon>
      </ha-icon-button>
    `;
  }

  /**
   * Resolve favorite preset references to actual preset objects.
   * Filters out references to deleted presets and cleans up stale entries.
   */
  private _getResolvedFavoritePresets(): Array<{
    ref: FavoritePresetRef;
    preset: any;
    isUser: boolean;
  }> {
    const resolved: Array<{ ref: FavoritePresetRef; preset: any; isUser: boolean }> = [];

    for (const ref of this._favoritePresets) {
      let preset: any = null;
      let isUser = false;

      switch (ref.type) {
        case 'effect': {
          for (const key of ['t2_bulb', 't1m', 't1_strip'] as const) {
            const found = this._presets?.dynamic_effects?.[key]?.find(p => p.id === ref.id);
            if (found) { preset = found; break; }
          }
          if (!preset) {
            preset = this._userPresets?.effect_presets?.find(p => p.id === ref.id) || null;
            if (preset) isUser = true;
          }
          break;
        }
        case 'segment_pattern': {
          preset = this._presets?.segment_patterns?.find(p => p.id === ref.id) || null;
          if (!preset) {
            preset = this._userPresets?.segment_pattern_presets?.find(p => p.id === ref.id) || null;
            if (preset) isUser = true;
          }
          break;
        }
        case 'cct_sequence': {
          preset = this._presets?.cct_sequences?.find(p => p.id === ref.id) || null;
          if (!preset) {
            preset = this._userPresets?.cct_sequence_presets?.find(p => p.id === ref.id) || null;
            if (preset) isUser = true;
          }
          break;
        }
        case 'segment_sequence': {
          preset = this._presets?.segment_sequences?.find(p => p.id === ref.id) || null;
          if (!preset) {
            preset = this._userPresets?.segment_sequence_presets?.find(p => p.id === ref.id) || null;
            if (preset) isUser = true;
          }
          break;
        }
        case 'dynamic_scene': {
          preset = this._presets?.dynamic_scenes?.find(p => p.id === ref.id) || null;
          if (!preset) {
            preset = this._userPresets?.dynamic_scene_presets?.find(p => p.id === ref.id) || null;
            if (preset) isUser = true;
          }
          break;
        }
      }

      if (preset) {
        resolved.push({ ref, preset, isUser });
      }
    }

    // Clean up stale references to deleted presets
    if (resolved.length !== this._favoritePresets.length) {
      this._favoritePresets = resolved.map(r => r.ref);
      this._saveUserPreferences();
    }

    return resolved;
  }

  /** Activate a favorite preset by dispatching to the appropriate activation method. */
  private async _activateFavoritePreset(ref: FavoritePresetRef, preset: any, isUser: boolean): Promise<void> {
    switch (ref.type) {
      case 'effect':
        if (isUser) {
          await this._activateUserEffectPreset(preset);
        } else {
          await this._activateDynamicEffect(preset);
        }
        break;
      case 'segment_pattern':
        if (isUser) {
          await this._activateUserPatternPreset(preset);
        } else {
          await this._activateSegmentPattern(preset);
        }
        break;
      case 'cct_sequence':
        if (isUser) {
          await this._activateUserCCTSequencePreset(preset);
        } else {
          await this._activateCCTSequence(preset);
        }
        break;
      case 'segment_sequence':
        if (isUser) {
          await this._activateUserSegmentSequencePreset(preset);
        } else {
          await this._activateSegmentSequence(preset);
        }
        break;
      case 'dynamic_scene':
        if (isUser) {
          await this._activateUserDynamicScenePreset(preset);
        } else {
          await this._activateDynamicScene(preset);
        }
        break;
    }
  }

  /** Render the icon/thumbnail for a favorite preset based on its type. */
  private _renderFavoritePresetIcon(ref: FavoritePresetRef, preset: any, isUser: boolean) {
    switch (ref.type) {
      case 'effect':
        return isUser ? this._renderUserEffectIcon(preset) : this._renderPresetIcon(preset.icon, 'mdi:lightbulb-on');
      case 'segment_pattern':
        return isUser ? this._renderUserPatternIcon(preset) : this._renderPresetIcon(preset.icon, 'mdi:palette');
      case 'cct_sequence':
        return isUser ? this._renderUserCCTIcon(preset) : this._renderPresetIcon(preset.icon, 'mdi:temperature-kelvin');
      case 'segment_sequence':
        return isUser ? this._renderUserSegmentSequenceIcon(preset) : this._renderPresetIcon(preset.icon, 'mdi:animation-play');
      case 'dynamic_scene':
        return isUser ? this._renderUserDynamicSceneIcon(preset) : this._renderBuiltinDynamicSceneIcon(preset);
      default:
        return html`<ha-icon icon="mdi:star"></ha-icon>`;
    }
  }

  private _getSortPreference(sectionId: string): PresetSortOption {
    return this._sortPreferences[sectionId] || 'name-asc';
  }

  private async _loadBackendVersion(): Promise<void> {
    try {
      const response = await fetch('/api/aqara_advanced_lighting/version');
      if (!response.ok) {
        console.warn('Failed to load backend version:', response.status);
        return;
      }
      const data = await response.json();
      this._backendVersion = data.version;
    } catch (err) {
      console.warn('Failed to load backend version:', err);
    }
  }

  private async _loadSupportedEntities(): Promise<void> {
    try {
      const response = await fetch('/api/aqara_advanced_lighting/supported_entities', {
        headers: { Authorization: `Bearer ${this.hass?.auth?.data?.access_token}` },
      });
      if (!response.ok) {
        console.warn('Failed to load supported entities:', response.status);
        return;
      }
      const data = await response.json();
      // Build a map for fast lookup
      const entityMap = new Map<string, { device_type: string; model_id: string; z2m_friendly_name: string; ieee_address?: string; segment_count?: number; is_group?: boolean; member_count?: number }>();
      for (const entity of data.entities || []) {
        entityMap.set(entity.entity_id, {
          device_type: entity.device_type,
          model_id: entity.model_id,
          z2m_friendly_name: entity.z2m_friendly_name,
          ieee_address: entity.ieee_address,
          segment_count: entity.segment_count,
        });
      }

      // Also add light groups to the supported entities
      for (const group of data.light_groups || []) {
        entityMap.set(group.entity_id, {
          device_type: group.device_type,
          model_id: 'light_group',
          z2m_friendly_name: group.friendly_name,
          is_group: true,
          member_count: group.member_count,
        });
      }

      this._supportedEntities = entityMap;

      // Store instances data
      this._z2mInstances = data.instances || [];
    } catch (err) {
      console.warn('Failed to load supported entities:', err);
    }
  }

  private async _loadRunningOperations(): Promise<void> {
    if (!this.hass?.auth?.data?.access_token) return;
    try {
      const response = await fetch('/api/aqara_advanced_lighting/running_operations', {
        headers: { Authorization: `Bearer ${this.hass.auth.data.access_token}` },
      });
      if (!response.ok) return;
      const data: RunningOperationsResponse = await response.json();
      this._runningOperations = data.operations || [];
    } catch (err) {
      console.warn('Failed to load running operations:', err);
    }
  }

  private async _subscribeToOperationEvents(): Promise<void> {
    if (!this.hass?.connection) return;

    const eventTypes = [
      'aqara_advanced_lighting_sequence_started',
      'aqara_advanced_lighting_sequence_stopped',
      'aqara_advanced_lighting_sequence_completed',
      'aqara_advanced_lighting_sequence_paused',
      'aqara_advanced_lighting_sequence_resumed',
      'aqara_advanced_lighting_dynamic_scene_started',
      'aqara_advanced_lighting_dynamic_scene_stopped',
      'aqara_advanced_lighting_dynamic_scene_finished',
      'aqara_advanced_lighting_dynamic_scene_paused',
      'aqara_advanced_lighting_dynamic_scene_resumed',
      'aqara_advanced_lighting_effect_activated',
      'aqara_advanced_lighting_effect_stopped',
      'aqara_advanced_lighting_entity_externally_controlled',
      'aqara_advanced_lighting_entity_control_resumed',
    ];

    for (const eventType of eventTypes) {
      try {
        const unsub = await this.hass.connection.subscribeEvents(
          () => { this._loadRunningOperations(); },
          eventType,
        );
        this._eventUnsubscribers.push(unsub);
      } catch (err) {
        console.warn(`Failed to subscribe to ${eventType}:`, err);
      }
    }
  }

  /**
   * Get unique segment-capable devices from selected entities.
   * Returns a map of ieee_address to { device_type, segment_count, z2m_friendly_name }.
   */
  private _getSelectedSegmentDevices(): Map<string, { device_type: string; segment_count: number; z2m_friendly_name: string; entity_id: string }> {
    const devices = new Map<string, { device_type: string; segment_count: number; z2m_friendly_name: string; entity_id: string }>();
    for (const entityId of this._selectedEntities) {
      const info = this._supportedEntities.get(entityId);
      if (!info?.ieee_address) continue;
      if (info.device_type !== 't1m' && info.device_type !== 't1_strip') continue;
      if (devices.has(info.ieee_address)) continue;
      // T1 Strip has segment_count=0 in backend (variable based on length)
      // so use the dynamic calculation for strips
      const segmentCount = info.device_type === 't1_strip'
        ? this._getT1StripSegmentCount()
        : (info.segment_count || 0);
      if (segmentCount === 0) continue;
      devices.set(info.ieee_address, {
        device_type: info.device_type,
        segment_count: segmentCount,
        z2m_friendly_name: info.z2m_friendly_name,
        entity_id: entityId,
      });
    }
    return devices;
  }

  /**
   * Load zones for a specific device from the backend.
   */
  private async _loadZonesForDevice(ieeeAddress: string): Promise<void> {
    try {
      const response = await fetch(`/api/aqara_advanced_lighting/segment_zones/${encodeURIComponent(ieeeAddress)}`, {
        headers: { Authorization: `Bearer ${this.hass?.auth?.data?.access_token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      const zones: Array<{ name: string; segments: string }> = Object.entries(data.zones || {}).map(
        ([name, segments]) => ({ name, segments: segments as string })
      );
      this._deviceZones = new Map(this._deviceZones).set(ieeeAddress, zones);
      this._zoneEditing = new Map(this._zoneEditing).set(ieeeAddress, zones.map(z => ({ ...z })));
    } catch (err) {
      console.warn('Failed to load zones for device:', ieeeAddress, err);
    }
  }

  /**
   * Load zones for all selected segment-capable devices.
   */
  private async _loadZonesForSelectedDevices(): Promise<void> {
    const devices = this._getSelectedSegmentDevices();
    await Promise.all(
      Array.from(devices.keys()).map(ieee => this._loadZonesForDevice(ieee))
    );
  }

  /**
   * Validate that all segment numbers in a range string are within the device maximum.
   * Returns an error message if invalid, or null if valid.
   */
  private _validateSegmentRange(rangeStr: string, maxSegments: number, zoneName: string): string | null {
    const trimmed = rangeStr.trim().toLowerCase();
    // Keywords are always valid
    const keywords = new Set(['odd', 'even', 'all', 'first-half', 'second-half']);
    if (keywords.has(trimmed)) return null;

    // Parse comma-separated parts
    const parts = trimmed.split(',');
    for (const part of parts) {
      const p = part.trim();
      const rangeMatch = p.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1] ?? '', 10);
        const end = parseInt(rangeMatch[2] ?? '', 10);
        if (isNaN(start) || isNaN(end)) {
          return this._localize('config.zone_invalid_range')
            .replace('{name}', zoneName).replace('{range}', p);
        }
        if (start > maxSegments || end > maxSegments) {
          const exceeding = Math.max(start, end);
          return this._localize('config.zone_out_of_range')
            .replace('{name}', zoneName)
            .replace('{segment}', String(exceeding))
            .replace('{max}', String(maxSegments));
        }
      } else {
        const num = parseInt(p, 10);
        if (isNaN(num)) {
          return this._localize('config.zone_invalid_range')
            .replace('{name}', zoneName).replace('{range}', p);
        }
        if (num > maxSegments) {
          return this._localize('config.zone_out_of_range')
            .replace('{name}', zoneName)
            .replace('{segment}', String(num))
            .replace('{max}', String(maxSegments));
        }
      }
    }
    return null;
  }

  /**
   * Save zones for a device.
   */
  private async _saveZones(ieeeAddress: string, maxSegments: number): Promise<void> {
    const editZones = this._zoneEditing.get(ieeeAddress) || [];
    const zonesPayload: Record<string, string> = {};
    const namesSeen = new Set<string>();

    for (const zone of editZones) {
      const name = zone.name.trim();
      const segments = zone.segments.trim();
      if (!name && !segments) continue;
      if (!name) {
        this._showToast(this._localize('config.zone_name_required'));
        return;
      }
      if (!segments) {
        this._showToast(this._localize('config.zone_segments_required'));
        return;
      }
      const nameLower = name.toLowerCase();
      if (namesSeen.has(nameLower)) {
        this._showToast(this._localize('config.zone_duplicate_name', { name }));
        return;
      }
      namesSeen.add(nameLower);

      // Validate segment range against device maximum
      const rangeError = this._validateSegmentRange(segments, maxSegments, name);
      if (rangeError) {
        this._showToast(rangeError);
        return;
      }

      zonesPayload[name] = segments;
    }

    this._zoneSaving = true;
    try {
      const response = await fetch(`/api/aqara_advanced_lighting/segment_zones/${encodeURIComponent(ieeeAddress)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.hass?.auth?.data?.access_token}`,
        },
        body: JSON.stringify({ zones: zonesPayload }),
      });
      if (response.ok) {
        await this._loadZonesForDevice(ieeeAddress);
        this._showToast(this._localize('config.zone_saved'));
      } else {
        const errorData = await response.json().catch(() => ({}));
        this._showToast(errorData.message || this._localize('config.zone_save_error'));
      }
    } catch {
      this._showToast(this._localize('config.zone_save_error'));
    } finally {
      this._zoneSaving = false;
    }
  }

  /**
   * Add a new empty zone row for editing.
   */
  private _addZoneRow(ieeeAddress: string): void {
    const current = this._zoneEditing.get(ieeeAddress) || [];
    const updated = [...current, { name: '', segments: '' }];
    this._zoneEditing = new Map(this._zoneEditing).set(ieeeAddress, updated);
  }

  /**
   * Remove a zone row from the editing list.
   */
  private async _removeZoneRow(ieeeAddress: string, index: number): Promise<void> {
    const current = this._zoneEditing.get(ieeeAddress) || [];
    const zone = current[index];

    // If this zone exists in the saved data, delete it from the backend immediately
    if (zone) {
      const savedZones = this._deviceZones.get(ieeeAddress) || [];
      const isSaved = savedZones.some(
        z => z.name.toLowerCase() === zone.name.trim().toLowerCase() && zone.name.trim() !== ''
      );
      if (isSaved) {
        try {
          await fetch(
            `/api/aqara_advanced_lighting/segment_zones/${encodeURIComponent(ieeeAddress)}/${encodeURIComponent(zone.name.trim())}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${this.hass?.auth?.data?.access_token}` },
            }
          );
          // Reload saved zones from backend to stay in sync
          await this._loadZonesForDevice(ieeeAddress);
          return;
        } catch {
          this._showToast(this._localize('config.zone_save_error'));
          return;
        }
      }
    }

    // Unsaved row: just remove from the editing list
    const updated = current.filter((_, i) => i !== index);
    this._zoneEditing = new Map(this._zoneEditing).set(ieeeAddress, updated);
  }

  /**
   * Update a zone's name or segments field in the editing list.
   */
  private _updateZoneField(ieeeAddress: string, index: number, field: 'name' | 'segments', value: string): void {
    const current = this._zoneEditing.get(ieeeAddress) || [];
    const updated = current.map((z, i) => i === index ? { ...z, [field]: value } : z);
    this._zoneEditing = new Map(this._zoneEditing).set(ieeeAddress, updated);
  }

  /**
   * Check if zones have been modified from saved state.
   */
  private _zonesModified(ieeeAddress: string): boolean {
    const saved = this._deviceZones.get(ieeeAddress) || [];
    const editing = this._zoneEditing.get(ieeeAddress) || [];
    if (saved.length !== editing.length) return true;
    return saved.some((z, i) => z.name !== editing[i]?.name || z.segments !== editing[i]?.segments);
  }

  private _setSortPreference(sectionId: string, value: PresetSortOption): void {
    this._sortPreferences = {
      ...this._sortPreferences,
      [sectionId]: value,
    };
    this._saveUserPreferences();
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

  private _sortUserDynamicScenePresets(presets: UserDynamicScenePreset[], sortOption: PresetSortOption): UserDynamicScenePreset[] {
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

  private _sortDynamicScenePresets(presets: DynamicScenePreset[], sortOption: PresetSortOption): DynamicScenePreset[] {
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

  private _sortResolvedFavorites(
    items: Array<{ ref: FavoritePresetRef; preset: any; isUser: boolean }>,
    sortOption: PresetSortOption,
  ): Array<{ ref: FavoritePresetRef; preset: any; isUser: boolean }> {
    const sorted = [...items];
    switch (sortOption) {
      case 'name-asc':
        return sorted.sort((a, b) => a.preset.name.localeCompare(b.preset.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.preset.name.localeCompare(a.preset.name));
      // Date sort uses the order they were favorited (array position)
      case 'date-new':
        return sorted.reverse();
      case 'date-old':
      default:
        return sorted;
    }
  }

  // Device type keys for My Presets sub-categories
  // Order defines display order of sub-categories
  private static readonly PRESET_DEVICE_TYPES: string[] = [
    't2_bulb', 't1', 't1m', 't1_strip',
  ];

  /**
   * Group presets by device_type for sub-category rendering.
   * Returns ungrouped presets (no device_type) and a map of device_type to presets.
   */
  private _groupPresetsByDeviceType<T extends { device_type?: string }>(
    presets: T[],
  ): { ungrouped: T[]; grouped: Map<string, T[]> } {
    const ungrouped: T[] = [];
    const grouped = new Map<string, T[]>();

    for (const preset of presets) {
      if (!preset.device_type) {
        ungrouped.push(preset);
      } else {
        const list = grouped.get(preset.device_type) || [];
        list.push(preset);
        grouped.set(preset.device_type, list);
      }
    }

    return { ungrouped, grouped };
  }

  private async _saveUserPreset(type: string, data: Record<string, unknown>): Promise<void> {
    if (!this.hass) return;

    try {
      await this.hass.callApi('POST', 'aqara_advanced_lighting/user_presets', { type, data });
      await this._loadUserPresets();
    } catch (err) {
      console.error('Failed to save user preset:', err);
    }
  }

  private async _updateUserPreset(type: string, id: string, data: Record<string, unknown>): Promise<void> {
    if (!this.hass) return;

    try {
      await this.hass.callApi('PUT', `aqara_advanced_lighting/user_presets/${type}/${id}`, data);
      await this._loadUserPresets();
    } catch (err) {
      console.error('Failed to update user preset:', err);
    }
  }

  private async _deleteUserPreset(type: string, id: string): Promise<void> {
    if (!this.hass) return;

    try {
      await this.hass.callApi('DELETE', `aqara_advanced_lighting/user_presets/${type}/${id}`);
      await this._loadUserPresets();
    } catch (err) {
      console.error('Failed to delete user preset:', err);
    }
  }

  private _setActiveTab(tab: PanelTab): void {
    if (tab !== this._activeTab) {
      this._cacheCurrentEditorDraft();
    }
    this._activeTab = tab;
  }

  private _handleTabChange(ev: CustomEvent<{ name: string }>): void {
    const newTab = ev.detail.name as PanelTab;
    if (!newTab) {
      return;
    }
    if (newTab !== this._activeTab) {
      this._cacheCurrentEditorDraft();
      this._activeTab = newTab;
    }
  }

  private _cacheCurrentEditorDraft(): void {
    const editorSelectors: Partial<Record<PanelTab, string>> = {
      effects: 'effect-editor',
      patterns: 'pattern-editor',
      cct: 'cct-sequence-editor',
      segments: 'segment-sequence-editor',
      scenes: 'dynamic-scene-editor',
    };

    const selector = editorSelectors[this._activeTab];
    if (!selector) return;

    const editor = this.shadowRoot?.querySelector(selector) as
      | { getDraftState?: () => unknown }
      | null;
    if (editor && typeof editor.getDraftState === 'function') {
      const draft = editor.getDraftState();
      if (draft) {
        const tab = this._activeTab as keyof EditorDraftCache;
        this._editorDraftCache = { ...this._editorDraftCache, [tab]: draft };
      }
    }
  }

  private _getEditorDraft(tab: PanelTab): unknown {
    const key = tab as keyof EditorDraftCache;
    const draft = this._editorDraftCache[key];
    if (draft) {
      // Clear the draft after retrieval (one-time restore)
      const { [key]: _, ...rest } = this._editorDraftCache;
      this._editorDraftCache = rest;
    }
    return draft;
  }

  private _clearEditorDraft(tab?: PanelTab): void {
    if (tab) {
      const key = tab as keyof EditorDraftCache;
      const { [key]: _, ...rest } = this._editorDraftCache;
      this._editorDraftCache = rest;
    } else {
      this._editorDraftCache = {};
    }
  }

  private _addFavorite(): void {
    if (!this._selectedEntities.length) return;

    // Set default name and show inline input
    const firstEntity = this._selectedEntities[0];
    const defaultName = this._selectedEntities.length === 1 && firstEntity
      ? this._getEntityFriendlyName(firstEntity)
      : this._localize('target.lights_count', { count: this._selectedEntities.length.toString() });

    this._favoriteInputName = defaultName;
    this._showFavoriteInput = true;
  }

  private async _saveFavorite(): Promise<void> {
    if (!this._selectedEntities.length || !this.hass) {
      this._cancelFavoriteInput();
      return;
    }

    try {
      const data = await this.hass.callApi<{ favorite: Favorite }>('POST', 'aqara_advanced_lighting/favorites', {
        entities: this._selectedEntities,
        name: this._favoriteInputName || undefined,
      });
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
    if (!this.hass) return;

    try {
      await this.hass.callApi('DELETE', `aqara_advanced_lighting/favorites/${favoriteId}`);
      this._favorites = this._favorites.filter((f) => f.id !== favoriteId);
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  }

  private _selectFavorite(favorite: Favorite): void {
    this._selectedEntities = [...favorite.entities];
    this._activeFavoriteId = favorite.id;
    // Load curvature from first T2 entity when favorite is selected
    this._loadCurvatureFromEntity();
    // Load zones for selected segment-capable devices
    this._loadZonesForSelectedDevices();
  }

  private _getEntityFriendlyName(entityId: string): string {
    if (!this.hass) return entityId;
    const state = this.hass.states[entityId];
    if (state && state.attributes.friendly_name) {
      return state.attributes.friendly_name as string;
    }
    return entityId.split('.')[1]?.replace(/_/g, ' ') || entityId;
  }

  private _getEntityIcon(entityId: string): string {
    if (!this.hass) return 'mdi:lightbulb';
    const state = this.hass.states[entityId];
    if (state) {
      // Use the entity's icon if available
      if (state.attributes.icon) {
        return state.attributes.icon as string;
      }
      // Use default icon based on entity domain
      const domain = entityId.split('.')[0];
      if (domain === 'light') {
        return 'mdi:lightbulb';
      }
    }
    return 'mdi:lightbulb';
  }

  private _getEntityState(entityId: string): string {
    if (!this.hass) return 'unavailable';
    const state = this.hass.states[entityId];
    return state ? state.state : 'unavailable';
  }

  private _getEntityColor(entityId: string): string | null {
    if (!this.hass) return null;
    const state = this.hass.states[entityId];
    if (!state || state.state !== 'on') return null;

    // Try to get RGB color
    if (state.attributes.rgb_color) {
      const [r, g, b] = state.attributes.rgb_color as number[];
      return `rgb(${r}, ${g}, ${b})`;
    }

    // Try to get HS color and convert to RGB (simplified)
    if (state.attributes.hs_color && Array.isArray(state.attributes.hs_color)) {
      const hsColor = state.attributes.hs_color as number[];
      if (hsColor.length >= 2 && typeof hsColor[0] === 'number' && typeof hsColor[1] === 'number') {
        const h = hsColor[0];
        const s = hsColor[1];
        // Convert HS to RGB for display
        const c = (s / 100) * 255;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = 255 - c;
        let r = 0, g = 0, b = 0;

        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }

        return `rgb(${Math.round(r + m)}, ${Math.round(g + m)}, ${Math.round(b + m)})`;
      }
    }

    return null;
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

      // First, check if this entity is in the backend's supported entities map
      const supportedEntity = this._supportedEntities.get(entityId);
      if (supportedEntity) {
        if (supportedEntity.device_type === 't1m') {
          // Distinguish T1M RGB from T1M White using supported_color_modes
          // Both endpoints share the same effect_list, so we check for xy/hs/rgb modes
          const colorModes = entity.attributes.supported_color_modes as string[] | undefined;
          const hasRGBMode = colorModes && Array.isArray(colorModes) &&
            colorModes.some(mode => ['xy', 'hs', 'rgb', 'rgbw', 'rgbww'].includes(mode));
          if (hasRGBMode) {
            deviceTypes.add('t1m');  // RGB endpoint
          } else {
            deviceTypes.add('t1m_white');  // White/CCT endpoint
          }
          continue;
        }
        // Use the device type from the backend - this is authoritative
        if (supportedEntity.device_type && supportedEntity.device_type !== 'unknown') {
          deviceTypes.add(supportedEntity.device_type);
          continue;
        }
      }

      // If the "include all lights" toggle is on, classify as generic light
      if (this._includeAllLights) {
        const colorModes = entity.attributes.supported_color_modes as string[] | undefined;
        const hasRGBMode = colorModes && Array.isArray(colorModes) &&
          colorModes.some(mode => ['xy', 'hs', 'rgb', 'rgbw', 'rgbww'].includes(mode));
        const hasCCTMode = colorModes && Array.isArray(colorModes) &&
          colorModes.includes('color_temp');

        if (hasRGBMode) {
          deviceTypes.add('generic_rgb');
          continue;
        } else if (hasCCTMode) {
          deviceTypes.add('generic_cct');
          continue;
        }
      }

      // Fallback: Try to detect device type from effect_list
      // (Zigbee2MQTT doesn't expose model in entity attributes)
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

    // Generic lights are not incompatible - only mark as incompatible if there are
    // truly unrecognized devices that aren't classified as generic
    this._hasIncompatibleLights = hasIncompatible
      && !deviceTypes.has('generic_rgb') && !deviceTypes.has('generic_cct');
    return Array.from(deviceTypes);
  }

  private _getT1StripSegmentCount(): number {
    // Default to 10 segments (2 meters - standard out-of-box T1 Strip length)
    const defaultSegments = 10;

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
            // 5 segments per meter - use Math.floor to match backend's int() behavior
            return Math.floor(lengthMeters * 5);
          }
        }
      }
    }

    return defaultSegments;
  }

  private _getDeviceContextForEditor(editorType: 'effect' | 'pattern' | 'segment' | 'cct'): DeviceContext {
    const deviceTypes = this._getSelectedDeviceTypes();

    if (deviceTypes.length === 0) {
      return { deviceType: null, hasSelection: false };
    }

    // Find the first device type compatible with the editor
    let compatibleType: string | null = null;

    switch (editorType) {
      case 'effect':
        // Effect editor supports t2_bulb, t1, t1m, t1_strip
        compatibleType = deviceTypes.find(
          (dt) => dt === 't2_bulb' || dt === 't1m' || dt === 't1_strip' || dt === 't1'
        ) ?? null;
        break;

      case 'pattern':
      case 'segment':
        // Pattern and segment editors only support T1 variants
        compatibleType = deviceTypes.find(
          (dt) => dt === 't1m' || dt === 't1_strip' || dt === 't1'
        ) ?? null;
        break;

      case 'cct':
        // CCT supports all devices - use first available
        compatibleType = deviceTypes[0] ?? null;
        break;
    }

    // Resolve zones for the first segment-capable selected device
    const resolvedZones = this._getResolvedZonesForSelection();

    return { deviceType: compatibleType, hasSelection: true, zones: resolvedZones };
  }

  /**
   * Get resolved zones (with 0-based segment indices) for the first
   * segment-capable device in the current selection.
   */
  private _getResolvedZonesForSelection(): SegmentZoneResolved[] {
    for (const entityId of this._selectedEntities) {
      const info = this._supportedEntities.get(entityId);
      if (!info?.ieee_address) continue;
      if (info.device_type !== 't1m' && info.device_type !== 't1_strip') continue;

      // T1 Strip has segment_count=0 in backend (variable based on length)
      const maxSegments = info.device_type === 't1_strip'
        ? this._getT1StripSegmentCount()
        : (info.segment_count || 0);
      if (maxSegments === 0) continue;

      const zones = this._deviceZones.get(info.ieee_address) || [];
      return zones.map(z => {
        // Parse the segment range string into 0-based indices
        const indices: number[] = [];
        for (const part of z.segments.split(',')) {
          const trimmed = part.trim();
          const rangeMatch = trimmed.match(/^(\d+)-(\d+)$/);
          if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
            const start = parseInt(rangeMatch[1], 10);
            const end = parseInt(rangeMatch[2], 10);
            for (let i = start; i <= end && i <= maxSegments; i++) {
              indices.push(i - 1); // Convert to 0-based
            }
          } else {
            const num = parseInt(trimmed, 10);
            if (!isNaN(num) && num >= 1 && num <= maxSegments) {
              indices.push(num - 1); // Convert to 0-based
            }
          }
        }
        return { name: z.name, segmentIndices: indices };
      });
    }
    return [];
  }

  // Compatibility checks for each tab - check actual entity capabilities
  // Effects: T2 RGB, T1M RGB, T1 Strip (entities with RGB effect_list)
  // Check if an entity has RGB color mode support (xy, hs, rgb, rgbw, rgbww)
  private _hasRGBColorMode(entity: { attributes: Record<string, unknown> }): boolean {
    const colorModes = entity.attributes.supported_color_modes as string[] | undefined;
    return !!colorModes && Array.isArray(colorModes) &&
      colorModes.some(mode => ['xy', 'hs', 'rgb', 'rgbw', 'rgbww'].includes(mode));
  }

  // Check if an entity is a T1M endpoint (has T1M-specific effects like flow1)
  private _isT1MEntity(entity: { attributes: Record<string, unknown> }): boolean {
    const effectList = entity.attributes.effect_list as string[] | undefined;
    return !!effectList && Array.isArray(effectList) && effectList.includes('flow1');
  }

  private _isEffectsCompatible(): boolean {
    if (!this.hass || !this._selectedEntities.length) return false;
    return this._selectedEntities.some(entityId => {
      // Only Aqara devices support MQTT-based effects
      if (!this._supportedEntities.has(entityId)) return false;
      const entity = this.hass!.states[entityId];
      if (!entity) return false;
      const effectList = entity.attributes.effect_list as string[] | undefined;
      if (!effectList || !Array.isArray(effectList) || effectList.length === 0) return false;
      // T1M white endpoint has effect_list but only supports CCT - exclude it
      if (this._isT1MEntity(entity) && !this._hasRGBColorMode(entity)) return false;
      return true;
    });
  }

  // Patterns: T1M RGB, T1 Strip only (entities with segment-capable effect_list and RGB color mode)
  private _isPatternsCompatible(): boolean {
    if (!this.hass || !this._selectedEntities.length) return false;
    return this._selectedEntities.some(entityId => {
      // Only Aqara devices support MQTT-based segment patterns
      if (!this._supportedEntities.has(entityId)) return false;
      const entity = this.hass!.states[entityId];
      if (!entity) return false;
      const effectList = entity.attributes.effect_list as string[] | undefined;
      if (!effectList || !Array.isArray(effectList)) return false;
      // T1M has flow1/flow2/rolling, T1 Strip has rainbow1/rainbow2/chasing/flicker/dash
      // T2 has candlelight but doesn't support patterns
      // T1M white endpoint has flow1 but only supports CCT - exclude it
      if (!(effectList.includes('flow1') || effectList.includes('rainbow1'))) return false;
      if (this._isT1MEntity(entity) && !this._hasRGBColorMode(entity)) return false;
      return true;
    });
  }

  // CCT: Entities with color_temp support (T2 RGB, T2 CCT, T1M White, T1 Strip)
  // T1M RGB endpoint has color_temp in supported_color_modes but doesn't support CCT sequences
  private _isCCTCompatible(): boolean {
    if (!this.hass || !this._selectedEntities.length) return false;
    return this._selectedEntities.some(entityId => {
      const entity = this.hass!.states[entityId];
      if (!entity) return false;
      // Must have color_temp attribute to support CCT sequences
      const hasCCT = entity.attributes.color_temp !== undefined ||
             entity.attributes.color_temp_kelvin !== undefined ||
             entity.attributes.min_color_temp_kelvin !== undefined;
      if (!hasCCT) return false;
      // T1M RGB endpoint has color_temp but doesn't support CCT sequences - exclude it
      if (this._isT1MEntity(entity) && this._hasRGBColorMode(entity)) return false;
      return true;
    });
  }

  // Segments: T1M RGB, T1 Strip only (entities with segment-capable effect_list and RGB color mode)
  private _isSegmentsCompatible(): boolean {
    if (!this.hass || !this._selectedEntities.length) return false;
    return this._selectedEntities.some(entityId => {
      // Only Aqara devices support MQTT-based segment sequences
      if (!this._supportedEntities.has(entityId)) return false;
      const entity = this.hass!.states[entityId];
      if (!entity) return false;
      const effectList = entity.attributes.effect_list as string[] | undefined;
      if (!effectList || !Array.isArray(effectList)) return false;
      // T1M has flow1/flow2/rolling, T1 Strip has rainbow1/rainbow2/chasing/flicker/dash
      // T2 has candlelight but doesn't support segments
      // T1M white endpoint has flow1 but only supports CCT - exclude it
      if (!(effectList.includes('flow1') || effectList.includes('rainbow1'))) return false;
      if (this._isT1MEntity(entity) && !this._hasRGBColorMode(entity)) return false;
      return true;
    });
  }

  // Filter methods - return only compatible entities from selection
  // These are used to send commands only to compatible devices when multiple device types are selected

  private _getEffectsCompatibleEntities(): string[] {
    if (!this.hass) return [];
    return this._selectedEntities.filter(entityId => {
      if (!this._supportedEntities.has(entityId)) return false;
      const entity = this.hass!.states[entityId];
      if (!entity) return false;
      const effectList = entity.attributes.effect_list as string[] | undefined;
      if (!effectList || !Array.isArray(effectList) || effectList.length === 0) return false;
      // T1M white endpoint has effect_list but only supports CCT - exclude it
      if (this._isT1MEntity(entity) && !this._hasRGBColorMode(entity)) return false;
      return true;
    });
  }

  private _getPatternsCompatibleEntities(): string[] {
    if (!this.hass) return [];
    return this._selectedEntities.filter(entityId => {
      if (!this._supportedEntities.has(entityId)) return false;
      const entity = this.hass!.states[entityId];
      if (!entity) return false;
      const effectList = entity.attributes.effect_list as string[] | undefined;
      if (!effectList || !Array.isArray(effectList)) return false;
      if (!(effectList.includes('flow1') || effectList.includes('rainbow1'))) return false;
      // T1M white endpoint has flow1 but only supports CCT - exclude it
      if (this._isT1MEntity(entity) && !this._hasRGBColorMode(entity)) return false;
      return true;
    });
  }

  private _getCCTCompatibleEntities(): string[] {
    if (!this.hass) return [];
    return this._selectedEntities.filter(entityId => {
      const entity = this.hass!.states[entityId];
      if (!entity) return false;
      const hasCCT = entity.attributes.color_temp !== undefined ||
             entity.attributes.color_temp_kelvin !== undefined ||
             entity.attributes.min_color_temp_kelvin !== undefined;
      if (!hasCCT) return false;
      // T1M RGB endpoint has color_temp but doesn't support CCT sequences - exclude it
      if (this._isT1MEntity(entity) && this._hasRGBColorMode(entity)) return false;
      return true;
    });
  }

  private _getSegmentsCompatibleEntities(): string[] {
    if (!this.hass) return [];
    return this._selectedEntities.filter(entityId => {
      if (!this._supportedEntities.has(entityId)) return false;
      const entity = this.hass!.states[entityId];
      if (!entity) return false;
      const effectList = entity.attributes.effect_list as string[] | undefined;
      if (!effectList || !Array.isArray(effectList)) return false;
      if (!(effectList.includes('flow1') || effectList.includes('rainbow1'))) return false;
      // T1M white endpoint has flow1 but only supports CCT - exclude it
      if (this._isT1MEntity(entity) && !this._hasRGBColorMode(entity)) return false;
      return true;
    });
  }

  // T2 devices only (for transition curve and initial brightness settings)
  // T2 RGB: has 'candlelight' in effect_list
  // T2 CCT: no effect_list but has color_temp attribute
  private _getT2CompatibleEntities(): string[] {
    if (!this.hass) return [];
    return this._selectedEntities.filter(entityId => {
      const entity = this.hass!.states[entityId];
      if (!entity) return false;
      const effectList = entity.attributes.effect_list as string[] | undefined;
      const isT2RGB = effectList && effectList.includes('candlelight');
      const isT2CCT = !effectList && entity.attributes.color_temp !== undefined;
      return isT2RGB || isT2CCT;
    });
  }

  private _filterPresets(): FilteredPresets {
    const deviceTypes = this._getSelectedDeviceTypes();
    const hasSelection = deviceTypes.length > 0;

    // Determine what sections to show based on selected endpoint capabilities
    // t1m = T1M RGB endpoint, t1m_white = T1M white/CCT endpoint
    const hasT2 = deviceTypes.includes('t2_bulb');
    const hasT2CCT = deviceTypes.includes('t2_cct');
    const hasT1M = deviceTypes.includes('t1m');
    const hasT1MWhite = deviceTypes.includes('t1m_white');
    const hasT1Strip = deviceTypes.includes('t1_strip');
    const hasGenericRGB = deviceTypes.includes('generic_rgb');
    const hasGenericCCT = deviceTypes.includes('generic_cct');

    // Effects, segment patterns, segment sequences: Aqara-only (require MQTT)
    const showDynamicEffects = hasSelection && (hasT2 || hasT1M || hasT1Strip);
    const showSegmentPatterns = hasSelection && (hasT1M || hasT1Strip);
    const showSegmentSequences = hasSelection && (hasT1M || hasT1Strip);
    // CCT sequences: Aqara + generic lights with color_temp support
    const showCCTSequences = hasSelection && (hasT2 || hasT2CCT || hasT1MWhite || hasT1Strip || hasGenericRGB || hasGenericCCT);
    // Dynamic scenes: Aqara RGB + generic RGB lights
    const showDynamicScenes = hasSelection && (hasT2 || hasT1M || hasT1Strip || hasGenericRGB);

    return {
      showDynamicEffects,
      showSegmentPatterns,
      showCCTSequences,
      showSegmentSequences,
      showDynamicScenes,
      hasT2,
      hasT1M,
      hasT1Strip,
      t2Presets: hasT2 ? (this._presets?.dynamic_effects.t2_bulb || []) : [],
      t1mPresets: hasT1M ? (this._presets?.dynamic_effects.t1m || []) : [],
      t1StripPresets: hasT1Strip ? (this._presets?.dynamic_effects.t1_strip || []) : [],
    };
  }

  private _handleEntityChanged(e: CustomEvent): void {
    const value = e.detail.value;
    if (!value) {
      this._selectedEntities = [];
      this._activeFavoriteId = null;
      return;
    }

    // Entity selector with multiple: true returns string[] directly
    if (Array.isArray(value)) {
      this._selectedEntities = value;
    } else {
      // Single entity case (shouldn't happen with multiple: true, but handle it)
      this._selectedEntities = [value];
    }

    // Clear active favorite when manually changing selection
    this._activeFavoriteId = null;

    // Load curvature from first T2 entity when selection changes
    this._loadCurvatureFromEntity();

    // Load zones for selected segment-capable devices
    this._loadZonesForSelectedDevices();
  }

  private _handleIncludeAllLightsToggle(e: Event): void {
    this._includeAllLights = (e.target as HTMLInputElement).checked;
    this._saveUserPreferences();

    // When toggling off, filter out non-Aqara lights from current selection
    if (!this._includeAllLights) {
      const supportedEntityIds = new Set(this._supportedEntities.keys());
      const filtered = this._selectedEntities.filter(id => supportedEntityIds.has(id));
      if (filtered.length !== this._selectedEntities.length) {
        this._selectedEntities = filtered;
      }
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
    this._saveUserPreferences();
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

  private async _activateDynamicScene(preset: DynamicScenePreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    // Use custom brightness override if enabled, otherwise use preset value
    const sceneBrightness = this._useCustomBrightness
      ? this._brightness
      : preset.scene_brightness_pct;

    const serviceData: Record<string, unknown> = {
      entity_id: this._selectedEntities,
      scene_name: preset.name,
      transition_time: preset.transition_time,
      hold_time: preset.hold_time,
      distribution_mode: preset.distribution_mode,
      random_order: preset.random_order,
      scene_brightness_pct: sceneBrightness,
      loop_mode: preset.loop_mode,
      end_behavior: preset.end_behavior,
    };

    // Add offset_delay only if provided and non-zero
    if (preset.offset_delay !== undefined && preset.offset_delay > 0) {
      serviceData.offset_delay = preset.offset_delay;
    }

    // Add loop_count only if loop_mode is 'loop'
    if (preset.loop_mode === 'loop' && preset.loop_count !== undefined) {
      serviceData.loop_count = preset.loop_count;
    }

    // Add colors array (service expects colors: [{x, y, brightness_pct}, ...])
    serviceData.colors = preset.colors.map((color) => ({
      x: color.x,
      y: color.y,
      brightness_pct: color.brightness_pct,
    }));

    await this.hass.callService('aqara_advanced_lighting', 'start_dynamic_scene', serviceData);
  }

  // --- Running operations rendering and actions ---

  private _getEntityName(entityId: string): string {
    const state = this.hass?.states?.[entityId];
    return (state?.attributes?.friendly_name as string) || entityId;
  }

  private _resolvePresetInfo(presetId: string | null): { name: string | null; icon: string | null } {
    if (!presetId) return { name: null, icon: null };

    // Search built-in effects (keyed by device type)
    if (this._presets?.dynamic_effects) {
      for (const presets of Object.values(this._presets.dynamic_effects)) {
        const found = presets.find(p => p.id === presetId);
        if (found) return { name: found.name, icon: found.icon || null };
      }
    }

    // Search built-in segment patterns
    const pattern = this._presets?.segment_patterns?.find(p => p.id === presetId);
    if (pattern) return { name: pattern.name, icon: pattern.icon || null };

    // Search built-in CCT sequences
    const cct = this._presets?.cct_sequences?.find(p => p.id === presetId);
    if (cct) return { name: cct.name, icon: cct.icon || null };

    // Search built-in segment sequences
    const seg = this._presets?.segment_sequences?.find(p => p.id === presetId);
    if (seg) return { name: seg.name, icon: seg.icon || null };

    // Search built-in dynamic scenes
    const scene = this._presets?.dynamic_scenes?.find(p => p.id === presetId);
    if (scene) return { name: scene.name, icon: scene.icon || null };

    // Search user presets (match by id or name)
    if (this._userPresets) {
      const allUserPresets = [
        ...(this._userPresets.effect_presets || []),
        ...(this._userPresets.segment_pattern_presets || []),
        ...(this._userPresets.cct_sequence_presets || []),
        ...(this._userPresets.segment_sequence_presets || []),
        ...(this._userPresets.dynamic_scene_presets || []),
      ];
      const userPreset = allUserPresets.find(
        p => p.id === presetId || p.name === presetId,
      );
      if (userPreset) return { name: userPreset.name, icon: userPreset.icon || null };
    }

    return { name: presetId, icon: null };
  }

  private _renderRunningOperations() {
    if (this._runningOperations.length === 0) {
      return html`
        <div class="running-ops-empty">
          ${this._localize('target.no_running_operations')}
        </div>
      `;
    }

    return html`
      <div class="running-ops-container">
        <span class="control-label">${this._localize('target.running_operations_label')}</span>
        <div class="running-ops-list">
          ${this._runningOperations.map(op => this._renderOperationCard(op))}
        </div>
      </div>
    `;
  }

  private _renderOperationCard(op: RunningOperation) {
    switch (op.type) {
      case 'effect':
        return this._renderEffectOp(op);
      case 'cct_sequence':
      case 'segment_sequence':
        return this._renderSequenceOp(op);
      case 'dynamic_scene':
        return this._renderSceneOp(op);
      default:
        return '';
    }
  }

  private _renderEffectOp(op: RunningOperation) {
    const entityName = this._getEntityName(op.entity_id!);
    const preset = this._resolvePresetInfo(op.preset_id);
    return html`
      <div class="running-op-card">
        <div class="running-op-info">
          <ha-icon class="running-op-icon" icon="${preset.icon || 'mdi:palette'}"></ha-icon>
          <div class="running-op-details">
            <span class="running-op-name">${preset.name || this._localize('target.effect_button')}</span>
            <span class="running-op-entity"><span class="running-op-entity-name">${entityName}</span></span>
          </div>
        </div>
        <div class="running-op-actions">
          <ha-icon-button
            .label=${this._localize('target.stop')}
            @click=${() => this._stopRunningEffect(op.entity_id!)}
          >
            <ha-icon icon="mdi:stop"></ha-icon>
          </ha-icon-button>
        </div>
      </div>
    `;
  }

  private _renderSequenceOp(op: RunningOperation) {
    const entityName = this._getEntityName(op.entity_id!);
    const preset = this._resolvePresetInfo(op.preset_id);
    const isCCT = op.type === 'cct_sequence';
    const fallbackIcon = isCCT ? 'mdi:thermometer' : 'mdi:led-strip-variant';
    const typeLabel = isCCT
      ? this._localize('target.cct_button')
      : this._localize('target.segment_button');
    const progressText = op.total_steps
      ? `${(op.current_step || 0) + 1}/${op.total_steps}`
      : '';

    return html`
      <div class="running-op-card ${op.externally_paused ? 'externally-paused' : ''}">
        <div class="running-op-info">
          <ha-icon class="running-op-icon" icon="${preset.icon || fallbackIcon}"></ha-icon>
          <div class="running-op-details">
            <span class="running-op-name">${preset.name || typeLabel}</span>
            <span class="running-op-entity">
              <span class="running-op-entity-name">${entityName}</span>
              ${progressText ? html`<span class="running-op-progress">${progressText}</span>` : ''}
              ${op.paused ? html`<span class="running-op-status">${this._localize('target.paused')}</span>` : ''}
              ${op.externally_paused ? html`<span class="running-op-status externally-paused-text">${this._localize('target.externally_paused')}</span>` : ''}
            </span>
          </div>
        </div>
        <div class="running-op-actions">
          ${op.externally_paused
            ? html`
                <ha-icon-button
                  .label=${this._localize('target.resume_control')}
                  @click=${() => this._resumeEntityControl(op.entity_id!)}
                >
                  <ha-icon icon="mdi:play-circle-outline"></ha-icon>
                </ha-icon-button>
              `
            : html`
                <ha-icon-button
                  .label=${op.paused ? this._localize('target.resume') : this._localize('target.pause')}
                  @click=${() => this._toggleSequencePause(op)}
                >
                  <ha-icon icon="mdi:${op.paused ? 'play' : 'pause'}"></ha-icon>
                </ha-icon-button>
              `
          }
          <ha-icon-button
            .label=${this._localize('target.stop')}
            @click=${() => this._stopRunningSequence(op)}
          >
            <ha-icon icon="mdi:stop"></ha-icon>
          </ha-icon-button>
        </div>
      </div>
    `;
  }

  private _renderSceneOp(op: RunningOperation) {
    const preset = this._resolvePresetInfo(op.preset_id);
    const entityNames = (op.entity_ids || [])
      .map(id => this._getEntityName(id))
      .join(', ');
    const extPausedEntities = op.externally_paused_entities || [];

    return html`
      <div class="running-op-card">
        <div class="running-op-info">
          <ha-icon class="running-op-icon" icon="${preset.icon || 'mdi:palette-swatch-variant'}"></ha-icon>
          <div class="running-op-details">
            <span class="running-op-name">${preset.name || this._localize('target.scene_button')}</span>
            <span class="running-op-entity">
              <span class="running-op-entity-name">${entityNames}</span>
              ${op.paused ? html`<span class="running-op-status">${this._localize('target.paused')}</span>` : ''}
              ${extPausedEntities.length > 0
                ? html`<span class="running-op-status externally-paused-text">
                    ${this._localize('target.entities_externally_paused', { count: String(extPausedEntities.length) })}
                  </span>`
                : ''}
            </span>
          </div>
        </div>
        <div class="running-op-actions">
          ${extPausedEntities.length > 0
            ? html`
                <ha-icon-button
                  .label=${this._localize('target.resume_control')}
                  @click=${() => this._resumeSceneEntities(extPausedEntities)}
                >
                  <ha-icon icon="mdi:play-circle-outline"></ha-icon>
                </ha-icon-button>
              `
            : ''}
          <ha-icon-button
            .label=${op.paused ? this._localize('target.resume') : this._localize('target.pause')}
            @click=${() => this._toggleScenePause(op)}
          >
            <ha-icon icon="mdi:${op.paused ? 'play' : 'pause'}"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            .label=${this._localize('target.stop')}
            @click=${() => this._stopRunningScene(op)}
          >
            <ha-icon icon="mdi:stop"></ha-icon>
          </ha-icon-button>
        </div>
      </div>
    `;
  }

  private async _stopRunningEffect(entityId: string): Promise<void> {
    await this.hass.callService('aqara_advanced_lighting', 'stop_effect', {
      entity_id: [entityId],
      restore_state: true,
    });
  }

  private async _toggleSequencePause(op: RunningOperation): Promise<void> {
    if (!op.entity_id) return;
    const isCCT = op.type === 'cct_sequence';
    const service = op.paused
      ? (isCCT ? 'resume_cct_sequence' : 'resume_segment_sequence')
      : (isCCT ? 'pause_cct_sequence' : 'pause_segment_sequence');
    await this.hass.callService('aqara_advanced_lighting', service, {
      entity_id: [op.entity_id],
    });
  }

  private async _stopRunningSequence(op: RunningOperation): Promise<void> {
    if (!op.entity_id) return;
    const service = op.type === 'cct_sequence'
      ? 'stop_cct_sequence'
      : 'stop_segment_sequence';
    await this.hass.callService('aqara_advanced_lighting', service, {
      entity_id: [op.entity_id],
    });
  }

  private async _toggleScenePause(op: RunningOperation): Promise<void> {
    if (!op.entity_ids?.length) return;
    const service = op.paused ? 'resume_dynamic_scene' : 'pause_dynamic_scene';
    await this.hass.callService('aqara_advanced_lighting', service, {
      entity_id: op.entity_ids,
    });
  }

  private async _stopRunningScene(op: RunningOperation): Promise<void> {
    if (!op.entity_ids?.length) return;
    await this.hass.callService('aqara_advanced_lighting', 'stop_dynamic_scene', {
      entity_id: op.entity_ids,
    });
  }

  private async _resumeEntityControl(entityId: string): Promise<void> {
    await this.hass.callService('aqara_advanced_lighting', 'resume_entity_control', {
      entity_id: [entityId],
    });
  }

  private async _resumeSceneEntities(entityIds: string[]): Promise<void> {
    await this.hass.callService('aqara_advanced_lighting', 'resume_entity_control', {
      entity_id: entityIds,
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

  private _getUserPatternPresetsForDeviceType(deviceType: string): UserSegmentPatternPreset[] {
    if (!this._userPresets?.segment_pattern_presets) return [];

    return this._userPresets.segment_pattern_presets.filter((preset) => {
      // If preset has no device_type, show in all sections
      if (!preset.device_type) return true;
      // Match t1 and t1m presets
      if (deviceType === 't1m' && (preset.device_type === 't1' || preset.device_type === 't1m')) {
        return true;
      }
      return preset.device_type === deviceType;
    });
  }

  private _getFilteredUserCCTSequencePresets(): UserCCTSequencePreset[] {
    if (!this._userPresets?.cct_sequence_presets) return [];
    const deviceTypes = this._getSelectedDeviceTypes();
    // CCT sequences apply to all lights
    return deviceTypes.length > 0 ? this._userPresets.cct_sequence_presets : [];
  }

  private _getUserSegmentSequencePresetsForDeviceType(deviceType: string): UserSegmentSequencePreset[] {
    if (!this._userPresets?.segment_sequence_presets) return [];

    return this._userPresets.segment_sequence_presets.filter((preset) => {
      // If preset has no device_type, show in all sections
      if (!preset.device_type) return true;
      // Match t1 and t1m presets
      if (deviceType === 't1m' && (preset.device_type === 't1' || preset.device_type === 't1m')) {
        return true;
      }
      return preset.device_type === deviceType;
    });
  }

  private _getFilteredUserDynamicScenePresets(): UserDynamicScenePreset[] {
    if (!this._userPresets?.dynamic_scene_presets) return [];
    const deviceTypes = this._getSelectedDeviceTypes();
    // Dynamic scenes apply to all RGB-capable lights
    return deviceTypes.length > 0 ? this._userPresets.dynamic_scene_presets : [];
  }

  // Activate user presets
  private async _activateUserEffectPreset(preset: UserEffectPreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    const serviceData: Record<string, unknown> = {
      entity_id: this._selectedEntities,
      effect: preset.effect,
      speed: preset.effect_speed,
      preset: preset.name,
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
      preset: preset.name,
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
      preset: preset.name,
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
      preset: preset.name,
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

  private async _activateUserDynamicScenePreset(preset: UserDynamicScenePreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    // Use custom brightness override if enabled, otherwise use preset value
    const sceneBrightness = this._useCustomBrightness
      ? this._brightness
      : preset.scene_brightness_pct;

    const serviceData: Record<string, unknown> = {
      entity_id: this._selectedEntities,
      scene_name: preset.name,
      transition_time: preset.transition_time,
      hold_time: preset.hold_time,
      distribution_mode: preset.distribution_mode,
      random_order: preset.random_order,
      scene_brightness_pct: sceneBrightness,
      loop_mode: preset.loop_mode,
      end_behavior: preset.end_behavior,
    };

    // Add offset_delay only if provided and non-zero
    if (preset.offset_delay !== undefined && preset.offset_delay > 0) {
      serviceData.offset_delay = preset.offset_delay;
    }

    // Add loop_count only if loop_mode is 'loop'
    if (preset.loop_mode === 'loop' && preset.loop_count !== undefined) {
      serviceData.loop_count = preset.loop_count;
    }

    // Add colors array (service expects colors: [{x, y, brightness_pct}, ...])
    serviceData.colors = preset.colors.map((color) => ({
      x: color.x,
      y: color.y,
      brightness_pct: color.brightness_pct,
    }));

    await this.hass.callService('aqara_advanced_lighting', 'start_dynamic_scene', serviceData);
  }

  protected render() {
    if (this._loading) {
      return html`
        <div class="header">
          <div class="toolbar">
            <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
            <div class="main-title">${this._localize('title')}</div>
          </div>
        </div>
        <div class="content">
          <div class="loading">${this._localize('errors.loading_presets')}</div>
        </div>
      `;
    }

    if (this._error) {
      return html`
        <div class="header">
          <div class="toolbar">
            <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
            <div class="main-title">${this._localize('title')}</div>
          </div>
        </div>
        <div class="content">
          <ha-alert alert-type="error" title="${this._localize('errors.title')}">
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
            <div class="main-title">${this._localize('title')}</div>
          </div>
        </div>
        <div class="content">
          <ha-alert alert-type="warning" title="${this._localize('errors.no_presets_title')}">
            ${this._localize('errors.no_presets_message')}
          </ha-alert>
        </div>
      `;
    }

    const versionMismatch = this._backendVersion && this._backendVersion !== this._frontendVersion;

    return html`
      <div class="header">
        <div class="toolbar">
          <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
          <div class="main-title">${this._localize('title')}</div>
          ${this._backendVersion ? html`
            <div
              class="version-display ${versionMismatch ? 'version-mismatch' : ''}"
              title="${versionMismatch ? this._localize('tooltips.version_mismatch', { backend: this._backendVersion, frontend: this._frontendVersion }) : `v${this._backendVersion}`}"
            >
              ${versionMismatch ? html`
                <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
                <span class="version-text">v${this._backendVersion} / v${this._frontendVersion}</span>
              ` : html`
                <span class="version-text">v${this._backendVersion}</span>
              `}
            </div>
          ` : ''}
        </div>
        <ha-tab-group @wa-tab-show=${this._handleTabChange}>
          <ha-tab-group-tab slot="nav" panel="activate" .active=${this._activeTab === 'activate'}>
            ${this._localize('tabs.activate')}
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="scenes" .active=${this._activeTab === 'scenes'}>
            ${this._localize('tabs.scenes')}
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="effects" .active=${this._activeTab === 'effects'}>
            ${this._localize('tabs.effects')}
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="patterns" .active=${this._activeTab === 'patterns'}>
            ${this._localize('tabs.patterns')}
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="cct" .active=${this._activeTab === 'cct'}>
            ${this._localize('tabs.cct')}
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="segments" .active=${this._activeTab === 'segments'}>
            ${this._localize('tabs.segments')}
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="presets" .active=${this._activeTab === 'presets'}>
            ${this._localize('tabs.presets')}
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="config" .active=${this._activeTab === 'config'}>
            ${this._localize('tabs.config')}
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
      case 'scenes':
        return this._renderScenesTab();
      case 'presets':
        return this._renderPresetsTab();
      case 'config':
        return this._renderConfigTab();
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
            <div class="section-title">${this._localize('target.section_title')}</div>
            <div class="section-subtitle">${hasSelection ? this._localize(this._selectedEntities.length === 1 ? 'target.lights_selected' : 'target.lights_selected_plural', {count: this._selectedEntities.length.toString()}) : this._localize('target.select_lights')}</div>
          </div>
        </div>
        <div class="section-content controls-content">
          <div class="target-favorites-grid">
            <div class="control-row">
              <span class="control-label">${this._localize('target.lights_label')}</span>
              <div class="control-input target-input">
                <div class="target-selector">
                  <ha-selector
                    .hass=${this.hass}
                    .selector=${{
                      entity: {
                        multiple: true,
                        domain: 'light',
                        // Filter to only show supported Aqara entities unless toggle is on
                        ...(!this._includeAllLights && this._supportedEntities.size > 0
                          ? { include_entities: Array.from(this._supportedEntities.keys()) }
                          : {}),
                      },
                    }}
                    .value=${this._selectedEntities}
                    @value-changed=${this._handleEntityChanged}
                  ></ha-selector>
                  <div class="include-all-lights-toggle">
                    <label class="toggle-label">
                      <ha-switch
                        .checked=${this._includeAllLights}
                        @change=${this._handleIncludeAllLightsToggle}
                        title="${this._localize('target.include_all_lights_hint')}"
                      ></ha-switch>
                      <span>${this._localize('target.include_all_lights_label')}</span>
                    </label>
                  </div>
                </div>
                ${hasSelection && !this._showFavoriteInput
                  ? html`
                      <ha-icon-button
                        class="add-favorite-btn"
                        @click=${this._addFavorite}
                        title="${this._localize('tooltips.favorite_save')}"
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
                    <span class="control-label">${this._localize('target.favorites_label')}</span>
                    <div class="control-input favorites-container">
                      ${this._favorites.map((favorite) => {
                        const firstEntity = favorite.entities[0] || '';
                        const entityIcon = this._getEntityIcon(firstEntity);
                        const entityCount = favorite.entities.length;
                        const entityState = this._getEntityState(firstEntity);
                        const entityColor = this._getEntityColor(firstEntity);
                        const isOn = entityState === 'on';
                        const isUnavailable = entityState === 'unavailable' || entityState === 'unknown';
                        const isActive = this._activeFavoriteId === favorite.id;

                        // Determine icon background and color styles
                        let iconBackgroundStyle = '';
                        let iconColorStyle = '';
                        if (entityColor) {
                          // Extract RGB values and create rgba with 0.2 opacity for background
                          const rgbMatch = entityColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                          if (rgbMatch) {
                            const [, r, g, b] = rgbMatch;
                            iconBackgroundStyle = `background: rgba(${r}, ${g}, ${b}, 0.2);`;
                            iconColorStyle = `color: ${entityColor};`;
                          }
                        }

                        return html`
                          <div class="favorite-button ${isOn ? 'state-on' : 'state-off'} ${isUnavailable ? 'state-unavailable' : ''} ${isActive ? 'selected' : ''}" @click=${() => this._selectFavorite(favorite)}>
                            <div class="favorite-button-icon" style="${iconBackgroundStyle}">
                              <ha-icon icon="${entityIcon}" style="${iconColorStyle}"></ha-icon>
                            </div>
                            <div class="favorite-button-content">
                              <div class="favorite-button-name">${favorite.name}</div>
                              ${entityCount > 1
                                ? html`<div class="favorite-button-count">${this._localize('target.favorite_lights_count', { count: entityCount.toString() })}</div>`
                                : ''}
                            </div>
                            <ha-icon-button
                              class="favorite-button-remove"
                              @click=${(e: Event) => {
                                e.stopPropagation();
                                this._removeFavorite(favorite.id);
                              }}
                              title="${this._localize('tooltips.favorite_remove')}"
                            >
                              <ha-icon icon="mdi:close"></ha-icon>
                            </ha-icon-button>
                          </div>
                        `;
                      })}
                    </div>
                  </div>
                `
              : ''}
          </div>

          ${this._showFavoriteInput
            ? html`
                <div class="control-row">
                  <span class="control-label">${this._localize('target.favorite_name_label')}</span>
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
                        ${this._localize('editors.save_button')}
                      </ha-button>
                      <ha-button @click=${this._cancelFavoriteInput}>
                        <ha-icon icon="mdi:close"></ha-icon>
                        ${this._localize('editors.cancel_button')}
                      </ha-button>
                    </div>
                  </div>
                </div>
              `
            : ''}

          ${hasSelection
            ? html`
                <div class="control-row">
                  <span class="control-label">${this._localize('target.light_control_label')}</span>
                  <div class="control-input light-tile-container" ${ref(this._tileCardRef)}>
                  </div>
                </div>
              `
            : ''}
        </div>
      </ha-expansion-panel>

      ${hasSelection || this._runningOperations.length > 0
        ? html`
            <ha-expansion-panel
              outlined
              .expanded=${!this._collapsed['controls']}
              @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange('controls', e)}
            >
              <div slot="header" class="section-header">
                <div>
                  <div class="section-title">${this._localize('target.controls_card_title')}</div>
                </div>
              </div>
              <div class="section-content controls-content">
                ${this._renderRunningOperations()}

                ${hasSelection
                  ? html`
                      <div class="brightness-override-section">
                        <div class="form-section">
                          <span class="form-label">${this._localize('target.custom_brightness_label')}</span>
                          <ha-switch
                            .checked=${this._useCustomBrightness}
                            @change=${this._handleCustomBrightnessToggle}
                          ></ha-switch>
                        </div>

                        ${this._useCustomBrightness
                          ? html`
                              <div class="brightness-slider">
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
                            `
                          : ''}
                      </div>
                    `
                  : ''}
              </div>
            </ha-expansion-panel>
          `
        : ''}

      ${!hasSelection
        ? html`<div class="no-lights">${this._localize('target.no_lights_message')}</div>`
        : ''}

      ${this._hasIncompatibleLights
        ? html`
            <ha-alert alert-type="error" title="${this._localize('errors.incompatible_light_title')}">
              ${this._localize('errors.incompatible_light_message')}
            </ha-alert>
          `
        : ''}

      ${hasSelection ? this._renderFavoritesSection() : ''}

      ${filtered.showDynamicScenes && ((this._presets?.dynamic_scenes?.length ?? 0) > 0 || this._getFilteredUserDynamicScenePresets().length > 0) && !this._hasIncompatibleLights
        ? this._renderDynamicScenesSection()
        : ''}

      ${filtered.showDynamicEffects && !this._hasIncompatibleLights
        ? html`
            ${filtered.hasT2 && (filtered.t2Presets.length > 0 || this._getUserEffectPresetsForDeviceType('t2_bulb').length > 0)
              ? this._renderDynamicEffectsSection(this._localize('devices.t2_bulb'), filtered.t2Presets, 't2_bulb')
              : ''}
            ${filtered.hasT1M && (filtered.t1mPresets.length > 0 || this._getUserEffectPresetsForDeviceType('t1m').length > 0)
              ? this._renderDynamicEffectsSection(this._localize('devices.t1m'), filtered.t1mPresets, 't1m')
              : ''}
            ${filtered.hasT1Strip && (filtered.t1StripPresets.length > 0 || this._getUserEffectPresetsForDeviceType('t1_strip').length > 0)
              ? this._renderDynamicEffectsSection(this._localize('devices.t1_strip'), filtered.t1StripPresets, 't1_strip')
              : ''}
          `
        : ''}

      ${filtered.showSegmentPatterns && !this._hasIncompatibleLights
        ? html`
            ${filtered.hasT1M && ((this._presets?.segment_patterns?.length ?? 0) > 0 || this._getUserPatternPresetsForDeviceType('t1m').length > 0)
              ? this._renderSegmentPatternsSection(this._localize('devices.t1m'), this._presets?.segment_patterns || [], 't1m')
              : ''}
            ${filtered.hasT1Strip && ((this._presets?.segment_patterns?.length ?? 0) > 0 || this._getUserPatternPresetsForDeviceType('t1_strip').length > 0)
              ? this._renderSegmentPatternsSection(this._localize('devices.t1_strip'), this._presets?.segment_patterns || [], 't1_strip')
              : ''}
          `
        : ''}

      ${filtered.showCCTSequences && ((this._presets?.cct_sequences?.length ?? 0) > 0 || this._getFilteredUserCCTSequencePresets().length > 0) && !this._hasIncompatibleLights
        ? this._renderCCTSequencesSection()
        : ''}

      ${filtered.showSegmentSequences && !this._hasIncompatibleLights
        ? html`
            ${filtered.hasT1M && ((this._presets?.segment_sequences?.length ?? 0) > 0 || this._getUserSegmentSequencePresetsForDeviceType('t1m').length > 0)
              ? this._renderSegmentSequencesSection(this._localize('devices.t1m'), this._presets?.segment_sequences || [], 't1m')
              : ''}
            ${filtered.hasT1Strip && ((this._presets?.segment_sequences?.length ?? 0) > 0 || this._getUserSegmentSequencePresetsForDeviceType('t1_strip').length > 0)
              ? this._renderSegmentSequencesSection(this._localize('devices.t1_strip'), this._presets?.segment_sequences || [], 't1_strip')
              : ''}
          `
        : ''}
    `;
  }

  private _renderEffectsTab() {
    const editingEffect = this._editingPreset?.type === 'effect' ? this._editingPreset.preset as UserEffectPreset : undefined;
    const isCompatible = this._isEffectsCompatible();
    const hasSelection = this._selectedEntities.length > 0;

    return html`
      <ha-card class="editor-form">
        <h2>${editingEffect ? this._localize('dialogs.edit_effect_title') : this._localize('dialogs.create_effect_title')}</h2>
        <p class="editor-description">
          ${editingEffect ? this._localize('dialogs.edit_effect_description') : this._localize('dialogs.create_effect_description')}
        </p>
        ${hasSelection && !isCompatible ? html`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize('dialogs.compatibility_warning_effects')}
          </ha-alert>
        ` : ''}
        <effect-editor
          .hass=${this.hass}
          .preset=${editingEffect}
          .draft=${this._getEditorDraft('effects')}
          .translations=${this._translations}
          .editMode=${!!editingEffect && !this._editingPreset?.isDuplicate}
          .hasSelectedEntities=${hasSelection}
          .isCompatible=${isCompatible}
          .previewActive=${this._effectPreviewActive}
          .stripSegmentCount=${this._getT1StripSegmentCount()}
          .deviceContext=${this._getDeviceContextForEditor('effect')}
          .colorHistory=${this._colorHistory}
          @save=${this._handleEffectSave}
          @preview=${this._handleEffectPreview}
          @stop-preview=${this._handleEffectStopPreview}
          @cancel=${this._handleEditorCancel}
        ></effect-editor>
      </ha-card>
    `;
  }

  private async _handleEffectSave(e: CustomEvent): Promise<void> {
    if (this._editingPreset?.type === 'effect' && !this._editingPreset.isDuplicate) {
      const existingPreset = this._editingPreset.preset as UserEffectPreset;
      await this._updateUserPreset('effect', existingPreset.id, e.detail);
    } else {
      await this._saveUserPreset('effect', e.detail);
    }
    this._clearEditorDraft('effects');
    this._editingPreset = undefined;
    this._setActiveTab('presets');
  }

  private _handleEditorCancel(): void {
    this._clearEditorDraft(this._activeTab);
    this._resetCurrentEditor();
    this._editingPreset = undefined;
    this._setActiveTab('activate');
  }

  private _resetCurrentEditor(): void {
    const editorSelectors: Partial<Record<PanelTab, string>> = {
      effects: 'effect-editor',
      patterns: 'pattern-editor',
      cct: 'cct-sequence-editor',
      segments: 'segment-sequence-editor',
      scenes: 'dynamic-scene-editor',
    };

    const selector = editorSelectors[this._activeTab];
    if (!selector) return;

    const editor = this.shadowRoot?.querySelector(selector) as
      | { resetToDefaults?: () => void }
      | null;
    if (editor && typeof editor.resetToDefaults === 'function') {
      editor.resetToDefaults();
    }
  }

  private async _handleEffectPreview(e: CustomEvent): Promise<void> {
    const compatibleEntities = this._getEffectsCompatibleEntities();
    if (!compatibleEntities.length) {
      console.warn('No compatible entities selected for effect preview');
      return;
    }

    const data = e.detail;
    const serviceData: Record<string, unknown> = {
      entity_id: compatibleEntities,
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
    const compatibleEntities = this._getEffectsCompatibleEntities();
    if (!compatibleEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'stop_effect', {
      entity_id: compatibleEntities,
      restore_state: true,
    });
    this._effectPreviewActive = false;
  }

  private _renderPatternsTab() {
    const editingPattern = this._editingPreset?.type === 'pattern' ? this._editingPreset.preset as UserSegmentPatternPreset : undefined;
    const isCompatible = this._isPatternsCompatible();
    const hasSelection = this._selectedEntities.length > 0;

    return html`
      <ha-card class="editor-form">
        <h2>${editingPattern ? this._localize('dialogs.edit_pattern_title') : this._localize('dialogs.create_pattern_title')}</h2>
        <p class="editor-description">
          ${editingPattern ? this._localize('dialogs.edit_pattern_description') : this._localize('dialogs.create_pattern_description')}
        </p>
        ${hasSelection && !isCompatible ? html`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize('dialogs.compatibility_warning_patterns')}
          </ha-alert>
        ` : ''}
        <pattern-editor
          .hass=${this.hass}
          .preset=${editingPattern}
          .draft=${this._getEditorDraft('patterns')}
          .translations=${this._translations}
          .editMode=${!!editingPattern && !this._editingPreset?.isDuplicate}
          .hasSelectedEntities=${hasSelection}
          .isCompatible=${isCompatible}
          .stripSegmentCount=${this._getT1StripSegmentCount()}
          .deviceContext=${this._getDeviceContextForEditor('pattern')}
          .colorHistory=${this._colorHistory}
          @save=${this._handlePatternSave}
          @preview=${this._handlePatternPreview}
          @cancel=${this._handleEditorCancel}
        ></pattern-editor>
      </ha-card>
    `;
  }

  private async _handlePatternSave(e: CustomEvent): Promise<void> {
    if (this._editingPreset?.type === 'pattern' && !this._editingPreset.isDuplicate) {
      const existingPreset = this._editingPreset.preset as UserSegmentPatternPreset;
      await this._updateUserPreset('segment_pattern', existingPreset.id, e.detail);
    } else {
      await this._saveUserPreset('segment_pattern', e.detail);
    }
    this._clearEditorDraft('patterns');
    this._editingPreset = undefined;
    this._setActiveTab('presets');
  }

  private async _handlePatternPreview(e: CustomEvent): Promise<void> {
    const compatibleEntities = this._getPatternsCompatibleEntities();
    if (!compatibleEntities.length) {
      console.warn('No compatible entities selected for pattern preview');
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
        entity_id: compatibleEntities,
        segment_colors,
        turn_on: true,
        turn_off_unspecified: data.turn_off_unspecified ?? true,
        sync: true,
      });
    } catch (err) {
      console.error('Pattern preview service call failed:', err);
    }
  }

  private _renderCCTTab() {
    const editingCCT = this._editingPreset?.type === 'cct' ? this._editingPreset.preset as UserCCTSequencePreset : undefined;
    const isCompatible = this._isCCTCompatible();
    const hasSelection = this._selectedEntities.length > 0;

    return html`
      <ha-card class="editor-form">
        <h2>${editingCCT ? this._localize('dialogs.edit_cct_title') : this._localize('dialogs.create_cct_title')}</h2>
        <p class="editor-description">
          ${editingCCT ? this._localize('dialogs.edit_cct_description') : this._localize('dialogs.create_cct_description')}
        </p>
        ${hasSelection && !isCompatible ? html`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize('dialogs.compatibility_warning_cct')}
          </ha-alert>
        ` : ''}
        <cct-sequence-editor
          .hass=${this.hass}
          .preset=${editingCCT}
          .draft=${this._getEditorDraft('cct')}
          .translations=${this._translations}
          .editMode=${!!editingCCT && !this._editingPreset?.isDuplicate}
          .hasSelectedEntities=${hasSelection}
          .isCompatible=${isCompatible}
          .selectedEntities=${this._selectedEntities}
          .previewActive=${this._cctPreviewActive}
          .deviceContext=${this._getDeviceContextForEditor('cct')}
          @save=${this._handleCCTSave}
          @preview=${this._handleCCTPreview}
          @stop-preview=${this._handleCCTStopPreview}
          @cancel=${this._handleEditorCancel}
        ></cct-sequence-editor>
      </ha-card>
    `;
  }

  private async _handleCCTSave(e: CustomEvent): Promise<void> {
    if (this._editingPreset?.type === 'cct' && !this._editingPreset.isDuplicate) {
      const existingPreset = this._editingPreset.preset as UserCCTSequencePreset;
      await this._updateUserPreset('cct_sequence', existingPreset.id, e.detail);
    } else {
      await this._saveUserPreset('cct_sequence', e.detail);
    }
    this._clearEditorDraft('cct');
    this._editingPreset = undefined;
    this._setActiveTab('presets');
  }

  private async _handleCCTPreview(e: CustomEvent): Promise<void> {
    const compatibleEntities = this._getCCTCompatibleEntities();
    if (!compatibleEntities.length) {
      console.warn('No compatible entities selected for CCT preview');
      return;
    }

    const data = e.detail;
    const serviceData: Record<string, unknown> = {
      entity_id: compatibleEntities,
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
    const compatibleEntities = this._getCCTCompatibleEntities();
    if (!compatibleEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'stop_cct_sequence', {
      entity_id: compatibleEntities,
    });
    this._cctPreviewActive = false;
  }

  private _renderSegmentsTab() {
    const editingSegment = this._editingPreset?.type === 'segment' ? this._editingPreset.preset as UserSegmentSequencePreset : undefined;
    const isCompatible = this._isSegmentsCompatible();
    const hasSelection = this._selectedEntities.length > 0;

    return html`
      <ha-card class="editor-form">
        <h2>${editingSegment ? this._localize('dialogs.edit_segment_title') : this._localize('dialogs.create_segment_title')}</h2>
        <p class="editor-description">
          ${editingSegment ? this._localize('dialogs.edit_segment_description') : this._localize('dialogs.create_segment_description')}
        </p>
        ${hasSelection && !isCompatible ? html`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize('dialogs.compatibility_warning_segments')}
          </ha-alert>
        ` : ''}
        <segment-sequence-editor
          .hass=${this.hass}
          .preset=${editingSegment}
          .draft=${this._getEditorDraft('segments')}
          .translations=${this._translations}
          .editMode=${!!editingSegment && !this._editingPreset?.isDuplicate}
          .hasSelectedEntities=${hasSelection}
          .isCompatible=${isCompatible}
          .previewActive=${this._segmentSequencePreviewActive}
          .stripSegmentCount=${this._getT1StripSegmentCount()}
          .deviceContext=${this._getDeviceContextForEditor('segment')}
          .colorHistory=${this._colorHistory}
          @save=${this._handleSegmentSequenceSave}
          @preview=${this._handleSegmentSequencePreview}
          @stop-preview=${this._handleSegmentSequenceStopPreview}
          @cancel=${this._handleEditorCancel}
        ></segment-sequence-editor>
      </ha-card>
    `;
  }

  private async _handleSegmentSequenceSave(e: CustomEvent): Promise<void> {
    if (this._editingPreset?.type === 'segment' && !this._editingPreset.isDuplicate) {
      const existingPreset = this._editingPreset.preset as UserSegmentSequencePreset;
      await this._updateUserPreset('segment_sequence', existingPreset.id, e.detail);
    } else {
      await this._saveUserPreset('segment_sequence', e.detail);
    }
    this._clearEditorDraft('segments');
    this._editingPreset = undefined;
    this._setActiveTab('presets');
  }

  private async _handleSegmentSequencePreview(e: CustomEvent): Promise<void> {
    const compatibleEntities = this._getSegmentsCompatibleEntities();
    if (!compatibleEntities.length) {
      console.warn('No compatible entities selected for segment sequence preview');
      return;
    }

    const data = e.detail;
    const serviceData: Record<string, unknown> = {
      entity_id: compatibleEntities,
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
      data.steps.forEach((step: { segments: string; mode: string; colors: number[][]; segment_colors?: Array<{segment: number, color: {r: number, g: number, b: number}}>; duration: number; hold: number; activation_pattern: string }, index: number) => {
        const stepNum = index + 1;
        if (stepNum <= 20) {
          serviceData[`step_${stepNum}_segments`] = step.segments;
          serviceData[`step_${stepNum}_mode`] = step.mode;
          serviceData[`step_${stepNum}_duration`] = step.duration;
          serviceData[`step_${stepNum}_hold`] = step.hold;
          serviceData[`step_${stepNum}_activation_pattern`] = step.activation_pattern;

          // Add segment_colors if provided (new format)
          if (step.segment_colors && Array.isArray(step.segment_colors) && step.segment_colors.length > 0) {
            serviceData[`step_${stepNum}_segment_colors`] = step.segment_colors;
          } else {
            // Fallback to individual color parameters (legacy format, up to 6 colors per step)
            if (step.colors && Array.isArray(step.colors)) {
              step.colors.forEach((color: number[], colorIndex: number) => {
                if (colorIndex < 6) {
                  serviceData[`step_${stepNum}_color_${colorIndex + 1}`] = color;
                }
              });
            }
          }
        }
      });
    }

    await this.hass.callService('aqara_advanced_lighting', 'start_segment_sequence', serviceData);
    this._segmentSequencePreviewActive = true;
  }

  private async _handleSegmentSequenceStopPreview(): Promise<void> {
    const compatibleEntities = this._getSegmentsCompatibleEntities();
    if (!compatibleEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'stop_segment_sequence', {
      entity_id: compatibleEntities,
    });
    this._segmentSequencePreviewActive = false;
  }

  // Dynamic scenes: Any light with RGB color mode (T2 RGB, T1M RGB endpoint, T1 Strip)
  private _isScenesCompatible(): boolean {
    if (!this.hass || !this._selectedEntities.length) return false;
    return this._selectedEntities.some(entityId => {
      const entity = this.hass!.states[entityId];
      if (!entity) return false;
      // Dynamic scenes require RGB color capability
      return this._hasRGBColorMode(entity);
    });
  }

  private _getScenesCompatibleEntities(): string[] {
    if (!this.hass) return [];
    return this._selectedEntities.filter(entityId => {
      const entity = this.hass!.states[entityId];
      if (!entity) return false;
      return this._hasRGBColorMode(entity);
    });
  }

  private _renderScenesTab() {
    const editingScene = this._editingPreset?.type === 'dynamic_scene' ? this._editingPreset.preset as UserDynamicScenePreset : undefined;
    const isCompatible = this._isScenesCompatible();
    const hasSelection = this._selectedEntities.length > 0;

    return html`
      <ha-card class="editor-form">
        <h2>${editingScene ? this._localize('dialogs.edit_scene_title') : this._localize('dialogs.create_scene_title')}</h2>
        <p class="editor-description">
          ${editingScene ? this._localize('dialogs.edit_scene_description') : this._localize('dialogs.create_scene_description')}
        </p>
        ${hasSelection && !isCompatible ? html`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize('dialogs.compatibility_warning_scenes')}
          </ha-alert>
        ` : ''}
        <dynamic-scene-editor
          .hass=${this.hass}
          .preset=${editingScene}
          .draft=${this._getEditorDraft('scenes')}
          .translations=${this._translations}
          .editMode=${!!editingScene && !this._editingPreset?.isDuplicate}
          .hasSelectedEntities=${hasSelection}
          .isCompatible=${isCompatible}
          .selectedEntities=${this._selectedEntities}
          .previewActive=${this._scenePreviewActive}
          .colorHistory=${this._colorHistory}
          @save=${this._handleSceneSave}
          @preview=${this._handleScenePreview}
          @stop-preview=${this._handleSceneStopPreview}
          @cancel=${this._handleEditorCancel}
          @color-history-changed=${this._handleColorHistoryChanged}
        ></dynamic-scene-editor>
      </ha-card>
    `;
  }

  private async _handleSceneSave(e: CustomEvent): Promise<void> {
    if (this._editingPreset?.type === 'dynamic_scene' && !this._editingPreset.isDuplicate) {
      const existingPreset = this._editingPreset.preset as UserDynamicScenePreset;
      await this._updateUserPreset('dynamic_scene', existingPreset.id, e.detail);
    } else {
      await this._saveUserPreset('dynamic_scene', e.detail);
    }
    this._clearEditorDraft('scenes');
    this._editingPreset = undefined;
    this._setActiveTab('presets');
  }

  private async _handleScenePreview(e: CustomEvent): Promise<void> {
    const compatibleEntities = this._getScenesCompatibleEntities();
    if (!compatibleEntities.length) {
      console.warn('No compatible entities selected for scene preview');
      return;
    }

    const data = e.detail;
    const serviceData: Record<string, unknown> = {
      entity_id: compatibleEntities,
      transition_time: data.transition_time,
      hold_time: data.hold_time,
      distribution_mode: data.distribution_mode,
      random_order: data.random_order,
      scene_brightness_pct: data.scene_brightness_pct,
      loop_mode: data.loop_mode,
      end_behavior: data.end_behavior,
    };

    // Add offset_delay only if provided and non-zero
    if (data.offset_delay !== undefined && data.offset_delay > 0) {
      serviceData.offset_delay = data.offset_delay;
    }

    // Add loop_count only if loop_mode is 'loop'
    if (data.loop_mode === 'loop' && data.loop_count !== undefined) {
      serviceData.loop_count = data.loop_count;
    }

    // Add colors array in XY format with brightness: {x, y, brightness_pct}
    if (data.colors && Array.isArray(data.colors)) {
      serviceData.colors = data.colors.map((color: { x: number; y: number; brightness_pct: number }) => ({
        x: color.x,
        y: color.y,
        brightness_pct: color.brightness_pct,
      }));
    }

    await this.hass.callService('aqara_advanced_lighting', 'start_dynamic_scene', serviceData);
    this._scenePreviewActive = true;
  }

  private async _handleSceneStopPreview(): Promise<void> {
    const compatibleEntities = this._getScenesCompatibleEntities();
    if (!compatibleEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'stop_dynamic_scene', {
      entity_id: compatibleEntities,
    });
    this._scenePreviewActive = false;
  }

  private async _handleExportPresets(): Promise<void> {
    this._isExporting = true;
    this.requestUpdate();

    try {
      const response = await fetch('/api/aqara_advanced_lighting/presets/export', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.hass.auth.data.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || 'aqara_presets_backup.json';

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success toast
      this._showToast(this._localize('presets.export_success'));
    } catch (err) {
      this._showToast(this._localize('presets.export_error_network'));
      console.error('Export error:', err);
    } finally {
      this._isExporting = false;
      this.requestUpdate();
    }
  }

  private _handleImportClick(): void {
    // Trigger file input
    if (!this._fileInputRef) {
      this._fileInputRef = document.createElement('input');
      this._fileInputRef.type = 'file';
      this._fileInputRef.accept = '.json,application/json';
      this._fileInputRef.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
          this._handleImportFile(target.files[0]);
        }
      });
    }
    this._fileInputRef.click();
  }

  private async _handleImportFile(file: File): Promise<void> {
    this._isImporting = true;
    this.requestUpdate();

    try {
      // Read file content
      const content = await file.text();
      const importData = JSON.parse(content);

      // Send to API
      const result = await this.hass.callApi<{ counts: Record<string, number> }>('POST', 'aqara_advanced_lighting/presets/import', importData);
      const totalCount = Object.values(result.counts).reduce(
        (sum: number, count) => sum + (count as number),
        0
      );

      // Show success toast with count
      this._showToast(this._localize('presets.import_success', { count: totalCount.toString() }));

      // Refresh presets display
      await this._loadUserPresets();
    } catch (err) {
      let errorMessage = this._localize('presets.import_error_unknown');

      if (err instanceof SyntaxError) {
        errorMessage = this._localize('presets.import_error_invalid_file');
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      this._showToast(errorMessage);
      console.error('Import error:', err);
    } finally {
      this._isImporting = false;
      this.requestUpdate();
    }
  }

  private _showToast(message: string): void {
    // Use Home Assistant's toast system
    const event = new CustomEvent('hass-notification', {
      detail: {
        message: message,
        duration: 3000,
      },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  private _renderPresetsTab() {
    const effectPresets = this._userPresets?.effect_presets || [];
    const patternPresets = this._userPresets?.segment_pattern_presets || [];
    const cctPresets = this._userPresets?.cct_sequence_presets || [];
    const segmentPresets = this._userPresets?.segment_sequence_presets || [];
    const scenePresets = this._userPresets?.dynamic_scene_presets || [];
    const totalCount = effectPresets.length + patternPresets.length + cctPresets.length + segmentPresets.length + scenePresets.length;

    const myPresetsSectionId = 'my_presets_overview';
    const myPresetsExpanded = !this._collapsed[myPresetsSectionId];

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${myPresetsExpanded}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange(myPresetsSectionId, e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize('tabs.presets')}</div>
            <div class="section-subtitle">
              ${this._localize('sections.subtitle_user_presets', {count: totalCount.toString()})}
            </div>
          </div>
        </div>
        <div class="section-content preset-management-content">
          <div class="toolbar-actions">
            <mwc-button
              raised
              @click=${this._handleExportPresets}
              .disabled=${this._isExporting || this._isImporting}
            >
              <ha-icon icon="mdi:download" slot="icon"></ha-icon>
              ${this._isExporting
                ? this._localize('presets.export_progress')
                : this._localize('presets.export_button')}
            </mwc-button>

            <mwc-button
              raised
              @click=${this._handleImportClick}
              .disabled=${this._isExporting || this._isImporting}
            >
              <ha-icon icon="mdi:upload" slot="icon"></ha-icon>
              ${this._isImporting
                ? this._localize('presets.import_progress')
                : this._localize('presets.import_button')}
            </mwc-button>
          </div>
        </div>
      </ha-expansion-panel>

      ${totalCount === 0
        ? html`
            <div class="no-presets">
              <ha-icon icon="mdi:folder-open-outline"></ha-icon>
              <p>${this._localize('presets.no_presets_title')}</p>
              <p>${this._localize('presets.no_presets_description')}</p>
            </div>
          `
        : html`
            ${this._renderPresetDeviceSections(
              this._localize('sections.dynamic_effects'), 'presets_effects',
              effectPresets,
              (p) => this._editEffectPreset(p),
              'effect',
              (p) => this._renderUserEffectIcon(p),
              (presets, opt) => this._sortUserEffectPresets(presets, opt),
              (p) => this._duplicateUserEffectPreset(p),
            )}

            ${this._renderPresetDeviceSections(
              this._localize('sections.segment_patterns'), 'presets_patterns',
              patternPresets,
              (p) => this._editPatternPreset(p),
              'segment_pattern',
              (p) => this._renderUserPatternIcon(p),
              (presets, opt) => this._sortUserPatternPresets(presets, opt),
              (p) => this._duplicateUserPatternPreset(p),
            )}

            ${cctPresets.length > 0
              ? this._renderPresetSection(
                  this._localize('sections.cct_sequences'), 'presets_cct',
                  cctPresets,
                  (p) => this._editCCTSequencePreset(p),
                  'cct_sequence',
                  (p) => this._renderUserCCTIcon(p),
                  (presets, opt) => this._sortUserCCTSequencePresets(presets, opt),
                  (p) => this._duplicateUserCCTSequencePreset(p),
                )
              : ''}

            ${this._renderPresetDeviceSections(
              this._localize('sections.segment_sequences'), 'presets_segments',
              segmentPresets,
              (p) => this._editSegmentSequencePreset(p),
              'segment_sequence',
              (p) => this._renderUserSegmentSequenceIcon(p),
              (presets, opt) => this._sortUserSegmentSequencePresets(presets, opt),
              (p) => this._duplicateUserSegmentSequencePreset(p),
            )}

            ${scenePresets.length > 0
              ? this._renderPresetSection(
                  this._localize('sections.dynamic_scenes'), 'presets_scenes',
                  scenePresets,
                  (p) => this._editDynamicScenePreset(p),
                  'dynamic_scene',
                  (p) => this._renderUserDynamicSceneIcon(p),
                  (presets, opt) => this._sortUserDynamicScenePresets(presets, opt),
                  (p) => this._duplicateUserDynamicScenePreset(p),
                )
              : ''}
          `}
    `;
  }

  /**
   * Render one ha-expansion-panel per device type for a preset category.
   * Matches the Activate tab pattern: "Dynamic Effects: T2 Bulb", "Segment Patterns: T1M", etc.
   * Presets without device_type are shown in a general section titled by the category name alone.
   */
  private _renderPresetDeviceSections<T extends { id: string; name: string; device_type?: string }>(
    categoryTitle: string,
    sectionPrefix: string,
    presets: T[],
    onEdit: (preset: T) => void,
    deleteType: string,
    renderIcon: (preset: T) => unknown,
    sortFn: (presets: T[], sortOption: PresetSortOption) => T[],
    onDuplicate: (preset: T) => void,
  ) {
    if (presets.length === 0) return '';

    const { ungrouped, grouped } = this._groupPresetsByDeviceType(presets);

    return html`
      ${ungrouped.length > 0
        ? this._renderPresetSection(
            categoryTitle, sectionPrefix,
            ungrouped, onEdit, deleteType, renderIcon, sortFn, onDuplicate,
          )
        : ''}
      ${AqaraPanel.PRESET_DEVICE_TYPES.map((deviceKey) => {
        const devicePresets = grouped.get(deviceKey);
        if (!devicePresets?.length) return '';
        const deviceLabel = this._localize(`devices.${deviceKey}`);
        return this._renderPresetSection(
          `${categoryTitle}: ${deviceLabel}`, `${sectionPrefix}_${deviceKey}`,
          devicePresets, onEdit, deleteType, renderIcon, sortFn, onDuplicate,
        );
      })}
    `;
  }

  /**
   * Render a single ha-expansion-panel section with preset cards inside.
   * Uses the same header structure as the Activate tab (section-title, section-subtitle, sort controls).
   * Sorting is applied per-section using the section ID as the sort preference key.
   */
  private _renderPresetSection<T extends { id: string; name: string }>(
    title: string,
    sectionId: string,
    presets: T[],
    onEdit: (preset: T) => void,
    deleteType: string,
    renderIcon: (preset: T) => unknown,
    sortFn: (presets: T[], sortOption: PresetSortOption) => T[],
    onDuplicate: (preset: T) => void,
  ) {
    const isExpanded = !this._collapsed[sectionId];
    const sortOption = this._getSortPreference(sectionId);
    const sortedPresets = sortFn(presets, sortOption);

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${isExpanded}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange(sectionId, e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${title}</div>
            <div class="section-subtitle">${this._localize('presets.presets_count', { count: presets.length.toString() })}</div>
          </div>
          <div class="section-header-controls" @click=${(e: Event) => e.stopPropagation()}>
            ${this._renderSortDropdown(sectionId)}
          </div>
        </div>
        <div class="section-content preset-grid">
          ${sortedPresets.map((preset) => this._renderPresetCard(
            preset, onEdit, deleteType, renderIcon, onDuplicate,
          ))}
        </div>
      </ha-expansion-panel>
    `;
  }

  /** Render a single user preset card with action buttons. */
  private _renderPresetCard<T extends { id: string; name: string }>(
    preset: T,
    onEdit: (preset: T) => void,
    deleteType: string,
    renderIcon: (preset: T) => unknown,
    onDuplicate: (preset: T) => void,
  ) {
    return html`
      <div
        class="user-preset-card"
        title="${preset.name}"
      >
        <div class="preset-card-actions">
          <ha-icon-button
            @click=${(e: Event) => { e.stopPropagation(); onEdit(preset); }}
            title="${this._localize('tooltips.preset_edit')}"
          >
            <ha-icon icon="mdi:pencil"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            @click=${(e: Event) => { e.stopPropagation(); onDuplicate(preset); }}
            title="${this._localize('tooltips.preset_duplicate')}"
          >
            <ha-icon icon="mdi:content-copy"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            @click=${(e: Event) => { e.stopPropagation(); this._deleteUserPreset(deleteType, preset.id); }}
            title="${this._localize('tooltips.preset_delete')}"
          >
            <ha-icon icon="mdi:delete"></ha-icon>
          </ha-icon-button>
        </div>
        <div class="preset-icon">
          ${renderIcon(preset)}
        </div>
        <div class="preset-name">${preset.name}</div>
      </div>
    `;
  }

  // Edit preset methods - navigate to editor tab with preset loaded
  private _editEffectPreset(preset: UserEffectPreset): void {
    this._clearEditorDraft('effects');
    this._editingPreset = { type: 'effect', preset };
    this._setActiveTab('effects');
  }

  private _editPatternPreset(preset: UserSegmentPatternPreset): void {
    this._clearEditorDraft('patterns');
    this._editingPreset = { type: 'pattern', preset };
    this._setActiveTab('patterns');
  }

  private _editCCTSequencePreset(preset: UserCCTSequencePreset): void {
    this._clearEditorDraft('cct');
    this._editingPreset = { type: 'cct', preset };
    this._setActiveTab('cct');
  }

  private _editSegmentSequencePreset(preset: UserSegmentSequencePreset): void {
    this._clearEditorDraft('segments');
    this._editingPreset = { type: 'segment', preset };
    this._setActiveTab('segments');
  }

  // Duplicate user preset methods - open editor in create mode with preset data pre-filled
  private _duplicateUserEffectPreset(preset: UserEffectPreset): void {
    const copy: UserEffectPreset = {
      ...preset,
      id: '',
      name: `${preset.name} ${this._localize('presets.copy_suffix')}`,
      created_at: '',
      modified_at: '',
    };
    this._clearEditorDraft('effects');
    this._editingPreset = { type: 'effect', preset: copy, isDuplicate: true };
    this._setActiveTab('effects');
  }

  private _duplicateUserPatternPreset(preset: UserSegmentPatternPreset): void {
    const copy: UserSegmentPatternPreset = {
      ...preset,
      id: '',
      name: `${preset.name} ${this._localize('presets.copy_suffix')}`,
      created_at: '',
      modified_at: '',
    };
    this._clearEditorDraft('patterns');
    this._editingPreset = { type: 'pattern', preset: copy, isDuplicate: true };
    this._setActiveTab('patterns');
  }

  private _duplicateUserCCTSequencePreset(preset: UserCCTSequencePreset): void {
    const copy: UserCCTSequencePreset = {
      ...preset,
      id: '',
      name: `${preset.name} ${this._localize('presets.copy_suffix')}`,
      created_at: '',
      modified_at: '',
    };
    this._clearEditorDraft('cct');
    this._editingPreset = { type: 'cct', preset: copy, isDuplicate: true };
    this._setActiveTab('cct');
  }

  private _duplicateUserSegmentSequencePreset(preset: UserSegmentSequencePreset): void {
    const copy: UserSegmentSequencePreset = {
      ...preset,
      id: '',
      name: `${preset.name} ${this._localize('presets.copy_suffix')}`,
      created_at: '',
      modified_at: '',
    };
    this._clearEditorDraft('segments');
    this._editingPreset = { type: 'segment', preset: copy, isDuplicate: true };
    this._setActiveTab('segments');
  }

  private _editDynamicScenePreset(preset: UserDynamicScenePreset): void {
    this._clearEditorDraft('scenes');
    this._editingPreset = { type: 'dynamic_scene', preset };
    this._setActiveTab('scenes');
  }

  private _duplicateUserDynamicScenePreset(preset: UserDynamicScenePreset): void {
    const copy: UserDynamicScenePreset = {
      ...preset,
      id: '',
      name: `${preset.name} ${this._localize('presets.copy_suffix')}`,
      created_at: '',
      modified_at: '',
    };
    this._clearEditorDraft('scenes');
    this._editingPreset = { type: 'dynamic_scene', preset: copy, isDuplicate: true };
    this._setActiveTab('scenes');
  }

  // Duplicate built-in preset methods - convert from built-in format to user format and open editor
  private _duplicateBuiltinEffectPreset(preset: DynamicEffectPreset, deviceType: string): void {
    const userPreset: UserEffectPreset = {
      id: '',
      name: `${preset.name} ${this._localize('presets.copy_suffix')}`,
      effect: preset.effect,
      effect_speed: preset.speed,
      effect_brightness: preset.brightness != null ? Math.round(preset.brightness / 255 * 100) : 100,
      effect_colors: preset.colors.map((c) => rgbToXy(c[0]!, c[1]!, c[2]!)),
      device_type: deviceType,
      created_at: '',
      modified_at: '',
    };
    this._clearEditorDraft('effects');
    this._editingPreset = { type: 'effect', preset: userPreset, isDuplicate: true };
    this._setActiveTab('effects');
  }

  private _getDeviceSegmentCount(deviceType: string): number {
    switch (deviceType) {
      case 't1': return 20;
      case 't1m': return 26;
      case 't1_strip': return this._getT1StripSegmentCount();
      default: return 26;
    }
  }

  private _scaleSegmentPattern<T>(source: T[], targetCount: number): T[] {
    const sourceCount = source.length;
    if (targetCount < 1 || sourceCount < 1) return [];
    if (targetCount === sourceCount) return [...source];
    return Array.from({ length: targetCount }, (_, i) =>
      source[Math.floor(i * sourceCount / targetCount)]!
    );
  }

  private _duplicateBuiltinPatternPreset(preset: SegmentPatternPreset, deviceType: string): void {
    const targetCount = this._getDeviceSegmentCount(deviceType);
    const scaled = this._scaleSegmentPattern(preset.segments, targetCount);
    const userPreset: UserSegmentPatternPreset = {
      id: '',
      name: `${preset.name} ${this._localize('presets.copy_suffix')}`,
      device_type: deviceType,
      segments: scaled.map((seg, index) => ({
        segment: index + 1,
        color: { r: seg[0]!, g: seg[1]!, b: seg[2]! },
      })),
      created_at: '',
      modified_at: '',
    };
    this._clearEditorDraft('patterns');
    this._editingPreset = { type: 'pattern', preset: userPreset, isDuplicate: true };
    this._setActiveTab('patterns');
  }

  private _duplicateBuiltinCCTSequencePreset(preset: CCTSequencePreset): void {
    const userPreset: UserCCTSequencePreset = {
      id: '',
      name: `${preset.name} ${this._localize('presets.copy_suffix')}`,
      steps: preset.steps.map((step) => ({
        ...step,
        brightness: Math.round(step.brightness / 255 * 100),
      })),
      loop_mode: preset.loop_mode,
      loop_count: preset.loop_count,
      end_behavior: preset.end_behavior,
      created_at: '',
      modified_at: '',
    };
    this._clearEditorDraft('cct');
    this._editingPreset = { type: 'cct', preset: userPreset, isDuplicate: true };
    this._setActiveTab('cct');
  }

  private _duplicateBuiltinSegmentSequencePreset(preset: SegmentSequencePreset, deviceType: string): void {
    const userPreset: UserSegmentSequencePreset = {
      id: '',
      name: `${preset.name} ${this._localize('presets.copy_suffix')}`,
      device_type: deviceType,
      steps: preset.steps.map((step) => ({ ...step })),
      loop_mode: preset.loop_mode,
      loop_count: preset.loop_count,
      end_behavior: preset.end_behavior,
      created_at: '',
      modified_at: '',
    };
    this._clearEditorDraft('segments');
    this._editingPreset = { type: 'segment', preset: userPreset, isDuplicate: true };
    this._setActiveTab('segments');
  }

  private _duplicateBuiltinDynamicScenePreset(preset: DynamicScenePreset): void {
    const userPreset: UserDynamicScenePreset = {
      id: '',
      name: `${preset.name} ${this._localize('presets.copy_suffix')}`,
      colors: preset.colors.map((color) => ({ ...color })),
      transition_time: preset.transition_time,
      hold_time: preset.hold_time,
      distribution_mode: preset.distribution_mode,
      offset_delay: preset.offset_delay,
      random_order: preset.random_order,
      scene_brightness_pct: preset.scene_brightness_pct,
      loop_mode: preset.loop_mode,
      loop_count: preset.loop_count,
      end_behavior: preset.end_behavior,
      created_at: '',
      modified_at: '',
    };
    this._clearEditorDraft('scenes');
    this._editingPreset = { type: 'dynamic_scene', preset: userPreset, isDuplicate: true };
    this._setActiveTab('scenes');
  }

  private _renderSortDropdown(sectionId: string) {
    const currentSort = this._getSortPreference(sectionId);
    return html`
      <select
        class="sort-select"
        .value=${currentSort}
        @change=${(e: Event) => {
          e.stopPropagation();
          this._setSortPreference(sectionId, (e.target as HTMLSelectElement).value as PresetSortOption);
        }}
        @click=${(e: Event) => e.stopPropagation()}
      >
        <option value="name-asc">${this._localize('presets.sort_name_asc')}</option>
        <option value="name-desc">${this._localize('presets.sort_name_desc')}</option>
        <option value="date-new">${this._localize('presets.sort_date_new')}</option>
        <option value="date-old">${this._localize('presets.sort_date_old')}</option>
      </select>
    `;
  }

  /** Render the Favorite Presets section in the Activate tab. Hidden when empty. */
  private _renderFavoritesSection() {
    const resolved = this._getResolvedFavoritePresets();
    if (resolved.length === 0) return '';

    const sectionId = 'favorite_presets';
    const isExpanded = !this._collapsed[sectionId];
    const sortOption = this._getSortPreference(sectionId);
    const sortedFavorites = this._sortResolvedFavorites(resolved, sortOption);

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${isExpanded}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange(sectionId, e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize('sections.favorite_presets')}</div>
            <div class="section-subtitle">${this._localize('sections.subtitle_favorites', { count: resolved.length.toString() })}</div>
          </div>
          <div class="section-header-controls" @click=${(e: Event) => e.stopPropagation()}>
            ${this._renderSortDropdown(sectionId)}
          </div>
        </div>
        <div class="section-content">
          ${sortedFavorites.map(({ ref, preset, isUser }) => html`
            <div class="preset-button ${isUser ? 'user-preset' : 'builtin-preset'}" @click=${() => this._activateFavoritePreset(ref, preset, isUser)}>
              <div class="preset-card-actions">
                ${this._renderFavoriteStar(ref.type, ref.id)}
              </div>
              <div class="preset-icon">
                ${this._renderFavoritePresetIcon(ref, preset, isUser)}
              </div>
              <div class="preset-name">${preset.name}</div>
            </div>
          `)}
        </div>
      </ha-expansion-panel>
    `;
  }

  private _renderDynamicEffectsSection(title: string, presets: DynamicEffectPreset[], deviceType: string) {
    const sectionId = `dynamic_${title.toLowerCase().replace(/\s+/g, '_')}`;
    const isExpanded = !this._collapsed[sectionId];
    const userPresets = this._getUserEffectPresetsForDeviceType(deviceType);
    const totalCount = userPresets.length + presets.length;

    // Apply sorting
    const sortOption = this._getSortPreference(sectionId);
    const sortedUserPresets = this._sortUserEffectPresets(userPresets, sortOption);
    const sortedBuiltinPresets = this._sortDynamicEffectPresets(presets, sortOption);

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${isExpanded}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange(sectionId, e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize('sections.dynamic_effects')}: ${title}</div>
            <div class="section-subtitle">${userPresets.length > 0 ? this._localize('sections.subtitle_presets_custom', {count: totalCount.toString(), custom: userPresets.length.toString()}) : this._localize('sections.subtitle_presets', {count: totalCount.toString()})}</div>
          </div>
          <div class="section-header-controls" @click=${(e: Event) => e.stopPropagation()}>
            ${this._renderSortDropdown(sectionId)}
          </div>
        </div>
        <div class="section-content">
          ${sortedUserPresets.map(
            (preset) => html`
              <div class="preset-button user-preset" @click=${() => this._activateUserEffectPreset(preset)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar('effect', preset.id)}
                </div>
                <div class="preset-icon">
                  ${this._renderUserEffectIcon(preset)}
                </div>
                <div class="preset-name">${preset.name}</div>
              </div>
            `
          )}
          ${sortedBuiltinPresets.map(
            (preset) => html`
              <div class="preset-button builtin-preset" @click=${() => this._activateDynamicEffect(preset)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar('effect', preset.id)}
                  <ha-icon-button
                    @click=${(e: Event) => { e.stopPropagation(); this._duplicateBuiltinEffectPreset(preset, deviceType); }}
                    title="${this._localize('tooltips.preset_duplicate')}"
                  >
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                  </ha-icon-button>
                </div>
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

  private _renderSegmentPatternsSection(title: string, builtinPresets: SegmentPatternPreset[], deviceType: string) {
    const sectionId = `segment_pat_${title.toLowerCase().replace(/\s+/g, '_')}`;
    const isExpanded = !this._collapsed[sectionId];
    const userPresets = this._getUserPatternPresetsForDeviceType(deviceType);
    const totalCount = userPresets.length + builtinPresets.length;

    // Apply sorting
    const sortOption = this._getSortPreference(sectionId);
    const sortedUserPresets = this._sortUserPatternPresets(userPresets, sortOption);
    const sortedBuiltinPresets = this._sortSegmentPatternPresets(builtinPresets, sortOption);

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${isExpanded}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange(sectionId, e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize('sections.segment_patterns')}: ${title}</div>
            <div class="section-subtitle">${userPresets.length > 0 ? this._localize('sections.subtitle_presets_custom', {count: totalCount.toString(), custom: userPresets.length.toString()}) : this._localize('sections.subtitle_presets', {count: totalCount.toString()})}</div>
          </div>
          <div class="section-header-controls" @click=${(e: Event) => e.stopPropagation()}>
            ${this._renderSortDropdown(sectionId)}
          </div>
        </div>
        <div class="section-content">
          ${sortedUserPresets.map(
            (preset) => html`
              <div class="preset-button user-preset" @click=${() => this._activateUserPatternPreset(preset)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar('segment_pattern', preset.id)}
                </div>
                <div class="preset-icon">
                  ${this._renderUserPatternIcon(preset)}
                </div>
                <div class="preset-name">${preset.name}</div>
              </div>
            `
          )}
          ${sortedBuiltinPresets.map(
            (preset) => html`
              <div class="preset-button builtin-preset" @click=${() => this._activateSegmentPattern(preset)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar('segment_pattern', preset.id)}
                  <ha-icon-button
                    @click=${(e: Event) => { e.stopPropagation(); this._duplicateBuiltinPatternPreset(preset, deviceType); }}
                    title="${this._localize('tooltips.preset_duplicate')}"
                  >
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                  </ha-icon-button>
                </div>
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

  /** Render a user effect preset icon: thumbnail from colors, or MDI fallback. */
  private _renderUserEffectIcon(preset: UserEffectPreset) {
    if (preset.icon) {
      return this._renderPresetIcon(preset.icon, 'mdi:lightbulb-on');
    }
    return renderEffectThumbnail(preset)
      ?? html`<ha-icon icon="mdi:lightbulb-on"></ha-icon>`;
  }

  /** Render a user segment pattern preset icon: pie thumbnail or MDI fallback. */
  private _renderUserPatternIcon(preset: UserSegmentPatternPreset) {
    if (preset.icon) {
      return this._renderPresetIcon(preset.icon, 'mdi:palette');
    }
    return renderSegmentPatternThumbnail(preset)
      ?? html`<ha-icon icon="mdi:palette"></ha-icon>`;
  }

  /** Render a user CCT sequence preset icon: gradient thumbnail or MDI fallback. */
  private _renderUserCCTIcon(preset: UserCCTSequencePreset) {
    if (preset.icon) {
      return this._renderPresetIcon(preset.icon, 'mdi:temperature-kelvin');
    }
    return renderCCTSequenceThumbnail(preset)
      ?? html`<ha-icon icon="mdi:temperature-kelvin"></ha-icon>`;
  }

  /** Render a user segment sequence preset icon: ring thumbnail or MDI fallback. */
  private _renderUserSegmentSequenceIcon(preset: UserSegmentSequencePreset) {
    if (preset.icon) {
      return this._renderPresetIcon(preset.icon, 'mdi:animation-play');
    }
    return renderSegmentSequenceThumbnail(preset)
      ?? html`<ha-icon icon="mdi:animation-play"></ha-icon>`;
  }

  /** Render a user dynamic scene preset icon: generated thumbnail or MDI icon. */
  private _renderUserDynamicSceneIcon(preset: UserDynamicScenePreset) {
    if (preset.icon) {
      return this._renderPresetIcon(preset.icon, 'mdi:lamps');
    }
    return renderDynamicSceneThumbnail(preset)
      ?? html`<ha-icon icon="mdi:lamps"></ha-icon>`;
  }

  /** Render a builtin dynamic scene preset icon: always use gradient thumbnail. */
  private _renderBuiltinDynamicSceneIcon(preset: DynamicScenePreset) {
    return renderDynamicSceneThumbnail(preset)
      ?? html`<ha-icon icon="mdi:lamps"></ha-icon>`;
  }

  private _renderCCTSequencesSection() {
    const sectionId = 'cct_sequences';
    const isExpanded = !this._collapsed[sectionId];
    const userPresets = this._getFilteredUserCCTSequencePresets();
    const builtinPresets = this._presets!.cct_sequences;
    const totalCount = userPresets.length + builtinPresets.length;

    // Apply sorting
    const sortOption = this._getSortPreference(sectionId);
    const sortedUserPresets = this._sortUserCCTSequencePresets(userPresets, sortOption);
    const sortedBuiltinPresets = this._sortCCTSequencePresets(builtinPresets, sortOption);

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${isExpanded}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange(sectionId, e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize('sections.cct_sequences')}</div>
            <div class="section-subtitle">${userPresets.length > 0 ? this._localize('sections.subtitle_presets_custom', {count: totalCount.toString(), custom: userPresets.length.toString()}) : this._localize('sections.subtitle_presets', {count: totalCount.toString()})}</div>
          </div>
          <div class="section-header-controls" @click=${(e: Event) => e.stopPropagation()}>
            ${this._renderSortDropdown(sectionId)}
          </div>
        </div>
        <div class="section-content">
          ${sortedUserPresets.map(
            (preset) => html`
              <div class="preset-button user-preset" @click=${() => this._activateUserCCTSequencePreset(preset)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar('cct_sequence', preset.id)}
                </div>
                <div class="preset-icon">
                  ${this._renderUserCCTIcon(preset)}
                </div>
                <div class="preset-name">${preset.name}</div>
              </div>
            `
          )}
          ${sortedBuiltinPresets.map(
            (preset) => html`
              <div class="preset-button builtin-preset" @click=${() => this._activateCCTSequence(preset)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar('cct_sequence', preset.id)}
                  <ha-icon-button
                    @click=${(e: Event) => { e.stopPropagation(); this._duplicateBuiltinCCTSequencePreset(preset); }}
                    title="${this._localize('tooltips.preset_duplicate')}"
                  >
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                  </ha-icon-button>
                </div>
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

  private _renderSegmentSequencesSection(title: string, builtinPresets: SegmentSequencePreset[], deviceType: string) {
    const sectionId = `segment_seq_${title.toLowerCase().replace(/\s+/g, '_')}`;
    const isExpanded = !this._collapsed[sectionId];
    const userPresets = this._getUserSegmentSequencePresetsForDeviceType(deviceType);
    const totalCount = userPresets.length + builtinPresets.length;

    // Apply sorting
    const sortOption = this._getSortPreference(sectionId);
    const sortedUserPresets = this._sortUserSegmentSequencePresets(userPresets, sortOption);
    const sortedBuiltinPresets = this._sortSegmentSequencePresets(builtinPresets, sortOption);

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${isExpanded}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange(sectionId, e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize('sections.segment_sequences')}: ${title}</div>
            <div class="section-subtitle">${userPresets.length > 0 ? this._localize('sections.subtitle_presets_custom', {count: totalCount.toString(), custom: userPresets.length.toString()}) : this._localize('sections.subtitle_presets', {count: totalCount.toString()})}</div>
          </div>
          <div class="section-header-controls" @click=${(e: Event) => e.stopPropagation()}>
            ${this._renderSortDropdown(sectionId)}
          </div>
        </div>
        <div class="section-content">
          ${sortedUserPresets.map(
            (preset) => html`
              <div class="preset-button user-preset" @click=${() => this._activateUserSegmentSequencePreset(preset)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar('segment_sequence', preset.id)}
                </div>
                <div class="preset-icon">
                  ${this._renderUserSegmentSequenceIcon(preset)}
                </div>
                <div class="preset-name">${preset.name}</div>
              </div>
            `
          )}
          ${sortedBuiltinPresets.map(
            (preset) => html`
              <div class="preset-button builtin-preset" @click=${() => this._activateSegmentSequence(preset)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar('segment_sequence', preset.id)}
                  <ha-icon-button
                    @click=${(e: Event) => { e.stopPropagation(); this._duplicateBuiltinSegmentSequencePreset(preset, deviceType); }}
                    title="${this._localize('tooltips.preset_duplicate')}"
                  >
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                  </ha-icon-button>
                </div>
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

  private _renderDynamicScenesSection() {
    const sectionId = 'dynamic_scenes';
    const isExpanded = !this._collapsed[sectionId];
    const userPresets = this._getFilteredUserDynamicScenePresets();
    const builtinPresets = this._presets!.dynamic_scenes || [];
    const totalCount = userPresets.length + builtinPresets.length;

    // Apply sorting
    const sortOption = this._getSortPreference(sectionId);
    const sortedUserPresets = this._sortUserDynamicScenePresets(userPresets, sortOption);
    const sortedBuiltinPresets = this._sortDynamicScenePresets(builtinPresets, sortOption);

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${isExpanded}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange(sectionId, e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize('sections.dynamic_scenes')}</div>
            <div class="section-subtitle">${userPresets.length > 0 ? this._localize('sections.subtitle_presets_custom', {count: totalCount.toString(), custom: userPresets.length.toString()}) : this._localize('sections.subtitle_presets', {count: totalCount.toString()})}</div>
          </div>
          <div class="section-header-controls" @click=${(e: Event) => e.stopPropagation()}>
            ${this._renderSortDropdown(sectionId)}
          </div>
        </div>
        <div class="section-content">
          ${sortedUserPresets.map(
            (preset) => html`
              <div class="preset-button user-preset" @click=${() => this._activateUserDynamicScenePreset(preset)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar('dynamic_scene', preset.id)}
                </div>
                <div class="preset-icon">
                  ${this._renderUserDynamicSceneIcon(preset)}
                </div>
                <div class="preset-name">${preset.name}</div>
              </div>
            `
          )}
          ${sortedBuiltinPresets.map(
            (preset) => html`
              <div class="preset-button builtin-preset" @click=${() => this._activateDynamicScene(preset)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar('dynamic_scene', preset.id)}
                  <ha-icon-button
                    @click=${(e: Event) => { e.stopPropagation(); this._duplicateBuiltinDynamicScenePreset(preset); }}
                    title="${this._localize('tooltips.preset_duplicate')}"
                  >
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                  </ha-icon-button>
                </div>
                <div class="preset-icon">
                  ${this._renderBuiltinDynamicSceneIcon(preset)}
                </div>
                <div class="preset-name">${preset.name}</div>
              </div>
            `
          )}
        </div>
      </ha-expansion-panel>
    `;
  }

  private _renderConfigTab() {
    const hasSelection = this._selectedEntities.length > 0;
    const deviceTypes = this._getSelectedDeviceTypes();
    const hasT2Device = deviceTypes.includes('t2_bulb') || deviceTypes.includes('t2_cct');
    const hasT1Strip = deviceTypes.includes('t1_strip');

    // Find T2 config entities - first one for display, all for applying
    const transitionCurveEntity = this._findTransitionCurveEntity();
    const initialBrightnessEntity = this._findInitialBrightnessEntity();

    // Find T1 Strip length entity
    const t1StripLengthEntity = this._findT1StripLengthEntity();

    // Find dimming entities - first one for display (all lights support these)
    const onOffDurationEntity = this._findOnOffDurationEntity();
    const offOnDurationEntity = this._findOffOnDurationEntity();
    const dimmingRangeMinEntity = this._findDimmingRangeMinEntity();
    const dimmingRangeMaxEntity = this._findDimmingRangeMaxEntity();

    // Get current values from entities
    const initialBrightnessValue = initialBrightnessEntity && this.hass?.states[initialBrightnessEntity]
      ? parseFloat(this.hass.states[initialBrightnessEntity].state) || 0
      : 0;

    const t1StripLengthValue = t1StripLengthEntity && this.hass?.states[t1StripLengthEntity]
      ? parseFloat(this.hass.states[t1StripLengthEntity].state) || 2
      : 2;

    const onOffDurationValue = onOffDurationEntity && this.hass?.states[onOffDurationEntity]
      ? parseFloat(this.hass.states[onOffDurationEntity].state) || 0
      : 0;

    const offOnDurationValue = offOnDurationEntity && this.hass?.states[offOnDurationEntity]
      ? parseFloat(this.hass.states[offOnDurationEntity].state) || 0
      : 0;

    const dimmingRangeMinValue = dimmingRangeMinEntity && this.hass?.states[dimmingRangeMinEntity]
      ? parseFloat(this.hass.states[dimmingRangeMinEntity].state) || 1
      : 1;

    const dimmingRangeMaxValue = dimmingRangeMaxEntity && this.hass?.states[dimmingRangeMaxEntity]
      ? parseFloat(this.hass.states[dimmingRangeMaxEntity].state) || 100
      : 100;

    // Check if any dimming entities are available
    const hasDimmingEntities = onOffDurationEntity || offOnDurationEntity || dimmingRangeMinEntity || dimmingRangeMaxEntity;

    return html`
      <!-- Z2M Instances Info Section -->
      <ha-expansion-panel
        outlined
        .expanded=${false}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize('instances.section_title')}</div>
            <div class="section-subtitle">${(() => {
              const instanceCount = this._z2mInstances.length;
              const deviceCount = this._z2mInstances.reduce((sum, i) => sum + i.device_counts.total, 0);
              const key = instanceCount === 1 && deviceCount === 1 ? 'instances.subtitle_single' : 'instances.subtitle_plural';
              return this._localize(key, { count: String(instanceCount), devices: String(deviceCount) });
            })()}</div>
          </div>
        </div>
        <div class="section-content" style="display: block; padding: 0;">
          ${this._z2mInstances.length === 0
            ? html`
                <div style="padding: 16px; text-align: center; color: var(--secondary-text-color);">
                  <ha-icon icon="mdi:information-outline" style="margin-right: 8px;"></ha-icon>
                  ${this._localize('instances.no_instances')}
                </div>
              `
            : html`
                <div class="z2m-instances-grid">
                  ${this._z2mInstances.map(instance => html`
                    <div class="z2m-instance-card">
                      <div class="z2m-instance-header">
                        <ha-icon icon="mdi:zigbee" style="color: var(--primary-color);"></ha-icon>
                        <div class="z2m-instance-info">
                          <span class="z2m-instance-name">${instance.title}</span>
                          ${instance.title !== instance.z2m_base_topic ? html`
                            <span class="z2m-instance-topic">${instance.z2m_base_topic}</span>
                          ` : ''}
                        </div>
                      </div>
                      <div class="z2m-instance-stats">
                        <div class="z2m-stat">
                          <span class="z2m-stat-value">${instance.device_counts.total}</span>
                          <span class="z2m-stat-label">${this._localize('instances.total')}</span>
                        </div>
                        ${instance.device_counts.t2_rgb > 0 ? html`
                          <div class="z2m-stat">
                            <span class="z2m-stat-value">${instance.device_counts.t2_rgb}</span>
                            <span class="z2m-stat-label">${this._localize('instances.t2_rgb')}</span>
                          </div>
                        ` : ''}
                        ${instance.device_counts.t2_cct > 0 ? html`
                          <div class="z2m-stat">
                            <span class="z2m-stat-value">${instance.device_counts.t2_cct}</span>
                            <span class="z2m-stat-label">${this._localize('instances.t2_cct')}</span>
                          </div>
                        ` : ''}
                        ${instance.device_counts.t1m > 0 ? html`
                          <div class="z2m-stat">
                            <span class="z2m-stat-value">${instance.device_counts.t1m}</span>
                            <span class="z2m-stat-label">${this._localize('instances.t1m')}</span>
                          </div>
                        ` : ''}
                        ${instance.device_counts.t1_strip > 0 ? html`
                          <div class="z2m-stat">
                            <span class="z2m-stat-value">${instance.device_counts.t1_strip}</span>
                            <span class="z2m-stat-label">${this._localize('instances.t1_strip')}</span>
                          </div>
                        ` : ''}
                        ${instance.device_counts.other > 0 ? html`
                          <div class="z2m-stat">
                            <span class="z2m-stat-value">${instance.device_counts.other}</span>
                            <span class="z2m-stat-label">${this._localize('instances.other')}</span>
                          </div>
                        ` : ''}
                      </div>
                      ${instance.devices.length > 0 ? html`
                        <div class="z2m-devices-list">
                          <details>
                            <summary style="cursor: pointer; color: var(--secondary-text-color); font-size: var(--ha-font-size-s, 12px);">
                              ${this._localize(instance.devices.length === 1 ? 'instances.show_devices_single' : 'instances.show_devices_plural', { count: String(instance.devices.length) })}
                            </summary>
                            <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color);">
                              ${instance.devices.map(device => html`<li>${device}</li>`)}
                            </ul>
                          </details>
                        </div>
                      ` : ''}
                    </div>
                  `)}
                </div>
              `}
        </div>
      </ha-expansion-panel>

      ${!hasSelection
        ? html`
            <ha-card class="controls">
              <div class="control-row">
                <div class="control-input">
                  <ha-alert alert-type="info">
                    ${this._localize('config.select_light_message')}
                  </ha-alert>
                </div>
              </div>
            </ha-card>
          `
        : ''}

      ${hasT2Device
        ? html`
            <ha-expansion-panel
              outlined
              .expanded=${true}
            >
              <div slot="header" class="section-header">
                <div>
                  <div class="section-title">${this._localize('config.transition_settings')}</div>
                </div>
              </div>
              <div class="section-content" style="display: block; padding: 0;">
                <div class="transition-settings-grid">
                  <div class="transition-curve-column">
                    <transition-curve-editor
                      .hass=${this.hass}
                      .curvature=${this._localCurvature}
                      @curvature-input=${this._handleCurvatureInput}
                    ></transition-curve-editor>
                  </div>
                  <div class="initial-brightness-column">
                    <div class="initial-brightness-content">
                      <!-- Curvature controls -->
                      <div class="form-section" style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--divider-color);">
                        <div class="curve-control-row">
                          <div class="curve-control-info">
                            <span class="form-label">${this._localize('config.custom_curvature_label')}</span>
                            <div style="font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color);">
                              ${this._getCurvatureDescription()}
                            </div>
                          </div>
                          <div class="curve-control-actions">
                            <ha-selector
                              .hass=${this.hass}
                              .selector=${{
                                number: {
                                  min: 0.2,
                                  max: 6,
                                  step: 0.01,
                                  mode: 'box',
                                },
                              }}
                              .value=${this._localCurvature}
                              @value-changed=${this._handleCurvatureNumberChange}
                              style="width: 80px;"
                            ></ha-selector>
                            <ha-button
                              @click=${this._applyCurvature}
                              ?disabled=${!transitionCurveEntity || this._applyingCurvature}
                            >
                              ${this._applyingCurvature ? this._localize('config.applying_button') : this._localize('config.apply_button')}
                            </ha-button>
                          </div>
                        </div>
                        <div class="curve-legend">
                          <span class="legend-item">
                            <span class="legend-dot fast-slow"></span>
                            ${this._localize('config.curve_legend_fast_slow')}
                          </span>
                          <span class="legend-item">
                            <span class="legend-dot linear"></span>
                            ${this._localize('config.curve_legend_linear')}
                          </span>
                          <span class="legend-item">
                            <span class="legend-dot slow-fast"></span>
                            ${this._localize('config.curve_legend_slow_fast')}
                          </span>
                        </div>
                      </div>

                      <!-- Initial Brightness -->
                      <div class="form-section">
                        <span class="form-label">${this._localize('config.initial_brightness_label')}</span>
                        <ha-selector
                          .hass=${this.hass}
                          .selector=${{
                            number: {
                              min: 0,
                              max: 50,
                              step: 1,
                              mode: 'slider',
                              unit_of_measurement: '%',
                            },
                          }}
                          .value=${initialBrightnessValue}
                          @value-changed=${(e: CustomEvent) => this._handleInitialBrightnessChange(e)}
                          ?disabled=${!initialBrightnessEntity}
                        ></ha-selector>
                        ${!initialBrightnessEntity ? html`
                          <div style="margin-top: 8px; font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color);">
                            ${this._localize('config.initial_brightness_not_found')}
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ha-expansion-panel>
          `
        : ''}

      ${hasSelection
        ? html`
            <ha-expansion-panel
              outlined
              .expanded=${true}
            >
              <div slot="header" class="section-header">
                <div>
                  <div class="section-title">${this._localize('config.dimming_settings_title')}</div>
                </div>
              </div>
              <div class="section-content" style="display: block; padding: 0;">
                <div class="dimming-settings-grid">
                  <div class="dimming-setting-item">
                    <div class="dimming-setting-content">
                      <span class="form-label">${this._localize('config.on_to_off_duration_label')}</span>
                      <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                          number: {
                            min: 0,
                            max: 10,
                            step: 0.1,
                            mode: 'slider',
                            unit_of_measurement: 's',
                          },
                        }}
                        .value=${onOffDurationValue}
                        @value-changed=${(e: CustomEvent) => this._handleDimmingSettingChange(e, 'on_off_duration')}
                        ?disabled=${!onOffDurationEntity}
                      ></ha-selector>
                      ${!onOffDurationEntity ? html`
                        <div class="entity-not-found">${this._localize('config.entity_not_found')}</div>
                      ` : ''}
                    </div>
                  </div>
                  <div class="dimming-setting-item">
                    <div class="dimming-setting-content">
                      <span class="form-label">${this._localize('config.off_to_on_duration_label')}</span>
                      <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                          number: {
                            min: 0,
                            max: 10,
                            step: 0.1,
                            mode: 'slider',
                            unit_of_measurement: 's',
                          },
                        }}
                        .value=${offOnDurationValue}
                        @value-changed=${(e: CustomEvent) => this._handleDimmingSettingChange(e, 'off_on_duration')}
                        ?disabled=${!offOnDurationEntity}
                      ></ha-selector>
                      ${!offOnDurationEntity ? html`
                        <div class="entity-not-found">${this._localize('config.entity_not_found')}</div>
                      ` : ''}
                    </div>
                  </div>
                  <div class="dimming-setting-item">
                    <div class="dimming-setting-content">
                      <span class="form-label">${this._localize('config.dimming_range_min_label')}</span>
                      <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                          number: {
                            min: 1,
                            max: Math.min(99, dimmingRangeMaxValue - 1),
                            step: 1,
                            mode: 'slider',
                            unit_of_measurement: '%',
                          },
                        }}
                        .value=${dimmingRangeMinValue}
                        @value-changed=${(e: CustomEvent) => this._handleDimmingRangeMinChange(e)}
                        ?disabled=${!dimmingRangeMinEntity}
                      ></ha-selector>
                      ${!dimmingRangeMinEntity ? html`
                        <div class="entity-not-found">${this._localize('config.entity_not_found')}</div>
                      ` : ''}
                    </div>
                  </div>
                  <div class="dimming-setting-item">
                    <div class="dimming-setting-content">
                      <span class="form-label">${this._localize('config.dimming_range_max_label')}</span>
                      <ha-selector
                        .hass=${this.hass}
                        .selector=${{
                          number: {
                            min: Math.max(2, dimmingRangeMinValue + 1),
                            max: 100,
                            step: 1,
                            mode: 'slider',
                            unit_of_measurement: '%',
                          },
                        }}
                        .value=${dimmingRangeMaxValue}
                        @value-changed=${(e: CustomEvent) => this._handleDimmingRangeMaxChange(e)}
                        ?disabled=${!dimmingRangeMaxEntity}
                      ></ha-selector>
                      ${!dimmingRangeMaxEntity ? html`
                        <div class="entity-not-found">${this._localize('config.entity_not_found')}</div>
                      ` : ''}
                    </div>
                  </div>
                </div>
                ${!hasDimmingEntities ? html`
                  <div style="padding: 16px; text-align: center; color: var(--secondary-text-color);">
                    <ha-icon icon="mdi:information-outline" style="margin-right: 8px;"></ha-icon>
                    ${this._localize('config.dimming_not_available')}
                  </div>
                ` : ''}
              </div>
            </ha-expansion-panel>
          `
        : ''}

      ${hasT1Strip
        ? html`
            <ha-expansion-panel
              outlined
              .expanded=${true}
            >
              <div slot="header" class="section-header">
                <div>
                  <div class="section-title">${this._localize('sections.t1_strip_settings')}</div>
                </div>
              </div>
              <div class="section-content" style="display: block; padding: 16px;">
                <div class="form-section">
                  <span class="form-label">${this._localize('config.strip_length_label')}</span>
                  <ha-selector
                    .hass=${this.hass}
                    .selector=${{
                      number: {
                        min: 1,
                        max: 10,
                        step: 0.2,
                        mode: 'slider',
                        unit_of_measurement: 'm',
                      },
                    }}
                    .value=${t1StripLengthValue}
                    @value-changed=${(e: CustomEvent) => this._handleT1StripLengthChange(e)}
                    ?disabled=${!t1StripLengthEntity}
                  ></ha-selector>
                  <div style="margin-top: 8px; font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color);">
                    ${t1StripLengthEntity
                      ? this._localize('config.strip_length_info')
                      : this._localize('config.strip_length_not_found')}
                  </div>
                </div>
              </div>
            </ha-expansion-panel>
          `
        : ''}

      ${this._renderSegmentZonesSection()}
    `;
  }

  private _renderSegmentZonesSection() {
    const segmentDevices = this._getSelectedSegmentDevices();

    if (segmentDevices.size === 0) {
      // Only show info message if there is a selection but no segment devices
      if (this._selectedEntities.length > 0) {
        const deviceTypes = this._getSelectedDeviceTypes();
        const hasNonSegmentDevice = deviceTypes.some(dt => dt !== 't1m' && dt !== 't1_strip');
        if (hasNonSegmentDevice) {
          return html`
            <ha-expansion-panel outlined .expanded=${false}>
              <div slot="header" class="section-header">
                <div>
                  <div class="section-title">${this._localize('config.segment_zones_title')}</div>
                  <div class="section-subtitle">${this._localize('config.segment_zones_subtitle')}</div>
                </div>
              </div>
              <div class="section-content" style="display: block; padding: 16px;">
                <ha-alert alert-type="info">
                  ${this._localize('config.zone_no_segment_devices')}
                </ha-alert>
              </div>
            </ha-expansion-panel>
          `;
        }
      }
      return '';
    }

    return html`
      <ha-expansion-panel outlined .expanded=${true}>
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize('config.segment_zones_title')}</div>
            <div class="section-subtitle">${this._localize('config.segment_zones_subtitle')}</div>
          </div>
        </div>
        <div class="section-content" style="display: block; padding: 0;">
          ${Array.from(segmentDevices.entries()).map(([ieee, device]) => {
            const editZones = this._zoneEditing.get(ieee) || [];
            const modified = this._zonesModified(ieee);
            return html`
              <div class="zone-device-section">
                <div class="zone-device-header">
                  <ha-icon icon="${this._getEntityIcon(device.entity_id)}"></ha-icon>
                  <span>${device.z2m_friendly_name}</span>
                  <span class="zone-device-segments">${this._localize('config.segment_count', { count: device.segment_count.toString() })}</span>
                </div>
                ${editZones.length === 0
                  ? html`<div class="zone-empty-message">${this._localize('config.zone_no_zones')}</div>`
                  : html`
                    <div class="zone-list">
                      ${editZones.map((zone, index) => html`
                        <div class="zone-row">
                          <div class="zone-row-header">
                            <ha-selector
                              class="zone-name-input"
                              .hass=${this.hass}
                              .selector=${{ text: {} }}
                              .value=${zone.name}
                              .label=${this._localize('config.zone_name_label')}
                              @value-changed=${(e: CustomEvent) => this._updateZoneField(ieee, index, 'name', e.detail.value)}
                            ></ha-selector>
                            <ha-icon-button
                              @click=${() => this._removeZoneRow(ieee, index)}
                              title=${this._localize('config.zone_delete_tooltip')}
                            >
                              <ha-icon icon="mdi:delete-outline"></ha-icon>
                            </ha-icon-button>
                          </div>
                          <segment-selector
                            .mode=${'selection'}
                            .maxSegments=${device.segment_count}
                            .value=${zone.segments}
                            .hideControls=${true}
                            @value-changed=${(e: CustomEvent) => this._updateZoneField(ieee, index, 'segments', e.detail.value)}
                          ></segment-selector>
                        </div>
                      `)}
                    </div>
                  `}
                <div class="zone-actions">
                  <ha-button @click=${() => this._addZoneRow(ieee)}>
                    <ha-icon icon="mdi:plus"></ha-icon>
                    ${this._localize('config.zone_add_button')}
                  </ha-button>
                  <ha-button
                    @click=${() => this._saveZones(ieee, device.segment_count)}
                    ?disabled=${!modified || this._zoneSaving}
                  >
                    <ha-icon icon="mdi:content-save-outline"></ha-icon>
                    ${this._localize('config.zone_save_button')}
                  </ha-button>
                </div>
              </div>
            `;
          })}
        </div>
      </ha-expansion-panel>
    `;
  }

  private async _handleInitialBrightnessChange(e: CustomEvent): Promise<void> {
    if (!this.hass) return;

    const value = e.detail.value;
    if (typeof value !== 'number') return;

    // Find all initial brightness entities for all selected T2 devices
    const brightnessEntities = this._findAllInitialBrightnessEntities();
    if (!brightnessEntities.length) return;

    // Apply to all T2 devices
    try {
      await Promise.all(
        brightnessEntities.map(entityId =>
          this.hass!.callService('number', 'set_value', {
            entity_id: entityId,
            value: value,
          })
        )
      );
    } catch (err) {
      console.error('Failed to set initial brightness:', err);
    }
  }

  /**
   * Find the transition_curve_curvature number entity for the first selected T2 device.
   * Supports both T2 RGB bulbs (with candlelight effect) and T2 CCT bulbs (CCT-only).
   * The entity ID pattern is: number.{device_name}_transition_curve_curvature
   */
  private _findTransitionCurveEntity(): string | undefined {
    if (!this.hass || !this._selectedEntities.length) return undefined;

    const suffix = 'transition_curve_curvature';

    // Find the first T2 device in selected entities
    for (const entityId of this._selectedEntities) {
      const entity = this.hass.states[entityId];
      if (!entity) continue;

      // Check if this is a T2 device using _supportedEntities first (most reliable)
      const supportedEntity = this._supportedEntities.get(entityId);
      const isT2FromBackend = supportedEntity?.device_type === 't2_bulb' || supportedEntity?.device_type === 't2_cct';

      // Fallback to effect_list check if not in _supportedEntities
      const effectList = entity.attributes.effect_list as string[] | undefined;
      const isT2RGB = effectList && effectList.includes('candlelight');
      const isT2CCT = !effectList && entity.attributes.color_temp !== undefined;

      if (!isT2FromBackend && !isT2RGB && !isT2CCT) continue;

      // Pattern 1: Replace light. with number. and append suffix
      const baseName = entityId.replace('light.', '');
      const curveEntityId = `number.${baseName}_${suffix}`;

      if (this.hass.states[curveEntityId]) {
        return curveEntityId;
      }

      // Pattern 2: Use Z2M friendly name from _supportedEntities for better matching
      if (supportedEntity?.z2m_friendly_name) {
        const z2mBaseName = supportedEntity.z2m_friendly_name.toLowerCase().replace(/\s+/g, '_');
        const z2mTargetEntityId = `number.${z2mBaseName}_${suffix}`;
        if (this.hass.states[z2mTargetEntityId]) {
          return z2mTargetEntityId;
        }
      }

      // Pattern 3: Search with stricter matching (at least first 2 words)
      const deviceName = baseName.toLowerCase();
      const deviceWords = deviceName.split('_');
      for (const stateEntityId of Object.keys(this.hass.states)) {
        if (
          stateEntityId.startsWith('number.') &&
          stateEntityId.includes(suffix)
        ) {
          const stateBaseName = stateEntityId.replace('number.', '').replace(`_${suffix}`, '').toLowerCase();
          const stateWords = stateBaseName.split('_');
          if (deviceWords.length >= 2 && stateWords.length >= 2 &&
              deviceWords[0] === stateWords[0] && deviceWords[1] === stateWords[1]) {
            return stateEntityId;
          }
        }
      }
    }

    return undefined;
  }

  private _findInitialBrightnessEntity(): string | undefined {
    if (!this.hass || !this._selectedEntities.length) return undefined;

    const suffix = 'transition_initial_brightness';

    // Find the first T2 device in selected entities
    for (const entityId of this._selectedEntities) {
      const entity = this.hass.states[entityId];
      if (!entity) continue;

      // Check if this is a T2 device using _supportedEntities first (most reliable)
      const supportedEntity = this._supportedEntities.get(entityId);
      const isT2FromBackend = supportedEntity?.device_type === 't2_bulb' || supportedEntity?.device_type === 't2_cct';

      // Fallback to effect_list check if not in _supportedEntities
      const effectList = entity.attributes.effect_list as string[] | undefined;
      const isT2RGB = effectList && effectList.includes('candlelight');
      const isT2CCT = !effectList && entity.attributes.color_temp !== undefined;

      if (!isT2FromBackend && !isT2RGB && !isT2CCT) continue;

      // Pattern 1: Replace light. with number. and append suffix
      const baseName = entityId.replace('light.', '');
      const brightnessEntityId = `number.${baseName}_${suffix}`;

      if (this.hass.states[brightnessEntityId]) {
        return brightnessEntityId;
      }

      // Pattern 2: Use Z2M friendly name from _supportedEntities for better matching
      if (supportedEntity?.z2m_friendly_name) {
        const z2mBaseName = supportedEntity.z2m_friendly_name.toLowerCase().replace(/\s+/g, '_');
        const z2mTargetEntityId = `number.${z2mBaseName}_${suffix}`;
        if (this.hass.states[z2mTargetEntityId]) {
          return z2mTargetEntityId;
        }
      }

      // Pattern 3: Search with stricter matching (at least first 2 words)
      const deviceName = baseName.toLowerCase();
      const deviceWords = deviceName.split('_');
      for (const stateEntityId of Object.keys(this.hass.states)) {
        if (
          stateEntityId.startsWith('number.') &&
          stateEntityId.includes(suffix)
        ) {
          const stateBaseName = stateEntityId.replace('number.', '').replace(`_${suffix}`, '').toLowerCase();
          const stateWords = stateBaseName.split('_');
          if (deviceWords.length >= 2 && stateWords.length >= 2 &&
              deviceWords[0] === stateWords[0] && deviceWords[1] === stateWords[1]) {
            return stateEntityId;
          }
        }
      }
    }

    return undefined;
  }

  // Find ALL transition curve entities for ALL selected T2 devices
  private _findAllTransitionCurveEntities(): string[] {
    if (!this.hass || !this._selectedEntities.length) return [];

    const entities: string[] = [];
    const t2Entities = this._getT2CompatibleEntities();
    const suffix = 'transition_curve_curvature';

    for (const entityId of t2Entities) {
      const baseName = entityId.replace('light.', '');
      const curveEntityId = `number.${baseName}_${suffix}`;

      if (this.hass.states[curveEntityId]) {
        entities.push(curveEntityId);
        continue;
      }

      // Pattern 2: Use Z2M friendly name from _supportedEntities for better matching
      const supportedEntity = this._supportedEntities.get(entityId);
      if (supportedEntity?.z2m_friendly_name) {
        const z2mBaseName = supportedEntity.z2m_friendly_name.toLowerCase().replace(/\s+/g, '_');
        const z2mTargetEntityId = `number.${z2mBaseName}_${suffix}`;
        if (this.hass.states[z2mTargetEntityId] && !entities.includes(z2mTargetEntityId)) {
          entities.push(z2mTargetEntityId);
          continue;
        }
      }

      // Pattern 3: Search with stricter matching (at least first 2 words)
      const deviceName = baseName.toLowerCase();
      const deviceWords = deviceName.split('_');
      for (const stateEntityId of Object.keys(this.hass.states)) {
        if (
          stateEntityId.startsWith('number.') &&
          stateEntityId.includes(suffix) &&
          !entities.includes(stateEntityId)
        ) {
          const stateBaseName = stateEntityId.replace('number.', '').replace(`_${suffix}`, '').toLowerCase();
          const stateWords = stateBaseName.split('_');
          if (deviceWords.length >= 2 && stateWords.length >= 2 &&
              deviceWords[0] === stateWords[0] && deviceWords[1] === stateWords[1]) {
            entities.push(stateEntityId);
            break;
          }
        }
      }
    }

    return entities;
  }

  // Find ALL initial brightness entities for ALL selected T2 devices
  private _findAllInitialBrightnessEntities(): string[] {
    if (!this.hass || !this._selectedEntities.length) return [];

    const entities: string[] = [];
    const t2Entities = this._getT2CompatibleEntities();
    const suffix = 'transition_initial_brightness';

    for (const entityId of t2Entities) {
      const baseName = entityId.replace('light.', '');
      const brightnessEntityId = `number.${baseName}_${suffix}`;

      if (this.hass.states[brightnessEntityId]) {
        entities.push(brightnessEntityId);
        continue;
      }

      // Pattern 2: Use Z2M friendly name from _supportedEntities for better matching
      const supportedEntity = this._supportedEntities.get(entityId);
      if (supportedEntity?.z2m_friendly_name) {
        const z2mBaseName = supportedEntity.z2m_friendly_name.toLowerCase().replace(/\s+/g, '_');
        const z2mTargetEntityId = `number.${z2mBaseName}_${suffix}`;
        if (this.hass.states[z2mTargetEntityId] && !entities.includes(z2mTargetEntityId)) {
          entities.push(z2mTargetEntityId);
          continue;
        }
      }

      // Pattern 3: Search with stricter matching (at least first 2 words)
      const deviceName = baseName.toLowerCase();
      const deviceWords = deviceName.split('_');
      for (const stateEntityId of Object.keys(this.hass.states)) {
        if (
          stateEntityId.startsWith('number.') &&
          stateEntityId.includes(suffix) &&
          !entities.includes(stateEntityId)
        ) {
          const stateBaseName = stateEntityId.replace('number.', '').replace(`_${suffix}`, '').toLowerCase();
          const stateWords = stateBaseName.split('_');
          if (deviceWords.length >= 2 && stateWords.length >= 2 &&
              deviceWords[0] === stateWords[0] && deviceWords[1] === stateWords[1]) {
            entities.push(stateEntityId);
            break;
          }
        }
      }
    }

    return entities;
  }

  // Find ALL dimming entities for ALL selected devices (all models support these)
  private _findAllDimmingEntities(suffix: string): string[] {
    if (!this.hass || !this._selectedEntities.length) return [];

    const entities: string[] = [];

    for (const entityId of this._selectedEntities) {
      const entity = this.hass.states[entityId];
      if (!entity) continue;

      const baseName = entityId.replace('light.', '');
      const targetEntityId = `number.${baseName}_${suffix}`;

      if (this.hass.states[targetEntityId]) {
        entities.push(targetEntityId);
        continue;
      }

      // Pattern 2: Use Z2M friendly name from _supportedEntities for better matching
      const supportedEntity = this._supportedEntities.get(entityId);
      if (supportedEntity?.z2m_friendly_name) {
        const z2mBaseName = supportedEntity.z2m_friendly_name.toLowerCase().replace(/\s+/g, '_');
        const z2mTargetEntityId = `number.${z2mBaseName}_${suffix}`;
        if (this.hass.states[z2mTargetEntityId] && !entities.includes(z2mTargetEntityId)) {
          entities.push(z2mTargetEntityId);
          continue;
        }
      }

      // Pattern 3: Search with stricter matching (at least first 2 words)
      const deviceName = baseName.toLowerCase();
      const deviceWords = deviceName.split('_');
      for (const stateEntityId of Object.keys(this.hass.states)) {
        if (
          stateEntityId.startsWith('number.') &&
          stateEntityId.includes(suffix) &&
          !entities.includes(stateEntityId)
        ) {
          const stateBaseName = stateEntityId.replace('number.', '').replace(`_${suffix}`, '').toLowerCase();
          const stateWords = stateBaseName.split('_');
          // Match if first 2+ words match
          if (deviceWords.length >= 2 && stateWords.length >= 2 &&
              deviceWords[0] === stateWords[0] && deviceWords[1] === stateWords[1]) {
            entities.push(stateEntityId);
            break;
          }
        }
      }
    }

    return entities;
  }

  // Generic entity finder for any supported light (not just T2)
  private _findDimmingEntity(suffix: string): string | undefined {
    if (!this.hass || !this._selectedEntities.length) return undefined;

    for (const entityId of this._selectedEntities) {
      const entity = this.hass.states[entityId];
      if (!entity) continue;

      // Pattern 1: Replace light. with number. and append suffix
      const baseName = entityId.replace('light.', '');
      const targetEntityId = `number.${baseName}_${suffix}`;

      if (this.hass.states[targetEntityId]) {
        return targetEntityId;
      }

      // Pattern 2: Use Z2M friendly name from _supportedEntities for better matching
      const supportedEntity = this._supportedEntities.get(entityId);
      if (supportedEntity?.z2m_friendly_name) {
        // Z2M uses the friendly name (with spaces converted to underscores) for entity naming
        const z2mBaseName = supportedEntity.z2m_friendly_name.toLowerCase().replace(/\s+/g, '_');
        const z2mTargetEntityId = `number.${z2mBaseName}_${suffix}`;
        if (this.hass.states[z2mTargetEntityId]) {
          return z2mTargetEntityId;
        }
      }

      // Pattern 3: Search for any number entity containing the full device name and suffix
      const deviceName = baseName.toLowerCase();
      for (const stateEntityId of Object.keys(this.hass.states)) {
        if (
          stateEntityId.startsWith('number.') &&
          stateEntityId.includes(suffix)
        ) {
          // Check if this entity shares enough of the device name (at least first 2 words)
          const stateBaseName = stateEntityId.replace('number.', '').replace(`_${suffix}`, '').toLowerCase();
          const deviceWords = deviceName.split('_');
          const stateWords = stateBaseName.split('_');
          // Match if first 2+ words match
          if (deviceWords.length >= 2 && stateWords.length >= 2 &&
              deviceWords[0] === stateWords[0] && deviceWords[1] === stateWords[1]) {
            return stateEntityId;
          }
        }
      }
    }

    return undefined;
  }

  private _findOnOffDurationEntity(): string | undefined {
    return this._findDimmingEntity('on_off_duration');
  }

  private _findOffOnDurationEntity(): string | undefined {
    return this._findDimmingEntity('off_on_duration');
  }

  private _findDimmingRangeMinEntity(): string | undefined {
    return this._findDimmingEntity('dimming_range_minimum');
  }

  private _findDimmingRangeMaxEntity(): string | undefined {
    return this._findDimmingEntity('dimming_range_maximum');
  }

  private async _handleDimmingSettingChange(
    e: CustomEvent,
    suffix: string
  ): Promise<void> {
    if (!this.hass) return;

    const value = e.detail.value;
    if (typeof value !== 'number') return;

    // Find all entities with this suffix for all selected devices
    const entities = this._findAllDimmingEntities(suffix);
    if (!entities.length) return;

    // Apply to all devices
    try {
      await Promise.all(
        entities.map(entityId =>
          this.hass!.callService('number', 'set_value', {
            entity_id: entityId,
            value: value,
          })
        )
      );
    } catch (err) {
      console.error('Failed to set dimming setting:', err);
    }
  }

  private async _handleDimmingRangeMinChange(e: CustomEvent): Promise<void> {
    const minEntityId = this._findDimmingRangeMinEntity();
    const maxEntityId = this._findDimmingRangeMaxEntity();
    if (!this.hass || !minEntityId) return;

    const newMin = e.detail.value;
    if (typeof newMin !== 'number') return;

    // Get current max value
    const maxValue = maxEntityId && this.hass.states[maxEntityId]
      ? parseFloat(this.hass.states[maxEntityId].state) || 100
      : 100;

    // Validate: min cannot exceed max
    if (newMin >= maxValue) {
      // Show error or just clamp
      return;
    }

    await this._handleDimmingSettingChange(e, 'dimming_range_minimum');
  }

  private async _handleDimmingRangeMaxChange(e: CustomEvent): Promise<void> {
    const minEntityId = this._findDimmingRangeMinEntity();
    const maxEntityId = this._findDimmingRangeMaxEntity();
    if (!this.hass || !maxEntityId) return;

    const newMax = e.detail.value;
    if (typeof newMax !== 'number') return;

    // Get current min value
    const minValue = minEntityId && this.hass.states[minEntityId]
      ? parseFloat(this.hass.states[minEntityId].state) || 1
      : 1;

    // Validate: max cannot be less than min
    if (newMax <= minValue) {
      // Show error or just clamp
      return;
    }

    await this._handleDimmingSettingChange(e, 'dimming_range_maximum');
  }

  // T1 Strip specific methods
  private _getT1StripCompatibleEntities(): string[] {
    if (!this.hass) return [];
    return this._selectedEntities.filter(entityId => {
      const entity = this.hass!.states[entityId];
      if (!entity) return false;
      const effectList = entity.attributes.effect_list as string[] | undefined;
      // T1 Strip has 'dash' effect but not 'candlelight' (which is T2-only)
      return effectList && effectList.includes('dash') && !effectList.includes('candlelight');
    });
  }

  private _findT1StripLengthEntity(): string | undefined {
    if (!this.hass || !this._selectedEntities.length) return undefined;

    const t1StripEntities = this._getT1StripCompatibleEntities();
    if (!t1StripEntities.length) return undefined;

    const suffix = 'length';

    // Find the first T1 Strip length entity
    for (const entityId of t1StripEntities) {
      const baseName = entityId.replace('light.', '');
      const lengthEntityId = `number.${baseName}_${suffix}`;

      if (this.hass.states[lengthEntityId]) {
        return lengthEntityId;
      }

      // Pattern 2: Use Z2M friendly name from _supportedEntities for better matching
      const supportedEntity = this._supportedEntities.get(entityId);
      if (supportedEntity?.z2m_friendly_name) {
        const z2mBaseName = supportedEntity.z2m_friendly_name.toLowerCase().replace(/\s+/g, '_');
        const z2mTargetEntityId = `number.${z2mBaseName}_${suffix}`;
        if (this.hass.states[z2mTargetEntityId]) {
          return z2mTargetEntityId;
        }
      }

      // Pattern 3: Search with stricter matching (at least first 2 words)
      const deviceName = baseName.toLowerCase();
      const deviceWords = deviceName.split('_');
      for (const stateEntityId of Object.keys(this.hass.states)) {
        if (
          stateEntityId.startsWith('number.') &&
          stateEntityId.endsWith(`_${suffix}`)
        ) {
          const stateBaseName = stateEntityId.replace('number.', '').replace(`_${suffix}`, '').toLowerCase();
          const stateWords = stateBaseName.split('_');
          if (deviceWords.length >= 2 && stateWords.length >= 2 &&
              deviceWords[0] === stateWords[0] && deviceWords[1] === stateWords[1]) {
            return stateEntityId;
          }
        }
      }
    }

    return undefined;
  }

  private _findAllT1StripLengthEntities(): string[] {
    if (!this.hass || !this._selectedEntities.length) return [];

    const entities: string[] = [];
    const t1StripEntities = this._getT1StripCompatibleEntities();
    const suffix = 'length';

    for (const entityId of t1StripEntities) {
      const baseName = entityId.replace('light.', '');
      const lengthEntityId = `number.${baseName}_${suffix}`;

      if (this.hass.states[lengthEntityId]) {
        entities.push(lengthEntityId);
        continue;
      }

      // Pattern 2: Use Z2M friendly name from _supportedEntities for better matching
      const supportedEntity = this._supportedEntities.get(entityId);
      if (supportedEntity?.z2m_friendly_name) {
        const z2mBaseName = supportedEntity.z2m_friendly_name.toLowerCase().replace(/\s+/g, '_');
        const z2mTargetEntityId = `number.${z2mBaseName}_${suffix}`;
        if (this.hass.states[z2mTargetEntityId] && !entities.includes(z2mTargetEntityId)) {
          entities.push(z2mTargetEntityId);
          continue;
        }
      }

      // Pattern 3: Search with stricter matching (at least first 2 words)
      const deviceName = baseName.toLowerCase();
      const deviceWords = deviceName.split('_');
      for (const stateEntityId of Object.keys(this.hass.states)) {
        if (
          stateEntityId.startsWith('number.') &&
          stateEntityId.endsWith(`_${suffix}`) &&
          !entities.includes(stateEntityId)
        ) {
          const stateBaseName = stateEntityId.replace('number.', '').replace(`_${suffix}`, '').toLowerCase();
          const stateWords = stateBaseName.split('_');
          if (deviceWords.length >= 2 && stateWords.length >= 2 &&
              deviceWords[0] === stateWords[0] && deviceWords[1] === stateWords[1]) {
            entities.push(stateEntityId);
            break;
          }
        }
      }
    }

    return entities;
  }

  private async _handleT1StripLengthChange(e: CustomEvent): Promise<void> {
    if (!this.hass) return;

    const value = e.detail.value;
    if (typeof value !== 'number') return;

    const entities = this._findAllT1StripLengthEntities();
    if (!entities.length) return;

    try {
      await Promise.all(
        entities.map(entityId =>
          this.hass!.callService('number', 'set_value', {
            entity_id: entityId,
            value: value,
          })
        )
      );
    } catch (err) {
      console.error('Failed to set T1 Strip length:', err);
    }
  }

  // Curvature control methods
  private _handleCurvatureInput(e: CustomEvent): void {
    const { curvature } = e.detail;
    if (typeof curvature === 'number') {
      this._localCurvature = curvature;
    }
  }

  private _handleCurvatureNumberChange(e: CustomEvent): void {
    const value = e.detail.value;
    if (typeof value === 'number') {
      // Clamp to valid range
      const clamped = Math.max(0.2, Math.min(6.0, value));
      this._localCurvature = Math.round(clamped * 100) / 100;
    }
  }

  private _getCurvatureDescription(): string {
    if (this._localCurvature < 0.9) {
      return this._localize('config.curvature_fast_slow');
    } else if (this._localCurvature <= 1.1) {
      return this._localize('config.curvature_linear');
    } else {
      return this._localize('config.curvature_slow_fast');
    }
  }

  private async _applyCurvature(): Promise<void> {
    if (!this.hass) return;

    const entities = this._findAllTransitionCurveEntities();
    if (!entities.length) return;

    this._applyingCurvature = true;

    try {
      await Promise.all(
        entities.map(entityId =>
          this.hass!.callService('number', 'set_value', {
            entity_id: entityId,
            value: this._localCurvature,
          })
        )
      );
    } catch (err) {
      console.error('Failed to set transition curve curvature:', err);
    } finally {
      this._applyingCurvature = false;
    }
  }

  private _loadCurvatureFromEntity(): void {
    const entityId = this._findTransitionCurveEntity();
    if (!this.hass || !entityId) return;

    const entity = this.hass.states[entityId];
    if (!entity) return;

    const curvature = parseFloat(entity.state);
    if (!isNaN(curvature) && curvature >= 0.2 && curvature <= 6.0) {
      this._localCurvature = Math.round(curvature * 100) / 100;
    }
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'aqara-advanced-lighting-panel': AqaraPanel;
  }
}
