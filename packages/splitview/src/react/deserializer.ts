import { IPanel } from "../groupview/panel/types";
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

  public fromJSON(panelData: { [index: string]: any }): IPanel {
    const panelId = panelData.id;
    const content = panelData.content;
    const tab = panelData.tab;
    const props = panelData.props;
    const title = panelData.title;
    const state = panelData.state;

    const contentPart = createContentComponent(
      content.id,
      this.layout.options.components,
      this.layout.options.frameworkComponents,
      this.layout.options.frameworkPanelWrapper.createContentWrapper
    ) as PanelContentPart;

    const headerPart =
      // tab.id === "__DEFAULT_TAB__"
      //   ? new DefaultTab()
      //   : (
      createTabComponent(
        tab.id,
        this.layout.options.tabComponents,
        this.layout.options.frameworkPanelWrapper,
        this.layout.options.frameworkPanelWrapper.createTabWrapper
      ) as PanelHeaderPart;
    // );

    const panel = new DefaultPanel(panelId, headerPart, contentPart);

    panel.init({
      title,
      params: props || {},
      state: state || {},
    });

    return panel;
  }
}

// export const createComponent = <Part>(
//   componentName: string | Part | any,
//   components: {
//     [componentName: string]: Part;
//   },
//   frameworkComponents: {
//     [componentName: string]: any;
//   },
//   frameworkPanelWrapper: FrameworkPanelWrapper
// ) => {
//   const Component =
//     typeof componentName === "string"
//       ? components[componentName]
//       : componentName;
//   const FrameworkComponent =
//     typeof componentName === "string"
//       ? frameworkComponents[componentName]
//       : componentName;
//   if (Component && FrameworkComponent) {
//     throw new Error(
//       `cannot register component ${componentName} as both a component and frameworkComponent`
//     );
//   }
//   if (FrameworkComponent) {
//     if (!frameworkPanelWrapper) {
//       throw new Error(
//         "you must register a frameworkPanelWrapper to use framework components"
//       );
//     }
//     const wrappedComponent = frameworkPanelWrapper.createContentWrapper(
//       componentName,
//       FrameworkComponent
//     );
//     return wrappedComponent;
//   }
//   return new Component();
// };
