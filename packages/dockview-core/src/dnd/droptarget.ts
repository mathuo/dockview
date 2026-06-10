import { DockviewEvent, Emitter, Event } from '../events';
import { CompositeDisposable, IDisposable } from '../lifecycle';
import { DragAndDropObserver } from './dnd';
import { Direction } from '../gridview/baseComponentGridview';
import {
    createOverlayElements,
    renderAnchoredOverlay,
    renderInPlaceOverlay,
} from './dropOverlay';

export interface DroptargetEvent {
    readonly position: Position;
    /** Narrow with `instanceof DragEvent` before reading `dataTransfer`. */
    readonly nativeEvent: DragEvent | PointerEvent;
}

export class WillShowOverlayEvent
    extends DockviewEvent
    implements DroptargetEvent
{
    get nativeEvent(): DragEvent | PointerEvent {
        return this.options.nativeEvent;
    }

    get position(): Position {
        return this.options.position;
    }

    constructor(
        private readonly options: {
            nativeEvent: DragEvent | PointerEvent;
            position: Position;
        }
    ) {
        super();
    }
}

export function directionToPosition(direction: Direction): Position {
    switch (direction) {
        case 'above':
            return 'top';
        case 'below':
            return 'bottom';
        case 'left':
            return 'left';
        case 'right':
            return 'right';
        case 'within':
            return 'center';
        default:
            throw new Error(`invalid direction '${direction}'`);
    }
}

export function positionToDirection(position: Position): Direction {
    switch (position) {
        case 'top':
            return 'above';
        case 'bottom':
            return 'below';
        case 'left':
            return 'left';
        case 'right':
            return 'right';
        case 'center':
            return 'within';
        default:
            throw new Error(`invalid position '${position}'`);
    }
}

export type Position = 'top' | 'bottom' | 'left' | 'right' | 'center';

export type CanDisplayOverlay = (
    dragEvent: DragEvent | PointerEvent,
    state: Position
) => boolean;

export type MeasuredValue = { value: number; type: 'pixels' | 'percentage' };

export type DroptargetOverlayModel = {
    size?: MeasuredValue;
    activationSize?: MeasuredValue;
    /**
     * Override the width threshold (in pixels) below which the overlay switches
     * to a thin-border indicator instead of a half-width highlight. Set to 0 to
     * always show the half-width overlay regardless of element size.
     */
    smallWidthBoundary?: number;
    /**
     * Override the height threshold (in pixels) below which the overlay switches
     * to a thin-border indicator instead of a half-height highlight. Set to 0 to
     * always show the half-height overlay regardless of element size.
     */
    smallHeightBoundary?: number;
};

const DEFAULT_ACTIVATION_SIZE: MeasuredValue = {
    value: 20,
    type: 'percentage',
};

export interface DropTargetTargetModel {
    getElements(
        event?: DragEvent,
        outline?: HTMLElement
    ): {
        root: HTMLElement;
        overlay: HTMLElement;
        changed: boolean;
    };
    exists(): boolean;
    clear(): void;
}

export interface DroptargetOptions {
    canDisplayOverlay: CanDisplayOverlay;
    acceptedTargetZones: Position[];
    overlayModel?: DroptargetOverlayModel;
    getOverrideTarget?: () => DropTargetTargetModel | undefined;
    className?: string;
    getOverlayOutline?: () => HTMLElement | null;
}

/**
 * Backend-agnostic drop target. Both the HTML5 `Droptarget` and the pointer
 * `PointerDropTarget` implement this shape so consumers can hold one field
 * regardless of which DnD backend produced it.
 */
export interface IDropTarget extends IDisposable {
    readonly onDrop: Event<DroptargetEvent>;
    readonly onWillShowOverlay: Event<WillShowOverlayEvent>;
    readonly state: Position | undefined;
    disabled: boolean;
    setTargetZones(zones: Position[]): void;
    setOverlayModel(model: DroptargetOverlayModel): void;
}

export class Droptarget extends CompositeDisposable implements IDropTarget {
    private targetElement: HTMLElement | undefined;
    private overlayElement: HTMLElement | undefined;
    private _state: Position | undefined;
    private _acceptedTargetZonesSet: Set<Position>;

    private readonly _onDrop = new Emitter<DroptargetEvent>();
    readonly onDrop: Event<DroptargetEvent> = this._onDrop.event;

    private readonly _onWillShowOverlay = new Emitter<WillShowOverlayEvent>();
    readonly onWillShowOverlay: Event<WillShowOverlayEvent> =
        this._onWillShowOverlay.event;

