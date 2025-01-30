import { CompositeDisposable, Disposable } from '../lifecycle';
import { DropTargetTargetModel } from './droptarget';

export class DropTargetAnchorContainer extends CompositeDisposable {
    private _model:
        | { root: HTMLElement; overlay: HTMLElement; changed: boolean }
        | undefined;

    private _outline: HTMLElement | undefined;

    private _disabled = false;

    get disabled(): boolean {
        return this._disabled;
    }

    set disabled(value: boolean) {
        if (this.disabled === value) {
            return;
        }

        this._disabled = value;

        if (value) {
            this.model?.clear();
        }
    }

    get model(): DropTargetTargetModel | undefined {
        if (this.disabled) {
            return undefined;
        }

        return {
            clear: () => {
                if (this._model) {
                    this._model.root.parentElement?.removeChild(
                        this._model.root
                    );
                }
                this._model = undefined;
            },
            exists: () => {
                return !!this._model;
            },
            getElements: (event?: DragEvent, outline?: HTMLElement) => {
                const changed = this._outline !== outline;
                this._outline = outline;

                if (this._model) {
                    this._model.changed = changed;
                    return this._model;
                }

                const container = this.createContainer();
                const anchor = this.createAnchor();

                this._model = { root: container, overlay: anchor, changed };

                container.appendChild(anchor);
                this.element.appendChild(container);

                if (event?.target instanceof HTMLElement) {
                    const targetBox = event.target.getBoundingClientRect();
                    const box = this.element.getBoundingClientRect();

                    anchor.style.left = `${targetBox.left - box.left}px`;
                    anchor.style.top = `${targetBox.top - box.top}px`;
                }

                return this._model;
            },
        };
    }

    constructor(readonly element: HTMLElement, options: { disabled: boolean }) {
        super();

        this._disabled = options.disabled;

        this.addDisposables(
            Disposable.from(() => {
                this.model?.clear();
            })
        );
    }

    private createContainer(): HTMLElement {
        const el = document.createElement('div');
        el.className = 'dv-drop-target-container';

        return el;
    }

    private createAnchor(): HTMLElement {
        const el = document.createElement('div');
        el.className = 'dv-drop-target-anchor';
        el.style.visibility = 'hidden';

        return el;
    }
}
