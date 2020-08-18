import { IPanel } from "../groupview/panel/types";
import { FrameworkPanelWrapper, Layout } from "../layout/layout";
import { IViewDeserializer, IGridView } from "../gridview/gridview";
import { DefaultPanel } from "../groupview/panel/panel";
import { DefaultTab } from "../groupview/panel/tab";
import {
  PanelContentPart,
  PanelHeaderPart,
  PanelContentPartConstructor,
  PanelHeaderPartConstructor,
} from "../groupview/panel/parts";

export interface IPanelDeserializer {
  fromJSON(data: { [key: string]: any }): IPanel;
}

export class ReactPanelDeserialzier implements IPanelDeserializer {
  constructor(private readonly layout: Layout) {}

  public fromJSON(panelData: { [key: string]: any }): IPanel {
    const panelId = panelData.id;
    const content = panelData.content;
    const tab = panelData.tab;
    const props = panelData.props;
    const title = panelData.title;
    const state = panelData.state;

    const contentPart = createComponent(
      content.id,
      this.layout.options.components,
      this.layout.options.frameworkComponents,
      this.layout.options.frameworkPanelWrapper
    ) as PanelContentPart;

    const headerPart =
      tab.id === "__DEFAULT_TAB__"
        ? new DefaultTab()
        : (createComponent(
            tab.id,
            this.layout.options.tabComponents,
            this.layout.options.frameworkTabComponents,
            this.layout.options.frameworkPanelWrapper
          ) as PanelHeaderPart);

    const panel = new DefaultPanel(panelId, headerPart, contentPart);

    panel.init({
      title,
      params: props || {},
      state: state || {},
    });

    return panel;
  }
}

export class DefaultDeserializer implements IViewDeserializer {
  constructor(
    private readonly layout: Layout,
    private panelDeserializer: IPanelDeserializer
  ) {}

  public fromJSON(data: { [key: string]: any }): IGridView {
    const children = data.views;
    const active = data.activeView;

    const panels: IPanel[] = [];

    for (const child of children) {
      const panel = this.panelDeserializer.fromJSON(child);

      panels.push(panel);
    }

    const group = this.layout.createGroup({
      panels,
      activePanel: panels.find((p) => p.id === active),
    });

    return group;
  }
}

type Part = PanelContentPartConstructor | PanelHeaderPartConstructor;

export const createComponent = <Part>(
  componentName: string | Part | any,
  components: {
    [componentName: string]: Part;
  },
  frameworkComponents: {
    [componentName: string]: any;
  },
  frameworkPanelWrapper: FrameworkPanelWrapper
) => {
  const Component =
    typeof componentName === "string"
      ? components[componentName]
      : componentName;
  const FrameworkComponent =
    typeof componentName === "string"
      ? frameworkComponents[componentName]
      : componentName;
  if (Component && FrameworkComponent) {
    throw new Error(
      `cannot register component ${componentName} as both a component and frameworkComponent`
    );
  }
  if (FrameworkComponent) {
    if (!frameworkPanelWrapper) {
      throw new Error(
        "you must register a frameworkPanelWrapper to use framework components"
      );
    }
    const wrappedComponent = frameworkPanelWrapper.createContentWrapper(
      componentName,
      FrameworkComponent
    );
    return wrappedComponent;
  }
  return new Component();
};
