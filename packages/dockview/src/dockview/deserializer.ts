import {
    IGridView,
    ISerializedLeafNode,
    IViewDeserializer,
} from '../gridview/gridview';
import { GroupviewPanelState, IGroupPanel } from '../groupview/groupPanel';
import { GroupPanelViewState } from '../groupview/groupview';
import { DockviewComponent } from './dockviewComponent';

export interface IPanelDeserializer {
    fromJSON(panelData: GroupviewPanelState): IGroupPanel;
}

export class DefaultDeserializer implements IViewDeserializer {
    constructor(
        private readonly layout: DockviewComponent,
        private panelDeserializer: {
            createPanel: (id: string) => IGroupPanel;
        }
    ) {}

    public fromJSON(node: ISerializedLeafNode<GroupPanelViewState>): IGridView {
        const data = node.data;
        const children = data.views;
        const active = data.activeView;

        const panels: IGroupPanel[] = [];

        for (const child of children) {
            const panel = this.panelDeserializer.createPanel(child);

            panels.push(panel);
        }

        return this.layout.createGroup({
            panels,
            activePanel: panels.find((p) => p.id === active),
            id: data.id,
            locked: !!data.locked,
            headerHidden: !!data.headerHidden,
        });
    }
}

/**
 * isGroup
 *
 *
 * panel.group.locked = true
 * panel.group.header.hiddden = true
 *
 */
