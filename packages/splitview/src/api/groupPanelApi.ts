import { IGroupview } from '../groupview/groupview';
import { Emitter, Event } from '../events';
import { ClosePanelResult, IGroupPanel } from '../groupview/panel/parts';
import { GridPanelApi, IGridPanelApi } from './gridPanelApi';

interface VisibilityEvent {
    isVisible: boolean;
}

interface TitleEvent {
    title: string;
}

export interface IGroupPanelApi extends IGridPanelApi {
    // events
    onDidDirtyChange: Event<boolean>;
    onDidChangeVisibility: Event<VisibilityEvent>;
    // misc
    readonly isVisible: boolean;
    readonly group: IGroupview;
    close: () => Promise<boolean>;
    canClose: () => Promise<ClosePanelResult>;
    setClosePanelHook(callback: () => Promise<ClosePanelResult>): void;
    setTitle(title: string): void;
}

export class GroupPanelApi extends GridPanelApi implements IGroupPanelApi {
    private _isVisible: boolean;
    private _group: IGroupview;
    private _closePanelCallback: () => Promise<ClosePanelResult>;

    readonly _onDidDirtyChange = new Emitter<boolean>();
    readonly onDidDirtyChange = this._onDidDirtyChange.event;
    readonly _onDidChangeVisibility = new Emitter<VisibilityEvent>({
        emitLastValue: true,
    });
    readonly onDidChangeVisibility: Event<VisibilityEvent> = this
        ._onDidChangeVisibility.event;
    readonly _onDidTitleChange = new Emitter<TitleEvent>();
    readonly onDidTitleChange = this._onDidTitleChange.event;

    get isVisible() {
        return this._isVisible;
    }

    get canClose() {
        return this._closePanelCallback;
    }

    set group(value: IGroupview) {
        this._group = value;
    }

    get group() {
        return this._group;
    }

    constructor(private panel: IGroupPanel, group: IGroupview) {
        super();
        this._group = group;

        this.addDisposables(
            this._onDidChangeVisibility,
            this._onDidDirtyChange,
            this.onDidChangeVisibility((event) => {
                this._isVisible = event.isVisible;
            })
        );
    }

    public setTitle(title: string) {
        this._onDidTitleChange.fire({ title });
    }

    public close() {
        return this.group.closePanel(this.panel);
    }

    public setClosePanelHook(callback: () => Promise<ClosePanelResult>) {
        this._closePanelCallback = callback;
    }

    public dispose() {
        super.dispose();
    }
}
