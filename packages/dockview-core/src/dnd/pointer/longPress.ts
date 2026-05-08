import { addDisposableListener } from '../../events';
import { CompositeDisposable, IDisposable } from '../../lifecycle';

export interface LongPressOptions {
    /** Default 500ms. */
    delay?: number;
    /** Default 8px. */
    tolerance?: number;
    /** Default true: mouse users have right-click and don't need this. */
    touchOnly?: boolean;
    /** Receives the `pointerdown` event so consumers can read `clientX/Y`. */
    onLongPress: (event: PointerEvent) => void;
}

const DEFAULT_DELAY = 500;
const DEFAULT_TOLERANCE = 8;

/**
 * Passive — does not consume the pointer; movement past `tolerance`
 * cancels silently so a sibling `PointerDragSource` can take over.
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

        // Source's owning window — popout drags fire on their own window.
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
