import { MutableDisposable } from '..';
import { getElementsByTagName } from '../dom';
import { addDisposableListener, Emitter } from '../events';
import { CompositeDisposable, IDisposable } from '../lifecycle';

export abstract class DragHandler extends CompositeDisposable {
    private readonly disposable = new MutableDisposable();

    private readonly _onDragStart = new Emitter<void>();
    readonly onDragStart = this._onDragStart.event;

    private iframes: HTMLElement[] = [];

    constructor(private readonly el: HTMLElement) {
        super();
        this.configure();
    }

    abstract getData(): IDisposable;

    private configure() {
        this.addDisposables(
            addDisposableListener(this.el, 'dragstart', (event) => {
                this.iframes = [
                    ...getElementsByTagName('iframe'),
                    ...getElementsByTagName('webview'),
                ];

                for (const iframe of this.iframes) {
                    iframe.style.pointerEvents = 'none';
                }

                this.el.classList.add('dragged');
                setTimeout(() => this.el.classList.remove('dragged'), 0);

                this.disposable.value = this.getData();

                if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = 'move';
                }
            }),
            addDisposableListener(this.el, 'dragend', (ev) => {
                for (const iframe of this.iframes) {
                    iframe.style.pointerEvents = 'auto';
                }
                this.iframes = [];

                this.disposable.dispose();
            })
        );
    }
}
