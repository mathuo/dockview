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

/**
 * Auto-hide edge groups. Phase 1: a collapsed edge group renders clickable
 * activators. Phase 2: clicking one slides the panel out as a non-reflowing
 * overlay (peek) on the floating-overlay host; a pin button re-docks it; Esc /
 * pointer-down outside closes it. Opt-in via `autoHideEdgeGroups`.
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
    const peek = (): HTMLElement | null =>
        container.querySelector('.dv-edge-peek');
    const collapsed = (d: DockviewComponent): boolean =>
        d.getEdgeGroup('left')!.isCollapsed();

    afterEach(() => {
        container.remove();
    });

    test('renders an activator per panel when the edge group is collapsed', () => {
        const d = make(true);
        collapsedEdgeWithPanel(d, 'Explorer');

        expect(collapsed(d)).toBe(true);
        const buttons = activators();
        expect(buttons.length).toBe(1);
        expect(buttons[0].textContent).toBe('Explorer');

        d.dispose();
    });

    test('clicking an activator peeks: overlay shown, content reparented, no reflow', () => {
        const d = make(true);
        collapsedEdgeWithPanel(d);

        activators()[0].click();

        const overlay = peek();
        expect(overlay).toBeTruthy();
        expect(overlay!.querySelector('.dv-test-content')).toBeTruthy();
        expect(collapsed(d)).toBe(true);

        d.dispose();
    });

    test('the pin button re-docks (expands) the group and removes the peek', () => {
        const d = make(true);
        collapsedEdgeWithPanel(d);
        activators()[0].click();
        expect(peek()).toBeTruthy();

        (peek()!.querySelector('.dv-edge-peek-pin') as HTMLElement).click();

        expect(collapsed(d)).toBe(false);
        expect(peek()).toBeNull();

        d.dispose();
    });

    test('Escape closes the peek, restores content, stays collapsed', () => {
        const d = make(true);
        collapsedEdgeWithPanel(d);
        activators()[0].click();
        expect(peek()).toBeTruthy();

        document.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
        );

        expect(peek()).toBeNull();
        expect(collapsed(d)).toBe(true);
        expect(
            d
                .getEdgeGroupPanel('left')!
                .element.querySelector('.dv-test-content')
        ).toBeTruthy();

        d.dispose();
    });

    test('api.peekEdgeGroup / pinEdgeGroup / autoHideEdgeGroup', () => {
        const d = make(true);
        collapsedEdgeWithPanel(d);

        d.api.peekEdgeGroup('left', true);
        expect(peek()).toBeTruthy();
        expect(collapsed(d)).toBe(true);

        d.api.peekEdgeGroup('left', false);
        expect(peek()).toBeNull();

        d.api.pinEdgeGroup('left');
        expect(collapsed(d)).toBe(false);

        d.api.autoHideEdgeGroup('left');
        expect(collapsed(d)).toBe(true);

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

    test('off (default): no activators and no peek', () => {
        const d = make(undefined);
        collapsedEdgeWithPanel(d);

        expect(collapsed(d)).toBe(true);
        expect(activators().length).toBe(0);
        d.api.peekEdgeGroup('left', true);
        expect(peek()).toBeNull();

        d.dispose();
    });
});
