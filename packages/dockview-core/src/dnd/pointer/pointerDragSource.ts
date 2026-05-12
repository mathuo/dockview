import { addDisposableListener } from '../../events';
import { CompositeDisposable, IDisposable } from '../../lifecycle';
import { PointerDragController } from './pointerDragController';
import { PointerGhost } from './pointerGhost';
import { PointerDragEvent } from './types';

export interface PointerDragSourceOptions {
    /** Populate transfer data; returned disposer clears it on drag end. */
    getData: (event: PointerEvent) => IDisposable;
    onDragStart?: (event: PointerEvent) => void;
    onDragMove?: (event: PointerDragEvent) => void;
    onDragEnd?: (event: PointerDragEvent, dropped: boolean) => void;
    /** Cancels the drag at pointerdown time. */
    isCancelled?: (event: PointerEvent) => boolean;
    /** Default 5px. Touch pointers also need `touchInitiationDelay` to elapse. */
    threshold?: number;
    /** Touch-only long-press; movement past `pressTolerance` cancels and lets the browser claim the gesture. Default 250ms. */
    touchInitiationDelay?: number;
    /** Default 8px. */
    pressTolerance?: number;
    /** Default true: mouse defers to HTML5; pointer path handles touch / pen only. */
    touchOnly?: boolean;
    /** Follow-finger ghost factory; if omitted the user only sees drop overlays. */
    createGhost?: (event: PointerEvent) => PointerGhost | undefined;
    /**
     * Called with the per-move pointer delta during the pre-arm window when
     * the user moves past `pressTolerance` before the long-press has armed.
     * When provided, the source enters a "scroll-forwarding" mode instead of
     * cancelling the gesture, so quick flicks on a `touch-action: none` source
     * (which would otherwise do nothing) can still scroll a container. The
     * callback is invoked on every subsequent pointermove until pointerup or
     * pointercancel; the drag itself never arms once scroll mode begins.
     */
    onPreArmScroll?: (
        dx: number,
        dy: number,
        event: PointerEvent
    ) => void;
}

const DEFAULT_THRESHOLD = 5;
const DEFAULT_TOUCH_INITIATION_DELAY = 250;
const DEFAULT_PRESS_TOLERANCE = 8;

/**
 * Pointer-event drag source. Waits for movement past `threshold` (and
 * touch-only `touchInitiationDelay`) before promoting to a drag so taps
 * pass through unaffected.
 */
export class PointerDragSource extends CompositeDisposable {
    private _disabled = false;
    private _touchOnly: boolean;
    private _pendingPointerId: number | undefined;
    private _pendingMoveListener: IDisposable | undefined;
    private _pendingUpListener: IDisposable | undefined;
    private _pendingCancelListener: IDisposable | undefined;
    private _armTimer: ReturnType<typeof setTimeout> | undefined;
    private _armed = false;
    private _startX = 0;
    private _startY = 0;
    private _startEvent: PointerEvent | undefined;
    // Scroll-forwarding mode: once entered, pointermoves on this pointer are
    // diffed against the previous position and forwarded via `onPreArmScroll`
    // instead of being evaluated for drag arming. Stays active until
    // pointerup/pointercancel.
    private _scrollMode = false;
    private _lastScrollX = 0;
    private _lastScrollY = 0;

