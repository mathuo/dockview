import {
    getPanelData,
    LocalSelectionTransfer,
    PanelTransfer,
} from '../../../dnd/dataTransfer';
import {
    DroptargetEvent,
    IDropTarget,
    Position,
    WillShowOverlayEvent,
} from '../../../dnd/droptarget';
import {
    DragSourceOptions,
    html5Backend,
    IDragGhostSpec,
    IDragSource,
    pointerBackend,
} from '../../../dnd/backend';
import { DockviewComponent } from '../../dockviewComponent';
import { addDisposableListener, Emitter, Event } from '../../../events';
import {
    CompositeDisposable,
    Disposable,
    MutableDisposable,
} from '../../../lifecycle';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { quasiPreventDefault, toggleClass } from '../../../dom';
import { resolveDndCapabilities } from '../../dndCapabilities';

// Floating-group redock via touch: require a deliberate long press so the
// "move the float around" gesture doesn't double-trigger the redock ghost.
// Infinity pressTolerance disables the pre-arm flick override; any motion
// during the wait is treated as drag-the-float, not redock intent.
const FLOATING_REDOCK_INITIATION_DELAY_MS = 500;

export class VoidContainer extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private readonly dropTarget: IDropTarget;
    private readonly pointerDropTarget: IDropTarget;
    private readonly html5DragSource: IDragSource;
    private readonly pointerDragSource: IDragSource;
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

        const caps = resolveDndCapabilities(this.accessor.options);

        this._element = document.createElement('div');

        this._element.className = 'dv-void-container';
        this._element.draggable = caps.html5;

        toggleClass(this._element, 'dv-draggable', caps.html5 || caps.pointer);

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

        const buildMultiPanelsGhost = (): HTMLElement => {
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
            // HTML5 setDragImage snapshots the element as appended to the
            // document; a default block-level div would stretch to the
            // body's width and render as a viewport-wide bar.
            ghostEl.style.display = 'inline-block';
            ghostEl.textContent = `Multiple Panels (${this.group.size})`;
            return ghostEl;
        };

        const buildGhostSpec = (): IDragGhostSpec => {
            const createGhost =
                this.accessor.options.createGroupDragGhostComponent;
            if (createGhost) {
                const renderer = createGhost(this.group);
                renderer.init({
                    group: this.group,
                    api: this.accessor.api,
                });
                return {
                    element: renderer.element,
                    offsetX: 30,
                    offsetY: -10,
                    dispose: renderer.dispose
                        ? () => renderer.dispose?.()
                        : undefined,
                };
            }
            return {
                element: buildMultiPanelsGhost(),
                offsetX: 30,
                offsetY: -10,
            };
        };

        const sharedDragOptions: DragSourceOptions = {
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
            createGhost: buildGhostSpec,
            onDragStart: (event) => {
                this._onDragStart.fire(event);
            },
        };

        this.html5DragSource = html5Backend.createDragSource(this._element, {
            ...sharedDragOptions,
            disabled: !caps.html5,
            isCancelled: (event) => {
                // HTML5: floating groups need shift+drag as the explicit
                // detach gesture (otherwise click-and-drag conflicts with
                // moving the floating group itself).
                if (
                    this.group.api.location.type === 'floating' &&
                    !(event as DragEvent).shiftKey
                ) {
                    return true;
                }
                if (
                    this.group.api.location.type === 'edge' &&
                    this.group.size === 0
                ) {
                    return true;
                }
                return false;
            },
        });

        const isFloating = () => this.group?.api?.location?.type === 'floating';

        this.pointerDragSource = pointerBackend.createDragSource(
            this._element,
            {
                ...sharedDragOptions,
                disabled: !caps.pointer,
                touchOnly: !caps.pointerHandlesMouse,
                // Floating groups share this element with the overlay's
                // move-the-float drag. Without a longer hold + tolerance
                // override, both gestures commit simultaneously and the
                // user sees the float follow their finger *and* a ghost.
                touchInitiationDelay: () =>
                    isFloating() ? FLOATING_REDOCK_INITIATION_DELAY_MS : 250,
                pressTolerance: () => (isFloating() ? Infinity : 8),
                isCancelled: () => {
                    if (
                        !resolveDndCapabilities(this.accessor.options).pointer
                    ) {
                        return true;
                    }
                    // Pointer: long-press IS the deliberate gesture, so
                    // floating groups don't need the shift gate.
                    if (
                        this.group.api.location.type === 'edge' &&
                        this.group.size === 0
                    ) {
                        return true;
                    }
                    return false;
                },
                onDragStart: (event) => {
                    // Redock just committed — abort any in-flight overlay
                    // move so the float stops following the finger while
                    // the ghost takes over.
                    this.getFloatingOverlay()?.cancelPendingDrag();
                    this._onDragStart.fire(event);
                },
            }
        );

        // Mirror direction: once the overlay's move-the-float gesture has
        // actually moved something, cancel the pending redock arm so the
        // ghost doesn't appear mid-drag if the user holds past 500ms.
        const overlayMoveSub = new MutableDisposable();
        const refreshOverlayMoveSub = () => {
            const overlay = this.getFloatingOverlay();
            overlayMoveSub.value = overlay
                ? overlay.onDidStartMoving(() => {
                      this.pointerDragSource.cancelPending();
                  })
                : Disposable.NONE;
        };
        refreshOverlayMoveSub();
        this.addDisposables(overlayMoveSub);
        const locationChange = this.group?.api?.onDidLocationChange;
        if (locationChange) {
            this.addDisposables(locationChange(refreshOverlayMoveSub));
        }

        this.onWillShowOverlay = Event.any(
            this.dropTarget.onWillShowOverlay,
            this.pointerDropTarget.onWillShowOverlay
        );

        this.addDisposables(
            this.html5DragSource,
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
        const caps = resolveDndCapabilities(this.accessor.options);
        this._element.draggable = caps.html5;
        toggleClass(this._element, 'dv-draggable', caps.html5 || caps.pointer);
        this.html5DragSource.setDisabled(!caps.html5);
        this.pointerDragSource.setDisabled(!caps.pointer);
        this.pointerDragSource.setTouchOnly(!caps.pointerHandlesMouse);
    }

    private getFloatingOverlay() {
        if (!this.group) {
            return undefined;
        }
        return this.accessor.floatingGroups?.find(
            (fg) => fg.group === this.group
        )?.overlay;
    }
}
