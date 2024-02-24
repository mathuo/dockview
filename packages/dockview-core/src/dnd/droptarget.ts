import { toggleClass } from '../dom';
import { Emitter, Event } from '../events';
import { CompositeDisposable } from '../lifecycle';
import { DragAndDropObserver } from './dnd';
import { clamp } from '../math';
import { Direction } from '../gridview/baseComponentGridview';

export interface DroptargetEvent {
    readonly position: Position;
    readonly nativeEvent: DragEvent;
}

export interface WillShowOverlayEvent extends DroptargetEvent {
    readonly nativeEvent: DragEvent;
    readonly position: Position;
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

export type CanDisplayOverlay =
    | boolean
    | ((dragEvent: DragEvent, state: Position) => boolean);

export type MeasuredValue = { value: number; type: 'pixels' | 'percentage' };

export type DroptargetOverlayModel = {
    size?: MeasuredValue;
    activationSize?: MeasuredValue;
};

const DEFAULT_ACTIVATION_SIZE: MeasuredValue = {
    value: 20,
    type: 'percentage',
};

const DEFAULT_SIZE: MeasuredValue = {
    value: 50,
    type: 'percentage',
};

const SMALL_WIDTH_BOUNDARY = 100;
const SMALL_HEIGHT_BOUNDARY = 100;

export interface DroptargetOptions {
    canDisplayOverlay: CanDisplayOverlay;
    acceptedTargetZones: Position[];
    overlayModel?: DroptargetOverlayModel;
}

export class Droptarget extends CompositeDisposable {
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

    get state(): Position | undefined {
        return this._state;
    }

    constructor(
        private readonly element: HTMLElement,
        private readonly options: DroptargetOptions
    ) {
        super();

        // use a set to take advantage of #<set>.has
        this._acceptedTargetZonesSet = new Set(
            this.options.acceptedTargetZones
        );

        this.dnd = new DragAndDropObserver(this.element, {
            onDragEnter: () => undefined,
            onDragOver: (e) => {
                if (this._acceptedTargetZonesSet.size === 0) {
                    this.removeDropTarget();
                    return;
                }

                const width = this.element.clientWidth;
                const height = this.element.clientHeight;

                if (width === 0 || height === 0) {
                    return; // avoid div!0
                }

                const rect = (
                    e.currentTarget as HTMLElement
                ).getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

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

                const willShowOverlayEvent: WillShowOverlayEvent = {
                    nativeEvent: e,
                    position: quadrant,
                };

                /**
                 * Provide an opportunity to prevent the overlay appearing and in turn
                 * any dnd behaviours
                 */
                this._onWillShowOverlay.fire(willShowOverlayEvent);

                if (willShowOverlayEvent.nativeEvent.defaultPrevented) {
                    this.removeDropTarget();
                    return;
                }

                if (typeof this.options.canDisplayOverlay === 'boolean') {
                    if (!this.options.canDisplayOverlay) {
                        this.removeDropTarget();
                        return;
                    }
                } else if (!this.options.canDisplayOverlay(e, quadrant)) {
                    this.removeDropTarget();
                    return;
                }

                this.markAsUsed(e);

                if (!this.targetElement) {
                    this.targetElement = document.createElement('div');
                    this.targetElement.className = 'drop-target-dropzone';
                    this.overlayElement = document.createElement('div');
                    this.overlayElement.className = 'drop-target-selection';
                    this._state = 'center';
                    this.targetElement.appendChild(this.overlayElement);

                    this.element.classList.add('drop-target');
                    this.element.append(this.targetElement);
                }

                this.toggleClasses(quadrant, width, height);

                this._state = quadrant;
            },
            onDragLeave: () => {
                this.removeDropTarget();
            },
            onDragEnd: () => {
                this.removeDropTarget();
            },
            onDrop: (e) => {
                e.preventDefault();

                const state = this._state;

                this.removeDropTarget();

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
        if (!this.overlayElement) {
            return;
        }

        const isSmallX = width < SMALL_WIDTH_BOUNDARY;
        const isSmallY = height < SMALL_HEIGHT_BOUNDARY;

        const isLeft = quadrant === 'left';
        const isRight = quadrant === 'right';
        const isTop = quadrant === 'top';
        const isBottom = quadrant === 'bottom';

        const rightClass = !isSmallX && isRight;
        const leftClass = !isSmallX && isLeft;
        const topClass = !isSmallY && isTop;
        const bottomClass = !isSmallY && isBottom;

        let size = 1;

        const sizeOptions = this.options.overlayModel?.size ?? DEFAULT_SIZE;

        if (sizeOptions.type === 'percentage') {
            size = clamp(sizeOptions.value, 0, 100) / 100;
        } else {
            if (rightClass || leftClass) {
                size = clamp(0, sizeOptions.value, width) / width;
            }
            if (topClass || bottomClass) {
                size = clamp(0, sizeOptions.value, height) / height;
            }
        }

        const box = { top: '0px', left: '0px', width: '100%', height: '100%' };

        /**
         * You can also achieve the overlay placement using the transform CSS property
         * to translate and scale the element however this has the undesired effect of
         * 'skewing' the element. Comment left here for anybody that ever revisits this.
         *
         * @see https://developer.mozilla.org/en-US/docs/Web/CSS/transform
         *
         * right
         * translateX(${100 * (1 - size) / 2}%) scaleX(${scale})
         *
         * left
         * translateX(-${100 * (1 - size) / 2}%) scaleX(${scale})
         *
         * top
         * translateY(-${100 * (1 - size) / 2}%) scaleY(${scale})
         *
         * bottom
         * translateY(${100 * (1 - size) / 2}%) scaleY(${scale})
         */
        if (rightClass) {
            box.left = `${100 * (1 - size)}%`;
            box.width = `${100 * size}%`;
        } else if (leftClass) {
            box.width = `${100 * size}%`;
        } else if (topClass) {
            box.height = `${100 * size}%`;
        } else if (bottomClass) {
            box.top = `${100 * (1 - size)}%`;
            box.height = `${100 * size}%`;
        }

        this.overlayElement.style.top = box.top;
        this.overlayElement.style.left = box.left;
        this.overlayElement.style.width = box.width;
        this.overlayElement.style.height = box.height;

        toggleClass(
            this.overlayElement,
            'dv-drop-target-small-vertical',
            isSmallY
        );
        toggleClass(
            this.overlayElement,
            'dv-drop-target-small-horizontal',
            isSmallX
        );
        toggleClass(this.overlayElement, 'dv-drop-target-left', isLeft);
        toggleClass(this.overlayElement, 'dv-drop-target-right', isRight);
        toggleClass(this.overlayElement, 'dv-drop-target-top', isTop);
        toggleClass(this.overlayElement, 'dv-drop-target-bottom', isBottom);
        toggleClass(
            this.overlayElement,
            'dv-drop-target-center',
            quadrant === 'center'
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
            this.element.removeChild(this.targetElement);
            this.targetElement = undefined;
            this.overlayElement = undefined;
            this.element.classList.remove('drop-target');
        }
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
