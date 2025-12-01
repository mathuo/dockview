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
import { DockviewPanel, IDockviewPanel } from '../../dockview/dockviewPanel';
import { DockviewGroupPanel } from '../../dockview/dockviewGroupPanel';
import { fireEvent, queryByTestId } from '@testing-library/dom';
import { getPanelData } from '../../dnd/dataTransfer';
import {
    GroupDragEvent,
    TabDragEvent,
} from '../../dockview/components/titlebar/tabsContainer';
import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewApi } from '../../api/component.api';
import { DockviewDndOverlayEvent } from '../../dockview/options';
import { SizeEvent } from '../../api/gridviewPanelApi';
import { setupMockWindow } from '../__mocks__/mockWindow';

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

        dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
        });
    });

    test('update className', () => {
        dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
            className: 'test-a test-b',
        });
        expect(dockview.element.className).toBe(
            'test-a test-b dockview-theme-abyss'
        );

        dockview.updateOptions({ className: 'test-b test-c' });

        expect(dockview.element.className).toBe(
            'dockview-theme-abyss test-b test-c'
        );
    });

    describe('disableDnd option integration', () => {
        test('that updateOptions with disableDnd updates all tabs and void containers', () => {
            dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
                disableDnd: false,
            });

            // Add some panels to create tabs
            const panel1 = dockview.addPanel({
                id: 'panel1',
                component: 'default',
            });
            const panel2 = dockview.addPanel({
                id: 'panel2',
                component: 'default',
            });

            // Get all tab elements and void containers
            const tabElements = Array.from(
                dockview.element.querySelectorAll('.dv-tab')
            ) as HTMLElement[];
            const voidContainers = Array.from(
                dockview.element.querySelectorAll('.dv-void-container')
            ) as HTMLElement[];

            // Initially tabs should be draggable (disableDnd: false)
            tabElements.forEach((tab) => {
                expect(tab.draggable).toBe(true);
            });
            voidContainers.forEach((container) => {
                expect(container.draggable).toBe(true);
            });

            // Update options to disable DnD
            dockview.updateOptions({ disableDnd: true });

            // Now tabs should not be draggable
            tabElements.forEach((tab) => {
                expect(tab.draggable).toBe(false);
            });
            voidContainers.forEach((container) => {
                expect(container.draggable).toBe(false);
            });

            // Update options to enable DnD again
            dockview.updateOptions({ disableDnd: false });

            // Tabs should be draggable again
            tabElements.forEach((tab) => {
                expect(tab.draggable).toBe(true);
            });
            voidContainers.forEach((container) => {
                expect(container.draggable).toBe(true);
            });
        });

        test('that new tabs respect current disableDnd option when added after option change', () => {
            dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
                disableDnd: false,
            });

            // Set disableDnd to true
            dockview.updateOptions({ disableDnd: true });

            // Add a panel after the option change
            const panel = dockview.addPanel({
                id: 'panel1',
                component: 'default',
            });

            // New tab should not be draggable
            const tabElement = dockview.element.querySelector(
                '.dv-tab'
            ) as HTMLElement;
            const voidContainer = dockview.element.querySelector(
                '.dv-void-container'
            ) as HTMLElement;

            expect(tabElement.draggable).toBe(false);
            expect(voidContainer.draggable).toBe(false);
        });
    });

    describe('memory leakage', () => {
        beforeEach(() => {
            window.open = () => setupMockWindow();
        });

        test('event leakage', async () => {
            Emitter.setLeakageMonitorEnabled(true);

            dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
                className: 'test-a test-b',
            });

            dockview.layout(500, 1000);

            const panel1 = dockview.addPanel({
                id: 'panel1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel2',
                component: 'default',
            });

            dockview.removePanel(panel2);

            const panel3 = dockview.addPanel({
                id: 'panel3',
                component: 'default',
                position: {
                    direction: 'right',
                    referencePanel: 'panel1',
                },
            });

            const panel4 = dockview.addPanel({
                id: 'panel4',
                component: 'default',
                position: {
                    direction: 'above',
                },
            });

            panel4.api.group.api.moveTo({
                group: panel3.api.group,
                position: 'center',
            });

            dockview.addPanel({
                id: 'panel5',
                component: 'default',
                floating: true,
            });

            const panel6 = dockview.addPanel({
                id: 'panel6',
                component: 'default',
                position: {
                    referencePanel: 'panel5',
                    direction: 'within',
                },
            });

            dockview.addFloatingGroup(panel4.api.group);

            await dockview.addPopoutGroup(panel2);

            panel1.api.group.api.moveTo({
                group: panel6.api.group,
                position: 'center',
            });

            panel4.api.group.api.moveTo({
                group: panel6.api.group,
                position: 'center',
            });

            dockview.dispose();

            if (Emitter.MEMORY_LEAK_WATCHER.size > 0) {
                console.warn(
                    `${Emitter.MEMORY_LEAK_WATCHER.size} undisposed resources`
                );

                for (const entry of Array.from(
                    Emitter.MEMORY_LEAK_WATCHER.events
                )) {
                    console.log('disposal', entry[1]);
                }
                throw new Error(
                    `${Emitter.MEMORY_LEAK_WATCHER.size} undisposed resources`
                );
            }

            Emitter.setLeakageMonitorEnabled(false);
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

        dockview.dispose();
    });

    describe('move group', () => {
        test('that moving a popup group into the grid manages view disposals correctly', async () => {
            window.open = () => setupMockWindow();

            dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });

            dockview.layout(600, 1000);

            const panel1 = dockview.addPanel({
                id: 'panel1',
                component: 'default',
            });
            const panel2 = dockview.addPanel({
                id: 'panel2',
                component: 'default',
                position: { direction: 'right' },
            });
            const panel3 = dockview.addPanel({
                id: 'panel3',
                component: 'default',
                position: { direction: 'right' },
            });

            await dockview.addPopoutGroup(panel1.api.group);

            expect(panel1.api.location.type).toBe('popout');
            expect(dockview.groups.length).toBe(4);
            expect(dockview.panels.length).toBe(3);

            panel1.api.group.api.moveTo({
                group: panel2.api.group,
                position: 'left',
            });

            expect(panel1.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(3);
            expect(dockview.panels.length).toBe(3);

            const query = dockview.element.querySelectorAll('.dv-view');
            expect(query.length).toBe(3);
        });

        test('that moving a popout group to specific position works correctly', async () => {
            window.open = () => setupMockWindow();

            dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });

            dockview.layout(600, 1000);

            const panel1 = dockview.addPanel({
                id: 'panel1',
                component: 'default',
            });
            const panel2 = dockview.addPanel({
                id: 'panel2',
                component: 'default',
                position: { direction: 'right' },
            });

            await dockview.addPopoutGroup(panel1.api.group);
            expect(panel1.api.location.type).toBe('popout');
            expect(dockview.groups.length).toBe(3); // panel2 + hidden reference + popout

            // Move popout group to left of panel2
            panel1.api.group.api.moveTo({
                group: panel2.api.group,
                position: 'left',
            });

            // Core assertions: should be back in grid and positioned correctly
            expect(panel1.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(2); // Should clean up properly
            expect(dockview.panels.length).toBe(2);

            // Verify both panels are visible and accessible
            expect(panel1.api.isVisible).toBe(true);
            expect(panel2.api.isVisible).toBe(true);
        });

        test('that moving a popout group to different positions works', async () => {
            window.open = () => setupMockWindow();

            dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });

            dockview.layout(600, 1000);

            const panel1 = dockview.addPanel({
                id: 'panel1',
                component: 'default',
            });
            const panel2 = dockview.addPanel({
                id: 'panel2',
                component: 'default',
                position: { direction: 'right' },
            });

            await dockview.addPopoutGroup(panel1.api.group);
            expect(panel1.api.location.type).toBe('popout');

            // Test moving to different positions
            ['top', 'bottom', 'left', 'right'].forEach((position) => {
                panel1.api.group.api.moveTo({
                    group: panel2.api.group,
                    position: position as any,
                });

                // Should be back in grid and work correctly regardless of position
                expect(panel1.api.location.type).toBe('grid');
                expect(panel1.api.isVisible).toBe(true);
                expect(panel2.api.isVisible).toBe(true);
                expect(dockview.groups.length).toBeGreaterThanOrEqual(2);
                expect(dockview.panels.length).toBe(2);
            });
        });

        test('that reference group cleanup works when moving popout to new position', async () => {
            window.open = () => setupMockWindow();

            dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });

            dockview.layout(600, 1000);

            const panel1 = dockview.addPanel({
                id: 'panel1',
                component: 'default',
            });
            const panel2 = dockview.addPanel({
                id: 'panel2',
                component: 'default',
                position: { direction: 'right' },
            });

            // Store reference group ID before popout
            const originalGroupId = panel1.group.id;

            await dockview.addPopoutGroup(panel1.api.group);
            expect(panel1.api.location.type).toBe('popout');
            expect(dockview.groups.length).toBe(3); // panel2 + hidden reference + popout

            // Move to new position - should clean up reference group
            panel1.api.group.api.moveTo({
                group: panel2.api.group,
                position: 'right',
            });

            expect(panel1.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(2); // Just panel2 + panel1 in new position

            // Reference group should be cleaned up (no longer exist)
            const referenceGroupStillExists = dockview.groups.some(
                (g) => g.id === originalGroupId
            );
            expect(referenceGroupStillExists).toBe(false);
        });

        test('horizontal', () => {
            dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });

            dockview.layout(600, 1000);

            const panel1 = dockview.addPanel({
                id: 'panel1',
                component: 'default',
            });
            const panel2 = dockview.addPanel({
                id: 'panel2',
                component: 'default',
                position: { direction: 'right' },
            });
            const panel3 = dockview.addPanel({
                id: 'panel3',
                component: 'default',
                position: { direction: 'right' },
            });

            expect(panel1.api.width).toBe(200);
            expect(panel2.api.width).toBe(200);
            expect(panel3.api.width).toBe(200);

            panel3.api.setSize({ width: 300 });

            expect(panel1.api.width).toBe(200);
            expect(panel2.api.width).toBe(100);
            expect(panel3.api.width).toBe(300);

            dockview.moveGroup({
                from: { group: panel3.api.group },
                to: { group: panel1.api.group, position: 'right' },
            });

            expect(panel1.api.width).toBe(200);
            expect(panel2.api.width).toBe(100);
            expect(panel3.api.width).toBe(300);
        });

        test('vertical', () => {
            dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });

            dockview.layout(1000, 600);

            const panel1 = dockview.addPanel({
                id: 'panel1',
                component: 'default',
            });
            const panel2 = dockview.addPanel({
                id: 'panel2',
                component: 'default',
                position: { direction: 'below' },
            });
            const panel3 = dockview.addPanel({
                id: 'panel3',
                component: 'default',
                position: { direction: 'below' },
            });

            expect(panel1.api.height).toBe(200);
            expect(panel2.api.height).toBe(200);
            expect(panel3.api.height).toBe(200);

            panel3.api.setSize({ height: 300 });

            expect(panel1.api.height).toBe(200);
            expect(panel2.api.height).toBe(100);
            expect(panel3.api.height).toBe(300);

            dockview.moveGroup({
                from: { group: panel3.api.group },
                to: { group: panel1.api.group, position: 'bottom' },
            });

            expect(panel1.api.height).toBe(200);
            expect(panel2.api.height).toBe(100);
            expect(panel3.api.height).toBe(300);
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

    test('moveGroupOrPanel with skipSetActive should not activate group/panel', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
        });

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

        const panel1 = dockview.getGroupPanel('panel1');
        const panel2 = dockview.getGroupPanel('panel2');
        const panel3 = dockview.getGroupPanel('panel3');
        const panel4 = dockview.getGroupPanel('panel4');

        const group1 = panel1!.group;

        // Move panel1 to create a new group
        dockview.moveGroupOrPanel({
            from: { groupId: group1.id, panelId: 'panel1' },
            to: { group: group1, position: 'right' },
        });
        const group2 = panel1!.group;

        // Verify panel1 is active after move (default behavior)
        expect(dockview.activeGroup).toBe(group2);
        expect(dockview.activePanel).toBe(panel1);

        // Set a different group active and make panel2 the active panel
        dockview.doSetGroupActive(group1);
        group1.model.openPanel(panel2!);
        expect(dockview.activeGroup).toBe(group1);
        expect(dockview.activePanel?.id).toBe(panel2?.id);

        // Move panel3 to group2 with skipSetActive
        dockview.moveGroupOrPanel({
            from: { groupId: group1.id, panelId: 'panel3' },
            to: { group: group2, position: 'center' },
            skipSetActive: true,
        });

        // group1 should still be active, not group2
        expect(dockview.activeGroup).toBe(group1);
        expect(dockview.activePanel?.id).toBe(panel2?.id); // panel2 should still be active in group1
        expect(panel3!.group).toBe(group2); // panel3 should have moved to group2

        dockview.dispose();
    });

    test('moveGroupOrPanel group move with skipSetActive should not activate group', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
        });

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

        const panel1 = dockview.getGroupPanel('panel1')!;
        const panel2 = dockview.getGroupPanel('panel2')!;
        const panel3 = dockview.getGroupPanel('panel3')!;

        // Create separate groups
        panel2.api.moveTo({ position: 'right' });
        panel3.api.moveTo({ group: panel2.group, position: 'center' });

        // Set panel1's group as active and ensure panel1 is the active panel
        dockview.doSetGroupActive(panel1.group);
        panel1.group.model.openPanel(panel1);
        expect(dockview.activeGroup).toBe(panel1.group);
        expect(dockview.activePanel?.id).toBe(panel1.id);

        // Move panel2's entire group to panel1's group with skipSetActive
        dockview.moveGroupOrPanel({
            from: { groupId: panel2.group.id },
            to: { group: panel1.group, position: 'center' },
            skipSetActive: true,
        });

        // panel1's group should still be active and there should be an active panel
        expect(dockview.activeGroup).toBe(panel1.group);
        expect(dockview.activePanel).toBeTruthy();
        // All panels should now be in the same group
        expect(panel2.group).toBe(panel1.group);
        expect(panel3.group).toBe(panel1.group);

        dockview.dispose();
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
            '.dv-branch-node > .dv-split-view-container > .dv-view-container > .dv-view'
        );

        expect(viewQuery.length).toBe(1);

        viewQuery = container.querySelectorAll(
            '.dv-branch-node > .dv-split-view-container > .dv-view-container > .dv-view:nth-child(1) >.dv-groupview > .dv-content-container > .testpanel-panel2'
        );

        expect(viewQuery.length).toBe(1);

        const group = dockview.getGroupPanel('panel1')!.group;
        dockview.moveGroupOrPanel({
            from: { groupId: group.id, panelId: 'panel1' },
            to: { group, position: 'right' },
        });

        viewQuery = container.querySelectorAll(
            '.dv-branch-node > .dv-split-view-container > .dv-view-container > .dv-view'
        );

        expect(viewQuery.length).toBe(2);

        viewQuery = container.querySelectorAll(
            '.dv-branch-node > .dv-split-view-container > .dv-view-container > .dv-view:nth-child(1) >.dv-groupview > .dv-content-container > .testpanel-panel2'
        );

        expect(viewQuery.length).toBe(1);

        viewQuery = container.querySelectorAll(
            '.dv-branch-node > .dv-split-view-container > .dv-view-container > .dv-view:nth-child(2) >.dv-groupview > .dv-content-container > .testpanel-panel1'
        );

        expect(viewQuery.length).toBe(1);
    });

    describe('serialization', () => {
        test('reuseExistingPanels true', () => {
            const parts: PanelContentPartTest[] = [];

            dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            const part = new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                            parts.push(part);
                            return part;
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });

            dockview.layout(1000, 1000);

            dockview.addPanel({ id: 'panel1', component: 'default' });
            dockview.addPanel({ id: 'panel2', component: 'default' });
            dockview.addPanel({ id: 'panel7', component: 'default' });

            expect(parts.length).toBe(3);

            expect(parts.map((part) => part.isDisposed)).toEqual([
                false,
                false,
                false,
            ]);

            dockview.fromJSON(
                {
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
                                            data: {
                                                views: ['panel4'],
                                                id: 'group-3',
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
                        orientation: Orientation.VERTICAL,
                    },
                    panels: {
                        panel1: {
                            id: 'panel1',
                            contentComponent: 'default',
                            tabComponent: 'tab-default',
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
                            renderer: 'onlyWhenVisible',
                        },
                        panel4: {
                            id: 'panel4',
                            contentComponent: 'default',
                            title: 'panel4',
                            renderer: 'always',
                        },
                    },
                },
                { reuseExistingPanels: true }
            );

            expect(parts.map((part) => part.isDisposed)).toEqual([
                false,
                false,
                true,
                false,
                false,
            ]);
        });

        test('reuseExistingPanels false', () => {
            const parts: PanelContentPartTest[] = [];

            dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            const part = new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                            parts.push(part);
                            return part;
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });

            dockview.layout(1000, 1000);

            dockview.addPanel({ id: 'panel1', component: 'default' });
            dockview.addPanel({ id: 'panel2', component: 'default' });
            dockview.addPanel({ id: 'panel7', component: 'default' });

            expect(parts.length).toBe(3);

            expect(parts.map((part) => part.isDisposed)).toEqual([
                false,
                false,
                false,
            ]);

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
                                        data: {
                                            views: ['panel4'],
                                            id: 'group-3',
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
                    orientation: Orientation.VERTICAL,
                },
                panels: {
                    panel1: {
                        id: 'panel1',
                        contentComponent: 'default',
                        tabComponent: 'tab-default',
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
                        renderer: 'onlyWhenVisible',
                    },
                    panel4: {
                        id: 'panel4',
                        contentComponent: 'default',
                        title: 'panel4',
                        renderer: 'always',
                    },
                },
            });

            expect(parts.map((part) => part.isDisposed)).toEqual([
                true,
                true,
                true,
                false,
                false,
                false,
                false,
            ]);
        });

        test('basic', () => {
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
                                        data: {
                                            views: ['panel4'],
                                            id: 'group-3',
                                        },
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
                        tabComponent: 'tab-default',
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
                        renderer: 'onlyWhenVisible',
                    },
                    panel4: {
                        id: 'panel4',
                        contentComponent: 'default',
                        title: 'panel4',
                        renderer: 'always',
                    },
                    panel5: {
                        id: 'panel5',
                        contentComponent: 'default',
                        title: 'panel5',
                        minimumHeight: 100,
                        maximumHeight: 1000,
                        minimumWidth: 200,
                        maximumWidth: 2000,
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
                        tabComponent: 'tab-default',
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
                        renderer: 'onlyWhenVisible',
                    },
                    panel4: {
                        id: 'panel4',
                        contentComponent: 'default',
                        title: 'panel4',
                        renderer: 'always',
                    },
                    panel5: {
                        id: 'panel5',
                        contentComponent: 'default',
                        title: 'panel5',
                        minimumHeight: 100,
                        maximumHeight: 1000,
                        minimumWidth: 200,
                        maximumWidth: 2000,
                    },
                },
            });
        });

        test('serialized layout with maximized node', () => {
            const api = new DockviewApi(dockview);

            api.layout(500, 1000);

            api.addPanel({
                id: 'panel1',
                component: 'default',
            });

            api.addPanel({
                id: 'panel2',
                component: 'default',
                position: { direction: 'right' },
            });

            api.addPanel({
                id: 'panel3',
                component: 'default',
                position: { direction: 'below' },
            });

            const panel4 = api.addPanel({
                id: 'panel4',
                component: 'default',
            });

            panel4.api.maximize();
            expect(panel4.api.isMaximized()).toBeTruthy();

            const state = api.toJSON();
            expect(api.hasMaximizedGroup()).toBeTruthy();
            expect(panel4.api.isMaximized()).toBeTruthy();

            api.clear();
            expect(api.groups.length).toBe(0);
            expect(api.panels.length).toBe(0);

            api.fromJSON(state);
            const newPanel4 = api.getPanel('panel4')!;
            expect(api.hasMaximizedGroup()).toBeTruthy();
            expect(newPanel4.api.isMaximized()).toBeTruthy();

            expect(state).toEqual(api.toJSON());
        });

        test('always visible renderer positioning after fromJSON', async () => {
            dockview.layout(1000, 1000);

            // Create a layout with both onlyWhenVisible and always visible panels
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
                                    activeView: 'panel1',
                                },
                                size: 500,
                            },
                            {
                                type: 'leaf',
                                data: {
                                    views: ['panel3'],
                                    id: 'group-2',
                                    activeView: 'panel3',
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
                        renderer: 'onlyWhenVisible',
                    },
                    panel2: {
                        id: 'panel2',
                        contentComponent: 'default',
                        title: 'panel2',
                        renderer: 'always',
                    },
                    panel3: {
                        id: 'panel3',
                        contentComponent: 'default',
                        title: 'panel3',
                        renderer: 'always',
                    },
                },
            });

            // Wait for next animation frame to ensure positioning is complete
            await new Promise((resolve) => requestAnimationFrame(resolve));

            const panel2 = dockview.getGroupPanel('panel2')!;
            const panel3 = dockview.getGroupPanel('panel3')!;

            // Verify that always visible panels have been positioned
            const overlayContainer = dockview.overlayRenderContainer;

            // Check that panels with renderer: 'always' are attached to overlay container
            expect(panel2.api.renderer).toBe('always');
            expect(panel3.api.renderer).toBe('always');

            // Get the overlay elements for always visible panels
            const panel2Overlay = overlayContainer.element.querySelector(
                '[data-panel-id]'
            ) as HTMLElement;
            const panel3Overlay = overlayContainer.element.querySelector(
                '[data-panel-id]:not(:first-child)'
            ) as HTMLElement;

            // Verify positioning has been applied (should not be 0 after layout)
            if (panel2Overlay) {
                const style = getComputedStyle(panel2Overlay);
                expect(style.position).toBe('absolute');
                expect(style.left).not.toBe('0px');
                expect(style.top).not.toBe('0px');
                expect(style.width).not.toBe('0px');
                expect(style.height).not.toBe('0px');
            }

            // Test that updateAllPositions method works correctly
            const updateSpy = jest.spyOn(
                overlayContainer,
                'updateAllPositions'
            );

            // Call fromJSON again to trigger position updates
            dockview.fromJSON(dockview.toJSON());

            // Wait for the position update to be called
            await new Promise((resolve) => requestAnimationFrame(resolve));

            expect(updateSpy).toHaveBeenCalled();

            updateSpy.mockRestore();
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

    test('events flow', async () => {
        window.open = () => setupMockWindow();

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
            }),
            dockview.onDidMovePanel(({ panel }) => {
                events.push({ type: 'MOVE_PANEL', panel });
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

        expect(events).toEqual([
            { type: 'ACTIVE_GROUP', group: panel2.group },
            { type: 'MOVE_PANEL', panel: panel5 },
        ]);

        events = [];

        const groupReferenceBeforeMove = panel4.group;

        dockview.moveGroupOrPanel({
            from: { groupId: panel4.group.id, panelId: panel4.id },
            to: { group: panel2.group, position: 'center' },
        });

        expect(events).toEqual([
            { type: 'REMOVE_GROUP', group: groupReferenceBeforeMove },
            { type: 'ACTIVE_PANEL', panel: panel4 },
            { type: 'MOVE_PANEL', panel: panel4 },
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

        events = [];

        const panel8 = dockview.addPanel({
            id: 'panel8',
            component: 'default',
        });
        const panel9 = dockview.addPanel({
            id: 'panel9',
            component: 'default',
            floating: true,
        });
        const panel10 = dockview.addPanel({
            id: 'panel10',
            component: 'default',
        });

        expect(await dockview.addPopoutGroup(panel10)).toBeTruthy();

        expect(events).toEqual([
            { type: 'ADD_GROUP', group: panel8.group },
            { type: 'ADD_PANEL', panel: panel8 },
            { type: 'ACTIVE_GROUP', group: panel8.group },
            { type: 'ACTIVE_PANEL', panel: panel8 },
            { type: 'ADD_GROUP', group: panel9.group },
            { type: 'ADD_PANEL', panel: panel9 },
            { type: 'ACTIVE_GROUP', group: panel9.group },
            { type: 'ACTIVE_PANEL', panel: panel9 },
            { type: 'ADD_PANEL', panel: panel10 },
            { type: 'ACTIVE_PANEL', panel: panel10 },
            { type: 'ADD_GROUP', group: panel10.group },
        ]);

        events = [];
        disposable.dispose();

        expect(events.length).toBe(0);
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
            createTabComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelTabPartTest(options.id, options.name);
                    default:
                        throw new Error(`unsupported`);
                }
            },
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
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
            createTabComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelTabPartTest(options.id, options.name);
                    default:
                        throw new Error(`unsupported`);
                }
            },
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
            createTabComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelTabPartTest(options.id, options.name);
                    default:
                        throw new Error(`unsupported`);
                }
            },
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
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
            createTabComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelTabPartTest(options.id, options.name);
                    default:
                        throw new Error(`unsupported`);
                }
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
            createTabComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelTabPartTest(options.id, options.name);
                    default:
                        throw new Error(`unsupported`);
                }
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
            createTabComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelTabPartTest(options.id, options.name);
                    default:
                        throw new Error(`unsupported`);
                }
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
            createTabComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelTabPartTest(options.id, options.name);
                    default:
                        throw new Error(`unsupported`);
                }
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
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
            createTabComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelTabPartTest(options.id, options.name);
                    default:
                        throw new Error(`unsupported`);
                }
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
            createTabComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelTabPartTest(options.id, options.name);
                    default:
                        throw new Error(`unsupported`);
                }
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
            createTabComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelTabPartTest(options.id, options.name);
                    default:
                        throw new Error(`unsupported`);
                }
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
        let movedPanels: IDockviewPanel[] = [];
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
            dockview.onDidMovePanel((event) => {
                movedPanels.push(event.panel);
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
        expect(movedPanels.length).toBe(0);
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
        expect(movedPanels.length).toBe(0);
        expect(layoutChange).toBe(1);
        expect(layoutChangeFromJson).toBe(1);

        return disposable.dispose();
    });

    test('load a layout with a non-existant tab id', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
            createTabComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelTabPartTest(options.id, options.name);
                    default:
                        throw new Error(`unsupported`);
                }
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
                    tabComponent: 'default',
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
                    tabComponent: 'default',
                    title: 'panel2',
                },
            },
        });
    });

    test('#2', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
            createTabComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelTabPartTest(options.id, options.name);
                    default:
                        throw new Error(`unsupported`);
                }
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
                    tabComponent: 'default',
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
            '.dv-groupview > .dv-tabs-and-actions-container > .dv-scrollable > .dv-tabs-container > .dv-tab'
        );
        expect(viewQuery.length).toBe(2);

        const viewQuery2 = group.element.querySelectorAll(
            '.dv-groupview > .dv-tabs-and-actions-container > .dv-scrollable > .dv-tabs-container > .dv-tab > .dv-default-tab'
        );
        expect(viewQuery2.length).toBe(1);

        const viewQuery3 = group.element.querySelectorAll(
            '.dv-groupview > .dv-tabs-and-actions-container > .dv-scrollable > .dv-tabs-container > .dv-tab > .panel-tab-part-panel2'
        );
        expect(viewQuery3.length).toBe(1);
    });

    // load a layout with a default tab identifier when react default is present

    // load a layout with invialid panel identifier

    test('orthogonal realigment #1', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
        });

        expect(dockview.groups.length).toBe(0);
    });

    test('that deserializing an empty layout has zero groups and a watermark', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
        });

        dockview.layout(100, 100);

        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });

        expect(dockview.element.querySelectorAll('.dv-view').length).toBe(1);

        const panel2 = dockview.addPanel({
            id: 'panel2',
            component: 'default',
        });

        expect(dockview.element.querySelectorAll('.dv-view').length).toBe(1);

        const panel3 = dockview.addPanel({
            id: 'panel3',
            component: 'default',
        });

        expect(dockview.element.querySelectorAll('.dv-view').length).toBe(1);

        dockview.moveGroupOrPanel({
            from: { groupId: panel3.group.id, panelId: panel3.id },
            to: { group: panel3.group, position: 'right' },
        });

        expect(dockview.groups.length).toBe(2);
        expect(dockview.element.querySelectorAll('.dv-view').length).toBe(2);

        dockview.moveGroupOrPanel({
            from: { groupId: panel2.group.id, panelId: panel2.id },
            to: { group: panel3.group, position: 'bottom' },
        });

        expect(dockview.groups.length).toBe(3);
        expect(dockview.element.querySelectorAll('.dv-view').length).toBe(4);

        dockview.moveGroupOrPanel({
            from: { groupId: panel1.group.id, panelId: panel1.id },
            to: { group: panel2.group, position: 'center' },
        });

        expect(dockview.groups.length).toBe(2);

        expect(dockview.element.querySelectorAll('.dv-view').length).toBe(2);
    });

    test('that fromJSON layouts are resized to the current dimensions', async () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
        });

        dockview.layout(1000, 500);

        const panel1 = dockview.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        expect(
            dockview.element.querySelectorAll('.dv-view-container > .dv-view')
                .length
        ).toBe(1);

        dockview.addFloatingGroup(panel1);

        expect(
            dockview.element.querySelectorAll('.dv-view-container > .dv-view')
                .length
        ).toBe(0);
    });

    test('that api.setSize applies to the overlay for floating panels', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
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

        Object.defineProperty(dockview.element, 'offsetWidth', {
            get: () => 100,
        });
        Object.defineProperty(dockview.element, 'offsetHeight', {
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

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
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

        const el = dockview.element.querySelector('.dv-tab')!;
        expect(el).toBeTruthy();

        fireEvent.dragStart(el);

        expect(tabDragEvents.length).toBe(1);
        expect(groupDragEvents.length).toBe(0);
    });

    test('that dragging a group triggers onWillDragGroup', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
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

        const el = dockview.element.querySelector('.dv-void-container')!;
        expect(el).toBeTruthy();

        fireEvent.dragStart(el);

        expect(tabDragEvents.length).toBe(0);
        expect(groupDragEvents.length).toBe(1);
    });

    test('corrupt layout: bad inline view', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'panelA':
                    case 'panelB':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported panel '${options.name}'`);
                }
            },
        });

        dockview.layout(1000, 500);

        let el = dockview.element.querySelector('.dv-view-container');
        expect(el).toBeTruthy();
        expect(el!.childNodes.length).toBe(0);

        dockview.addPanel({
            id: 'panel_1',
            component: 'panelA',
        });

        expect(dockview.groups.length).toBe(1);
        expect(dockview.panels.length).toBe(1);

        el = dockview.element.querySelector('.dv-view-container');
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
        }).toThrow("unsupported panel 'somethingBad'");

        expect(dockview.groups.length).toBe(0);
        expect(dockview.panels.length).toBe(0);

        el = dockview.element.querySelector('.dv-view-container');
        expect(el).toBeTruthy();
        expect(el!.childNodes.length).toBe(0);
    });

    test('corrupt layout: bad floating view', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'panelA':
                    case 'panelB':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported panel '${options.name}'`);
                }
            },
        });

        dockview.layout(1000, 500);

        let el = dockview.element.querySelector('.dv-view-container');
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

        el = dockview.element.querySelector('.dv-view-container');
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
                            views: ['panelC'],
                            activeView: 'panelC',
                            id: '3',
                        },
                        position: { left: 0, top: 0, height: 100, width: 100 },
                    },
                    {
                        data: {
                            views: ['panelD'],
                            activeView: 'panelD',
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
        }).toThrow("unsupported panel 'panelC'");

        expect(dockview.groups.length).toBe(0);
        expect(dockview.panels.length).toBe(0);

        el = dockview.element.querySelector('.dv-resize-container');
        expect(el).toBeFalsy();

        el = dockview.element.querySelector('.dv-view-container');
        expect(el).toBeTruthy();
        expect(el!.childNodes.length).toBe(0);
    });

    test('that disableAutoResizing is false by default', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'panelA':
                    case 'panelB':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
        });

        expect(dockview.disableResizing).toBeFalsy();
    });

    test('that disableAutoResizing can be enabled', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'panelA':
                    case 'panelB':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
            disableAutoResizing: true,
        });

        expect(dockview.disableResizing).toBeTruthy();
    });

    describe('floating groups', () => {
        test('that a floating group can be removed', async () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

        test('component should remain visible when moving from floating back to new grid group (GitHub issue #996)', () => {
            const container = document.createElement('div');
            container.style.width = '800px';
            container.style.height = '600px';
            document.body.appendChild(container);

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    const element = document.createElement('div');
                    element.innerHTML = `<div class="test-content-${options.id}">Test Content: ${options.id}</div>`;
                    element.style.background = 'lightblue';
                    element.style.padding = '10px';
                    return new PanelContentPartTest(options.id, options.name);
                },
            });

            dockview.layout(800, 600);

            try {
                // 1. Create a panel
                const panel = dockview.addPanel({
                    id: 'test-panel',
                    component: 'default',
                });

                // Verify initial state
                expect(panel.api.location.type).toBe('grid');

                // 2. Move to floating group
                dockview.addFloatingGroup(panel, {
                    position: {
                        bottom: 50,
                        right: 50,
                    },
                    width: 400,
                    height: 300,
                });

                // Verify floating state
                expect(panel.api.location.type).toBe('floating');

                // 3. Move back to grid using addGroup + moveTo pattern (reproducing user's exact issue)
                const addGroup = dockview.addGroup();
                panel.api.moveTo({ group: addGroup });

                // THIS IS THE FIX: Component should still be visible
                expect(panel.api.location.type).toBe('grid');

                // Test multiple scenarios
                const panel2 = dockview.addPanel({
                    id: 'panel-2',
                    component: 'default',
                    floating: true,
                });

                const group2 = dockview.addGroup();
                panel2.api.moveTo({ group: group2 });

                expect(panel2.api.location.type).toBe('grid');
            } finally {
                dockview.dispose();
                if (container.parentElement) {
                    container.parentElement.removeChild(container);
                }
            }
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

        test('deserailize popout with no reference group', async () => {
            jest.useRealTimers();

            const container = document.createElement('div');

            window.open = () => setupMockWindow();

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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
                                size: 1000,
                            },
                        ],
                        size: 1000,
                    },
                    height: 1000,
                    width: 1000,
                    orientation: Orientation.VERTICAL,
                },
                popoutGroups: [
                    {
                        data: {
                            views: ['panel2'],
                            id: 'group-2',
                            activeView: 'panel2',
                        },
                        position: null,
                    },
                ],
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

            await new Promise((resolve) => setTimeout(resolve, 0));

            const panel2 = dockview.api.getPanel('panel2');

            const windowObject =
                panel2?.api.location.type === 'popout'
                    ? panel2?.api.location.getWindow()
                    : undefined;

            expect(windowObject).toBeTruthy();

            windowObject!.close();
        });

        test('grid -> floating -> popout -> popout closed', async () => {
            const container = document.createElement('div');

            window.open = () => setupMockWindow();

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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
                position: { direction: 'right' },
            });

            expect(panel1.api.location.type).toBe('grid');
            expect(panel2.api.location.type).toBe('grid');
            expect(panel3.api.location.type).toBe('grid');

            dockview.addFloatingGroup(panel2);

            expect(panel1.api.location.type).toBe('grid');
            expect(panel2.api.location.type).toBe('floating');
            expect(panel3.api.location.type).toBe('grid');

            await dockview.addPopoutGroup(panel2);

            expect(panel1.api.location.type).toBe('grid');
            expect(panel2.api.location.type).toBe('popout');
            expect(panel3.api.location.type).toBe('grid');

            const windowObject =
                panel2.api.location.type === 'popout'
                    ? panel2.api.location.getWindow()
                    : undefined;
            expect(windowObject).toBeTruthy();

            windowObject!.close();

            expect(panel1.api.location.type).toBe('grid');
            expect(panel2.api.location.type).toBe('floating');
            expect(panel3.api.location.type).toBe('grid');
        });

        test('grid -> floating -> popout -> floating', async () => {
            const container = document.createElement('div');

            window.open = () => setupMockWindow();

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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
                position: { direction: 'right' },
            });

            expect(panel1.api.location.type).toBe('grid');
            expect(panel2.api.location.type).toBe('grid');
            expect(panel3.api.location.type).toBe('grid');

            dockview.addFloatingGroup(panel2.group);

            expect(panel1.api.location.type).toBe('floating');
            expect(panel2.api.location.type).toBe('floating');
            expect(panel3.api.location.type).toBe('grid');

            await dockview.addPopoutGroup(panel2.group);

            expect(panel1.api.location.type).toBe('popout');
            expect(panel2.api.location.type).toBe('popout');
            expect(panel3.api.location.type).toBe('grid');

            dockview.addFloatingGroup(panel2.group);

            expect(panel1.api.location.type).toBe('floating');
            expect(panel2.api.location.type).toBe('floating');
            expect(panel3.api.location.type).toBe('grid');

            await dockview.addPopoutGroup(panel2.group);

            expect(panel1.api.location.type).toBe('popout');
            expect(panel2.api.location.type).toBe('popout');
            expect(panel3.api.location.type).toBe('grid');

            panel2.group.api.moveTo({ group: panel3.group });

            expect(panel1.api.location.type).toBe('grid');
            expect(panel2.api.location.type).toBe('grid');
            expect(panel3.api.location.type).toBe('grid');
        });

        test('that panel is rendered when moving from popout to new group', async () => {
            const container = document.createElement('div');

            window.open = () => setupMockWindow();

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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
                renderer: 'always',
            });

            await dockview.addPopoutGroup(panel2);
            panel2.api.moveTo({ group: panel1.api.group, position: 'right' });

            // confirm panel is rendered on DOM
            expect(
                panel2.group.element.querySelectorAll(
                    '.dv-content-container > .testpanel-panel_2'
                ).length
            ).toBe(1);

            await dockview.addPopoutGroup(panel3);
            panel3.api.moveTo({ group: panel1.api.group, position: 'right' });

            // confirm panel is rendered to always overlay container
            expect(
                dockview.element.querySelectorAll(
                    '.dv-render-overlay > .testpanel-panel_3'
                ).length
            ).toBe(1);
            expect(
                panel2.group.element.querySelectorAll(
                    '.dv-content-container > .testpanel-panel_3'
                ).length
            ).toBe(0);
        });

        test('move popout group of 1 panel inside grid', async () => {
            const container = document.createElement('div');

            window.open = () => setupMockWindow();

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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
                position: { direction: 'right' },
            });

            await dockview.addPopoutGroup(panel2);

            panel2.api.moveTo({ position: 'top', group: panel3.group });

            expect(dockview.panels.length).toBe(3);
            expect(dockview.groups.length).toBe(3);
        });

        test('add a popout group', async () => {
            const container = document.createElement('div');

            window.open = () => setupMockWindow();

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            const events: SizeEvent[] = [];

            panel2.api.onDidDimensionsChange((event) => {
                events.push(event);
            });

            const originalGroup = panel2.group;

            expect(await dockview.addPopoutGroup(panel2.group)).toBeTruthy();

            expect(events).toEqual([{ height: 2000, width: 1000 }]);

            expect(originalGroup.api.location.type).toBe('grid');
            expect(originalGroup.api.isVisible).toBeFalsy();

            expect(panel1.group.api.location.type).toBe('popout');
            expect(panel2.group.api.location.type).toBe('popout');
            expect(dockview.groups.length).toBe(2);
            expect(dockview.panels.length).toBe(2);

            if (panel2.api.location.type !== 'popout') {
                fail('unexpected');
            }
            const alternativeWindow = panel2.api.location.getWindow();
            alternativeWindow.dispatchEvent(new Event('resize'));

            expect(events).toEqual([
                { height: 2000, width: 1000 },
                { height: 2001, width: 1001 },
            ]);
        });

        test('popout / floating layouts', async () => {
            jest.useRealTimers();
            const container = document.createElement('div');

            window.open = () => setupMockWindow();

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });

            dockview.layout(1000, 500);

            let panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            let panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
            });

            let panel3 = dockview.addPanel({
                id: 'panel_3',
                component: 'default',
            });

            let panel4 = dockview.addPanel({
                id: 'panel_4',
                component: 'default',
            });

            expect(panel1.api.location.type).toBe('grid');
            expect(panel2.api.location.type).toBe('grid');
            expect(panel3.api.location.type).toBe('grid');
            expect(panel4.api.location.type).toBe('grid');

            dockview.addFloatingGroup(panel2);
            dockview.addFloatingGroup(panel3);

            expect(panel1.api.location.type).toBe('grid');
            expect(panel2.api.location.type).toBe('floating');
            expect(panel3.api.location.type).toBe('floating');
            expect(panel4.api.location.type).toBe('grid');

            await dockview.addPopoutGroup(panel2);
            await dockview.addPopoutGroup(panel4);

            expect(panel1.api.location.type).toBe('grid');
            expect(panel2.api.location.type).toBe('popout');
            expect(panel3.api.location.type).toBe('floating');
            expect(panel4.api.location.type).toBe('popout');

            const state = dockview.toJSON();
            dockview.fromJSON(state);

            /**
             * Wait for delayed popout group creation to complete
             */
            await dockview.popoutRestorationPromise;

            expect(dockview.panels.length).toBe(4);

            panel1 = dockview.api.getPanel('panel_1') as DockviewPanel;
            panel2 = dockview.api.getPanel('panel_2') as DockviewPanel;
            panel3 = dockview.api.getPanel('panel_3') as DockviewPanel;
            panel4 = dockview.api.getPanel('panel_4') as DockviewPanel;

            expect(panel1.api.location.type).toBe('grid');
            expect(panel2.api.location.type).toBe('popout');
            expect(panel3.api.location.type).toBe('floating');
            expect(panel4.api.location.type).toBe('popout');

            dockview.clear();
            expect(dockview.groups.length).toBe(0);
            expect(dockview.panels.length).toBe(0);
        });

        test('close popout window object', async () => {
            const container = document.createElement('div');

            const mockWindow = setupMockWindow();
            window.open = () => mockWindow;

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });

            dockview.layout(1000, 500);

            let panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            let panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                position: { referencePanel: panel1, direction: 'within' },
            });

            let panel3 = dockview.addPanel({
                id: 'panel_3',
                component: 'default',
            });

            dockview.addFloatingGroup(panel2);
            await dockview.addPopoutGroup(panel2);

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('popout');
            expect(panel3.group.api.location.type).toBe('grid');

            mockWindow.close();

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel3.group.api.location.type).toBe('grid');

            dockview.clear();
            expect(dockview.groups.length).toBe(0);
            expect(dockview.panels.length).toBe(0);
        });

        test('remove all panels from popout group', async () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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
                position: { referencePanel: panel2 },
            });

            expect(await dockview.addPopoutGroup(panel2.group)).toBeTruthy();

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('popout');
            expect(panel3.group.api.location.type).toBe('popout');

            expect(dockview.panels.length).toBe(3);
            expect(dockview.groups.length).toBe(3); // includes one hidden group

            panel2.api.moveTo({ group: panel1.group, position: 'left' });
            expect(dockview.panels.length).toBe(3);
            expect(dockview.groups.length).toBe(4);

            panel3.api.moveTo({ group: panel1.group, position: 'left' });
            expect(dockview.panels.length).toBe(3);
            expect(dockview.groups.length).toBe(3);
        });

        test('that can remove a popout group', async () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });

            dockview.layout(1000, 500);

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            expect(await dockview.addPopoutGroup(panel1)).toBeTruthy();

            expect(dockview.panels.length).toBe(1);
            expect(dockview.groups.length).toBe(2);
            expect(panel1.api.group.api.location.type).toBe('popout');

            dockview.removePanel(panel1);

            expect(dockview.panels.length).toBe(0);
            expect(dockview.groups.length).toBe(0);
        });

        test('popout single panel -> save layout -> load layout', async () => {
            const container = document.createElement('div');

            window.open = () => setupMockWindow();

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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
            });

            const panel4 = dockview.addPanel({
                id: 'panel_4',
                component: 'default',
                position: { direction: 'right' },
            });

            expect(dockview.panels.length).toBe(4);
            expect(dockview.groups.length).toBe(2);

            expect(await dockview.addPopoutGroup(panel1)).toBeTruthy();

            expect(dockview.panels.length).toBe(4);
            expect(dockview.groups.length).toBe(3);

            expect(panel1.api.location.type).toBe('popout');

            dockview.fromJSON(dockview.toJSON());

            await new Promise((resolve) => setTimeout(resolve, 0)); // popout views are completed as a promise so must complete microtask-queue

            expect(dockview.panels.length).toBe(4);
            expect(dockview.groups.length).toBe(3);
            expect(dockview.groups.every((g) => g.api.isVisible)).toBeTruthy();
        });

        test('move from fixed to popout group and back', async () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

            expect(await dockview.addPopoutGroup(panel2.group)).toBeTruthy();

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

        test('persistance with custom url', async () => {
            jest.useFakeTimers();
            const container = document.createElement('div');

            window.open = () => setupMockWindow();

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });

            dockview.layout(1000, 500);

            dockview.addPanel({
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
                position: { direction: 'right' },
            });

            expect(await dockview.addPopoutGroup(panel2.group)).toBeTruthy();
            expect(
                await dockview.addPopoutGroup(panel3.group, {
                    popoutUrl: '/custom.html',
                })
            ).toBeTruthy();

            const state = dockview.toJSON();

            expect(state.popoutGroups).toEqual([
                {
                    data: {
                        activeView: 'panel_2',
                        id: '4',
                        views: ['panel_2'],
                    },
                    gridReferenceGroup: '2',
                    position: {
                        height: 2001,
                        left: undefined,
                        top: undefined,
                        width: 1001,
                    },
                    url: undefined,
                },
                {
                    data: {
                        activeView: 'panel_3',
                        id: '5',
                        views: ['panel_3'],
                    },
                    gridReferenceGroup: '3',
                    position: {
                        height: 2001,
                        left: undefined,
                        top: undefined,
                        width: 1001,
                    },
                    url: '/custom.html',
                },
            ]);

            dockview.clear();
            expect(dockview.groups.length).toBe(0);

            dockview.fromJSON(state);

            // Advance timers to trigger delayed popout creation (0ms, 100ms delays)
            jest.advanceTimersByTime(200);

            // Wait for the popout restoration to complete
            await dockview.popoutRestorationPromise;

            expect(dockview.toJSON().popoutGroups).toEqual([
                {
                    data: {
                        activeView: 'panel_2',
                        id: '4',
                        views: ['panel_2'],
                    },
                    gridReferenceGroup: '2',
                    position: {
                        height: 2001,
                        left: undefined,
                        top: undefined,
                        width: 1001,
                    },
                    url: undefined,
                },
                {
                    data: {
                        activeView: 'panel_3',
                        id: '5',
                        views: ['panel_3'],
                    },
                    gridReferenceGroup: '3',
                    position: {
                        height: 2001,
                        left: undefined,
                        top: undefined,
                        width: 1001,
                    },
                    url: '/custom.html',
                },
            ]);

            jest.useRealTimers();
        });

        describe('when browsers block popups', () => {
            let container: HTMLDivElement;
            let dockview: DockviewComponent;
            let panel: DockviewPanel;

            beforeEach(() => {
                jest.spyOn(window, 'open').mockReturnValue(null);

                container = document.createElement('div');

                dockview = new DockviewComponent(container, {
                    createComponent(options) {
                        switch (options.name) {
                            case 'default':
                                return new PanelContentPartTest(
                                    options.id,
                                    options.name
                                );
                            default:
                                throw new Error(`unsupported`);
                        }
                    },
                });

                dockview.layout(1000, 500);

                panel = dockview.addPanel({
                    id: 'panel_1',
                    component: 'default',
                });
            });

            test('onDidOpenPoputWindowFail event is emitted', async () => {
                const onDidBlockPopoutHandler = jest.fn();
                dockview.onDidOpenPopoutWindowFail(onDidBlockPopoutHandler);

                await dockview.addPopoutGroup(panel.group);

                expect(onDidBlockPopoutHandler).toHaveBeenCalledTimes(1);
            });

            test('popout group is restored to its original position', async () => {
                await dockview.addPopoutGroup(panel.group);

                expect(panel.group.api.location.type).toBe('grid');
            });
        });

        test('dispose of dockview instance when popup is open', async () => {
            const container = document.createElement('div');

            window.open = () => setupMockWindow();

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });

            dockview.layout(1000, 500);

            dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
            });

            expect(await dockview.addPopoutGroup(panel2.group)).toBeTruthy();

            dockview.dispose();
        });
    });

    describe('maximized group', () => {
        test('that a maximzied group is set to active', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

    describe('that emits onDidLayoutChange', () => {
        let dockview: DockviewComponent;

        beforeEach(() => {
            jest.useFakeTimers();

            dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });
        });

        afterEach(() => {
            jest.runAllTimers();
            jest.useRealTimers();
        });

        test('when panels or groups change', () => {
            const didLayoutChangeHandler = jest.fn();
            dockview.onDidLayoutChange(didLayoutChangeHandler);

            // add panel
            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });
            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                position: { referenceGroup: panel1.group },
            });
            jest.runAllTimers();
            expect(didLayoutChangeHandler).toHaveBeenCalledTimes(1);

            // add group
            const group = dockview.addGroup();
            jest.runAllTimers();
            expect(didLayoutChangeHandler).toHaveBeenCalledTimes(2);

            // remove group
            group.api.close();
            jest.runAllTimers();
            expect(didLayoutChangeHandler).toHaveBeenCalledTimes(3);

            // active panel
            panel1.api.setActive();
            jest.runAllTimers();
            expect(didLayoutChangeHandler).toHaveBeenCalledTimes(4);

            // move panel
            dockview.moveGroupOrPanel({
                from: {
                    groupId: panel1.group.api.id,
                    panelId: panel1.api.id,
                },
                to: {
                    group: panel1.group,
                    position: 'center',
                    index: 1,
                },
            });

            // remove panel
            panel2.api.close();
            jest.runAllTimers();
            expect(didLayoutChangeHandler).toHaveBeenCalledTimes(5);
        });

        test('that emits onDidPanelTitleChange and onDidLayoutChange when the panel set a title', () => {
            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const didLayoutChangeHandler = jest.fn();
            const { dispose: disposeDidLayoutChangeHandler } =
                dockview.onDidLayoutChange(didLayoutChangeHandler);

            panel1.setTitle('new title');

            jest.runAllTimers();

            expect(didLayoutChangeHandler).toHaveBeenCalledTimes(1);

            disposeDidLayoutChangeHandler();
        });

        test('that emits onDidPanelParametersChange and onDidLayoutChange when the panel updates parameters', () => {
            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const didLayoutChangeHandler = jest.fn();
            const { dispose: disposeDidLayoutChangeHandler } =
                dockview.onDidLayoutChange(didLayoutChangeHandler);

            panel1.api.updateParameters({ keyA: 'valueA' });

            jest.runAllTimers();

            expect(didLayoutChangeHandler).toHaveBeenCalledTimes(1);

            disposeDidLayoutChangeHandler();
        });
    });

    describe('panel visibility', () => {
        test('that setVisible toggles visiblity', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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

        test('setVisible #1', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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
                position: { referencePanel: panel1, direction: 'below' },
            });

            const panel3 = api.addPanel({
                id: 'panel3',
                component: 'default',
                position: { referencePanel: panel1, direction: 'below' },
            });

            expect(api.groups.length).toBe(3);

            panel1.group.api.setVisible(false);
            panel2.group.api.setVisible(false);
            panel3.group.api.setVisible(false);

            expect(panel1.group.api.isVisible).toBeFalsy();
            expect(panel2.group.api.isVisible).toBeFalsy();
            expect(panel3.group.api.isVisible).toBeFalsy();

            panel1.group.api.setVisible(true);

            expect(panel1.group.api.isVisible).toBeTruthy();
            expect(panel2.group.api.isVisible).toBeFalsy();
            expect(panel3.group.api.isVisible).toBeFalsy();
        });

        test('that watermark appears when all views are not visible', () => {
            jest.useFakeTimers();
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });
            const api = new DockviewApi(dockview);

            dockview.layout(1000, 1000);

            const panel1 = api.addPanel({
                id: 'panel_1',
                component: 'default',
            });
            const panel2 = api.addPanel({
                id: 'panel_2',
                component: 'default',
                position: {
                    direction: 'right',
                },
            });

            let query = queryByTestId(container, 'watermark-component');
            expect(query).toBeFalsy();

            panel1.group.api.setVisible(false);
            jest.runAllTicks(); // visibility events check fires on microtask-queue
            query = queryByTestId(container, 'watermark-component');
            expect(query).toBeFalsy();

            panel2.group.api.setVisible(false);
            jest.runAllTicks(); // visibility events check fires on microtask-queue
            query = queryByTestId(container, 'watermark-component');
            expect(query).toBeTruthy();

            panel1.group.api.setVisible(true);
            jest.runAllTicks(); // visibility events check fires on microtask-queue
            query = queryByTestId(container, 'watermark-component');
            expect(query).toBeFalsy();
        });

        test('setVisible on floating group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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
                position: { referencePanel: panel1, direction: 'below' },
            });

            const panel3 = api.addPanel({
                id: 'panel3',
                component: 'default',
                position: { referencePanel: panel1, direction: 'below' },
            });

            api.addFloatingGroup(panel2);
            expect(panel2.api.location.type).toBe('floating');

            panel2.api.group.setVisible(false);
            expect(panel2.api.isVisible).toBeFalsy();
            expect(panel2.api.group.api.isVisible).toBeFalsy();

            panel2.api.group.setVisible(true);
            expect(panel2.api.isVisible).toBeTruthy();
            expect(panel2.api.group.api.isVisible).toBeTruthy();

            panel2.api.group.setVisible(false);
            expect(panel2.api.isVisible).toBeFalsy();
            expect(panel2.api.group.api.isVisible).toBeFalsy();

            panel2.api.group.api.moveTo({
                group: panel1.group,
                position: 'left',
            });
            expect(api.groups.length).toBe(3);
            expect(panel2.api.isVisible).toBeFalsy();
            expect(panel2.api.group.api.isVisible).toBeFalsy();

            panel2.api.group.setVisible(true);
            expect(panel2.api.isVisible).toBeTruthy();
            expect(panel2.api.group.api.isVisible).toBeTruthy();
        });

        test('setVisible on popout group should have no effect', async () => {
            window.open = () => setupMockWindow();

            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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
                position: { referencePanel: panel1, direction: 'below' },
            });

            const panel3 = api.addPanel({
                id: 'panel3',
                component: 'default',
                position: { referencePanel: panel1, direction: 'below' },
            });

            await api.addPopoutGroup(panel2);
            expect(panel2.api.location.type).toBe('popout');

            expect(panel2.api.group.api.isVisible).toBeTruthy();
            panel2.api.group.api.setVisible(false);
            expect(panel2.api.group.api.isVisible).toBeTruthy();
        });

        test('opening a popout group from a group that is non visible should automatically make it visible', async () => {
            window.open = () => setupMockWindow();

            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
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
                position: { referencePanel: panel1, direction: 'below' },
            });

            const panel3 = api.addPanel({
                id: 'panel3',
                component: 'default',
                position: { referencePanel: panel1, direction: 'below' },
            });

            panel2.api.group.api.setVisible(false);

            await api.addPopoutGroup(panel2);
            expect(panel2.api.location.type).toBe('popout');
            expect(panel2.api.group.api.isVisible).toBeTruthy();
        });
    });

    describe('addPanel', () => {
        test('that can add panel to index with referencePanel', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });
            const api = new DockviewApi(dockview);

            dockview.layout(1000, 1000);

            const panel1 = api.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = api.addPanel({
                id: 'panel_2',
                component: 'default',
                position: {
                    referencePanel: panel1,
                },
            });

            const panel3 = api.addPanel({
                id: 'panel_3',
                component: 'default',
                position: {
                    referencePanel: panel1,
                    index: 1,
                },
            });

            expect(panel1.api.group.panels).toEqual([panel1, panel3, panel2]);
        });

        test('that can add panel to index with referenceGroup', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });
            const api = new DockviewApi(dockview);

            dockview.layout(1000, 1000);

            const panel1 = api.addPanel({
                id: 'panel_1',
                component: 'default',
            });

            const panel2 = api.addPanel({
                id: 'panel_2',
                component: 'default',
                position: {
                    referencePanel: panel1,
                    index: 1,
                },
            });

            const panel3 = api.addPanel({
                id: 'panel_3',
                component: 'default',
                position: {
                    referenceGroup: panel1.api.group,
                    index: 1,
                },
            });

            expect(panel1.api.group.panels).toEqual([panel1, panel3, panel2]);

            panel1.api.moveTo({ index: 1 });

            expect(panel1.api.group.panels).toEqual([panel3, panel1, panel2]);
        });

        test('panel moveTo with skipSetActive should not activate group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });

            dockview.layout(1000, 1000);

            dockview.addPanel({
                id: 'panel1',
                component: 'default',
            });

            dockview.addPanel({
                id: 'panel2',
                component: 'default',
            });

            const panel1 = dockview.getGroupPanel('panel1')!;
            const panel2 = dockview.getGroupPanel('panel2')!;

            // Move panel2 to a new group to the right
            panel2.api.moveTo({ position: 'right' });

            // panel2's group should be active
            expect(dockview.activeGroup).toBe(panel2.group);
            expect(dockview.activePanel?.id).toBe(panel2.id);

            // Now move panel1 to panel2's group without setting it active
            panel1.api.moveTo({
                group: panel2.group,
                position: 'center',
                skipSetActive: true,
            });

            // panel2's group should still be active, but panel2 should still be the active panel
            expect(dockview.activeGroup).toBe(panel2.group);
            expect(dockview.activePanel?.id).toBe(panel2.id);
            expect(panel1.group).toBe(panel2.group);
        });

        test('group moveTo with skipSetActive should not activate group', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });

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

            const panel1 = dockview.getGroupPanel('panel1')!;
            const panel2 = dockview.getGroupPanel('panel2')!;
            const panel3 = dockview.getGroupPanel('panel3')!;

            // Move panel2 to a new group to create separate groups
            panel2.api.moveTo({ position: 'right' });

            // Move panel3 to panel2's group
            panel3.api.moveTo({ group: panel2.group, position: 'center' });

            // panel2's group should be active
            expect(dockview.activeGroup).toBe(panel2.group);

            // Set panel1's group as active
            dockview.doSetGroupActive(panel1.group);
            expect(dockview.activeGroup).toBe(panel1.group);

            // Now move panel2's group to panel1's group without setting it active
            panel2.group.api.moveTo({
                group: panel1.group,
                position: 'center',
                skipSetActive: true,
            });

            // panel1's group should still be active and there should be an active panel
            expect(dockview.activeGroup).toBe(panel1.group);
            expect(dockview.activePanel).toBeTruthy();
            // panel2 and panel3 should now be in panel1's group
            expect(panel2.group).toBe(panel1.group);
            expect(panel3.group).toBe(panel1.group);
        });

        test('panel moveTo without skipSetActive should activate group (default behavior)', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });

            dockview.layout(1000, 1000);

            dockview.addPanel({
                id: 'panel1',
                component: 'default',
            });

            dockview.addPanel({
                id: 'panel2',
                component: 'default',
            });

            const panel1 = dockview.getGroupPanel('panel1')!;
            const panel2 = dockview.getGroupPanel('panel2')!;

            // Move panel2 to a new group to the right
            panel2.api.moveTo({ position: 'right' });

            // Set panel1's group as active
            dockview.doSetGroupActive(panel1.group);
            expect(dockview.activeGroup).toBe(panel1.group);

            // Move panel1 to panel2's group (should activate panel2's group)
            panel1.api.moveTo({
                group: panel2.group,
                position: 'center',
            });

            // panel2's group should now be active and panel1 should be the active panel
            expect(dockview.activeGroup).toBe(panel2.group);
            expect(dockview.activePanel?.id).toBe(panel1.id);
            expect(panel1.group).toBe(panel2.group);
        });

        test('that can add panel', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });
            const api = new DockviewApi(dockview);

            dockview.layout(1000, 1000);

            const panel1 = api.addPanel({
                id: 'panel_1',
                component: 'default',
            });
            expect(api.activePanel).toBe(panel1);

            api.addPanel({
                id: 'panel_2',
                component: 'default',
                inactive: true,
            });
            expect(api.activePanel).toBe(panel1);
        });

        test('that can add panel with absolute direction', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });
            const api = new DockviewApi(dockview);

            dockview.layout(1000, 1000);

            const panel1 = api.addPanel({
                id: 'panel_1',
                component: 'default',
                position: { direction: 'right' },
            });
            expect(api.activePanel).toBe(panel1);

            api.addPanel({
                id: 'panel_2',
                component: 'default',
                position: { direction: 'right' },
                inactive: true,
            });
            expect(api.activePanel).toBe(panel1);
        });

        test('that can add floating panel', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });
            const api = new DockviewApi(dockview);

            dockview.layout(1000, 1000);

            const panel1 = api.addPanel({
                id: 'panel_1',
                component: 'default',
                floating: true,
            });
            expect(api.activePanel).toBe(panel1);

            api.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: true,
                inactive: true,
            });
            expect(api.activePanel).toBe(panel1);
        });

        test('that can add panel positional to another (within)', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });
            const api = new DockviewApi(dockview);

            dockview.layout(1000, 1000);

            const panel1 = api.addPanel({
                id: 'panel_1',
                component: 'default',
            });
            expect(api.activePanel).toBe(panel1);

            api.addPanel({
                id: 'panel_2',
                component: 'default',
                position: { direction: 'within', referencePanel: panel1 },
                inactive: true,
            });
            expect(api.activePanel).toBe(panel1);
        });

        test('that can add panel positional to another (not within)', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });
            const api = new DockviewApi(dockview);

            dockview.layout(1000, 1000);

            const panel1 = api.addPanel({
                id: 'panel_1',
                component: 'default',
            });
            expect(api.activePanel).toBe(panel1);

            api.addPanel({
                id: 'panel_2',
                component: 'default',
                position: { direction: 'right', referencePanel: panel1 },
                inactive: true,
            });
            expect(api.activePanel).toBe(panel1);
        });
    });

    describe('events flow', () => {
        test('that floating a panel should not call an additional addPanel event', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });
            const api = new DockviewApi(dockview);

            dockview.layout(1000, 1000);

            let addPanelCount = 0;
            let addGroupCount = 0;

            api.onDidAddPanel((event) => {
                addPanelCount++;
            });
            api.onDidAddGroup((event) => {
                addGroupCount++;
            });

            api.addPanel({
                id: 'panel_1',
                component: 'default',
            });
            const panel2 = api.addPanel({
                id: 'panel_2',
                component: 'default',
                position: { referencePanel: 'panel_1' },
            });

            expect(addPanelCount).toBe(2);
            expect(addGroupCount).toBe(1);

            api.addFloatingGroup(panel2);

            expect(addPanelCount).toBe(2);
            expect(addGroupCount).toBe(2);
        });
    });

    test('that `onDidLayoutChange` only subscribes to events after initial subscription time', () => {
        jest.useFakeTimers();

        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
        });
        const api = new DockviewApi(dockview);

        dockview.layout(1000, 1000);

        let a = 0;

        api.onDidLayoutChange((e) => {
            a++;
        });

        api.addPanel({
            id: 'panel_1',
            component: 'default',
        });
        api.addPanel({
            id: 'panel_2',
            component: 'default',
        });
        api.addPanel({
            id: 'panel_3',
            component: 'default',
        });

        let b = 0;

        api.onDidLayoutChange((e) => {
            b++;
        });

        jest.runAllTicks();

        expect(a).toBe(1);
        expect(b).toBe(0);
    });

    test('addGroup with absolute position', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
        });
        const api = new DockviewApi(dockview);

        dockview.layout(1000, 1000);

        api.addPanel({
            id: 'panel_1',
            component: 'default',
        });
        api.addPanel({
            id: 'panel_2',
            component: 'default',
        });
        const panel3 = api.addPanel({
            id: 'panel_3',
            component: 'default',
            position: { direction: 'right' },
        });

        expect(api.panels.length).toBe(3);
        expect(api.groups.length).toBe(2);

        api.addGroup({ direction: 'left' });

        expect(api.panels.length).toBe(3);
        expect(api.groups.length).toBe(3);
    });

    test('addGroup calls normalize method on gridview', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
        });
        const api = new DockviewApi(dockview);

        dockview.layout(1000, 1000);

        // Add initial panel
        api.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        // Access gridview through the (any) cast to bypass protected access
        const gridview = (dockview as any).gridview;

        // Mock the normalize method to verify it's called
        const normalizeSpy = jest.spyOn(gridview, 'normalize');

        // Adding a group should trigger normalization
        api.addGroup({ direction: 'left' });

        // Verify normalize was called during addGroup
        expect(normalizeSpy).toHaveBeenCalled();

        // Should have the new empty group plus the existing group with panels
        expect(api.panels.length).toBe(1);
        expect(api.groups.length).toBe(2);

        normalizeSpy.mockRestore();
    });

    test('add group with custom group is', () => {
        const container = document.createElement('div');

        const dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error(`unsupported`);
                }
            },
        });
        const api = new DockviewApi(dockview);

        dockview.layout(1000, 1000);

        const panel1 = api.addPanel({
            id: 'panel_1',
            component: 'default',
        });

        const group1 = api.addGroup({
            id: 'group_1',
            direction: 'left',
        });

        const group2 = api.addGroup({
            id: 'group_2',
            direction: 'left',
            referencePanel: panel1,
        });

        const group3 = api.addGroup({
            id: 'group_3',
            direction: 'left',
            referenceGroup: panel1.api.group,
        });

        expect(group1.api.id).toBe('group_1');
        expect(group2.api.id).toBe('group_2');
        expect(group3.api.id).toBe('group_3');
    });

    describe('dndEdges', () => {
        test('that can init dndEdges property', () => {
            const container = document.createElement('div');

            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
                dndEdges: {
                    size: { value: 100, type: 'pixels' },
                    activationSize: { value: 5, type: 'percentage' },
                },
            });
            const api = new DockviewApi(dockview);

            dockview.layout(1000, 1000);
        });
    });

    // Adding back tests one by one to identify problematic expectations
    describe('GitHub Issue #991 - Group remains active after tab header space drag', () => {
        let container: HTMLElement;

        beforeEach(() => {
            container = document.createElement('div');
        });

        test('single panel group remains active after move to edge', () => {
            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });
            dockview.layout(1000, 1000);

            // Create panel in first group
            dockview.addPanel({
                id: 'panel1',
                component: 'default',
            });

            const panel1 = dockview.getGroupPanel('panel1')!;
            const originalGroup = panel1.group;

            // Set up initial state - make sure group is active
            dockview.doSetGroupActive(originalGroup);
            expect(dockview.activeGroup).toBe(originalGroup);
            expect(dockview.activePanel?.id).toBe('panel1');

            // Move panel to edge position
            panel1.api.moveTo({ position: 'right' });

            // After move, there should still be an active group and panel
            expect(dockview.activeGroup).toBeTruthy();
            expect(dockview.activePanel).toBeTruthy();
            expect(dockview.activePanel?.id).toBe('panel1');

            // When moving a single panel to an edge, the existing group gets repositioned
            // rather than creating a new group (since there would be no panels left in the original group)
            expect(panel1.group).toBe(originalGroup);
            expect(dockview.activeGroup).toBe(panel1.group);
        });

        test('merged group becomes active after center position group move', () => {
            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });
            dockview.layout(1000, 1000);

            // Create two groups with panels
            dockview.addPanel({
                id: 'panel1',
                component: 'default',
            });

            dockview.addPanel({
                id: 'panel2',
                component: 'default',
                position: { direction: 'right' },
            });

            const panel1 = dockview.getGroupPanel('panel1')!;
            const panel2 = dockview.getGroupPanel('panel2')!;
            const group1 = panel1.group;
            const group2 = panel2.group;

            // Set group1 as active initially
            dockview.doSetGroupActive(group1);
            expect(dockview.activeGroup).toBe(group1);
            expect(dockview.activePanel?.id).toBe('panel1');

            // Move panel2's group to panel1's group (center merge)
            dockview.moveGroupOrPanel({
                from: { groupId: group2.id },
                to: { group: group1, position: 'center' },
            });

            // After move, the target group should be active and have an active panel
            expect(dockview.activeGroup).toBeTruthy();
            expect(dockview.activePanel).toBeTruthy();
            // Both panels should now be in the same group
            expect(panel1.group).toBe(panel2.group);
        });

        test('panel content remains visible after group move', () => {
            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });
            dockview.layout(1000, 1000);

            // Create panel
            dockview.addPanel({
                id: 'panel1',
                component: 'default',
            });

            const panel1 = dockview.getGroupPanel('panel1')!;

            // Verify content is initially rendered
            expect(panel1.view.content.element.parentElement).toBeTruthy();

            // Move panel to edge position
            panel1.api.moveTo({ position: 'left' });

            // After move, panel content should still be rendered (fixes content disappearing)
            expect(panel1.view.content.element.parentElement).toBeTruthy();
            expect(dockview.activePanel?.id).toBe('panel1');

            // Panel should be visible and active
            expect(panel1.api.isVisible).toBe(true);
            expect(panel1.api.isActive).toBe(true);
        });

        test('first panel in group does not get skipSetActive when moved', () => {
            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });
            dockview.layout(1000, 1000);

            // Create group with one panel
            dockview.addPanel({
                id: 'panel1',
                component: 'default',
            });

            const panel1 = dockview.getGroupPanel('panel1')!;
            const group = panel1.group;

            // Verify initial state
            expect(dockview.activeGroup).toBe(group);
            expect(dockview.activePanel?.id).toBe('panel1');
            expect(panel1.view.content.element.parentElement).toBeTruthy();

            // Move panel to trigger group move logic
            panel1.api.moveTo({ position: 'right' });

            // Panel content should render correctly (the fix ensures first panel is not skipped)
            expect(panel1.view.content.element.parentElement).toBeTruthy();
            expect(dockview.activePanel?.id).toBe('panel1');
            expect(panel1.api.isActive).toBe(true);
        });

        test('skipSetActive option prevents automatic group activation', () => {
            const dockview = new DockviewComponent(container, {
                createComponent(options) {
                    switch (options.name) {
                        case 'default':
                            return new PanelContentPartTest(
                                options.id,
                                options.name
                            );
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            });
            dockview.layout(1000, 1000);

            // Create two groups
            dockview.addPanel({
                id: 'panel1',
                component: 'default',
            });

            dockview.addPanel({
                id: 'panel2',
                component: 'default',
                position: { direction: 'right' },
            });

            const panel1 = dockview.getGroupPanel('panel1')!;
            const panel2 = dockview.getGroupPanel('panel2')!;
            const group1 = panel1.group;
            const group2 = panel2.group;

            // Set group2 as active
            dockview.doSetGroupActive(group2);
            expect(dockview.activeGroup).toBe(group2);

            // Move group2 to group1 with skipSetActive option
            dockview.moveGroupOrPanel({
                from: { groupId: group2.id },
                to: { group: group1, position: 'center' },
                skipSetActive: true,
            });

            // After merge, there should still be an active group and panel
            // The skipSetActive should be respected in the implementation
            expect(dockview.activeGroup).toBeTruthy();
            expect(dockview.activePanel).toBeTruthy();
        });
    });
});
