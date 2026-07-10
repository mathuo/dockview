import { DockviewComponent } from 'dockview-core';
import { IContentRenderer } from 'dockview-core';

class TestPanel implements IContentRenderer {
    element = document.createElement('div');
    constructor() {
        this.element.className = 'dv-test-content';
    }
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

const WRAP_CLASS = 'dv-tabs-container--wrap';
const CAPPED_CLASS = 'dv-tabs-container--wrap-capped';
const MAX_ROWS_VAR = '--dv-max-tab-rows';

/**
 * jsdom has no layout, so every tab reports `offsetTop` 0. Stamp synthetic row
 * offsets onto the tab elements (in DOM = insertion order) so the controller's
 * `offsetTop`-bucketed row count / surplus computation can be exercised without
 * real geometry. `tops[i]` is the row offset for the i-th tab.
 */
function stampRows(list: HTMLElement, tops: number[]): void {
    list.querySelectorAll<HTMLElement>('.dv-tab').forEach((el, i) => {
        Object.defineProperty(el, 'offsetTop', {
            configurable: true,
            value: tops[i] ?? 0,
        });
    });
}

/**
 * Multi-row (wrapping) tabs — Phase 2 (wrap render mode). The module toggles the
 * `.dv-tabs-container--wrap` class on a group's tab list and relayouts on
 * row-count change. The actual wrapping geometry (rows, header growth, content
 * shrink) is e2e-only — jsdom has no layout — so these tests cover the
 * deterministic wiring: class application, gating, and cleanup.
 */
describe('multi-row tabs (wrap mode)', () => {
    let container: HTMLElement;

    const make = (
        overflow?: DockviewComponent['options']['overflow']
    ): DockviewComponent => {
        container = document.createElement('div');
        document.body.appendChild(container);
        const dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            overflow,
        });
        dockview.layout(1000, 1000);
        return dockview;
    };

    afterEach(() => {
        container?.remove();
    });

    test("wrap mode applies the wrap class to a group's tab list", () => {
        const dockview = make({ mode: 'wrap' });
        const panel = dockview.addPanel({ id: 'a', component: 'default' });

        expect(
            panel.group.model.tabsListElement.classList.contains(WRAP_CLASS)
        ).toBe(true);

        dockview.dispose();
    });

    test('default (no overflow) leaves the strip single-row — no wrap class', () => {
        const dockview = make();
        const panel = dockview.addPanel({ id: 'a', component: 'default' });

        expect(
            panel.group.model.tabsListElement.classList.contains(WRAP_CLASS)
        ).toBe(false);

        dockview.dispose();
    });

    test("mode: 'dropdown' leaves the strip single-row — no wrap class", () => {
        const dockview = make({ mode: 'dropdown' });
        const panel = dockview.addPanel({ id: 'a', component: 'default' });

        expect(
            panel.group.model.tabsListElement.classList.contains(WRAP_CLASS)
        ).toBe(false);

        dockview.dispose();
    });

    test('wrap is a no-op on a vertical header (v1)', () => {
        container = document.createElement('div');
        document.body.appendChild(container);
        const dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            overflow: { mode: 'wrap' },
            // groups are created with a vertical header
            defaultHeaderPosition: 'left',
        });
        dockview.layout(1000, 1000);

        const panel = dockview.addPanel({ id: 'a', component: 'default' });

        expect(
            panel.group.model.tabsListElement.classList.contains(
                'dv-tabs-container-vertical'
            )
        ).toBe(true);
        expect(
            panel.group.model.tabsListElement.classList.contains(WRAP_CLASS)
        ).toBe(false);

