import { css } from 'lit';

/**
 * Shared color picker styles for editor components.
 * Standard variant: for color arrays (Effects, Gradient, Blocks, Sequence Steps)
 * Palette variant: for pattern-editor Individual mode (selectable fixed colors)
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

  /* Drag handle above color swatch */
  .color-drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 20px;
    color: var(--secondary-text-color);
    cursor: grab;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
    transition: color 0.2s ease;
  }

  .color-drag-handle:hover {
    color: var(--primary-color);
  }

  .color-drag-handle:active {
    cursor: grabbing;
  }

  .color-drag-handle ha-icon {
    --mdc-icon-size: 18px;
  }

  /* Invisible spacer matching drag handle height when handle is hidden */
  .color-drag-handle-spacer {
    height: 20px;
  }

  /* Suppress swatch hover effect during drag */
  .color-picker-grid.is-dragging .color-swatch:hover {
    transform: none;
  }

  /* Suppress add button during drag */
  .color-picker-grid.is-dragging .add-color-btn {
    pointer-events: none;
    opacity: 0.4;
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

  /* Color picker ha-dialog sizing:
   * Fixed width sized for 8 color history swatches:
   * 8 x 32px swatches + 7 x 6px gaps = 298px content + 48px padding = 346px
   */
  ha-dialog {
    --ha-dialog-width-md: min(346px, calc(100vw - 32px));
    --ha-dialog-max-width: min(346px, calc(100vw - 32px));
  }

  ha-dialog [slot="headerActionItems"] {
    margin-right: 12px;
  }

  ha-dialog [slot="footer"] {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .color-picker-modal-preview {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 2px solid var(--divider-color);
  }

  ha-dialog.extractor-dialog {
    --ha-dialog-width-md: min(420px, calc(100vw - 32px));
    --ha-dialog-max-width: min(420px, calc(100vw - 32px));
  }

  ha-dialog.extractor-dialog image-color-extractor {
    min-height: 200px;
  }

  .extractor-mode-toggle {
    display: flex;
    gap: 4px;
    background: var(--secondary-background-color, #f5f5f5);
    border-radius: 8px;
    padding: 3px;
    margin: 0 auto;
  }

  .extractor-mode-toggle .mode-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--primary-text-color);
    font-size: 12px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .extractor-mode-toggle .mode-btn.active {
    background: var(--card-background-color, #fff);
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  }

  .extractor-mode-toggle .mode-btn ha-icon {
    --mdc-icon-size: 16px;
  }
`;
