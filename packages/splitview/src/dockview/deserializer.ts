import { IGridView, IViewDeserializer } from '../gridview/gridview';
import { IGroupPanel } from '../groupview/groupviewPanel';
import { DockviewComponent } from './dockviewComponent';

export interface IPanelDeserializer {
    fromJSON(panelData: { [index: string]: any }): IGroupPanel;
}

export class DefaultDeserializer implements IViewDeserializer {
    constructor(
        private readonly layout: DockviewComponent,
        private panelDeserializer: { createPanel: (id: string) => IGroupPanel }
    ) {}

    public fromJSON(data: { [key: string]: any }): IGridView {
        const children = data.views;
        const active = data.activeView;

        const panels: IGroupPanel[] = [];

        for (const child of children) {
            const panel = this.panelDeserializer.createPanel(child);

            panels.push(panel);
        }

        const group = this.layout.createGroup({
            panels,
            activePanel: panels.find((p) => p.id === active),
            id: data.id,
        });

        return group;
    }
}
