import { IGroupview } from '../groupview';
import { Emitter, Event } from '../../events';
import { ClosePanelResult } from './parts';
import { IGroupPanel } from './types';
import { IBaseViewApi, BaseViewApi } from '../../panel/api';

interface ChangeVisibilityEvent {
    isVisible: boolean;
}

export interface IGroupPanelApi extends IBaseViewApi {
    // events
    onDidDirtyChange: Event<boolean>;
    onDidChangeVisibility: Event<ChangeVisibilityEvent>;
    // misc
    readonly isVisible: boolean;
    group: IGroupview;
    close: () => Promise<boolean>;
    canClose: () => Promise<ClosePanelResult>;
    setClosePanelHook(callback: () => Promise<ClosePanelResult>): void;
}

export class GroupPanelApi extends BaseViewApi implements IGroupPanelApi {
    private _isVisible: boolean;
    private _group: IGroupview;
    private _closePanelCallback: () => Promise<ClosePanelResult>;

    readonly _onDidDirtyChange = new Emitter<boolean>();
    readonly onDidDirtyChange = this._onDidDirtyChange.event;
    readonly _onDidChangeVisibility = new Emitter<ChangeVisibilityEvent>({
        emitLastValue: true,
    });
    readonly onDidChangeVisibility: Event<ChangeVisibilityEvent> = this
        ._onDidChangeVisibility.event;

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
