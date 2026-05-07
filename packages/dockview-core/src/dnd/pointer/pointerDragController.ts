import { disableIframePointEvents } from '../../dom';
import { addDisposableListener, Emitter, Event } from '../../events';
import { CompositeDisposable, IDisposable } from '../../lifecycle';
import { PointerGhost } from './pointerGhost';
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
    private _ghost: PointerGhost | undefined;
    private _moveListener: IDisposable | undefined;
    private _upListener: IDisposable | undefined;
    private _cancelListener: IDisposable | undefined;
    private _iframeShield: { release: () => void } | undefined;
    private _onDragMoveCallback?: (e: PointerDragEvent) => void;
    private _onDragEndCallback?: (
        e: PointerDragEvent,
        dropped: boolean
    ) => void;

    private readonly _onDragStart = new Emitter<PointerDragEvent>();
    readonly onDragStart: Event<PointerDragEvent> = this._onDragStart.event;

    private readonly _onDragMove = new Emitter<PointerDragEvent>();
    readonly onDragMove: Event<PointerDragEvent> = this._onDragMove.event;

    private readonly _onDrop = new Emitter<PointerDragEvent>();
    readonly onDrop: Event<PointerDragEvent> = this._onDrop.event;

    private readonly _onDragEnd = new Emitter<PointerDragEvent>();
    readonly onDragEnd: Event<PointerDragEvent> = this._onDragEnd.event;

    private constructor() {
        super();
        this.addDisposables(
            this._onDragStart,
            this._onDragMove,
            this._onDrop,
            this._onDragEnd
        );
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
        ghost?: PointerGhost;
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
        this._ghost = args.ghost;

        // Pointer events are captured by iframes embedded inside dockview
        // panels — once the cursor crosses an iframe boundary the parent
        // window stops receiving `pointermove` and the drag freezes. Cover
        // the iframes with `pointer-events: none` for the lifetime of the
        // drag (mirrors what the deleted AbstractDragHandler did for the
        // HTML5 path).
        this._iframeShield = disableIframePointEvents(
            source.ownerDocument ?? document
        );

        const startEvent: PointerDragEvent = {
            clientX: pointerEvent.clientX,
            clientY: pointerEvent.clientY,
            pointerEvent,
        };
        this._onDragStart.fire(startEvent);

        // Listen on the source's owning window so popout / popout-group
        // contexts work — `window` would only see events from the main
        // document, leaving popout-window drags frozen after pointerdown.
        const targetWindow: Window =
            source.ownerDocument?.defaultView ?? window;

        this._moveListener = addDisposableListener(
            targetWindow,
            'pointermove',
            (e) => {
                if (!this._active || e.pointerId !== this._active.pointerId) {
                    return;
                }
                this._handleMove(e);
            }
        );

        this._upListener = addDisposableListener(
            targetWindow,
            'pointerup',
            (e) => {
                if (!this._active || e.pointerId !== this._active.pointerId) {
                    return;
                }
                this._handleEnd(e, true);
            }
        );

        this._cancelListener = addDisposableListener(
            targetWindow,
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
        // Build an O(1) element→target lookup so we can ask: is THIS exact
        // element a registered target?
        const targetByElement = new Map<Element, IPointerDropTargetHandle>();
        for (const target of this._targets) {
            targetByElement.set(target.element, target);
        }

        // `elementsFromPoint` returns elements in topmost-first order.
        // Walking up from each element finds the *closest* registered
        // ancestor — preferring the most specific drop target (e.g. a tab)
        // over outer ancestors (e.g. the dockview root) that happen to
        // contain the cursor too. The previous implementation used a plain
        // `.contains()` check inside the inner loop, which always matched
        // outer targets first and made nested drop zones unreachable.
        const elements = document.elementsFromPoint(x, y);
        for (const el of elements) {
            let current: Element | null = el;
            while (current) {
                const target = targetByElement.get(current);
                if (target) {
                    return target;
                }
                current = current.parentElement;
            }
        }
        return undefined;
    }

    private _handleMove(e: PointerEvent): void {
        this._ghost?.update(e.clientX, e.clientY);

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
        this._onDragMove.fire(dragEvent);
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
        if (dropped) {
            this._onDrop.fire(dragEvent);
        }
        this._onDragEnd.fire(dragEvent);
    }

    private _teardown(): void {
        this._currentTarget = undefined;
        this._active = undefined;
        this._onDragMoveCallback = undefined;
        this._onDragEndCallback = undefined;
        this._ghost?.dispose();
        this._ghost = undefined;
        this._iframeShield?.release();
        this._iframeShield = undefined;
        this._moveListener?.dispose();
        this._upListener?.dispose();
        this._cancelListener?.dispose();
        this._moveListener = undefined;
        this._upListener = undefined;
        this._cancelListener = undefined;
    }
}
