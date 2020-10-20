import { Emitter, Event } from '../events';
import { PaneviewPanel } from '../paneview/paneviewPanel';
import { IPanelApi, PanelApi } from './panelApi';

interface ExpansionEvent {
    isExpanded: boolean;
}

export interface IPanePanelApi extends IPanelApi {
    onDidExpansionChange: Event<ExpansionEvent>;
    setExpanded(isExpanded: boolean): void;
    readonly isExpanded: boolean;
}

export class PanePanelApi extends PanelApi implements IPanePanelApi {
    readonly _onDidExpansionChange = new Emitter<ExpansionEvent>({
        replay: true,
    });
    readonly onDidExpansionChange: Event<ExpansionEvent> = this
        ._onDidExpansionChange.event;

    constructor(public pane: PaneviewPanel) {
        super();
    }

    setExpanded(isExpanded: boolean): void {
        this.pane.setExpanded(isExpanded);
    }

    get isExpanded() {
        return this.pane.isExpanded();
    }
}
