import { DockviewComponent } from '../../../dockview/dockviewComponent';
import { GroupPanel } from '../../../groupview/groupviewPanel';
import { TabsContainer } from '../../../groupview/titlebar/tabsContainer';
import { fireEvent } from '@testing-library/dom';
import { Groupview } from '../../../groupview/groupview';
import {
    LocalSelectionTransfer,
    PanelTransfer,
} from '../../../dnd/dataTransfer';
import { TestPanel } from '../groupview.spec';

describe('tabsContainer', () => {
    test('that an external event does not render a drop target and calls through to the group mode', () => {
        const accessorMock = jest.fn<Partial<DockviewComponent>, []>(() => {
            return {
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
            };
        });
        const groupviewMock = jest.fn<Partial<Groupview>, []>(() => {
            return {
                canDisplayOverlay: jest.fn(),
            };
        });

        const groupView = new groupviewMock() as Groupview;

        const groupPanelMock = jest.fn<Partial<GroupPanel>, []>(() => {
            return {
                model: groupView,
            };
        });

        const accessor = new accessorMock() as DockviewComponent;
        const groupPanel = new groupPanelMock() as GroupPanel;

        const cut = new TabsContainer(accessor, groupPanel, {});

        const emptySpace = cut.element
            .getElementsByClassName('void-container')
            .item(0);

        if (!emptySpace) {
            fail('element not found');
        }

        jest.spyOn(emptySpace, 'clientHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(emptySpace, 'clientWidth', 'get').mockImplementation(
            () => 100
        );

        fireEvent.dragEnter(emptySpace);
        fireEvent.dragOver(emptySpace);

        expect(groupView.canDisplayOverlay).toBeCalled();

        expect(
            cut.element.getElementsByClassName('drop-target-dropzone').length
        ).toBe(0);
    });

    test('that a drag over event from another tab should render a drop target', () => {
        const accessorMock = jest.fn<Partial<DockviewComponent>, []>(() => {
            return {
                id: 'testcomponentid',
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
            };
        });
        const groupviewMock = jest.fn<Partial<Groupview>, []>(() => {
            return {
                canDisplayOverlay: jest.fn(),
            };
        });

        const groupView = new groupviewMock() as Groupview;

        const groupPanelMock = jest.fn<Partial<GroupPanel>, []>(() => {
            return {
                id: 'testgroupid',
                model: groupView,
                panels: [],
            };
        });

        const accessor = new accessorMock() as DockviewComponent;
        const groupPanel = new groupPanelMock() as GroupPanel;

        const cut = new TabsContainer(accessor, groupPanel, {});

        const emptySpace = cut.element
            .getElementsByClassName('void-container')
            .item(0);

        if (!emptySpace) {
            fail('element not found');
        }

        jest.spyOn(emptySpace, 'clientHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(emptySpace, 'clientWidth', 'get').mockImplementation(
            () => 100
        );

        LocalSelectionTransfer.getInstance().setData(
            [
                new PanelTransfer(
                    'testcomponentid',
                    'anothergroupid',
                    'anotherpanelid'
                ),
            ],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(emptySpace);
        fireEvent.dragOver(emptySpace);

        expect(groupView.canDisplayOverlay).toBeCalledTimes(0);

        expect(
            cut.element.getElementsByClassName('drop-target-dropzone').length
        ).toBe(1);
    });

    test('that dropping over the empty space should render a drop target', () => {
        const accessorMock = jest.fn<Partial<DockviewComponent>, []>(() => {
            return {
                id: 'testcomponentid',
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
            };
        });
        const groupviewMock = jest.fn<Partial<Groupview>, []>(() => {
            return {
                canDisplayOverlay: jest.fn(),
            };
        });

        const groupView = new groupviewMock() as Groupview;

        const groupPanelMock = jest.fn<Partial<GroupPanel>, []>(() => {
            return {
                id: 'testgroupid',
                model: groupView,
                panels: [],
            };
        });

        const accessor = new accessorMock() as DockviewComponent;
        const groupPanel = new groupPanelMock() as GroupPanel;

        const cut = new TabsContainer(accessor, groupPanel, {});

        cut.openPanel(new TestPanel('panel1', jest.fn() as any));
        cut.openPanel(new TestPanel('panel2', jest.fn() as any));

        const emptySpace = cut.element
            .getElementsByClassName('void-container')
            .item(0);

        if (!emptySpace) {
            fail('element not found');
        }

        jest.spyOn(emptySpace, 'clientHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(emptySpace, 'clientWidth', 'get').mockImplementation(
            () => 100
        );

        LocalSelectionTransfer.getInstance().setData(
            [new PanelTransfer('testcomponentid', 'anothergroupid', 'panel2')],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(emptySpace);
        fireEvent.dragOver(emptySpace);

        expect(groupView.canDisplayOverlay).toBeCalledTimes(0);

        expect(
            cut.element.getElementsByClassName('drop-target-dropzone').length
        ).toBe(1);
    });

    test('that dropping the first tab should render a drop target', () => {
        const accessorMock = jest.fn<Partial<DockviewComponent>, []>(() => {
            return {
                id: 'testcomponentid',
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
            };
        });
        const groupviewMock = jest.fn<Partial<Groupview>, []>(() => {
            return {
                canDisplayOverlay: jest.fn(),
            };
        });

        const groupView = new groupviewMock() as Groupview;

        const groupPanelMock = jest.fn<Partial<GroupPanel>, []>(() => {
            return {
                id: 'testgroupid',
                model: groupView,
                panels: [],
            };
        });

        const accessor = new accessorMock() as DockviewComponent;
        const groupPanel = new groupPanelMock() as GroupPanel;

        const cut = new TabsContainer(accessor, groupPanel, {});

        cut.openPanel(new TestPanel('panel1', jest.fn() as any));
        cut.openPanel(new TestPanel('panel2', jest.fn() as any));

        const emptySpace = cut.element
            .getElementsByClassName('void-container')
            .item(0);

        if (!emptySpace) {
            fail('element not found');
        }

        jest.spyOn(emptySpace, 'clientHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(emptySpace, 'clientWidth', 'get').mockImplementation(
            () => 100
        );

        LocalSelectionTransfer.getInstance().setData(
            [new PanelTransfer('testcomponentid', 'anothergroupid', 'panel1')],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(emptySpace);
        fireEvent.dragOver(emptySpace);

        expect(groupView.canDisplayOverlay).toBeCalledTimes(0);

        expect(
            cut.element.getElementsByClassName('drop-target-dropzone').length
        ).toBe(1);
    });

    test('that dropping a tab from another component should not render a drop target', () => {
        const accessorMock = jest.fn<Partial<DockviewComponent>, []>(() => {
            return {
                id: 'testcomponentid',
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
            };
        });
        const groupviewMock = jest.fn<Partial<Groupview>, []>(() => {
            return {
                canDisplayOverlay: jest.fn(),
            };
        });

        const groupView = new groupviewMock() as Groupview;

        const groupPanelMock = jest.fn<Partial<GroupPanel>, []>(() => {
            return {
                id: 'testgroupid',
                model: groupView,
            };
        });

        const accessor = new accessorMock() as DockviewComponent;
        const groupPanel = new groupPanelMock() as GroupPanel;

        const cut = new TabsContainer(accessor, groupPanel, {});

        cut.openPanel(new TestPanel('panel1', jest.fn() as any));
        cut.openPanel(new TestPanel('panel2', jest.fn() as any));

        const emptySpace = cut.element
            .getElementsByClassName('void-container')
            .item(0);

        if (!emptySpace) {
            fail('element not found');
        }

        jest.spyOn(emptySpace, 'clientHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(emptySpace, 'clientWidth', 'get').mockImplementation(
            () => 100
        );

        LocalSelectionTransfer.getInstance().setData(
            [
                new PanelTransfer(
                    'anothercomponentid',
                    'anothergroupid',
                    'panel1'
                ),
            ],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(emptySpace);
        fireEvent.dragOver(emptySpace);

        expect(groupView.canDisplayOverlay).toBeCalledTimes(1);

        expect(
            cut.element.getElementsByClassName('drop-target-dropzone').length
        ).toBe(0);
    });
});
