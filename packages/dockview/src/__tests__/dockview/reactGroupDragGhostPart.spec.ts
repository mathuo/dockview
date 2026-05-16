import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewApi, IDockviewGroupPanel } from 'dockview-core';
import { ReactGroupDragGhostPart } from '../../dockview/reactGroupDragGhostPart';

describe('ReactGroupDragGhostPart', () => {
    test('element has class dv-react-part with inline-flex display', () => {
        const cut = new ReactGroupDragGhostPart(jest.fn(), {
            addPortal: jest.fn(),
        });

        expect(cut.element.className).toBe('dv-react-part');
        expect(cut.element.style.display).toBe('inline-flex');
    });

    test('part is undefined before init', () => {
        const cut = new ReactGroupDragGhostPart(jest.fn(), {
            addPortal: jest.fn(),
        });

        expect((cut as any).part).toBeUndefined();
    });

    test('init creates a ReactPart and registers a portal', () => {
        const addPortal = jest.fn().mockReturnValue({ dispose: jest.fn() });
        const cut = new ReactGroupDragGhostPart(jest.fn(), { addPortal });

        cut.init({
            group: fromPartial<IDockviewGroupPanel>({ id: 'g-1' }),
            api: fromPartial<DockviewApi>({}),
        });

        expect((cut as any).part).toBeDefined();
        expect(addPortal).toHaveBeenCalled();
    });

    test('init passes group and api to ReactPart', () => {
        const addPortal = jest.fn().mockReturnValue({ dispose: jest.fn() });
        const cut = new ReactGroupDragGhostPart(jest.fn(), { addPortal });

        const group = fromPartial<IDockviewGroupPanel>({ id: 'g-1' });
        const api = fromPartial<DockviewApi>({});

        cut.init({ group, api });

        const params = (cut as any).part.parameters;
        expect(params.group).toBe(group);
        expect(params.api).toBe(api);
    });

    test('dispose cleans up the part', () => {
        const addPortal = jest.fn().mockReturnValue({ dispose: jest.fn() });
        const cut = new ReactGroupDragGhostPart(jest.fn(), { addPortal });

        cut.init({
            group: fromPartial<IDockviewGroupPanel>({ id: 'g-1' }),
            api: fromPartial<DockviewApi>({}),
        });

        const disposeSpy = jest.spyOn((cut as any).part, 'dispose');
        cut.dispose();

        expect(disposeSpy).toHaveBeenCalled();
    });

    test('dispose before init does not throw', () => {
        const cut = new ReactGroupDragGhostPart(jest.fn(), {
            addPortal: jest.fn(),
        });

        expect(() => cut.dispose()).not.toThrow();
    });
});
