import { Droptarget, DroptargetOptions, IDropTarget } from './droptarget';
import { PointerDropTarget } from './pointer/pointerDropTarget';

/**
 * Backend factory surface. Each implementation hides one concrete DnD
 * mechanism (HTML5 native events, pointer events) behind a uniform set of
 * `createX` methods.
 *
 * Phase 2 of the pluggable backend split: drop targets only. Drag-source
 * and ghost factory methods will arrive in a later phase.
 *
 * The backends are stateless — `html5Backend` and `pointerBackend` below
 * are exported as module-level singletons so they need no construction
 * or wiring through the component tree.
 */
export interface IDragBackend {
    /** Stable identifier, mostly for debugging / tests. */
    readonly kind: 'html5' | 'pointer';
    createDropTarget(
        element: HTMLElement,
        options: DroptargetOptions
    ): IDropTarget;
}

class Html5DragBackend implements IDragBackend {
    readonly kind = 'html5' as const;
    createDropTarget(
        element: HTMLElement,
        options: DroptargetOptions
    ): IDropTarget {
        return new Droptarget(element, options);
    }
}

class PointerDragBackend implements IDragBackend {
    readonly kind = 'pointer' as const;
    createDropTarget(
        element: HTMLElement,
        options: DroptargetOptions
    ): IDropTarget {
        return new PointerDropTarget(element, options);
    }
}

export const html5Backend: IDragBackend = new Html5DragBackend();
export const pointerBackend: IDragBackend = new PointerDragBackend();
