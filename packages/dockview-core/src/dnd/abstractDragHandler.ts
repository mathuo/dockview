import { getElementsByTagName } from '../dom';
import { addDisposableListener, Emitter } from '../events';
import {
    CompositeDisposable,
    IDisposable,
    MutableDisposable,
} from '../lifecycle';

export abstract class DragHandler extends CompositeDisposable {
    private readonly disposable = new MutableDisposable();

    private readonly _onDragStart = new Emitter<void>();
    readonly onDragStart = this._onDragStart.event;

    private iframes: HTMLElement[] = [];

    constructor(protected readonly el: HTMLElement) {
        super();
        this.configure();
    }

    abstract getData(dataTransfer?: DataTransfer | null): IDisposable;

    private configure() {
        this.addDisposables(
            this._onDragStart,
            addDisposableListener(this.el, 'dragstart', (event) => {
                this.iframes = [
                    ...getElementsByTagName('iframe'),
                    ...getElementsByTagName('webview'),
                ];

                for (const iframe of this.iframes) {
                    iframe.style.pointerEvents = 'none';
                }

                this.el.classList.add('dv-dragged');
                setTimeout(() => this.el.classList.remove('dv-dragged'), 0);

                this.disposable.value = this.getData(event.dataTransfer);

                if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = 'move';
                }
            }),
            addDisposableListener(this.el, 'dragend', () => {
                for (const iframe of this.iframes) {
                    iframe.style.pointerEvents = 'auto';
                }
                this.iframes = [];

                this.disposable.dispose();
            })
        );
    }
}
