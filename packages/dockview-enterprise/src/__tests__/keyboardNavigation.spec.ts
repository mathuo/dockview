import { fireEvent } from '@testing-library/dom';
import { DockviewComponent } from 'dockview-core';
import { IContentRenderer } from 'dockview-core';
import { GroupPanelPartInitParameters } from 'dockview-core';
import { PanelUpdateEvent } from 'dockview-core';
import { DockviewEmitter as Emitter } from 'dockview-core';

class PanelContentPartTest implements IContentRenderer {
    element: HTMLElement = document.createElement('div');

    readonly _onDidDispose = new Emitter<void>();
    readonly onDidDispose = this._onDidDispose.event;

    constructor(
        public readonly id: string,
        public readonly component: string
    ) {}

    init(_parameters: GroupPanelPartInitParameters): void {
        // noop
    }

    layout(_width: number, _height: number): void {
        // noop
    }

    update(_event: PanelUpdateEvent): void {
        // noop
    }

    dispose(): void {
        this._onDidDispose.fire();
        this._onDidDispose.dispose();
    }
}

/**
 * Layer 1 of the accessibility pack: the free WAI-ARIA Tabs baseline that
 * ships in core. Asserts roles, states and the tab <-> tabpanel relationships.
 */
describe('accessibility: WAI-ARIA tabs baseline', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;

    beforeEach(() => {
        container = document.createElement('div');
        dockview = new DockviewComponent(container, {
            createComponent(options) {
                switch (options.name) {
                    case 'default':
                        return new PanelContentPartTest(
                            options.id,
                            options.name
                        );
                    default:
                        throw new Error('unsupported');
                }
            },
        });
        dockview.layout(1000, 1000);
    });

    const realTabs = (): HTMLElement[] =>
        Array.from(container.querySelectorAll('.dv-tab')) as HTMLElement[];

    test('tablist / tab / tabpanel roles are present', () => {
        dockview.addPanel({ id: 'panel1', component: 'default' });

        const tablist = container.querySelector('.dv-tabs-container')!;
        expect(tablist.getAttribute('role')).toBe('tablist');
        expect(tablist.getAttribute('aria-orientation')).toBe('horizontal');

        const tabpanel = container.querySelector('.dv-content-container')!;
        expect(tabpanel.getAttribute('role')).toBe('tabpanel');
        expect(tabpanel.id).toBeTruthy();

        const tabs = realTabs();
        expect(tabs).toHaveLength(1);
        expect(tabs[0].getAttribute('role')).toBe('tab');
        expect(tabs[0].id).toBeTruthy();
    });

    test('each tab controls the tabpanel and the active tab labels it', () => {
        dockview.addPanel({ id: 'panel1', component: 'default' });
        dockview.addPanel({ id: 'panel2', component: 'default' });

        const tabpanel = container.querySelector('.dv-content-container')!;
        const tabs = realTabs();
        expect(tabs).toHaveLength(2);

        // aria-controls: every tab references the single group tabpanel.
        for (const tab of tabs) {
            expect(tab.getAttribute('aria-controls')).toBe(tabpanel.id);
        }

        // exactly one selected; the tabpanel is labelled by it.
        const selected = tabs.filter(
            (t) => t.getAttribute('aria-selected') === 'true'
        );
        expect(selected).toHaveLength(1);
        expect(tabpanel.getAttribute('aria-labelledby')).toBe(selected[0].id);
    });

    test('aria-selected and aria-labelledby follow the active panel', () => {
        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });
        dockview.addPanel({ id: 'panel2', component: 'default' });

        const tabpanel = container.querySelector('.dv-content-container')!;

        // panel2 was added last → active.
        const selectedBefore = realTabs().filter(
            (t) => t.getAttribute('aria-selected') === 'true'
        );
        expect(selectedBefore).toHaveLength(1);
        const activeTabId2 = selectedBefore[0].id;
        expect(tabpanel.getAttribute('aria-labelledby')).toBe(activeTabId2);

        // activate panel1; selection + labelling must move with it.
        panel1.api.setActive();

        const selectedAfter = realTabs().filter(
            (t) => t.getAttribute('aria-selected') === 'true'
        );
        expect(selectedAfter).toHaveLength(1);
        expect(selectedAfter[0].id).not.toBe(activeTabId2);
        expect(tabpanel.getAttribute('aria-labelledby')).toBe(
            selectedAfter[0].id
        );
    });

    test('tab ids and tabpanel ids are unique across groups', () => {
        dockview.addPanel({ id: 'panel1', component: 'default' });
        dockview.addPanel({
            id: 'panel2',
            component: 'default',
            position: { referencePanel: 'panel1', direction: 'right' },
        });

        const tabpanels = Array.from(
            container.querySelectorAll('.dv-content-container')
        ) as HTMLElement[];
        expect(tabpanels).toHaveLength(2);
        expect(tabpanels[0].id).not.toBe(tabpanels[1].id);

        const ids = realTabs().map((t) => t.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    test('group is a region labelled by its active panel title', () => {
        dockview.addPanel({
            id: 'panel1',
            component: 'default',
            title: 'First',
        });

        const region = container.querySelector('.dv-groupview')!;
        expect(region.getAttribute('role')).toBe('region');
        expect(region.getAttribute('aria-label')).toBe('First');
    });

    test('region label follows the active panel', () => {
        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
            title: 'First',
        });
        dockview.addPanel({
            id: 'panel2',
            component: 'default',
            title: 'Second',
        });

        const region = container.querySelector('.dv-groupview')!;
        expect(region.getAttribute('aria-label')).toBe('Second');

        panel1.api.setActive();
        expect(region.getAttribute('aria-label')).toBe('First');
    });

    test('region label updates when the active panel title changes', () => {
        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
            title: 'First',
        });

        const region = container.querySelector('.dv-groupview')!;
        expect(region.getAttribute('aria-label')).toBe('First');

        panel1.api.setTitle('Renamed');
        expect(region.getAttribute('aria-label')).toBe('Renamed');
    });

    test('region drops its aria-label when the active panel has no title', () => {
        const panel1 = dockview.addPanel({
            id: 'panel1',
            component: 'default',
            title: 'First',
        });

        const region = container.querySelector('.dv-groupview')!;
        expect(region.getAttribute('aria-label')).toBe('First');

        // An untitled active panel must not leave a stale name behind: the
        // attribute is removed rather than set to an empty string.
        panel1.api.setTitle('');
        expect(region.getAttribute('aria-label')).toBeNull();
    });

    test('floating group is a non-modal dialog', () => {
        dockview.addPanel({ id: 'panel1', component: 'default' });
        dockview.addPanel({
            id: 'panel2',
            component: 'default',
            floating: true,
        });

        const dialog = container.querySelector('.dv-resize-container')!;
        expect(dialog.getAttribute('role')).toBe('dialog');
        expect(dialog.getAttribute('aria-modal')).toBe('false');
    });

    test('floating dialog is named by its active panel title', () => {
        dockview.addPanel({ id: 'panel1', component: 'default' });
        dockview.addPanel({
            id: 'panel2',
            component: 'default',
            title: 'Floater',
            floating: true,
        });

        const dialog = container.querySelector('.dv-resize-container')!;
        expect(dialog.getAttribute('aria-label')).toBe('Floater');
    });
});

