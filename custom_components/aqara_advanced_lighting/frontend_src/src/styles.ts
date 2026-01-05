import { css } from 'lit';

export const panelStyles = css`
  :host {
    display: block;
    padding: 16px;
    background-color: var(--card-background-color, #fff);
    color: var(--primary-text-color, #000);
    font-family: var(--paper-font-body1_-_font-family);
    max-width: 1200px;
    margin: 0 auto;
  }

  .panel-header {
    margin-bottom: 24px;
  }

  .panel-title {
    font-size: 24px;
    font-weight: 500;
    margin: 0 0 8px 0;
    color: var(--primary-text-color);
  }

  .controls {
    background: var(--primary-background-color);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;
  }

  .control-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }

  .control-row:last-child {
    margin-bottom: 0;
  }

  .control-label {
    font-size: 14px;
    font-weight: 500;
    min-width: 80px;
    color: var(--secondary-text-color);
  }

  .control-input {
    flex: 1;
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

  /* Target input with add favorite button */
  .target-input {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .target-input ha-selector {
    flex: 1;
  }

  .add-favorite-btn {
    --mdc-icon-button-size: 40px;
    color: var(--primary-color);
  }

  .add-favorite-btn:hover {
    color: var(--accent-color);
  }

  /* Favorite inline input */
  .favorite-input-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .favorite-input-container ha-selector {
    flex: 1;
  }

  .favorite-input-container ha-button {
    flex-shrink: 0;
  }

  /* Light tile card container */
  .light-tile-container {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  .light-tile-container hui-tile-card {
    --ha-card-background: var(--card-background-color);
    --ha-card-border-radius: 12px;
    display: block;
    width: 100%;
  }

  @media (max-width: 600px) {
    .light-tile-container {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 8px;
    }
  }

  /* Favorites container and chips */
  .favorites-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .favorite-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px 6px 12px;
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
  }

  .favorite-chip:hover {
    background: var(--primary-color);
    color: var(--text-primary-color);
    border-color: var(--primary-color);
  }

  .favorite-icon {
    --mdc-icon-size: 16px;
    color: var(--warning-color);
  }

  .favorite-chip:hover .favorite-icon {
    color: var(--text-primary-color);
  }

  .favorite-name {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .remove-favorite-btn {
    --mdc-icon-button-size: 24px;
    --mdc-icon-size: 16px;
    margin: -4px -4px -4px 0;
    opacity: 0.7;
  }

  .remove-favorite-btn:hover {
    opacity: 1;
  }

  .section {
    background: var(--primary-background-color);
    border-radius: 8px;
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
    font-size: 18px;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .section-subtitle {
    font-size: 12px;
    color: var(--secondary-text-color);
    margin-top: 4px;
  }

  .section-content {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .section-content.collapsed {
    display: none;
  }

  .preset-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px;
    background: var(--card-background-color);
    border: 2px solid var(--divider-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 80px;
  }

  .preset-button:hover {
    background: var(--primary-color);
    color: var(--text-primary-color);
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .preset-button:active {
    transform: translateY(0);
  }

  .preset-button.disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .preset-button.disabled:hover {
    background: var(--card-background-color);
    color: var(--primary-text-color);
    border-color: var(--divider-color);
    transform: none;
    box-shadow: none;
  }

  .preset-name {
    font-size: 13px;
    font-weight: 500;
    text-align: center;
    margin-top: 8px;
  }

  .preset-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preset-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .preset-icon ha-icon {
    width: 100%;
    height: 100%;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px;
    font-size: 16px;
    color: var(--secondary-text-color);
  }

  .error {
    background: var(--error-color);
    color: white;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .no-lights {
    text-align: center;
    padding: 40px;
    color: var(--secondary-text-color);
    font-size: 14px;
  }

  ha-entity-picker {
    display: block;
    width: 100%;
  }

  ha-slider {
    width: 100%;
  }

  @media (max-width: 600px) {
    :host {
      padding: 8px;
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
      font-size: 11px;
    }
  }
`;
