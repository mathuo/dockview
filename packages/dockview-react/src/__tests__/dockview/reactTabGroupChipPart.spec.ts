import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewApi, ITabGroup } from 'dockview';
import { ReactTabGroupChipPart } from '../../dockview/reactTabGroupChipPart';
import { ReactPortalStore } from '../../react';

describe('ReactTabGroupChipPart', () => {
    test('element has class dv-react-part with inline-flex display', () => {
        const cut = new ReactTabGroupChipPart(jest.fn(), {
            addPortal: jest.fn(),
        });

        expect(cut.element.className).toBe('dv-react-part');
        expect(cut.element.style.display).toBe('inline-flex');
    });

    test('part is undefined before init', () => {
        const cut = new ReactTabGroupChipPart(jest.fn(), {
            addPortal: jest.fn(),
        });

        expect((cut as any).part).toBeUndefined();
    });

    test('init creates a ReactPart and registers a portal', () => {
        const addPortal = jest.fn().mockReturnValue({ dispose: jest.fn() });
        const cut = new ReactTabGroupChipPart(jest.fn(), { addPortal });

        cut.init({
            tabGroup: fromPartial<ITabGroup>({ id: 'tg-1' }),
            api: fromPartial<DockviewApi>({}),
        });

        expect((cut as any).part).toBeDefined();
        expect(addPortal).toHaveBeenCalled();
    });

    test('init passes tabGroup and api to ReactPart', () => {
        const addPortal = jest.fn().mockReturnValue({ dispose: jest.fn() });
        const cut = new ReactTabGroupChipPart(jest.fn(), { addPortal });

        const tabGroup = fromPartial<ITabGroup>({ id: 'tg-1' });
        const api = fromPartial<DockviewApi>({});

        cut.init({ tabGroup, api });

        const params = (cut as any).part.parameters;
        expect(params.tabGroup).toBe(tabGroup);
        expect(params.api).toBe(api);
    });

    test('update forwards new tabGroup to ReactPart', () => {
        const addPortal = jest.fn().mockReturnValue({ dispose: jest.fn() });
        const cut = new ReactTabGroupChipPart(jest.fn(), { addPortal });

        cut.init({
            tabGroup: fromPartial<ITabGroup>({ id: 'tg-1' }),
            api: fromPartial<DockviewApi>({}),
        });

        const updateSpy = jest.spyOn((cut as any).part, 'update');
        const newTabGroup = fromPartial<ITabGroup>({ id: 'tg-2' });

        cut.update({ tabGroup: newTabGroup });

        expect(updateSpy).toHaveBeenCalledWith({ tabGroup: newTabGroup });
    });

    test('update before init does not throw', () => {
        const cut = new ReactTabGroupChipPart(jest.fn(), {
            addPortal: jest.fn(),
        });

        expect(() =>
            cut.update({
                tabGroup: fromPartial<ITabGroup>({ id: 'tg-1' }),
            })
        ).not.toThrow();
    });

    test('dispose cleans up the part', () => {
        const addPortal = jest.fn().mockReturnValue({ dispose: jest.fn() });
        const cut = new ReactTabGroupChipPart(jest.fn(), { addPortal });

        cut.init({
            tabGroup: fromPartial<ITabGroup>({ id: 'tg-1' }),
            api: fromPartial<DockviewApi>({}),
        });

        const disposeSpy = jest.spyOn((cut as any).part, 'dispose');
        cut.dispose();

        expect(disposeSpy).toHaveBeenCalled();
    });

    test('dispose before init does not throw', () => {
        const cut = new ReactTabGroupChipPart(jest.fn(), {
            addPortal: jest.fn(),
        });

        expect(() => cut.dispose()).not.toThrow();
    });
});
