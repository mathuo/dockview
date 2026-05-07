import { PaneviewApi } from '../api/component.api';
import {
    getPaneData,
    LocalSelectionTransfer,
    PaneTransfer,
} from '../dnd/dataTransfer';
import { Droptarget, DroptargetEvent } from '../dnd/droptarget';
import { PointerDragSource } from '../dnd/pointer/pointerDragSource';
import { PointerDropTarget } from '../dnd/pointer/pointerDropTarget';
import { Emitter, Event } from '../events';
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
    private pointerSource: PointerDragSource | undefined;
    /**
     * The HTML5 drop target stays for external drops (OS file drops,
     * third-party HTML5-DnD libraries). Internal drags are pointer-driven
     * and routed through `pointerTarget`.
     */
    private target: Droptarget | undefined;
    private pointerTarget: PointerDropTarget | undefined;

    private readonly _onDidDrop = new Emitter<PaneviewDidDropEvent>();
    readonly onDidDrop = this._onDidDrop.event;

    private readonly _onUnhandledDragOverEvent =
        new Emitter<PaneviewDndOverlayEvent>();
    readonly onUnhandledDragOverEvent: Event<PaneviewDndOverlayEvent> =
        this._onUnhandledDragOverEvent.event;

    readonly accessor: IPaneviewComponent;

    constructor(options: {
        accessor: IPaneviewComponent;
        id: string;
        component: string;
        headerComponent: string | undefined;
        orientation: Orientation;
        isExpanded: boolean;
        disableDnd: boolean;
        headerSize: number;
        minimumBodySize: number;
        maximumBodySize: number;
    }) {
        super({
            id: options.id,
            component: options.component,
            headerComponent: options.headerComponent,
            orientation: options.orientation,
            isExpanded: options.isExpanded,
            isHeaderVisible: true,
            headerSize: options.headerSize,
            minimumBodySize: options.minimumBodySize,
            maximumBodySize: options.maximumBodySize,
        });

        this.accessor = options.accessor;

        this.addDisposables(this._onDidDrop, this._onUnhandledDragOverEvent);

        if (!options.disableDnd) {
            this.initDragFeatures();
        }
    }

    private initDragFeatures(): void {
        if (!this.header) {
            return;
        }

        const id = this.id;
        const accessorId = this.accessor.id;

        this.pointerSource = new PointerDragSource(this.header, {
            // Mouse pane drags use the pointer path too.
            touchOnly: false,
            getData: () => {
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
            },
        });

        const canDisplayOverlay = (
            event: DragEvent | PointerEvent,
            position: import('../dnd/droptarget').Position
        ): boolean => {
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
        };

        this.target = new Droptarget(this.element, {
            acceptedTargetZones: ['top', 'bottom'],
            overlayModel: {
                activationSize: { type: 'percentage', value: 50 },
            },
            canDisplayOverlay,
        });

        this.pointerTarget = new PointerDropTarget(this.element, {
            acceptedTargetZones: ['top', 'bottom'],
            overlayModel: {
                activationSize: { type: 'percentage', value: 50 },
            },
            canDisplayOverlay,
        });

        this.addDisposables(
            this._onDidDrop,
            this.pointerSource,
            this.target,
            this.pointerTarget,
            this.target.onDrop((event) => {
                this.onDrop(event);
            }),
            this.pointerTarget.onDrop((event) => {
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
