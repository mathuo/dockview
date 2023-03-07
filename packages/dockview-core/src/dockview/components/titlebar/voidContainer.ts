import { last } from '../../../array';
import { getPanelData } from '../../../dnd/dataTransfer';
import { Droptarget, DroptargetEvent } from '../../../dnd/droptarget';
import { GroupDragHandler } from '../../../dnd/groupDragHandler';
import { DockviewComponent } from '../../dockviewComponent';
import { addDisposableListener, Emitter, Event } from '../../../events';
import { CompositeDisposable } from '../../../lifecycle';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { DockviewDropTargets } from '../../types';

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
        private readonly group: DockviewGroupPanel
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

        const handler = new GroupDragHandler(this._element, accessor.id, group);

        this.voidDropTarget = new Droptarget(this._element, {
            acceptedTargetZones: ['center'],
            canDisplayOverlay: (event, position) => {
                const data = getPanelData();

                if (data && this.accessor.id === data.viewId) {
                    if (
                        data.panelId === null &&
                        data.groupId === this.group.id
                    ) {
                        // don't allow group move to drop on self
                        return false;
                    }

                    // don't show the overlay if the tab being dragged is the last panel of this group
                    return last(this.group.panels)?.id !== data.panelId;
                }

                return group.model.canDisplayOverlay(
                    event,
                    position,
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
