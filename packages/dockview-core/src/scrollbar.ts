import {
    addClasses,
    removeClasses,
    toggleClass,
    watchElementResize,
} from './dom';
import { addDisposableListener } from './events';
import { CompositeDisposable } from './lifecycle';
import { clamp } from './math';

export class Scrollbar extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private readonly _scrollbar: HTMLElement;
    private _scrollOffset: number = 0;
    private _animationTimer: any;
    private _orientation: 'horizontal' | 'vertical' = 'horizontal';
    public static MouseWheelSpeed = 1;

    get element(): HTMLElement {
        return this._element;
    }

    get orientation(): 'horizontal' | 'vertical' {
        return this._orientation;
    }
    set orientation(value: 'horizontal' | 'vertical') {
        if (this._orientation === value) {
            return;
        }
        this._scrollOffset = 0;
        this._orientation = value;
        removeClasses(
            this._scrollbar,
            'dv-scrollbar-vertical',
            'dv-scrollbar-horizontal'
        );
        if (value === 'vertical') {
            addClasses(this._scrollbar, 'dv-scrollbar-vertical');
        } else {
            addClasses(this._scrollbar, 'dv-scrollbar-horizontal');
        }
    }

    constructor(private readonly scrollableElement: HTMLElement) {
        super();

        this._element = document.createElement('div');
        this._element.className = 'dv-scrollable';

        this._scrollbar = document.createElement('div');
        this._scrollbar.className = 'dv-scrollbar dv-scrollbar-horizontal';

        this.element.appendChild(scrollableElement);
        this.element.appendChild(this._scrollbar);

        this.addDisposables(
            addDisposableListener(this.element, 'wheel', (event) => {
                this._scrollOffset += event.deltaY * Scrollbar.MouseWheelSpeed;
                this.calculateScrollbarStyles();
            }),
            addDisposableListener(this._scrollbar, 'pointerdown', (event) => {
                event.preventDefault();

                toggleClass(this.element, 'dv-scrollable-scrolling', true);

                const originalClient =
                    this._orientation === 'horizontal'
                        ? event.clientX
                        : event.clientY;
                const originalScrollOffset = this._scrollOffset;

                const onPointerMove = (event: PointerEvent) => {
                    const delta =
                        this._orientation === 'horizontal'
                            ? event.clientX - originalClient
                            : event.clientY - originalClient;

                    const clientSize =
                        this._orientation === 'horizontal'
                            ? this.element.clientWidth
                            : this.element.clientHeight;
                    const scrollSize =
                        this._orientation === 'horizontal'
                            ? this.scrollableElement.scrollWidth
                            : this.scrollableElement.scrollHeight;
                    const p = clientSize / scrollSize;

                    this._scrollOffset = originalScrollOffset + delta / p;
                    this.calculateScrollbarStyles();
                };

                const onEnd = () => {
                    toggleClass(this.element, 'dv-scrollable-scrolling', false);

                    document.removeEventListener('pointermove', onPointerMove);
                    document.removeEventListener('pointerup', onEnd);
                    document.removeEventListener('pointercancel', onEnd);
                };

                document.addEventListener('pointermove', onPointerMove);
                document.addEventListener('pointerup', onEnd);
                document.addEventListener('pointercancel', onEnd);
            }),
            addDisposableListener(this.element, 'scroll', () => {
                this.calculateScrollbarStyles();
            }),
            addDisposableListener(this.scrollableElement, 'scroll', () => {
                this._scrollOffset =
                    this._orientation === 'horizontal'
                        ? this.scrollableElement.scrollLeft
                        : this.scrollableElement.scrollTop;
                this.calculateScrollbarStyles();
            }),
            watchElementResize(this.element, () => {
                toggleClass(this.element, 'dv-scrollable-resizing', true);

                if (this._animationTimer) {
                    clearTimeout(this._animationTimer);
                }

                this._animationTimer = setTimeout(() => {
                    clearTimeout(this._animationTimer);
                    toggleClass(this.element, 'dv-scrollable-resizing', false);
                }, 500);

                this.calculateScrollbarStyles();
            })
        );
    }

    private calculateScrollbarStyles(): void {
        const clientSize =
            this._orientation === 'horizontal'
                ? this.element.clientWidth
                : this.element.clientHeight;
        const scrollSize =
            this._orientation === 'horizontal'
                ? this.scrollableElement.scrollWidth
                : this.scrollableElement.scrollHeight;

        const hasScrollbar = scrollSize > clientSize;

        if (hasScrollbar) {
            const px = clientSize * (clientSize / scrollSize);

            if (this._orientation === 'horizontal') {
                this._scrollbar.style.width = `${px}px`;
                this._scrollbar.style.height = '';
            } else {
                this._scrollbar.style.height = `${px}px`;
                this._scrollbar.style.width = '';
            }

            this._scrollOffset = clamp(
                this._scrollOffset,
                0,
                scrollSize - clientSize
            );

            if (this._orientation === 'horizontal') {
                this.scrollableElement.scrollLeft = this._scrollOffset;
            } else {
                this.scrollableElement.scrollTop = this._scrollOffset;
            }

            const percentageComplete =
                this._scrollOffset / (scrollSize - clientSize);

            if (this._orientation === 'horizontal') {
                this._scrollbar.style.left = `${(clientSize - px) * percentageComplete}px`;
                this._scrollbar.style.top = '';
            } else {
                this._scrollbar.style.top = `${(clientSize - px) * percentageComplete}px`;
                this._scrollbar.style.left = '';
            }
        } else {
            if (this._orientation === 'horizontal') {
                this._scrollbar.style.width = '0px';
                this._scrollbar.style.left = '0px';
            } else {
                this._scrollbar.style.height = '0px';
                this._scrollbar.style.top = '0px';
            }
            this._scrollOffset = 0;
        }
    }
}
