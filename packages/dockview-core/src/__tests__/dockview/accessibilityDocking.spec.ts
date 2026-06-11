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
