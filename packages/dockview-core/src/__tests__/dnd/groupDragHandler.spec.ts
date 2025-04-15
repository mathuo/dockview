import { fireEvent } from '@testing-library/dom';
import {
    GroupDragHandler,
    GroupDragHandlerOptions,
} from '../../dnd/groupDragHandler';
import { LocalSelectionTransfer, PanelTransfer } from '../../dnd/dataTransfer';
import { fromPartial } from '@total-typescript/shoehorn';

describe('groupDragHandler', () => {
    test('that the dnd transfer object is setup and torndown', () => {
        const element = document.createElement('div');

        const cut = new GroupDragHandler(
            element,
            'accessor_id',
            fromPartial<GroupDragHandlerOptions>({
                id: 'test_group_id',
                isCancelled: () => false,
            })
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
        expect(transferObject.viewId).toBe('accessor_id');
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
    // test('that the event is cancelled when floating and shiftKey=true', () => {
    //     const element = document.createElement('div');

    //     const cut = new GroupDragHandler(
    //         element,
    //         'accessor_id',
    //         fromPartial<GroupDragHandlerOptions>({
    //             isCancelled: () => false,
    //             id: 'test_group_id',
    //         })
    //     );

    //     const event = new KeyboardEvent('dragstart', { shiftKey: false });

    //     const spy = jest.spyOn(event, 'preventDefault');
    //     fireEvent(element, event);
    //     expect(spy).toHaveBeenCalledTimes(1);

    //     const event2 = new KeyboardEvent('dragstart', { shiftKey: true });

    //     const spy2 = jest.spyOn(event2, 'preventDefault');
    //     fireEvent(element, event);
    //     expect(spy2).toHaveBeenCalledTimes(0);

    //     cut.dispose();
    // });

    test('that the event is never cancelled when the group is not floating', () => {
        const element = document.createElement('div');

        const cut = new GroupDragHandler(
            element,
            'accessor_id',
            fromPartial<GroupDragHandlerOptions>({
                isCancelled: () => false,
                id: 'test_group_id',
            })
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
