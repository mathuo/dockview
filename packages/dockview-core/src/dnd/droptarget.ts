import { toggleClass } from '../dom';
import { Emitter, Event } from '../events';
import { CompositeDisposable } from '../lifecycle';
import { DragAndDropObserver } from './dnd';
import { clamp } from '../math';
import { Direction } from '../gridview/baseComponentGridview';

function numberOrFallback(maybeNumber: any, fallback: number): number {
    return typeof maybeNumber === 'number' ? maybeNumber : fallback;
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

export interface DroptargetEvent {
    readonly position: Position;
    readonly nativeEvent: DragEvent;
}

export type Position = 'top' | 'bottom' | 'left' | 'right' | 'center';

export type CanDisplayOverlay =
    | boolean
    | ((dragEvent: DragEvent, state: Position) => boolean);

const eventMarkTag = 'dv_droptarget_marked';

function markEvent(event: DragEvent): void {
    (event as any)[eventMarkTag] = true;
}

function isEventMarked(event: DragEvent) {
    const value = (event as any)[eventMarkTag];
    return typeof value === 'boolean' && value;
}

export class Droptarget extends CompositeDisposable {
    private targetElement: HTMLElement | undefined;
    private overlayElement: HTMLElement | undefined;
    private _state: Position | undefined;
    private _acceptedTargetZonesSet: Set<Position>;

    private readonly _onDrop = new Emitter<DroptargetEvent>();
    readonly onDrop: Event<DroptargetEvent> = this._onDrop.event;

    get state(): Position | undefined {
        return this._state;
    }

    constructor(
        private readonly element: HTMLElement,
        private readonly options: {
            canDisplayOverlay: CanDisplayOverlay;
            acceptedTargetZones: Position[];
            overlayModel?: {
                size?: { value: number; type: 'pixels' | 'percentage' };
                activationSize?: {
                    value: number;
                    type: 'pixels' | 'percentage';
                };
            };
        }
    ) {
        super();

        // use a set to take advantage of #<set>.has
        this._acceptedTargetZonesSet = new Set(
            this.options.acceptedTargetZones
        );

        this.addDisposables(
            this._onDrop,
            new DragAndDropObserver(this.element, {
                onDragEnter: () => undefined,
                onDragOver: (e) => {
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

                    if (isEventMarked(e) || quadrant === null) {
                        // no drop target should be displayed
                        this.removeDropTarget();
                        return;
                    }

                    if (typeof this.options.canDisplayOverlay === 'boolean') {
                        if (!this.options.canDisplayOverlay) {
                            return;
                        }
                    } else if (!this.options.canDisplayOverlay(e, quadrant)) {
                        return;
                    }

                    markEvent(e);

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

                    if (this.options.acceptedTargetZones.length === 0) {
                        return;
                    }

                    if (!this.targetElement || !this.overlayElement) {
                        return;
                    }

                    this.toggleClasses(quadrant, width, height);

                    this.setState(quadrant);
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
            })
        );
    }

    setTargetZones(acceptedTargetZones: Position[]): void {
        this._acceptedTargetZonesSet = new Set(acceptedTargetZones);
    }

    public dispose(): void {
        this.removeDropTarget();
        super.dispose();
    }

    private toggleClasses(
        quadrant: Position,
        width: number,
        height: number
    ): void {
        if (!this.overlayElement) {
            return;
        }

        const isSmallX = width < 100;
        const isSmallY = height < 100;

        const isLeft = quadrant === 'left';
        const isRight = quadrant === 'right';
        const isTop = quadrant === 'top';
        const isBottom = quadrant === 'bottom';

        const rightClass = !isSmallX && isRight;
        const leftClass = !isSmallX && isLeft;
        const topClass = !isSmallY && isTop;
        const bottomClass = !isSmallY && isBottom;

        let size = 0.5;

        if (this.options.overlayModel?.size?.type === 'percentage') {
            size = clamp(this.options.overlayModel.size.value, 0, 100) / 100;
        }

        if (this.options.overlayModel?.size?.type === 'pixels') {
            if (rightClass || leftClass) {
                size =
                    clamp(0, this.options.overlayModel.size.value, width) /
                    width;
            }
            if (topClass || bottomClass) {
                size =
                    clamp(0, this.options.overlayModel.size.value, height) /
                    height;
            }
        }

        const translate = (1 - size) / 2;
        const scale = size;

        let transform: string;

        if (rightClass) {
            transform = `translateX(${100 * translate}%) scaleX(${scale})`;
        } else if (leftClass) {
            transform = `translateX(-${100 * translate}%) scaleX(${scale})`;
        } else if (topClass) {
            transform = `translateY(-${100 * translate}%) scaleY(${scale})`;
        } else if (bottomClass) {
            transform = `translateY(${100 * translate}%) scaleY(${scale})`;
        } else {
            transform = '';
        }

        this.overlayElement.style.transform = transform;

        toggleClass(this.overlayElement, 'small-right', isSmallX && isRight);
        toggleClass(this.overlayElement, 'small-left', isSmallX && isLeft);
        toggleClass(this.overlayElement, 'small-top', isSmallY && isTop);
        toggleClass(this.overlayElement, 'small-bottom', isSmallY && isBottom);
    }

    private setState(quadrant: Position): void {
        switch (quadrant) {
            case 'top':
                this._state = 'top';
                break;
            case 'left':
                this._state = 'left';
                break;
            case 'bottom':
                this._state = 'bottom';
                break;
            case 'right':
                this._state = 'right';
                break;
            case 'center':
                this._state = 'center';
                break;
        }
    }

    private calculateQuadrant(
        overlayType: Set<Position>,
        x: number,
        y: number,
        width: number,
        height: number
    ): Position | null {
        const isPercentage =
            this.options.overlayModel?.activationSize === undefined ||
            this.options.overlayModel?.activationSize?.type === 'percentage';

        const value = numberOrFallback(
            this.options?.overlayModel?.activationSize?.value,
            20
        );

        if (isPercentage) {
            return calculateQuadrantAsPercentage(
                overlayType,
                x,
                y,
                width,
                height,
                value
            );
        }

        return calculateQuadrantAsPixels(
            overlayType,
            x,
            y,
            width,
            height,
            value
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
