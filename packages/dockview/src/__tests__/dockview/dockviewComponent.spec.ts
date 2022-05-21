import { DockviewComponent } from '../../dockview/dockviewComponent';
import {
    GroupPanelPartInitParameters,
    IContentRenderer,
    ITabRenderer,
} from '../../groupview/types';
import { PanelUpdateEvent } from '../../panel/types';
import { Orientation } from '../../splitview/core/splitview';
import { ReactPanelDeserialzier } from '../../react/deserializer';
import { Position } from '../../dnd/droptarget';
import { GroupPanel } from '../../groupview/groupviewPanel';
import { CompositeDisposable } from '../../lifecycle';
import {
    GroupPanelUpdateEvent,
    GroupviewPanelState,
    IDockviewPanel,
    IGroupPanelInitParameters,
} from '../../groupview/groupPanel';
import { IGroupPanelView } from '../../dockview/defaultGroupPanelView';
import {
    DockviewPanelApi,
    DockviewPanelApiImpl,
} from '../../api/groupPanelApi';
import { DefaultTab } from '../../dockview/components/tab/defaultTab';
import { Emitter } from '../../events';

class PanelContentPartTest implements IContentRenderer {
    element: HTMLElement = document.createElement('div');

    readonly _onDidDispose = new Emitter<void>();
    readonly onDidDispose = this._onDidDispose.event;

    isDisposed: boolean = false;

    constructor(public readonly id: string, component: string) {
        this.element.classList.add(`testpanel-${id}`);
    }

    updateParentGroup(group: GroupPanel, isPanelVisible: boolean): void {
        //noop
    }

    init(parameters: GroupPanelPartInitParameters): void {
        //noop
    }

    layout(width: number, height: number): void {
        //noop
    }

    update(event: PanelUpdateEvent): void {
        //noop
    }

    toJSON(): object {
        return { id: this.id };
    }

    focus(): void {
        //noop
    }

    dispose(): void {
        this.isDisposed = true;
        this._onDidDispose.fire();
    }
}

class PanelTabPartTest implements ITabRenderer {
    element: HTMLElement = document.createElement('div');

    readonly _onDidDispose = new Emitter<void>();
    readonly onDidDispose = this._onDidDispose.event;

    isDisposed: boolean = false;

    constructor(public readonly id: string, component: string) {
        this.element.classList.add(`testpanel-${id}`);
    }

    updateParentGroup(group: GroupPanel, isPanelVisible: boolean): void {
        //noop
    }

    init(parameters: GroupPanelPartInitParameters): void {
        //noop
    }

    layout(width: number, height: number): void {
        //noop
    }

    update(event: PanelUpdateEvent): void {
        //noop
    }

    toJSON(): object {
        return { id: this.id };
    }

    focus(): void {
        //noop
    }

    dispose(): void {
        this.isDisposed = true;
        this._onDidDispose.fire();
    }
}

class TestGroupPanelView implements IGroupPanelView {
    readonly tab: ITabRenderer = new DefaultTab();

    constructor(public readonly content: IContentRenderer) {
        //
    }

    update(event: GroupPanelUpdateEvent): void {
        //
    }

    layout(width: number, height: number): void {
        //
    }

    init(params: GroupPanelPartInitParameters): void {
        //
    }

    updateParentGroup(group: GroupPanel, isPanelVisible: boolean): void {
        //
    }

    toJSON(): {} {
        return {};
    }

    dispose(): void {
        //
    }
}

class TestGroupPanel implements IDockviewPanel {
    private _group: GroupPanel | undefined;

    readonly view: IGroupPanelView;
    readonly suppressClosable: boolean = false;
    readonly api: DockviewPanelApi;

    constructor(
        public readonly id: string,
        public readonly title: string,
        accessor: DockviewComponent
    ) {
        this.api = new DockviewPanelApiImpl(this, this._group);
        this._group = new GroupPanel(accessor, id, {});
        this.view = new TestGroupPanelView(
            new PanelContentPartTest(id, 'component')
        );
    }

    get params(): Record<string, any> {
        return {};
    }

    get group(): GroupPanel | undefined {
        return this._group;
    }

    updateParentGroup(group: GroupPanel, isGroupActive: boolean): void {
        this._group = group;
    }

    init(params: IGroupPanelInitParameters): void {
        //
    }

    layout(width: number, height: number): void {
        //
    }

    focus(): void {
        //
    }

    toJSON(): GroupviewPanelState {
        return {
            id: this.id,
            title: this.title,
        };
    }

    update(event: GroupPanelUpdateEvent): void {
        //
    }

    dispose(): void {
        //
    }
}

