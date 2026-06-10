import { DockviewComponent } from '../../dockview/dockviewComponent';
import { IContentRenderer } from '../../dockview/types';
import { ILiveRegionService } from '../../dockview/liveRegionService';

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
 * LiveRegion (free) — screen-reader announcements of layout changes. Phase 1:
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
        // hidden but in the a11y tree — never display:none / visibility:hidden
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
});
