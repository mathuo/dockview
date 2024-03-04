import { DockviewComponent } from '../../dockview/dockviewComponent';
import {
    GroupPanelPartInitParameters,
    IContentRenderer,
    ITabRenderer,
} from '../../dockview/types';
import { PanelUpdateEvent } from '../../panel/types';
import { Orientation } from '../../splitview/splitview';
import { CompositeDisposable } from '../../lifecycle';
import { Emitter } from '../../events';
import { IDockviewPanel } from '../../dockview/dockviewPanel';
import { DockviewGroupPanel } from '../../dockview/dockviewGroupPanel';
import { fireEvent } from '@testing-library/dom';
import { getPanelData } from '../../dnd/dataTransfer';
import {
    GroupDragEvent,
    TabDragEvent,
} from '../../dockview/components/titlebar/tabsContainer';
import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewApi } from '../../api/component.api';
import { DockviewDndOverlayEvent } from '../../dockview/options';

class PanelContentPartTest implements IContentRenderer {
    element: HTMLElement = document.createElement('div');

    readonly _onDidDispose = new Emitter<void>();
    readonly onDidDispose = this._onDidDispose.event;

    isDisposed: boolean = false;

    constructor(public readonly id: string, public readonly component: string) {
        this.element.classList.add(`testpanel-${id}`);
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
        return { id: this.component };
    }

    focus(): void {
        //noop
    }

    dispose(): void {
        this.isDisposed = true;
        this._onDidDispose.fire();
        this._onDidDispose.dispose();
    }
}

class PanelTabPartTest implements ITabRenderer {
    element: HTMLElement = document.createElement('div');

    readonly _onDidDispose = new Emitter<void>();
    readonly onDidDispose = this._onDidDispose.event;

    isDisposed: boolean = false;

