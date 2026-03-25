import { Tabs } from '../../../../dockview/components/titlebar/tabs';
import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewGroupPanel } from '../../../../dockview/dockviewGroupPanel';
import { DockviewComponent } from '../../../../dockview/dockviewComponent';
import { IDockviewPanel } from '../../../../dockview/dockviewPanel';
import { ITabRenderer } from '../../../../dockview/types';
import { IDockviewPanelModel } from '../../../../dockview/dockviewPanelModel';
import { fireEvent } from '@testing-library/dom';
import * as dataTransfer from '../../../../dnd/dataTransfer';
import { TabAnimation } from '../../../../dockview/options';

function makeDOMRect(
    x: number,
    y: number,
    width: number,
    height: number
): DOMRect {
    return {
        x,
        y,
        width,
        height,
        top: y,
        left: x,
        right: x + width,
        bottom: y + height,
        toJSON: () => ({}),
    } as DOMRect;
}

function createMockPanel(id: string): IDockviewPanel {
    const tabRenderer: ITabRenderer = {
        element: document.createElement('div'),
        init: jest.fn(),
        update: jest.fn(),
        dispose: jest.fn(),
    };

    return fromPartial<IDockviewPanel>({
        id,
        view: fromPartial<IDockviewPanelModel>({
            tab: tabRenderer,
        }),
    });
}

function createTabs(
    options: {
        tabAnimation?: TabAnimation;
        disableDnd?: boolean;
    } = {}
): { tabs: Tabs; accessor: DockviewComponent; group: DockviewGroupPanel } {
    const accessor = fromPartial<DockviewComponent>({
        id: 'test-accessor',
        options: {
            tabAnimation: options.tabAnimation,
            disableDnd: options.disableDnd,
        },
    });

    const group = fromPartial<DockviewGroupPanel>({
        id: 'test-group',
        locked: false,
        model: fromPartial({
            canDisplayOverlay: jest.fn().mockReturnValue(true),
            dropTargetContainer: undefined,
        }),
    });

    const tabs = new Tabs(group, accessor, {
        showTabsOverflowControl: false,
    });

    return { tabs, accessor, group };
}

function getTabElements(tabs: Tabs): HTMLElement[] {
    return (tabs as any)._tabs.map(
        (t: { value: { element: HTMLElement } }) => t.value.element
    );
}

function getAnimState(tabs: Tabs): any {
    return (tabs as any)._animState;
}

function mockTabRect(
    element: HTMLElement,
    rect: { left: number; width: number }
): void {
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue(
        makeDOMRect(rect.left, 0, rect.width, 30)
    );
}

