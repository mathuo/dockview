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

    constructor(parentElement: HTMLElement, disableResizing = false) {
        super();

        this._disableResizing = disableResizing;

        this._element = parentElement;

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

                if (!this._element.offsetParent) {
                    /**
                     * offsetParent === null is equivalent to display: none being set on the element or one
                     * of it's parents. In the display: none case the size will become (0, 0) which we do
                     * not want to propagate.
                     *
                     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
                     *
                     * You could use checkVisibility() but at the time of writing it's not supported across
                     * all Browsers
                     *
                     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/checkVisibility
                     */
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
