import { shiftAbsoluteElementIntoView } from '../../dom';
import { addDisposableListener } from '../../events';
import {
    CompositeDisposable,
    Disposable,
    MutableDisposable,
} from '../../lifecycle';

export class PopupService extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private _active: HTMLElement | null = null;
    private readonly _activeDisposable = new MutableDisposable();

    constructor(private readonly root: HTMLElement) {
        super();

        this._element = document.createElement('div');
        this._element.className = 'dv-popover-anchor';
        this._element.style.position = 'relative';

        this.root.prepend(this._element);

        this.addDisposables(
            Disposable.from(() => {
                this.close();
            }),
            this._activeDisposable
        );
    }

    openPopover(
        element: HTMLElement,
        position: { x: number; y: number; zIndex?: string }
    ): void {
        this.close();

        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.zIndex = position.zIndex ?? 'var(--dv-overlay-z-index)';
        wrapper.appendChild(element);

        const anchorBox = this._element.getBoundingClientRect();
        const offsetX = anchorBox.left;
        const offsetY = anchorBox.top;

        wrapper.style.top = `${position.y - offsetY}px`;
        wrapper.style.left = `${position.x - offsetX}px`;

        this._element.appendChild(wrapper);

        this._active = wrapper;

        this._activeDisposable.value = new CompositeDisposable(
            addDisposableListener(window, 'mousedown', (event) => {
                const target = event.target;

                if (!(target instanceof HTMLElement)) {
                    return;
                }

                let el: HTMLElement | null = target;

                while (el && el !== wrapper) {
                    el = el?.parentElement ?? null;
                }

                if (el) {
                    return; // clicked within popover
                }

                this.close();
            })
        );

        requestAnimationFrame(() => {
            shiftAbsoluteElementIntoView(wrapper, this.root);
        });
    }

    close(): void {
        if (this._active) {
            this._active.remove();
            this._activeDisposable.dispose();
            this._active = null;
        }
    }
}
