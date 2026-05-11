import { addDisposableListener, Emitter, Event } from '../../../events';
import { CompositeDisposable } from '../../../lifecycle';
import { toggleClass } from '../../../dom';
import { ITabGroup } from '../../tabGroup';
import {
    applyTabGroupAccent,
    TabGroupColorPalette,
} from '../../tabGroupAccent';
import { ITabGroupChipRenderer } from '../../framework';
import { DockviewApi } from '../../../api/component.api';
import { PointerDragSource } from '../../../dnd/pointer/pointerDragSource';
import { LongPressDetector } from '../../../dnd/pointer/longPress';
import { PointerGhost } from '../../../dnd/pointer/pointerGhost';
import { DndCapabilities } from '../../options';

export interface TabGroupChipOptions {
    /** Called on each drag attempt so strategy changes take effect live. */
    getDndCapabilities?: () => DndCapabilities;
}

export class TabGroupChip
    extends CompositeDisposable
    implements ITabGroupChipRenderer
{
    private readonly _element: HTMLElement;
    private readonly _label: HTMLSpanElement;
    private readonly _pointerSource: PointerDragSource;
    private readonly _getCapabilities: () => DndCapabilities;
    private _tabGroup: ITabGroup | undefined;

    private readonly _onClick = new Emitter<MouseEvent>();
    readonly onClick: Event<MouseEvent> = this._onClick.event;

    private readonly _onContextMenu = new Emitter<MouseEvent>();
    readonly onContextMenu: Event<MouseEvent> = this._onContextMenu.event;

    private readonly _onDragStart = new Emitter<DragEvent | PointerEvent>();
    readonly onDragStart: Event<DragEvent | PointerEvent> =
        this._onDragStart.event;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        private readonly _palette?: TabGroupColorPalette,
        opts?: TabGroupChipOptions
    ) {
        super();

        this._getCapabilities =
            opts?.getDndCapabilities ??
            (() => ({
                html5: true,
                pointer: true,
                pointerHandlesMouse: false,
            }));

        const initialCaps = this._getCapabilities();

        this._element = document.createElement('div');
        this._element.className = 'dv-tab-group-chip';
        this._element.tabIndex = 0;
        this._element.draggable = initialCaps.html5;

        this._label = document.createElement('span');
        this._label.className = 'dv-tab-group-chip-label';
        this._element.appendChild(this._label);

        this._pointerSource = new PointerDragSource(this._element, {
            touchOnly: !initialCaps.pointerHandlesMouse,
            isCancelled: () => !this._getCapabilities().pointer,
            // Transfer payload is populated by the chip drag-start consumer,
            // which has access to the tab group identity.
            getData: () => ({ dispose: () => undefined }),
            createGhost: (event) => {
                return new PointerGhost({
                    element: this._buildGhostElement(),
                    initialX: event.clientX,
                    initialY: event.clientY,
                    offsetX: 8,
                    offsetY: 8,
                    owner: this._element,
                });
            },
            onDragStart: (event) => {
                this._onDragStart.fire(event);
            },
        });

        this.addDisposables(
            this._onClick,
            this._onContextMenu,
            this._onDragStart,
            this._pointerSource,
            new LongPressDetector(this._element, {
                onLongPress: (event) => {
                    // Don't let a subsequent finger move arm a drag on top
                    // of the just-opened menu.
                    this._pointerSource.cancelPending();
                    this._onContextMenu.fire(event);
                },
            }),
            addDisposableListener(this._element, 'click', (event) => {
                this._onClick.fire(event);
            }),
            addDisposableListener(this._element, 'contextmenu', (event) => {
                this._onContextMenu.fire(event);
            }),
            addDisposableListener(this._element, 'dragstart', (event) => {
                this._onDragStart.fire(event);
            })
        );
    }

    init(params: { tabGroup: ITabGroup; api: DockviewApi }): void {
        this._tabGroup = params.tabGroup;
        this.updateColor(params.tabGroup.color);
        this.updateLabel(params.tabGroup.label);
        this.updateCollapsed(params.tabGroup.collapsed);

        this.addDisposables(
            params.tabGroup.onDidChange(() => {
                if (this._tabGroup) {
                    this.updateColor(this._tabGroup.color);
                    this.updateLabel(this._tabGroup.label);
                }
            }),
            params.tabGroup.onDidCollapseChange((collapsed) => {
                this.updateCollapsed(collapsed);
            }),
            this._onClick.event(() => {
                this._tabGroup?.toggle();
            })
        );
    }

    update(params: { tabGroup: ITabGroup }): void {
        this._tabGroup = params.tabGroup;
        this.updateColor(params.tabGroup.color);
        this.updateLabel(params.tabGroup.label);
        this.updateCollapsed(params.tabGroup.collapsed);
    }

    updateDragAndDropState(): void {
        const caps = this._getCapabilities();
        this._element.draggable = caps.html5;
        this._pointerSource.setDisabled(!caps.pointer);
        this._pointerSource.setTouchOnly(!caps.pointerHandlesMouse);
    }

    private updateColor(color: string | undefined): void {
        applyTabGroupAccent(this._element, color, this._palette);
        toggleClass(
            this._element,
            'dv-tab-group-chip--accent-off',
            this._palette?.enabled === false
        );
    }

    private updateLabel(label: string): void {
        this._label.textContent = label;
        toggleClass(this._label, 'dv-tab-group-chip-label--empty', !label);
    }

    private updateCollapsed(collapsed: boolean): void {
        toggleClass(this._element, 'dv-tab-group-chip--collapsed', collapsed);
    }

    private _buildGhostElement(): HTMLElement {
        const style = getComputedStyle(this._element);
        const clone = this._element.cloneNode(true) as HTMLElement;
        Array.from(style).forEach((key) => {
            clone.style.setProperty(
                key,
                style.getPropertyValue(key),
                style.getPropertyPriority(key)
            );
        });
        clone.style.position = 'absolute';
        return clone;
    }
}
