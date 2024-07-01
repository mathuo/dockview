import {
    getElementsByTagName,
    quasiDefaultPrevented,
    toggleClass,
} from '../dom';
import {
    Emitter,
    Event,
    addDisposableListener,
    addDisposableWindowListener,
} from '../events';
import { CompositeDisposable, MutableDisposable } from '../lifecycle';
import { clamp } from '../math';
import { AnchoredBox } from '../types';

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

    private readonly _onDidChangeEnd = new Emitter<void>();
    readonly onDidChangeEnd: Event<void> = this._onDidChangeEnd.event;

    private static MINIMUM_HEIGHT = 20;
    private static MINIMUM_WIDTH = 20;

    private verticalAlignment: 'top' | 'bottom' | undefined;
    private horiziontalAlignment: 'left' | 'right' | undefined;

    set minimumInViewportWidth(value: number | undefined) {
        this.options.minimumInViewportWidth = value;
    }

    set minimumInViewportHeight(value: number | undefined) {
        this.options.minimumInViewportHeight = value;
    }

    constructor(
        private readonly options: AnchoredBox & {
            container: HTMLElement;
            content: HTMLElement;
            minimumInViewportWidth?: number;
            minimumInViewportHeight?: number;
        }
    ) {
        super();

        this.addDisposables(this._onDidChange, this._onDidChangeEnd);

        this._element.className = 'dv-resize-container';

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
        this.setBounds({
            height: this.options.height,
            width: this.options.width,
            ...('top' in this.options && { top: this.options.top }),
            ...('bottom' in this.options && { bottom: this.options.bottom }),
            ...('left' in this.options && { left: this.options.left }),
            ...('right' in this.options && { right: this.options.right }),
        });
    }

    setBounds(bounds: Partial<AnchoredBox> = {}): void {
        if (typeof bounds.height === 'number') {
            this._element.style.height = `${bounds.height}px`;
        }
        if (typeof bounds.width === 'number') {
            this._element.style.width = `${bounds.width}px`;
        }
        if ('top' in bounds && typeof bounds.top === 'number') {
            this._element.style.top = `${bounds.top}px`;
            this._element.style.bottom = 'auto';
            this.verticalAlignment = 'top';
        }
        if ('bottom' in bounds && typeof bounds.bottom === 'number') {
            this._element.style.bottom = `${bounds.bottom}px`;
            this._element.style.top = 'auto';
            this.verticalAlignment = 'bottom';
        }
        if ('left' in bounds && typeof bounds.left === 'number') {
            this._element.style.left = `${bounds.left}px`;
            this._element.style.right = 'auto';
            this.horiziontalAlignment = 'left';
        }
        if ('right' in bounds && typeof bounds.right === 'number') {
            this._element.style.right = `${bounds.right}px`;
            this._element.style.left = 'auto';
            this.horiziontalAlignment = 'right';
        }

        const containerRect = this.options.container.getBoundingClientRect();
        const overlayRect = this._element.getBoundingClientRect();

        // region: ensure bounds within allowable limits

        // a minimum width of minimumViewportWidth must be inside the viewport
        const xOffset = Math.max(0, this.getMinimumWidth(overlayRect.width));

        // a minimum height of minimumViewportHeight must be inside the viewport
        const yOffset = Math.max(0, this.getMinimumHeight(overlayRect.height));

        if (this.verticalAlignment === 'top') {
            const top = clamp(
                overlayRect.top - containerRect.top,
                -yOffset,
                Math.max(0, containerRect.height - overlayRect.height + yOffset)
            );
            this._element.style.top = `${top}px`;
            this._element.style.bottom = 'auto';
        }

        if (this.verticalAlignment === 'bottom') {
            const bottom = clamp(
                containerRect.bottom - overlayRect.bottom,
                -yOffset,
                Math.max(0, containerRect.height - overlayRect.height + yOffset)
            );
            this._element.style.bottom = `${bottom}px`;
            this._element.style.top = 'auto';
        }

        if (this.horiziontalAlignment === 'left') {
            const left = clamp(
                overlayRect.left - containerRect.left,
                -xOffset,
                Math.max(0, containerRect.width - overlayRect.width + xOffset)
            );
            this._element.style.left = `${left}px`;
            this._element.style.right = 'auto';
        }

        if (this.horiziontalAlignment === 'right') {
            const right = clamp(
                containerRect.right - overlayRect.right,
                -xOffset,
                Math.max(0, containerRect.width - overlayRect.width + xOffset)
            );
            this._element.style.right = `${right}px`;
            this._element.style.left = 'auto';
        }

        this._onDidChange.fire();
    }

    toJSON(): AnchoredBox {
        const container = this.options.container.getBoundingClientRect();
        const element = this._element.getBoundingClientRect();

        const result: any = {};

        if (this.verticalAlignment === 'top') {
            result.top = parseFloat(this._element.style.top);
        } else if (this.verticalAlignment === 'bottom') {
            result.bottom = parseFloat(this._element.style.bottom);
        } else {
            result.top = element.top - container.top;
        }

        if (this.horiziontalAlignment === 'left') {
            result.left = parseFloat(this._element.style.left);
        } else if (this.horiziontalAlignment === 'right') {
            result.right = parseFloat(this._element.style.right);
        } else {
            result.left = element.left - container.left;
        }

        result.width = element.width;
        result.height = element.height;

        return result;
    }

    setupDrag(
        dragTarget: HTMLElement,
        options: { inDragMode: boolean } = { inDragMode: false }
    ): void {
        const move = new MutableDisposable();

        const track = () => {
            let offset: { x: number; y: number } | null = null;

            const iframes = [
                ...getElementsByTagName('iframe'),
                ...getElementsByTagName('webview'),
            ];

            for (const iframe of iframes) {
                iframe.style.pointerEvents = 'none';
            }

            move.value = new CompositeDisposable(
                {
                    dispose: () => {
                        for (const iframe of iframes) {
                            iframe.style.pointerEvents = 'auto';
                        }
                    },
                },
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
                        this.getMinimumWidth(overlayRect.width)
                    );
                    const yOffset = Math.max(
                        0,
                        this.getMinimumHeight(overlayRect.height)
                    );

                    const top = clamp(
                        y - offset.y,
                        -yOffset,
                        Math.max(
                            0,
                            containerRect.height - overlayRect.height + yOffset
                        )
                    );

                    const bottom = clamp(
                        offset.y -
                            y +
                            containerRect.height -
                            overlayRect.height,
                        -yOffset,
                        Math.max(
                            0,
                            containerRect.height - overlayRect.height + yOffset
                        )
                    );

                    const left = clamp(
                        x - offset.x,
                        -xOffset,
                        Math.max(
                            0,
                            containerRect.width - overlayRect.width + xOffset
                        )
                    );

                    const right = clamp(
                        offset.x - x + containerRect.width - overlayRect.width,
                        -xOffset,
                        Math.max(
                            0,
                            containerRect.width - overlayRect.width + xOffset
                        )
                    );

                    const bounds: any = {};

                    // Anchor to top or to bottom depending on which one is closer
                    if (top <= bottom) {
                        bounds.top = top;
                    } else {
                        bounds.bottom = bottom;
                    }

                    // Anchor to left or to right depending on which one is closer
                    if (left <= right) {
                        bounds.left = left;
                    } else {
                        bounds.right = right;
                    }

                    this.setBounds(bounds);
                }),
                addDisposableWindowListener(window, 'mouseup', () => {
                    toggleClass(
                        this._element,
                        'dv-resize-container-dragging',
                        false
                    );

                    move.dispose();
                    this._onDidChangeEnd.fire();
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

                const iframes = [
                    ...getElementsByTagName('iframe'),
                    ...getElementsByTagName('webview'),
                ];

                for (const iframe of iframes) {
                    iframe.style.pointerEvents = 'none';
                }

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

                        let top: number | undefined = undefined;
                        let bottom: number | undefined = undefined;
                        let height: number | undefined = undefined;
                        let left: number | undefined = undefined;
                        let right: number | undefined = undefined;
                        let width: number | undefined = undefined;

                        const moveTop = () => {
                            top = clamp(
                                y,
                                -Number.MAX_VALUE,
                                startPosition!.originalY +
                                    startPosition!.originalHeight >
                                    containerRect.height
                                    ? this.getMinimumHeight(
                                          containerRect.height
                                      )
                                    : Math.max(
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

                            bottom = containerRect.height - top - height;
                        };

                        const moveBottom = () => {
                            top =
                                startPosition!.originalY -
                                startPosition!.originalHeight;

                            height = clamp(
                                y - top,
                                top < 0 &&
                                    typeof this.options
                                        .minimumInViewportHeight === 'number'
                                    ? -top +
                                          this.options.minimumInViewportHeight
                                    : Overlay.MINIMUM_HEIGHT,
                                Number.MAX_VALUE
                            );

                            bottom = containerRect.height - top - height;
                        };

                        const moveLeft = () => {
                            left = clamp(
                                x,
                                -Number.MAX_VALUE,
                                startPosition!.originalX +
                                    startPosition!.originalWidth >
                                    containerRect.width
                                    ? this.getMinimumWidth(containerRect.width)
                                    : Math.max(
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

                            right = containerRect.width - left - width;
                        };

                        const moveRight = () => {
                            left =
                                startPosition!.originalX -
                                startPosition!.originalWidth;

                            width = clamp(
                                x - left,
                                left < 0 &&
                                    typeof this.options
                                        .minimumInViewportWidth === 'number'
                                    ? -left +
                                          this.options.minimumInViewportWidth
                                    : Overlay.MINIMUM_WIDTH,
                                Number.MAX_VALUE
                            );

                            right = containerRect.width - left - width;
                        };

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

                        const bounds: any = {};

                        // Anchor to top or to bottom depending on which one is closer
                        if (top! <= bottom!) {
                            bounds.top = top;
                        } else {
                            bounds.bottom = bottom;
                        }

                        // Anchor to left or to right depending on which one is closer
                        if (left! <= right!) {
                            bounds.left = left;
                        } else {
                            bounds.right = right;
                        }

                        bounds.height = height;
                        bounds.width = width;

                        this.setBounds(bounds);
                    }),
                    {
                        dispose: () => {
                            for (const iframe of iframes) {
                                iframe.style.pointerEvents = 'auto';
                            }
                        },
                    },
                    addDisposableWindowListener(window, 'mouseup', () => {
                        move.dispose();
                        this._onDidChangeEnd.fire();
                    })
                );
            })
        );
    }

    private getMinimumWidth(width: number) {
        if (typeof this.options.minimumInViewportWidth === 'number') {
            return width - this.options.minimumInViewportWidth;
        }
        return 0;
    }

    private getMinimumHeight(height: number) {
        if (typeof this.options.minimumInViewportHeight === 'number') {
            return height - this.options.minimumInViewportHeight;
        }
        return 0;
    }

    override dispose(): void {
        this._element.remove();
        super.dispose();
    }
}
