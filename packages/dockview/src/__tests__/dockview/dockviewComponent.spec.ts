import { DockviewComponent } from '../../dockview/dockviewComponent';
import {
    GroupPanelPartInitParameters,
    IContentRenderer,
} from '../../groupview/types';
import { PanelUpdateEvent } from '../../panel/types';
import { Orientation } from '../../splitview/core/splitview';
import { ReactPanelDeserialzier } from '../../react/deserializer';
import { Position } from '../../dnd/droptarget';
import { GroupviewPanel } from '../../groupview/groupviewPanel';
import {
    GroupChangeEvent,
    GroupChangeKind,
} from '../../gridview/baseComponentGridview';
class PanelContentPartTest implements IContentRenderer {
    element: HTMLElement = document.createElement('div');

    constructor(public readonly id: string, component: string) {
        this.element.classList.add(`testpanel-${id}`);
    }

    updateParentGroup(group: GroupviewPanel, isPanelVisible: boolean): void {
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
        //noop
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

        expect(dockview.size).toBe(1);
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

        expect(dockview.size).toBe(1);
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
                                        activeView: 'panel2',
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

        const disposable = dockview.onGridEvent((e) => {
            switch (e.kind) {
                case GroupChangeKind.ADD_PANEL:
                    counter++;
                    expect(counter).toBe(dockview.totalPanels);
                    break;
                case GroupChangeKind.REMOVE_PANEL:
                    counter--;
                    expect(counter).toBe(dockview.totalPanels);
                    break;
            }
        });

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

        const disposable = dockview.onGridEvent((e) => {
            switch (e.kind) {
                case GroupChangeKind.ADD_GROUP:
                    counter++;
                    expect(counter).toBe(dockview.size);
                    break;
                case GroupChangeKind.REMOVE_GROUP:
                    counter--;
                    expect(counter).toBe(dockview.size);
                    break;
            }
        });

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

        let events: GroupChangeEvent[] = [];
        const disposable = dockview.onGridEvent((e) => events.push(e));

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });
        expect(events).toEqual([
            { kind: GroupChangeKind.ADD_GROUP },
            { kind: GroupChangeKind.GROUP_ACTIVE },
            { kind: GroupChangeKind.ADD_PANEL, panel: panel1 },
            { kind: GroupChangeKind.PANEL_ACTIVE, panel: panel1 },
        ]);

        events = [];
        const panel2 = dockview.addPanel({
            id: 'panel2',
            component: 'default',
        });
        expect(events).toEqual([
            { kind: GroupChangeKind.ADD_PANEL, panel: panel2 },
            { kind: GroupChangeKind.PANEL_ACTIVE, panel: panel2 },
        ]);

        events = [];
        const panel3 = dockview.addPanel({
            id: 'panel3',
            component: 'default',
        });
        expect(events).toEqual([
            { kind: GroupChangeKind.ADD_PANEL, panel: panel3 },
            { kind: GroupChangeKind.PANEL_ACTIVE, panel: panel3 },
        ]);

        events = [];
        dockview.removePanel(panel1);
        expect(events).toEqual([
            { kind: GroupChangeKind.REMOVE_PANEL, panel: panel1 },
        ]);

        events = [];
        dockview.removePanel(panel3);
        expect(events).toEqual([
            { kind: GroupChangeKind.REMOVE_PANEL, panel: panel3 },
            { kind: GroupChangeKind.PANEL_ACTIVE, panel: panel2 },
        ]);

        events = [];
        const panel4 = dockview.addPanel({
            id: 'panel4',
            component: 'default',
            position: { referencePanel: panel2.id, direction: 'right' },
        });
        expect(events).toEqual([
            { kind: GroupChangeKind.ADD_GROUP },
            { kind: GroupChangeKind.GROUP_ACTIVE },
            { kind: GroupChangeKind.ADD_PANEL, panel: panel4 },
            { kind: GroupChangeKind.PANEL_ACTIVE, panel: panel4 },
        ]);

        events = [];
        const panel5 = dockview.addPanel({
            id: 'panel5',
            component: 'default',
            position: { referencePanel: panel4.id, direction: 'within' },
        });
        expect(events).toEqual([
            { kind: GroupChangeKind.ADD_PANEL, panel: panel5 },
            { kind: GroupChangeKind.PANEL_ACTIVE, panel: panel5 },
        ]);

        events = [];
        dockview.moveGroupOrPanel(
            panel2.group!,
            panel5.group!.id,
            panel5.id,
            Position.Center
        );
        expect(events).toEqual([
            { kind: GroupChangeKind.REMOVE_PANEL, panel: panel5 },
            { kind: GroupChangeKind.PANEL_ACTIVE, panel: panel4 },
            { kind: GroupChangeKind.ADD_PANEL, panel: panel5 },
            { kind: GroupChangeKind.PANEL_ACTIVE, panel: panel5 },
            { kind: GroupChangeKind.GROUP_ACTIVE },
            { kind: GroupChangeKind.PANEL_ACTIVE, panel: panel5 },
        ]);

        events = [];
        dockview.moveGroupOrPanel(
            panel2.group!,
            panel4.group!.id,
            panel4.id,
            Position.Center
        );
        expect(events).toEqual([
            { kind: GroupChangeKind.REMOVE_PANEL, panel: panel4 },
            { kind: GroupChangeKind.REMOVE_GROUP },
            { kind: GroupChangeKind.ADD_PANEL, panel: panel4 },
            { kind: GroupChangeKind.PANEL_ACTIVE, panel: panel4 },
        ]);

        disposable.dispose();
    });
});
