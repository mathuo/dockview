import { DockviewComponent } from '../../dockview/dockviewComponent';
import { IContentRenderer } from '../../dockview/types';
import { setupMockWindow } from '../__mocks__/mockWindow';
import { AllModules } from '../../dockview/allModules';

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
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('closeEmptyGroups popout edge cases', () => {
    const originalOpen = window.open;
    beforeEach(() => {
        window.open = () => setupMockWindow();
    });
    afterEach(() => {
        window.open = originalOpen;
    });

    for (const closeEmptyGroups of [true, false]) {
        test(`baseline popout of a lone panel, closeEmptyGroups=${closeEmptyGroups}`, async () => {
            const dockview = create({ closeEmptyGroups });
            const { p1, g1 } = twoGroups(dockview);
            await dockview.addPopoutGroup(p1);
            console.log(
                `[${closeEmptyGroups}] popout(panel): source g1 present:`,
                dockview.groups.includes(g1),
                'visible:',
                g1.api.isVisible,
                'grid groups:',
                dockview.groups.filter((g) => g.api.location.type === 'grid')
                    .length
            );
        });
    }

    test('popout(panel) then move the panel back: what happens to the popout and the source', async () => {
        const dockview = create({ closeEmptyGroups: false });
        const { p1, g1, g2 } = twoGroups(dockview);
        await dockview.addPopoutGroup(p1);
        const pg = p1.group;
        dockview.moveGroupOrPanel({
            from: { groupId: pg.id, panelId: 'p1' },
            to: { group: g2, position: 'center' },
        });
        console.log(
            'popouts:',
            dockview.getPopouts().length,
            'popout group present:',
            dockview.groups.includes(pg),
            'g1 present:',
            dockview.groups.includes(g1)
        );
    });

    test('empty popout restores from JSON', async () => {
        const dockview = create({ closeEmptyGroups: false });
        const { p1, g2 } = twoGroups(dockview);
        await dockview.addPopoutGroup(p1);
        const pg = p1.group;
        dockview.moveGroupOrPanel({
            from: { groupId: pg.id, panelId: 'p1' },
            to: { group: g2, position: 'center' },
        });
        const json = dockview.toJSON();
        const restored = create({ closeEmptyGroups: false });
        expect(() => restored.fromJSON(json)).not.toThrow();
        for (let i = 0; i < 50 && restored.getPopouts().length === 0; i++)
            await tick();
        console.log(
            'restored popouts:',
            restored.getPopouts().length,
            'restored groups:',
            restored.groups.map(
                (g) => `${g.id}:${g.api.location.type}:${g.panels.length}`
            )
        );
    });

    test('user closes the window of an emptied popout', async () => {
        const dockview = create({ closeEmptyGroups: false });
        const { p1, g2 } = twoGroups(dockview);
        await dockview.addPopoutGroup(p1);
        const pg = p1.group;
        dockview.moveGroupOrPanel({
            from: { groupId: pg.id, panelId: 'p1' },
            to: { group: g2, position: 'center' },
        });
        const removed: string[] = [];
        dockview.onDidRemovePopoutGroup((e) => removed.push(e.id));
        expect(() => dockview.getPopouts()[0].window.close()).not.toThrow();
        console.log(
            'after window close: popouts:',
            dockview.getPopouts().length,
            'removed events:',
            removed,
            'groups:',
            dockview.groups.map(
                (g) =>
                    `${g.id}:${g.api.location.type}:${g.panels.length}:vis=${g.api.isVisible}`
            )
        );
    });

    test('whole-group popout emptied then window closed: hidden reference group fate', async () => {
        const dockview = create({ closeEmptyGroups: false });
        const { g1, g2 } = twoGroups(dockview);
        await dockview.addPopoutGroup(g1);
        const pg = dockview.getPopouts()[0].group;
        dockview.moveGroupOrPanel({
            from: { groupId: pg.id, panelId: 'p1' },
            to: { group: g2, position: 'center' },
        });
        dockview.getPopouts()[0].window.close();
        console.log(
            'after window close: groups:',
            dockview.groups.map(
                (g) =>
                    `${g.id}:${g.api.location.type}:${g.panels.length}:vis=${g.api.isVisible}`
            )
        );
    });

    test('whole-group popout emptied then popout group closed via api', async () => {
        const dockview = create({ closeEmptyGroups: false });
        const { g1, g2 } = twoGroups(dockview);
        await dockview.addPopoutGroup(g1);
        const pg = dockview.getPopouts()[0].group;
        dockview.moveGroupOrPanel({
            from: { groupId: pg.id, panelId: 'p1' },
            to: { group: g2, position: 'center' },
        });
        pg.api.close();
        console.log(
            'after group.api.close(): groups:',
            dockview.groups.map(
                (g) =>
                    `${g.id}:${g.api.location.type}:${g.panels.length}:vis=${g.api.isVisible}`
            ),
            'g1 present:',
            dockview.groups.includes(g1)
        );
    });

    test('lone panel dragged from grid into a popout window group', async () => {
        const dockview = create({ closeEmptyGroups: false });
        const { p1, g1, p2 } = twoGroups(dockview);
        await dockview.addPopoutGroup(p2);
        const pg = p2.group;
        dockview.moveGroupOrPanel({
            from: { groupId: g1.id, panelId: 'p1' },
            to: { group: pg, position: 'center' },
        });
        console.log(
            'grid source after move into popout: g1 present:',
            dockview.groups.includes(g1),
            'panels:',
            g1.panels.length
        );
    });

    test('lone panel dragged to edge of popout group (cross-gridview)', async () => {
        const dockview = create({ closeEmptyGroups: false });
        const { p1, g1, p2 } = twoGroups(dockview);
        await dockview.addPopoutGroup(p2);
        const pg = p2.group;
        dockview.moveGroupOrPanel({
            from: { groupId: g1.id, panelId: 'p1' },
            to: { group: pg, position: 'right' },
        });
        console.log(
            'grid source after edge move into popout: g1 present:',
            dockview.groups.includes(g1),
            'g1 location:',
            g1.api.location.type
        );
    });

    test('undo of a last-panel close restores the panel into the kept group', () => {
        const dockview = create({
            closeEmptyGroups: false,
            layoutHistory: { enabled: true },
            modules: AllModules,
        });
        const { p1, g1 } = twoGroups(dockview);
        p1.api.close();
        expect(dockview.groups).toContain(g1);
        dockview.api.undo();
        console.log(
            'after undo: groups:',
            dockview.groups.map(
                (g) => `${g.id}:[${g.panels.map((p) => p.id)}]`
            ),
            'g1 still present (same instance):',
            dockview.groups.includes(g1),
            'size:',
            dockview.size
        );
        dockview.api.redo();
        console.log(
            'after redo: groups:',
            dockview.groups.map(
                (g) => `${g.id}:[${g.panels.map((p) => p.id)}]`
            ),
            'size:',
            dockview.size
        );
    });

    test('undo of a DnD move out of a kept group', () => {
        const dockview = create({
            closeEmptyGroups: false,
            layoutHistory: { enabled: true },
            modules: AllModules,
        });
        const { g1, g2 } = twoGroups(dockview);
        dockview.moveGroupOrPanel({
            from: { groupId: g1.id, panelId: 'p1' },
            to: { group: g2, position: 'center' },
        });
        dockview.api.undo();
        console.log(
            'after undo move: groups:',
            dockview.groups.map(
                (g) => `${g.id}:[${g.panels.map((p) => p.id)}]`
            ),
            'size:',
            dockview.size
        );
    });
});
