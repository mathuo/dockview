import { addDisposableListener } from '../../events';
import { CompositeDisposable, IDisposable } from '../../lifecycle';

export interface LongPressOptions {
    /** Delay in ms before long-press fires. Default 500ms. */
    delay?: number;
    /**
     * Movement tolerance in px. Pointer movement beyond this distance
     * cancels the in-flight long-press. Default 8px.
     */
    tolerance?: number;
    /**
     * If true (default), only `touch`/`pen` pointers trigger long-press.
     * Mouse users have right-click and don't need a long-press affordance.
     */
    touchOnly?: boolean;
    /**
     * Called when the press completes. Receives the originating
     * `pointerdown` event so consumers can read `clientX/Y` for menu
     * positioning.
     */
    onLongPress: (event: PointerEvent) => void;
}

const DEFAULT_DELAY = 500;
const DEFAULT_TOLERANCE = 8;

/**
 * Touch-friendly long-press gesture detector. A pointerdown that is held
 * for `delay` ms without moving more than `tolerance` px in any direction
 * fires `onLongPress`. Used to surface right-click context menus to touch
 * users.
 *
 * The detector is fully passive — it does not consume the pointer or
 * interfere with `PointerDragSource` or HTML5 drag events. If movement
 * exceeds the tolerance the press is cancelled silently, allowing the drag
 * source to take over.
 */
export class LongPressDetector extends CompositeDisposable {
    private _pointerId: number | undefined;
    private _startX = 0;
    private _startY = 0;
    private _timer: ReturnType<typeof setTimeout> | undefined;
    private _moveListener: IDisposable | undefined;
    private _upListener: IDisposable | undefined;
    private _cancelListener: IDisposable | undefined;

    constructor(
        private readonly element: HTMLElement,
        private readonly options: LongPressOptions
    ) {
        super();
        this.addDisposables(
            addDisposableListener(this.element, 'pointerdown', (e) => {
                this._onPointerDown(e);
            })
        );
    }

    private _onPointerDown(event: PointerEvent): void {
        const touchOnly = this.options.touchOnly ?? true;
        if (
            touchOnly &&
            event.pointerType !== 'touch' &&
            event.pointerType !== 'pen'
        ) {
            return;
        }

        // Defensive — supersede any in-flight press.
        this._cancelPending();

        this._pointerId = event.pointerId;
        this._startX = event.clientX;
        this._startY = event.clientY;

        const delay = this.options.delay ?? DEFAULT_DELAY;
        const tolerance = this.options.tolerance ?? DEFAULT_TOLERANCE;

        this._timer = setTimeout(() => {
            this._timer = undefined;
            this._cancelPending();
            this.options.onLongPress(event);
        }, delay);

        // Listen on the source's owning window so popout windows work —
        // the main `window` only sees events from the main document.
        const targetWindow: Window =
            this.element.ownerDocument?.defaultView ?? window;

        this._moveListener = addDisposableListener(
            targetWindow,
            'pointermove',
            (moveEvent) => {
                if (moveEvent.pointerId !== this._pointerId) {
                    return;
                }
                const dx = moveEvent.clientX - this._startX;
                const dy = moveEvent.clientY - this._startY;
                if (Math.hypot(dx, dy) > tolerance) {
                    this._cancelPending();
                }
            }
        );

        this._upListener = addDisposableListener(
            targetWindow,
            'pointerup',
            (upEvent) => {
                if (upEvent.pointerId !== this._pointerId) {
                    return;
                }
                this._cancelPending();
            }
        );

        this._cancelListener = addDisposableListener(
            targetWindow,
            'pointercancel',
            (cancelEvent) => {
                if (cancelEvent.pointerId !== this._pointerId) {
                    return;
                }
                this._cancelPending();
            }
        );
    }

    private _cancelPending(): void {
        if (this._timer !== undefined) {
            clearTimeout(this._timer);
            this._timer = undefined;
        }
        this._pointerId = undefined;
        this._moveListener?.dispose();
        this._upListener?.dispose();
        this._cancelListener?.dispose();
        this._moveListener = undefined;
        this._upListener = undefined;
        this._cancelListener = undefined;
    }

    dispose(): void {
        this._cancelPending();
        super.dispose();
    }
}
