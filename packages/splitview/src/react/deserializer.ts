import { ComponentDockview } from '../dockview/componentDockview';
import { GroupviewPanel } from '../groupview/groupviewPanel';
import {
    PanelContentPart,
    PanelHeaderPart,
    IGroupPanel,
} from '../groupview/panel/parts';
import { IPanelDeserializer } from '../dockview/deserializer';
import {
    createContentComponent,
    createTabComponent,
} from '../dockview/componentFactory';
import { DockviewApi } from '../api/component.api';

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

        const contentPart = createContentComponent(
            contentId,
            contentId,
            this.layout.options.components,
            this.layout.options.frameworkComponents,
            this.layout.options.frameworkComponentFactory.content
        ) as PanelContentPart;

        const headerPart = createTabComponent(
            tabId,
            tabId,
            this.layout.options.tabComponents,
            this.layout.options.frameworkComponentFactory,
            this.layout.options.frameworkComponentFactory.tab
        ) as PanelHeaderPart;

        const panel = new GroupviewPanel(panelId, new DockviewApi(this.layout));

        // TODO container api
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
