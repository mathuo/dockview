import { FloatingTitleBar } from '../../../../dockview/components/titlebar/floatingTitleBar';
import { fromPartial } from '@total-typescript/shoehorn';
import type { DockviewComponent } from '../../../../dockview/dockviewComponent';
import type { DockviewGroupPanel } from '../../../../dockview/dockviewGroupPanel';
import { fireEvent } from '@testing-library/dom';
import { quasiDefaultPrevented } from '../../../../dom';
import {
    LocalSelectionTransfer,
    PanelTransfer,
} from '../../../../dnd/dataTransfer';

describe('floatingTitleBar', () => {
    afterEach(() => {
        LocalSelectionTransfer.getInstance().clearData(PanelTransfer.prototype);
    });

    function createGroup(overrides: Partial<DockviewGroupPanel> = {}) {
        return fromPartial<DockviewGroupPanel>({
            id: 'groupId',
            size: 1,
            api: fromPartial<DockviewGroupPanel['api']>({
                location: { type: 'grid' },
            }),
            ...overrides,
        });
    }

    describe('element construction', () => {
        test('that the element is a div with the dv-floating-titlebar class', () => {
            const accessor = fromPartial<DockviewComponent>({ options: {} });
            const group = createGroup();

            const cut = new FloatingTitleBar(accessor, group);

            expect(cut.element.tagName).toBe('DIV');
            expect(cut.element.className).toContain('dv-floating-titlebar');

            cut.dispose();
        });

        test('that the handle is draggable by default (dnd enabled)', () => {
            const accessor = fromPartial<DockviewComponent>({ options: {} });
            const cut = new FloatingTitleBar(accessor, createGroup());

            expect(cut.element.draggable).toBe(true);
            expect(cut.element.classList.contains('dv-draggable')).toBe(true);

            cut.dispose();
        });

        test('that the handle is not draggable when disableDnd is true', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: { disableDnd: true },
            });
            const cut = new FloatingTitleBar(accessor, createGroup());

            expect(cut.element.draggable).toBe(false);
            expect(cut.element.classList.contains('dv-draggable')).toBe(false);

            cut.dispose();
        });
    });

    describe('anchor group', () => {
        test('that the group getter returns the constructor group', () => {
            const accessor = fromPartial<DockviewComponent>({ options: {} });
            const group = createGroup();
            const cut = new FloatingTitleBar(accessor, group);

            expect(cut.group).toBe(group);

            cut.dispose();
        });

        test('that setGroup retargets the anchor group', () => {
            const accessor = fromPartial<DockviewComponent>({ options: {} });
            const group = createGroup({ id: 'groupA' });
            const nextGroup = createGroup({ id: 'groupB' });
            const cut = new FloatingTitleBar(accessor, group);

            cut.setGroup(nextGroup);

            expect(cut.group).toBe(nextGroup);

            cut.dispose();
        });
    });

    describe('pointerdown activation', () => {
        test('that pointerdown activates the anchor group', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: {},
                doSetGroupActive: jest.fn(),
            });
            const group = createGroup();
            const cut = new FloatingTitleBar(accessor, group);

            expect(accessor.doSetGroupActive).not.toHaveBeenCalled();

            fireEvent.pointerDown(cut.element);

            expect(accessor.doSetGroupActive).toHaveBeenCalledWith(group);

            cut.dispose();
        });

        test('that pointerdown activates the *current* anchor group after setGroup', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: {},
                doSetGroupActive: jest.fn(),
            });
            const group = createGroup({ id: 'groupA' });
            const nextGroup = createGroup({ id: 'groupB' });
            const cut = new FloatingTitleBar(accessor, group);

            cut.setGroup(nextGroup);
            fireEvent.pointerDown(cut.element);

            expect(accessor.doSetGroupActive).toHaveBeenCalledWith(nextGroup);
            expect(accessor.doSetGroupActive).not.toHaveBeenCalledWith(group);

            cut.dispose();
        });

        test('that pointerdown no longer activates once disposed', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: {},
                doSetGroupActive: jest.fn(),
            });
            const cut = new FloatingTitleBar(accessor, createGroup());

            cut.dispose();
            fireEvent.pointerDown(cut.element);

            expect(accessor.doSetGroupActive).not.toHaveBeenCalled();
        });
    });

    describe('shift+pointerdown disambiguation', () => {
        test('that a shift+pointerdown is quasi-prevented (blocks the overlay move drag)', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: {},
                doSetGroupActive: jest.fn(),
            });
            const cut = new FloatingTitleBar(accessor, createGroup());

            const event = new Event('pointerdown');
            (event as any).shiftKey = true;
            fireEvent(cut.element, event);

            expect(quasiDefaultPrevented(event)).toBe(true);

            cut.dispose();
        });

        test('that a plain pointerdown is NOT quasi-prevented', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: {},
                doSetGroupActive: jest.fn(),
            });
            const cut = new FloatingTitleBar(accessor, createGroup());

            const event = new Event('pointerdown');
            (event as any).shiftKey = false;
            fireEvent(cut.element, event);

            expect(quasiDefaultPrevented(event)).toBeFalsy();

            cut.dispose();
        });
    });

    describe('onDragStart wiring', () => {
        test('that the drag source drag-start is re-emitted through onDragStart', () => {
            const accessor = fromPartial<DockviewComponent>({
                id: 'accessorId',
                options: {},
                doSetGroupActive: jest.fn(),
            });
            const group = createGroup();
            const cut = new FloatingTitleBar(accessor, group);

            const onDragStart = jest.fn();
            cut.onDragStart(onDragStart);

            const event = new Event('dragstart');
            Object.defineProperty(event, 'dataTransfer', {
                value: {
                    setDragImage: jest.fn(),
                    setData: jest.fn(),
                    items: [],
                } as unknown as DataTransfer,
            });
            fireEvent(cut.element, event);

            expect(onDragStart).toHaveBeenCalledTimes(1);

            cut.dispose();
        });

        test('that the html5 drag publishes a whole-group PanelTransfer for the current anchor', () => {
            const accessor = fromPartial<DockviewComponent>({
                id: 'accessorId',
                options: {},
                doSetGroupActive: jest.fn(),
            });
            const group = createGroup({ id: 'groupA' });
            const nextGroup = createGroup({ id: 'groupB' });
            const cut = new FloatingTitleBar(accessor, group);

            // retarget before dragging: the drag source resolves the group
            // lazily, so the transfer must reference the new anchor.
            cut.setGroup(nextGroup);

            const event = new Event('dragstart');
            Object.defineProperty(event, 'dataTransfer', {
                value: {
                    setDragImage: jest.fn(),
                    setData: jest.fn(),
                    items: [],
                } as unknown as DataTransfer,
            });
            fireEvent(cut.element, event);

            const transfer =
                LocalSelectionTransfer.getInstance<PanelTransfer>();
            expect(transfer.hasData(PanelTransfer.prototype)).toBe(true);
            const data = transfer.getData(PanelTransfer.prototype)!;
            expect(data[0].viewId).toBe('accessorId');
            expect(data[0].groupId).toBe('groupB');
            // null panelId marks a whole-group drag
            expect(data[0].panelId).toBeNull();

            cut.dispose();
        });
    });

    describe('updateDragAndDropState', () => {
        test('that it re-reads dnd capabilities and toggles draggable state', () => {
            const options = { disableDnd: false };
            const accessor = fromPartial<DockviewComponent>({ options });
            const cut = new FloatingTitleBar(accessor, createGroup());

            expect(cut.element.draggable).toBe(true);
            expect(cut.element.classList.contains('dv-draggable')).toBe(true);

            options.disableDnd = true;
            cut.updateDragAndDropState();
            expect(cut.element.draggable).toBe(false);
            expect(cut.element.classList.contains('dv-draggable')).toBe(false);

            options.disableDnd = false;
            cut.updateDragAndDropState();
            expect(cut.element.draggable).toBe(true);
            expect(cut.element.classList.contains('dv-draggable')).toBe(true);

            cut.dispose();
        });
    });

    describe('disposal', () => {
        test('that dispose does not throw and can be called safely', () => {
            const accessor = fromPartial<DockviewComponent>({
                options: {},
                doSetGroupActive: jest.fn(),
            });
            const cut = new FloatingTitleBar(accessor, createGroup());

            expect(() => cut.dispose()).not.toThrow();
        });
    });
});
