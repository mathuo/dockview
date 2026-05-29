import { getPanelData } from '../../../dnd/dataTransfer';
import {
    DroptargetEvent,
    IDropTarget,
    Position,
    WillShowOverlayEvent,
} from '../../../dnd/droptarget';
import { html5Backend, pointerBackend } from '../../../dnd/backend';
import { DockviewComponent } from '../../dockviewComponent';
import { addDisposableListener, Emitter, Event } from '../../../events';
import { CompositeDisposable } from '../../../lifecycle';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { quasiPreventDefault } from '../../../dom';
import { GroupDragSource } from './groupDragSource';

export class VoidContainer extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private readonly dropTarget: IDropTarget;
    private readonly pointerDropTarget: IDropTarget;
    private readonly dragSource: GroupDragSource;

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

        this.addDisposables(
            this._onDrop,
            this._onDragStart,
            addDisposableListener(this._element, 'pointerdown', () => {
                this.accessor.doSetGroupActive(this.group);
            }),
            // Shift+pointerdown marks the event so the group's overlay
            // drag (move-by-floating) sees it was consumed and doesn't
            // fire alongside the HTML5 drag. quasiPreventDefault sets the
            // marker without calling preventDefault — that would also
            // block dragstart, which we need to fire.
            addDisposableListener(
                this._element,
                'pointerdown',
                (e) => {
                    if (e.shiftKey) {
                        quasiPreventDefault(e);
                    }
                },
                true
            )
        );

        // The drag-source (move-the-float disambiguation, redock ghost and
        // group-level PanelTransfer) is shared with the floating title bar.
        this.dragSource = new GroupDragSource({
            element: this._element,
            accessor: this.accessor,
            group: this.group,
            // The void container is the float's move handle only when there is
            // no dedicated title bar. When a title bar moves the float (the
            // overlay is `.dv-resize-container-with-titlebar`), the void
            // container redocks with a plain drag, like a group in the grid.
            isFloatingMoveHandle: () =>
                !this._element.closest('.dv-resize-container-with-titlebar'),
        });

        const canDisplayOverlay = (
            event: DragEvent | PointerEvent,
            position: Position
        ): boolean => {
            if (this.group.api.locked) {
                // Dropping on the void/header space adds the panel
                // to this group, which `locked` is meant to prevent
                // (both `true` and `'no-drop-target'`).
                return false;
            }

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

        this.dropTarget = html5Backend.createDropTarget(this._element, {
            acceptedTargetZones: ['center'],
            canDisplayOverlay,
            getOverrideTarget: () => group.model.dropTargetContainer?.model,
        });

        this.pointerDropTarget = pointerBackend.createDropTarget(
            this._element,
            {
                acceptedTargetZones: ['center'],
                canDisplayOverlay,
                getOverrideTarget: () => group.model.dropTargetContainer?.model,
            }
        );

        this.onWillShowOverlay = Event.any(
            this.dropTarget.onWillShowOverlay,
            this.pointerDropTarget.onWillShowOverlay
        );

        this.addDisposables(
            this.dragSource,
            this.dragSource.onDragStart((event) => {
                this._onDragStart.fire(event);
            }),
            this.dropTarget.onDrop((event) => {
                this._onDrop.fire(event);
            }),
            this.pointerDropTarget.onDrop((event) => {
                this._onDrop.fire(event);
            }),
            this.dropTarget,
            this.pointerDropTarget
        );
    }

    updateDragAndDropState(): void {
        this.dragSource.updateDragAndDropState();
    }
}
