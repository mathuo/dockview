import { Emitter, Event } from '../events';
import { IPanelApi, PanelApi } from './panelApi';

interface ExpansionEvent {
    isExpanded: boolean;
}

export interface IPanePanelApi extends IPanelApi {
    onDidExpansionChange: Event<ExpansionEvent>;
}

export class PanePanelApi extends PanelApi implements IPanePanelApi {
    readonly _onDidExpansionChange = new Emitter<ExpansionEvent>({
        emitLastValue: true,
    });
    readonly onDidExpansionChange: Event<ExpansionEvent> = this
        ._onDidExpansionChange.event;

    constructor() {
        super();
    }
}
