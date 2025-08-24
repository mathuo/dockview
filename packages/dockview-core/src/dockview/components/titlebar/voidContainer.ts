import { getPanelData } from '../../../dnd/dataTransfer';
import {
    Droptarget,
    DroptargetEvent,
    WillShowOverlayEvent,
} from '../../../dnd/droptarget';
import { GroupDragHandler } from '../../../dnd/groupDragHandler';
import { DockviewComponent } from '../../dockviewComponent';
import { addDisposableListener, Emitter, Event } from '../../../events';
import { CompositeDisposable } from '../../../lifecycle';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { DockviewGroupPanelModel } from '../../dockviewGroupPanelModel';
import { toggleClass } from '../../../dom';

export class VoidContainer extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private readonly dropTarget: Droptarget;
    private readonly handler: GroupDragHandler;

    private readonly _onDrop = new Emitter<DroptargetEvent>();
    readonly onDrop: Event<DroptargetEvent> = this._onDrop.event;

    private readonly _onDragStart = new Emitter<DragEvent>();
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
        
        toggleClass(this._element, 'dv-draggable', !this.accessor.options.disableDnd);

        this.addDisposables(
            this._onDrop,
            this._onDragStart,
            addDisposableListener(this._element, 'pointerdown', () => {
                this.accessor.doSetGroupActive(this.group);
            })
        );

        this.handler = new GroupDragHandler(this._element, accessor, group, !!this.accessor.options.disableDnd);

        this.dropTarget = new Droptarget(this._element, {
            acceptedTargetZones: ['center'],
            canDisplayOverlay: (event, position) => {
                const data = getPanelData();

                if (data && this.accessor.id === data.viewId) {
                    return true;
                }

                return group.model.canDisplayOverlay(
                    event,
                    position,
                    'header_space'
                );
            },
            getOverrideTarget: () => group.model.dropTargetContainer?.model,
        });

        this.onWillShowOverlay = this.dropTarget.onWillShowOverlay;

        this.addDisposables(
            this.handler,
            this.handler.onDragStart((event) => {
                this._onDragStart.fire(event);
            }),
            this.dropTarget.onDrop((event) => {
                this._onDrop.fire(event);
            }),
            this.dropTarget
        );
    }

    updateDragAndDropState(): void {
        this._element.draggable = !this.accessor.options.disableDnd;
        toggleClass(this._element, 'dv-draggable', !this.accessor.options.disableDnd);
        this.handler.setDisabled(!!this.accessor.options.disableDnd);
    }
}
