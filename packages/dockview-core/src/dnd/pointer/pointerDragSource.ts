import { addDisposableListener } from '../../events';
import { CompositeDisposable, IDisposable } from '../../lifecycle';
import { PointerDragController } from './pointerDragController';
import { PointerGhost } from './pointerGhost';
import { PointerDragEvent } from './types';

export interface PointerDragSourceOptions {
    /**
     * Called when the drag is established. Should populate transfer data
     * (e.g. via LocalSelectionTransfer) and return a disposable that clears
     * the data when the drag ends.
     */
    getData: (event: PointerEvent) => IDisposable;
    /**
     * Optional hook fired once the threshold is exceeded and the drag begins.
     * Use for ghost setup, class toggles, etc.
     */
    onDragStart?: (event: PointerEvent) => void;
    /**
     * Optional hook fired on every pointermove during the drag.
     */
    onDragMove?: (event: PointerDragEvent) => void;
    /**
     * Optional hook fired when the drag ends (drop or cancel).
     */
    onDragEnd?: (event: PointerDragEvent, dropped: boolean) => void;
    /**
     * Returning true cancels the drag at pointerdown time.
     */
    isCancelled?: (event: PointerEvent) => boolean;
    /**
     * Pixel distance the pointer must travel before a drag is recognised.
     * Default 5.
     */
    threshold?: number;
    /**
     * If true (default), only touch/pen pointers initiate a drag — mouse
     * defers to the existing HTML5 drag path. Set to false to also handle
     * mouse pointers.
     */
    touchOnly?: boolean;
    /**
     * Optional factory for a follow-finger ghost. Called once at drag start
     * (after the threshold is crossed). Return a `PointerGhost` and the
     * controller will keep it positioned under the pointer for the lifetime
     * of the drag. If omitted, no ghost is shown — the user only sees drop
     * overlays.
     */
    createGhost?: (event: PointerEvent) => PointerGhost | undefined;
}

const DEFAULT_THRESHOLD = 5;

/**
 * Pointer-event-based drag source. Replaces AbstractDragHandler for any
 * element that needs to participate in pointer-driven (touch-friendly) drags.
 *
 * On pointerdown we wait for movement past `threshold` before promoting the
 * gesture to a drag, which allows taps to pass through unaffected.
 */
export class PointerDragSource extends CompositeDisposable {
    private _disabled = false;
    private _pendingPointerId: number | undefined;
    private _pendingMoveListener: IDisposable | undefined;
    private _pendingUpListener: IDisposable | undefined;
    private _pendingCancelListener: IDisposable | undefined;
    private _startX = 0;
    private _startY = 0;
    private _startEvent: PointerEvent | undefined;

    constructor(
        private readonly element: HTMLElement,
        private readonly options: PointerDragSourceOptions
    ) {
        super();

        this.addDisposables(
            addDisposableListener(this.element, 'pointerdown', (e) => {
                this._onPointerDown(e);
            })
        );
    }

    setDisabled(value: boolean): void {
        this._disabled = value;
        if (value) {
            this._cancelPending();
        }
    }

    private _shouldHandle(event: PointerEvent): boolean {
        if (this._disabled) {
            return false;
        }
        // Filter on pointer type FIRST. The isCancelled callback is allowed
        // to read consumer-side state that may not be populated for events
        // we'll never act on (e.g. desktop mouse drags handled by HTML5).
        const touchOnly = this.options.touchOnly ?? true;
        if (
            touchOnly &&
            event.pointerType !== 'touch' &&
            event.pointerType !== 'pen'
        ) {
            return false;
        }
        if (this.options.isCancelled?.(event)) {
            return false;
        }
        return true;
    }

    private _onPointerDown(event: PointerEvent): void {
        if (!this._shouldHandle(event)) {
            return;
        }

        // Cancel any existing pending drag (defensive — a fresh pointerdown
        // supersedes any in-flight tracking).
        this._cancelPending();

        this._pendingPointerId = event.pointerId;
        this._startX = event.clientX;
        this._startY = event.clientY;
        this._startEvent = event;

        const threshold = this.options.threshold ?? DEFAULT_THRESHOLD;

        this._pendingMoveListener = addDisposableListener(
            window,
            'pointermove',
            (moveEvent) => {
                if (moveEvent.pointerId !== this._pendingPointerId) {
                    return;
                }
                const dx = moveEvent.clientX - this._startX;
                const dy = moveEvent.clientY - this._startY;
                if (Math.hypot(dx, dy) >= threshold) {
                    this._beginDrag(moveEvent);
                }
            }
        );

        this._pendingUpListener = addDisposableListener(
            window,
            'pointerup',
            (upEvent) => {
                if (upEvent.pointerId !== this._pendingPointerId) {
                    return;
                }
                this._cancelPending();
            }
        );

        this._pendingCancelListener = addDisposableListener(
            window,
            'pointercancel',
            (cancelEvent) => {
                if (cancelEvent.pointerId !== this._pendingPointerId) {
                    return;
                }
                this._cancelPending();
            }
        );
    }

    private _cancelPending(): void {
        this._pendingPointerId = undefined;
        this._pendingMoveListener?.dispose();
        this._pendingUpListener?.dispose();
        this._pendingCancelListener?.dispose();
        this._pendingMoveListener = undefined;
        this._pendingUpListener = undefined;
        this._pendingCancelListener = undefined;
        this._startEvent = undefined;
    }

    private _beginDrag(triggerEvent: PointerEvent): void {
        const startEvent = this._startEvent ?? triggerEvent;
        this._cancelPending();

        this.options.onDragStart?.(startEvent);

        const ghost = this.options.createGhost?.(startEvent);

        PointerDragController.getInstance().beginDrag({
            pointerEvent: triggerEvent,
            source: this.element,
            getData: () => this.options.getData(startEvent),
            ghost,
            onDragMove: this.options.onDragMove,
            onDragEnd: this.options.onDragEnd,
        });
    }

    dispose(): void {
        this._cancelPending();
        super.dispose();
    }
}
