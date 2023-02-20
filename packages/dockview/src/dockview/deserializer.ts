import { GroupviewPanelState } from '../groupview/types';
import { GroupPanel } from '../groupview/groupviewPanel';
import { IDockviewPanel } from './dockviewPanel';

export interface IPanelDeserializer {
    fromJSON(panelData: GroupviewPanelState, group: GroupPanel): IDockviewPanel;
}
