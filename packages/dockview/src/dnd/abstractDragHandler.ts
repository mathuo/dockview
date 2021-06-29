import { getElementsByTagName } from '../dom';
import { addDisposableListener, Emitter } from '../events';
import { focusedElement } from '../focusedElement';
import { CompositeDisposable, IDisposable } from '../lifecycle';
import { DATA_KEY, LocalSelectionTransfer } from './dataTransfer';

export abstract class DragHandler extends CompositeDisposable {
    private iframes: HTMLElement[] = [];

    private readonly _onDragStart = new Emitter<void>();
    readonly onDragStart = this._onDragStart.event;

    // private activeDrag: { id: string } | undefined;

    // get isDragging() {
    //     return !!this.activeDrag;
    // }

    private disposable: IDisposable | undefined;

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

                // this.activeDrag = this.getData();
                this.disposable?.dispose();
                this.disposable = this.getData();

                // if (event.dataTransfer) {
                //     event.dataTransfer.setData(DATA_KEY, stringifiedData);
                //     event.dataTransfer.effectAllowed = 'move';
                // }
            }),
            addDisposableListener(this.el, 'dragend', (ev) => {
                for (const iframe of this.iframes) {
                    iframe.style.pointerEvents = 'auto';
                }
                this.iframes = [];

                this.disposable?.dispose();
                this.disposable = undefined;

                // drop events fire before dragend so we can remove this safely
                // LocalSelectionTransfer.getInstance().clearData(this.activeDrag);
                // this.activeDrag = undefined;
            }),
            addDisposableListener(this.el, 'mousedown', (event) => {
                if (event.defaultPrevented) {
                    return;
                }
                /**
                 * TODO: alternative to stopPropagation
                 *
                 * I need to stop the event propagation here since otherwise it'll be intercepted by event handlers
                 * on the tabs-container. I cannot use event.preventDefault() since I need the on DragStart event to occur
                 */
                event.stopPropagation();

                /**
                 * //TODO mousedown focusing with draggable element (is there a better approach?)
                 *
                 * this mousedown event wants to focus the tab itself but if we call preventDefault()
                 * this would also prevent the dragStart event from firing. To get around this we propagate
                 * the onChanged event during the next tick of the event-loop, allowing the tab element to become
                 * focused on this tick and ensuring the dragstart event is not interrupted
                 */

                const oldFocus = focusedElement.element as HTMLElement;
                setTimeout(() => {
                    oldFocus.focus();
                    // this._onChanged.fire({ kind: MouseEventKind.CLICK, event });
                }, 0);
            }),
            addDisposableListener(this.el, 'contextmenu', (event) => {
                // this._onChanged.fire({
                //     kind: MouseEventKind.CONTEXT_MENU,
                //     event,
                // });
            })
        );
    }
}
