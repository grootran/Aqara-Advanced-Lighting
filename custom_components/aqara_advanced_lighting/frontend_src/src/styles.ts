import { css } from 'lit';

/**
 * Home Assistant-aligned panel styles
 * Uses HA CSS custom properties for theming compatibility
 * Following patterns from HA frontend src/styles/
 */
export const panelStyles = css`
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

  /* Fixed header - follows HA developer-tools pattern */
  .header {
    background-color: var(--app-header-background-color);
    color: var(--app-header-text-color, var(--text-primary-color));
    border-bottom: 1px solid var(--divider-color);
    position: fixed;
    top: 0;
    left: var(--mdc-drawer-width, 0px);
    right: 0;
    z-index: 4;
    padding-top: env(safe-area-inset-top, 0px);
  }

  :host([narrow]) .header {
    left: 0;
  }

  /* Toolbar - hamburger menu and title */
  .toolbar {
    display: flex;
    align-items: center;
    height: var(--header-height, 56px);
    padding: 0 12px;
    box-sizing: border-box;
  }

  .main-title {
    margin-left: 8px;
    font-size: 20px;
    font-weight: 400;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ha-tab-group - native HA tab component (same as Developer Tools) */
  ha-tab-group {
    --track-color: var(--divider-color);
    --indicator-color: var(--primary-color);
  }

  ha-tab-group-tab {
    --ha-tab-text-color: var(--secondary-text-color);
    --ha-tab-active-text-color: var(--wa-color-brand-on-quiet);
  }

  /* Content area with padding for fixed header */
  .content {
    padding: calc(var(--header-height, 56px) + 48px + 16px + env(safe-area-inset-top, 0px)) 16px 16px;
    max-width: 1200px;
    margin: 0 auto;
    box-sizing: border-box;
    min-height: 100vh;
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

  /* Controls section - now using ha-card */
  ha-card.controls {
    padding: 16px;
    margin-bottom: 24px;
  }

  .control-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .control-row:last-child {
    margin-bottom: 0;
  }

  /* Desktop layout: Target and Favorites side by side */
  .target-favorites-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .target-favorites-grid .control-row {
    margin-bottom: 0;
  }

  @media (min-width: 768px) {
    .target-favorites-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .control-label {
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--secondary-text-color);
    line-height: var(--ha-line-height-condensed, 1.2);
  }

  .quick-controls-label {
    color: var(--secondary-text-color);
  }

  .control-input {
    width: 100%;
  }

  .control-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .control-buttons ha-button {
    flex: 1 1 auto;
    min-width: 140px;
  }

  .control-buttons ha-icon {
    margin-right: 4px;
  }

  /* Running operations display */
  .running-ops-container {
    width: 100%;
  }

  .running-ops-empty {
    text-align: center;
    color: var(--secondary-text-color);
    padding: 12px 0;
    font-size: var(--ha-font-size-m, 14px);
  }

  .running-ops-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 8px;
    margin-top: 8px;
  }

  .running-op-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--card-background-color, var(--ha-card-background, #fff));
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: var(--ha-card-border-radius, 12px);
    gap: 8px;
  }

  .running-op-card.externally-paused {
    border-color: var(--warning-color, #ff9800);
    border-style: dashed;
  }

  .running-op-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .running-op-icon {
    color: var(--primary-color);
    flex-shrink: 0;
    --mdc-icon-size: 20px;
  }

  .running-op-details {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  .running-op-name {
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .running-op-entity {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .running-op-entity-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .running-op-progress {
    color: var(--primary-color);
    font-weight: var(--ha-font-weight-medium, 500);
  }

  .running-op-status {
    font-style: italic;
  }

  .externally-paused-text {
    color: var(--warning-color, #ff9800);
  }

  .running-op-actions {
    display: flex;
    align-items: center;
    gap: 0;
    flex-shrink: 0;
  }

  .running-op-actions ha-icon-button {
    --mdc-icon-button-size: 36px;
    --mdc-icon-size: 20px;
  }

  /* Target input with selector and favorite button */
  .target-input {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 8px;
    min-width: 0;
    width: 100%;
  }

  /* Target selector container */
  .target-selector {
    flex: 1;
    min-width: 200px;
  }

  .target-selector ha-selector {
    display: block;
    width: 100%;
  }

  .include-all-lights-toggle {
    margin-top: 8px;
  }

  .include-all-lights-toggle .toggle-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    cursor: pointer;
  }

  .add-favorite-btn {
    --mdc-icon-button-size: 36px;
    color: var(--primary-color);
    flex-shrink: 0;
  }

  .add-favorite-btn:hover {
    color: var(--accent-color, var(--primary-color));
  }

  /* Favorite inline input */
  .favorite-input-container {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .favorite-input-container ha-selector {
    flex: 1;
    min-width: 150px;
  }

  .favorite-input-container ha-button {
    flex-shrink: 0;
  }

  .favorite-input-buttons {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  /* Light tile card container - uses HA grid patterns */
  .light-tile-container {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  .light-tile-container hui-tile-card {
    --ha-card-background: var(--card-background-color);
    --ha-card-border-radius: var(--ha-card-border-radius, 12px);
    display: block;
    width: 100%;
  }

  /* Favorites container - compact grid layout */
  .favorites-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  @media (min-width: 768px) {
    .favorites-container {
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }
  }

  .favorite-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px 8px 8px 8px;
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    position: relative;
    overflow: hidden;
  }

  .favorite-button::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--primary-color);
    opacity: 0;
    transition: opacity 0.15s ease-in-out;
  }

  .favorite-button:hover::before {
    opacity: 0.08;
  }

  .favorite-button:hover {
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: var(--ha-card-box-shadow, 0 4px 8px rgba(0, 0, 0, 0.1));
  }

  .favorite-button:active {
    transform: translateY(0);
  }

  .favorite-button.selected {
    border-color: var(--primary-color);
    border-width: 2px;
  }

  .favorite-button.selected::before {
    opacity: 0.12;
  }

  .favorite-button-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: rgba(var(--rgb-primary-color), 0.2);
    border-radius: var(--ha-card-border-radius, 10px);
    flex-shrink: 0;
    transition: all 0.2s ease-in-out;
    position: relative;
    z-index: 1;
  }

  .favorite-button-icon ha-icon {
    --mdc-icon-size: 32px;
    color: var(--primary-color);
  }

  .favorite-button:hover .favorite-button-icon {
    background: rgba(var(--rgb-primary-color), 0.3);
  }

  .favorite-button:hover .favorite-button-icon ha-icon {
    color: var(--primary-color);
  }

  .favorite-button-content {
    flex: 1;
    width: 100%;
    text-align: center;
    min-width: 0;
    position: relative;
    z-index: 1;
  }

  .favorite-button-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--primary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.3;
  }

  .favorite-button-count {
    font-size: 11px;
    color: var(--secondary-text-color);
    margin-top: 2px;
  }

  .favorite-button-remove {
    position: absolute;
    top: 4px;
    right: 4px;
    --mdc-icon-button-size: 28px;
    --mdc-icon-size: 16px;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    z-index: 2;
  }

  .favorite-button:hover .favorite-button-remove {
    opacity: 0.6;
  }

  .favorite-button-remove ha-icon {
    color: var(--primary-text-color);
  }

  .favorite-button:hover .favorite-button-remove ha-icon {
    color: var(--text-primary-color);
  }

  .favorite-button-remove:hover {
    opacity: 1 !important;
  }

  /* Favorite button states */
  .favorite-button.state-off .favorite-button-icon {
    opacity: 0.4;
  }

  .favorite-button.state-off .favorite-button-count {
    opacity: 0.6;
  }

  .favorite-button.state-unavailable .favorite-button-icon {
    opacity: 0.3;
    filter: grayscale(100%);
  }

  .favorite-button.state-unavailable .favorite-button-count {
    opacity: 0.5;
  }

  .favorite-button.state-on:hover .favorite-button-icon {
    filter: none;
  }

  .favorite-button.state-off:hover .favorite-button-icon {
    opacity: 1;
    filter: none;
  }

  .favorite-button.state-unavailable:hover .favorite-button-icon {
    opacity: 1;
    filter: none;
  }

  /* ha-expansion-panel styling for sections - follows HA patterns */
  ha-expansion-panel {
    --expansion-panel-content-padding: 0 16px 16px 16px;
    --ha-card-border-radius: var(--ha-card-border-radius, 12px);
    margin-bottom: 16px;
    display: block;
  }

  ha-expansion-panel[outlined] {
    border-radius: var(--ha-card-border-radius, 12px);
    border: 1px solid var(--divider-color);
    background: var(--card-background-color);
  }

  /* Expansion panel header styling */
  ha-expansion-panel .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    cursor: default;
    margin-bottom: 0;
    user-select: none;
    padding: 8px;
  }

  ha-expansion-panel .section-header-controls {
    margin-right: 0;
  }

  /* Expansion panel content - consistent 16px padding */
  ha-expansion-panel .section-content {
    padding: 0;
  }

  /* Controls content inside expansion panel - flex column layout instead of grid */
  ha-expansion-panel .section-content.controls-content {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* Legacy section styling for ha-card - follows HA patterns */
  ha-card.section {
    --ha-card-background: var(--card-background-color, var(--primary-background-color));
    --ha-card-border-radius: var(--ha-card-border-radius, 12px);
    padding: 16px;
    margin-bottom: 16px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    cursor: pointer;
    user-select: none;
  }

  .section-title {
    font-size: var(--ha-font-size-l, 18px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--primary-text-color);
  }

  .section-subtitle {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    margin-top: 4px;
  }

  .section-header-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* Sort dropdown - compact inline select
   * Height is fixed at 56px by HA's ha-select internal shadow DOM */
  .sort-select {
    min-width: 100px;
    max-width: 150px;
  }

  /* Preset grid - uses HA layout patterns */
  .section-content {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .section-content.collapsed {
    display: none;
  }

  /* Preset buttons - follows HA card interaction patterns */
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
    transition: all 0.15s ease-in-out;
    min-height: 80px;
    position: relative;
    overflow: hidden;
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

  .preset-button.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .preset-button.disabled:hover {
    border-color: var(--divider-color);
    transform: none;
    box-shadow: none;
  }

  .preset-button.disabled::before {
    opacity: 0;
  }

  .preset-name {
    font-size: var(--ha-font-size-s, 13px);
    font-weight: var(--ha-font-weight-medium, 500);
    text-align: center;
    margin-top: 8px;
    position: relative;
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

  /* Loading state - follows HA patterns */
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px;
    font-size: var(--ha-font-size-m, 16px);
    color: var(--secondary-text-color);
  }

  /* HA native ha-alert component styling */
  ha-alert {
    display: block;
    margin-bottom: 16px;
  }

  .no-lights {
    text-align: center;
    padding: 40px;
    color: var(--secondary-text-color);
    font-size: var(--ha-font-size-m, 14px);
  }

  ha-selector {
    display: block;
    width: 100%;
  }

  ha-slider {
    width: 100%;
  }

  /* Tab content area */
  .tab-content {
    min-height: 200px;
  }

  /* Editor form styles - now using ha-card, follows HA form patterns */
  ha-card.editor-form {
    padding: 16px;
  }

  .editor-form h2 {
    font-size: var(--ha-font-size-xl, 20px);
    font-weight: var(--ha-font-weight-medium, 500);
    margin: 0 0 8px 0;
    color: var(--primary-text-color);
  }

  .form-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }

  .form-row:last-child {
    margin-bottom: 0;
  }

  .form-label {
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-medium, 500);
    min-width: 120px;
    color: var(--secondary-text-color);
  }

  .form-hint {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    margin-top: -4px;
  }

  .form-input {
    flex: 1;
  }

  /* Vertical form section - label above content, left-aligned */
  .form-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .form-section .form-label {
    min-width: unset;
  }

  /* Activation overrides grid - 4 columns desktop, 2 columns mobile */
  .overrides-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 16px 0;
  }

  .override-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .override-item .form-label {
    min-width: unset;
    font-size: var(--ha-font-size-s, 12px);
  }

  .brightness-slider {
    padding: 0 16px 8px;
  }

  /* Two-column form row for Name/Icon on desktop */
  .form-row-pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .form-row-pair .form-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-row-pair .form-field .form-label {
    min-width: unset;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--divider-color);
  }

  /* Step list styles - follows HA list patterns */
  .step-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .step-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: var(--card-background-color);
    border-radius: var(--ha-border-radius-sm, 8px);
    border: 1px solid var(--divider-color);
  }

  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--primary-color);
    color: var(--text-primary-color);
    border-radius: 50%;
    font-size: var(--ha-font-size-s, 12px);
    font-weight: var(--ha-font-weight-medium, 600);
    flex-shrink: 0;
  }

  .step-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .step-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .step-field {
    flex: 1;
    min-width: 120px;
  }

  .step-field-label {
    font-size: var(--ha-font-size-xs, 11px);
    color: var(--secondary-text-color);
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .step-actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .step-actions ha-icon-button {
    --mdc-icon-button-size: 32px;
    --mdc-icon-size: 18px;
  }

  .add-step-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    border: 2px dashed var(--divider-color);
    border-radius: var(--ha-border-radius-sm, 8px);
    cursor: pointer;
    color: var(--secondary-text-color);
    transition: all 0.15s ease-in-out;
  }

  .add-step-btn:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: var(--secondary-background-color);
  }

  /* Segment grid editor - follows HA grid patterns */
  .segment-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 4px;
    padding: 12px;
    background: var(--card-background-color);
    border-radius: var(--ha-border-radius-sm, 8px);
  }

  .segment-cell {
    aspect-ratio: 1;
    border-radius: var(--ha-border-radius-sm, 4px);
    cursor: pointer;
    border: 2px solid var(--divider-color);
    transition: all 0.15s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--ha-font-size-xs, 10px);
    font-weight: var(--ha-font-weight-medium, 600);
    color: var(--secondary-text-color);
  }

  .segment-cell:hover {
    transform: scale(1.1);
    z-index: 1;
  }

  .segment-cell.selected {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-color);
  }

  .segment-cell.colored {
    border-color: transparent;
  }

  .preset-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Preset list item - follows HA list-item patterns */
  .preset-list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--card-background-color);
    border-radius: var(--ha-border-radius-sm, 8px);
    border: 1px solid var(--divider-color);
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .preset-list-item:hover {
    background: var(--secondary-background-color);
  }

  .preset-list-item-info {
    flex: 1;
  }

  .preset-list-item-name {
    font-weight: var(--ha-font-weight-medium, 500);
    font-size: var(--ha-font-size-m, 14px);
  }

  .preset-list-item-description {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    margin-top: 2px;
  }

  .preset-list-item-meta {
    font-size: var(--ha-font-size-xs, 11px);
    color: var(--secondary-text-color);
    margin-top: 4px;
  }

  .preset-list-item-actions {
    display: flex;
    gap: 4px;
  }

  .preset-list-item-actions ha-icon-button {
    --mdc-icon-button-size: 32px;
    --mdc-icon-size: 18px;
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: var(--secondary-text-color);
  }

  .empty-state-icon {
    --mdc-icon-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-state-text {
    font-size: var(--ha-font-size-m, 14px);
  }

  /* Editor description */
  .editor-description {
    font-size: var(--ha-font-size-m, 14px);
    color: var(--secondary-text-color);
    margin-bottom: 24px;
    line-height: var(--ha-line-height-normal, 1.5);
  }

  /* Placeholder styles */
  .coming-soon {
    text-align: center;
    padding: 60px 20px;
    color: var(--secondary-text-color);
    background: var(--card-background-color);
    border-radius: var(--ha-card-border-radius, 12px);
    border: 2px dashed var(--divider-color);
    font-size: var(--ha-font-size-m, 14px);
  }

  /* Toolbar actions for export/import buttons */
  .toolbar-actions {
    display: flex;
    gap: 8px;
    margin: 16px 0;
  }

  .toolbar-actions ha-button {
    font-size: var(--ha-font-size-s, 13px);
  }

  /* No presets empty state - follows HA empty state patterns */
  .no-presets {
    text-align: center;
    padding: 60px 20px;
    color: var(--secondary-text-color);
    background: var(--card-background-color);
    border-radius: var(--ha-card-border-radius, 12px);
  }

  .no-presets ha-icon {
    --mdc-icon-size: 48px;
    opacity: 0.5;
    margin-bottom: 16px;
    display: block;
  }

  .no-presets p {
    margin: 8px 0;
    font-size: var(--ha-font-size-m, 14px);
  }

  /* User preset button styling in Activate tab */
  .preset-button.user-preset {
    border-color: var(--primary-color);
    border-style: dashed;
    border-width: 2px;
  }

  .preset-button.user-preset:hover {
    border-style: solid;
  }

  /* My Presets management section content */
  .preset-management-content {
    display: block;
  }

  /* Preset grid for My Presets tab */
  .preset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  /* User preset card with action buttons - follows HA card patterns */
  .user-preset-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px;
    background: var(--card-background-color);
    border: 2px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    min-height: 80px;
    overflow: hidden;
  }

  .user-preset-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--primary-color);
    opacity: 0;
    transition: opacity 0.15s ease-in-out;
  }

  .user-preset-card:hover::before {
    opacity: 0.08;
  }

  .user-preset-card:hover {
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: var(--ha-card-box-shadow, 0 4px 8px rgba(0, 0, 0, 0.1));
  }

  .user-preset-card:active {
    transform: translateY(0);
  }

  .user-preset-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .user-preset-card.disabled:hover {
    border-color: var(--divider-color);
    transform: none;
    box-shadow: none;
  }

  .user-preset-card.disabled::before {
    opacity: 0;
  }

  .user-preset-card .preset-icon {
    font-size: 40px;
    margin-bottom: 8px;
    line-height: 1;
    position: relative;
    --mdc-icon-size: 40px;
  }

  .user-preset-card .preset-name {
    font-size: var(--ha-font-size-s, 12px);
    text-align: center;
    font-weight: var(--ha-font-weight-medium, 500);
    line-height: 1.2;
    word-break: break-word;
    max-width: 100%;
    position: relative;
  }

  /* Action buttons overlay */
  .preset-card-actions {
    position: absolute;
    top: 4px;
    right: 4px;
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.15s ease-in-out;
    background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.6);
    border-radius: var(--ha-border-radius-sm, 4px);
    padding: 2px;
    z-index: 1;
  }

  .user-preset-card:hover .preset-card-actions,
  .user-preset:hover .preset-card-actions,
  .builtin-preset:hover .preset-card-actions {
    opacity: 1;
  }


  .preset-card-actions ha-icon-button,
  .preset-card-actions .favorite-star {
    --mdc-icon-button-size: 28px;
    --mdc-icon-size: 16px;
    color: var(--text-primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preset-card-actions .favorite-star.favorited {
    color: var(--accent-color, #ffc107);
  }

  .preset-card-actions ha-icon-button ha-icon,
  .preset-card-actions .favorite-star ha-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preset-card-actions ha-icon-button:hover,
  .preset-card-actions .favorite-star:hover {
    background: rgba(var(--rgb-text-primary-color, 255, 255, 255), 0.2);
    border-radius: var(--ha-border-radius-sm, 4px);
  }

  /* Music sync section */
  .music-sync-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  @media (min-width: 768px) {
    .music-sync-content {
      grid-template-columns: 1fr 1fr;
      gap: 16px 24px;
    }
  }

  .music-sync-left {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    align-items: center;
  }

  .music-sync-right {
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: opacity 0.2s ease;
  }

  .music-sync-right.disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  .music-sync-right .control-label {
    font-size: var(--ha-font-size-s, 13px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--secondary-text-color);
  }

  .music-sync-toggle .toggle-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .music-sync-sensitivity-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: opacity 0.2s ease;
  }

  .music-sync-sensitivity-group.disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  .music-sync-sensitivity-group .control-label {
    font-size: var(--ha-font-size-s, 13px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--secondary-text-color);
  }

  .music-sync-sensitivity {
    display: flex;
    gap: 8px;
  }

  .music-sync-sensitivity ha-button {
    font-size: var(--ha-font-size-s, 13px);
  }

  .music-sync-sensitivity ha-button[appearance="outlined"]::part(base) {
    border-color: var(--divider-color);
  }

  .music-sync-effects {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }

  .preset-button.music-sync-active {
    border-color: var(--primary-color);
    background: rgba(var(--rgb-primary-color), 0.12);
  }

  .preset-button.music-sync-active .preset-name {
    color: var(--primary-color);
  }

  .music-sync-effects .effect-icon {
    width: 100%;
    height: 100%;
    background-color: var(--primary-text-color);
    -webkit-mask-size: contain;
    mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-position: center;
    mask-position: center;
  }

  .preset-button.music-sync-active .effect-icon {
    background-color: var(--primary-color);
  }

  /* Responsive styles - follows HA breakpoints */
  @media (max-width: 600px) {
    .content {
      padding: calc(var(--header-height, 56px) + 48px + 8px + env(safe-area-inset-top, 0px)) 8px 8px;
    }

    .toolbar {
      padding: 0 4px;
    }

    .main-title {
      font-size: 18px;
    }

    ha-tab-group-tab {
      font-size: 12px;
    }

    .light-tile-container {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 8px;
    }

    .section-content {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 8px;
    }

    .preset-button {
      padding: 8px;
      min-height: 60px;
    }

    .preset-name {
      font-size: var(--ha-font-size-xs, 11px);
    }

    /* Target selector takes full width on mobile */
    .target-selector {
      min-width: 100%;
    }

    /* Favorite input mobile - buttons below text field */
    .favorite-input-container {
      flex-direction: column;
      align-items: stretch;
    }

    .favorite-input-container ha-selector {
      width: 100%;
      min-width: unset;
    }

    .favorite-input-buttons {
      justify-content: flex-end;
    }
  }

  /* Mobile responsive form styles */
  @media (max-width: 600px) {
    .form-row {
      flex-direction: column;
      align-items: stretch;
    }

    .form-row-pair {
      grid-template-columns: 1fr;
    }

    .form-label {
      min-width: unset;
      margin-bottom: 4px;
    }

    .step-row {
      flex-direction: column;
    }

    .step-field {
      min-width: unset;
    }

    /* Sort dropdown mobile styles */
    .sort-select {
      min-width: 80px;
    }

    .section-header-controls {
      gap: 4px;
    }

    .preset-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 8px;
    }

    .user-preset-card {
      padding: 8px;
      min-height: 60px;
    }

    .user-preset-card .preset-icon {
      font-size: 36px;
      margin-bottom: 4px;
      --mdc-icon-size: 36px;
    }

    .user-preset-card .preset-name {
      font-size: var(--ha-font-size-xs, 11px);
    }

    .overrides-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .music-sync-content {
      grid-template-columns: 1fr;
    }
  }

  /* HA dialog fullscreen on mobile - follows haStyleDialog */
  @media all and (max-width: 450px), all and (max-height: 500px) {
    ha-dialog {
      --ha-dialog-width-md: calc(100vw - env(safe-area-inset-right) - env(safe-area-inset-left));
      --ha-dialog-max-width: calc(100vw - env(safe-area-inset-right) - env(safe-area-inset-left));
      --ha-dialog-min-height: 100%;
      --ha-dialog-max-height: 100%;
      --vertical-align-dialog: flex-end;
      --ha-dialog-border-radius: 0;
    }
  }

  /* Version display in toolbar */
  .version-display {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    font-size: var(--ha-font-size-xs, 11px);
    color: var(--secondary-text-color);
    margin-left: 8px;
    white-space: nowrap;
  }

  .version-display ha-icon {
    --mdc-icon-size: 14px;
  }

  .version-display .version-text {
    line-height: 1.3;
  }

  .version-display.version-mismatch {
    color: var(--warning-color);
  }

  .setup-badge {
    margin-right: 4px;
    padding: 1px 6px;
    background: var(--primary-color);
    color: var(--text-primary-color);
    border-radius: 8px;
    font-size: var(--ha-font-size-xs, 10px);
    font-weight: 500;
    white-space: nowrap;
  }

  /* Transition settings responsive grid - mobile first */
  .transition-settings-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0;
  }

  .transition-curve-column {
    border-bottom: 1px solid var(--divider-color);
  }

  .initial-brightness-column {
    display: flex;
    flex-direction: column;
  }

  .initial-brightness-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
  }

  .initial-brightness-content .form-section {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .initial-brightness-content .form-label {
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--secondary-text-color);
    margin-bottom: 16px;
  }

  /* Desktop view - side by side layout */
  @media (min-width: 768px) {
    .transition-settings-grid {
      grid-template-columns: 1fr 1fr;
    }

    .transition-curve-column {
      border-bottom: none;
      border-right: 1px solid var(--divider-color);
    }
  }

  :host([narrow]) .transition-settings-grid {
    grid-template-columns: 1fr;
  }

  :host([narrow]) .transition-curve-column {
    border-right: none;
    border-bottom: 1px solid var(--divider-color);
  }

  /* Compatibility warning in editor tabs */
  .compatibility-warning {
    margin-bottom: 16px;
  }

  /* Dimming settings responsive grid - mobile first */
  .dimming-settings-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0;
  }

  .dimming-setting-item {
    border-bottom: 1px solid var(--divider-color);
  }

  .dimming-setting-item:last-child {
    border-bottom: none;
  }

  .dimming-setting-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dimming-setting-content .form-label {
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--secondary-text-color);
  }

  .entity-not-found {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
  }

  /* Desktop view - 2x2 grid layout for dimming settings */
  @media (min-width: 768px) {
    .dimming-settings-grid {
      grid-template-columns: 1fr 1fr;
    }

    .dimming-setting-item {
      border-bottom: 1px solid var(--divider-color);
    }

    .dimming-setting-item:nth-child(odd) {
      border-right: 1px solid var(--divider-color);
    }

    .dimming-setting-item:nth-last-child(-n+2) {
      border-bottom: none;
    }
  }

  :host([narrow]) .dimming-settings-grid {
    grid-template-columns: 1fr;
  }

  :host([narrow]) .dimming-setting-item {
    border-bottom: 1px solid var(--divider-color);
  }

  :host([narrow]) .dimming-setting-item:nth-child(odd) {
    border-right: none;
  }

  :host([narrow]) .dimming-setting-item:last-child {
    border-bottom: none;
  }

  /* Curve control styles for transition settings */
  .curve-control-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
  }

  .curve-control-info {
    flex: 1;
  }

  .curve-control-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .curve-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: var(--ha-font-size-xs, 11px);
    color: var(--secondary-text-color);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .legend-dot.fast-slow {
    background: var(--warning-color, #ffc107);
  }

  .legend-dot.linear {
    background: var(--success-color, #4caf50);
  }

  .legend-dot.slow-fast {
    background: var(--primary-color, #03a9f4);
  }

  /* Mobile: stack curve controls */
  @media (max-width: 767px) {
    .curve-control-row {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .curve-control-actions {
      justify-content: space-between;
    }

    .curve-legend {
      justify-content: center;
    }
  }

  /* Z2M Instances Grid Styles */
  .z2m-instances-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    padding: 16px;
  }

  .z2m-instance-card {
    background: var(--card-background-color, var(--ha-card-background));
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .z2m-instance-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .z2m-instance-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .z2m-instance-name {
    font-size: var(--ha-font-size-l, 16px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--primary-text-color);
    word-break: break-word;
  }

  .z2m-instance-topic {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    word-break: break-word;
  }

  .z2m-instance-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .z2m-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 12px;
    min-width: 60px;
  }

  .z2m-stat-value {
    font-size: var(--ha-font-size-xl, 20px);
    font-weight: var(--ha-font-weight-bold, 600);
    color: var(--primary-color);
  }

  .z2m-stat-label {
    font-size: var(--ha-font-size-xs, 11px);
    color: var(--secondary-text-color);
    text-align: center;
    white-space: nowrap;
  }

  .z2m-devices-list {
    margin-top: 4px;
    padding-top: 8px;
    border-top: 1px solid var(--divider-color);
  }

  .z2m-devices-list details summary {
    user-select: none;
  }

  .z2m-devices-list details[open] summary {
    margin-bottom: 4px;
  }

  /* Mobile adjustments for Z2M instances */
  @media (max-width: 480px) {
    .z2m-instances-grid {
      grid-template-columns: 1fr;
      padding: 12px;
      gap: 12px;
    }

    .z2m-instance-stats {
      gap: 8px;
    }

    .z2m-stat {
      flex: 1;
      min-width: 50px;
      padding: 6px 8px;
    }
  }

  /* Segment zone management styles */
  .zone-device-section {
    padding: 16px;
    border-bottom: 1px solid var(--divider-color);
  }

  .zone-device-section:last-child {
    border-bottom: none;
  }

  .zone-device-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--primary-text-color);
  }

  .zone-device-segments {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    font-weight: normal;
    margin-left: auto;
  }

  .zone-empty-message {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    padding: 8px 0;
  }

  .zone-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .zone-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-border-radius-sm, 4px);
    background: var(--secondary-background-color);
  }

  .zone-row-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .zone-name-input {
    flex: 1;
    min-width: 0;
  }

  .zone-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
`;

