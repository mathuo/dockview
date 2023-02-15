import { DockviewComponent } from '../dockview/dockviewComponent';
import { GroupviewPanelState, IDockviewPanel } from '../groupview/groupPanel';
import { DockviewPanel } from '../dockview/dockviewPanel';
import { IPanelDeserializer } from '../dockview/deserializer';
import { createComponent } from '../panel/componentFactory';
import { DockviewApi } from '../api/component.api';
import { DefaultTab } from '../dockview/components/tab/defaultTab';
import { DefaultGroupPanelView } from '../dockview/defaultGroupPanelView';
import { GroupPanel } from '../groupview/groupviewPanel';
import { ITabRenderer } from '../groupview/types';

export class ReactPanelDeserialzier implements IPanelDeserializer {
    constructor(private readonly layout: DockviewComponent) {}

    public fromJSON(
        panelData: GroupviewPanelState,
        group: GroupPanel
    ): IDockviewPanel {
        const panelId = panelData.id;
        const params = panelData.params;
        const title = panelData.title;
        const viewData = panelData.view;

        let tab: ITabRenderer;

        if (viewData.tab?.id) {
            tab = createComponent(
                viewData.tab.id,
                viewData.tab.id,
                this.layout.options.tabComponents,
                this.layout.options.frameworkTabComponents,
                this.layout.options.frameworkComponentFactory?.tab,
                () => new DefaultTab()
            );
        } else if (this.layout.options.defaultTabComponent) {
            tab = createComponent(
                this.layout.options.defaultTabComponent,
                this.layout.options.defaultTabComponent,
                this.layout.options.tabComponents,
                this.layout.options.frameworkTabComponents,
                this.layout.options.frameworkComponentFactory?.tab,
                () => new DefaultTab()
            );
        } else {
            tab = new DefaultTab();
        }

        const view = new DefaultGroupPanelView({
            content: createComponent(
                viewData.content.id,
                viewData.content.id,
                this.layout.options.components,
                this.layout.options.frameworkComponents,
                this.layout.options.frameworkComponentFactory?.content
            ),
            tab,
        });

        const panel = new DockviewPanel(
            panelId,
            this.layout,
            new DockviewApi(this.layout),
            group
        );

        panel.init({
            view,
            title,
            params: params || {},
        });

        return panel;
    }
}
