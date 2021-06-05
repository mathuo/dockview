import { IDockviewComponent } from '../../dockview/dockviewComponent';
import { Emitter } from '../../events';
import {
    GroupviewPanelState,
    IGroupPanel,
    IGroupPanelInitParameters,
} from '../../groupview/groupPanel';
import {
    GroupPanelPartInitParameters,
    IContentRenderer,
    ITabRenderer,
    IWatermarkRenderer,
} from '../../groupview/types';
import { PanelUpdateEvent } from '../../panel/types';
import { fireEvent } from '@testing-library/dom';
import { LocalSelectionTransfer } from '../../dnd/dataTransfer';
import { Position } from '../../dnd/droptarget';
import { GroupviewPanel } from '../../groupview/groupviewPanel';
import {
    DefaultGroupPanelView,
    IGroupPanelView,
} from '../../react/dockview/v2/defaultGroupPanelView';
import { GroupOptions, GroupDropEvent } from '../../groupview/groupview';
import { DockviewPanelApi } from '../../api/groupPanelApi';

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

    updateParentGroup(group: GroupviewPanel, isPanelVisible: boolean) {
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

    updateParentGroup(group: GroupviewPanel, isPanelVisible: boolean) {
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

class TestPanel implements IGroupPanel {
    private _view: IGroupPanelView | undefined;
    private _group: GroupviewPanel | undefined;
    private _params: IGroupPanelInitParameters;
    private _onDidChangeState = new Emitter<void>();
    readonly onDidStateChange = this._onDidChangeState.event;

    get group() {
        return this._group;
    }

    get view() {
        return this._view;
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

    setDirty(isDirty: boolean) {
        //noop
    }

    updateParentGroup(group: GroupviewPanel, isGroupActive: boolean) {
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
    let groupview: GroupviewPanel;
    let dockview: IDockviewComponent;
    let options: GroupOptions;

    beforeEach(() => {
        dockview = <IDockviewComponent>(<any>{
            options: {
                enableExternalDragEvents: false,
            },
            createWatermarkComponent: () => new Watermark(),
            doSetGroupActive: jest.fn(),
            id: 'dockview-1',
        });

        options = {
            tabHeight: 30,
        };
        groupview = new GroupviewPanel(dockview, 'groupview-1', options);
    });

    test('serialized layout shows active panel', () => {
        const panel1 = new TestPanel('panel1', jest.fn() as any);
        const panel2 = new TestPanel('panel2', jest.fn() as any);
        const panel3 = new TestPanel('panel3', jest.fn() as any);

        const groupview2 = new GroupviewPanel(dockview, 'groupview-2', {
            tabHeight: 25,
            panels: [panel1, panel2, panel3],
            activePanel: panel2,
        });

        expect(groupview2.group.activePanel).toBe(panel2);

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

    test('moveToPrevious and moveToNext', () => {
        const panel1 = new TestPanel('panel1', jest.fn() as any);
        const panel2 = new TestPanel('panel2', jest.fn() as any);
        const panel3 = new TestPanel('panel3', jest.fn() as any);

        groupview.group.openPanel(panel1);
        groupview.group.openPanel(panel2);
        groupview.group.openPanel(panel3);

        groupview.group.openPanel(panel2); // set active

        groupview.group.moveToPrevious();
        expect(groupview.group.activePanel).toBe(panel1);

        groupview.group.moveToPrevious({ suppressRoll: true });
        expect(groupview.group.activePanel).toBe(panel1);

        groupview.group.moveToPrevious();
        expect(groupview.group.activePanel).toBe(panel3);

        groupview.group.moveToNext({ suppressRoll: true });
        expect(groupview.group.activePanel).toBe(panel3);

        groupview.group.moveToNext({ suppressRoll: false });
        expect(groupview.group.activePanel).toBe(panel1);

        groupview.group.moveToPrevious({ suppressRoll: false });
        expect(groupview.group.activePanel).toBe(panel3);

        groupview.group.moveToNext();
        groupview.group.moveToNext();
        expect(groupview.group.activePanel).toBe(panel2);
    });

    test('default', () => {
        let viewQuery = groupview.element.querySelectorAll(
            '.groupview > .tabs-and-actions-container'
        );
        expect(viewQuery).toBeTruthy();

        viewQuery = groupview.element.querySelectorAll(
            '.groupview > .content-container'
        );
        expect(viewQuery).toBeTruthy();
    });

    test('dnd', () => {
        const panel1 = new TestPanel('panel1', jest.fn() as any);
        const panel2 = new TestPanel('panel2', jest.fn() as any);

        groupview.group.openPanel(panel1);
        groupview.group.openPanel(panel2);

        const events: GroupDropEvent[] = [];

        groupview.group.onDrop((event) => {
            events.push(event);
        });

        const viewQuery = groupview.element.querySelectorAll(
            '.groupview > .tabs-and-actions-container > .tabs-container > .tab'
        );
        expect(viewQuery.length).toBe(2);

        LocalSelectionTransfer.getInstance().setData([], 'dockview-1');

        fireEvent.dragEnter(viewQuery[0]);

        let dropTarget = viewQuery[0].querySelector('.drop-target-dropzone');
        fireEvent.dragOver(dropTarget);
        fireEvent.drop(dropTarget);

        expect(events.length).toBe(1);
        expect(events[0].target).toBe(Position.Center);
        expect(events[0].index).toBe(0);

        fireEvent.dragEnter(viewQuery[1]);

        dropTarget = viewQuery[1].querySelector('.drop-target-dropzone');
        fireEvent.dragOver(dropTarget);
        fireEvent.drop(dropTarget);

        expect(events.length).toBe(2);
        expect(events[1].target).toBe(Position.Center);
        expect(events[1].index).toBe(1);
    });
});
