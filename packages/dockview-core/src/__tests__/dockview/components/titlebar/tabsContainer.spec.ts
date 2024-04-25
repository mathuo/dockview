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
import { fromPartial } from '@total-typescript/shoehorn';

describe('tabsContainer', () => {
    test('that an external event does not render a drop target and calls through to the group mode', () => {
        const accessor = fromPartial<DockviewComponent>({
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            options: { parentElement: document.createElement('div') },
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

        const groupPanel = new groupPanelMock() as DockviewGroupPanel;

        const cut = new TabsContainer(accessor, groupPanel);

        const emptySpace = cut.element
            .getElementsByClassName('void-container')
            .item(0);

        if (!emptySpace!) {
            fail('element not found');
        }

        jest.spyOn(emptySpace!, 'clientHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(emptySpace!, 'clientWidth', 'get').mockImplementation(
            () => 100
        );

        fireEvent.dragEnter(emptySpace!);
        fireEvent.dragOver(emptySpace!);

        expect(groupView.canDisplayOverlay).toHaveBeenCalled();

        expect(
            cut.element.getElementsByClassName('drop-target-dropzone').length
        ).toBe(0);
    });

    test('that a drag over event from another tab should render a drop target', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            options: { parentElement: document.createElement('div') },
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

        const groupPanel = new groupPanelMock() as DockviewGroupPanel;

        const cut = new TabsContainer(accessor, groupPanel);

        const emptySpace = cut.element
            .getElementsByClassName('void-container')
            .item(0);

        if (!emptySpace!) {
            fail('element not found');
        }

        jest.spyOn(emptySpace!, 'clientHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(emptySpace!, 'clientWidth', 'get').mockImplementation(
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

        fireEvent.dragEnter(emptySpace!);
        fireEvent.dragOver(emptySpace!);

        expect(groupView.canDisplayOverlay).toHaveBeenCalledTimes(0);

        expect(
            cut.element.getElementsByClassName('drop-target-dropzone').length
        ).toBe(1);
    });

    test('that dropping over the empty space should render a drop target', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            options: { parentElement: document.createElement('div') },
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

        const groupPanel = new groupPanelMock() as DockviewGroupPanel;

        const cut = new TabsContainer(accessor, groupPanel);

        cut.openPanel(new TestPanel('panel1', jest.fn() as any));
        cut.openPanel(new TestPanel('panel2', jest.fn() as any));

        const emptySpace = cut.element
            .getElementsByClassName('void-container')
            .item(0);

        if (!emptySpace!) {
            fail('element not found');
        }

        jest.spyOn(emptySpace!, 'clientHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(emptySpace!, 'clientWidth', 'get').mockImplementation(
            () => 100
        );

        LocalSelectionTransfer.getInstance().setData(
            [new PanelTransfer('testcomponentid', 'anothergroupid', 'panel2')],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(emptySpace!);
        fireEvent.dragOver(emptySpace!);

        expect(groupView.canDisplayOverlay).toHaveBeenCalledTimes(0);

        expect(
            cut.element.getElementsByClassName('drop-target-dropzone').length
        ).toBe(1);
    });

    test('that dropping the first tab should render a drop target', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            options: { parentElement: document.createElement('div') },
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

        const groupPanel = new groupPanelMock() as DockviewGroupPanel;

        const cut = new TabsContainer(accessor, groupPanel);

        cut.openPanel(new TestPanel('panel1', jest.fn() as any));
        cut.openPanel(new TestPanel('panel2', jest.fn() as any));

        const emptySpace = cut.element
            .getElementsByClassName('void-container')
            .item(0);

        if (!emptySpace!) {
            fail('element not found');
        }

        jest.spyOn(emptySpace!, 'clientHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(emptySpace!, 'clientWidth', 'get').mockImplementation(
            () => 100
        );

        LocalSelectionTransfer.getInstance().setData(
            [new PanelTransfer('testcomponentid', 'anothergroupid', 'panel1')],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(emptySpace!);
        fireEvent.dragOver(emptySpace!);

        expect(groupView.canDisplayOverlay).toHaveBeenCalledTimes(0);

        expect(
            cut.element.getElementsByClassName('drop-target-dropzone').length
        ).toBe(1);
    });

    test('that dropping a tab from another component should not render a drop target', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            options: { parentElement: document.createElement('div') },
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

        const groupPanel = new groupPanelMock() as DockviewGroupPanel;

        const cut = new TabsContainer(accessor, groupPanel);

        cut.openPanel(new TestPanel('panel1', jest.fn() as any));
        cut.openPanel(new TestPanel('panel2', jest.fn() as any));

        const emptySpace = cut.element
            .getElementsByClassName('void-container')
            .item(0);

        if (!emptySpace!) {
            fail('element not found');
        }

        jest.spyOn(emptySpace!, 'clientHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(emptySpace!, 'clientWidth', 'get').mockImplementation(
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

        fireEvent.dragEnter(emptySpace!);
        fireEvent.dragOver(emptySpace!);

        expect(groupView.canDisplayOverlay).toHaveBeenCalledTimes(1);

        expect(
            cut.element.getElementsByClassName('drop-target-dropzone').length
        ).toBe(0);
    });

    test('left actions', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            options: { parentElement: document.createElement('div') },
        });

        const groupPanelMock = jest.fn<DockviewGroupPanel, []>(() => {
            return (<Partial<DockviewGroupPanel>>{}) as DockviewGroupPanel;
        });

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
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            options: { parentElement: document.createElement('div') },
        });

        const groupPanelMock = jest.fn<DockviewGroupPanel, []>(() => {
            return (<Partial<DockviewGroupPanel>>{}) as DockviewGroupPanel;
        });

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
        const accessor = fromPartial<DockviewComponent>({
            options: { parentElement: document.createElement('div') },
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            element: document.createElement('div'),
            addFloatingGroup: jest.fn(),
        });

        const groupPanelMock = jest.fn<DockviewGroupPanel, []>(() => {
            return (<Partial<DockviewGroupPanel>>{
                api: { location: { type: 'grid' } } as any,
            }) as DockviewGroupPanel;
        });

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

        expect(accessor.addFloatingGroup).toHaveBeenCalledWith(
            groupPanel,
            {
                x: 100,
                y: 60,
            },
            { inDragMode: true }
        );
        expect(accessor.addFloatingGroup).toHaveBeenCalledTimes(1);
        expect(eventPreventDefaultSpy).toHaveBeenCalledTimes(1);

        const event2 = new KeyboardEvent('mousedown', { shiftKey: false });
        const eventPreventDefaultSpy2 = jest.spyOn(event2, 'preventDefault');
        fireEvent(container, event2);

        expect(accessor.addFloatingGroup).toHaveBeenCalledTimes(1);
        expect(eventPreventDefaultSpy2).toHaveBeenCalledTimes(0);
    });

    test('that a tab that is already floating cannot be floated again', () => {
        const accessor = fromPartial<DockviewComponent>({
            options: { parentElement: document.createElement('div') },
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            element: document.createElement('div'),
            addFloatingGroup: jest.fn(),
        });

        const groupPanelMock = jest.fn<DockviewGroupPanel, []>(() => {
            return (<Partial<DockviewGroupPanel>>{
                api: { location: { type: 'floating' } } as any,
            }) as DockviewGroupPanel;
        });

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

        expect(accessor.addFloatingGroup).toHaveBeenCalledTimes(0);
        expect(eventPreventDefaultSpy).toHaveBeenCalledTimes(0);

        const event2 = new KeyboardEvent('mousedown', { shiftKey: false });
        const eventPreventDefaultSpy2 = jest.spyOn(event2, 'preventDefault');
        fireEvent(container, event2);

        expect(accessor.addFloatingGroup).toHaveBeenCalledTimes(0);
        expect(eventPreventDefaultSpy2).toHaveBeenCalledTimes(0);
    });

    test('that selecting a tab with shift down will move that tab into a new floating group', () => {
        const accessor = fromPartial<DockviewComponent>({
            options: { parentElement: document.createElement('div') },
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            element: document.createElement('div'),
            addFloatingGroup: jest.fn(),
            getGroupPanel: jest.fn(),
        });

        const groupPanelMock = jest.fn<DockviewGroupPanel, []>(() => {
            return (<Partial<DockviewGroupPanel>>{
                api: { location: { type: 'floating' } } as any,
                model: {} as any,
            }) as DockviewGroupPanel;
        });

        const groupPanel = new groupPanelMock();

        const cut = new TabsContainer(accessor, groupPanel);

        const createPanel = (id: string) =>
            fromPartial<IDockviewPanel>({
                id,
                view: {
                    tab: {
                        element: document.createElement('div'),
                    },
                    content: {
                        element: document.createElement('div'),
                    },
                },
            });

        const panel = createPanel('test_id');
        cut.openPanel(panel);

        const el = cut.element.querySelector('.tab')!;
        expect(el).toBeTruthy();

        const event = new KeyboardEvent('mousedown', { shiftKey: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
        fireEvent(el, event);

        // a floating group with a single tab shouldn't be eligible
        expect(preventDefaultSpy).toHaveBeenCalledTimes(0);
        expect(accessor.addFloatingGroup).toHaveBeenCalledTimes(0);

        const panel2 = createPanel('test_id_2');
        cut.openPanel(panel2);
        fireEvent(el, event);

        expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
        expect(accessor.addFloatingGroup).toHaveBeenCalledTimes(1);
    });

    test('pre header actions', () => {
        const accessor = fromPartial<DockviewComponent>({
            options: { parentElement: document.createElement('div') },
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            element: document.createElement('div'),
            addFloatingGroup: jest.fn(),
            getGroupPanel: jest.fn(),
        });

        const groupPanelMock = jest.fn<DockviewGroupPanel, []>(() => {
            return (<Partial<DockviewGroupPanel>>{
                api: { location: { type: 'grid' } } as any,
                model: {} as any,
            }) as DockviewGroupPanel;
        });

        const groupPanel = new groupPanelMock();

        const cut = new TabsContainer(accessor, groupPanel);

        const panelMock = jest.fn<IDockviewPanel, [string]>((id: string) => {
            const partial: Partial<IDockviewPanel> = {
                id,

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

        const panel = new panelMock('test_id');
        cut.openPanel(panel);

        let result = cut.element.querySelector('.pre-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(0);

        const actions = document.createElement('div');
        cut.setPrefixActionsElement(actions);

        result = cut.element.querySelector('.pre-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(1);
        expect(result!.childNodes.item(0)).toBe(actions);

        const updatedActions = document.createElement('div');
        cut.setPrefixActionsElement(updatedActions);

        result = cut.element.querySelector('.pre-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(1);
        expect(result!.childNodes.item(0)).toBe(updatedActions);

        cut.setPrefixActionsElement(undefined);

        result = cut.element.querySelector('.pre-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(0);
    });

    test('left header actions', () => {
        const accessor = fromPartial<DockviewComponent>({
            options: { parentElement: document.createElement('div') },
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            element: document.createElement('div'),
            addFloatingGroup: jest.fn(),
            getGroupPanel: jest.fn(),
        });

        const groupPanelMock = jest.fn<DockviewGroupPanel, []>(() => {
            return (<Partial<DockviewGroupPanel>>{
                api: { location: { type: 'grid' } } as any,
                model: {} as any,
            }) as DockviewGroupPanel;
        });

        const groupPanel = new groupPanelMock();

        const cut = new TabsContainer(accessor, groupPanel);

        const panelMock = jest.fn<IDockviewPanel, [string]>((id: string) => {
            const partial: Partial<IDockviewPanel> = {
                id,

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

        const panel = new panelMock('test_id');
        cut.openPanel(panel);

        let result = cut.element.querySelector('.left-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(0);

        const actions = document.createElement('div');
        cut.setLeftActionsElement(actions);

        result = cut.element.querySelector('.left-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(1);
        expect(result!.childNodes.item(0)).toBe(actions);

        const updatedActions = document.createElement('div');
        cut.setLeftActionsElement(updatedActions);

        result = cut.element.querySelector('.left-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(1);
        expect(result!.childNodes.item(0)).toBe(updatedActions);

        cut.setLeftActionsElement(undefined);

        result = cut.element.querySelector('.left-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(0);
    });

    test('right header actions', () => {
        const accessor = fromPartial<DockviewComponent>({
            options: { parentElement: document.createElement('div') },
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            element: document.createElement('div'),
            addFloatingGroup: jest.fn(),
            getGroupPanel: jest.fn(),
        });

        const groupPanelMock = jest.fn<DockviewGroupPanel, []>(() => {
            return (<Partial<DockviewGroupPanel>>{
                api: { location: { type: 'grid' } } as any,
                model: {} as any,
            }) as DockviewGroupPanel;
        });

        const groupPanel = new groupPanelMock();

        const cut = new TabsContainer(accessor, groupPanel);

        const panelMock = jest.fn<IDockviewPanel, [string]>((id: string) => {
            const partial: Partial<IDockviewPanel> = {
                id,

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

        const panel = new panelMock('test_id');
        cut.openPanel(panel);

        let result = cut.element.querySelector('.right-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(0);

        const actions = document.createElement('div');
        cut.setRightActionsElement(actions);

        result = cut.element.querySelector('.right-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(1);
        expect(result!.childNodes.item(0)).toBe(actions);

        const updatedActions = document.createElement('div');
        cut.setRightActionsElement(updatedActions);

        result = cut.element.querySelector('.right-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(1);
        expect(result!.childNodes.item(0)).toBe(updatedActions);

        cut.setRightActionsElement(undefined);

        result = cut.element.querySelector('.right-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(0);
    });
});
