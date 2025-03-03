import { toggleClass, watchElementResize } from './dom';
import { addDisposableListener } from './events';
import { CompositeDisposable } from './lifecycle';
import { clamp } from './math';

export class Scrollbar extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private readonly _horizontalScrollbar: HTMLElement;
    private _scrollLeft: number = 0;
    private _animationTimer: any;
    public static MouseWheelSpeed = 1;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(private readonly scrollableElement: HTMLElement) {
        super();

        this._element = document.createElement('div');
        this._element.className = 'dv-scrollable';

        this._horizontalScrollbar = document.createElement('div');
        this._horizontalScrollbar.className = 'dv-scrollbar-horizontal';

        this.element.appendChild(scrollableElement);
        this.element.appendChild(this._horizontalScrollbar);

        this.addDisposables(
            addDisposableListener(this.element, 'wheel', (event) => {
                this._scrollLeft += event.deltaY * Scrollbar.MouseWheelSpeed;

                this.calculateScrollbarStyles();
            }),
            addDisposableListener(
                this._horizontalScrollbar,
                'pointerdown',
                (event) => {
                    event.preventDefault();

                    toggleClass(this.element, 'dv-scrollable-scrolling', true);

                    const originalClientX = event.clientX;
                    const originalScrollLeft = this._scrollLeft;

                    const onPointerMove = (event: PointerEvent) => {
                        const deltaX = event.clientX - originalClientX;

                        const { clientWidth } = this.element;
                        const { scrollWidth } = this.scrollableElement;
                        const p = clientWidth / scrollWidth;

                        this._scrollLeft = originalScrollLeft + deltaX / p;
                        this.calculateScrollbarStyles();
                    };

                    const onEnd = () => {
                        toggleClass(
                            this.element,
                            'dv-scrollable-scrolling',
                            false
                        );

                        document.removeEventListener(
                            'pointermove',
                            onPointerMove
                        );
                        document.removeEventListener('pointerup', onEnd);
                        document.removeEventListener('pointercancel', onEnd);
                    };

                    document.addEventListener('pointermove', onPointerMove);
                    document.addEventListener('pointerup', onEnd);
                    document.addEventListener('pointercancel', onEnd);
                }
            ),
            addDisposableListener(this.element, 'scroll', () => {
                this.calculateScrollbarStyles();
            }),
            addDisposableListener(this.scrollableElement, 'scroll', () => {
                this._scrollLeft = this.scrollableElement.scrollLeft;
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
        const { clientWidth } = this.element;
        const { scrollWidth } = this.scrollableElement;

        const hasScrollbar = scrollWidth > clientWidth;

        if (hasScrollbar) {
            const px = clientWidth * (clientWidth / scrollWidth);
            this._horizontalScrollbar.style.width = `${px}px`;

            this._scrollLeft = clamp(
                this._scrollLeft,
                0,
                this.scrollableElement.scrollWidth - clientWidth
            );

            this.scrollableElement.scrollLeft = this._scrollLeft;

            const percentageComplete =
                this._scrollLeft / (scrollWidth - clientWidth);

            this._horizontalScrollbar.style.left = `${
                (clientWidth - px) * percentageComplete
            }px`;
        } else {
            this._horizontalScrollbar.style.width = `0px`;
            this._horizontalScrollbar.style.left = `0px`;
            this._scrollLeft = 0;
        }
    }
}
