import { DefaultGroupPanelView } from '../../dockview/defaultGroupPanelView';
import { GroupPanel } from '../../groupview/groupviewPanel';
import { IContentRenderer, ITabRenderer } from '../../groupview/types';

describe('defaultGroupPanelView', () => {
    test('that dispose is called on content and tab renderers when present', () => {
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

        const cut = new DefaultGroupPanelView({
            content,
            tab,
            contentComponent: 'contentComponent',
        });

        cut.dispose();

        expect(content.dispose).toHaveBeenCalled();
        expect(tab.dispose).toHaveBeenCalled();
    });

    test('that update is called on content and tab renderers when present', () => {
        const contentMock = jest.fn<IContentRenderer, []>(() => {
            const partial: Partial<IContentRenderer> = {
                element: document.createElement('div'),
                update: jest.fn(),
            };
            return partial as IContentRenderer;
        });

        const tabMock = jest.fn<ITabRenderer, []>(() => {
            const partial: Partial<IContentRenderer> = {
                element: document.createElement('div'),
                update: jest.fn(),
            };
            return partial as IContentRenderer;
        });

        const content = new contentMock();
        const tab = new tabMock();

        const cut = new DefaultGroupPanelView({
            content,
            tab,
            contentComponent: 'contentComponent',
        });

        cut.update({
            params: {},
        });

        expect(content.update).toHaveBeenCalled();
        expect(tab.update).toHaveBeenCalled();
    });

    test('test1', () => {
        const contentMock = jest.fn<IContentRenderer, []>(() => {
            const partial: Partial<IContentRenderer> = {
                element: document.createElement('div'),
                onGroupChange: jest.fn(),
                onPanelVisibleChange: jest.fn(),
            };
            return partial as IContentRenderer;
        });

        const tabMock = jest.fn<ITabRenderer, []>(() => {
            const partial: Partial<IContentRenderer> = {
                element: document.createElement('div'),
                onGroupChange: jest.fn(),
                onPanelVisibleChange: jest.fn(),
            };
            return partial as IContentRenderer;
        });

        const content = new contentMock();
        const tab = new tabMock();

        let cut = new DefaultGroupPanelView({
            content,
            tab,
            contentComponent: 'contentComponent',
        });

        const group1 = jest.fn() as any;
        const group2 = jest.fn() as any;
        cut.updateParentGroup(group1 as GroupPanel, false);

        expect(content.onGroupChange).toHaveBeenNthCalledWith(1, group1);
        expect(tab.onGroupChange).toHaveBeenNthCalledWith(1, group1);
        expect(content.onPanelVisibleChange).toHaveBeenNthCalledWith(1, false);
        expect(tab.onPanelVisibleChange).toHaveBeenNthCalledWith(1, false);
        expect(content.onGroupChange).toHaveBeenCalledTimes(1);
        expect(tab.onGroupChange).toHaveBeenCalledTimes(1);
        expect(content.onPanelVisibleChange).toHaveBeenCalledTimes(1);
        expect(tab.onPanelVisibleChange).toHaveBeenCalledTimes(1);

        cut.updateParentGroup(group1 as GroupPanel, true);

        expect(content.onPanelVisibleChange).toHaveBeenNthCalledWith(2, true);
        expect(tab.onPanelVisibleChange).toHaveBeenNthCalledWith(2, true);
        expect(content.onGroupChange).toHaveBeenCalledTimes(1);
        expect(tab.onGroupChange).toHaveBeenCalledTimes(1);
        expect(content.onPanelVisibleChange).toHaveBeenCalledTimes(2);
        expect(tab.onPanelVisibleChange).toHaveBeenCalledTimes(2);

        cut.updateParentGroup(group2 as GroupPanel, true);

        expect(content.onGroupChange).toHaveBeenNthCalledWith(2, group2);
        expect(tab.onGroupChange).toHaveBeenNthCalledWith(2, group2);
        expect(content.onGroupChange).toHaveBeenCalledTimes(2);
        expect(tab.onGroupChange).toHaveBeenCalledTimes(2);
        expect(content.onPanelVisibleChange).toHaveBeenCalledTimes(2);
        expect(tab.onPanelVisibleChange).toHaveBeenCalledTimes(2);
    });
});