        dockview.dispose();
    });

    test('wrap relayouts the group when first applied', () => {
        const dockview = make({ mode: 'wrap' });
        const group = dockview.addGroup();
        const spy = jest.spyOn(group, 'relayout');

        dockview.addPanel({
            id: 'a',
            component: 'default',
            position: { referenceGroup: group },
        });

        expect(spy).toHaveBeenCalled();

        dockview.dispose();
    });

    test('a runtime overflow.mode change is applied to existing groups', () => {
        const dockview = make(); // starts as dropdown (no wrap)
        const panel = dockview.addPanel({ id: 'a', component: 'default' });
        const list = panel.group.model.tabsListElement;
        expect(list.classList.contains(WRAP_CLASS)).toBe(false);

        // turn wrap on at runtime
        dockview.updateOptions({ overflow: { mode: 'wrap' } });
        expect(list.classList.contains(WRAP_CLASS)).toBe(true);

        // ...and back off
        dockview.updateOptions({ overflow: { mode: 'dropdown' } });
        expect(list.classList.contains(WRAP_CLASS)).toBe(false);

        dockview.dispose();
    });

    test('maxRows adds the capped class and the --dv-max-tab-rows var', () => {
        const dockview = make({ mode: 'wrap', maxRows: 3 });
        const panel = dockview.addPanel({ id: 'a', component: 'default' });
        const list = panel.group.model.tabsListElement;

        expect(list.classList.contains(CAPPED_CLASS)).toBe(true);
        expect(list.style.getPropertyValue(MAX_ROWS_VAR)).toBe('3');

        dockview.dispose();
    });

    test('unbounded wrap (no maxRows) has no cap class or var', () => {
        const dockview = make({ mode: 'wrap' });
        const panel = dockview.addPanel({ id: 'a', component: 'default' });
        const list = panel.group.model.tabsListElement;

        expect(list.classList.contains(WRAP_CLASS)).toBe(true);
        expect(list.classList.contains(CAPPED_CLASS)).toBe(false);
        expect(list.style.getPropertyValue(MAX_ROWS_VAR)).toBe('');

        dockview.dispose();
    });

    test('a non-positive maxRows is treated as unbounded', () => {
        const dockview = make({ mode: 'wrap', maxRows: 0 });
        const panel = dockview.addPanel({ id: 'a', component: 'default' });
        const list = panel.group.model.tabsListElement;

        expect(list.classList.contains(CAPPED_CLASS)).toBe(false);

        dockview.dispose();
    });

    test('the surplus set (rows beyond maxRows) is routed to the forced-overflow seam', () => {
        const dockview = make({ mode: 'wrap', maxRows: 2 });
        const ids = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5'];
        const first = dockview.addPanel({ id: ids[0], component: 'default' });
        for (const id of ids.slice(1)) {
            dockview.addPanel({ id, component: 'default' });
        }
        const list = first.group.model.tabsListElement;

        // 3 rows of two tabs each; maxRows=2 → the third row (p4, p5) is surplus.
        stampRows(list, [0, 0, 44, 44, 88, 88]);

        const spy = jest.spyOn(dockview, 'setForcedOverflow');
        // Re-apply (fires onDidOptionsChange) to trigger a measure with the
        // stamped geometry in place.
        dockview.updateOptions({ overflow: { mode: 'wrap', maxRows: 2 } });

        expect(spy).toHaveBeenCalled();
        const forced = spy.mock.calls.at(-1)![1];
        expect(forced('p4')).toBe(true);
        expect(forced('p5')).toBe(true);
        expect(forced('p0')).toBe(false);
        expect(forced('p2')).toBe(false);

        dockview.dispose();
    });

    test('within the cap nothing is forced into the dropdown', () => {
        const dockview = make({ mode: 'wrap', maxRows: 3 });
        const first = dockview.addPanel({ id: 'p0', component: 'default' });
        for (const id of ['p1', 'p2', 'p3']) {
            dockview.addPanel({ id, component: 'default' });
        }
        const list = first.group.model.tabsListElement;

        // Two rows only — within the 3-row cap, so no surplus.
        stampRows(list, [0, 0, 44, 44]);

        const spy = jest.spyOn(dockview, 'setForcedOverflow');
        dockview.updateOptions({ overflow: { mode: 'wrap', maxRows: 3 } });

        // Either not called (set unchanged from empty) or called with an
        // all-false predicate — never forcing a real panel out.
        for (const call of spy.mock.calls) {
            const forced = call[1];
            expect(['p0', 'p1', 'p2', 'p3'].some((id) => forced(id))).toBe(
                false
            );
        }

        dockview.dispose();
    });

    test('raising maxRows re-admits previously-surplus rows', () => {
        const dockview = make({ mode: 'wrap', maxRows: 2 });
        const first = dockview.addPanel({ id: 'p0', component: 'default' });
        for (const id of ['p1', 'p2', 'p3', 'p4', 'p5']) {
            dockview.addPanel({ id, component: 'default' });
        }
        const list = first.group.model.tabsListElement;
        stampRows(list, [0, 0, 44, 44, 88, 88]);

        // Cap at 2 → p4/p5 surplus.
        dockview.updateOptions({ overflow: { mode: 'wrap', maxRows: 2 } });

        const spy = jest.spyOn(dockview, 'setForcedOverflow');
        // Raise to 3 → the 3-row layout now fits; nothing is surplus.
        dockview.updateOptions({ overflow: { mode: 'wrap', maxRows: 3 } });
        expect(list.style.getPropertyValue(MAX_ROWS_VAR)).toBe('3');

        const forced = spy.mock.calls.at(-1)![1];
        expect(forced('p4')).toBe(false);
        expect(forced('p5')).toBe(false);

        dockview.dispose();
    });

    test('removing a group disposes its wrap controller without throwing', () => {
        const dockview = make({ mode: 'wrap' });
        const a = dockview.addPanel({ id: 'a', component: 'default' });
        const b = dockview.addPanel({
            id: 'b',
            component: 'default',
            position: { direction: 'right' },
        });

        expect(() => a.group.api.close()).not.toThrow();
        expect(
            b.group.model.tabsListElement.classList.contains(WRAP_CLASS)
        ).toBe(true);

        dockview.dispose();
    });
});
