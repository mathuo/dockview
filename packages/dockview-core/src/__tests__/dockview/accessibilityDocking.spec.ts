import { fireEvent } from '@testing-library/dom';
import { DockviewComponent } from '../../dockview/dockviewComponent';
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
 * AccessibilityModule — keyboard docking thin vertical. Ctrl+M enters move
 * mode, arrows cycle the target, Enter docks (tab-into), Escape cancels.
 */
describe('accessibility: keyboard docking', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;

    const make = (
        keyboardNavigation: boolean | { keymap?: Record<string, string> }
    ): void => {
        container = document.createElement('div');
        document.body.appendChild(container);
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            keyboardNavigation,
        });
        dockview.layout(1000, 1000);
    };

    const twoGroups = (): void => {
        dockview.addPanel({ id: 'p1', component: 'default', title: 'P1' });
        dockview.addPanel({
            id: 'p2',
            component: 'default',
            title: 'P2',
            position: { direction: 'right' },
        });
    };

    const region = (): HTMLElement =>
        container.querySelector('.dv-live-region') as HTMLElement;

    afterEach(() => {
        dockview.dispose();
        container.remove();
    });

    test('target another group, centre, Enter → tab-into (groups merge)', () => {
        make(true);
        twoGroups(); // p1, p2 in separate groups; p2 active, targeting its own group
        expect(dockview.groups.length).toBe(2);

        fireEvent.keyDown(dockview.element, { key: 'm', ctrlKey: true });
        expect(region().textContent).toContain('Moving P2');

        // move the target to p1's group, then pick the group (edge phase)
        fireEvent.keyDown(dockview.element, { key: 'ArrowRight' });
        fireEvent.keyDown(dockview.element, { key: 'Enter' });
        expect(region().textContent).toContain('Tab into');

        // commit centre (tab-into)
        fireEvent.keyDown(dockview.element, { key: 'Enter' });
        expect(dockview.groups.length).toBe(1);
    });

    test('split a tab out of a single group to an edge (creates a group)', () => {
        make(true);
        dockview.addPanel({ id: 'p1', component: 'default', title: 'P1' });
        dockview.addPanel({ id: 'p2', component: 'default', title: 'P2' });
        expect(dockview.groups.length).toBe(1); // p1, p2 are tabs in one group

        fireEvent.keyDown(dockview.element, { key: 'm', ctrlKey: true });
        fireEvent.keyDown(dockview.element, { key: 'Enter' }); // pick the (only) group
        fireEvent.keyDown(dockview.element, { key: 'ArrowLeft' }); // left edge = split
        expect(region().textContent).toContain('Split left of');

        fireEvent.keyDown(dockview.element, { key: 'Enter' });
        expect(dockview.groups.length).toBe(2);
    });

    test('Escape cancels without changing the layout', () => {
        make(true);
        twoGroups();

        fireEvent.keyDown(dockview.element, { key: 'm', ctrlKey: true });
        expect(region().textContent).toContain('Moving P2');

        fireEvent.keyDown(dockview.element, { key: 'Escape' });
        expect(region().textContent).toBe('Move cancelled.');
        expect(dockview.groups.length).toBe(2);
    });

    test('does nothing when keyboardNavigation is off (default)', () => {
        make(false);
        twoGroups();

        fireEvent.keyDown(dockview.element, { key: 'm', ctrlKey: true });
        expect(region().textContent).not.toContain('Moving');
        expect(dockview.groups.length).toBe(2);
    });
});

/**
 * Switch tabs within the focused group by keyboard — Ctrl+] / Ctrl+[ cycle
 * the active group's panels (wrapping round), driven by the rebindable keymap.
 */
