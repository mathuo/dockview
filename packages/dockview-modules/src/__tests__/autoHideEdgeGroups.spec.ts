import { fireEvent } from '@testing-library/dom';
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
 * Auto-hide edge groups. A collapsed edge group's native tabs are the peek
 * triggers (hover/focus/click) — no parallel strip. Peeking slides the active
 * panel out as a non-reflowing overlay; a pin button re-docks; Esc / leave /
 * focus-out close. Opt-in via `autoHideEdgeGroups`.
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

    const peek = (): HTMLElement | null =>
        container.querySelector('.dv-edge-peek');
    const collapsed = (d: DockviewComponent): boolean =>
        d.getEdgeGroup('left')!.isCollapsed();
    const strip = (d: DockviewComponent): HTMLElement =>
        d.getEdgeGroupPanel('left')!.element;

    afterEach(() => {
        container.remove();
    });

    test('api.peekEdgeGroup opens a non-reflowing peek with the content reparented', () => {
        const d = make(true);
        collapsedEdgeWithPanel(d);

        d.api.peekEdgeGroup('left', true);
        const overlay = peek();
        expect(overlay).toBeTruthy();
        expect(overlay!.querySelector('.dv-test-content')).toBeTruthy();
        expect(collapsed(d)).toBe(true); // no grid reflow

        d.api.peekEdgeGroup('left', false);
        expect(peek()).toBeNull();
        expect(strip(d).querySelector('.dv-test-content')).toBeTruthy(); // content restored

        d.dispose();
    });

    test('the pin button re-docks (expands) the group and removes the peek', () => {
        const d = make(true);
        collapsedEdgeWithPanel(d);
        d.api.peekEdgeGroup('left', true);

        (peek()!.querySelector('.dv-edge-peek-pin') as HTMLElement).click();

        expect(collapsed(d)).toBe(false);
        expect(peek()).toBeNull();

        d.dispose();
    });

    test('Escape closes the peek, restores content, stays collapsed', () => {
        const d = make(true);
        collapsedEdgeWithPanel(d);
        d.api.peekEdgeGroup('left', true);
        expect(peek()).toBeTruthy();

        document.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
        );

        expect(peek()).toBeNull();
        expect(collapsed(d)).toBe(true);
        expect(strip(d).querySelector('.dv-test-content')).toBeTruthy();

        d.dispose();
    });

    test('group.api.isPeeking + onDidPeekChange reflect the peek', () => {
        const d = make(true);
        collapsedEdgeWithPanel(d);
        const api = d.getEdgeGroup('left')!;
        const events: boolean[] = [];
        const sub = api.onDidPeekChange((e) => events.push(e.isPeeking));

        expect(api.isPeeking()).toBe(false);
        d.api.peekEdgeGroup('left', true);
        expect(api.isPeeking()).toBe(true);
        d.api.peekEdgeGroup('left', false);
        expect(api.isPeeking()).toBe(false);
        expect(events).toEqual([true, false]);

        sub.dispose();
        d.dispose();
    });

    test('off (default): peeking is a no-op', () => {
        const d = make(undefined);
        collapsedEdgeWithPanel(d);

        expect(collapsed(d)).toBe(true);
        d.api.peekEdgeGroup('left', true);
        expect(peek()).toBeNull();

        d.dispose();
    });

    describe('hover / focus triggers', () => {
        afterEach(() => jest.useRealTimers());

        test('hover (pointerenter) opens after openDelay', () => {
            const d = make({ openDelay: 100, closeDelay: 100 });
            collapsedEdgeWithPanel(d);
            jest.useFakeTimers();

            fireEvent.pointerEnter(strip(d));
            jest.advanceTimersByTime(99);
            expect(peek()).toBeNull();
            jest.advanceTimersByTime(1);
            expect(peek()).toBeTruthy();

            d.dispose();
        });

        test('leaving the strip closes after closeDelay', () => {
            const d = make({ openDelay: 100, closeDelay: 100 });
            collapsedEdgeWithPanel(d);
            d.api.peekEdgeGroup('left', true);
            jest.useFakeTimers();

            fireEvent.pointerLeave(strip(d));
            jest.advanceTimersByTime(99);
            expect(peek()).toBeTruthy();
            jest.advanceTimersByTime(1);
            expect(peek()).toBeNull();

            d.dispose();
        });

        test('re-entering the overlay cancels the close (no flicker)', () => {
            const d = make({ openDelay: 100, closeDelay: 100 });
            collapsedEdgeWithPanel(d);
            d.api.peekEdgeGroup('left', true);
            const overlay = peek()!;
            jest.useFakeTimers();

            fireEvent.pointerLeave(strip(d));
            fireEvent.pointerEnter(overlay);
            jest.advanceTimersByTime(1000);
            expect(peek()).toBeTruthy();

            d.dispose();
        });

        test('focus opens (deferred out of the focus event)', () => {
            const d = make({ openDelay: 100, closeDelay: 100 });
            collapsedEdgeWithPanel(d);
            jest.useFakeTimers();

            fireEvent.focusIn(strip(d));
            expect(peek()).toBeNull(); // scheduled, not synchronous
            jest.advanceTimersByTime(0);
            expect(peek()).toBeTruthy();

            d.dispose();
        });
    });
});
