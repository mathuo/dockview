import { Emitter, Event } from '../../events';
import { CompositeDisposable } from '../../lifecycle';
import {
    createOverlayElements,
    renderAnchoredOverlay,
    renderInPlaceOverlay,
} from '../dropOverlay';
import {
    calculateQuadrantAsPercentage,
    calculateQuadrantAsPixels,
    CanDisplayOverlay,
    DropTargetTargetModel,
    DroptargetEvent,
    DroptargetOverlayModel,
    IDropTarget,
    MeasuredValue,
    Position,
    WillShowOverlayEvent,
} from '../droptarget';
import { PointerDragController } from './pointerDragController';
import { IPointerDropTargetHandle, PointerDragEvent } from './types';

const DEFAULT_ACTIVATION_SIZE: MeasuredValue = {
    value: 20,
    type: 'percentage',
};

export interface PointerDropTargetOptions {
    canDisplayOverlay: CanDisplayOverlay;
    acceptedTargetZones: Position[];
    overlayModel?: DroptargetOverlayModel;
    /** Render into an external anchor container (floating groups, layout root). */
    getOverrideTarget?: () => DropTargetTargetModel | undefined;
    /** Outline element for positioning; falls back to the drop element. */
    getOverlayOutline?: () => HTMLElement | null;
    className?: string;
}

/** Pointer-driven counterpart to `Droptarget` with identical visual output. */
export class PointerDropTarget
    extends CompositeDisposable
    implements IDropTarget
{
    private _targetElement: HTMLElement | undefined;
    private _overlayElement: HTMLElement | undefined;
    private _state: Position | undefined;
    private _acceptedTargetZonesSet: Set<Position>;

    private readonly _onDrop = new Emitter<DroptargetEvent>();
    readonly onDrop: Event<DroptargetEvent> = this._onDrop.event;

    private readonly _onWillShowOverlay = new Emitter<WillShowOverlayEvent>();
    readonly onWillShowOverlay: Event<WillShowOverlayEvent> =
        this._onWillShowOverlay.event;

    private _disabled = false;

    get disabled(): boolean {
        return this._disabled;
    }

    set disabled(value: boolean) {
        this._disabled = value;
        if (value) {
            this._removeOverlay();
        }
    }

    get state(): Position | undefined {
        return this._state;
    }

    constructor(
        private readonly element: HTMLElement,
        private readonly options: PointerDropTargetOptions
    ) {
        super();

        this._acceptedTargetZonesSet = new Set(options.acceptedTargetZones);

        const handle: IPointerDropTargetHandle = {
            element: this.element,
            handleDragOver: (e) => this._onDragOver(e),
            handleDragLeave: () => this._onDragLeave(),
            handleDrop: (e) => this._onDropEvent(e),
        };

        this.addDisposables(
            this._onDrop,
            this._onWillShowOverlay,
            PointerDragController.getInstance().registerTarget(handle)
        );
    }

    setTargetZones(zones: Position[]): void {
        this._acceptedTargetZonesSet = new Set(zones);
    }

    setOverlayModel(model: DroptargetOverlayModel): void {
        this.options.overlayModel = model;
    }

    dispose(): void {
        this._removeOverlay();
        super.dispose();
    }

    private _onDragOver(event: PointerDragEvent): void {
        if (this._disabled) {
            this._removeOverlay();
            return;
        }

        const overrideTarget = this.options.getOverrideTarget?.();

        if (this._acceptedTargetZonesSet.size === 0) {
            if (overrideTarget) {
                return;
            }
            this._removeOverlay();
            return;
        }

        const outlineEl = this.options.getOverlayOutline?.() ?? this.element;
        const width = outlineEl.offsetWidth;
        const height = outlineEl.offsetHeight;

        if (width === 0 || height === 0) {
            return;
        }

        const rect = outlineEl.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const quadrant = this._calculateQuadrant(x, y, width, height);

        if (quadrant === null) {
            this._removeOverlay();
            return;
        }

        if (!this.options.canDisplayOverlay(event.pointerEvent, quadrant)) {
            if (overrideTarget) {
                return;
            }
            this._removeOverlay();
            return;
        }

        const willShow = new WillShowOverlayEvent({
            nativeEvent: event.pointerEvent,
            position: quadrant,
        });
        this._onWillShowOverlay.fire(willShow);
        if (willShow.defaultPrevented) {
            this._removeOverlay();
            return;
        }

        if (overrideTarget) {
            renderAnchoredOverlay({
                outlineElement: outlineEl,
                targetModel: overrideTarget,
                quadrant,
                width,
                height,
                overlayModel: this.options.overlayModel,
                className: this.options.className,
            });
            this._state = quadrant;
            return;
        }

        if (!this._targetElement) {
            const els = createOverlayElements();
            this._targetElement = els.dropzone;
            this._overlayElement = els.selection;
            this._state = 'center';
            this.element.classList.add('dv-drop-target');
            this.element.append(this._targetElement);
        }

        if (this._overlayElement) {
            renderInPlaceOverlay(
                this._overlayElement,
                quadrant,
                width,
                height,
                this.options.overlayModel
            );
        }
        this._state = quadrant;
    }

    private _onDragLeave(): void {
        const overrideTarget = this.options.getOverrideTarget?.();
        // Anchor target owns its own lifecycle; just clear our latched
        // state so a subsequent pointerup doesn't fire a stale drop.
        if (overrideTarget) {
            this._state = undefined;
            overrideTarget.clear();
            return;
        }
        this._removeOverlay();
    }

    private _onDropEvent(event: PointerDragEvent): void {
        const state = this._state;
        const overrideTarget = this.options.getOverrideTarget?.();
        this._removeOverlay();
        overrideTarget?.clear();
        if (state) {
            this._onDrop.fire({
                position: state,
                nativeEvent: event.pointerEvent,
            });
        }
    }

    private _calculateQuadrant(
        x: number,
        y: number,
        width: number,
        height: number
    ): Position | null {
        const activation =
            this.options.overlayModel?.activationSize ??
            DEFAULT_ACTIVATION_SIZE;

        if (activation.type === 'percentage') {
            return calculateQuadrantAsPercentage(
                this._acceptedTargetZonesSet,
                x,
                y,
                width,
                height,
                activation.value
            );
        }

        return calculateQuadrantAsPixels(
            this._acceptedTargetZonesSet,
            x,
            y,
            width,
            height,
            activation.value
        );
    }

    private _removeOverlay(): void {
        if (this._targetElement) {
            this._state = undefined;
            this._targetElement.parentElement?.classList.remove(
                'dv-drop-target'
            );
            this._targetElement.remove();
            this._targetElement = undefined;
            this._overlayElement = undefined;
        } else {
            this._state = undefined;
        }
    }
}
