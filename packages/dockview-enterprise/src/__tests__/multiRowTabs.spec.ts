import { fireEvent } from '@testing-library/dom';
import { DockviewComponent } from 'dockview-core';
import { IContentRenderer } from 'dockview-core';
import { findVerticalNeighbour } from '../multiRowTabsService';

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

/** Mock a tab's layout geometry — jsdom reports 0 for every offset. */
function setGeometry(
    el: HTMLElement,
    top: number,
    left: number,
    width: number
): void {
    Object.defineProperty(el, 'offsetTop', { value: top, configurable: true });
    Object.defineProperty(el, 'offsetLeft', {
        value: left,
        configurable: true,
    });
    Object.defineProperty(el, 'offsetWidth', {
        value: width,
        configurable: true,
    });
}

/**
 * The pure row-geometry resolver behind Arrow Up/Down. Bucket tabs into rows by
 * `offsetTop`, then within the target row pick the tab whose horizontal centre
 * is nearest.
 */
describe('findVerticalNeighbour', () => {
    const tabAt = (top: number, left: number, width: number): HTMLElement => {
        const el = document.createElement('div');
        el.className = 'dv-tab';
        setGeometry(el, top, left, width);
        return el;
    };

    test('steps down to the horizontally-nearest tab in the row below', () => {
        // row 0: centres 25 / 75 / 125 ; row 1: centres 25 / 75 / 125
        const t0 = tabAt(0, 0, 50);
        const t1 = tabAt(0, 50, 50);
        const t2 = tabAt(0, 100, 50);
        const t3 = tabAt(30, 0, 50);
        const t4 = tabAt(30, 50, 50);
        const t5 = tabAt(30, 100, 50);
        const tabs = [t0, t1, t2, t3, t4, t5];

        expect(findVerticalNeighbour(tabs, t1, 'down')).toBe(t4);
    });

    test('steps up to the horizontally-nearest tab in the row above', () => {
        const t0 = tabAt(0, 0, 50);
        const t1 = tabAt(0, 50, 50);
        const t2 = tabAt(30, 0, 50);
        const t3 = tabAt(30, 50, 50);
        const tabs = [t0, t1, t2, t3];

        expect(findVerticalNeighbour(tabs, t3, 'up')).toBe(t1);
    });

    test('picks the nearest centre when rows are misaligned', () => {
        // top row has two wide tabs; bottom row has three narrow tabs.
        const top0 = tabAt(0, 0, 90); // centre 45
        const top1 = tabAt(0, 90, 90); // centre 135
        const bot0 = tabAt(30, 0, 40); // centre 20
        const bot1 = tabAt(30, 40, 40); // centre 60
        const bot2 = tabAt(30, 80, 40); // centre 100
        const tabs = [top0, top1, bot0, bot1, bot2];

        // top1 centre 135 → nearest bottom centre is bot2 (100)
        expect(findVerticalNeighbour(tabs, top1, 'down')).toBe(bot2);
        // top0 centre 45 → nearest bottom centre is bot1 (60)
        expect(findVerticalNeighbour(tabs, top0, 'down')).toBe(bot1);
    });

    test('returns undefined at the edges (top row up / bottom row down)', () => {
        const top = tabAt(0, 0, 50);
        const bottom = tabAt(30, 0, 50);
        const tabs = [top, bottom];

        expect(findVerticalNeighbour(tabs, top, 'up')).toBeUndefined();
        expect(findVerticalNeighbour(tabs, bottom, 'down')).toBeUndefined();
    });
});

/**
 * Cross-row keyboard navigation — Arrow Up/Down move the roving focus between
 * wrapped rows. Only active while the strip is wrapping a horizontal header;
 * jsdom has no layout, so tab geometry is mocked (real wrapping is e2e).
 */
