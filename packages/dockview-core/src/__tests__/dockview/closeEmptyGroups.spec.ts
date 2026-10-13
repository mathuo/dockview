import { DockviewComponent } from '../../dockview/dockviewComponent';
import { DockviewGroupPanel } from '../../dockview/dockviewGroupPanel';
import { IContentRenderer } from '../../dockview/types';
import { setupMockWindow } from '../__mocks__/mockWindow';

class TestPanel implements IContentRenderer {
    element = document.createElement('div');
    init(): void {}
    layout(): void {}
    dispose(): void {}
}

function create(options: Record<string, unknown> = {}): DockviewComponent {
    const container = document.createElement('div');
    const dockview = new DockviewComponent(container, {
        createComponent: () => new TestPanel(),
        ...options,
    });
    dockview.layout(1000, 600);
    return dockview;
}

/** two grid groups side by side: g1 holds p1, g2 holds p2 + p3 */
function twoGroups(dockview: DockviewComponent) {
    const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
    const p2 = dockview.addPanel({
        id: 'p2',
        component: 'default',
        position: { referencePanel: 'p1', direction: 'right' },
    });
    const p3 = dockview.addPanel({
        id: 'p3',
        component: 'default',
        position: { referenceGroup: p2.group },
    });
    return { p1, p2, p3, g1: p1.group, g2: p2.group };
}

