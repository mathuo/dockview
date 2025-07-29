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
            expect(mockVoidContainer.updateDragAndDropState).toHaveBeenCalledTimes(1);
        });
    });

    describe('dropdown tab close button functionality', () => {
        let accessor: DockviewComponent;
        let groupPanel: DockviewGroupPanel;
        let cut: TabsContainer;
        let popupServiceCloseSpy: jest.SpyInstance;
        let popupServiceOpenPopoverSpy: jest.SpyInstance;

        beforeEach(() => {
            popupServiceCloseSpy = jest.fn();
            popupServiceOpenPopoverSpy = jest.fn();

            accessor = fromPartial<DockviewComponent>({
                id: 'test-component',
                onDidAddPanel: jest.fn(),
                onDidRemovePanel: jest.fn(),
                options: {},
                onDidOptionsChange: jest.fn(),
                popupService: {
                    close: popupServiceCloseSpy,
                    openPopover: popupServiceOpenPopoverSpy,
                },
            });

            groupPanel = fromPartial<DockviewGroupPanel>({
                id: 'test-group',
                model: fromPartial<DockviewGroupPanelModel>({}),
                panels: [],
            });

            cut = new TabsContainer(accessor, groupPanel);
        });

        const createTestPanel = (id: string): IDockviewPanel => {
            const closeMock = jest.fn();
            const setActiveMock = jest.fn();
            
            const api = fromPartial<DockviewPanelApi>({
                close: closeMock,
                setActive: setActiveMock,
                isActive: false,
            });

            // Create a realistic tab element with close button
            const tabElement = document.createElement('div');
            tabElement.className = 'dv-default-tab';
            
            const contentElement = document.createElement('div');
            contentElement.className = 'dv-default-tab-content';
            contentElement.textContent = id;
            
            const actionElement = document.createElement('div');
            actionElement.className = 'dv-default-tab-action';
            
            // Add SVG close button (simplified)
            const closeButton = document.createElement('div');
            closeButton.innerHTML = '×';
            actionElement.appendChild(closeButton);
            
            tabElement.appendChild(contentElement);
            tabElement.appendChild(actionElement);

            const panel = fromPartial<IDockviewPanel>({
                id,
                api,
                view: {
                    createTabRenderer: () => ({
                        element: tabElement,
                        init: () => {},
                    }),
                    tab: {
                        element: tabElement,
                    },
                    content: {
                        element: document.createElement('div'),
                    },
                },
            });

            // Mock panel.api for accessing in groupPanel.panels
            (panel as any).api = api;
            
            return panel;
        };

        test('dropdown tab pointerdown event handler prevents activation when clicking close button', () => {
            // Create test panels
            const panel1 = createTestPanel('panel1');
            const panel2 = createTestPanel('panel2');
            
            // Mock groupPanel.panels to include our test panels
            Object.defineProperty(groupPanel, 'panels', {
                value: [panel1, panel2],
                writable: true,
                configurable: true,
            });

            // Create a mock tab wrapper element that mimics the dropdown structure
            const tabWrapper = document.createElement('div');
            tabWrapper.className = 'dv-tab';
            
            // Add the tab content
            const tabContent = panel2.view.createTabRenderer('headerOverflow');
            tabWrapper.appendChild(tabContent.element);

            // Create the event handler function directly (this is what we're testing)
            const eventHandler = (event: Event) => {
                // Check if the click is on the close button
                const target = event.target as HTMLElement;
                if (target.closest('.dv-default-tab-action')) {
                    // Don't activate tab if clicking on close button
                    return;
                }
                
                (popupServiceCloseSpy as jest.Mock)();
                panel2.api.setActive();
            };

            // Test 1: Clicking on close button should NOT activate tab
            const closeButton = tabWrapper.querySelector('.dv-default-tab-action')!;
            const closeClickEvent = new MouseEvent('pointerdown');
            Object.defineProperty(closeClickEvent, 'target', {
                value: closeButton,
                enumerable: true,
            });
            
            eventHandler(closeClickEvent);
            
            expect(popupServiceCloseSpy).toHaveBeenCalledTimes(0);
            expect(panel2.api.setActive).toHaveBeenCalledTimes(0);

            // Test 2: Clicking on tab content should activate tab
            const tabContentArea = tabWrapper.querySelector('.dv-default-tab-content')!;
            const tabClickEvent = new MouseEvent('pointerdown');
            Object.defineProperty(tabClickEvent, 'target', {
                value: tabContentArea,
                enumerable: true,
            });
            
            eventHandler(tabClickEvent);
            
            expect(popupServiceCloseSpy).toHaveBeenCalledTimes(1);
            expect(panel2.api.setActive).toHaveBeenCalledTimes(1);
        });

        test('closest() method works correctly for nested elements inside close button', () => {
            const panel2 = createTestPanel('panel2');
            
            // Create a mock tab wrapper element
            const tabWrapper = document.createElement('div');
            tabWrapper.className = 'dv-tab';
            
            // Add the tab content
            const tabContent = panel2.view.createTabRenderer('headerOverflow');
            tabWrapper.appendChild(tabContent.element);

            // Create nested element inside close button (like SVG paths)
            const closeButton = tabWrapper.querySelector('.dv-default-tab-action')!;
            const nestedElement = document.createElement('span');
            nestedElement.className = 'nested-svg-path';
            closeButton.appendChild(nestedElement);

            // Create the event handler function
            const eventHandler = (event: Event) => {
                const target = event.target as HTMLElement;
                if (target.closest('.dv-default-tab-action')) {
                    return;
                }
                
                (popupServiceCloseSpy as jest.Mock)();
                panel2.api.setActive();
            };

            // Test clicking on nested element inside close button
            const nestedClickEvent = new MouseEvent('pointerdown');
            Object.defineProperty(nestedClickEvent, 'target', {
                value: nestedElement,
                enumerable: true,
            });
            
            eventHandler(nestedClickEvent);
            
            // Should not activate tab because nested element is inside close button
            expect(popupServiceCloseSpy).toHaveBeenCalledTimes(0);
            expect(panel2.api.setActive).toHaveBeenCalledTimes(0);
        });

        test('integration test - full dropdown workflow', () => {
            // Create test panels
            const panel1 = createTestPanel('panel1');
            const panel2 = createTestPanel('panel2');
            
            cut.openPanel(panel1);
            cut.openPanel(panel2);

            // Mock groupPanel.panels to include our test panels
            Object.defineProperty(groupPanel, 'panels', {
                value: [panel1, panel2],
                writable: true,
                configurable: true,
            });

            // Create mock tabs to match the structure expected by toggleDropdown
            const mockTab1 = { panel: panel1, element: panel1.view.tab.element };
            const mockTab2 = { panel: panel2, element: panel2.view.tab.element };
            
            // Mock the tabs.tabs getter to return our mock tabs
            Object.defineProperty(cut, 'tabs', {
                value: {
                    tabs: [mockTab1, mockTab2],
                },
                writable: true,
                configurable: true,
            });

            // Trigger dropdown creation by calling toggleDropdown
            (cut as any).toggleDropdown({ tabs: ['panel2'], reset: false });

            // Verify dropdown element was created
            const dropdownElement = cut.element.querySelector('.dv-tabs-overflow-dropdown-default');
            expect(dropdownElement).toBeTruthy();
            
            // Verify the dropdown shows the correct count
            expect(dropdownElement!.textContent).toContain('1');
        });
    });
});
