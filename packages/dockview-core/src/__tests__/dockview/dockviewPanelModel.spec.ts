import {
    DockviewComponent,
    IDockviewComponent,
} from '../../dockview/dockviewComponent';
import { DockviewPanelModel } from '../../dockview/dockviewPanelModel';
import { IContentRenderer, ITabRenderer } from '../../dockview/types';

describe('dockviewGroupPanel', () => {
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

        const accessorMock = jest.fn<Partial<DockviewComponent>, []>(() => {
            return {
                options: {
                    components: {
                        contentComponent: contentMock,
                    },
                    tabComponents: {
                        tabComponent: tabMock,
                    },
                },
            };
        });

        const cut = new DockviewPanelModel(
            <IDockviewComponent>new accessorMock(),
            'id',
            'contentComponent',
            'tabComponent'
        );

        cut.dispose();

        expect(cut.content.dispose).toHaveBeenCalled();
        expect(cut.tab.dispose).toHaveBeenCalled();
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

        const accessorMock = jest.fn<Partial<DockviewComponent>, []>(() => {
            return {
                options: {
                    components: {
                        contentComponent: contentMock,
                    },
                    tabComponents: {
                        tabComponent: tabMock,
                    },
                },
            };
        });
        const cut = new DockviewPanelModel(
            <IDockviewComponent>new accessorMock(),
            'id',
            'contentComponent',
            'tabComponent'
        );

        cut.update({
            params: {},
        });

        expect(cut.content.update).toHaveBeenCalled();
        expect(cut.tab.update).toHaveBeenCalled();
    });

    test('that events are fired', () => {
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

        const accessorMock = jest.fn<Partial<DockviewComponent>, []>(() => {
            return {
                options: {
                    components: {
                        contentComponent: contentMock,
                    },
                    tabComponents: {
                        tabComponent: tabMock,
                    },
                },
            };
        });
        const cut = new DockviewPanelModel(
            <IDockviewComponent>new accessorMock(),
            'id',
            'contentComponent',
            'tabComponent'
        );

        const group1 = jest.fn() as any;
        const group2 = jest.fn() as any;
        cut.updateParentGroup(group1, false);

        expect(cut.content.onGroupChange).toHaveBeenNthCalledWith(1, group1);
        expect(cut.tab.onGroupChange).toHaveBeenNthCalledWith(1, group1);
        expect(cut.content.onPanelVisibleChange).toHaveBeenNthCalledWith(
            1,
            false
        );
        expect(cut.tab.onPanelVisibleChange).toHaveBeenNthCalledWith(1, false);
        expect(cut.content.onGroupChange).toHaveBeenCalledTimes(1);
        expect(cut.tab.onGroupChange).toHaveBeenCalledTimes(1);
        expect(cut.content.onPanelVisibleChange).toHaveBeenCalledTimes(1);
        expect(cut.tab.onPanelVisibleChange).toHaveBeenCalledTimes(1);

        cut.updateParentGroup(group1, true);

        expect(cut.content.onPanelVisibleChange).toHaveBeenNthCalledWith(
            2,
            true
        );
        expect(cut.tab.onPanelVisibleChange).toHaveBeenNthCalledWith(2, true);
        expect(cut.content.onGroupChange).toHaveBeenCalledTimes(1);
        expect(cut.tab.onGroupChange).toHaveBeenCalledTimes(1);
        expect(cut.content.onPanelVisibleChange).toHaveBeenCalledTimes(2);
        expect(cut.tab.onPanelVisibleChange).toHaveBeenCalledTimes(2);

        cut.updateParentGroup(group2, true);

        expect(cut.content.onGroupChange).toHaveBeenNthCalledWith(2, group2);
        expect(cut.tab.onGroupChange).toHaveBeenNthCalledWith(2, group2);
        expect(cut.content.onGroupChange).toHaveBeenCalledTimes(2);
        expect(cut.tab.onGroupChange).toHaveBeenCalledTimes(2);
        expect(cut.content.onPanelVisibleChange).toHaveBeenCalledTimes(2);
        expect(cut.tab.onPanelVisibleChange).toHaveBeenCalledTimes(2);
    });
});
