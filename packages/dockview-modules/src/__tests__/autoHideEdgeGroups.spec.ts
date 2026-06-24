import { DockviewComponent } from 'dockview-core';
import { IContentRenderer } from 'dockview-core';

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
 * Auto-hide edge groups (Phase 1) — a collapsed edge group renders clickable
 * activators in its strip; clicking one pins (expands) the group. Opt-in via
 * `autoHideEdgeGroups`; off → today's baseline (empty strip) is unchanged.
 */
describe('auto-hide edge groups', () => {
    let container: HTMLElement;

    const make = (
        autoHideEdgeGroups: DockviewComponent['options']['autoHideEdgeGroups']
    ): DockviewComponent => {
        container = document.createElement('div');
        document.body.appendChild(container);
        const dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            autoHideEdgeGroups,
        });
        dockview.layout(1000, 1000);
        return dockview;
    };

    /** Add a left edge group with one panel, then collapse it. */
    const collapsedEdgeWithPanel = (
        dockview: DockviewComponent,
        title = 'Explorer'
    ): void => {
        dockview.addEdgeGroup('left', { id: 'edge-left', initialSize: 200 });
        dockview.addPanel({
            id: 'p1',
            component: 'default',
            title,
            position: { referenceGroup: 'edge-left', direction: 'within' },
        });
        dockview.autoHideEdgeGroup('left');
    };

    const activators = (): HTMLElement[] =>
        Array.from(
            container.querySelectorAll('.dv-edge-activator')
        ) as HTMLElement[];

    afterEach(() => {
        container.remove();
    });

    test('renders an activator per panel when the edge group is collapsed', () => {
        const d = make(true);
        collapsedEdgeWithPanel(d, 'Explorer');

        expect(d.getEdgeGroup('left')!.isCollapsed()).toBe(true);
        const buttons = activators();
        expect(buttons.length).toBe(1);
        expect(buttons[0].textContent).toBe('Explorer');

        d.dispose();
    });

    test('clicking an activator pins (expands) the group and clears the strip', () => {
        const d = make(true);
        collapsedEdgeWithPanel(d);
        expect(activators().length).toBe(1);

        activators()[0].click();

        expect(d.getEdgeGroup('left')!.isCollapsed()).toBe(false);
        expect(activators().length).toBe(0);

        d.dispose();
    });

    test('api.pinEdgeGroup / autoHideEdgeGroup toggle the strip', () => {
        const d = make(true);
        d.addEdgeGroup('left', { id: 'edge-left', initialSize: 200 });
        d.addPanel({
            id: 'p1',
            component: 'default',
            title: 'Output',
            position: { referenceGroup: 'edge-left', direction: 'within' },
        });

        d.api.autoHideEdgeGroup('left');
        expect(activators().length).toBe(1);

        d.api.pinEdgeGroup('left');
        expect(activators().length).toBe(0);
        expect(d.getEdgeGroup('left')!.isCollapsed()).toBe(false);

        d.dispose();
    });

    test('the strip tracks panel add/remove while collapsed', () => {
        const d = make(true);
        collapsedEdgeWithPanel(d, 'A');
        expect(activators().length).toBe(1);

        d.addPanel({
            id: 'p2',
            component: 'default',
            title: 'B',
            position: { referenceGroup: 'edge-left', direction: 'within' },
        });
        expect(
            activators()
                .map((b) => b.textContent)
                .sort()
        ).toEqual(['A', 'B']);

        d.dispose();
    });

    test('off (default): a collapsed edge group renders no activators', () => {
        const d = make(undefined);
        collapsedEdgeWithPanel(d);

        expect(d.getEdgeGroup('left')!.isCollapsed()).toBe(true);
        expect(activators().length).toBe(0); // baseline strip untouched

        d.dispose();
    });
});
