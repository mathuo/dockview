import {
    DockviewComponent,
    DockviewBreakpointChangeEvent,
    IContentRenderer,
    LayoutPriority,
} from 'dockview-core';

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
 * ResponsiveLayout — Phase 1 (seam + skeleton). The module resolves the active
 * breakpoint from the container width (hysteresis + debounce) and fires
 * `onDidBreakpointChange`. No reflow transforms yet.
 *
 * Uses `debounceMs: 0` + `reflow()` for deterministic, synchronous resolution
 * (the debounce itself is unit-tested in `responsiveSizeObserver.spec.ts`).
 */
describe('ResponsiveLayout module', () => {
    let container: HTMLElement;

    const BREAKPOINTS = [
        { name: 'lg', maxWidth: Infinity },
        { name: 'md', maxWidth: 1000, exitAt: 1080 },
        { name: 'sm', maxWidth: 640, exitAt: 720 },
    ];

    const make = (responsive?: DockviewComponent['options']['responsive']) => {
        container = document.createElement('div');
        document.body.appendChild(container);
        return new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            responsive,
        });
    };

    afterEach(() => {
        container.remove();
    });

    test('resolves + fires onDidBreakpointChange as the container crosses breakpoints', () => {
        const dockview = make({ debounceMs: 0, breakpoints: BREAKPOINTS });

        const events: DockviewBreakpointChangeEvent[] = [];
        dockview.onDidBreakpointChange((e) => events.push(e));

        const at = (width: number): string | undefined => {
            dockview.layout(width, 500);
            dockview.reflow();
            return dockview.activeBreakpoint;
        };

        expect(at(1200)).toBe('lg');
        expect(at(800)).toBe('md');
        expect(at(500)).toBe('sm');

        // hysteresis: growing back into the dead band [640, 720] stays 'sm'
        expect(at(700)).toBe('sm');
        // and only expands at exitAt
        expect(at(720)).toBe('md');

        expect(events.map((e) => e.to)).toEqual(['lg', 'md', 'sm', 'md']);
        expect(events[0]).toMatchObject({ from: 'sm', to: 'lg', width: 1200 });
    });

    test('is inert when `responsive` is not configured', () => {
        const dockview = make();

        const events: DockviewBreakpointChangeEvent[] = [];
        dockview.onDidBreakpointChange((e) => events.push(e));

        dockview.layout(1200, 500);
        dockview.reflow();
        dockview.layout(400, 500);
        dockview.reflow();

        expect(dockview.activeBreakpoint).toBeUndefined();
        expect(events).toEqual([]);
    });

    test('is inert with an empty breakpoint set', () => {
        const dockview = make({ breakpoints: [] });
        dockview.layout(400, 500);
        dockview.reflow();
        expect(dockview.activeBreakpoint).toBeUndefined();
    });

    test('exposes the same surface through the public api', () => {
        const dockview = make({ debounceMs: 0, breakpoints: BREAKPOINTS });
        const api = dockview.api;

        const events: DockviewBreakpointChangeEvent[] = [];
        api.onDidBreakpointChange((e) => events.push(e));

        // baseline at construction (width 0) is already the narrowest ('sm'),
        // so widen to force a real change through the public surface
        dockview.layout(1200, 500);
        api.reflow();

        expect(api.activeBreakpoint).toBe('lg');
        expect(events.map((e) => e.to)).toEqual(['lg']);
    });

    // --- Phase 2: canonical / derived split + serialization ---

    test('toJSON round-trips unchanged with the module active (identity)', () => {
        const dockview = make({ debounceMs: 0, breakpoints: BREAKPOINTS });
        dockview.layout(1000, 500);
        dockview.api.addPanel({ id: 'p1', component: 'default' });
        dockview.api.addPanel({
            id: 'p2',
            component: 'default',
            position: { direction: 'right' },
        });

        // drive a couple of breakpoint changes — the derived layout is identity,
        // so nothing collapses and the serialized layout is unaffected
        dockview.layout(500, 500);
        dockview.reflow();
        dockview.layout(1200, 500);
        dockview.reflow();

        const saved = dockview.toJSON();

        const restored = make({ debounceMs: 0, breakpoints: BREAKPOINTS });
        restored.layout(1200, 500);
        restored.fromJSON(saved);

        expect(restored.panels.map((p) => p.id).sort()).toEqual(['p1', 'p2']);
        // and re-serializing the restored layout matches the saved one
        expect(JSON.stringify(restored.toJSON())).toBe(JSON.stringify(saved));
    });

    test('serialization is idempotent across a breakpoint sweep', () => {
        const dockview = make({ debounceMs: 0, breakpoints: BREAKPOINTS });
        dockview.layout(1000, 500);
        dockview.api.addPanel({ id: 'p1', component: 'default' });
        dockview.api.addPanel({
            id: 'p2',
            component: 'default',
            position: { direction: 'below' },
        });

        dockview.layout(1200, 500);
        dockview.reflow();
        const before = JSON.stringify(dockview.toJSON());

        // sweep down and back up — identity reflow must not mutate the layout
        for (const w of [800, 500, 700, 720, 1200]) {
            dockview.layout(w, 500);
            dockview.reflow();
        }

        const after = JSON.stringify(dockview.toJSON());
        expect(after).toBe(before);
    });

    test('serializeCanonical returns undefined while not collapsed (Phase 2)', () => {
        const dockview = make({ debounceMs: 0, breakpoints: BREAKPOINTS });
        dockview.layout(500, 500);
        dockview.reflow();
        // the toJSON hook falls back to the live tree — identical to a component
        // without the responsive option configured
        const withResponsive = JSON.stringify(dockview.toJSON());

        const plain = make();
        plain.layout(500, 500);
        expect(JSON.stringify(plain.toJSON())).toBe(withResponsive);
    });

    // --- Phase 4: applying the derived layout to the live component ---

    describe('apply (collapse reaches the live layout)', () => {
        // 'sm' collapses side-by-side groups to tabs; 'lg' is canonical (identity)
        const COLLAPSE_BP = [
            { name: 'lg', maxWidth: Infinity },
            {
                name: 'sm',
                maxWidth: 640,
                exitAt: 720,
                rules: [{ kind: 'collapseToTabs' as const }],
            },
        ];

        const withThreeGroups = () => {
            const dv = make({ debounceMs: 0, breakpoints: COLLAPSE_BP });
            dv.layout(1000, 500);
            const p1 = dv.api.addPanel({ id: 'p1', component: 'default' });
            dv.api.addPanel({
                id: 'p2',
                component: 'default',
                position: { direction: 'right' },
            });
            dv.api.addPanel({
                id: 'p3',
                component: 'default',
                position: { direction: 'right' },
            });
            dv.reflow();
            return { dv, p1 };
        };

        test('collapses side-by-side groups into one on narrow, restores on wide', () => {
            const { dv } = withThreeGroups();
            expect(dv.activeBreakpoint).toBe('lg');
            expect(dv.groups.length).toBe(3);

            dv.layout(500, 500);
            dv.reflow();
            expect(dv.activeBreakpoint).toBe('sm');
            expect(dv.groups.length).toBe(1);
            expect(dv.groups[0].panels.map((p) => p.id).sort()).toEqual([
                'p1',
                'p2',
                'p3',
            ]);

            dv.layout(1000, 500);
            dv.reflow();
            expect(dv.activeBreakpoint).toBe('lg');
            expect(dv.groups.length).toBe(3);
        });

        test('reuses panel instances across a collapse (no teardown)', () => {
            const { dv, p1 } = withThreeGroups();
            dv.layout(500, 500);
            dv.reflow();
            expect(dv.api.getPanel('p1')).toBe(p1);
        });

        test('serializes the canonical (wide) layout while collapsed', () => {
            const { dv } = withThreeGroups();
            dv.layout(500, 500);
            dv.reflow();
            expect(dv.groups.length).toBe(1); // collapsed live

            const saved = dv.toJSON();

            // loading the save into a fresh wide component restores 3 groups —
            // proving the *wide* canonical was serialized, not the collapse
            const restored = make({ debounceMs: 0, breakpoints: COLLAPSE_BP });
            restored.layout(1000, 500);
            restored.fromJSON(saved);
            restored.reflow();
            expect(restored.groups.length).toBe(3);
        });

        test('fires one breakpoint-change event per transition (no re-entrant reflow)', () => {
            const { dv } = withThreeGroups();
            const events: string[] = [];
            dv.onDidBreakpointChange((e) => events.push(e.to));

            dv.layout(500, 500);
            dv.reflow();
            dv.layout(1000, 500);
            dv.reflow();

            expect(events).toEqual(['sm', 'lg']);
        });

        test('defers reflow while a group is maximized, then applies on restore', () => {
            const { dv, p1 } = withThreeGroups();

            p1.api.group.api.maximize();
            dv.layout(500, 500);
            dv.reflow();
            expect(dv.groups.length).toBe(3); // deferred — not collapsed

            dv.exitMaximizedGroup();
            dv.reflow();
            expect(dv.groups.length).toBe(1); // now applied
        });

        test('restack applies to the live layout without losing panels', () => {
            const dv = make({
                debounceMs: 0,
                breakpoints: [
                    { name: 'lg', maxWidth: Infinity },
                    {
                        name: 'sm',
                        maxWidth: 640,
                        exitAt: 720,
                        rules: [{ kind: 'restack' as const }],
                    },
                ],
            });
            dv.layout(1000, 500);
            dv.api.addPanel({ id: 'p1', component: 'default' });
            dv.api.addPanel({
                id: 'p2',
                component: 'default',
                position: { direction: 'below' },
            });
            dv.reflow();

            dv.layout(500, 500);
            dv.reflow(); // restack
            expect(dv.api.panels.map((p) => p.id).sort()).toEqual(['p1', 'p2']);

            dv.layout(1000, 500);
            dv.reflow(); // widen — restore
            expect(dv.api.panels.map((p) => p.id).sort()).toEqual(['p1', 'p2']);
        });

        // --- Phase 6: rebase edits made while collapsed ---

        test('auto-rebase: closing a tab while collapsed keeps it gone after widening', () => {
            const { dv } = withThreeGroups();
            dv.layout(500, 500);
            dv.reflow(); // collapse to 1 group (p1,p2,p3)
            expect(dv.groups.length).toBe(1);

            // close p2 while collapsed
            dv.api.removePanel(dv.api.getPanel('p2')!);

            dv.layout(1000, 500);
            dv.reflow(); // widen — canonical was rebased, so p2 stays gone
            expect(dv.api.panels.map((p) => p.id).sort()).toEqual(['p1', 'p3']);
        });

        test('auto-rebase: a panel added while collapsed survives widening', () => {
            const { dv } = withThreeGroups();
            dv.layout(500, 500);
            dv.reflow();

            dv.api.addPanel({ id: 'p4', component: 'default' }); // into the collapsed group

            dv.layout(1000, 500);
            dv.reflow();
            expect(dv.api.panels.map((p) => p.id).sort()).toEqual([
                'p1',
                'p2',
                'p3',
                'p4',
            ]);
        });

        test('rebase:discard drops edits made while collapsed', () => {
            const dv = make({
                debounceMs: 0,
                rebase: 'discard',
                breakpoints: COLLAPSE_BP,
            });
            dv.layout(1000, 500);
            dv.api.addPanel({ id: 'p1', component: 'default' });
            dv.api.addPanel({
                id: 'p2',
                component: 'default',
                position: { direction: 'right' },
            });
            dv.reflow();

            dv.layout(500, 500);
            dv.reflow(); // collapse
            dv.api.removePanel(dv.api.getPanel('p2')!); // close while collapsed

            dv.layout(1000, 500);
            dv.reflow(); // widen — discard restores the frozen (pre-edit) canonical
            expect(dv.api.panels.map((p) => p.id).sort()).toEqual(['p1', 'p2']);
        });

        test('rebase:manual fires onDidRebaseConflict instead of rebasing', () => {
            const dv = make({
                debounceMs: 0,
                rebase: 'manual',
                breakpoints: COLLAPSE_BP,
            });
            dv.layout(1000, 500);
            dv.api.addPanel({ id: 'p1', component: 'default' });
            dv.api.addPanel({
                id: 'p2',
                component: 'default',
                position: { direction: 'right' },
            });
            dv.reflow();

            const conflicts: { reason: string }[] = [];
            dv.onDidRebaseConflict((e) => conflicts.push(e));

            dv.layout(500, 500);
            dv.reflow(); // collapse
            dv.api.removePanel(dv.api.getPanel('p2')!); // edit while collapsed

            expect(conflicts.length).toBeGreaterThan(0);
        });

        test('hide parks a low-priority group but keeps its panel alive', () => {
            const dv = make({
                debounceMs: 0,
                breakpoints: [
                    { name: 'lg', maxWidth: Infinity },
                    {
                        name: 'sm',
                        maxWidth: 640,
                        exitAt: 720,
                        rules: [{ kind: 'hide' as const }],
                    },
                ],
            });
            dv.layout(1000, 500);
            dv.api.addPanel({ id: 'p1', component: 'default' });
            const p2 = dv.api.addPanel({
                id: 'p2',
                component: 'default',
                position: { direction: 'right' },
            });
            // mark p2's group low-priority so `hide` parks it
            p2.api.group.api.priority = LayoutPriority.Low;
            dv.reflow();

            dv.layout(500, 500);
            dv.reflow(); // hide

            // the panel survives (parked, not destroyed)
            expect(dv.api.getPanel('p2')).toBeDefined();
            expect(dv.api.panels.map((p) => p.id).sort()).toEqual(['p1', 'p2']);

            dv.layout(1000, 500);
            dv.reflow(); // widen — restore
            expect(dv.api.panels.map((p) => p.id).sort()).toEqual(['p1', 'p2']);
        });
    });
});
