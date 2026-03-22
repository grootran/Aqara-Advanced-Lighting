/**
 * Aqara Preset Favorites — Lovelace Dashboard Card
 *
 * Displays the user's favorited presets filtered by a configured entity's
 * device type, and activates them on tap using existing service calls.
 */

import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type {
  HomeAssistant,
  FavoritePresetRef,
  AnyPreset,
  PresetsData,
  UserPresetsData,
  UserPreferences,
  DynamicEffectPreset,
  SegmentPatternPreset,
  CCTSequencePreset,
  SegmentSequencePreset,
  DynamicScenePreset,
  UserEffectPreset,
  UserSegmentPatternPreset,
  UserCCTSequencePreset,
  UserSegmentSequencePreset,
  UserDynamicScenePreset,
} from './types';

import {
  renderEffectThumbnail,
  renderSegmentPatternThumbnail,
  renderCCTSequenceThumbnail,
  renderSegmentSequenceThumbnail,
  renderDynamicSceneThumbnail,
} from './preset-thumbnails';

// ---------------------------------------------------------------------------
// Config interface
// ---------------------------------------------------------------------------

interface AqaraFavoritesCardConfig {
  type: string;
  entity?: string;            // single entity (legacy/simple)
  entities?: string[];        // multiple entities
  title?: string;
  columns?: number;
  compact?: boolean;
  show_names?: boolean;
  show_stop_button?: boolean;
  highlight_user_presets?: boolean;
}

// ---------------------------------------------------------------------------
// Supported entity info (subset of what the API returns)
// ---------------------------------------------------------------------------

interface SupportedEntityInfo {
  device_type: string;
  model_id: string;
}

// ---------------------------------------------------------------------------
// Resolved favorite — a ref paired with its actual preset data
// ---------------------------------------------------------------------------

interface ResolvedFavorite {
  ref: FavoritePresetRef;
  preset: AnyPreset;
  isUser: boolean;
  deviceType?: string;
}

// ---------------------------------------------------------------------------
// Card Editor
// ---------------------------------------------------------------------------

@customElement('aqara-preset-favorites-card-editor')
export class AqaraPresetFavoritesCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: AqaraFavoritesCardConfig;

  public setConfig(config: AqaraFavoritesCardConfig): void {
    this._config = { ...config };
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) return html``;

    return html`
      <div class="editor">
        <ha-selector
          .hass=${this.hass}
          .label=${'Entities'}
          .selector=${{ entity: { domain: 'light', multiple: true } }}
          .value=${this._config.entities || (this._config.entity ? [this._config.entity] : [])}
          .required=${true}
          @value-changed=${(e: CustomEvent) => {
            const val = e.detail.value as string[];
            // Store as entities array, clear legacy single entity
            this._updateConfig('entities', val?.length ? val : undefined);
            if (this._config!.entity) this._updateConfig('entity', undefined);
          }}
        ></ha-selector>
        <ha-textfield
          .label=${'Title'}
          .value=${this._config.title || ''}
          @input=${(e: InputEvent) => this._updateConfig('title', (e.target as HTMLInputElement).value)}
        ></ha-textfield>
        <ha-textfield
          .label=${'Columns (0 = auto)'}
          type="number"
          min="0"
          max="6"
          .value=${String(this._config.columns || 0)}
          @input=${(e: InputEvent) => {
            const val = parseInt((e.target as HTMLInputElement).value, 10);
            this._updateConfig('columns', isNaN(val) || val <= 0 ? undefined : val);
          }}
        ></ha-textfield>
        <ha-formfield .label=${'Compact mode'}>
          <ha-switch
            .checked=${this._config.compact || false}
            @change=${(e: Event) => this._updateConfig('compact', (e.target as HTMLInputElement).checked || undefined)}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield .label=${'Show preset names'}>
          <ha-switch
            .checked=${this._config.show_names !== false}
            @change=${(e: Event) => this._updateConfig('show_names', (e.target as HTMLInputElement).checked ? undefined : false)}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield .label=${'Show stop button'}>
          <ha-switch
            .checked=${this._config.show_stop_button || false}
            @change=${(e: Event) => this._updateConfig('show_stop_button', (e.target as HTMLInputElement).checked || undefined)}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield .label=${'Highlight user presets'}>
          <ha-switch
            .checked=${this._config.highlight_user_presets !== false}
            @change=${(e: Event) => this._updateConfig('highlight_user_presets', (e.target as HTMLInputElement).checked ? undefined : false)}
          ></ha-switch>
        </ha-formfield>
      </div>
    `;
  }

  private _updateConfig(key: string, value: unknown): void {
    if (!this._config) return;
    const newConfig = { ...this._config, [key]: value };
    // Remove undefined keys (but keep empty string for title — means "no title")
    if (value === undefined || (value === '' && key !== 'title')) {
      delete (newConfig as Record<string, unknown>)[key];
    }
    this._config = newConfig;
    this.dispatchEvent(
      new CustomEvent('config-changed', { detail: { config: newConfig } })
    );
  }

  static styles = css`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
    }
  `;
}