    constructor(
        private readonly element: HTMLElement,
        private readonly options: PointerDragSourceOptions
    ) {
        super();

        this._touchOnly = options.touchOnly ?? true;

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

    /**
     * `false` lets the pointer source also handle mouse pointers; used when
     * `dndStrategy: 'pointer'` to drive every input type through this path.
     */
    setTouchOnly(value: boolean): void {
        if (this._touchOnly === value) {
            return;
        }
        this._touchOnly = value;
        // A pending mouse-tracked drag should be abandoned if we re-enable
        // the touch-only filter mid-flight.
        if (value) {
            this._cancelPending();
        }
    }

    private _shouldHandle(event: PointerEvent): boolean {
        if (this._disabled) {
            return false;
        }
        // Pointer-type filter runs before isCancelled — consumer state read
        // by isCancelled may not be populated for events we'll never handle.
        if (
            this._touchOnly &&
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

        // Defensive: a fresh pointerdown supersedes any in-flight tracking.
        this._cancelPending();

        this._pendingPointerId = event.pointerId;
        this._startX = event.clientX;
        this._startY = event.clientY;
        this._startEvent = event;

        const isTouch =
            event.pointerType === 'touch' || event.pointerType === 'pen';

        // Touch waits for a long-press so quick swipes fall through to the
        // browser's native scroll (with `touch-action: pan-x` etc).
        const initiationDelay =
            this.options.touchInitiationDelay ?? DEFAULT_TOUCH_INITIATION_DELAY;
        this._armed = !isTouch || initiationDelay <= 0;
        if (isTouch && initiationDelay > 0) {
            this._armTimer = setTimeout(() => {
                this._armTimer = undefined;
                this._armed = true;
            }, initiationDelay);
        }

        const threshold = this.options.threshold ?? DEFAULT_THRESHOLD;
        const pressTolerance =
            this.options.pressTolerance ?? DEFAULT_PRESS_TOLERANCE;

        // Source's owning window — popout drags fire on their own window.
        const targetWindow: Window =
            this.element.ownerDocument?.defaultView ?? window;

        this._pendingMoveListener = addDisposableListener(
            targetWindow,
            'pointermove',
            (moveEvent) => {
                if (moveEvent.pointerId !== this._pendingPointerId) {
                    return;
                }

                if (this._scrollMode) {
                    const stepDx = moveEvent.clientX - this._lastScrollX;
                    const stepDy = moveEvent.clientY - this._lastScrollY;
                    this._lastScrollX = moveEvent.clientX;
                    this._lastScrollY = moveEvent.clientY;
                    this.options.onPreArmScroll?.(stepDx, stepDy, moveEvent);
                    return;
                }

                const dx = moveEvent.clientX - this._startX;
                const dy = moveEvent.clientY - this._startY;
                const distance = Math.hypot(dx, dy);

                if (this._armed) {
                    if (distance >= threshold) {
                        this._beginDrag(moveEvent);
                    }
                    return;
                }

                // Pre-arm phase: significant movement means the user is
                // scrolling, not pressing. If a scroll forwarder is wired
                // up, hand the gesture off to it (covers the
                // `touch-action: none` source case where the browser won't
                // produce its own pan). Otherwise cancel so the browser's
                // native gesture handler can take over.
                if (distance > pressTolerance) {
                    if (this.options.onPreArmScroll) {
                        this._enterScrollMode(moveEvent);
                    } else {
                        this._cancelPending();
                    }
                }
            }
        );

        this._pendingUpListener = addDisposableListener(
            targetWindow,
            'pointerup',
            (upEvent) => {
                if (upEvent.pointerId !== this._pendingPointerId) {
                    return;
                }
                this._cancelPending();
            }
        );

        this._pendingCancelListener = addDisposableListener(
            targetWindow,
            'pointercancel',
            (cancelEvent) => {
                if (cancelEvent.pointerId !== this._pendingPointerId) {
                    return;
                }
                this._cancelPending();
            }
        );
    }

    /** For sibling gesture detectors (e.g. LongPressDetector) to dismiss a pending drag. */
    cancelPending(): void {
        this._cancelPending();
    }

    private _cancelPending(): void {
        this._pendingPointerId = undefined;
        if (this._armTimer !== undefined) {
            clearTimeout(this._armTimer);
            this._armTimer = undefined;
        }
        this._armed = false;
        this._scrollMode = false;
        this._pendingMoveListener?.dispose();
        this._pendingUpListener?.dispose();
        this._pendingCancelListener?.dispose();
        this._pendingMoveListener = undefined;
        this._pendingUpListener = undefined;
        this._pendingCancelListener = undefined;
        this._startEvent = undefined;
    }

    /**
     * Promote the in-flight gesture from "deciding whether to drag" to
     * "definitely a scroll." We clear the long-press timer so the drag can
     * no longer arm, keep the existing pointermove / up / cancel listeners
     * (so we keep receiving deltas until the pointer is released), and
     * seed the running scroll origin from this first qualifying move.
     */
    private _enterScrollMode(event: PointerEvent): void {
        this._scrollMode = true;
        this._lastScrollX = event.clientX;
        this._lastScrollY = event.clientY;
        if (this._armTimer !== undefined) {
            clearTimeout(this._armTimer);
            this._armTimer = undefined;
        }
        this._armed = false;
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
