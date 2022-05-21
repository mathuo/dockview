import { toggleClass } from '../dom';
import { Emitter, Event } from '../events';
import { CompositeDisposable } from '../lifecycle';
import { DragAndDropObserver } from './dnd';

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

export type DropTargetDirections = 'vertical' | 'horizontal' | 'all' | 'none';

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

    set validOverlays(value: DropTargetDirections) {
        this.options.validOverlays = value;
    }

    set canDisplayOverlay(value: CanDisplayOverlay) {
        this.options.canDisplayOverlay = value;
    }

    constructor(
        private readonly element: HTMLElement,
        private readonly options: {
            canDisplayOverlay: CanDisplayOverlay;
            validOverlays: DropTargetDirections;
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

                    const x = e.offsetX;
                    const y = e.offsetY;
                    const xp = (100 * x) / width;
                    const yp = (100 * y) / height;

                    const quadrant = this.calculateQuadrant(
                        this.options.validOverlays,
                        xp,
                        yp
                    );

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

                    if (this.options.validOverlays === 'none') {
                        return;
                    }

                    if (!this.target || !this.overlay) {
                        return;
                    }

                    const isSmallX = width < 100;
                    const isSmallY = height < 100;

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

        toggleClass(this.overlay, 'right', !isSmallX && isRight);
        toggleClass(this.overlay, 'left', !isSmallX && isLeft);
        toggleClass(this.overlay, 'top', !isSmallY && isTop);
        toggleClass(this.overlay, 'bottom', !isSmallY && isBottom);

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
        overlayType: DropTargetDirections,
        xp: number,
        yp: number
    ): Quadrant | null {
        switch (overlayType) {
            case 'all':
                if (xp < 20) {
                    return 'left';
                }
                if (xp > 80) {
                    return 'right';
                }
                if (yp < 20) {
                    return 'top';
                }
                if (yp > 80) {
                    return 'bottom';
                }
                break;
            case 'vertical':
                if (yp < 50) {
                    return 'top';
                }
                return 'bottom';

            case 'horizontal':
                if (xp < 50) {
                    return 'left';
                }
                return 'right';
        }

        return null;
    }

    private removeDropTarget() {
        if (this.target) {
            this._state = undefined;
            this.element.removeChild(this.target);
            this.target = undefined;
            this.element.classList.remove('drop-target');
        }
    }
}