// ---------------------------------------------------------------------------
// Card Component
// ---------------------------------------------------------------------------

@customElement('aqara-preset-favorites-card')
export class AqaraPresetFavoritesCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _config?: AqaraFavoritesCardConfig;
  @state() private _presets?: PresetsData;
  @state() private _userPresets?: UserPresetsData;
  @state() private _favoriteRefs: FavoritePresetRef[] = [];
  @state() private _supportedEntities = new Map<string, SupportedEntityInfo>();
  @state() private _loading = true;
  @state() private _error?: string;
  @state() private _activating?: string;
  @state() private _stopping = false;
  /** Maps preset ref.id to operation type for currently running presets. */
  @state() private _activePresets = new Map<string, string>();

  private _dataLoaded = false;
  private _hassConnected = false;
  private _pollTimer?: ReturnType<typeof setInterval>;

  // -- Lovelace card API --------------------------------------------------

  public setConfig(config: AqaraFavoritesCardConfig): void {
    if (!config.entity && (!config.entities || config.entities.length === 0)) {
      throw new Error('At least one entity is required');
    }
    this._config = config;
  }

  /** Get the configured entity list, supporting both single and multi formats. */
  private _getEntityIds(): string[] {
    if (this._config?.entities?.length) return this._config.entities;
    if (this._config?.entity) return [this._config.entity];
    return [];
  }

  public getCardSize(): number {
    return 3;
  }

  static getConfigElement(): HTMLElement {
    return document.createElement('aqara-preset-favorites-card-editor');
  }

  static getStubConfig(): Record<string, unknown> {
    return { entity: '', title: 'Favorite Presets' };
  }

  // -- Lifecycle -----------------------------------------------------------

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has('hass') && this.hass) {
      const wasConnected = this._hassConnected;
      this._hassConnected = true;
      // Load on first hass, or reload if hass was lost and came back
      if (!this._dataLoaded || !wasConnected) {
        this._loadData();
        this._startPolling();
      }
    }
    if (changedProps.has('hass') && !this.hass) {
      this._hassConnected = false;
      this._stopPolling();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stopPolling();
  }

  private _startPolling(): void {
    this._stopPolling();
    // Poll running operations every 5 seconds to track active presets
    this._pollRunningOperations();
    this._pollTimer = setInterval(() => this._pollRunningOperations(), 5000);
  }

  private _stopPolling(): void {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = undefined;
    }
  }

  /** Fetch running operations and update _activePresets map. */
  private async _pollRunningOperations(): Promise<void> {
    if (!this.hass) return;
    try {
      const resp = await this.hass.callApi<{ operations: Array<{ type: string; entity_id: string; preset_id?: string }> }>(
        'GET', 'aqara_advanced_lighting/running_operations'
      );
      const entityIds = new Set(this._getEntityIds());
      const active = new Map<string, string>();
      for (const op of resp.operations || []) {
        if (op.preset_id && entityIds.has(op.entity_id)) {
          active.set(op.preset_id, op.type);
        }
      }
      this._activePresets = active;
    } catch {
      // Silently ignore poll failures — card stays functional
    }
  }

  // -- Data loading --------------------------------------------------------

  private async _loadData(): Promise<void> {
    if (!this.hass) return;
    this._loading = true;
    this._error = undefined;

    try {
      const [presetsResp, userPresetsResp, prefsResp, entitiesResp] = await Promise.all([
        this._fetchPresetsData(),
        this.hass.callApi<UserPresetsData>('GET', 'aqara_advanced_lighting/user_presets'),
        this.hass.callApi<UserPreferences>('GET', 'aqara_advanced_lighting/user_preferences'),
        this.hass.callApi<{ entities: Array<{ entity_id: string; device_type: string; model_id: string }> }>(
          'GET', 'aqara_advanced_lighting/supported_entities'
        ),
      ]);

      this._presets = presetsResp;
      this._userPresets = userPresetsResp;
      this._favoriteRefs = prefsResp.favorite_presets || [];

      const entityMap = new Map<string, SupportedEntityInfo>();
      for (const entity of entitiesResp.entities || []) {
        entityMap.set(entity.entity_id, {
          device_type: entity.device_type,
          model_id: entity.model_id,
        });
      }
      this._supportedEntities = entityMap;
      this._dataLoaded = true;
    } catch (err) {
      this._error = 'Failed to load preset data';
      console.error('AqaraFavoritesCard: data load failed', err);
    } finally {
      this._loading = false;
    }
  }

  /**
   * Fetch built-in presets data. This endpoint does not require auth,
   * so we use fetchWithAuth (which adds the token anyway) rather than
   * callApi (which expects JSON-wrapped response keyed differently).
   */
  private async _fetchPresetsData(): Promise<PresetsData> {
    const resp = await this.hass.fetchWithAuth('/api/aqara_advanced_lighting/presets');
    if (!resp.ok) throw new Error(`Presets fetch failed: ${resp.status}`);
    return resp.json() as Promise<PresetsData>;
  }

  // -- Device type + compatibility -----------------------------------------

  /** Get the set of device types across all configured entities. */
  private _getSelectedDeviceTypes(): string[] {
    const entityIds = this._getEntityIds();
    const types: string[] = [];
    for (const id of entityIds) {
      const dt = this._supportedEntities.get(id)?.device_type;
      if (dt && !types.includes(dt)) types.push(dt);
    }
    return types;
  }

  /**
   * Determine if a preset is compatible with the configured entities.
   * Mirrors the panel's _filterPresets() at aqara-panel.ts:1930-1968
   * and the isDeviceCompatible() closure at aqara-panel.ts:5242-5250.
   */
  private _isPresetCompatible(
    ref: FavoritePresetRef,
    deviceTypes: string[],
    presetDeviceType?: string,
  ): boolean {
    if (deviceTypes.length === 0) {
      // Unknown entities: only show universal preset types
      return ref.type === 'cct_sequence' || ref.type === 'dynamic_scene';
    }

    // Device capability flags (same logic as _filterPresets)
    const hasT2 = deviceTypes.includes('t2_bulb');
    const hasT1M = deviceTypes.includes('t1m');
    const hasT1Strip = deviceTypes.includes('t1_strip');
    const hasGenericRGB = deviceTypes.includes('generic_rgb');
    const hasT2CCT = deviceTypes.includes('t2_cct');
    const hasT1MWhite = deviceTypes.includes('t1m_white');
    const hasGenericCCT = deviceTypes.includes('generic_cct');

    const isRGB = hasT2 || hasT1M || hasT1Strip || hasGenericRGB;
    const isSegment = hasT1M || hasT1Strip;
    const hasCCT = hasT2 || hasT2CCT || hasT1MWhite || hasT1Strip || hasGenericRGB || hasGenericCCT;

    // Check device-specific preset compatibility
    const isDeviceCompatible = (dt: string | undefined): boolean => {
      if (!dt) return true;
      switch (dt) {
        case 't2_bulb': return hasT2;
        case 't1m': case 't1': return hasT1M;
        case 't1_strip': return hasT1Strip;
        default: return true;
      }
    };

    switch (ref.type) {
      case 'effect':
        return isRGB && isDeviceCompatible(presetDeviceType);
      case 'segment_pattern':
        return isSegment && isDeviceCompatible(presetDeviceType);
      case 'cct_sequence':
        return hasCCT;
      case 'segment_sequence':
        return isSegment && isDeviceCompatible(presetDeviceType);
      case 'dynamic_scene':
        return isRGB;
      default:
        return false;
    }
  }

  // -- Favorite resolution -------------------------------------------------

  /**
   * Resolve FavoritePresetRef[] into actual preset objects.
   * Mirrors aqara-panel.ts:574-644 (_getResolvedFavoritePresets).
   */
  private _resolvedFavorites(): ResolvedFavorite[] {
    if (!this._presets || !this._userPresets) return [];

    const deviceTypes = this._getSelectedDeviceTypes();
    const resolved: ResolvedFavorite[] = [];

    for (const ref of this._favoriteRefs) {
      let preset: AnyPreset | null = null;
      let isUser = false;
      let deviceType: string | undefined;

      switch (ref.type) {
        case 'effect': {
          for (const key of ['t2_bulb', 't1m', 't1_strip'] as const) {
            const found = this._presets.dynamic_effects?.[key]?.find(p => p.id === ref.id);
            if (found) { preset = found; deviceType = key; break; }
          }
          if (!preset) {
            const userPreset = this._userPresets.effect_presets?.find(p => p.id === ref.id);
            if (userPreset) { preset = userPreset; isUser = true; deviceType = userPreset.device_type; }
          }
          break;
        }
        case 'segment_pattern': {
          preset = this._presets.segment_patterns?.find(p => p.id === ref.id) || null;
          if (!preset) {
            const userPreset = this._userPresets.segment_pattern_presets?.find(p => p.id === ref.id);
            if (userPreset) { preset = userPreset; isUser = true; deviceType = userPreset.device_type; }
          }
          break;
        }
        case 'cct_sequence': {
          preset = this._presets.cct_sequences?.find(p => p.id === ref.id) || null;
          if (!preset) {
            preset = this._userPresets.cct_sequence_presets?.find(p => p.id === ref.id) || null;
            if (preset) isUser = true;
          }
          break;
        }
        case 'segment_sequence': {
          preset = this._presets.segment_sequences?.find(p => p.id === ref.id) || null;
          if (!preset) {
            const userPreset = this._userPresets.segment_sequence_presets?.find(p => p.id === ref.id);
            if (userPreset) { preset = userPreset; isUser = true; deviceType = userPreset.device_type; }
          }
          break;
        }
        case 'dynamic_scene': {
          preset = this._presets.dynamic_scenes?.find(p => p.id === ref.id) || null;
          if (!preset) {
            preset = this._userPresets.dynamic_scene_presets?.find(p => p.id === ref.id) || null;
            if (preset) isUser = true;
          }
          break;
        }
      }

      if (preset && this._isPresetCompatible(ref, deviceTypes, deviceType)) {
        resolved.push({ ref, preset, isUser, deviceType });
      }
    }

    return resolved;
  }

  // -- Preset activation ---------------------------------------------------

  /**
   * Activate a preset by dispatching to the appropriate service call.
   * Mirrors aqara-panel.ts:648-686 (_activateFavoritePreset) and the
   * individual _activate* methods at lines 2240-3245.
   *
   * The card does NOT apply panel overrides (custom brightness, audio
   * override, static scene mode, distribution mode override). It activates
   * presets as-configured.
   */
  private async _activatePreset(ref: FavoritePresetRef, preset: AnyPreset, isUser: boolean): Promise<void> {
    const entityIds = this._getEntityIds();
    if (entityIds.length === 0) return;

    // Toggle: if this preset is already active, stop it instead
    if (this._activePresets.has(ref.id)) {
      await this._stopAll();
      return;
    }

    this._activating = ref.id;
    try {
      switch (ref.type) {
        case 'effect':
          if (isUser) {
            await this._activateUserEffect(entityIds, preset as UserEffectPreset);
          } else {
            await this._activateBuiltinEffect(entityIds, preset as DynamicEffectPreset);
          }
          break;
        case 'segment_pattern':
          if (isUser) {
            await this._activateUserPattern(entityIds, preset as UserSegmentPatternPreset);
          } else {
            await this._activateBuiltinPattern(entityIds, preset as SegmentPatternPreset);
          }
          break;
        case 'cct_sequence':
          if (isUser) {
            await this._activateUserCCTSequence(entityIds, preset as UserCCTSequencePreset);
          } else {
            await this._activateBuiltinCCTSequence(entityIds, preset as CCTSequencePreset);
          }
          break;
        case 'segment_sequence':
          if (isUser) {
            await this._activateUserSegmentSequence(entityIds, preset as UserSegmentSequencePreset);
          } else {
            await this._activateBuiltinSegmentSequence(entityIds, preset as SegmentSequencePreset);
          }
          break;
        case 'dynamic_scene':
          if (isUser) {
            await this._activateUserDynamicScene(entityIds, preset as UserDynamicScenePreset);
          } else {
            await this._activateBuiltinDynamicScene(entityIds, preset as DynamicScenePreset);
          }
          break;
      }
    } catch (err) {
      console.error('AqaraFavoritesCard: activation failed', err);
    } finally {
      this._activating = undefined;
      // Refresh active state immediately after activation
      this._pollRunningOperations();
    }
  }

  // -- Builtin activation (aqara-panel.ts:2240-2299) -----------------------

  private async _activateBuiltinEffect(entityIds: string[], preset: DynamicEffectPreset): Promise<void> {
    await this.hass.callService('aqara_advanced_lighting', 'set_dynamic_effect', {
      entity_id: entityIds,
      preset: preset.id,
      turn_on: true,
      sync: true,
    });
  }

  private async _activateBuiltinPattern(entityIds: string[], preset: SegmentPatternPreset): Promise<void> {
    await this.hass.callService('aqara_advanced_lighting', 'set_segment_pattern', {
      entity_id: entityIds,
      preset: preset.id,
      turn_on: true,
      sync: true,
    });
  }

  private async _activateBuiltinCCTSequence(entityIds: string[], preset: CCTSequencePreset): Promise<void> {
    const isAdaptive = preset.mode === 'solar' || preset.mode === 'schedule';
    await this.hass.callService('aqara_advanced_lighting', 'start_cct_sequence', {
      entity_id: entityIds,
      preset: preset.id,
      ...(!isAdaptive && { turn_on: true }),
      sync: true,
    });
  }

  private async _activateBuiltinSegmentSequence(entityIds: string[], preset: SegmentSequencePreset): Promise<void> {
    await this.hass.callService('aqara_advanced_lighting', 'start_segment_sequence', {
      entity_id: entityIds,
      preset: preset.id,
      turn_on: true,
      sync: true,
    });
  }

  private async _activateBuiltinDynamicScene(entityIds: string[], preset: DynamicScenePreset): Promise<void> {
    const serviceData: Record<string, unknown> = {
      entity_id: entityIds,
      scene_name: preset.name,
      transition_time: preset.transition_time,
      hold_time: preset.hold_time,
      distribution_mode: preset.distribution_mode,
      random_order: preset.random_order,
      loop_mode: preset.loop_mode,
      end_behavior: preset.end_behavior,
      colors: preset.colors.map(c => ({ x: c.x, y: c.y, brightness_pct: c.brightness_pct })),
    };
    if (preset.offset_delay !== undefined && preset.offset_delay > 0) {
      serviceData.offset_delay = preset.offset_delay;
    }
    if (preset.loop_mode === 'count' && preset.loop_count !== undefined) {
      serviceData.loop_count = preset.loop_count;
    }
    await this.hass.callService('aqara_advanced_lighting', 'start_dynamic_scene', serviceData);
  }

  // -- User preset activation (aqara-panel.ts:3017-3245) -------------------

  private async _activateUserEffect(entityIds: string[], preset: UserEffectPreset): Promise<void> {
    const serviceData: Record<string, unknown> = {
      entity_id: entityIds,
      effect: preset.effect,
      speed: preset.effect_speed,
      preset: preset.name,
      turn_on: true,
      sync: true,
    };
    preset.effect_colors.forEach((c, i) => {
      if (i < 8) serviceData[`color_${i + 1}`] = { x: c.x, y: c.y };
    });
    if (preset.effect_brightness !== undefined) {
      serviceData.brightness = preset.effect_brightness;
    }
    if (preset.effect_segments) {
      serviceData.segments = preset.effect_segments;
    }
    await this.hass.callService('aqara_advanced_lighting', 'set_dynamic_effect', serviceData);
  }

  private async _activateUserPattern(entityIds: string[], preset: UserSegmentPatternPreset): Promise<void> {
    if (!preset.segments?.length) return;
    const segment_colors = preset.segments
      .filter(s => s?.color)
      .map(s => ({ segment: s.segment, color: { r: s.color.r, g: s.color.g, b: s.color.b } }));
    if (segment_colors.length === 0) return;

    await this.hass.callService('aqara_advanced_lighting', 'set_segment_pattern', {
      entity_id: entityIds,
      segment_colors,
      preset: preset.name,
      turn_on: true,
      sync: true,
      turn_off_unspecified: true,
    });
  }

  private async _activateUserCCTSequence(entityIds: string[], preset: UserCCTSequencePreset): Promise<void> {
    // Adaptive presets are resolved by name on the backend
    if (preset.mode === 'solar' || preset.mode === 'schedule') {
      await this.hass.callService('aqara_advanced_lighting', 'start_cct_sequence', {
        entity_id: entityIds,
        preset: preset.name,
        sync: true,
      });
      return;
    }

    const serviceData: Record<string, unknown> = {
      entity_id: entityIds,
      preset: preset.name,
      loop_mode: preset.loop_mode,
      end_behavior: preset.end_behavior,
      turn_on: true,
      sync: true,
    };
    if (preset.loop_mode === 'count' && preset.loop_count !== undefined) {
      serviceData.loop_count = preset.loop_count;
    }
    preset.steps.forEach((step, i) => {
      const n = i + 1;
      if (n <= 20) {
        serviceData[`step_${n}_color_temp`] = step.color_temp;
        serviceData[`step_${n}_brightness`] = step.brightness;
        serviceData[`step_${n}_transition`] = step.transition;
        serviceData[`step_${n}_hold`] = step.hold;
      }
    });
    await this.hass.callService('aqara_advanced_lighting', 'start_cct_sequence', serviceData);
  }

  private async _activateUserSegmentSequence(entityIds: string[], preset: UserSegmentSequencePreset): Promise<void> {
    const serviceData: Record<string, unknown> = {
      entity_id: entityIds,
      preset: preset.name,
      loop_mode: preset.loop_mode,
      end_behavior: preset.end_behavior,
      turn_on: true,
      sync: true,
    };
    if (preset.loop_mode === 'count' && preset.loop_count !== undefined) {
      serviceData.loop_count = preset.loop_count;
    }
    preset.steps.forEach((step, i) => {
      const n = i + 1;
      if (n <= 20) {
        serviceData[`step_${n}_segments`] = step.segments;
        serviceData[`step_${n}_mode`] = step.mode;
        serviceData[`step_${n}_duration`] = step.duration;
        serviceData[`step_${n}_hold`] = step.hold;
        serviceData[`step_${n}_activation_pattern`] = step.activation_pattern;
        if (step.colors?.length) {
          step.colors.forEach((color: number[], ci: number) => {
            if (ci < 6) serviceData[`step_${n}_color_${ci + 1}`] = color;
          });
        }
      }
    });
    await this.hass.callService('aqara_advanced_lighting', 'start_segment_sequence', serviceData);
  }

  private async _activateUserDynamicScene(entityIds: string[], preset: UserDynamicScenePreset): Promise<void> {
    const serviceData: Record<string, unknown> = {
      entity_id: entityIds,
      scene_name: preset.name,
      transition_time: preset.transition_time,
      hold_time: preset.hold_time,
      distribution_mode: preset.distribution_mode,
      random_order: preset.random_order,
      loop_mode: preset.loop_mode,
      end_behavior: preset.end_behavior,
      colors: preset.colors.map(c => ({ x: c.x, y: c.y, brightness_pct: c.brightness_pct })),
    };
    if (preset.offset_delay !== undefined && preset.offset_delay > 0) {
      serviceData.offset_delay = preset.offset_delay;
    }
    if (preset.loop_mode === 'count' && preset.loop_count !== undefined) {
      serviceData.loop_count = preset.loop_count;
    }
    // Pass through preset-level audio settings (no panel override in card context)
    if (preset.audio_entity) {
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
  }

  // -- Stop all -------------------------------------------------------------

  /** Stop all running operations on the configured entities and restore state. */
  private async _stopAll(): Promise<void> {
    const entityIds = this._getEntityIds();
    if (entityIds.length === 0) return;

    this._stopping = true;
    try {
      await Promise.allSettled([
        this.hass.callService('aqara_advanced_lighting', 'stop_effect', {
          entity_id: entityIds, restore_state: true,
        }),
        this.hass.callService('aqara_advanced_lighting', 'stop_cct_sequence', {
          entity_id: entityIds, restore_state: true,
        }),
        this.hass.callService('aqara_advanced_lighting', 'stop_segment_sequence', {
          entity_id: entityIds,
        }),
        this.hass.callService('aqara_advanced_lighting', 'stop_dynamic_scene', {
          entity_id: entityIds, restore_state: true,
        }),
      ]);
    } catch (err) {
      console.error('AqaraFavoritesCard: stop failed', err);
    } finally {
      this._stopping = false;
      this._activePresets = new Map();
      this._pollRunningOperations();
    }
  }

  // -- Icon rendering ------------------------------------------------------

  /**
   * Render preset icon/thumbnail. Mirrors aqara-panel.ts:688-703
   * (_renderFavoritePresetIcon) and the individual icon methods at
   * lines 5642-5709.
   */
  private _renderPresetIcon(ref: FavoritePresetRef, preset: AnyPreset, isUser: boolean): TemplateResult {
    // Helper for builtin icons (MDI or custom file)
    const builtinIcon = (icon: string | undefined, fallback: string) => {
      if (!icon) return html`<ha-icon icon="${fallback}"></ha-icon>`;
      if (icon.includes('.')) return html`<img src="/api/aqara_advanced_lighting/icons/${icon}" alt="preset icon" />`;
      return html`<ha-icon icon="${icon}"></ha-icon>`;
    };

    // Helper for user icons (thumbnail or custom icon or MDI fallback)
    const userIcon = (
      icon: string | undefined,
      fallback: string,
      thumbnailFn: () => TemplateResult | null,
    ) => {
      if (icon) return builtinIcon(icon, fallback);
      return thumbnailFn() ?? html`<ha-icon icon="${fallback}"></ha-icon>`;
    };

    switch (ref.type) {
      case 'effect':
        return isUser
          ? userIcon((preset as UserEffectPreset).icon, 'mdi:lightbulb-on', () => renderEffectThumbnail(preset as UserEffectPreset))
          : builtinIcon((preset as DynamicEffectPreset).icon, 'mdi:lightbulb-on');
      case 'segment_pattern':
        return isUser
          ? userIcon((preset as UserSegmentPatternPreset).icon, 'mdi:palette', () => renderSegmentPatternThumbnail(preset as UserSegmentPatternPreset))
          : builtinIcon((preset as SegmentPatternPreset).icon, 'mdi:palette');
      case 'cct_sequence':
        return isUser
          ? userIcon((preset as UserCCTSequencePreset).icon, 'mdi:temperature-kelvin', () => renderCCTSequenceThumbnail(preset as UserCCTSequencePreset))
          : builtinIcon((preset as CCTSequencePreset).icon, 'mdi:temperature-kelvin');
      case 'segment_sequence':
        return isUser
          ? userIcon((preset as UserSegmentSequencePreset).icon, 'mdi:animation-play', () => renderSegmentSequenceThumbnail(preset as UserSegmentSequencePreset))
          : builtinIcon((preset as SegmentSequencePreset).icon, 'mdi:animation-play');
      case 'dynamic_scene': {
        if (isUser) {
          const p = preset as UserDynamicScenePreset;
          const thumb = userIcon(p.icon, 'mdi:lamps', () => renderDynamicSceneThumbnail(p));
          if (p.audio_entity) {
            return html`${thumb}<span class="audio-badge"><ha-icon icon="mdi:waveform"></ha-icon></span>`;
          }
          return thumb;
        }
        return renderDynamicSceneThumbnail(preset as DynamicScenePreset)
          ?? html`<ha-icon icon="mdi:lamps"></ha-icon>`;
      }
      default:
        return html`<ha-icon icon="mdi:star"></ha-icon>`;
    }
  }

  // -- Render --------------------------------------------------------------

  protected render(): TemplateResult {
    if (!this._config) return html``;

    // undefined = never set (use default), empty string = user cleared it (no title)
    const title = this._config.title === undefined ? 'Favorite Presets' : (this._config.title || undefined);

    if (this._loading) {
      return html`
        <ha-card .header=${title}>
          <div class="card-content loading">
            <ha-circular-progress indeterminate></ha-circular-progress>
          </div>
        </ha-card>
      `;
    }

    if (this._error) {
      return html`
        <ha-card .header=${title}>
          <div class="card-content">
            <ha-alert alert-type="error">${this._error}</ha-alert>
          </div>
        </ha-card>
      `;
    }

    const favorites = this._resolvedFavorites();

    if (favorites.length === 0) {
      return html`
        <ha-card .header=${title}>
          <div class="card-content empty">
            <ha-icon icon="mdi:star-off-outline"></ha-icon>
            <p>No compatible favorites for this device</p>
          </div>
        </ha-card>
      `;
    }

    const gridStyle = this._config.columns
      ? `grid-template-columns: repeat(${this._config.columns}, 1fr)`
      : '';

    const compact = this._config.compact || false;
    const showNames = this._config.show_names !== false;
    const highlightUser = this._config.highlight_user_presets !== false;
    const showStop = this._config.show_stop_button || false;

    return html`
      <ha-card .header=${title}>
        <div class="preset-grid ${compact ? 'compact' : ''} ${!showNames ? 'no-names' : ''} ${!title ? 'no-title' : ''}" style=${gridStyle || nothing}>
          ${favorites.map(({ ref, preset, isUser }) => {
            const isActivating = this._activating === ref.id;
            const isActive = this._activePresets.has(ref.id);
            return html`
              <div
                class="preset-button ${isUser && highlightUser ? 'user-preset' : 'builtin-preset'} ${isActivating ? 'activating' : ''} ${isActive ? 'active' : ''}"
                role="button"
                tabindex="0"
                aria-label="${preset.name}"
                @click=${() => this._activatePreset(ref, preset, isUser)}
                @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._activatePreset(ref, preset, isUser); }}
              >
                <div class="preset-icon">
                  ${this._renderPresetIcon(ref, preset, isUser)}
                </div>
                ${showNames ? html`<div class="preset-name">${preset.name}</div>` : nothing}
                ${isActivating ? html`<div class="activating-overlay"><ha-circular-progress indeterminate size="small"></ha-circular-progress></div>` : nothing}
              </div>
            `;
          })}
          ${showStop ? html`
            <div
              class="preset-button stop-button ${this._stopping ? 'activating' : ''}"
              role="button"
              tabindex="0"
              aria-label="Stop all"
              @click=${() => this._stopAll()}
              @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._stopAll(); }}
            >
              <div class="preset-icon stop-icon">
                <ha-icon icon="mdi:stop-circle-outline"></ha-icon>
              </div>
              ${showNames ? html`<div class="preset-name">Stop</div>` : nothing}
              ${this._stopping ? html`<div class="activating-overlay"><ha-circular-progress indeterminate size="small"></ha-circular-progress></div>` : nothing}
            </div>
          ` : nothing}
        </div>
      </ha-card>
    `;
  }

  // -- Styles (matches panel preset buttons from styles.ts:820-910) --------

  static styles = css`
    :host {
      display: block;
    }

    /* Fix ha-svg-icon vertical misalignment inside ha-icon-button */
    ha-icon-button > ha-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-content {
      padding: 16px;
    }

    .card-content.loading {
      display: flex;
      justify-content: center;
      padding: 32px 16px;
    }

    .card-content.empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px 16px;
      color: var(--secondary-text-color);
    }

    .card-content.empty ha-icon {
      --mdc-icon-size: 32px;
      opacity: 0.5;
    }

    .card-content.empty p {
      margin: 0;
      font-size: var(--ha-font-size-s, 13px);
    }

    /* Preset grid */
    .preset-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
      padding: 0 16px 16px;
    }

    .preset-grid.no-title {
      padding-top: 16px;
    }

    /* Preset buttons — copied from styles.ts:820-910 */
    .preset-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
      background: var(--card-background-color);
      border: 2px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      position: relative;
      min-height: 80px;
      overflow: hidden;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    .preset-button::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--primary-color);
      opacity: 0;
      transition: opacity 0.15s ease-in-out;
    }

    .preset-button:hover::before {
      opacity: 0.08;
    }

    .preset-button:hover {
      border-color: var(--primary-color);
      transform: translateY(-2px);
      box-shadow: var(--ha-card-box-shadow, 0 4px 8px rgba(0, 0, 0, 0.1));
    }

    .preset-button:active {
      transform: translateY(0);
    }

    .preset-button.user-preset {
      border-color: var(--primary-color);
      border-style: dashed;
      border-width: 2px;
    }

    .preset-button.user-preset:hover {
      border-style: solid;
    }

    .preset-button.active {
      border-color: var(--primary-color);
      background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.15);
      box-shadow: 0 0 8px rgba(var(--rgb-primary-color, 3, 169, 244), 0.3);
    }

    .preset-button.active::before {
      opacity: 0.1;
    }

    .preset-button.active.user-preset {
      border-style: solid;
    }

    .preset-button.activating {
      opacity: 0.6;
      pointer-events: none;
    }

    .activating-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(var(--rgb-card-background-color, 255, 255, 255), 0.6);
      border-radius: inherit;
    }

    .preset-name {
      font-size: var(--ha-font-size-s, 13px);
      font-weight: var(--ha-font-weight-medium, 500);
      text-align: center;
      margin-top: 8px;
      position: relative;
      word-break: break-word;
    }

    .preset-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .preset-icon img,
    .preset-icon svg {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 50%;
    }

    .preset-icon svg.gradient-thumb {
      border-radius: 4px;
    }

    .preset-icon ha-icon {
      width: 100%;
      height: 100%;
      --mdc-icon-size: 48px;
    }

    /* Audio-reactive badge overlay */
    .preset-icon .audio-badge {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .preset-icon .audio-badge ha-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      --mdc-icon-size: 20px;
    }

    /* Stop button — last item in the preset grid */
    .stop-icon ha-icon {
      color: var(--error-color, #db4437);
    }

    .stop-button:hover {
      border-color: var(--error-color, #db4437) !important;
    }

    .stop-button:hover::before {
      background: var(--error-color, #db4437) !important;
    }

    /* No names — larger icons fill the space */
    .no-names .preset-icon {
      width: 56px;
      height: 56px;
    }

    .no-names .preset-icon ha-icon {
      --mdc-icon-size: 56px;
    }

    .no-names .preset-button {
      min-height: 68px;
    }

    /* No names + compact combined */
    .compact.no-names .preset-icon {
      width: 40px;
      height: 40px;
    }

    .compact.no-names .preset-icon ha-icon {
      --mdc-icon-size: 40px;
    }

    .compact.no-names .preset-button {
      min-height: 48px;
    }

    /* Compact mode — tighter layout for narrow cards */
    .preset-grid.compact {
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px;
      padding: 0 8px 8px;
    }

    .preset-grid.compact.no-title {
      padding-top: 8px;
    }

    .compact .preset-button {
      padding: 8px 4px;
      min-height: 56px;
    }

    .compact .preset-icon {
      width: 32px;
      height: 32px;
    }

    .compact .preset-icon ha-icon {
      --mdc-icon-size: 32px;
    }

    .compact .preset-name {
      font-size: var(--ha-font-size-xs, 11px);
      margin-top: 4px;
    }

    /* Mobile responsive */
    @media (max-width: 600px) {
      .preset-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 8px;
        padding: 0 8px 8px;
      }

      .preset-button {
        padding: 8px;
        min-height: 60px;
      }

      .preset-name {
        font-size: var(--ha-font-size-xs, 11px);
      }
    }
  `;
}

// ---------------------------------------------------------------------------
// Register in HA card picker
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    customCards?: Array<{ type: string; name: string; description: string; preview?: boolean }>;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'aqara-preset-favorites-card',
  name: 'Aqara Advanced Lighting Presets',
  description: 'Displays and activates your favorited Aqara Advacned Lighting presets for a specific entity.',
  preview: false,
});
