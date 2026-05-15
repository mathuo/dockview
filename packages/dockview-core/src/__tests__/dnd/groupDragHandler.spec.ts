import { fireEvent } from '@testing-library/dom';
import { GroupDragHandler } from '../../dnd/groupDragHandler';
import { DockviewGroupPanel } from '../../dockview/dockviewGroupPanel';
import { LocalSelectionTransfer, PanelTransfer } from '../../dnd/dataTransfer';
import { DockviewComponent } from '../../dockview/dockviewComponent';
import { IGroupDragGhostRenderer } from '../../dockview/framework';

describe('groupDragHandler', () => {
    test('that the dnd transfer object is setup and torndown', () => {
        const element = document.createElement('div');

        const groupMock = jest.fn<DockviewGroupPanel, []>(() => {
            const partial: Partial<DockviewGroupPanel> = {
                id: 'test_group_id',
                api: { location: { type: 'grid' } } as any,
            };
            return partial as DockviewGroupPanel;
        });
        const group = new groupMock();

        const cut = new GroupDragHandler(
            element,
            { id: 'test_accessor_id' } as DockviewComponent,
            group
        );

        fireEvent.dragStart(element, new Event('dragstart'));

        expect(
            LocalSelectionTransfer.getInstance<PanelTransfer>().hasData(
                PanelTransfer.prototype
            )
        ).toBeTruthy();
        const transferObject =
            LocalSelectionTransfer.getInstance<PanelTransfer>().getData(
                PanelTransfer.prototype
            )![0];
        expect(transferObject).toBeTruthy();
        expect(transferObject.viewId).toBe('test_accessor_id');
        expect(transferObject.groupId).toBe('test_group_id');
        expect(transferObject.panelId).toBeNull();

        fireEvent.dragStart(element, new Event('dragend'));
        expect(
            LocalSelectionTransfer.getInstance<PanelTransfer>().hasData(
                PanelTransfer.prototype
            )
        ).toBeFalsy();

        cut.dispose();
    });
    test('that the event is cancelled when floating and shiftKey=true', () => {
        const element = document.createElement('div');

        const groupMock = jest.fn<DockviewGroupPanel, []>(() => {
            const partial: Partial<DockviewGroupPanel> = {
                api: { location: { type: 'floating' } } as any,
            };
            return partial as DockviewGroupPanel;
        });
        const group = new groupMock();

        const cut = new GroupDragHandler(
            element,
            { id: 'accessor_id' } as DockviewComponent,
            group
        );

        const event = new KeyboardEvent('dragstart', { shiftKey: false });

        const spy = jest.spyOn(event, 'preventDefault');
        fireEvent(element, event);
        expect(spy).toHaveBeenCalledTimes(1);

        const event2 = new KeyboardEvent('dragstart', { shiftKey: true });

        const spy2 = jest.spyOn(event2, 'preventDefault');
        fireEvent(element, event);
        expect(spy2).toHaveBeenCalledTimes(0);

        cut.dispose();
    });

    test('that the event is cancelled when the group is an empty edge group', () => {
        const element = document.createElement('div');

        const groupMock = jest.fn<DockviewGroupPanel, []>(() => {
            const partial: Partial<DockviewGroupPanel> = {
                api: {
                    location: { type: 'edge', position: 'left' },
                } as any,
                size: 0,
            };
            return partial as DockviewGroupPanel;
        });
        const group = new groupMock();

        const cut = new GroupDragHandler(
            element,
            { id: 'accessor_id' } as DockviewComponent,
            group
        );

        const event = new KeyboardEvent('dragstart', { shiftKey: false });
        const spy = jest.spyOn(event, 'preventDefault');
        fireEvent(element, event);
        expect(spy).toHaveBeenCalledTimes(1);

        cut.dispose();
    });

    test('that the event is not cancelled when the edge group has panels', () => {
        const element = document.createElement('div');

        const groupMock = jest.fn<DockviewGroupPanel, []>(() => {
            const partial: Partial<DockviewGroupPanel> = {
                api: {
                    location: { type: 'edge', position: 'left' },
                } as any,
                size: 1,
            };
            return partial as DockviewGroupPanel;
        });
        const group = new groupMock();

        const cut = new GroupDragHandler(
            element,
            { id: 'accessor_id' } as DockviewComponent,
            group
        );

        const event = new KeyboardEvent('dragstart', { shiftKey: false });
        const spy = jest.spyOn(event, 'preventDefault');
        fireEvent(element, event);
        expect(spy).toHaveBeenCalledTimes(0);

        cut.dispose();
    });

    test('that a custom createGroupDragGhostComponent factory is invoked and disposed', () => {
        jest.useFakeTimers();

        const element = document.createElement('div');

        const groupMock = jest.fn<DockviewGroupPanel, []>(() => {
            const partial: Partial<DockviewGroupPanel> = {
                id: 'g1',
                api: { location: { type: 'grid' } } as any,
                size: 3,
            };
            return partial as DockviewGroupPanel;
        });
        const group = new groupMock();

        const ghostElement = document.createElement('div');
        ghostElement.textContent = 'custom-ghost';

        const init = jest.fn();
        const dispose = jest.fn();
        const renderer: IGroupDragGhostRenderer = {
            element: ghostElement,
            init,
            dispose,
        };
        const factory = jest.fn(() => renderer);

        const fakeApi = { id: 'api-id' };
        const accessor = {
            id: 'accessor_id',
            api: fakeApi,
            options: { createGroupDragGhostComponent: factory },
        } as unknown as DockviewComponent;

        const cut = new GroupDragHandler(element, accessor, group);

        const dataTransfer = {
            setDragImage: jest.fn(),
        } as unknown as DataTransfer;
        const dragEvent = {
            dataTransfer,
        } as unknown as DragEvent;

        const disposable = cut.getData(dragEvent);

        expect(factory).toHaveBeenCalledWith(group);
        expect(init).toHaveBeenCalledWith({ group, api: fakeApi });
        expect(dataTransfer.setDragImage).toHaveBeenCalledWith(
            ghostElement,
            30,
            -10
        );
        expect(dispose).not.toHaveBeenCalled();

        jest.runAllTimers();
        expect(dispose).toHaveBeenCalledTimes(1);

        disposable.dispose();
        cut.dispose();
        jest.useRealTimers();
    });

    test('that the default ghost is used when no factory is provided', () => {
        jest.useFakeTimers();

        const element = document.createElement('div');

        const groupMock = jest.fn<DockviewGroupPanel, []>(() => {
            const partial: Partial<DockviewGroupPanel> = {
                id: 'g1',
                api: { location: { type: 'grid' } } as any,
                size: 4,
            };
            return partial as DockviewGroupPanel;
        });
        const group = new groupMock();

        const accessor = {
            id: 'accessor_id',
            api: {},
            options: {},
        } as unknown as DockviewComponent;

        const cut = new GroupDragHandler(element, accessor, group);

        const dataTransfer = {
            setDragImage: jest.fn(),
        } as unknown as DataTransfer;
        const dragEvent = {
            dataTransfer,
        } as unknown as DragEvent;

        const disposable = cut.getData(dragEvent);

        expect(dataTransfer.setDragImage).toHaveBeenCalledTimes(1);
        const ghost = (dataTransfer.setDragImage as jest.Mock).mock
            .calls[0][0] as HTMLElement;
        expect(ghost.textContent).toBe('Multiple Panels (4)');

        jest.runAllTimers();

        disposable.dispose();
        cut.dispose();
        jest.useRealTimers();
    });

    test('that the event is never cancelled when the group is not floating', () => {
        const element = document.createElement('div');

        const groupMock = jest.fn<DockviewGroupPanel, []>(() => {
            const partial: Partial<DockviewGroupPanel> = {
                api: { location: { type: 'grid' } } as any,
            };
            return partial as DockviewGroupPanel;
        });
        const group = new groupMock();

        const cut = new GroupDragHandler(
            element,
            { id: 'accessor_id' } as DockviewComponent,
            group
        );

        const event = new KeyboardEvent('dragstart', { shiftKey: false });

        const spy = jest.spyOn(event, 'preventDefault');
        fireEvent(element, event);
        expect(spy).toHaveBeenCalledTimes(0);

        const event2 = new KeyboardEvent('dragstart', { shiftKey: true });

        const spy2 = jest.spyOn(event2, 'preventDefault');
        fireEvent(element, event);
        expect(spy2).toHaveBeenCalledTimes(0);

        cut.dispose();
    });
});
