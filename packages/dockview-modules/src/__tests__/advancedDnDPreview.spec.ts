import { DockviewComponent } from 'dockview-core';
import { IContentRenderer } from 'dockview-core';
import { IAdvancedDnDService } from 'dockview-core';

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
 * AdvancedDnD Phase 4 — the keyboard-docking seam. `showPreviewOverlay`
 * renders the same drop overlay a mouse drag shows, without a live drag, and
 * the returned disposable clears it.
 */
describe('AdvancedDnD showPreviewOverlay', () => {
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

    const service = (): IAdvancedDnDService =>
        // internal seam — consumed by the (future) AccessibilityModule
        (
            dockview as unknown as {
                _moduleRegistry: {
                    services: { advancedDnDService: IAdvancedDnDService };
                };
            }
        )._moduleRegistry.services.advancedDnDService;

    test('renders the drop overlay on a group, cleared on dispose', () => {
        const panel = dockview.addPanel({ id: 'p1', component: 'default' });
        const content = container.querySelector('.dv-content-container')!;

        expect(content.classList.contains('dv-drop-target')).toBe(false);

        const disposable = service().showPreviewOverlay(panel.group, 'left');
        expect(content.classList.contains('dv-drop-target')).toBe(true);

        disposable.dispose();
        expect(content.classList.contains('dv-drop-target')).toBe(false);
    });

    test('a second preview can replace a prior one (dispose is idempotent-safe)', () => {
        const panel = dockview.addPanel({ id: 'p1', component: 'default' });
        const content = container.querySelector('.dv-content-container')!;

        const a = service().showPreviewOverlay(panel.group, 'right');
        expect(content.classList.contains('dv-drop-target')).toBe(true);
        a.dispose();
        expect(content.classList.contains('dv-drop-target')).toBe(false);

        const b = service().showPreviewOverlay(panel.group, 'center');
        expect(content.classList.contains('dv-drop-target')).toBe(true);
        b.dispose();
        expect(content.classList.contains('dv-drop-target')).toBe(false);
    });
});
