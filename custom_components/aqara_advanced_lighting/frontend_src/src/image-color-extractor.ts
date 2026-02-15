/**
 * Image Color Extractor Component
 * Provides UI for uploading an image or entering a URL, extracting dominant colors,
 * and optionally saving a thumbnail for the preset.
 */

import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, DynamicSceneColor } from './types';

const API_BASE = '/api/aqara_advanced_lighting';

export interface ColorsExtractedDetail {
  colors: DynamicSceneColor[];
  thumbnailId?: string;
}

@customElement('image-color-extractor')
export class ImageColorExtractor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Object }) public translations: Record<string, any> = {};

  @state() private _mode: 'upload' | 'url' = 'upload';
  @state() private _url = '';
  @state() private _saveThumbnail = true;
  @state() private _extractBrightness = false;
  @state() private _extracting = false;
  @state() private _error = '';
  @state() private _previewSrc = '';

  private _selectedFile?: File;

  private _localize(key: string): string {
    const parts = key.split('.');
    let obj: any = this.translations;
    for (const part of parts) {
      obj = obj?.[part];
    }
    return typeof obj === 'string' ? obj : '';
  }

  private _getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.hass?.auth?.data?.access_token}`,
    };
  }

  protected render(): TemplateResult {
    return html`
      <div class="extractor-container">
        <!-- Mode toggle -->
        <div class="mode-toggle">
          <button
            class="mode-btn ${this._mode === 'upload' ? 'active' : ''}"
            @click=${() => { this._mode = 'upload'; this._error = ''; }}
          >
            <ha-icon icon="mdi:upload"></ha-icon>
            ${this._localize('image_extractor.upload_tab')}
          </button>
          <button
            class="mode-btn ${this._mode === 'url' ? 'active' : ''}"
            @click=${() => { this._mode = 'url'; this._error = ''; }}
          >
            <ha-icon icon="mdi:link"></ha-icon>
            ${this._localize('image_extractor.url_tab')}
          </button>
        </div>

        <!-- Upload mode -->
        ${this._mode === 'upload' ? html`
          <div
            class="drop-zone ${this._previewSrc ? 'has-preview' : ''}"
            @click=${this._triggerFileInput}
            @dragover=${this._handleDragOver}
            @dragleave=${this._handleDragLeave}
            @drop=${this._handleDrop}
          >
            ${this._previewSrc ? html`
              <img class="preview-image" src="${this._previewSrc}" alt="Preview" />
              <div class="preview-overlay">
                <ha-icon icon="mdi:swap-horizontal"></ha-icon>
                <span>${this._localize('image_extractor.change_image')}</span>
              </div>
            ` : html`
              <ha-icon icon="mdi:image-plus" class="drop-icon"></ha-icon>
              <span class="drop-text">
                ${this._localize('image_extractor.drop_hint')}
              </span>
            `}
          </div>
          <input
            type="file"
            accept="image/*"
            style="display:none"
            @change=${this._handleFileSelected}
          />
        ` : html`
          <!-- URL mode -->
          <div class="url-input-row">
            <ha-textfield
              .value=${this._url}
              .label=${this._localize('image_extractor.url_label')}
              @input=${this._handleUrlInput}
              style="flex:1"
            ></ha-textfield>
          </div>
        `}

        <!-- Options -->
        <div class="option-row">
          <label class="option-toggle">
            <ha-switch
              .checked=${this._extractBrightness}
              @change=${this._handleBrightnessToggle}
            ></ha-switch>
            <span>${this._localize('image_extractor.extract_brightness')}</span>
          </label>
        </div>
        <div class="option-row">
          <label class="option-toggle">
            <ha-switch
              .checked=${this._saveThumbnail}
              @change=${this._handleThumbnailToggle}
            ></ha-switch>
            <span>${this._localize('image_extractor.save_thumbnail')}</span>
          </label>
        </div>

        <!-- Error display -->
        ${this._error ? html`
          <div class="error-message">${this._error}</div>
        ` : ''}

        <!-- Actions -->
        <div class="actions">
          <ha-button @click=${this._cancel}>
            ${this._localize('image_extractor.cancel_button')}
          </ha-button>
          <ha-button
            .disabled=${this._extracting || !this._hasInput()}
            @click=${this._extract}
          >
            ${this._extracting
              ? html`<ha-circular-progress indeterminate size="small"></ha-circular-progress>`
              : html`<ha-icon icon="mdi:palette-swatch"></ha-icon>`
            }
            ${this._localize('image_extractor.extract_button')}
          </ha-button>
        </div>
      </div>
    `;
  }

  private _hasInput(): boolean {
    if (this._mode === 'upload') return !!this._previewSrc;
    return !!this._url.trim();
  }

  private _triggerFileInput(): void {
    const input = this.shadowRoot!.querySelector('input[type="file"]') as HTMLInputElement | null;
    input?.click();
  }

  private _handleDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).classList.add('dragover');
  }

  private _handleDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).classList.remove('dragover');
  }

  private _handleDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).classList.remove('dragover');

    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this._setFilePreview(file);
    }
  }

  private _handleFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this._setFilePreview(file);
    }
  }

  private _setFilePreview(file: File): void {
    this._selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this._previewSrc = reader.result as string;
      this._error = '';
    };
    reader.readAsDataURL(file);
  }

  private _handleUrlInput(e: Event): void {
    this._url = (e.target as HTMLInputElement).value;
    this._error = '';
  }

  private _handleBrightnessToggle(e: Event): void {
    this._extractBrightness = (e.target as any).checked;
  }

  private _handleThumbnailToggle(e: Event): void {
    this._saveThumbnail = (e.target as any).checked;
  }

  private async _extract(): Promise<void> {
    if (this._extracting) return;

    this._extracting = true;
    this._error = '';

    try {
      let response: Response;

      if (this._mode === 'upload') {
        if (!this._selectedFile) {
          this._error = this._localize('image_extractor.error_no_file') || 'No file selected';
          return;
        }

        const formData = new FormData();
        formData.append('file', this._selectedFile);
        formData.append('num_colors', '8');
        formData.append('save_thumbnail', this._saveThumbnail ? 'true' : 'false');
        formData.append('extract_brightness', this._extractBrightness ? 'true' : 'false');

        response = await fetch(`${API_BASE}/extract_colors`, {
          method: 'POST',
          headers: this._getAuthHeaders(),
          body: formData,
        });
      } else {
        response = await fetch(`${API_BASE}/extract_colors`, {
          method: 'POST',
          headers: {
            ...this._getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: this._url.trim(),
            num_colors: 8,
            save_thumbnail: this._saveThumbnail,
            extract_brightness: this._extractBrightness,
          }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        this._error = errorText || (this._localize('image_extractor.error_server') || 'Error {status}').replace('{status}', String(response.status));
        return;
      }

      const result = await response.json();
      const colors: DynamicSceneColor[] = result.colors.map((c: any) => ({
        x: c.x,
        y: c.y,
        brightness_pct: c.brightness_pct,
      }));

      const detail: ColorsExtractedDetail = { colors };
      if (result.thumbnail_id) {
        detail.thumbnailId = result.thumbnail_id;
      }

      this.dispatchEvent(new CustomEvent('colors-extracted', {
        detail,
        bubbles: true,
        composed: true,
      }));

    } catch (ex: any) {
      this._error = ex.message || this._localize('image_extractor.error_failed') || 'Extraction failed';
    } finally {
      this._extracting = false;
    }
  }

  private _cancel(): void {
    this.dispatchEvent(new CustomEvent('extractor-cancelled', {
      bubbles: true,
      composed: true,
    }));
  }

  static styles = css`
    :host {
      display: block;
    }

    .extractor-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .mode-toggle {
      display: flex;
      gap: 4px;
      background: var(--secondary-background-color, #f5f5f5);
      border-radius: 8px;
      padding: 4px;
    }

    .mode-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--primary-text-color);
      font-size: 13px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .mode-btn.active {
      background: var(--card-background-color, #fff);
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }

    .mode-btn ha-icon {
      --mdc-icon-size: 18px;
    }

    .drop-zone {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 120px;
      border: 2px dashed var(--divider-color, #ddd);
      border-radius: 8px;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      overflow: hidden;
    }

    .drop-zone:hover,
    .drop-zone.dragover {
      border-color: var(--primary-color);
      background: rgba(var(--rgb-primary-color, 33,150,243), 0.05);
    }

    .drop-zone.has-preview {
      border-style: solid;
      min-height: 150px;
    }

    .preview-image {
      width: 100%;
      height: 150px;
      object-fit: cover;
      display: block;
    }

    .preview-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      background: rgba(0,0,0,0.5);
      color: white;
      opacity: 0;
      transition: opacity 0.2s;
      font-size: 13px;
    }

    .drop-zone:hover .preview-overlay {
      opacity: 1;
    }

    .drop-icon {
      --mdc-icon-size: 36px;
      color: var(--secondary-text-color);
    }

    .drop-text {
      color: var(--secondary-text-color);
      font-size: 13px;
    }

    .url-input-row {
      display: flex;
    }

    .url-input-row ha-textfield {
      width: 100%;
    }

    .option-row {
      display: flex;
      align-items: center;
    }

    .option-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--primary-text-color);
      cursor: pointer;
    }

    .error-message {
      color: var(--error-color, #db4437);
      font-size: 12px;
      padding: 4px 8px;
      background: rgba(var(--rgb-error-color, 219,68,55), 0.1);
      border-radius: 4px;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--divider-color);
    }
  `;
}
