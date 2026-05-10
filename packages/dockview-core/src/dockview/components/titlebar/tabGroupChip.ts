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

export class TabGroupChip
    extends CompositeDisposable
    implements ITabGroupChipRenderer
{
    private readonly _element: HTMLElement;
    private readonly _label: HTMLSpanElement;
    private _tabGroup: ITabGroup | undefined;

    private readonly _onClick = new Emitter<MouseEvent>();
    readonly onClick: Event<MouseEvent> = this._onClick.event;

    private readonly _onContextMenu = new Emitter<MouseEvent>();
    readonly onContextMenu: Event<MouseEvent> = this._onContextMenu.event;

    private readonly _onDragStart = new Emitter<DragEvent>();
    readonly onDragStart: Event<DragEvent> = this._onDragStart.event;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(private readonly _palette?: TabGroupColorPalette) {
        super();

        this._element = document.createElement('div');
        this._element.className = 'dv-tab-group-chip';
        this._element.tabIndex = 0;
        this._element.draggable = true;

        this._label = document.createElement('span');
        this._label.className = 'dv-tab-group-chip-label';
        this._element.appendChild(this._label);

        this.addDisposables(
            this._onClick,
            this._onContextMenu,
            this._onDragStart,
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
}
