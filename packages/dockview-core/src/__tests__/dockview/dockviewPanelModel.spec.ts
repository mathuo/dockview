import { DockviewComponent } from '../../dockview/dockviewComponent';
import { DockviewPanelModel } from '../../dockview/dockviewPanelModel';
import { IContentRenderer, ITabRenderer } from '../../dockview/types';
import { DefaultTab } from '../../dockview/components/tab/defaultTab';
import { fromPartial } from '@total-typescript/shoehorn';

describe('dockviewGroupPanel', () => {
    let contentMock: jest.Mock<IContentRenderer>;
    let tabMock: jest.Mock<ITabRenderer>;
    let accessorMock: DockviewComponent;

    beforeEach(() => {
        contentMock = jest.fn<IContentRenderer, []>(() => {
            const partial: Partial<IContentRenderer> = {
                element: document.createElement('div'),
                dispose: jest.fn(),
                update: jest.fn(),
            };
            return partial as IContentRenderer;
        });

        tabMock = jest.fn<ITabRenderer, []>(() => {
            const partial: Partial<IContentRenderer> = {
                element: document.createElement('div'),
                dispose: jest.fn(),
                update: jest.fn(),
            };
            return partial as IContentRenderer;
        });

        accessorMock = fromPartial<DockviewComponent>({
            options: {
                createComponent(options) {
                    switch (options.name) {
                        case 'contentComponent':
                            return new contentMock(options.id, options.name);
                        default:
                            throw new Error(`unsupported`);
                    }
                },
                createTabComponent(options) {
                    switch (options.name) {
                        case 'tabComponent':
                            return new tabMock(options.id, options.name);
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            },
        });
    });

    test('that dispose is called on content and tab renderers when present', () => {
        const cut = new DockviewPanelModel(
            accessorMock,
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
            accessorMock,
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

    test('that the default tab is created', () => {
        accessorMock = fromPartial<DockviewComponent>({
            options: {
                createComponent(options) {
                    switch (options.name) {
                        case 'contentComponent':
                            return new contentMock(options.id, options.name);
                        default:
                            throw new Error(`unsupported`);
                    }
                },
                createTabComponent(options) {
                    switch (options.name) {
                        case 'tabComponent':
                            return tabMock;
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            },
        });

        const cut = new DockviewPanelModel(
            accessorMock,
            'id',
            'contentComponent',
            'tabComponent'
        );

        expect(cut.tab).toEqual(tabMock);
    });

    test('that the provided default tab is chosen when no implementation is provided', () => {
        accessorMock = fromPartial<DockviewComponent>({
            options: {
                defaultTabComponent: 'tabComponent',
                createComponent(options) {
                    switch (options.name) {
                        case 'contentComponent':
                            return new contentMock(options.id, options.name);
                        default:
                            throw new Error(`unsupported`);
                    }
                },
                createTabComponent(options) {
                    switch (options.name) {
                        case 'tabComponent':
                            return tabMock;
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            },
        });

        const cut = new DockviewPanelModel(
            accessorMock,
            'id',
            'contentComponent'
        );

        expect(cut.tab).toEqual(tabMock);
    });

    test('that is library default tab instance is created when no alternative exists', () => {
        accessorMock = fromPartial<DockviewComponent>({
            options: {
                createComponent(options) {
                    switch (options.name) {
                        case 'contentComponent':
                            return new contentMock(options.id, options.name);
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            },
        });

        const cut = new DockviewPanelModel(
            accessorMock,
            'id',
            'contentComponent'
        );

        expect(cut.tab instanceof DefaultTab).toBeTruthy();
    });

    test('that the default content is created', () => {
        accessorMock = fromPartial<DockviewComponent>({
            options: {
                createComponent(options) {
                    switch (options.name) {
                        case 'contentComponent':
                            return contentMock;
                        default:
                            throw new Error(`unsupported`);
                    }
                },
                createTabComponent(options) {
                    switch (options.name) {
                        case 'tabComponent':
                            return tabMock;
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            },
        });

        const cut = new DockviewPanelModel(
            accessorMock,
            'id',
            'contentComponent'
        );

        expect(cut.content).toEqual(contentMock);
    });
});
