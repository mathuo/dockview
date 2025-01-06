import { PaneviewApi } from '../api/component.api';
import { DragHandler } from '../dnd/abstractDragHandler';
import {
    getPaneData,
    LocalSelectionTransfer,
    PaneTransfer,
} from '../dnd/dataTransfer';
import { Droptarget, DroptargetEvent } from '../dnd/droptarget';
import { Emitter, Event } from '../events';
import { IDisposable } from '../lifecycle';
import { Orientation } from '../splitview/splitview';
import {
    PaneviewDndOverlayEvent,
    PaneviewUnhandledDragOverEvent,
} from './options';
import { IPaneviewComponent } from './paneviewComponent';
import {
    IPaneviewPanel,
    PanePanelInitParameter,
    PaneviewPanel,
} from './paneviewPanel';

export interface PaneviewDidDropEvent extends DroptargetEvent {
    panel: IPaneviewPanel;
    getData: () => PaneTransfer | undefined;
    api: PaneviewApi;
}

export abstract class DraggablePaneviewPanel extends PaneviewPanel {
    private handler: DragHandler | undefined;
    private target: Droptarget | undefined;

    private readonly _onDidDrop = new Emitter<PaneviewDidDropEvent>();
    readonly onDidDrop = this._onDidDrop.event;

    private readonly _onUnhandledDragOverEvent =
        new Emitter<PaneviewDndOverlayEvent>();
    readonly onUnhandledDragOverEvent: Event<PaneviewDndOverlayEvent> =
        this._onUnhandledDragOverEvent.event;

    constructor(
        private readonly accessor: IPaneviewComponent,
        id: string,
        component: string,
        headerComponent: string | undefined,
        orientation: Orientation,
        isExpanded: boolean,
        disableDnd: boolean
    ) {
        super(id, component, headerComponent, orientation, isExpanded, true);

        this.addDisposables(this._onDidDrop, this._onUnhandledDragOverEvent);

        if (!disableDnd) {
            this.initDragFeatures();
        }
    }

    private initDragFeatures(): void {
        if (!this.header) {
            return;
        }

        const id = this.id;
        const accessorId = this.accessor.id;
        this.header.draggable = true;

        this.handler = new (class PaneDragHandler extends DragHandler {
            getData(): IDisposable {
                LocalSelectionTransfer.getInstance().setData(
                    [new PaneTransfer(accessorId, id)],
                    PaneTransfer.prototype
                );

                return {
                    dispose: () => {
                        LocalSelectionTransfer.getInstance().clearData(
                            PaneTransfer.prototype
                        );
                    },
                };
            }
        })(this.header);

        this.target = new Droptarget(this.element, {
            acceptedTargetZones: ['top', 'bottom'],
            overlayModel: {
                activationSize: { type: 'percentage', value: 50 },
            },
            canDisplayOverlay: (event, position) => {
                const data = getPaneData();

                if (data) {
                    if (
                        data.paneId !== this.id &&
                        data.viewId === this.accessor.id
                    ) {
                        return true;
                    }
                }

                const firedEvent = new PaneviewUnhandledDragOverEvent(
                    event,
                    position,
                    getPaneData,
                    this
                );

                this._onUnhandledDragOverEvent.fire(firedEvent);

                return firedEvent.isAccepted;
            },
        });

        this.addDisposables(
            this._onDidDrop,
            this.handler,
            this.target,
            this.target.onDrop((event) => {
                this.onDrop(event);
            })
        );
    }

    private onDrop(event: DroptargetEvent): void {
        const data = getPaneData();

        if (!data || data.viewId !== this.accessor.id) {
            // if there is no local drag event for this panel
            // or if the drag event was creating by another Paneview instance
            this._onDidDrop.fire({
                ...event,
                panel: this,
                api: new PaneviewApi(this.accessor),
                getData: getPaneData,
            });
            return;
        }

        const containerApi = (this._params! as PanePanelInitParameter)
            .containerApi;
        const panelId = data.paneId;

        const existingPanel = containerApi.getPanel(panelId);
        if (!existingPanel) {
            // if the panel doesn't exist
            this._onDidDrop.fire({
                ...event,
                panel: this,
                getData: getPaneData,
                api: new PaneviewApi(this.accessor),
            });
            return;
        }

        const allPanels = containerApi.panels;

        const fromIndex = allPanels.indexOf(existingPanel);
        let toIndex = containerApi.panels.indexOf(this);

        if (event.position === 'left' || event.position === 'top') {
            toIndex = Math.max(0, toIndex - 1);
        }
        if (event.position === 'right' || event.position === 'bottom') {
            if (fromIndex > toIndex) {
                toIndex++;
            }
            toIndex = Math.min(allPanels.length - 1, toIndex);
        }

        containerApi.movePanel(fromIndex, toIndex);
    }
}