    constructor(public readonly id: string, component: string) {
        this.element.className = `panel-tab-part-${id}`;
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

    focus(): void {
        //noop
    }

    dispose(): void {
        this.isDisposed = true;
        this._onDidDispose.fire();
        this._onDidDispose.dispose();
    }
}

describe('dockviewComponent', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;

    beforeEach(() => {
        container = document.createElement('div');

        dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
        });

        window.open = jest.fn(); // not implemented by jest
    });

    // describe('memory leakage', () => {
    //     beforeEach(() => {
    //         window.open = () => fromPartial<Window>({
    //             addEventListener: jest.fn(),
    //             close: jest.fn(),
    //         });
    //     });

    //     test('event leakage', () => {
    //         Emitter.setLeakageMonitorEnabled(true);

    //         dockview = new DockviewComponent({
    //             parentElement: container,
    //             components: {
    //                 default: PanelContentPartTest,
    //             },
    //         });

    //         dockview.layout(500, 1000);

    //         const panel1 = dockview.addPanel({
    //             id: 'panel1',
    //             component: 'default',
    //         });

    //         const panel2 = dockview.addPanel({
    //             id: 'panel2',
    //             component: 'default',
    //         });

    //         dockview.removePanel(panel2);

    //         const panel3 = dockview.addPanel({
    //             id: 'panel3',
    //             component: 'default',
    //             position: {
    //                 direction: 'right',
    //                 referencePanel: 'panel1',
    //             },
    //         });

    //         const panel4 = dockview.addPanel({
    //             id: 'panel4',
    //             component: 'default',
    //             position: {
    //                 direction: 'above',
    //             },
    //         });

    //         dockview.moveGroupOrPanel(
    //             panel4.group,
    //             panel3.group.id,
    //             panel3.id,
    //             'center'
    //         );

    //         dockview.addPanel({
    //             id: 'panel5',
    //             component: 'default',
    //             floating: true,
    //         });

    //         const panel6 = dockview.addPanel({
    //             id: 'panel6',
    //             component: 'default',
    //             position: {
    //                 referencePanel: 'panel5',
    //                 direction: 'within',
    //             },
    //         });

    //         dockview.addFloatingGroup(panel4.api.group);

    //         dockview.addPopoutGroup(panel6);

    //         dockview.moveGroupOrPanel(
    //             panel1.group,
    //             panel6.group.id,
    //             panel6.id,
    //             'center'
    //         );

    //         dockview.moveGroupOrPanel(
    //             panel4.group,
    //             panel6.group.id,
    //             panel6.id,
    //             'center'
    //         );

    //         dockview.dispose();

    //         if (Emitter.MEMORY_LEAK_WATCHER.size > 0) {
    //             for (const entry of Array.from(
    //                 Emitter.MEMORY_LEAK_WATCHER.events
    //             )) {
    //                 console.log('disposal', entry[1]);
    //             }
    //             throw new Error('not all listeners disposed');
    //         }

    //         Emitter.setLeakageMonitorEnabled(false);
    //     });
    // });

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

        dockview.dispose();
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

        const group1 = panel1!.group;

        dockview.moveGroupOrPanel({
            from: { groupId: group1.id, panelId: 'panel1' },
            to: { group: group1, position: 'right' },
        });
        const group2 = panel1!.group;

        dockview.moveGroupOrPanel({
            from: { groupId: group1.id, panelId: 'panel3' },
            to: { group: group2, position: 'center' },
        });

        expect(dockview.activeGroup).toBe(group2);
        expect(dockview.activeGroup!.model.activePanel).toBe(panel3);
        expect(dockview.activeGroup!.model.indexOf(panel3!)).toBe(1);

        dockview.moveToPrevious({ includePanel: true });
        expect(dockview.activeGroup).toBe(group2);
        expect(dockview.activeGroup!.model.activePanel).toBe(panel1);

        dockview.moveToNext({ includePanel: true });
        expect(dockview.activeGroup).toBe(group2);
        expect(dockview.activeGroup!.model.activePanel).toBe(panel3);

        dockview.moveToPrevious({ includePanel: false });
        expect(dockview.activeGroup).toBe(group1);
        expect(dockview.activeGroup!.model.activePanel).toBe(panel4);

        dockview.moveToPrevious({ includePanel: true });
        expect(dockview.activeGroup).toBe(group1);
        expect(dockview.activeGroup!.model.activePanel).toBe(panel2);

        dockview.moveToNext({ includePanel: false });
        expect(dockview.activeGroup).toBe(group2);
        expect(dockview.activeGroup!.model.activePanel).toBe(panel3);
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

        const panel1 = dockview.getGroupPanel('panel1')!;
        const panel2 = dockview.getGroupPanel('panel2')!;
        const group1 = panel1.group;

        dockview.moveGroupOrPanel({
            from: { groupId: group1.id, panelId: 'panel1' },
            to: { group: group1, position: 'right' },
        });
        const group2 = panel1.group;
        dockview.moveGroupOrPanel({
            from: { groupId: group1.id, panelId: 'panel3' },
            to: { group: group2, position: 'center' },
        });

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

        const panel1 = dockview.getGroupPanel('panel1')!;
        const panel2 = dockview.getGroupPanel('panel2')!;
        const panel3 = dockview.getGroupPanel('panel3')!;
        const panel4 = dockview.getGroupPanel('panel4')!;

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

        dockview.moveGroupOrPanel({
            from: { groupId: group1.id, panelId: 'panel1' },
            to: { group: group1, position: 'right' },
        });
        const group2 = panel1.group;
        dockview.moveGroupOrPanel({
            from: { groupId: group1.id, panelId: 'panel3' },
            to: { group: group2, position: 'center' },
        });

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

        const panel1 = dockview.getGroupPanel('panel1')!;
        const panel2 = dockview.getGroupPanel('panel2')!;
        expect(panel1.group).toBe(panel2.group);

        const group = panel1.group;

        expect(group.model.size).toBe(2);
        expect(group.model.containsPanel(panel1)).toBeTruthy();
        expect(group.model.containsPanel(panel2)).toBeTruthy();
        expect(group.model.activePanel).toBe(panel2);

        expect(group.model.indexOf(panel1)).toBe(0);
        expect(group.model.indexOf(panel2)).toBe(1);

        dockview.moveGroupOrPanel({
            from: { groupId: group.id, panelId: 'panel1' },
            to: { group, position: 'right' },
        });

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

        expect(dockview.size).toBe(0);
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

        const group = dockview.getGroupPanel('panel1')!.group;
        dockview.moveGroupOrPanel({
            from: { groupId: group.id, panelId: 'panel1' },
            to: { group, position: 'right' },
        });

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
                    contentComponent: 'default',
                    title: 'panel1',
                },
                panel2: {
                    id: 'panel2',
                    contentComponent: 'default',
                    title: 'panel2',
                },
                panel3: {
                    id: 'panel3',
                    contentComponent: 'default',
                    title: 'panel3',
                },
                panel4: {
                    id: 'panel4',
                    contentComponent: 'default',
                    title: 'panel4',
                },
                panel5: {
                    id: 'panel5',
                    contentComponent: 'default',
                    title: 'panel5',
                },
            },
        });

        // dockview.layout(1000, 1000, true);

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
                    contentComponent: 'default',
                    title: 'panel1',
                },
                panel2: {
                    id: 'panel2',
                    contentComponent: 'default',
                    title: 'panel2',
                },
                panel3: {
                    id: 'panel3',
                    contentComponent: 'default',
                    title: 'panel3',
                },
                panel4: {
                    id: 'panel4',
                    contentComponent: 'default',
                    title: 'panel4',
                },
                panel5: {
                    id: 'panel5',
                    contentComponent: 'default',
                    title: 'panel5',
                },
            },
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
            group?: DockviewGroupPanel | undefined;
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
            { type: 'ADD_PANEL', panel: panel1 },
            { type: 'ACTIVE_GROUP', group: panel1.group },
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
            { type: 'ADD_PANEL', panel: panel4 },
            { type: 'ACTIVE_GROUP', group: panel4.group },
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
        dockview.moveGroupOrPanel({
            from: { groupId: panel5.group.id, panelId: panel5.id },
            to: { group: panel2.group, position: 'center' },
        });

        expect(events).toEqual([{ type: 'ACTIVE_GROUP', group: panel2.group }]);

        events = [];

        const groupReferenceBeforeMove = panel4.group;

        dockview.moveGroupOrPanel({
            from: { groupId: panel4.group.id, panelId: panel4.id },
            to: { group: panel2.group, position: 'center' },
        });

        expect(events).toEqual([
            { type: 'REMOVE_GROUP', group: groupReferenceBeforeMove },
            { type: 'ACTIVE_PANEL', panel: panel4 },
        ]);

        for (const panel of dockview.panels) {
            panel.api.close();
        }

        events = [];

        const panel6 = dockview.addPanel({
            id: 'panel6',
            component: 'default',
            floating: true,
        });
        const panel6Group = panel6.group;

        expect(events).toEqual([
            { type: 'ADD_GROUP', group: panel6.group },
            { type: 'ADD_PANEL', panel: panel6 },
            { type: 'ACTIVE_GROUP', group: panel6.group },
            { type: 'ACTIVE_PANEL', panel: panel6 },
        ]);

        events = [];

        const panel7 = dockview.addPanel({
            id: 'panel7',
            component: 'default',
            floating: true,
        });
        const panel7Group = panel7.group;

        expect(events).toEqual([
            { type: 'ADD_GROUP', group: panel7.group },
            { type: 'ADD_PANEL', panel: panel7 },
            { type: 'ACTIVE_GROUP', group: panel7.group },
            { type: 'ACTIVE_PANEL', panel: panel7 },
        ]);

        expect(dockview.activePanel === panel7).toBeTruthy();

        events = [];
        panel7.api.close();

        expect(events).toEqual([
            { type: 'REMOVE_PANEL', panel: panel7 },
            { type: 'REMOVE_GROUP', group: panel7Group },
            { type: 'ACTIVE_GROUP', group: panel6.group },
            { type: 'ACTIVE_PANEL', panel: panel6 },
        ]);

        events = [];
        panel6.api.close();

        expect(events).toEqual([
            { type: 'REMOVE_PANEL', panel: panel6 },
            { type: 'REMOVE_GROUP', group: panel6Group },
            { type: 'ACTIVE_GROUP', group: undefined },
            { type: 'ACTIVE_PANEL', group: undefined },
        ]);

        expect(dockview.size).toBe(0);
        expect(dockview.totalPanels).toBe(0);

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

        const removedGroups: DockviewGroupPanel[] = [];
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
                    contentComponent: 'default',
                    title: 'view_1_title',
                },
                view_2: {
                    id: 'view_2',
                    contentComponent: 'default',
                    title: 'view_2_title',
                },
                view_3: {
                    id: 'view_3',
                    contentComponent: 'default',
                    title: 'view_3_title',
                },
            },
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

        const dockview = new DockviewComponent({
            parentElement: container,
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

        const dockview = new DockviewComponent({
            parentElement: container,
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

    test('panel is disposed of when removed', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
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

        const dockview = new DockviewComponent({
            parentElement: container,
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

        dockview.moveGroupOrPanel({
            from: { groupId: panel2.group.id, panelId: 'panel2' },
            to: { group: panel1.group, position: 'left' },
        });

        expect(panel1Spy).not.toHaveBeenCalled();
        expect(panel2Spy).not.toHaveBeenCalled();
    });

    test('panel is not disposed of when moved within another group', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
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

        dockview.moveGroupOrPanel({
            from: { groupId: panel2.group.id, panelId: 'panel2' },
            to: { group: panel1.group, position: 'center' },
        });

        expect(panel1Spy).not.toHaveBeenCalled();
        expect(panel2Spy).not.toHaveBeenCalled();
    });

    test('panel is not disposed of when moved within another group', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
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

        dockview.moveGroupOrPanel({
            from: { groupId: panel1.group.id, panelId: 'panel1' },
            to: { group: panel1.group, position: 'center', index: 0 },
        });

        expect(panel1Spy).not.toHaveBeenCalled();
        expect(panel2Spy).not.toHaveBeenCalled();
    });

    test('panel is disposed of when group is disposed', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
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

        const dockview = new DockviewComponent({
            parentElement: container,
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

        // const panel2 = dockview.addPanel({
        //     id: 'panel2',
        //     component: 'default',
        //     tabComponent: 'default',
        // });

        // expect(panel1.group).toEqual(panel2.group);

        const panel1Spy = jest.spyOn(panel1, 'dispose');
        // const panel2Spy = jest.spyOn(panel2, 'dispose');

        dockview.dispose();

        expect(panel1Spy).toBeCalledTimes(1);
        // expect(panel2Spy).toBeCalledTimes(1);
    });

    test('panel is disposed of when from JSON is called', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
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

    test('move entire group into another group', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: { default: PanelContentPartTest },
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
                referencePanel: panel1,
            },
        });
        const panel3 = dockview.addPanel({
            id: 'panel3',
            component: 'default',
            tabComponent: 'default',
            position: {
                referencePanel: panel1,
                direction: 'right',
            },
        });

        const panel1Spy = jest.spyOn(panel1.group, 'dispose');

        expect(dockview.groups.length).toBe(2);

        dockview.moveGroupOrPanel({
            from: { groupId: panel1.group.id },
            to: { group: panel3.group, position: 'center' },
        });

        expect(dockview.groups.length).toBe(1);
        expect(panel1Spy).toBeCalledTimes(1);
    });

    test('fromJSON events should still fire', () => {
        jest.useFakeTimers();

        dockview.layout(1000, 1000);

        let addGroup: DockviewGroupPanel[] = [];
        let removeGroup: DockviewGroupPanel[] = [];
        let activeGroup: (DockviewGroupPanel | undefined)[] = [];
        let addPanel: IDockviewPanel[] = [];
        let removePanel: IDockviewPanel[] = [];
        let activePanel: (IDockviewPanel | undefined)[] = [];
        let layoutChange = 0;
        let layoutChangeFromJson = 0;

        const disposable = new CompositeDisposable(
            dockview.onDidAddGroup((panel) => {
                addGroup.push(panel);
            }),
            dockview.onDidRemoveGroup((panel) => {
                removeGroup.push(panel);
            }),
            dockview.onDidActiveGroupChange((event) => {
                activeGroup.push(event);
            }),
            dockview.onDidAddPanel((panel) => {
                addPanel.push(panel);
            }),
            dockview.onDidRemovePanel((panel) => {
                removePanel.push(panel);
            }),
            dockview.onDidActivePanelChange((event) => {
                activePanel.push(event);
            }),
            dockview.onDidLayoutChange(() => {
                layoutChange++;
            }),
            dockview.onDidLayoutFromJSON(() => {
                layoutChangeFromJson++;
            })
        );

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
                    contentComponent: 'default',
                    title: 'panel1',
                },
                panel2: {
                    id: 'panel2',
                    contentComponent: 'default',
                    title: 'panel2',
                },
                panel3: {
                    id: 'panel3',
                    contentComponent: 'default',
                    title: 'panel3',
                },
                panel4: {
                    id: 'panel4',
                    contentComponent: 'default',
                    title: 'panel4',
                },
                panel5: {
                    id: 'panel5',
                    contentComponent: 'default',
                    title: 'panel5',
                },
            },
        });

        jest.runAllTimers();

        expect(addGroup.length).toBe(4);
        expect(removeGroup.length).toBe(0);
        expect(activeGroup.length).toBe(1);
        expect(addPanel.length).toBe(5);
        expect(removePanel.length).toBe(0);
        expect(activePanel.length).toBe(1);
        expect(layoutChange).toBe(1);
        expect(layoutChangeFromJson).toBe(1);

        addGroup = [];
        removeGroup = [];
        activeGroup = [];
        addPanel = [];
        removePanel = [];
        activePanel = [];
        layoutChange = 0;
        layoutChangeFromJson = 0;

        dockview.fromJSON({
            grid: {
                root: {
                    type: 'branch',
                    data: [],
                    size: 1000,
                },
                height: 1000,
                width: 1000,
                orientation: Orientation.VERTICAL,
            },
            panels: {},
        });

        jest.runAllTimers();

        expect(addGroup.length).toBe(0);
        expect(removeGroup.length).toBe(4);
        expect(activeGroup.length).toBe(1);
        expect(addPanel.length).toBe(0);
        expect(removePanel.length).toBe(5);
        expect(activePanel.length).toBe(1);
        expect(layoutChange).toBe(1);
        expect(layoutChangeFromJson).toBe(1);

        return disposable.dispose();
    });

    test('load a layout with a non-existant tab id', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
        });
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
                    contentComponent: 'default',
                    title: 'panel1',
                },
                panel2: {
                    id: 'panel2',
                    contentComponent: 'default',
                    tabComponent: '__non__existant_tab__',
                    title: 'panel2',
                },
                panel3: {
                    id: 'panel3',
                    contentComponent: 'default',
                    title: 'panel3',
                },
                panel4: {
                    id: 'panel4',
                    contentComponent: 'default',
                    title: 'panel4',
                },
                panel5: {
                    id: 'panel5',
                    contentComponent: 'default',
                    title: 'panel5',
                },
            },
        });
    });

    test('load and persist layout with custom tab header', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        dockview.layout(1000, 1000);

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
                            type: 'leaf',
                            data: {
                                views: ['panel2'],
                                id: 'group-2',
                                activeView: 'panel2',
                            },

                            size: 500,
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
                    contentComponent: 'default',

                    title: 'panel1',
                },
                panel2: {
                    id: 'panel2',
                    contentComponent: 'default',
                    tabComponent: 'test_tab_id',
                    title: 'panel2',
                },
            },
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
                            type: 'leaf',
                            data: {
                                views: ['panel2'],
                                id: 'group-2',
                                activeView: 'panel2',
                            },
                            size: 500,
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
                    contentComponent: 'default',
                    title: 'panel1',
                },
                panel2: {
                    id: 'panel2',
                    contentComponent: 'default',
                    tabComponent: 'test_tab_id',
                    title: 'panel2',
                },
            },
        });
    });

    test('#2', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });
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
                            type: 'leaf',
                            data: {
                                views: ['panel2', 'panel3'],
                                id: 'group-2',
                                activeView: 'panel2',
                            },

                            size: 500,
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
                    contentComponent: 'default',
                    title: 'panel1',
                },
                panel2: {
                    id: 'panel2',
                    contentComponent: 'default',
                    tabComponent: 'test_tab_id',
                    title: 'panel2',
                },
                panel3: {
                    id: 'panel3',
                    contentComponent: 'default',
                    title: 'panel3',
                },
            },
        });

        const group = dockview.getGroupPanel('panel2')!.api.group;

        const viewQuery = group.element.querySelectorAll(
            '.groupview > .tabs-and-actions-container > .tabs-container > .tab'
        );
        expect(viewQuery.length).toBe(2);

        const viewQuery2 = group.element.querySelectorAll(
            '.groupview > .tabs-and-actions-container > .tabs-container > .tab > .default-tab'
        );
        expect(viewQuery2.length).toBe(1);

        const viewQuery3 = group.element.querySelectorAll(
            '.groupview > .tabs-and-actions-container > .tabs-container > .tab > .panel-tab-part-panel2'
        );
        expect(viewQuery3.length).toBe(1);
    });

    // load a layout with a default tab identifier when react default is present

    // load a layout with invialid panel identifier

    test('orthogonal realigment #1', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        dockview.layout(1000, 1000);

        expect(dockview.orientation).toBe(Orientation.HORIZONTAL);

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
                    contentComponent: 'default',
                    title: 'panel1',
                },
            },
        });

        expect(dockview.orientation).toBe(Orientation.VERTICAL);

        dockview.addPanel({
            id: 'panel2',
            component: 'default',
            position: {
                direction: 'left',
            },
        });

        expect(dockview.orientation).toBe(Orientation.HORIZONTAL);

        expect(JSON.parse(JSON.stringify(dockview.toJSON()))).toEqual({
            activeGroup: '1',
            grid: {
                root: {
                    type: 'branch',
                    data: [
                        {
                            type: 'leaf',
                            data: {
                                views: ['panel2'],
                                id: '1',
                                activeView: 'panel2',
                            },
                            size: 500,
                        },
                        {
                            type: 'leaf',
                            data: {
                                views: ['panel1'],
                                id: 'group-1',
                                activeView: 'panel1',
                            },
                            size: 500,
                        },
                    ],
                    size: 1000,
                },
                height: 1000,
                width: 1000,
                orientation: Orientation.HORIZONTAL,
            },
            panels: {
                panel1: {
                    id: 'panel1',
                    contentComponent: 'default',
                    title: 'panel1',
                },
                panel2: {
                    id: 'panel2',
                    contentComponent: 'default',
                    title: 'panel2',
                },
            },
        });
    });

    test('orthogonal realigment #2', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        dockview.layout(1000, 1000);

        expect(dockview.orientation).toBe(Orientation.HORIZONTAL);

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
                            type: 'leaf',
                            data: {
                                views: ['panel2'],
                                id: 'group-2',
                                activeView: 'panel2',
                            },
                            size: 500,
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
                    contentComponent: 'default',
                    title: 'panel1',
                },
                panel2: {
                    id: 'panel2',
                    contentComponent: 'default',
                    title: 'panel2',
                },
            },
        });

        expect(dockview.orientation).toBe(Orientation.VERTICAL);

        dockview.addPanel({
            id: 'panel3',
            component: 'default',
            position: {
                direction: 'left',
            },
        });

        expect(dockview.orientation).toBe(Orientation.HORIZONTAL);

        expect(JSON.parse(JSON.stringify(dockview.toJSON()))).toEqual({
            activeGroup: '1',
            grid: {
                root: {
                    type: 'branch',
                    data: [
                        {
                            type: 'leaf',
                            data: {
                                views: ['panel3'],
                                id: '1',
                                activeView: 'panel3',
                            },
                            size: 500,
                        },
                        {
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
                                    type: 'leaf',
                                    data: {
                                        views: ['panel2'],
                                        id: 'group-2',
                                        activeView: 'panel2',
                                    },
                                    size: 500,
                                },
                            ],
                            size: 500,
                        },
                    ],
                    size: 1000,
                },
                height: 1000,
                width: 1000,
                orientation: Orientation.HORIZONTAL,
            },
            panels: {
                panel1: {
                    id: 'panel1',
                    contentComponent: 'default',
                    title: 'panel1',
                },

                panel2: {
                    id: 'panel2',
                    contentComponent: 'default',
                    title: 'panel2',
                },
                panel3: {
                    id: 'panel3',
                    contentComponent: 'default',
                    title: 'panel3',
                },
            },
        });
    });

    test('orthogonal realigment #3', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        dockview.layout(1000, 1000);

        expect(dockview.orientation).toBe(Orientation.HORIZONTAL);

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
                    contentComponent: 'default',
                    title: 'panel1',
                },
            },
        });

        expect(dockview.orientation).toBe(Orientation.VERTICAL);

        dockview.addPanel({
            id: 'panel2',
            component: 'default',
            position: {
                direction: 'above',
            },
        });

        dockview.addPanel({
            id: 'panel3',
            component: 'default',
            position: {
                direction: 'below',
            },
        });

        expect(dockview.orientation).toBe(Orientation.VERTICAL);

        expect(JSON.parse(JSON.stringify(dockview.toJSON()))).toEqual({
            activeGroup: '2',
            grid: {
                root: {
                    type: 'branch',
                    data: [
                        {
                            type: 'leaf',
                            data: {
                                views: ['panel2'],
                                id: '1',
                                activeView: 'panel2',
                            },
                            size: 333,
                        },
                        {
                            type: 'leaf',
                            data: {
                                views: ['panel1'],
                                id: 'group-1',
                                activeView: 'panel1',
                            },
                            size: 333,
                        },
                        {
                            type: 'leaf',
                            data: {
                                views: ['panel3'],
                                id: '2',
                                activeView: 'panel3',
                            },
                            size: 334,
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
                    contentComponent: 'default',
                    title: 'panel1',
                },
                panel2: {
                    id: 'panel2',
                    contentComponent: 'default',
                    title: 'panel2',
                },
                panel3: {
                    id: 'panel3',
                    contentComponent: 'default',
                    title: 'panel3',
                },
            },
        });
    });

    test('orthogonal realigment #4', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        dockview.layout(1000, 1000);

        expect(dockview.orientation).toBe(Orientation.HORIZONTAL);

        dockview.addPanel({
            id: 'panel1',
            component: 'default',
            position: {
                direction: 'above',
            },
        });

        expect(dockview.orientation).toBe(Orientation.VERTICAL);

        expect(JSON.parse(JSON.stringify(dockview.toJSON()))).toEqual({
            activeGroup: '1',
            grid: {
                root: {
                    type: 'branch',
                    data: [
                        {
                            type: 'leaf',
                            data: {
                                views: ['panel1'],
                                id: '1',
                                activeView: 'panel1',
                            },
                            size: 1000,
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
                    contentComponent: 'default',
                    title: 'panel1',
                },
            },
        });
    });

    test('that a empty component has no groups', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        expect(dockview.groups.length).toBe(0);
    });

    test('that deserializing an empty layout has zero groups and a watermark', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        expect(dockview.groups.length).toBe(0);

        expect(
            dockview.element.querySelectorAll('.dv-watermark-container').length
        ).toBe(1);

        dockview.fromJSON({
            grid: {
                orientation: Orientation.HORIZONTAL,
                root: {
                    type: 'branch',
                    data: [],
                },
                height: 100,
                width: 100,
            },
            panels: {},
        });

        expect(dockview.groups.length).toBe(0);

        expect(
            dockview.element.querySelectorAll('.dv-watermark-container').length
        ).toBe(1);
    });

    test('empty', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        expect(JSON.parse(JSON.stringify(dockview.toJSON()))).toEqual({
            grid: {
                height: 0,
                width: 0,
                orientation: Orientation.HORIZONTAL,
                root: {
                    data: [],
                    type: 'branch',
                    size: 0,
                },
            },
            panels: {},
        });
    });

    test('that title and params.title do not conflict', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        dockview.layout(100, 100);

        dockview.addPanel({
            id: 'panel1',
            component: 'default',
            title: 'Panel 1',
            params: {
                title: 'Panel 1',
            },
        });

        dockview.addPanel({
            id: 'panel2',
            component: 'default',
            title: 'Panel 2',
        });

        dockview.addPanel({
            id: 'panel3',
            component: 'default',
            params: {
                title: 'Panel 3',
            },
        });

        expect(JSON.parse(JSON.stringify(dockview.toJSON()))).toEqual({
            grid: {
                root: {
                    type: 'branch',
                    data: [
                        {
                            type: 'leaf',
                            data: {
                                views: ['panel1', 'panel2', 'panel3'],
                                activeView: 'panel3',
                                id: '1',
                            },
                            size: 100,
                        },
                    ],
                    size: 100,
                },
                width: 100,
                height: 100,
                orientation: 'HORIZONTAL',
            },
            panels: {
                panel1: {
                    id: 'panel1',
                    contentComponent: 'default',
                    params: {
                        title: 'Panel 1',
                    },
                    title: 'Panel 1',
                },
                panel2: {
                    id: 'panel2',
                    contentComponent: 'default',
                    title: 'Panel 2',
                },
                panel3: {
                    id: 'panel3',
                    contentComponent: 'default',
                    params: {
                        title: 'Panel 3',
                    },
                    title: 'panel3',
                },
            },
            activeGroup: '1',
        });
    });

    test('check dockview component is rendering to the DOM as expected', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        dockview.layout(100, 100);

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });

        expect(dockview.element.querySelectorAll('.view').length).toBe(1);

        const panel2 = dockview.addPanel({
            id: 'panel2',
            component: 'default',
        });

        expect(dockview.element.querySelectorAll('.view').length).toBe(1);

        const panel3 = dockview.addPanel({
            id: 'panel3',
            component: 'default',
        });

        expect(dockview.element.querySelectorAll('.view').length).toBe(1);

        dockview.moveGroupOrPanel({
            from: { groupId: panel3.group.id, panelId: panel3.id },
            to: { group: panel3.group, position: 'right' },
        });

        expect(dockview.groups.length).toBe(2);
        expect(dockview.element.querySelectorAll('.view').length).toBe(2);

        dockview.moveGroupOrPanel({
            from: { groupId: panel2.group.id, panelId: panel2.id },
            to: { group: panel3.group, position: 'bottom' },
        });

        expect(dockview.groups.length).toBe(3);
        expect(dockview.element.querySelectorAll('.view').length).toBe(4);

        dockview.moveGroupOrPanel({
            from: { groupId: panel1.group.id, panelId: panel1.id },
            to: { group: panel2.group, position: 'center' },
        });

        expect(dockview.groups.length).toBe(2);

        expect(dockview.element.querySelectorAll('.view').length).toBe(2);
    });

    test('that fromJSON layouts are resized to the current dimensions', async () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        expect(dockview.orientation).toBe(Orientation.HORIZONTAL);

        dockview.layout(1000, 500);

        dockview.fromJSON({
            activeGroup: 'group-1',
            grid: {
                root: {
                    type: 'branch',
                    data: [
                        {
                            type: 'leaf',
                            data: {
                                views: ['panel1', 'panel2'],
                                id: 'group-1',
                                activeView: 'panel2',
                            },
                            size: 2000,
                        },
                    ],
                    size: 1000,
                },
                height: 1000,
                width: 2000,
                orientation: Orientation.HORIZONTAL,
            },
            panels: {
                panel1: {
                    id: 'panel1',
                    contentComponent: 'default',
                    title: 'panel1',
                },
                panel2: {
                    id: 'panel2',
                    contentComponent: 'default',
                    title: 'panel2',
                },
            },
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
                                views: ['panel1', 'panel2'],
                                id: 'group-1',
                                activeView: 'panel2',
                            },
                            size: 1000,
                        },
                    ],
                    size: 500,
                },
                height: 500,
                width: 1000,
                orientation: Orientation.HORIZONTAL,
            },
            panels: {
                panel1: {
                    id: 'panel1',
                    contentComponent: 'default',
                    title: 'panel1',
                },
                panel2: {
                    id: 'panel2',
                    contentComponent: 'default',
                    title: 'panel2',
                },
            },
        });
    });

    test('that moving the last panel to be floating should leave an empty gridview', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        dockview.layout(1000, 500);

        const panel1 = dockview.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        expect(
            dockview.element.querySelectorAll('.view-container > .view').length
        ).toBe(1);

        dockview.addFloatingGroup(panel1);

        expect(
            dockview.element.querySelectorAll('.view-container > .view').length
        ).toBe(0);
    });

    test('that api.setSize applies to the overlay for floating panels', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        dockview.layout(1000, 500);

        const panel1 = dockview.addPanel({
            id: 'panel_1',
            component: 'default',
            floating: true,
        });

        panel1.api.setSize({ height: 123, width: 256 });

        const items = dockview.element.querySelectorAll('.dv-resize-container');
        expect(items.length).toBe(1);

        const el = items[0] as HTMLElement;

        expect(el.style.height).toBe('123px');
        expect(el.style.width).toBe('256px');
    });

    test('that external dnd events do not trigger the top-level center dnd target unless empty', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        let events: DockviewDndOverlayEvent[] = [];

        dockview.onUnhandledDragOverEvent((e) => {
            events.push(e);
            e.accept();
        });

        dockview.layout(1000, 500);

        const panel1 = dockview.addPanel({
            id: 'panel_1',
            component: 'default',
        });
        const panel2 = dockview.addPanel({
            id: 'panel_2',
            component: 'default',
            position: { direction: 'right' },
        });

        Object.defineProperty(dockview.element, 'clientWidth', {
            get: () => 100,
        });
        Object.defineProperty(dockview.element, 'clientHeight', {
            get: () => 100,
        });

        jest.spyOn(dockview.element, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            width: 100,
            height: 100,
        } as any);

        // left

        const eventLeft = new KeyboardEvent('dragover');
        Object.defineProperty(eventLeft, 'clientX', {
            get: () => 0,
        });
        Object.defineProperty(eventLeft, 'clientY', {
            get: () => 0,
        });
        fireEvent(dockview.element, eventLeft);

        expect(events[0].nativeEvent).toBe(eventLeft);
        expect(events[0].position).toBe('left');
        expect(events[0].target).toBe('edge');
        expect(events[0].getData).toBe(getPanelData);
        expect(events.length).toBe(1);

        // right

        const eventRight = new KeyboardEvent('dragover');
        Object.defineProperty(eventRight, 'clientX', {
            get: () => 100,
        });
        Object.defineProperty(eventRight, 'clientY', {
            get: () => 100,
        });
        fireEvent(dockview.element, eventRight);

        expect(events[1].nativeEvent).toBe(eventRight);
        expect(events[1].position).toBe('right');
        expect(events[1].target).toBe('edge');
        expect(events[1].getData).toBe(getPanelData);
        expect(events.length).toBe(2);

        // top

        const eventTop = new KeyboardEvent('dragover');
        Object.defineProperty(eventTop, 'clientX', {
            get: () => 50,
        });
        Object.defineProperty(eventTop, 'clientY', {
            get: () => 0,
        });
        fireEvent(dockview.element, eventTop);

        expect(events[2].nativeEvent).toBe(eventTop);
        expect(events[2].position).toBe('top');
        expect(events[2].target).toBe('edge');
        expect(events[2].getData).toBe(getPanelData);
        expect(events.length).toBe(3);

        // top

        const eventBottom = new KeyboardEvent('dragover');
        Object.defineProperty(eventBottom, 'clientX', {
            get: () => 50,
        });
        Object.defineProperty(eventBottom, 'clientY', {
            get: () => 100,
        });
        fireEvent(dockview.element, eventBottom);

        expect(events[3].nativeEvent).toBe(eventBottom);
        expect(events[3].position).toBe('bottom');
        expect(events[3].target).toBe('edge');
        expect(events[3].getData).toBe(getPanelData);
        expect(events.length).toBe(4);

        // center

        const eventCenter = new KeyboardEvent('dragover');
        Object.defineProperty(eventCenter, 'clientX', {
            get: () => 50,
        });
        Object.defineProperty(eventCenter, 'clientY', {
            get: () => 50,
        });
        fireEvent(dockview.element, eventCenter);

        // expect not to be called for center
        expect(events.length).toBe(4);

        dockview.removePanel(panel1);
        dockview.removePanel(panel2);

        // center, but empty

        const eventCenter2 = new KeyboardEvent('dragover');
        Object.defineProperty(eventCenter2, 'clientX', {
            get: () => 50,
        });
        Object.defineProperty(eventCenter2, 'clientY', {
            get: () => 50,
        });
        fireEvent(dockview.element, eventCenter2);

        expect(events[4].nativeEvent).toBe(eventCenter2);
        expect(events[4].position).toBe('center');
        expect(events[4].target).toBe('edge');
        expect(events[4].getData).toBe(getPanelData);
        expect(events.length).toBe(5);
    });

    test('that dragging a tab triggers onWillDragPanel', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        dockview.layout(1000, 500);

        dockview.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        const tabDragEvents: TabDragEvent[] = [];
        const groupDragEvents: GroupDragEvent[] = [];

        dockview.onWillDragPanel((event) => {
            tabDragEvents.push(event);
        });
        dockview.onWillDragGroup((event) => {
            groupDragEvents.push(event);
        });

        const el = dockview.element.querySelector('.tab')!;
        expect(el).toBeTruthy();

        fireEvent.dragStart(el);

        expect(tabDragEvents.length).toBe(1);
        expect(groupDragEvents.length).toBe(0);
    });

    test('that dragging a group triggers onWillDragGroup', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        dockview.layout(1000, 500);

        dockview.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        const tabDragEvents: TabDragEvent[] = [];
        const groupDragEvents: GroupDragEvent[] = [];

        dockview.onWillDragPanel((event) => {
            tabDragEvents.push(event);
        });
        dockview.onWillDragGroup((event) => {
            groupDragEvents.push(event);
        });

        const el = dockview.element.querySelector('.void-container')!;
        expect(el).toBeTruthy();

        fireEvent.dragStart(el);

        expect(tabDragEvents.length).toBe(0);
        expect(groupDragEvents.length).toBe(1);
    });

    test('corrupt layout: bad inline view', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                panelA: PanelContentPartTest,
                panelB: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        dockview.layout(1000, 500);

        let el = dockview.element.querySelector('.view-container');
        expect(el).toBeTruthy();
        expect(el!.childNodes.length).toBe(0);

        dockview.addPanel({
            id: 'panel_1',
            component: 'panelA',
        });

        expect(dockview.groups.length).toBe(1);
        expect(dockview.panels.length).toBe(1);

        el = dockview.element.querySelector('.view-container');
        expect(el).toBeTruthy();
        expect(el!.childNodes.length).toBeGreaterThan(0);

        expect(() => {
            dockview.fromJSON({
                grid: {
                    root: {
                        type: 'branch',
                        data: [
                            {
                                type: 'leaf',
                                data: {
                                    views: ['panelA'],
                                    activeView: 'panelA',
                                    id: '1',
                                },
                                size: 841,
                            },
                            {
                                type: 'leaf',
                                data: {
                                    views: ['panelB'],
                                    activeView: 'panelB',
                                    id: '2',
                                },
                                size: 842,
                            },
                        ],
                        size: 530,
                    },
                    width: 1683,
                    height: 530,
                    orientation: Orientation.HORIZONTAL,
                },
                panels: {
                    panelA: {
                        id: 'panelA',
                        contentComponent: 'panelA',
                        title: 'Panel A',
                    },
                    panelB: {
                        id: 'panelB',
                        contentComponent: 'somethingBad',
                        title: 'Panel B',
                    },
                },
                activeGroup: '1',
            });
        }).toThrow(
            "Cannot create 'panelB', no component 'somethingBad' provided"
        );

        expect(dockview.groups.length).toBe(0);
        expect(dockview.panels.length).toBe(0);

        el = dockview.element.querySelector('.view-container');
        expect(el).toBeTruthy();
        expect(el!.childNodes.length).toBe(0);
    });

    test('corrupt layout: bad floating view', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                panelA: PanelContentPartTest,
                panelB: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        dockview.layout(1000, 500);

        let el = dockview.element.querySelector('.view-container');
        expect(el).toBeTruthy();
        expect(el!.childNodes.length).toBe(0);

        dockview.addPanel({
            id: 'panel_1',
            component: 'panelA',
        });

        dockview.addPanel({
            id: 'panel_2',
            component: 'panelA',
            floating: true,
        });

        expect(dockview.groups.length).toBe(2);
        expect(dockview.panels.length).toBe(2);

        el = dockview.element.querySelector('.dv-resize-container');
        expect(el).toBeTruthy();

        el = dockview.element.querySelector('.view-container');
        expect(el).toBeTruthy();
        expect(el!.childNodes.length).toBeGreaterThan(0);

        expect(() => {
            dockview.fromJSON({
                grid: {
                    root: {
                        type: 'branch',
                        data: [
                            {
                                type: 'leaf',
                                data: {
                                    views: ['panelA'],
                                    activeView: 'panelA',
                                    id: '1',
                                },
                                size: 841,
                            },
                            {
                                type: 'leaf',
                                data: {
                                    views: ['panelB'],
                                    activeView: 'panelB',
                                    id: '2',
                                },
                                size: 842,
                            },
                        ],
                        size: 530,
                    },
                    width: 1683,
                    height: 530,
                    orientation: Orientation.HORIZONTAL,
                },
                floatingGroups: [
                    {
                        data: {
                            views: ['panelB'],
                            activeView: 'panelB',
                            id: '3',
                        },
                        position: { left: 0, top: 0, height: 100, width: 100 },
                    },
                    {
                        data: {
                            views: ['panelC'],
                            activeView: 'panelC',
                            id: '4',
                        },
                        position: { left: 0, top: 0, height: 100, width: 100 },
                    },
                ],
                panels: {
                    panelA: {
                        id: 'panelA',
                        contentComponent: 'panelA',
                        title: 'Panel A',
                    },
                    panelB: {
                        id: 'panelB',
                        contentComponent: 'panelB',
                        title: 'Panel B',
                    },
                    panelC: {
                        id: 'panelC',
                        contentComponent: 'panelC',
                        title: 'Panel C',
                    },
                },
                activeGroup: '1',
            });
        }).toThrow("Cannot create 'panelC', no component 'panelC' provided");

        expect(dockview.groups.length).toBe(0);
        expect(dockview.panels.length).toBe(0);

        el = dockview.element.querySelector('.dv-resize-container');
        expect(el).toBeFalsy();

        el = dockview.element.querySelector('.view-container');
        expect(el).toBeTruthy();
        expect(el!.childNodes.length).toBe(0);
    });

    test('that disableAutoResizing is false by default', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                panelA: PanelContentPartTest,
                panelB: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });

        expect(dockview.disableResizing).toBeFalsy();
    });

    test('that disableAutoResizing can be enabled', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                panelA: PanelContentPartTest,
                panelB: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
            disableAutoResizing: true,
        });

        expect(dockview.disableResizing).toBeTruthy();
    });

    describe('floating groups', () => {
        test('that a floating group can be removed', async () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            expect(dockview.groups.length).toBe(0);
            const panel = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
                floating: true,
            });
            expect(dockview.groups.length).toBe(1);

            dockview.removePanel(panel);
            expect(dockview.groups.length).toBe(0);
        });

        test('move a floating group of one tab to a new fixed group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: true,
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(2);

            dockview.moveGroupOrPanel({
                from: { groupId: panel2.group.id },
                to: { group: panel1.group, position: 'right' },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(2);
        });

        test('move a floating group of one tab to an existing fixed group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: true,
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(2);

            dockview.moveGroupOrPanel({
                from: { groupId: panel2.group.id },
                to: { group: panel1.group, position: 'center' },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(1);
            expect(dockview.panels.length).toBe(2);
        });

        test('move a floating group of one tab to an existing floating group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: true,
            });

            const panel3 = dockview.addPanel({
                id: 'panel_3',
                component: 'default',
                floating: true,
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(3);
            expect(dockview.panels.length).toBe(3);

            dockview.moveGroupOrPanel({
                from: { groupId: panel3.group.id },
                to: { group: panel2.group, position: 'center' },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(3);
        });

        test('move a floating group of many tabs to a new fixed group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: true,
            });

            const panel3 = dockview.addPanel({
                id: 'panel_3',
                component: 'default',
                position: { referencePanel: panel2 },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(3);

            dockview.moveGroupOrPanel({
                from: { groupId: panel2.group.id },
                to: { group: panel1.group, position: 'right' },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(panel3.group.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(3);
        });

        test('move a floating group of many tabs to an existing fixed group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: true,
            });

            const panel3 = dockview.addPanel({
                id: 'panel_3',
                component: 'default',
                position: { referencePanel: panel2 },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(3);

            dockview.moveGroupOrPanel({
                from: { groupId: panel2.group.id },
                to: { group: panel1.group, position: 'center' },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(panel3.group.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(1);
            expect(dockview.panels.length).toBe(3);
        });

        test('move a floating group of many tabs to an existing floating group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: true,
            });

            const panel3 = dockview.addPanel({
                id: 'panel_3',
                component: 'default',
                position: { referencePanel: panel2 },
            });

            const panel4 = dockview.addPanel({
                id: 'panel_4',
                component: 'default',
                floating: true,
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(panel4.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(3);
            expect(dockview.panels.length).toBe(4);

            dockview.moveGroupOrPanel({
                from: { groupId: panel2.group.id },
                to: { group: panel4.group, position: 'center' },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(panel4.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(4);
        });

        test('move a floating tab of one tab to a new fixed group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: true,
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(2);

            dockview.moveGroupOrPanel({
                from: { groupId: panel2.group.id, panelId: panel2.id },
                to: { group: panel1.group, position: 'right' },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(2);
        });

        test('move a floating tab of one tab to an existing fixed group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: true,
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(2);

            dockview.moveGroupOrPanel({
                from: { groupId: panel2.group.id, panelId: panel2.id },
                to: { group: panel1.group, position: 'center' },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(1);
            expect(dockview.panels.length).toBe(2);
        });

        test('move a floating tab of one tab to an existing floating group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: true,
            });

            const panel3 = dockview.addPanel({
                id: 'panel_3',
                component: 'default',
                floating: true,
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(3);
            expect(dockview.panels.length).toBe(3);

            dockview.moveGroupOrPanel({
                from: { groupId: panel3.group.id, panelId: panel3.id },
                to: { group: panel2.group, position: 'center' },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(3);
        });

        test('move a floating tab of many tabs to a new fixed group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: true,
            });

            const panel3 = dockview.addPanel({
                id: 'panel_3',
                component: 'default',
                position: { referencePanel: panel2 },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(3);

            dockview.moveGroupOrPanel({
                from: { groupId: panel2.group.id, panelId: panel2.id },
                to: { group: panel1.group, position: 'right' },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(3);
            expect(dockview.panels.length).toBe(3);
        });

        test('move a floating tab of many tabs to an existing fixed group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: true,
            });

            const panel3 = dockview.addPanel({
                id: 'panel_3',
                component: 'default',
                position: { referencePanel: panel2 },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(3);

            dockview.moveGroupOrPanel({
                from: { groupId: panel2.group.id, panelId: panel2.id },
                to: { group: panel1.group, position: 'center' },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(3);
        });

        test('move a floating tab of many tabs to an existing floating group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: true,
            });

            const panel3 = dockview.addPanel({
                id: 'panel_3',
                component: 'default',
                position: { referencePanel: panel2 },
            });

            const panel4 = dockview.addPanel({
                id: 'panel_4',
                component: 'default',
                floating: true,
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(panel4.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(3);
            expect(dockview.panels.length).toBe(4);

            dockview.moveGroupOrPanel({
                from: { groupId: panel2.group.id, panelId: panel2.id },
                to: { group: panel4.group, position: 'center' },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(panel4.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(3);
            expect(dockview.panels.length).toBe(4);
        });

        test('move a fixed tab of one tab to an existing floating group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                position: { direction: 'right' },
            });

            const panel3 = dockview.addPanel({
                id: 'panel_3',
                component: 'default',
                floating: true,
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(3);
            expect(dockview.panels.length).toBe(3);

            dockview.moveGroupOrPanel({
                from: { groupId: panel1.group.id, panelId: panel1.id },
                to: { group: panel3.group, position: 'center' },
            });

            expect(panel1.group.api.location.type).toBe('floating');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(3);
        });

        test('move a fixed tab of many tabs to an existing floating group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
            });

            const panel3 = dockview.addPanel({
                id: 'panel_3',
                component: 'default',
                floating: true,
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(3);

            dockview.moveGroupOrPanel({
                from: { groupId: panel1.group.id, panelId: panel1.id },
                to: { group: panel3.group, position: 'center' },
            });

            expect(panel1.group.api.location.type).toBe('floating');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(3);
        });

        test('move a fixed group of one tab to an existing floating group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                position: { direction: 'right' },
            });

            const panel3 = dockview.addPanel({
                id: 'panel_3',
                component: 'default',
                floating: true,
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(3);
            expect(dockview.panels.length).toBe(3);

            dockview.moveGroupOrPanel({
                from: { groupId: panel1.group.id },
                to: { group: panel3.group, position: 'center' },
            });

            expect(panel1.group.api.location.type).toBe('floating');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(3);
        });

        test('move a fixed group of many tabs to an existing floating group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
            });

            const panel3 = dockview.addPanel({
                id: 'panel_3',
                component: 'default',
                floating: true,
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(3);

            dockview.moveGroupOrPanel({
                from: { groupId: panel1.group.id },
                to: { group: panel3.group, position: 'center' },
            });

            expect(panel1.group.api.location.type).toBe('floating');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(1);
            expect(dockview.panels.length).toBe(3);
        });

        test('move a fixed tab of one tab to a new floating group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                position: { direction: 'right' },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(2);

            dockview.addFloatingGroup(panel2);

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(2);
        });

        test('move a fixed tab of many tabs to a new floating group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(1);
            expect(dockview.panels.length).toBe(2);

            dockview.addFloatingGroup(panel2);

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(2);
        });

        test('move a fixed group of one tab to a new floating group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                position: { direction: 'right' },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(2);

            dockview.addFloatingGroup(panel2.group);

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(2);
        });

        test('move a fixed group of many tabs to a new floating group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(1);
            expect(dockview.panels.length).toBe(2);

            dockview.addFloatingGroup(panel2.group);

            expect(panel1.group.api.location.type).toBe('floating');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(dockview.groups.length).toBe(1);
            expect(dockview.panels.length).toBe(2);
        });
    });

    describe('popout group', () => {
        beforeEach(() => {
            jest.spyOn(window, 'open').mockReturnValue(
                fromPartial<Window>({
                    document: fromPartial<Document>({
                        body: document.createElement('body'),
                    }),
                    focus: jest.fn(),
                    addEventListener: jest
                        .fn()
                        .mockImplementation((name, cb) => {
                            if (name === 'load') {
                                cb();
                            }
                        }),
                    removeEventListener: jest.fn(),
                    close: jest.fn(),
                })
            );
        });

        test('add a popout group', async () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(1);
            expect(dockview.panels.length).toBe(2);

            await dockview.addPopoutGroup(panel2.group);

            expect(panel1.group.api.location.type).toBe('popout');
            expect(panel2.group.api.location.type).toBe('popout');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(2);
        });

        test('that can remove a popout group', async () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            await dockview.addPopoutGroup(panel1);

            expect(dockview.panels.length).toBe(1);
            expect(dockview.groups.length).toBe(2);
            expect(panel1.api.group.api.location.type).toBe('popout');

            dockview.removePanel(panel1);

            expect(dockview.panels.length).toBe(0);
            expect(dockview.groups.length).toBe(0);
        });

        test('move from fixed to popout group and back', async () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
            });

            const panel3 = dockview.addPanel({
                id: 'panel_3',
                component: 'default',
                position: {
                    direction: 'right',
                },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(panel3.group.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(3);

            await dockview.addPopoutGroup(panel2.group);

            expect(panel1.group.api.location.type).toBe('popout');
            expect(panel2.group.api.location.type).toBe('popout');
            expect(panel3.group.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(3);
            expect(dockview.panels.length).toBe(3);

            dockview.moveGroupOrPanel({
                from: { groupId: panel2.group.id, panelId: panel2.id },
                to: { group: panel3.group, position: 'right' },
            });

            expect(panel1.group.api.location.type).toBe('popout');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(panel3.group.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(4);
            expect(dockview.panels.length).toBe(3);

            dockview.moveGroupOrPanel({
                from: { groupId: panel1.group.id, panelId: panel1.id },
                to: { group: panel3.group, position: 'center' },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(panel3.group.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(3);
        });
    });

    describe('maximized group', () => {
        test('that a maximzied group is set to active', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent({
                parentElement: container,
                components: {
                    default: PanelContentPartTest,
                },
                tabComponents: {
                    test_tab_id: PanelTabPartTest,
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                position: { direction: 'right' },
            });

            expect(panel1.api.isActive).toBeFalsy();
            expect(panel1.group.api.isActive).toBeFalsy();
            expect(panel2.api.isActive).toBeTruthy();
            expect(panel2.group.api.isActive).toBeTruthy();

            panel1.api.maximize();

            expect(panel1.api.isActive).toBeTruthy();
            expect(panel1.group.api.isActive).toBeTruthy();
            expect(panel2.api.isActive).toBeFalsy();
            expect(panel2.group.api.isActive).toBeFalsy();
        });
    });

    test('that setVisible toggles visiblity', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent({
            parentElement: container,
            components: {
                default: PanelContentPartTest,
            },
            tabComponents: {
                test_tab_id: PanelTabPartTest,
            },
        });
        const api = new DockviewApi(dockview);

        dockview.layout(1000, 1000);

        const panel1 = api.addPanel({
            id: 'panel1',
            component: 'default',
        });
        const panel2 = api.addPanel({
            id: 'panel2',
            component: 'default',
            position: { referencePanel: panel1, direction: 'within' },
        });

        const panel3 = api.addPanel({
            id: 'panel3',
            component: 'default',
            position: { referencePanel: panel1, direction: 'right' },
        });

        const panel4 = api.addPanel({
            id: 'panel4',
            component: 'default',
            position: { referencePanel: panel3, direction: 'within' },
        });

        expect(api.groups.length).toBe(2);
        expect(panel1.group).toBe(panel2.group);
        expect(panel3.group).toBe(panel4.group);

        expect(panel1.group.api.isVisible).toBeTruthy();
        expect(panel2.group.api.isVisible).toBeTruthy();
        expect(panel3.group.api.isVisible).toBeTruthy();
        expect(panel4.group.api.isVisible).toBeTruthy();

        expect(panel1.api.isVisible).toBeFalsy();
        expect(panel2.api.isVisible).toBeTruthy();
        expect(panel3.api.isVisible).toBeFalsy();
        expect(panel4.api.isVisible).toBeTruthy();

        // case #1
        panel1.group.api.setVisible(false);

        expect(panel1.group.api.isVisible).toBeFalsy();
        expect(panel2.group.api.isVisible).toBeFalsy();
        expect(panel3.group.api.isVisible).toBeTruthy();
        expect(panel4.group.api.isVisible).toBeTruthy();

        expect(panel1.api.isVisible).toBeFalsy();
        expect(panel2.api.isVisible).toBeFalsy();
        expect(panel3.api.isVisible).toBeFalsy();
        expect(panel4.api.isVisible).toBeTruthy();

        // case #2

        panel3.group.api.setVisible(false);

        expect(panel1.group.api.isVisible).toBeFalsy();
        expect(panel2.group.api.isVisible).toBeFalsy();
        expect(panel3.group.api.isVisible).toBeFalsy();
        expect(panel4.group.api.isVisible).toBeFalsy();

        expect(panel1.api.isVisible).toBeFalsy();
        expect(panel2.api.isVisible).toBeFalsy();
        expect(panel3.api.isVisible).toBeFalsy();
        expect(panel4.api.isVisible).toBeFalsy();

        // case #2

        panel3.group.api.setVisible(true);

        expect(panel1.group.api.isVisible).toBeFalsy();
        expect(panel2.group.api.isVisible).toBeFalsy();
        expect(panel3.group.api.isVisible).toBeTruthy();
        expect(panel4.group.api.isVisible).toBeTruthy();

        expect(panel1.api.isVisible).toBeFalsy();
        expect(panel2.api.isVisible).toBeFalsy();
        expect(panel3.api.isVisible).toBeFalsy();
        expect(panel4.api.isVisible).toBeTruthy();

        // case #2

        panel1.group.api.setVisible(true);

        expect(panel1.group.api.isVisible).toBeTruthy();
        expect(panel2.group.api.isVisible).toBeTruthy();
        expect(panel3.group.api.isVisible).toBeTruthy();
        expect(panel4.group.api.isVisible).toBeTruthy();

        expect(panel1.api.isVisible).toBeFalsy();
        expect(panel2.api.isVisible).toBeTruthy();
        expect(panel3.api.isVisible).toBeFalsy();
        expect(panel4.api.isVisible).toBeTruthy();
    });
});