/**
 * Shared color picker styles for editor components.
 * Import this instead of panelStyles when you only need color picker styling.
 */
export const colorPickerStyles = css`
  /* =========================================
   * UNIFORM COLOR PICKER STYLES
   * Standard variant: for color arrays (Effects, Gradient, Blocks, Sequence Steps)
   * Palette variant: for pattern-editor Individual mode (selectable fixed colors)
   * ========================================= */

  /* Color picker container */
  .color-picker-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  /* Individual color item wrapper */
  .color-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  /* Color swatch - 48px for good touch targets */
  .color-swatch {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    cursor: pointer;
    border: 2px solid var(--divider-color);
    transition: all 0.2s ease;
  }

  .color-swatch:hover {
    transform: scale(1.05);
    border-color: var(--primary-color);
  }

  /* Hidden native input overlays the swatch */
  .color-swatch input[type="color"] {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    top: 0;
    left: 0;
    border: none;
    padding: 0;
  }

  /* Edit/Remove button below color swatch */
  .color-edit-btn {
    padding: 4px;
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .color-edit-btn:hover {
    background: var(--primary-color);
    color: var(--text-primary-color);
  }

  .color-edit-btn ha-icon {
    --mdc-icon-size: 16px;
  }

  /* Delete button variant */
  .color-remove {
    padding: 4px;
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .color-remove:hover {
    background: var(--error-color);
    color: var(--text-primary-color);
  }

  .color-remove ha-icon {
    --mdc-icon-size: 16px;
  }

  /* Invisible spacer to maintain alignment when delete button is hidden */
  .color-remove-spacer {
    height: 26px;
    visibility: hidden;
  }

  /* Add color button - matches color-item layout */
  .add-color-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
    flex-shrink: 0;
  }

  .add-color-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border: 2px dashed var(--divider-color);
    border-radius: 8px;
    cursor: pointer;
    color: var(--secondary-text-color);
    background: transparent;
    transition: all 0.15s ease;
  }

  .add-color-btn:not(.disabled):hover .add-color-icon {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: var(--secondary-background-color);
  }

  .add-color-btn.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* =========================================
   * PALETTE VARIANT
   * For pattern-editor Individual mode (selectable fixed colors)
   * ========================================= */

  /* Palette container */
  .color-palette {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  /* Palette color wrapper with edit button */
  .palette-color-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  /* Selectable palette swatch */
  .palette-color {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 3px solid var(--divider-color);
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .palette-color:hover {
    transform: scale(1.08);
  }

  .palette-color.selected {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-color);
  }

  /* Small edit button below palette swatch */
  .palette-edit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 50%;
    background: var(--secondary-background-color);
    color: var(--secondary-text-color);
    cursor: pointer;
    padding: 0;
    transition: all 0.15s ease;
    --mdc-icon-size: 14px;
  }

  .palette-edit-btn:hover {
    background: var(--primary-color);
    color: var(--text-primary-color);
  }

  /* Color picker ha-dialog styling
   * Fixed width sized for 8 color history swatches:
   * 8 x 32px swatches + 7 x 6px gaps = 298px content + 48px padding = 346px
   */
  ha-dialog {
    --ha-dialog-width-md: min(346px, calc(100vw - 32px));
    --ha-dialog-max-width: min(346px, calc(100vw - 32px));
  }

  .color-picker-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .color-picker-modal-title {
    font-size: 18px;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .color-picker-modal-preview {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    border: 2px solid var(--divider-color);
  }

`;
