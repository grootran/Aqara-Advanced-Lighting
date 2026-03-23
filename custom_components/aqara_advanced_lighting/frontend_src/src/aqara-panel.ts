import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef, Ref } from 'lit/directives/ref.js';
import { panelStyles } from './styles';
import { xyToRgb, rgbToXy, hsToRgb } from './color-utils';
import { localize } from './editor-constants';
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
  PresetType,
  AnyPreset,
  Translations,
  RunningOperation,
  RunningOperationsResponse,
  EntityAudioConfig,
} from './types';
import './effect-editor';
import './pattern-editor';
import './cct-sequence-editor';
import './segment-sequence-editor';
import './dynamic-scene-editor';
import './transition-curve-editor';
import './color-history-swatches';

// HA tile card custom element interface (created via document.createElement)
type HaTileCard = HTMLElement & {
  setConfig: (config: Record<string, unknown>) => void;
  hass: HomeAssistant;
};

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
  @state() private _useStaticSceneMode = false;
  @state() private _ignoreExternalChanges = false;
  @state() private _overrideControlMode: string = 'pause_changed';
  @state() private _bareTurnOnOnly = false;
  @state() private _detectNonHaChanges = false;
  @state() private _softwareTransitionEntities: string[] = [];
  @state() private _entityAudioConfig: Record<string, EntityAudioConfig> = {};
  @state() private _audioConfigSelectedEntity = '';
  @state() private _useDistributionModeOverride = false;
  @state() private _distributionModeOverride = 'shuffle_rotate';
  @state() private _useAudioReactive = false;
  @state() private _audioOverrideEntity = '';
  @state() private _audioOverrideSensitivity = 50;
  @state() private _audioOverrideColorAdvance: 'on_onset' | 'continuous' | 'beat_predictive' | 'intensity_breathing' | 'onset_flash' = 'on_onset';
  @state() private _audioOverrideTransitionSpeed = 50;
  @state() private _audioOverrideBrightnessResponse = true;
  @state() private _audioOverrideDetectionMode: 'spectral_flux' | 'bass_energy' | 'complex_domain' = 'spectral_flux';
  @state() private _audioOverrideFrequencyZone = false;
  @state() private _audioOverrideSilenceDegradation = true;
  @state() private _audioOverridePredictionAggressiveness = 50;
  @state() private _audioOverrideLatencyCompensationMs = 150;
  @state() private _audioOverrideColorByFrequency = false;
  @state() private _audioOverrideRolloffBrightness = false;
  @state() private _collapsed: Record<string, boolean> = { instances: true };
  @state() private _hasIncompatibleLights = false;
  @state() private _includeAllLights = false;
  @state() private _favorites: Favorite[] = [];
  @state() private _activeFavoriteId: string | null = null;
  @state() private _renamingFavoriteId: string | null = null;
  @state() private _renamingFavoriteName = '';
  @state() private _favoriteEditModeId: string | null = null;
  @state() private _presetEditModeId: string | null = null;
  private _longPressTimer: ReturnType<typeof setTimeout> | null = null;
  @state() private _activeTab: PanelTab = 'activate';
  @state() private _userPresets?: UserPresetsData;
  @state() private _editingPreset?: { type: string; preset: UserEffectPreset | UserSegmentPatternPreset | UserCCTSequencePreset | UserSegmentSequencePreset | UserDynamicScenePreset; isDuplicate?: boolean };
  @state() private _effectPreviewActive = false;
  @state() private _patternPreviewActive = false;
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
    backend_type: string;
    z2m_base_topic: string | null;
    device_counts: { t2_rgb: number; t2_cct: number; t1m: number; t1_strip: number; other: number; total: number };
    devices: string[];
  }> = [];
  @state() private _instanceDevicesExpanded: Set<string> = new Set();
  @state() private _localCurvature = 1.0;
  @state() private _applyingCurvature = false;
  @state() private _curvatureApplied = false;
  @state() private _isExporting = false;
  @state() private _isImporting = false;
  @state() private _isSelectMode = false;
  @state() private _selectedPresetIds: Set<string> = new Set();
  @state() private _favoritePresets: FavoritePresetRef[] = [];
  @state() private _runningOperations: RunningOperation[] = [];
  @state() private _musicSyncEnabled = false;
  @state() private _musicSyncSensitivity = 'low';
  @state() private _musicSyncEffect = 'random';
  @state() private _setupComplete = true;
  private _setupPollTimer?: ReturnType<typeof setTimeout>;
  private _translations: Translations = PANEL_TRANSLATIONS;
  private _fileInputRef: HTMLInputElement | null = null;
  private _eventUnsubscribers: Array<() => void> = [];
  private _runningOpsDebounceTimer?: ReturnType<typeof setTimeout>;
  private _runningOpsFetchId = 0;

  private _tileCardRef: Ref<HTMLElement> = createRef();
  private _tileCards: Map<string, HaTileCard> = new Map();
  private _preferencesSaveTimer?: ReturnType<typeof setTimeout>;
  private _editorDraftCache: EditorDraftCache = {};

  static styles = panelStyles;

  /**
   * Helper method to localize panel strings
   */
  private _localize(key: string, values?: Record<string, string>): string {
    return localize(this._translations, key, values);
  }

  protected firstUpdated(): void {
    this._loadPresets();
    this._loadFavorites();
    this._loadUserPresets();
    this._loadUserPreferences();
    this._loadBackendVersion().then(() => {
      // Only load entities after version check — if setup isn't complete yet,
      // _checkSetupStatus polling will call _loadSupportedEntities when ready.
      if (this._setupComplete) {
        this._loadSupportedEntities();
      }
    });
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
    if (this._runningOpsDebounceTimer !== undefined) {
      clearTimeout(this._runningOpsDebounceTimer);
      this._runningOpsDebounceTimer = undefined;
    }
    if (this._sensitivityDebounceTimer) {
      clearTimeout(this._sensitivityDebounceTimer);
      this._sensitivityDebounceTimer = null;
    }
    if (this._squelchDebounceTimer) {
      clearTimeout(this._squelchDebounceTimer);
      this._squelchDebounceTimer = null;
    }
    this._stopSetupPolling();
    this._tileCards.clear();
    // Unsubscribe from HA events
    for (const unsub of this._eventUnsubscribers) {
      unsub();
    }
    this._eventUnsubscribers = [];
  }

  protected willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps);

    // Clean up stale favorite preset references when the data they resolve against changes.
    // This was previously done inside _getResolvedFavoritePresets() during render, which
    // caused side effects (state mutation + API write) in the render path.
    if (
      changedProps.has('_favoritePresets') ||
      changedProps.has('_presets') ||
      changedProps.has('_userPresets')
    ) {
      this._cleanStaleFavoriteRefs();
      this._rebuildPresetLookup();
    }
  }

  private _presetLookup = new Map<string, { name: string; icon: string | null }>();

  private _rebuildPresetLookup(): void {
    const map = new Map<string, { name: string; icon: string | null }>();
    const add = (id: string, name: string, icon?: string) => {
      map.set(id, { name, icon: icon || null });
    };
    if (this._presets?.dynamic_effects) {
      for (const presets of Object.values(this._presets.dynamic_effects)) {
        for (const p of presets) add(p.id, p.name, p.icon);
      }
    }
    for (const p of this._presets?.segment_patterns || []) add(p.id, p.name, p.icon);
    for (const p of this._presets?.cct_sequences || []) add(p.id, p.name, p.icon);
    for (const p of this._presets?.segment_sequences || []) add(p.id, p.name, p.icon);
    for (const p of this._presets?.dynamic_scenes || []) add(p.id, p.name, p.icon);
    if (this._userPresets) {
      for (const list of [
        this._userPresets.effect_presets, this._userPresets.segment_pattern_presets,
        this._userPresets.cct_sequence_presets, this._userPresets.segment_sequence_presets,
        this._userPresets.dynamic_scene_presets,
      ]) {
        for (const p of list || []) { add(p.id, p.name, p.icon); add(p.name, p.name, p.icon); }
      }
    }
    this._presetLookup = map;
  }

  /**
   * Remove favorite refs that point to deleted presets.
   * Called from willUpdate, not during render.
   */
  private _cleanStaleFavoriteRefs(): void {
    if (this._favoritePresets.length === 0) return;

    const valid = this._favoritePresets.filter(ref => {
      switch (ref.type) {
        case 'effect': {
          for (const key of ['t2_bulb', 't1m', 't1_strip'] as const) {
            if (this._presets?.dynamic_effects?.[key]?.some(p => p.id === ref.id)) return true;
          }
          return this._userPresets?.effect_presets?.some(p => p.id === ref.id) ?? false;
        }
        case 'segment_pattern':
          return (this._presets?.segment_patterns?.some(p => p.id === ref.id) ?? false) ||
                 (this._userPresets?.segment_pattern_presets?.some(p => p.id === ref.id) ?? false);
        case 'cct_sequence':
          return (this._presets?.cct_sequences?.some(p => p.id === ref.id) ?? false) ||
                 (this._userPresets?.cct_sequence_presets?.some(p => p.id === ref.id) ?? false);
        case 'segment_sequence':
          return (this._presets?.segment_sequences?.some(p => p.id === ref.id) ?? false) ||
                 (this._userPresets?.segment_sequence_presets?.some(p => p.id === ref.id) ?? false);
        case 'dynamic_scene':
          return (this._presets?.dynamic_scenes?.some(p => p.id === ref.id) ?? false) ||
                 (this._userPresets?.dynamic_scene_presets?.some(p => p.id === ref.id) ?? false);
        default:
          return false;
      }
    });

    if (valid.length !== this._favoritePresets.length) {
      this._favoritePresets = valid;
      this._saveUserPreferences();
    }
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    if (changedProps.has('hass') && changedProps.get('hass') === undefined) {
      // Initial hass load
      this._loadPresets();
      this._loadFavorites();
      this._loadUserPresets();
      this._loadUserPreferences();
      this._loadSupportedEntities();
    }

    // Update tile card only when relevant properties change
    if (changedProps.has('hass') || changedProps.has('_selectedEntities') || changedProps.has('_activeTab')) {
      this._updateTileCard();
    }
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
        card = document.createElement('hui-tile-card') as HaTileCard;
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

  /** Apply a full UserPreferences object to component state. */
  private _applyUserPreferences(prefs: UserPreferences): void {
    this._colorHistory = prefs.color_history;
    this._sortPreferences = prefs.sort_preferences;
    this._favoritePresets = prefs.favorite_presets || [];
    if (prefs.collapsed_sections) {
      this._collapsed = prefs.collapsed_sections;
    }
    if (prefs.include_all_lights !== undefined) {
      this._includeAllLights = prefs.include_all_lights;
    }
    if (prefs.static_scene_mode !== undefined) {
      this._useStaticSceneMode = prefs.static_scene_mode;
    }
    if (prefs.distribution_mode_override) {
      this._useDistributionModeOverride = true;
      this._distributionModeOverride = prefs.distribution_mode_override;
    }
    if (prefs.brightness_override != null) {
      this._useCustomBrightness = true;
      this._brightness = prefs.brightness_override;
    }
    if (prefs.use_audio_reactive !== undefined) this._useAudioReactive = prefs.use_audio_reactive;
    if (prefs.audio_override_entity) this._audioOverrideEntity = prefs.audio_override_entity;
    if (prefs.audio_override_sensitivity !== undefined) this._audioOverrideSensitivity = prefs.audio_override_sensitivity;
    if (prefs.audio_override_color_advance !== undefined) this._audioOverrideColorAdvance = prefs.audio_override_color_advance;
    if (prefs.audio_override_transition_speed !== undefined) this._audioOverrideTransitionSpeed = prefs.audio_override_transition_speed;
    if (prefs.audio_override_brightness_response !== undefined) this._audioOverrideBrightnessResponse = prefs.audio_override_brightness_response;
    if (prefs.audio_override_detection_mode !== undefined) this._audioOverrideDetectionMode = prefs.audio_override_detection_mode;
    if (prefs.audio_override_frequency_zone !== undefined) this._audioOverrideFrequencyZone = prefs.audio_override_frequency_zone;
    if (prefs.audio_override_silence_degradation !== undefined) this._audioOverrideSilenceDegradation = prefs.audio_override_silence_degradation;
    if (prefs.audio_override_prediction_aggressiveness !== undefined) this._audioOverridePredictionAggressiveness = prefs.audio_override_prediction_aggressiveness;
    if (prefs.audio_override_latency_compensation_ms !== undefined) this._audioOverrideLatencyCompensationMs = prefs.audio_override_latency_compensation_ms;
    if (prefs.audio_override_color_by_frequency !== undefined) this._audioOverrideColorByFrequency = prefs.audio_override_color_by_frequency;
    if (prefs.audio_override_rolloff_brightness !== undefined) this._audioOverrideRolloffBrightness = prefs.audio_override_rolloff_brightness;
    if (prefs.selected_entities && prefs.selected_entities.length > 0) {
      this._selectedEntities = prefs.selected_entities;
      this._activeFavoriteId = prefs.active_favorite_id ?? null;
      // Side effects (_loadCurvatureFromEntity, _loadZonesForSelectedDevices) are
      // triggered by _loadSupportedEntities after it populates the entity map,
      // since it races with this method and may not have resolved yet.
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
          // Apply ALL preferences from the server response (not just the migrated fields),
          // so audio overrides and other settings are restored alongside color/sort history.
          this._applyUserPreferences(updated);
          // Clean up localStorage after successful migration
          localStorage.removeItem('aqara_lighting_color_history');
          localStorage.removeItem('aqara_lighting_sort_preferences');
          return;
        }
      }

      this._applyUserPreferences(prefs);
    } catch (err) {
      console.warn('Failed to load user preferences:', err);
      // Fall back to localStorage as read-only source if server unavailable
      this._loadSortPreferencesFromLocalStorage();
    }

    // Load global preferences (separate endpoint, not per-user)
    try {
      const globalPrefs = await this.hass.callApi<{ignore_external_changes?: boolean; software_transition_entities?: string[]; override_control_mode?: string; bare_turn_on_only?: boolean; detect_non_ha_changes?: boolean; entity_audio_config?: Record<string, EntityAudioConfig>}>(
        'GET', 'aqara_advanced_lighting/global_preferences'
      );
      if (globalPrefs.ignore_external_changes !== undefined) {
        this._ignoreExternalChanges = globalPrefs.ignore_external_changes;
      }
      if (globalPrefs.override_control_mode) {
        this._overrideControlMode = globalPrefs.override_control_mode;
      }
      if (globalPrefs.software_transition_entities) {
        this._softwareTransitionEntities = globalPrefs.software_transition_entities;
      }
      if (globalPrefs.bare_turn_on_only !== undefined) {
        this._bareTurnOnOnly = globalPrefs.bare_turn_on_only;
      }
      if (globalPrefs.detect_non_ha_changes !== undefined) {
        this._detectNonHaChanges = globalPrefs.detect_non_ha_changes;
      }
      if (globalPrefs.entity_audio_config) {
        this._entityAudioConfig = globalPrefs.entity_audio_config;
      }
    } catch (err) {
      console.warn('Failed to load global preferences:', err);
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
          static_scene_mode: this._useStaticSceneMode,
          distribution_mode_override: this._useDistributionModeOverride ? this._distributionModeOverride : null,
          brightness_override: this._useCustomBrightness ? this._brightness : null,
          use_audio_reactive: this._useAudioReactive,
          audio_override_entity: this._audioOverrideEntity,
          audio_override_sensitivity: this._audioOverrideSensitivity,
          audio_override_color_advance: this._audioOverrideColorAdvance,
          audio_override_transition_speed: this._audioOverrideTransitionSpeed,
          audio_override_brightness_response: this._audioOverrideBrightnessResponse,
          audio_override_detection_mode: this._audioOverrideDetectionMode,
          audio_override_frequency_zone: this._audioOverrideFrequencyZone,
          audio_override_silence_degradation: this._audioOverrideSilenceDegradation,
          audio_override_prediction_aggressiveness: this._audioOverridePredictionAggressiveness,
          audio_override_latency_compensation_ms: this._audioOverrideLatencyCompensationMs,
          audio_override_color_by_frequency: this._audioOverrideColorByFrequency,
          audio_override_rolloff_brightness: this._audioOverrideRolloffBrightness,
          selected_entities: this._selectedEntities,
          active_favorite_id: this._activeFavoriteId,
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
  private _isPresetFavorited(type: PresetType, id: string): boolean {
    return this._favoritePresets.some(fav => fav.type === type && fav.id === id);
  }

  /** Toggle favorite status for a preset. Stops propagation to prevent activation. */
  private _toggleFavoritePreset(type: PresetType, id: string, event: Event): void {
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
  private _renderFavoriteStar(type: PresetType, id: string) {
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
   * Tracks source device type for device-specific presets (effects, patterns, sequences).
   * Filters out references to deleted presets and cleans up stale entries.
   */
  private _getResolvedFavoritePresets(): Array<{
    ref: FavoritePresetRef;
    preset: AnyPreset;
    isUser: boolean;
    deviceType?: string;
  }> {
    const resolved: Array<{ ref: FavoritePresetRef; preset: AnyPreset; isUser: boolean; deviceType?: string }> = [];

    for (const ref of this._favoritePresets) {
      let preset: AnyPreset | null = null;
      let isUser = false;
      let deviceType: string | undefined;

      switch (ref.type) {
        case 'effect': {
          for (const key of ['t2_bulb', 't1m', 't1_strip'] as const) {
            const found = this._presets?.dynamic_effects?.[key]?.find(p => p.id === ref.id);
            if (found) { preset = found; deviceType = key; break; }
          }
          if (!preset) {
            const userPreset = this._userPresets?.effect_presets?.find(p => p.id === ref.id);
            if (userPreset) { preset = userPreset; isUser = true; deviceType = userPreset.device_type; }
          }
          break;
        }
        case 'segment_pattern': {
          preset = this._presets?.segment_patterns?.find(p => p.id === ref.id) || null;
          if (!preset) {
            const userPreset = this._userPresets?.segment_pattern_presets?.find(p => p.id === ref.id);
            if (userPreset) { preset = userPreset; isUser = true; deviceType = userPreset.device_type; }
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
            const userPreset = this._userPresets?.segment_sequence_presets?.find(p => p.id === ref.id);
            if (userPreset) { preset = userPreset; isUser = true; deviceType = userPreset.device_type; }
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
        resolved.push({ ref, preset, isUser, deviceType });
      }
    }

    // Stale reference cleanup is handled by _cleanStaleFavoriteRefs() in willUpdate()

    return resolved;
  }

  /** Activate a favorite preset by dispatching to the appropriate activation method. */
  private async _activateFavoritePreset(ref: FavoritePresetRef, preset: AnyPreset, isUser: boolean): Promise<void> {
    switch (ref.type) {
      case 'effect':
        if (isUser) {
          await this._activateUserEffectPreset(preset as UserEffectPreset);
        } else {
          await this._activateDynamicEffect(preset as DynamicEffectPreset);
        }
        break;
      case 'segment_pattern':
        if (isUser) {
          await this._activateUserPatternPreset(preset as UserSegmentPatternPreset);
        } else {
          await this._activateSegmentPattern(preset as SegmentPatternPreset);
        }
        break;
      case 'cct_sequence':
        if (isUser) {
          await this._activateUserCCTSequencePreset(preset as UserCCTSequencePreset);
        } else {
          await this._activateCCTSequence(preset as CCTSequencePreset);
        }
        break;
      case 'segment_sequence':
        if (isUser) {
          await this._activateUserSegmentSequencePreset(preset as UserSegmentSequencePreset);
        } else {
          await this._activateSegmentSequence(preset as SegmentSequencePreset);
        }
        break;
      case 'dynamic_scene':
        if (isUser) {
          await this._activateUserDynamicScenePreset(preset as UserDynamicScenePreset);
        } else {
          await this._activateDynamicScene(preset as DynamicScenePreset);
        }
        break;
    }
  }

  /** Render the icon/thumbnail for a favorite preset based on its type. */
  private _renderFavoritePresetIcon(ref: FavoritePresetRef, preset: AnyPreset, isUser: boolean) {
    switch (ref.type) {
      case 'effect':
        return isUser ? this._renderUserEffectIcon(preset as UserEffectPreset) : this._renderPresetIcon(preset.icon, 'mdi:lightbulb-on');
      case 'segment_pattern':
        return isUser ? this._renderUserPatternIcon(preset as UserSegmentPatternPreset) : this._renderPresetIcon(preset.icon, 'mdi:palette');
      case 'cct_sequence':
        return isUser ? this._renderUserCCTIcon(preset as UserCCTSequencePreset) : this._renderPresetIcon(preset.icon, 'mdi:temperature-kelvin');
      case 'segment_sequence':
        return isUser ? this._renderUserSegmentSequenceIcon(preset as UserSegmentSequencePreset) : this._renderPresetIcon(preset.icon, 'mdi:animation-play');
      case 'dynamic_scene':
        return isUser ? this._renderUserDynamicSceneIcon(preset as UserDynamicScenePreset) : this._renderBuiltinDynamicSceneIcon(preset as DynamicScenePreset);
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
      this._setupComplete = data.setup_complete ?? true;

      if (!this._setupComplete && !this._setupPollTimer) {
        this._startSetupPolling();
      }
    } catch (err) {
      console.warn('Failed to load backend version:', err);
    }
  }

  private _startSetupPolling(): void {
    this._setupPollTimer = setInterval(() => this._checkSetupStatus(), 2500);
  }

  private async _checkSetupStatus(): Promise<void> {
    try {
      const response = await fetch('/api/aqara_advanced_lighting/version');
      if (!response.ok) return;
      const data = await response.json();
      this._setupComplete = data.setup_complete ?? true;

      if (this._setupComplete) {
        this._stopSetupPolling();
        this._loadSupportedEntities();
      }
    } catch (err) {
      // Keep polling on transient errors
    }
  }

  private _stopSetupPolling(): void {
    if (this._setupPollTimer) {
      clearInterval(this._setupPollTimer);
      this._setupPollTimer = undefined;
    }
  }

  private async _loadSupportedEntities(): Promise<void> {
    if (!this.hass) return;
    try {
      const data = await this.hass.callApi<{ entities?: any[]; light_groups?: any[]; instances?: any[] }>('GET', 'aqara_advanced_lighting/supported_entities');
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

      // Re-run side effects if entities were already restored from preferences
      // (preferences load races with supported entities load)
      if (this._selectedEntities.length > 0) {
        this._loadCurvatureFromEntity();
        this._loadZonesForSelectedDevices();
      }

      // Store instances data
      this._z2mInstances = data.instances || [];
    } catch (err) {
      console.warn('Failed to load supported entities:', err);
    }
  }

  private _scheduleLoadRunningOperations(): void {
    if (this._runningOpsDebounceTimer !== undefined) {
      clearTimeout(this._runningOpsDebounceTimer);
    }
    this._runningOpsDebounceTimer = setTimeout(() => {
      this._runningOpsDebounceTimer = undefined;
      this._loadRunningOperations();
    }, 100);
  }

  private async _loadRunningOperations(): Promise<void> {
    if (!this.hass) return;
    const fetchId = ++this._runningOpsFetchId;
    try {
      const data = await this.hass.callApi<RunningOperationsResponse>('GET', 'aqara_advanced_lighting/running_operations');
      // Discard stale responses from earlier fetches
      if (fetchId !== this._runningOpsFetchId) return;
      this._runningOperations = data.operations || [];

      // Sync music sync state from running operations
      this._syncMusicSyncState();
    } catch (err) {
      console.warn('Failed to load running operations:', err);
    }
  }

  private _syncMusicSyncState(): void {
    const activeMusicSync = this._runningOperations.find(
      op => op.type === 'music_sync' && op.entity_id && this._selectedEntities.includes(op.entity_id)
    );

    if (activeMusicSync) {
      this._musicSyncEnabled = true;
      if (activeMusicSync.sensitivity) this._musicSyncSensitivity = activeMusicSync.sensitivity;
      if (activeMusicSync.audio_effect) this._musicSyncEffect = activeMusicSync.audio_effect;
    } else {
      this._musicSyncEnabled = false;
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
          () => { this._scheduleLoadRunningOperations(); },
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
    if (!this.hass) return;
    try {
      const data = await this.hass.callApi<{ zones?: Record<string, string> }>('GET', `aqara_advanced_lighting/segment_zones/${encodeURIComponent(ieeeAddress)}`);
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
      await this.hass!.callApi('PUT', `aqara_advanced_lighting/segment_zones/${encodeURIComponent(ieeeAddress)}`, { zones: zonesPayload });
      await this._loadZonesForDevice(ieeeAddress);
      this._showToast(this._localize('config.zone_saved'));
    } catch (err: any) {
      this._showToast(err?.body?.message || this._localize('config.zone_save_error'));
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
          await this.hass!.callApi('DELETE', `aqara_advanced_lighting/segment_zones/${encodeURIComponent(ieeeAddress)}/${encodeURIComponent(zone.name.trim())}`);
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

  // Sorting utility function (generic for all preset types)
  private _sortPresets<T extends { name: string; created_at?: string }>(presets: T[], sortOption: PresetSortOption): T[] {
    const sorted = [...presets];
    switch (sortOption) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'date-new':
        if (sorted.length > 0 && sorted[0]?.created_at) {
          return sorted.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
        }
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'date-old':
        if (sorted.length > 0 && sorted[0]?.created_at) {
          return sorted.sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime());
        }
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
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
      if (this._isSelectMode) {
        this._exitSelectMode();
      }
    }
    this._activeTab = tab;
  }

  private _handleTabChange(ev: CustomEvent<{ name: string }>): void {
    const newTab = ev.detail.name as PanelTab;
    if (newTab) {
      this._setActiveTab(newTab);
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

  private async _addFavorite(): Promise<void> {
    if (!this._selectedEntities.length || !this.hass) return;

    const firstEntity = this._selectedEntities[0];
    const autoName = this._selectedEntities.length === 1 && firstEntity
      ? this._getEntityFriendlyName(firstEntity)
      : this._localize('target.lights_count', { count: this._selectedEntities.length.toString() });

    try {
      const data = await this.hass.callApi<{ favorite: Favorite }>('POST', 'aqara_advanced_lighting/favorites', {
        entities: this._selectedEntities,
        name: autoName,
      });
      this._favorites = [...this._favorites, data.favorite];
    } catch (err) {
      console.error('Failed to add favorite:', err);
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

  private _startRenameFavorite(e: Event, favorite: Favorite): void {
    e.stopPropagation();
    this._favoriteEditModeId = null;
    this._renamingFavoriteId = favorite.id;
    this._renamingFavoriteName = favorite.name;
    this.updateComplete.then(() => {
      const input = this.shadowRoot?.querySelector('.favorite-rename-input') as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.select();
      }
    });
  }

  private _handleRenameInput(e: InputEvent): void {
    this._renamingFavoriteName = (e.target as HTMLInputElement).value;
  }

  private _handleRenameKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._saveRenameFavorite();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this._cancelRenameFavorite();
    }
  }

  private async _saveRenameFavorite(): Promise<void> {
    if (!this.hass || !this._renamingFavoriteId || !this._renamingFavoriteName.trim()) {
      this._cancelRenameFavorite();
      return;
    }

    try {
      const data = await this.hass.callApi<{ favorite: Favorite }>(
        'PUT',
        `aqara_advanced_lighting/favorites/${this._renamingFavoriteId}`,
        { name: this._renamingFavoriteName.trim() },
      );
      this._favorites = this._favorites.map((f) =>
        f.id === this._renamingFavoriteId ? data.favorite : f,
      );
    } catch (err) {
      console.error('Failed to rename favorite:', err);
    }

    this._cancelRenameFavorite();
  }

  private _handleRenameBlur(): void {
    // Delay save so that tapping a button (e.g. cancel) can fire before blur commits
    setTimeout(() => {
      if (this._renamingFavoriteId) {
        this._saveRenameFavorite();
      }
    }, 150);
  }

  private _cancelRenameFavorite(): void {
    this._renamingFavoriteId = null;
    this._renamingFavoriteName = '';
  }

  private _handleFavoriteTouchStart(favorite: Favorite): void {
    this._longPressTimer = setTimeout(() => {
      this._longPressTimer = null;
      this._favoriteEditModeId = favorite.id;
    }, 500);
  }

  private _handleFavoriteTouchEnd(e: TouchEvent): void {
    if (this._longPressTimer) {
      // Short tap -- timer didn't fire, treat as normal click
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    } else {
      // Long press fired -- prevent the click from also selecting
      e.preventDefault();
    }
  }

  private _handleFavoriteTouchMove(): void {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }
  }

  private _clearFavoriteEditMode(): void {
    this._favoriteEditModeId = null;
  }

  private _handlePresetTouchStart(presetId: string): void {
    this._longPressTimer = setTimeout(() => {
      this._longPressTimer = null;
      this._presetEditModeId = presetId;
    }, 500);
  }

  private _handlePresetTouchEnd(e: TouchEvent): void {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    } else {
      // Long press fired -- prevent click from also activating preset
      e.preventDefault();
    }
  }

  private _handlePresetTouchMove(): void {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }
  }

  private _selectFavorite(favorite: Favorite): void {
    this._selectedEntities = [...favorite.entities];
    this._activeFavoriteId = favorite.id;
    this._favoriteEditModeId = null;
    // Load curvature from first T2 entity when favorite is selected
    this._loadCurvatureFromEntity();
    // Load zones for selected segment-capable devices
    this._loadZonesForSelectedDevices();
    // Persist selection
    this._saveUserPreferences();
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

    // Try to get HS color and convert to RGB
    if (state.attributes.hs_color && Array.isArray(state.attributes.hs_color)) {
      const hsColor = state.attributes.hs_color as number[];
      if (hsColor.length >= 2 && typeof hsColor[0] === 'number' && typeof hsColor[1] === 'number') {
        const rgb = hsToRgb(hsColor[0], hsColor[1]);
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
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
      const dt = this._getEntityDeviceType(entityId);
      if (dt) {
        deviceTypes.add(dt);
      } else {
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
      if (this._getEntityDeviceType(entityId) !== 't1_strip') continue;

      const entity = this.hass.states[entityId];
      if (!entity) continue;

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

  /**
   * Resolve the device type for a single entity.
   *
   * Uses the backend supported-entities API (authoritative), then the
   * "include all lights" generic classification, then a legacy
   * effect_list fallback for Z2M entities.
   */
  private _getEntityDeviceType(entityId: string): string | null {
    const entity = this.hass?.states[entityId];
    if (!entity) return null;

    // Backend supported entities map is authoritative
    const supportedEntity = this._supportedEntities.get(entityId);
    if (supportedEntity) {
      if (supportedEntity.device_type === 't1m') {
        // Distinguish T1M RGB from T1M White using supported_color_modes
        return this._hasRGBColorMode(entity) ? 't1m' : 't1m_white';
      }
      if (supportedEntity.device_type && supportedEntity.device_type !== 'unknown') {
        return supportedEntity.device_type;
      }
    }

    // Generic light classification when "include all lights" is on
    if (this._includeAllLights) {
      if (this._hasRGBColorMode(entity)) return 'generic_rgb';
      const colorModes = entity.attributes.supported_color_modes as string[] | undefined;
      if (colorModes?.includes('color_temp')) return 'generic_cct';
    }

    // Legacy fallback: detect from effect_list (Z2M only, ZHA lacks this)
    const effectList = entity.attributes.effect_list as string[] | undefined;
    if (effectList && Array.isArray(effectList)) {
      if (effectList.includes('flow1') || effectList.includes('flow2') || effectList.includes('rolling')) return 't1m';
      if (effectList.includes('rainbow1') || effectList.includes('rainbow2') || effectList.includes('chasing') || effectList.includes('flicker') || effectList.includes('dash')) return 't1_strip';
      if (effectList.includes('candlelight')) return 't2_bulb';
    } else if (!effectList && entity.attributes.color_temp_kelvin !== undefined) {
      return 't2_cct';
    }

    return null;
  }

  private _isEffectsCompatible(): boolean { return this._getEffectsCompatibleEntities().length > 0; }
  private _isPatternsCompatible(): boolean { return this._getPatternsCompatibleEntities().length > 0; }
  private _isCCTCompatible(): boolean { return this._getCCTCompatibleEntities().length > 0; }
  private _isSegmentsCompatible(): boolean { return this._getSegmentsCompatibleEntities().length > 0; }

  // Filter methods - return only compatible entities from selection
  // These are used to send commands only to compatible devices when multiple device types are selected

  private _getEffectsCompatibleEntities(): string[] {
    if (!this.hass) return [];
    return this._selectedEntities.filter(entityId => {
      if (!this._supportedEntities.has(entityId)) return false;
      const dt = this._getEntityDeviceType(entityId);
      return dt === 't2_bulb' || dt === 't1m' || dt === 't1_strip';
    });
  }

  private _getPatternsCompatibleEntities(): string[] {
    if (!this.hass) return [];
    return this._selectedEntities.filter(entityId => {
      if (!this._supportedEntities.has(entityId)) return false;
      const dt = this._getEntityDeviceType(entityId);
      return dt === 't1m' || dt === 't1_strip';
    });
  }

  private _getCCTCompatibleEntities(): string[] {
    if (!this.hass) return [];
    return this._selectedEntities.filter(entityId => {
      const entity = this.hass!.states[entityId];
      if (!entity) return false;
      const hasCCT = entity.attributes.color_temp_kelvin !== undefined ||
             entity.attributes.min_color_temp_kelvin !== undefined;
      if (!hasCCT) return false;
      // T1M RGB endpoint has color_temp but doesn't support CCT sequences
      const dt = this._getEntityDeviceType(entityId);
      if (dt === 't1m') return false;
      return true;
    });
  }

  private _getSegmentsCompatibleEntities(): string[] {
    if (!this.hass) return [];
    return this._selectedEntities.filter(entityId => {
      if (!this._supportedEntities.has(entityId)) return false;
      const dt = this._getEntityDeviceType(entityId);
      return dt === 't1m' || dt === 't1_strip';
    });
  }

  // T2 devices only (for transition curve and initial brightness settings)
  private _getT2CompatibleEntities(): string[] {
    if (!this.hass) return [];
    return this._selectedEntities.filter(entityId => {
      const dt = this._getEntityDeviceType(entityId);
      return dt === 't2_bulb' || dt === 't2_cct';
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
    // Dynamic scenes: Any light with color capability (RGB or CCT - backend adapts colors)
    const showDynamicScenes = hasSelection && (hasT2 || hasT2CCT || hasT1M || hasT1MWhite || hasT1Strip || hasGenericRGB || hasGenericCCT);
    // Music sync: T1 Strip only
    const showMusicSync = hasSelection && hasT1Strip;

    return {
      showDynamicEffects,
      showSegmentPatterns,
      showCCTSequences,
      showSegmentSequences,
      showDynamicScenes,
      showMusicSync,
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
      this._saveUserPreferences();
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

    // Clear editor drafts so device type auto-set reflects the new selection
    // (drafts set _hasUserInteraction=true which blocks auto-set)
    this._clearEditorDraft();

    // Load curvature from first T2 entity when selection changes
    this._loadCurvatureFromEntity();

    // Load zones for selected segment-capable devices
    this._loadZonesForSelectedDevices();

    // Persist selection
    this._saveUserPreferences();
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
    this._saveUserPreferences();
  }

  private _handleCustomBrightnessToggle(e: Event): void {
    this._useCustomBrightness = (e.target as HTMLInputElement).checked;
    this._saveUserPreferences();
  }

  private _handleStaticSceneModeToggle(e: Event): void {
    this._useStaticSceneMode = (e.target as HTMLInputElement).checked;
    this._saveUserPreferences();
  }

  private _handleIgnoreExternalChangesToggle(e: Event): void {
    this._ignoreExternalChanges = (e.target as HTMLInputElement).checked;
    this._saveGlobalPreferences();
  }

  private _handleOverrideControlModeChanged(e: CustomEvent): void {
    this._overrideControlMode = e.detail.value;
    this._saveGlobalPreferences();
  }

  private _handleBareTurnOnOnlyToggle(e: Event): void {
    this._bareTurnOnOnly = (e.target as HTMLInputElement).checked;
    this._saveGlobalPreferences();
  }

  private _handleDetectNonHaChangesToggle(e: Event): void {
    this._detectNonHaChanges = (e.target as HTMLInputElement).checked;
    this._saveGlobalPreferences();
  }

  private _handleDistributionModeOverrideToggle(e: Event): void {
    this._useDistributionModeOverride = (e.target as HTMLInputElement).checked;
    this._saveUserPreferences();
  }

  private _handleDistributionModeOverrideChange(e: CustomEvent): void {
    this._distributionModeOverride = e.detail.value || 'shuffle_rotate';
    this._saveUserPreferences();
  }

  private _handleAudioReactiveToggle(e: Event): void {
    this._useAudioReactive = (e.target as HTMLInputElement).checked;
    if (this._useAudioReactive) {
      // Audio-reactive conflicts with brightness, static mode, and distribution overrides
      this._useCustomBrightness = false;
      this._useStaticSceneMode = false;
      this._useDistributionModeOverride = false;
    }
    this._saveUserPreferences();
  }

  private _handleAudioOverrideEntityChange(e: CustomEvent): void {
    this._audioOverrideEntity = e.detail.value || '';
    this._saveUserPreferences();
  }

  private _handleAudioOverrideSensitivityChange(e: CustomEvent): void {
    this._audioOverrideSensitivity = e.detail.value ?? 50;
    this._saveUserPreferences();
  }

  private _handleAudioOverrideColorAdvanceChange(e: CustomEvent): void {
    this._audioOverrideColorAdvance = e.detail.value || 'on_onset';
    this._saveUserPreferences();
  }

  private _handleAudioOverrideDetectionModeChange(e: CustomEvent): void {
    this._audioOverrideDetectionMode = e.detail.value || 'spectral_flux';
    this._saveUserPreferences();
  }

  private _handleAudioOverrideFrequencyZoneChange(e: CustomEvent): void {
    this._audioOverrideFrequencyZone = e.detail.value ?? false;
    this._saveUserPreferences();
  }

  private _handleAudioOverrideSilenceDegradationChange(e: CustomEvent): void {
    this._audioOverrideSilenceDegradation = e.detail.value ?? true;
    this._saveUserPreferences();
  }

  private _handleAudioOverridePredictionAggressivenessChange(e: CustomEvent): void {
    this._audioOverridePredictionAggressiveness = e.detail.value ?? 50;
    this._saveUserPreferences();
  }

  private _handleAudioOverrideLatencyCompensationChange(e: CustomEvent): void {
    this._audioOverrideLatencyCompensationMs = e.detail.value ?? 150;
    this._saveUserPreferences();
  }

  private _handleAudioOverrideTransitionSpeedChange(e: CustomEvent): void {
    this._audioOverrideTransitionSpeed = e.detail.value ?? 50;
    this._saveUserPreferences();
  }

  private _handleAudioOverrideBrightnessResponseChange(e: CustomEvent): void {
    this._audioOverrideBrightnessResponse = e.detail.value ?? true;
    this._saveUserPreferences();
  }

  private _handleAudioOverrideColorByFrequencyChange(e: CustomEvent): void {
    this._audioOverrideColorByFrequency = e.detail.value ?? false;
    this._saveUserPreferences();
  }

  private _handleAudioOverrideRolloffBrightnessChange(e: CustomEvent): void {
    this._audioOverrideRolloffBrightness = e.detail.value ?? false;
    this._saveUserPreferences();
  }

  // Audio presets (UI-only, same definitions as scene editor)
  private static readonly AUDIO_PRESETS: Record<string, {
    color_advance: string; detection_mode: string; sensitivity: number;
    transition_speed: number; brightness_response: boolean; frequency_zone: boolean;
    color_by_frequency: boolean; rolloff_brightness: boolean; silence_degradation: boolean;
    prediction_aggressiveness: number; latency_compensation_ms: number;
  }> = {
    beat: { color_advance: 'on_onset', detection_mode: 'spectral_flux', sensitivity: 60, transition_speed: 80, brightness_response: true, frequency_zone: false, color_by_frequency: false, rolloff_brightness: false, silence_degradation: true, prediction_aggressiveness: 50, latency_compensation_ms: 150 },
    ambient: { color_advance: 'intensity_breathing', detection_mode: 'spectral_flux', sensitivity: 50, transition_speed: 20, brightness_response: true, frequency_zone: false, color_by_frequency: false, rolloff_brightness: true, silence_degradation: true, prediction_aggressiveness: 50, latency_compensation_ms: 150 },
    concert: { color_advance: 'beat_predictive', detection_mode: 'complex_domain', sensitivity: 50, transition_speed: 50, brightness_response: true, frequency_zone: true, color_by_frequency: true, rolloff_brightness: false, silence_degradation: true, prediction_aggressiveness: 70, latency_compensation_ms: 150 },
    chill: { color_advance: 'continuous', detection_mode: 'spectral_flux', sensitivity: 40, transition_speed: 30, brightness_response: true, frequency_zone: false, color_by_frequency: false, rolloff_brightness: false, silence_degradation: true, prediction_aggressiveness: 50, latency_compensation_ms: 150 },
    club: { color_advance: 'onset_flash', detection_mode: 'bass_energy', sensitivity: 70, transition_speed: 95, brightness_response: true, frequency_zone: false, color_by_frequency: false, rolloff_brightness: false, silence_degradation: false, prediction_aggressiveness: 50, latency_compensation_ms: 150 },
  };

  private get _currentAudioOverridePreset(): string {
    for (const [name, p] of Object.entries(AqaraPanel.AUDIO_PRESETS)) {
      if (this._audioOverrideColorAdvance === p.color_advance &&
          this._audioOverrideDetectionMode === p.detection_mode &&
          this._audioOverrideSensitivity === p.sensitivity &&
          this._audioOverrideTransitionSpeed === p.transition_speed &&
          this._audioOverrideBrightnessResponse === p.brightness_response &&
          this._audioOverrideFrequencyZone === p.frequency_zone &&
          this._audioOverrideColorByFrequency === p.color_by_frequency &&
          this._audioOverrideRolloffBrightness === p.rolloff_brightness &&
          this._audioOverrideSilenceDegradation === p.silence_degradation &&
          this._audioOverridePredictionAggressiveness === p.prediction_aggressiveness &&
          this._audioOverrideLatencyCompensationMs === p.latency_compensation_ms) {
        return name;
      }
    }
    return 'custom';
  }

  private get _audioPresetOptions() {
    return [
      { value: 'beat', label: this._localize('dynamic_scene.audio_preset_beat') || 'Beat' },
      { value: 'ambient', label: this._localize('dynamic_scene.audio_preset_ambient') || 'Ambient' },
      { value: 'concert', label: this._localize('dynamic_scene.audio_preset_concert') || 'Concert' },
      { value: 'chill', label: this._localize('dynamic_scene.audio_preset_chill') || 'Chill' },
      { value: 'club', label: this._localize('dynamic_scene.audio_preset_club') || 'Club' },
      { value: 'custom', label: this._localize('dynamic_scene.audio_preset_custom') || 'Custom' },
    ];
  }

  private _handleAudioOverridePresetChange(e: CustomEvent): void {
    const preset = e.detail.value;
    if (preset === 'custom') return;
    const p = AqaraPanel.AUDIO_PRESETS[preset];
    if (!p) return;
    this._audioOverrideColorAdvance = p.color_advance as any;
    this._audioOverrideDetectionMode = p.detection_mode as any;
    this._audioOverrideSensitivity = p.sensitivity;
    this._audioOverrideTransitionSpeed = p.transition_speed;
    this._audioOverrideBrightnessResponse = p.brightness_response;
    this._audioOverrideFrequencyZone = p.frequency_zone;
    this._audioOverrideColorByFrequency = p.color_by_frequency;
    this._audioOverrideRolloffBrightness = p.rolloff_brightness;
    this._audioOverrideSilenceDegradation = p.silence_degradation;
    this._audioOverridePredictionAggressiveness = p.prediction_aggressiveness;
    this._audioOverrideLatencyCompensationMs = p.latency_compensation_ms;
    this._saveUserPreferences();
  }

  private get _distributionModeOverrideOptions() {
    return [
      { value: 'shuffle_rotate', label: this._localize('dynamic_scene.distribution_shuffle_rotate') || 'Shuffle and rotate' },
      { value: 'synchronized', label: this._localize('dynamic_scene.distribution_synchronized') || 'Synchronized' },
      { value: 'random', label: this._localize('dynamic_scene.distribution_random') || 'Random' },
    ];
  }

  private async _saveGlobalPreferences(): Promise<void> {
    try {
      await this.hass.callApi('PUT', 'aqara_advanced_lighting/global_preferences', {
        ignore_external_changes: this._ignoreExternalChanges,
        override_control_mode: this._overrideControlMode,
        software_transition_entities: this._softwareTransitionEntities,
        bare_turn_on_only: this._bareTurnOnOnly,
        detect_non_ha_changes: this._detectNonHaChanges,
        entity_audio_config: this._entityAudioConfig,
      });
    } catch (err) {
      console.warn('Failed to save global preferences:', err);
    }
  }

  private _handleExpansionChange(sectionId: string, e: CustomEvent): void {
    const expanded = e.detail.expanded;
    this._collapsed = {
      ...this._collapsed,
      [sectionId]: !expanded,
    };
    this._saveUserPreferences();
  }

  private _toggleInstanceDevices(entryId: string): void {
    const next = new Set(this._instanceDevicesExpanded);
    if (next.has(entryId)) {
      next.delete(entryId);
    } else {
      next.add(entryId);
    }
    this._instanceDevicesExpanded = next;
  }

  private async _activateDynamicEffect(preset: DynamicEffectPreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    const serviceData: Record<string, unknown> = {
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
    await this._loadRunningOperations();
  }

  private async _activateSegmentPattern(preset: SegmentPatternPreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    const serviceData: Record<string, unknown> = {
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
    await this._loadRunningOperations();
  }

  private async _activateCCTSequence(preset: CCTSequencePreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    const isAdaptive = preset.mode === 'solar' || preset.mode === 'schedule';
    await this.hass.callService('aqara_advanced_lighting', 'start_cct_sequence', {
      entity_id: this._selectedEntities,
      preset: preset.id,
      ...(!isAdaptive && { turn_on: true }),
      sync: true,
    });
    await this._loadRunningOperations();
  }

  private async _activateSegmentSequence(preset: SegmentSequencePreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'start_segment_sequence', {
      entity_id: this._selectedEntities,
      preset: preset.id,
      turn_on: true,
      sync: true,
    });
    await this._loadRunningOperations();
  }

  private async _activateDynamicScene(preset: DynamicScenePreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    // When brightness override is enabled, replace all per-color brightness
    const overrideBrightness = this._useCustomBrightness ? this._brightness : null;

    const serviceData: Record<string, unknown> = {
      entity_id: this._selectedEntities,
      scene_name: preset.name,
      transition_time: preset.transition_time,
      hold_time: preset.hold_time,
      distribution_mode: this._useDistributionModeOverride ? this._distributionModeOverride : preset.distribution_mode,
      random_order: preset.random_order,
      loop_mode: preset.loop_mode,
      end_behavior: preset.end_behavior,
    };

    // Add offset_delay only if provided and non-zero
    if (preset.offset_delay !== undefined && preset.offset_delay > 0) {
      serviceData.offset_delay = preset.offset_delay;
    }

    // Add loop_count only if loop_mode is 'count'
    if (preset.loop_mode === 'count' && preset.loop_count !== undefined) {
      serviceData.loop_count = preset.loop_count;
    }

    // Add colors array - override brightness if custom brightness is enabled
    serviceData.colors = preset.colors.map((color) => ({
      x: color.x,
      y: color.y,
      brightness_pct: overrideBrightness ?? color.brightness_pct,
    }));

    // Static mode: apply colors once without starting a transition loop
    if (this._useStaticSceneMode) {
      serviceData.static = true;
    }

    this._applyAudioOverrides(serviceData);

    await this.hass.callService('aqara_advanced_lighting', 'start_dynamic_scene', serviceData);
    await this._loadRunningOperations();
  }

  private _applyAudioOverrides(serviceData: Record<string, unknown>): void {
    if (this._useAudioReactive && this._audioOverrideEntity) {
      serviceData.audio_entity = this._audioOverrideEntity;
      serviceData.audio_sensitivity = this._audioOverrideSensitivity;
      serviceData.audio_color_advance = this._audioOverrideColorAdvance;
      serviceData.audio_transition_speed = this._audioOverrideTransitionSpeed;
      serviceData.audio_brightness_response = this._audioOverrideBrightnessResponse;
      serviceData.audio_detection_mode = this._audioOverrideDetectionMode;
      serviceData.audio_frequency_zone = this._audioOverrideFrequencyZone;
      serviceData.audio_silence_degradation = this._audioOverrideSilenceDegradation;
      serviceData.audio_prediction_aggressiveness = this._audioOverridePredictionAggressiveness;
      serviceData.audio_latency_compensation_ms = this._audioOverrideLatencyCompensationMs;
    }
  }

  // --- Running operations rendering and actions ---

  private _getEntityName(entityId: string): string {
    const state = this.hass?.states?.[entityId];
    return (state?.attributes?.friendly_name as string) || entityId;
  }

  private _formatAutoResumeRemaining(seconds: number): string {
    if (seconds >= 60) {
      const mins = Math.ceil(seconds / 60);
      return `${mins}m`;
    }
    return `${seconds}s`;
  }

  private _resolvePresetInfo(presetId: string | null): { name: string | null; icon: string | null } {
    if (!presetId) return { name: null, icon: null };
    return this._presetLookup.get(presetId) ?? { name: presetId, icon: null };
  }

  private _renderRunningOperations() {
    if (this._runningOperations.length === 0) {
      return html`
        <div class="running-ops-empty">
          ${this._localize('target.no_running_operations')}
        </div>
      `;
    }

    const displayItems = this._buildDisplayOperations(this._runningOperations);

    return html`
      <div class="running-ops-container">
        <div class="running-ops-list">
          ${displayItems.map(item =>
            Array.isArray(item)
              ? this._renderGroupedSequenceOp(item)
              : this._renderOperationCard(item),
          )}
        </div>
      </div>
    `;
  }

  /**
   * Group sequence operations sharing the same preset into arrays.
   * Single-entity sequences stay as individual RunningOperation objects.
   */
  private _buildDisplayOperations(
    ops: RunningOperation[],
  ): (RunningOperation | RunningOperation[])[] {
    const result: (RunningOperation | RunningOperation[])[] = [];
    const seqGroupIndex = new Map<string, number>();

    for (const op of ops) {
      if (
        (op.type === 'cct_sequence' || op.type === 'segment_sequence') &&
        op.preset_id
      ) {
        const key = `${op.type}:${op.preset_id}`;
        const idx = seqGroupIndex.get(key);
        if (idx !== undefined) {
          const existing = result[idx];
          if (Array.isArray(existing)) {
            existing.push(op);
          } else {
            result[idx] = [existing as RunningOperation, op];
          }
        } else {
          seqGroupIndex.set(key, result.length);
          result.push(op);
        }
      } else {
        result.push(op);
      }
    }

    return result;
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
      case 'music_sync':
        return this._renderMusicSyncOp(op);
      case 'circadian':
        return this._renderCircadianOp(op);
      default:
        return '';
    }
  }

  private _renderEffectOp(op: RunningOperation) {
    const entityName = this._getEntityName(op.entity_id!);
    const preset = this._resolvePresetInfo(op.preset_id);
    const typeLabel = this._localize('target.effect_button');
    return html`
      <div class="running-op-card">
        <div class="running-op-info">
          <ha-icon class="running-op-icon" icon="${preset.icon || 'mdi:palette'}"></ha-icon>
          <div class="running-op-details">
            <span class="running-op-name">${preset.name || typeLabel}</span>
            <span class="running-op-entity">
              ${preset.name ? html`<span class="running-op-type">${typeLabel}</span>` : ''}
              <span class="running-op-entity-name">${entityName}</span>
            </span>
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
    const isSolar = isCCT && op.mode === 'solar';
    const isSchedule = isCCT && op.mode === 'schedule';
    const fallbackIcon = isSolar ? 'mdi:white-balance-sunny' : isSchedule ? 'mdi:clock-outline' : isCCT ? 'mdi:thermometer' : 'mdi:led-strip-variant';
    const typeLabel = isSolar
      ? this._localize('target.solar_cct_button')
      : isSchedule
        ? this._localize('target.schedule_cct_button')
        : isCCT
          ? this._localize('target.cct_button')
          : this._localize('target.segment_button');
    const isPaused = op.paused || op.externally_paused;
    const pauseClass = this._getEntityPauseClass(
      op.externally_paused,
      op.override_attributes as {brightness: boolean; color: boolean} | undefined,
    );
    const pauseTitle = this._getEntityPauseTitle(
      op.externally_paused,
      op.override_attributes as {brightness: boolean; color: boolean} | undefined,
      op.auto_resume_remaining,
    );

    return html`
      <div class="running-op-card ${isPaused ? 'op-paused' : ''} ${op.externally_paused ? 'externally-paused' : ''}">
        <div class="running-op-info">
          <ha-icon class="running-op-icon" icon="${preset.icon || fallbackIcon}"></ha-icon>
          <div class="running-op-details">
            <span class="running-op-name">${preset.name || typeLabel}</span>
            <span class="running-op-entity">
              ${preset.name ? html`<span class="running-op-type">${typeLabel}</span>` : ''}
              <span class="entity-chip ${pauseClass}" title="${pauseTitle}">${entityName}</span>
            </span>
            ${op.paused ? html`
              <span class="running-op-pause-row">
                <span class="running-op-status paused-text">${this._localize('target.paused')}</span>
              </span>
            ` : ''}
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

  private _renderGroupedSequenceOp(ops: RunningOperation[]) {
    const first = ops[0]!;
    const preset = this._resolvePresetInfo(first.preset_id);
    const isCCT = first.type === 'cct_sequence';
    const isSolar = isCCT && first.mode === 'solar';
    const isSchedule = isCCT && first.mode === 'schedule';
    const fallbackIcon = isSolar
      ? 'mdi:white-balance-sunny'
      : isSchedule
        ? 'mdi:clock-outline'
        : isCCT
          ? 'mdi:thermometer'
          : 'mdi:led-strip-variant';
    const typeLabel = isSolar
      ? this._localize('target.solar_cct_button')
      : isSchedule
        ? this._localize('target.schedule_cct_button')
        : isCCT
          ? this._localize('target.cct_button')
          : this._localize('target.segment_button');

    const anyPaused = ops.some(op => op.paused);
    const extPausedOps = ops.filter(op => op.externally_paused);
    const isPaused = anyPaused || extPausedOps.length > 0;

    const entityChips = ops.map(op => {
      const name = this._getEntityName(op.entity_id!);
      const pauseClass = this._getEntityPauseClass(
        op.externally_paused,
        op.override_attributes as {brightness: boolean; color: boolean} | undefined,
      );
      const pauseTitle = this._getEntityPauseTitle(
        op.externally_paused,
        op.override_attributes as {brightness: boolean; color: boolean} | undefined,
        op.auto_resume_remaining,
      );
      return html`<span class="entity-chip ${pauseClass}" title="${pauseTitle}">${name}</span>`;
    });

    return html`
      <div class="running-op-card scene-op-card ${isPaused ? 'op-paused' : ''}">
        <div class="running-op-header">
          <div class="running-op-info">
            <ha-icon class="running-op-icon" icon="${preset.icon || fallbackIcon}"></ha-icon>
            <div class="running-op-details">
              <span class="running-op-name">${preset.name || typeLabel}</span>
              ${preset.name ? html`<span class="running-op-entity"><span class="running-op-type">${typeLabel}</span></span>` : ''}
              ${anyPaused ? html`
                <span class="running-op-pause-row">
                  <span class="running-op-status paused-text">${this._localize('target.paused')}</span>
                </span>
              ` : ''}
            </div>
          </div>
          <div class="running-op-actions">
            ${extPausedOps.length > 0
              ? html`
                  <ha-icon-button
                    .label=${this._localize('target.resume_control')}
                    @click=${() => this._resumeSceneEntities(extPausedOps.map(op => op.entity_id!))}
                  >
                    <ha-icon icon="mdi:play-circle-outline"></ha-icon>
                  </ha-icon-button>
                `
              : ''}
            <ha-icon-button
              .label=${anyPaused ? this._localize('target.resume') : this._localize('target.pause')}
              @click=${() => this._toggleGroupedSequencePause(ops)}
            >
              <ha-icon icon="mdi:${anyPaused ? 'play' : 'pause'}"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              .label=${this._localize('target.stop')}
              @click=${() => this._stopGroupedSequence(ops)}
            >
              <ha-icon icon="mdi:stop"></ha-icon>
            </ha-icon-button>
          </div>
        </div>
        <div class="entity-chip-list">
          ${entityChips}
        </div>
      </div>
    `;
  }

  private _renderSceneOp(op: RunningOperation) {
    const preset = this._resolvePresetInfo(op.preset_id);
    const extPausedEntities = op.externally_paused_entities || [];
    const overrideMap = op.override_attributes as Record<string, {brightness: boolean; color: boolean}> | undefined;
    const isPaused = op.paused || extPausedEntities.length > 0;

    const entityChips = (op.entity_ids || []).map(id => {
      const name = this._getEntityName(id);
      const cap = op.entity_capabilities?.[id];
      const isSoftwareTransition = cap?.includes('software_transition');
      const isExtPaused = extPausedEntities.includes(id);
      const attrs = isExtPaused && overrideMap ? overrideMap[id] : undefined;
      const pauseClass = this._getEntityPauseClass(isExtPaused, attrs);
      const pauseTitle = this._getEntityPauseTitle(isExtPaused, attrs);
      const badges: unknown[] = [];
      if (cap?.includes('cct_mode')) {
        badges.push(html`<span class="chip-badge">${this._localize('target.capability_cct')}</span>`);
      }
      if (cap?.includes('brightness_only')) {
        badges.push(html`<span class="chip-badge">${this._localize('target.capability_brightness')}</span>`);
      }
      if (cap?.includes('on_off_only')) {
        badges.push(html`<span class="chip-badge">${this._localize('target.capability_on_off')}</span>`);
      }
      if (isSoftwareTransition) {
        badges.push(html`<span class="chip-badge">${this._localize('target.capability_software_transition')}</span>`);
      }
      return html`<span class="entity-chip ${pauseClass} ${badges.length ? 'has-badge' : ''}" title="${pauseTitle}">${name}${badges}</span>`;
    });

    const audioTierLabel = op.audio_tier === 'rich'
      ? (this._localize('target.audio_tier_rich') || 'Beat sync')
      : null;

    return html`
      <div class="running-op-card scene-op-card ${isPaused ? 'op-paused' : ''}">
        <div class="running-op-header">
          <div class="running-op-info">
            <ha-icon class="running-op-icon" icon="${preset.icon || 'mdi:palette-swatch-variant'}"></ha-icon>
            <div class="running-op-details">
              <span class="running-op-name">${preset.name || this._localize('target.scene_button')}</span>
              ${preset.name ? html`<span class="running-op-entity"><span class="running-op-type">${this._localize('target.scene_button')}</span></span>` : ''}
              ${audioTierLabel ? html`
                <span class="running-op-entity">
                  <ha-icon icon="mdi:waveform" style="--mdc-icon-size: 14px; vertical-align: middle;"></ha-icon>
                  <span class="running-op-type">${audioTierLabel}</span>
                  ${op.audio_entity ? html`<span class="running-op-status">${this._getEntityName(op.audio_entity)}</span>` : ''}
                  ${op.audio_bpm ? html`
                    <span class="running-op-bpm">
                      <ha-icon icon="mdi:metronome" style="--mdc-icon-size: 12px; vertical-align: middle;"></ha-icon>
                      ${Math.round(op.audio_bpm)} BPM
                    </span>
                  ` : ''}
                </span>
              ` : ''}
              ${op.audio_sensitivity != null ? html`
                <div class="audio-sensitivity-row" style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                  <ha-icon icon="mdi:sine-wave" style="--mdc-icon-size: 14px; flex-shrink: 0;"></ha-icon>
                  <span style="font-size: 12px; white-space: nowrap;">${this._localize('target.sensitivity') || 'Sensitivity'}</span>
                  <input type="range" min="1" max="100" .value=${String(op.audio_sensitivity)}
                    style="flex: 1; min-width: 80px; accent-color: var(--primary-color);"
                    @input=${(e: Event) => this._debounceAudioSensitivity(op.scene_id!, parseInt((e.target as HTMLInputElement).value))}
                  />
                  <span style="font-size: 12px; min-width: 24px; text-align: right;">${op.audio_sensitivity}</span>
                </div>
              ` : ''}
              ${op.audio_squelch != null ? html`
                <div class="audio-sensitivity-row" style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                  <ha-icon icon="mdi:volume-off" style="--mdc-icon-size: 14px; flex-shrink: 0;"></ha-icon>
                  <span style="font-size: 12px; white-space: nowrap;">${this._localize('target.audio_squelch_label') || 'Noise gate'}</span>
                  <input type="range" min="0" max="100" .value=${String(op.audio_squelch)}
                    style="flex: 1; min-width: 80px; accent-color: var(--primary-color);"
                    @input=${(e: Event) => this._debounceAudioSquelch(op.scene_id!, parseInt((e.target as HTMLInputElement).value))}
                  />
                  <span style="font-size: 12px; min-width: 24px; text-align: right;">${op.audio_squelch}</span>
                </div>
              ` : ''}
              ${op.audio_waiting ? html`
                <span class="running-op-pause-row">
                  <span class="running-op-status paused-text">${this._localize('target.audio_sensor_unavailable') || 'Audio sensor unavailable'}</span>
                </span>
              ` : ''}
              ${op.paused ? html`
                <span class="running-op-pause-row">
                  <span class="running-op-status paused-text">${this._localize('target.paused')}</span>
                </span>
              ` : ''}
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
        <div class="entity-chip-list">
          ${entityChips}
        </div>
      </div>
    `;
  }

  private _sensitivityDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  private _debounceAudioSensitivity(sceneId: string, value: number): void {
    if (this._sensitivityDebounceTimer) {
      clearTimeout(this._sensitivityDebounceTimer);
    }
    this._sensitivityDebounceTimer = setTimeout(() => {
      this._updateAudioSensitivity(sceneId, value);
    }, 300);
  }

  private async _updateAudioSensitivity(sceneId: string, sensitivity: number): Promise<void> {
    try {
      await fetch(`/api/aqara_advanced_lighting/scene_audio_sensitivity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.hass.auth.data.access_token}`,
        },
        body: JSON.stringify({ scene_id: sceneId, sensitivity }),
      });
    } catch (e) {
      console.error('Failed to update audio sensitivity:', e);
    }
  }

  private _squelchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  private _debounceAudioSquelch(sceneId: string, value: number): void {
    if (this._squelchDebounceTimer) {
      clearTimeout(this._squelchDebounceTimer);
    }
    this._squelchDebounceTimer = setTimeout(() => {
      this._updateAudioSquelch(sceneId, value);
    }, 300);
  }

  private async _updateAudioSquelch(sceneId: string, squelch: number): Promise<void> {
    try {
      await fetch(`/api/aqara_advanced_lighting/scene_audio_squelch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.hass.auth.data.access_token}`,
        },
        body: JSON.stringify({ scene_id: sceneId, squelch }),
      });
    } catch (e) {
      console.error('Failed to update audio squelch:', e);
    }
  }

  private _getEntityPauseClass(extPaused?: boolean, attrs?: {brightness: boolean; color: boolean}): string {
    if (!extPaused) return '';
    if (attrs) {
      if (attrs.brightness && attrs.color) return 'paused-all';
      if (attrs.brightness) return 'paused-brightness';
      if (attrs.color) return 'paused-color';
    }
    return 'paused-all';
  }

  private _getEntityPauseTitle(extPaused?: boolean, attrs?: {brightness: boolean; color: boolean}, autoResume?: number): string {
    if (!extPaused) return '';
    let detail: string;
    if (attrs) {
      if (attrs.brightness && attrs.color) detail = this._localize('target.externally_paused');
      else if (attrs.brightness) detail = this._localize('target.paused_brightness_only');
      else if (attrs.color) detail = this._localize('target.paused_color_only');
      else detail = this._localize('target.externally_paused');
    } else {
      detail = this._localize('target.externally_paused');
    }
    if (autoResume) {
      detail += ` (${this._formatAutoResumeRemaining(autoResume)})`;
    }
    return detail;
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

  private async _toggleGroupedSequencePause(ops: RunningOperation[]): Promise<void> {
    const isCCT = ops[0]!.type === 'cct_sequence';
    const anyPaused = ops.some(op => op.paused);
    const service = anyPaused
      ? (isCCT ? 'resume_cct_sequence' : 'resume_segment_sequence')
      : (isCCT ? 'pause_cct_sequence' : 'pause_segment_sequence');
    await this.hass.callService('aqara_advanced_lighting', service, {
      entity_id: ops.map(op => op.entity_id!),
    });
  }

  private async _stopGroupedSequence(ops: RunningOperation[]): Promise<void> {
    const service = ops[0]!.type === 'cct_sequence'
      ? 'stop_cct_sequence'
      : 'stop_segment_sequence';
    await this.hass.callService('aqara_advanced_lighting', service, {
      entity_id: ops.map(op => op.entity_id!),
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
  private _filterByDeviceType<T extends { device_type?: string }>(presets: T[], deviceType: string): T[] {
    return presets.filter((preset) => {
      if (!preset.device_type) return true;
      if (deviceType === 't1m' && (preset.device_type === 't1' || preset.device_type === 't1m')) return true;
      return preset.device_type === deviceType;
    });
  }

  private _getUserEffectPresetsForDeviceType(deviceType: string): UserEffectPreset[] {
    return this._filterByDeviceType(this._userPresets?.effect_presets || [], deviceType);
  }

  private _getUserPatternPresetsForDeviceType(deviceType: string): UserSegmentPatternPreset[] {
    return this._filterByDeviceType(this._userPresets?.segment_pattern_presets || [], deviceType);
  }

  private _getFilteredUserCCTSequencePresets(): UserCCTSequencePreset[] {
    if (!this._userPresets?.cct_sequence_presets) return [];
    const deviceTypes = this._getSelectedDeviceTypes();
    // CCT sequences apply to all lights
    return deviceTypes.length > 0 ? this._userPresets.cct_sequence_presets : [];
  }

  private _getUserSegmentSequencePresetsForDeviceType(deviceType: string): UserSegmentSequencePreset[] {
    return this._filterByDeviceType(this._userPresets?.segment_sequence_presets || [], deviceType);
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
    await this._loadRunningOperations();
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
      await this._loadRunningOperations();
    } catch (err) {
      console.error('Failed to activate pattern preset:', err);
    }
  }

  private async _activateUserCCTSequencePreset(preset: UserCCTSequencePreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    // Adaptive presets (solar/schedule) are resolved by name on the backend.
    // Don't turn on lights -- the loop waits for them to be turned on.
    if (preset.mode === 'solar' || preset.mode === 'schedule') {
      await this.hass.callService('aqara_advanced_lighting', 'start_cct_sequence', {
        entity_id: this._selectedEntities,
        preset: preset.name,
        sync: true,
      });
      await this._loadRunningOperations();
      return;
    }

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
    await this._loadRunningOperations();
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
    await this._loadRunningOperations();
  }

  private async _activateUserDynamicScenePreset(preset: UserDynamicScenePreset): Promise<void> {
    if (!this._selectedEntities.length) return;

    // When brightness override is enabled, replace all per-color brightness
    const overrideBrightness = this._useCustomBrightness ? this._brightness : null;

    const serviceData: Record<string, unknown> = {
      entity_id: this._selectedEntities,
      scene_name: preset.name,
      transition_time: preset.transition_time,
      hold_time: preset.hold_time,
      distribution_mode: this._useDistributionModeOverride ? this._distributionModeOverride : preset.distribution_mode,
      random_order: preset.random_order,
      loop_mode: preset.loop_mode,
      end_behavior: preset.end_behavior,
    };

    // Add offset_delay only if provided and non-zero
    if (preset.offset_delay !== undefined && preset.offset_delay > 0) {
      serviceData.offset_delay = preset.offset_delay;
    }

    // Add loop_count only if loop_mode is 'count'
    if (preset.loop_mode === 'count' && preset.loop_count !== undefined) {
      serviceData.loop_count = preset.loop_count;
    }

    // Add colors array - override brightness replaces per-color values
    serviceData.colors = preset.colors.map((color) => ({
      x: color.x,
      y: color.y,
      brightness_pct: overrideBrightness ?? color.brightness_pct,
    }));

    // Static mode: apply colors once without starting a transition loop
    if (this._useStaticSceneMode) {
      serviceData.static = true;
    }

    // Audio reactive override (panel override takes precedence over preset audio settings)
    this._applyAudioOverrides(serviceData);
    if (!(this._useAudioReactive && this._audioOverrideEntity) && preset.audio_entity) {
      // Pass through preset-level audio settings when no panel override is active
      serviceData.audio_entity = preset.audio_entity;
      serviceData.audio_sensitivity = preset.audio_sensitivity;
      serviceData.audio_brightness_response = preset.audio_brightness_response;
      serviceData.audio_color_advance = preset.audio_color_advance;
      serviceData.audio_transition_speed = preset.audio_transition_speed;
      serviceData.audio_detection_mode = preset.audio_detection_mode;
      serviceData.audio_frequency_zone = preset.audio_frequency_zone;
      serviceData.audio_silence_degradation = preset.audio_silence_degradation;
      serviceData.audio_prediction_aggressiveness = preset.audio_prediction_aggressiveness;
      serviceData.audio_latency_compensation_ms = preset.audio_latency_compensation_ms;
    }

    await this.hass.callService('aqara_advanced_lighting', 'start_dynamic_scene', serviceData);
    await this._loadRunningOperations();
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
              ${!this._setupComplete ? html`
                <span class="setup-badge" title="${this._localize('tooltips.setup_in_progress')}">${this._localize('status.setting_up')}</span>
              ` : ''}
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
          <ha-tab-group-tab slot="nav" panel="config" .active=${this._activeTab === 'config'}>
            ${this._localize('tabs.config')}
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="presets" .active=${this._activeTab === 'presets'}>
            ${this._localize('tabs.presets')}
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
              <div class="control-input target-input ${hasSelection ? 'has-selection' : ''}">
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
                </div>
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
              ${hasSelection
                ? html`
                    <button class="save-favorite-bar" @click=${this._addFavorite}>
                      <ha-icon icon="mdi:star-plus-outline"></ha-icon>
                      <span>${this._localize('target.save_as_favorite')}</span>
                    </button>
                  `
                : ''}
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

                        const isRenaming = this._renamingFavoriteId === favorite.id;
                        const isEditMode = this._favoriteEditModeId === favorite.id;

                        return html`
                          <div
                            class="favorite-button ${isOn ? 'state-on' : 'state-off'} ${isUnavailable ? 'state-unavailable' : ''} ${isActive ? 'selected' : ''} ${isRenaming ? 'renaming' : ''} ${isEditMode ? 'edit-mode' : ''}"
                            @click=${() => { if (isEditMode) { this._clearFavoriteEditMode(); } else if (!isRenaming) { this._selectFavorite(favorite); } }}
                            @touchstart=${() => this._handleFavoriteTouchStart(favorite)}
                            @touchend=${(e: TouchEvent) => this._handleFavoriteTouchEnd(e)}
                            @touchmove=${this._handleFavoriteTouchMove}
                          >
                            <div class="favorite-button-icon" style="${iconBackgroundStyle}">
                              <ha-icon icon="${entityIcon}" style="${iconColorStyle}"></ha-icon>
                            </div>
                            <div class="favorite-button-content">
                              ${isRenaming
                                ? html`
                                    <input
                                      class="favorite-rename-input"
                                      type="text"
                                      .value=${this._renamingFavoriteName}
                                      @input=${this._handleRenameInput}
                                      @keydown=${this._handleRenameKeydown}
                                      @blur=${this._handleRenameBlur}
                                      @click=${(e: Event) => e.stopPropagation()}
                                    />
                                  `
                                : html`<div class="favorite-button-name">${favorite.name}</div>`}
                              ${entityCount > 1 && !isRenaming
                                ? html`<div class="favorite-button-count">${this._localize('target.favorite_lights_count', { count: entityCount.toString() })}</div>`
                                : ''}
                            </div>
                            <div class="favorite-button-actions favorite-button-actions-left">
                              <ha-icon-button
                                class="favorite-button-action"
                                @click=${(e: Event) => this._startRenameFavorite(e, favorite)}
                                title="${this._localize('tooltips.favorite_rename')}"
                              >
                                <ha-icon icon="mdi:pencil"></ha-icon>
                              </ha-icon-button>
                            </div>
                            <div class="favorite-button-actions">
                              <ha-icon-button
                                class="favorite-button-action"
                                @click=${(e: Event) => {
                                  e.stopPropagation();
                                  this._removeFavorite(favorite.id);
                                }}
                                title="${this._localize('tooltips.favorite_remove')}"
                              >
                                <ha-icon icon="mdi:close"></ha-icon>
                              </ha-icon-button>
                            </div>
                          </div>
                        `;
                      })}
                    </div>
                  </div>
                `
              : html`
                  <div class="control-row">
                    <div class="favorites-empty-state">
                      <ha-icon icon="mdi:star-outline"></ha-icon>
                      <span>${this._localize('target.favorites_empty')}</span>
                    </div>
                  </div>
                `}
          </div>

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
              </div>
            </ha-expansion-panel>
          `
        : ''}

      ${hasSelection
        ? html`
            <ha-expansion-panel
              outlined
              .expanded=${this._collapsed['activation_overrides'] === undefined ? false : !this._collapsed['activation_overrides']}
              @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange('activation_overrides', e)}
            >
              <div slot="header" class="section-header">
                <div>
                  <div class="section-title">${this._localize('target.activation_overrides_title')}</div>
                </div>
              </div>
              <div class="section-content controls-content">
                <div class="overrides-grid">
                  <div class="override-item" style="opacity: ${this._useAudioReactive ? '0.5' : '1'}">
                    <span class="form-label">${this._localize('target.custom_brightness_label')}</span>
                    <ha-switch
                      .checked=${this._useCustomBrightness}
                      .disabled=${this._useAudioReactive}
                      @change=${this._handleCustomBrightnessToggle}
                    ></ha-switch>
                  </div>

                  <div class="override-item" style="opacity: ${this._useAudioReactive ? '0.5' : '1'}">
                    <span class="form-label">${this._localize('target.static_scene_mode_label')}</span>
                    <ha-switch
                      .checked=${this._useStaticSceneMode}
                      .disabled=${this._useAudioReactive}
                      @change=${this._handleStaticSceneModeToggle}
                    ></ha-switch>
                  </div>

                  <div class="override-item" style="opacity: ${this._useAudioReactive ? '0.5' : '1'}">
                    <span class="form-label">${this._localize('target.distribution_mode_override_label')}</span>
                    <ha-switch
                      .checked=${this._useDistributionModeOverride}
                      .disabled=${this._useAudioReactive}
                      @change=${this._handleDistributionModeOverrideToggle}
                    ></ha-switch>
                  </div>

                  <div class="override-item">
                    <span class="form-label">${this._localize('target.audio_reactive_label') || 'Audio reactive'}</span>
                    <ha-switch
                      .checked=${this._useAudioReactive}
                      @change=${this._handleAudioReactiveToggle}
                    ></ha-switch>
                  </div>
                </div>

                ${this._useAudioReactive
                  ? html`
                      <!-- Row 1: Audio preset + Entity selector -->
                      <div class="audio-override-row">
                        <div>
                          <span class="form-label">${this._localize('dynamic_scene.audio_preset_label') || 'Audio preset'}</span>
                          <ha-selector
                            .hass=${this.hass}
                            .selector=${{ select: { options: this._audioPresetOptions, mode: 'dropdown' } }}
                            .value=${this._currentAudioOverridePreset}
                            @value-changed=${this._handleAudioOverridePresetChange}
                          ></ha-selector>
                        </div>
                        <div>
                          <span class="form-label">${this._localize('target.audio_entity_label') || 'Audio sensor entity'}</span>
                          <ha-selector
                            .hass=${this.hass}
                            .selector=${{ entity: { domain: 'binary_sensor' } }}
                            .value=${this._audioOverrideEntity}
                            @value-changed=${this._handleAudioOverrideEntityChange}
                          ></ha-selector>
                        </div>
                      </div>
                      <!-- Row 2: Detection mode + Color advance -->
                      <div class="audio-override-row">
                        <div>
                          <span class="form-label">${this._localize('dynamic_scene.audio_detection_mode_label') || 'Detection mode'}</span>
                          <ha-selector
                            .hass=${this.hass}
                            .selector=${{ select: { options: [
                              { value: 'spectral_flux', label: this._localize('dynamic_scene.audio_detection_spectral_flux') || 'Spectral flux (all genres)' },
                              { value: 'bass_energy', label: this._localize('dynamic_scene.audio_detection_bass_energy') || 'Bass energy (rhythmic music)' },
                              { value: 'complex_domain', label: this._localize('dynamic_scene.audio_detection_complex_domain') || 'Complex domain (phase+magnitude)' },
                            ], mode: 'dropdown' } }}
                            .value=${this._audioOverrideDetectionMode}
                            @value-changed=${this._handleAudioOverrideDetectionModeChange}
                          ></ha-selector>
                        </div>
                        <div>
                          <span class="form-label">${this._localize('dynamic_scene.audio_color_advance_label') || 'Color advance'}</span>
                          <ha-selector
                            .hass=${this.hass}
                            .selector=${{ select: { options: [
                              { value: 'on_onset', label: this._localize('dynamic_scene.audio_mode_on_onset') || 'Color cycle' },
                              { value: 'continuous', label: this._localize('dynamic_scene.audio_mode_continuous') || 'Continuous' },
                              { value: 'beat_predictive', label: this._localize('dynamic_scene.audio_mode_beat_predictive') || 'Beat predictive' },
                              { value: 'intensity_breathing', label: this._localize('dynamic_scene.audio_mode_intensity_breathing') || 'Intensity breathing' },
                              { value: 'onset_flash', label: this._localize('dynamic_scene.audio_mode_onset_flash') || 'Brightness flash' },
                            ], mode: 'dropdown' } }}
                            .value=${this._audioOverrideColorAdvance}
                            @value-changed=${this._handleAudioOverrideColorAdvanceChange}
                          ></ha-selector>
                        </div>
                      </div>
                      <!-- Row 3: Sensitivity + Transition speed -->
                      <div class="audio-override-row">
                        <div>
                          <span class="form-label">${this._localize('dynamic_scene.audio_sensitivity_label') || 'Sensitivity'}</span>
                          <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 1, max: 100, mode: 'slider', unit_of_measurement: '%' } }}
                            .value=${this._audioOverrideSensitivity}
                            @value-changed=${this._handleAudioOverrideSensitivityChange}
                          ></ha-selector>
                        </div>
                        <div>
                          <span class="form-label">${this._localize('dynamic_scene.audio_transition_speed_label') || 'Transition speed'}</span>
                          <ha-selector
                            .hass=${this.hass}
                            .disabled=${!(this._audioOverrideColorAdvance === 'on_onset' || this._audioOverrideColorAdvance === 'beat_predictive' || this._audioOverrideColorAdvance === 'onset_flash')}
                            .selector=${{ number: { min: 1, max: 100, mode: 'slider', unit_of_measurement: '%' } }}
                            .value=${this._audioOverrideTransitionSpeed}
                            @value-changed=${this._handleAudioOverrideTransitionSpeedChange}
                          ></ha-selector>
                        </div>
                      </div>
                      <!-- Row 4: Prediction aggressiveness + Latency compensation -->
                      <div class="audio-override-row">
                        <div>
                          <span class="form-label">${this._localize('dynamic_scene.audio_prediction_aggressiveness_label') || 'Prediction aggressiveness'}</span>
                          <ha-selector
                            .hass=${this.hass}
                            .disabled=${this._audioOverrideColorAdvance !== 'beat_predictive'}
                            .selector=${{ number: { min: 1, max: 100, mode: 'slider', unit_of_measurement: '%' } }}
                            .value=${this._audioOverridePredictionAggressiveness}
                            @value-changed=${this._handleAudioOverridePredictionAggressivenessChange}
                          ></ha-selector>
                        </div>
                        <div>
                          <span class="form-label">${this._localize('dynamic_scene.audio_latency_compensation_label') || 'Latency compensation'}</span>
                          <ha-selector
                            .hass=${this.hass}
                            .disabled=${this._audioOverrideColorAdvance !== 'beat_predictive'}
                            .selector=${{ number: { min: 0, max: 500, mode: 'slider', unit_of_measurement: 'ms' } }}
                            .value=${this._audioOverrideLatencyCompensationMs}
                            @value-changed=${this._handleAudioOverrideLatencyCompensationChange}
                          ></ha-selector>
                        </div>
                      </div>
                      <!-- Toggles: 4-per-row desktop, 2-per-row mobile -->
                      <div class="audio-toggles-grid">
                        <div class="override-item">
                          <span class="form-label">${this._localize('dynamic_scene.audio_brightness_response_label') || 'Brightness response'}</span>
                          <ha-switch
                            .checked=${this._audioOverrideBrightnessResponse}
                            .disabled=${!(this._audioOverrideColorAdvance === 'on_onset' || this._audioOverrideColorAdvance === 'continuous' || this._audioOverrideColorAdvance === 'beat_predictive')}
                            @change=${(e: Event) => { this._audioOverrideBrightnessResponse = (e.target as HTMLInputElement).checked; this._saveUserPreferences(); }}
                          ></ha-switch>
                        </div>
                        <div class="override-item">
                          <span class="form-label">${this._localize('dynamic_scene.audio_frequency_zone_label') || 'Frequency zone'}</span>
                          <ha-switch
                            .checked=${this._audioOverrideFrequencyZone}
                            @change=${(e: Event) => { this._audioOverrideFrequencyZone = (e.target as HTMLInputElement).checked; this._saveUserPreferences(); }}
                          ></ha-switch>
                        </div>
                        <div class="override-item">
                          <span class="form-label">${this._localize('dynamic_scene.audio_silence_degradation_label') || 'Silence degradation'}</span>
                          <ha-switch
                            .checked=${this._audioOverrideSilenceDegradation}
                            @change=${(e: Event) => { this._audioOverrideSilenceDegradation = (e.target as HTMLInputElement).checked; this._saveUserPreferences(); }}
                          ></ha-switch>
                        </div>
                        <div class="override-item">
                          <span class="form-label">${this._localize('dynamic_scene.audio_color_by_frequency_label') || 'Color by frequency'}</span>
                          <ha-switch
                            .checked=${this._audioOverrideColorByFrequency}
                            @change=${(e: Event) => { this._audioOverrideColorByFrequency = (e.target as HTMLInputElement).checked; this._saveUserPreferences(); }}
                          ></ha-switch>
                        </div>
                        <div class="override-item">
                          <span class="form-label">${this._localize('dynamic_scene.audio_rolloff_brightness_label') || 'Rolloff brightness'}</span>
                          <ha-switch
                            .checked=${this._audioOverrideRolloffBrightness}
                            @change=${(e: Event) => { this._audioOverrideRolloffBrightness = (e.target as HTMLInputElement).checked; this._saveUserPreferences(); }}
                          ></ha-switch>
                        </div>
                      </div>
                    `
                  : ''}

                ${this._useDistributionModeOverride
                  ? html`
                      <div class="brightness-slider">
                        <span class="form-label">${this._localize('target.distribution_mode_override_label') || 'Color assignment'}</span>
                        <ha-selector
                          .hass=${this.hass}
                          .selector=${{
                            select: {
                              options: this._distributionModeOverrideOptions,
                              mode: 'dropdown',
                            },
                          }}
                          .value=${this._distributionModeOverride}
                          @value-changed=${this._handleDistributionModeOverrideChange}
                        ></ha-selector>
                      </div>
                    `
                  : ''}

                ${this._useCustomBrightness
                  ? html`
                      <div class="brightness-slider">
                        <span class="form-label">${this._localize('target.brightness_override_label') || 'Brightness'}</span>
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
            </ha-expansion-panel>

            <ha-expansion-panel
              outlined
              .expanded=${this._collapsed['override_detection'] === undefined ? false : !this._collapsed['override_detection']}
              @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange('override_detection', e)}
            >
              <div slot="header" class="section-header">
                <div>
                  <div class="section-title">${this._localize('target.override_detection_title')}</div>
                </div>
              </div>
              <div class="section-content controls-content">
                <div class="overrides-grid">
                  <div class="override-item">
                    <span class="form-label">${this._localize('target.ignore_external_changes_label')}</span>
                    <ha-switch
                      .checked=${this._ignoreExternalChanges}
                      @change=${this._handleIgnoreExternalChangesToggle}
                    ></ha-switch>
                  </div>

                  <div class="override-item">
                    <span class="form-label">${this._localize('target.override_control_mode_label')}</span>
                    <ha-selector
                      .hass=${this.hass}
                      .selector=${{
                        select: {
                          options: [
                            { value: 'pause_all', label: this._localize('target.override_mode_pause_all') },
                            { value: 'pause_changed', label: this._localize('target.override_mode_pause_changed') },
                          ],
                          mode: 'dropdown',
                        },
                      }}
                      .value=${this._overrideControlMode}
                      .disabled=${this._ignoreExternalChanges}
                      @value-changed=${this._handleOverrideControlModeChanged}
                    ></ha-selector>
                  </div>

                  <div class="override-item">
                    <span class="form-label">${this._localize('target.bare_turn_on_only_label')}</span>
                    <ha-switch
                      .checked=${this._bareTurnOnOnly}
                      .disabled=${this._ignoreExternalChanges}
                      @change=${this._handleBareTurnOnOnlyToggle}
                    ></ha-switch>
                  </div>

                  <div class="override-item">
                    <span class="form-label">${this._localize('target.detect_non_ha_changes_label')}</span>
                    <ha-switch
                      .checked=${this._detectNonHaChanges}
                      .disabled=${this._ignoreExternalChanges}
                      @change=${this._handleDetectNonHaChangesToggle}
                    ></ha-switch>
                  </div>
                </div>
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

      ${hasSelection && !this._hasIncompatibleLights ? this._renderFavoritesSection(filtered) : ''}

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

      ${filtered.showMusicSync && !this._hasIncompatibleLights
        ? this._renderMusicSyncSection()
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

  private async _handleEditorCancel(): Promise<void> {
    await this._stopActivePreview();
    this._clearEditorDraft(this._activeTab);
    this._resetCurrentEditor();
    this._editingPreset = undefined;
    this._setActiveTab('activate');
  }

  private async _stopActivePreview(): Promise<void> {
    switch (this._activeTab) {
      case 'effects':
        if (this._effectPreviewActive) await this._handleEffectStopPreview();
        break;
      case 'patterns':
        if (this._patternPreviewActive) await this._handlePatternStopPreview();
        break;
      case 'cct':
        if (this._cctPreviewActive) await this._handleCCTStopPreview();
        break;
      case 'segments':
        if (this._segmentSequencePreviewActive) await this._handleSegmentSequenceStopPreview();
        break;
      case 'scenes':
        if (this._scenePreviewActive) await this._handleSceneStopPreview();
        break;
    }
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
          .previewActive=${this._patternPreviewActive}
          @save=${this._handlePatternSave}
          @preview=${this._handlePatternPreview}
          @stop-preview=${this._handlePatternStopPreview}
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
      this._patternPreviewActive = true;
    } catch (err) {
      console.error('Pattern preview service call failed:', err);
    }
  }

  private async _handlePatternStopPreview(): Promise<void> {
    const compatibleEntities = this._getPatternsCompatibleEntities();
    if (!compatibleEntities.length) return;

    await this.hass.callService('aqara_advanced_lighting', 'stop_effect', {
      entity_id: compatibleEntities,
      restore_state: true,
    });
    this._patternPreviewActive = false;
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
    const isAdaptive = (data.mode === 'schedule' && data.schedule_steps) || (data.mode === 'solar' && data.solar_steps);
    const serviceData: Record<string, unknown> = {
      entity_id: compatibleEntities,
      loop_mode: data.loop_mode,
      end_behavior: data.end_behavior,
      skip_first_in_loop: data.skip_first_in_loop || false,
      turn_on: !isAdaptive,
      sync: true,
    };

    // Add loop_count only if loop_mode is 'count'
    if (data.loop_mode === 'count' && data.loop_count !== undefined) {
      serviceData.loop_count = data.loop_count;
    }

    if (data.mode === 'schedule' && data.schedule_steps) {
      serviceData.mode = 'schedule';
      serviceData.schedule_steps = data.schedule_steps;
    } else if (data.mode === 'solar' && data.solar_steps) {
      serviceData.mode = 'solar';
      serviceData.solar_steps = data.solar_steps;
    } else if (data.steps && Array.isArray(data.steps)) {
      // Standard mode: convert steps array to individual step fields
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
      restore_state: true,
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
      restore_state: true,
    });
    this._segmentSequencePreviewActive = false;
  }

  // Dynamic scenes: Any light with color capability (RGB or CCT - backend adapts XY to color_temp)
  private _isScenesCompatible(): boolean {
    if (!this.hass || !this._selectedEntities.length) return false;
    return this._selectedEntities.some(entityId => {
      const entity = this.hass!.states[entityId];
      if (!entity) return false;
      return this._hasRGBColorMode(entity) || this._hasCCTColorMode(entity);
    });
  }

  private _hasCCTColorMode(entity: { attributes: Record<string, unknown> }): boolean {
    const colorModes = entity.attributes.supported_color_modes as string[] | undefined;
    return !!colorModes && Array.isArray(colorModes) && colorModes.includes('color_temp');
  }

  private _getScenesCompatibleEntities(): string[] {
    if (!this.hass) return [];
    return this._selectedEntities.filter(entityId => {
      const entity = this.hass!.states[entityId];
      if (!entity) return false;
      return this._hasRGBColorMode(entity) || this._hasCCTColorMode(entity);
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
      loop_mode: data.loop_mode,
      end_behavior: data.end_behavior,
    };

    // Add offset_delay only if provided and non-zero
    if (data.offset_delay !== undefined && data.offset_delay > 0) {
      serviceData.offset_delay = data.offset_delay;
    }

    // Add loop_count only if loop_mode is 'count'
    if (data.loop_mode === 'count' && data.loop_count !== undefined) {
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
      restore_state: true,
    });
    this._scenePreviewActive = false;
  }

  private _enterSelectMode(): void {
    this._selectedPresetIds = new Set();
    this._isSelectMode = true;
    this._presetEditModeId = null;
  }

  private _exitSelectMode(): void {
    this._isSelectMode = false;
    this._selectedPresetIds = new Set();
  }

  private _togglePresetSelection(id: string): void {
    const next = new Set(this._selectedPresetIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this._selectedPresetIds = next;
  }

  private _getAllPresetIds(): string[] {
    if (!this._userPresets) return [];
    return [
      ...this._userPresets.effect_presets.map(p => p.id),
      ...this._userPresets.segment_pattern_presets.map(p => p.id),
      ...this._userPresets.cct_sequence_presets.map(p => p.id),
      ...this._userPresets.segment_sequence_presets.map(p => p.id),
      ...this._userPresets.dynamic_scene_presets.map(p => p.id),
    ];
  }

  private _isAllSelected(): boolean {
    const all = this._getAllPresetIds();
    return all.length > 0 && all.every(id => this._selectedPresetIds.has(id));
  }

  private _toggleSelectAll(): void {
    if (this._isAllSelected()) {
      this._selectedPresetIds = new Set();
    } else {
      this._selectedPresetIds = new Set(this._getAllPresetIds());
    }
  }

  private async _handleExportSelected(): Promise<void> {
    if (!this._userPresets || this._selectedPresetIds.size === 0) return;
    const exportedCount = this._selectedPresetIds.size;
    try {
      await this._exportPresets([...this._selectedPresetIds]);
      this._exitSelectMode();
      this._showToast(
        this._localize('presets.export_selected_success', {
          count: exportedCount.toString(),
        }),
      );
    } catch (err) {
      this._showToast(this._localize('presets.export_error_network'));
      console.error('Export error:', err);
    }
  }

  private async _handleExportPresets(): Promise<void> {
    this._isExporting = true;
    this.requestUpdate();
    try {
      await this._exportPresets();
      this._showToast(this._localize('presets.export_success'));
    } catch (err) {
      this._showToast(this._localize('presets.export_error_network'));
      console.error('Export error:', err);
    } finally {
      this._isExporting = false;
      this.requestUpdate();
    }
  }

  /**
   * Export presets via a signed backend URL.
   * Uses HA's sign_path WebSocket command to create a temporary
   * authenticated URL, then navigates to it. The Content-Disposition
   * attachment header triggers a download without leaving the page.
   * This works in both desktop browsers and the HA mobile app WebView
   * (which cannot handle blob: URLs).
   */
  private async _exportPresets(presetIds?: string[]): Promise<void> {
    let path = '/api/aqara_advanced_lighting/presets/export';
    if (presetIds?.length) {
      path += `?preset_ids=${encodeURIComponent(presetIds.join(','))}`;
    }

    const result = await this.hass.callWS<{ path: string }>({
      type: 'auth/sign_path',
      path,
    });

    window.location.href = result.path;
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
          ${this._isSelectMode
            ? html`
              <div class="toolbar-actions toolbar-select-mode">
                <ha-button @click=${() => this._exitSelectMode()}>
                  <ha-icon icon="mdi:close" slot="icon"></ha-icon>
                  ${this._localize('presets.select_cancel')}
                </ha-button>
                <ha-button @click=${() => this._toggleSelectAll()}>
                  <ha-icon icon=${this._isAllSelected()
                    ? 'mdi:checkbox-multiple-blank-outline'
                    : 'mdi:checkbox-multiple-outline'} slot="icon"></ha-icon>
                  ${this._isAllSelected()
                    ? this._localize('presets.deselect_all')
                    : this._localize('presets.select_all')}
                </ha-button>
                <ha-button
                  @click=${() => this._handleExportSelected()}
                  .disabled=${this._selectedPresetIds.size === 0}
                >
                  <ha-icon icon="mdi:download" slot="icon"></ha-icon>
                  ${this._localize('presets.export_selected_button', {
                    count: this._selectedPresetIds.size.toString(),
                  })}
                </ha-button>
              </div>
            `
            : html`
              <div class="toolbar-actions">
                <ha-button
                  @click=${this._handleExportPresets}
                  .disabled=${this._isExporting || this._isImporting}
                >
                  <ha-icon icon="mdi:download" slot="icon"></ha-icon>
                  ${this._isExporting
                    ? this._localize('presets.export_progress')
                    : this._localize('presets.export_button')}
                </ha-button>

                <ha-button
                  @click=${this._handleImportClick}
                  .disabled=${this._isExporting || this._isImporting}
                >
                  <ha-icon icon="mdi:upload" slot="icon"></ha-icon>
                  ${this._isImporting
                    ? this._localize('presets.import_progress')
                    : this._localize('presets.import_button')}
                </ha-button>

                <ha-button
                  @click=${() => this._enterSelectMode()}
                  .disabled=${totalCount === 0 || this._isExporting || this._isImporting}
                >
                  <ha-icon icon="mdi:checkbox-multiple-marked-outline" slot="icon"></ha-icon>
                  ${this._localize('presets.select_button')}
                </ha-button>
              </div>
            `}
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
              (presets, opt) => this._sortPresets(presets, opt),
              (p) => this._duplicateUserEffectPreset(p),
            )}

            ${this._renderPresetDeviceSections(
              this._localize('sections.segment_patterns'), 'presets_patterns',
              patternPresets,
              (p) => this._editPatternPreset(p),
              'segment_pattern',
              (p) => this._renderUserPatternIcon(p),
              (presets, opt) => this._sortPresets(presets, opt),
              (p) => this._duplicateUserPatternPreset(p),
            )}

            ${cctPresets.length > 0
              ? this._renderPresetSection(
                  this._localize('sections.cct_sequences'), 'presets_cct',
                  cctPresets,
                  (p) => this._editCCTSequencePreset(p),
                  'cct_sequence',
                  (p) => this._renderUserCCTIcon(p),
                  (presets, opt) => this._sortPresets(presets, opt),
                  (p) => this._duplicateUserCCTSequencePreset(p),
                )
              : ''}

            ${this._renderPresetDeviceSections(
              this._localize('sections.segment_sequences'), 'presets_segments',
              segmentPresets,
              (p) => this._editSegmentSequencePreset(p),
              'segment_sequence',
              (p) => this._renderUserSegmentSequenceIcon(p),
              (presets, opt) => this._sortPresets(presets, opt),
              (p) => this._duplicateUserSegmentSequencePreset(p),
            )}

            ${scenePresets.length > 0
              ? this._renderPresetSection(
                  this._localize('sections.dynamic_scenes'), 'presets_scenes',
                  scenePresets,
                  (p) => this._editDynamicScenePreset(p),
                  'dynamic_scene',
                  (p) => this._renderUserDynamicSceneIcon(p),
                  (presets, opt) => this._sortPresets(presets, opt),
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
  /** Render a single user preset card with action buttons or selection checkbox. */
  private _renderPresetCard<T extends { id: string; name: string }>(
    preset: T,
    onEdit: (preset: T) => void,
    deleteType: string,
    renderIcon: (preset: T) => unknown,
    onDuplicate: (preset: T) => void,
  ) {
    if (this._isSelectMode) {
      const isSelected = this._selectedPresetIds.has(preset.id);
      return html`
        <div
          class="user-preset-card select-mode ${isSelected ? 'selected' : ''}"
          title="${preset.name}"
          aria-label="${preset.name}"
          aria-pressed="${isSelected}"
          @click=${() => this._togglePresetSelection(preset.id)}
        >
          <div class="preset-select-checkbox">
            <ha-icon icon=${isSelected
              ? 'mdi:checkbox-marked'
              : 'mdi:checkbox-blank-outline'}
            ></ha-icon>
          </div>
          <div class="preset-icon">
            ${renderIcon(preset)}
          </div>
          <div class="preset-name">${preset.name}</div>
        </div>
      `;
    }

    const isEditMode = this._presetEditModeId === preset.id;
    return html`
      <div
        class="user-preset-card ${isEditMode ? 'edit-mode' : ''}"
        title="${preset.name}"
        aria-label="${preset.name}"
        @click=${() => { this._presetEditModeId = isEditMode ? null : preset.id; }}
      >
        <div class="preset-card-actions preset-card-actions-left">
          <ha-icon-button
            @click=${(e: Event) => { e.stopPropagation(); onEdit(preset); }}
            title="${this._localize('tooltips.preset_edit')}"
          >
            <ha-icon icon="mdi:pencil"></ha-icon>
          </ha-icon-button>
        </div>
        <div class="preset-card-actions">
          <ha-icon-button
            @click=${(e: Event) => { e.stopPropagation(); onDuplicate(preset); }}
            title="${this._localize('tooltips.preset_duplicate')}"
          >
            <ha-icon icon="mdi:content-copy"></ha-icon>
          </ha-icon-button>
        </div>
        <div class="preset-card-actions preset-card-actions-right">
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
  private _duplicateUserPreset<T extends { id: string; name: string; created_at: string; modified_at: string }>(
    preset: T, type: string, tab: PanelTab
  ): void {
    const copy = { ...preset, id: '', name: `${preset.name} ${this._localize('presets.copy_suffix')}`, created_at: '', modified_at: '' };
    this._clearEditorDraft(tab);
    this._editingPreset = { type, preset: copy as any, isDuplicate: true };
    this._setActiveTab(tab);
  }

  private _duplicateUserEffectPreset(preset: UserEffectPreset): void { this._duplicateUserPreset(preset, 'effect', 'effects'); }
  private _duplicateUserPatternPreset(preset: UserSegmentPatternPreset): void { this._duplicateUserPreset(preset, 'pattern', 'patterns'); }
  private _duplicateUserCCTSequencePreset(preset: UserCCTSequencePreset): void { this._duplicateUserPreset(preset, 'cct', 'cct'); }
  private _duplicateUserSegmentSequencePreset(preset: UserSegmentSequencePreset): void { this._duplicateUserPreset(preset, 'segment', 'segments'); }
  private _duplicateUserDynamicScenePreset(preset: UserDynamicScenePreset): void { this._duplicateUserPreset(preset, 'dynamic_scene', 'scenes'); }

  private _editDynamicScenePreset(preset: UserDynamicScenePreset): void {
    this._clearEditorDraft('scenes');
    this._editingPreset = { type: 'dynamic_scene', preset };
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
    const mode = (preset as any).mode as string | undefined;
    const userPreset: UserCCTSequencePreset = {
      id: '',
      name: `${preset.name} ${this._localize('presets.copy_suffix')}`,
      steps: mode ? [] : (preset.steps || []).map((step) => ({
        ...step,
        brightness: Math.round(step.brightness / 255 * 100),
      })),
      loop_mode: preset.loop_mode,
      loop_count: preset.loop_count,
      end_behavior: preset.end_behavior,
      ...(mode === 'solar' ? { mode: 'solar', solar_steps: ((preset as any).solar_steps || []).map((s: any) => ({
        ...s,
        brightness: Math.round(s.brightness / 255 * 100),
      })) } : {}),
      ...(mode === 'schedule' ? { mode: 'schedule', schedule_steps: ((preset as any).schedule_steps || []).map((s: any) => ({
        ...s,
        brightness: Math.round(s.brightness / 255 * 100),
      })) } : {}),
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

  private get _sortOptions() {
    return [
      { value: 'name-asc', label: this._localize('presets.sort_name_asc') },
      { value: 'name-desc', label: this._localize('presets.sort_name_desc') },
      { value: 'date-new', label: this._localize('presets.sort_date_new') },
      { value: 'date-old', label: this._localize('presets.sort_date_old') },
    ];
  }

  private _renderSortDropdown(sectionId: string) {
    const currentSort = this._getSortPreference(sectionId);
    return html`
      <ha-selector
        class="sort-select"
        .hass=${this.hass}
        .selector=${{
          select: {
            options: this._sortOptions,
            mode: 'dropdown',
          },
        }}
        .value=${currentSort}
        @value-changed=${(e: CustomEvent) => {
          e.stopPropagation();
          if (e.detail.value) {
            this._setSortPreference(sectionId, e.detail.value as PresetSortOption);
          }
        }}
        @click=${(e: Event) => e.stopPropagation()}
      ></ha-selector>
    `;
  }

  /** Render the Favorite Presets section in the Activate tab. Filtered by device capabilities. */
  private _renderFavoritesSection(filtered: FilteredPresets) {
    const resolved = this._getResolvedFavoritePresets();

    // Check if a preset's device type is compatible with the selected targets.
    // Presets with no device type (builtin patterns/sequences, universal user presets) pass.
    const isDeviceCompatible = (dt: string | undefined): boolean => {
      if (!dt) return true;
      switch (dt) {
        case 't2_bulb': return filtered.hasT2;
        case 't1m': case 't1': return filtered.hasT1M;
        case 't1_strip': return filtered.hasT1Strip;
        default: return true;
      }
    };

    // Filter favorites by current device capabilities (same rules as preset sections)
    const compatible = resolved.filter(({ ref, deviceType }) => {
      switch (ref.type) {
        case 'effect': return filtered.showDynamicEffects && isDeviceCompatible(deviceType);
        case 'segment_pattern': return filtered.showSegmentPatterns && isDeviceCompatible(deviceType);
        case 'cct_sequence': return filtered.showCCTSequences;
        case 'segment_sequence': return filtered.showSegmentSequences && isDeviceCompatible(deviceType);
        case 'dynamic_scene': return filtered.showDynamicScenes;
        default: return false;
      }
    });
    if (compatible.length === 0) return '';

    const sectionId = 'favorite_presets';
    const isExpanded = !this._collapsed[sectionId];
    const sortOption = this._getSortPreference(sectionId);
    const sortedFavorites = this._sortResolvedFavorites(compatible, sortOption);

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${isExpanded}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange(sectionId, e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize('sections.favorite_presets')}</div>
            <div class="section-subtitle">${this._localize('sections.subtitle_favorites', { count: compatible.length.toString() })}</div>
          </div>
          <div class="section-header-controls" @click=${(e: Event) => e.stopPropagation()}>
            ${this._renderSortDropdown(sectionId)}
          </div>
        </div>
        <div class="section-content">
          ${sortedFavorites.map(({ ref, preset, isUser }) => {
            const isEditMode = this._presetEditModeId === ref.id;
            return html`
            <div class="preset-button ${isUser ? 'user-preset' : 'builtin-preset'} ${isEditMode ? 'edit-mode' : ''}" role="button" tabindex="0" aria-label="${preset.name}" @click=${() => { if (isEditMode) { this._presetEditModeId = null; } else { this._activateFavoritePreset(ref, preset, isUser); } }} @touchstart=${() => this._handlePresetTouchStart(ref.id)} @touchend=${(e: TouchEvent) => this._handlePresetTouchEnd(e)} @touchmove=${this._handlePresetTouchMove}>
              <div class="preset-card-actions preset-card-actions-left">
                ${this._renderFavoriteStar(ref.type, ref.id)}
              </div>
              <div class="preset-icon">
                ${this._renderFavoritePresetIcon(ref, preset, isUser)}
              </div>
              <div class="preset-name">${preset.name}</div>
            </div>
          `;})}
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
    const sortedUserPresets = this._sortPresets(userPresets, sortOption);
    const sortedBuiltinPresets = this._sortPresets(presets, sortOption);

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
              <div class="preset-button user-preset ${this._presetEditModeId === preset.id ? 'edit-mode' : ''}" role="button" tabindex="0" aria-label="${preset.name}" @click=${() => { if (this._presetEditModeId === preset.id) { this._presetEditModeId = null; } else { this._activateUserEffectPreset(preset); } }} @touchstart=${() => this._handlePresetTouchStart(preset.id)} @touchend=${(e: TouchEvent) => this._handlePresetTouchEnd(e)} @touchmove=${this._handlePresetTouchMove}>
                <div class="preset-card-actions preset-card-actions-left">
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
              <div class="preset-button builtin-preset ${this._presetEditModeId === preset.id ? 'edit-mode' : ''}" role="button" tabindex="0" aria-label="${preset.name}" @click=${() => { if (this._presetEditModeId === preset.id) { this._presetEditModeId = null; } else { this._activateDynamicEffect(preset); } }} @touchstart=${() => this._handlePresetTouchStart(preset.id)} @touchend=${(e: TouchEvent) => this._handlePresetTouchEnd(e)} @touchmove=${this._handlePresetTouchMove}>
                <div class="preset-card-actions preset-card-actions-left">
                  ${this._renderFavoriteStar('effect', preset.id)}
                </div>
                <div class="preset-card-actions">
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

  private _renderMusicSyncSection() {
    const sectionId = 'music_sync';
    const isExpanded = !this._collapsed[sectionId];

    const effects = [
      { id: 'random', icon: 'random.svg' },
      { id: 'blink', icon: 'blink.svg' },
      { id: 'rainbow', icon: 'rainbow.svg' },
      { id: 'wave', icon: 'wave.svg' },
    ];

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${isExpanded}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange(sectionId, e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize('sections.music_sync')}</div>
            <div class="section-subtitle">${this._localize('music_sync.subtitle')}</div>
          </div>
        </div>
        <div class="section-content music-sync-content">
          <div class="music-sync-left">
            <div class="music-sync-toggle">
              <label class="toggle-label">
                <ha-switch
                  .checked=${this._musicSyncEnabled}
                  @change=${this._handleMusicSyncToggle}
                ></ha-switch>
                <span class="control-label">${this._localize('music_sync.enabled_label')}</span>
              </label>
            </div>

            <div class="music-sync-sensitivity-group ${!this._musicSyncEnabled ? 'disabled' : ''}">
              <span class="control-label">${this._localize('music_sync.sensitivity_label')}</span>
              <div class="music-sync-sensitivity">
                <ha-button
                  .disabled=${!this._musicSyncEnabled}
                  @click=${() => this._handleMusicSyncSensitivity('low')}
                  .appearance=${this._musicSyncSensitivity === 'low' ? 'filled' : 'outlined'}
                >${this._localize('music_sync.sensitivity_low')}</ha-button>
                <ha-button
                  .disabled=${!this._musicSyncEnabled}
                  @click=${() => this._handleMusicSyncSensitivity('high')}
                  .appearance=${this._musicSyncSensitivity === 'high' ? 'filled' : 'outlined'}
                >${this._localize('music_sync.sensitivity_high')}</ha-button>
              </div>
            </div>
          </div>

          <div class="music-sync-right ${!this._musicSyncEnabled ? 'disabled' : ''}">
            <span class="control-label">${this._localize('music_sync.effect_label')}</span>
            <div class="music-sync-effects">
              ${effects.map(effect => html`
                <div
                  class="preset-button ${this._musicSyncEffect === effect.id ? 'music-sync-active' : ''} ${!this._musicSyncEnabled ? 'disabled' : ''}"
                  role="button"
                  tabindex="0"
                  aria-label="${this._localize(`music_sync.effect_${effect.id}`)}"
                  aria-disabled="${!this._musicSyncEnabled ? 'true' : 'false'}"
                  @click=${() => this._musicSyncEnabled ? this._handleMusicSyncEffectSelect(effect.id) : null}
                >
                  <div class="preset-icon">
                    <div
                      class="effect-icon"
                      style="
                        -webkit-mask-image: url('/api/aqara_advanced_lighting/icons/${effect.icon}');
                        mask-image: url('/api/aqara_advanced_lighting/icons/${effect.icon}');
                      "
                    ></div>
                  </div>
                  <div class="preset-name">${this._localize(`music_sync.effect_${effect.id}`)}</div>
                </div>
              `)}
            </div>
          </div>
        </div>
      </ha-expansion-panel>
    `;
  }

  private async _handleMusicSyncToggle(e: Event): Promise<void> {
    const enabled = (e.target as HTMLInputElement).checked;
    this._musicSyncEnabled = enabled;

    // Get T1 Strip entities from selection
    const stripEntities = this._selectedEntities.filter(entityId => {
      const dt = this._getEntityDeviceType(entityId);
      return dt === 't1_strip';
    });
    if (stripEntities.length === 0) return;

    await this.hass.callService('aqara_advanced_lighting', 'set_music_sync', {
      entity_id: stripEntities,
      enabled,
      sensitivity: this._musicSyncSensitivity,
      audio_effect: this._musicSyncEffect,
    });
  }

  private async _handleMusicSyncSensitivity(sensitivity: string): Promise<void> {
    this._musicSyncSensitivity = sensitivity;
    if (!this._musicSyncEnabled) return;

    const stripEntities = this._selectedEntities.filter(entityId => {
      const dt = this._getEntityDeviceType(entityId);
      return dt === 't1_strip';
    });
    if (stripEntities.length === 0) return;

    await this.hass.callService('aqara_advanced_lighting', 'set_music_sync', {
      entity_id: stripEntities,
      enabled: true,
      sensitivity,
      audio_effect: this._musicSyncEffect,
    });
  }

  private async _handleMusicSyncEffectSelect(effect: string): Promise<void> {
    this._musicSyncEffect = effect;
    if (!this._musicSyncEnabled) return;

    const stripEntities = this._selectedEntities.filter(entityId => {
      const dt = this._getEntityDeviceType(entityId);
      return dt === 't1_strip';
    });
    if (stripEntities.length === 0) return;

    await this.hass.callService('aqara_advanced_lighting', 'set_music_sync', {
      entity_id: stripEntities,
      enabled: true,
      sensitivity: this._musicSyncSensitivity,
      audio_effect: effect,
    });
  }

  private _renderMusicSyncOp(op: RunningOperation) {
    const entityName = this._getEntityName(op.entity_id!);
    return html`
      <div class="running-op-card">
        <div class="running-op-info">
          <ha-icon class="running-op-icon" icon="mdi:music-note"></ha-icon>
          <div class="running-op-details">
            <span class="running-op-name">${this._localize('music_sync.active_label')}</span>
            <span class="running-op-entity">
              <span class="running-op-type">${this._localize('music_sync.title')}</span>
              <span class="running-op-entity-name">${entityName}</span>
            </span>
          </div>
        </div>
        <div class="running-op-actions">
          <ha-icon-button
            .label=${this._localize('target.stop')}
            @click=${() => this._stopMusicSync(op.entity_id!)}
          >
            <ha-icon icon="mdi:stop"></ha-icon>
          </ha-icon-button>
        </div>
      </div>
    `;
  }

  private async _stopMusicSync(entityId: string): Promise<void> {
    await this.hass.callService('aqara_advanced_lighting', 'set_music_sync', {
      entity_id: [entityId],
      enabled: false,
    });
  }

  private _renderCircadianOp(op: RunningOperation) {
    const entityName = this._getEntityName(op.entity_id!);
    const preset = this._resolvePresetInfo(op.preset_id);
    return html`
      <div class="running-op-card">
        <div class="running-op-info">
          <ha-icon class="running-op-icon" icon="${preset.icon || 'mdi:white-balance-sunny'}"></ha-icon>
          <div class="running-op-details">
            <span class="running-op-name">${preset.name || this._localize('target.circadian_label')}</span>
            <span class="running-op-entity">
              ${preset.name ? html`<span class="running-op-type">${this._localize('target.circadian_label')}</span>` : ''}
              <span class="running-op-entity-name">${entityName}</span>
              ${op.current_color_temp ? html`<span class="running-op-status">${op.current_color_temp}K</span>` : ''}
            </span>
          </div>
        </div>
        <div class="running-op-actions">
          <ha-icon-button
            .label=${this._localize('target.stop')}
            @click=${() => this._stopCircadian(op.entity_id!)}
          >
            <ha-icon icon="mdi:stop"></ha-icon>
          </ha-icon-button>
        </div>
      </div>
    `;
  }

  private async _stopCircadian(entityId: string): Promise<void> {
    await this.hass.callService('aqara_advanced_lighting', 'stop_circadian_mode', {
      entity_id: [entityId],
    });
    await this._loadRunningOperations();
  }

  private _renderSegmentPatternsSection(title: string, builtinPresets: SegmentPatternPreset[], deviceType: string) {
    const sectionId = `segment_pat_${title.toLowerCase().replace(/\s+/g, '_')}`;
    const isExpanded = !this._collapsed[sectionId];
    const userPresets = this._getUserPatternPresetsForDeviceType(deviceType);
    const totalCount = userPresets.length + builtinPresets.length;

    // Apply sorting
    const sortOption = this._getSortPreference(sectionId);
    const sortedUserPresets = this._sortPresets(userPresets, sortOption);
    const sortedBuiltinPresets = this._sortPresets(builtinPresets, sortOption);

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
              <div class="preset-button user-preset ${this._presetEditModeId === preset.id ? 'edit-mode' : ''}" role="button" tabindex="0" aria-label="${preset.name}" @click=${() => { if (this._presetEditModeId === preset.id) { this._presetEditModeId = null; } else { this._activateUserPatternPreset(preset); } }} @touchstart=${() => this._handlePresetTouchStart(preset.id)} @touchend=${(e: TouchEvent) => this._handlePresetTouchEnd(e)} @touchmove=${this._handlePresetTouchMove}>
                <div class="preset-card-actions preset-card-actions-left">
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
              <div class="preset-button builtin-preset ${this._presetEditModeId === preset.id ? 'edit-mode' : ''}" role="button" tabindex="0" aria-label="${preset.name}" @click=${() => { if (this._presetEditModeId === preset.id) { this._presetEditModeId = null; } else { this._activateSegmentPattern(preset); } }} @touchstart=${() => this._handlePresetTouchStart(preset.id)} @touchend=${(e: TouchEvent) => this._handlePresetTouchEnd(e)} @touchmove=${this._handlePresetTouchMove}>
                <div class="preset-card-actions preset-card-actions-left">
                  ${this._renderFavoriteStar('segment_pattern', preset.id)}
                </div>
                <div class="preset-card-actions">
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
    const thumb = renderDynamicSceneThumbnail(preset)
      ?? html`<ha-icon icon="mdi:lamps"></ha-icon>`;
    if (preset.audio_entity) {
      return html`${thumb}<span class="audio-badge"><ha-icon icon="mdi:waveform"></ha-icon></span>`;
    }
    return thumb;
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
    const sortedUserPresets = this._sortPresets(userPresets, sortOption);
    const sortedBuiltinPresets = this._sortPresets(builtinPresets, sortOption);

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
              <div class="preset-button user-preset ${this._presetEditModeId === preset.id ? 'edit-mode' : ''}" role="button" tabindex="0" aria-label="${preset.name}" @click=${() => { if (this._presetEditModeId === preset.id) { this._presetEditModeId = null; } else { this._activateUserCCTSequencePreset(preset); } }} @touchstart=${() => this._handlePresetTouchStart(preset.id)} @touchend=${(e: TouchEvent) => this._handlePresetTouchEnd(e)} @touchmove=${this._handlePresetTouchMove}>
                <div class="preset-card-actions preset-card-actions-left">
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
              <div class="preset-button builtin-preset ${this._presetEditModeId === preset.id ? 'edit-mode' : ''}" role="button" tabindex="0" aria-label="${preset.name}" @click=${() => { if (this._presetEditModeId === preset.id) { this._presetEditModeId = null; } else { this._activateCCTSequence(preset); } }} @touchstart=${() => this._handlePresetTouchStart(preset.id)} @touchend=${(e: TouchEvent) => this._handlePresetTouchEnd(e)} @touchmove=${this._handlePresetTouchMove}>
                <div class="preset-card-actions preset-card-actions-left">
                  ${this._renderFavoriteStar('cct_sequence', preset.id)}
                </div>
                <div class="preset-card-actions">
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
    const sortedUserPresets = this._sortPresets(userPresets, sortOption);
    const sortedBuiltinPresets = this._sortPresets(builtinPresets, sortOption);

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
              <div class="preset-button user-preset ${this._presetEditModeId === preset.id ? 'edit-mode' : ''}" role="button" tabindex="0" aria-label="${preset.name}" @click=${() => { if (this._presetEditModeId === preset.id) { this._presetEditModeId = null; } else { this._activateUserSegmentSequencePreset(preset); } }} @touchstart=${() => this._handlePresetTouchStart(preset.id)} @touchend=${(e: TouchEvent) => this._handlePresetTouchEnd(e)} @touchmove=${this._handlePresetTouchMove}>
                <div class="preset-card-actions preset-card-actions-left">
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
              <div class="preset-button builtin-preset ${this._presetEditModeId === preset.id ? 'edit-mode' : ''}" role="button" tabindex="0" aria-label="${preset.name}" @click=${() => { if (this._presetEditModeId === preset.id) { this._presetEditModeId = null; } else { this._activateSegmentSequence(preset); } }} @touchstart=${() => this._handlePresetTouchStart(preset.id)} @touchend=${(e: TouchEvent) => this._handlePresetTouchEnd(e)} @touchmove=${this._handlePresetTouchMove}>
                <div class="preset-card-actions preset-card-actions-left">
                  ${this._renderFavoriteStar('segment_sequence', preset.id)}
                </div>
                <div class="preset-card-actions">
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
    const sortedUserPresets = this._sortPresets(userPresets, sortOption);
    const sortedBuiltinPresets = this._sortPresets(builtinPresets, sortOption);

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
              <div class="preset-button user-preset ${this._presetEditModeId === preset.id ? 'edit-mode' : ''}" role="button" tabindex="0" aria-label="${preset.name}" @click=${() => { if (this._presetEditModeId === preset.id) { this._presetEditModeId = null; } else { this._activateUserDynamicScenePreset(preset); } }} @touchstart=${() => this._handlePresetTouchStart(preset.id)} @touchend=${(e: TouchEvent) => this._handlePresetTouchEnd(e)} @touchmove=${this._handlePresetTouchMove}>
                <div class="preset-card-actions preset-card-actions-left">
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
              <div class="preset-button builtin-preset ${this._presetEditModeId === preset.id ? 'edit-mode' : ''}" role="button" tabindex="0" aria-label="${preset.name}" @click=${() => { if (this._presetEditModeId === preset.id) { this._presetEditModeId = null; } else { this._activateDynamicScene(preset); } }} @touchstart=${() => this._handlePresetTouchStart(preset.id)} @touchend=${(e: TouchEvent) => this._handlePresetTouchEnd(e)} @touchmove=${this._handlePresetTouchMove}>
                <div class="preset-card-actions preset-card-actions-left">
                  ${this._renderFavoriteStar('dynamic_scene', preset.id)}
                </div>
                <div class="preset-card-actions">
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
    const hasSegmentDevice = deviceTypes.includes('t1m') || deviceTypes.includes('t1_strip');

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

    // Get current values from number entities
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

    // Check if any dimming controls are available (number entities from Z2M or ZHA quirk)
    const hasDimmingEntities = onOffDurationEntity || offOnDurationEntity || dimmingRangeMinEntity || dimmingRangeMaxEntity;

    return html`
      <!-- Zigbee Instances Info Section -->
      <ha-expansion-panel
        outlined
        .expanded=${!this._collapsed['instances']}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange('instances', e)}
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
                <div class="instance-grid">
                  ${this._z2mInstances.map(instance => {
                    const isExpanded = this._instanceDevicesExpanded.has(instance.entry_id);
                    const maxVisible = 5;
                    const visibleDevices = isExpanded ? instance.devices : instance.devices.slice(0, maxVisible);
                    const hiddenCount = instance.devices.length - maxVisible;
                    const isZ2M = instance.backend_type === 'z2m';

                    const typeCounts: Array<{ key: string; count: number }> = [];
                    if (instance.device_counts.t2_rgb > 0) typeCounts.push({ key: 't2_rgb', count: instance.device_counts.t2_rgb });
                    if (instance.device_counts.t2_cct > 0) typeCounts.push({ key: 't2_cct', count: instance.device_counts.t2_cct });
                    if (instance.device_counts.t1m > 0) typeCounts.push({ key: 't1m', count: instance.device_counts.t1m });
                    if (instance.device_counts.t1_strip > 0) typeCounts.push({ key: 't1_strip', count: instance.device_counts.t1_strip });
                    if (instance.device_counts.other > 0) typeCounts.push({ key: 'other', count: instance.device_counts.other });

                    return html`
                      <div class="instance-card">
                        <div class="instance-header">
                          <span class="instance-badge ${isZ2M ? 'instance-badge--z2m' : 'instance-badge--zha'}">
                            ${isZ2M ? 'Z2M' : 'ZHA'}
                          </span>
                          <div class="instance-info">
                            <span class="instance-name">${instance.title}</span>
                            ${isZ2M && instance.z2m_base_topic && instance.title !== instance.z2m_base_topic ? html`
                              <span class="instance-topic">${instance.z2m_base_topic}</span>
                            ` : ''}
                          </div>
                        </div>
                        ${typeCounts.length > 0 ? html`
                          <div class="instance-type-chips">
                            ${typeCounts.map(tc => html`
                              <span class="instance-type-chip">${this._localize('instances.' + tc.key)} x${tc.count}</span>
                            `)}
                          </div>
                        ` : ''}
                        ${instance.devices.length > 0 ? html`
                          <div class="instance-device-chips">
                            ${visibleDevices.map(device => html`
                              <span class="instance-device-chip">${device}</span>
                            `)}
                            ${!isExpanded && hiddenCount > 0 ? html`
                              <span
                                class="instance-device-chip instance-device-chip--more"
                                @click=${() => this._toggleInstanceDevices(instance.entry_id)}
                              >
                                ${this._localize('instances.more_devices', { count: String(hiddenCount) })}
                              </span>
                            ` : ''}
                            ${isExpanded && hiddenCount > 0 ? html`
                              <span
                                class="instance-device-chip instance-device-chip--more"
                                @click=${() => this._toggleInstanceDevices(instance.entry_id)}
                              >
                                ${this._localize('instances.show_less')}
                              </span>
                            ` : ''}
                          </div>
                        ` : ''}
                      </div>
                    `;
                  })}
                </div>
              `}
        </div>
      </ha-expansion-panel>

      <!-- Generic Lights Section -->
      <ha-expansion-panel
        outlined
        .expanded=${this._collapsed['generic_lights'] === undefined ? false : !this._collapsed['generic_lights']}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange('generic_lights', e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize('config.generic_lights_title')}</div>
            <div class="section-subtitle">${this._localize('config.generic_lights_subtitle')}</div>
          </div>
        </div>
        <div class="section-content" style="display: block; padding: 16px;">
          <p style="margin: 0 0 16px 0; font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color);">${this._localize('config.software_transitions_description')}</p>
          <ha-selector
            .hass=${this.hass}
            .selector=${{ entity: { domain: 'light', multiple: true } }}
            .value=${this._softwareTransitionEntities}
            .label=${this._localize('config.software_transitions_label')}
            @value-changed=${this._softwareTransitionEntitiesChanged}
          ></ha-selector>

          <!-- On-device Audio Mode -->
          <div style="margin-top: 24px; border-top: 1px solid var(--divider-color); padding-top: 16px;">
            <p style="margin: 0 0 16px 0; font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color);">${this._localize('config.audio_on_device_description')}</p>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ entity: { domain: 'light' } }}
              .value=${this._audioConfigSelectedEntity}
              .label=${this._localize('config.audio_on_device_title') || 'Use on-device audio mode'}
              @value-changed=${this._audioConfigEntityChanged}
            ></ha-selector>

            ${this._audioConfigSelectedEntity ? html`
              <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 16px;">
                <ha-textfield
                  label="${this._localize('config.audio_on_service_label') || 'Activate service (e.g., light.turn_on)'}"
                  .value=${this._entityAudioConfig[this._audioConfigSelectedEntity]?.audio_on_service || ''}
                  @change=${(e: Event) => this._updateEntityAudioConfig('audio_on_service', (e.target as HTMLInputElement).value)}
                ></ha-textfield>
                <ha-textfield
                  label="${this._localize('config.audio_on_service_data_label') || 'Activate data (JSON)'}"
                  .value=${this._entityAudioConfig[this._audioConfigSelectedEntity]?.audio_on_service_data || ''}
                  @change=${(e: Event) => this._updateEntityAudioConfig('audio_on_service_data', (e.target as HTMLInputElement).value)}
                ></ha-textfield>
                <ha-textfield
                  label="${this._localize('config.audio_off_service_label') || 'Deactivate service'}"
                  .value=${this._entityAudioConfig[this._audioConfigSelectedEntity]?.audio_off_service || ''}
                  @change=${(e: Event) => this._updateEntityAudioConfig('audio_off_service', (e.target as HTMLInputElement).value)}
                ></ha-textfield>
                <ha-textfield
                  label="${this._localize('config.audio_off_service_data_label') || 'Deactivate data (JSON)'}"
                  .value=${this._entityAudioConfig[this._audioConfigSelectedEntity]?.audio_off_service_data || ''}
                  @change=${(e: Event) => this._updateEntityAudioConfig('audio_off_service_data', (e.target as HTMLInputElement).value)}
                ></ha-textfield>
              </div>
            ` : ''}

            ${Object.keys(this._entityAudioConfig).length > 0 ? html`
              <div style="margin-top: 16px; border-top: 1px solid var(--divider-color); padding-top: 12px;">
                <div style="font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color); margin-bottom: 8px;">On-device audio enabled lights</div>
                ${Object.keys(this._entityAudioConfig).map(entityId => html`
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0;">
                    <span
                      style="cursor: pointer; color: var(--primary-text-color); font-size: 14px;"
                      @click=${() => { this._audioConfigSelectedEntity = entityId; }}
                    >${this._getEntityName(entityId)}</span>
                    <ha-icon-button
                      .path=${'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'}
                      @click=${() => this._deleteEntityAudioConfig(entityId)}
                    ></ha-icon-button>
                  </div>
                `)}
              </div>
            ` : ''}
          </div>
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
                              ?disabled=${!transitionCurveEntity || this._applyingCurvature || this._curvatureApplied}
                            >
                              ${this._curvatureApplied
                                ? html`<ha-svg-icon .path=${'M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z'}></ha-svg-icon> ${this._localize('config.curvature_applied_button')}`
                                : this._applyingCurvature
                                  ? this._localize('config.applying_button')
                                  : this._localize('config.apply_button')}
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
                        @value-changed=${(e: CustomEvent) => this._handleOnOffDurationChange(e)}
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
                        @value-changed=${(e: CustomEvent) => this._handleOffOnDurationChange(e)}
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

      ${hasSegmentDevice ? this._renderSegmentZonesSection() : ''}

    `;
  }

  private _softwareTransitionEntitiesChanged(e: CustomEvent): void {
    this._softwareTransitionEntities = e.detail.value || [];
    this._saveGlobalPreferences();
  }

  private _audioConfigEntityChanged(e: CustomEvent): void {
    this._audioConfigSelectedEntity = e.detail.value || '';
  }

  private _updateEntityAudioConfig(field: string, value: string): void {
    const entity = this._audioConfigSelectedEntity;
    if (!entity) return;
    const config = { ...this._entityAudioConfig };
    config[entity] = { ...(config[entity] || {}), [field]: value };
    // Remove entity entry if all fields are empty
    if (Object.values(config[entity]!).every(v => !v)) {
      delete config[entity];
    }
    this._entityAudioConfig = config;
    this._saveGlobalPreferences();
  }

  private _deleteEntityAudioConfig(entityId: string): void {
    const config = { ...this._entityAudioConfig };
    delete config[entityId];
    this._entityAudioConfig = config;
    if (this._audioConfigSelectedEntity === entityId) {
      this._audioConfigSelectedEntity = '';
    }
    this._saveGlobalPreferences();
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

    // Count total zones across all devices for the subtitle
    const totalZones = Array.from(segmentDevices.keys()).reduce(
      (sum, ieee) => sum + (this._zoneEditing.get(ieee) || []).length, 0,
    );
    const deviceCount = segmentDevices.size;
    const zoneSectionId = 'segment_zones';
    const isZonesExpanded = this._collapsed[zoneSectionId] === undefined ? true : !this._collapsed[zoneSectionId];

    return html`
      <ha-expansion-panel
        outlined
        .expanded=${isZonesExpanded}
        @expanded-changed=${(e: CustomEvent) => this._handleExpansionChange(zoneSectionId, e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize('config.segment_zones_title')}</div>
            <div class="section-subtitle">${totalZones > 0
              ? this._localize('config.segment_zones_subtitle_count', { zones: totalZones.toString(), devices: deviceCount.toString() })
              : this._localize('config.segment_zones_subtitle')}</div>
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
                <div class="zone-device-toolbar">
                  <ha-button @click=${() => this._addZoneRow(ieee)}>
                    <ha-icon icon="mdi:plus"></ha-icon>
                    <span class="zone-btn-label">${this._localize('config.zone_add_button')}</span>
                  </ha-button>
                  <div class="toolbar-spacer"></div>
                  ${modified ? html`
                    <span class="zone-unsaved-indicator">
                      <span class="zone-unsaved-dot"></span>
                      ${this._localize('config.zone_unsaved_changes')}
                    </span>
                  ` : ''}
                  <ha-button
                    @click=${() => this._saveZones(ieee, device.segment_count)}
                    ?disabled=${!modified || this._zoneSaving}
                  >
                    <ha-icon icon="mdi:content-save-outline"></ha-icon>
                    <span class="zone-btn-label">${this._localize('config.zone_save_button')}</span>
                  </ha-button>
                </div>
                ${editZones.length === 0
                  ? html`
                    <div class="zone-empty-state">
                      <ha-icon icon="mdi:vector-square-plus"></ha-icon>
                      <span class="zone-empty-title">${this._localize('config.zone_no_zones')}</span>
                      <span class="zone-empty-hint">${this._localize('config.zone_empty_hint')}</span>
                    </div>`
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

    if (brightnessEntities.length) {
      // Z2M path: write via number entities
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
  }

  /**
   * Core helper: find a sibling number entity for a given light entity.
   * Uses multiple strategies to handle different naming conventions across backends:
   *   1. Direct name substitution (Z2M standard naming)
   *   2. Z2M friendly name from backend metadata
   *   3. HA device registry lookup (works for ZHA and any backend)
   *   4. Fuzzy word match (last resort)
   */
  private _findSiblingNumberEntity(lightEntityId: string, suffix: string): string | undefined {
    if (!this.hass) return undefined;

    // Pattern 1: Direct name substitution (works for Z2M standard naming)
    const baseName = lightEntityId.replace('light.', '');
    const directId = `number.${baseName}_${suffix}`;
    if (this.hass.states[directId]) return directId;

    // Pattern 2: Z2M friendly name from backend metadata
    const supportedEntity = this._supportedEntities.get(lightEntityId);
    if (supportedEntity?.z2m_friendly_name) {
      const z2mBase = supportedEntity.z2m_friendly_name.toLowerCase().replace(/\s+/g, '_');
      const z2mId = `number.${z2mBase}_${suffix}`;
      if (this.hass.states[z2mId]) return z2mId;
    }

    // Pattern 3: HA device registry lookup (works for ZHA where entity naming differs)
    if (this.hass.entities) {
      const lightEntry = this.hass.entities[lightEntityId];
      if (lightEntry?.device_id) {
        for (const [eid, entry] of Object.entries(this.hass.entities)) {
          if (
            entry.device_id === lightEntry.device_id &&
            eid.startsWith('number.') &&
            eid.endsWith(`_${suffix}`)
          ) {
            if (this.hass.states[eid]) return eid;
          }
        }
      }
    }

    // Pattern 4: Fuzzy word match (last resort)
    const deviceWords = baseName.toLowerCase().split('_');
    if (deviceWords.length >= 2) {
      for (const eid of Object.keys(this.hass.states)) {
        if (eid.startsWith('number.') && eid.endsWith(`_${suffix}`)) {
          const stateBase = eid.slice(7, eid.length - suffix.length - 1).toLowerCase();
          const stateWords = stateBase.split('_');
          if (stateWords.length >= 2 &&
              deviceWords[0] === stateWords[0] && deviceWords[1] === stateWords[1]) {
            return eid;
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Find sibling number entities for multiple light entities.
   * Returns unique results only.
   */
  private _findAllSiblingNumberEntities(lightEntityIds: string[], suffix: string): string[] {
    if (!this.hass) return [];
    const results: string[] = [];
    for (const lightId of lightEntityIds) {
      const found = this._findSiblingNumberEntity(lightId, suffix);
      if (found && !results.includes(found)) {
        results.push(found);
      }
    }
    return results;
  }

  private _findTransitionCurveEntity(): string | undefined {
    const t2Entities = this._getT2CompatibleEntities();
    for (const eid of t2Entities) {
      const found = this._findSiblingNumberEntity(eid, 'transition_curve_curvature');
      if (found) return found;
    }
    return undefined;
  }

  private _findInitialBrightnessEntity(): string | undefined {
    const t2Entities = this._getT2CompatibleEntities();
    for (const eid of t2Entities) {
      const found = this._findSiblingNumberEntity(eid, 'transition_initial_brightness');
      if (found) return found;
    }
    return undefined;
  }

  private _findAllTransitionCurveEntities(): string[] {
    return this._findAllSiblingNumberEntities(this._getT2CompatibleEntities(), 'transition_curve_curvature');
  }

  private _findAllInitialBrightnessEntities(): string[] {
    return this._findAllSiblingNumberEntities(this._getT2CompatibleEntities(), 'transition_initial_brightness');
  }

  private _findAllDimmingEntities(suffix: string): string[] {
    return this._findAllSiblingNumberEntities(this._selectedEntities, suffix);
  }

  private _findDimmingEntity(suffix: string): string | undefined {
    for (const eid of this._selectedEntities) {
      if (!this.hass?.states[eid]) continue;
      const found = this._findSiblingNumberEntity(eid, suffix);
      if (found) return found;
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
    ...suffixes: string[]
  ): Promise<void> {
    if (!this.hass) return;

    const value = e.detail.value;
    if (typeof value !== 'number') return;

    // Find all entities across all suffixes
    const entities: string[] = [];
    for (const suffix of suffixes) {
      for (const eid of this._findAllDimmingEntities(suffix)) {
        if (!entities.includes(eid)) entities.push(eid);
      }
    }
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

    // Get current max value from entity
    const maxValue = maxEntityId && this.hass.states[maxEntityId]
      ? parseFloat(this.hass.states[maxEntityId].state) || 100
      : 100;

    // Validate: min cannot exceed max
    if (newMin >= maxValue) {
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

    // Get current min value from entity
    const minValue = minEntityId && this.hass.states[minEntityId]
      ? parseFloat(this.hass.states[minEntityId].state) || 1
      : 1;

    // Validate: max cannot be less than min
    if (newMax <= minValue) {
      return;
    }

    await this._handleDimmingSettingChange(e, 'dimming_range_maximum');
  }

  private async _handleOnOffDurationChange(e: CustomEvent): Promise<void> {
    const entity = this._findOnOffDurationEntity();
    if (!this.hass || !entity) return;

    await this._handleDimmingSettingChange(e, 'on_off_duration');
  }

  private async _handleOffOnDurationChange(e: CustomEvent): Promise<void> {
    const entity = this._findOffOnDurationEntity();
    if (!this.hass || !entity) return;

    await this._handleDimmingSettingChange(e, 'off_on_duration');
  }

  // T1 Strip specific methods
  private _getT1StripCompatibleEntities(): string[] {
    if (!this.hass) return [];
    return this._selectedEntities.filter(entityId => {
      return this._getEntityDeviceType(entityId) === 't1_strip';
    });
  }

  private _findT1StripLengthEntity(): string | undefined {
    const t1StripEntities = this._getT1StripCompatibleEntities();
    for (const eid of t1StripEntities) {
      const found = this._findSiblingNumberEntity(eid, 'length');
      if (found) return found;
    }
    return undefined;
  }

  private _findAllT1StripLengthEntities(): string[] {
    return this._findAllSiblingNumberEntities(this._getT1StripCompatibleEntities(), 'length');
  }

  private async _handleT1StripLengthChange(e: CustomEvent): Promise<void> {
    if (!this.hass) return;

    const value = e.detail.value;
    if (typeof value !== 'number') return;

    const entities = this._findAllT1StripLengthEntities();

    if (entities.length) {
      // Z2M path: write via number entities
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

    this._applyingCurvature = true;

    try {
      const entities = this._findAllTransitionCurveEntities();

      if (entities.length) {
        // Z2M path: write via number entities
        await Promise.all(
          entities.map(entityId =>
            this.hass!.callService('number', 'set_value', {
              entity_id: entityId,
              value: this._localCurvature,
            })
          )
        );
      }

      this._curvatureApplied = true;
      this._showToast(this._localize('config.curvature_applied'));
      setTimeout(() => {
        this._curvatureApplied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to set transition curve curvature:', err);
      this._showToast(this._localize('config.curvature_apply_error'));
    } finally {
      this._applyingCurvature = false;
    }
  }

  private _loadCurvatureFromEntity(): void {
    const entityId = this._findTransitionCurveEntity();
    if (this.hass && entityId) {
      const entity = this.hass.states[entityId];
      if (entity) {
        const curvature = parseFloat(entity.state);
        if (!isNaN(curvature) && curvature >= 0.2 && curvature <= 6.0) {
          this._localCurvature = Math.round(curvature * 100) / 100;
          return;
        }
      }
    }

  }

}

declare global {
  interface HTMLElementTagNameMap {
    'aqara-advanced-lighting-panel': AqaraPanel;
  }
}
