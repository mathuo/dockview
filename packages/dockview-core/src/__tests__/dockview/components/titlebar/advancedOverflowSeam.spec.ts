import { fireEvent } from '@testing-library/dom';
import { DockviewComponent } from '../../../../dockview/dockviewComponent';
import { IContentRenderer } from '../../../../dockview/types';

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

// jsdom lacks scrollIntoView; the free row activation calls it on click.
beforeAll(() => {
    if (!Element.prototype.scrollIntoView) {
        Element.prototype.scrollIntoView = function scrollIntoView() {
            /* noop */
        };
    }
});

/**
 * The overflow rendering seam: `TabsContainer.toggleDropdown` builds the popover
 * body through `createOverflowRenderContext` and, when
 * `accessor.advancedOverflowService` is present, hands it to the module;
 * otherwise it renders the free flat list. No module is registered in core, so
 * this proves the `?.`-guard falls through to the free helper — the byte-for-byte
 * behaviour dockview shipped before the seam existed.
 */
describe('advanced overflow seam — free fallback (no module)', () => {
    let container: HTMLElement;

    const make = (): DockviewComponent => {
        container = document.createElement('div');
        document.body.appendChild(container);
        const dockview = new DockviewComponent(container, {
            createComponent: () => new TestPanel(),
        });
        dockview.layout(400, 300);
        return dockview;
    };

    afterEach(() => {
        container?.remove();
    });

    const openOverflow = (
        dockview: DockviewComponent,
        anyPanel: any,
        ids: string[]
    ): void => {
        const overflowSet = new Set(ids);
        anyPanel.group.model.header.setForcedOverflow((id: string) =>
            overflowSet.has(id)
        );
        anyPanel.group.model.header.refreshOverflow();
        const root = container.querySelector<HTMLElement>(
            '.dv-tabs-overflow-dropdown-root'
        );
        if (root) {
            fireEvent.click(root);
        }
    };

    test('renders the free flat list (no advanced upgrade) with the overflow rows', () => {
        const dockview = make();
        expect(dockview.advancedOverflowService).toBeUndefined();

        const panels = ['a', 'b', 'c'].map((id) =>
            dockview.addPanel({ id, component: 'default', title: id })
        );

        openOverflow(dockview, panels[0], ['b', 'c']);

        const body = container.querySelector('.dv-tabs-overflow-container');
        expect(body).toBeTruthy();
        // The module-only marker class must be absent.
        expect(body!.classList.contains('dv-tabs-overflow-advanced')).toBe(
            false
        );
        // No search input in the free path.
        expect(body!.querySelector('.dv-tabs-overflow-search')).toBeNull();
        // The clipped tabs render as rows.
        expect(body!.querySelectorAll('.dv-tab').length).toBe(2);

        dockview.dispose();
    });

    test('clicking a free row activates its panel and closes the popover', () => {
        const dockview = make();
        const panels = ['a', 'b', 'c'].map((id) =>
            dockview.addPanel({ id, component: 'default', title: id })
        );

        openOverflow(dockview, panels[0], ['b', 'c']);

        const row = Array.from(
            container.querySelectorAll<HTMLElement>(
                '.dv-tabs-overflow-container .dv-tab'
            )
        ).find((el) => el.textContent!.trim() === 'c')!;
        fireEvent.click(row);

        expect(panels[2].api.isActive).toBe(true);
        expect(
            container.querySelector('.dv-tabs-overflow-container')
        ).toBeNull();

        dockview.dispose();
    });
});
