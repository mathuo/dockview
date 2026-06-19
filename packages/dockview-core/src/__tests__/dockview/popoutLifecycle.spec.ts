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
 * The popout lifecycle surface: `onDidAddPopoutGroup` (open) /
 * `onDidRemovePopoutGroup` (close or dock-back), `getPopouts()` (enumeration),
 * plus teardown and serialize/restore round-tripping.
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

    test('closing the popout window returns the panel, fires onDidRemovePopoutGroup, and clears getPopouts', async () => {
        const panel = dockview.addPanel({ id: 'p1', component: 'default' });
        await dockview.addPopoutGroup(panel);
        expect(dockview.getPopouts().length).toBe(1);

        const popoutId = dockview.getPopouts()[0].id;
        const popoutWindow = dockview.getPopouts()[0].window;

        const removed: string[] = [];
        dockview.onDidRemovePopoutGroup((e) => removed.push(e.id));

        // a genuine user close fires `beforeunload`, which drives teardown
        expect(() => popoutWindow.close()).not.toThrow();

        // the removal is reported once, the popout is no longer enumerable, and
        // the panel survives in the grid
        expect(removed).toEqual([popoutId]);
        expect(dockview.getPopouts()).toEqual([]);
        expect(dockview.panels.find((p) => p.id === 'p1')).toBeDefined();
    });

    test('onDidRemovePopoutGroup does not fire on component disposal', async () => {
        // use a dedicated component so the shared afterEach doesn't double-dispose
        const localContainer = document.createElement('div');
        const local = new DockviewComponent(localContainer, {
            createComponent: () => new TestPanel(),
        });
        local.layout(1000, 1000);
        const panel = local.addPanel({ id: 'p1', component: 'default' });
        await local.addPopoutGroup(panel);

        const removed: string[] = [];
        local.onDidRemovePopoutGroup((e) => removed.push(e.id));

        expect(() => local.dispose()).not.toThrow();
        expect(removed).toEqual([]);
    });

    test('toJSON captures open popouts and fromJSON round-trips without throwing', async () => {
        const panel = dockview.addPanel({ id: 'p1', component: 'default' });
        dockview.addPanel({ id: 'p2', component: 'default' });
        await dockview.addPopoutGroup(panel);

        const json = dockview.toJSON();
        expect(json.popoutGroups?.length).toBe(1);

        // a fresh component must restore the serialized layout (incl. the popout
        // descriptor) without throwing
        const container2 = document.createElement('div');
        const dockview2 = new DockviewComponent(container2, {
            createComponent: () => new TestPanel(),
        });
        dockview2.layout(1000, 1000);

        expect(() => dockview2.fromJSON(json)).not.toThrow();
        expect(dockview2.panels.map((p) => p.id).sort()).toEqual(['p1', 'p2']);

        dockview2.dispose();
    });
});
