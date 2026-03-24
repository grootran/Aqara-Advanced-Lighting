import { css } from 'lit';

/**
 * Panel config — transition settings, dimming settings, curvature controls,
 * instance cards, and segment zone management.
 */
export const configStyles = css`
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

  /* Instance card grid styles */
  .instance-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    padding: 16px;
  }

  .instance-card {
    background: var(--card-background-color, var(--ha-card-background));
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .instance-header {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .instance-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: var(--ha-font-size-xs, 11px);
    font-weight: var(--ha-font-weight-bold, 600);
    letter-spacing: 0.03em;
    text-transform: uppercase;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .instance-badge--z2m {
    background: #e1a700;
    color: #1a1400;
  }

  .instance-badge--zha {
    background: #db4437;
    color: #fff;
  }

  .instance-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .instance-name {
    font-size: var(--ha-font-size-l, 16px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--primary-text-color);
    word-break: break-word;
  }

  .instance-topic {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    word-break: break-word;
  }

  .instance-type-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .instance-type-chip {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 8px;
    font-size: var(--ha-font-size-xs, 11px);
    font-weight: var(--ha-font-weight-medium, 500);
    background: var(--secondary-background-color);
    color: var(--secondary-text-color);
    white-space: nowrap;
  }

  .instance-device-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--divider-color);
  }

  .instance-device-chip {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 14px;
    font-size: var(--ha-font-size-s, 12px);
    background: var(--secondary-background-color);
    color: var(--primary-text-color);
    white-space: nowrap;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .instance-device-chip--more {
    cursor: pointer;
    color: var(--primary-color);
    background: transparent;
    border: 1px solid var(--primary-color);
    max-width: none;
  }

  .instance-device-chip--more:hover {
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
  }

  /* Mobile adjustments for instance cards */
  @media (max-width: 480px) {
    .instance-grid {
      grid-template-columns: 1fr;
      padding: 12px;
      gap: 12px;
    }

    .instance-type-chips {
      gap: 4px;
    }

    .instance-device-chips {
      gap: 4px;
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
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--primary-text-color);
  }

  .zone-device-segments {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    font-weight: normal;
    margin-left: auto;
  }

  .zone-device-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
  }

  .zone-device-toolbar .toolbar-spacer {
    flex: 1;
  }

  .zone-unsaved-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--ha-font-size-s, 12px);
    color: var(--warning-color);
  }

  .zone-unsaved-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--warning-color);
  }

  .zone-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 16px;
    color: var(--secondary-text-color);
  }

  .zone-empty-state ha-icon {
    --mdc-icon-size: 40px;
    opacity: 0.5;
  }

  .zone-empty-state .zone-empty-title {
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-medium, 500);
  }

  .zone-empty-state .zone-empty-hint {
    font-size: var(--ha-font-size-s, 12px);
    text-align: center;
    max-width: 280px;
  }

  .zone-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }

  .zone-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    border: 1px solid var(--divider-color);
    border-left: 3px solid var(--primary-color);
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

  .zone-row-header ha-icon-button {
    color: var(--secondary-text-color);
    transition: color 0.2s ease;
  }

  .zone-row-header ha-icon-button:hover {
    color: var(--error-color);
  }

  /* Responsive config */
  @media (max-width: 600px) {
    .zone-btn-label {
      display: none;
    }
  }
`;
