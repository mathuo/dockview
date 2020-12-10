import { DockviewComponent } from '../../dockview/dockviewComponent';
import { IGroupview } from '../../groupview/groupview';
import {
    GroupPanelPartInitParameters,
    PanelContentPart,
} from '../../groupview/types';
import { PanelUpdateEvent } from '../../panel/types';
import { Orientation } from '../../splitview/core/splitview';
import { ReactPanelDeserialzier } from '../../react/deserializer';
import { Position } from '../../dnd/droptarget';
class PanelContentPartTest implements PanelContentPart {
    element: HTMLElement = document.createElement('div');

    constructor(public readonly id: string, component: string) {
        this.element.classList.add(`testpanel-${id}`);
    }

    updateParentGroup(group: IGroupview, isPanelVisible: boolean): void {
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
        return {};
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

    test('add a panel and move to a new group', () => {
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

        expect(group.size).toBe(2);
        expect(group.containsPanel(panel1)).toBeTruthy();
        expect(group.containsPanel(panel2)).toBeTruthy();
        expect(group.activePanel).toBe(panel2);

        expect(group.indexOf(panel1)).toBe(0);
        expect(group.indexOf(panel2)).toBe(1);

        dockview.moveGroupOrPanel(group, group.id, 'panel1', Position.Right);

        expect(dockview.size).toBe(2);
        expect(dockview.totalPanels).toBe(2);

        expect(panel1.group).not.toBe(panel2.group);
        expect(panel1.group.size).toBe(1);
        expect(panel2.group.size).toBe(1);
        expect(panel1.group.containsPanel(panel1)).toBeTruthy();
        expect(panel2.group.containsPanel(panel2)).toBeTruthy();
        expect(panel1.group.activePanel).toBe(panel1);
        expect(panel2.group.activePanel).toBe(panel2);
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
        dockview.layout(100, 100);

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
                            },
                            size: 50,
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
                                    size: 50,
                                },
                                {
                                    type: 'leaf',
                                    data: { views: ['panel4'], id: 'group-3' },
                                    size: 50,
                                },
                            ],
                            size: 25,
                        },
                        {
                            type: 'leaf',
                            data: { views: ['panel5'], id: 'group-4' },
                            size: 25,
                        },
                    ],
                    size: 100,
                },
                height: 100,
                width: 100,
                orientation: Orientation.VERTICAL,
            },
            panels: {
                panel1: {
                    id: 'panel1',
                    contentId: 'default',
                    title: 'panel1',
                },
                panel2: {
                    id: 'panel2',
                    contentId: 'default',
                    title: 'panel2',
                },
                panel3: {
                    id: 'panel3',
                    contentId: 'default',
                    title: 'panel3',
                },
                panel4: {
                    id: 'panel4',
                    contentId: 'default',
                    title: 'panel4',
                },
                panel5: {
                    id: 'panel5',
                    contentId: 'default',
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
                            size: 100,
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
                                    size: 100,
                                },
                                {
                                    type: 'leaf',
                                    data: {
                                        views: ['panel4'],
                                        id: 'group-3',
                                        activeView: 'panel4',
                                    },
                                    size: 100,
                                },
                            ],
                            size: 100,
                        },
                        {
                            type: 'leaf',
                            data: {
                                views: ['panel5'],
                                id: 'group-4',
                                activeView: 'panel5',
                            },
                            size: 100,
                        },
                    ],
                    size: 100,
                },
                height: 100,
                width: 100,
                orientation: Orientation.VERTICAL,
            },
            panels: {
                panel1: {
                    id: 'panel1',
                    contentId: 'default',
                    title: 'panel1',
                },
                panel2: {
                    id: 'panel2',
                    contentId: 'default',
                    title: 'panel2',
                },
                panel3: {
                    id: 'panel3',
                    contentId: 'default',
                    title: 'panel3',
                },
                panel4: {
                    id: 'panel4',
                    contentId: 'default',
                    title: 'panel4',
                },
                panel5: {
                    id: 'panel5',
                    contentId: 'default',
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
});
