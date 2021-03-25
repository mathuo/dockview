import { trackFocus } from './dom';
import { Emitter, Event } from './events';
import { IDisposable } from './lifecycle';

export interface HostedContainerOptions {
    id: string;
    parent?: HTMLElement;
}

export class HostedContainer implements IDisposable {
    private readonly _element: HTMLElement;

    private readonly _onDidFocus = new Emitter<void>();
    readonly onDidFocus: Event<void> = this._onDidFocus.event;

    private readonly _onDidBlur = new Emitter<void>();
    readonly onDidBlur: Event<void> = this._onDidBlur.event;

    get element() {
        return this._element;
    }

    constructor(private readonly options: HostedContainerOptions) {
        if (!options.parent) {
            options.parent = document.getElementById('app') as HTMLElement;
            options.parent.style.position = 'relative';
        }

        this._element = document.createElement('div');
        this._element.style.visibility = 'hidden';
        this._element.style.overflow = 'hidden';
        // this._element.style.pointerEvents = 'none';
        this._element.id = `webview-${options.id}`;
        this._element.tabIndex = -1;

        const { onDidFocus, onDidBlur } = trackFocus(this._element);

        onDidFocus(() => this._onDidFocus.fire());
        onDidBlur(() => this._onDidBlur.fire());

        /**
         * When dragging somebody
         */

        window.addEventListener('dragstart', (ev) => {
            this.element.style.pointerEvents = 'none';
        });
        window.addEventListener('dragend', (ev) => {
            this.element.style.pointerEvents = '';
        });
        window.addEventListener('mousemove', (ev) => {
            if (ev.buttons === 0) {
                this.element.style.pointerEvents = '';
            }
        });

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
        const containerRect = this.element.parentElement.getBoundingClientRect();
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
