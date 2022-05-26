import { GroupviewPanelState, IDockviewPanel } from '../groupview/groupPanel';
import { GroupPanel } from '../groupview/groupviewPanel';

export interface IPanelDeserializer {
    fromJSON(panelData: GroupviewPanelState, group: GroupPanel): IDockviewPanel;
}
