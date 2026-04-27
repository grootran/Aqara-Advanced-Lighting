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
} from './types';

import { PANEL_TRANSLATIONS } from './panel-translations';
import { AqaraFavoritesCardConfig, CardLayout, normalizeCardConfig } from './card-config';
import { resolveFavorites, type ResolvedFavorite } from './preset-runtime/preset-resolver';
import { renderPresetIcon } from './preset-runtime/preset-icon';
import { activatePreset, type ActivatePresetOptions } from './preset-runtime/preset-activator';
import { applyCuration } from './card-curation';
import {
  getPresets,
  getUserPresets,
  getUserPreferences,
  getSupportedEntities,
  getRunningOperations,
} from './data-client/aqara-api';
import {
  subscribeRunningOperations,
  fetchRunningOnceOnAction,
  filterActivePresets,
} from './card-running-ops';

// ---------------------------------------------------------------------------
// Supported entity info (subset of what the API returns)
// ---------------------------------------------------------------------------

interface SupportedEntityInfo {
  device_type: string;
  model_id: string;
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
  @state() private _supportedEntities = new Map<string, SupportedEntityInfo>();
  @state() private _loading = true;
  @state() private _error?: string;
  @state() private _activating?: string;
  /** Maps preset ref.id to operation type for currently running presets. */
  @state() private _activePresets = new Map<string, string>();
  /**
   * Card-instance-local brightness slider value (1-100). In-memory only —
   * never persisted; resets to 100 on card reload. Sent via
   * ActivatePresetOptions.brightness when `brightness_override` is enabled.
   */
  @state() private _brightnessValue = 100;

  /**
   * Look up the running operation type for a favorite preset, handling the
   * preset_id mismatch where dynamic scenes (and other preset variants)
   * report their name in running_operations rather than their id.
   *
   * Tries ref.id first (matches when activator sends preset: preset.id, e.g.
   * built-in effects), then falls back to preset.name (matches dynamic scenes
   * where the activator sends scene_name: preset.name, and user variants
   * where the activator sends preset: preset.name).
   *
   * Verifies the operation type matches the favorite type so collisions
   * across preset types (e.g. an effect and a scene with the same string
   * key) cannot cross-trigger.
   */
  private _findActiveOpType(ref: FavoritePresetRef, preset: AnyPreset): string | undefined {
    const byId = this._activePresets.get(ref.id);
    if (byId === ref.type) return byId;
    const byName = this._activePresets.get(preset.name);
    if (byName === ref.type) return byName;
    return undefined;
  }

  private _dataLoaded = false;
  private _unsubRunningOps?: () => void;
  private _subscriptionFailed = false;
  private _lastHassConnected = true;
  private _subscribing = false;
  /**
   * Entity IDs the current running-ops subscription is filtered on. Used in
   * `updated()` to detect when Lovelace mutates `_config.entities` on the same
   * card element instance and rebind the subscription so the filter doesn't
   * go stale.
   */
  private _subscribedEntityIds: string[] = [];

  // -- Lovelace card API --------------------------------------------------

