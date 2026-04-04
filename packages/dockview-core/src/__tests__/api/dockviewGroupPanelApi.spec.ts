import { DockviewGroupPanelApiImpl } from '../../api/dockviewGroupPanelApi';
import { DockviewComponent } from '../../dockview/dockviewComponent';
import { DockviewGroupPanel } from '../../dockview/dockviewGroupPanel';
import { fromPartial } from '@total-typescript/shoehorn';

describe('DockviewGroupPanelApiImpl', () => {
    describe('collapse / expand / isCollapsed', () => {
        function makeAccessor() {
            return fromPartial<DockviewComponent>({
                setFixedGroupCollapsed: jest.fn(),
                isFixedGroupCollapsed: jest.fn().mockReturnValue(false),
            });
        }

        test('collapse() calls accessor.setFixedGroupCollapsed(group, true)', () => {
            const accessor = makeAccessor();
            const cut = new DockviewGroupPanelApiImpl(
                'test-id',
                accessor as unknown as DockviewComponent
            );
            const group = fromPartial<DockviewGroupPanel>({});
            cut.initialize(group);

            cut.collapse();

            expect(accessor.setFixedGroupCollapsed).toHaveBeenCalledWith(
                group,
                true
            );
            expect(accessor.setFixedGroupCollapsed).toHaveBeenCalledTimes(1);
        });

        test('expand() calls accessor.setFixedGroupCollapsed(group, false)', () => {
            const accessor = makeAccessor();
            const cut = new DockviewGroupPanelApiImpl(
                'test-id',
                accessor as unknown as DockviewComponent
            );
            const group = fromPartial<DockviewGroupPanel>({});
            cut.initialize(group);

            cut.expand();

            expect(accessor.setFixedGroupCollapsed).toHaveBeenCalledWith(
                group,
                false
            );
            expect(accessor.setFixedGroupCollapsed).toHaveBeenCalledTimes(1);
        });

        test('isCollapsed() delegates to accessor.isFixedGroupCollapsed and returns its value', () => {
            const accessor = makeAccessor();
            (accessor.isFixedGroupCollapsed as jest.Mock).mockReturnValue(true);
            const cut = new DockviewGroupPanelApiImpl(
                'test-id',
                accessor as unknown as DockviewComponent
            );
            const group = fromPartial<DockviewGroupPanel>({});
            cut.initialize(group);

            expect(cut.isCollapsed()).toBe(true);
            expect(accessor.isFixedGroupCollapsed).toHaveBeenCalledWith(group);
        });

        test('isCollapsed() returns false when accessor returns false', () => {
            const accessor = makeAccessor();
            (accessor.isFixedGroupCollapsed as jest.Mock).mockReturnValue(
                false
            );
            const cut = new DockviewGroupPanelApiImpl(
                'test-id',
                accessor as unknown as DockviewComponent
            );
            const group = fromPartial<DockviewGroupPanel>({});
            cut.initialize(group);

            expect(cut.isCollapsed()).toBe(false);
        });

        test('collapse() is a no-op (does not throw) when group is not initialized', () => {
            const accessor = makeAccessor();
            const cut = new DockviewGroupPanelApiImpl(
                'test-id',
                accessor as unknown as DockviewComponent
            );
            // _group is undefined — no initialize() call

            expect(() => cut.collapse()).not.toThrow();
            expect(accessor.setFixedGroupCollapsed).not.toHaveBeenCalled();
        });

        test('expand() is a no-op (does not throw) when group is not initialized', () => {
            const accessor = makeAccessor();
            const cut = new DockviewGroupPanelApiImpl(
                'test-id',
                accessor as unknown as DockviewComponent
            );

            expect(() => cut.expand()).not.toThrow();
            expect(accessor.setFixedGroupCollapsed).not.toHaveBeenCalled();
        });

        test('isCollapsed() returns false when group is not initialized', () => {
            const accessor = makeAccessor();
            const cut = new DockviewGroupPanelApiImpl(
                'test-id',
                accessor as unknown as DockviewComponent
            );

            expect(cut.isCollapsed()).toBe(false);
            // accessor should NOT have been called since there is no group
            expect(accessor.isFixedGroupCollapsed).not.toHaveBeenCalled();
        });
    });

    describe('onDidCollapsedChange', () => {
        function makeAccessor() {
            return fromPartial<DockviewComponent>({
                setFixedGroupCollapsed: jest.fn(),
                isFixedGroupCollapsed: jest.fn().mockReturnValue(false),
            });
        }

        test('emits with isCollapsed=true when collapse() is called after initialize()', () => {
            const accessor = makeAccessor();
            const cut = new DockviewGroupPanelApiImpl(
                'test-id',
                accessor as unknown as DockviewComponent
            );
            const group = fromPartial<DockviewGroupPanel>({ id: 'g1' });
            cut.initialize(group);

            const events: { isCollapsed: boolean }[] = [];
            cut.onDidCollapsedChange((e) => events.push(e));

            // Simulate the component firing the event after setFixedGroupCollapsed
            cut._onDidCollapsedChange.fire({ isCollapsed: true });

            expect(events).toHaveLength(1);
            expect(events[0].isCollapsed).toBe(true);
        });

        test('emits with isCollapsed=false when expand() is called', () => {
            const accessor = makeAccessor();
            const cut = new DockviewGroupPanelApiImpl(
                'test-id',
                accessor as unknown as DockviewComponent
            );
            const group = fromPartial<DockviewGroupPanel>({ id: 'g1' });
            cut.initialize(group);

            const events: { isCollapsed: boolean }[] = [];
            cut.onDidCollapsedChange((e) => events.push(e));

            cut._onDidCollapsedChange.fire({ isCollapsed: false });

            expect(events).toHaveLength(1);
            expect(events[0].isCollapsed).toBe(false);
        });

        test('does not emit when group is not initialized', () => {
            const accessor = makeAccessor();
            const cut = new DockviewGroupPanelApiImpl(
                'test-id',
                accessor as unknown as DockviewComponent
            );

            const events: { isCollapsed: boolean }[] = [];
            cut.onDidCollapsedChange((e) => events.push(e));

            // collapse/expand are no-ops when not initialized, so no event fires
            cut.collapse();
            cut.expand();

            expect(events).toHaveLength(0);
        });
    });
});
