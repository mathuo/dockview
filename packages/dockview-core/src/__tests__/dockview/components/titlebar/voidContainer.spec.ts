import { VoidContainer } from '../../../../dockview/components/titlebar/voidContainer';
import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewComponent } from '../../../../dockview/dockviewComponent';
import { DockviewGroupPanel } from '../../../../dockview/dockviewGroupPanel';
import { fireEvent } from '@testing-library/dom';

describe('voidContainer', () => {
    test('that `pointerDown` triggers activation', () => {
        const accessor = fromPartial<DockviewComponent>({
            doSetGroupActive: jest.fn(),
            options: {}
        });
        const group = fromPartial<DockviewGroupPanel>({});
        const cut = new VoidContainer(accessor, group);

        expect(accessor.doSetGroupActive).not.toHaveBeenCalled();

        fireEvent.pointerDown(cut.element);
        expect(accessor.doSetGroupActive).toHaveBeenCalledWith(group);
    });

    describe('disableDnd option', () => {
        test('that void container is draggable by default (disableDnd not set)', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: {}
            });
            const group = fromPartial<DockviewGroupPanel>({});
            const cut = new VoidContainer(accessor, group);

            expect(cut.element.draggable).toBe(true);
        });

        test('that void container is draggable when disableDnd is false', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: { disableDnd: false }
            });
            const group = fromPartial<DockviewGroupPanel>({});
            const cut = new VoidContainer(accessor, group);

            expect(cut.element.draggable).toBe(true);
        });

        test('that void container is not draggable when disableDnd is true', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: { disableDnd: true }
            });
            const group = fromPartial<DockviewGroupPanel>({});
            const cut = new VoidContainer(accessor, group);

            expect(cut.element.draggable).toBe(false);
        });

        test('that updateDragAndDropState updates draggable attribute based on disableDnd option', () => {
            const options = { disableDnd: false };
            const accessor = fromPartial<DockviewComponent>({
                options
            });
            const group = fromPartial<DockviewGroupPanel>({});
            const cut = new VoidContainer(accessor, group);

            expect(cut.element.draggable).toBe(true);

            // Simulate option change
            options.disableDnd = true;
            cut.updateDragAndDropState();
            expect(cut.element.draggable).toBe(false);

            // Change back
            options.disableDnd = false;
            cut.updateDragAndDropState();
            expect(cut.element.draggable).toBe(true);
        });

        test('that void container has dv-draggable class when draggable', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: { disableDnd: false }
            });
            const group = fromPartial<DockviewGroupPanel>({});
            const cut = new VoidContainer(accessor, group);

            expect(cut.element.classList.contains('dv-draggable')).toBe(true);
        });

        test('that void container does not have dv-draggable class when not draggable', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: { disableDnd: true }
            });
            const group = fromPartial<DockviewGroupPanel>({});
            const cut = new VoidContainer(accessor, group);

            expect(cut.element.classList.contains('dv-draggable')).toBe(false);
        });

        test('that updateDragAndDropState updates dv-draggable class based on disableDnd option', () => {
            const options = { disableDnd: false };
            const accessor = fromPartial<DockviewComponent>({
                options
            });
            const group = fromPartial<DockviewGroupPanel>({});
            const cut = new VoidContainer(accessor, group);

            expect(cut.element.classList.contains('dv-draggable')).toBe(true);

            // Simulate option change
            options.disableDnd = true;
            cut.updateDragAndDropState();
            expect(cut.element.classList.contains('dv-draggable')).toBe(false);

            // Change back
            options.disableDnd = false;
            cut.updateDragAndDropState();
            expect(cut.element.classList.contains('dv-draggable')).toBe(true);
        });
    });
});
