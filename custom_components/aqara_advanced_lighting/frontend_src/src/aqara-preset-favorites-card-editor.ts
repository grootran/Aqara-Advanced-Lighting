/**
 * Aqara Preset Favorites — Lovelace card editor element.
 *
 * The custom element returned by `AqaraPresetFavoritesCard.getConfigElement()`.
 * Lives in its own file so the main card stays focused on render/lifecycle
 * concerns and so Phase 2 additions (curation, layout, brightness override)
 * can extend the editor without bloating the card module.
 */

import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { HomeAssistant } from './types';
import type { AqaraFavoritesCardConfig } from './card-config';
import { PANEL_TRANSLATIONS } from './panel-translations';
import { renderInput } from './editor-constants';

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
