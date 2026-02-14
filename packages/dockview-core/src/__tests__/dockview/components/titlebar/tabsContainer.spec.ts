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
import { DockviewPanelApi } from '../../../../api/dockviewPanelApi';

describe('tabsContainer', () => {
    test('that an external event does not render a drop target and calls through to the group mode', () => {
        const accessor = fromPartial<DockviewComponent>({
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            options: {},
            onDidOptionsChange: jest.fn(),
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
            .getElementsByClassName('dv-void-container')
            .item(0) as HTMLElement;

        if (!emptySpace!) {
            fail('element not found');
        }

        jest.spyOn(emptySpace!, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(emptySpace!, 'offsetWidth', 'get').mockImplementation(
            () => 100
        );

        fireEvent.dragEnter(emptySpace!);
        fireEvent.dragOver(emptySpace!);

        expect(groupView.canDisplayOverlay).toHaveBeenCalled();

        expect(
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(0);
    });

    test('that a drag over event from another tab should render a drop target', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            options: {},
            onDidOptionsChange: jest.fn(),
        });

        const dropTargetContainer = document.createElement('div');

        const groupView = fromPartial<DockviewGroupPanelModel>({
            canDisplayOverlay: jest.fn(),
            // dropTargetContainer: new DropTargetAnchorContainer(
            //     dropTargetContainer
            // ),
        });

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
            .getElementsByClassName('dv-void-container')
            .item(0) as HTMLElement;

        if (!emptySpace!) {
            fail('element not found');
        }

        jest.spyOn(emptySpace!, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(emptySpace!, 'offsetWidth', 'get').mockImplementation(
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
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(1);
        // expect(
        //     dropTargetContainer.getElementsByClassName('dv-drop-target-anchor')
        //         .length
        // ).toBe(1);
    });

    test('that dropping over the empty space should render a drop target', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            options: {},
            onDidOptionsChange: jest.fn(),
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
            .getElementsByClassName('dv-void-container')
            .item(0) as HTMLElement;

        if (!emptySpace!) {
            fail('element not found');
        }

        jest.spyOn(emptySpace!, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(emptySpace!, 'offsetWidth', 'get').mockImplementation(
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
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(1);
    });

    test('that dropping the first tab should render a drop target', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            options: {},
            onDidOptionsChange: jest.fn(),
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
            .getElementsByClassName('dv-void-container')
            .item(0) as HTMLElement;

        if (!emptySpace!) {
            fail('element not found');
        }

        jest.spyOn(emptySpace!, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(emptySpace!, 'offsetWidth', 'get').mockImplementation(
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
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(1);
    });

    test('that dropping a tab from another component should not render a drop target', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            options: {},
            onDidOptionsChange: jest.fn(),
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
            .getElementsByClassName('dv-void-container')
            .item(0) as HTMLElement;

        if (!emptySpace!) {
            fail('element not found');
        }

        jest.spyOn(emptySpace!, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(emptySpace!, 'offsetWidth', 'get').mockImplementation(
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
            cut.element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(0);
    });

    test('left actions', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            options: {},
            onDidOptionsChange: jest.fn(),
        });

        const groupPanelMock = jest.fn<DockviewGroupPanel, []>(() => {
            return (<Partial<DockviewGroupPanel>>{}) as DockviewGroupPanel;
        });

        const groupPanel = new groupPanelMock();

        const cut = new TabsContainer(accessor, groupPanel);

        let query = cut.element.querySelectorAll(
            '.dv-tabs-and-actions-container > .dv-left-actions-container'
        );

        expect(query.length).toBe(1);
        expect(query[0].children.length).toBe(0);

        // add left action

        const left = document.createElement('div');
        left.className = 'test-left-actions-element';
        cut.setLeftActionsElement(left);

        query = cut.element.querySelectorAll(
            '.dv-tabs-and-actions-container > .dv-left-actions-container'
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
            '.dv-tabs-and-actions-container > .dv-left-actions-container'
        );
        expect(query.length).toBe(1);
        expect(query[0].children.item(0)?.className).toBe(
            'test-left-actions-element-2'
        );
        expect(query[0].children.length).toBe(1);

        // remove left action

        cut.setLeftActionsElement(undefined);
        query = cut.element.querySelectorAll(
            '.dv-tabs-and-actions-container > .dv-left-actions-container'
        );

        expect(query.length).toBe(1);
        expect(query[0].children.length).toBe(0);
    });

    test('right actions', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            options: {},
            onDidOptionsChange: jest.fn(),
        });

        const groupPanelMock = jest.fn<DockviewGroupPanel, []>(() => {
            return (<Partial<DockviewGroupPanel>>{}) as DockviewGroupPanel;
        });

        const groupPanel = new groupPanelMock();

        const cut = new TabsContainer(accessor, groupPanel);

        let query = cut.element.querySelectorAll(
            '.dv-tabs-and-actions-container > .dv-right-actions-container'
        );

        expect(query.length).toBe(1);
        expect(query[0].children.length).toBe(0);

        // add right action

        const right = document.createElement('div');
        right.className = 'test-right-actions-element';
        cut.setRightActionsElement(right);

        query = cut.element.querySelectorAll(
            '.dv-tabs-and-actions-container > .dv-right-actions-container'
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
            '.dv-tabs-and-actions-container > .dv-right-actions-container'
        );
        expect(query.length).toBe(1);
        expect(query[0].children.item(0)?.className).toBe(
            'test-right-actions-element-2'
        );
        expect(query[0].children.length).toBe(1);

        // remove right action

        cut.setRightActionsElement(undefined);
        query = cut.element.querySelectorAll(
            '.dv-tabs-and-actions-container > .dv-right-actions-container'
        );

        expect(query.length).toBe(1);
        expect(query[0].children.length).toBe(0);
    });

    test('that a tab will become floating when clicked if not floating and shift is selected', () => {
        const accessor = fromPartial<DockviewComponent>({
            options: {},
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            element: document.createElement('div'),
            addFloatingGroup: jest.fn(),
            doSetGroupActive: jest.fn(),
            onDidOptionsChange: jest.fn(),
        });

        const groupPanelMock = jest.fn<DockviewGroupPanel, []>(() => {
            return (<Partial<DockviewGroupPanel>>{
                api: { location: { type: 'grid' } } as any,
            }) as DockviewGroupPanel;
        });

        const groupPanel = new groupPanelMock();

        const cut = new TabsContainer(accessor, groupPanel);

        const container = cut.element.querySelector('.dv-void-container')!;
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

        const event = new KeyboardEvent('pointerdown', { shiftKey: true });
        const eventPreventDefaultSpy = jest.spyOn(event, 'preventDefault');
        fireEvent(container, event);

        expect(accessor.doSetGroupActive).toHaveBeenCalledWith(groupPanel);
        expect(accessor.addFloatingGroup).toHaveBeenCalledWith(groupPanel, {
            x: 100,
            y: 60,
            inDragMode: true,
        });
        expect(accessor.addFloatingGroup).toHaveBeenCalledTimes(1);
        expect(eventPreventDefaultSpy).toHaveBeenCalledTimes(1);

        const event2 = new KeyboardEvent('pointerdown', { shiftKey: false });
        const eventPreventDefaultSpy2 = jest.spyOn(event2, 'preventDefault');
        fireEvent(container, event2);

        expect(accessor.addFloatingGroup).toHaveBeenCalledTimes(1);
        expect(eventPreventDefaultSpy2).toHaveBeenCalledTimes(0);
    });

    test('that a tab that is already floating cannot be floated again', () => {
        const accessor = fromPartial<DockviewComponent>({
            options: {},
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            element: document.createElement('div'),
            addFloatingGroup: jest.fn(),
            doSetGroupActive: jest.fn(),
            onDidOptionsChange: jest.fn(),
        });

        const groupPanelMock = jest.fn<DockviewGroupPanel, []>(() => {
            return (<Partial<DockviewGroupPanel>>{
                api: { location: { type: 'floating' } } as any,
            }) as DockviewGroupPanel;
        });

        const groupPanel = new groupPanelMock();

        const cut = new TabsContainer(accessor, groupPanel);

        const container = cut.element.querySelector('.dv-void-container')!;
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

        const event = new KeyboardEvent('pointerdown', { shiftKey: true });
        const eventPreventDefaultSpy = jest.spyOn(event, 'preventDefault');
        fireEvent(container, event);

        expect(accessor.doSetGroupActive).toHaveBeenCalledWith(groupPanel);
        expect(accessor.addFloatingGroup).toHaveBeenCalledTimes(0);
        expect(eventPreventDefaultSpy).toHaveBeenCalledTimes(0);

        const event2 = new KeyboardEvent('pointerdown', { shiftKey: false });
        const eventPreventDefaultSpy2 = jest.spyOn(event2, 'preventDefault');
        fireEvent(container, event2);

        expect(accessor.addFloatingGroup).toHaveBeenCalledTimes(0);
        expect(eventPreventDefaultSpy2).toHaveBeenCalledTimes(0);
    });

    test('that selecting a tab with shift down will move that tab into a new floating group', () => {
        const accessor = fromPartial<DockviewComponent>({
            options: {},
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            element: document.createElement('div'),
            addFloatingGroup: jest.fn(),
            getGroupPanel: jest.fn(),
            onDidOptionsChange: jest.fn(),
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

        const el = cut.element.querySelector('.dv-tab')!;
        expect(el).toBeTruthy();

        const event = new KeyboardEvent('pointerdown', { shiftKey: true });
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
            options: {},
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            element: document.createElement('div'),
            addFloatingGroup: jest.fn(),
            getGroupPanel: jest.fn(),
            onDidOptionsChange: jest.fn(),
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

        let result = cut.element.querySelector('.dv-pre-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(0);

        const actions = document.createElement('div');
        cut.setPrefixActionsElement(actions);

        result = cut.element.querySelector('.dv-pre-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(1);
        expect(result!.childNodes.item(0)).toBe(actions);

        const updatedActions = document.createElement('div');
        cut.setPrefixActionsElement(updatedActions);

        result = cut.element.querySelector('.dv-pre-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(1);
        expect(result!.childNodes.item(0)).toBe(updatedActions);

        cut.setPrefixActionsElement(undefined);

        result = cut.element.querySelector('.dv-pre-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(0);
    });

    test('left header actions', () => {
        const accessor = fromPartial<DockviewComponent>({
            options: {},
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            element: document.createElement('div'),
            addFloatingGroup: jest.fn(),
            getGroupPanel: jest.fn(),
            onDidOptionsChange: jest.fn(),
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

        let result = cut.element.querySelector('.dv-left-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(0);

        const actions = document.createElement('div');
        cut.setLeftActionsElement(actions);

        result = cut.element.querySelector('.dv-left-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(1);
        expect(result!.childNodes.item(0)).toBe(actions);

        const updatedActions = document.createElement('div');
        cut.setLeftActionsElement(updatedActions);

        result = cut.element.querySelector('.dv-left-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(1);
        expect(result!.childNodes.item(0)).toBe(updatedActions);

        cut.setLeftActionsElement(undefined);

        result = cut.element.querySelector('.dv-left-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(0);
    });

    test('right header actions', () => {
        const accessor = fromPartial<DockviewComponent>({
            options: {},
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            element: document.createElement('div'),
            addFloatingGroup: jest.fn(),
            getGroupPanel: jest.fn(),
            onDidOptionsChange: jest.fn(),
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

        let result = cut.element.querySelector('.dv-right-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(0);

        const actions = document.createElement('div');
        cut.setRightActionsElement(actions);

        result = cut.element.querySelector('.dv-right-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(1);
        expect(result!.childNodes.item(0)).toBe(actions);

        const updatedActions = document.createElement('div');
        cut.setRightActionsElement(updatedActions);

        result = cut.element.querySelector('.dv-right-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(1);
        expect(result!.childNodes.item(0)).toBe(updatedActions);

        cut.setRightActionsElement(undefined);

        result = cut.element.querySelector('.dv-right-actions-container');
        expect(result).toBeTruthy();
        expect(result!.childNodes.length).toBe(0);
    });

    test('class dv-single-tab is present when only one tab exists`', () => {
        const cut = new TabsContainer(
            fromPartial<DockviewComponent>({
                options: {},
                onDidOptionsChange: jest.fn(),
            }),
            fromPartial<DockviewGroupPanel>({})
        );

        expect(cut.element.classList.contains('dv-single-tab')).toBeFalsy();

        const panel1 = new TestPanel(
            'panel_1',
            fromPartial<DockviewPanelApi>({})
        );
        cut.openPanel(panel1);
        expect(cut.element.classList.contains('dv-single-tab')).toBeTruthy();

        const panel2 = new TestPanel(
            'panel_2',
            fromPartial<DockviewPanelApi>({})
        );
        cut.openPanel(panel2);
        expect(cut.element.classList.contains('dv-single-tab')).toBeFalsy();

        cut.closePanel(panel1);
        expect(cut.element.classList.contains('dv-single-tab')).toBeTruthy();

        cut.closePanel(panel2);
        expect(cut.element.classList.contains('dv-single-tab')).toBeFalsy();
    });

    describe('updateDragAndDropState', () => {
        test('that updateDragAndDropState calls updateDragAndDropState on tabs and voidContainer', () => {
            const accessor = fromPartial<DockviewComponent>({
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
                options: {},
                onDidOptionsChange: jest.fn(),
            });

            const groupPanel = fromPartial<DockviewGroupPanel>({
                id: 'testgroupid',
                model: fromPartial<DockviewGroupPanelModel>({}),
            });

            const cut = new TabsContainer(accessor, groupPanel);

            // Mock the tabs and voidContainer to verify methods are called
            const mockTabs = { updateDragAndDropState: jest.fn() };
            const mockVoidContainer = { updateDragAndDropState: jest.fn() };

            (cut as any).tabs = mockTabs;
            (cut as any).voidContainer = mockVoidContainer;

            cut.updateDragAndDropState();

            expect(mockTabs.updateDragAndDropState).toHaveBeenCalledTimes(1);
            expect(
                mockVoidContainer.updateDragAndDropState
            ).toHaveBeenCalledTimes(1);
        });
    });

    describe('tab overflow dropdown with close buttons', () => {
        test('close button should be visible and clickable in dropdown tabs', () => {
            const mockPopupService = {
                openPopover: jest.fn(),
                close: jest.fn(),
            };

            const accessor = fromPartial<DockviewComponent>({
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
                options: {},
                onDidOptionsChange: jest.fn(),
                popupService: mockPopupService,
            });

            const mockClose = jest.fn();
            const mockSetActive = jest.fn();
            const mockScrollIntoView = jest.fn();

            const mockPanel = fromPartial<IDockviewPanel>({
                id: 'test-panel',
                api: {
                    isActive: false,
                    close: mockClose,
                    setActive: mockSetActive,
                },
                view: {
                    createTabRenderer: jest.fn().mockReturnValue({
                        element: (() => {
                            const tabElement = document.createElement('div');
                            tabElement.className = 'dv-default-tab';

                            const content = document.createElement('div');
                            content.className = 'dv-default-tab-content';
                            content.textContent = 'Test Tab';

                            const action = document.createElement('div');
                            action.className = 'dv-default-tab-action';
                            const closeButton = document.createElement('div');
                            action.appendChild(closeButton);

                            // Simulate close button functionality
                            action.addEventListener('click', (e) => {
                                e.preventDefault();
                                mockClose();
                            });

                            tabElement.appendChild(content);
                            tabElement.appendChild(action);

                            return tabElement;
                        })(),
                    }),
                },
            });

            const mockTab = {
                panel: mockPanel,
                element: {
                    scrollIntoView: mockScrollIntoView,
                },
            };

            const mockTabs = {
                tabs: [mockTab],
                onDrop: jest.fn(),
                onTabDragStart: jest.fn(),
                onWillShowOverlay: jest.fn(),
                onOverflowTabsChange: jest.fn(),
                size: 1,
                panels: ['test-panel'],
                isActive: jest.fn(),
                indexOf: jest.fn(),
                delete: jest.fn(),
                setActivePanel: jest.fn(),
                openPanel: jest.fn(),
                showTabsOverflowControl: true,
                updateDragAndDropState: jest.fn(),
                element: document.createElement('div'),
                dispose: jest.fn(),
            };

            const groupPanel = fromPartial<DockviewGroupPanel>({
                id: 'testgroupid',
                panels: [mockPanel],
                model: fromPartial<DockviewGroupPanelModel>({}),
            });

            const cut = new TabsContainer(accessor, groupPanel);
            (cut as any).tabs = mockTabs;

            // Simulate overflow tabs
            (cut as any).toggleDropdown({ tabs: ['test-panel'], reset: false });

            // Find the dropdown trigger and click it
            const dropdownTrigger = cut.element.querySelector(
                '.dv-tabs-overflow-dropdown-root'
            );
            expect(dropdownTrigger).toBeTruthy();

            // Simulate clicking the dropdown trigger
            fireEvent.click(dropdownTrigger!);

            // Verify popup was opened
            expect(mockPopupService.openPopover).toHaveBeenCalled();

            // Get the popover content
            const popoverContent =
                mockPopupService.openPopover.mock.calls[0][0];
            expect(popoverContent).toBeTruthy();

            // Find the tab wrapper in the popover
            const tabWrapper = popoverContent.querySelector('.dv-tab');
            expect(tabWrapper).toBeTruthy();

            // Verify the close button is visible in dropdown
            const closeButton = tabWrapper!.querySelector(
                '.dv-default-tab-action'
            ) as HTMLElement;
            expect(closeButton).toBeTruthy();
            expect(closeButton.style.display).not.toBe('none');

            // Simulate clicking the close button
            fireEvent.click(closeButton!);

            // Verify that the close method was called
            expect(mockClose).toHaveBeenCalledTimes(1);

            // Verify that tab activation methods were NOT called when clicking close button
            expect(mockScrollIntoView).not.toHaveBeenCalled();
            expect(mockSetActive).not.toHaveBeenCalled();
        });

        test('clicking tab content (not close button) should activate tab', () => {
            const mockPopupService = {
                openPopover: jest.fn(),
                close: jest.fn(),
            };

            const accessor = fromPartial<DockviewComponent>({
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
                options: {},
                onDidOptionsChange: jest.fn(),
                popupService: mockPopupService,
            });

            const mockClose = jest.fn();
            const mockSetActive = jest.fn();
            const mockScrollIntoView = jest.fn();

            const mockPanel = fromPartial<IDockviewPanel>({
                id: 'test-panel',
                api: {
                    isActive: false,
                    close: mockClose,
                    setActive: mockSetActive,
                },
                view: {
                    createTabRenderer: jest.fn().mockReturnValue({
                        element: (() => {
                            const tabElement = document.createElement('div');
                            tabElement.className = 'dv-default-tab';

                            const content = document.createElement('div');
                            content.className = 'dv-default-tab-content';
                            content.textContent = 'Test Tab';

                            const action = document.createElement('div');
                            action.className = 'dv-default-tab-action';
                            const closeButton = document.createElement('div');
                            action.appendChild(closeButton);

                            // Simulate close button functionality
                            action.addEventListener('click', (e) => {
                                e.preventDefault();
                                mockClose();
                            });

                            tabElement.appendChild(content);
                            tabElement.appendChild(action);

                            return tabElement;
                        })(),
                    }),
                },
            });

            const mockTab = {
                panel: mockPanel,
                element: {
                    scrollIntoView: mockScrollIntoView,
                },
            };

            const mockTabs = {
                tabs: [mockTab],
                onDrop: jest.fn(),
                onTabDragStart: jest.fn(),
                onWillShowOverlay: jest.fn(),
                onOverflowTabsChange: jest.fn(),
                size: 1,
                panels: ['test-panel'],
                isActive: jest.fn(),
                indexOf: jest.fn(),
                delete: jest.fn(),
                setActivePanel: jest.fn(),
                openPanel: jest.fn(),
                showTabsOverflowControl: true,
                updateDragAndDropState: jest.fn(),
                element: document.createElement('div'),
                dispose: jest.fn(),
            };

            const groupPanel = fromPartial<DockviewGroupPanel>({
                id: 'testgroupid',
                panels: [mockPanel],
                model: fromPartial<DockviewGroupPanelModel>({}),
            });

            const cut = new TabsContainer(accessor, groupPanel);
            (cut as any).tabs = mockTabs;

            // Simulate overflow tabs
            (cut as any).toggleDropdown({ tabs: ['test-panel'], reset: false });

            // Find the dropdown trigger and click it
            const dropdownTrigger = cut.element.querySelector(
                '.dv-tabs-overflow-dropdown-root'
            );
            expect(dropdownTrigger).toBeTruthy();

            // Simulate clicking the dropdown trigger
            fireEvent.click(dropdownTrigger!);

            // Get the popover content
            const popoverContent =
                mockPopupService.openPopover.mock.calls[0][0];
            const tabWrapper = popoverContent.querySelector('.dv-tab');

            // Simulate clicking the tab content (not the close button)
            const tabContent = tabWrapper!.querySelector(
                '.dv-default-tab-content'
            );
            fireEvent.click(tabContent!);

            // Verify that tab activation methods were called
            expect(mockPopupService.close).toHaveBeenCalled();
            expect(mockScrollIntoView).toHaveBeenCalled();
            expect(mockSetActive).toHaveBeenCalled();

            // Verify that close was NOT called when clicking content
            expect(mockClose).not.toHaveBeenCalled();
        });

        test('click event should respect preventDefault in dropdown wrapper', () => {
            const mockPopupService = {
                openPopover: jest.fn(),
                close: jest.fn(),
            };

            const accessor = fromPartial<DockviewComponent>({
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
                options: {},
                onDidOptionsChange: jest.fn(),
                popupService: mockPopupService,
            });

            const mockClose = jest.fn();
            const mockSetActive = jest.fn();
            const mockScrollIntoView = jest.fn();

            const mockPanel = fromPartial<IDockviewPanel>({
                id: 'test-panel',
                api: {
                    isActive: false,
                    close: mockClose,
                    setActive: mockSetActive,
                },
                view: {
                    createTabRenderer: jest.fn().mockReturnValue({
                        element: (() => {
                            const tabElement = document.createElement('div');
                            tabElement.className = 'dv-default-tab';

                            const content = document.createElement('div');
                            content.className = 'dv-default-tab-content';
                            content.textContent = 'Test Tab';

                            const action = document.createElement('div');
                            action.className = 'dv-default-tab-action';
                            const closeButton = document.createElement('div');
                            action.appendChild(closeButton);

                            // Simulate close button functionality that prevents default
                            action.addEventListener('click', (e) => {
                                e.preventDefault();
                                mockClose();
                            });

                            tabElement.appendChild(content);
                            tabElement.appendChild(action);

                            return tabElement;
                        })(),
                    }),
                },
            });

            const mockTab = {
                panel: mockPanel,
                element: {
                    scrollIntoView: mockScrollIntoView,
                },
            };

            const mockTabs = {
                tabs: [mockTab],
                onDrop: jest.fn(),
                onTabDragStart: jest.fn(),
                onWillShowOverlay: jest.fn(),
                onOverflowTabsChange: jest.fn(),
                size: 1,
                panels: ['test-panel'],
                isActive: jest.fn(),
                indexOf: jest.fn(),
                delete: jest.fn(),
                setActivePanel: jest.fn(),
                openPanel: jest.fn(),
                showTabsOverflowControl: true,
                updateDragAndDropState: jest.fn(),
                element: document.createElement('div'),
                dispose: jest.fn(),
            };

            const groupPanel = fromPartial<DockviewGroupPanel>({
                id: 'testgroupid',
                panels: [mockPanel],
                model: fromPartial<DockviewGroupPanelModel>({}),
            });

            const cut = new TabsContainer(accessor, groupPanel);
            (cut as any).tabs = mockTabs;

            // Simulate overflow tabs
            (cut as any).toggleDropdown({ tabs: ['test-panel'], reset: false });

            // Find the dropdown trigger and click it
            const dropdownTrigger = cut.element.querySelector(
                '.dv-tabs-overflow-dropdown-root'
            );
            fireEvent.click(dropdownTrigger!);

            // Get the popover content
            const popoverContent =
                mockPopupService.openPopover.mock.calls[0][0];
            const tabWrapper = popoverContent.querySelector('.dv-tab');
            const closeButton = tabWrapper!.querySelector(
                '.dv-default-tab-action'
            );

            // Simulate clicking the close button (which calls preventDefault)
            fireEvent.click(closeButton!);

            // Verify close was called
            expect(mockClose).toHaveBeenCalledTimes(1);

            // Verify that tab activation methods were NOT called due to preventDefault
            expect(mockScrollIntoView).not.toHaveBeenCalled();
            expect(mockSetActive).not.toHaveBeenCalled();
        });
    });

    test('direction setter toggles CSS classes', () => {
        const accessor = fromPartial<DockviewComponent>({
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            options: {},
            onDidOptionsChange: jest.fn(),
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

        // default should not have vertical classes
        expect(
            cut.element.classList.contains('dv-groupview-header-vertical')
        ).toBeFalsy();

        cut.direction = 'vertical';
        expect(
            cut.element.classList.contains('dv-groupview-header-vertical')
        ).toBeTruthy();

        const rightActions = cut.element.querySelector(
            '.dv-right-actions-container'
        );
        expect(
            rightActions?.classList.contains(
                'dv-right-actions-container-vertical'
            )
        ).toBeTruthy();

        cut.direction = 'horizontal';
        expect(
            cut.element.classList.contains('dv-groupview-header-vertical')
        ).toBeFalsy();
        expect(
            rightActions?.classList.contains(
                'dv-right-actions-container-vertical'
            )
        ).toBeFalsy();
    });
});
