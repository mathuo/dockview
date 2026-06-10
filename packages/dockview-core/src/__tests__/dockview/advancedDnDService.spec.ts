import {
    AdvancedDnDService,
    IAdvancedDnDHost,
} from '../../dockview/advancedDnDService';
import { DockviewComponentOptions } from '../../dockview/options';
import { DockviewApi } from '../../api/component.api';
import { DockviewGroupPanel } from '../../dockview/dockviewGroupPanel';

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

    test('dispose is a no-op and does not throw', () => {
        const service = new AdvancedDnDService(createHost());
        expect(() => service.dispose()).not.toThrow();
    });
});
