import { DockviewComponent } from '../dockview/dockviewComponent';
import { GroupviewPanelState, IGroupPanel } from '../groupview/groupPanel';
import { DockviewGroupPanel } from '../dockview/dockviewGroupPanel';
import { IPanelDeserializer } from '../dockview/deserializer';
import { createComponent } from '../panel/componentFactory';
import { DockviewApi } from '../api/component.api';
import { DefaultTab } from '../dockview/components/tab/defaultTab';
import { DefaultGroupPanelView } from '../dockview/defaultGroupPanelView';

export class ReactPanelDeserialzier implements IPanelDeserializer {
    constructor(private readonly layout: DockviewComponent) {}

    public fromJSON(panelData: GroupviewPanelState): IGroupPanel {
        const panelId = panelData.id;
        const params = panelData.params;
        const title = panelData.title;
        const state = panelData.state;
        const suppressClosable = panelData.suppressClosable;
        const viewData = panelData.view;

        const view = new DefaultGroupPanelView({
            content: createComponent(
                viewData.content.id,
                viewData.content.id,
                this.layout.options.components,
                this.layout.options.frameworkComponents,
                this.layout.options.frameworkComponentFactory?.content
            ),
            tab: viewData.tab?.id
                ? createComponent(
                      viewData.tab.id,
                      viewData.tab.id,
                      this.layout.options.tabComponents,
                      this.layout.options.frameworkTabComponents,
                      this.layout.options.frameworkComponentFactory?.tab
                  )
                : new DefaultTab(),
        });

        const panel = new DockviewGroupPanel(
            panelId,
            new DockviewApi(this.layout)
        );

        panel.init({
            view,
            title,
            suppressClosable,
            params: params || {},
            state: state || {},
        });

        return panel;
    }
}
