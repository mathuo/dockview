import { addDisposableListener, Emitter, Event } from '../../../events';
import { CompositeDisposable, IDisposable } from '../../../lifecycle';
import {
    getPanelData,
    LocalSelectionTransfer,
    PanelTransfer,
} from '../../../dnd/dataTransfer';
import { toggleClass } from '../../../dom';
import { DockviewComponent } from '../../dockviewComponent';
import { ITabRenderer } from '../../types';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import {
    DroptargetEvent,
    Droptarget,
    WillShowOverlayEvent,
} from '../../../dnd/droptarget';
import { DragHandler } from '../../../dnd/abstractDragHandler';
import { IDockviewPanel } from '../../dockviewPanel';

class TabDragHandler extends DragHandler {
    private readonly panelTransfer =
        LocalSelectionTransfer.getInstance<PanelTransfer>();

    constructor(
        element: HTMLElement,
        private readonly accessor: DockviewComponent,
        private readonly group: DockviewGroupPanel,
        private readonly panel: IDockviewPanel
    ) {
        super(element);
    }

    getData(event: DragEvent): IDisposable {
        this.panelTransfer.setData(
            [new PanelTransfer(this.accessor.id, this.group.id, this.panel.id)],
            PanelTransfer.prototype
        );

        return {
            dispose: () => {
                this.panelTransfer.clearData(PanelTransfer.prototype);
            },
        };
    }
}

export class Tab extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private readonly dropTarget: Droptarget;
    private content: ITabRenderer | undefined = undefined;

    private readonly _onChanged = new Emitter<MouseEvent>();
    readonly onChanged: Event<MouseEvent> = this._onChanged.event;

    private readonly _onDropped = new Emitter<DroptargetEvent>();
    readonly onDrop: Event<DroptargetEvent> = this._onDropped.event;

    private readonly _onDragStart = new Emitter<DragEvent>();
    readonly onDragStart = this._onDragStart.event;

    readonly onWillShowOverlay: Event<WillShowOverlayEvent>;

    public get element(): HTMLElement {
        return this._element;
    }

    constructor(
        public readonly panel: IDockviewPanel,
        private readonly accessor: DockviewComponent,
        private readonly group: DockviewGroupPanel
    ) {
        super();

        this._element = document.createElement('div');
        this._element.className = 'dv-tab';
        this._element.tabIndex = 0;
        this._element.draggable = true;

        toggleClass(this.element, 'dv-inactive-tab', true);

        const dragHandler = new TabDragHandler(
            this._element,
            this.accessor,
            this.group,
            this.panel
        );

        this.dropTarget = new Droptarget(this._element, {
            acceptedTargetZones: ['center'],
            canDisplayOverlay: (event, position) => {
                if (this.group.locked) {
                    return false;
                }

                const data = getPanelData();

                if (data && this.accessor.id === data.viewId) {
                    if (
                        data.panelId === null &&
                        data.groupId === this.group.id
                    ) {
                        // don't allow group move to drop on self
                        return false;
                    }

                    return this.panel.id !== data.panelId;
                }

                return this.group.model.canDisplayOverlay(
                    event,
                    position,
                    'tab'
                );
            },
        });

        this.onWillShowOverlay = this.dropTarget.onWillShowOverlay;

        this.addDisposables(
            this._onChanged,
            this._onDropped,
            this._onDragStart,
            dragHandler.onDragStart((event) => {
                this._onDragStart.fire(event);
            }),
            dragHandler,
            addDisposableListener(this._element, 'pointerdown', (event) => {
                if (event.defaultPrevented) {
                    return;
                }

                this._onChanged.fire(event);
            }),
            this.dropTarget.onDrop((event) => {
                this._onDropped.fire(event);
            }),
            this.dropTarget
        );
    }

    public setActive(isActive: boolean): void {
        toggleClass(this.element, 'dv-active-tab', isActive);
        toggleClass(this.element, 'dv-inactive-tab', !isActive);
    }

    public setContent(part: ITabRenderer): void {
        if (this.content) {
            this._element.removeChild(this.content.element);
        }
        this.content = part;
        this._element.appendChild(this.content.element);
    }

    public dispose(): void {
        super.dispose();
    }
}
