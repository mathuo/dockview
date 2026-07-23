import { DockviewWillShowOverlayLocationEvent } from '../../dockview/events';

describe('DockviewWillShowOverlayLocationEvent', () => {
    test('delegates every getter to the underlying event / options', () => {
        const nativeEvent = {} as any;
        const preventDefault = jest.fn();
        const event = {
            nativeEvent,
            position: 'left',
            edge: true,
            edgeGroup: false,
            defaultPrevented: false,
            preventDefault,
        } as any;

        const panel = { id: 'p1' } as any;
        const api = { id: 'api' } as any;
        const group = { id: 'g1' } as any;
        const transfer = { panelId: 'p1' } as any;
        const getData = jest.fn().mockReturnValue(transfer);
        const options = {
            kind: 'content' as const,
            panel,
            api,
            group,
            getData,
        };

        const sut = new DockviewWillShowOverlayLocationEvent(event, options);

        // options-derived
        expect(sut.kind).toBe('content');
        expect(sut.panel).toBe(panel);
        expect(sut.api).toBe(api);
        expect(sut.group).toBe(group);

        // event-derived
        expect(sut.nativeEvent).toBe(nativeEvent);
        expect(sut.position).toBe('left');
        expect(sut.edge).toBe(true);
        expect(sut.edgeGroup).toBe(false);
        expect(sut.defaultPrevented).toBe(false);

        // methods delegate through
        expect(sut.getData()).toBe(transfer);
        expect(getData).toHaveBeenCalledTimes(1);

        sut.preventDefault();
        expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    test('reflects a prevented event and undefined panel / group', () => {
        const event = {
            defaultPrevented: true,
            preventDefault: jest.fn(),
        } as any;
        const options = {
            kind: 'edge' as const,
            panel: undefined,
            api: {} as any,
            group: undefined,
            getData: () => undefined,
        };

        const sut = new DockviewWillShowOverlayLocationEvent(event, options);

        expect(sut.defaultPrevented).toBe(true);
        expect(sut.panel).toBeUndefined();
        expect(sut.group).toBeUndefined();
        expect(sut.getData()).toBeUndefined();
    });
});
