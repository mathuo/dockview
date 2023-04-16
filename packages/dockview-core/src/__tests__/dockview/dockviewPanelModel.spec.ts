import {
    DockviewComponent,
    IDockviewComponent,
} from '../../dockview/dockviewComponent';
import { DockviewPanelModel } from '../../dockview/dockviewPanelModel';
import { IContentRenderer, ITabRenderer } from '../../dockview/types';
import { GroupPanelFrameworkComponentFactory } from '../../dockview/options';
import { DefaultTab } from '../../dockview/components/tab/defaultTab';

describe('dockviewGroupPanel', () => {
    let contentMock: jest.Mock<IContentRenderer>;
    let tabMock: jest.Mock<ITabRenderer>;
    let accessorMock: jest.Mock<IDockviewComponent>;

    beforeEach(() => {
        contentMock = jest.fn<IContentRenderer, []>(() => {
            const partial: Partial<IContentRenderer> = {
                element: document.createElement('div'),
                dispose: jest.fn(),
                update: jest.fn(),
                onGroupChange: jest.fn(),
                onPanelVisibleChange: jest.fn(),
            };
            return partial as IContentRenderer;
        });

        tabMock = jest.fn<ITabRenderer, []>(() => {
            const partial: Partial<IContentRenderer> = {
                element: document.createElement('div'),
                dispose: jest.fn(),
                update: jest.fn(),
                onGroupChange: jest.fn(),
                onPanelVisibleChange: jest.fn(),
            };
            return partial as IContentRenderer;
        });

        accessorMock = jest.fn<DockviewComponent, []>(() => {
            const partial: Partial<DockviewComponent> = {
                options: {
                    components: {
                        contentComponent: contentMock,
                    },
                    tabComponents: {
                        tabComponent: tabMock,
                    },
                },
            };

            return partial as DockviewComponent;
        });
    });

    test('that dispose is called on content and tab renderers when present', () => {
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

    test('that the default tab is created', () => {
        accessorMock = jest.fn<DockviewComponent, []>(() => {
            const partial: Partial<DockviewComponent> = {
                options: {
                    components: {
                        contentComponent: contentMock,
                    },
                    tabComponents: {
                        tabComponent: jest
                            .fn()
                            .mockImplementation(() => tabMock),
                    },
                },
            };

            return partial as DockviewComponent;
        });

        const cut = new DockviewPanelModel(
            <IDockviewComponent>new accessorMock(),
            'id',
            'contentComponent',
            'tabComponent'
        );

        expect(cut.tab).toEqual(tabMock);
    });

    test('that the provided default tab is chosen when no implementation is provided', () => {
        accessorMock = jest.fn<DockviewComponent, []>(() => {
            const partial: Partial<DockviewComponent> = {
                options: {
                    components: {
                        contentComponent: contentMock,
                    },
                    tabComponents: {
                        tabComponent: jest
                            .fn()
                            .mockImplementation(() => tabMock),
                    },
                    defaultTabComponent: 'tabComponent',
                },
            };

            return partial as DockviewComponent;
        });

        const cut = new DockviewPanelModel(
            <IDockviewComponent>new accessorMock(),
            'id',
            'contentComponent'
        );

        expect(cut.tab).toEqual(tabMock);
    });

    test('that the framework tab is created when provided tab is a framework tab', () => {
        const tab = jest.fn();
        const tabFactory = jest.fn().mockImplementation(() => tab);

        accessorMock = jest.fn<DockviewComponent, []>(() => {
            const partial: Partial<DockviewComponent> = {
                options: {
                    components: {
                        contentComponent: contentMock,
                    },
                    frameworkTabComponents: {
                        tabComponent: tabMock,
                    },
                    frameworkComponentFactory: (<
                        Partial<GroupPanelFrameworkComponentFactory>
                    >{
                        tab: { createComponent: tabFactory },
                    }) as GroupPanelFrameworkComponentFactory,
                },
            };

            return partial as DockviewComponent;
        });

        const cut = new DockviewPanelModel(
            <IDockviewComponent>new accessorMock(),
            'id',
            'contentComponent',
            'tabComponent'
        );

        expect(tabFactory).toHaveBeenCalledWith('id', 'tabComponent', tabMock);
        expect(cut.tab).toEqual(tab);
    });

    test('that is library default tab instance is created when no alternative exists', () => {
        accessorMock = jest.fn<DockviewComponent, []>(() => {
            const partial: Partial<DockviewComponent> = {
                options: {
                    components: {
                        contentComponent: contentMock,
                    },
                },
            };

            return partial as DockviewComponent;
        });

        const cut = new DockviewPanelModel(
            <IDockviewComponent>new accessorMock(),
            'id',
            'contentComponent'
        );

        expect(cut.tab instanceof DefaultTab).toBeTruthy();
    });

    test('that the default content is created', () => {
        accessorMock = jest.fn<DockviewComponent, []>(() => {
            const partial: Partial<DockviewComponent> = {
                options: {
                    components: {
                        contentComponent: jest.fn().mockImplementation(() => {
                            return contentMock;
                        }),
                    },
                },
            };

            return partial as DockviewComponent;
        });

        const cut = new DockviewPanelModel(
            <IDockviewComponent>new accessorMock(),
            'id',
            'contentComponent'
        );

        expect(cut.content).toEqual(contentMock);
    });

    test('that the framework content is created', () => {
        const content = jest.fn();
        const contentFactory = jest.fn().mockImplementation(() => content);

        accessorMock = jest.fn<DockviewComponent, []>(() => {
            const partial: Partial<DockviewComponent> = {
                options: {
                    frameworkComponents: {
                        contentComponent: contentMock,
                    },
                    frameworkComponentFactory: (<
                        Partial<GroupPanelFrameworkComponentFactory>
                    >{
                        content: { createComponent: contentFactory },
                    }) as GroupPanelFrameworkComponentFactory,
                },
            };

            return partial as DockviewComponent;
        });

        const cut = new DockviewPanelModel(
            <IDockviewComponent>new accessorMock(),
            'id',
            'contentComponent'
        );

        expect(contentFactory).toHaveBeenCalledWith(
            'id',
            'contentComponent',
            contentMock
        );
        expect(cut.content).toEqual(content);
    });
});
