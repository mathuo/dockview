import { addDisposableListener, Emitter, Event } from '../../../events';
import { CompositeDisposable, IDisposable } from '../../../lifecycle';
import {
    getPanelData,
    LocalSelectionTransfer,
    PanelTransfer,
} from '../../../dnd/dataTransfer';
import { toggleClass } from '../../../dom';
import { IDockviewComponent } from '../../dockviewComponent';
import { DockviewDropTargets, ITabRenderer } from '../../types';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { DroptargetEvent, Droptarget } from '../../../dnd/droptarget';
import { DragHandler } from '../../../dnd/abstractDragHandler';

export interface ITab extends IDisposable {
    readonly panelId: string;
    readonly element: HTMLElement;
    setContent: (element: ITabRenderer) => void;
    onChanged: Event<MouseEvent>;
    onDrop: Event<DroptargetEvent>;
    setActive(isActive: boolean): void;
}

export class Tab extends CompositeDisposable implements ITab {
    private readonly _element: HTMLElement;
    private readonly droptarget: Droptarget;
    private content?: ITabRenderer;

    private readonly _onChanged = new Emitter<MouseEvent>();
    readonly onChanged: Event<MouseEvent> = this._onChanged.event;

    private readonly _onDropped = new Emitter<DroptargetEvent>();
    readonly onDrop: Event<DroptargetEvent> = this._onDropped.event;

    public get element(): HTMLElement {
        return this._element;
    }

    constructor(
        public readonly panelId: string,
        private readonly accessor: IDockviewComponent,
        private readonly group: DockviewGroupPanel
    ) {
        super();

        this._element = document.createElement('div');
        this._element.className = 'tab';
        this._element.tabIndex = 0;
        this._element.draggable = true;

        toggleClass(this.element, 'inactive-tab', true);

        this.addDisposables(
            this._onChanged,
            this._onDropped,
            new (class Handler extends DragHandler {
                private readonly panelTransfer =
                    LocalSelectionTransfer.getInstance<PanelTransfer>();

                getData(): IDisposable {
                    this.panelTransfer.setData(
                        [new PanelTransfer(accessor.id, group.id, panelId)],
                        PanelTransfer.prototype
                    );

                    return {
                        dispose: () => {
                            this.panelTransfer.clearData(
                                PanelTransfer.prototype
                            );
                        },
                    };
                }
            })(this._element)
        );

        this.addDisposables(
            addDisposableListener(this._element, 'mousedown', (event) => {
                if (event.defaultPrevented) {
                    return;
                }
                /**
                 * TODO: alternative to stopPropagation
                 *
                 * I need to stop the event propagation here since otherwise it'll be intercepted by event handlers
                 * on the tabs-container. I cannot use event.preventDefault() since I need the on DragStart event to occur
                 */
                event.stopPropagation();

                this._onChanged.fire(event);
            })
        );

        this.droptarget = new Droptarget(this._element, {
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

                    return this.panelId !== data.panelId;
                }

                return this.group.model.canDisplayOverlay(
                    event,
                    position,
                    DockviewDropTargets.Tab
                );
            },
        });

        this.addDisposables(
            this.droptarget.onDrop((event) => {
                this._onDropped.fire(event);
            }),
            this.droptarget
        );
    }

    public setActive(isActive: boolean): void {
        toggleClass(this.element, 'active-tab', isActive);
        toggleClass(this.element, 'inactive-tab', !isActive);
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
