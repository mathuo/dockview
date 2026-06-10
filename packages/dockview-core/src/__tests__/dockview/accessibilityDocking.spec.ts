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

    const make = (keyboardDocking: boolean): void => {
        container = document.createElement('div');
        document.body.appendChild(container);
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            keyboardDocking,
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

    test('does nothing when keyboardDocking is off (default)', () => {
        make(false);
        twoGroups();

        fireEvent.keyDown(dockview.element, { key: 'm', ctrlKey: true });
        expect(region().textContent).not.toContain('Moving');
        expect(dockview.groups.length).toBe(2);
    });
});
