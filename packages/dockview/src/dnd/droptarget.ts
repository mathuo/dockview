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

export type CanDisplayOverlay = boolean | ((dragEvent: DragEvent) => boolean);

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
                onDragEnter: (e) => undefined,
                onDragOver: (e) => {
                    if (isBooleanValue(this.options.canDisplayOverlay)) {
                        if (!this.options.canDisplayOverlay) {
                            return;
                        }
                    } else if (!this.options.canDisplayOverlay(e)) {
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

                    const width = this.target.clientWidth;
                    const height = this.target.clientHeight;

                    if (width === 0 || height === 0) {
                        return; // avoid div!0
                    }

                    const x = e.offsetX;
                    const y = e.offsetY;
                    const xp = (100 * x) / width;
                    const yp = (100 * y) / height;

                    let isRight = false;
                    let isLeft = false;
                    let isTop = false;
                    let isBottom = false;

                    switch (this.options.validOverlays) {
                        case 'all':
                            isRight = xp > 80;
                            isLeft = xp < 20;
                            isTop = !isRight && !isLeft && yp < 20;
                            isBottom = !isRight && !isLeft && yp > 80;
                            break;
                        case 'vertical':
                            isTop = yp < 50;
                            isBottom = yp >= 50;
                            break;
                        case 'horizontal':
                            isLeft = xp < 50;
                            isRight = xp >= 50;
                            break;
                    }

                    const isSmallX = width < 100;
                    const isSmallY = height < 100;

                    toggleClass(this.overlay, 'right', !isSmallX && isRight);
                    toggleClass(this.overlay, 'left', !isSmallX && isLeft);
                    toggleClass(this.overlay, 'top', !isSmallY && isTop);
                    toggleClass(this.overlay, 'bottom', !isSmallY && isBottom);

                    toggleClass(
                        this.overlay,
                        'small-right',
                        isSmallX && isRight
                    );
                    toggleClass(this.overlay, 'small-left', isSmallX && isLeft);
                    toggleClass(this.overlay, 'small-top', isSmallY && isTop);
                    toggleClass(
                        this.overlay,
                        'small-bottom',
                        isSmallY && isBottom
                    );

                    if (isRight) {
                        this._state = Position.Right;
                    } else if (isLeft) {
                        this._state = Position.Left;
                    } else if (isTop) {
                        this._state = Position.Top;
                    } else if (isBottom) {
                        this._state = Position.Bottom;
                    } else {
                        this._state = Position.Center;
                    }
                },
                onDragLeave: (e) => {
                    this.removeDropTarget();
                },
                onDragEnd: (e) => {
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

    private removeDropTarget() {
        if (this.target) {
            this._state = undefined;
            this.element.removeChild(this.target);
            this.target = undefined;
            this.element.classList.remove('drop-target');
        }
    }
}
