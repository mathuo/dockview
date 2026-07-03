import { shiftAbsoluteElementIntoView } from '../../dom';
import { addDisposableListener } from '../../events';
import {
    CompositeDisposable,
    Disposable,
    MutableDisposable,
} from '../../lifecycle';

function isCoarsePrimaryInput(win: Window): boolean {
    if (!win.matchMedia) {
        return false;
    }
    const coarse = win.matchMedia('(pointer: coarse)').matches;
    const fine = win.matchMedia('(pointer: fine)').matches;
    return coarse && !fine;
}

export class PopupService extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private _active: HTMLElement | null = null;
    private readonly _activeDisposable = new MutableDisposable();
    private _root: HTMLElement;
    // The window the popover lives in. Different from `window` for popout
    // groups: their popovers must register pointerdown/keydown/resize on the
    // popout window (not the main one) and create elements with the popout's
    // document so they render and dismiss correctly.
    private readonly _window: Window;

    constructor(root: HTMLElement, win: Window = globalThis.window) {
        super();

        this._root = root;
        this._window = win;
        this._element = win.document.createElement('div');
        this._element.className = 'dv-popover-anchor';
        this._element.style.position = 'relative';

        this._root.prepend(this._element);

        this.addDisposables(
            Disposable.from(() => {
                this.close();
            }),
            this._activeDisposable
        );
    }

    /**
     * Move the popup anchor into a new root element. Call this when a shell
     * wraps the dockview component so that edge-group overflow dropdowns
     * position correctly relative to the full layout area.
     */
    updateRoot(newRoot: HTMLElement): void {
        newRoot.prepend(this._element);
        this._root = newRoot;
    }

    openPopover(
        element: HTMLElement,
        position: { x: number; y: number; zIndex?: string }
    ): void {
        this.close();

        const wrapper = this._window.document.createElement('div');
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

        // Outside-pointerdown dismissal is suppressed for a short grace
        // window after opening. Touch long-press callers (chip / tab context
        // menus) open the popover while the user's finger is still pressing
        // the source element — Android Chrome can dispatch a follow-up
        // synthetic pointerdown tied to the gesture, and the release-then-
        // retap motion can land just outside the wrapper. Either would
        // dismiss the popover before the user can see or interact with it.
        // The grace window is short enough that intentional outside taps
        // still feel responsive.
        const openedAt = Date.now();
        const POINTERDOWN_GRACE_MS = 200;

        this._activeDisposable.value = new CompositeDisposable(
            addDisposableListener(this._window, 'pointerdown', (event) => {
                if (Date.now() - openedAt < POINTERDOWN_GRACE_MS) {
                    return;
                }

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
            }),
            addDisposableListener(this._window, 'keydown', (event) => {
                if (event.key === 'Escape' || event.key === 'Enter') {
                    this.close();
                }
            }),
            addDisposableListener(this._window, 'resize', () => {
                // On touch-primary devices, common interactions resize the
                // window: on-screen keyboard pop, orientation change, browser
                // address-bar collapse. None of these mean "the user wants
                // the popover dismissed". Specifically, focusing the chip
                // context menu's rename input pops the keyboard, which would
                // otherwise close the menu the moment the user goes to edit
                // it. Desktop / hybrid input keeps the existing behaviour —
                // there a resize genuinely means the user has resized the
                // window and the popover position is now stale.
                if (isCoarsePrimaryInput(this._window)) {
                    return;
                }
                this.close();
            })
        );

        this._window.requestAnimationFrame(() => {
            shiftAbsoluteElementIntoView(wrapper, this._root);
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
