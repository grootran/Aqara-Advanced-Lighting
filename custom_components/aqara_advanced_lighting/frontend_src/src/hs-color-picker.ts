/**
 * HS Color Picker Component
 * A circular color wheel picker matching Home Assistant's style
 */

import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { HSColor } from './types';
import { hsToHex } from './color-utils';

@customElement('hs-color-picker')
export class HsColorPicker extends LitElement {
  @property({ type: Object }) color: HSColor = { h: 0, s: 100 };
  @property({ type: Number }) size = 200;

  @state() private _isDragging = false;

  @query('canvas') private _canvas!: HTMLCanvasElement;
  @query('.marker') private _marker!: HTMLDivElement;

  static styles = css`
    :host {
      display: inline-block;
    }

    .color-picker-container {
      position: relative;
      touch-action: none;
    }

    canvas {
      border-radius: 50%;
      cursor: crosshair;
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

    .center-white {
      position: absolute;
      width: 20%;
      height: 20%;
      border-radius: 50%;
      background: radial-gradient(circle, white 0%, transparent 100%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
  `;

  protected firstUpdated(): void {
    this._drawColorWheel();
    this._updateMarkerPosition();
  }

  protected updated(changedProperties: PropertyValues): void {
    if (changedProperties.has('size')) {
      this._drawColorWheel();
    }
    if (changedProperties.has('color') && !this._isDragging) {
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

    const { x, y } = this._hsToPosition(this.color);
    this._marker.style.left = `${x}px`;
    this._marker.style.top = `${y}px`;
    this._marker.style.backgroundColor = hsToHex(this.color);
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

  private _handleInteraction(e: MouseEvent | TouchEvent): void {
    const canvas = this._canvas;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if (e instanceof TouchEvent) {
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

    const newColor = this._positionToHs(x, y);
    this.color = newColor;
    this._updateMarkerPosition();

    this.dispatchEvent(
      new CustomEvent('color-changed', {
        detail: { color: newColor },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _onPointerDown(e: MouseEvent | TouchEvent): void {
    e.preventDefault();
    this._isDragging = true;
    this._marker?.classList.add('dragging');
    this._handleInteraction(e);

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
    this._handleInteraction(e);
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
    return html`
      <div class="color-picker-container" style="width: ${this.size}px; height: ${this.size}px;">
        <canvas
          @mousedown=${this._onPointerDown}
          @touchstart=${this._onPointerDown}
        ></canvas>
        <div class="marker"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hs-color-picker': HsColorPicker;
  }
}
