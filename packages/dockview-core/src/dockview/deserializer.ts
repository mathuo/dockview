import { GroupviewPanelState } from './types';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { DockviewPanel, IDockviewPanel } from './dockviewPanel';
import { DockviewComponent } from './dockviewComponent';
import { DockviewPanelModel } from './dockviewPanelModel';
import { DockviewApi } from '../api/component.api';

export interface IPanelDeserializer {
    fromJSON(
        panelData: GroupviewPanelState,
        group: DockviewGroupPanel
    ): IDockviewPanel;
}

// @depreciated
interface LegacyState extends GroupviewPanelState {
    view?: {
        tab?: { id: string };
        content: { id: string };
    };
}

export class DefaultDockviewDeserialzier implements IPanelDeserializer {
    constructor(private readonly accessor: DockviewComponent) {}

    public fromJSON(
        panelData: GroupviewPanelState,
        group: DockviewGroupPanel
    ): IDockviewPanel {
        const panelId = panelData.id;
        const params = panelData.params;
        const title = panelData.title;

        const viewData = (panelData as LegacyState).view!;

        const contentComponent = viewData
            ? viewData.content.id
            : panelData.contentComponent ?? 'unknown';
        const tabComponent = viewData
            ? viewData.tab?.id
            : panelData.tabComponent;

        const view = new DockviewPanelModel(
            this.accessor,
            panelId,
            contentComponent,
            tabComponent
        );

        const panel = new DockviewPanel(
            panelId,
            contentComponent,
            tabComponent,
            this.accessor,
            new DockviewApi(this.accessor),
            group,
            view,
            {
                renderer: panelData.renderer,
                minimumWidth: panelData.minimumWidth,
                minimumHeight: panelData.minimumHeight,
                maximumWidth: panelData.maximumWidth,
                maximumHeight: panelData.maximumHeight,
            }
        );

        panel.init({
            title: title ?? panelId,
            params: params ?? {},
        });

        return panel;
    }
}
