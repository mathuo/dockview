import { fromPartial } from '@total-typescript/shoehorn';
import {
    DockviewApi,
    ITabGroup,
    TabGroupChipRendererParams,
} from 'dockview-core';
import { ReactTabGroupChipPart } from '../../dockview/reactTabGroupChipPart';
import { ReactPortalStore } from '../../react';

function chipParams(
    overrides: Partial<TabGroupChipRendererParams> = {}
): TabGroupChipRendererParams {
    return {
        tabGroup: fromPartial<ITabGroup>({ id: 'tg-1' }),
        api: fromPartial<DockviewApi>({}),
        accent: undefined,
        componentParams: undefined,
        ...overrides,
    };
}

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

        cut.init(chipParams());

        expect((cut as any).part).toBeDefined();
        expect(addPortal).toHaveBeenCalled();
    });

    test('init passes all params through to ReactPart', () => {
        const addPortal = jest.fn().mockReturnValue({ dispose: jest.fn() });
        const cut = new ReactTabGroupChipPart(jest.fn(), { addPortal });

        const tabGroup = fromPartial<ITabGroup>({ id: 'tg-1' });
        const api = fromPartial<DockviewApi>({});

        cut.init(
            chipParams({
                tabGroup,
                api,
                accent: '#ff0080',
                componentParams: { icon: 'star' },
            })
        );

        const params = (cut as any).part.parameters;
        expect(params.tabGroup).toBe(tabGroup);
        expect(params.api).toBe(api);
        expect(params.accent).toBe('#ff0080');
        expect(params.componentParams).toEqual({ icon: 'star' });
    });

    test('update forwards new params to ReactPart', () => {
        const addPortal = jest.fn().mockReturnValue({ dispose: jest.fn() });
        const cut = new ReactTabGroupChipPart(jest.fn(), { addPortal });

        cut.init(chipParams());

        const updateSpy = jest.spyOn((cut as any).part, 'update');
        const newTabGroup = fromPartial<ITabGroup>({ id: 'tg-2' });
        const newApi = fromPartial<DockviewApi>({});

        cut.update(
            chipParams({
                tabGroup: newTabGroup,
                api: newApi,
                accent: 'var(--my-accent)',
                componentParams: { badge: 3 },
            })
        );

        expect(updateSpy).toHaveBeenCalledWith({
            tabGroup: newTabGroup,
            api: newApi,
            accent: 'var(--my-accent)',
            componentParams: { badge: 3 },
        });
    });

    test('update before init does not throw', () => {
        const cut = new ReactTabGroupChipPart(jest.fn(), {
            addPortal: jest.fn(),
        });

        expect(() => cut.update(chipParams())).not.toThrow();
    });

    test('dispose cleans up the part', () => {
        const addPortal = jest.fn().mockReturnValue({ dispose: jest.fn() });
        const cut = new ReactTabGroupChipPart(jest.fn(), { addPortal });

        cut.init(chipParams());

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
