import { fireEvent } from '@testing-library/dom';
import {
    LocalSelectionTransfer,
    PanelTransfer,
} from '../../../dnd/dataTransfer';
import { DockviewComponent } from '../../../dockview/dockviewComponent';
import { DockviewGroupPanel } from '../../../dockview/dockviewGroupPanel';
import { DockviewGroupPanelModel } from '../../../dockview/dockviewGroupPanelModel';
import { Tab } from '../../../dockview/components/tab/tab';
import { IDockviewPanel } from '../../../dockview/dockviewPanel';

describe('tab', () => {
    test('that empty tab has inactive-tab class', () => {
        const accessorMock = jest.fn();
        const groupMock = jest.fn();

        const cut = new Tab(
            { id: 'panelId' } as IDockviewPanel,
            new accessorMock(),
            new groupMock()
        );

        expect(cut.element.className).toBe('dv-tab dv-inactive-tab');
    });

    test('that active tab has active-tab class', () => {
        const accessorMock = jest.fn();
        const groupMock = jest.fn();

        const cut = new Tab(
            { id: 'panelId' } as IDockviewPanel,
            new accessorMock(),
            new groupMock()
        );

        cut.setActive(true);
        expect(cut.element.className).toBe('dv-tab dv-active-tab');

        cut.setActive(false);
        expect(cut.element.className).toBe('dv-tab dv-inactive-tab');
    });

    test('that an external event does not render a drop target and calls through to the group model', () => {
        const accessorMock = jest.fn<Partial<DockviewComponent>, []>(() => {
            return {
                id: 'testcomponentid',
            };
        });
        const groupviewMock = jest.fn<Partial<DockviewGroupPanelModel>, []>(
            () => {
                return {
                    canDisplayOverlay: jest.fn(),
                };
            }
        );

        const groupView = new groupviewMock() as DockviewGroupPanelModel;

        const groupPanelMock = jest.fn<Partial<DockviewGroupPanel>, []>(() => {
            return {
                id: 'testgroupid',
                model: groupView,
            };
        });

        const accessor = new accessorMock() as DockviewComponent;
        const groupPanel = new groupPanelMock() as DockviewGroupPanel;

        const cut = new Tab(
            { id: 'panelId' } as IDockviewPanel,
            accessor,
            groupPanel
        );

        jest.spyOn(cut.element, 'clientHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(cut.element, 'clientWidth', 'get').mockImplementation(
            () => 100
        );

        fireEvent.dragEnter(cut.element);
        fireEvent.dragOver(cut.element);

        expect(groupView.canDisplayOverlay).toBeCalled();

        expect(
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(0);
    });

    test('that if you drag over yourself no drop target is shown', () => {
        const accessorMock = jest.fn<Partial<DockviewComponent>, []>(() => {
            return {
                id: 'testcomponentid',
            };
        });
        const groupviewMock = jest.fn<Partial<DockviewGroupPanelModel>, []>(
            () => {
                return {
                    canDisplayOverlay: jest.fn(),
                };
            }
        );

        const groupView = new groupviewMock() as DockviewGroupPanelModel;

        const groupPanelMock = jest.fn<Partial<DockviewGroupPanel>, []>(() => {
            return {
                id: 'testgroupid',
                model: groupView,
            };
        });

        const accessor = new accessorMock() as DockviewComponent;
        const groupPanel = new groupPanelMock() as DockviewGroupPanel;

        const cut = new Tab(
            { id: 'panel1' } as IDockviewPanel,
            accessor,
            groupPanel
        );

        jest.spyOn(cut.element, 'clientHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(cut.element, 'clientWidth', 'get').mockImplementation(
            () => 100
        );

        LocalSelectionTransfer.getInstance().setData(
            [new PanelTransfer('testcomponentid', 'anothergroupid', 'panel1')],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(cut.element);
        fireEvent.dragOver(cut.element);

        expect(groupView.canDisplayOverlay).toBeCalledTimes(0);

        expect(
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(0);
    });

    test('that if you drag over another tab a drop target is shown', () => {
        const accessorMock = jest.fn<Partial<DockviewComponent>, []>(() => {
            return {
                id: 'testcomponentid',
            };
        });
        const groupviewMock = jest.fn<Partial<DockviewGroupPanelModel>, []>(
            () => {
                return {
                    canDisplayOverlay: jest.fn(),
                };
            }
        );

        const groupView = new groupviewMock() as DockviewGroupPanelModel;

        const groupPanelMock = jest.fn<Partial<DockviewGroupPanel>, []>(() => {
            return {
                id: 'testgroupid',
                model: groupView,
            };
        });

        const accessor = new accessorMock() as DockviewComponent;
        const groupPanel = new groupPanelMock() as DockviewGroupPanel;

        const cut = new Tab(
            { id: 'panel1' } as IDockviewPanel,
            accessor,
            groupPanel
        );

        jest.spyOn(cut.element, 'clientHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(cut.element, 'clientWidth', 'get').mockImplementation(
            () => 100
        );

        LocalSelectionTransfer.getInstance().setData(
            [new PanelTransfer('testcomponentid', 'anothergroupid', 'panel2')],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(cut.element);
        fireEvent.dragOver(cut.element);

        expect(groupView.canDisplayOverlay).toBeCalledTimes(0);

        expect(
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(1);
    });

    test('that dropping on a tab with the same id but from a different component should not render a drop over and call through to the group model', () => {
        const accessorMock = jest.fn<Partial<DockviewComponent>, []>(() => {
            return {
                id: 'testcomponentid',
            };
        });
        const groupviewMock = jest.fn<Partial<DockviewGroupPanelModel>, []>(
            () => {
                return {
                    canDisplayOverlay: jest.fn(),
                };
            }
        );

        const groupView = new groupviewMock() as DockviewGroupPanelModel;

        const groupPanelMock = jest.fn<Partial<DockviewGroupPanel>, []>(() => {
            return {
                id: 'testgroupid',
                model: groupView,
            };
        });

        const accessor = new accessorMock() as DockviewComponent;
        const groupPanel = new groupPanelMock() as DockviewGroupPanel;

        const cut = new Tab(
            { id: 'panel1' } as IDockviewPanel,
            accessor,
            groupPanel
        );

        jest.spyOn(cut.element, 'clientHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(cut.element, 'clientWidth', 'get').mockImplementation(
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

        fireEvent.dragEnter(cut.element);
        fireEvent.dragOver(cut.element);

        expect(groupView.canDisplayOverlay).toBeCalledTimes(1);

        expect(
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(0);
    });

    test('that dropping on a tab from a different component should not render a drop over and call through to the group model', () => {
        const accessorMock = jest.fn<Partial<DockviewComponent>, []>(() => {
            return {
                id: 'testcomponentid',
            };
        });
        const groupviewMock = jest.fn<Partial<DockviewGroupPanelModel>, []>(
            () => {
                return {
                    canDisplayOverlay: jest.fn(),
                };
            }
        );

        const groupView = new groupviewMock() as DockviewGroupPanelModel;

        const groupPanelMock = jest.fn<Partial<DockviewGroupPanel>, []>(() => {
            return {
                id: 'testgroupid',
                model: groupView,
            };
        });

        const accessor = new accessorMock() as DockviewComponent;
        const groupPanel = new groupPanelMock() as DockviewGroupPanel;

        const cut = new Tab(
            { id: 'panel1' } as IDockviewPanel,
            accessor,
            groupPanel
        );

        jest.spyOn(cut.element, 'clientHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(cut.element, 'clientWidth', 'get').mockImplementation(
            () => 100
        );

        LocalSelectionTransfer.getInstance().setData(
            [
                new PanelTransfer(
                    'anothercomponentid',
                    'anothergroupid',
                    'panel2'
                ),
            ],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(cut.element);
        fireEvent.dragOver(cut.element);

        expect(groupView.canDisplayOverlay).toBeCalledTimes(1);

        expect(
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(0);
    });
});
