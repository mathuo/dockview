import {
    getPanelData,
    LocalSelectionTransfer,
    PanelTransfer,
} from '../../../dnd/dataTransfer';
import {
    Droptarget,
    DroptargetEvent,
    Position,
    WillShowOverlayEvent,
} from '../../../dnd/droptarget';
import { GroupDragHandler } from '../../../dnd/groupDragHandler';
import { PointerDragSource } from '../../../dnd/pointer/pointerDragSource';
import { PointerDropTarget } from '../../../dnd/pointer/pointerDropTarget';
import { PointerGhost } from '../../../dnd/pointer/pointerGhost';
import { DockviewComponent } from '../../dockviewComponent';
import { addDisposableListener, Emitter, Event } from '../../../events';
import { CompositeDisposable } from '../../../lifecycle';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { DockviewGroupPanelModel } from '../../dockviewGroupPanelModel';
import { toggleClass } from '../../../dom';

export class VoidContainer extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private readonly dropTarget: Droptarget;
    private readonly pointerDropTarget: PointerDropTarget;
    private readonly handler: GroupDragHandler;
    private readonly pointerDragSource: PointerDragSource;
    private readonly panelTransfer =
        LocalSelectionTransfer.getInstance<PanelTransfer>();

    private readonly _onDrop = new Emitter<DroptargetEvent>();
    readonly onDrop: Event<DroptargetEvent> = this._onDrop.event;

    private readonly _onDragStart = new Emitter<DragEvent | PointerEvent>();
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
        this._element.draggable = !this.accessor.options.disableDnd;

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

        this.handler = new GroupDragHandler(
            this._element,
            accessor,
            group,
            !!this.accessor.options.disableDnd
        );

        const canDisplayOverlay = (
            event: DragEvent | PointerEvent,
            position: Position
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
            isCancelled: () => {
                if (this.accessor.options.disableDnd) {
                    return true;
                }
                // Floating groups are touch-draggable: the long-press
                // initiation acts as the deliberate gesture that
                // shift+drag provides for the HTML5 path.
                if (
                    this.group.api.location.type === 'edge' &&
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
            createGhost: (event) => {
                const ghostEl = document.createElement('div');
                const style = window.getComputedStyle(this._element);
                const bgColor = style.getPropertyValue(
                    '--dv-activegroup-visiblepanel-tab-background-color'
                );
                const color = style.getPropertyValue(
                    '--dv-activegroup-visiblepanel-tab-color'
                );
                ghostEl.style.backgroundColor = bgColor;
                ghostEl.style.color = color;
                ghostEl.style.padding = '2px 8px';
                ghostEl.style.height = '24px';
                ghostEl.style.fontSize = '11px';
                ghostEl.style.lineHeight = '20px';
                ghostEl.style.borderRadius = '12px';
                ghostEl.style.whiteSpace = 'nowrap';
                ghostEl.style.boxSizing = 'border-box';
                ghostEl.textContent = `Multiple Panels (${this.group.size})`;
                return new PointerGhost({
                    element: ghostEl,
                    initialX: event.clientX,
                    initialY: event.clientY,
                    offsetX: 30,
                    offsetY: -10,
                    owner: this._element,
                });
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
            this.handler,
            this.handler.onDragStart((event) => {
                this._onDragStart.fire(event);
            }),
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
        this._element.draggable = !disabled;
        toggleClass(this._element, 'dv-draggable', !disabled);
        this.handler.setDisabled(disabled);
        this.pointerDragSource.setDisabled(disabled);
    }
}
