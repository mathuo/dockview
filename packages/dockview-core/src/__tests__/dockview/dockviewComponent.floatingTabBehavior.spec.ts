import { fireEvent } from '@testing-library/dom';
import { LocalSelectionTransfer, PanelTransfer } from '../../dnd/dataTransfer';
import { DockviewComponent } from '../../dockview/dockviewComponent';
import type {
    GroupPanelPartInitParameters,
    IContentRenderer,
} from '../../dockview/types';
import { Emitter } from '../../events';
import type { PanelUpdateEvent } from '../../panel/types';
import {
    createOffsetDragOverEvent,
    mockGetBoundingClientRect,
} from '../__test_utils__/utils';

class PanelContentPartTest implements IContentRenderer {
    element: HTMLElement = document.createElement('div');

    readonly _onDidDispose = new Emitter<void>();
    readonly onDidDispose = this._onDidDispose.event;

    isDisposed: boolean = false;

    constructor(
        public readonly id: string,
        public readonly component: string
    ) {
        this.element.classList.add(`testpanel-${id}`);
    }

    init(parameters: GroupPanelPartInitParameters): void {
        void parameters;
    }

    layout(width: number, height: number): void {
        void width;
        void height;
    }

    update(event: PanelUpdateEvent): void {
        void event;
    }

    focus(): void {
        //noop
    }

    toJSON(): object {
        return {};
    }

    dispose(): void {
        this.isDisposed = true;
        this._onDidDispose.fire();
    }
}

function createDockview(options?: {
    floatingTabBehavior?: 'default' | 'browser';
}) {
    const container = document.createElement('div');
    const dockview = new DockviewComponent(container, {
        ...options,
        createComponent(opts) {
            switch (opts.name) {
                case 'default':
                    return new PanelContentPartTest(opts.id, opts.name);
                default:
                    throw new Error(`unsupported`);
            }
        },
    });
    dockview.layout(1000, 500);
    return { container, dockview };
}

/**
 * Mock offsetWidth/offsetHeight/getBoundingClientRect on dockview.element
 * (the element _rootDropTarget listens on — NOT the outer container).
 */
function setupRootDnd(
    dockview: DockviewComponent,
    dims: { width: number; height: number }
): HTMLElement {
    const el = dockview.element;
    jest.spyOn(el, 'offsetWidth', 'get').mockReturnValue(dims.width);
    jest.spyOn(el, 'offsetHeight', 'get').mockReturnValue(dims.height);
    jest.spyOn(el, 'getBoundingClientRect').mockReturnValue(
        mockGetBoundingClientRect({ left: 0, top: 0, ...dims })
    );
    return el;
}

/**
 * Simulate a full DnD drop on an element: dragEnter → dragOver → drop.
 */
function fireDrop(
    el: HTMLElement,
    dragCoords: { clientX: number; clientY: number },
    dropCoords?: { clientX: number; clientY: number }
): void {
    fireEvent.dragEnter(el);
    fireEvent(el, createOffsetDragOverEvent(dragCoords));

    const coords = dropCoords ?? dragCoords;
    const dropEvent = new Event('drop', {
        bubbles: true,
        cancelable: true,
    });
    Object.defineProperty(dropEvent, 'clientX', {
        get: () => coords.clientX,
    });
    Object.defineProperty(dropEvent, 'clientY', {
        get: () => coords.clientY,
    });
    fireEvent(el, dropEvent);
}

/**
 * Find the DockviewFloatingGroupPanel for a given group, or throw.
 */
function findFloatingGroup(dockview: DockviewComponent, group: { id: string }) {
    const fg = dockview.floatingGroups.find((fg) => fg.group === group);
    if (!fg) {
        throw new Error(`No floating group found for group ${group.id}`);
    }
    return fg;
}

/**
 * Query a child element by selector, throwing if not found.
 */
function queryElement(parent: HTMLElement, selector: string): HTMLElement {
    const el = parent.querySelector(selector);
    if (!(el instanceof HTMLElement)) {
        throw new Error(
            `Expected element matching "${selector}" inside <${parent.tagName}.${parent.className}>`
        );
    }
    return el;
}

