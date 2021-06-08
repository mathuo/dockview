import { IDisposable } from '../../lifecycle';
import { IGroupPanel } from '../groupPanel';
import { IRenderable } from '../types';

export interface HostedPanelOptions {
    id: string;
    parent?: HTMLElement;
}

export class HostedPanel implements IRenderable, IDisposable {
    private readonly _element: HTMLElement;

    get element() {
        return this._element;
    }

    get id() {
        return this.panel.id;
    }

    constructor(
        private readonly panel: IGroupPanel,
        private readonly options: HostedPanelOptions
    ) {
        if (!options.parent) {
            options.parent = document.getElementById('app') as HTMLElement;
            options.parent.style.position = 'relative';
        }

        this._element = document.createElement('div');
        this._element.style.visibility = 'hidden';
        this._element.style.overflow = 'hidden';
        // this._element.style.pointerEvents = 'none';
        this._element.id = `webivew-${options.id}`;

        options.parent.appendChild(this._element);
    }

    hide() {
        this._element.style.visibility = 'hidden';
    }

    show() {
        this._element.style.visibility = 'visible';
    }

    layout(
        element: HTMLElement,
        dimension?: { width: number; height: number }
    ) {
        if (!this.element || !this.element.parentElement) {
            return;
        }
        const frameRect = element.getBoundingClientRect();
        const containerRect =
            this.element.parentElement.getBoundingClientRect();
        this.element.style.position = 'absolute';
        this.element.style.top = `${frameRect.top - containerRect.top}px`;
        this.element.style.left = `${frameRect.left - containerRect.left}px`;
        this.element.style.width = `${
            dimension ? dimension.width : frameRect.width
        }px`;
        this.element.style.height = `${
            dimension ? dimension.height : frameRect.height
        }px`;
    }

    dispose() {
        this._element.remove();
    }
}
