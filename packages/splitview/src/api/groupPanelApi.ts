import { IGroupview } from '../groupview/groupview';
import { Emitter, Event } from '../events';
import { GridPanelApi, IGridPanelApi } from './gridPanelApi';
import { IGroupPanel } from '../groupview/groupviewPanel';
import { VisibilityEvent } from './api';

export interface TitleEvent {
    title: string;
}

/*
 * omit visibility modifiers since the visibility of a single group doesn't make sense
 * because it belongs to a groupview
 */
export interface IGroupPanelApi
    extends Omit<IGridPanelApi, 'setVisible' | 'visible'> {
    readonly group: IGroupview;
    readonly isGroupActive: boolean;
    onDidDirtyChange: Event<boolean>;
    close: () => Promise<boolean>;
    tryClose: () => Promise<boolean>;
    interceptOnCloseAction(interceptor: () => Promise<boolean>): void;
    setTitle(title: string): void;
}

export class GroupPanelApi extends GridPanelApi implements IGroupPanelApi {
    private _group: IGroupview;
    private _interceptor: undefined | (() => Promise<boolean>);

    readonly _onDidDirtyChange = new Emitter<boolean>();
    readonly onDidDirtyChange = this._onDidDirtyChange.event;
    // readonly _onDidGroupPanelVisibleChange = new Emitter<VisibilityEvent>({
    //     replay: true,
    // });
    // readonly onDidGroupPanelVisibleChange: Event<VisibilityEvent> = this
    //     ._onDidGroupPanelVisibleChange.event;
    readonly _onDidTitleChange = new Emitter<TitleEvent>();
    readonly onDidTitleChange = this._onDidTitleChange.event;

    // get isGroupVisible() {
    //     return this._isGroupVisible;
    // }

    get tryClose() {
        return this._interceptor;
    }

    get isGroupActive() {
        return this.group.isActive;
    }

    set group(value: IGroupview) {
        this._group = value;
    }

    get group() {
        return this._group;
    }

    constructor(private panel: IGroupPanel, group: IGroupview) {
        super(panel.id);
        this._group = group;

        this.addDisposables(
            // this._onDidGroupPanelVisibleChange,
            this._onDidDirtyChange
            // this.onDidGroupPanelVisibleChange((event) => {
            //     this._isGroupVisible = event.isVisible;
            // })
        );
    }

    public setTitle(title: string) {
        this._onDidTitleChange.fire({ title });
    }

    public close() {
        return this.group.closePanel(this.panel);
    }

    public interceptOnCloseAction(interceptor: () => Promise<boolean>) {
        this._interceptor = interceptor;
    }

    public dispose() {
        super.dispose();
    }
}
