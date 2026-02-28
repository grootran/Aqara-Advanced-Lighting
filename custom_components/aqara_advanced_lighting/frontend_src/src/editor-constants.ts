/**
 * Shared constants and utilities for editor components.
 *
 * Consolidates DEVICE_LABELS, form CSS, and the _localize helper that were
 * previously duplicated across every editor file.
 */

import { css, html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import type { Translations } from './types';

// mdi:close SVG path for ha-icon-button .path property (old ha-dialog heading)
const mdiClose = 'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z';

/**
 * Detect whether the current HA frontend uses the new WebAwesome-based
 * ha-dialog (2026.3+) which has headerTitle/footer slots, or the old
 * MDC-based ha-dialog (2026.2 and earlier) which uses .heading property
 * and primaryAction/secondaryAction slots.
 *
 * Cached after first check for performance.
 */
let _newDialogApi: boolean | undefined;
export function hasNewHaDialog(): boolean {
  if (_newDialogApi !== undefined) return _newDialogApi;
  const ctor = customElements.get('ha-dialog') as any;
  if (!ctor) {
    // Element not yet defined; don't cache, re-check next call
    return false;
  }
  _newDialogApi = 'headerTitle' in (ctor.prototype ?? {});
  return _newDialogApi;
}

/**
 * Build a .heading TemplateResult for the old MDC-based ha-dialog.
 * Includes a close button and title, with optional trailing content
 * (e.g., color preview swatch) rendered inline in the header.
 */
export function dialogHeadingLegacy(
  title: string,
  trailingContent?: TemplateResult,
): TemplateResult {
  return html`
    <div class="header_title">
      <ha-icon-button
        .label=${'Close'}
        .path=${mdiClose}
        dialogAction="close"
        class="header_button"
      ></ha-icon-button>
      <span>${title}</span>
      ${trailingContent ?? nothing}
    </div>
  `;
}

/**
 * Render dialog action buttons that work on both old and new ha-dialog.
 *
 * Old ha-dialog: renders into primaryAction/secondaryAction slots.
 * New ha-dialog: renders into a footer slot div.
 */
export function dialogActions(
  cancelLabel: string,
  confirmLabel: string,
  onCancel: (e: Event) => void,
  onConfirm: (e: Event) => void,
  confirmIcon?: string,
): TemplateResult {
  if (hasNewHaDialog()) {
    return html`
      <div slot="footer">
        <ha-button @click=${onCancel}>${cancelLabel}</ha-button>
        <ha-button @click=${onConfirm}>
          ${confirmIcon ? html`<ha-icon icon=${confirmIcon}></ha-icon>` : nothing}
          ${confirmLabel}
        </ha-button>
      </div>
    `;
  }
  return html`
    <ha-button slot="secondaryAction" @click=${onCancel}>
      ${cancelLabel}
    </ha-button>
    <ha-button slot="primaryAction" @click=${onConfirm}>
      ${confirmIcon ? html`<ha-icon icon=${confirmIcon}></ha-icon>` : nothing}
      ${confirmLabel}
    </ha-button>
  `;
}

/** Human-readable labels for segment device types. */
export const DEVICE_LABELS: Record<string, string> = {
  t1: 'T1 (20 segments)',
  t1m: 'T1M (26 segments)',
  t1_strip: 'T1 Strip (up to 50 segments)',
};

/** Human-readable labels for all device types (including non-segment). */
export const ALL_DEVICE_LABELS: Record<string, string> = {
  t2_bulb: 'T2 Bulb',
  ...DEVICE_LABELS,
};

/**
 * Resolve a dot-separated key from a nested translations object.
 *
 * Supports placeholder replacement: `{name}` in the resolved string is
 * replaced by the value of `replacements.name`.
 */
export function localize(
  translations: Translations,
  key: string,
  replacements?: Record<string, string>,
): string {
  const keys = key.split('.');
  let value: string | Translations = translations;
  for (const k of keys) {
    if (typeof value !== 'object' || !(k in value)) {
      return key;
    }
    const next: string | Translations | undefined = value[k];
    if (next === undefined) return key;
    value = next;
  }
  let result = typeof value === 'string' ? value : key;

  if (replacements) {
    Object.entries(replacements).forEach(([placeholder, replacement]) => {
      result = result.replace(`{${placeholder}}`, replacement);
    });
  }

  return result;
}

/**
 * Shared form layout CSS used by all editor components.
 *
 * Covers `.editor-content`, `.form-row`, `.form-row-pair`, `.form-row-triple`,
 * `.form-section`, `.form-label`, `.form-input`, `.form-actions`,
 * `.form-hint`, `.field-description`, `.preview-warning`, and their
 * responsive breakpoints.
 */
export const editorFormStyles = css`
  :host {
    display: block;
  }

  /* Fix ha-svg-icon vertical misalignment inside ha-icon-button.
   * ha-svg-icon sets vertical-align: middle in its shadow DOM.
   * Making ha-icon a flex container neutralizes this. */
  ha-icon-button > ha-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .editor-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-row {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .form-row-pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .form-row-triple {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .form-row-pair .form-field,
  .form-row-triple .form-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .form-section .form-label {
    min-width: unset;
  }

  .form-label {
    font-size: 14px;
    font-weight: 500;
    min-width: 120px;
    color: var(--secondary-text-color);
  }

  .field-description {
    font-size: 12px;
    color: var(--secondary-text-color);
    margin-top: 4px;
  }

  .form-input {
    flex: 1;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    align-items: center;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--divider-color);
  }

  .form-actions-left {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-right: auto;
  }

  .unsaved-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--ha-font-size-s, 12px);
    color: var(--warning-color);
    white-space: nowrap;
  }

  .unsaved-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--warning-color);
    flex-shrink: 0;
  }

  .preview-warning {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--secondary-background-color);
    color: var(--secondary-text-color);
    border: 1px solid var(--divider-color);
    border-left: 4px solid var(--warning-color, #ffc107);
    border-radius: 4px;
    font-size: 13px;
  }

  .preview-warning ha-icon {
    flex-shrink: 0;
    --mdc-icon-size: 18px;
  }

  .icon-field-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icon-field-row ha-selector {
    flex: 1;
  }

  .icon-clear-btn {
    --ha-icon-button-size: 32px;
    --mdc-icon-button-size: 32px;
    --mdc-icon-size: 18px;
    color: var(--secondary-text-color);
  }

  .form-hint {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    margin-top: -4px;
  }

  @media (max-width: 600px) {
    .form-row {
      flex-direction: column;
      align-items: stretch;
    }

    .form-row-pair,
    .form-row-triple {
      grid-template-columns: 1fr;
    }

    .form-label {
      min-width: unset;
      margin-bottom: 4px;
    }

    .form-actions .btn-text {
      display: none;
    }

    .form-actions {
      gap: 8px;
    }
  }
`;
