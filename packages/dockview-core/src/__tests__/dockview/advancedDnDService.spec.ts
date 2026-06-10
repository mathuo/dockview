import {
    AdvancedDnDService,
    IAdvancedDnDHost,
} from '../../dockview/advancedDnDService';

describe('AdvancedDnDService', () => {
    function createHost() {
        return {
            fireWillDragPanel: jest.fn(),
            fireWillDragGroup: jest.fn(),
            fireWillDrop: jest.fn(),
            fireWillShowOverlay: jest.fn(),
        } satisfies IAdvancedDnDHost;
    }

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

    test('dispose is a no-op and does not throw', () => {
        const service = new AdvancedDnDService(createHost());
        expect(() => service.dispose()).not.toThrow();
    });
});
