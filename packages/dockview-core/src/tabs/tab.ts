import { addDisposableListener, Emitter, Event } from '../events';
import { CompositeDisposable, IDisposable } from '../lifecycle';
import { LocalSelectionTransfer, PanelTransfer } from '../dnd/dataTransfer';
import { toggleClass } from '../dom';
import { ITabRenderer } from '../dockview/types';
import {
    DroptargetEvent,
    Droptarget,
    WillShowOverlayEvent,
    DroptargetOptions,
} from '../dnd/droptarget';
import { DragHandler } from '../dnd/abstractDragHandler';
import { addGhostImage } from '../dnd/ghost';

export class TabDragHandler extends DragHandler {
    private readonly panelTransfer =
        LocalSelectionTransfer.getInstance<PanelTransfer>();

    constructor(
        element: HTMLElement,
        private readonly id: string,
        private readonly groupId: string,
        private readonly panelId: string
    ) {
        super(element);
    }

    getData(_event: DragEvent): IDisposable {
        this.panelTransfer.setData(
            [new PanelTransfer(this.id, this.groupId, this.panelId)],
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

    private readonly _onDropped = new Emitter<DroptargetEvent>();
    readonly onDrop: Event<DroptargetEvent> = this._onDropped.event;

    private readonly _onDragStart = new Emitter<DragEvent>();
    readonly onDragStart = this._onDragStart.event;

    readonly onWillShowOverlay: Event<WillShowOverlayEvent>;

    public get element(): HTMLElement {
        return this._element;
    }

    constructor(
        public readonly id: string,
        accessorId: string,
        groupId: string,
        dropTargetOptions: DroptargetOptions
    ) {
        super();

        this._element = document.createElement('div');
        this._element.className = 'dv-tab';
        this._element.tabIndex = 0;
        this._element.draggable = true;

        toggleClass(this.element, 'dv-inactive-tab', true);

        this.dropTarget = new Droptarget(this._element, dropTargetOptions);

        this.onWillShowOverlay = this.dropTarget.onWillShowOverlay;

        const dragHandler = new TabDragHandler(
            this._element,
            accessorId,
            groupId,
            id
        );

        this.addDisposables(
            this._onPointDown,
            this._onDropped,
            this._onDragStart,
            dragHandler,
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
