import { addDisposableListener } from '../events';
import { CompositeDisposable } from '../lifecycle';

export interface IDragAndDropObserverCallbacks {
    onDragEnter: (e: DragEvent) => void;
    onDragLeave: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
    onDragEnd: (e: DragEvent) => void;

    onDragOver?: (e: DragEvent) => void;
}

export class DragAndDropObserver extends CompositeDisposable {
    // A helper to fix issues with repeated DRAG_ENTER / DRAG_LEAVE
    // calls see https://github.com/microsoft/vscode/issues/14470
    // when the element has child elements where the events are fired
    // repeadedly.
    private counter = 0;

    constructor(
        private element: HTMLElement,
        private callbacks: IDragAndDropObserverCallbacks
    ) {
        super();

        this.registerListeners();
    }

    private registerListeners(): void {
        this.addDisposables(
            addDisposableListener(this.element, 'dragenter', (e: DragEvent) => {
                this.counter++;

                this.callbacks.onDragEnter(e);
            })
        );

        this.addDisposables(
            addDisposableListener(this.element, 'dragover', (e: DragEvent) => {
                e.preventDefault(); // needed so that the drop event fires (https://stackoverflow.com/questions/21339924/drop-event-not-firing-in-chrome)

                if (this.callbacks.onDragOver) {
                    this.callbacks.onDragOver(e);
                }
            })
        );

        this.addDisposables(
            addDisposableListener(this.element, 'dragleave', (e: DragEvent) => {
                this.counter--;

                if (this.counter === 0) {
                    this.callbacks.onDragLeave(e);
                }
            })
        );

        this.addDisposables(
            addDisposableListener(this.element, 'dragend', (e: DragEvent) => {
                this.counter = 0;
                this.callbacks.onDragEnd(e);
            })
        );

        this.addDisposables(
            addDisposableListener(this.element, 'drop', (e: DragEvent) => {
                this.counter = 0;
                this.callbacks.onDrop(e);
            })
        );
    }
}

export interface IDraggedCompositeData {
    eventData: DragEvent;
    dragAndDropData: any;
}

export interface ICompositeDragAndDropObserverCallbacks {
    onDragEnter?: (e: IDraggedCompositeData) => void;
    onDragLeave?: (e: IDraggedCompositeData) => void;
    onDrop?: (e: IDraggedCompositeData) => void;
    onDragOver?: (e: IDraggedCompositeData) => void;
    onDragStart?: (e: IDraggedCompositeData) => void;
    onDragEnd?: (e: IDraggedCompositeData) => void;
}
