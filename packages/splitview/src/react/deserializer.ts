import { ComponentDockview } from '../dockview/componentDockview';
import { DefaultPanel } from '../groupview/panel/panel';
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

export class ReactPanelDeserialzier implements IPanelDeserializer {
    constructor(private readonly layout: ComponentDockview) {}

    public fromJSON(panelData: { [index: string]: any }): IGroupPanel {
        const panelId = panelData.id;
        const content = panelData.content;
        const tab = panelData.tab;
        const props = panelData.props;
        const title = panelData.title;
        const state = panelData.state;
        const suppressClosable = panelData.suppressClosable;

        const contentPart = createContentComponent(
            content.id,
            content.id,
            this.layout.options.components,
            this.layout.options.frameworkComponents,
            this.layout.options.frameworkComponentFactory.content
        ) as PanelContentPart;

        const headerPart = createTabComponent(
            tab.id,
            tab.id,
            this.layout.options.tabComponents,
            this.layout.options.frameworkComponentFactory,
            this.layout.options.frameworkComponentFactory.tab
        ) as PanelHeaderPart;

        const panel = new DefaultPanel(panelId);

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
