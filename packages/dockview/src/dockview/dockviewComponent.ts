import {
    getRelativeLocation,
    SerializedGridObject,
    getGridLocation,
    ISerializedLeafNode,
} from '../gridview/gridview';
import { directionToPosition, Droptarget, Position } from '../dnd/droptarget';
import { tail, sequenceEquals } from '../array';
import { GroupviewPanelState, IDockviewPanel } from '../groupview/groupPanel';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { CompositeDisposable } from '../lifecycle';
import { Event, Emitter } from '../events';
import { Watermark } from './components/watermark/watermark';
import {
    IContentRenderer,
    ITabRenderer,
    IWatermarkRenderer,
} from '../groupview/types';
import { sequentialNumberGenerator } from '../math';
import { IPanelDeserializer } from './deserializer';
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
import {
    BaseGrid,
    Direction,
    IBaseGrid,
    toTarget,
} from '../gridview/baseComponentGridview';
import { DockviewApi } from '../api/component.api';
import { Orientation, Sizing } from '../splitview/core/splitview';
import { DefaultTab } from './components/tab/defaultTab';
import {
    GroupOptions,
    GroupPanelViewState,
    GroupviewDropEvent,
} from '../groupview/groupview';
import { GroupPanel, IGroupviewPanel } from '../groupview/groupviewPanel';
import { DefaultGroupPanelView } from './defaultGroupPanelView';
import { getPanelData } from '../dnd/dataTransfer';

const nextGroupId = sequentialNumberGenerator();

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
    options?: { tabHeight?: number };
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
    group: GroupPanel;
}

export interface IDockviewComponent extends IBaseGrid<GroupPanel> {
    readonly activePanel: IDockviewPanel | undefined;
    readonly totalPanels: number;
    readonly panels: IDockviewPanel[];
    readonly onDidDrop: Event<DockviewDropEvent>;
    tabHeight: number | undefined;
    deserializer: IPanelDeserializer | undefined;
    updateOptions(options: DockviewComponentUpdateOptions): void;
    moveGroupOrPanel(
        referenceGroup: GroupPanel,
        groupId: string,
        itemId: string,
        target: Position,
        index?: number
    ): void;
    doSetGroupActive: (group: GroupPanel, skipFocus?: boolean) => void;
    removeGroup: (group: GroupPanel) => void;
    options: DockviewComponentOptions;
    addPanel(options: AddPanelOptions): IDockviewPanel;
    removePanel(panel: IDockviewPanel): void;
    getGroupPanel: (id: string) => IDockviewPanel | undefined;
    createWatermarkComponent(): IWatermarkRenderer;
    // lifecycle
    addGroup(options?: AddGroupOptions): IGroupviewPanel;
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
    extends BaseGrid<GroupPanel>
    implements IDockviewComponent
{
    private _deserializer: IPanelDeserializer | undefined;
    private _api: DockviewApi;
    private _options: Exclude<DockviewComponentOptions, 'orientation'>;

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

    get totalPanels(): number {
        return this.panels.length;
    }

    get panels(): IDockviewPanel[] {
        return this.groups.flatMap((group) => group.panels);
    }

    get deserializer(): IPanelDeserializer | undefined {
        return this._deserializer;
    }

    set deserializer(value: IPanelDeserializer | undefined) {
        this._deserializer = value;
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

    set tabHeight(height: number | undefined) {
        this.options.tabHeight = height;
        this._groups.forEach((value) => {
            value.value.model.header.height = height;
        });
    }

    get tabHeight(): number | undefined {
        return this.options.tabHeight;
    }

    constructor(element: HTMLElement, options: DockviewComponentOptions) {
        super(element, {
            proportionalLayout: true,
            orientation: options.orientation || Orientation.HORIZONTAL,
            styles: options.styles,
        });

        this.addDisposables(
            this._onDidDrop,
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
            canDisplayOverlay: () => {
                return true;
            },
            acceptedTargetZones: ['top', 'bottom', 'left', 'right'],
            overlayModel: {
                activationSize: { type: 'pixels', value: 10 },
                size: { type: 'pixels', value: 20 },
            },
        });

        this.addDisposables(
            dropTarget,
            dropTarget.onDrop((event) => {
                const data = getPanelData();

                if (!data) {
                    return;
                }

                this.move(event.position, data.groupId, data.panelId);
            })
        );

        this._api = new DockviewApi(this);
    }

    private orthogonalize(position: Position): GroupPanel {
        switch (position) {
            case Position.Top:
            case Position.Bottom:
                if (this.gridview.orientation === Orientation.HORIZONTAL) {
                    // we need to add to a vertical splitview but the current root is a horizontal splitview.
                    // insert a vertical splitview at the root level and add the existing view as a child
                    this.gridview.insertOrthogonalSplitviewAtRoot();
                }
                break;
            case Position.Left:
            case Position.Right:
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
            case Position.Top:
            case Position.Left:
                return this.createGroupAtLocation([0]); // insert into first position
            case Position.Bottom:
            case Position.Right:
                return this.createGroupAtLocation([this.gridview.length]); // insert into last position
            default:
                throw new Error(`unsupported position ${position}`);
        }
    }

    private move(
        position: Position,
        groupId: string,
        panelId: string | null
    ): void {
        this.moveGroupOrPanel(
            this.orthogonalize(position),
            groupId,
            panelId || undefined,
            Position.Center
        );
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
        const next = <GroupPanel>this.gridview.next(location)?.view;
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
            this.doSetGroupActive(next as GroupPanel);
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
            options: { tabHeight: this.tabHeight },
        };
    }

