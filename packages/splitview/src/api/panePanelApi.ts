import { Emitter, Event } from '../events';
import { Pane } from '../paneview/paneview';
import { IPanelApi, PanelApi } from './panelApi';

interface ExpansionEvent {
    isExpanded: boolean;
}

export interface IPanePanelApi extends IPanelApi {
    onDidExpansionChange: Event<ExpansionEvent>;
    setExpanded(isExpanded: boolean): void;
}

export class PanePanelApi extends PanelApi implements IPanePanelApi {
    readonly _onDidExpansionChange = new Emitter<ExpansionEvent>({
        emitLastValue: true,
    });
    readonly onDidExpansionChange: Event<ExpansionEvent> = this
        ._onDidExpansionChange.event;

    constructor(private pane: Pane) {
        super();
    }

    setExpanded(isExpanded: boolean): void {
        this.pane.setExpanded(isExpanded);
    }
}
