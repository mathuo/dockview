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

    describe('HTML5 drag cancellation predicate', () => {
        // These predicates used to live in `GroupDragHandler.isCancelled`;
        // they're now inlined into `voidContainer.ts` as the html5 backend
        // drag source's `isCancelled` callback. Behavior is preserved.

        test('floating group: dragstart is prevented when shiftKey is not held', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: {},
            });
            const group = fromPartial<DockviewGroupPanel>({
                api: { location: { type: 'floating' } },
            });
            const cut = new VoidContainer(accessor, group);

            const event = new Event('dragstart') as DragEvent;
            // jsdom's DragEvent constructor doesn't preserve shiftKey,
            // so the default-false matches the unshifted case.
            const spy = jest.spyOn(event, 'preventDefault');
            fireEvent(cut.element, event);
            expect(spy).toHaveBeenCalledTimes(1);

            cut.dispose();
        });

        test('edge group with zero panels: dragstart is prevented', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: {},
            });
            const group = fromPartial<DockviewGroupPanel>({
                api: { location: { type: 'edge', position: 'left' } },
                size: 0,
            });
            const cut = new VoidContainer(accessor, group);

            const event = new Event('dragstart');
            const spy = jest.spyOn(event, 'preventDefault');
            fireEvent(cut.element, event);
            expect(spy).toHaveBeenCalledTimes(1);

            cut.dispose();
        });

        test('edge group with panels: dragstart is allowed', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: {},
            });
            const group = fromPartial<DockviewGroupPanel>({
                api: { location: { type: 'edge', position: 'left' } },
                size: 1,
            });
            const cut = new VoidContainer(accessor, group);

            const event = new Event('dragstart');
            const spy = jest.spyOn(event, 'preventDefault');
            fireEvent(cut.element, event);
            expect(spy).toHaveBeenCalledTimes(0);

            cut.dispose();
        });

        test('grid group: dragstart is allowed regardless of shiftKey', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: {},
            });
            const group = fromPartial<DockviewGroupPanel>({
                api: { location: { type: 'grid' } },
            });
            const cut = new VoidContainer(accessor, group);

            const event = new Event('dragstart');
            const spy = jest.spyOn(event, 'preventDefault');
            fireEvent(cut.element, event);
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

        test('a touch press held past the initiation delay sets up a group PanelTransfer (panelId=null)', () => {
            jest.useFakeTimers();
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
            jest.advanceTimersByTime(300);
            fireEvent.pointerMove(window, {
                pointerId: 1,
                pointerType: 'touch',
                clientX: 50,
                clientY: 0,
            });

            expect(onDragStart).toHaveBeenCalledTimes(1);
            const transfer =
                LocalSelectionTransfer.getInstance<PanelTransfer>();
            expect(transfer.hasData(PanelTransfer.prototype)).toBe(true);
            const data = transfer.getData(PanelTransfer.prototype)!;
            expect(data[0].viewId).toBe('componentId');
            expect(data[0].groupId).toBe('groupId');
            // null panelId is the marker for a whole-group drag
            expect(data[0].panelId).toBeNull();

            cut.dispose();
            jest.useRealTimers();
        });

        test('a floating group can be touch-dragged (long-press substitutes for the HTML5 shift modifier)', () => {
            jest.useFakeTimers();
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
            // Hold past the touch initiation delay before moving.
            jest.advanceTimersByTime(300);
            fireEvent.pointerMove(window, {
                pointerId: 1,
                pointerType: 'touch',
                clientX: 50,
                clientY: 0,
            });

            expect(onDragStart).toHaveBeenCalledTimes(1);
            expect(
                LocalSelectionTransfer.getInstance().hasData(
                    PanelTransfer.prototype
                )
            ).toBe(true);

            cut.dispose();
            jest.useRealTimers();
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