describe('accessibility: tab switching', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;

    const make = (
        keyboardNavigation: boolean | { keymap?: Record<string, string> }
    ): void => {
        container = document.createElement('div');
        document.body.appendChild(container);
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            keyboardNavigation,
        });
        dockview.layout(1000, 1000);
    };

    const threeTabs = (): void => {
        dockview.addPanel({ id: 'p1', component: 'default', title: 'P1' });
        dockview.addPanel({ id: 'p2', component: 'default', title: 'P2' });
        dockview.addPanel({ id: 'p3', component: 'default', title: 'P3' });
    };

    afterEach(() => {
        dockview.dispose();
        container.remove();
    });

    test('Ctrl+] advances to the next tab and wraps round', () => {
        make(true);
        threeTabs(); // one group, p3 active
        expect(dockview.activePanel?.id).toBe('p3');

        fireEvent.keyDown(dockview.element, { key: ']', ctrlKey: true });
        expect(dockview.activePanel?.id).toBe('p1'); // wrapped past the end

        fireEvent.keyDown(dockview.element, { key: ']', ctrlKey: true });
        expect(dockview.activePanel?.id).toBe('p2');
    });

    test('Ctrl+[ steps back to the previous tab and wraps round', () => {
        make(true);
        threeTabs(); // p3 active

        fireEvent.keyDown(dockview.element, { key: '[', ctrlKey: true });
        expect(dockview.activePanel?.id).toBe('p2');

        fireEvent.keyDown(dockview.element, { key: '[', ctrlKey: true });
        fireEvent.keyDown(dockview.element, { key: '[', ctrlKey: true });
        expect(dockview.activePanel?.id).toBe('p3'); // wrapped past the start
    });

    test('a rebound keymap is honoured (and the default no longer fires)', () => {
        make({ keymap: { nextTab: 'alt+n' } });
        threeTabs(); // p3 active

        // default binding is overridden, so Ctrl+] does nothing now
        fireEvent.keyDown(dockview.element, { key: ']', ctrlKey: true });
        expect(dockview.activePanel?.id).toBe('p3');

        fireEvent.keyDown(dockview.element, { key: 'n', altKey: true });
        expect(dockview.activePanel?.id).toBe('p1');
    });

    test('does nothing when keyboardNavigation is off', () => {
        make(false);
        threeTabs(); // p3 active

        fireEvent.keyDown(dockview.element, { key: ']', ctrlKey: true });
        expect(dockview.activePanel?.id).toBe('p3');
    });

    test('pulls focus back into the dock after switching (so it keeps working)', () => {
        make(true);
        threeTabs(); // p3 active, single group
        const group = dockview.activeGroup!;
        // switching hides the previously focused content; without restoring
        // focus it would fall to <body> and gate out the next key
        const spy = jest.spyOn(group.model, 'focusContent');

        fireEvent.keyDown(dockview.element, { key: ']', ctrlKey: true });

        expect(dockview.activePanel?.id).toBe('p1');
        expect(spy).toHaveBeenCalled();
    });
});

/**
 * Move focus between groups by keyboard — F6 / Shift+F6 step to the next /
 * previous group in gridview order (wrapping round).
 */
describe('accessibility: group focus navigation', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;

    const make = (keyboardNavigation: boolean): void => {
        container = document.createElement('div');
        document.body.appendChild(container);
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            keyboardNavigation,
        });
        dockview.layout(1000, 1000);
    };

    const threeGroups = (): void => {
        dockview.addPanel({ id: 'p1', component: 'default', title: 'P1' });
        dockview.addPanel({
            id: 'p2',
            component: 'default',
            title: 'P2',
            position: { direction: 'right' },
        });
        dockview.addPanel({
            id: 'p3',
            component: 'default',
            title: 'P3',
            position: { direction: 'right' },
        });
    };

    afterEach(() => {
        dockview.dispose();
        container.remove();
    });

    test('F6 moves focus to the next group and wraps round', () => {
        make(true);
        threeGroups(); // three groups; p3's group active
        expect(dockview.activeGroup?.id).toBe(dockview.groups[2].id);

        fireEvent.keyDown(dockview.element, { key: 'F6' });
        expect(dockview.activeGroup?.id).toBe(dockview.groups[0].id); // wrapped

        fireEvent.keyDown(dockview.element, { key: 'F6' });
        expect(dockview.activeGroup?.id).toBe(dockview.groups[1].id);
    });

    test('Shift+F6 moves focus to the previous group and wraps round', () => {
        make(true);
        threeGroups(); // p3's group active (index 2)

        fireEvent.keyDown(dockview.element, { key: 'F6', shiftKey: true });
        expect(dockview.activeGroup?.id).toBe(dockview.groups[1].id);

        fireEvent.keyDown(dockview.element, { key: 'F6', shiftKey: true });
        fireEvent.keyDown(dockview.element, { key: 'F6', shiftKey: true });
        expect(dockview.activeGroup?.id).toBe(dockview.groups[2].id); // wrapped
    });

    test('does nothing when keyboardNavigation is off', () => {
        make(false);
        threeGroups();
        const before = dockview.activeGroup?.id;

        fireEvent.keyDown(dockview.element, { key: 'F6' });
        expect(dockview.activeGroup?.id).toBe(before);
    });
});

