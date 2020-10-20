import { MovementOptions2 } from '../dockview';
import { Emitter, Event } from '../events';
import { getGridLocation, Gridview, IGridView } from './gridview';
import { Position } from '../groupview/droptarget/droptarget';
import { GroupChangeEvent, GroupChangeKind } from '../groupview/groupview';
import { CompositeDisposable, IValueDisposable } from '../lifecycle';
import { sequentialNumberGenerator } from '../math';
import { ISplitviewStyles, Orientation } from '../splitview/core/splitview';
import { IPanel } from '../panel/types';
import { Sizing } from '../splitview/core/splitview';

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
    readonly orientation?: Orientation;
    readonly styles?: ISplitviewStyles;
}

export interface IGridPanelView extends IGridView, IPanel {
    setActive(isActive: boolean, skipFocus?: boolean): void;
    isActive: boolean;
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
    readonly onDidLayoutChange: Event<GroupChangeEvent>;
    getPanel(id: string): T | undefined;
    toJSON(): object;
    fromJSON(data: any): void;
    layout(width: number, height: number, force?: boolean): void;
    resizeToFit(): void;
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
    protected _size = 0;
    protected _orthogonalSize = 0;
    //
    protected readonly _onDidLayoutChange = new Emitter<GroupChangeEvent>();
    readonly onDidLayoutChange: Event<GroupChangeEvent> = this
        ._onDidLayoutChange.event;

    get id() {
        return this._id;
    }

    get element() {
        return this._element;
    }

    get size() {
        return this.groups.size;
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
            this.gridview.onDidChange((event) => {
                this._onDidLayoutChange.fire({ kind: GroupChangeKind.LAYOUT });
            })
        );
    }

    public abstract toJSON(): object;
    public abstract fromJSON(data: any): void;

    protected doAddGroup(group: T, location: number[] = [0], size?: number) {
        this.gridview.addView(group, size ?? Sizing.Distribute, location);

        this._onDidLayoutChange.fire({ kind: GroupChangeKind.ADD_GROUP });
        this.doSetGroupActive(group);
    }

    protected doRemoveGroup(
        group: T,
        options?: { skipActive?: boolean; skipDispose?: boolean }
    ) {
        if (!this.groups.has(group.id)) {
            throw new Error('invalid operation');
        }

        const { disposable } = this.groups.get(group.id);

        if (!options?.skipDispose) {
            disposable.dispose();
            this.groups.delete(group.id);
        }

        const view = this.gridview.remove(group, Sizing.Distribute);
        this._onDidLayoutChange.fire({ kind: GroupChangeKind.REMOVE_GROUP });

        if (!options?.skipActive && this.groups.size > 0) {
            this.doSetGroupActive(Array.from(this.groups.values())[0].value);
        }

        return view as T;
    }

    public getPanel(id: string): T | undefined {
        return this.groups.get(id)?.value;
    }

    public doSetGroupActive(group: T, skipFocus?: boolean) {
        if (this._activeGroup && this._activeGroup !== group) {
            this._activeGroup.setActive(false, skipFocus);
        }
        group.setActive(true, skipFocus);
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
        const next = this.gridview.preivous(location)?.view;
        this.doSetGroupActive(next as T);
    }

    public layout(
        size: number,
        orthogonalSize: number,
        forceResize?: boolean
    ): void {
        const different =
            forceResize ||
            size !== this._size ||
            orthogonalSize !== this._orthogonalSize;

        if (!different) {
            return;
        }

        this.element.style.height = `${orthogonalSize}px`;
        this.element.style.width = `${size}px`;

        this._size = size;
        this._orthogonalSize = orthogonalSize;
        this.gridview.layout(size, orthogonalSize);
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

        this._onDidLayoutChange.dispose();
        this.gridview.dispose();
    }
}
