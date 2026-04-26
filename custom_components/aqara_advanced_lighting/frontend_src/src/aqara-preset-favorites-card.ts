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
} from './types';

import { PANEL_TRANSLATIONS } from './panel-translations';
import { renderInput } from './editor-constants';
import { resolveFavorites } from './preset-runtime/preset-resolver';
import { renderPresetIcon } from './preset-runtime/preset-icon';
import { activatePreset, type ActivatePresetOptions } from './preset-runtime/preset-activator';

// ---------------------------------------------------------------------------
// Module-level API cache — shared across all card instances on the dashboard
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/** TTLs in milliseconds by endpoint category. */
const CACHE_TTL_STATIC = 60 * 60 * 1000;   // 60 min — built-in presets, supported entities
const CACHE_TTL_USER   =  2 * 60 * 1000;   //  2 min — user presets, user preferences

const _apiCache = new Map<string, CacheEntry<unknown>>();

/** Return cached data if still fresh, otherwise undefined. */
function getCached<T>(key: string, ttl: number): T | undefined {
  const entry = _apiCache.get(key);
  if (entry && Date.now() - entry.timestamp < ttl) return entry.data as T;
  return undefined;
}

/** Store data in the cache. */
function setCache<T>(key: string, data: T): void {
  _apiCache.set(key, { data, timestamp: Date.now() });
}

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
// Card Editor
// ---------------------------------------------------------------------------

