import {
    DockviewComponent,
    DockviewLayoutMutationKind,
} from '../../dockview/dockviewComponent';
import { IContentRenderer } from '../../dockview/types';

class TestPanel implements IContentRenderer {
    element = document.createElement('div');
    init(): void {
        // noop
    }
    layout(): void {
        // noop
    }
    dispose(): void {
        // noop
    }
}

/**
 * The onWillMutateLayout / onDidMutateLayout transaction boundary. Each
 * top-level structural mutation brackets once; compound operations (a move
 * that internally removes the source panel) bracket as a single transaction.
 */
describe('layout mutation events', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;
    let will: DockviewLayoutMutationKind[];
    let did: DockviewLayoutMutationKind[];

    beforeEach(() => {
        container = document.createElement('div');
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
        });
        dockview.layout(1000, 1000);
        will = [];
        did = [];
        dockview.onWillMutateLayout((e) => will.push(e.kind));
        dockview.onDidMutateLayout((e) => did.push(e.kind));
    });

    afterEach(() => dockview.dispose());

    test('addPanel brackets one "add" transaction', () => {
        dockview.addPanel({ id: 'p1', component: 'default' });
        expect(will).toEqual(['add']);
        expect(did).toEqual(['add']);
    });

    test('removePanel brackets one "remove" transaction', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        will.length = 0;
        did.length = 0;

        dockview.removePanel(p1);
        expect(will).toEqual(['remove']);
        expect(did).toEqual(['remove']);
    });

    test('a compound move fires once — nested removePanel does not double-fire', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        const p2 = dockview.addPanel({
            id: 'p2',
            component: 'default',
            position: { direction: 'right' },
        });
        will.length = 0;
        did.length = 0;

        dockview.moveGroupOrPanel({
            from: { groupId: p2.group.id, panelId: p2.id },
            to: { group: p1.group, position: 'center' },
        });

        // Exactly one 'move' — the source-group teardown inside the move must
        // not leak its own transaction (depth counter).
        expect(will).toEqual(['move']);
        expect(did).toEqual(['move']);
    });

    test('removeGroup brackets one "remove" transaction', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        will.length = 0;
        did.length = 0;

        dockview.removeGroup(p1.group);
        expect(will).toEqual(['remove']);
        expect(did).toEqual(['remove']);
    });

    test('addFloatingGroup brackets one "float" transaction', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({ id: 'p2', component: 'default' });
        will.length = 0;
        did.length = 0;

        dockview.addFloatingGroup(p1);
        expect(will).toEqual(['float']);
        expect(did).toEqual(['float']);
    });

    test('clear brackets one "clear" transaction', () => {
        dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({ id: 'p2', component: 'default' });
        will.length = 0;
        did.length = 0;

        dockview.clear();
        expect(will).toEqual(['clear']);
        expect(did).toEqual(['clear']);
    });

    test('fromJSON fires a single "load" transaction, not N nested adds', () => {
        dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({ id: 'p2', component: 'default' });
        dockview.addPanel({ id: 'p3', component: 'default' });
        const json = dockview.toJSON();
        will.length = 0;
        did.length = 0;

        dockview.fromJSON(json);
        expect(will).toEqual(['load']);
        expect(did).toEqual(['load']);
    });

    test('addGroup brackets one "add" transaction', () => {
        dockview.addGroup();
        expect(will).toEqual(['add']);
        expect(did).toEqual(['add']);
    });

    test('closeAllGroups brackets a single "remove" transaction', () => {
        dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({
            id: 'p2',
            component: 'default',
            position: { direction: 'right' },
        });
        will.length = 0;
        did.length = 0;

        // Multiple panels across multiple groups must collapse into one
        // transaction, not one-per-panel.
        dockview.closeAllGroups();
        expect(will).toEqual(['remove']);
        expect(did).toEqual(['remove']);
    });

    test('addEdgeGroup brackets one "add" transaction', () => {
        dockview.addEdgeGroup('left', { id: 'edge-left' });
        expect(will).toEqual(['add']);
        expect(did).toEqual(['add']);
    });

    test('removeEdgeGroup brackets a single "remove" transaction', () => {
        dockview.addEdgeGroup('left', { id: 'edge-left' });
        dockview.addPanel({
            id: 'p1',
            component: 'default',
            position: { referenceGroup: 'edge-left' },
        });
        dockview.addPanel({
            id: 'p2',
            component: 'default',
            position: { referenceGroup: 'edge-left' },
        });
        will.length = 0;
        did.length = 0;

        dockview.removeEdgeGroup('left');
        expect(will).toEqual(['remove']);
        expect(did).toEqual(['remove']);
    });

    test('maximizeGroup brackets one "maximize" transaction', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({
            id: 'p2',
            component: 'default',
            position: { direction: 'right' },
        });
        will.length = 0;
        did.length = 0;

        dockview.maximizeGroup(p1.group);
        expect(will).toEqual(['maximize']);
        expect(did).toEqual(['maximize']);
    });

    test('exitMaximizedGroup brackets one "maximize" transaction', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({
            id: 'p2',
            component: 'default',
            position: { direction: 'right' },
        });
        dockview.maximizeGroup(p1.group);
        will.length = 0;
        did.length = 0;

        dockview.exitMaximizedGroup();
        expect(will).toEqual(['maximize']);
        expect(did).toEqual(['maximize']);
    });

    test('maximize state survives a toJSON/fromJSON round-trip', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({
            id: 'p2',
            component: 'default',
            position: { direction: 'right' },
        });
        dockview.maximizeGroup(p1.group);
        expect(dockview.hasMaximizedGroup()).toBe(true);

        const json = dockview.toJSON();
        dockview.fromJSON(json);

        // Confirms the seam fires on a restorable state — undo/redo via
        // fromJSON can put the maximize back.
        expect(dockview.hasMaximizedGroup()).toBe(true);
    });

    describe('tab group mutations', () => {
        test('createTabGroup brackets one "tab-group" transaction', () => {
            const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
            will.length = 0;
            did.length = 0;

            dockview.api.createTabGroup({ groupId: p1.group.id });
            expect(will).toEqual(['tab-group']);
            expect(did).toEqual(['tab-group']);
        });

        test('addPanelToTabGroup brackets one "tab-group" transaction', () => {
            const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
            const tg = dockview.api.createTabGroup({ groupId: p1.group.id });
            will.length = 0;
            did.length = 0;

            dockview.api.addPanelToTabGroup({
                groupId: p1.group.id,
                tabGroupId: tg.id,
                panelId: 'p1',
            });
            expect(will).toEqual(['tab-group']);
            expect(did).toEqual(['tab-group']);
        });

        test('moving a panel between tab groups fires one "tab-group", not two', () => {
            const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
            const tg1 = dockview.api.createTabGroup({ groupId: p1.group.id });
            const tg2 = dockview.api.createTabGroup({ groupId: p1.group.id });
            dockview.api.addPanelToTabGroup({
                groupId: p1.group.id,
                tabGroupId: tg1.id,
                panelId: 'p1',
            });
            will.length = 0;
            did.length = 0;

            // The destination add internally removes p1 from tg1 first; that
            // nested removePanelFromTabGroup must not open its own transaction.
            dockview.api.addPanelToTabGroup({
                groupId: p1.group.id,
                tabGroupId: tg2.id,
                panelId: 'p1',
            });
            expect(will).toEqual(['tab-group']);
            expect(did).toEqual(['tab-group']);
        });

        test('an "already in this group" no-op fires nothing', () => {
            const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
            const tg = dockview.api.createTabGroup({ groupId: p1.group.id });
            dockview.api.addPanelToTabGroup({
                groupId: p1.group.id,
                tabGroupId: tg.id,
                panelId: 'p1',
            });
            will.length = 0;
            did.length = 0;

            dockview.api.addPanelToTabGroup({
                groupId: p1.group.id,
                tabGroupId: tg.id,
                panelId: 'p1',
            });
            expect(will).toEqual([]);
            expect(did).toEqual([]);
        });
    });

    test('onWillMutateLayout fires before onDidMutateLayout', () => {
        const order: string[] = [];
        dockview.onWillMutateLayout(() => order.push('will'));
        dockview.onDidMutateLayout(() => order.push('did'));

        dockview.addPanel({ id: 'p1', component: 'default' });
        expect(order).toEqual(['will', 'did']);
    });

    describe('mutation origin', () => {
        let origins: string[];

        beforeEach(() => {
            origins = [];
            dockview.onDidMutateLayout((e) => origins.push(e.origin));
        });

        test('a direct (component) mutation is tagged "user"', () => {
            // Driving the component directly models the DnD / tab-UI /
            // keyboard paths that never pass through the DockviewApi.
            dockview.addPanel({ id: 'p1', component: 'default' });
            expect(origins).toEqual(['user']);
        });

        test('a programmatic DockviewApi mutation is tagged "api"', () => {
            dockview.api.addPanel({ id: 'p1', component: 'default' });
            expect(origins).toEqual(['api']);
        });

        test('a programmatic tab-group mutation is tagged "api"', () => {
            const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
            origins.length = 0;

            dockview.api.createTabGroup({ groupId: p1.group.id });
            expect(origins).toEqual(['api']);
        });

        test('a compound api mutation stays "api" through nested teardown', () => {
            const p1 = dockview.api.addPanel({
                id: 'p1',
                component: 'default',
            });
            dockview.api.addPanel({
                id: 'p2',
                component: 'default',
                position: { direction: 'right' },
            });
            origins.length = 0;

            // Floating p1 brackets one 'float' transaction whose body removes
            // the source group (a nested mutation). The outer api origin must
            // survive — a nested call must not reset it to 'user'.
            dockview.api.addFloatingGroup(p1);
            expect(origins).toEqual(['api']);
        });

        test('origin restores to "user" after an api call completes', () => {
            dockview.api.addPanel({ id: 'p1', component: 'default' });
            dockview.addPanel({ id: 'p2', component: 'default' });
            expect(origins).toEqual(['api', 'user']);
            expect(dockview.currentOrigin()).toBe('user');
        });
    });
});
