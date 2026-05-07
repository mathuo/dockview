import { addDisposableListener, Emitter, Event } from '../../events';
import { CompositeDisposable, IDisposable } from '../../lifecycle';
import { IPointerDropTargetHandle, PointerDragEvent } from './types';

export interface ActiveDrag {
    readonly pointerId: number;
    readonly startX: number;
    readonly startY: number;
    readonly source: HTMLElement;
}

/**
 * Page-wide singleton that orchestrates an active pointer-driven drag.
 *
 * Responsibilities:
 *  - Track the currently active drag (only one at a time, just like HTML5 DnD).
 *  - Listen to window-level pointermove/pointerup once a drag begins.
 *  - On each move, hit-test registered drop targets via elementsFromPoint and
 *    forward drag-over / drag-leave / drop callbacks to the relevant target.
 *  - Defer disposal of the drag payload until after drop handlers run, mirroring
 *    the existing AbstractDragHandler behaviour.
 */
export class PointerDragController extends CompositeDisposable {
    private static _instance: PointerDragController | undefined;

    static getInstance(): PointerDragController {
        if (!PointerDragController._instance) {
            PointerDragController._instance = new PointerDragController();
        }
        return PointerDragController._instance;
    }

    private readonly _targets = new Set<IPointerDropTargetHandle>();
    private _active: ActiveDrag | undefined;
    private _currentTarget: IPointerDropTargetHandle | undefined;
    private _dataDisposable: IDisposable | undefined;
    private _moveListener: IDisposable | undefined;
    private _upListener: IDisposable | undefined;
    private _cancelListener: IDisposable | undefined;
    private _onDragMoveCallback?: (e: PointerDragEvent) => void;
    private _onDragEndCallback?: (e: PointerDragEvent, dropped: boolean) => void;

    private readonly _onDragStart = new Emitter<PointerDragEvent>();
    readonly onDragStart: Event<PointerDragEvent> = this._onDragStart.event;

    private readonly _onDragEnd = new Emitter<PointerDragEvent>();
    readonly onDragEnd: Event<PointerDragEvent> = this._onDragEnd.event;

    private constructor() {
        super();
        this.addDisposables(this._onDragStart, this._onDragEnd);
    }

    get active(): ActiveDrag | undefined {
        return this._active;
    }

    /**
     * Drop targets register themselves so the controller can hit-test against
     * them on each pointermove. Returns a disposer; PointerDropTarget calls this
     * in its constructor.
     */
    registerTarget(target: IPointerDropTargetHandle): IDisposable {
        this._targets.add(target);
        return {
            dispose: () => {
                this._targets.delete(target);
                if (this._currentTarget === target) {
                    this._currentTarget = undefined;
                }
            },
        };
    }

    beginDrag(args: {
        pointerEvent: PointerEvent;
        source: HTMLElement;
        getData: () => IDisposable;
        onDragMove?: (e: PointerDragEvent) => void;
        onDragEnd?: (e: PointerDragEvent, dropped: boolean) => void;
    }): void {
        if (this._active) {
            this.cancel();
        }

        const { pointerEvent, source } = args;

        this._active = {
            pointerId: pointerEvent.pointerId,
            startX: pointerEvent.clientX,
            startY: pointerEvent.clientY,
            source,
        };
        this._onDragMoveCallback = args.onDragMove;
        this._onDragEndCallback = args.onDragEnd;
        this._dataDisposable = args.getData();

        const startEvent: PointerDragEvent = {
            clientX: pointerEvent.clientX,
            clientY: pointerEvent.clientY,
            pointerEvent,
        };
        this._onDragStart.fire(startEvent);

        this._moveListener = addDisposableListener(
            window,
            'pointermove',
            (e) => {
                if (!this._active || e.pointerId !== this._active.pointerId) {
                    return;
                }
                this._handleMove(e);
            }
        );

        this._upListener = addDisposableListener(window, 'pointerup', (e) => {
            if (!this._active || e.pointerId !== this._active.pointerId) {
                return;
            }
            this._handleEnd(e, true);
        });

        this._cancelListener = addDisposableListener(
            window,
            'pointercancel',
            (e) => {
                if (!this._active || e.pointerId !== this._active.pointerId) {
                    return;
                }
                this._handleEnd(e, false);
            }
        );
    }

    cancel(): void {
        if (!this._active) {
            return;
        }
        this._currentTarget?.handleDragLeave();
        this._teardown();
        this._dataDisposable?.dispose();
        this._dataDisposable = undefined;
    }

    private _findTargetUnder(
        x: number,
        y: number
    ): IPointerDropTargetHandle | undefined {
        const elements = document.elementsFromPoint(x, y);
        for (const el of elements) {
            for (const target of this._targets) {
                if (target.element === el || target.element.contains(el)) {
                    return target;
                }
            }
        }
        return undefined;
    }

    private _handleMove(e: PointerEvent): void {
        const dragEvent: PointerDragEvent = {
            clientX: e.clientX,
            clientY: e.clientY,
            pointerEvent: e,
        };

        const newTarget = this._findTargetUnder(e.clientX, e.clientY);

        if (newTarget !== this._currentTarget) {
            this._currentTarget?.handleDragLeave();
            this._currentTarget = newTarget;
        }

        if (newTarget) {
            newTarget.handleDragOver(dragEvent);
        }

        this._onDragMoveCallback?.(dragEvent);
    }

    private _handleEnd(e: PointerEvent, dropped: boolean): void {
        const dragEvent: PointerDragEvent = {
            clientX: e.clientX,
            clientY: e.clientY,
            pointerEvent: e,
        };

        if (dropped && this._currentTarget) {
            this._currentTarget.handleDrop(dragEvent);
        } else {
            this._currentTarget?.handleDragLeave();
        }

        const onEnd = this._onDragEndCallback;
        const dataDisposable = this._dataDisposable;

        this._teardown();
        this._dataDisposable = undefined;

        // Defer payload disposal so consumers reading via getPanelData() during
        // drop handlers still see the data, mirroring AbstractDragHandler.
        setTimeout(() => dataDisposable?.dispose(), 0);

        onEnd?.(dragEvent, dropped);
        this._onDragEnd.fire(dragEvent);
    }

    private _teardown(): void {
        this._currentTarget = undefined;
        this._active = undefined;
        this._onDragMoveCallback = undefined;
        this._onDragEndCallback = undefined;
        this._moveListener?.dispose();
        this._upListener?.dispose();
        this._cancelListener?.dispose();
        this._moveListener = undefined;
        this._upListener = undefined;
        this._cancelListener = undefined;
    }
}
