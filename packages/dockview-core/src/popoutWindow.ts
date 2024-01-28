import { addStyles } from './dom';
import { Emitter, addDisposableWindowListener } from './events';
import { CompositeDisposable, IDisposable } from './lifecycle';
import { Box } from './types';

export type PopoutWindowOptions = {
    url: string;
    onDidOpen?: (event: { id: string; window: Window }) => void;
    onWillClose?: (event: { id: string; window: Window }) => void;
} & Box;

export class PopoutWindow extends CompositeDisposable {
    private readonly _onWillClose = new Emitter<void>();
    readonly onWillClose = this._onWillClose.event;

    private readonly _onDidClose = new Emitter<void>();
    readonly onDidClose = this._onDidClose.event;

    private _window: { value: Window; disposable: IDisposable } | null = null;

    get window(): Window | null {
        return this._window?.value ?? null;
    }

    constructor(
        private readonly target: string,
        private readonly className: string,
        private readonly options: PopoutWindowOptions
    ) {
        super();

        this.addDisposables(this._onWillClose, this._onDidClose, {
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
            this._onWillClose.fire();

            this.options.onWillClose?.({
                id: this.target,
                window: this._window.value,
            });

            this._window.disposable.dispose();
            this._window.value.close();
            this._window = null;

            this._onDidClose.fire();
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

        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/open
         */
        const externalWindow = window.open(url, this.target, features);

        if (!externalWindow) {
            return;
        }

        const disposable = new CompositeDisposable();

        this._window = { value: externalWindow, disposable };

        disposable.addDisposables(
            addDisposableWindowListener(window, 'beforeunload', () => {
                /**
                 * before the main window closes we should close this popup too
                 * to be good citizens
                 *
                 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
                 */
                this.close();
            })
        );

        externalWindow.addEventListener('load', () => {
            /**
             * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event
             */

            const externalDocument = externalWindow.document;
            externalDocument.title = document.title;

            const container = this.createPopoutWindowContainer();
            container.classList.add(this.className);
            container.appendChild(content);

            // externalDocument.body.replaceChildren(container);
            externalDocument.body.appendChild(container);
            externalDocument.body.classList.add(this.className);

            addStyles(externalDocument, window.document.styleSheets);

            externalWindow.addEventListener('beforeunload', () => {
                /**
                 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
                 */
                this.close();
            });
        });

        this.options.onDidOpen?.({ id: this.target, window: externalWindow });
    }

    private createPopoutWindowContainer(): HTMLElement {
        const el = document.createElement('div');
        el.classList.add('dv-popout-window');
        el.id = 'dv-popout-window';
        el.style.position = 'absolute';
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.top = '0px';
        el.style.left = '0px';

        return el;
    }
}
