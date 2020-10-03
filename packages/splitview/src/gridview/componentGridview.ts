import { getRelativeLocation } from './gridview';
import { Position } from '../groupview/droptarget/droptarget';
import { getGridLocation } from './gridview';
import { tail, sequenceEquals } from '../array';
import { GroupChangeKind } from '../groupview/groupview';
import { Disposable } from '../lifecycle';
import { IPanelDeserializer } from '../dockview/deserializer';
import { createComponent } from '../splitview/core/options';
import { LayoutPriority } from '../splitview/core/splitview';
import { GridComponentOptions } from './options';
import {
    BaseGrid,
    Direction,
    IBaseGrid,
    IBaseGridPublicApi,
    IGridPanelView,
    toTarget,
} from './baseComponentGridview';
import { GridPanelView, GridviewInitParameters } from './gridPanelView';
import { Parameters } from '../panel/types';
import { GridPanelApi } from '../api/gridPanelApi';

interface PanelReference {
    api: GridPanelApi;
}

export interface AddComponentOptions {
    id: string;
    component: string;
    params?: Parameters;
    //
    size?: number;
    minimumWidth?: number;
    maximumWidth?: number;
    minimumHeight?: number;
    maximumHeight?: number;
    //
    position?: {
        direction?: Direction;
        reference: string;
    };
    location?: number[];
    priority?: LayoutPriority;
    snap?: boolean;
}

export interface IGridPanelComponentView extends IGridPanelView {
    init?: (params: GridviewInitParameters) => void;
}

export interface IComponentGridview extends IBaseGrid<GridPanelView> {
    addComponent(options: AddComponentOptions): void;
    getPanel(id: string): GridPanelView;
    setVisible(panel: GridPanelView, visible: boolean): void;
    isVisible(panel: GridPanelView): boolean;
    toggleVisibility(panel: GridPanelView): void;
}

export interface GridviewApi
    extends IBaseGridPublicApi<GridPanelView>,
        Pick<
            IComponentGridview,
            'addComponent' | 'setVisible' | 'isVisible' | 'toggleVisibility'
        > {}

export class ComponentGridview
    extends BaseGrid<GridPanelView>
    implements IComponentGridview {
    private _deserializer: IPanelDeserializer;

    constructor(
        element: HTMLElement,
        private readonly options: GridComponentOptions
    ) {
        super(element, {
            proportionalLayout: false,
            orientation: options.orientation,
        });

        if (!this.options.components) {
            this.options.components = {};
        }
        if (!this.options.frameworkComponents) {
            this.options.frameworkComponents = {};
        }
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

        this.fromJSON(data);
        this.gridview.layout(this._size, this._orthogonalSize);
    }

    public setVisible(panel: GridPanelView, visible: boolean) {
        this.gridview.setViewVisible(getGridLocation(panel.element), visible);
    }

    public isVisible(panel: GridPanelView) {
        return this.gridview.isViewVisible(getGridLocation(panel.element));
    }

    public toggleVisibility(panel: GridPanelView) {
        this.setVisible(panel, !this.isVisible(panel));
    }

    public fromJSON(data: any) {
        const { grid, panels } = data;

        this.gridview.clear();
        this.groups.clear();

        this.gridview.deserialize(grid, {
            fromJSON: (data: any) => {
                const view = createComponent(
                    data.id,
                    data.component,
                    this.options.components,
                    this.options.frameworkComponents,
                    this.options.frameworkComponentFactory.createComponent
                );

                let priority: LayoutPriority;

                switch (data.priority) {
                    case LayoutPriority.High:
                        priority = LayoutPriority.High;
                        break;
                    case LayoutPriority.Low:
                        priority = LayoutPriority.Low;
                        break;
                    case LayoutPriority.Normal:
                        priority = LayoutPriority.Normal;
                        break;
                }

                view.init({
                    params: data.params,
                    minimumWidth: data.minimumWidth,
                    maximumWidth: data.maximumWidth,
                    minimumHeight: data.minimumHeight,
                    maximumHeight: data.maximumHeight,
                    priority,
                    snap: data.snap,
                });

                this.groups.set(data.id, {
                    value: view,
                    disposable: Disposable.NONE,
                });

                return view;
            },
        });

        this.gridview.layout(this._size, this._orthogonalSize);

        this._onDidLayoutChange.fire({ kind: GroupChangeKind.NEW_LAYOUT });
    }

    public addComponent(options: AddComponentOptions): PanelReference {
        let relativeLocation: number[] = options.location || [0];

        if (options.position?.reference) {
            const referenceGroup = this.groups.get(options.position.reference)
                .value;

            const target = toTarget(options.position.direction);
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
            options.id,
            options.component,
            this.options.components,
            this.options.frameworkComponents,
            this.options.frameworkComponentFactory.createComponent
        );

        view.init({
            params: options.params,
            minimumWidth: options.minimumWidth,
            maximumWidth: options.maximumWidth,
            minimumHeight: options.minimumHeight,
            maximumHeight: options.maximumHeight,
            priority: options.priority,
            snap: options.snap,
        });

        this.groups.set(options.id, {
            value: view,
            disposable: Disposable.NONE,
        });

        this.doAddGroup(view, relativeLocation, options.size);

        return { api: view.api };
    }

    public getPanel(id: string): GridPanelView {
        return this.getGroup(id) as GridPanelView;
    }

    public moveGroup(
        referenceGroup: IGridPanelComponentView,
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
        });

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

    public dispose() {
        super.dispose();
    }
}
