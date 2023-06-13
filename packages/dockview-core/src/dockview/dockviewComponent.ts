import {
    getRelativeLocation,
    SerializedGridObject,
    getGridLocation,
    ISerializedLeafNode,
} from '../gridview/gridview';
import { directionToPosition, Droptarget, Position } from '../dnd/droptarget';
import { tail, sequenceEquals } from '../array';
import { DockviewPanel, IDockviewPanel } from './dockviewPanel';
import { CompositeDisposable } from '../lifecycle';
import { Event, Emitter } from '../events';
import { Watermark } from './components/watermark/watermark';
import {
    IWatermarkRenderer,
    GroupviewPanelState,
    DockviewDropTargets,
} from './types';
import { sequentialNumberGenerator } from '../math';
import { DefaultDockviewDeserialzier } from './deserializer';
import { createComponent } from '../panel/componentFactory';
import {
    AddGroupOptions,
    AddPanelOptions,
    DockviewComponentOptions,
    isGroupOptionsWithGroup,
    isGroupOptionsWithPanel,
    isPanelOptionsWithGroup,
    isPanelOptionsWithPanel,
    MovementOptions,
} from './options';
import { Parameters } from '../panel/types';
import {
    BaseGrid,
    Direction,
    IBaseGrid,
    toTarget,
} from '../gridview/baseComponentGridview';
import { DockviewApi } from '../api/component.api';
import { Orientation, Sizing } from '../splitview/splitview';
import {
    GroupOptions,
    GroupPanelViewState,
    GroupviewDropEvent,
} from './dockviewGroupPanelModel';
import { DockviewGroupPanel, IDockviewGroupPanel } from './dockviewGroupPanel';
import { DockviewPanelModel } from './dockviewPanelModel';
import { getPanelData } from '../dnd/dataTransfer';

export interface PanelReference {
    update: (event: { params: { [key: string]: any } }) => void;
    remove: () => void;
}

export interface SerializedDockview {
    grid: {
        root: SerializedGridObject<GroupPanelViewState>;
        height: number;
        width: number;
        orientation: Orientation;
    };
    panels: { [key: string]: GroupviewPanelState };
    activeGroup?: string;
}

export type DockviewComponentUpdateOptions = Pick<
    DockviewComponentOptions,
    | 'orientation'
    | 'components'
    | 'frameworkComponents'
    | 'tabComponents'
    | 'frameworkTabComponents'
    | 'showDndOverlay'
    | 'watermarkFrameworkComponent'
    | 'defaultTabComponent'
    | 'createGroupControlElement'
>;

export interface DockviewDropEvent extends GroupviewDropEvent {
    api: DockviewApi;
    group: DockviewGroupPanel | null;
}

export interface IDockviewComponent extends IBaseGrid<DockviewGroupPanel> {
    readonly activePanel: IDockviewPanel | undefined;
    readonly totalPanels: number;
    readonly panels: IDockviewPanel[];
    readonly onDidDrop: Event<DockviewDropEvent>;
    readonly orientation: Orientation;
    updateOptions(options: DockviewComponentUpdateOptions): void;
    moveGroupOrPanel(
        referenceGroup: DockviewGroupPanel,
        groupId: string,
        itemId: string,
        target: Position,
        index?: number
    ): void;
    doSetGroupActive: (group: DockviewGroupPanel, skipFocus?: boolean) => void;
    removeGroup: (group: DockviewGroupPanel) => void;
    options: DockviewComponentOptions;
    addPanel<P extends object = Parameters>(options: AddPanelOptions<P>): IDockviewPanel;
    removePanel(panel: IDockviewPanel): void;
    getGroupPanel: (id: string) => IDockviewPanel | undefined;
    createWatermarkComponent(): IWatermarkRenderer;
    // lifecycle
    addGroup(options?: AddGroupOptions): IDockviewGroupPanel;
    closeAllGroups(): void;
    // events
    moveToNext(options?: MovementOptions): void;
    moveToPrevious(options?: MovementOptions): void;
    setActivePanel(panel: IDockviewPanel): void;
    focus(): void;
    toJSON(): SerializedDockview;
    fromJSON(data: SerializedDockview): void;
    //
    readonly onDidRemovePanel: Event<IDockviewPanel>;
    readonly onDidAddPanel: Event<IDockviewPanel>;
    readonly onDidLayoutFromJSON: Event<void>;
    readonly onDidActivePanelChange: Event<IDockviewPanel | undefined>;
}

