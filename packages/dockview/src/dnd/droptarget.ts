import { toggleClass } from '../dom';
import { Emitter, Event } from '../events';
import { CompositeDisposable } from '../lifecycle';
import { DragAndDropObserver } from './dnd';
import { clamp } from '../math';

export enum Position {
    Top = 'Top',
    Left = 'Left',
    Bottom = 'Bottom',
    Right = 'Right',
    Center = 'Center',
}

export type Quadrant = 'top' | 'bottom' | 'left' | 'right';

export interface DroptargetEvent {
    position: Position;
    nativeEvent: DragEvent;
}

export type DropTargetDirections =
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'center';

function isBooleanValue(
    canDisplayOverlay: CanDisplayOverlay
): canDisplayOverlay is boolean {
    return typeof canDisplayOverlay === 'boolean';
}

export type CanDisplayOverlay =
    | boolean
    | ((dragEvent: DragEvent, state: Quadrant | null) => boolean);

export class Droptarget extends CompositeDisposable {
    private target: HTMLElement | undefined;
    private overlay: HTMLElement | undefined;
    private _state: Position | undefined;

    private readonly _onDrop = new Emitter<DroptargetEvent>();
    readonly onDrop: Event<DroptargetEvent> = this._onDrop.event;

    get state() {
        return this._state;
    }

    constructor(
        private readonly element: HTMLElement,
        private readonly options: {
            canDisplayOverlay: CanDisplayOverlay;
            acceptedTargetZones: DropTargetDirections[];
            overlayModel?: {
                units?: 'pixels' | 'percentage';
                type?: 'modal' | 'line';
                cover?: number;
                directionalThreshold?: number;
            };
        }
    ) {
        super();

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
                        this.options.acceptedTargetZones,
                        x,
                        y,
                        width,
                        height
                    );

                    if (quadrant === undefined) {
                        this.removeDropTarget();
                        return;
                    }

                    if (isBooleanValue(this.options.canDisplayOverlay)) {
                        if (!this.options.canDisplayOverlay) {
                            return;
                        }
                    } else if (!this.options.canDisplayOverlay(e, quadrant)) {
                        return;
                    }

                    if (!this.target) {
                        this.target = document.createElement('div');
                        this.target.className = 'drop-target-dropzone';
                        this.overlay = document.createElement('div');
                        this.overlay.className = 'drop-target-selection';
                        this._state = Position.Center;
                        this.target.appendChild(this.overlay);

                        this.element.classList.add('drop-target');
                        this.element.append(this.target);
                    }

                    if (this.options.acceptedTargetZones.length === 0) {
                        return;
                    }

                    if (!this.target || !this.overlay) {
                        return;
                    }

                    const isSmallX =
                        this.options.overlayModel?.type === 'line' ||
                        width < 100;
                    const isSmallY =
                        this.options.overlayModel?.type === 'line' ||
                        height < 100;

                    this.toggleClasses(quadrant, isSmallX, isSmallY);

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
                    e.stopPropagation();

                    const state = this._state;

                    this.removeDropTarget();

