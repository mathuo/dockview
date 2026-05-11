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
    IDropTarget,
    Position,
    WillShowOverlayEvent,
} from '../../../dnd/droptarget';
import { DragHandler } from '../../../dnd/abstractDragHandler';
import { PointerDragSource } from '../../../dnd/pointer/pointerDragSource';
import { PointerDropTarget } from '../../../dnd/pointer/pointerDropTarget';
import { LongPressDetector } from '../../../dnd/pointer/longPress';
import { PointerGhost } from '../../../dnd/pointer/pointerGhost';
import { IDockviewPanel } from '../../dockviewPanel';
import { addGhostImage } from '../../../dnd/ghost';
import {
    DockviewHeaderDirection,
    resolveDndCapabilities,
} from '../../options';

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
    private readonly dropTarget: IDropTarget;
    private readonly pointerDropTarget: IDropTarget;
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

        const caps = resolveDndCapabilities(this.accessor.options);

        this._element = document.createElement('div');
        this._element.className = 'dv-tab';
        this._element.tabIndex = 0;
        this._element.draggable = caps.html5;

        toggleClass(this.element, 'dv-inactive-tab', true);

        this.dragHandler = new TabDragHandler(
            this._element,
            this.accessor,
            this.group,
            this.panel,
            !caps.html5
        );

        const canDisplayOverlay = (
            event: DragEvent | PointerEvent,
            position: Position
        ): boolean => {
            if (this.group.locked) {
                return false;
            }

            const data = getPanelData();

            if (data && this.accessor.id === data.viewId) {
                // Smooth-reorder takes over the in-flight visual when active,
                // so individual tab overlays are suppressed for internal drags.
                if (this.accessor.options.theme?.tabAnimation === 'smooth') {
                    return false;
                }
                return true;
            }

            return this.group.model.canDisplayOverlay(event, position, 'tab');
        };

        this.dropTarget = new Droptarget(this._element, {
            acceptedTargetZones: ['left', 'right'],
            overlayModel: this._buildOverlayModel(),
            canDisplayOverlay,
            getOverrideTarget: () => group.model.dropTargetContainer?.model,
        });

        this.pointerDropTarget = new PointerDropTarget(this._element, {
            acceptedTargetZones: ['left', 'right'],
            overlayModel: this._buildOverlayModel(),
            canDisplayOverlay,
            getOverrideTarget: () => group.model.dropTargetContainer?.model,
        });

        this.pointerDragSource = new PointerDragSource(this._element, {
            isCancelled: () =>
                !resolveDndCapabilities(this.accessor.options).pointer,
            touchOnly: !caps.pointerHandlesMouse,
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
            createGhost: (event) => {
                // 30/-10 matches the HTML5 setDragImage offset for visual parity.
                return new PointerGhost({
                    element: this._buildGhostElement(),
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
                    addGhostImage(
                        event.dataTransfer,
                        this._buildGhostElement(),
                        {
                            y: -10,
                            x: 30,
                        }
                    );
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
            new LongPressDetector(this._element, {
                onLongPress: (event) => {
                    // Don't let a subsequent finger move arm a drag on top
                    // of the just-opened menu.
                    this.pointerDragSource.cancelPending();
                    this.accessor.contextMenuController.show(
                        this.panel,
                        this.group,
                        event
                    );
                },
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
        const caps = resolveDndCapabilities(this.accessor.options);
        this._element.draggable = caps.html5;
        this.dragHandler.setDisabled(!caps.html5);
        this.pointerDragSource.setDisabled(!caps.pointer);
        this.pointerDragSource.setTouchOnly(!caps.pointerHandlesMouse);
    }

    /**
     * Vertical tabs are flipped to horizontal so the ghost stays readable
     * during the drag rather than appearing sideways-rotated.
     */
    private _buildGhostElement(): HTMLElement {
        const style = getComputedStyle(this.element);
        const newNode = this.element.cloneNode(true) as HTMLElement;
        const isVertical = this._direction === 'vertical';

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
            newNode.style.setProperty('writing-mode', 'horizontal-tb');
            newNode.style.setProperty('width', style.height);
            newNode.style.setProperty('height', style.width);
        }

        newNode.style.position = 'absolute';
        newNode.classList.add('dv-tab-ghost-drag');

        return newNode;
    }
}
