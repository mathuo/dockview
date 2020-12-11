import { Emitter, Event } from '../events';
import { getGridLocation, Gridview, IGridView } from './gridview';
import { Position } from '../dnd/droptarget';
import { GroupChangeEvent, GroupChangeKind } from '../groupview/groupview';
import { CompositeDisposable, IValueDisposable } from '../lifecycle';
import { sequentialNumberGenerator } from '../math';
import { ISplitviewStyles, Orientation } from '../splitview/core/splitview';
import { IPanel } from '../panel/types';
import { Sizing } from '../splitview/core/splitview';
import { MovementOptions2 } from '../dockview/options';

const nextLayoutId = sequentialNumberGenerator();

export type Direction = 'left' | 'right' | 'above' | 'below' | 'within';

export function toTarget(direction: Direction) {
    switch (direction) {
        case 'left':
            return Position.Left;
        case 'right':
            return Position.Right;
        case 'above':
            return Position.Top;
        case 'below':
            return Position.Bottom;
        case 'within':
        default:
            return Position.Center;
    }
}

export interface BaseGridOptions {
    readonly proportionalLayout?: boolean;
    readonly orientation: Orientation;
    readonly styles?: ISplitviewStyles;
}

export interface IGridPanelView extends IGridView, IPanel {
    setActive(isActive: boolean): void;
    readonly isActive: boolean;
}

export interface IBaseGrid<T extends IGridPanelView> {
    readonly element: HTMLElement;
    readonly id: string;
    readonly minimumHeight: number;
    readonly maximumHeight: number;
    readonly minimumWidth: number;
    readonly maximumWidth: number;
    readonly activeGroup: T | undefined;
    readonly size: number;
    readonly onGridEvent: Event<GroupChangeEvent>;
    getPanel(id: string): T | undefined;
    toJSON(): object;
    fromJSON(data: any): void;
    layout(width: number, height: number, force?: boolean): void;
    resizeToFit(): void;
    setVisible(panel: T, visible: boolean): void;
    isVisible(panel: T): boolean;
}

export abstract class BaseGrid<T extends IGridPanelView>
    extends CompositeDisposable
    implements IBaseGrid<T> {
    private readonly _id = nextLayoutId.next();
    protected readonly groups = new Map<string, IValueDisposable<T>>();
    protected readonly gridview: Gridview;
    //
    private resizeTimer?: any;
    protected _activeGroup: T | undefined;
    //
    protected readonly _onGridEvent = new Emitter<GroupChangeEvent>();
    readonly onGridEvent: Event<GroupChangeEvent> = this._onGridEvent.event;

    get id() {
        return this._id;
    }

    get element() {
        return this._element;
    }

    get size() {
        return this.groups.size;
    }

    get width() {
        return this.gridview.width;
    }

    get height() {
        return this.gridview.height;
    }

    get minimumHeight() {
        return this.gridview.minimumHeight;
    }
    get maximumHeight() {
        return this.gridview.maximumHeight;
    }
    get minimumWidth() {
        return this.gridview.minimumWidth;
    }
    get maximumWidth() {
        return this.gridview.maximumWidth;
    }

    get activeGroup() {
        return this._activeGroup;
    }

    constructor(
        private readonly _element: HTMLElement,
        options: BaseGridOptions
    ) {
        super();

        this.gridview = new Gridview(
            !!options.proportionalLayout,
            options.styles,
            options.orientation
        );

        this.element.appendChild(this.gridview.element);

        // TODO for some reason this is required before anything will layout correctly
        this.layout(0, 0, true);

        this.addDisposables(
            this.gridview.onDidChange(() => {
                this._onGridEvent.fire({ kind: GroupChangeKind.LAYOUT });
            })
        );
    }

    public abstract toJSON(): object;
    public abstract fromJSON(data: any): void;

    public setVisible(panel: T, visible: boolean) {
        this.gridview.setViewVisible(getGridLocation(panel.element), visible);
        this._onGridEvent.fire({ kind: GroupChangeKind.LAYOUT });
    }

    public isVisible(panel: T) {
        return this.gridview.isViewVisible(getGridLocation(panel.element));
    }

    protected doAddGroup(group: T, location: number[] = [0], size?: number) {
        this.gridview.addView(group, size ?? Sizing.Distribute, location);

        this.doSetGroupActive(group);

        this._onGridEvent.fire({ kind: GroupChangeKind.ADD_GROUP });
    }

    protected doRemoveGroup(
        group: T,
        options?: { skipActive?: boolean; skipDispose?: boolean }
    ) {
        if (!this.groups.has(group.id)) {
            throw new Error('invalid operation');
        }

        const item = this.groups.get(group.id);

        const view = this.gridview.remove(group, Sizing.Distribute);

        if (item && !options?.skipDispose) {
            item.disposable.dispose();
            this.groups.delete(group.id);
        }

        if (!options?.skipActive && this.groups.size > 0) {
            this.doSetGroupActive(Array.from(this.groups.values())[0].value);
        }

        this._onGridEvent.fire({ kind: GroupChangeKind.REMOVE_GROUP });

        return view as T;
    }

    public getPanel(id: string): T | undefined {
        return this.groups.get(id)?.value;
    }

    public doSetGroupActive(group: T, skipFocus?: boolean) {
        if (this._activeGroup === group) {
            return;
        }
        if (this._activeGroup) {
            this._activeGroup.setActive(false);
            if (!skipFocus) {
                this._activeGroup.focus();
            }
        }
        group.setActive(true);
        if (!skipFocus) {
            group.focus();
        }
        this._activeGroup = group;
    }

    public removeGroup(group: T) {
        if (group === this._activeGroup) {
            this._activeGroup = undefined;
        }
        this.doRemoveGroup(group);
    }

    public moveToNext(options?: MovementOptions2) {
        if (!options) {
            options = {};
        }
        if (!options.group) {
            if (!this.activeGroup) {
                return;
            }
            options.group = this.activeGroup;
        }

        const location = getGridLocation(options.group.element);
        const next = this.gridview.next(location)?.view;
        this.doSetGroupActive(next as T);
    }

    public moveToPrevious(options?: MovementOptions2) {
        if (!options) {
            options = {};
        }
        if (!options.group) {
            if (!this.activeGroup) {
                return;
            }
            options.group = this.activeGroup;
        }

        const location = getGridLocation(options.group.element);
        const next = this.gridview.previous(location)?.view;
        this.doSetGroupActive(next as T);
    }

    public layout(width: number, height: number, forceResize?: boolean): void {
        const different =
            forceResize || width !== this.width || height !== this.height;

        if (!different) {
            return;
        }

        this.element.style.height = `${height}px`;
        this.element.style.width = `${width}px`;

        this.gridview.layout(width, height);
    }

    public setAutoResizeToFit(enabled: boolean): void {
        if (this.resizeTimer) {
            clearInterval(this.resizeTimer);
        }
        if (enabled) {
            this.resizeTimer = setInterval(() => {
                this.resizeToFit();
            }, 500);
        }
    }

    /**
     * Resize the layout to fit the parent container
     */
    public resizeToFit(): void {
        if (!this.element.parentElement) {
            return;
        }
        const {
            width,
            height,
        } = this.element.parentElement.getBoundingClientRect();
        this.layout(width, height);
    }

    public dispose(): void {
        super.dispose();

        if (this.resizeTimer) {
            clearInterval(this.resizeTimer);
            this.resizeTimer = undefined;
        }

        this._onGridEvent.dispose();
        this.gridview.dispose();
    }
}
