import { last } from '../../array';
import { DragHandler } from '../../dnd/abstractDragHandler';
import {
    getPanelData,
    LocalSelectionTransfer,
    PanelTransfer,
} from '../../dnd/dataTransfer';
import { Droptarget, DroptargetEvent } from '../../dnd/droptarget';
import { addGhostImage } from '../../dnd/ghost';
import { DockviewComponent } from '../../dockview/dockviewComponent';
import { addDisposableListener, Emitter, Event } from '../../events';
import { CompositeDisposable, IDisposable } from '../../lifecycle';
import { DockviewDropTargets } from '../dnd';
import { GroupPanel } from '../groupviewPanel';

class CustomDragHandler extends DragHandler {
    private readonly panelTransfer =
        LocalSelectionTransfer.getInstance<PanelTransfer>();

    constructor(
        element: HTMLElement,
        private readonly accessorId: string,
        private readonly group: GroupPanel
    ) {
        super(element);
    }

    getData(dataTransfer: DataTransfer | null): IDisposable {
        this.panelTransfer.setData(
            [new PanelTransfer(this.accessorId, this.group.id, null)],
            PanelTransfer.prototype
        );

        const style = window.getComputedStyle(this.el);

        const bgColor = style.getPropertyValue(
            '--dv-activegroup-visiblepanel-tab-background-color'
        );
        const color = style.getPropertyValue(
            '--dv-activegroup-visiblepanel-tab-color'
        );

        if (dataTransfer) {
            const ghostElement = document.createElement('div');

            ghostElement.style.backgroundColor = bgColor;
            ghostElement.style.color = color;
            ghostElement.style.padding = '2px 8px';
            ghostElement.style.height = '24px';
            ghostElement.style.fontSize = '11px';
            ghostElement.style.lineHeight = '20px';
            ghostElement.style.borderRadius = '12px';
            ghostElement.style.position = 'absolute';
            ghostElement.textContent = `Multiple Panels (${this.group.size})`;

            addGhostImage(dataTransfer, ghostElement);
        }

        return {
            dispose: () => {
                this.panelTransfer.clearData(PanelTransfer.prototype);
            },
        };
    }

    public dispose(): void {
        //
    }
}

export class VoidContainer extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private readonly voidDropTarget: Droptarget;

    private readonly _onDrop = new Emitter<DroptargetEvent>();
    readonly onDrop: Event<DroptargetEvent> = this._onDrop.event;

    get element() {
        return this._element;
    }

    constructor(
        private readonly accessor: DockviewComponent,
        private readonly group: GroupPanel
    ) {
        super();

        this._element = document.createElement('div');

        this._element.className = 'void-container';
        this._element.tabIndex = 0;
        this._element.draggable = true;

        this.addDisposables(
            this._onDrop,
            addDisposableListener(this._element, 'click', () => {
                this.accessor.doSetGroupActive(this.group);
            })
        );

        const handler = new CustomDragHandler(
            this._element,
            accessor.id,
            group
        );

        this.voidDropTarget = new Droptarget(this._element, {
            validOverlays: 'none',
            canDisplayOverlay: (event) => {
                const data = getPanelData();

                if (data && this.accessor.id === data.viewId) {
                    // don't show the overlay if the tab being dragged is the last panel of this group
                    return last(this.group.panels)?.id !== data.panelId;
                }

                return group.model.canDisplayOverlay(
                    event,
                    DockviewDropTargets.Panel
                );
            },
        });

        this.addDisposables(
            handler,
            this.voidDropTarget.onDrop((event) => {
                this._onDrop.fire(event);
            }),
            this.voidDropTarget
        );
    }
}
