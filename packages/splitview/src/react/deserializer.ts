import { IGroupPanel } from "../groupview/panel/types";
import { Layout } from "../layout/layout";
import { DefaultPanel } from "../groupview/panel/panel";
import { PanelContentPart, PanelHeaderPart } from "../groupview/panel/parts";
import { IPanelDeserializer } from "../layout/deserializer";
import {
  createContentComponent,
  createTabComponent,
} from "../layout/componentFactory";

export class ReactPanelDeserialzier implements IPanelDeserializer {
  constructor(private readonly layout: Layout) {}

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
      this.layout.options.components,
      this.layout.options.frameworkComponents,
      this.layout.options.frameworkComponentFactory.content
    ) as PanelContentPart;

    const headerPart = createTabComponent(
      tab.id,
      this.layout.options.tabComponents,
      this.layout.options.frameworkComponentFactory,
      this.layout.options.frameworkComponentFactory.tab
    ) as PanelHeaderPart;

    const panel = new DefaultPanel(panelId, headerPart, contentPart);

    panel.init({
      title,
      suppressClosable,
      params: props || {},
      state: state || {},
    });

    return panel;
  }
}
