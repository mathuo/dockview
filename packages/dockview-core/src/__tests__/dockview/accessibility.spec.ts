import { DockviewComponent } from '../../dockview/dockviewComponent';
import { IContentRenderer } from '../../dockview/types';
import { GroupPanelPartInitParameters } from '../../dockview/types';
import { PanelUpdateEvent } from '../../panel/types';
import { Emitter } from '../../events';

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
 * Layer 1 of the accessibility pack — the free WAI-ARIA Tabs baseline that
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
        expect(tabs.length).toBe(1);
        expect(tabs[0].getAttribute('role')).toBe('tab');
        expect(tabs[0].id).toBeTruthy();
    });

    test('each tab controls the tabpanel and the active tab labels it', () => {
        dockview.addPanel({ id: 'panel1', component: 'default' });
        dockview.addPanel({ id: 'panel2', component: 'default' });

        const tabpanel = container.querySelector('.dv-content-container')!;
        const tabs = realTabs();
        expect(tabs.length).toBe(2);

        // aria-controls: every tab references the single group tabpanel.
        for (const tab of tabs) {
            expect(tab.getAttribute('aria-controls')).toBe(tabpanel.id);
        }

        // exactly one selected; the tabpanel is labelled by it.
        const selected = tabs.filter(
            (t) => t.getAttribute('aria-selected') === 'true'
        );
        expect(selected.length).toBe(1);
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
        expect(selectedBefore.length).toBe(1);
        const activeTabId2 = selectedBefore[0].id;
        expect(tabpanel.getAttribute('aria-labelledby')).toBe(activeTabId2);

        // activate panel1 — selection + labelling must move with it.
        panel1.api.setActive();

        const selectedAfter = realTabs().filter(
            (t) => t.getAttribute('aria-selected') === 'true'
        );
        expect(selectedAfter.length).toBe(1);
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
        expect(tabpanels.length).toBe(2);
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
});
