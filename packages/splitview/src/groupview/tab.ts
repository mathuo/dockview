import { addDisposableListener, Emitter, Event } from '../events';
import { Droptarget, DroptargetEvent } from '../dnd/droptarget';
import { CompositeDisposable } from '../lifecycle';
import { IGroupview } from './groupview';
import {
    DATA_KEY,
    DragType,
    LocalSelectionTransfer,
} from '../dnd/dataTransfer';
import { toggleClass } from '../dom';
import { IDockviewComponent } from '../dockview/dockviewComponent';
import { PanelHeaderPart } from './types';
import { focusedElement } from '../focusedElement';
import { IGroupPanel } from './groupviewPanel';

export enum MouseEventKind {
    CLICK = 'CLICK',
    CONTEXT_MENU = 'CONTEXT_MENU',
}

export interface LayoutMouseEvent {
    kind: MouseEventKind;
    event: MouseEvent;
    panel?: IGroupPanel;
    tab?: boolean;
}

export interface ITab {
    id: string;
    element: HTMLElement;
    hasActiveDragEvent: boolean;
    setContent: (element: PanelHeaderPart) => void;
    onChanged: Event<LayoutMouseEvent>;
    onDropped: Event<DroptargetEvent>;
    setActive(isActive: boolean): void;
    startDragEvent(): void;
    stopDragEvent(): void;
}

export class Tab extends CompositeDisposable implements ITab {
    private _element: HTMLElement;
    private dragInPlayDetails: { id?: string; isDragging: boolean } = {
        isDragging: false,
    };
    private droptarget: Droptarget;
    private content: PanelHeaderPart;

    private readonly _onChanged = new Emitter<LayoutMouseEvent>();
    readonly onChanged: Event<LayoutMouseEvent> = this._onChanged.event;

    private readonly _onDropped = new Emitter<DroptargetEvent>();
    readonly onDropped: Event<DroptargetEvent> = this._onDropped.event;

    public get element() {
        return this._element;
    }

    public get hasActiveDragEvent() {
        return this.dragInPlayDetails?.isDragging;
    }

    public startDragEvent() {
        this.dragInPlayDetails = { isDragging: true, id: this.accessor.id };
    }

    public stopDragEvent() {
        this.dragInPlayDetails = { isDragging: false, id: undefined };
    }

    constructor(
        public id: string,
        private readonly accessor: IDockviewComponent,
        private group: IGroupview
    ) {
        super();

        this.addDisposables(this._onChanged, this._onDropped);

        this._element = document.createElement('div');
        this._element.className = 'tab';
        this._element.tabIndex = 0;
        this._element.draggable = true;

        this.addDisposables(
            addDisposableListener(this._element, 'dragstart', (event) => {
                this.dragInPlayDetails = {
                    isDragging: true,
                    id: this.accessor.id,
                };

                this.element.classList.add('dragged');
                setTimeout(() => this.element.classList.remove('dragged'), 0);

                const data = JSON.stringify({
                    type: DragType.ITEM,
                    itemId: this.id,
                    groupId: this.group.id,
                });
                LocalSelectionTransfer.getInstance().setData(
                    [data],
                    this.dragInPlayDetails.id
                );

                if (event.dataTransfer) {
                    event.dataTransfer.setData(DATA_KEY, data);
                    event.dataTransfer.effectAllowed = 'move';
                }
            }),
            addDisposableListener(this._element, 'dragend', (ev) => {
                // drop events fire before dragend so we can remove this safely
                LocalSelectionTransfer.getInstance().clearData(
                    this.dragInPlayDetails.id
                );
                this.dragInPlayDetails = {
                    isDragging: false,
                    id: undefined,
                };
            }),
            addDisposableListener(this._element, 'mousedown', (event) => {
                if (event.defaultPrevented) {
                    return;
                }
                /**
                 * TODO: alternative to stopPropagation
                 *
                 * I need to stop the event propagation here since otherwise it'll be intercepted by event handlers
                 * on the tab-container. I cannot use event.preventDefault() since I need the on DragStart event to occur
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
                    this._onChanged.fire({ kind: MouseEventKind.CLICK, event });
                }, 0);
            }),
            addDisposableListener(this._element, 'contextmenu', (event) => {
                this._onChanged.fire({
                    kind: MouseEventKind.CONTEXT_MENU,
                    event,
                });
            })
        );

        this.droptarget = new Droptarget(this._element, {
            isDirectional: false,
            isDisabled: () => this.dragInPlayDetails.isDragging,
            id: this.accessor.id,
            enableExternalDragEvents: this.accessor.options
                .enableExternalDragEvents,
        });

        this.addDisposables(
            this.droptarget.onDidChange((event) => {
                event.event.preventDefault();
                this._onDropped.fire(event);
            })
        );
    }

    public setActive(isActive: boolean) {
        toggleClass(this.element, 'active-tab', isActive);
        toggleClass(this.element, 'inactive-tab', !isActive);
    }

    public setContent(part: PanelHeaderPart) {
        if (this.content) {
            this._element.removeChild(this.content.element);
        }
        this.content = part;
        this._element.appendChild(this.content.element);
    }

    public dispose() {
        super.dispose();
        this.droptarget.dispose();
    }
}
