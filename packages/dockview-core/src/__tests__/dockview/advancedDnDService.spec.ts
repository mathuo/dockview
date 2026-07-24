import { AdvancedDnDService } from '../../index';
import { IAdvancedDnDHost } from '../../index';
import { DockviewComponentOptions } from '../../index';
import { DockviewApi } from '../../index';
import { DockviewGroupPanel } from '../../index';
import { DockviewComponent } from '../../index';
import { IContentRenderer } from '../../index';

describe('AdvancedDnDService', () => {
    function createHost(
        options: Partial<DockviewComponentOptions> = {}
    ): IAdvancedDnDHost & {
        fireWillDragPanel: jest.Mock;
        fireWillDragGroup: jest.Mock;
        fireWillDrop: jest.Mock;
        fireWillShowOverlay: jest.Mock;
    } {
        return {
            options: options as DockviewComponentOptions,
            api: {} as DockviewApi,
            fireWillDragPanel: jest.fn(),
            fireWillDragGroup: jest.fn(),
            fireWillDrop: jest.fn(),
            fireWillShowOverlay: jest.fn(),
        };
    }

    describe('hook dispatch', () => {
        test('dispatch methods forward to the host emitters', () => {
            const host = createHost();
            const service = new AdvancedDnDService(host);

            const panelEvent = {} as never;
            const groupEvent = {} as never;
            const dropEvent = {} as never;
            const overlayEvent = {} as never;

            service.dispatchWillDragPanel(panelEvent);
            service.dispatchWillDragGroup(groupEvent);
            service.dispatchWillDrop(dropEvent);
            service.dispatchWillShowOverlay(overlayEvent);

            expect(host.fireWillDragPanel).toHaveBeenCalledWith(panelEvent);
            expect(host.fireWillDragGroup).toHaveBeenCalledWith(groupEvent);
            expect(host.fireWillDrop).toHaveBeenCalledWith(dropEvent);
            expect(host.fireWillShowOverlay).toHaveBeenCalledWith(overlayEvent);
        });

        test('a dispatch only fires its own host emitter', () => {
            const host = createHost();
            const service = new AdvancedDnDService(host);

            service.dispatchWillDrop({} as never);

            expect(host.fireWillDrop).toHaveBeenCalledTimes(1);
            expect(host.fireWillDragPanel).not.toHaveBeenCalled();
            expect(host.fireWillDragGroup).not.toHaveBeenCalled();
            expect(host.fireWillShowOverlay).not.toHaveBeenCalled();
        });
    });

    describe('group drag ghost', () => {
        test('returns undefined when no custom factory is configured', () => {
            const service = new AdvancedDnDService(createHost());
            expect(
                service.buildGroupDragGhost({} as DockviewGroupPanel)
            ).toBeUndefined();
        });

        test('resolves the custom factory and initialises the renderer', () => {
            const element = document.createElement('div');
            const init = jest.fn();
            const dispose = jest.fn();
            const factory = jest.fn(() => ({ element, init, dispose }));

            const host = createHost({
                createGroupDragGhostComponent: factory as never,
            });
            const service = new AdvancedDnDService(host);
            const group = {} as DockviewGroupPanel;

            const spec = service.buildGroupDragGhost(group);

            expect(factory).toHaveBeenCalledWith(group);
            expect(init).toHaveBeenCalledWith({ group, api: host.api });
            expect(spec).toMatchObject({ element, offsetX: 30, offsetY: -10 });

            // dispose forwarder calls through to the renderer's dispose
            spec!.dispose!();
            expect(dispose).toHaveBeenCalledTimes(1);
        });

        test('omits a dispose forwarder when the renderer has none', () => {
            const factory = jest.fn(() => ({
                element: document.createElement('div'),
                init: jest.fn(),
            }));
            const service = new AdvancedDnDService(
                createHost({
                    createGroupDragGhostComponent: factory as never,
                })
            );

            const spec = service.buildGroupDragGhost({} as DockviewGroupPanel);
            expect(spec!.dispose).toBeUndefined();
        });
    });

    describe('overlay model resolution', () => {
        test('forwards location + group to the option and returns its result', () => {
            const model = { size: { value: 30, type: 'percentage' as const } };
            const dropOverlayModel = jest.fn(() => model);
            const service = new AdvancedDnDService(
                createHost({ dropOverlayModel })
            );
            const group = {} as DockviewGroupPanel;

            const result = service.resolveOverlayModel('content', group);

            expect(dropOverlayModel).toHaveBeenCalledWith({
                location: 'content',
                group,
            });
            expect(result).toBe(model);
        });

        test('returns undefined when no option is configured', () => {
            const service = new AdvancedDnDService(createHost());
            expect(service.resolveOverlayModel('tab')).toBeUndefined();
        });
    });

    test('dispose is a no-op and does not throw', () => {
        const service = new AdvancedDnDService(createHost());
        expect(() => service.dispose()).not.toThrow();
    });
});

class TestContentPart implements IContentRenderer {
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

describe('dropOverlayModel integration', () => {
    test('is consulted for tab, content and header_space targets (not edge)', () => {
        const container = document.createElement('div');
        const dropOverlayModel = jest.fn(() => undefined);

        const dockview = new DockviewComponent(container, {
            createComponent: () => new TestContentPart(),
            dropOverlayModel,
        });
        dockview.layout(800, 600);
        dockview.addPanel({ id: 'p1', component: 'default' });

        const locations = dropOverlayModel.mock.calls.map(
            (call) => (call[0] as { location: string }).location
        );

        expect(locations).toContain('tab');
        expect(locations).toContain('content');
        expect(locations).toContain('header_space');
        expect(locations).not.toContain('edge');

        dockview.dispose();
    });
});
