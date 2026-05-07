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
import { PointerDragSource } from '../../../dnd/pointer/pointerDragSource';
import { PointerDropTarget } from '../../../dnd/pointer/pointerDropTarget';
import { IDockviewPanel } from '../../dockviewPanel';
import { addGhostImage } from '../../../dnd/ghost';
import { DockviewHeaderDirection } from '../../options';

class TabDragHandler extends DragHandler {
    private readonly panelTransfer =
        LocalSelectionTransfer.getInstance<PanelTransfer>();

    constructor(
        element: HTMLElement,
        private readonly accessor: DockviewComponent,
        private readonly group: DockviewGroupPanel,
        private readonly panel: IDockviewPanel,
        disabled?: boolean
    ) {
        super(element, disabled);
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
    private readonly pointerDropTarget: PointerDropTarget;
    private content: ITabRenderer | undefined = undefined;
    private readonly dragHandler: TabDragHandler;
    private readonly pointerDragSource: PointerDragSource;
    private readonly panelTransfer =
        LocalSelectionTransfer.getInstance<PanelTransfer>();
    private _direction: DockviewHeaderDirection = 'horizontal';

    private readonly _onPointDown = new Emitter<MouseEvent>();
    readonly onPointerDown: Event<MouseEvent> = this._onPointDown.event;

    private readonly _onTabClick = new Emitter<MouseEvent>();
    readonly onTabClick: Event<MouseEvent> = this._onTabClick.event;

    private readonly _onDropped = new Emitter<DroptargetEvent>();
    readonly onDrop: Event<DroptargetEvent> = this._onDropped.event;

    private readonly _onDragStart = new Emitter<DragEvent | PointerEvent>();
    readonly onDragStart = this._onDragStart.event;

    private readonly _onDragEnd = new Emitter<DragEvent | PointerEvent>();
    readonly onDragEnd = this._onDragEnd.event;

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
        this._element.draggable = !this.accessor.options.disableDnd;

        toggleClass(this.element, 'dv-inactive-tab', true);

        this.dragHandler = new TabDragHandler(
            this._element,
            this.accessor,
            this.group,
            this.panel,
            !!this.accessor.options.disableDnd
        );

        const canDisplayOverlay = (
            event: DragEvent | PointerEvent,
            position: import('../../../dnd/droptarget').Position,
            isPointerDriven: boolean
        ): boolean => {
            if (this.group.locked) {
                return false;
            }

            const data = getPanelData();

            if (data && this.accessor.id === data.viewId) {
                // When smooth reorder is enabled the TabsContainer drives
                // the overlay/animation for HTML5-driven drags. The pointer
                // path doesn't participate in that animation, so we DO want
                // to show the per-tab overlay for touch drags.
                if (
                    !isPointerDriven &&
                    this.accessor.options.theme?.tabAnimation === 'smooth'
                ) {
                    return false;
                }
                return true;
            }

            return this.group.model.canDisplayOverlay(
                event,
                position,
                'tab'
            );
        };

        this.dropTarget = new Droptarget(this._element, {
            acceptedTargetZones: ['left', 'right'],
            overlayModel: this._buildOverlayModel(),
            canDisplayOverlay: (event, position) =>
                canDisplayOverlay(event, position, false),
            getOverrideTarget: () => group.model.dropTargetContainer?.model,
        });

        this.pointerDropTarget = new PointerDropTarget(this._element, {
            acceptedTargetZones: ['left', 'right'],
            overlayModel: this._buildOverlayModel(),
            canDisplayOverlay: (event, position) =>
                canDisplayOverlay(event, position, true),
            getOverrideTarget: () => group.model.dropTargetContainer?.model,
        });

        this.pointerDragSource = new PointerDragSource(this._element, {
            isCancelled: () => !!this.accessor.options.disableDnd,
            getData: () => {
                this.panelTransfer.setData(
                    [
                        new PanelTransfer(
                            this.accessor.id,
                            this.group.id,
                            this.panel.id
                        ),
                    ],
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
            onDragEnd: (event) => {
                this._onDragEnd.fire(event.pointerEvent);
            },
        });

        // Both droptargets feed the same downstream stream; consumers don't
        // need to know which path produced the overlay.
        this.onWillShowOverlay = Event.any(
            this.dropTarget.onWillShowOverlay,
            this.pointerDropTarget.onWillShowOverlay
        );

        this.addDisposables(
            this._onPointDown,
            this._onTabClick,
            this._onDropped,
            this._onDragStart,
            this._onDragEnd,
            this.accessor.onDidOptionsChange(() => {
                const model = this._buildOverlayModel();
                this.dropTarget.setOverlayModel(model);
                this.pointerDropTarget.setOverlayModel(model);
            }),
            this.dragHandler.onDragStart((event) => {
                if (event.dataTransfer) {
                    const style = getComputedStyle(this.element);
                    const newNode = this.element.cloneNode(true) as HTMLElement;
                    const isVertical = this._direction === 'vertical';

                    /**
                     * Properties to skip when copying computed styles for a
                     * vertical tab ghost.  `writing-mode` is excluded so we
                     * can force `horizontal-tb`.  Size and margin logical
                     * properties are excluded because their physical meaning
                     * flips when writing-mode changes, which would produce
                     * incorrect dimensions.
                     */
                    const verticalSkip = new Set([
                        'writing-mode',
                        'inline-size',
                        'block-size',
                        'min-inline-size',
                        'min-block-size',
                        'max-inline-size',
                        'max-block-size',
                        'margin-inline',
                        'margin-inline-start',
                        'margin-inline-end',
                        'margin-block',
                        'margin-block-start',
                        'margin-block-end',
                        'padding-inline',
                        'padding-inline-start',
                        'padding-inline-end',
                        'padding-block',
                        'padding-block-start',
                        'padding-block-end',
                    ]);

                    Array.from(style).forEach((key) => {
                        if (isVertical && verticalSkip.has(key)) {
                            return;
                        }
                        newNode.style.setProperty(
                            key,
                            style.getPropertyValue(key),
                            style.getPropertyPriority(key)
                        );
                    });

                    if (isVertical) {
                        // Force horizontal text flow and swap the physical
                        // dimensions so the ghost appears as a horizontal tab.
                        newNode.style.setProperty(
                            'writing-mode',
                            'horizontal-tb'
                        );
                        newNode.style.setProperty('width', style.height);
                        newNode.style.setProperty('height', style.width);
                    }

                    newNode.style.position = 'absolute';
                    newNode.classList.add('dv-tab-ghost-drag');

                    addGhostImage(event.dataTransfer, newNode, {
                        y: -10,
                        x: 30,
                    });
                }

                this._onDragStart.fire(event);

                if (this.accessor.options.theme?.tabAnimation === 'smooth') {
                    // Delay collapse to next frame so the browser
                    // captures the full drag image first
                    requestAnimationFrame(() => {
                        toggleClass(this.element, 'dv-tab--dragging', true);
                    });
                }
            }),
            addDisposableListener(this._element, 'dragend', (event) => {
                toggleClass(this.element, 'dv-tab--dragging', false);
                this._onDragEnd.fire(event);
            }),
            this.dragHandler,
            addDisposableListener(this._element, 'pointerdown', (event) => {
                this._onPointDown.fire(event);
            }),
            addDisposableListener(this._element, 'click', (event) => {
                this._onTabClick.fire(event);
            }),
            addDisposableListener(this._element, 'contextmenu', (event) => {
                this.accessor.contextMenuController.show(
                    this.panel,
                    this.group,
                    event
                );
            }),
            this.dropTarget.onDrop((event) => {
                this._onDropped.fire(event);
            }),
            this.pointerDropTarget.onDrop((event) => {
                this._onDropped.fire(event);
            }),
            this.dropTarget,
            this.pointerDropTarget,
            this.pointerDragSource
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

    private _buildOverlayModel() {
        // 'line' themes render a 4px insertion strip at the tab edge via the
        // anchor container's small-boundary path.  'fill' themes render a
        // half-width highlighted area, so we disable the small-boundary path
        // entirely (boundary = 0 ⟹ isSmall always false).
        const smallBoundary =
            this.accessor.options.theme?.dndTabIndicator === 'line'
                ? Number.POSITIVE_INFINITY
                : 0;
        return {
            activationSize: { value: 50, type: 'percentage' as const },
            smallWidthBoundary: smallBoundary,
            smallHeightBoundary: smallBoundary,
        };
    }

    public setDirection(direction: DockviewHeaderDirection): void {
        this._direction = direction;
        const zones =
            direction === 'vertical' ? ['top', 'bottom'] : ['left', 'right'];
        this.dropTarget.setTargetZones(zones as any);
        this.pointerDropTarget.setTargetZones(zones as any);
    }

    public updateDragAndDropState(): void {
        const disabled = !!this.accessor.options.disableDnd;
        this._element.draggable = !disabled;
        this.dragHandler.setDisabled(disabled);
        this.pointerDragSource.setDisabled(disabled);
    }
}