export class DockviewComponent
    extends BaseGrid<DockviewGroupPanel>
    implements IDockviewComponent
{
    private readonly nextGroupId = sequentialNumberGenerator();
    private readonly _deserializer = new DefaultDockviewDeserialzier(this);
    private readonly _api: DockviewApi;
    private _options: Exclude<DockviewComponentOptions, 'orientation'>;
    private watermark: IWatermarkRenderer | null = null;

    private readonly _onDidDrop = new Emitter<DockviewDropEvent>();
    readonly onDidDrop: Event<DockviewDropEvent> = this._onDidDrop.event;

    private readonly _onDidRemovePanel = new Emitter<IDockviewPanel>();
    readonly onDidRemovePanel: Event<IDockviewPanel> =
        this._onDidRemovePanel.event;

    private readonly _onDidAddPanel = new Emitter<IDockviewPanel>();
    readonly onDidAddPanel: Event<IDockviewPanel> = this._onDidAddPanel.event;

    private readonly _onDidLayoutFromJSON = new Emitter<void>();
    readonly onDidLayoutFromJSON: Event<void> = this._onDidLayoutFromJSON.event;

    private readonly _onDidActivePanelChange = new Emitter<
        IDockviewPanel | undefined
    >();
    readonly onDidActivePanelChange: Event<IDockviewPanel | undefined> =
        this._onDidActivePanelChange.event;

    get orientation(): Orientation {
        return this.gridview.orientation;
    }

    get totalPanels(): number {
        return this.panels.length;
    }

    get panels(): IDockviewPanel[] {
        return this.groups.flatMap((group) => group.panels);
    }

    get options(): DockviewComponentOptions {
        return this._options;
    }

    get activePanel(): IDockviewPanel | undefined {
        const activeGroup = this.activeGroup;

        if (!activeGroup) {
            return undefined;
        }

        return activeGroup.activePanel;
    }

    constructor(options: DockviewComponentOptions) {
        super({
            proportionalLayout: true,
            orientation: options.orientation || Orientation.HORIZONTAL,
            styles: options.styles,
            parentElement: options.parentElement,
        });

        this.element.classList.add('dv-dockview');

        this.addDisposables(
            this._onDidDrop,
            Event.any(
                this.onDidAddGroup,
                this.onDidRemoveGroup
            )(() => {
                this.updateWatermark();
            }),
            Event.any(
                this.onDidAddPanel,
                this.onDidRemovePanel,
                this.onDidActivePanelChange
            )(() => {
                this._bufferOnDidLayoutChange.fire();
            })
        );

        this._options = options;

        if (!this.options.components) {
            this.options.components = {};
        }
        if (!this.options.frameworkComponents) {
            this.options.frameworkComponents = {};
        }
        if (!this.options.frameworkTabComponents) {
            this.options.frameworkTabComponents = {};
        }
        if (!this.options.tabComponents) {
            this.options.tabComponents = {};
        }
        if (
            !this.options.watermarkComponent &&
            !this.options.watermarkFrameworkComponent
        ) {
            this.options.watermarkComponent = Watermark;
        }

        const dropTarget = new Droptarget(this.element, {
            canDisplayOverlay: (event, position) => {
                const data = getPanelData();

                if (data) {
                    if (data.viewId !== this.id) {
                        return false;
                    }
                    return true;
                }

                if (this.options.showDndOverlay) {
                    return this.options.showDndOverlay({
                        nativeEvent: event,
                        position: position,
                        target: DockviewDropTargets.Edge,
                        getData: getPanelData,
                    });
                }

                return false;
            },
            acceptedTargetZones: ['top', 'bottom', 'left', 'right'],
            overlayModel: {
                activationSize: { type: 'pixels', value: 10 },
                size: { type: 'pixels', value: 20 },
            },
        });

        this.addDisposables(
            dropTarget.onDrop((event) => {
                const data = getPanelData();

                if (data) {
                    this.moveGroupOrPanel(
                        this.orthogonalize(event.position),
                        data.groupId,
                        data.panelId || undefined,
                        'center'
                    );
                } else {
                    this._onDidDrop.fire({
                        ...event,
                        api: this._api,
                        group: null,
                        getData: getPanelData,
                    });
                }
            }),
            dropTarget
        );

        this._api = new DockviewApi(this);

        this.updateWatermark();
    }

    private orthogonalize(position: Position): DockviewGroupPanel {
        switch (position) {
            case 'top':
            case 'bottom':
                if (this.gridview.orientation === Orientation.HORIZONTAL) {
                    // we need to add to a vertical splitview but the current root is a horizontal splitview.
                    // insert a vertical splitview at the root level and add the existing view as a child
                    this.gridview.insertOrthogonalSplitviewAtRoot();
                }
                break;
            case 'left':
            case 'right':
                if (this.gridview.orientation === Orientation.VERTICAL) {
                    // we need to add to a horizontal splitview but the current root is a vertical splitview.
                    // insert a horiziontal splitview at the root level and add the existing view as a child
                    this.gridview.insertOrthogonalSplitviewAtRoot();
                }
                break;
            default:
                break;
        }

        switch (position) {
            case 'top':
            case 'left':
                return this.createGroupAtLocation([0]); // insert into first position
            case 'bottom':
            case 'right':
                return this.createGroupAtLocation([this.gridview.length]); // insert into last position
            default:
                throw new Error(`unsupported position ${position}`);
        }
    }

    updateOptions(options: DockviewComponentUpdateOptions): void {
        const hasOrientationChanged =
            typeof options.orientation === 'string' &&
            this.gridview.orientation !== options.orientation;

        this._options = { ...this.options, ...options };

        if (hasOrientationChanged) {
            this.gridview.orientation = options.orientation!;
        }

        this.layout(this.gridview.width, this.gridview.height, true);
    }

    focus(): void {
        this.activeGroup?.focus();
    }

    getGroupPanel(id: string): IDockviewPanel | undefined {
        return this.panels.find((panel) => panel.id === id);
    }

    setActivePanel(panel: IDockviewPanel): void {
        this.doSetGroupActive(panel.group);
        panel.group.model.openPanel(panel);
    }

    moveToNext(options: MovementOptions = {}): void {
        if (!options.group) {
            if (!this.activeGroup) {
                return;
            }
            options.group = this.activeGroup;
        }

        if (options.includePanel && options.group) {
            if (
                options.group.activePanel !==
                options.group.panels[options.group.panels.length - 1]
            ) {
                options.group.model.moveToNext({ suppressRoll: true });
                return;
            }
        }

        const location = getGridLocation(options.group.element);
        const next = <DockviewGroupPanel>this.gridview.next(location)?.view;
        this.doSetGroupActive(next);
    }

    moveToPrevious(options: MovementOptions = {}): void {
        if (!options.group) {
            if (!this.activeGroup) {
                return;
            }
            options.group = this.activeGroup;
        }

        if (options.includePanel && options.group) {
            if (options.group.activePanel !== options.group.panels[0]) {
                options.group.model.moveToPrevious({ suppressRoll: true });
                return;
            }
        }

        const location = getGridLocation(options.group.element);
        const next = this.gridview.previous(location)?.view;
        if (next) {
            this.doSetGroupActive(next as DockviewGroupPanel);
        }
    }

    /**
     * Serialize the current state of the layout
     *
     * @returns A JSON respresentation of the layout
     */
    toJSON(): SerializedDockview {
        const data = this.gridview.serialize();

        const panels = this.panels.reduce((collection, panel) => {
            collection[panel.id] = panel.toJSON();
            return collection;
        }, {} as { [key: string]: GroupviewPanelState });

        return {
            grid: data,
            panels,
            activeGroup: this.activeGroup?.id,
        };
    }

    fromJSON(data: SerializedDockview): void {
        this.clear();

        const { grid, panels, activeGroup } = data;

        if (grid.root.type !== 'branch' || !Array.isArray(grid.root.data)) {
            throw new Error('root must be of type branch');
        }

        this.gridview.deserialize(grid, {
            fromJSON: (node: ISerializedLeafNode<GroupPanelViewState>) => {
                const { id, locked, hideHeader, views, activeView } = node.data;

                const group = this.createGroup({
                    id,
                    locked: !!locked,
                    hideHeader: !!hideHeader,
                });

                this._onDidAddGroup.fire(group);

                for (const child of views) {
                    const panel = this._deserializer.fromJSON(
                        panels[child],
                        group
                    );

                    const isActive =
                        typeof activeView === 'string' &&
                        activeView === panel.id;

                    group.model.openPanel(panel, {
                        skipSetPanelActive: !isActive,
                        skipSetGroupActive: true,
                    });
                }

                if (!group.activePanel && group.panels.length > 0) {
                    group.model.openPanel(
                        group.panels[group.panels.length - 1],
                        {
                            skipSetGroupActive: true,
                        }
                    );
                }

                return group;
            },
        });

        if (typeof activeGroup === 'string') {
            const panel = this.getPanel(activeGroup);
            if (panel) {
                this.doSetGroupActive(panel);
            }
        }

        this.gridview.layout(this.width, this.height);

        this._onDidLayoutFromJSON.fire();
    }

    clear(): void {
        const groups = Array.from(this._groups.values()).map((_) => _.value);

        const hasActiveGroup = !!this.activeGroup;
        const hasActivePanel = !!this.activePanel;

        for (const group of groups) {
            // remove the group will automatically remove the panels
            this.removeGroup(group, true);
        }

        if (hasActiveGroup) {
            this.doSetGroupActive(undefined);
        }

        if (hasActivePanel) {
            this._onDidActivePanelChange.fire(undefined);
        }

        this.gridview.clear();
    }

    closeAllGroups(): void {
        for (const entry of this._groups.entries()) {
            const [_, group] = entry;

            group.value.model.closeAllPanels();
        }
    }

    addPanel<P extends object = Parameters>(options: AddPanelOptions<P>): IDockviewPanel {
        if (this.panels.find((_) => _.id === options.id)) {
            throw new Error(`panel with id ${options.id} already exists`);
        }

        let referenceGroup: DockviewGroupPanel | undefined;

        if (options.position) {
            if (isPanelOptionsWithPanel(options.position)) {
                const referencePanel =
                    typeof options.position.referencePanel === 'string'
                        ? this.getGroupPanel(options.position.referencePanel)
                        : options.position.referencePanel;

                if (!referencePanel) {
                    throw new Error(
                        `referencePanel ${options.position.referencePanel} does not exist`
                    );
                }

                referenceGroup = this.findGroup(referencePanel);
            } else if (isPanelOptionsWithGroup(options.position)) {
                referenceGroup =
                    typeof options.position.referenceGroup === 'string'
                        ? this._groups.get(options.position.referenceGroup)
                              ?.value
                        : options.position.referenceGroup;

                if (!referenceGroup) {
                    throw new Error(
                        `referencePanel ${options.position.referenceGroup} does not exist`
                    );
                }
            } else {
                const group = this.orthogonalize(
                    directionToPosition(<Direction>options.position.direction)
                );
                const panel = this.createPanel(options, group);
                group.model.openPanel(panel);
                return panel;
            }
        } else {
            referenceGroup = this.activeGroup;
        }

        let panel: IDockviewPanel;

        if (referenceGroup) {
            const target = toTarget(
                <Direction>options.position?.direction || 'within'
            );
            if (target === 'center') {
                panel = this.createPanel(options, referenceGroup);
                referenceGroup.model.openPanel(panel);
            } else {
                const location = getGridLocation(referenceGroup.element);
                const relativeLocation = getRelativeLocation(
                    this.gridview.orientation,
                    location,
                    target
                );
                const group = this.createGroupAtLocation(relativeLocation);
                panel = this.createPanel(options, group);
                group.model.openPanel(panel);
            }
        } else {
            const group = this.createGroupAtLocation();

            panel = this.createPanel(options, group);
            group.model.openPanel(panel);
        }

        return panel;
    }

    removePanel(
        panel: IDockviewPanel,
        options: { removeEmptyGroup: boolean; skipDispose: boolean } = {
            removeEmptyGroup: true,
            skipDispose: false,
        }
    ): void {
        const group = panel.group;

        if (!group) {
            throw new Error(
                `cannot remove panel ${panel.id}. it's missing a group.`
            );
        }

        group.model.removePanel(panel);

        panel.dispose();

        if (group.size === 0 && options.removeEmptyGroup) {
            this.removeGroup(group);
        }
    }

    createWatermarkComponent(): IWatermarkRenderer {
        return createComponent(
            'watermark-id',
            'watermark-name',
            this.options.watermarkComponent
                ? { 'watermark-name': this.options.watermarkComponent }
                : {},
            this.options.watermarkFrameworkComponent
                ? { 'watermark-name': this.options.watermarkFrameworkComponent }
                : {},
            this.options.frameworkComponentFactory?.watermark
        );
    }

    private updateWatermark(): void {
        if (this.groups.length === 0) {
            if (!this.watermark) {
                this.watermark = this.createWatermarkComponent();

                this.watermark.init({
                    containerApi: new DockviewApi(this),
                });

                const watermarkContainer = document.createElement('div');
                watermarkContainer.className = 'dv-watermark-container';
                watermarkContainer.appendChild(this.watermark.element);

                this.element.appendChild(watermarkContainer);
            }
        } else if (this.watermark) {
            this.watermark.element.parentElement!.remove();
            this.watermark.dispose?.();
            this.watermark = null;
        }
    }

    addGroup(options?: AddGroupOptions): DockviewGroupPanel {
        const group = this.createGroup();

        if (options) {
            let referenceGroup: DockviewGroupPanel | undefined;

            if (isGroupOptionsWithPanel(options)) {
                const referencePanel =
                    typeof options.referencePanel === 'string'
                        ? this.panels.find(
                              (panel) => panel.id === options.referencePanel
                          )
                        : options.referencePanel;

                if (!referencePanel) {
                    throw new Error(
                        `reference panel ${options.referencePanel} does not exist`
                    );
                }

                referenceGroup = this.findGroup(referencePanel);

                if (!referenceGroup) {
                    throw new Error(
                        `reference group for reference panel ${options.referencePanel} does not exist`
                    );
                }
            } else if (isGroupOptionsWithGroup(options)) {
                referenceGroup =
                    typeof options.referenceGroup === 'string'
                        ? this._groups.get(options.referenceGroup)?.value
                        : options.referenceGroup;

                if (!referenceGroup) {
                    throw new Error(
                        `reference group ${options.referenceGroup} does not exist`
                    );
                }
            } else {
                const group = this.orthogonalize(
                    directionToPosition(<Direction>options.direction)
                );
                return group;
            }

            const target = toTarget(<Direction>options.direction || 'within');

            const location = getGridLocation(referenceGroup.element);
            const relativeLocation = getRelativeLocation(
                this.gridview.orientation,
                location,
                target
            );
            this.doAddGroup(group, relativeLocation);
            return group;
        } else {
            this.doAddGroup(group);
            return group;
        }
    }

    removeGroup(group: DockviewGroupPanel, skipActive = false): void {
        const panels = [...group.panels]; // reassign since group panels will mutate

        for (const panel of panels) {
            this.removePanel(panel, {
                removeEmptyGroup: false,
                skipDispose: false,
            });
        }

        super.doRemoveGroup(group, { skipActive });
    }

    moveGroupOrPanel(
        destinationGroup: DockviewGroupPanel,
        sourceGroupId: string,
        sourceItemId: string | undefined,
        destinationTarget: Position,
        destinationIndex?: number
    ): void {
        const sourceGroup = sourceGroupId
            ? this._groups.get(sourceGroupId)?.value
            : undefined;

        if (sourceItemId === undefined) {
            if (sourceGroup) {
                this.moveGroup(
                    sourceGroup,
                    destinationGroup,
                    destinationTarget
                );
            }
            return;
        }

        if (!destinationTarget || destinationTarget === 'center') {
            const groupItem: IDockviewPanel | undefined =
                sourceGroup?.model.removePanel(sourceItemId) ||
                this.panels.find((panel) => panel.id === sourceItemId);

            if (!groupItem) {
                throw new Error(`No panel with id ${sourceItemId}`);
            }

            if (sourceGroup?.model.size === 0) {
                this.doRemoveGroup(sourceGroup);
            }

            destinationGroup.model.openPanel(groupItem, {
                index: destinationIndex,
            });
        } else {
            const referenceLocation = getGridLocation(destinationGroup.element);
            const targetLocation = getRelativeLocation(
                this.gridview.orientation,
                referenceLocation,
                destinationTarget
            );

            if (sourceGroup && sourceGroup.size < 2) {
                const [targetParentLocation, to] = tail(targetLocation);
                const sourceLocation = getGridLocation(sourceGroup.element);
                const [sourceParentLocation, from] = tail(sourceLocation);

                if (
                    sequenceEquals(sourceParentLocation, targetParentLocation)
                ) {
                    // special case when 'swapping' two views within same grid location
                    // if a group has one tab - we are essentially moving the 'group'
                    // which is equivalent to swapping two views in this case
                    this.gridview.moveView(sourceParentLocation, from, to);
                } else {
                    // source group will become empty so delete the group
                    const targetGroup = this.doRemoveGroup(sourceGroup, {
                        skipActive: true,
                        skipDispose: true,
                    });

                    // after deleting the group we need to re-evaulate the ref location
                    const updatedReferenceLocation = getGridLocation(
                        destinationGroup.element
                    );
                    const location = getRelativeLocation(
                        this.gridview.orientation,
                        updatedReferenceLocation,
                        destinationTarget
                    );
                    this.doAddGroup(targetGroup, location);
                }
            } else {
                const groupItem: IDockviewPanel | undefined =
                    sourceGroup?.model.removePanel(sourceItemId) ||
                    this.panels.find((panel) => panel.id === sourceItemId);

                if (!groupItem) {
                    throw new Error(`No panel with id ${sourceItemId}`);
                }

                const dropLocation = getRelativeLocation(
                    this.gridview.orientation,
                    referenceLocation,
                    destinationTarget
                );

                const group = this.createGroupAtLocation(dropLocation);
                group.model.openPanel(groupItem);
            }
        }
    }

    private moveGroup(
        sourceGroup: DockviewGroupPanel,
        referenceGroup: DockviewGroupPanel,
        target: Position
    ): void {
        if (sourceGroup) {
            if (!target || target === 'center') {
                const activePanel = sourceGroup.activePanel;
                const panels = [...sourceGroup.panels].map((p) =>
                    sourceGroup.model.removePanel(p.id)
                );

                if (sourceGroup?.model.size === 0) {
                    this.doRemoveGroup(sourceGroup);
                }

                for (const panel of panels) {
                    referenceGroup.model.openPanel(panel, {
                        skipSetPanelActive: panel !== activePanel,
                    });
                }
            } else {
                this.gridview.removeView(getGridLocation(sourceGroup.element));

                const referenceLocation = getGridLocation(
                    referenceGroup.element
                );
                const dropLocation = getRelativeLocation(
                    this.gridview.orientation,
                    referenceLocation,
                    target
                );

                this.gridview.addView(
                    sourceGroup,
                    Sizing.Distribute,
                    dropLocation
                );
            }
        }
    }

    doSetGroupActive(
        group: DockviewGroupPanel | undefined,
        skipFocus?: boolean
    ): void {
        const isGroupAlreadyFocused = this._activeGroup === group;
        super.doSetGroupActive(group, skipFocus);

        if (!isGroupAlreadyFocused && this._activeGroup?.activePanel) {
            this._onDidActivePanelChange.fire(this._activeGroup?.activePanel);
        }
    }

    createGroup(options?: GroupOptions): DockviewGroupPanel {
        if (!options) {
            options = {};
        }

        let id = options?.id;

        if (id && this._groups.has(options.id!)) {
            console.warn(
                `Duplicate group id ${options?.id}. reassigning group id to avoid errors`
            );
            id = undefined;
        }

        if (!id) {
            id = this.nextGroupId.next();
            while (this._groups.has(id)) {
                id = this.nextGroupId.next();
            }
        }

        const view = new DockviewGroupPanel(this, id, options);
        view.init({ params: {}, accessor: <any>null }); // required to initialized .part and allow for correct disposal of group

        if (!this._groups.has(view.id)) {
            const disposable = new CompositeDisposable(
                view.model.onMove((event) => {
                    const { groupId, itemId, target, index } = event;
                    this.moveGroupOrPanel(view, groupId, itemId, target, index);
                }),
                view.model.onDidDrop((event) => {
                    this._onDidDrop.fire({
                        ...event,
                        api: this._api,
                        group: view,
                    });
                }),
                view.model.onDidAddPanel((event) => {
                    this._onDidAddPanel.fire(event.panel);
                }),
                view.model.onDidRemovePanel((event) => {
                    this._onDidRemovePanel.fire(event.panel);
                }),
                view.model.onDidActivePanelChange((event) => {
                    this._onDidActivePanelChange.fire(event.panel);
                })
            );

            this._groups.set(view.id, { value: view, disposable });
        }

        // TODO: must be called after the above listeners have been setup,
        // not an ideal pattern
        view.initialize();

        return view;
    }

    private createPanel<P extends object = Parameters>(
        options: AddPanelOptions<P>,
        group: DockviewGroupPanel
    ): IDockviewPanel {
        const contentComponent = options.component;
        const tabComponent =
            options.tabComponent || this.options.defaultTabComponent;

        const view = new DockviewPanelModel(
            this,
            options.id,
            contentComponent,
            tabComponent
        );

        const panel = new DockviewPanel(
            options.id,
            this,
            this._api,
            group,
            view
        );
        panel.init({
            title: options.title || options.id,
            params: options?.params || {},
        });

        return panel;
    }

    private createGroupAtLocation(
        location: number[] = [0]
    ): DockviewGroupPanel {
        const group = this.createGroup();
        this.doAddGroup(group, location);
        return group;
    }

    private findGroup(panel: IDockviewPanel): DockviewGroupPanel | undefined {
        return Array.from(this._groups.values()).find((group) =>
            group.value.model.containsPanel(panel)
        )?.value;
    }

    public dispose(): void {
        this._onDidActivePanelChange.dispose();
        this._onDidAddPanel.dispose();
        this._onDidRemovePanel.dispose();
        this._onDidLayoutFromJSON.dispose();

        super.dispose();
    }
}
