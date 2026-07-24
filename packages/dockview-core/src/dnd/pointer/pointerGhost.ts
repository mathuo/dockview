import { IDisposable } from '../../lifecycle';

export interface PointerGhostOptions {
    element: HTMLElement;
    initialX: number;
    initialY: number;
    /** Pointer position within the ghost; default top-left. */
    offsetX?: number;
    offsetY?: number;
    /** Default 0.8. */
    opacity?: number;
    /**
     * Source element whose `ownerDocument.body` hosts the ghost. Pass it for
     * popout-window drags so the ghost renders in the popout's document.
     */
    owner?: Element;
}

/**
 * Floating clone that follows the pointer; appended to the owning
 * document's body with `pointer-events: none` so it doesn't intercept
 * hit-testing.
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

        // Animate via transform (see update); position:fixed for scroll-independence.
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
        // translate3d composites on the GPU, so there's no layout on each pointermove.
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
