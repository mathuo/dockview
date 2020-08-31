import * as React from "react";
import { IBasePanelApi } from "../panel/api";
import { IDisposable } from "../lifecycle";
import {
  IComponentSplitview,
  ComponentSplitview,
} from "../splitview/componentSplitview";
import { Orientation } from "../splitview/splitview";
import { ReactComponentView } from "./reactComponentView";

export interface SplitviewFacade {
  addFromComponent(options: {
    id: string;
    component: string;
    params?: { [index: string]: any };
  }): void;
  layout(size: number, orthogonalSize: number): void;
  onChange: (cb: (event: { proportions: number[] }) => void) => IDisposable;
  toJSON: () => any;
  deserialize: (data: any) => void;
}

export interface SplitviewReadyEvent {
  api: IComponentSplitview;
}

export interface ISplitviewPanelProps {
  api: IBasePanelApi;
}

export interface ISplitviewComponentProps {
  orientation: Orientation;
  onReady?: (event: SplitviewReadyEvent) => void;
  components: {
    [index: string]: React.FunctionComponent<ISplitviewPanelProps>;
  };
}

export const SplitViewComponent = (props: ISplitviewComponentProps) => {
  const domReference = React.useRef<HTMLDivElement>();
  const splitpanel = React.useRef<IComponentSplitview>();
  const [portals, setPortals] = React.useState<React.ReactPortal[]>([]);

  const addPortal = React.useCallback((p: React.ReactPortal) => {
    setPortals((portals) => [...portals, p]);
    return {
      dispose: () => {
        setPortals((portals) => portals.filter((portal) => portal !== p));
      },
    };
  }, []);

  React.useEffect(() => {
    splitpanel.current = new ComponentSplitview(domReference.current, {
      orientation: props.orientation,
      frameworkComponents: props.components,
      frameworkWrapper: {
        createComponent: (id: string, component: any) => {
          return new ReactComponentView(id, id, component, { addPortal });
        },
      },
    });

    const { width, height } = domReference.current.getBoundingClientRect();
    const [size, orthogonalSize] =
      props.orientation === Orientation.HORIZONTAL
        ? [width, height]
        : [height, width];
    splitpanel.current.layout(size, orthogonalSize);

    if (props.onReady) {
      props.onReady({ api: splitpanel.current });
    }

    return () => {
      splitpanel.current.dispose();
    };
  }, []);

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
