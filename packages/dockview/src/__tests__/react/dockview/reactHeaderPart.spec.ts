import { DEFAULT_TAB_IDENTIFIER } from '../../../dockview/components/tab/defaultTab';
import { ReactPanelHeaderPart } from '../../../react/dockview/reactHeaderPart';

describe('reactHeaderPart', () => {
    test('that tab id is present in toJSON when not the default tab', () => {
        const cut = new ReactPanelHeaderPart(
            'test-id',
            jest.fn(),
            <any>jest.fn()
        );

        expect(cut.toJSON()).toEqual({ id: 'test-id' });
    });

    test('that tab id is not present in the toJSON when is default tab', () => {
        const cut = new ReactPanelHeaderPart(
            DEFAULT_TAB_IDENTIFIER,
            jest.fn(),
            <any>jest.fn()
        );

        expect(cut.toJSON()).toEqual({});
    });
});
