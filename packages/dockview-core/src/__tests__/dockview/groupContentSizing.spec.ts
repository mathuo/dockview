import { DockviewComponent } from '../../dockview/dockviewComponent';
import { IContentRenderer } from '../../dockview/types';
import { GroupPanelPartInitParameters } from '../../dockview/types';
import { PanelUpdateEvent } from '../../panel/types';

class TestContentPart implements IContentRenderer {
    public element = document.createElement('div');

    constructor(public readonly id: string) {
        this.element.className = `content-part-${id}`;
    }

    init(_params: GroupPanelPartInitParameters): void {
        //
    }

    layout(_width: number, _height: number): void {
        //
    }

    update(_event: PanelUpdateEvent): void {
        //
    }

    dispose(): void {
        //
    }
}

/**
 * The group lays panels out with the *content-area* dimensions: the group box
 * minus the header along its axis. That way panels (and `onDidDimensionsChange`)
 * receive the real space they occupy, not the header-inclusive group box.
 *
 * jsdom performs no layout, so `offset*` is 0 by default and nothing is
 * subtracted; these tests stub the header element's `offsetHeight`/`offsetWidth`
 * to simulate a measured header.
 */
describe('group content sizing (header-aware)', () => {
    function createComponent() {
        return new DockviewComponent(document.createElement('div'), {
            createComponent(options) {
                switch (options.name) {
                    case 'component':
                        return new TestContentPart(options.id);
                    default:
                        throw new Error(`unsupported ${options.name}`);
                }
            },
        });
    }

    function stubOffset(
        element: HTMLElement,
        prop: 'offsetWidth' | 'offsetHeight',
        value: number
    ): void {
        Object.defineProperty(element, prop, {
            configurable: true,
            get: () => value,
        });
    }

    function getHeaderElement(group: { element: HTMLElement }): HTMLElement {
        const header = group.element.querySelector<HTMLElement>(
            '.dv-tabs-and-actions-container'
        );
        if (!header) {
            throw new Error('header element not found');
        }
        return header;
    }

    test('horizontal header (top): content height = group height - header height', () => {
        const cut = createComponent();
        const panel = cut.addPanel({ id: 'panel1', component: 'component' });
        const group = panel.group;

        stubOffset(getHeaderElement(group), 'offsetHeight', 35);

        const dimensions: { width: number; height: number }[] = [];
        const disposable = panel.api.onDidDimensionsChange((event) =>
            dimensions.push({ width: event.width, height: event.height })
        );

        group.layout(200, 100);

        expect(dimensions).toContainEqual({ width: 200, height: 65 });

        disposable.dispose();
        cut.dispose();
    });

    test('vertical header (left): content width = group width - header width', () => {
        const cut = createComponent();
        const panel = cut.addPanel({ id: 'panel1', component: 'component' });
        const group = panel.group;

        group.model.headerPosition = 'left';
        stubOffset(getHeaderElement(group), 'offsetWidth', 40);

        const dimensions: { width: number; height: number }[] = [];
        const disposable = panel.api.onDidDimensionsChange((event) =>
            dimensions.push({ width: event.width, height: event.height })
        );

        group.layout(200, 100);

        expect(dimensions).toContainEqual({ width: 160, height: 100 });

        disposable.dispose();
        cut.dispose();
    });

    test('no measurable header (hidden / zero offset): content gets the full box', () => {
        const cut = createComponent();
        const panel = cut.addPanel({ id: 'panel1', component: 'component' });
        const group = panel.group;

        // header offset stays 0 (jsdom default ≈ display:none header)
        const dimensions: { width: number; height: number }[] = [];
        const disposable = panel.api.onDidDimensionsChange((event) =>
            dimensions.push({ width: event.width, height: event.height })
        );

        group.layout(200, 100);

        expect(dimensions).toContainEqual({ width: 200, height: 100 });

        disposable.dispose();
        cut.dispose();
    });

    test('subtraction is floored at 0 when the header is taller than the box', () => {
        const cut = createComponent();
        const panel = cut.addPanel({ id: 'panel1', component: 'component' });
        const group = panel.group;

        stubOffset(getHeaderElement(group), 'offsetHeight', 150);

        const dimensions: { width: number; height: number }[] = [];
        const disposable = panel.api.onDidDimensionsChange((event) =>
            dimensions.push({ width: event.width, height: event.height })
        );

        group.layout(200, 100);

        expect(dimensions).toContainEqual({ width: 200, height: 0 });

        disposable.dispose();
        cut.dispose();
    });

    test('relayout() re-applies current dimensions with the latest header size', () => {
        const cut = createComponent();
        const panel = cut.addPanel({ id: 'panel1', component: 'component' });
        const group = panel.group;

        const header = getHeaderElement(group);
        stubOffset(header, 'offsetHeight', 30);
        group.layout(200, 100);

        const dimensions: { width: number; height: number }[] = [];
        const disposable = panel.api.onDidDimensionsChange((event) =>
            dimensions.push({ width: event.width, height: event.height })
        );

        // header grows (e.g. a second tab row) without the group box changing
        stubOffset(header, 'offsetHeight', 60);
        group.relayout();

        expect(dimensions).toContainEqual({ width: 200, height: 40 });

        disposable.dispose();
        cut.dispose();
    });
});
