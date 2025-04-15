import { addDisposableListener } from '../../events';
import {
    CompositeDisposable,
    Disposable,
    MutableDisposable,
} from '../../lifecycle';

function shiftAbsoluteElementIntoView(element: HTMLElement, root: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const rootRect = element.getBoundingClientRect();

    const viewportWidth = root.clientWidth;
    const viewportHeight = root.clientHeight;

    // const viewportWidth =
    //     window.innerWidth || document.documentElement.clientWidth;
    // const viewportHeight =
    //     window.innerHeight || document.documentElement.clientHeight;

    const buffer = 10; // 10px buffer

    let translateX = 0;
    let translateY = 0;

    const left = rect.left - rootRect.left;
    const top = rect.top - rootRect.top;
    const bottom = rect.bottom - rootRect.bottom;
    const right = rect.right - rootRect.right;

    // Check horizontal overflow
    if (left < buffer) {
        translateX = buffer - left;
    } else if (right > viewportWidth - buffer) {
        translateX = viewportWidth - right - buffer;
    }

    // Check vertical overflow
    if (top < buffer) {
        translateY = buffer - top;
    } else if (bottom > viewportHeight - buffer) {
        translateY = viewportHeight - bottom - buffer;
    }

    // Apply the translation if needed
    if (translateX !== 0 || translateY !== 0) {
        element.style.transform = `translate(${translateX}px, ${translateY}px)`;
    }
}

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
        position: { x: number; y: number }
    ): void {
        this.close();

        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.zIndex = '99';
        wrapper.appendChild(element);

        const anchorBox = this._element.getBoundingClientRect();
        const offsetX = anchorBox.left;
        const offsetY = anchorBox.top;

        wrapper.style.top = `${position.y - offsetY}px`;
        wrapper.style.left = `${position.x - offsetX}px`;

        this._element.appendChild(wrapper);

        this._active = wrapper;

        this._activeDisposable.value = new CompositeDisposable(
          addDisposableListener(window, 'pointerdown', (event) => {
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
