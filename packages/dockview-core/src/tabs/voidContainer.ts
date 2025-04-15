import {
    Droptarget,
    DroptargetEvent,
    DroptargetOptions,
    WillShowOverlayEvent,
} from '../dnd/droptarget';
import { GroupDragHandler } from '../dnd/groupDragHandler';
import { DockviewComponent } from '../dockview/dockviewComponent';
import { addDisposableListener, Emitter, Event } from '../events';
import { CompositeDisposable } from '../lifecycle';
import { DockviewGroupPanel } from '../dockview/dockviewGroupPanel';

export class VoidContainer extends CompositeDisposable {
    private readonly _element: HTMLElement;
    private readonly dropTraget: Droptarget;

    private readonly _onDrop = new Emitter<DroptargetEvent>();
    readonly onDrop: Event<DroptargetEvent> = this._onDrop.event;

    private readonly _onDragStart = new Emitter<DragEvent>();
    readonly onDragStart = this._onDragStart.event;

    private readonly _onPointerDown = new Emitter<PointerEvent>();
    readonly onPointerDown = this._onPointerDown.event;

    readonly onWillShowOverlay: Event<WillShowOverlayEvent>;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        id: string,
        group: DockviewGroupPanel,
        dropTargetOptions: DroptargetOptions
    ) {
        super();

        this._element = document.createElement('div');

        this._element.className = 'dv-void-container';
        this._element.draggable = true;

        this.addDisposables(
            this._onDrop,
            this._onDragStart,
            this._onPointerDown,
            addDisposableListener(this._element, 'pointerdown', (event) => {
                this._onPointerDown.fire(event);
            })
        );

        const handler = new GroupDragHandler(this._element, id, {
            id: group.id,
            isCancelled: (event) => {
                if (group.api.location.type === 'floating' && !event.shiftKey) {
                    return true;
                }
                return false;
            },
            text: () => {
                return `Multiple Panels (${group.size})`;
            },
        });

        this.dropTraget = new Droptarget(this._element, dropTargetOptions);

        this.onWillShowOverlay = this.dropTraget.onWillShowOverlay;

        this.addDisposables(
            handler,
            handler.onDragStart((event) => {
                this._onDragStart.fire(event);
            }),
            this.dropTraget.onDrop((event) => {
                this._onDrop.fire(event);
            }),
            this.dropTraget
        );
    }
}
