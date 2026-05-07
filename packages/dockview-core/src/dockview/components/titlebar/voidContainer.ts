import {
    getPanelData,
    LocalSelectionTransfer,
    PanelTransfer,
} from '../../../dnd/dataTransfer';
import {
    Droptarget,
    DroptargetEvent,
    WillShowOverlayEvent,
} from '../../../dnd/droptarget';
import { PointerDragSource } from '../../../dnd/pointer/pointerDragSource';
import { PointerDropTarget } from '../../../dnd/pointer/pointerDropTarget';
import { DockviewComponent } from '../../dockviewComponent';
import { addDisposableListener, Emitter, Event } from '../../../events';
import { CompositeDisposable } from '../../../lifecycle';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { DockviewGroupPanelModel } from '../../dockviewGroupPanelModel';
import { toggleClass } from '../../../dom';

export class VoidContainer extends CompositeDisposable {
    private readonly _element: HTMLElement;
    /**
     * The HTML5 drop target stays for external drops (OS file drops,
     * third-party HTML5-DnD libraries). Internal drags are pointer-driven
     * and routed through `pointerDropTarget`.
     */
    private readonly dropTarget: Droptarget;
    private readonly pointerDropTarget: PointerDropTarget;
    private readonly pointerDragSource: PointerDragSource;
    private readonly panelTransfer =
        LocalSelectionTransfer.getInstance<PanelTransfer>();

    private readonly _onDrop = new Emitter<DroptargetEvent>();
    readonly onDrop: Event<DroptargetEvent> = this._onDrop.event;

    private readonly _onDragStart = new Emitter<PointerEvent>();
    readonly onDragStart = this._onDragStart.event;

    readonly onWillShowOverlay: Event<WillShowOverlayEvent>;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        private readonly accessor: DockviewComponent,
        private readonly group: DockviewGroupPanel
    ) {
        super();

        this._element = document.createElement('div');

        this._element.className = 'dv-void-container';

        toggleClass(
            this._element,
            'dv-draggable',
            !this.accessor.options.disableDnd
        );

        this.addDisposables(
            this._onDrop,
            this._onDragStart,
            addDisposableListener(this._element, 'pointerdown', () => {
                this.accessor.doSetGroupActive(this.group);
            })
        );

        const canDisplayOverlay = (
            event: DragEvent | PointerEvent,
            position: import('../../../dnd/droptarget').Position
        ): boolean => {
            const data = getPanelData();

            if (data && this.accessor.id === data.viewId) {
                return true;
            }

            return group.model.canDisplayOverlay(
                event,
                position,
                'header_space'
            );
        };

        this.dropTarget = new Droptarget(this._element, {
            acceptedTargetZones: ['center'],
            canDisplayOverlay,
            getOverrideTarget: () => group.model.dropTargetContainer?.model,
        });

        this.pointerDropTarget = new PointerDropTarget(this._element, {
            acceptedTargetZones: ['center'],
            canDisplayOverlay,
            getOverrideTarget: () => group.model.dropTargetContainer?.model,
        });

        this.pointerDragSource = new PointerDragSource(this._element, {
            // Mouse drags now go through the pointer path too.
            touchOnly: false,
            isCancelled: () => {
                if (this.accessor.options.disableDnd) {
                    return true;
                }
                if (
                    this.group.api?.location?.type === 'edge' &&
                    this.group.size === 0
                ) {
                    return true;
                }
                return false;
            },
            getData: () => {
                this.panelTransfer.setData(
                    [new PanelTransfer(this.accessor.id, this.group.id, null)],
                    PanelTransfer.prototype
                );
                return {
                    dispose: () => {
                        this.panelTransfer.clearData(PanelTransfer.prototype);
                    },
                };
            },
            onDragStart: (event) => {
                this._onDragStart.fire(event);
            },
        });

        this.onWillShowOverlay = Event.any(
            this.dropTarget.onWillShowOverlay,
            this.pointerDropTarget.onWillShowOverlay
        );

        this.addDisposables(
            this.dropTarget.onDrop((event) => {
                this._onDrop.fire(event);
            }),
            this.pointerDropTarget.onDrop((event) => {
                this._onDrop.fire(event);
            }),
            this.dropTarget,
            this.pointerDropTarget,
            this.pointerDragSource
        );
    }

    updateDragAndDropState(): void {
        const disabled = !!this.accessor.options.disableDnd;
        toggleClass(this._element, 'dv-draggable', !disabled);
        this.pointerDragSource.setDisabled(disabled);
    }
}
