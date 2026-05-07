import { IDisposable } from '../../lifecycle';

export interface PointerGhostOptions {
    /**
     * The ghost element. The caller owns its content and base styles; the
     * ghost positions it via inline `position: fixed`.
     */
    element: HTMLElement;
    /** Initial pointer x in client coordinates. */
    initialX: number;
    /** Initial pointer y in client coordinates. */
    initialY: number;
    /**
     * Pointer offset within the ghost. The pointer will sit `offsetX` px from
     * the ghost's left edge and `offsetY` px from its top edge. Default 0/0
     * (top-left of ghost under the pointer).
     */
    offsetX?: number;
    offsetY?: number;
    /** Default 0.8. */
    opacity?: number;
}

/**
 * A floating clone of a drag source that follows the pointer during a
 * pointer-driven drag. HTML5 DnD provides this for free via
 * `setDragImage`; the pointer path has to render it manually.
 *
 * The ghost is appended to `document.body` with `position: fixed`,
 * `pointer-events: none`, and a high z-index so it sits above the layout
 * without intercepting hit-testing.
 */
export class PointerGhost implements IDisposable {
    private readonly element: HTMLElement;
    private readonly offsetX: number;
    private readonly offsetY: number;
    private _disposed = false;

    constructor(opts: PointerGhostOptions) {
        this.element = opts.element;
        this.offsetX = opts.offsetX ?? 0;
        this.offsetY = opts.offsetY ?? 0;

        this.element.style.position = 'fixed';
        this.element.style.pointerEvents = 'none';
        this.element.style.zIndex = '99999';
        this.element.style.opacity = String(opts.opacity ?? 0.8);
        this.element.style.left = `${opts.initialX - this.offsetX}px`;
        this.element.style.top = `${opts.initialY - this.offsetY}px`;

        document.body.appendChild(this.element);
    }

    update(clientX: number, clientY: number): void {
        if (this._disposed) {
            return;
        }
        this.element.style.left = `${clientX - this.offsetX}px`;
        this.element.style.top = `${clientY - this.offsetY}px`;
    }

    dispose(): void {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this.element.remove();
    }
}
