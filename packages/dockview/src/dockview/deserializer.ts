import {
    IGridView,
    ISerializedLeafNode,
    IViewDeserializer,
} from '../gridview/gridview';
import { GroupviewPanelState, IGroupPanel } from '../groupview/groupPanel';
import { GroupPanelViewState } from '../groupview/groupview';
import { GroupviewPanel } from '../groupview/groupviewPanel';
import { DockviewComponent } from './dockviewComponent';

export interface IPanelDeserializer {
    fromJSON(
        panelData: GroupviewPanelState,
        group: GroupviewPanel
    ): IGroupPanel;
}

export interface PanelDeserializerOptions {
    createPanel: (id: string, group: GroupviewPanel) => IGroupPanel;
}

export class DefaultDeserializer implements IViewDeserializer {
    constructor(
        private readonly layout: DockviewComponent,
        private panelDeserializer: PanelDeserializerOptions
    ) {}

    public fromJSON(node: ISerializedLeafNode<GroupPanelViewState>): IGridView {
        const data = node.data;
        const children = data.views;
        const active = data.activeView;

        const group = this.layout.createGroup({
            id: data.id,
            locked: !!data.locked,
            hideHeader: !!data.hideHeader,
        });

        for (const child of children) {
            const panel = this.panelDeserializer.createPanel(child, group);

            const isActive = typeof active === 'string' && active === panel.id;

            group.model.openPanel(panel, {
                skipSetActive: !isActive,
            });
        }

        if (!group.activePanel && group.panels.length > 0) {
            group.model.openPanel(group.panels[group.panels.length - 1]);
        }

        return group;
    }
}
