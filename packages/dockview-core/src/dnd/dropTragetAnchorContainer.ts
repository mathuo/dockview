import { DropTargetTargetModel } from './droptarget';

export class DropTargetAnchorContainer {
    private _model:
        | { root: HTMLElement; overlay: HTMLElement; changed: boolean }
        | undefined;

    private _outline: HTMLElement | undefined;

    get model(): DropTargetTargetModel {
        return {
            clear: () => {
                this._model?.root.remove();
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
                    console.log(box, targetBox);

                    anchor.style.left = `${targetBox.left - box.left}px`;
                    anchor.style.top = `${targetBox.top - box.top}px`;
                }

                return this._model;
            },
        };
    }

    constructor(readonly element: HTMLElement) {}

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