                    if (state) {
                        this._onDrop.fire({ position: state, nativeEvent: e });
                    }
                },
            })
        );
    }

    public dispose() {
        this.removeDropTarget();
    }

    private toggleClasses(
        quadrant: Quadrant | null,
        isSmallX: boolean,
        isSmallY: boolean
    ) {
        if (!this.overlay) {
            return;
        }

        const isLeft = quadrant === 'left';
        const isRight = quadrant === 'right';
        const isTop = quadrant === 'top';
        const isBottom = quadrant === 'bottom';

        const size =
            typeof this.options.overlayModel?.cover === 'number'
                ? clamp(this.options.overlayModel?.cover, 0, 1)
                : 0.5;

        const translate = (1 - size) / 2;
        const scale = size;

        let transform = '';

        const rightClass = !isSmallX && isRight;
        const leftClass = !isSmallX && isLeft;
        const topClass = !isSmallY && isTop;
        const bottomClass = !isSmallY && isBottom;

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

        this.overlay.style.transform = transform;

        // toggleClass(this.overlay, 'right', !isSmallX && isRight);
        // toggleClass(this.overlay, 'left', !isSmallX && isLeft);
        // toggleClass(this.overlay, 'top', !isSmallY && isTop);
        // toggleClass(this.overlay, 'bottom', !isSmallY && isBottom);

        toggleClass(this.overlay, 'small-right', isSmallX && isRight);
        toggleClass(this.overlay, 'small-left', isSmallX && isLeft);
        toggleClass(this.overlay, 'small-top', isSmallY && isTop);
        toggleClass(this.overlay, 'small-bottom', isSmallY && isBottom);
    }

    private setState(quadrant: Quadrant | null) {
        switch (quadrant) {
            case 'top':
                this._state = Position.Top;
                break;
            case 'left':
                this._state = Position.Left;
                break;
            case 'bottom':
                this._state = Position.Bottom;
                break;
            case 'right':
                this._state = Position.Right;
                break;
            default:
                this._state = Position.Center;
                break;
        }
    }

    private calculateQuadrant(
        overlayType: DropTargetDirections[],
        x: number,
        y: number,
        width: number,
        height: number
    ): Quadrant | null | undefined {
        if (
            !this.options.overlayModel?.units ||
            this.options.overlayModel?.units === 'percentage'
        ) {
            return calculateQuadrant_Percentage(
                overlayType,
                x,
                y,
                width,
                height,
                typeof this.options.overlayModel?.directionalThreshold ===
                    'number'
                    ? this.options.overlayModel?.directionalThreshold
                    : 20
            );
        }

        return calculateQuadrant_Pixels(
            overlayType,
            x,
            y,
            width,
            height,
            typeof this.options.overlayModel?.directionalThreshold === 'number'
                ? this.options.overlayModel?.directionalThreshold
                : 20
        );
    }

    private removeDropTarget() {
        console.log('remove');
        if (this.target) {
            this._state = undefined;
            this.element.removeChild(this.target);
            this.target = undefined;
            this.overlay = undefined;
            this.element.classList.remove('drop-target');
        }
    }
}

function calculateQuadrant_Percentage(
    overlayType: DropTargetDirections[],
    x: number,
    y: number,
    width: number,
    height: number,
    threshold: number
): Quadrant | null | undefined {
    const xp = (100 * x) / width;
    const yp = (100 * y) / height;

    if (overlayType.includes('left') && xp < threshold) {
        return 'left';
    }
    if (overlayType.includes('right') && xp > 100 - threshold) {
        return 'right';
    }
    if (overlayType.includes('top') && yp < threshold) {
        return 'top';
    }
    if (overlayType.includes('bottom') && yp > 100 - threshold) {
        return 'bottom';
    }

    // switch (overlayType) {
    //     case 'all':
    //     case 'nocenter':
    //         if (xp < threshold) {
    //             return 'left';
    //         }
    //         if (xp > 100 - threshold) {
    //             return 'right';
    //         }
    //         if (yp < threshold) {
    //             return 'top';
    //         }
    //         if (yp > 100 - threshold) {
    //             return 'bottom';
    //         }

    //         break;
    //     case 'vertical':
    //         if (yp < 50) {
    //             return 'top';
    //         }
    //         return 'bottom';

    //     case 'horizontal':
    //         if (xp < 50) {
    //             return 'left';
    //         }
    //         return 'right';
    // }

    if (!overlayType.includes('center')) {
        return undefined;
    }

    return null;
}

function calculateQuadrant_Pixels(
    overlayType: DropTargetDirections[],
    x: number,
    y: number,
    width: number,
    height: number,
    threshold: number
): Quadrant | null | undefined {
    if (overlayType.includes('left') && x < threshold) {
        return 'left';
    }
    if (overlayType.includes('right') && x > width - threshold) {
        return 'right';
    }
    if (overlayType.includes('top') && y < threshold) {
        return 'top';
    }
    if (overlayType.includes('right') && y > height - threshold) {
        return 'bottom';
    }

    // switch (overlayType) {
    //     case 'all':
    //     case 'nocenter':
    //         if (x < threshold) {
    //             return 'left';
    //         }
    //         if (x > width - threshold) {
    //             return 'right';
    //         }
    //         if (y < threshold) {
    //             return 'top';
    //         }
    //         if (y > height - threshold) {
    //             return 'bottom';
    //         }

    //         break;
    //     case 'vertical':
    //         if (x < width / 2) {
    //             return 'top';
    //         }
    //         return 'bottom';
    //     case 'horizontal':
    //         if (y < height / 2) {
    //             return 'left';
    //         }
    //         return 'right';
    // }

    if (!overlayType.includes('center')) {
        return undefined;
    }

    return null;
}