describe('dockviewComponent', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;

    beforeEach(() => {
        container = document.createElement('div');

        dockview = new DockviewComponent(container, {
            components: {
                default: PanelContentPartTest,
            },
        });
    });

    test('duplicate panel', () => {
        dockview.layout(500, 1000);

        dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });

        expect(() => {
            dockview.addPanel({
                id: 'panel1',
                component: 'default',
            });
        }).toThrowError('panel with id panel1 already exists');
    });

    test('set active panel', () => {
        dockview.layout(500, 1000);

        dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });
        dockview.addPanel({
            id: 'panel2',
            component: 'default',
        });
        dockview.addPanel({
            id: 'panel3',
            component: 'default',
        });
        dockview.addPanel({
            id: 'panel4',
            component: 'default',
        });

        const panel1 = dockview.getGroupPanel('panel1');
        const panel2 = dockview.getGroupPanel('panel2');
        const panel3 = dockview.getGroupPanel('panel3');
        const panel4 = dockview.getGroupPanel('panel4');

        const group1 = panel1.group;
        dockview.moveGroupOrPanel(group1, group1.id, 'panel1', Position.Right);
        const group2 = panel1.group;
        dockview.moveGroupOrPanel(group2, group1.id, 'panel3', Position.Center);

        expect(dockview.activeGroup).toBe(group2);
        expect(dockview.activeGroup.model.activePanel).toBe(panel3);
        expect(dockview.activeGroup.model.indexOf(panel3)).toBe(1);

        dockview.moveToPrevious({ includePanel: true });
        expect(dockview.activeGroup).toBe(group2);
        expect(dockview.activeGroup.model.activePanel).toBe(panel1);

        dockview.moveToNext({ includePanel: true });
        expect(dockview.activeGroup).toBe(group2);
        expect(dockview.activeGroup.model.activePanel).toBe(panel3);

        dockview.moveToPrevious({ includePanel: false });
        expect(dockview.activeGroup).toBe(group1);
        expect(dockview.activeGroup.model.activePanel).toBe(panel4);

        dockview.moveToPrevious({ includePanel: true });
        expect(dockview.activeGroup).toBe(group1);
        expect(dockview.activeGroup.model.activePanel).toBe(panel2);

        dockview.moveToNext({ includePanel: false });
        expect(dockview.activeGroup).toBe(group2);
        expect(dockview.activeGroup.model.activePanel).toBe(panel3);
    });

    test('remove group', () => {
        dockview.layout(500, 1000);

        dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });
        dockview.addPanel({
            id: 'panel2',
            component: 'default',
        });
        dockview.addPanel({
            id: 'panel3',
            component: 'default',
        });
        dockview.addPanel({
            id: 'panel4',
            component: 'default',
        });

        const panel1 = dockview.getGroupPanel('panel1');
        const panel2 = dockview.getGroupPanel('panel2');
        const group1 = panel1.group;
        dockview.moveGroupOrPanel(group1, group1.id, 'panel1', Position.Right);
        const group2 = panel1.group;
        dockview.moveGroupOrPanel(group2, group1.id, 'panel3', Position.Center);

        expect(dockview.size).toBe(2);
        expect(dockview.totalPanels).toBe(4);
        expect(panel1.group.model.size).toBe(2);
        expect(panel2.group.model.size).toBe(2);

        dockview.removeGroup(panel1.group);

        expect(dockview.size).toBe(1);
        expect(dockview.totalPanels).toBe(2);

        dockview.removeGroup(panel2.group);

        expect(dockview.size).toBe(0);
        expect(dockview.totalPanels).toBe(0);
    });

    test('active panel', () => {
        dockview.layout(500, 1000);

        dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });
        dockview.addPanel({
            id: 'panel2',
            component: 'default',
        });
        dockview.addPanel({
            id: 'panel3',
            component: 'default',
        });
        dockview.addPanel({
            id: 'panel4',
            component: 'default',
        });

        const panel1 = dockview.getGroupPanel('panel1');
        const panel2 = dockview.getGroupPanel('panel2');
        const panel3 = dockview.getGroupPanel('panel3');
        const panel4 = dockview.getGroupPanel('panel4');

        expect(panel1.api.isActive).toBeFalsy();
        expect(panel2.api.isActive).toBeFalsy();
        expect(panel3.api.isActive).toBeFalsy();
        expect(panel4.api.isActive).toBeTruthy();

        panel1.api.setActive();

        expect(panel1.api.isActive).toBeTruthy();
        expect(panel2.api.isActive).toBeFalsy();
        expect(panel3.api.isActive).toBeFalsy();
        expect(panel4.api.isActive).toBeFalsy();

        panel2.api.setActive();

        expect(panel1.api.isActive).toBeFalsy();
        expect(panel2.api.isActive).toBeTruthy();
        expect(panel3.api.isActive).toBeFalsy();
        expect(panel4.api.isActive).toBeFalsy();

        const group1 = panel1.group;
        dockview.moveGroupOrPanel(group1, group1.id, 'panel1', Position.Right);
        const group2 = panel1.group;
        dockview.moveGroupOrPanel(group2, group1.id, 'panel3', Position.Center);

        expect(dockview.size).toBe(2);
        expect(panel1.group).toBe(panel3.group);
        expect(panel2.group).toBe(panel4.group);
        expect(panel1.group).not.toBe(panel2.group);

        expect(panel1.api.isActive).toBeFalsy();
        expect(panel2.api.isActive).toBeFalsy();
        expect(panel3.api.isActive).toBeTruthy();
        expect(panel4.api.isActive).toBeFalsy();

        panel1.api.setActive();
        expect(panel1.api.isActive).toBeTruthy();
        expect(panel2.api.isActive).toBeFalsy();
        expect(panel3.api.isActive).toBeFalsy();
        expect(panel4.api.isActive).toBeFalsy();

        panel2.api.setActive();
        expect(panel1.api.isActive).toBeFalsy();
        expect(panel2.api.isActive).toBeTruthy();
        expect(panel3.api.isActive).toBeFalsy();
        expect(panel4.api.isActive).toBeFalsy();

        panel3.api.setActive();
        expect(panel1.api.isActive).toBeFalsy();
        expect(panel2.api.isActive).toBeFalsy();
        expect(panel3.api.isActive).toBeTruthy();
        expect(panel4.api.isActive).toBeFalsy();

        panel4.api.setActive();
        expect(panel1.api.isActive).toBeFalsy();
        expect(panel2.api.isActive).toBeFalsy();
        expect(panel3.api.isActive).toBeFalsy();
        expect(panel4.api.isActive).toBeTruthy();
    });

    test('add a panel and move to a new group', async () => {
        dockview.layout(500, 1000);

        dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });

        dockview.addPanel({
            id: 'panel2',
            component: 'default',
        });

        expect(dockview.size).toBe(1);
        expect(dockview.totalPanels).toBe(2);

        const panel1 = dockview.getGroupPanel('panel1');
        const panel2 = dockview.getGroupPanel('panel2');

        expect(panel1.group).toBe(panel2.group);

        const group = panel1.group;

        expect(group.model.size).toBe(2);
        expect(group.model.containsPanel(panel1)).toBeTruthy();
        expect(group.model.containsPanel(panel2)).toBeTruthy();
        expect(group.model.activePanel).toBe(panel2);

        expect(group.model.indexOf(panel1)).toBe(0);
        expect(group.model.indexOf(panel2)).toBe(1);

        dockview.moveGroupOrPanel(group, group.id, 'panel1', Position.Right);

        expect(dockview.size).toBe(2);
        expect(dockview.totalPanels).toBe(2);

        expect(panel1.group).not.toBe(panel2.group);
        expect(panel1.group.model.size).toBe(1);
        expect(panel2.group.model.size).toBe(1);
        expect(panel1.group.model.containsPanel(panel1)).toBeTruthy();
        expect(panel2.group.model.containsPanel(panel2)).toBeTruthy();
        expect(panel1.group.model.activePanel).toBe(panel1);
        expect(panel2.group.model.activePanel).toBe(panel2);

        await panel1.api.close();

        expect(dockview.size).toBe(1);
        expect(dockview.totalPanels).toBe(1);

        await panel2.api.close();

        expect(dockview.size).toBe(1); // watermark
        expect(dockview.totalPanels).toBe(0);
    });

    test('panel content added to content-container css check', () => {
        dockview.layout(500, 1000);

        dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });

        dockview.addPanel({
            id: 'panel2',
            component: 'default',
        });

        let viewQuery = container.querySelectorAll(
            '.branch-node > .split-view-container > .view-container > .view'
        );

        expect(viewQuery.length).toBe(1);

        viewQuery = container.querySelectorAll(
            '.branch-node > .split-view-container > .view-container > .view:nth-child(1) >.groupview > .content-container > .testpanel-panel2'
        );

        expect(viewQuery.length).toBe(1);

        const group = dockview.getGroupPanel('panel1').group;
        dockview.moveGroupOrPanel(group, group.id, 'panel1', Position.Right);

        viewQuery = container.querySelectorAll(
            '.branch-node > .split-view-container > .view-container > .view'
        );

        expect(viewQuery.length).toBe(2);

        viewQuery = container.querySelectorAll(
            '.branch-node > .split-view-container > .view-container > .view:nth-child(1) >.groupview > .content-container > .testpanel-panel2'
        );

        expect(viewQuery.length).toBe(1);

        viewQuery = container.querySelectorAll(
            '.branch-node > .split-view-container > .view-container > .view:nth-child(2) >.groupview > .content-container > .testpanel-panel1'
        );

        expect(viewQuery.length).toBe(1);
    });

    test('serialization', () => {
        dockview.layout(1000, 1000);

        dockview.deserializer = new ReactPanelDeserialzier(dockview);
        dockview.fromJSON({
            activeGroup: 'group-1',
            grid: {
                root: {
                    type: 'branch',
                    data: [
                        {
                            type: 'leaf',
                            data: {
                                views: ['panel1'],
                                id: 'group-1',
                                activeView: 'panel1',
                            },
                            size: 500,
                        },
                        {
                            type: 'branch',
                            data: [
                                {
                                    type: 'leaf',
                                    data: {
                                        views: ['panel2', 'panel3'],
                                        id: 'group-2',
                                    },
                                    size: 500,
                                },
                                {
                                    type: 'leaf',
                                    data: { views: ['panel4'], id: 'group-3' },
                                    size: 500,
                                },
                            ],
                            size: 250,
                        },
                        {
                            type: 'leaf',
                            data: { views: ['panel5'], id: 'group-4' },
                            size: 250,
                        },
                    ],
                    size: 1000,
                },
                height: 1000,
                width: 1000,
                orientation: Orientation.VERTICAL,
            },
            panels: {
                panel1: {
                    id: 'panel1',
                    view: { content: { id: 'default' } },
                    title: 'panel1',
                },
                panel2: {
                    id: 'panel2',
                    view: { content: { id: 'default' } },
                    title: 'panel2',
                },
                panel3: {
                    id: 'panel3',
                    view: { content: { id: 'default' } },
                    title: 'panel3',
                },
                panel4: {
                    id: 'panel4',
                    view: { content: { id: 'default' } },
                    title: 'panel4',
                },
                panel5: {
                    id: 'panel5',
                    view: { content: { id: 'default' } },
                    title: 'panel5',
                },
            },
            options: { tabHeight: 25 },
        });

        expect(JSON.parse(JSON.stringify(dockview.toJSON()))).toEqual({
            activeGroup: 'group-1',
            grid: {
                root: {
                    type: 'branch',
                    data: [
                        {
                            type: 'leaf',
                            data: {
                                views: ['panel1'],
                                id: 'group-1',
                                activeView: 'panel1',
                            },
                            size: 500,
                        },
                        {
                            type: 'branch',
                            data: [
                                {
                                    type: 'leaf',
                                    data: {
                                        views: ['panel2', 'panel3'],
                                        id: 'group-2',
                                        activeView: 'panel3',
                                    },
                                    size: 500,
                                },
                                {
                                    type: 'leaf',
                                    data: {
                                        views: ['panel4'],
                                        id: 'group-3',
                                        activeView: 'panel4',
                                    },
                                    size: 500,
                                },
                            ],
                            size: 250,
                        },
                        {
                            type: 'leaf',
                            data: {
                                views: ['panel5'],
                                id: 'group-4',
                                activeView: 'panel5',
                            },
                            size: 250,
                        },
                    ],
                    size: 1000,
                },
                height: 1000,
                width: 1000,
                orientation: Orientation.VERTICAL,
            },
            panels: {
                panel1: {
                    id: 'panel1',
                    view: { content: { id: 'default' } },
                    title: 'panel1',
                },
                panel2: {
                    id: 'panel2',
                    view: { content: { id: 'default' } },
                    title: 'panel2',
                },
                panel3: {
                    id: 'panel3',
                    view: { content: { id: 'default' } },
                    title: 'panel3',
                },
                panel4: {
                    id: 'panel4',
                    view: { content: { id: 'default' } },
                    title: 'panel4',
                },
                panel5: {
                    id: 'panel5',
                    view: { content: { id: 'default' } },
                    title: 'panel5',
                },
            },
            options: { tabHeight: 25 },
        });
    });

    test('add panel', () => {
        dockview.layout(500, 1000);

        dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });

        const panel1 = dockview.getGroupPanel('panel1');

        expect(panel1!.api.id).toBe('panel1');
        expect(panel1!.api.isVisible).toBeTruthy();
        expect(panel1!.api.isActive).toBeTruthy();
        // expect(panel1?.api.isFocused).toBeTruthy();
        expect(panel1!.api.height).toBe(1000);
        expect(panel1!.api.width).toBe(500);
        expect(panel1!.api.group).toBe(panel1?.group);
        expect(panel1!.api.group.isActive).toBeTruthy();
        expect(panel1!.api.isGroupActive).toBeTruthy();

        dockview.addPanel({
            id: 'panel2',
            component: 'default',
        });

        expect(panel1?.api.isActive).toBeFalsy();
        // expect(panel1?.api.isFocused).toBeFalsy();
        expect(panel1?.api.isVisible).toBeFalsy();
        expect(panel1!.api.isGroupActive).toBeTruthy();
        expect(panel1!.api.group.isActive).toBeTruthy();

        const panel2 = dockview.getGroupPanel('panel2');

        expect(panel2!.api.id).toBe('panel2');
        expect(panel2!.api.isVisible).toBeTruthy();
        expect(panel2!.api.isActive).toBeTruthy();
        // expect(panel2?.api.isFocused).toBeTruthy();
        expect(panel2!.api.height).toBe(1000);
        expect(panel2!.api.width).toBe(500);
        expect(panel2!.api.group).toBe(panel2?.group);
        expect(panel2!.api.isGroupActive).toBeTruthy();
        expect(panel2!.api.group.isActive).toBeTruthy();

        dockview.addPanel({
            id: 'panel3',
            component: 'default',
            position: { referencePanel: 'panel1', direction: 'right' },
        });

        expect(panel1!.api.isActive).toBeFalsy();
        expect(panel1!.api.isVisible).toBeFalsy();
        expect(panel1!.api.isGroupActive).toBeFalsy();
        expect(panel1!.api.group.isActive).toBeFalsy();
        expect(panel2!.api.isActive).toBeFalsy();
        expect(panel2!.api.isVisible).toBeTruthy();
        expect(panel2!.api.isGroupActive).toBeFalsy();
        expect(panel2!.api.group.isActive).toBeFalsy();

        const panel3 = dockview.getGroupPanel('panel3');

        expect(panel3!.api.isActive).toBeTruthy();
        expect(panel3!.api.isGroupActive).toBeTruthy();
        expect(panel3!.api.group.isActive).toBeTruthy();

        dockview.setActivePanel(panel1!);

        expect(panel1!.api.isActive).toBeTruthy();
        expect(panel1!.api.isVisible).toBeTruthy();
        expect(panel1!.api.isGroupActive).toBeTruthy();
        expect(panel1!.api.group.isActive).toBeTruthy();
        expect(panel2!.api.isActive).toBeFalsy();
        expect(panel2!.api.isVisible).toBeFalsy();
        expect(panel2!.api.isGroupActive).toBeTruthy();
        expect(panel2!.api.group.isActive).toBeTruthy();
        expect(panel3!.api.isActive).toBeFalsy();
        expect(panel3!.api.isVisible).toBeTruthy();
        expect(panel3!.api.isGroupActive).toBeFalsy();
        expect(panel3!.api.group.isActive).toBeFalsy();
    });

    test('toJSON shouldnt fire any layout events', () => {
        dockview.layout(1000, 1000);

        dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });
        dockview.addPanel({
            id: 'panel2',
            component: 'default',
        });
        dockview.addPanel({
            id: 'panel3',
            component: 'default',
        });
        dockview.addPanel({
            id: 'panel4',
            component: 'default',
        });

        const disposable = dockview.onDidLayoutChange(() => {
            fail('onDidLayoutChange shouldnt have been called');
        });

        const result = dockview.toJSON();
        expect(result).toBeTruthy();

        disposable.dispose();
    });

    test('totalPanels is updated before panel event fires', () => {
        dockview.layout(1000, 1000);

        let counter = 0;

        const disposable = new CompositeDisposable(
            dockview.onDidAddPanel(() => {
                counter++;
                expect(counter).toBe(dockview.totalPanels);
            }),
            dockview.onDidRemovePanel(() => {
                counter--;
                expect(counter).toBe(dockview.totalPanels);
            })
        );

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });

        const panel2 = dockview.addPanel({
            id: 'panel2',
            component: 'default',
            position: { referencePanel: 'panel1', direction: 'within' },
        });

        const panel3 = dockview.addPanel({
            id: 'panel3',
            component: 'default',
            position: { referencePanel: 'panel1', direction: 'right' },
        });

        dockview.removePanel(panel1);
        dockview.removePanel(panel3);
        dockview.removePanel(panel2);

        disposable.dispose();
    });

    test('size is updated before group event fires', () => {
        dockview.layout(1000, 1000);

        let counter = 0;

        const disposable = new CompositeDisposable(
            dockview.onDidAddGroup(() => {
                counter++;
                expect(counter).toBe(dockview.size);
            }),
            dockview.onDidRemoveGroup(() => {
                counter--;
                expect(counter).toBe(dockview.size);
            })
        );

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });

        const panel2 = dockview.addPanel({
            id: 'panel2',
            component: 'default',
            position: { referencePanel: 'panel1', direction: 'within' },
        });

        const panel3 = dockview.addPanel({
            id: 'panel3',
            component: 'default',
            position: { referencePanel: 'panel1', direction: 'right' },
        });

        dockview.removePanel(panel1);
        dockview.removePanel(panel3);
        dockview.removePanel(panel2);

        disposable.dispose();
    });

    test('events flow', () => {
        dockview.layout(1000, 1000);

        let events: {
            panel?: IDockviewPanel;
            group?: GroupPanel | undefined;
            type: string;
        }[] = [];

        const disposable = new CompositeDisposable(
            dockview.onDidAddGroup((group) => {
                events.push({ type: 'ADD_GROUP', group });
            }),
            dockview.onDidActiveGroupChange((group) => {
                events.push({ type: 'ACTIVE_GROUP', group });
            }),
            dockview.onDidRemoveGroup((group) => {
                events.push({ type: 'REMOVE_GROUP', group });
            }),
            dockview.onDidAddPanel((panel) => {
                events.push({ type: 'ADD_PANEL', panel });
            }),
            dockview.onDidRemovePanel((panel) => {
                events.push({ type: 'REMOVE_PANEL', panel });
            }),
            dockview.onDidActivePanelChange((panel) => {
                events.push({ type: 'ACTIVE_PANEL', panel });
            })
        );

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });

        expect(panel1.group).toBeTruthy();

        expect(events).toEqual([
            { type: 'ADD_GROUP', group: panel1.group },
            { type: 'ACTIVE_GROUP', group: panel1.group },
            { type: 'ADD_PANEL', panel: panel1 },
            { type: 'ACTIVE_PANEL', panel: panel1 },
        ]);

        events = [];
        const panel2 = dockview.addPanel({
            id: 'panel2',
            component: 'default',
        });
        expect(events).toEqual([
            { type: 'ADD_PANEL', panel: panel2 },
            { type: 'ACTIVE_PANEL', panel: panel2 },
        ]);

        events = [];
        const panel3 = dockview.addPanel({
            id: 'panel3',
            component: 'default',
        });
        expect(events).toEqual([
            { type: 'ADD_PANEL', panel: panel3 },
            { type: 'ACTIVE_PANEL', panel: panel3 },
        ]);

        events = [];
        dockview.removePanel(panel1);
        expect(events).toEqual([{ type: 'REMOVE_PANEL', panel: panel1 }]);

        events = [];
        dockview.removePanel(panel3);
        expect(events).toEqual([
            { type: 'REMOVE_PANEL', panel: panel3 },
            { type: 'ACTIVE_PANEL', panel: panel2 },
        ]);

        events = [];
        const panel4 = dockview.addPanel({
            id: 'panel4',
            component: 'default',
            position: { referencePanel: panel2.id, direction: 'right' },
        });

        expect(panel4.group).toBeTruthy();
        expect(panel4.group).not.toBe(panel1.group);

        expect(events).toEqual([
            { type: 'ADD_GROUP', group: panel4.group },
            { type: 'ACTIVE_GROUP', group: panel4.group },
            { type: 'ADD_PANEL', panel: panel4 },
            { type: 'ACTIVE_PANEL', panel: panel4 },
        ]);

        events = [];
        const panel5 = dockview.addPanel({
            id: 'panel5',
            component: 'default',
            position: { referencePanel: panel4.id, direction: 'within' },
        });
        expect(events).toEqual([
            { type: 'ADD_PANEL', panel: panel5 },
            { type: 'ACTIVE_PANEL', panel: panel5 },
        ]);

        events = [];
        dockview.moveGroupOrPanel(
            panel2.group!,
            panel5.group!.id,
            panel5.id,
            Position.Center
        );
        expect(events).toEqual([
            { type: 'REMOVE_PANEL', panel: panel5 },
            { type: 'ACTIVE_PANEL', panel: panel4 },
            { type: 'ADD_PANEL', panel: panel5 },
            { type: 'ACTIVE_PANEL', panel: panel5 },
            { type: 'ACTIVE_GROUP', group: panel2.group },
            { type: 'ACTIVE_PANEL', panel: panel5 },
        ]);

        events = [];

        const groupReferenceBeforeMove = panel4.group;

        dockview.moveGroupOrPanel(
            panel2.group!,
            panel4.group!.id,
            panel4.id,
            Position.Center
        );

        expect(events).toEqual([
            { type: 'REMOVE_PANEL', panel: panel4 },
            { type: 'REMOVE_GROUP', group: groupReferenceBeforeMove },
            { type: 'ADD_PANEL', panel: panel4 },
            { type: 'ACTIVE_PANEL', panel: panel4 },
        ]);

        disposable.dispose();
    });

    test('that removing a panel from a group reflects in the dockviewcomponent when searching for a panel', () => {
        dockview.layout(500, 500);

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });

        const panel2 = dockview.addPanel({
            id: 'panel2',
            component: 'default',
        });

        expect(dockview.getGroupPanel('panel1')).toEqual(panel1);
        expect(dockview.getGroupPanel('panel2')).toEqual(panel2);

        panel1.group.model.removePanel(panel1);

        expect(dockview.getGroupPanel('panel1')).toBeUndefined();
        expect(dockview.getGroupPanel('panel2')).toEqual(panel2);

        dockview.removePanel(panel2);

        expect(dockview.getGroupPanel('panel1')).toBeUndefined();
        expect(dockview.getGroupPanel('panel2')).toBeUndefined();
    });

    test('#1', () => {
        dockview.layout(500, 500);
        dockview.deserializer = {
            fromJSON: (panelData: GroupviewPanelState): IDockviewPanel => {
                return new TestGroupPanel(
                    panelData.id,
                    panelData.title,
                    dockview
                );
            },
        };

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });

        const panel2 = dockview.addPanel({
            id: 'panel2',
            component: 'default',
        });

        const panel3 = dockview.addPanel({
            id: 'panel3',
            component: 'default',
            position: { referencePanel: 'panel2', direction: 'below' },
        });

        const removedGroups: GroupPanel[] = [];
        const removedPanels: IDockviewPanel[] = [];

        const disposable = new CompositeDisposable(
            dockview.onDidRemoveGroup((group) => {
                removedGroups.push(group);
            }),
            dockview.onDidRemovePanel((panel) => {
                removedPanels.push(panel);
            })
        );

        dockview.fromJSON({
            grid: {
                height: 500,
                width: 500,
                orientation: Orientation.HORIZONTAL,
                root: {
                    type: 'branch',
                    data: [
                        {
                            type: 'leaf',
                            data: {
                                views: ['view_1', 'view_2'],
                                id: 'group_1',
                            },
                        },
                        {
                            type: 'leaf',
                            data: { views: ['view_3'], id: 'group_2' },
                        },
                    ],
                },
            },
            panels: {
                view_1: {
                    id: 'view_1',
                    title: 'view_1_title',
                    view: {},
                },
                view_2: {
                    id: 'view_2',
                    title: 'view_2_title',
                    view: {},
                },
                view_3: {
                    id: 'view_3',
                    title: 'view_3_title',
                    view: {},
                },
            },
            options: {},
        });

        expect(removedGroups.length).toBe(2);
        expect(removedPanels.length).toBe(3);

        disposable.dispose();
    });

    test('dispose of dockviewComponent', () => {
        dockview.layout(500, 1000);

        dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });
        dockview.addPanel({
            id: 'panel2',
            component: 'default',
        });
        dockview.addPanel({
            id: 'panel3',
            component: 'default',
        });
        dockview.addPanel({
            id: 'panel4',
            component: 'default',
        });

        expect(container.childNodes.length).toBe(1);

        dockview.dispose();

        expect(container.childNodes.length).toBe(0);
    });

    test('panel is disposed of when closed', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            components: { default: PanelContentPartTest },
        });

        dockview.layout(500, 1000);

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
            tabComponent: 'default',
        });

        const panel1Spy = jest.spyOn(panel1, 'dispose');

        expect(panel1Spy).not.toHaveBeenCalled();

        panel1.api.close();

        expect(panel1Spy).toBeCalledTimes(1);
    });

    test('can add panel of same id if already removed', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            components: { default: PanelContentPartTest },
        });

        dockview.layout(500, 1000);

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
            tabComponent: 'default',
        });

        expect(dockview.totalPanels).toBe(1);

        panel1.api.close();

        expect(dockview.totalPanels).toBe(0);

        const panel1Again = dockview.addPanel({
            id: 'panel1',
            component: 'default',
            tabComponent: 'default',
        });

        expect(dockview.totalPanels).toBe(1);

        panel1Again.api.close();

        expect(dockview.totalPanels).toBe(0);
    });

    test('last group is retained for watermark', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            components: { default: PanelContentPartTest },
        });

        dockview.layout(500, 1000);

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
            tabComponent: 'default',
        });

        expect(dockview.size).toBe(1);
        expect(dockview.totalPanels).toBe(1);

        const group = panel1.group;

        dockview.removePanel(panel1);

        expect(group.model.hasWatermark).toBeTruthy();
        expect(dockview.size).toBe(1);
        expect(dockview.totalPanels).toBe(0);

        const panel2 = dockview.addPanel({
            id: 'panel2',
            component: 'default',
            tabComponent: 'default',
        });

        expect(group.model.hasWatermark).toBeFalsy();

        const panel3 = dockview.addPanel({
            id: 'panel3',
            component: 'default',
            tabComponent: 'default',
        });

        expect(dockview.size).toBe(1);
        expect(dockview.totalPanels).toBe(2);

        panel2.api.close();
        expect(group.model.hasWatermark).toBeFalsy();
        panel3.api.close();
        expect(group.model.hasWatermark).toBeTruthy();
    });

    test('panel is disposed of when removed', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            components: { default: PanelContentPartTest },
        });

        dockview.layout(500, 1000);

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
            tabComponent: 'default',
        });

        const panel1Spy = jest.spyOn(panel1, 'dispose');

        expect(panel1Spy).not.toHaveBeenCalled();

        dockview.removePanel(panel1);

        expect(panel1Spy).toBeCalledTimes(1);
    });

    test('panel is not disposed of when moved to a new group', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            components: {
                default: PanelContentPartTest,
            },
        });

        dockview.layout(500, 1000);

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
            tabComponent: 'default',
        });

        const panel2 = dockview.addPanel({
            id: 'panel2',
            component: 'default',
            tabComponent: 'default',
            position: {
                referencePanel: 'panel1',
                direction: 'right',
            },
        });

        const panel1Spy = jest.spyOn(panel1, 'dispose');
        const panel2Spy = jest.spyOn(panel2, 'dispose');

        dockview.moveGroupOrPanel(
            panel1.group,
            panel2.group.id,
            'panel2',
            Position.Left
        );

        expect(panel1Spy).not.toHaveBeenCalled();
        expect(panel2Spy).not.toHaveBeenCalled();
    });

    test('panel is not disposed of when moved within another group', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            components: {
                default: PanelContentPartTest,
            },
        });

        dockview.layout(500, 1000);

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
            tabComponent: 'default',
        });

        const panel2 = dockview.addPanel({
            id: 'panel2',
            component: 'default',
            tabComponent: 'default',
            position: {
                referencePanel: 'panel1',
                direction: 'right',
            },
        });

        const panel1Spy = jest.spyOn(panel1, 'dispose');
        const panel2Spy = jest.spyOn(panel2, 'dispose');

        dockview.moveGroupOrPanel(
            panel1.group,
            panel2.group.id,
            'panel2',
            Position.Center
        );

        expect(panel1Spy).not.toHaveBeenCalled();
        expect(panel2Spy).not.toHaveBeenCalled();
    });

    test('panel is not disposed of when moved within another group', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            components: {
                default: PanelContentPartTest,
            },
        });

        dockview.layout(500, 1000);

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
            tabComponent: 'default',
        });

        const panel2 = dockview.addPanel({
            id: 'panel2',
            component: 'default',
            tabComponent: 'default',
        });

        expect(panel1.group).toEqual(panel2.group);

        const panel1Spy = jest.spyOn(panel1, 'dispose');
        const panel2Spy = jest.spyOn(panel2, 'dispose');

        dockview.moveGroupOrPanel(
            panel1.group,
            panel1.group.id,
            'panel1',
            Position.Center,
            0
        );

        expect(panel1Spy).not.toHaveBeenCalled();
        expect(panel2Spy).not.toHaveBeenCalled();
    });

    test('panel is disposed of when group is disposed', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            components: {
                default: PanelContentPartTest,
            },
        });

        dockview.layout(500, 1000);

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
            tabComponent: 'default',
        });

        const panel2 = dockview.addPanel({
            id: 'panel2',
            component: 'default',
            tabComponent: 'default',
        });

        expect(panel1.group).toEqual(panel2.group);

        const panel1Spy = jest.spyOn(panel1, 'dispose');
        const panel2Spy = jest.spyOn(panel2, 'dispose');

        dockview.removeGroup(panel1.group);

        expect(panel1Spy).toBeCalledTimes(1);
        expect(panel2Spy).toBeCalledTimes(1);
    });

    test('panel is disposed of when component is disposed', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            components: {
                default: PanelContentPartTest,
            },
        });

        dockview.layout(500, 1000);

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
            tabComponent: 'default',
        });

        const panel2 = dockview.addPanel({
            id: 'panel2',
            component: 'default',
            tabComponent: 'default',
        });

        expect(panel1.group).toEqual(panel2.group);

        const panel1Spy = jest.spyOn(panel1, 'dispose');
        const panel2Spy = jest.spyOn(panel2, 'dispose');

        dockview.dispose();

        expect(panel1Spy).toBeCalledTimes(1);
        expect(panel2Spy).toBeCalledTimes(1);
    });

    test('panel is disposed of when from JSON is called', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            components: {
                default: PanelContentPartTest,
            },
        });
        dockview.deserializer = new ReactPanelDeserialzier(dockview);

        dockview.layout(500, 1000);

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
            tabComponent: 'default',
        });

        const panel2 = dockview.addPanel({
            id: 'panel2',
            component: 'default',
            tabComponent: 'default',
        });

        expect(panel1.group).toEqual(panel2.group);

        const groupSpy = jest.spyOn(panel1.group, 'dispose');
        const panel1Spy = jest.spyOn(panel1, 'dispose');
        const panel2Spy = jest.spyOn(panel2, 'dispose');

        dockview.fromJSON({
            grid: {
                height: 0,
                width: 0,
                root: { type: 'branch', data: [] },
                orientation: Orientation.HORIZONTAL,
            },
            panels: {},
        });

        expect(groupSpy).toBeCalledTimes(1);
        expect(panel1Spy).toBeCalledTimes(1);
        expect(panel2Spy).toBeCalledTimes(1);
    });

    // group is disposed of when dockview is disposed
    // watermark is disposed of when removed
    // watermark is disposed of when dockview is disposed
});