    readonly dnd: DragAndDropObserver;

    private static USED_EVENT_ID = '__dockview_droptarget_event_is_used__';

    private static ACTUAL_TARGET: Droptarget | undefined;

    private _disabled: boolean;

    get disabled(): boolean {
        return this._disabled;
    }

    set disabled(value: boolean) {
        this._disabled = value;
    }

    get state(): Position | undefined {
        return this._state;
    }

    constructor(
        private readonly element: HTMLElement,
        private readonly options: DroptargetOptions
    ) {
        super();

        this._disabled = false;

        // use a set to take advantage of #<set>.has
        this._acceptedTargetZonesSet = new Set(
            this.options.acceptedTargetZones
        );

        this.dnd = new DragAndDropObserver(this.element, {
            onDragEnter: () => {
                this.options.getOverrideTarget?.()?.getElements();
            },
            onDragOver: (e) => {
                Droptarget.ACTUAL_TARGET = this;

                const overrideTarget = this.options.getOverrideTarget?.();

                if (this._acceptedTargetZonesSet.size === 0) {
                    if (overrideTarget) {
                        return;
                    }
                    this.removeDropTarget();
                    return;
                }

                const target =
                    this.options.getOverlayOutline?.() ?? this.element;

                const width = target.offsetWidth;
                const height = target.offsetHeight;

                if (width === 0 || height === 0) {
                    return; // avoid div!0
                }

                const rect = (
                    e.currentTarget as HTMLElement
                ).getBoundingClientRect();
                const x = (e.clientX ?? 0) - rect.left;
                const y = (e.clientY ?? 0) - rect.top;

                const quadrant = this.calculateQuadrant(
                    this._acceptedTargetZonesSet,
                    x,
                    y,
                    width,
                    height
                );

                /**
                 * If the event has already been used by another DropTarget instance
                 * then don't show a second drop target, only one target should be
                 * active at any one time
                 */
                if (this.isAlreadyUsed(e) || quadrant === null) {
                    // no drop target should be displayed
                    this.removeDropTarget();
                    return;
                }

                if (!this.options.canDisplayOverlay(e, quadrant)) {
                    if (overrideTarget) {
                        return;
                    }
                    this.removeDropTarget();
                    return;
                }

                const willShowOverlayEvent = new WillShowOverlayEvent({
                    nativeEvent: e,
                    position: quadrant,
                });

                /**
                 * Provide an opportunity to prevent the overlay appearing and in turn
                 * any dnd behaviours
                 */
                this._onWillShowOverlay.fire(willShowOverlayEvent);

                if (willShowOverlayEvent.defaultPrevented) {
                    this.removeDropTarget();
                    return;
                }

                this.markAsUsed(e);

                if (overrideTarget) {
                    //
                } else if (!this.targetElement) {
                    const els = createOverlayElements();
                    this.targetElement = els.dropzone;
                    this.overlayElement = els.selection;
                    this._state = 'center';

                    target.classList.add('dv-drop-target');
                    target.append(this.targetElement);
                }

                this.toggleClasses(quadrant, width, height);

                this._state = quadrant;
            },
            onDragLeave: () => {
                const target = this.options.getOverrideTarget?.();

                if (target) {
                    return;
                }

                this.removeDropTarget();
            },
            onDragEnd: (e) => {
                const target = this.options.getOverrideTarget?.();

                if (target && Droptarget.ACTUAL_TARGET === this) {
                    if (this._state) {
                        // only stop the propagation of the event if we are dealing with it
                        // which is only when the target has state
                        e.stopPropagation();
                        this._onDrop.fire({
                            position: this._state,
                            nativeEvent: e,
                        });
                    }
                }

                this.removeDropTarget();

                target?.clear();
            },
            onDrop: (e) => {
                e.preventDefault();

                const state = this._state;

                this.removeDropTarget();

                this.options.getOverrideTarget?.()?.clear();

                if (state) {
                    // only stop the propagation of the event if we are dealing with it
                    // which is only when the target has state
                    e.stopPropagation();
                    this._onDrop.fire({ position: state, nativeEvent: e });
                }
            },
        });

        this.addDisposables(this._onDrop, this._onWillShowOverlay, this.dnd);
    }

    setTargetZones(acceptedTargetZones: Position[]): void {
        this._acceptedTargetZonesSet = new Set(acceptedTargetZones);
    }

    setOverlayModel(model: DroptargetOverlayModel): void {
        this.options.overlayModel = model;
    }

