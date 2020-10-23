import { getRelativeLocation } from './gridview';
import { Position } from '../dnd/droptarget';
import { getGridLocation } from './gridview';
import { tail, sequenceEquals } from '../array';
import { GroupChangeKind } from '../groupview/groupview';
import { CompositeDisposable } from '../lifecycle';
import { IPanelDeserializer } from '../dockview/deserializer';
import { createComponent } from '../splitview/core/options';
import { GridComponentOptions } from './options';
import {
    BaseGrid,
    Direction,
    IBaseGrid,
    IGridPanelView,
    toTarget,
} from './baseComponentGridview';
import { GridviewPanel, GridviewInitParameters } from './gridviewPanel';
import { BaseComponentOptions, Parameters } from '../panel/types';
import { GridPanelApi } from '../api/gridPanelApi';
import { GridviewApi } from '../api/component.api';
import { Sizing } from '../splitview/core/splitview';

interface PanelReference {
    api: GridPanelApi;
}

export interface AddComponentOptions extends BaseComponentOptions {
    size?: number;
    minimumWidth?: number;
    maximumWidth?: number;
    minimumHeight?: number;
    maximumHeight?: number;
    position?: {
        direction?: Direction;
        reference: string;
    };
    location?: number[];
}

export interface IGridPanelComponentView extends IGridPanelView {
    init: (params: GridviewInitParameters) => void;
}

export interface IComponentGridview extends IBaseGrid<GridviewPanel> {
    addComponent(options: AddComponentOptions): void;
    removePanel(panel: GridviewPanel, sizing?: Sizing): void;
    setVisible(panel: GridviewPanel, visible: boolean): void;
    isVisible(panel: GridviewPanel): boolean;
    toggleVisibility(panel: GridviewPanel): void;
    focus(): void;
}

export class ComponentGridview
    extends BaseGrid<GridviewPanel>
    implements IComponentGridview {
    private _deserializer: IPanelDeserializer;

    constructor(
        element: HTMLElement,
        private readonly options: GridComponentOptions
    ) {
        super(element, {
            proportionalLayout: false,
            orientation: options.orientation,
            styles: options.styles,
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

    removePanel(panel: GridviewPanel, sizing?: Sizing) {
        this.gridview.remove(panel, sizing);
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

    public setVisible(panel: GridviewPanel, visible: boolean) {
        this.gridview.setViewVisible(getGridLocation(panel.element), visible);
    }

    public isVisible(panel: GridviewPanel) {
        return this.gridview.isViewVisible(getGridLocation(panel.element));
    }

    public toggleVisibility(panel: GridviewPanel) {
        this.setVisible(panel, !this.isVisible(panel));
    }

    focus() {
        this.activeGroup?.focus();
    }

    public fromJSON(data: any) {
        const { grid, panels, activePanel } = data;

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

                view.init({
                    params: data.params,
                    minimumWidth: data.minimumWidth,
                    maximumWidth: data.maximumWidth,
                    minimumHeight: data.minimumHeight,
                    maximumHeight: data.maximumHeight,
                    priority: data.priority,
                    snap: data.snap,
                    containerApi: new GridviewApi(this),
                });

                this.registerPanel(view);

                return view;
            },
        });

        if (typeof activePanel === 'string') {
            const panel = this.getPanel(activePanel);
            if (panel) {
                this.doSetGroupActive(panel);
            }
        }

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
            containerApi: new GridviewApi(this),
        });

        this.registerPanel(view);

        this.doAddGroup(view, relativeLocation, options.size);

        return { api: view.api };
    }

    private registerPanel(panel: GridviewPanel) {
        const disposable = new CompositeDisposable(
            panel.api.onDidFocusChange((event) => {
                if (!event.isFocused) {
                    return;
                }
                this.groups.forEach((groupItem) => {
                    const group = groupItem.value;
                    if (group !== panel) {
                        group.setActive(false);
                    } else {
                        group.setActive(true);
                    }
                });
            })
        );

        this.groups.set(panel.id, {
            value: panel,
            disposable,
        });
    }

    public moveGroup(
        referenceGroup: IGridPanelComponentView,
        groupId: string,
        target: Position
    ) {
        const sourceGroup = this.getPanel(groupId);

        if (!sourceGroup) {
            throw new Error('invalid operation');
        }

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

    public removeGroup(group: GridviewPanel) {
        super.removeGroup(group);

        const panel = this.groups.get(group.id);

        if (panel) {
            panel.disposable.dispose();
            this.groups.delete(group.id);
        }
    }

    public dispose() {
        super.dispose();
    }
}
