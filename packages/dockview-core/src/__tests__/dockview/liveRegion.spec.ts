import { DockviewComponent } from '../../dockview/dockviewComponent';
import { IContentRenderer } from '../../dockview/types';
import { ILiveRegionService } from '../../dockview/liveRegionService';
import { AnnouncementEvent } from '../../dockview/options';
import { setupMockWindow } from '../__mocks__/mockWindow';

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
 * LiveRegion (free): screen-reader announcements of layout changes. Phase 1:
 * a visually-hidden polite status region, open/close announcements, the
 * `announce()` sink, and suppression of the bulk load/clear burst.
 */
describe('LiveRegion announcer', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;

    beforeEach(() => {
        container = document.createElement('div');
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
        });
        dockview.layout(800, 600);
    });

    afterEach(() => dockview.dispose());

    const region = (): HTMLElement =>
        container.querySelector('.dv-live-region') as HTMLElement;

    const service = (): ILiveRegionService =>
        (
            dockview as unknown as {
                _moduleRegistry: {
                    services: { liveRegionService: ILiveRegionService };
                };
            }
        )._moduleRegistry.services.liveRegionService;

    test('creates a visually-hidden polite status region', () => {
        const r = region();
        expect(r).toBeTruthy();
        expect(r.getAttribute('role')).toBe('status');
        expect(r.getAttribute('aria-live')).toBe('polite');
        // hidden but in the a11y tree, never display:none / visibility:hidden
        expect(r.style.display).not.toBe('none');
        expect(r.style.visibility).not.toBe('hidden');
    });

    test('announces panel open and close', () => {
        const p1 = dockview.addPanel({
            id: 'p1',
            component: 'default',
            title: 'Orders',
        });
        expect(region().textContent).toBe('Orders opened');

        dockview.removePanel(p1);
        expect(region().textContent).toBe('Orders closed');
    });

    test('falls back to the panel id when untitled', () => {
        dockview.addPanel({ id: 'p1', component: 'default' });
        expect(region().textContent).toBe('p1 opened');
    });

    test('the announce() sink writes to the region', () => {
        service().announce('Docked left of Chart');
        expect(region().textContent).toBe('Docked left of Chart');
    });

    test('a bulk fromJSON load is silent (no per-panel announcements)', () => {
        dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({ id: 'p2', component: 'default' });
        const json = dockview.toJSON();

        region().textContent = '';
        dockview.fromJSON(json);
        expect(region().textContent).toBe('');
    });

    test('clear() is silent', () => {
        dockview.addPanel({ id: 'p1', component: 'default' });
        region().textContent = '';
        dockview.clear();
        expect(region().textContent).toBe('');
    });

    test('announcements: false disables the announcer', () => {
        dockview.dispose();
        container = document.createElement('div');
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            announcements: false,
        });
        dockview.layout(800, 600);

        dockview.addPanel({ id: 'p1', component: 'default', title: 'Orders' });
        expect(region().textContent).toBe('');
    });

    test('updateOptions({ announcements: false }) disables it live', () => {
        dockview.addPanel({ id: 'p1', component: 'default', title: 'Orders' });
        expect(region().textContent).toBe('Orders opened');

        dockview.updateOptions({ announcements: false });
        region().textContent = '';
        dockview.addPanel({ id: 'p2', component: 'default', title: 'Chart' });
        expect(region().textContent).toBe('');
    });

    test('getAnnouncement localises / overrides the default message', () => {
        dockview.dispose();
        container = document.createElement('div');
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            getAnnouncement: ({ kind, panel }) =>
                kind === 'open'
                    ? `${panel.title} ouvert`
                    : `${panel.title} fermé`,
        });
        dockview.layout(800, 600);

        const p1 = dockview.addPanel({
            id: 'p1',
            component: 'default',
            title: 'Commandes',
        });
        expect(region().textContent).toBe('Commandes ouvert');

        dockview.removePanel(p1);
        expect(region().textContent).toBe('Commandes fermé');
    });

    test('getAnnouncement returning null suppresses that announcement', () => {
        dockview.dispose();
        container = document.createElement('div');
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            // suppress opens, keep the default for closes
            getAnnouncement: ({ kind }) => (kind === 'open' ? null : undefined),
        });
        dockview.layout(800, 600);

        const p1 = dockview.addPanel({
            id: 'p1',
            component: 'default',
            title: 'Orders',
        });
        expect(region().textContent).toBe(''); // open suppressed

        dockview.removePanel(p1);
        expect(region().textContent).toBe('Orders closed'); // default kept
    });

    const assertiveRegion = (): HTMLElement =>
        container.querySelector('.dv-live-region-assertive') as HTMLElement;

    test('creates a separate assertive (alert) region', () => {
        const r = assertiveRegion();
        expect(r).toBeTruthy();
        expect(r.getAttribute('role')).toBe('alert');
        expect(r.getAttribute('aria-live')).toBe('assertive');
    });

    test('routes by politeness: assertive vs polite region', () => {
        service().announce('routine');
        expect(region().textContent).toBe('routine');
        expect(assertiveRegion().textContent).toBe('');

        service().announce('not allowed', 'assertive');
        expect(assertiveRegion().textContent).toBe('not allowed');
        expect(region().textContent).toBe('routine'); // polite untouched
    });

    test('announces maximize and restore (via the active panel)', () => {
        dockview.addPanel({ id: 'p1', component: 'default', title: 'Orders' });
        const p2 = dockview.addPanel({
            id: 'p2',
            component: 'default',
            title: 'Chart',
            position: { direction: 'right' },
        });

        p2.api.group.api.maximize();
        expect(region().textContent).toBe('Chart maximized');

        p2.api.group.api.exitMaximized();
        expect(region().textContent).toBe('Chart restored');
    });

    test('maximize announcement is localisable via getAnnouncement', () => {
        dockview.dispose();
        container = document.createElement('div');
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            getAnnouncement: ({ kind, panel }) =>
                kind === 'maximize' ? `${panel.title} agrandi` : undefined,
        });
        dockview.layout(800, 600);
        const p = dockview.addPanel({
            id: 'p1',
            component: 'default',
            title: 'Vue',
        });

        p.api.group.api.maximize();
        expect(region().textContent).toBe('Vue agrandi');
    });

    test('announces a panel floating', () => {
        dockview.addPanel({ id: 'p1', component: 'default', title: 'P1' });
        const p2 = dockview.addPanel({
            id: 'p2',
            component: 'default',
            title: 'P2',
        });
        dockview.addFloatingGroup(p2);
        expect(region().textContent).toBe('P2 floated');
    });

    test('a normal grid split does not spuriously announce float/dock', () => {
        dockview.addPanel({ id: 'p1', component: 'default', title: 'P1' });
        dockview.addPanel({
            id: 'p2',
            component: 'default',
            title: 'P2',
            position: { direction: 'right' },
        });
        // the only announcement is the open; group creation's initial
        // `-> grid` transition must not read as a dock
        expect(region().textContent).toBe('P2 opened');
    });

    test('announces a panel popping out to a new window', async () => {
        window.open = () => setupMockWindow();
        dockview.addPanel({ id: 'p1', component: 'default', title: 'P1' });
        const p2 = dockview.addPanel({
            id: 'p2',
            component: 'default',
            title: 'P2',
        });
        await dockview.addPopoutGroup(p2);
        expect(region().textContent).toBe('P2 opened in a new window');
    });

    test('a popout sharing the document does not get a duplicate region', async () => {
        window.open = () => setupMockWindow();
        dockview.addPanel({ id: 'p1', component: 'default', title: 'P1' });
        const p2 = dockview.addPanel({
            id: 'p2',
            component: 'default',
            title: 'P2',
        });
        await dockview.addPopoutGroup(p2);
        // The mock popout reuses the main document, so per-window mounting is
        // skipped; there is still exactly one polite region and announcements
        // stay on it. (Real cross-document behaviour is covered by the e2e.)
        expect(container.querySelectorAll('.dv-live-region')).toHaveLength(1);
        expect(region().textContent).toBe('P2 opened in a new window');
    });

    test('the messages catalog localises announcement strings', () => {
        dockview.dispose();
        container = document.createElement('div');
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
            messages: {
                panelOpened: (t) => `${t} ouvert`,
                groupFloated: (t) => `${t} flottant`,
            },
        });
        dockview.layout(800, 600);

        const p = dockview.addPanel({
            id: 'p1',
            component: 'default',
            title: 'Vue',
        });
        expect(region().textContent).toBe('Vue ouvert');

        dockview.addFloatingGroup(p);
        expect(region().textContent).toBe('Vue flottant');
    });

    test('a custom announcer receives events; the DOM regions stay empty', () => {
        const events: AnnouncementEvent[] = [];
        const c2 = document.createElement('div');
        const dv2 = new DockviewComponent(c2, {
            createComponent: () => new TestPanel(),
            announcer: (e) => events.push(e),
        });
        dv2.layout(800, 600);
        const svc = (
            dv2 as unknown as {
                _moduleRegistry: {
                    services: { liveRegionService: ILiveRegionService };
                };
            }
        )._moduleRegistry.services.liveRegionService;

        svc.announce('hi', 'assertive');

        expect(events).toEqual([{ message: 'hi', politeness: 'assertive' }]);
        expect(c2.querySelector('.dv-live-region')?.textContent).toBe('');
        expect(c2.querySelector('.dv-live-region-assertive')?.textContent).toBe(
            ''
        );
        dv2.dispose();
    });
});
