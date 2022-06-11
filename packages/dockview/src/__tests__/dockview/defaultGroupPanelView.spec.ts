import { DefaultGroupPanelView } from '../../dockview/defaultGroupPanelView';
import { IContentRenderer, ITabRenderer } from '../../groupview/types';

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

        const content = new contentMock();
        const tab = new tabMock();

        const cut = new DefaultGroupPanelView({ content, tab });

        cut.dispose();

        expect(content.dispose).toHaveBeenCalled();
        expect(tab.dispose).toHaveBeenCalled();
    });
});
