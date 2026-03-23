/**
 * XY Color Picker Component
 * A circular color wheel picker with RGB input fields
 * Uses XY color space (CIE 1931) for device-independent color representation
 */

import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { XYColor, HSColor, Translations } from './types';
import { xyToHs, hsToXy, xyToRgb, rgbToXy, kelvinToXy, kelvinToRgb } from './color-utils';
import { localize } from './editor-constants';

@customElement('xy-color-picker')
export class XyColorPicker extends LitElement {
  @property({ type: Object }) color: XYColor = { x: 0.6800, y: 0.3100 };  // Red default
  @property({ type: Number }) size = 220;
  @property({ type: Boolean }) showRgbInputs = true;

  @property({ type: Object }) translations: Translations = {};
  @property({ type: Boolean }) showCctSlider = true;
  @property({ type: Number }) cctMin = 2000;
  @property({ type: Number }) cctMax = 6500;

  @state() private _isDragging = false;
  @state() private _editingColor: XYColor = { x: 0.6800, y: 0.3100 };
  @state() private _cctValue = 4000;
  @state() private _cctActive = false;

  @query('canvas') private _canvas!: HTMLCanvasElement;
  @query('.marker') private _marker!: HTMLDivElement;

  private _drawnSize = 0;
  private _rgbInputs: HTMLInputElement[] | null = null;

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

    /* CCT Slider */
    .cct-slider-section {
      margin: 4px 0 8px;
      padding: 0 8px;
    }

    .cct-slider-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .cct-slider-title {
      font-size: 12px;
      font-weight: 500;
      color: var(--secondary-text-color);
    }

    .cct-slider-input {
      width: 58px;
      padding: 2px 4px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      font-size: 12px;
      font-family: monospace;
      text-align: center;
      transition: opacity 0.2s ease, border-color 0.2s ease;
      -moz-appearance: textfield;
    }

    .cct-slider-input::-webkit-outer-spin-button,
    .cct-slider-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .cct-slider-input:focus {
      outline: none;
      border-color: var(--primary-color);
      opacity: 1;
    }

    .cct-slider-input.inactive {
      opacity: 0.4;
    }

    .cct-slider-input-suffix {
      font-size: 12px;
      font-family: monospace;
      color: var(--secondary-text-color);
      margin-left: 2px;
    }

    .cct-slider-track {
      position: relative;
      height: 28px;
      border-radius: 14px;
      cursor: pointer;
      touch-action: none;
      overflow: visible;
    }

    .cct-slider-gradient {
      width: 100%;
      height: 100%;
      border-radius: 14px;
      box-shadow: inset 0 0 0 1px var(--divider-color);
    }

    .cct-slider-thumb {
      position: absolute;
      top: 50%;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
      transform: translate(-50%, -50%);
      pointer-events: none;
      transition: box-shadow 0.1s ease;
    }

    .cct-slider-thumb.dragging {
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
    }

    .cct-slider-ticks {
      display: flex;
      justify-content: space-between;
      padding: 4px 2px 0;
    }

