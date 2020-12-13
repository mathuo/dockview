import { IGroupPanelApi } from '../../api/groupPanelApi';
import { IDockviewComponent } from '../../dockview/dockviewComponent';
import { Emitter } from '../../events';
import {
    GroupDropEvent,
    GroupOptions,
    Groupview,
    IGroupview,
} from '../../groupview/groupview';
import {
    GroupviewPanelState,
    IGroupPanel,
    IGroupPanelInitParameters,
} from '../../groupview/groupviewPanel';
import {
    GroupPanelPartInitParameters,
    PanelContentPart,
    PanelHeaderPart,
    WatermarkPart,
} from '../../groupview/types';
import { PanelUpdateEvent } from '../../panel/types';
import { fireEvent } from '@testing-library/dom';
import { LocalSelectionTransfer } from '../../dnd/dataTransfer';
import { Position } from '../../dnd/droptarget';

class Watermark implements WatermarkPart {
    public readonly element = document.createElement('div');

    init(params: GroupPanelPartInitParameters) {
        //
    }

    updateParentGroup() {
        //
    }

    dispose() {
        //
    }
}

class TestContentPart implements PanelContentPart {
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

    updateParentGroup(group: IGroupview, isPanelVisible: boolean) {
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
class TestHeaderPart implements PanelHeaderPart {
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

    updateParentGroup(group: IGroupview, isPanelVisible: boolean) {
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
    private _header: PanelHeaderPart | undefined;
    private _content: PanelContentPart | undefined;
    private _group: IGroupview | undefined;
    private _params: IGroupPanelInitParameters;
    private _onDidChangeState = new Emitter<void>();
    readonly onDidStateChange = this._onDidChangeState.event;

    get header() {
        return this._header;
    }

    get content() {
        return this._content;
    }

    get group() {
        return this._group;
    }

    constructor(public readonly id: string, public api: IGroupPanelApi) {
        this.init({
            headerPart: new TestHeaderPart(id),
            contentPart: new TestContentPart(id),
            title: `${id}`,
            params: {},
        });
    }

    init(params: IGroupPanelInitParameters) {
        this._header = params.headerPart;
        this._content = params.contentPart;

        this._params = params;
    }

    setDirty(isDirty: boolean) {
        //noop
    }

    updateParentGroup(group: IGroupview, isGroupActive: boolean) {
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
            contentId: this.content?.id,
            tabId: this._header?.id,
            title: this._params?.title,
        };
    }

    dispose() {
        //noop
    }
}

describe('groupview', () => {
    let groupview: Groupview;
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
        groupview = new Groupview(dockview, 'groupview-1', options);
    });

    test('default', () => {
        let viewQuery = groupview.element.querySelectorAll(
            '.groupview > .title-container'
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

        groupview.openPanel(panel1);
        groupview.openPanel(panel2);

        const events: GroupDropEvent[] = [];

        groupview.onDrop((event) => {
            events.push(event);
        });

        const viewQuery = groupview.element.querySelectorAll(
            '.groupview > .title-container > .tab-container > .tab'
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
