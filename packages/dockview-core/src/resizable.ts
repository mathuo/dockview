import { watchElementResize } from './dom';
import { CompositeDisposable } from './lifecycle';

export abstract class Resizable extends CompositeDisposable {
    private readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(parentElement?: HTMLElement) {
        super();

        if (parentElement) {
            this._element = parentElement;
        } else {
            this._element = document.createElement('div');
            this._element.style.height = '100%';
            this._element.style.width = '100%';
            this._element.className = 'dv-resizable-container';
        }

        this.addDisposables(
            watchElementResize(this._element, (entry) => {
                if (this.isDisposed) {
                    /**
                     * resize is delayed through requestAnimationFrame so there is a small chance
                     * the component has already been disposed of
                     */
                    return;
                }
                const { width, height } = entry.contentRect;
                this.layout(width, height);
            })
        );
    }

    abstract layout(width: number, height: number): void;
}
