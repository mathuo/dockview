import { toggleClass } from '../dom';
import { addDisposableListener, addDisposableWindowListener } from '../events';
import { CompositeDisposable, MutableDisposable } from '../lifecycle';
import { clamp } from '../math';

export class Overlay extends CompositeDisposable {
    private _element: HTMLElement = document.createElement('div');

    constructor(
        private readonly container: HTMLElement,
        private readonly content: HTMLElement,
        private readonly options: {
            height: number;
            width: number;
            left: number;
            top: number;
        }
    ) {
        super();

        this.setupOverlay();
        this.setupDrag();
        this.setupResize('top');
        this.setupResize('bottom');
        this.setupResize('left');
        this.setupResize('right');
        this.setupResize('topleft');
        this.setupResize('topright');
        this.setupResize('bottomleft');
        this.setupResize('bottomright');

        this._element.appendChild(content);
        this.container.appendChild(this._element);
    }

    private setupResize(
        direction:
            | 'top'
            | 'bottom'
            | 'left'
            | 'right'
            | 'topleft'
            | 'topright'
            | 'bottomleft'
            | 'bottomright'
    ): void {
        const resizeHandleElement = document.createElement('div');
        resizeHandleElement.className = `dv-resize-handle-${direction}`;
        this._element.appendChild(resizeHandleElement);

        const move = new MutableDisposable();

        this.addDisposables(
            move,
            addDisposableListener(resizeHandleElement, 'mousedown', (_) => {
                _.preventDefault();

                let offset: {
                    originalY: number;
                    originalHeight: number;
                    originalX: number;
                    originalWidth: number;
                } | null = null;

                move.value = new CompositeDisposable(
                    addDisposableWindowListener(window, 'mousemove', (e) => {
                        const rect = this.container.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const x = e.clientX - rect.left;

                        const rect2 = this._element.getBoundingClientRect();

                        if (offset === null) {
                            offset = {
                                originalY: y,
                                originalHeight: rect2.height,
                                originalX: x,
                                originalWidth: rect2.width,
                            };
                        }

                        let top: number | null = null;
                        let height: number | null = null;
                        let left: number | null = null;
                        let width: number | null = null;

                        const MIN_HEIGHT = 20;
                        const MIN_WIDTH = 20;

                        function moveTop() {
                            top = clamp(
                                y,
                                0,
                                offset!.originalY +
                                    offset!.originalHeight -
                                    MIN_HEIGHT
                            );
                            height =
                                offset!.originalY +
                                offset!.originalHeight -
                                top;
                        }

                        function moveBottom() {
                            top = offset!.originalY - offset!.originalHeight;

                            height = clamp(
                                y - top,
                                MIN_HEIGHT,
                                rect.height -
                                    offset!.originalY +
                                    offset!.originalHeight
                            );
                        }

                        function moveLeft() {
                            left = clamp(
                                x,
                                0,
                                offset!.originalX +
                                    offset!.originalWidth -
                                    MIN_WIDTH
                            );
                            width =
                                offset!.originalX +
                                offset!.originalWidth -
                                left;
                        }

                        function moveRight() {
                            left = offset!.originalX - offset!.originalWidth;
                            width = clamp(
                                x - left,
                                MIN_WIDTH,
                                rect.width -
                                    offset!.originalX +
                                    offset!.originalWidth
                            );
                        }

                        switch (direction) {
                            case 'top':
                                moveTop();
                                break;
                            case 'bottom':
                                moveBottom();
                                break;
                            case 'left':
                                moveLeft();
                                break;
                            case 'right':
                                moveRight();
                                break;
                            case 'topleft':
                                moveTop();
                                moveLeft();
                                break;
                            case 'topright':
                                moveTop();
                                moveRight();
                                break;
                            case 'bottomleft':
                                moveBottom();
                                moveLeft();
                                break;
                            case 'bottomright':
                                moveBottom();
                                moveRight();
                                break;
                        }

                        if (height !== null) {
                            this._element.style.height = `${height}px`;
                        }
                        if (top !== null) {
                            this._element.style.top = `${top}px`;
                        }
                        if (left !== null) {
                            this._element.style.left = `${left}px`;
                        }
                        if (width !== null) {
                            this._element.style.width = `${width}px`;
                        }
                    }),
                    addDisposableWindowListener(window, 'mouseup', () => {
                        move.dispose();
                    })
                );
            })
        );
    }

    private setupOverlay(): void {
        this._element.style.height = `${this.options.height}px`;
        this._element.style.width = `${this.options.width}px`;
        this._element.style.left = `${this.options.left}px`;
        this._element.style.top = `${this.options.top}px`;
        //
        this._element.className = 'dv-resize-container';
    }

    private setupDrag(): void {
        const move = new MutableDisposable();

        this.addDisposables(
            move,
            addDisposableListener(this._element, 'mousedown', (_) => {
                if (_.defaultPrevented) {
                    return;
                }

                let offset: { x: number; y: number } | null = null;

                move.value = new CompositeDisposable(
                    addDisposableWindowListener(window, 'mousemove', (e) => {
                        const rect = this.container.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;

                        toggleClass(
                            this._element,
                            'dv-resize-container-dragging',
                            true
                        );

                        const rect2 = this._element.getBoundingClientRect();
                        if (offset === null) {
                            offset = {
                                x: e.clientX - rect2.left,
                                y: e.clientY - rect2.top,
                            };
                        }

                        const left = clamp(
                            Math.max(0, x - offset.x),
                            0,
                            rect.width - rect2.width
                        );

                        const top = clamp(
                            Math.max(0, y - offset.y),
                            0,
                            rect.height - rect2.height
                        );

                        this._element.style.left = `${left}px`;
                        this._element.style.top = `${top}px`;
                    }),
                    addDisposableWindowListener(window, 'mouseup', () => {
                        toggleClass(
                            this._element,
                            'dv-resize-container-dragging',
                            false
                        );

                        move.dispose();
                    })
                );
            })
        );
    }

    dispose(): void {
        this._element.remove();
    }
}
