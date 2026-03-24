/**
 * Shared constants and utilities for editor components.
 *
 * Consolidates DEVICE_LABELS, form CSS, and the _localize helper that were
 * previously duplicated across every editor file.
 */

import { css, html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import type { Translations, XYColor } from './types';
import { sharedFormStyles } from './styles/shared-form';

// Default color palettes shared across editors
export const DEFAULT_PALETTE: XYColor[] = [
  { x: 0.6800, y: 0.3100 },    // Red
  { x: 0.1700, y: 0.7000 },    // Green
  { x: 0.1500, y: 0.0600 },    // Blue
  { x: 0.4200, y: 0.5100 },    // Yellow
  { x: 0.3800, y: 0.1600 },    // Magenta
  { x: 0.2200, y: 0.3300 },    // Cyan
];

export const DEFAULT_GRADIENT_COLORS: XYColor[] = [
  { x: 0.6800, y: 0.3100 },  // Red
  { x: 0.1500, y: 0.0600 },  // Blue
];

export const DEFAULT_BLOCK_COLORS: XYColor[] = [
  { x: 0.6800, y: 0.3100 },  // Red
  { x: 0.1700, y: 0.7000 },  // Green
];

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

// Shared editor option list factories
type LocalizeFn = (key: string) => string;

export function loopModeOptions(loc: LocalizeFn) {
  return [
    { value: 'once', label: loc('options.loop_mode_once') },
    { value: 'count', label: loc('options.loop_mode_count') },
    { value: 'continuous', label: loc('options.loop_mode_continuous') },
  ];
}

export function endBehaviorOptions(loc: LocalizeFn, restoreKey = 'options.end_behavior_restore') {
  return [
    { value: 'maintain', label: loc('options.end_behavior_maintain') },
    { value: 'turn_off', label: loc('options.end_behavior_turn_off') },
    { value: 'restore', label: loc(restoreKey) },
  ];
}

/**
 * Editor form styles — composes the editor-specific :host/icon-fix
 * with the shared form rules from styles/shared-form.ts.
 *
 * Editor components import `editorFormStyles` from here; the alias
 * keeps existing imports working after the bulk CSS was moved.
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

  ${sharedFormStyles}
`;