    fromJSON(data: SerializedDockview): void {
        this.clear();

        if (!this.deserializer) {
            throw new Error('invalid deserializer');
        }
        const { grid, panels, options, activeGroup } = data;

        if (typeof options?.tabHeight === 'number') {
            this.tabHeight = options.tabHeight;
        }

        if (!this.deserializer) {
            throw new Error('no deserializer provided');
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
                    const panel = this.deserializer!.fromJSON(
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

    addPanel(options: AddPanelOptions): IDockviewPanel {
        if (this.panels.find((_) => _.id === options.id)) {
            throw new Error(`panel with id ${options.id} already exists`);
        }

        let referenceGroup: GroupPanel | undefined;

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
            if (target === Position.Center) {
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

        const retainGroupForWatermark = this.size === 1;

        if (
            !retainGroupForWatermark &&
            group.size === 0 &&
            options.removeEmptyGroup
        ) {
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

    addGroup(options: AddGroupOptions): GroupPanel {
        const group = this.createGroup();

        if (options) {
            let referenceGroup: GroupPanel | undefined;

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

    removeGroup(group: GroupPanel, skipActive = false): void {
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
        referenceGroup: GroupPanel,
        groupId: string,
        itemId: string | undefined,
        target: Position,
        index?: number
    ): void {
        const sourceGroup = groupId
            ? this._groups.get(groupId)?.value
            : undefined;

        if (itemId === undefined) {
            if (sourceGroup) {
                this.moveGroup(sourceGroup, referenceGroup, target);
            }
            return;
        }

        if (!target || target === Position.Center) {
            const groupItem: IDockviewPanel | undefined =
                sourceGroup?.model.removePanel(itemId) ||
                this.panels.find((panel) => panel.id === itemId);

            if (!groupItem) {
                throw new Error(`No panel with id ${itemId}`);
            }

            if (sourceGroup?.model.size === 0) {
                this.doRemoveGroup(sourceGroup);
            }

            referenceGroup.model.openPanel(groupItem, { index });
        } else {
            const referenceLocation = getGridLocation(referenceGroup.element);
            const targetLocation = getRelativeLocation(
                this.gridview.orientation,
                referenceLocation,
                target
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
                        referenceGroup.element
                    );
                    const location = getRelativeLocation(
                        this.gridview.orientation,
                        updatedReferenceLocation,
                        target
                    );
                    this.doAddGroup(targetGroup, location);
                }
            } else {
                const groupItem: IDockviewPanel | undefined =
                    sourceGroup?.model.removePanel(itemId) ||
                    this.panels.find((panel) => panel.id === itemId);

                if (!groupItem) {
                    throw new Error(`No panel with id ${itemId}`);
                }

                const dropLocation = getRelativeLocation(
                    this.gridview.orientation,
                    referenceLocation,
                    target
                );

                const group = this.createGroupAtLocation(dropLocation);
                group.model.openPanel(groupItem);
            }
        }
    }

    private moveGroup(
        sourceGroup: GroupPanel,
        referenceGroup: GroupPanel,
        target: Position
    ): void {
        if (sourceGroup) {
            if (!target || target === Position.Center) {
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

    doSetGroupActive(group: GroupPanel | undefined, skipFocus?: boolean): void {
        const isGroupAlreadyFocused = this._activeGroup === group;
        super.doSetGroupActive(group, skipFocus);

        if (!isGroupAlreadyFocused && this._activeGroup?.activePanel) {
            this._onDidActivePanelChange.fire(this._activeGroup?.activePanel);
        }
    }

    createGroup(options?: GroupOptions): GroupPanel {
        if (!options) {
            options = { tabHeight: this.tabHeight };
        }
        if (typeof options.tabHeight !== 'number') {
            options.tabHeight = this.tabHeight;
        }

        let id = options?.id;

        if (id && this._groups.has(options.id!)) {
            console.warn(
                `Duplicate group id ${options?.id}. reassigning group id to avoid errors`
            );
            id = undefined;
        }

        if (!id) {
            id = nextGroupId.next();
            while (this._groups.has(id)) {
                id = nextGroupId.next();
            }
        }

        const view = new GroupPanel(this, id, options);
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

        if (typeof this.options.tabHeight === 'number') {
            view.model.header.height = this.options.tabHeight;
        }

        return view;
    }

    private createPanel(
        options: AddPanelOptions,
        group: GroupPanel
    ): IDockviewPanel {
        const view = new DefaultGroupPanelView({
            content: this.createContentComponent(options.id, options.component),
            tab: this.createTabComponent(
                options.id,
                options.tabComponent || this.options.defaultTabComponent
            ),
        });

        const panel = new DockviewGroupPanel(
            options.id,
            this,
            this._api,
            group
        );
        panel.init({
            view,
            title: options.title || options.id,
            params: options?.params || {},
        });

        return panel;
    }

    private createContentComponent(
        id: string,
        componentName: string
    ): IContentRenderer {
        return createComponent(
            id,
            componentName,
            this.options.components || {},
            this.options.frameworkComponents,
            this.options.frameworkComponentFactory?.content
        );
    }

    private createTabComponent(
        id: string,
        componentName?: string
    ): ITabRenderer {
        return createComponent(
            id,
            componentName,
            this.options.tabComponents || {},
            this.options.frameworkTabComponents,
            this.options.frameworkComponentFactory?.tab,
            () => new DefaultTab()
        );
    }

    private createGroupAtLocation(location: number[] = [0]): GroupPanel {
        const group = this.createGroup();
        this.doAddGroup(group, location);
        return group;
    }

    private findGroup(panel: IDockviewPanel): GroupPanel | undefined {
        return Array.from(this._groups.values()).find((group) =>
            group.value.model.containsPanel(panel)
        )?.value;
    }

    public dispose(): void {
        super.dispose();

        this._onDidActivePanelChange.dispose();
        this._onDidAddPanel.dispose();
        this._onDidRemovePanel.dispose();
        this._onDidLayoutFromJSON.dispose();
    }
}
