import { DragHandler } from '../dnd/abstractDragHandler';
import { getPaneData, LocalSelectionTransfer } from '../dnd/dataTransfer';
import {
    Droptarget,
    DroptargetEvent,
    PaneTransfer,
    Position,
} from '../dnd/droptarget';
import { Emitter, Event } from '../events';
import { IDisposable } from '../lifecycle';
import { Orientation } from '../splitview/core/splitview';
import { PanePanelInitParameter, PaneviewPanel } from './paneviewPanel';

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

export abstract class DraggablePaneviewPanel extends PaneviewPanel {
    private handler: DragHandler | undefined;
    private target: Droptarget | undefined;

    private readonly _onDidDrop = new Emitter<DroptargetEvent>();
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
        const id = this.id;
        this.header!.draggable = true;
        this.header!.tabIndex = 0;

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
        })(this.header!);

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
                    this._onDidDrop.fire(event);
                    return;
                }

                const containerApi = (this.params! as PanePanelInitParameter)
                    .containerApi;
                const id = data.paneId;

                const existingPanel = containerApi.getPanel(id);
                if (!existingPanel) {
                    this._onDidDrop.fire(event);
                    return;
                }

                const fromIndex = containerApi
                    .getPanels()
                    .indexOf(existingPanel);
                let toIndex = containerApi.getPanels().indexOf(this);

                if (
                    event.position === Position.Right ||
                    event.position === Position.Bottom
                ) {
                    toIndex = Math.max(0, toIndex + 1);
                }

                containerApi.movePanel(fromIndex, toIndex);
            })
        );
    }
}
