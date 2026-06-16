import { DockviewComponent } from '../../dockview/dockviewComponent';
import { IContentRenderer } from '../../dockview/types';
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
 * The popout lifecycle surface: `onDidAddPopoutGroup` (open event carrying the
 * Window handle) and `getPopouts()` (enumeration of the open popout windows).
 */
describe('popout lifecycle', () => {
    let container: HTMLElement;
    let dockview: DockviewComponent;

    beforeEach(() => {
        window.open = () => setupMockWindow();
        container = document.createElement('div');
        dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
        });
        dockview.layout(1000, 1000);
    });

    afterEach(() => dockview.dispose());

    test('onDidAddPopoutGroup fires with the group and window on open', async () => {
        const panel = dockview.addPanel({ id: 'p1', component: 'default' });
        const events: { id: string; hasGroup: boolean; hasWindow: boolean }[] =
            [];
        dockview.onDidAddPopoutGroup((e) =>
            events.push({
                id: e.id,
                hasGroup: !!e.group,
                hasWindow: !!e.window,
            })
        );

        await dockview.addPopoutGroup(panel);

        expect(events.length).toBe(1);
        expect(events[0].hasGroup).toBe(true);
        expect(events[0].hasWindow).toBe(true);
        // the event id matches the now-enumerable popout
        expect(events[0].id).toBe(dockview.getPopouts()[0].id);
    });

    test('getPopouts enumerates the open popout windows', async () => {
        expect(dockview.getPopouts()).toEqual([]);

        const panel = dockview.addPanel({ id: 'p1', component: 'default' });
        await dockview.addPopoutGroup(panel);

        const popouts = dockview.getPopouts();
        expect(popouts.length).toBe(1);
        expect(typeof popouts[0].id).toBe('string');
        expect(popouts[0].group).toBeDefined();
        expect(popouts[0].window).toBeDefined();
    });

    test('the DockviewApi surface delegates to the component', async () => {
        const fired: string[] = [];
        dockview.api.onDidAddPopoutGroup((e) => fired.push(e.id));

        const panel = dockview.addPanel({ id: 'p1', component: 'default' });
        await dockview.addPopoutGroup(panel);

        expect(fired.length).toBe(1);
        expect(dockview.api.getPopouts().map((p) => p.id)).toEqual(fired);
    });
});
