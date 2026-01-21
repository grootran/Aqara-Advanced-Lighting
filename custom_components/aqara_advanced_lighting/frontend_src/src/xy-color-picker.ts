/**
 * XY Color Picker Component
 * A circular color wheel picker with RGB input fields
 * Uses XY color space (CIE 1931) for device-independent color representation
 */

import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { XYColor, HSColor } from './types';
import { xyToHs, hsToXy, xyToRgb, rgbToXy } from './color-utils';

@customElement('xy-color-picker')
export class XyColorPicker extends LitElement {
  @property({ type: Object }) color: XYColor = { x: 0.6800, y: 0.3100 };  // Red default
  @property({ type: Number }) size = 220;
  @property({ type: Boolean }) showRgbInputs = true;

  @state() private _isDragging = false;
  @state() private _editingColor: HSColor = { h: 0, s: 100 };

  @query('canvas') private _canvas!: HTMLCanvasElement;
  @query('.marker') private _marker!: HTMLDivElement;

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .color-picker-container {
      position: relative;
      touch-action: none;
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }

    canvas {
      border-radius: 50%;
      cursor: crosshair;
      display: block;
    }

    .marker {
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.5), inset 0 0 2px rgba(0, 0, 0, 0.3);
      pointer-events: none;
      transform: translate(-50%, -50%);
      transition: box-shadow 0.1s ease;
    }

    .marker.dragging {
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.7), inset 0 0 2px rgba(0, 0, 0, 0.3);
    }

    .rgb-inputs {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin: 16px 0;
    }

    .rgb-input-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .rgb-input-channel {
      font-size: 12px;
      font-weight: 500;
      color: var(--secondary-text-color);
      text-transform: uppercase;
    }

    .rgb-input-field {
      width: 60px;
      padding: 6px 8px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 14px;
      font-family: monospace;
      text-align: center;
    }

    .rgb-input-field:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  `;

  protected firstUpdated(): void {
    // Convert initial XY to HS for internal editing
    this._editingColor = xyToHs(this.color);
    this._drawColorWheel();
    this._updateMarkerPosition();
  }

  protected updated(changedProperties: PropertyValues): void {
    if (changedProperties.has('size')) {
      this._drawColorWheel();
      this._updateMarkerPosition();
    }
    if (changedProperties.has('color') && !this._isDragging) {
      this._editingColor = xyToHs(this.color);
      this._updateMarkerPosition();
    }
  }

  private _drawColorWheel(): void {
    const canvas = this._canvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = this.size;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    canvas.width = size;
    canvas.height = size;

    // Draw the color wheel
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = ((angle - 1) * Math.PI) / 180;
      const endAngle = ((angle + 1) * Math.PI) / 180;

      // Draw saturation gradient for this hue slice
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );

      // Center is white (saturation = 0)
      gradient.addColorStop(0, 'hsl(' + angle + ', 0%, 100%)');
      // Edge is full saturation
      gradient.addColorStop(1, 'hsl(' + angle + ', 100%, 50%)');

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  private _updateMarkerPosition(): void {
    if (!this._marker) return;

    const { x, y } = this._hsToPosition(this._editingColor);
    this._marker.style.left = `${x}px`;
    this._marker.style.top = `${y}px`;

    // Set marker color to match selected color
    const xyColor = hsToXy(this._editingColor);
    const rgb = xyToRgb(xyColor.x, xyColor.y, 255);
    const hex = `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
    this._marker.style.backgroundColor = hex;
  }

  private _hsToPosition(hs: HSColor): { x: number; y: number } {
    const centerX = this.size / 2;
    const centerY = this.size / 2;
    const radius = this.size / 2;

    // Convert hue to radians (0 degrees = right, going clockwise)
    const angleRad = (hs.h * Math.PI) / 180;
    // Saturation determines distance from center (0 = center, 100 = edge)
    const distance = (hs.s / 100) * radius;

    return {
      x: centerX + distance * Math.cos(angleRad),
      y: centerY + distance * Math.sin(angleRad),
    };
  }

  private _positionToHs(x: number, y: number): HSColor {
    const centerX = this.size / 2;
    const centerY = this.size / 2;
    const radius = this.size / 2;

    const dx = x - centerX;
    const dy = y - centerY;

    // Calculate distance from center (saturation)
    let distance = Math.sqrt(dx * dx + dy * dy);
    distance = Math.min(distance, radius); // Clamp to wheel edge

    // Calculate angle (hue) - atan2 returns -180 to 180, convert to 0-360
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    return {
      h: Math.round(angle) % 360,
      s: Math.round((distance / radius) * 100),
    };
  }

  private _handleWheelInteraction(e: MouseEvent | TouchEvent): void {
    const canvas = this._canvas;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      const touch = e.touches[0];
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const newHs = this._positionToHs(x, y);
    this._editingColor = newHs;

    // Convert to XY and emit
    const newXy = hsToXy(newHs);
    this._updateMarkerPosition();
    this._updateRgbInputs(newXy);
    this._fireColorChanged(newXy);
  }

  private _handleRgbInput(e: Event, channel: 'r' | 'g' | 'b'): void {
    const input = e.target as HTMLInputElement;
    const value = parseInt(input.value, 10);

    if (isNaN(value) || value < 0 || value > 255) return;

    // Get current RGB values
    const currentXy = hsToXy(this._editingColor);
    const currentRgb = xyToRgb(currentXy.x, currentXy.y, 255);

    // Update the changed channel
    const newRgb = {
      r: channel === 'r' ? value : currentRgb.r,
      g: channel === 'g' ? value : currentRgb.g,
      b: channel === 'b' ? value : currentRgb.b,
    };

    // Convert RGB → XY → HS for internal state
    const newXy = rgbToXy(newRgb.r, newRgb.g, newRgb.b);
    const newHs = xyToHs(newXy);

    this._editingColor = newHs;
    this._updateMarkerPosition();
    this._updateRgbInputs(newXy);
    this._fireColorChanged(newXy);

    // Visual feedback if conversion changed the value
    const displayRgb = xyToRgb(newXy.x, newXy.y, 255);
    const displayValue = channel === 'r' ? displayRgb.r : channel === 'g' ? displayRgb.g : displayRgb.b;

    if (displayValue !== value) {
      const originalBorder = input.style.borderColor;
      input.style.borderColor = 'var(--warning-color, #ff9800)';
      setTimeout(() => {
        input.style.borderColor = originalBorder;
      }, 500);
    }
  }

  private _updateRgbInputs(xyColor: XYColor): void {
    const rgbInputs = this.shadowRoot?.querySelectorAll('.rgb-input-field');
    if (!rgbInputs || rgbInputs.length !== 3) return;

    const rgb = xyToRgb(xyColor.x, xyColor.y, 255);
    (rgbInputs[0] as HTMLInputElement).value = rgb.r.toString();
    (rgbInputs[1] as HTMLInputElement).value = rgb.g.toString();
    (rgbInputs[2] as HTMLInputElement).value = rgb.b.toString();
  }

  private _fireColorChanged(xyColor: XYColor): void {
    this.dispatchEvent(
      new CustomEvent('color-changed', {
        detail: { color: xyColor },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _onPointerDown(e: MouseEvent | TouchEvent): void {
    e.preventDefault();
    this._isDragging = true;
    this._marker?.classList.add('dragging');
    this._handleWheelInteraction(e);

    if (e instanceof MouseEvent) {
      window.addEventListener('mousemove', this._onPointerMove);
      window.addEventListener('mouseup', this._onPointerUp);
    } else {
      window.addEventListener('touchmove', this._onPointerMove, { passive: false });
      window.addEventListener('touchend', this._onPointerUp);
    }
  }

  private _onPointerMove = (e: MouseEvent | TouchEvent): void => {
    if (!this._isDragging) return;
    e.preventDefault();
    this._handleWheelInteraction(e);
  };

  private _onPointerUp = (): void => {
    this._isDragging = false;
    this._marker?.classList.remove('dragging');
    window.removeEventListener('mousemove', this._onPointerMove);
    window.removeEventListener('mouseup', this._onPointerUp);
    window.removeEventListener('touchmove', this._onPointerMove);
    window.removeEventListener('touchend', this._onPointerUp);
  };

  render() {
    const xyColor = hsToXy(this._editingColor);
    const rgb = xyToRgb(xyColor.x, xyColor.y, 255);

    return html`
      <div class="color-picker-container">
        <div style="position: relative; width: ${this.size}px; height: ${this.size}px;">
          <canvas
            @mousedown=${this._onPointerDown}
            @touchstart=${this._onPointerDown}
          ></canvas>
          <div class="marker"></div>
        </div>
      </div>
      ${this.showRgbInputs ? html`
        <div class="rgb-inputs">
          <label class="rgb-input-label">
            <span class="rgb-input-channel">R</span>
            <input
              type="number"
              class="rgb-input-field"
              min="0"
              max="255"
              .value=${rgb.r.toString()}
              @input=${(e: Event) => this._handleRgbInput(e, 'r')}
            />
          </label>
          <label class="rgb-input-label">
            <span class="rgb-input-channel">G</span>
            <input
              type="number"
              class="rgb-input-field"
              min="0"
              max="255"
              .value=${rgb.g.toString()}
              @input=${(e: Event) => this._handleRgbInput(e, 'g')}
            />
          </label>
          <label class="rgb-input-label">
            <span class="rgb-input-channel">B</span>
            <input
              type="number"
              class="rgb-input-field"
              min="0"
              max="255"
              .value=${rgb.b.toString()}
              @input=${(e: Event) => this._handleRgbInput(e, 'b')}
            />
          </label>
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'xy-color-picker': XyColorPicker;
  }
}
