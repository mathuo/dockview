import { quasiDefaultPrevented, toggleClass } from '../dom';
import {
    Emitter,
    Event,
    addDisposableListener,
    addDisposableWindowListener,
} from '../events';
import { CompositeDisposable, MutableDisposable } from '../lifecycle';
import { clamp } from '../math';

const bringElementToFront = (() => {
    let previous: HTMLElement | null = null;

    function pushToTop(element: HTMLElement) {
        if (previous !== element && previous !== null) {
            toggleClass(previous, 'dv-bring-to-front', false);
        }

        toggleClass(element, 'dv-bring-to-front', true);
        previous = element;
    }

    return pushToTop;
})();

export class Overlay extends CompositeDisposable {
    private _element: HTMLElement = document.createElement('div');

    private readonly _onDidChange = new Emitter<void>();
    readonly onDidChange: Event<void> = this._onDidChange.event;

    private static MINIMUM_HEIGHT = 20;
    private static MINIMUM_WIDTH = 20;

    constructor(
        private readonly options: {
            height: number;
            width: number;
            left: number;
            top: number;
            container: HTMLElement;
            content: HTMLElement;
            minimumInViewportWidth: number;
            minimumInViewportHeight: number;
        }
    ) {
        super();

        this.addDisposables(this._onDidChange);

        this.setupOverlay();
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

        // if input bad resize within acceptable boundaries
        this.renderWithinBoundaryConditions();
    }

    setBounds(
        bounds: Partial<{
            height: number;
            width: number;
            top: number;
            left: number;
        }>
    ): void {
        if (typeof bounds.height === 'number') {
            this._element.style.height = `${bounds.height}px`;
        }
        if (typeof bounds.width === 'number') {
            this._element.style.width = `${bounds.width}px`;
        }
        if (typeof bounds.top === 'number') {
            this._element.style.top = `${bounds.top}px`;
        }
        if (typeof bounds.left === 'number') {
            this._element.style.left = `${bounds.left}px`;
        }

        this.renderWithinBoundaryConditions();
    }

    toJSON(): { top: number; left: number; height: number; width: number } {
        const container = this.options.container.getBoundingClientRect();
        const element = this._element.getBoundingClientRect();

        return {
            top: element.top - container.top,
            left: element.left - container.left,
            width: element.width,
            height: element.height,
        };
    }

    renderWithinBoundaryConditions(): void {
        const containerRect = this.options.container.getBoundingClientRect();
        const overlayRect = this._element.getBoundingClientRect();

        // a minimum width of minimumViewportWidth must be inside the viewport
        const xOffset = Math.max(
            0,
            overlayRect.width - this.options.minimumInViewportWidth
        );

        // a minimum height of minimumViewportHeight must be inside the viewport
        const yOffset = Math.max(
            0,
            overlayRect.height - this.options.minimumInViewportHeight
        );

        const left = clamp(
            overlayRect.left - containerRect.left,
            -xOffset,
            Math.max(0, containerRect.width - overlayRect.width + xOffset)
        );

        const top = clamp(
            overlayRect.top - containerRect.top,
            -yOffset,
            Math.max(0, containerRect.height - overlayRect.height + yOffset)
        );

        this._element.style.left = `${left}px`;
        this._element.style.top = `${top}px`;
    }

    setupDrag(
        dragTarget: HTMLElement,
        options: { inDragMode: boolean } = { inDragMode: false }
    ): void {
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
                        overlayRect.width - this.options.minimumInViewportWidth
                    );
                    const yOffset = Math.max(
                        0,
                        overlayRect.height -
                            this.options.minimumInViewportHeight
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
                    this._onDidChange.fire();
                })
            );
        };

        this.addDisposables(
            move,
            addDisposableListener(dragTarget, 'mousedown', (event) => {
                if (event.defaultPrevented) {
                    event.preventDefault();
                    return;
                }

                // if somebody has marked this event then treat as a defaultPrevented
                // without actually calling event.preventDefault()
                if (quasiDefaultPrevented(event)) {
                    return;
                }

                track();
            }),
            addDisposableListener(
                this.options.content,
                'mousedown',
                (event) => {
                    if (event.defaultPrevented) {
                        return;
                    }

                    // if somebody has marked this event then treat as a defaultPrevented
                    // without actually calling event.preventDefault()
                    if (quasiDefaultPrevented(event)) {
                        return;
                    }

                    if (event.shiftKey) {
                        track();
                    }
                }
            ),
            addDisposableListener(
                this.options.content,
                'mousedown',
                () => {
                    bringElementToFront(this._element);
                },
                true
            )
        );

        bringElementToFront(this._element);

        if (options.inDragMode) {
            track();
        }
    }

    private setupOverlay(): void {
        this._element.style.height = `${this.options.height}px`;
        this._element.style.width = `${this.options.width}px`;
        this._element.style.left = `${this.options.left}px`;
        this._element.style.top = `${this.options.top}px`;

        this._element.className = 'dv-resize-container';
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

                let startPosition: {
                    originalY: number;
                    originalHeight: number;
                    originalX: number;
                    originalWidth: number;
                } | null = null;

                move.value = new CompositeDisposable(
                    addDisposableWindowListener(window, 'mousemove', (e) => {
                        const containerRect =
                            this.options.container.getBoundingClientRect();
                        const overlayRect =
                            this._element.getBoundingClientRect();

                        const y = e.clientY - containerRect.top;
                        const x = e.clientX - containerRect.left;

                        if (startPosition === null) {
                            // record the initial dimensions since as all subsequence moves are relative to this
                            startPosition = {
                                originalY: y,
                                originalHeight: overlayRect.height,
                                originalX: x,
                                originalWidth: overlayRect.width,
                            };
                        }

                        let top: number | null = null;
                        let height: number | null = null;
                        let left: number | null = null;
                        let width: number | null = null;

                        function moveTop() {
                            top = clamp(
                                y,
                                0,
                                Math.max(
                                    0,
                                    startPosition!.originalY +
                                        startPosition!.originalHeight -
                                        Overlay.MINIMUM_HEIGHT
                                )
                            );
                            height =
                                startPosition!.originalY +
                                startPosition!.originalHeight -
                                top;
                        }

                        function moveBottom() {
                            top =
                                startPosition!.originalY -
                                startPosition!.originalHeight;

                            height = clamp(
                                y - top,
                                Overlay.MINIMUM_HEIGHT,
                                Math.max(
                                    0,
                                    containerRect.height -
                                        startPosition!.originalY +
                                        startPosition!.originalHeight
                                )
                            );
                        }

                        function moveLeft() {
                            left = clamp(
                                x,
                                0,
                                Math.max(
                                    0,
                                    startPosition!.originalX +
                                        startPosition!.originalWidth -
                                        Overlay.MINIMUM_WIDTH
                                )
                            );
                            width =
                                startPosition!.originalX +
                                startPosition!.originalWidth -
                                left;
                        }

                        function moveRight() {
                            left =
                                startPosition!.originalX -
                                startPosition!.originalWidth;
                            width = clamp(
                                x - left,
                                Overlay.MINIMUM_WIDTH,
                                Math.max(
                                    0,
                                    containerRect.width -
                                        startPosition!.originalX +
                                        startPosition!.originalWidth
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
                        this._onDidChange.fire();
                    })
                );
            })
        );
    }

    override dispose(): void {
        this._element.remove();
        super.dispose();
    }
}