    .cct-slider-tick {
      font-size: 10px;
      color: var(--secondary-text-color);
      opacity: 0.6;
    }
  `;

  protected firstUpdated(): void {
    this._editingColor = { ...this.color };
    this._drawColorWheel();
    this._updateMarkerPosition();
  }

  protected updated(changedProperties: PropertyValues): void {
    if (changedProperties.has('size')) {
      this._drawColorWheel();
      this._updateMarkerPosition();
    }
    if (changedProperties.has('color') && !this._isDragging) {
      this._editingColor = { ...this.color };
      this._updateMarkerPosition();
    }
    if (changedProperties.has('cctMin') || changedProperties.has('cctMax')) {
      this._cachedCctGradient = this._computeCctGradient();
    }
  }

  private _drawColorWheel(): void {
    const canvas = this._canvas;
    if (!canvas) return;

    const size = this.size;
    if (size === this._drawnSize) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this._drawnSize = size;
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

    const hs = xyToHs(this._editingColor);
    const { x, y } = this._hsToPosition(hs);
    this._marker.style.left = `${x}px`;
    this._marker.style.top = `${y}px`;

    // Set marker color to match selected color
    const rgb = xyToRgb(this._editingColor.x, this._editingColor.y, 255);
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
    const newXy = hsToXy(newHs);
    this._editingColor = newXy;
    this._cctActive = false;
    this._updateMarkerPosition();
    this._updateRgbInputs(newXy);
    this._fireColorChanged(newXy);
  }

  private _handleRgbInput(e: Event, channel: 'r' | 'g' | 'b'): void {
    const input = e.target as HTMLInputElement;
    const value = parseInt(input.value, 10);

    if (isNaN(value) || value < 0 || value > 255) return;

    // Get current RGB directly from XY (one conversion, not two)
    const currentRgb = xyToRgb(this._editingColor.x, this._editingColor.y, 255);

    // Update the changed channel
    const newRgb = {
      r: channel === 'r' ? value : currentRgb.r,
      g: channel === 'g' ? value : currentRgb.g,
      b: channel === 'b' ? value : currentRgb.b,
    };

    // Convert RGB → XY and store directly (no HS intermediate)
    const newXy = rgbToXy(newRgb.r, newRgb.g, newRgb.b);
    this._editingColor = newXy;
    this._cctActive = false;

    this._updateMarkerPosition();
    this._fireColorChanged(newXy);

    // Show tooltip if round-trip changed the value
    const displayRgb = xyToRgb(newXy.x, newXy.y, 255);
    const displayValue = channel === 'r' ? displayRgb.r : channel === 'g' ? displayRgb.g : displayRgb.b;

    if (displayValue !== value) {
      input.title = `Nearest: ${displayValue} (gamut limit)`;
    } else {
      input.title = '';
    }
  }

  private _updateRgbInputs(xyColor: XYColor): void {
    if (!this._rgbInputs) {
      const nodes = this.shadowRoot?.querySelectorAll('.rgb-input-field');
      if (!nodes || nodes.length !== 3) return;
      this._rgbInputs = Array.from(nodes) as HTMLInputElement[];
    }

    const rgb = xyToRgb(xyColor.x, xyColor.y, 255);
    this._rgbInputs[0]!.value = rgb.r.toString();
    this._rgbInputs[1]!.value = rgb.g.toString();
    this._rgbInputs[2]!.value = rgb.b.toString();
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

  // --- CCT Slider ---

  private _cctSliderDragging = false;
  private _cachedCctGradient = '';

  private _computeCctGradient(): string {
    const stops: string[] = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const k = this.cctMin + (i / steps) * (this.cctMax - this.cctMin);
      const rgb = kelvinToRgb(k);
      stops.push(`rgb(${rgb.r},${rgb.g},${rgb.b}) ${(i / steps) * 100}%`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }

  private _getCctGradient(): string {
    if (!this._cachedCctGradient) {
      this._cachedCctGradient = this._computeCctGradient();
    }
    return this._cachedCctGradient;
  }

  private _handleCctFromEvent(e: MouseEvent | TouchEvent): void {
    const track = this.shadowRoot?.querySelector('.cct-slider-track') as HTMLElement;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    let clientX: number;
    if ('touches' in e) {
      const touch = e.touches[0];
      if (!touch) return;
      clientX = touch.clientX;
    } else {
      clientX = e.clientX;
    }

    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const kelvin = Math.round(this.cctMin + ratio * (this.cctMax - this.cctMin));

    this._cctValue = kelvin;
    this._cctActive = true;

    // Convert kelvin → XY → HS, drive the whole picker
    const newXy = kelvinToXy(kelvin);
    this._editingColor = newXy;

    this._updateMarkerPosition();
    this._updateRgbInputs(newXy);
    this._fireColorChanged(newXy);
  }

  private _onCctDown(e: MouseEvent | TouchEvent): void {
    e.preventDefault();
    this._cctSliderDragging = true;
    this._handleCctFromEvent(e);

    const thumb = this.shadowRoot?.querySelector('.cct-slider-thumb') as HTMLElement;
    thumb?.classList.add('dragging');

    if (e instanceof MouseEvent) {
      window.addEventListener('mousemove', this._onCctMove);
      window.addEventListener('mouseup', this._onCctUp);
    } else {
      window.addEventListener('touchmove', this._onCctMove, { passive: false });
      window.addEventListener('touchend', this._onCctUp);
    }
  }

  private _onCctMove = (e: MouseEvent | TouchEvent): void => {
    if (!this._cctSliderDragging) return;
    e.preventDefault();
    this._handleCctFromEvent(e);
  };

  private _onCctUp = (): void => {
    this._cctSliderDragging = false;
    const thumb = this.shadowRoot?.querySelector('.cct-slider-thumb') as HTMLElement;
    thumb?.classList.remove('dragging');
    window.removeEventListener('mousemove', this._onCctMove);
    window.removeEventListener('mouseup', this._onCctUp);
    window.removeEventListener('touchmove', this._onCctMove);
    window.removeEventListener('touchend', this._onCctUp);
  };

  private _handleCctInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    const value = parseInt(input.value, 10);

    if (isNaN(value) || value < this.cctMin || value > this.cctMax) return;

    this._cctValue = value;
    this._cctActive = true;

    const newXy = kelvinToXy(value);
    this._editingColor = newXy;

    this._updateMarkerPosition();
    this._updateRgbInputs(newXy);
    this._fireColorChanged(newXy);
  }

  private _handleCctInputBlur(e: Event): void {
    const input = e.target as HTMLInputElement;
    const value = parseInt(input.value, 10);

    // Clamp to valid range on blur
    if (isNaN(value) || value < this.cctMin) {
      input.value = this.cctMin.toString();
    } else if (value > this.cctMax) {
      input.value = this.cctMax.toString();
    }
  }

  private _renderCctSlider() {
    const thumbRgb = kelvinToRgb(this._cctValue);
    const thumbPercent = ((this._cctValue - this.cctMin) / (this.cctMax - this.cctMin)) * 100;
    const label = localize(this.translations, 'editors.color_temp_label') !== 'editors.color_temp_label'
      ? localize(this.translations, 'editors.color_temp_label')
      : 'Color temp';

    return html`
      <div class="cct-slider-section">
        <div class="cct-slider-label">
          <span class="cct-slider-title">${label}</span>
          <div style="display: flex; align-items: center;">
            <input
              type="number"
              class="cct-slider-input ${this._cctActive ? '' : 'inactive'}"
              min=${this.cctMin}
              max=${this.cctMax}
              .value=${this._cctValue.toString()}
              @input=${this._handleCctInput}
              @blur=${this._handleCctInputBlur}
            /><span class="cct-slider-input-suffix">K</span>
          </div>
        </div>
        <div
          class="cct-slider-track"
          @mousedown=${this._onCctDown}
          @touchstart=${this._onCctDown}
        >
          <div
            class="cct-slider-gradient"
            style="background: ${this._getCctGradient()}"
          ></div>
          <div
            class="cct-slider-thumb"
            style="left: ${thumbPercent}%; background: rgb(${thumbRgb.r},${thumbRgb.g},${thumbRgb.b})"
          ></div>
        </div>
        <div class="cct-slider-ticks">
          <span class="cct-slider-tick">${this.cctMin}K</span>
          <span class="cct-slider-tick">${this.cctMax}K</span>
        </div>
      </div>
    `;
  }

  render() {
    const rgb = xyToRgb(this._editingColor.x, this._editingColor.y, 255);

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
      ${this.showCctSlider ? this._renderCctSlider() : ''}
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
              @change=${(e: Event) => this._handleRgbInput(e, 'r')}
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
              @change=${(e: Event) => this._handleRgbInput(e, 'g')}
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
              @change=${(e: Event) => this._handleRgbInput(e, 'b')}
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
