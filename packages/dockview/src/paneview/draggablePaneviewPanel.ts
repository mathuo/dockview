import { DragHandler } from '../dnd/abstractDragHandler';
import { getPaneData, LocalSelectionTransfer } from '../dnd/dataTransfer';
import { Droptarget, DroptargetEvent, Position } from '../dnd/droptarget';
import { PaneTransfer } from '../dnd/dataTransfer';
import { Emitter, Event } from '../events';
import { IDisposable } from '../lifecycle';
import { Orientation } from '../splitview/core/splitview';
import {
    IPaneviewPanel,
    PanePanelInitParameter,
    PaneviewPanel,
} from './paneviewPanel';
import { addClasses } from '../dom';

interface ViewContainer {
    readonly title: string;
    readonly icon: string;
}

interface ViewContainerModel {
    readonly title: string;
    readonly icon: string;
    readonly onDidAdd: Event<void>;
    readonly onDidRemove: Event<void>;
}

interface IViewContainerService {
    getViewContainerById(id: string): ViewContainer;
    getViewContainerModel(container: ViewContainer): ViewContainerModel;
}

export interface PaneviewDropEvent2 extends DroptargetEvent {
    panel: IPaneviewPanel;
    getData: () => PaneTransfer | undefined;
}

export abstract class DraggablePaneviewPanel extends PaneviewPanel {
    private handler: DragHandler | undefined;
    private target: Droptarget | undefined;

    private readonly _onDidDrop = new Emitter<PaneviewDropEvent2>();
    readonly onDidDrop = this._onDidDrop.event;

    constructor(
        id: string,
        component: string,
        headerComponent: string | undefined,
        orientation: Orientation,
        isExpanded: boolean,
        disableDnd: boolean
    ) {
        super(id, component, headerComponent, orientation, isExpanded);

        if (!disableDnd) {
            this.initDragFeatures();
        }
    }

    private initDragFeatures() {
        if (!this.header) {
            return;
        }

        const id = this.id;
        this.header.draggable = true;

        this.handler = new (class PaneDragHandler extends DragHandler {
            getData(): IDisposable {
                LocalSelectionTransfer.getInstance().setData(
                    [new PaneTransfer('paneview', id)],
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
            validOverlays: 'vertical',
            canDisplayOverlay: (event: DragEvent) => {
                const data = getPaneData();

                if (!data) {
                    return true;
                }

                return data.paneId !== this.id;
            },
        });

        this.addDisposables(
            this._onDidDrop,
            this.handler,
            this.target,
            this.target.onDrop((event) => {
                const data = getPaneData();

                if (!data) {
                    this._onDidDrop.fire({
                        ...event,
                        panel: this,
                        getData: () => getPaneData(),
                    });
                    return;
                }

                const containerApi = (this.params! as PanePanelInitParameter)
                    .containerApi;
                const panelId = data.paneId;

                const existingPanel = containerApi.getPanel(panelId);
                if (!existingPanel) {
                    this._onDidDrop.fire({
                        ...event,
                        panel: this,
                        getData: () => getPaneData(),
                    });
                    return;
                }

                const allPanels = containerApi.getPanels();

                const fromIndex = allPanels.indexOf(existingPanel);
                let toIndex = containerApi.getPanels().indexOf(this);

                if (
                    event.position === Position.Left ||
                    event.position === Position.Top
                ) {
                    toIndex = Math.max(0, toIndex - 1);
                }
                if (
                    event.position === Position.Right ||
                    event.position === Position.Bottom
                ) {
                    if (fromIndex > toIndex) {
                        toIndex++;
                    }
                    toIndex = Math.min(allPanels.length - 1, toIndex);
                }

                containerApi.movePanel(fromIndex, toIndex);
            })
        );
    }
}
