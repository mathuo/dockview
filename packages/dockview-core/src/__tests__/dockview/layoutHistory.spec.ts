import { DockviewComponent } from '../../dockview/dockviewComponent';
import { IContentRenderer } from '../../dockview/types';
import { LayoutHistoryChangeEvent } from '../../dockview/layoutHistoryService';

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
 * LayoutHistory (Phase B) — snapshot-based undo/redo of discrete layout
 * mutations. Opt-in via `layoutHistory.enabled`. Only user-originated mutations
 * are recorded by default; `undoableProgrammaticMutations` opts api calls in.
 */
describe('LayoutHistory undo/redo', () => {
    let container: HTMLElement;

    const make = (
        layoutHistory: DockviewComponent['options']['layoutHistory']
    ): DockviewComponent => {
        container = document.createElement('div');
        document.body.appendChild(container);
        const dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            layoutHistory,
        });
        dockview.layout(800, 600);
        return dockview;
    };

    const ids = (d: DockviewComponent): string[] =>
        d.panels.map((p) => p.id).sort();

    afterEach(() => {
        container.remove();
    });

    test('records a user add and undoes / redoes it', () => {
        const d = make({ enabled: true });
        d.addPanel({ id: 'p1', component: 'default' });
        d.addPanel({ id: 'p2', component: 'default' });

        expect(ids(d)).toEqual(['p1', 'p2']);
        expect(d.canUndo).toBe(true);
        expect(d.canRedo).toBe(false);

        d.undo(); // removes p2
        expect(ids(d)).toEqual(['p1']);
        expect(d.canRedo).toBe(true);

        d.redo(); // re-adds p2
        expect(ids(d)).toEqual(['p1', 'p2']);

        d.dispose();
    });

    test('undo-close restores the panel title and params', () => {
        const d = make({ enabled: true });
        d.addPanel({
            id: 'chart',
            component: 'default',
            title: 'My Chart',
            params: { zoom: 3 },
        });
        const p2 = d.addPanel({ id: 'other', component: 'default' });
        // close `chart` via its api (a user gesture path on the component)
        d.removePanel(d.panels.find((p) => p.id === 'chart')!);
        expect(ids(d)).toEqual(['other']);

        d.undo(); // brings chart back from the snapshot
        const restored = d.panels.find((p) => p.id === 'chart');
        expect(restored).toBeTruthy();
        expect(restored!.title).toBe('My Chart');
        expect(restored!.params).toEqual({ zoom: 3 });

        void p2;
        d.dispose();
    });

    test('a new mutation after undo clears the redo stack', () => {
        const d = make({ enabled: true });
        d.addPanel({ id: 'p1', component: 'default' });
        d.addPanel({ id: 'p2', component: 'default' });
        d.undo(); // redo now available
        expect(d.canRedo).toBe(true);

        d.addPanel({ id: 'p3', component: 'default' }); // new branch
        expect(d.canRedo).toBe(false);

        d.dispose();
    });

    test('respects the depth limit (oldest evicted)', () => {
        const d = make({ enabled: true, depth: 2 });
        d.addPanel({ id: 'p1', component: 'default' });
        d.addPanel({ id: 'p2', component: 'default' });
        d.addPanel({ id: 'p3', component: 'default' }); // evicts the p1-add entry

        // Only two undo steps are retained.
        d.undo();
        d.undo();
        expect(d.canUndo).toBe(false);

        d.dispose();
    });

    test('undo/redo apply does not itself record (no re-entrancy)', () => {
        const d = make({ enabled: true });
        d.addPanel({ id: 'p1', component: 'default' });
        d.addPanel({ id: 'p2', component: 'default' });

        // One undoable step remains after undoing the p2 add (the p1 add).
        d.undo();
        expect(d.canUndo).toBe(true);
        d.undo();
        expect(d.canUndo).toBe(false);
        // The undo applies never pushed new entries onto the redo beyond the
        // two real ones.
        expect(d.canRedo).toBe(true);
        d.redo();
        d.redo();
        expect(d.canRedo).toBe(false);

        d.dispose();
    });

    test('programmatic (api-origin) mutations are excluded by default', () => {
        const d = make({ enabled: true });
        // api-origin mutation — should not enter the user undo stack
        d.withOrigin('api', () =>
            d.addPanel({ id: 'p1', component: 'default' })
        );
        expect(d.canUndo).toBe(false);

        // user-origin mutation — recorded
        d.addPanel({ id: 'p2', component: 'default' });
        expect(d.canUndo).toBe(true);

        d.dispose();
    });

    test('undoableProgrammaticMutations records api-origin mutations', () => {
        const d = make({ enabled: true, undoableProgrammaticMutations: true });
        d.withOrigin('api', () =>
            d.addPanel({ id: 'p1', component: 'default' })
        );
        expect(d.canUndo).toBe(true);

        d.dispose();
    });

    test('records nothing when disabled (default)', () => {
        const d = make(undefined);
        d.addPanel({ id: 'p1', component: 'default' });
        expect(d.canUndo).toBe(false);
        d.undo(); // no-op, no throw
        expect(ids(d)).toEqual(['p1']);

        d.dispose();
    });

    test('an external fromJSON clears the history', () => {
        const d = make({ enabled: true });
        d.addPanel({ id: 'p1', component: 'default' });
        expect(d.canUndo).toBe(true);

        d.fromJSON(d.toJSON()); // bulk 'load' → clears
        expect(d.canUndo).toBe(false);
        expect(d.canRedo).toBe(false);

        d.dispose();
    });

    test('fires onDidChangeHistory with counts and last entry', () => {
        const d = make({ enabled: true });
        const events: LayoutHistoryChangeEvent[] = [];
        const sub = d.onDidChangeHistory((e) => events.push(e));

        d.addPanel({ id: 'p1', component: 'default' });
        expect(events.length).toBeGreaterThan(0);
        const last = events[events.length - 1];
        expect(last.canUndo).toBe(true);
        expect(last.undoCount).toBe(1);
        expect(last.lastEntry?.kind).toBe('add');
        expect(last.lastEntry?.origin).toBe('user');

        sub.dispose();
        d.dispose();
    });

    test('clearHistory drops both stacks', () => {
        const d = make({ enabled: true });
        d.addPanel({ id: 'p1', component: 'default' });
        d.addPanel({ id: 'p2', component: 'default' });
        d.undo();
        expect(d.canUndo).toBe(true);
        expect(d.canRedo).toBe(true);

        d.clearHistory();
        expect(d.canUndo).toBe(false);
        expect(d.canRedo).toBe(false);

        d.dispose();
    });
});
