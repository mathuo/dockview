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
