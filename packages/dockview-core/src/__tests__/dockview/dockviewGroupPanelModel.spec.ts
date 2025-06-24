import { DockviewComponent } from '../../dockview/dockviewComponent';
import {
    GroupviewPanelState,
    IGroupPanelInitParameters,
    GroupPanelPartInitParameters,
    IContentRenderer,
    ITabRenderer,
    IWatermarkRenderer,
} from '../../dockview/types';
import { PanelUpdateEvent, Parameters } from '../../panel/types';
import {
    DockviewGroupPanelModel,
    GroupOptions,
} from '../../dockview/dockviewGroupPanelModel';
import { fireEvent } from '@testing-library/dom';
import { LocalSelectionTransfer, PanelTransfer } from '../../dnd/dataTransfer';
import { CompositeDisposable } from '../../lifecycle';
import { DockviewPanelApi } from '../../api/dockviewPanelApi';
import { IDockviewPanel } from '../../dockview/dockviewPanel';
import { IDockviewPanelModel } from '../../dockview/dockviewPanelModel';
import { DockviewGroupPanel } from '../../dockview/dockviewGroupPanel';
import { WatermarkRendererInitParameters } from '../../dockview/types';
import { createOffsetDragOverEvent } from '../__test_utils__/utils';
import { OverlayRenderContainer } from '../../overlay/overlayRenderContainer';
import { Emitter } from '../../events';
import { fromPartial } from '@total-typescript/shoehorn';
import { TabLocation } from '../../dockview/framework';

enum GroupChangeKind2 {
    ADD_PANEL,
    REMOVE_PANEL,
    PANEL_ACTIVE,
}

class TestModel implements IDockviewPanelModel {
    readonly content: IContentRenderer;
    readonly contentComponent: string;
    readonly tab: ITabRenderer;

    constructor(readonly id: string) {
        this.content = new TestHeaderPart(id);
        this.contentComponent = id;
        this.tab = new TestContentPart(id);
    }

    createTabRenderer(tabLocation: TabLocation): ITabRenderer {
        return new TestHeaderPart(this.id);
    }

    update(event: PanelUpdateEvent): void {
        //
    }

    layout(width: number, height: number): void {
        //
    }

    init(params: GroupPanelPartInitParameters): void {
        //
    }

    updateParentGroup(
        group: DockviewGroupPanel,
        isPanelVisible: boolean
    ): void {
        //
    }

    dispose(): void {
        //
    }
}

class Watermark implements IWatermarkRenderer {
    public readonly element = document.createElement('div');

    constructor() {
        this.element.className = `watermark-test-container`;
    }

    get id() {
        return 'watermark-id';
    }

    init(params: WatermarkRendererInitParameters) {
        //
    }

    layout(width: number, height: number) {
        // noop
    }

    update(event: PanelUpdateEvent) {
        // noop
    }

    focus() {
        // noop
    }

    toJSON() {
        return {};
    }

    dispose() {
        //
    }
}

class TestContentPart implements IContentRenderer {
    public element = document.createElement('div');

    constructor(public readonly id: string) {
        this.element.className = `content-part-${id}`;
    }

    init(params: GroupPanelPartInitParameters) {
        //noop
    }

    layout(width: number, height: number) {
        //noop
    }

    update(event: PanelUpdateEvent) {
        //void
    }

    focus() {
        //noop
    }

    dispose() {
        //noop
    }

    toJSON() {
        return {};
    }
}
class TestHeaderPart implements ITabRenderer {
    public element = document.createElement('div');

    constructor(public readonly id: string) {
        this.element.className = `header-part-${id}`;
    }

    init(params: GroupPanelPartInitParameters) {
        //noop
    }

    layout(width: number, height: number) {
        //noop
    }

    update(event: PanelUpdateEvent) {
        //void
    }

    focus() {
        //noop
    }

    dispose() {
        //noop
    }

    toJSON() {
        return {};
    }
}

export class TestPanel implements IDockviewPanel {
    private _group: DockviewGroupPanel | undefined;
    private _params: IGroupPanelInitParameters | undefined;
    readonly view: IDockviewPanelModel;
    readonly componentElId: string;
    readonly tabComponentElId: string;

    get title() {
        return '';
    }

    get group() {
        return this._group!;
    }

    get params(): Parameters {
        return {};
    }

