import { DefaultGroupPanelView } from '../../dockview/defaultGroupPanelView';
import {
    IActionsRenderer,
    IContentRenderer,
    ITabRenderer,
} from '../../groupview/types';

describe('defaultGroupPanelView', () => {
    test('dispose cleanup', () => {
        const contentMock = jest.fn<IContentRenderer, []>(() => {
            const partial: Partial<IContentRenderer> = {
                element: document.createElement('div'),
                dispose: jest.fn(),
            };
            return partial as IContentRenderer;
        });

        const tabMock = jest.fn<ITabRenderer, []>(() => {
            const partial: Partial<IContentRenderer> = {
                element: document.createElement('div'),
                dispose: jest.fn(),
            };
            return partial as IContentRenderer;
        });

        const actionsMock = jest.fn<IActionsRenderer, []>(() => {
            const partial: Partial<IContentRenderer> = {
                element: document.createElement('div'),
                dispose: jest.fn(),
            };
            return partial as IContentRenderer;
        });

        const content = new contentMock();
        const tab = new tabMock();
        const actions = new actionsMock();

        const cut = new DefaultGroupPanelView({ content, tab, actions });

        cut.dispose();

        expect(content.dispose).toHaveBeenCalled();
        expect(tab.dispose).toHaveBeenCalled();
        expect(actions.dispose).toHaveBeenCalled();
    });
});