/**
 * Layer 2: the free WAI-ARIA Tabs keyboard pattern within a strip
 * (roving tabindex + arrow / Home / End navigation + manual activation).
 */
describe('accessibility: tab keyboard navigation', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;

    beforeEach(() => {
        container = document.createElement('div');
        // Attach to the document so `.focus()` updates `document.activeElement`
        // (jsdom only focuses connected elements).
        document.body.appendChild(container);
        dockview = new DockviewComponent(container, {
            createComponent(options) {
                return new PanelContentPartTest(options.id, options.name);
            },
        });
        dockview.layout(1000, 1000);
    });

    afterEach(() => {
        dockview.dispose();
        container.remove();
    });

    const realTabs = (): HTMLElement[] =>
        Array.from(container.querySelectorAll('.dv-tab')) as HTMLElement[];

    test('roving tabindex: only the active tab is in the tab order', () => {
        dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({ id: 'p2', component: 'default' }); // p2 active

        const tabs = realTabs();
        const active = tabs.filter(
            (t) => t.getAttribute('aria-selected') === 'true'
        );
        expect(active).toHaveLength(1);
        expect(active[0].tabIndex).toBe(0);
        tabs.filter((t) => t !== active[0]).forEach((t) =>
            expect(t.tabIndex).toBe(-1)
        );
    });

    test('roving tabindex follows panel activation, not just arrow keys', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({ id: 'p2', component: 'default' });
        const p3 = dockview.addPanel({ id: 'p3', component: 'default' }); // p3 active

        const [t1, t2, t3] = realTabs();
        expect([t1.tabIndex, t2.tabIndex, t3.tabIndex]).toEqual([-1, -1, 0]);

        // Activating a panel (e.g. via a mouse click / the api) must move the
        // single tab-stop to its tab so keyboard entry lands on the active tab.
        p1.api.setActive();
        expect([t1.tabIndex, t2.tabIndex, t3.tabIndex]).toEqual([0, -1, -1]);

        p3.api.setActive();
        expect([t1.tabIndex, t2.tabIndex, t3.tabIndex]).toEqual([-1, -1, 0]);
    });

    test('arrow keys move the roving focus along the strip', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({ id: 'p2', component: 'default' });
        dockview.addPanel({ id: 'p3', component: 'default' });
        p1.api.setActive();

        const [t1, t2, t3] = realTabs();
        expect(t1.tabIndex).toBe(0);

        fireEvent.keyDown(t1, { key: 'ArrowRight' });
        expect(document.activeElement).toBe(t2);
        expect(t2.tabIndex).toBe(0);
        expect(t1.tabIndex).toBe(-1);

        fireEvent.keyDown(t2, { key: 'ArrowRight' });
        expect(document.activeElement).toBe(t3);

        fireEvent.keyDown(t3, { key: 'ArrowLeft' });
        expect(document.activeElement).toBe(t2);
    });

    test('arrow navigation clamps at the ends', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({ id: 'p2', component: 'default' });
        p1.api.setActive();
        const [t1, t2] = realTabs();

        // ArrowLeft at the first tab is a no-op.
        t1.focus();
        fireEvent.keyDown(t1, { key: 'ArrowLeft' });
        expect(document.activeElement).toBe(t1);

        // ArrowRight at the last tab is a no-op.
        fireEvent.keyDown(t1, { key: 'ArrowRight' });
        expect(document.activeElement).toBe(t2);
        fireEvent.keyDown(t2, { key: 'ArrowRight' });
        expect(document.activeElement).toBe(t2);
    });

    test('Home and End jump to the first and last tab', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({ id: 'p2', component: 'default' });
        dockview.addPanel({ id: 'p3', component: 'default' });
        p1.api.setActive();
        const tabs = realTabs();

        fireEvent.keyDown(tabs[0], { key: 'End' });
        expect(document.activeElement).toBe(tabs[2]);

        fireEvent.keyDown(tabs[2], { key: 'Home' });
        expect(document.activeElement).toBe(tabs[0]);
    });

    test('arrowing moves focus but does not activate (manual activation)', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        const p2 = dockview.addPanel({ id: 'p2', component: 'default' });
        p1.api.setActive();

        const [t1] = realTabs();
        fireEvent.keyDown(t1, { key: 'ArrowRight' });

        expect(p1.api.isActive).toBe(true);
        expect(p2.api.isActive).toBe(false);
    });

    test('Enter and Space activate the focused tab', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        const p2 = dockview.addPanel({ id: 'p2', component: 'default' });
        const p3 = dockview.addPanel({ id: 'p3', component: 'default' });
        p1.api.setActive();
        const [t1, t2, t3] = realTabs();

        fireEvent.keyDown(t1, { key: 'ArrowRight' });
        fireEvent.keyDown(t2, { key: 'Enter' });
        expect(p2.api.isActive).toBe(true);

        fireEvent.keyDown(t2, { key: 'ArrowRight' });
        fireEvent.keyDown(t3, { key: ' ' });
        expect(p3.api.isActive).toBe(true);
    });

    test('Delete / Backspace close the focused tab and keep focus in the strip', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({ id: 'p2', component: 'default' });
        dockview.addPanel({ id: 'p3', component: 'default' });
        p1.api.setActive();
        expect(realTabs()).toHaveLength(3);

        // Delete the middle tab; roving focus moves to a neighbour, staying
        // inside the tablist rather than falling back to <body>.
        const t2 = realTabs()[1];
        t2.focus();
        fireEvent.keyDown(t2, { key: 'Delete' });

        let tabs = realTabs();
        expect(tabs).toHaveLength(2);
        expect(container.contains(document.activeElement)).toBe(true);
        expect(
            (document.activeElement as HTMLElement).classList.contains('dv-tab')
        ).toBe(true);

        // Backspace also closes (the primary delete key on macOS).
        const focused = document.activeElement as HTMLElement;
        fireEvent.keyDown(focused, { key: 'Backspace' });
        expect(realTabs()).toHaveLength(1);
    });

    test('vertical strips navigate with Up/Down, not Left/Right', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({ id: 'p2', component: 'default' });
        dockview.addPanel({ id: 'p3', component: 'default' });
        p1.api.setActive();
        // A left/right header lays the tab strip out vertically.
        p1.api.group.api.setHeaderPosition('left');

        const [t1, t2] = realTabs();
        t1.focus();

        // Horizontal keys are inert in a vertical strip.
        fireEvent.keyDown(t1, { key: 'ArrowRight' });
        expect(document.activeElement).toBe(t1);

        // Down advances, Up retreats.
        fireEvent.keyDown(t1, { key: 'ArrowDown' });
        expect(document.activeElement).toBe(t2);
        fireEvent.keyDown(t2, { key: 'ArrowUp' });
        expect(document.activeElement).toBe(t1);
    });
});