describe('tabs - animation', () => {
    let rAFCallbacks: FrameRequestCallback[];

    beforeEach(() => {
        rAFCallbacks = [];
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            rAFCallbacks.push(cb);
            return rAFCallbacks.length;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    function flushRAF() {
        const callbacks = [...rAFCallbacks];
        rAFCallbacks = [];
        for (const cb of callbacks) {
            cb(performance.now());
        }
    }

    describe('animation state initialization', () => {
        test('dragstart initializes animation state when animation enabled', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);

            const elements = getTabElements(tabs);

            expect(getAnimState(tabs)).toBeNull();

            fireEvent.dragStart(elements[0]);

            const state = getAnimState(tabs);
            expect(state).not.toBeNull();
            expect(state.sourceTabId).toBe('panel-a');
            expect(state.sourceIndex).toBe(0);
            expect(state.tabPositions).toBeInstanceOf(Map);
            expect(state.tabPositions.size).toBe(2);
            expect(state.currentInsertionIndex).toBeNull();
        });

        test('dragstart does not initialize state when tabAnimation is default', () => {
            const { tabs } = createTabs({ tabAnimation: 'default' });
            const panel = createMockPanel('panel-a');

            tabs.openPanel(panel, 0);

            const elements = getTabElements(tabs);
            fireEvent.dragStart(elements[0]);

            expect(getAnimState(tabs)).toBeNull();
        });

        test('dragstart does not initialize state when disableDnd is true', () => {
            const { tabs } = createTabs({ disableDnd: true });
            const panel = createMockPanel('panel-a');

            tabs.openPanel(panel, 0);

            const elements = getTabElements(tabs);
            fireEvent.dragStart(elements[0]);

            // disableDnd prevents DragHandler from processing the event
            // so Tab's onDragStart never fires, and _animState stays null
            expect(getAnimState(tabs)).toBeNull();
        });
    });

    describe('source tab collapse', () => {
        test('dragstart adds dv-tab--dragging class when animation enabled', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panel = createMockPanel('panel-a');

            tabs.openPanel(panel, 0);

            const elements = getTabElements(tabs);
            expect(
                elements[0].classList.contains('dv-tab--dragging')
            ).toBeFalsy();

            fireEvent.dragStart(elements[0]);
            flushRAF();

            expect(
                elements[0].classList.contains('dv-tab--dragging')
            ).toBeTruthy();
        });

        test('dragstart does not add dv-tab--dragging class when tabAnimation is default', () => {
            const { tabs } = createTabs({ tabAnimation: 'default' });
            const panel = createMockPanel('panel-a');

            tabs.openPanel(panel, 0);

            const elements = getTabElements(tabs);
            fireEvent.dragStart(elements[0]);

            expect(
                elements[0].classList.contains('dv-tab--dragging')
            ).toBeFalsy();
        });
    });

    describe('drag cancellation', () => {
        test('dragend resets animation state and removes dragging class', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);

            const elements = getTabElements(tabs);

            // Start drag
            fireEvent.dragStart(elements[0]);
            flushRAF();
            expect(getAnimState(tabs)).not.toBeNull();
            expect(
                elements[0].classList.contains('dv-tab--dragging')
            ).toBeTruthy();

            // Cancel drag (dragend on container - simulating cancel)
            const tabsList = (tabs as any)._tabsList as HTMLElement;
            fireEvent.dragEnd(tabsList);

            expect(getAnimState(tabs)).toBeNull();
            expect(
                elements[0].classList.contains('dv-tab--dragging')
            ).toBeFalsy();
        });

        test('dragend removes shifting classes and transforms from all tabs', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);

            const elements = getTabElements(tabs);

            // Manually set transforms and classes to simulate mid-animation
            elements[0].style.transform = 'translateX(100px)';
            elements[0].classList.add('dv-tab--shifting');
            elements[1].style.transform = 'translateX(-100px)';
            elements[1].classList.add('dv-tab--shifting');

            // Set animation state
            (tabs as any)._animState = {
                sourceTabId: 'panel-a',
                sourceIndex: 0,
                tabPositions: new Map(),
                currentInsertionIndex: null,
            };

            // Trigger dragend
            const tabsList = (tabs as any)._tabsList as HTMLElement;
            fireEvent.dragEnd(tabsList);

            expect(elements[0].style.transform).toBe('');
            expect(elements[1].style.transform).toBe('');
            expect(
                elements[0].classList.contains('dv-tab--shifting')
            ).toBeFalsy();
            expect(
                elements[1].classList.contains('dv-tab--shifting')
            ).toBeFalsy();
        });
    });

    describe('FLIP animation', () => {
        test('runFlipAnimation applies inverse transforms for moved tabs', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');
            const panelC = createMockPanel('panel-c');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);
            tabs.openPanel(panelC, 2);

            const elements = getTabElements(tabs);

            // Create "first" positions (before DOM reorder)
            const firstPositions = new Map<string, DOMRect>();
            firstPositions.set('panel-a', makeDOMRect(0, 0, 80, 30));
            firstPositions.set('panel-b', makeDOMRect(80, 0, 80, 30));
            firstPositions.set('panel-c', makeDOMRect(160, 0, 80, 30));

            // Mock "last" positions (after DOM reorder: A moved from 0 to 160)
            mockTabRect(elements[0], { left: 160, width: 80 });
            mockTabRect(elements[1], { left: 0, width: 80 });
            mockTabRect(elements[2], { left: 80, width: 80 });

            // Run FLIP (source tab is panel-a, so B and C should get transforms)
            (tabs as any).runFlipAnimation(firstPositions, 'panel-a');

            // panel-b: was at 80, now at 0 → delta = +80
            expect(elements[1].style.transform).toBe('translateX(80px)');
            expect(
                elements[1].classList.contains('dv-tab--shifting')
            ).toBeTruthy();

            // panel-c: was at 160, now at 80 → delta = +80
            expect(elements[2].style.transform).toBe('translateX(80px)');
            expect(
                elements[2].classList.contains('dv-tab--shifting')
            ).toBeTruthy();

            // panel-a (source) should not have transform
            expect(elements[0].style.transform).toBe('');
        });

        test('runFlipAnimation removes transforms in requestAnimationFrame', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);

            const elements = getTabElements(tabs);

            const firstPositions = new Map<string, DOMRect>();
            firstPositions.set('panel-a', makeDOMRect(0, 0, 80, 30));
            firstPositions.set('panel-b', makeDOMRect(80, 0, 80, 30));

            // panel-b moved from 80 to 0
            mockTabRect(elements[0], { left: 80, width: 80 });
            mockTabRect(elements[1], { left: 0, width: 80 });

            (tabs as any).runFlipAnimation(firstPositions, 'panel-a');

            // Before rAF: transform should be applied
            expect(elements[1].style.transform).toBe('translateX(80px)');

            // Flush rAF
            flushRAF();

            // After rAF: transform should be removed (CSS transition takes over)
            expect(elements[1].style.transform).toBe('');
        });

        test('no animation when no tabs moved (drop at original position)', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);

            const elements = getTabElements(tabs);

            const firstPositions = new Map<string, DOMRect>();
            firstPositions.set('panel-a', makeDOMRect(0, 0, 80, 30));
            firstPositions.set('panel-b', makeDOMRect(80, 0, 80, 30));

            // Same positions after "reorder" (no actual move)
            mockTabRect(elements[0], { left: 0, width: 80 });
            mockTabRect(elements[1], { left: 80, width: 80 });

            (tabs as any).runFlipAnimation(firstPositions, 'panel-a');

            // No transforms should be applied (delta < 1)
            expect(elements[0].style.transform).toBe('');
            expect(elements[1].style.transform).toBe('');

            // No rAF should be queued
            expect(rAFCallbacks.length).toBe(0);
        });
    });

    describe('resetTabTransforms', () => {
        test('clears all transforms and shifting classes', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);

            const elements = getTabElements(tabs);

            // Set up transforms
            elements[0].style.transform = 'translateX(50px)';
            elements[0].classList.add('dv-tab--shifting');
            elements[1].style.transform = 'translateX(-50px)';
            elements[1].classList.add('dv-tab--shifting');

            (tabs as any).resetTabTransforms();

            expect(elements[0].style.transform).toBe('');
            expect(elements[1].style.transform).toBe('');
            expect(
                elements[0].classList.contains('dv-tab--shifting')
            ).toBeFalsy();
            expect(
                elements[1].classList.contains('dv-tab--shifting')
            ).toBeFalsy();
        });
    });

    describe('dispose cleanup', () => {
        test('dispose during active drag clears animation state', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);

            const elements = getTabElements(tabs);

            // Start drag
            fireEvent.dragStart(elements[0]);
            expect(getAnimState(tabs)).not.toBeNull();

            // Dispose
            tabs.dispose();

            expect(getAnimState(tabs)).toBeNull();
        });
    });

    describe('delete cleanup', () => {
        test('deleting source tab during cross-group move clears animation state', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);

            const elements = getTabElements(tabs);

            // Simulate drag start
            fireEvent.dragStart(elements[0]);
            expect(getAnimState(tabs)).not.toBeNull();
            expect(getAnimState(tabs).sourceTabId).toBe('panel-a');

            // Simulate cross-group removal (the tab is deleted from this group)
            tabs.delete('panel-a');

            expect(getAnimState(tabs)).toBeNull();
        });

        test('deleting non-source tab does not clear animation state', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');
            const panelC = createMockPanel('panel-c');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);
            tabs.openPanel(panelC, 2);

            const elements = getTabElements(tabs);

            // Start drag on panel-a
            fireEvent.dragStart(elements[0]);
            expect(getAnimState(tabs)).not.toBeNull();

            // Delete a different tab
            tabs.delete('panel-c');

            // Animation state should still exist
            expect(getAnimState(tabs)).not.toBeNull();
            expect(getAnimState(tabs).sourceTabId).toBe('panel-a');
        });
    });

    describe('handleDragOver', () => {
        test('updates currentInsertionIndex based on cursor position', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');
            const panelC = createMockPanel('panel-c');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);
            tabs.openPanel(panelC, 2);

            const elements = getTabElements(tabs);

            // Mock tab positions
            mockTabRect(elements[0], { left: 0, width: 80 });
            mockTabRect(elements[1], { left: 80, width: 80 });
            mockTabRect(elements[2], { left: 160, width: 80 });

            // Start drag on panel-a
            fireEvent.dragStart(elements[0]);
            expect(getAnimState(tabs)).not.toBeNull();

            // Call handleDragOver directly with a mock event
            const mockEvent = { clientX: 120 } as DragEvent;
            (tabs as any).handleDragOver(mockEvent);

            // panel-a (index 0) is source → skipped
            // panel-b (index 1): midpoint = 120, 120 < 120 → false, insertionIndex = 2
            // panel-c (index 2): midpoint = 200, 120 < 200 → true, insertionIndex = 2
            expect(getAnimState(tabs).currentInsertionIndex).toBe(2);
        });

        test('dragging tab adjacent to a group chip allows drop at position 0 of that group', () => {
            // Regression: dragging the tab immediately left of a group chip
            // into position 0 of the group was impossible because the
            // sourceInBetween check incorrectly skipped the group.
            //
            // Layout: [Feature chip][A][B][C][D][Monitoring chip][E]
            // Drag D → cursor over Monitoring chip → should target Monitoring group
            const { tabs, group } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');
            const panelC = createMockPanel('panel-c');
            const panelD = createMockPanel('panel-d');
            const panelE = createMockPanel('panel-e');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);
            tabs.openPanel(panelC, 2);
            tabs.openPanel(panelD, 3);
            tabs.openPanel(panelE, 4);

            const elements = getTabElements(tabs);

            // Feature chip (30px) + 4 tabs (80px each) + Monitoring chip (30px) + 1 tab (80px)
            // Positions: chip@0, A@30, B@110, C@190, D@270, chip@350, E@380
            mockTabRect(elements[0], { left: 30, width: 80 });   // A
            mockTabRect(elements[1], { left: 110, width: 80 });  // B
            mockTabRect(elements[2], { left: 190, width: 80 });  // C
            mockTabRect(elements[3], { left: 270, width: 80 });  // D (source)
            mockTabRect(elements[4], { left: 380, width: 80 });  // E

            // Mock tab groups returned by the model
            const featureGroup = {
                id: 'feature-group',
                panelIds: ['panel-a', 'panel-b', 'panel-c', 'panel-d'],
                collapsed: false,
            };
            const monitoringGroup = {
                id: 'monitoring-group',
                panelIds: ['panel-e'],
                collapsed: false,
            };
            (group.model as any).getTabGroups = () => [featureGroup, monitoringGroup];

            // Set up chip renderers map so the code knows there are chips
            const chipRenderers = (tabs as any)._chipRenderers as Map<string, any>;
            chipRenderers.set('feature-group', {
                chip: { element: document.createElement('span') },
                disposable: { dispose: jest.fn() },
            });
            chipRenderers.set('monitoring-group', {
                chip: { element: document.createElement('span') },
                disposable: { dispose: jest.fn() },
            });

            // Start drag on panel-d (index 3)
            fireEvent.dragStart(elements[3]);
            flushRAF();

            // Override _animState chip positions
            const state = getAnimState(tabs);
            state.chipPositions.set('feature-group', 30);
            state.chipPositions.set('monitoring-group', 30);
            // containerLeft = 0 for simplicity
            state.containerLeft = 0;
            // cursorOffsetFromDragLeft = 40 (half of 80)
            state.cursorOffsetFromDragLeft = 40;

            // Position cursor just before the Monitoring chip so the chip
            // overflows but all Feature tabs fit:
            //   dragLeftEdge = 330 - 40 = 290, availableSpace = 290
            //   Feature chip(30) + A(80) + B(80) + C(80) = 270 ≤ 290
            //   Monitoring chip: 270 + 30 = 300 > 290 → overflow → break
            //   insertionIndex stays at 3 (D's raw index)
            //
            // Group matching for Monitoring:
            //   effectivePanelIds = [E], firstIdx = 4, lastIdx = 4
            //   isJustBeforeGroup = (3 === 4-1) = true
            //   j=3: tabs[3] = D = source → allInBetweenAreSource = true
            //   → threshold check: chipWidth=30, containerLeft+accUpTo=270
            //     threshold = 270 + 30 = 300, mouseX=330 ≥ 300 → target = monitoring
            (tabs as any).handleDragOver({ clientX: 330 } as DragEvent);

            expect(getAnimState(tabs).targetTabGroupId).toBe('monitoring-group');
        });

        test('dragging a group chip never targets another group', () => {
            // Regression: dragging a group chip between two tabs of another
            // group should NOT set targetTabGroupId — groups cannot be
            // dropped inside other groups.
            //
            // Layout: [Feature chip][A][B][Monitoring chip][C]
            // Drag Feature group → cursor between C's tabs area
            const { tabs, group } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');
            const panelC = createMockPanel('panel-c');
            const panelD = createMockPanel('panel-d');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);
            tabs.openPanel(panelC, 2);
            tabs.openPanel(panelD, 3);

            const elements = getTabElements(tabs);

            mockTabRect(elements[0], { left: 30, width: 80 });   // A
            mockTabRect(elements[1], { left: 110, width: 80 });   // B
            mockTabRect(elements[2], { left: 220, width: 80 });   // C
            mockTabRect(elements[3], { left: 300, width: 80 });   // D

            const featureGroup = {
                id: 'feature-group',
                panelIds: ['panel-a', 'panel-b'],
                collapsed: false,
            };
            const monitoringGroup = {
                id: 'monitoring-group',
                panelIds: ['panel-c', 'panel-d'],
                collapsed: false,
            };
            (group.model as any).getTabGroups = () => [featureGroup, monitoringGroup];

            const chipRenderers = (tabs as any)._chipRenderers as Map<string, any>;
            chipRenderers.set('feature-group', {
                chip: { element: document.createElement('span') },
                disposable: { dispose: jest.fn() },
            });
            chipRenderers.set('monitoring-group', {
                chip: { element: document.createElement('span') },
                disposable: { dispose: jest.fn() },
            });

            // Manually initialize a group drag (sourceTabGroupId is set)
            (tabs as any)._animState = {
                sourceTabId: '',
                sourceIndex: 0,
                tabPositions: (tabs as any).snapshotTabPositions(),
                chipPositions: new Map([['feature-group', 30], ['monitoring-group', 30]]),
                currentInsertionIndex: null,
                targetTabGroupId: null,
                sourceTabGroupId: 'feature-group',
                sourceGroupPanelIds: new Set(['panel-a', 'panel-b']),
                sourceChipWidth: 30,
                cursorOffsetFromDragLeft: 40,
                sourceGapWidth: 190,
                containerLeft: 0,
            };

            // Position cursor between C and D (inside Monitoring group range)
            // Without the fix, targetTabGroupId would be 'monitoring-group'
            // and insertionIndex would land inside the group.
            //
            // Accumulation (A,B are source → skipped):
            //   Monitoring chip: 0+30=30, C: 30+40=70 ≤ availableSpace
            //   For clientX=280: dragLeftEdge=280-40=240, availableSpace=240
            //   chip(30)+C(80)=110+D_mid: 110+40=150 ≤ 240 → acc=190, ins=4 (past D)
            // Actually let's use clientX=270 so insertion lands at index 3 (between C and D)
            //   dragLeftEdge=270-40=230, availableSpace=230
            //   chip(30)+C(80): acc=110, ins=3. D_mid: 110+40=150 ≤ 230 → acc=190, ins=4
            // Hmm, both land past D. Let's use clientX=180:
            //   dragLeftEdge=180-40=140, availableSpace=140
            //   chip(30): acc=30. C_mid: 30+40=70 ≤ 140 → acc=110, ins=3.
            //   D_mid: 110+40=150 > 140 → break. insertionIndex=3
            //   Monitoring effectivePanelIds=[C,D], firstIdx=2, lastIdx=3
            //   isInsideRange = (3 >= 2 && 3 <= 3) = true → snap
            //   groupMid = (2+3+1)/2 = 3. insertionIndex(3) >= 3 → snap to lastIdx+1 = 4
            (tabs as any).handleDragOver({ clientX: 180 } as DragEvent);

            // Group drags must never target another group
            expect(getAnimState(tabs).targetTabGroupId).toBeNull();
            // Insertion index should be snapped outside the Monitoring group
            // (to lastIdx + 1 = 4, i.e. after the group)
            expect(getAnimState(tabs).currentInsertionIndex).toBe(4);
        });
    });

    describe('dragover gap transforms', () => {
        test('tabs after insertion index shift right by source tab width', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');
            const panelC = createMockPanel('panel-c');
            const panelD = createMockPanel('panel-d');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);
            tabs.openPanel(panelC, 2);
            tabs.openPanel(panelD, 3);

            const elements = getTabElements(tabs);

            // Mock positions for dragstart snapshot
            mockTabRect(elements[0], { left: 0, width: 80 });
            mockTabRect(elements[1], { left: 80, width: 80 });
            mockTabRect(elements[2], { left: 160, width: 80 });
            mockTabRect(elements[3], { left: 240, width: 80 });

            // Start drag on panel-b (index 1)
            fireEvent.dragStart(elements[1]);
            flushRAF(); // let collapse rAF run so _pendingCollapse is cleared
            expect(getAnimState(tabs)).not.toBeNull();

            // Source tab width was captured as 80px
            // cursorOffsetFromDragLeft = 40 (half of source tab width)
            // Simulate cursor at position 200 (right half of panel-c)
            (tabs as any).handleDragOver({ clientX: 200 } as DragEvent);

            // panel-a (index 0): 0 < insertionIndex → no margin
            expect(elements[0].style.marginLeft).toBe('');

            // Accumulation: dragLeftEdge=200-40=160, availableSpace=160
            // A(i=0): accWidth+40=40<=160 → acc=80, ins=1
            // B(i=1, source): skip
            // C(i=2): acc+40=120<=160 → acc=160, ins=3
            // D(i=3): acc+40=200>160 → break
            expect(getAnimState(tabs).currentInsertionIndex).toBe(3);

            // First non-source tab at index >= 3: panel-d gets margin-left of 80
            expect(elements[3].style.marginLeft).toBe('80px');
            expect(
                elements[3].classList.contains('dv-tab--shifting')
            ).toBeTruthy();

            // panel-c (index 2 < 3): no margin (may be '0px' in JSDOM
            // because transitionend never fires to remove the property)
            expect(['', '0px']).toContain(elements[2].style.marginLeft);
        });

        test('gap moves when cursor moves to different position', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');
            const panelC = createMockPanel('panel-c');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);
            tabs.openPanel(panelC, 2);

            const elements = getTabElements(tabs);

            mockTabRect(elements[0], { left: 0, width: 80 });
            mockTabRect(elements[1], { left: 80, width: 80 });
            mockTabRect(elements[2], { left: 160, width: 80 });

            // Start drag on panel-a (source, width 80)
            fireEvent.dragStart(elements[0]);
            flushRAF(); // let collapse rAF run so _pendingCollapse is cleared

            // Move cursor: cursorOffsetFromDragLeft = 40
            // clientX=90 → dragLeftEdge=50, availableSpace=50
            (tabs as any).handleDragOver({ clientX: 90 } as DragEvent);

            // Accumulation: A(source, skip).
            // B(i=1): accWidth+40=40<=50 → acc=80, ins=2
            // C(i=2): accWidth+40=120>50 → break
            expect(getAnimState(tabs).currentInsertionIndex).toBe(2);
            // First non-source tab at index >= 2: panel-c gets margin-left
            expect(elements[2].style.marginLeft).toBe('80px');
            // panel-b: index 1 < 2 → no margin (may be '0px' in JSDOM
            // because transitionend never fires to remove the property)
            expect(['', '0px']).toContain(elements[1].style.marginLeft);

            // Now move cursor to right half of panel-c (insert after C)
            // clientX=220 → dragLeftEdge=180, availableSpace=180
            (tabs as any).handleDragOver({ clientX: 220 } as DragEvent);

            // Accumulation: A(source, skip).
            // B(i=1): acc+40=40<=180 → acc=80, ins=2
            // C(i=2): acc+40=120<=180 → acc=160, ins=3. Loop ends.
            expect(getAnimState(tabs).currentInsertionIndex).toBe(3);
            // No tabs at index >= 3 → margins animate to 0 (transition pending in real
            // browser; in JSDOM without CSS transitions the value is '0px' until
            // transitionend fires, at which point the property is removed entirely)
            expect(['', '0px']).toContain(elements[1].style.marginLeft);
            expect(['', '0px']).toContain(elements[2].style.marginLeft);
        });

        test('same insertion index skips transform update', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);

            const elements = getTabElements(tabs);

            mockTabRect(elements[0], { left: 0, width: 80 });
            mockTabRect(elements[1], { left: 80, width: 80 });

            fireEvent.dragStart(elements[0]);

            // First dragover
            (tabs as any).handleDragOver({ clientX: 90 } as DragEvent);
            const firstIndex = getAnimState(tabs).currentInsertionIndex;

            // Spy on applyDragOverTransforms to check if it's called again
            const applySpy = jest.spyOn(tabs as any, 'applyDragOverTransforms');

            // Second dragover with same result
            (tabs as any).handleDragOver({ clientX: 95 } as DragEvent);

            // Same insertion index → applyDragOverTransforms should not be called
            expect(getAnimState(tabs).currentInsertionIndex).toBe(firstIndex);
            expect(applySpy).not.toHaveBeenCalled();

            applySpy.mockRestore();
        });
    });

    describe('cross-group animation (US3)', () => {
        test('external dragover initializes animation state with sourceIndex -1', () => {
            const { tabs, group } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);

            const elements = getTabElements(tabs);
            mockTabRect(elements[0], { left: 0, width: 80 });
            mockTabRect(elements[1], { left: 80, width: 80 });

            // Mock getPanelData to return an external group's panel
            const spy = jest
                .spyOn(dataTransfer, 'getPanelData')
                .mockReturnValue(
                    new dataTransfer.PanelTransfer(
                        'test-accessor',
                        'other-group',
                        'external-panel'
                    )
                );

            const tabsList = (tabs as any)._tabsList as HTMLElement;
            fireEvent.dragOver(tabsList);

            const state = getAnimState(tabs);
            expect(state).not.toBeNull();
            expect(state.sourceTabId).toBe('external-panel');
            expect(state.sourceIndex).toBe(-1);
            expect(state.tabPositions.size).toBe(2);

            spy.mockRestore();
        });

        test('external dragover does not initialize state when tabAnimation is default', () => {
            const { tabs } = createTabs({ tabAnimation: 'default' });
            const panel = createMockPanel('panel-a');
            tabs.openPanel(panel, 0);

            const spy = jest
                .spyOn(dataTransfer, 'getPanelData')
                .mockReturnValue(
                    new dataTransfer.PanelTransfer(
                        'test-accessor',
                        'other-group',
                        'external-panel'
                    )
                );

            const tabsList = (tabs as any)._tabsList as HTMLElement;
            fireEvent.dragOver(tabsList);

            expect(getAnimState(tabs)).toBeNull();

            spy.mockRestore();
        });

        test('external dragover uses average tab width for gap', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);

            const elements = getTabElements(tabs);
            mockTabRect(elements[0], { left: 0, width: 100 });
            mockTabRect(elements[1], { left: 100, width: 60 });

            // Manually initialize external drag state (as dragover listener would)
            (tabs as any)._animState = {
                sourceTabId: 'external-panel',
                sourceIndex: -1,
                tabPositions: (tabs as any).snapshotTabPositions(),
                currentInsertionIndex: null,
            };

            // cursor at 30 → left half of panel-a (midpoint 50) → insert at index 0
            (tabs as any).handleDragOver({ clientX: 30 } as DragEvent);

            // Average width: (100 + 60) / 2 = 80
            // First non-source tab at index >= 0: panel-a gets margin-left of 80
            expect(elements[0].style.marginLeft).toBe('80px');
            // panel-b: not the first tab at >= insertionIndex, no margin
            expect(elements[1].style.marginLeft).toBe('');
        });

        test('dragleave fully clears state for external drags', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            tabs.openPanel(panelA, 0);

            const elements = getTabElements(tabs);
            mockTabRect(elements[0], { left: 0, width: 80 });

            const spy = jest
                .spyOn(dataTransfer, 'getPanelData')
                .mockReturnValue(
                    new dataTransfer.PanelTransfer(
                        'test-accessor',
                        'other-group',
                        'external-panel'
                    )
                );

            const tabsList = (tabs as any)._tabsList as HTMLElement;
            fireEvent.dragOver(tabsList);
            expect(getAnimState(tabs)).not.toBeNull();

            // Simulate dragleave (cursor leaves container entirely)
            const dragLeaveEvent = new Event('dragleave', { bubbles: true });
            tabsList.dispatchEvent(dragLeaveEvent);

            // External drag: state should be fully cleared (not just insertionIndex)
            expect(getAnimState(tabs)).toBeNull();

            spy.mockRestore();
        });

        test('same-group dragover does not trigger external detection', () => {
            const { tabs, group } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            tabs.openPanel(panelA, 0);

            // Mock getPanelData to return same group
            const spy = jest
                .spyOn(dataTransfer, 'getPanelData')
                .mockReturnValue(
                    new dataTransfer.PanelTransfer(
                        'test-accessor',
                        'test-group',
                        'panel-a'
                    )
                );

            const tabsList = (tabs as any)._tabsList as HTMLElement;
            fireEvent.dragOver(tabsList);

            // Should NOT initialize _animState (same group)
            expect(getAnimState(tabs)).toBeNull();

            spy.mockRestore();
        });

        test('cross-group FLIP animates newly inserted tab with slide-in', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');
            const panelC = createMockPanel('panel-c');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);
            tabs.openPanel(panelC, 2);

            const elements = getTabElements(tabs);

            // First positions (before cross-group drop)
            const firstPositions = new Map<string, DOMRect>();
            firstPositions.set('panel-a', makeDOMRect(0, 0, 80, 30));
            firstPositions.set('panel-b', makeDOMRect(80, 0, 80, 30));
            // panel-c is the newly inserted tab — NOT in firstPositions

            // "Last" positions (after new tab inserted at index 2)
            mockTabRect(elements[0], { left: 0, width: 80 });
            mockTabRect(elements[1], { left: 80, width: 80 });
            mockTabRect(elements[2], { left: 160, width: 80 });

            // isCrossGroup = true, sourceTabId = 'panel-c' (newly inserted)
            (tabs as any).runFlipAnimation(firstPositions, 'panel-c', true);

            // panel-c (source, cross-group): should get slide-in transform
            expect(elements[2].style.transform).toBe('translateX(80px)');
            expect(
                elements[2].classList.contains('dv-tab--shifting')
            ).toBeTruthy();

            // panel-a and panel-b: same positions → no delta → no transform
            expect(elements[0].style.transform).toBe('');
            expect(elements[1].style.transform).toBe('');
        });

        test('cross-group FLIP does NOT animate source tab for same-group drops', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);

            const elements = getTabElements(tabs);

            const firstPositions = new Map<string, DOMRect>();
            firstPositions.set('panel-a', makeDOMRect(0, 0, 80, 30));
            firstPositions.set('panel-b', makeDOMRect(80, 0, 80, 30));

            mockTabRect(elements[0], { left: 80, width: 80 });
            mockTabRect(elements[1], { left: 0, width: 80 });

            // isCrossGroup = false (default), sourceTabId = 'panel-a'
            (tabs as any).runFlipAnimation(firstPositions, 'panel-a');

            // panel-a (source, same-group): should be skipped, no transform
            expect(elements[0].style.transform).toBe('');

            // panel-b: moved from 80 to 0 → delta = +80
            expect(elements[1].style.transform).toBe('translateX(80px)');
        });
    });

    describe('dragleave', () => {
        test('resets transforms and insertion index when cursor leaves container', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);

            const elements = getTabElements(tabs);

            // Start drag
            fireEvent.dragStart(elements[0]);

            // Manually set some state to verify it's cleared
            (tabs as any)._animState.currentInsertionIndex = 1;
            elements[1].style.marginLeft = '80px';
            elements[1].classList.add('dv-tab--shifting');

            // Simulate dragleave (cursor leaves the container entirely)
            const tabsList = (tabs as any)._tabsList as HTMLElement;
            const dragLeaveEvent = new Event('dragleave', {
                bubbles: true,
            });
            // relatedTarget is null by default → cursor left the container entirely
            tabsList.dispatchEvent(dragLeaveEvent);

            expect(elements[1].style.marginLeft).toBe('');
            expect(
                elements[1].classList.contains('dv-tab--shifting')
            ).toBeFalsy();
            expect(getAnimState(tabs).currentInsertionIndex).toBeNull();
        });

        test('does not reset when moving between child elements', () => {
            const { tabs } = createTabs({ tabAnimation: 'smooth' });
            const panelA = createMockPanel('panel-a');
            const panelB = createMockPanel('panel-b');

            tabs.openPanel(panelA, 0);
            tabs.openPanel(panelB, 1);

            const elements = getTabElements(tabs);

            // Append tabsList to document so contains() works
            const tabsList = (tabs as any)._tabsList as HTMLElement;
            document.body.appendChild(tabsList);

            // Start drag
            fireEvent.dragStart(elements[0]);

            (tabs as any)._animState.currentInsertionIndex = 1;
            elements[1].style.marginLeft = '80px';

            // Dispatch dragleave with relatedTarget being a child element
            const dragLeaveEvent = new MouseEvent('dragleave', {
                bubbles: true,
                relatedTarget: elements[1],
            });
            tabsList.dispatchEvent(dragLeaveEvent);

            // State should NOT be reset since relatedTarget is a child
            expect(elements[1].style.marginLeft).toBe('80px');
            expect(getAnimState(tabs).currentInsertionIndex).toBe(1);

            // Cleanup
            document.body.removeChild(tabsList);
        });
    });
});
