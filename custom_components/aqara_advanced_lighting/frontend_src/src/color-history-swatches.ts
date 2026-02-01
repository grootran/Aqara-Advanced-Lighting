/**
 * Shared color history swatches component
 * Displays recently used colors as clickable swatches with a clear button.
 * Fires events for color selection and history clearing.
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { xyToHex } from './color-utils';
import { XYColor } from './types';

@customElement('color-history-swatches')
export class ColorHistorySwatches extends LitElement {
  @property({ type: Array }) colorHistory: XYColor[] = [];
  @property({ type: Object }) translations: Record<string, any> = {};

  static styles = css`
    :host {
      display: block;
    }

    .color-history-section {
      margin: 16px 0 0;
      width: 100%;
    }

    .color-history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .color-history-label {
      font-size: var(--ha-font-size-s, 12px);
      font-weight: var(--ha-font-weight-medium, 500);
      color: var(--secondary-text-color);
    }

    .color-history-clear {
      background: none;
      border: none;
      color: var(--secondary-text-color);
      cursor: pointer;
      font-size: var(--ha-font-size-s, 12px);
      padding: 2px 6px;
      border-radius: 4px;
      transition: all 0.15s ease;
    }

    .color-history-clear:hover {
      color: var(--primary-color);
      background: var(--secondary-background-color);
    }

    .color-history-swatches {
      display: flex;
      gap: 6px;
    }

    .color-history-swatch {
      width: 32px;
      height: 32px;
      border: 2px solid var(--divider-color);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      padding: 0;
      flex-shrink: 0;
    }

    .color-history-swatch:hover {
      transform: scale(1.1);
      border-color: var(--primary-color);
    }

    .color-history-swatch:active {
      transform: scale(0.95);
    }
  `;

  private _localize(key: string): string {
    const keys = key.split('.');
    let translated: any = this.translations;

    for (const k of keys) {
      if (translated && typeof translated === 'object' && k in translated) {
        translated = translated[k];
      } else {
        return key;
      }
    }

    return typeof translated === 'string' ? translated : key;
  }

  private _handleColorClick(color: XYColor): void {
    this.dispatchEvent(new CustomEvent('color-selected', {
      detail: { color },
      bubbles: true,
      composed: true,
    }));
  }

  private _handleClear(): void {
    this.dispatchEvent(new CustomEvent('clear-history', {
      bubbles: true,
      composed: true,
    }));
  }

  protected render() {
    return html`
      <div class="color-history-section">
        <div class="color-history-header">
          <span class="color-history-label">
            ${this._localize('color_history.recent_colors')}
          </span>
          ${this.colorHistory.length > 0 ? html`
            <button class="color-history-clear" @click=${this._handleClear}>
              ${this._localize('color_history.clear')}
            </button>
          ` : ''}
        </div>
        <div class="color-history-swatches">
          ${this.colorHistory.map(color => html`
            <button
              class="color-history-swatch"
              style="background-color: ${xyToHex(color, 255)}"
              @click=${() => this._handleColorClick(color)}
            ></button>
          `)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'color-history-swatches': ColorHistorySwatches;
  }
}