/**
 * Spatial group focus — Ctrl+Shift+Arrow focuses the group geometrically in
 * that direction. jsdom has no layout, so a clean 2x2 grid is mocked via
 * getBoundingClientRect.
 */
describe('accessibility: spatial group focus', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;

    const make = (): void => {
        container = document.createElement('div');
        document.body.appendChild(container);
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            keyboardNavigation: true,
        });
        dockview.layout(200, 200);
    };

    const groupOf = (panelId: string) =>
        dockview.groups.find((g) => g.panels.some((p) => p.id === panelId))!;

    const setRect = (panelId: string, left: number, top: number): void => {
        groupOf(panelId).element.getBoundingClientRect = () =>
            ({
                left,
                top,
                width: 100,
                height: 100,
                right: left + 100,
                bottom: top + 100,
                x: left,
                y: top,
                toJSON: () => ({}),
            }) as DOMRect;
    };

    const grid2x2 = (): void => {
        dockview.addPanel({ id: 'tl', component: 'default' });
        dockview.addPanel({
            id: 'tr',
            component: 'default',
            position: { referencePanel: 'tl', direction: 'right' },
        });
        dockview.addPanel({
            id: 'bl',
            component: 'default',
            position: { referencePanel: 'tl', direction: 'below' },
        });
        dockview.addPanel({
            id: 'br',
            component: 'default',
            position: { referencePanel: 'tr', direction: 'below' },
        });
        // pin a clean 2x2 geometry regardless of jsdom's (absent) layout
        setRect('tl', 0, 0);
        setRect('tr', 100, 0);
        setRect('bl', 0, 100);
        setRect('br', 100, 100);
    };

    const dir = (key: string): void => {
        fireEvent.keyDown(dockview.element, {
            key,
            ctrlKey: true,
            shiftKey: true,
        });
    };

    afterEach(() => {
        dockview.dispose();
        container.remove();
    });

    test('Ctrl+Shift+Right / Down focus the neighbouring group', () => {
        make();
        grid2x2();
        expect(dockview.groups.length).toBe(4);
        groupOf('tl').api.setActive();
        expect(dockview.activeGroup).toBe(groupOf('tl'));

        dir('ArrowRight');
        expect(dockview.activeGroup).toBe(groupOf('tr'));

        groupOf('tl').api.setActive();
        dir('ArrowDown');
        expect(dockview.activeGroup).toBe(groupOf('bl'));
    });

    test('picks the dominant-axis neighbour, not a diagonal one', () => {
        make();
        grid2x2();
        groupOf('tl').api.setActive();

        // 'right' from top-left must land on top-right, never bottom-right
        dir('ArrowRight');
        expect(dockview.activeGroup).toBe(groupOf('tr'));
        expect(dockview.activeGroup).not.toBe(groupOf('br'));
    });

    test('does nothing when there is no group in that direction', () => {
        make();
        grid2x2();
        groupOf('tl').api.setActive();

        dir('ArrowLeft'); // nothing to the left of top-left
        expect(dockview.activeGroup).toBe(groupOf('tl'));
    });
});

/**
 * L4 focus management — closing a panel/group that holds focus must hand it to
 * a deterministic neighbour, never drop it on <body>. The service snapshots
 * focus before the remove and restores after if it was pulled out of the dock.
 */
