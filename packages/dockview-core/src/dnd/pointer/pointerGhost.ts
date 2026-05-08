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
    /**
     * The element whose owning document the ghost should be appended to.
     * For drags inside a popout window, pass the drag source so the ghost
     * is rendered in the popout's document — appending to the main
     * `document.body` would render the ghost in the wrong window
     * (invisible to the user dragging in the popout).
     *
     * When omitted, falls back to the main `document`.
     */
    owner?: Element;
}

/**
 * A floating clone of a drag source that follows the pointer during a
 * pointer-driven drag. HTML5 DnD provides this for free via
 * `setDragImage`; the pointer path has to render it manually.
 *
 * The ghost is appended to the owning document's body with
 * `position: fixed`, `pointer-events: none`, and a high z-index so it
 * sits above the layout without intercepting hit-testing.
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

        // Anchor at (0, 0) and animate via `transform` — see `update()` for
        // why. `position: fixed` keeps the ghost out of layout flow and
        // independent of ancestor scroll.
        this.element.style.position = 'fixed';
        this.element.style.left = '0px';
        this.element.style.top = '0px';
        this.element.style.pointerEvents = 'none';
        this.element.style.zIndex = '99999';
        this.element.style.opacity = String(opts.opacity ?? 0.8);
        this.element.style.willChange = 'transform';
        this.element.style.transform = `translate3d(${
            opts.initialX - this.offsetX
        }px, ${opts.initialY - this.offsetY}px, 0)`;

        const ownerDocument = opts.owner?.ownerDocument ?? document;
        ownerDocument.body.appendChild(this.element);
    }

    update(clientX: number, clientY: number): void {
        if (this._disposed) {
            return;
        }
        // Use a 3D translate so the browser can composite this on the GPU
        // without re-running layout (which `left` / `top` mutations would
        // trigger). Pointermove fires at 60–120 Hz during a drag; this
        // path is hot.
        this.element.style.transform = `translate3d(${
            clientX - this.offsetX
        }px, ${clientY - this.offsetY}px, 0)`;
    }

    dispose(): void {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this.element.remove();
    }
}
