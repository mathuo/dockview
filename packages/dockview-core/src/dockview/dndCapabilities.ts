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
            // On touch-primary devices (phones / basic tablets) HTML5 DnD's
            // native long-press intercepts the gesture before our pointer
            // backend can react — Android Chrome launches a system drag with
            // its half-transparent thumbnail, and the long-press context menu
            // never opens. Disable HTML5 there so the pointer backend owns
            // every gesture. Hybrid devices (touchscreen laptops, Surface,
            // iPad with mouse) keep both backends — mouse uses HTML5, touch
            // falls back to whichever backend the underlying element wired.
            return isCoarsePrimaryInput()
                ? { html5: false, pointer: true, pointerHandlesMouse: true }
                : { html5: true, pointer: true, pointerHandlesMouse: false };
    }
}

function isCoarsePrimaryInput(): boolean {
    if (globalThis.window === undefined || !globalThis.matchMedia) {
        return false;
    }
    // Coarse pointer without any fine pointer = phone-class device. A laptop
    // touchscreen reports both, and we want HTML5 to remain available there
    // because a real mouse is also plugged in.
    const coarse = globalThis.matchMedia('(pointer: coarse)').matches;
    const fine = globalThis.matchMedia('(pointer: fine)').matches;
    return coarse && !fine;
}