describe('closeEmptyGroups edge cases', () => {
    const originalOpen = window.open;
    afterEach(() => {
        window.open = originalOpen;
    });

    test('baseline: default removes the emptied group', () => {
        const dockview = create();
        const { p1, g1 } = twoGroups(dockview);
        p1.api.close();
        expect(dockview.groups).not.toContain(g1);
        expect(dockview.size).toBe(1);
    });

    test('panel.api.close() keeps the group and shows its watermark', () => {
        const dockview = create({ closeEmptyGroups: false });
        const { p1, g1 } = twoGroups(dockview);
        p1.api.close();
        expect(dockview.groups).toContain(g1);
        expect(g1.panels).toHaveLength(0);
        expect(g1.model.hasWatermark).toBe(true);
        expect(dockview.size).toBe(2);
    });

    test('api.removePanel() keeps the group', () => {
        const dockview = create({ closeEmptyGroups: false });
        const { p1, g1 } = twoGroups(dockview);
        dockview.api.removePanel(p1);
        expect(dockview.groups).toContain(g1);
    });

    test('active state after the last panel of the active group closes', () => {
        const dockview = create({ closeEmptyGroups: false });
        const { p1, g1 } = twoGroups(dockview);
        dockview.doSetGroupAndPanelActive(g1);
        expect(dockview.activeGroup).toBe(g1);
        p1.api.close();
        // record what happens: does focus stay on the empty group or move?
        console.log(
            'active after close -> group:',
            dockview.activeGroup?.id === g1.id
                ? 'g1 (empty)'
                : dockview.activeGroup?.id,
            'panel:',
            dockview.activePanel?.id
        );
        expect(dockview.activePanel).not.toBe(p1);
    });

    test('DnD move into another group (center) keeps the source', () => {
        const dockview = create({ closeEmptyGroups: false });
        const { g1, g2 } = twoGroups(dockview);
        dockview.moveGroupOrPanel({
            from: { groupId: g1.id, panelId: 'p1' },
            to: { group: g2, position: 'center' },
        });
        expect(dockview.groups).toContain(g1);
        expect(g1.panels).toHaveLength(0);
        expect(g2.panels.map((p) => p.id)).toEqual(['p2', 'p3', 'p1']);
    });

    test('DnD move to an edge (creates a new group) keeps the source', () => {
        const dockview = create({ closeEmptyGroups: false });
        const { g1, g2 } = twoGroups(dockview);
        dockview.moveGroupOrPanel({
            from: { groupId: g1.id, panelId: 'p1' },
            to: { group: g2, position: 'bottom' },
        });
        expect(dockview.groups).toContain(g1);
        // gap: the lone-panel fast path relocates g1 to the drop site instead
        // of leaving it in place and creating a new group (size stays 2)
        expect(dockview.size).toBe(2);
        expect(g1.panels.map((p) => p.id)).toEqual(['p1']);
    });

    test('moving a whole group (moveGroup) still removes nothing extra', () => {
        const dockview = create({ closeEmptyGroups: false });
        const { g1, g2 } = twoGroups(dockview);
        dockview.moveGroupOrPanel({
            from: { groupId: g1.id },
            to: { group: g2, position: 'center' },
        });
        // whole-group merge: g1's panels merge into g2 and g1 is gone (as today)
        console.log(
            'after whole-group merge, groups:',
            dockview.groups.map((g) => g.id),
            'g1 present:',
            dockview.groups.includes(g1)
        );
    });

    test('group.api.close() and api.removeGroup() still remove the group', () => {
        const dockview = create({ closeEmptyGroups: false });
        const { g1, g2 } = twoGroups(dockview);
        g1.api.close();
        expect(dockview.groups).not.toContain(g1);
        dockview.api.removeGroup(g2);
        expect(dockview.groups).not.toContain(g2);
        expect(dockview.size).toBe(0);
    });

    test('closeAllGroups(): what is left?', () => {
        const dockview = create({ closeEmptyGroups: false });
        twoGroups(dockview);
        dockview.closeAllGroups();
        console.log(
            'closeAllGroups -> groups left:',
            dockview.size,
            'panels left:',
            dockview.totalPanels
        );
    });

    test('clear() removes everything regardless', () => {
        const dockview = create({ closeEmptyGroups: false });
        twoGroups(dockview);
        dockview.clear();
        expect(dockview.size).toBe(0);
    });

    test('single group, noPanelsOverlay unset: last panel close keeps the group', () => {
        const dockview = create({ closeEmptyGroups: false });
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        const g1 = p1.group;
        p1.api.close();
        expect(dockview.groups).toContain(g1);
        expect(dockview.size).toBe(1);
        expect(g1.model.hasWatermark).toBe(true);
    });

    test('noPanelsOverlay emptyGroup + closeEmptyGroups true: unchanged', () => {
        const dockview = create({ noPanelsOverlay: 'emptyGroup' });
        const { p1, g1, p2, p3, g2 } = twoGroups(dockview);
        p1.api.close();
        expect(dockview.groups).not.toContain(g1);
        p2.api.close();
        p3.api.close();
        expect(dockview.groups).toContain(g2);
    });

    test('serialization round-trips an empty grid group', () => {
        const dockview = create({ closeEmptyGroups: false });
        const { p1, g1 } = twoGroups(dockview);
        p1.api.close();
        const json = dockview.toJSON();
        const restored = create({ closeEmptyGroups: false });
        restored.fromJSON(json);
        expect(restored.size).toBe(2);
        const emptyGroup = restored.getPanel(g1.id)!;
        expect(emptyGroup.panels).toHaveLength(0);
        expect(emptyGroup.model.hasWatermark).toBe(true);
    });

    test('floating group emptied by a move stays open', () => {
        const dockview = create({ closeEmptyGroups: false });
        const { p1, g2 } = twoGroups(dockview);
        dockview.addFloatingGroup(p1);
        const floating = p1.group;
        expect(floating.api.location.type).toBe('floating');
        expect(dockview.floatingGroups).toHaveLength(1);

        dockview.moveGroupOrPanel({
            from: { groupId: floating.id, panelId: 'p1' },
            to: { group: g2, position: 'center' },
        });

        console.log(
            'floating after empty -> still floating:',
            dockview.floatingGroups.length,
            'group present:',
            dockview.groups.includes(floating)
        );
        const json = dockview.toJSON();
        console.log(
            'serialized floatingGroups:',
            JSON.stringify(
                json.floatingGroups?.map((f) => ({
                    id: f.data.id,
                    views: f.data.views,
                }))
            )
        );
        const restored = create({ closeEmptyGroups: false });
        expect(() => restored.fromJSON(json)).not.toThrow();
        console.log(
            'restored floating groups:',
            restored.floatingGroups.length,
            'restored total groups:',
            restored.size
        );
    });

    test('floating a panel out of a group keeps the source group', () => {
        const dockview = create({ closeEmptyGroups: false });
        const { p1, g1 } = twoGroups(dockview);
        dockview.addFloatingGroup(p1);
        console.log(
            'after addFloatingGroup(panel): source g1 present:',
            dockview.groups.includes(g1),
            'size:',
            g1.panels.length
        );
    });

    test('popout group emptied by a move', async () => {
        window.open = () => setupMockWindow();
        const dockview = create({ closeEmptyGroups: false });
        const { p1, g1, g2 } = twoGroups(dockview);
        await dockview.addPopoutGroup(p1);
        const popoutGroup = p1.group;
        expect(popoutGroup.api.location.type).toBe('popout');
        console.log(
            'after addPopoutGroup(panel): source g1 present:',
            dockview.groups.includes(g1),
            'g1 panels:',
            g1.panels.length
        );

        dockview.moveGroupOrPanel({
            from: { groupId: popoutGroup.id, panelId: 'p1' },
            to: { group: g2, position: 'center' },
        });
        console.log(
            'popout after empty -> popouts:',
            dockview.getPopouts().length,
            'group present:',
            dockview.groups.includes(popoutGroup),
            'location:',
            popoutGroup.api.location.type
        );
        const json = dockview.toJSON();
        console.log(
            'serialized popoutGroups:',
            JSON.stringify(
                json.popoutGroups?.map((f) => ({
                    id: f.data.id,
                    views: f.data.views,
                }))
            )
        );
    });

    test('popout of a whole group then close window returns to hidden reference group', async () => {
        window.open = () => setupMockWindow();
        const dockview = create({ closeEmptyGroups: false });
        const { g1 } = twoGroups(dockview);
        await dockview.addPopoutGroup(g1);
        const popoutGroup = dockview.getPopouts()[0].group;
        // move the only panel out of the popout: popout group empty, hidden ref group empty
        dockview.moveGroupOrPanel({
            from: { groupId: popoutGroup.id, panelId: 'p1' },
            to: {
                group: dockview.getGroupPanel('p2')!.group,
                position: 'center',
            },
        });
        console.log(
            'whole-group popout emptied -> popouts:',
            dockview.getPopouts().length,
            'ref group present:',
            dockview.groups.includes(g1),
            'ref visible:',
            g1.api.isVisible
        );
    });

    test('edge groups: closing the last panel keeps the edge group as before', () => {
        const dockview = create({ closeEmptyGroups: true });
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        const p2 = dockview.addPanel({
            id: 'p2',
            component: 'default',
            position: { referencePanel: 'p1', direction: 'right' },
        });
        dockview.addEdgeGroup('left', { panel: p2 });
        const edge = p2.group;
        p2.api.close();
        console.log(
            'edge group after last panel close (default option): present:',
            dockview.groups.includes(edge)
        );
    });
});
