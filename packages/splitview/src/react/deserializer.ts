import { ComponentDockview } from '../dockview/componentDockview';
import { GroupviewPanel, IGroupPanel } from '../groupview/groupviewPanel';
import { PanelContentPart, PanelHeaderPart } from '../groupview/types';
import { IPanelDeserializer } from '../dockview/deserializer';
import { createComponent } from '../panel/componentFactory';
import { DockviewApi } from '../api/component.api';
import { DefaultTab } from '../dockview/components/tab/defaultTab';

export class ReactPanelDeserialzier implements IPanelDeserializer {
    constructor(private readonly layout: ComponentDockview) {}

    public fromJSON(panelData: { [index: string]: any }): IGroupPanel {
        const panelId = panelData.id;
        const contentId = panelData.contentId;
        const tabId = panelData.tabId;
        const props = panelData.props;
        const title = panelData.title;
        const state = panelData.state;
        const suppressClosable = panelData.suppressClosable;

        const contentPart = createComponent(
            contentId,
            contentId,
            this.layout.options.components,
            this.layout.options.frameworkComponents,
            this.layout.options.frameworkComponentFactory.content
        ) as PanelContentPart;

        const headerPart = createComponent(
            tabId,
            tabId,
            this.layout.options.tabComponents,
            this.layout.options.frameworkComponentFactory,
            this.layout.options.frameworkComponentFactory.tab,
            () => new DefaultTab()
        ) as PanelHeaderPart;

        const panel = new GroupviewPanel(panelId, new DockviewApi(this.layout));

        panel.init({
            headerPart,
            contentPart,
            title,
            suppressClosable,
            params: props || {},
            state: state || {},
        });

        return panel;
    }
}