@customElement('aqara-preset-favorites-card-editor')
export class AqaraPresetFavoritesCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: AqaraFavoritesCardConfig;

  private _t = PANEL_TRANSLATIONS.card;

  public setConfig(config: AqaraFavoritesCardConfig): void {
    this._config = { ...config };
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) return html``;

    return html`
      <div class="editor">
        <ha-selector
          .hass=${this.hass}
          .label=${this._t.editor.entities_label}
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
        ${renderInput({
          label: this._t.editor.title_label,
          value: this._config.title || '',
          onInput: (e: Event) => this._updateConfig('title', (e.target as HTMLInputElement).value),
        })}
        ${renderInput({
          label: this._t.editor.columns_label,
          type: 'number',
          min: '0',
          max: '6',
          value: String(this._config.columns || 0),
          onInput: (e: Event) => {
            const val = parseInt((e.target as HTMLInputElement).value, 10);
            this._updateConfig('columns', isNaN(val) || val <= 0 ? undefined : val);
          },
        })}
        <ha-formfield .label=${this._t.editor.compact_label}>
          <ha-switch
            .checked=${this._config.compact || false}
            @change=${(e: Event) => this._updateConfig('compact', (e.target as HTMLInputElement).checked || undefined)}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield .label=${this._t.editor.show_names_label}>
          <ha-switch
            .checked=${this._config.show_names !== false}
            @change=${(e: Event) => this._updateConfig('show_names', (e.target as HTMLInputElement).checked ? undefined : false)}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield .label=${this._t.editor.highlight_user_label}>
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
  private _t = PANEL_TRANSLATIONS.card;

  @state() private _config?: AqaraFavoritesCardConfig;
  @state() private _presets?: PresetsData;
  @state() private _userPresets?: UserPresetsData;
  @state() private _favoriteRefs: FavoritePresetRef[] = [];
  @state() private _userPrefs?: UserPreferences;
  @state() private _supportedEntities = new Map<string, SupportedEntityInfo>();
  @state() private _loading = true;
  @state() private _error?: string;
  @state() private _activating?: string;
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
    return { entity: '', title: PANEL_TRANSLATIONS.card.default_title };
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
      // Check cache for each endpoint, only fetch what's missing
      type EntitiesResp = { entities: Array<{ entity_id: string; device_type: string; model_id: string }> };

      const cachedPresets = getCached<PresetsData>('presets', CACHE_TTL_STATIC);
      const cachedUserPresets = getCached<UserPresetsData>('user_presets', CACHE_TTL_USER);
      const cachedPrefs = getCached<UserPreferences>('user_preferences', CACHE_TTL_USER);
      const cachedEntities = getCached<EntitiesResp>('supported_entities', CACHE_TTL_STATIC);

      // Build fetch promises only for stale/missing data
      const fetches = {
        presets: cachedPresets ?? this._fetchPresetsData(),
        userPresets: cachedUserPresets ?? this.hass.callApi<UserPresetsData>('GET', 'aqara_advanced_lighting/user_presets'),
        prefs: cachedPrefs ?? this.hass.callApi<UserPreferences>('GET', 'aqara_advanced_lighting/user_preferences'),
        entities: cachedEntities ?? this.hass.callApi<EntitiesResp>('GET', 'aqara_advanced_lighting/supported_entities'),
      };

      const [presetsResp, userPresetsResp, prefsResp, entitiesResp] = await Promise.all([
        fetches.presets, fetches.userPresets, fetches.prefs, fetches.entities,
      ]);

      // Update cache for freshly fetched data
      if (!cachedPresets) setCache('presets', presetsResp);
      if (!cachedUserPresets) setCache('user_presets', userPresetsResp);
      if (!cachedPrefs) setCache('user_preferences', prefsResp);
      if (!cachedEntities) setCache('supported_entities', entitiesResp);

      this._presets = presetsResp;
      this._userPresets = userPresetsResp;
      this._favoriteRefs = prefsResp.favorite_presets || [];
      // Cache the user's audio preferences so card activation can match panel behavior.
      // The activator uses these to populate audio_entity for built-in audio-reactive
      // presets (e.g. Concert) and to apply user-level audio overrides when enabled.
      this._userPrefs = prefsResp;

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
      this._error = this._t.error_loading;
      console.error('AqaraFavoritesCard: data load failed', err);
    } finally {
      this._loading = false;
    }
  }

  /**
   * Fetch built-in presets data. Uses fetchWithAuth because this endpoint
   * returns raw JSON (not the callApi wrapper format).
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

  // -- Preset activation ---------------------------------------------------

  /**
   * Activate a preset via the shared preset-runtime activator.
   * Toggles off if the preset is already running.
   */
  private async _activatePreset(ref: FavoritePresetRef, preset: AnyPreset, isUser: boolean): Promise<void> {
    const entityIds = this._getEntityIds();
    if (entityIds.length === 0) return;

    // Toggle: if this preset is already active, stop it instead
    const activeType = this._activePresets.get(ref.id);
    if (activeType) {
      await this._stopPreset(ref.id, activeType);
      return;
    }

    this._activating = ref.id;
    try {
      const options = this._buildActivationOptions();
      await activatePreset(this.hass, entityIds, ref, preset, isUser, options);
    } catch (err) {
      console.error('AqaraFavoritesCard: activation failed', err);
    } finally {
      this._activating = undefined;
      // Refresh active state immediately after activation
      this._pollRunningOperations();
    }
  }

  /**
   * Map the cached user preferences to ActivatePresetOptions so the card
   * matches panel activation behavior. The audioOverrideEntity is the most
   * important field here: built-in audio-reactive presets (e.g. Concert) carry
   * audio_color_advance but no audio_entity of their own, and rely on this
   * fallback. When the user has enabled `useAudioReactive`, the activator also
   * applies the full set of user-level audio overrides.
   *
   * Note: staticSceneMode/distributionModeOverride are panel-only UI features
   * the card does not expose, so they are intentionally left undefined.
   * Phase 2 will add `brightness` from a slider here.
   */
  private _buildActivationOptions(): ActivatePresetOptions {
    const prefs = this._userPrefs;
    if (!prefs) return {};
    return {
      audioOverrideEntity: prefs.audio_override_entity ?? undefined,
      useAudioReactive: prefs.use_audio_reactive,
      useEffectAudioReactive: prefs.use_effect_audio_reactive,
      effectAudioOverrideSensitivity: prefs.effect_audio_override_sensitivity,
      audioOverrideSensitivity: prefs.audio_override_sensitivity,
      audioOverrideColorAdvance: prefs.audio_override_color_advance ?? null,
      audioOverrideTransitionSpeed: prefs.audio_override_transition_speed,
      audioOverrideBrightnessCurve: prefs.audio_override_brightness_curve ?? null,
      audioOverrideBrightnessMin: prefs.audio_override_brightness_min,
      audioOverrideBrightnessMax: prefs.audio_override_brightness_max,
      audioOverrideDetectionMode: prefs.audio_override_detection_mode,
      audioOverrideFrequencyZone: prefs.audio_override_frequency_zone,
      audioOverrideSilenceBehavior: prefs.audio_override_silence_behavior,
      audioOverridePredictionAggressiveness: prefs.audio_override_prediction_aggressiveness,
      audioOverrideLatencyCompensationMs: prefs.audio_override_latency_compensation_ms,
      audioOverrideColorByFrequency: prefs.audio_override_color_by_frequency,
      audioOverrideRolloffBrightness: prefs.audio_override_rolloff_brightness,
    };
  }

  // -- Targeted stop --------------------------------------------------------

  /** Map operation type → stop service name. */
  private static readonly _STOP_SERVICES: Record<string, string> = {
    effect: 'stop_effect',
    cct_sequence: 'stop_cct_sequence',
    segment_sequence: 'stop_segment_sequence',
    dynamic_scene: 'stop_dynamic_scene',
  };

  /** Stop a specific running preset by its operation type. */
  private async _stopPreset(presetId: string, operationType: string): Promise<void> {
    const entityIds = this._getEntityIds();
    if (entityIds.length === 0) return;

    const service = AqaraPresetFavoritesCard._STOP_SERVICES[operationType];
    if (!service) return;

    this._activating = presetId;
    try {
      const serviceData: Record<string, unknown> = { entity_id: entityIds };
      // All stop services except segment_sequence support restore_state
      if (operationType !== 'segment_sequence') {
        serviceData.restore_state = true;
      }
      await this.hass.callService('aqara_advanced_lighting', service, serviceData);
    } catch (err) {
      console.error('AqaraFavoritesCard: stop failed', err);
    } finally {
      this._activating = undefined;
      this._activePresets.delete(presetId);
      this._pollRunningOperations();
    }
  }

  // -- Render --------------------------------------------------------------

  protected render(): TemplateResult {
    if (!this._config) return html``;

    // undefined = never set (use default), empty string = user cleared it (no title)
    const title = this._config.title === undefined ? this._t.default_title : (this._config.title || undefined);

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

    const favorites = (this._presets && this._userPresets)
      ? resolveFavorites(this._favoriteRefs, this._presets, this._userPresets, this._getSelectedDeviceTypes())
      : [];

    if (favorites.length === 0) {
      return html`
        <ha-card .header=${title}>
          <div class="card-content empty">
            <ha-icon icon="mdi:star-off-outline"></ha-icon>
            <p>${this._t.empty_no_favorites}</p>
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
                  ${renderPresetIcon(ref, preset, isUser)}
                </div>
                ${showNames ? html`<div class="preset-name">${preset.name}</div>` : nothing}
                ${isActivating ? html`<div class="activating-overlay"><ha-circular-progress indeterminate size="small"></ha-circular-progress></div>` : nothing}
              </div>
            `;
          })}
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
      width: 56px;
      height: 56px;
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

    .preset-icon ha-icon {
      width: 100%;
      height: 100%;
      --mdc-icon-size: 56px;
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

    /* No names — larger icons fill the space */
    .no-names .preset-icon {
      width: 64px;
      height: 64px;
    }

    .no-names .preset-icon ha-icon {
      --mdc-icon-size: 64px;
    }

    .no-names .preset-button {
      min-height: 68px;
    }

    /* No names + compact combined */
    .compact.no-names .preset-icon {
      width: 48px;
      height: 48px;
    }

    .compact.no-names .preset-icon ha-icon {
      --mdc-icon-size: 48px;
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
      width: 40px;
      height: 40px;
    }

    .compact .preset-icon ha-icon {
      --mdc-icon-size: 40px;
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
  name: PANEL_TRANSLATIONS.card.name,
  description: PANEL_TRANSLATIONS.card.description,
  preview: false,
});
