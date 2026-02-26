/**
 * Shared constants and utilities for editor components.
 *
 * Consolidates DEVICE_LABELS, form CSS, and the _localize helper that were
 * previously duplicated across every editor file.
 */

import { css } from 'lit';
import type { Translations } from './types';

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
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--divider-color);
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
  }
`;
