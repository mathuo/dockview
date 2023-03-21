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

    private configure(): void {
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

                    /**
                     * Although this is not used by dockview many third party dnd libraries will check
                     * dataTransfer.types to determine valid drag events.
                     *
                     * For example: in react-dnd if dataTransfer.types is not set then the dragStart event will be cancelled
                     * through .preventDefault(). Since this is applied globally to all drag events this would break dockviews
                     * dnd logic. You can see the code at
                     * https://github.com/react-dnd/react-dnd/blob/main/packages/backend-html5/src/HTML5BackendImpl.ts#L542
                     */
                    event.dataTransfer.setData(
                        'text/plain',
                        '__dockview_internal_drag_event__'
                    );
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
