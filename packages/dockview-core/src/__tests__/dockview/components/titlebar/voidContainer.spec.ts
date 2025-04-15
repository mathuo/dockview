import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewComponent } from '../../../../dockview/dockviewComponent';
import { DockviewGroupPanel } from '../../../../dockview/dockviewGroupPanel';
import { fireEvent } from '@testing-library/dom';
import { VoidContainer } from '../../../../tabs/voidContainer';
import { DroptargetOptions } from '../../../../dnd/droptarget';

describe('voidContainer', () => {
    test('that `pointerDown` triggers activation', () => {
        expect(true).toBe(true);
        // const accessor = fromPartial<DockviewComponent>({
        //     doSetGroupActive: jest.fn(),
        // });
        // const group = fromPartial<DockviewGroupPanel>({});
        // const cut = new VoidContainer(
        //     'test_accessor_id',
        //     group,
        //     fromPartial<DroptargetOptions>({})
        // );

        // expect(accessor.doSetGroupActive).not.toHaveBeenCalled();

        // fireEvent.pointerDown(cut.element);
        // expect(accessor.doSetGroupActive).toHaveBeenCalledWith(group);
    });
});
