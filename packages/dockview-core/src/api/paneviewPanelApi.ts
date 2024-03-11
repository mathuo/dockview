import { Emitter, Event } from '../events';
import { PaneviewPanel } from '../paneview/paneviewPanel';
import { SplitviewPanelApi, SplitviewPanelApiImpl } from './splitviewPanelApi';

export interface ExpansionEvent {
    readonly isExpanded: boolean;
}

export interface PaneviewPanelApi extends SplitviewPanelApi {
    readonly isExpanded: boolean;
    readonly onDidExpansionChange: Event<ExpansionEvent>;
    readonly onMouseEnter: Event<MouseEvent>;
    readonly onMouseLeave: Event<MouseEvent>;
    setExpanded(isExpanded: boolean): void;
}

export class PaneviewPanelApiImpl
    extends SplitviewPanelApiImpl
    implements PaneviewPanelApi
{
    readonly _onDidExpansionChange = new Emitter<ExpansionEvent>({
        replay: true,
    });
    readonly onDidExpansionChange: Event<ExpansionEvent> =
        this._onDidExpansionChange.event;

    readonly _onMouseEnter = new Emitter<MouseEvent>({});
    readonly onMouseEnter: Event<MouseEvent> = this._onMouseEnter.event;
    readonly _onMouseLeave = new Emitter<MouseEvent>({});
    readonly onMouseLeave: Event<MouseEvent> = this._onMouseLeave.event;

    private _pane: PaneviewPanel | undefined;

    set pane(pane: PaneviewPanel) {
        this._pane = pane;
    }

    constructor(id: string, component: string) {
        super(id, component);

        this.addDisposables(
            this._onDidExpansionChange,
            this._onMouseEnter,
            this._onMouseLeave
        );
    }

    setExpanded(isExpanded: boolean): void {
        this._pane?.setExpanded(isExpanded);
    }

    get isExpanded(): boolean {
        return !!this._pane?.isExpanded();
    }
}