describe('accessibility: focus restore on close', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;

    const make = (keyboardNavigation: boolean): void => {
        container = document.createElement('div');
        document.body.appendChild(container);
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            keyboardNavigation,
        });
        dockview.layout(1000, 1000);
    };

    // one group, two tabs — only the active tab carries aria-selected="true"
    const twoTabs = (): void => {
        dockview.addPanel({ id: 'p1', component: 'default', title: 'P1' });
        dockview.addPanel({ id: 'p2', component: 'default', title: 'P2' });
    };

    const activeTab = (): HTMLElement =>
        container.querySelector('.dv-tab[aria-selected="true"]') as HTMLElement;

    const remove = (id: string): void =>
        dockview.removePanel(dockview.panels.find((p) => p.id === id)!);

    afterEach(() => {
        dockview.dispose();
        container.remove();
    });

    test('returns focus to a neighbour when the close pulls it out of the dock', () => {
        make(true);
        twoTabs(); // p2 active
        activeTab().focus(); // focus p2's tab — a real in-dock focusable element
        expect(container.contains(document.activeElement)).toBe(true);

        const group = dockview.activeGroup!;
        const spy = jest.spyOn(group.model, 'focusContent');

        remove('p2'); // p2's tab removed → focus falls to <body>

        expect(dockview.activePanel?.id).toBe('p1'); // neighbour activated
        expect(spy).toHaveBeenCalled(); // and focus restored to it
    });

    test('does not steal focus when focus was outside the dock', () => {
        make(true);
        twoTabs();
        const outside = document.createElement('button');
        document.body.appendChild(outside);
        outside.focus();
        expect(container.contains(document.activeElement)).toBe(false);

        const spy = jest.spyOn(dockview.activeGroup!.model, 'focusContent');
        remove('p1'); // closing a background tab while focused elsewhere

        expect(spy).not.toHaveBeenCalled();
        outside.remove();
    });

    test('off when keyboardNavigation is disabled', () => {
        make(false);
        twoTabs();
        activeTab().focus();

        const spy = jest.spyOn(dockview.activeGroup!.model, 'focusContent');
        remove('p2');

        expect(spy).not.toHaveBeenCalled();
    });
});

/**
 * L4 — focus across maximize/restore. Maximizing hides sibling groups via
 * visibility toggling and leaves the maximized group's DOM in place, so the
 * active panel keeps focus across the transition. This guards against a future
 * change that re-renders on maximize (which would silently drop focus).
 */
describe('accessibility: focus across maximize', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;

    const make = (): void => {
        container = document.createElement('div');
        document.body.appendChild(container);
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            keyboardNavigation: true,
        });
        dockview.layout(1000, 1000);
    };

    afterEach(() => {
        dockview.dispose();
        container.remove();
    });

    test('maximize and restore keep focus on the active group', () => {
        make();
        dockview.addPanel({ id: 'p1', component: 'default', title: 'P1' });
        dockview.addPanel({
            id: 'p2',
            component: 'default',
            title: 'P2',
            position: { direction: 'right' },
        });
        const group = dockview.activeGroup!;
        const tab = group.element.querySelector('.dv-tab') as HTMLElement;
        tab.focus();
        expect(container.contains(document.activeElement)).toBe(true);

        group.api.maximize();
        expect(group.api.isMaximized()).toBe(true);
        expect(container.contains(document.activeElement)).toBe(true);

        group.api.exitMaximized();
        expect(group.api.isMaximized()).toBe(false);
        expect(container.contains(document.activeElement)).toBe(true);
    });
});

/**
 * L4 — Esc inside a floating group returns focus to the invoking control (the
 * last thing focused in the main dock). Runs in the bubble phase and respects
 * defaultPrevented so panel content that uses Esc keeps priority.
 */
