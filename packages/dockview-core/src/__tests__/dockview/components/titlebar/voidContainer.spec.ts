import { VoidContainer } from '../../../../dockview/components/titlebar/voidContainer';
import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewComponent } from '../../../../dockview/dockviewComponent';
import { DockviewGroupPanel } from '../../../../dockview/dockviewGroupPanel';
import { fireEvent } from '@testing-library/dom';
import {
    LocalSelectionTransfer,
    PanelTransfer,
} from '../../../../dnd/dataTransfer';
import { PointerDragController } from '../../../../dnd/pointer/pointerDragController';

describe('voidContainer', () => {
    test('that `pointerDown` triggers activation', () => {
        const accessor = fromPartial<DockviewComponent>({
            doSetGroupActive: jest.fn(),
            options: {},
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
                options: {},
            });
            const group = fromPartial<DockviewGroupPanel>({});
            const cut = new VoidContainer(accessor, group);

            expect(cut.element.draggable).toBe(true);
        });

        test('that void container is draggable when disableDnd is false', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: { disableDnd: false },
            });
            const group = fromPartial<DockviewGroupPanel>({});
            const cut = new VoidContainer(accessor, group);

            expect(cut.element.draggable).toBe(true);
        });

        test('that void container is not draggable when disableDnd is true', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: { disableDnd: true },
            });
            const group = fromPartial<DockviewGroupPanel>({});
            const cut = new VoidContainer(accessor, group);

            expect(cut.element.draggable).toBe(false);
        });

        test('that updateDragAndDropState updates draggable attribute based on disableDnd option', () => {
            const options = { disableDnd: false };
            const accessor = fromPartial<DockviewComponent>({
                options,
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
                options: { disableDnd: false },
            });
            const group = fromPartial<DockviewGroupPanel>({});
            const cut = new VoidContainer(accessor, group);

            expect(cut.element.classList.contains('dv-draggable')).toBe(true);
        });

        test('that void container does not have dv-draggable class when not draggable', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: { disableDnd: true },
            });
            const group = fromPartial<DockviewGroupPanel>({});
            const cut = new VoidContainer(accessor, group);

            expect(cut.element.classList.contains('dv-draggable')).toBe(false);
        });

        test('that updateDragAndDropState updates dv-draggable class based on disableDnd option', () => {
            const options = { disableDnd: false };
            const accessor = fromPartial<DockviewComponent>({
                options,
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

        test('that dragstart is prevented when disableDnd is true', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: { disableDnd: true },
            });
            const group = fromPartial<DockviewGroupPanel>({
                api: {
                    location: { type: 'grid' },
                },
            });
            const cut = new VoidContainer(accessor, group);

            const event = new Event('dragstart');
            const spy = jest.spyOn(event, 'preventDefault');
            fireEvent(cut.element, event);
            expect(spy).toHaveBeenCalledTimes(1);

            cut.dispose();
        });

        test('that dragstart is not prevented when disableDnd is false', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: { disableDnd: false },
            });
            const group = fromPartial<DockviewGroupPanel>({
                api: {
                    location: { type: 'grid' },
                },
            });
            const cut = new VoidContainer(accessor, group);

            const event = new Event('dragstart');
            const spy = jest.spyOn(event, 'preventDefault');
            fireEvent(cut.element, event);
            expect(spy).toHaveBeenCalledTimes(0);

            cut.dispose();
        });

        test('that updateDragAndDropState updates drag handler disabled state', () => {
            const options = { disableDnd: false };
            const accessor = fromPartial<DockviewComponent>({
                options,
            });
            const group = fromPartial<DockviewGroupPanel>({
                api: {
                    location: { type: 'grid' },
                },
            });
            const cut = new VoidContainer(accessor, group);

            // Initially not disabled
            let event = new Event('dragstart');
            let spy = jest.spyOn(event, 'preventDefault');
            fireEvent(cut.element, event);
            expect(spy).toHaveBeenCalledTimes(0);

            // Simulate option change to disabled
            options.disableDnd = true;
            cut.updateDragAndDropState();
            event = new Event('dragstart');
            spy = jest.spyOn(event, 'preventDefault');
            fireEvent(cut.element, event);
            expect(spy).toHaveBeenCalledTimes(1);

            // Change back to enabled
            options.disableDnd = false;
            cut.updateDragAndDropState();
            event = new Event('dragstart');
            spy = jest.spyOn(event, 'preventDefault');
            fireEvent(cut.element, event);
            expect(spy).toHaveBeenCalledTimes(0);

            cut.dispose();
        });

        test('that onDragStart is not fired when disableDnd is true', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: { disableDnd: true },
            });
            const group = fromPartial<DockviewGroupPanel>({
                api: {
                    location: { type: 'grid' },
                },
            });
            const cut = new VoidContainer(accessor, group);

            const spy = jest.fn();
            cut.onDragStart(spy);

            fireEvent.dragStart(cut.element);
            expect(spy).toHaveBeenCalledTimes(0);

            cut.dispose();
        });
    });

    describe('pointer (touch) drag', () => {
        afterEach(() => {
            PointerDragController.getInstance().cancel();
            LocalSelectionTransfer.getInstance().clearData(
                PanelTransfer.prototype
            );
        });

        test('a touch drag past threshold sets up a group PanelTransfer (panelId=null)', () => {
            const accessor = fromPartial<DockviewComponent>({
                doSetGroupActive: jest.fn(),
                id: 'componentId',
                options: {},
            });
            const group = fromPartial<DockviewGroupPanel>({
                id: 'groupId',
                api: { location: { type: 'grid' } },
                size: 1,
            });
            const cut = new VoidContainer(accessor, group);

            const onDragStart = jest.fn();
            cut.onDragStart(onDragStart);

            fireEvent.pointerDown(cut.element, {
                pointerId: 1,
                pointerType: 'touch',
                clientX: 0,
                clientY: 0,
            });
            fireEvent.pointerMove(window, {
                pointerId: 1,
                pointerType: 'touch',
                clientX: 50,
                clientY: 0,
            });

            expect(onDragStart).toHaveBeenCalledTimes(1);
            const transfer = LocalSelectionTransfer.getInstance<PanelTransfer>();
            expect(transfer.hasData(PanelTransfer.prototype)).toBe(true);
            const data = transfer.getData(PanelTransfer.prototype)!;
            expect(data[0].viewId).toBe('componentId');
            expect(data[0].groupId).toBe('groupId');
            // null panelId is the marker for a whole-group drag
            expect(data[0].panelId).toBeNull();

            cut.dispose();
        });

        test('a floating group cannot be dragged via touch (no shift modifier on touch)', () => {
            const accessor = fromPartial<DockviewComponent>({
                doSetGroupActive: jest.fn(),
                id: 'componentId',
                options: {},
            });
            const group = fromPartial<DockviewGroupPanel>({
                id: 'groupId',
                api: { location: { type: 'floating' } },
                size: 1,
            });
            const cut = new VoidContainer(accessor, group);

            const onDragStart = jest.fn();
            cut.onDragStart(onDragStart);

            fireEvent.pointerDown(cut.element, {
                pointerId: 1,
                pointerType: 'touch',
                clientX: 0,
                clientY: 0,
            });
            fireEvent.pointerMove(window, {
                pointerId: 1,
                pointerType: 'touch',
                clientX: 50,
                clientY: 0,
            });

            expect(onDragStart).not.toHaveBeenCalled();
            expect(
                LocalSelectionTransfer.getInstance().hasData(
                    PanelTransfer.prototype
                )
            ).toBe(false);

            cut.dispose();
        });

        test('disableDnd suppresses the touch drag', () => {
            const accessor = fromPartial<DockviewComponent>({
                doSetGroupActive: jest.fn(),
                id: 'componentId',
                options: { disableDnd: true },
            });
            const group = fromPartial<DockviewGroupPanel>({
                id: 'groupId',
                api: { location: { type: 'grid' } },
                size: 1,
            });
            const cut = new VoidContainer(accessor, group);

            const onDragStart = jest.fn();
            cut.onDragStart(onDragStart);

            fireEvent.pointerDown(cut.element, {
                pointerId: 1,
                pointerType: 'touch',
                clientX: 0,
                clientY: 0,
            });
            fireEvent.pointerMove(window, {
                pointerId: 1,
                pointerType: 'touch',
                clientX: 50,
                clientY: 0,
            });

            expect(onDragStart).not.toHaveBeenCalled();

            cut.dispose();
        });
    });
});
