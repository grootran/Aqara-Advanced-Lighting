import { css } from 'lit';

/**
 * Base styles — :host reset, icon-button fix, scrollbar styling.
 * Follows HA haStyle and haStyleScrollbar patterns.
 */
export const baseStyles = css`
  /* Base styles - follows HA haStyle patterns */
  :host {
    display: block;
    height: 100%;
    background-color: var(--primary-background-color);
    color: var(--primary-text-color);
    font-family: var(--ha-font-family-body, var(--paper-font-body1_-_font-family, Roboto, sans-serif));
    font-size: var(--ha-font-size-m, 14px);
    line-height: var(--ha-line-height-normal, 1.5);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    /* Prevent layout shift when ha-dialog hides the scrollbar */
    overflow-y: scroll;
    scrollbar-gutter: stable;
  }

  /* Fix ha-svg-icon vertical misalignment inside ha-icon-button.
   * ha-svg-icon sets vertical-align: middle on its :host inside ha-icon's
   * shadow DOM which we can't reach. Making ha-icon a flex container
   * neutralizes the vertical-align on its shadow child. */
  ha-icon-button > ha-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* HA scrollbar styling (from haStyleScrollbar) */
  ::-webkit-scrollbar {
    width: 0.4rem;
    height: 0.4rem;
  }

  ::-webkit-scrollbar-thumb {
    -webkit-border-radius: 4px;
    border-radius: 4px;
    background: var(--scrollbar-thumb-color, var(--divider-color));
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }
`;
