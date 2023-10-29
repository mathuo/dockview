import { addStyles } from './dom';
import { Emitter, addDisposableWindowListener } from './events';
import { CompositeDisposable, IDisposable } from './lifecycle';
import { Box } from './types';

export type PopoutWindowOptions = {
    url: string;
} & Box;

export class PopoutWindow extends CompositeDisposable {
    private readonly _onDidClose = new Emitter<void>();
    readonly onDidClose = this._onDidClose.event;

    private _window: { value: Window; disposable: IDisposable } | null = null;

    constructor(
        private readonly id: string,
        private readonly className: string,
        private readonly options: PopoutWindowOptions
    ) {
        super();

        this.addDisposables(this._onDidClose, {
            dispose: () => {
                this.close();
            },
        });
    }

    dimensions(): Box | null {
        if (!this._window) {
            return null;
        }

        const left = this._window.value.screenX;
        const top = this._window.value.screenY;
        const width = this._window.value.innerWidth;
        const height = this._window.value.innerHeight;

        return { top, left, width, height };
    }

    close(): void {
        if (this._window) {
            this._window.disposable.dispose();
            this._window.value.close();
            this._window = null;
        }
    }

    open(content: HTMLElement): void {
        if (this._window) {
            throw new Error('instance of popout window is already open');
        }

        const url = `${this.options.url}`;

        const features = Object.entries({
            top: this.options.top,
            left: this.options.left,
            width: this.options.width,
            height: this.options.height,
        })
            .map(([key, value]) => `${key}=${value}`)
            .join(',');

        // https://developer.mozilla.org/en-US/docs/Web/API/Window/open
        const externalWindow = window.open(url, this.id, features);

        if (!externalWindow) {
            return;
        }

        const disposable = new CompositeDisposable();

        this._window = { value: externalWindow, disposable };

        const grievingParent = content.parentElement;

        const cleanUp = () => {
            grievingParent?.appendChild(content);
            this._onDidClose.fire();
            this._window = null;
        };

        // prevent any default content from loading
        externalWindow.document.body.replaceWith(document.createElement('div'));

        disposable.addDisposables(
            addDisposableWindowListener(window, 'beforeunload', () => {
                cleanUp();
                this.close();
            })
        );

        externalWindow.addEventListener('load', () => {
            const externalDocument = externalWindow.document;
            externalDocument.title = document.title;

            const div = document.createElement('div');
            div.classList.add('dv-popout-window');
            div.style.position = 'absolute';
            div.style.width = '100%';
            div.style.height = '100%';
            div.style.top = '0px';
            div.style.left = '0px';
            div.classList.add(this.className);
            div.appendChild(content);

            externalDocument.body.replaceChildren(div);
            externalDocument.body.classList.add(this.className);

            addStyles(externalDocument, window.document.styleSheets);

            externalWindow.addEventListener('beforeunload', () => {
                // TODO: indicate external window is closing
                cleanUp();
            });
        });
    }
}
