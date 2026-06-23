import { DockviewComponent } from '../../dockview/dockviewComponent';
import { IContentRenderer } from '../../dockview/types';
import {
    LayoutHistoryChangeEvent,
    LayoutHistoryService,
    ILayoutHistoryHost,
} from '../../dockview/layoutHistoryService';
import { Emitter } from '../../events';
import {
    DockviewLayoutMutationEvent,
    SerializedDockview,
} from '../../dockview/dockviewComponent';
import {
    DockviewComponentOptions,
    LayoutHistoryOptions,
} from '../../dockview/options';

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

/**
 * Resize coalescing (Phase C). Sash resize has no mutation boundary, so it's
 * caught off the coalesced `onDidLayoutChange` ping with a lazy pre-image and
 * debounced into one entry. Driven against a fake host with fake timers so the
 * algorithm is deterministic (no real layout / microtask timing).
 */
describe('LayoutHistory resize coalescing', () => {
    interface FakeHost extends ILayoutHistoryHost {
        will: Emitter<DockviewLayoutMutationEvent>;
        did: Emitter<DockviewLayoutMutationEvent>;
        layout: Emitter<void>;
        snapshot: number; // stands in for the layout state
        setOptions(o: LayoutHistoryOptions): void;
    }

    const makeHost = (
        layoutHistory: LayoutHistoryOptions = { enabled: true }
    ): FakeHost => {
        const will = new Emitter<DockviewLayoutMutationEvent>();
        const did = new Emitter<DockviewLayoutMutationEvent>();
        const layout = new Emitter<void>();
        let opts: LayoutHistoryOptions = layoutHistory;
        const host: FakeHost = {
            will,
            did,
            layout,
            snapshot: 0,
            get options(): DockviewComponentOptions {
                return { layoutHistory: opts } as DockviewComponentOptions;
            },
            toJSON(): SerializedDockview {
                return { n: host.snapshot } as unknown as SerializedDockview;
            },
            fromJSON(data: SerializedDockview): void {
                host.snapshot = (data as unknown as { n: number }).n;
            },
            onWillMutateLayout: will.event,
            onDidMutateLayout: did.event,
            onDidLayoutChange: layout.event,
            setOptions(o: LayoutHistoryOptions): void {
                opts = o;
            },
        };
        return host;
    };

    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    /** Fire the initial settle so a baseline exists, like the first real layout. */
    const seed = (h: FakeHost): void => {
        h.snapshot = 0;
        h.layout.fire();
    };

    test('coalesces a continuous resize drag into one entry', () => {
        const h = makeHost({ enabled: true, coalesceMs: 400 });
        const svc = new LayoutHistoryService(h);
        seed(h);

        // a "drag" — several pings, each a slightly different layout
        h.snapshot = 1;
        h.layout.fire();
        h.snapshot = 2;
        h.layout.fire();
        h.snapshot = 3;
        h.layout.fire();
        expect(svc.canUndo).toBe(false); // not finalized while the drag is live

        jest.advanceTimersByTime(400);
        expect(svc.canUndo).toBe(true); // exactly one entry for the whole drag

        svc.undo(); // restores the pre-drag baseline (0), not an intermediate
        expect(h.snapshot).toBe(0);
        svc.redo();
        expect(h.snapshot).toBe(3);

        svc.dispose();
    });

    test('a discrete mutation finalizes the pending resize first (no fold)', () => {
        const h = makeHost({ enabled: true, coalesceMs: 400 });
        const svc = new LayoutHistoryService(h);
        seed(h);

        h.snapshot = 1;
        h.layout.fire(); // open a resize run (before=0)

        // a discrete close arrives mid-window — must close the resize run first
        h.will.fire({ kind: 'remove', origin: 'user' });
        h.snapshot = 2;
        h.did.fire({ kind: 'remove', origin: 'user' });

        // two distinct steps: the resize (0→1) and the remove (1→2)
        svc.undo();
        expect(h.snapshot).toBe(1); // undo the remove
        svc.undo();
        expect(h.snapshot).toBe(0); // undo the resize
        expect(svc.canUndo).toBe(false);

        svc.dispose();
    });

    test('a resize that nets no change is not recorded', () => {
        const h = makeHost({ enabled: true, coalesceMs: 400 });
        const svc = new LayoutHistoryService(h);
        seed(h);

        h.snapshot = 1;
        h.layout.fire();
        h.snapshot = 0; // dragged back to where it started
        h.layout.fire();
        jest.advanceTimersByTime(400);

        expect(svc.canUndo).toBe(false);

        svc.dispose();
    });

    test('the mutation settle ping does not start a resize run', () => {
        const h = makeHost({ enabled: true });
        const svc = new LayoutHistoryService(h);
        seed(h);

        // a discrete mutation, then its trailing layout ping (the settle)
        h.will.fire({ kind: 'add', origin: 'user' });
        h.snapshot = 1;
        h.did.fire({ kind: 'add', origin: 'user' });
        h.layout.fire(); // settle — must NOT open a resize run
        jest.advanceTimersByTime(1000);

        // only the discrete add is recorded
        svc.undo();
        expect(h.snapshot).toBe(0);
        expect(svc.canUndo).toBe(false);

        svc.dispose();
    });

    test('recordResize:false ignores resize pings', () => {
        const h = makeHost({ enabled: true, recordResize: false });
        const svc = new LayoutHistoryService(h);
        seed(h);

        h.snapshot = 1;
        h.layout.fire();
        h.snapshot = 2;
        h.layout.fire();
        jest.advanceTimersByTime(1000);

        expect(svc.canUndo).toBe(false);

        svc.dispose();
    });
});