  public setConfig(config: AqaraFavoritesCardConfig): void {
    if (!config.entity && (!config.entities || config.entities.length === 0)) {
      throw new Error('At least one entity is required');
    }
    this._config = normalizeCardConfig(config);
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

  protected async updated(changedProps: PropertyValues): Promise<void> {
    super.updated(changedProps);
    // Re-entry guard: updated() is async and Lit does not await it. Prevent
    // overlapping invocations between _loadData and _startSubscription, which
    // could otherwise leak subscriptions or duplicate work.
    if (this._subscribing) return;

    if (changedProps.has('hass') && this.hass) {
      this._subscribing = true;
      try {
        const isFirstLoad = !this._dataLoaded;
        if (isFirstLoad) {
          await this._loadData();
          await this._startSubscription();
          this._lastHassConnected = this.hass.connected !== false;
        } else {
          // hass.connected transition false -> true triggers a one-shot resync
          // (spec Section 1.3). HA's WS client automatically re-subscribes
          // events on reconnect, so we do NOT tear down or recreate the
          // subscription - we just catch any events missed during the outage.
          const isConnected = this.hass.connected !== false;
          if (!this._lastHassConnected && isConnected) {
            await this._resyncRunningOps();
          }
          this._lastHassConnected = isConnected;
        }
      } finally {
        this._subscribing = false;
      }
    }
    if (changedProps.has('hass') && !this.hass) {
      this._stopSubscription();
    }

    // Rebind the running-ops subscription when the configured entity set
    // changes on the same element instance. Lovelace can mutate `_config`
    // via setConfig without recreating the card, in which case the existing
    // subscription's filter list goes stale. Compare the current resolved
    // entity IDs against the last-subscribed set and re-subscribe on diff.
    if (changedProps.has('_config') && this._dataLoaded && this.hass && !this._subscribing) {
      const currentIds = this._getEntityIds();
      const sameSet =
        currentIds.length === this._subscribedEntityIds.length &&
        currentIds.every(id => this._subscribedEntityIds.includes(id));
      if (!sameSet) {
        this._subscribing = true;
        try {
          await this._startSubscription();
        } finally {
          this._subscribing = false;
        }
      }
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stopSubscription();
  }

  /** Subscribe to running-operations events. Tracks degraded-mode flag. */
  private async _startSubscription(): Promise<void> {
    this._stopSubscription();
    if (!this.hass) return;
    const entityIds = this._getEntityIds();
    try {
      const unsub = await subscribeRunningOperations(
        this.hass,
        entityIds,
        (active) => { this._activePresets = active; },
      );
      // If the element was disconnected while we were awaiting subscribe,
      // _stopSubscription has already run with an undefined _unsubRunningOps,
      // so we must clean up the just-resolved subscription ourselves.
      if (!this.isConnected) {
        unsub();
        return;
      }
      this._unsubRunningOps = unsub;
      this._subscriptionFailed = false;
      // Track the subscribed entity IDs so updated() can detect later
      // mutations to _config.entities and rebind the subscription.
      this._subscribedEntityIds = [...entityIds];
    } catch {
      // subscribeRunningOperations logs once-per-page-load internally; do
      // not double-log here. Caller checks _subscriptionFailed to decide
      // whether to use fetchRunningOnceOnAction after user actions.
      this._subscriptionFailed = true;
      this._subscribedEntityIds = [];
    }
  }

  /** One-shot resync after a connection bounce. Silent on failure. */
  private async _resyncRunningOps(): Promise<void> {
    if (!this.hass) return;
    try {
      const resp = await getRunningOperations(this.hass, { bypassCache: true });
      this._activePresets = filterActivePresets(resp.operations, this._getEntityIds());
    } catch {
      // Silent - subscription will recover when next event fires.
    }
  }

  private _stopSubscription(): void {
    if (this._unsubRunningOps) {
      this._unsubRunningOps();
      this._unsubRunningOps = undefined;
    }
    this._subscribedEntityIds = [];
  }

  // -- Data loading --------------------------------------------------------

  private async _loadData(): Promise<void> {
    if (!this.hass) return;
    this._loading = true;
    this._error = undefined;

    try {
      const [presetsResp, userPresetsResp, prefsResp, entitiesResp] = await Promise.all([
        getPresets(this.hass),
        getUserPresets(this.hass),
        getUserPreferences(this.hass),
        getSupportedEntities(this.hass),
      ]);

      this._presets = presetsResp;
      this._userPresets = userPresetsResp;
      this._favoriteRefs = prefsResp.favorite_presets || [];
      // Note: user audio preferences are no longer cached on the element. They
      // are re-fetched per-activation via getUserPreferences() so that panel
      // mutations to audio overrides take effect on the next card activation
      // (the shared API client invalidates its cache on those mutations).

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
    const activeType = this._findActiveOpType(ref, preset);
    if (activeType) {
      // Use preset.name for stop key when ref.id didn't match (consistency
      // with the lookup above: stopPreset uses the same key the user sees
      // as "active" in _activePresets).
      const activeKey = this._activePresets.has(ref.id) ? ref.id : preset.name;
      await this._stopPreset(activeKey, activeType);
      return;
    }

    this._activating = ref.id;
    try {
      const options = await this._buildActivationOptions();
      await activatePreset(this.hass, entityIds, ref, preset, isUser, options);
    } catch (err) {
      console.error('AqaraFavoritesCard: activation failed', err);
    } finally {
      this._activating = undefined;
      // If the subscription is healthy, the backend event fires server-side
      // and the callback updates _activePresets within milliseconds; no
      // explicit refresh needed. In degraded mode, do a one-shot fetch to
      // keep the UI in sync without reintroducing periodic polling.
      if (this._subscriptionFailed) {
        await fetchRunningOnceOnAction(this.hass, this._getEntityIds(), (active) => {
          this._activePresets = active;
        });
      }
    }
  }

  /**
   * Map the user preferences to ActivatePresetOptions so the card matches
   * panel activation behavior. The audioOverrideEntity is the most important
   * field here: built-in audio-reactive presets (e.g. Concert) carry
   * audio_color_advance but no audio_entity of their own, and rely on this
   * fallback. When the user has enabled `useAudioReactive`, the activator
   * also applies the full set of user-level audio overrides.
   *
   * Prefs are fetched per-activation (not cached on the element) so that
   * panel mutations to audio overrides take effect immediately on the next
   * card activation. The shared API client uses a 2-min TTL cache that is
   * invalidated on mutation, so the typical cost is a memory read.
   *
   * Note: staticSceneMode/distributionModeOverride are panel-only UI features
   * the card does not expose, so they are intentionally left undefined.
   * Phase 2 adds `brightness` from the inline slider when the card config
   * enables `brightness_override`.
   */
  private async _buildActivationOptions(): Promise<ActivatePresetOptions> {
    let prefs;
    try {
      prefs = await getUserPreferences(this.hass);
    } catch {
      // Treat as no prefs available - fall through to brightness-only options.
      // The activator will activate without audio overrides; activation still
      // succeeds for non-audio presets and for built-ins that carry their own
      // audio configuration.
    }
    const options: ActivatePresetOptions = prefs ? {
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
    } : {};
    // Phase 2: card brightness slider. The activator applies it to effects,
    // patterns, dynamic scenes and segment sequences; CCT sequences ignore
    // it; per-preset preset.effect_brightness still wins for user effects.
    if (this._config?.brightness_override) {
      options.brightness = this._brightnessValue;
    }
    return options;
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
      // Same logic as _activatePreset: subscription drives refresh in normal
      // mode; degraded mode falls back to a one-shot fetch.
      if (this._subscriptionFailed) {
        await fetchRunningOnceOnAction(this.hass, this._getEntityIds(), (active) => {
          this._activePresets = active;
        });
      }
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

    const resolved = (this._presets && this._userPresets)
      ? resolveFavorites(this._favoriteRefs, this._presets, this._userPresets, this._getSelectedDeviceTypes())
      : [];
    const favorites = applyCuration(resolved, this._config?.preset_ids);

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

    const layout: CardLayout = this._config.layout || 'grid';
    const showSlider = this._config.brightness_override === true;
    const sliderPosition = this._config.brightness_override_position || 'header';

    return html`
      <ha-card .header=${title}>
        ${showSlider && sliderPosition !== 'footer' ? this._renderBrightnessSlider() : nothing}
        ${this._renderLayout(layout, favorites, title)}
        ${showSlider && sliderPosition === 'footer' ? this._renderBrightnessSlider() : nothing}
      </ha-card>
    `;
  }

  /**
   * Dispatch to the layout-specific renderer. Uses an exhaustive switch
   * with a `never`-typed default so adding a new variant to `CardLayout`
   * without updating this method is a compile-time error.
   */
  private _renderLayout(
    layout: CardLayout,
    favorites: ResolvedFavorite[],
    title: string | undefined,
  ): TemplateResult {
    switch (layout) {
      case 'list': return this._renderListLayout(favorites);
      case 'hero': return this._renderHeroLayout(favorites);
      case 'carousel': return this._renderCarouselLayout(favorites);
      case 'grid':
      case 'compact-grid':
        return this._renderGridLayout(favorites, layout, title);
      default: {
        const _exhaustive: never = layout;
        return _exhaustive;
      }
    }
  }

  // -- Layout: grid / compact-grid (existing behavior) --------------------

  /**
   * Derive shared display flags from `_config`. Both flags default to true
   * when unset/undefined to preserve v1 behavior. Used by every layout
   * except `_renderStripTile` (per its own doc comment).
   */
  private _getDisplayFlags(): { showNames: boolean; highlightUser: boolean } {
    return {
      showNames: this._config?.show_names !== false,
      highlightUser: this._config?.highlight_user_presets !== false,
    };
  }

  private _renderGridLayout(
    favorites: ResolvedFavorite[],
    layout: 'grid' | 'compact-grid',
    title: string | undefined,
  ): TemplateResult {
    const compact = layout === 'compact-grid';
    const { showNames, highlightUser } = this._getDisplayFlags();
    const gridStyle = this._config?.columns
      ? `grid-template-columns: repeat(${this._config.columns}, 1fr)`
      : '';

    return html`
      <div class="preset-grid ${compact ? 'compact' : ''} ${!showNames ? 'no-names' : ''} ${!title ? 'no-title' : ''}" style=${gridStyle || nothing}>
        ${favorites.map(({ ref, preset, isUser }) => {
          const isActivating = this._activating === ref.id;
          const isActive = this._findActiveOpType(ref, preset) !== undefined;
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
    `;
  }

  // -- Layout: list -------------------------------------------------------

  private _renderListLayout(favorites: ResolvedFavorite[]): TemplateResult {
    const { showNames, highlightUser } = this._getDisplayFlags();
    return html`
      <div class="preset-list">
        ${favorites.map(({ ref, preset, isUser }) => {
          const isActivating = this._activating === ref.id;
          const isActive = this._findActiveOpType(ref, preset) !== undefined;
          return html`
            <div
              class="preset-list-row ${isUser && highlightUser ? 'user-preset' : 'builtin-preset'} ${isActive ? 'active' : ''} ${isActivating ? 'activating' : ''}"
              role="button"
              tabindex="0"
              aria-label="${preset.name}"
              @click=${() => this._activatePreset(ref, preset, isUser)}
              @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._activatePreset(ref, preset, isUser); }}
            >
              <div class="preset-list-icon">${renderPresetIcon(ref, preset, isUser)}</div>
              ${showNames ? html`<div class="preset-list-name">${preset.name}</div>` : nothing}
              ${isActive ? html`<ha-icon class="preset-list-active-indicator" icon="mdi:circle-medium"></ha-icon>` : nothing}
              ${isActivating ? html`<ha-circular-progress indeterminate size="small"></ha-circular-progress>` : nothing}
            </div>
          `;
        })}
      </div>
    `;
  }

  // -- Layout: hero -------------------------------------------------------

  private _renderHeroLayout(favorites: ResolvedFavorite[]): TemplateResult {
    const hero = favorites[0];
    if (!hero) return html``;
    const rest = favorites.slice(1);
    return html`
      <div class="preset-hero-wrapper">
        ${this._renderHeroTile(hero)}
        ${rest.length > 0 ? html`<div class="preset-hero-strip">${rest.map(f => this._renderStripTile(f))}</div>` : nothing}
      </div>
    `;
  }

  private _renderHeroTile({ ref, preset, isUser }: ResolvedFavorite): TemplateResult {
    const isActive = this._findActiveOpType(ref, preset) !== undefined;
    const isActivating = this._activating === ref.id;
    const { showNames } = this._getDisplayFlags();
    return html`
      <div
        class="preset-hero ${isActive ? 'active' : ''} ${isActivating ? 'activating' : ''}"
        role="button"
        tabindex="0"
        aria-label="${preset.name}"
        @click=${() => this._activatePreset(ref, preset, isUser)}
        @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._activatePreset(ref, preset, isUser); }}
      >
        <div class="preset-hero-icon">${renderPresetIcon(ref, preset, isUser)}</div>
        ${showNames ? html`<div class="preset-hero-name">${preset.name}</div>` : nothing}
        ${isActivating ? html`<div class="activating-overlay"><ha-circular-progress indeterminate size="small"></ha-circular-progress></div>` : nothing}
      </div>
    `;
  }

  /**
   * Render a small circular icon-only tile used by the hero strip and
   * carousel layouts. Intentionally does NOT honor `highlight_user_presets`
   * - the tile is too small (40px icon, 56px tile) to visually differentiate
   * the dashed-border user-preset treatment, and adding it produces visual
   * noise. The full distinction is preserved in grid, compact-grid, and list
   * layouts where the row is large enough.
   */
  private _renderStripTile({ ref, preset, isUser }: ResolvedFavorite): TemplateResult {
    const isActive = this._findActiveOpType(ref, preset) !== undefined;
    const isActivating = this._activating === ref.id;
    return html`
      <div
        class="preset-strip-tile ${isActive ? 'active' : ''} ${isActivating ? 'activating' : ''}"
        role="button"
        tabindex="0"
        aria-label="${preset.name}"
        @click=${() => this._activatePreset(ref, preset, isUser)}
        @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._activatePreset(ref, preset, isUser); }}
      >
        <div class="preset-strip-icon">${renderPresetIcon(ref, preset, isUser)}</div>
      </div>
    `;
  }

  // -- Layout: carousel ---------------------------------------------------

  private _renderCarouselLayout(favorites: ResolvedFavorite[]): TemplateResult {
    return html`
      <div class="preset-carousel" tabindex="0">
        ${favorites.map(f => html`<div class="preset-carousel-item">${this._renderStripTile(f)}</div>`)}
      </div>
    `;
  }

  // -- Brightness slider --------------------------------------------------

  /**
   * Render the inline brightness override slider. Value is local-only
   * (never persisted) and resets to 100 on reload. Sent via
   * `ActivatePresetOptions.brightness` on activation.
   */
  private _renderBrightnessSlider(): TemplateResult {
    return html`
      <div class="brightness-slider-row">
        <span class="brightness-slider-label">${this._t.brightness_label}</span>
        <input
          type="range"
          min="1"
          max="100"
          .value=${String(this._brightnessValue)}
          @input=${(e: Event) => {
            const v = parseInt((e.target as HTMLInputElement).value, 10);
            if (!isNaN(v)) this._brightnessValue = v;
          }}
        />
        <span class="brightness-slider-value">${this._brightnessValue}%</span>
      </div>
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

    /*
     * Audio-reactive badge overlay.
     * The badge is rendered as a child of the icon container regardless of
     * which layout (grid/list/hero/carousel) is in use. To make the absolute
     * positioning work in every layout, ensure each icon container is a
     * positioning context, and target the badge with a single shared rule.
     */
    .preset-icon,
    .preset-list-icon,
    .preset-hero-icon,
    .preset-strip-icon {
      position: relative;
    }

    .audio-badge {
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

    .audio-badge ha-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      --mdc-icon-size: 20px;
    }

    /* Compact icon containers (40px) get a smaller badge so it isn't oversized. */
    .preset-list-icon .audio-badge,
    .preset-strip-icon .audio-badge {
      width: 18px;
      height: 18px;
    }
    .preset-list-icon .audio-badge ha-icon,
    .preset-strip-icon .audio-badge ha-icon {
      width: 16px;
      height: 16px;
      --mdc-icon-size: 16px;
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

    /* ---------- List layout ---------- */

    .preset-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 16px 16px;
    }

    .preset-list-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    .preset-list-row:hover {
      border-color: var(--primary-color);
      background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.05);
    }

    .preset-list-row.active {
      border-color: var(--primary-color);
      background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.15);
    }

    .preset-list-row.user-preset {
      border-style: dashed;
    }

    .preset-list-row.user-preset.active {
      border-style: solid;
    }

    .preset-list-row.activating {
      opacity: 0.6;
      pointer-events: none;
    }

    .preset-list-icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .preset-list-icon ha-icon,
    .preset-list-icon img,
    .preset-list-icon svg {
      width: 100%;
      height: 100%;
      --mdc-icon-size: 40px;
      object-fit: contain;
      border-radius: 50%;
    }

    .preset-list-name {
      flex: 1;
      font-size: var(--ha-font-size-m, 14px);
    }

    .preset-list-active-indicator {
      color: var(--primary-color);
    }

    /* ---------- Hero layout ---------- */

    .preset-hero-wrapper {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 0 16px 16px;
    }

    .preset-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 12px;
      border: 2px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      gap: 12px;
      position: relative;
      overflow: hidden;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    .preset-hero:hover {
      border-color: var(--primary-color);
    }

    .preset-hero.active {
      border-color: var(--primary-color);
      background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.15);
    }

    .preset-hero.activating {
      opacity: 0.6;
      pointer-events: none;
    }

    .preset-hero-icon {
      width: 96px;
      height: 96px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .preset-hero-icon ha-icon,
    .preset-hero-icon img,
    .preset-hero-icon svg {
      width: 100%;
      height: 100%;
      --mdc-icon-size: 96px;
      object-fit: contain;
      border-radius: 50%;
    }

    .preset-hero-name {
      font-size: var(--ha-font-size-l, 16px);
      font-weight: 500;
      text-align: center;
    }

    .preset-hero-strip {
      display: flex;
      gap: 8px;
      overflow-x: auto;
    }

    .preset-strip-tile {
      flex: 0 0 56px;
      width: 56px;
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--divider-color);
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      position: relative;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    .preset-strip-tile:hover {
      border-color: var(--primary-color);
    }

    .preset-strip-tile.active {
      border-color: var(--primary-color);
      background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.15);
    }

    .preset-strip-tile.activating {
      opacity: 0.6;
      pointer-events: none;
    }

    .preset-strip-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .preset-strip-icon ha-icon,
    .preset-strip-icon img,
    .preset-strip-icon svg {
      width: 100%;
      height: 100%;
      --mdc-icon-size: 40px;
      object-fit: contain;
      border-radius: 50%;
    }

    /* ---------- Carousel layout ---------- */

    .preset-carousel {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      /* Slightly less bottom padding so the visible scrollbar fits within the card. */
      padding: 0 16px 12px;
      scroll-snap-type: x mandatory;
      outline: none;
      /* Show a thin scrollbar on desktop so users have a visible scroll
         affordance. Touch devices ignore these and use native finger-drag. */
      scrollbar-width: thin;
      scrollbar-color: var(--divider-color) transparent;
    }

    .preset-carousel::-webkit-scrollbar {
      height: 6px;
    }
    .preset-carousel::-webkit-scrollbar-track {
      background: transparent;
    }
    .preset-carousel::-webkit-scrollbar-thumb {
      background: var(--divider-color);
      border-radius: 3px;
    }
    .preset-carousel::-webkit-scrollbar-thumb:hover {
      background: var(--secondary-text-color);
    }

    .preset-carousel:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
    }

    .preset-carousel-item {
      flex: 0 0 auto;
      scroll-snap-align: start;
    }

    /* ---------- Brightness slider ---------- */

    .brightness-slider-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
    }

    .brightness-slider-row input[type="range"] {
      flex: 1;
      min-width: 0;
      accent-color: var(--primary-color);
    }

    .brightness-slider-label {
      font-size: var(--ha-font-size-m, 14px);
      color: var(--secondary-text-color);
      white-space: nowrap;
    }

    .brightness-slider-value {
      font-size: var(--ha-font-size-m, 14px);
      color: var(--secondary-text-color);
      min-width: 36px;
      text-align: right;
      flex-shrink: 0;
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
