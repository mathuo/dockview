import { addDisposableListener, Emitter, Event } from '../events';
import { CompositeDisposable, IDisposable } from '../lifecycle';
import {
    getPanelData,
    LocalSelectionTransfer,
    PanelTransfer,
} from '../dnd/dataTransfer';
import { toggleClass } from '../dom';
import { IDockviewComponent } from '../dockview/dockviewComponent';
import { ITabRenderer } from './types';
import { IDockviewPanel } from './groupPanel';
import { GroupPanel } from './groupviewPanel';
import { DroptargetEvent, Droptarget } from '../dnd/droptarget';
import { DockviewDropTargets } from './dnd';
import { DragHandler } from '../dnd/abstractDragHandler';

export enum MouseEventKind {
    CLICK = 'CLICK',
}

export interface LayoutMouseEvent {
    readonly kind: MouseEventKind;
    readonly event: MouseEvent;
    readonly panel?: IDockviewPanel;
    readonly tab?: boolean;
}

export interface ITab {
    readonly panelId: string;
    readonly element: HTMLElement;
    setContent: (element: ITabRenderer) => void;
    onChanged: Event<LayoutMouseEvent>;
    onDrop: Event<DroptargetEvent>;
    setActive(isActive: boolean): void;
}

export class Tab extends CompositeDisposable implements ITab {
    private readonly _element: HTMLElement;
    private readonly droptarget: Droptarget;
    private content?: ITabRenderer;

    private readonly _onChanged = new Emitter<LayoutMouseEvent>();
    readonly onChanged: Event<LayoutMouseEvent> = this._onChanged.event;

    private readonly _onDropped = new Emitter<DroptargetEvent>();
    readonly onDrop: Event<DroptargetEvent> = this._onDropped.event;

    public get element() {
        return this._element;
    }

    constructor(
        public readonly panelId: string,
        private readonly accessor: IDockviewComponent,
        private readonly group: GroupPanel
    ) {
        super();

        this.addDisposables(this._onChanged, this._onDropped);

        this._element = document.createElement('div');
        this._element.className = 'tab';
        this._element.tabIndex = 0;
        this._element.draggable = true;

        toggleClass(this.element, 'inactive-tab', true);

        this.addDisposables(
            new (class Handler extends DragHandler {
                private readonly panelTransfer =
                    LocalSelectionTransfer.getInstance<PanelTransfer>();

                getData(): IDisposable {
                    this.panelTransfer.setData(
                        [new PanelTransfer(accessor.id, group.id, panelId)],
                        PanelTransfer.prototype
                    );

                    return {
                        dispose: () => {
                            this.panelTransfer.clearData(
                                PanelTransfer.prototype
                            );
                        },
                    };
                }

                public dispose(): void {
                    //
                }
            })(this._element)
        );

        this.addDisposables(
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
            })
        );

        this.droptarget = new Droptarget(this._element, {
            validOverlays: 'none',
            canDisplayOverlay: (event) => {
                const data = getPanelData();
                if (data && this.accessor.id === data.viewId) {
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