    dispose(): void {
        this.removeDropTarget();
        super.dispose();
    }

    /**
     * Add a property to the event object for other potential listeners to check
     */
    private markAsUsed(event: DragEvent): void {
        (event as any)[Droptarget.USED_EVENT_ID] = true;
    }

    /**
     * Check is the event has already been used by another instance of DropTarget
     */
    private isAlreadyUsed(event: DragEvent): boolean {
        const value = (event as any)[Droptarget.USED_EVENT_ID];
        return typeof value === 'boolean' && value;
    }

    private toggleClasses(
        quadrant: Position,
        width: number,
        height: number
    ): void {
        const target = this.options.getOverrideTarget?.();

        if (target) {
            const outlineEl =
                this.options.getOverlayOutline?.() ?? this.element;
            renderAnchoredOverlay({
                outlineElement: outlineEl,
                targetModel: target,
                quadrant,
                width,
                height,
                overlayModel: this.options.overlayModel,
                className: this.options.className,
            });
            return;
        }

        if (!this.overlayElement) {
            return;
        }

        renderInPlaceOverlay(
            this.overlayElement,
            quadrant,
            width,
            height,
            this.options.overlayModel
        );
    }

    private calculateQuadrant(
        overlayType: Set<Position>,
        x: number,
        y: number,
        width: number,
        height: number
    ): Position | null {
        const activationSizeOptions =
            this.options.overlayModel?.activationSize ??
            DEFAULT_ACTIVATION_SIZE;

        const isPercentage = activationSizeOptions.type === 'percentage';

        if (isPercentage) {
            return calculateQuadrantAsPercentage(
                overlayType,
                x,
                y,
                width,
                height,
                activationSizeOptions.value
            );
        }

        return calculateQuadrantAsPixels(
            overlayType,
            x,
            y,
            width,
            height,
            activationSizeOptions.value
        );
    }

    private removeDropTarget(): void {
        if (this.targetElement) {
            this._state = undefined;
            this.targetElement.parentElement?.classList.remove(
                'dv-drop-target'
            );
            this.targetElement.remove();
            this.targetElement = undefined;
            this.overlayElement = undefined;
        }
    }

    /**
     * Render the drop overlay at `position` without a live drag, so keyboard
     * docking shows the exact same preview as a mouse drag. Mirrors the
     * `onDragOver` render path (in-place or anchored). Pair with `clearOverlay`.
     */
    showOverlay(position: Position): void {
        const overrideTarget = this.options.getOverrideTarget?.();
        const target = this.options.getOverlayOutline?.() ?? this.element;
        const width = target.offsetWidth;
        const height = target.offsetHeight;

        if (!overrideTarget && !this.targetElement) {
            const els = createOverlayElements();
            this.targetElement = els.dropzone;
            this.overlayElement = els.selection;
            target.classList.add('dv-drop-target');
            target.append(this.targetElement);
        }

        this.toggleClasses(position, width, height);
        this._state = position;
    }

    /** Clear an overlay shown via {@link showOverlay} (in-place or anchored). */
    clearOverlay(): void {
        this.removeDropTarget();
        this.options.getOverrideTarget?.()?.clear();
        this._state = undefined;
    }
}

export function calculateQuadrantAsPercentage(
    overlayType: Set<Position>,
    x: number,
    y: number,
    width: number,
    height: number,
    threshold: number
): Position | null {
    const xp = (100 * x) / width;
    const yp = (100 * y) / height;

    if (overlayType.has('left') && xp < threshold) {
        return 'left';
    }
    if (overlayType.has('right') && xp > 100 - threshold) {
        return 'right';
    }
    if (overlayType.has('top') && yp < threshold) {
        return 'top';
    }
    if (overlayType.has('bottom') && yp > 100 - threshold) {
        return 'bottom';
    }

    if (!overlayType.has('center')) {
        return null;
    }

    return 'center';
}

export function calculateQuadrantAsPixels(
    overlayType: Set<Position>,
    x: number,
    y: number,
    width: number,
    height: number,
    threshold: number
): Position | null {
    if (overlayType.has('left') && x < threshold) {
        return 'left';
    }
    if (overlayType.has('right') && x > width - threshold) {
        return 'right';
    }
    if (overlayType.has('top') && y < threshold) {
        return 'top';
    }
    if (overlayType.has('bottom') && y > height - threshold) {
        return 'bottom';
    }

    if (!overlayType.has('center')) {
        return null;
    }

    return 'center';
}
