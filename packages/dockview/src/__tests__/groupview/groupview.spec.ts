import { DockviewComponent } from '../../dockview/dockviewComponent';
import {
    GroupviewPanelState,
    IDockviewPanel,
    IGroupPanelInitParameters,
} from '../../groupview/groupPanel';
import {
    GroupPanelPartInitParameters,
    IContentRenderer,
    ITabRenderer,
    IWatermarkRenderer,
} from '../../groupview/types';
import { PanelUpdateEvent } from '../../panel/types';
import {
    GroupChangeKind2,
    GroupOptions,
    Groupview,
} from '../../groupview/groupview';
import {
    DockviewPanelApi,
    DockviewPanelApiImpl,
} from '../../api/groupPanelApi';
import {
    DefaultGroupPanelView,
    IGroupPanelView,
} from '../../dockview/defaultGroupPanelView';
import { GroupPanel } from '../../groupview/groupviewPanel';
import { DockviewApi } from '../../api/component.api';

class Watermark implements IWatermarkRenderer {
    public readonly element = document.createElement('div');

    get id() {
        return 'watermark-id';
    }

    init(params: GroupPanelPartInitParameters) {
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

    updateParentGroup() {
        //
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

    updateParentGroup(group: GroupPanel, isPanelVisible: boolean) {
        //noop
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

    updateParentGroup(group: GroupPanel, isPanelVisible: boolean) {
        //noop
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

class TestPanel implements IDockviewPanel {
    private _view: IGroupPanelView | undefined;
    private _group: GroupPanel | undefined;
    private _params: IGroupPanelInitParameters;

    get title() {
        return '';
    }

    get suppressClosable() {
        return false;
    }

    get group() {
        return this._group;
    }

    get view() {
        return this._view;
    }

    get params(): Record<string, any> {
        return {};
    }

    constructor(public readonly id: string, public api: DockviewPanelApi) {
        this.init({
            view: new DefaultGroupPanelView({
                tab: new TestHeaderPart(id),
                content: new TestContentPart(id),
            }),
            title: `${id}`,
            params: {},
        });
    }

    init(params: IGroupPanelInitParameters) {
        this._view = params.view;

        this._params = params;
    }

    updateParentGroup(group: GroupPanel, isGroupActive: boolean) {
        this._group = group;
    }

    layout(width: number, height: number) {
        //noop
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
            view: this._view.toJSON(),
            title: this._params?.title,
        };
    }

    dispose() {
        //noop
    }
}

describe('groupview', () => {
    let groupview: GroupPanel;
    let dockview: DockviewComponent;
    let options: GroupOptions;

    let removePanelMock: jest.Mock;
    let removeGroupMock: jest.Mock;

    beforeEach(() => {
        removePanelMock = jest.fn();
        removeGroupMock = jest.fn();

        dockview = (<Partial<DockviewComponent>>{
            options: {},
            createWatermarkComponent: () => new Watermark(),
            doSetGroupActive: jest.fn(),
            id: 'dockview-1',
            removePanel: removePanelMock,
            removeGroup: removeGroupMock,
        }) as DockviewComponent;

        options = {
            tabHeight: 30,
        };
        groupview = new GroupPanel(dockview, 'groupview-1', options);
        groupview.initialize();
    });

    test('serialized layout shows active panel', () => {
        const panel1 = new TestPanel('panel1', jest.fn() as any);
        const panel2 = new TestPanel('panel2', jest.fn() as any);
        const panel3 = new TestPanel('panel3', jest.fn() as any);

        const groupview2 = new GroupPanel(dockview, 'groupview-2', {
            tabHeight: 25,
            panels: [panel1, panel2, panel3],
            activePanel: panel2,
        });
        groupview2.initialize();

        expect(groupview2.model.activePanel).toBe(panel2);

        expect(
            groupview2.element.querySelector('.content-part-panel1')
        ).toBeFalsy();
        expect(
            groupview2.element.querySelector('.content-part-panel2')
        ).toBeTruthy();
        expect(
            groupview2.element.querySelector('.content-part-panel3')
        ).toBeFalsy();
    });

    test('panel events are captured during de-serialization', () => {
        const panel1 = new TestPanel('panel1', jest.fn() as any);
        const panel2 = new TestPanel('panel2', jest.fn() as any);
        const panel3 = new TestPanel('panel3', jest.fn() as any);

        const groupview2 = new GroupPanel(dockview, 'groupview-2', {
            tabHeight: 25,
            panels: [panel1, panel2, panel3],
            activePanel: panel2,
        });

        const events: Array<{
            kind: GroupChangeKind2;
        }> = [];
        const disposable = groupview2.model.onDidGroupChange((e) => {
            events.push(e);
        });

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
        }> = [];
        const disposable = groupview.model.onDidGroupChange((e) => {
            events.push(e);
        });

        const panel1 = new TestPanel('panel1', jest.fn() as any);
        const panel2 = new TestPanel('panel2', jest.fn() as any);
        const panel3 = new TestPanel('panel3', jest.fn() as any);

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
        const panel1 = new TestPanel('panel1', jest.fn() as any);
        const panel2 = new TestPanel('panel2', jest.fn() as any);
        const panel3 = new TestPanel('panel3', jest.fn() as any);

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
            '.groupview > .dockview-tabs-and-dockview-actions-container'
        );
        expect(viewQuery).toBeTruthy();

        viewQuery = groupview.element.querySelectorAll(
            '.groupview > .dockview-content-container'
        );
        expect(viewQuery).toBeTruthy();
    });

    test('closeAllPanels with panels', () => {
        const panel1 = new TestPanel('panel1', jest.fn() as any);
        const panel2 = new TestPanel('panel2', jest.fn() as any);
        const panel3 = new TestPanel('panel3', jest.fn() as any);

        groupview.model.openPanel(panel1);
        groupview.model.openPanel(panel2);
        groupview.model.openPanel(panel3);

        groupview.model.closeAllPanels();

        expect(removePanelMock).toBeCalledWith(panel1);
        expect(removePanelMock).toBeCalledWith(panel2);
        expect(removePanelMock).toBeCalledWith(panel3);
    });

    test('closeAllPanels with no panels', () => {
        groupview.model.closeAllPanels();
        expect(removeGroupMock).toBeCalledWith(groupview);
    });

    test('that group is set on panel during onDidAddPanel event', () => {
        const cut = new DockviewComponent(document.createElement('div'), {
            components: {
                component: TestContentPart,
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
                components: {
                    component: TestContentPart,
                },
            }
        );

        const cut = new Groupview(
            document.createElement('div'),
            dockviewComponent,
            'id',
            {},
            null
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
                components: {
                    component: TestContentPart,
                },
            }
        );

        const cut = new Groupview(
            document.createElement('div'),
            dockviewComponent,
            'id',
            {},
            null
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
                components: {
                    component: TestContentPart,
                },
            }
        );

        const groupviewContainer = document.createElement('div');
        const cut = new Groupview(
            groupviewContainer,
            dockviewComponent,
            'id',
            {},
            null
        );
        const contentContainer = groupviewContainer
            .getElementsByClassName('dockview-content-container')
            .item(0).childNodes;

        const panel1 = new TestPanel('id_1', null);

        cut.openPanel(panel1);
        expect(contentContainer.length).toBe(1);
        expect(contentContainer.item(0)).toBe(panel1.view.content.element);

        const panel2 = new TestPanel('id_2', null);

        cut.openPanel(panel2);
        expect(contentContainer.length).toBe(1);
        expect(contentContainer.item(0)).toBe(panel2.view.content.element);

        const panel3 = new TestPanel('id_2', null);

        cut.openPanel(panel3, { skipSetPanelActive: true });
        expect(contentContainer.length).toBe(1);
        expect(contentContainer.item(0)).toBe(panel2.view.content.element);

        cut.openPanel(panel3);
        expect(contentContainer.length).toBe(1);
        expect(contentContainer.item(0)).toBe(panel3.view.content.element);
    });
});
