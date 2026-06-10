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

    test('onWillMutateLayout fires before onDidMutateLayout', () => {
        const order: string[] = [];
        dockview.onWillMutateLayout(() => order.push('will'));
        dockview.onDidMutateLayout(() => order.push('did'));

        dockview.addPanel({ id: 'p1', component: 'default' });
        expect(order).toEqual(['will', 'did']);
    });
});
