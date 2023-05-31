import { toggleClass } from '../dom';
import { addDisposableListener, addDisposableWindowListener } from '../events';
import { CompositeDisposable, MutableDisposable } from '../lifecycle';
import { clamp } from '../math';

const bringElementToFront = (() => {
    let previous: HTMLElement | null = null;

    function pushToTop(element: HTMLElement) {
        if (previous !== element && previous !== null) {
            toggleClass(previous, 'dv-resize-container-priority', false);
        }

        toggleClass(element, 'dv-resize-container-priority', true);
        previous = element;
    }

    return pushToTop;
})();

export class Overlay extends CompositeDisposable {
    private _element: HTMLElement = document.createElement('div');

    constructor(
        private readonly options: {
            height: number;
            width: number;
            left: number;
            top: number;
            container: HTMLElement;
            content: HTMLElement;
            minX: number;
            minY: number;
        }
    ) {
        super();

        this.setupOverlay();
        // this.setupDrag(true,this._element);
        this.setupResize('top');
        this.setupResize('bottom');
        this.setupResize('left');
        this.setupResize('right');
        this.setupResize('topleft');
        this.setupResize('topright');
        this.setupResize('bottomleft');
        this.setupResize('bottomright');

        this._element.appendChild(this.options.content);
        this.options.container.appendChild(this._element);

        // this.renderWithinBoundaryConditions();
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
            addDisposableListener(resizeHandleElement, 'mousedown', (e) => {
                e.preventDefault();

                let offset: {
                    originalY: number;
                    originalHeight: number;
                    originalX: number;
                    originalWidth: number;
                } | null = null;

                move.value = new CompositeDisposable(
                    addDisposableWindowListener(window, 'mousemove', (e) => {
                        const rect =
                            this.options.container.getBoundingClientRect();
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
                                Math.max(
                                    0,
                                    offset!.originalY +
                                        offset!.originalHeight -
                                        MIN_HEIGHT
                                )
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
                                Math.max(
                                    0,
                                    rect.height -
                                        offset!.originalY +
                                        offset!.originalHeight
                                )
                            );
                        }

                        function moveLeft() {
                            left = clamp(
                                x,
                                0,
                                Math.max(
                                    0,
                                    offset!.originalX +
                                        offset!.originalWidth -
                                        MIN_WIDTH
                                )
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
                                Math.max(
                                    0,
                                    rect.width -
                                        offset!.originalX +
                                        offset!.originalWidth
                                )
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

    setupDrag(connect: boolean, dragTarget: HTMLElement): void {
        const move = new MutableDisposable();

        const track = () => {
            let offset: { x: number; y: number } | null = null;

            move.value = new CompositeDisposable(
                addDisposableWindowListener(window, 'mousemove', (e) => {
                    const containerRect =
                        this.options.container.getBoundingClientRect();
                    const x = e.clientX - containerRect.left;
                    const y = e.clientY - containerRect.top;

                    toggleClass(
                        this._element,
                        'dv-resize-container-dragging',
                        true
                    );

                    const overlayRect = this._element.getBoundingClientRect();
                    if (offset === null) {
                        offset = {
                            x: e.clientX - overlayRect.left,
                            y: e.clientY - overlayRect.top,
                        };
                    }

                    const xOffset = Math.max(
                        0,
                        overlayRect.width - this.options.minX
                    );
                    const yOffset = Math.max(
                        0,
                        overlayRect.height - this.options.minY
                    );

                    const left = clamp(
                        x - offset.x,
                        -xOffset,
                        Math.max(
                            0,
                            containerRect.width - overlayRect.width + xOffset
                        )
                    );

                    const top = clamp(
                        y - offset.y,
                        -yOffset,
                        Math.max(
                            0,
                            containerRect.height - overlayRect.height + yOffset
                        )
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
        };

        this.addDisposables(
            move,
            addDisposableListener(dragTarget, 'mousedown', (_) => {
                if (_.defaultPrevented) {
                    return;
                }

                track();
            }),
            addDisposableListener(this.options.content, 'mousedown', (_) => {
                if (_.shiftKey) {
                    track();
                }
            }),
            addDisposableListener(
                this.options.content,
                'mousedown',
                () => {
                    bringElementToFront(this._element);
                },
                true
            )
        );

        if (connect) {
            track();
        }
    }

    renderWithinBoundaryConditions(): void {
        const rect = this.options.container.getBoundingClientRect();
        const rect2 = this._element.getBoundingClientRect();

        const left = clamp(
            Math.max(this.options.left, 0),
            0,
            Math.max(0, rect.width - rect2.width)
        );

        const top = clamp(
            Math.max(this.options.top, 0),
            0,
            Math.max(0, rect.height - rect2.height)
        );

        console.log(new Error().stack);

        this._element.style.left = `${left}px`;
        this._element.style.top = `${top}px`;
    }

    override dispose(): void {
        this._element.remove();
        super.dispose();
    }
}
