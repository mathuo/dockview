import * as React from "react";
import { IDisposable } from "../types";
import { Layout, Api } from "../layout/layout";
import { ReactPanelContentPart } from "./reactContentPart";
import { ReactPanelHeaderPart } from "./reactHeaderPart";
import { IPanelProps } from "./react";
import { DefaultDeserializer, ReactPanelDeserialzier } from "./deserializer";

export type OnReadyEvent = {
  api: Api;
};

export interface ReactLayout {
  addPortal: (portal: React.ReactPortal) => IDisposable;
}

export interface IReactGridProps {
  components?: {
    [componentName: string]: React.FunctionComponent<IPanelProps>;
  };
  tabComponents?: {
    [componentName: string]: React.FunctionComponent<IPanelProps>;
  };
  onReady?: (event: OnReadyEvent) => void;
  autoSizeToFitContainer?: boolean;
  serializedLayout?: {};
  deserializer?: {
    fromJSON: (
      data: any
    ) => {
      component: React.FunctionComponent<IPanelProps>;
      tabComponent?: React.FunctionComponent<IPanelProps>;
      props?: { [key: string]: any };
    };
  };
  tabHeight?: number;
}

export const ReactGrid = (props: IReactGridProps) => {
  const domReference = React.useRef<HTMLDivElement>();
  const layoutReference = React.useRef<Layout>();

  const [portals, setPortals] = React.useState<React.ReactPortal[]>([]);

  React.useEffect(() => {
    const addPortal = (p: React.ReactPortal) => {
      setPortals((portals) => [...portals, p]);
      return {
        dispose: () => {
          setPortals((portals) => portals.filter((portal) => portal !== p));
        },
      };
    };

    const frameworkPanelWrapper = {
      createContentWrapper: (
        id: string,
        component: React.FunctionComponent<IPanelProps>
      ) => {
        return new ReactPanelContentPart(id, component, { addPortal });
      },
      createTabWrapper: (
        id: string,
        component: React.FunctionComponent<IPanelProps>
      ) => {
        return new ReactPanelHeaderPart(id, component, { addPortal });
      },
    };

    const layout = new Layout({
      frameworkPanelWrapper,
      frameworkComponents: props.components,
      frameworkTabComponents: props.tabComponents,
      tabHeight: props.tabHeight,
    });

    layoutReference.current = layout;
    domReference.current.appendChild(layoutReference.current.element);

    layout.deserializer = new ReactPanelDeserialzier(layout);

    if (props.serializedLayout) {
      layout.deserialize(props.serializedLayout);
    }

    layout.resizeToFit();

    if (props.onReady) {
      props.onReady({ api: layout });
    }

    return () => {
      layout.dispose();
    };
  }, []);

  React.useEffect(() => {
    layoutReference.current.setAutoResizeToFit(props.autoSizeToFitContainer);
  }, [props.autoSizeToFitContainer]);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
      }}
      ref={domReference}
    >
      {portals}
    </div>
  );
};
