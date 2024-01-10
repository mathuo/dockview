import { isInDocument, watchElementResize } from './dom';
import { CompositeDisposable } from './lifecycle';

export abstract class Resizable extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private _disableResizing: boolean;

    get element(): HTMLElement {
        return this._element;
    }

    get disableResizing(): boolean {
        return this._disableResizing;
    }

    set disableResizing(value: boolean) {
        this._disableResizing = value;
    }

    constructor(parentElement?: HTMLElement, disableResizing = false) {
        super();

        this._disableResizing = disableResizing;

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

                if (this.disableResizing) {
                    return;
                }

                if (!isInDocument(this._element)) {
                    /**
                     * since the event is dispatched through requestAnimationFrame there is a small chance
                     * the component is no longer attached to the DOM, if that is the case the dimensions
                     * are mostly likely all zero and meaningless. we should skip this case.
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