describe('multi-row tabs: cross-row keyboard navigation', () => {
    let container: HTMLElement;

    const make = (
        overflow?: DockviewComponent['options']['overflow'],
        headerPosition?: 'top' | 'left'
    ): DockviewComponent => {
        container = document.createElement('div');
        document.body.appendChild(container);
        const dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            overflow,
            defaultHeaderPosition: headerPosition,
        });
        dockview.layout(1000, 1000);
        return dockview;
    };

    afterEach(() => {
        container?.remove();
    });

    /** Six tabs laid out as two rows of three (centres 25 / 75 / 125). */
    const sixTabsTwoRows = (dockview: DockviewComponent): HTMLElement[] => {
        for (const id of ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']) {
            dockview.addPanel({ id, component: 'default' });
        }
        const list = dockview.activeGroup!.model.tabsListElement;
        const tabs = Array.from(list.querySelectorAll<HTMLElement>('.dv-tab'));
        setGeometry(tabs[0], 0, 0, 50);
        setGeometry(tabs[1], 0, 50, 50);
        setGeometry(tabs[2], 0, 100, 50);
        setGeometry(tabs[3], 30, 0, 50);
        setGeometry(tabs[4], 30, 50, 50);
        setGeometry(tabs[5], 30, 100, 50);
        return tabs;
    };

    test('ArrowDown moves roving focus to the aligned tab one row below', () => {
        const dockview = make({ mode: 'wrap' });
        const tabs = sixTabsTwoRows(dockview);

        tabs[1].focus();
        fireEvent.keyDown(tabs[1], { key: 'ArrowDown' });

        expect(document.activeElement).toBe(tabs[4]);
        expect(tabs[4].tabIndex).toBe(0);
        expect(tabs[1].tabIndex).toBe(-1);

        dockview.dispose();
    });

    test('ArrowUp moves roving focus to the aligned tab one row above', () => {
        const dockview = make({ mode: 'wrap' });
        const tabs = sixTabsTwoRows(dockview);

        tabs[5].focus();
        fireEvent.keyDown(tabs[5], { key: 'ArrowUp' });

        expect(document.activeElement).toBe(tabs[2]);

        dockview.dispose();
    });

    test('ArrowUp on the top row is a no-op', () => {
        const dockview = make({ mode: 'wrap' });
        const tabs = sixTabsTwoRows(dockview);

        tabs[0].focus();
        fireEvent.keyDown(tabs[0], { key: 'ArrowUp' });

        expect(document.activeElement).toBe(tabs[0]);

        dockview.dispose();
    });

    test('is inert when the strip is not wrapping (no cross-row jump)', () => {
        const dockview = make(); // dropdown overflow — no wrap class, no listener
        const tabs = sixTabsTwoRows(dockview);
        expect(
            dockview.activeGroup!.model.tabsListElement.classList.contains(
                WRAP_CLASS
            )
        ).toBe(false);

        tabs[1].focus();
        fireEvent.keyDown(tabs[1], { key: 'ArrowDown' });

        // core owns Left/Right for a horizontal strip and ignores Up/Down, so
        // focus stays put — our cross-row handler never ran.
        expect(document.activeElement).toBe(tabs[1]);

        dockview.dispose();
    });

    test('is inert on a vertical header (wrap gate stays closed)', () => {
        const dockview = make({ mode: 'wrap' }, 'left');
        dockview.addPanel({ id: 'p1', component: 'default' });
        const list = dockview.activeGroup!.model.tabsListElement;

        expect(list.classList.contains('dv-tabs-container-vertical')).toBe(
            true
        );
        // wrap (and therefore the cross-row listener) never activates vertically
        expect(list.classList.contains(WRAP_CLASS)).toBe(false);

        dockview.dispose();
    });

    test('detaches the listener when wrap is turned off at runtime', () => {
        const dockview = make({ mode: 'wrap' });
        const tabs = sixTabsTwoRows(dockview);

        // turn wrap off — the capture listener must be removed
        dockview.updateOptions({ overflow: { mode: 'dropdown' } });

        tabs[1].focus();
        fireEvent.keyDown(tabs[1], { key: 'ArrowDown' });

        expect(document.activeElement).toBe(tabs[1]);

        dockview.dispose();
    });
});