    constructor(public readonly id: string, public api: DockviewPanelApi) {
        this.view = new TestModel(id);
        this.tabComponentElId = `tab-${id}`;
        this.componentElId = `tab-panel-${id}`;
        this.init({
            title: `${id}`,
            params: {},
        });
    }

    init(params: IGroupPanelInitParameters) {
        this._params = params;
    }

    updateParentGroup(group: DockviewGroupPanel): void {
        //
    }

    runEvents(): void {
        //
    }

    layout(width: number, height: number) {
        //noop
    }

    setTitle(title: string): void {
        //
    }

    update(event: PanelUpdateEvent) {
        //noop
    }

    focus() {
        //noop
    }

    toJSON(): GroupviewPanelState {
        return {
            id: this.id,
            title: this._params?.title,
        };
    }

    dispose() {
        //noop
    }
}

describe('dockviewGroupPanelModel', () => {
    let groupview: DockviewGroupPanel;
    let dockview: DockviewComponent;
    let options: GroupOptions;

    let removePanelMock: jest.Mock;
    let removeGroupMock: jest.Mock;

    let panelApi: DockviewPanelApi;

    beforeEach(() => {
        removePanelMock = jest.fn();
        removeGroupMock = jest.fn();

        options = {};

        panelApi = fromPartial<DockviewPanelApi>({
            renderer: 'onlyWhenVisible',
            onDidTitleChange: new Emitter().event,
            onDidParametersChange: new Emitter().event,
        });

        dockview = fromPartial<DockviewComponent>({
            options: {},
            createWatermarkComponent: () => new Watermark(),
            doSetGroupActive: jest.fn(),
            id: 'dockview-1',
            removePanel: removePanelMock,
            removeGroup: removeGroupMock,
            onDidAddPanel: () => ({ dispose: jest.fn() }),
            onDidRemovePanel: () => ({ dispose: jest.fn() }),
            onDidActivePanelChange: () => ({ dispose: jest.fn() }),
            overlayRenderContainer: new OverlayRenderContainer(
                document.createElement('div'),
                fromPartial<DockviewComponent>({})
            ),
            onDidOptionsChange: () => ({ dispose: jest.fn() }),
        });

        groupview = new DockviewGroupPanel(dockview, 'groupview-1', options);
        groupview.initialize();
    });

    test('panel events are captured during de-serialization', () => {
        const panel1 = new TestPanel('panel1', panelApi);
        const panel2 = new TestPanel('panel2', panelApi);
        const panel3 = new TestPanel('panel3', panelApi);

        const groupview2 = new DockviewGroupPanel(dockview, 'groupview-2', {
            panels: [panel1, panel2, panel3],
            activePanel: panel2,
        });

        const events: Array<{
            kind: GroupChangeKind2;
            panel?: IDockviewPanel;
        }> = [];

        const disposable = new CompositeDisposable(
            groupview2.model.onDidAddPanel((e) => {
                events.push({
                    kind: GroupChangeKind2.ADD_PANEL,
                    panel: e.panel,
                });
            }),
            groupview2.model.onDidRemovePanel((e) => {
                events.push({
                    kind: GroupChangeKind2.REMOVE_PANEL,
                    panel: e.panel,
                });
            }),
            groupview2.model.onDidActivePanelChange((e) => {
                events.push({
                    kind: GroupChangeKind2.PANEL_ACTIVE,
                    panel: e.panel,
                });
            })
        );

        groupview2.initialize();

        expect(events).toEqual([
            {
                kind: GroupChangeKind2.ADD_PANEL,
                panel: panel1,
            },
            {
                kind: GroupChangeKind2.ADD_PANEL,
                panel: panel2,
            },
            {
                kind: GroupChangeKind2.ADD_PANEL,
                panel: panel3,
            },
            {
                kind: GroupChangeKind2.PANEL_ACTIVE,
                panel: panel2,
            },
        ]);

        disposable.dispose();
    });

    test('panel events flow', () => {
        let events: Array<{
            kind: GroupChangeKind2;
            panel?: IDockviewPanel;
        }> = [];

        const disposable = new CompositeDisposable(
            groupview.model.onDidAddPanel((e) => {
                events.push({
                    kind: GroupChangeKind2.ADD_PANEL,
                    panel: e.panel,
                });
            }),
            groupview.model.onDidRemovePanel((e) => {
                events.push({
                    kind: GroupChangeKind2.REMOVE_PANEL,
                    panel: e.panel,
                });
            }),
            groupview.model.onDidActivePanelChange((e) => {
                events.push({
                    kind: GroupChangeKind2.PANEL_ACTIVE,
                    panel: e.panel,
                });
            })
        );

        const panel1 = new TestPanel('panel1', panelApi);
        const panel2 = new TestPanel('panel2', panelApi);
        const panel3 = new TestPanel('panel3', panelApi);

        expect(events.length).toBe(0);

        groupview.model.openPanel(panel1);
        expect(events).toEqual([
            {
                kind: GroupChangeKind2.ADD_PANEL,
                panel: panel1,
            },
            {
                kind: GroupChangeKind2.PANEL_ACTIVE,
                panel: panel1,
            },
        ]);
        events = [];

        groupview.model.openPanel(panel2);
        expect(events).toEqual([
            {
                kind: GroupChangeKind2.ADD_PANEL,
                panel: panel2,
            },
            {
                kind: GroupChangeKind2.PANEL_ACTIVE,
                panel: panel2,
            },
        ]);
        events = [];

        groupview.model.openPanel(panel3);
        expect(events).toEqual([
            {
                kind: GroupChangeKind2.ADD_PANEL,
                panel: panel3,
            },
            {
                kind: GroupChangeKind2.PANEL_ACTIVE,
                panel: panel3,
            },
        ]);
        events = [];

        groupview.model.removePanel(panel3);
        expect(events).toEqual([
            {
                kind: GroupChangeKind2.REMOVE_PANEL,
                panel: panel3,
            },
            {
                kind: GroupChangeKind2.PANEL_ACTIVE,
                panel: panel2,
            },
        ]);
        events = [];

        groupview.model.removePanel(panel1);
        expect(events).toEqual([
            {
                kind: GroupChangeKind2.REMOVE_PANEL,
                panel: panel1,
            },
        ]);
        events = [];

        groupview.model.removePanel(panel2);
        expect(events).toEqual([
            {
                kind: GroupChangeKind2.REMOVE_PANEL,
                panel: panel2,
            },
        ]);
        events = [];

        disposable.dispose();
    });

    test('moveToPrevious and moveToNext', () => {
        const panel1 = new TestPanel('panel1', panelApi);
        const panel2 = new TestPanel('panel2', panelApi);
        const panel3 = new TestPanel('panel3', panelApi);

        groupview.model.openPanel(panel1);
        groupview.model.openPanel(panel2);
        groupview.model.openPanel(panel3);

        groupview.model.openPanel(panel2); // set active

        groupview.model.moveToPrevious();
        expect(groupview.model.activePanel).toBe(panel1);

        groupview.model.moveToPrevious({ suppressRoll: true });
        expect(groupview.model.activePanel).toBe(panel1);

        groupview.model.moveToPrevious();
        expect(groupview.model.activePanel).toBe(panel3);

        groupview.model.moveToNext({ suppressRoll: true });
        expect(groupview.model.activePanel).toBe(panel3);

        groupview.model.moveToNext({ suppressRoll: false });
        expect(groupview.model.activePanel).toBe(panel1);

        groupview.model.moveToPrevious({ suppressRoll: false });
        expect(groupview.model.activePanel).toBe(panel3);

        groupview.model.moveToNext();
        groupview.model.moveToNext();
        expect(groupview.model.activePanel).toBe(panel2);
    });

    test('default', () => {
        let viewQuery = groupview.element.querySelectorAll(
            '.dv-groupview > .dv-tabs-and-actions-container'
        );
        expect(viewQuery).toBeTruthy();

        viewQuery = groupview.element.querySelectorAll(
            '.dv-groupview > .dv-content-container'
        );
        expect(viewQuery).toBeTruthy();
    });

    test('closeAllPanels with panels', () => {
        const panel1 = new TestPanel('panel1', panelApi);
        const panel2 = new TestPanel('panel2', panelApi);
        const panel3 = new TestPanel('panel3', panelApi);

        groupview.model.openPanel(panel1);
        groupview.model.openPanel(panel2);
        groupview.model.openPanel(panel3);

        groupview.model.closeAllPanels();

        expect(removePanelMock).toHaveBeenCalledWith(panel1, undefined);
        expect(removePanelMock).toHaveBeenCalledWith(panel2, undefined);
        expect(removePanelMock).toHaveBeenCalledWith(panel3, undefined);
    });

    test('closeAllPanels with no panels', () => {
        groupview.model.closeAllPanels();
        expect(removeGroupMock).toHaveBeenCalledWith(groupview);
    });

    test('that group is set on panel during onDidAddPanel event', () => {
        const cut = new DockviewComponent(document.createElement('div'), {
            createComponent(options) {
                switch (options.name) {
                    case 'component':
                        return new TestContentPart(options.id);
                    default:
                        throw new Error(`unsupported`);
                }
            },
        });

        const disposable = cut.onDidAddPanel((panel) => {
            expect(panel.group).toBeTruthy();
        });

        const panel = cut.addPanel({ id: 'id', component: 'component' });
        disposable.dispose();
    });

    test('toJSON() default', () => {
        const dockviewComponent = new DockviewComponent(
            document.createElement('div'),
            {
                createComponent(options) {
                    switch (options.name) {
                        case 'component':
                            return new TestContentPart(options.id);
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            }
        );

        const cut = new DockviewGroupPanelModel(
            document.createElement('div'),
            dockviewComponent,
            'id',
            {},
            null as any
        );

        expect(cut.toJSON()).toEqual({
            views: [],
            activeView: undefined,
            id: 'id',
        });
    });

    test('toJSON() locked and hideHeader', () => {
        const dockviewComponent = new DockviewComponent(
            document.createElement('div'),
            {
                createComponent(options) {
                    switch (options.name) {
                        case 'component':
                            return new TestContentPart(options.id);
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            }
        );

        const cut = new DockviewGroupPanelModel(
            document.createElement('div'),
            dockviewComponent,
            'id',
            {},
            null as any
        );

        cut.locked = true;
        cut.header.hidden = true;

        expect(cut.toJSON()).toEqual({
            views: [],
            activeView: undefined,
            id: 'id',
            locked: true,
            hideHeader: true,
        });
    });

    test("that openPanel with skipSetActive doesn't set panel to active", () => {
        const dockviewComponent = new DockviewComponent(
            document.createElement('div'),
            {
                createComponent(options) {
                    switch (options.name) {
                        case 'component':
                            return new TestContentPart(options.id);
                        default:
                            throw new Error(`unsupported`);
                    }
                },
            }
        );

        const groupviewContainer = document.createElement('div');
        const cut = new DockviewGroupPanelModel(
            groupviewContainer,
            dockviewComponent,
            'id',
            {},
            null as any
        );
        const contentContainer = groupviewContainer
            .getElementsByClassName('dv-content-container')
            .item(0)!.childNodes;

        const panel1 = new TestPanel('id_1', panelApi);

        cut.openPanel(panel1);
        expect(contentContainer.length).toBe(1);
        expect(contentContainer.item(0)).toBe(panel1.view.content.element);

        const panel2 = new TestPanel('id_2', panelApi);

        cut.openPanel(panel2);
        expect(contentContainer.length).toBe(1);
        expect(contentContainer.item(0)).toBe(panel2.view.content.element);

        const panel3 = new TestPanel('id_2', panelApi);

        cut.openPanel(panel3, { skipSetActive: true });
        expect(contentContainer.length).toBe(1);
        expect(contentContainer.item(0)).toBe(panel2.view.content.element);

        cut.openPanel(panel3);
        expect(contentContainer.length).toBe(1);
        expect(contentContainer.item(0)).toBe(panel3.view.content.element);
    });

    test('that should not show drop target is external event', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            options: {},
            getPanel: jest.fn(),
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            onDidOptionsChange: jest.fn(),
            onDidActivePanelChange: jest.fn(),
        });

        const groupviewMock = jest.fn<Partial<DockviewGroupPanelModel>, []>(
            () => {
                return {
                    canDisplayOverlay: jest.fn(),
                };
            }
        );

        const groupView = new groupviewMock() as DockviewGroupPanelModel;

        const groupPanelMock = jest.fn<Partial<DockviewGroupPanelModel>, []>(
            () => {
                return {
                    id: 'testgroupid',
                    model: groupView,
                };
            }
        );

        const container = document.createElement('div');
        const cut = new DockviewGroupPanelModel(
            container,
            accessor,
            'groupviewid',
            {},
            new groupPanelMock() as DockviewGroupPanel
        );

        let counter = 0;

        cut.onUnhandledDragOverEvent(() => {
            counter++;
        });

        const element = container
            .getElementsByClassName('dv-content-container')
            .item(0)! as HTMLElement;

        jest.spyOn(element, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(element, 'offsetWidth', 'get').mockImplementation(() => 100);

        fireEvent.dragEnter(element);
        fireEvent.dragOver(element);

        expect(counter).toBe(1);

        expect(
            element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(0);
    });

    test('that the .locked behaviour is as', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            options: {},
            getPanel: jest.fn(),
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            onDidOptionsChange: jest.fn(),
            onDidActivePanelChange: jest.fn(),
        });

        const groupviewMock = jest.fn<Partial<DockviewGroupPanelModel>, []>(
            () => {
                return {
                    canDisplayOverlay: jest.fn(),
                };
            }
        );

        const groupView = new groupviewMock() as DockviewGroupPanelModel;

        const groupPanelMock = jest.fn<Partial<DockviewGroupPanelModel>, []>(
            () => {
                return {
                    id: 'testgroupid',
                    model: groupView,
                };
            }
        );

        const container = document.createElement('div');
        const cut = new DockviewGroupPanelModel(
            container,
            accessor,
            'groupviewid',
            {},
            new groupPanelMock() as DockviewGroupPanel
        );

        cut.onUnhandledDragOverEvent((e) => {
            e.accept();
        });

        const element = container
            .getElementsByClassName('dv-content-container')
            .item(0)! as HTMLElement;

        jest.spyOn(element, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(element, 'offsetWidth', 'get').mockImplementation(() => 100);

        function run(value: number) {
            fireEvent.dragEnter(element);
            fireEvent(
                element,
                createOffsetDragOverEvent({ clientX: value, clientY: value })
            );
        }

        // base case - not locked
        cut.locked = false;
        run(10);
        expect(
            element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(1);
        fireEvent.dragEnd(element);

        // special case - locked with no possible target
        cut.locked = 'no-drop-target';
        run(10);
        expect(
            element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(0);
        fireEvent.dragEnd(element);

        // standard locked - only show if not center target
        cut.locked = true;
        run(10);
        expect(
            element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(1);
        fireEvent.dragEnd(element);

        // standard locked but for center target - expect not shown
        cut.locked = true;
        run(25);
        expect(
            element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(0);
        fireEvent.dragEnd(element);
    });

    test('that should show drop target if dropping on self', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            options: {},
            getPanel: jest.fn(),
            doSetGroupActive: jest.fn(),
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            onDidActivePanelChange: jest.fn(),
            overlayRenderContainer: new OverlayRenderContainer(
                document.createElement('div'),
                fromPartial<DockviewComponent>({})
            ),
            onDidOptionsChange: jest.fn(),
        });

        const groupView = fromPartial<DockviewGroupPanelModel>({
            canDisplayOverlay: jest.fn(),
        });

        const groupPanelMock = jest.fn<Partial<DockviewGroupPanel>, []>(() => {
            return {
                id: 'testgroupid',
                model: groupView,
            };
        });

        const container = document.createElement('div');
        const cut = new DockviewGroupPanelModel(
            container,
            accessor,
            'groupviewid',
            {},
            new groupPanelMock() as DockviewGroupPanel
        );

        let counter = 0;

        cut.onUnhandledDragOverEvent(() => {
            counter++;
        });

        cut.openPanel(new TestPanel('panel1', panelApi));

        const element = container
            .getElementsByClassName('dv-content-container')
            .item(0)! as HTMLElement;

        jest.spyOn(element, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(element, 'offsetWidth', 'get').mockImplementation(() => 100);

        LocalSelectionTransfer.getInstance().setData(
            [new PanelTransfer('testcomponentid', 'groupviewid', 'panel1')],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(element);
        fireEvent.dragOver(element);

        expect(counter).toBe(0);

        expect(
            element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(1);
    });

    test('that should allow drop when dropping on self for same component id', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            options: {},
            getPanel: jest.fn(),
            doSetGroupActive: jest.fn(),
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            onDidActivePanelChange: jest.fn(),
            overlayRenderContainer: new OverlayRenderContainer(
                document.createElement('div'),
                fromPartial<DockviewComponent>({})
            ),
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

        const container = document.createElement('div');
        const cut = new DockviewGroupPanelModel(
            container,
            accessor,
            'groupviewid',
            {},
            new groupPanelMock() as DockviewGroupPanel
        );

        let counter = 0;

        cut.onUnhandledDragOverEvent(() => {
            counter++;
        });

        cut.openPanel(new TestPanel('panel1', panelApi));
        cut.openPanel(new TestPanel('panel2', panelApi));

        const element = container
            .getElementsByClassName('dv-content-container')
            .item(0) as HTMLElement;

        jest.spyOn(element, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(element, 'offsetWidth', 'get').mockImplementation(() => 100);

        LocalSelectionTransfer.getInstance().setData(
            [new PanelTransfer('testcomponentid', 'groupviewid', 'panel1')],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(element);
        fireEvent.dragOver(element);

        expect(counter).toBe(0);

        expect(
            element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(1);
    });

    test('that should not allow drop when not dropping for different component id', () => {
        const accessor = fromPartial<DockviewComponent>({
            id: 'testcomponentid',
            options: {},
            getPanel: jest.fn(),
            doSetGroupActive: jest.fn(),
            onDidAddPanel: jest.fn(),
            onDidRemovePanel: jest.fn(),
            onDidActivePanelChange: jest.fn(),
            overlayRenderContainer: new OverlayRenderContainer(
                document.createElement('div'),
                fromPartial<DockviewComponent>({})
            ),
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

        const container = document.createElement('div');
        const cut = new DockviewGroupPanelModel(
            container,
            accessor,
            'groupviewid',
            {},
            new groupPanelMock() as DockviewGroupPanel
        );

        let counter = 0;

        cut.onUnhandledDragOverEvent(() => {
            counter++;
        });

        cut.openPanel(new TestPanel('panel1', panelApi));
        cut.openPanel(new TestPanel('panel2', panelApi));

        const element = container
            .getElementsByClassName('dv-content-container')
            .item(0) as HTMLElement;

        jest.spyOn(element, 'offsetHeight', 'get').mockImplementation(
            () => 100
        );
        jest.spyOn(element, 'offsetWidth', 'get').mockImplementation(() => 100);

        LocalSelectionTransfer.getInstance().setData(
            [new PanelTransfer('anothercomponentid', 'groupviewid', 'panel1')],
            PanelTransfer.prototype
        );

        fireEvent.dragEnter(element);
        fireEvent.dragOver(element);

        expect(counter).toBe(1);

        expect(
            element.getElementsByClassName('dv-drop-target-dropzone').length
        ).toBe(0);
    });

    test('that the watermark is removed when dispose is called', () => {
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
                dispose: jest.fn()
            };
        });

        const container = document.createElement('div');

        const cut = new DockviewGroupPanelModel(
            container,
            dockview,
            'groupviewid',
            {},
            new groupPanelMock() as DockviewGroupPanel
        );

        cut.initialize();

        expect(
            container.getElementsByClassName('watermark-test-container').length
        ).toBe(1);

        cut.dispose();

        expect(
            container.getElementsByClassName('watermark-test-container').length
        ).toBe(0);
    });

    test('that watermark is added', () => {
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

        const container = document.createElement('div');

        const cut = new DockviewGroupPanelModel(
            container,
            dockview,
            'groupviewid',
            {},
            new groupPanelMock() as DockviewGroupPanel
        );

        cut.initialize();

        expect(
            container.getElementsByClassName('watermark-test-container').length
        ).toBe(1);

        cut.openPanel(new TestPanel('panel1', panelApi));

        expect(
            container.getElementsByClassName('watermark-test-container').length
        ).toBe(0);
        expect(
            container.getElementsByClassName('dv-tabs-and-actions-container')
                .length
        ).toBe(1);

        cut.openPanel(new TestPanel('panel2', panelApi));

        expect(
            container.getElementsByClassName('watermark-test-container').length
        ).toBe(0);

        cut.removePanel('panel1');

        expect(
            container.getElementsByClassName('watermark-test-container').length
        ).toBe(0);

        cut.removePanel('panel2');

        expect(
            container.getElementsByClassName('watermark-test-container').length
        ).toBe(1);

        cut.openPanel(new TestPanel('panel1', panelApi));

        expect(
            container.getElementsByClassName('watermark-test-container').length
        ).toBe(0);
    });
});
