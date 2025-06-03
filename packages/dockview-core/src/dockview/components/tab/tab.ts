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
import { addGhostImage } from '../../../dnd/ghost';

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

    private readonly _onPointDown = new Emitter<MouseEvent>();
    readonly onPointerDown: Event<MouseEvent> = this._onPointDown.event;
    
    private readonly _onKeyDown = new Emitter<KeyboardEvent>();
    readonly onKeyDown: Event<KeyboardEvent> = this._onKeyDown.event;

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
        this._element.id = this.panel.tabComponentElId;
        this._element.className = 'dv-tab';
        this._element.role = 'tab';
        this._element.tabIndex = -1;
        this._element.draggable = true;
        this._element.ariaSelected = 'false';
        this._element.setAttribute('aria-controls', this.panel.componentElId);

        toggleClass(this.element, 'dv-inactive-tab', true);

        const dragHandler = new TabDragHandler(
            this._element,
            this.accessor,
            this.group,
            this.panel
        );

        this.dropTarget = new Droptarget(this._element, {
            acceptedTargetZones: ['left', 'right'],
            overlayModel: { activationSize: { value: 50, type: 'percentage' } },
            canDisplayOverlay: (event, position) => {
                if (this.group.locked) {
                    return false;
                }

                const data = getPanelData();

                if (data && this.accessor.id === data.viewId) {
                    return true;
                }

                return this.group.model.canDisplayOverlay(
                    event,
                    position,
                    'tab'
                );
            },
            getOverrideTarget: () => group.model.dropTargetContainer?.model,
        });

        this.onWillShowOverlay = this.dropTarget.onWillShowOverlay;

        this.addDisposables(
            this._onPointDown,
            this._onDropped,
            this._onDragStart,
            dragHandler.onDragStart((event) => {
                if (event.dataTransfer) {
                    const style = getComputedStyle(this.element);
                    const newNode = this.element.cloneNode(true) as HTMLElement;
                    Array.from(style).forEach((key) =>
                        newNode.style.setProperty(
                            key,
                            style.getPropertyValue(key),
                            style.getPropertyPriority(key)
                        )
                    );
                    newNode.style.position = 'absolute';

                    addGhostImage(event.dataTransfer, newNode, {
                        y: -10,
                        x: 30,
                    });
                }
                this._onDragStart.fire(event);
            }),
            dragHandler,
            addDisposableListener(this._element, 'pointerdown', (event) => {
                this._onPointDown.fire(event);
            }),
            addDisposableListener(this._element, 'keydown', (event) => {
                this._onKeyDown.fire(event);
            }),
            this.dropTarget.onDrop((event) => {
                this._onDropped.fire(event);
            }),
            this.dropTarget
        );
    }

    public setActive(isActive: boolean): void {
        this.element.tabIndex = isActive ? 0 : -1;
        this.element.ariaSelected = isActive.toString();

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
