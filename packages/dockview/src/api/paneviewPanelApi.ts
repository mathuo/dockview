import { Emitter, Event } from '../events';
import { PaneviewPanel } from '../paneview/paneviewPanel';
import { SplitviewPanelApi, SplitviewPanelApiImpl } from './splitviewPanelApi';

export interface ExpansionEvent {
    isExpanded: boolean;
}

export interface IPaneviewPanelApi extends SplitviewPanelApi {
    onDidExpansionChange: Event<ExpansionEvent>;
    readonly onMouseEnter: Event<MouseEvent>;
    readonly onMouseLeave: Event<MouseEvent>;
    setExpanded(isExpanded: boolean): void;
    readonly isExpanded: boolean;
}

export class PaneviewPanelApi
    extends SplitviewPanelApiImpl
    implements IPaneviewPanelApi {
    readonly _onDidExpansionChange = new Emitter<ExpansionEvent>({
        replay: true,
    });
    readonly onDidExpansionChange: Event<ExpansionEvent> = this
        ._onDidExpansionChange.event;

    readonly _onMouseEnter = new Emitter<MouseEvent>({});
    readonly onMouseEnter: Event<MouseEvent> = this._onMouseEnter.event;
    readonly _onMouseLeave = new Emitter<MouseEvent>({});
    readonly onMouseLeave: Event<MouseEvent> = this._onMouseLeave.event;

    private _pane: PaneviewPanel | undefined;

    set pane(pane: PaneviewPanel) {
        this._pane = pane;
    }

    constructor(id: string) {
        super(id);
    }

    setExpanded(isExpanded: boolean): void {
        this._pane?.setExpanded(isExpanded);
    }

    get isExpanded(): boolean {
        return !!this._pane?.isExpanded();
    }
}
