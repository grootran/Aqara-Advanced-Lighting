/**
 * Reorderable steps mixin.
 * Adds drag-and-drop reordering to step lists in sequence editors
 * using pointer events for mouse and touch support.
 */

import { LitElement, html, css, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';

export interface ReorderableStepItem {
  id: string;
}

interface DragState {
  draggingIndex: number | null;
  dropTargetIndex: number | null;
}

interface GridDropPos {
  left: number;
  top: number;
  height: number;
}

const INITIAL_DRAG_STATE: DragState = {
  draggingIndex: null,
  dropTargetIndex: null,
};

// Auto-scroll zone size in pixels from container edge
const SCROLL_EDGE = 40;
// Auto-scroll speed in pixels per frame
const SCROLL_SPEED = 8;

type Constructor<T = {}> = new (...args: any[]) => T;

export const reorderableStepStyles = css`
  .drag-handle {
    cursor: grab;
    display: flex;
    align-items: center;
    color: var(--secondary-text-color);
    padding: 4px;
    touch-action: none;
    transition: color 0.2s ease;
    -webkit-user-select: none;
    user-select: none;
  }

  .drag-handle:hover {
    color: var(--primary-color);
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .drag-handle ha-icon {
    --mdc-icon-size: 20px;
  }

  .step-item.dragging {
    opacity: 0.4;
  }

  .drop-indicator {
    height: 3px;
    background: var(--primary-color);
    border-radius: 2px;
    margin: -7px 0 -8px 0;
    pointer-events: none;
    z-index: 1;
    position: relative;
  }

  .step-list.is-dragging {
    user-select: none;
    -webkit-user-select: none;
  }

  .grid-drop-indicator {
    position: absolute;
    width: 3px;
    background: var(--primary-color);
    border-radius: 2px;
    pointer-events: none;
    z-index: 10;
  }
`;

export function ReorderableStepsMixin<T extends Constructor<LitElement>>(
  superClass: T
) {
  class ReorderableSteps extends superClass {
    declare protected _steps: ReorderableStepItem[];

    @state() protected _dragState: DragState = { ...INITIAL_DRAG_STATE };

    protected _reorderLayout: 'list' | 'grid' = 'list';
    @state() protected _gridDropPos: GridDropPos | null = null;

    private _boundMove = this._onPointerMove.bind(this);
    private _boundEnd = this._onPointerEnd.bind(this);
    private _scrollContainer: Element | null = null;
    private _cachedStepList: Element | null = null;
    private _autoScrollRaf = 0;
    private _lastClientX = 0;
    private _lastClientY = 0;

    disconnectedCallback(): void {
      super.disconnectedCallback();
      this._cleanupDrag();
    }

    protected _onDragHandlePointerDown(e: PointerEvent, index: number): void {
      if (this._steps.length <= 1) return;

      e.preventDefault();
      e.stopPropagation();

      const stepList = this.shadowRoot?.querySelector('.step-list');
      if (!stepList) return;

      this._cachedStepList = stepList;
      this._scrollContainer = this._findScrollContainer(stepList);

      this._dragState = {
        draggingIndex: index,
        dropTargetIndex: null,
      };

      const stepItems = stepList.querySelectorAll('.step-item');
      stepItems[index]?.classList.add('dragging');
      stepList.classList.add('is-dragging');

      this._lastClientX = e.clientX;
      this._lastClientY = e.clientY;

      window.addEventListener('pointermove', this._boundMove);
      window.addEventListener('pointerup', this._boundEnd);
      window.addEventListener('pointercancel', this._boundEnd);

      this.requestUpdate();
    }

    private _onPointerMove(e: PointerEvent): void {
      if (this._dragState.draggingIndex === null) return;
      e.preventDefault();

      this._lastClientX = e.clientX;
      this._lastClientY = e.clientY;
      this._updateDropTarget(e.clientX, e.clientY);
      this._startAutoScroll();
    }

    private _onPointerEnd(e: PointerEvent): void {
      if (this._dragState.draggingIndex === null) return;
      e.preventDefault();

      const { draggingIndex, dropTargetIndex } = this._dragState;

      if (
        dropTargetIndex !== null &&
        dropTargetIndex !== draggingIndex &&
        dropTargetIndex !== draggingIndex + 1
      ) {
        this._reorderStep(draggingIndex, dropTargetIndex);
      }

      this._cleanupDrag();
    }

    private _cleanupDrag(): void {
      window.removeEventListener('pointermove', this._boundMove);
      window.removeEventListener('pointerup', this._boundEnd);
      window.removeEventListener('pointercancel', this._boundEnd);

      if (this._autoScrollRaf) {
        cancelAnimationFrame(this._autoScrollRaf);
        this._autoScrollRaf = 0;
      }

      const stepList = this._cachedStepList;
      if (stepList) {
        stepList.classList.remove('is-dragging');
        stepList
          .querySelectorAll('.step-item.dragging')
          .forEach((el) => el.classList.remove('dragging'));
      }

      this._cachedStepList = null;
      this._scrollContainer = null;
      this._gridDropPos = null;
      this._dragState = { ...INITIAL_DRAG_STATE };
      this.requestUpdate();
    }

    /** Recalculate drop target from live DOM positions (scroll-safe). */
    private _updateDropTarget(clientX: number, clientY: number): void {
      const dropTarget = this._reorderLayout === 'grid'
        ? this._calcDropTargetGrid(clientX, clientY)
        : this._calcDropTarget(clientY);

      if (dropTarget !== this._dragState.dropTargetIndex) {
        this._dragState = { ...this._dragState, dropTargetIndex: dropTarget };

        if (this._reorderLayout === 'grid') {
          this._gridDropPos = this._computeGridIndicatorPos(dropTarget);
        }
      }
    }

    /** Query current step positions from DOM on each call (handles scroll). */
    private _calcDropTarget(clientY: number): number | null {
      if (this._dragState.draggingIndex === null) return null;

      const stepList = this._cachedStepList;
      if (!stepList) return null;
      const stepItems = stepList.querySelectorAll('.step-item');
      if (stepItems.length === 0) return null;

      for (let i = 0; i < stepItems.length; i++) {
        const rect = stepItems[i]!.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (clientY < mid) return i;
      }

      return stepItems.length;
    }

    /** Calculate drop target for grid/wrapping-flex layouts using both X and Y. */
    private _calcDropTargetGrid(clientX: number, clientY: number): number | null {
      if (this._dragState.draggingIndex === null) return null;

      const stepList = this._cachedStepList;
      if (!stepList) return null;
      const items = Array.from(stepList.querySelectorAll<HTMLElement>('.step-item'));
      if (items.length === 0) return null;

      // Group items into rows by their vertical position (tolerance for sub-pixel diffs)
      const rows: { items: HTMLElement[]; indices: number[]; top: number; bottom: number }[] = [];
      for (let i = 0; i < items.length; i++) {
        const rect = items[i]!.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        let matched = false;
        for (const row of rows) {
          if (Math.abs(midY - (row.top + row.bottom) / 2) < 4) {
            row.items.push(items[i]!);
            row.indices.push(i);
            row.top = Math.min(row.top, rect.top);
            row.bottom = Math.max(row.bottom, rect.bottom);
            matched = true;
            break;
          }
        }
        if (!matched) {
          rows.push({
            items: [items[i]!],
            indices: [i],
            top: rect.top,
            bottom: rect.bottom,
          });
        }
      }

      // Sort rows top-to-bottom
      rows.sort((a, b) => a.top - b.top);

      // Find cursor's row
      let targetRow = rows[rows.length - 1]!;
      for (const row of rows) {
        const rowMidY = (row.top + row.bottom) / 2;
        if (clientY < rowMidY) {
          targetRow = row;
          break;
        }
        targetRow = row;
      }

      // Within the row, find insertion point by X midpoint
      for (let i = 0; i < targetRow.items.length; i++) {
        const rect = targetRow.items[i]!.getBoundingClientRect();
        const xMid = rect.left + rect.width / 2;
        if (clientX < xMid) {
          return targetRow.indices[i]!;
        }
      }

      // Past all items in the row — insert after last item in this row
      return targetRow.indices[targetRow.indices.length - 1]! + 1;
    }

    /** Compute absolute position for the grid drop indicator bar. */
    private _computeGridIndicatorPos(slotIndex: number | null): GridDropPos | null {
      if (slotIndex === null) return null;

      const stepList = this._cachedStepList;
      if (!stepList) return null;
      const containerRect = stepList.getBoundingClientRect();
      const items = Array.from(stepList.querySelectorAll<HTMLElement>('.step-item'));
      if (items.length === 0) return null;

      let left: number;
      let top: number;
      let height: number;

      if (slotIndex === 0) {
        // Before the first item
        const rect = items[0]!.getBoundingClientRect();
        left = rect.left - containerRect.left - 2;
        top = rect.top - containerRect.top;
        height = rect.height;
      } else if (slotIndex >= items.length) {
        // After the last item
        const rect = items[items.length - 1]!.getBoundingClientRect();
        left = rect.right - containerRect.left + 2;
        top = rect.top - containerRect.top;
        height = rect.height;
      } else {
        // Between item[slotIndex-1] and item[slotIndex]
        const prevRect = items[slotIndex - 1]!.getBoundingClientRect();
        const nextRect = items[slotIndex]!.getBoundingClientRect();

        // Check if they're on the same row (within 4px tolerance)
        const sameRow = Math.abs(prevRect.top - nextRect.top) < 4;

        if (sameRow) {
          left = (prevRect.right + nextRect.left) / 2 - containerRect.left - 1;
          top = nextRect.top - containerRect.top;
          height = nextRect.height;
        } else {
          // Items wrap to next row — show indicator at start of new row
          left = nextRect.left - containerRect.left - 2;
          top = nextRect.top - containerRect.top;
          height = nextRect.height;
        }
      }

      return { left, top, height };
    }

    /** Find the nearest scrollable ancestor for auto-scroll. */
    private _findScrollContainer(el: Element): Element | null {
      let current: Element | null = el;
      while (current) {
        // Check shadow DOM host boundaries
        if (!current.parentElement && current.getRootNode() instanceof ShadowRoot) {
          current = (current.getRootNode() as ShadowRoot).host;
          continue;
        }
        current = current.parentElement;
        if (!current) break;

        const style = getComputedStyle(current);
        const overflow = style.overflowY;
        if (
          (overflow === 'auto' || overflow === 'scroll') &&
          current.scrollHeight > current.clientHeight
        ) {
          return current;
        }
      }
      return null;
    }

    /** Auto-scroll when cursor is near the top/bottom edge of the scroll container. */
    private _startAutoScroll(): void {
      if (this._autoScrollRaf) return;

      const tick = () => {
        if (this._dragState.draggingIndex === null) {
          this._autoScrollRaf = 0;
          return;
        }

        const container = this._scrollContainer;
        if (container) {
          const rect = container.getBoundingClientRect();
          const y = this._lastClientY;

          if (y < rect.top + SCROLL_EDGE && container.scrollTop > 0) {
            container.scrollTop -= SCROLL_SPEED;
            this._updateDropTarget(this._lastClientX, this._lastClientY);
          } else if (
            y > rect.bottom - SCROLL_EDGE &&
            container.scrollTop < container.scrollHeight - container.clientHeight
          ) {
            container.scrollTop += SCROLL_SPEED;
            this._updateDropTarget(this._lastClientX, this._lastClientY);
          } else {
            // Not near edge, stop auto-scroll loop
            this._autoScrollRaf = 0;
            return;
          }
        } else {
          this._autoScrollRaf = 0;
          return;
        }

        this._autoScrollRaf = requestAnimationFrame(tick);
      };

      this._autoScrollRaf = requestAnimationFrame(tick);
    }

    protected _reorderStep(fromIndex: number, toIndex: number): void {
      const newSteps = [...this._steps];
      const [moved] = newSteps.splice(fromIndex, 1);
      const insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
      newSteps.splice(insertAt, 0, moved!);
      (this as any)._steps = newSteps;
    }

    protected _renderDragHandle(index: number): TemplateResult {
      return html`
        <div
          class="drag-handle"
          role="button"
          aria-label="Reorder item ${index + 1}"
          @pointerdown=${(e: PointerEvent) => this._onDragHandlePointerDown(e, index)}
        >
          <ha-icon icon="mdi:drag"></ha-icon>
        </div>
      `;
    }

    protected _renderDropIndicator(beforeIndex: number): TemplateResult | string {
      const { draggingIndex, dropTargetIndex } = this._dragState;
      if (draggingIndex === null || dropTargetIndex !== beforeIndex) return '';

      return html`<div class="drop-indicator"></div>`;
    }

    protected _renderGridDropIndicator(): TemplateResult | string {
      const { draggingIndex } = this._dragState;
      if (draggingIndex === null || !this._gridDropPos) return '';

      const { left, top, height } = this._gridDropPos;
      return html`<div
        class="grid-drop-indicator"
        style="left: ${left}px; top: ${top}px; height: ${height}px;"
      ></div>`;
    }
  }

  return ReorderableSteps as unknown as Constructor<ReorderableSteps> & T;
}
