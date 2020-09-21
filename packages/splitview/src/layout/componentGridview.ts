import { getRelativeLocation, IGridView } from '../gridview/gridview';
import { Position } from '../groupview/droptarget/droptarget';
import { getGridLocation } from '../gridview/gridview';
import { tail, sequenceEquals } from '../array';
import { GroupChangeKind, GroupChangeEvent } from '../groupview/groupview';
import { Disposable, IValueDisposable } from '../lifecycle';
import { Event, Emitter } from '../events';

import { DebugWidget } from './components/debug/debug';

import { sequentialNumberGenerator } from '../math';
import { IPanelDeserializer } from './deserializer';

import { createComponent } from '../splitview/options';
import { LayoutPriority, Orientation } from '../splitview/splitview';
import { MovementOptions2 } from './options';
import { GridComponentOptions } from '.';
import { BaseGrid, IBaseGrid, IBaseGridView } from './baseGrid';

const nextLayoutId = sequentialNumberGenerator();

export interface AddComponentOptions {
    component: string;
    params?: { [key: string]: any };
    id: string;
    position?: {
        direction?: 'left' | 'right' | 'above' | 'below' | 'within';
        reference: string;
    };
    size?: number;
    priority?: LayoutPriority;
    snap?: boolean;
}

export interface IComponentGridview extends IBaseGridView {
    init?: (params: { params: any }) => void;
    priority?: LayoutPriority;
}

export interface IComponentGridviewLayout
    extends IBaseGrid<IComponentGridview> {
    addComponent(options: AddComponentOptions): void;
}

export class ComponentGridview
    extends BaseGrid<IComponentGridview>
    implements IComponentGridviewLayout {
    // events
    private readonly _onDidLayoutChange = new Emitter<GroupChangeEvent>();
    readonly onDidLayoutChange: Event<GroupChangeEvent> = this
        ._onDidLayoutChange.event;
    // everything else

    private _deserializer: IPanelDeserializer;
    private debugContainer: DebugWidget;

    constructor(
        element: HTMLElement,
        public readonly options: GridComponentOptions
    ) {
        super(element, { proportionalLayout: false });

        if (!this.options.components) {
            this.options.components = {};
        }
        if (!this.options.frameworkComponents) {
            this.options.frameworkComponents = {};
        }

        this.addDisposables(
            this.gridview.onDidChange((e) => {
                this._onDidLayoutChange.fire({ kind: GroupChangeKind.LAYOUT });
            })
        );
    }

    get deserializer() {
        return this._deserializer;
    }

    set deserializer(value: IPanelDeserializer) {
        this._deserializer = value;
    }

    /**
     * Serialize the current state of the layout
     *
     * @returns A JSON respresentation of the layout
     */
    public toJSON() {
        const data = this.gridview.serialize();

        return { grid: data };
    }

    public deserialize(data: any) {
        this.gridview.clear();
        this.groups.clear();

        this.fromJSON(data, this.deserializer);
        this.gridview.layout(this._size, this._orthogonalSize);
    }

    public fromJSON(data: any, deserializer: IPanelDeserializer) {
        const { grid, panels } = data;

        // this.gridview.deserialize(
        //   grid,
        //   new DefaultDeserializer(this, {
        //     createPanel: (id) => {
        //       const panelData = panels[id];
        //       const panel = deserializer.fromJSON(panelData);
        //       this.registerPanel(panel);
        //       return panel;
        //     },
        //   })
        // );
        this._onDidLayoutChange.fire({ kind: GroupChangeKind.NEW_LAYOUT });
    }

    public addComponent(options: AddComponentOptions) {
        let relativeLocation: number[] = [0];

        if (options.position?.reference) {
            const referenceGroup = this.groups.get(options.position.reference)
                .value;

            const target = this.toTarget(options.position.direction);
            if (target === Position.Center) {
                throw new Error(`${target} not supported as an option`);
            } else {
                const location = getGridLocation(referenceGroup.element);
                relativeLocation = getRelativeLocation(
                    this.gridview.orientation,
                    location,
                    target
                );
            }
        }

        const view = createComponent(
            options.component,
            this.options.components,
            this.options.frameworkComponents,
            this.options.frameworkComponentFactory.createComponent
        );
        view.init({ params: {} });
        view.priority = options.priority;
        view.snap = options.snap;

        this.groups.set(options.id, {
            value: view,
            disposable: Disposable.NONE,
        });

        this.doAddGroup(view, relativeLocation, options.size);
    }

    public removeGroup(group: IComponentGridview) {
        if (group === this._activeGroup) {
            this._activeGroup = undefined;
        }
        this.doRemoveGroup(group);
    }

    private doAddGroup(
        group: IComponentGridview,
        location: number[],
        size?: number
    ) {
        this.gridview.addView(group, size ?? { type: 'distribute' }, location);

        this._onDidLayoutChange.fire({ kind: GroupChangeKind.ADD_GROUP });
        this.doSetGroupActive(group);
    }

    private doRemoveGroup(
        group: IComponentGridview,
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

        const view = this.gridview.remove(group, { type: 'distribute' });
        this._onDidLayoutChange.fire({ kind: GroupChangeKind.REMOVE_GROUP });

        if (!options?.skipActive && this.groups.size > 0) {
            this.doSetGroupActive(Array.from(this.groups.values())[0].value);
        }

        return view;
    }

    public moveGroup(
        referenceGroup: IComponentGridview,
        groupId: string,
        target: Position
    ) {
        const sourceGroup = groupId
            ? this.groups.get(groupId).value
            : undefined;

        const referenceLocation = getGridLocation(referenceGroup.element);
        const targetLocation = getRelativeLocation(
            this.gridview.orientation,
            referenceLocation,
            target
        );

        const [targetParentLocation, to] = tail(targetLocation);
        const sourceLocation = getGridLocation(sourceGroup.element);
        const [sourceParentLocation, from] = tail(sourceLocation);

        if (sequenceEquals(sourceParentLocation, targetParentLocation)) {
            // special case when 'swapping' two views within same grid location
            // if a group has one tab - we are essentially moving the 'group'
            // which is equivalent to swapping two views in this case
            this.gridview.moveView(sourceParentLocation, from, to);

            return;
        }

        // source group will become empty so delete the group
        const targetGroup = this.doRemoveGroup(sourceGroup, {
            skipActive: true,
            skipDispose: true,
        }) as IComponentGridview;

        // after deleting the group we need to re-evaulate the ref location
        const updatedReferenceLocation = getGridLocation(
            referenceGroup.element
        );
        const location = getRelativeLocation(
            this.gridview.orientation,
            updatedReferenceLocation,
            target
        );
        this.doAddGroup(targetGroup, location);
    }

    private toTarget(
        direction: 'left' | 'right' | 'above' | 'below' | 'within'
    ) {
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

    public dispose() {
        super.dispose();

        this.debugContainer?.dispose();

        this._onDidLayoutChange.dispose();
    }
}
