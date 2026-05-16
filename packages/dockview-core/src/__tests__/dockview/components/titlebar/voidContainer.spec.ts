import { VoidContainer } from '../../../../dockview/components/titlebar/voidContainer';
import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewComponent } from '../../../../dockview/dockviewComponent';
import { DockviewGroupPanel } from '../../../../dockview/dockviewGroupPanel';
import { DockviewGroupPanelModel } from '../../../../dockview/dockviewGroupPanelModel';
import {
    LocalSelectionTransfer,
    PanelTransfer,
} from '../../../../dnd/dataTransfer';
import { fireEvent } from '@testing-library/dom';

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

    describe('locked group (regression #990)', () => {
        function setup(lockedValue: boolean | 'no-drop-target') {
            const accessor = fromPartial<DockviewComponent>({
                id: 'testcomponentid',
                options: {},
                doSetGroupActive: jest.fn(),
            });

            const groupView = fromPartial<DockviewGroupPanelModel>({
                canDisplayOverlay: jest.fn().mockReturnValue(true),
                dropTargetContainer: undefined,
            });

            const group = fromPartial<DockviewGroupPanel>({
                id: 'testgroupid',
                model: groupView,
                api: fromPartial<DockviewGroupPanel['api']>({
                    locked: lockedValue,
                }),
            });

            const cut = new VoidContainer(accessor, group);

            jest.spyOn(cut.element, 'offsetHeight', 'get').mockImplementation(
                () => 100
            );
            jest.spyOn(cut.element, 'offsetWidth', 'get').mockImplementation(
                () => 100
            );

            return { cut, groupView };
        }

        afterEach(() => {
            LocalSelectionTransfer.getInstance().clearData(
                PanelTransfer.prototype
            );
        });

        test.each([true, 'no-drop-target' as const])(
            'does not display a drop overlay when locked=%p, even for same-accessor drags',
            (lockedValue) => {
                const { cut, groupView } = setup(lockedValue);

                LocalSelectionTransfer.getInstance().setData(
                    [
                        new PanelTransfer(
                            'testcomponentid',
                            'anothergroupid',
                            'panel1'
                        ),
                    ],
                    PanelTransfer.prototype
                );

                fireEvent.dragEnter(cut.element);
                fireEvent.dragOver(cut.element);

                expect(
                    cut.element.parentElement?.getElementsByClassName(
                        'dv-drop-target-dropzone'
                    ).length ?? 0
                ).toBe(0);
                // short-circuited before consulting the group model
                expect(groupView.canDisplayOverlay).not.toHaveBeenCalled();

                cut.dispose();
            }
        );

        test('still displays a drop overlay for same-accessor drags when not locked', () => {
            const { cut } = setup(false);

            LocalSelectionTransfer.getInstance().setData(
                [
                    new PanelTransfer(
                        'testcomponentid',
                        'anothergroupid',
                        'panel1'
                    ),
                ],
                PanelTransfer.prototype
            );

            fireEvent.dragEnter(cut.element);
            fireEvent.dragOver(cut.element);

            expect(
                cut.element.getElementsByClassName('dv-drop-target-dropzone')
                    .length
            ).toBe(1);

            cut.dispose();
        });
    });
});
