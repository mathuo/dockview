import { addDisposableListener, Emitter, Event } from '../events';
import { CompositeDisposable } from '../lifecycle';
import {
    getPanelData,
    LocalSelectionTransfer,
    PanelTransfer,
} from '../dnd/dataTransfer';
import { getElementsByTagName, toggleClass } from '../dom';
import { IDockviewComponent } from '../dockview/dockviewComponent';
import { ITabRenderer } from './types';
import { IGroupPanel } from './groupPanel';
import { GroupviewPanel } from './groupviewPanel';
import { DroptargetEvent, Droptarget } from '../dnd/droptarget';
import { DockviewDropTargets } from './dnd';

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
    panelId: string;
    element: HTMLElement;
    setContent: (element: ITabRenderer) => void;
    onChanged: Event<LayoutMouseEvent>;
    onDrop: Event<DroptargetEvent>;
    setActive(isActive: boolean): void;
}

export class Tab extends CompositeDisposable implements ITab {
    private _element: HTMLElement;
    private droptarget: Droptarget;
    private content?: ITabRenderer;

    private readonly _onChanged = new Emitter<LayoutMouseEvent>();
    readonly onChanged: Event<LayoutMouseEvent> = this._onChanged.event;

    private readonly _onDropped = new Emitter<DroptargetEvent>();
    readonly onDrop: Event<DroptargetEvent> = this._onDropped.event;

    private readonly panelTransfer =
        LocalSelectionTransfer.getInstance<PanelTransfer>();

    public get element() {
        return this._element;
    }

    private iframes: HTMLElement[] = [];

    constructor(
        public panelId: string,
        private readonly accessor: IDockviewComponent,
        private group: GroupviewPanel
    ) {
        super();

        this.addDisposables(this._onChanged, this._onDropped);

        this._element = document.createElement('div');
        this._element.className = 'tab';
        this._element.tabIndex = 0;
        this._element.draggable = true;

        this.addDisposables(
            addDisposableListener(this._element, 'dragstart', (event) => {
                this.iframes = [
                    ...getElementsByTagName('iframe'),
                    ...getElementsByTagName('webview'),
                ];

                for (const iframe of this.iframes) {
                    iframe.style.pointerEvents = 'none';
                }

                this.element.classList.add('dragged');
                setTimeout(() => this.element.classList.remove('dragged'), 0);

                this.panelTransfer.setData(
                    [
                        new PanelTransfer(
                            this.accessor.id,
                            this.group.id,
                            this.panelId
                        ),
                    ],
                    PanelTransfer.prototype
                );

                if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = 'move';
                }
            }),
            addDisposableListener(this._element, 'dragend', (ev) => {
                for (const iframe of this.iframes) {
                    iframe.style.pointerEvents = 'auto';
                }
                this.iframes = [];

                this.panelTransfer.clearData(PanelTransfer.prototype);
            }),
            addDisposableListener(this._element, 'mousedown', (event) => {
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

                this._onChanged.fire({ kind: MouseEventKind.CLICK, event });
            }),
            addDisposableListener(this._element, 'contextmenu', (event) => {
                this._onChanged.fire({
                    kind: MouseEventKind.CONTEXT_MENU,
                    event,
                });
            })
        );

        this.droptarget = new Droptarget(this._element, {
            validOverlays: 'none',
            canDisplayOverlay: (event) => {
                const data = getPanelData();
                if (data) {
                    return this.panelId !== data.panelId;
                }

                return this.group.model.canDisplayOverlay(
                    event,
                    DockviewDropTargets.Tab
                );
            },
        });

        this.addDisposables(
            this.droptarget.onDrop((event) => {
                this._onDropped.fire(event);
            })
        );
    }

    public setActive(isActive: boolean) {
        toggleClass(this.element, 'active-tab', isActive);
        toggleClass(this.element, 'inactive-tab', !isActive);
    }

    public setContent(part: ITabRenderer) {
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
