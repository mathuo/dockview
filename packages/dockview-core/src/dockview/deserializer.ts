import { GroupviewPanelState, ITabRenderer } from '../groupview/types';
import { GroupPanel } from '../groupview/groupviewPanel';
import { DockviewPanel, IDockviewPanel } from './dockviewPanel';
import { IDockviewComponent } from './dockviewComponent';
import { createComponent } from '../panel/componentFactory';
import { DefaultTab } from './components/tab/defaultTab';
import { DefaultGroupPanelView } from './defaultGroupPanelView';
import { DockviewApi } from '../api/component.api';

export interface IPanelDeserializer {
    fromJSON(panelData: GroupviewPanelState, group: GroupPanel): IDockviewPanel;
}

export class DefaultDockviewDeserialzier implements IPanelDeserializer {
    constructor(private readonly layout: IDockviewComponent) {}

    public fromJSON(
        panelData: GroupviewPanelState,
        group: GroupPanel
    ): IDockviewPanel {
        const panelId = panelData.id;
        const params = panelData.params;
        const title = panelData.title;
        const viewData = panelData.view!;

        let tab: ITabRenderer;

        const contentComponent = viewData
            ? viewData.content.id
            : panelData.contentComponent || 'unknown';
        const tabComponent = viewData
            ? viewData.tab?.id
            : panelData.tabComponent;

        if (tabComponent) {
            tab = createComponent(
                panelId,
                tabComponent,
                this.layout.options.tabComponents,
                this.layout.options.frameworkTabComponents,
                this.layout.options.frameworkComponentFactory?.tab,
                () => new DefaultTab()
            );
        } else if (this.layout.options.defaultTabComponent) {
            tab = createComponent(
                panelId,
                this.layout.options.defaultTabComponent,
                this.layout.options.tabComponents,
                this.layout.options.frameworkTabComponents,
                this.layout.options.frameworkComponentFactory?.tab,
                () => new DefaultTab()
            );
        } else {
            tab = new DefaultTab();
        }

        const view = new DefaultGroupPanelView(
            this.layout,
            panelId,
            contentComponent,
            tabComponent
        );

        const panel = new DockviewPanel(
            panelId,
            this.layout,
            new DockviewApi(this.layout),
            group
        );

        panel.init({
            view,
            title: title || panelId,
            params: params || {},
        });

        return panel;
    }
}