describe('accessibility: floating group Esc returns focus', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;

    const make = (keyboardNavigation: boolean): void => {
        container = document.createElement('div');
        document.body.appendChild(container);
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            keyboardNavigation,
        });
        dockview.layout(1000, 1000);
    };

    const setup = (): void => {
        dockview.addPanel({ id: 'main', component: 'default', title: 'Main' });
        dockview.addPanel({
            id: 'float',
            component: 'default',
            title: 'Float',
            floating: true,
        });
    };

    const mainTab = (): HTMLElement =>
        Array.from(container.querySelectorAll('.dv-tab')).find(
            (t) => !(t as HTMLElement).closest('[role="dialog"]')
        ) as HTMLElement;
    const floatTab = (): HTMLElement =>
        container.querySelector('[role="dialog"] .dv-tab') as HTMLElement;

    afterEach(() => {
        dockview.dispose();
        container.remove();
    });

    test('Esc inside a float returns focus to the invoking control', () => {
        make(true);
        setup();
        const invoker = mainTab();
        invoker.focus(); // tracked as the invoking control
        floatTab().focus(); // now focused inside the float
        expect(floatTab().closest('[role="dialog"]')).toBeTruthy();

        fireEvent.keyDown(floatTab(), { key: 'Escape', bubbles: true });
        expect(document.activeElement).toBe(invoker);
    });

    test('does not hijack Esc that panel content handles (defaultPrevented)', () => {
        make(true);
        setup();
        mainTab().focus();
        const ft = floatTab();
        ft.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
            }
        });
        ft.focus();

        fireEvent.keyDown(ft, { key: 'Escape', bubbles: true });
        expect(document.activeElement).toBe(ft); // stayed in the float
    });

    test('off when keyboardNavigation is disabled', () => {
        make(false);
        setup();
        mainTab().focus();
        const ft = floatTab();
        ft.focus();

        fireEvent.keyDown(ft, { key: 'Escape', bubbles: true });
        expect(document.activeElement).toBe(ft); // not restored
    });
});

class ButtonPanel implements IContentRenderer {
    element = document.createElement('div');
    init(): void {
        const b1 = document.createElement('button');
        b1.textContent = 'b1';
        const b2 = document.createElement('button');
        b2.textContent = 'b2';
        this.element.append(b1, b2);
    }
    layout(): void {
        // noop
    }
    dispose(): void {
        // noop
    }
}

/**
 * L4 — Tab is trapped within a floating group: at the last tabbable Tab wraps
 * to the first, at the first Shift+Tab wraps to the last, so focus doesn't leak
 * to the grid behind the (non-modal) float.
 */
describe('accessibility: floating group Tab containment', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;

    const make = (keyboardNavigation: boolean): void => {
        container = document.createElement('div');
        document.body.appendChild(container);
        dockview = new DockviewComponent(container, {
            createComponent: () => new ButtonPanel(),
            keyboardNavigation,
        });
        dockview.layout(1000, 1000);
        dockview.addPanel({ id: 'main', component: 'default', title: 'Main' });
        dockview.addPanel({
            id: 'float',
            component: 'default',
            title: 'Float',
            floating: true,
        });
    };

    // mirror the service's tabbable query so the test is robust to float chrome
    const tabbables = (): HTMLElement[] => {
        const float = container.querySelector('[role="dialog"]')!;
        return Array.from(
            float.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), input:not([disabled]), ' +
                    'select:not([disabled]), textarea:not([disabled]), [tabindex]'
            )
        ).filter((el) => el.tabIndex >= 0);
    };

    afterEach(() => {
        dockview.dispose();
        container.remove();
    });

    test('Tab at the last tabbable wraps to the first', () => {
        make(true);
        const t = tabbables();
        expect(t.length).toBeGreaterThan(1);
        const first = t[0];
        const last = t[t.length - 1];

        last.focus();
        fireEvent.keyDown(last, { key: 'Tab', bubbles: true });
        expect(document.activeElement).toBe(first);
    });

    test('Shift+Tab at the first tabbable wraps to the last', () => {
        make(true);
        const t = tabbables();
        const first = t[0];
        const last = t[t.length - 1];

        first.focus();
        fireEvent.keyDown(first, { key: 'Tab', shiftKey: true, bubbles: true });
        expect(document.activeElement).toBe(last);
    });

    test('off when keyboardNavigation is disabled', () => {
        make(false);
        const t = tabbables();
        const last = t[t.length - 1];

        last.focus();
        fireEvent.keyDown(last, { key: 'Tab', bubbles: true });
        expect(document.activeElement).toBe(last); // not wrapped
    });
});
