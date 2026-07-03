import {
    DockviewActivePanelChangeEvent,
    DockviewComponent,
    DockviewOrigin,
} from '../../dockview/dockviewComponent';
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
 * `onDidActivePanelChange` carries a {@link DockviewOrigin} so consumers can
 * tell a user gesture (`'user'`) from a programmatic `setActive` (`'api'`).
 * The component sink defaults to `'user'`; the DockviewApi / panel-api boundary
 * flips it to `'api'`, and an outer `withOrigin('user')` (used by gesture call
 * sites that route through the panel api) wins over that.
 */
describe('active panel change origin', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;
    let origins: DockviewOrigin[];
    let events: DockviewActivePanelChangeEvent[];

    beforeEach(() => {
        container = document.createElement('div');
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
        });
        dockview.layout(1000, 1000);
        origins = [];
        events = [];
        dockview.onDidActivePanelChange((e) => {
            origins.push(e.origin);
            events.push(e);
        });
    });

    afterEach(() => dockview.dispose());

    test('activation from a programmatic api mutation is tagged "api"', () => {
        dockview.api.addPanel({ id: 'p1', component: 'default' });
        expect(origins).toEqual(['api']);
    });

    test('activation from a direct (component) mutation is tagged "user"', () => {
        // Driving the component directly models the DnD / tab-UI paths that
        // never pass through the DockviewApi.
        dockview.addPanel({ id: 'p1', component: 'default' });
        expect(origins).toEqual(['user']);
    });

    test('a programmatic panel.api.setActive() is tagged "api"', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({ id: 'p2', component: 'default' });
        origins.length = 0;

        p1.api.setActive();
        expect(origins).toEqual(['api']);
    });

    test('a direct component setActivePanel is tagged "user"', () => {
        // Models the main tab-click path (group.model.openPanel), which never
        // passes through the panel api's `'api'` stamp.
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({ id: 'p2', component: 'default' });
        origins.length = 0;

        dockview.setActivePanel(p1);
        expect(origins).toEqual(['user']);
    });

    test('an outer withOrigin("user") wins over the panel-api "api" stamp', () => {
        // This is exactly what gesture call sites (tab overflow, keyboard
        // activation) do: wrap the setActive call so it reports "user" even
        // though it routes through the panel api.
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({ id: 'p2', component: 'default' });
        origins.length = 0;

        dockview.withOrigin('user', () => p1.api.setActive());
        expect(origins).toEqual(['user']);
    });

    test('the event payload carries both the panel and the origin', () => {
        const p1 = dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({ id: 'p2', component: 'default' });
        events.length = 0;

        p1.api.setActive();

        expect(events).toHaveLength(1);
        expect(events[0].panel).toBe(p1);
        expect(events[0].origin).toBe('api');
    });
});
