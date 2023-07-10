import {
    LocalSelectionTransfer,
    PanelTransfer,
} from '../../../../dnd/dataTransfer';
import { TabsContainer } from '../../../../dockview/components/titlebar/tabsContainer';
import { DockviewComponent } from '../../../../dockview/dockviewComponent';
import { DockviewGroupPanel } from '../../../../dockview/dockviewGroupPanel';
import { DockviewGroupPanelModel } from '../../../../dockview/dockviewGroupPanelModel';
import { fireEvent } from '@testing-library/dom';
import { TestPanel } from '../../dockviewGroupPanelModel.spec';
import { IDockviewPanel } from '../../../../dockview/dockviewPanel';

describe('tabsContainer', () => {
    test('that an external event does not render a drop target and calls through to the group mode', () => {
        const accessorMock = jest.fn<Partial<DockviewComponent>, []>(() => {
            return {
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
                options: {},
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
                model: groupView,
            };
        });

        const accessor = new accessorMock() as DockviewComponent;
        const groupPanel = new groupPanelMock() as DockviewGroupPanel;

        const cut = new TabsContainer(accessor, groupPanel);

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
                options: {},
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
                panels: [],
            };
        });

        const accessor = new accessorMock() as DockviewComponent;
        const groupPanel = new groupPanelMock() as DockviewGroupPanel;

        const cut = new TabsContainer(accessor, groupPanel);

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
                options: {},
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
                panels: [],
            };
        });

        const accessor = new accessorMock() as DockviewComponent;
        const groupPanel = new groupPanelMock() as DockviewGroupPanel;

        const cut = new TabsContainer(accessor, groupPanel);

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
                options: {},
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
                panels: [],
            };
        });

        const accessor = new accessorMock() as DockviewComponent;
        const groupPanel = new groupPanelMock() as DockviewGroupPanel;

        const cut = new TabsContainer(accessor, groupPanel);

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
                options: {},
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

        const cut = new TabsContainer(accessor, groupPanel);

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

    test('left actions', () => {
        const accessorMock = jest.fn<DockviewComponent, []>(() => {
            return (<Partial<DockviewComponent>>{
                options: {},
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
            }) as DockviewComponent;
        });

        const groupPanelMock = jest.fn<DockviewGroupPanel, []>(() => {
            return (<Partial<DockviewGroupPanel>>{}) as DockviewGroupPanel;
        });

        const accessor = new accessorMock();
        const groupPanel = new groupPanelMock();

        const cut = new TabsContainer(accessor, groupPanel);

        let query = cut.element.querySelectorAll(
            '.tabs-and-actions-container > .left-actions-container'
        );

        expect(query.length).toBe(1);
        expect(query[0].children.length).toBe(0);

        // add left action

        const left = document.createElement('div');
        left.className = 'test-left-actions-element';
        cut.setLeftActionsElement(left);

        query = cut.element.querySelectorAll(
            '.tabs-and-actions-container > .left-actions-container'
        );
        expect(query.length).toBe(1);
        expect(query[0].children.item(0)?.className).toBe(
            'test-left-actions-element'
        );
        expect(query[0].children.length).toBe(1);

        // add left action

        const left2 = document.createElement('div');
        left2.className = 'test-left-actions-element-2';
        cut.setLeftActionsElement(left2);

        query = cut.element.querySelectorAll(
            '.tabs-and-actions-container > .left-actions-container'
        );
        expect(query.length).toBe(1);
        expect(query[0].children.item(0)?.className).toBe(
            'test-left-actions-element-2'
        );
        expect(query[0].children.length).toBe(1);

        // remove left action

        cut.setLeftActionsElement(undefined);
        query = cut.element.querySelectorAll(
            '.tabs-and-actions-container > .left-actions-container'
        );

        expect(query.length).toBe(1);
        expect(query[0].children.length).toBe(0);
    });

    test('right actions', () => {
        const accessorMock = jest.fn<DockviewComponent, []>(() => {
            return (<Partial<DockviewComponent>>{
                options: {},
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
            }) as DockviewComponent;
        });

        const groupPanelMock = jest.fn<DockviewGroupPanel, []>(() => {
            return (<Partial<DockviewGroupPanel>>{}) as DockviewGroupPanel;
        });

        const accessor = new accessorMock();
        const groupPanel = new groupPanelMock();

        const cut = new TabsContainer(accessor, groupPanel);

        let query = cut.element.querySelectorAll(
            '.tabs-and-actions-container > .right-actions-container'
        );

        expect(query.length).toBe(1);
        expect(query[0].children.length).toBe(0);

        // add right action

        const right = document.createElement('div');
        right.className = 'test-right-actions-element';
        cut.setRightActionsElement(right);

        query = cut.element.querySelectorAll(
            '.tabs-and-actions-container > .right-actions-container'
        );
        expect(query.length).toBe(1);
        expect(query[0].children.item(0)?.className).toBe(
            'test-right-actions-element'
        );
        expect(query[0].children.length).toBe(1);

        // add right action

        const right2 = document.createElement('div');
        right2.className = 'test-right-actions-element-2';
        cut.setRightActionsElement(right2);

        query = cut.element.querySelectorAll(
            '.tabs-and-actions-container > .right-actions-container'
        );
        expect(query.length).toBe(1);
        expect(query[0].children.item(0)?.className).toBe(
            'test-right-actions-element-2'
        );
        expect(query[0].children.length).toBe(1);

        // remove right action

        cut.setRightActionsElement(undefined);
        query = cut.element.querySelectorAll(
            '.tabs-and-actions-container > .right-actions-container'
        );

        expect(query.length).toBe(1);
        expect(query[0].children.length).toBe(0);
    });

    test('that a tab will become floating when clicked if not floating and shift is selected', () => {
        const accessorMock = jest.fn<DockviewComponent, []>(() => {
            return (<Partial<DockviewComponent>>{
                options: {},
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
                element: document.createElement('div'),
                addFloatingGroup: jest.fn(),
            }) as DockviewComponent;
        });

        const groupPanelMock = jest.fn<DockviewGroupPanel, []>(() => {
            return (<Partial<DockviewGroupPanel>>{
                api: { isFloating: false } as any,
            }) as DockviewGroupPanel;
        });

        const accessor = new accessorMock();
        const groupPanel = new groupPanelMock();

        const cut = new TabsContainer(accessor, groupPanel);

        const container = cut.element.querySelector('.void-container')!;
        expect(container).toBeTruthy();

        jest.spyOn(cut.element, 'getBoundingClientRect').mockImplementation(
            () => {
                return { top: 50, left: 100, width: 0, height: 0 } as any;
            }
        );
        jest.spyOn(
            accessor.element,
            'getBoundingClientRect'
        ).mockImplementation(() => {
            return { top: 10, left: 20, width: 0, height: 0 } as any;
        });

        const event = new KeyboardEvent('mousedown', { shiftKey: true });
        const eventPreventDefaultSpy = jest.spyOn(event, 'preventDefault');
        fireEvent(container, event);

        expect(accessor.addFloatingGroup).toBeCalledWith(
            groupPanel,
            {
                x: 100,
                y: 60,
            },
            { inDragMode: true }
        );
        expect(accessor.addFloatingGroup).toBeCalledTimes(1);
        expect(eventPreventDefaultSpy).toBeCalledTimes(1);

        const event2 = new KeyboardEvent('mousedown', { shiftKey: false });
        const eventPreventDefaultSpy2 = jest.spyOn(event2, 'preventDefault');
        fireEvent(container, event2);

        expect(accessor.addFloatingGroup).toBeCalledTimes(1);
        expect(eventPreventDefaultSpy2).toBeCalledTimes(0);
    });

    test('that a tab that is already floating cannot be floated again', () => {
        const accessorMock = jest.fn<DockviewComponent, []>(() => {
            return (<Partial<DockviewComponent>>{
                options: {},
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
                element: document.createElement('div'),
                addFloatingGroup: jest.fn(),
            }) as DockviewComponent;
        });

        const groupPanelMock = jest.fn<DockviewGroupPanel, []>(() => {
            return (<Partial<DockviewGroupPanel>>{
                api: { isFloating: true } as any,
            }) as DockviewGroupPanel;
        });

        const accessor = new accessorMock();
        const groupPanel = new groupPanelMock();

        const cut = new TabsContainer(accessor, groupPanel);

        const container = cut.element.querySelector('.void-container')!;
        expect(container).toBeTruthy();

        jest.spyOn(cut.element, 'getBoundingClientRect').mockImplementation(
            () => {
                return { top: 50, left: 100, width: 0, height: 0 } as any;
            }
        );
        jest.spyOn(
            accessor.element,
            'getBoundingClientRect'
        ).mockImplementation(() => {
            return { top: 10, left: 20, width: 0, height: 0 } as any;
        });

        const event = new KeyboardEvent('mousedown', { shiftKey: true });
        const eventPreventDefaultSpy = jest.spyOn(event, 'preventDefault');
        fireEvent(container, event);

        expect(accessor.addFloatingGroup).toBeCalledTimes(0);
        expect(eventPreventDefaultSpy).toBeCalledTimes(0);

        const event2 = new KeyboardEvent('mousedown', { shiftKey: false });
        const eventPreventDefaultSpy2 = jest.spyOn(event2, 'preventDefault');
        fireEvent(container, event2);

        expect(accessor.addFloatingGroup).toBeCalledTimes(0);
        expect(eventPreventDefaultSpy2).toBeCalledTimes(0);
    });

    test('that selecting a tab which shift down will move that tab into a new floating group', () => {
        const accessorMock = jest.fn<DockviewComponent, []>(() => {
            return (<Partial<DockviewComponent>>{
                options: {},
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
                element: document.createElement('div'),
                addFloatingGroup: jest.fn(),
                getGroupPanel: jest.fn(),
            }) as DockviewComponent;
        });

        const groupPanelMock = jest.fn<DockviewGroupPanel, []>(() => {
            return (<Partial<DockviewGroupPanel>>{
                api: { isFloating: true } as any,
            }) as DockviewGroupPanel;
        });

        const accessor = new accessorMock();
        const groupPanel = new groupPanelMock();

        const cut = new TabsContainer(accessor, groupPanel);

        const panelMock = jest.fn<IDockviewPanel, []>(() => {
            const partial: Partial<IDockviewPanel> = {
                id: 'test_id',

                view: {
                    tab: {
                        element: document.createElement('div'),
                    } as any,
                    content: {
                        element: document.createElement('div'),
                    } as any,
                } as any,
            };
            return partial as IDockviewPanel;
        });
        const panel = new panelMock();

        cut.openPanel(panel);

        const el = cut.element.querySelector('.tab')!;
        expect(el).toBeTruthy();

        const event = new KeyboardEvent('mousedown', { shiftKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
        fireEvent(el, event);

        expect(preventDefaultSpy).toBeCalledTimes(1);
        expect(accessor.addFloatingGroup).toBeCalledTimes(1);
    });
});
