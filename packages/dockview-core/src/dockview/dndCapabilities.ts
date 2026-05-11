import { DockviewOptions } from './options';

/**
 * Internal mapping of the user-facing `dndStrategy` option into the
 * per-backend capability flags consumed by drag-source / drop-target
 * construction sites. Not part of the public API — consumers only see
 * the `dndStrategy` option itself.
 */
export interface DndCapabilities {
    /** HTML5 drag/drop wiring active (draggable attr, dragstart). */
    readonly html5: boolean;
    /** Pointer-event drag source active. */
    readonly pointer: boolean;
    /**
     * When true, the pointer source handles mouse pointers too
     * (`touchOnly: false`). Implies `pointer` is true.
     */
    readonly pointerHandlesMouse: boolean;
}

export function resolveDndCapabilities(
    options: Pick<DockviewOptions, 'dndStrategy' | 'disableDnd'>
): DndCapabilities {
    if (options.disableDnd) {
        return { html5: false, pointer: false, pointerHandlesMouse: false };
    }
    switch (options.dndStrategy) {
        case 'pointer':
            return { html5: false, pointer: true, pointerHandlesMouse: true };
        case 'html5':
            return { html5: true, pointer: false, pointerHandlesMouse: false };
        case 'auto':
        case undefined:
        default:
            return { html5: true, pointer: true, pointerHandlesMouse: false };
    }
}