describe('floatingTabBehavior', () => {
    afterEach(() => {
        // clear any leftover transfer data
        LocalSelectionTransfer.getInstance<PanelTransfer>().clearData(
            PanelTransfer.prototype
        );
    });

    describe('default behavior (option omitted)', () => {
        test('moveGroupOrPanel from floating to grid docks to grid', () => {
            const { dockview } = createDockview();

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
                floating: { x: 0, y: 0 },
            });
            // add panel3 to same floating group as panel2
            dockview.moveGroupOrPanel({
                from: { groupId: panel3.group.id, panelId: 'panel_3' },
                to: { group: panel2.group, position: 'center' },
            });

            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel3.group.api.location.type).toBe('floating');
            expect(panel2.group).toBe(panel3.group);
            expect(panel2.group.size).toBe(2);

            // tear off panel3 to grid (directional drop on panel1's group)
            dockview.moveGroupOrPanel({
                from: { groupId: panel2.group.id, panelId: 'panel_3' },
                to: { group: panel1.group, position: 'right' },
            });

            // without floatingTabBehavior="browser", it docks to grid
            expect(panel3.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('floating');
        });

        test('moveGroupOrPanel from floating to grid docks to grid when explicitly set to default', () => {
            const { dockview } = createDockview({
                floatingTabBehavior: 'default',
            });

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
                floating: { x: 0, y: 0 },
            });
            dockview.moveGroupOrPanel({
                from: { groupId: panel3.group.id, panelId: 'panel_3' },
                to: { group: panel2.group, position: 'center' },
            });

            expect(panel2.group.size).toBe(2);

            dockview.moveGroupOrPanel({
                from: { groupId: panel2.group.id, panelId: 'panel_3' },
                to: { group: panel1.group, position: 'right' },
            });

            // default behavior: docks to grid
            expect(panel3.group.api.location.type).toBe('grid');
        });
    });

    describe('floatingTabBehavior="browser"', () => {
        test('floating-to-floating merge via moveGroupOrPanel still works (center drop)', () => {
            const { dockview } = createDockview({
                floatingTabBehavior: 'browser',
            });

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
                floating: true,
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: true,
            });

            expect(panel1.group.api.location.type).toBe('floating');
            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel1.group).not.toBe(panel2.group);

            // merge panel2 into panel1's floating group
            dockview.moveGroupOrPanel({
                from: { groupId: panel2.group.id, panelId: 'panel_2' },
                to: { group: panel1.group, position: 'center' },
            });

            expect(panel1.group.api.location.type).toBe('floating');
            expect(panel2.group).toBe(panel1.group);
            expect(panel1.group.size).toBe(2);
            expect(dockview.groups.length).toBe(1);
        });

        test('floating-to-floating merge via simulated DnD suppresses root and merges into target', () => {
            const { dockview } = createDockview({
                floatingTabBehavior: 'browser',
            });

            // A grid panel is needed so the root rejects 'center' drops
            dockview.addPanel({
                id: 'panel_grid',
                component: 'default',
            });

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
                floating: true,
            });
            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: true,
            });

            const sourceGroup = panel1.group;
            const targetGroup = panel2.group;
            expect(sourceGroup).not.toBe(targetGroup);

            // Set up PanelTransfer as if dragging panel_1 from sourceGroup
            LocalSelectionTransfer.getInstance<PanelTransfer>().setData(
                [new PanelTransfer(dockview.id, sourceGroup.id, 'panel_1')],
                PanelTransfer.prototype
            );

            // Position overlays: target at the right edge overlapping the
            // root's 10px edge zone, source far away
            const sourceFg = findFloatingGroup(dockview, sourceGroup);
            const targetFg = findFloatingGroup(dockview, targetGroup);
            jest.spyOn(
                sourceFg.overlay.element,
                'getBoundingClientRect'
            ).mockReturnValue(
                mockGetBoundingClientRect({
                    left: 50,
                    top: 50,
                    width: 200,
                    height: 200,
                })
            );
            jest.spyOn(
                targetFg.overlay.element,
                'getBoundingClientRect'
            ).mockReturnValue(
                mockGetBoundingClientRect({
                    left: 850,
                    top: 50,
                    width: 200,
                    height: 250,
                })
            );

            // Mock root Droptarget element
            setupRootDnd(dockview, { width: 1000, height: 500 });

            // Mock the target group's content container for its Droptarget.
            // Content is slightly inset from overlay (tab bar at top).
            const contentEl = queryElement(
                targetGroup.element,
                '.dv-content-container'
            );
            jest.spyOn(contentEl, 'offsetWidth', 'get').mockReturnValue(200);
            jest.spyOn(contentEl, 'offsetHeight', 'get').mockReturnValue(220);
            jest.spyOn(contentEl, 'getBoundingClientRect').mockReturnValue(
                mockGetBoundingClientRect({
                    left: 850,
                    top: 80,
                    width: 200,
                    height: 220,
                })
            );

            // clientX=995 is in the root's right edge zone (>990) AND inside
            // the target overlay (850..1050). Root canDisplayOverlay detects
            // mouse over non-source floating group → returns false.
            //
            // For the content Droptarget: x = 995-850 = 145, y = 180-80 = 100.
            // xp = 72.5%, yp = 45.5% → both in the center zone (20%-80%).
            // Content shows a 'center' drop overlay.
            fireEvent.dragEnter(contentEl);
            fireEvent(
                contentEl,
                createOffsetDragOverEvent({ clientX: 995, clientY: 180 })
            );

            // The target content should have a dropzone
            const contentDropZone = contentEl.querySelector(
                '.dv-drop-target-dropzone'
            );
            expect(contentDropZone).not.toBeNull();

            // Fire drop to complete the merge
            const dropEvent = new Event('drop', {
                bubbles: true,
                cancelable: true,
            });
            Object.defineProperty(dropEvent, 'clientX', {
                get: () => 995,
            });
            Object.defineProperty(dropEvent, 'clientY', {
                get: () => 180,
            });
            fireEvent(contentEl, dropEvent);

            // panel_1 should now be merged into targetGroup
            expect(panel1.group).toBe(targetGroup);
            expect(targetGroup.size).toBe(2);
            expect(targetGroup.api.location.type).toBe('floating');
            expect(dockview.floatingGroups.length).toBe(1);
        });

        test('tear-off from floating group to root creates new floating group with correct bounds', () => {
            const { dockview } = createDockview({
                floatingTabBehavior: 'browser',
            });

            // create a floating group with 2 panels
            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
                floating: true,
            });
            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: { x: 0, y: 0 },
            });
            dockview.moveGroupOrPanel({
                from: { groupId: panel2.group.id, panelId: 'panel_2' },
                to: { group: panel1.group, position: 'center' },
            });

            expect(panel1.group.size).toBe(2);
            expect(dockview.floatingGroups.length).toBe(1);
            const sourceGroupId = panel1.group.id;

            // Simulate: set up PanelTransfer as if dragging panel_2
            LocalSelectionTransfer.getInstance<PanelTransfer>().setData(
                [new PanelTransfer(dockview.id, sourceGroupId, 'panel_2')],
                PanelTransfer.prototype
            );

            // Mock source overlay dimensions for the tear-off bounds contract
            const sourceFg = findFloatingGroup(dockview, panel1.group);
            jest.spyOn(sourceFg.overlay, 'toJSON').mockReturnValue({
                top: 50,
                left: 100,
                width: 400,
                height: 300,
            });

            // Mock gridview element rect for position calculation
            jest.spyOn(
                queryElement(dockview.element, '.dv-dockview'),
                'getBoundingClientRect'
            ).mockReturnValue(
                mockGetBoundingClientRect({
                    left: 0,
                    top: 0,
                    width: 1000,
                    height: 500,
                })
            );

            // Spy on addFloatingGroup to verify bounds passed to the new group
            const addFloatingSpy = jest.spyOn(dockview, 'addFloatingGroup');

            // _rootDropTarget listens on dockview.element, not container
            const el = setupRootDnd(dockview, {
                width: 1000,
                height: 500,
            });
            fireDrop(
                el,
                { clientX: 5, clientY: 250 },
                { clientX: 300, clientY: 200 }
            );

            // panel_2 should now be in a new floating group
            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel1.group.api.location.type).toBe('floating');
            // source group should still have panel_1
            expect(panel1.group.size).toBe(1);
            // panel2 should be in a different group
            expect(panel2.group).not.toBe(panel1.group);
            expect(dockview.floatingGroups.length).toBe(2);

            // Verify bounds contract:
            // x = dropClientX - containerLeft - width/2 = 300 - 0 - 200 = 100
            // y = dropClientY - containerTop - 20 = 200 - 0 - 20 = 180
            // dimensions should match the source group's overlay
            expect(addFloatingSpy).toHaveBeenCalledTimes(1);
            expect(addFloatingSpy).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    x: 100,
                    y: 180,
                    width: 400,
                    height: 300,
                })
            );
        });

        test('tear-off source group retains remaining tabs', () => {
            const { dockview } = createDockview({
                floatingTabBehavior: 'browser',
            });

            // create a floating group with 3 panels
            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
                floating: true,
            });
            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: { x: 0, y: 0 },
            });
            const panel3 = dockview.addPanel({
                id: 'panel_3',
                component: 'default',
                floating: { x: 0, y: 0 },
            });
            // merge all into one group
            dockview.moveGroupOrPanel({
                from: { groupId: panel2.group.id, panelId: 'panel_2' },
                to: { group: panel1.group, position: 'center' },
            });
            dockview.moveGroupOrPanel({
                from: { groupId: panel3.group.id, panelId: 'panel_3' },
                to: { group: panel1.group, position: 'center' },
            });

            expect(panel1.group.size).toBe(3);
            const sourceGroupId = panel1.group.id;

            LocalSelectionTransfer.getInstance<PanelTransfer>().setData(
                [new PanelTransfer(dockview.id, sourceGroupId, 'panel_3')],
                PanelTransfer.prototype
            );

            jest.spyOn(
                queryElement(dockview.element, '.dv-dockview'),
                'getBoundingClientRect'
            ).mockReturnValue(
                mockGetBoundingClientRect({
                    left: 0,
                    top: 0,
                    width: 1000,
                    height: 500,
                })
            );

            const el = setupRootDnd(dockview, {
                width: 1000,
                height: 500,
            });
            fireDrop(
                el,
                { clientX: 5, clientY: 250 },
                { clientX: 300, clientY: 200 }
            );

            // panel3 is in a new floating group
            expect(panel3.group.api.location.type).toBe('floating');
            expect(panel3.group).not.toBe(panel1.group);
            // source group retains panel1 and panel2
            expect(panel1.group.size).toBe(2);
            expect(panel1.group.api.location.type).toBe('floating');
            expect(dockview.floatingGroups.length).toBe(2);
        });

        test('grid-to-grid moves still work normally', () => {
            const { dockview } = createDockview({
                floatingTabBehavior: 'browser',
            });

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });
            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                position: { referencePanel: 'panel_1', direction: 'right' },
            });

            expect(panel1.group.api.location.type).toBe('grid');
            expect(panel2.group.api.location.type).toBe('grid');
            expect(dockview.groups.length).toBe(2);

            // merge panel2 into panel1's group
            dockview.moveGroupOrPanel({
                from: { groupId: panel2.group.id, panelId: 'panel_2' },
                to: { group: panel1.group, position: 'center' },
            });

            expect(dockview.groups.length).toBe(1);
            expect(panel1.group.size).toBe(2);
            expect(panel1.group.api.location.type).toBe('grid');
        });

        test('grid-to-floating group merge still works', () => {
            const { dockview } = createDockview({
                floatingTabBehavior: 'browser',
            });

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
            });
            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: true,
            });

            // move grid panel to floating group
            dockview.moveGroupOrPanel({
                from: { groupId: panel1.group.id, panelId: 'panel_1' },
                to: { group: panel2.group, position: 'center' },
            });

            expect(panel2.group.api.location.type).toBe('floating');
            expect(panel1.group).toBe(panel2.group);
            expect(panel2.group.size).toBe(2);
        });

        test('single-panel floating group drop to root still docks to grid', () => {
            const { dockview } = createDockview({
                floatingTabBehavior: 'browser',
            });

            // need a grid panel so the root drop target shows edge overlays
            dockview.addPanel({
                id: 'panel_grid',
                component: 'default',
            });

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
                floating: true,
            });

            expect(panel1.group.size).toBe(1);
            const sourceGroupId = panel1.group.id;

            LocalSelectionTransfer.getInstance<PanelTransfer>().setData(
                [new PanelTransfer(dockview.id, sourceGroupId, 'panel_1')],
                PanelTransfer.prototype
            );

            // clientX=5 lands in the left edge zone (< 10px threshold)
            const el = setupRootDnd(dockview, {
                width: 1000,
                height: 500,
            });
            fireDrop(el, { clientX: 5, clientY: 250 });

            // single-panel floating group should dock to grid, not stay floating
            expect(panel1.group.api.location.type).toBe('grid');
        });

        test('canDisplayOverlay suppresses root when mouse is over non-source floating group', () => {
            const { dockview } = createDockview({
                floatingTabBehavior: 'browser',
            });

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
                floating: true,
            });

            const panel2 = dockview.addPanel({
                id: 'panel_2',
                component: 'default',
                floating: true,
            });

            // Position panel2's overlay at the left edge so it overlaps with
            // the root's 10px activation zone. panel1 (source) is elsewhere.
            const overlay1Element = findFloatingGroup(dockview, panel1.group)
                .overlay.element;
            const overlay2Element = findFloatingGroup(dockview, panel2.group)
                .overlay.element;

            jest.spyOn(
                overlay1Element,
                'getBoundingClientRect'
            ).mockReturnValue(
                mockGetBoundingClientRect({
                    left: 400,
                    top: 0,
                    width: 200,
                    height: 200,
                })
            );
            jest.spyOn(
                overlay2Element,
                'getBoundingClientRect'
            ).mockReturnValue(
                mockGetBoundingClientRect({
                    left: 0,
                    top: 0,
                    width: 50,
                    height: 500,
                })
            );

            // Drag from panel1's group
            LocalSelectionTransfer.getInstance<PanelTransfer>().setData(
                [new PanelTransfer(dockview.id, panel1.group.id, 'panel_1')],
                PanelTransfer.prototype
            );

            const el = setupRootDnd(dockview, {
                width: 1000,
                height: 500,
            });

            // clientX=5 is in the left edge zone AND over panel2's overlay.
            // canDisplayOverlay should return false (suppress root).
            fireEvent.dragEnter(el);
            fireEvent(
                el,
                createOffsetDragOverEvent({ clientX: 5, clientY: 250 })
            );

            const rootDropZone = el.querySelector('.dv-drop-target-dropzone');
            expect(rootDropZone).toBeNull();

            // clientX=995 is in the right edge zone, NOT over any overlay.
            // canDisplayOverlay should return true (show root overlay).
            fireEvent(
                el,
                createOffsetDragOverEvent({ clientX: 995, clientY: 250 })
            );

            const rootDropZone2 = el.querySelector('.dv-drop-target-dropzone');
            expect(rootDropZone2).not.toBeNull();
        });

        test('canDisplayOverlay does not suppress root when mouse is over SOURCE floating group', () => {
            const { dockview } = createDockview({
                floatingTabBehavior: 'browser',
            });

            const panel1 = dockview.addPanel({
                id: 'panel_1',
                component: 'default',
                floating: true,
            });

            // Position source overlay at the left edge
            const overlay1Element = findFloatingGroup(dockview, panel1.group)
                .overlay.element;

            jest.spyOn(
                overlay1Element,
                'getBoundingClientRect'
            ).mockReturnValue(
                mockGetBoundingClientRect({
                    left: 0,
                    top: 0,
                    width: 50,
                    height: 500,
                })
            );

            // Drag from panel1's own group (source)
            LocalSelectionTransfer.getInstance<PanelTransfer>().setData(
                [new PanelTransfer(dockview.id, panel1.group.id, 'panel_1')],
                PanelTransfer.prototype
            );

            const el = setupRootDnd(dockview, {
                width: 1000,
                height: 500,
            });

            // clientX=5 is in the left edge zone AND over panel1's overlay,
            // but panel1 is the SOURCE group — excluded from the hit test.
            // Root overlay should still show.
            fireEvent.dragEnter(el);
            fireEvent(
                el,
                createOffsetDragOverEvent({ clientX: 5, clientY: 250 })
            );

            const rootDropZone = el.querySelector('.dv-drop-target-dropzone');
            expect(rootDropZone).not.toBeNull();
        });
    });
});
