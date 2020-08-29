import * as React from "react";
import { Orientation, SplitView } from "../splitview/splitview";
import { ReactView } from "./reactView";

export interface SplitviewFacade {
  addFromComponent(options: { id: string; component: string }): void;
  layout(size: number, orthogonalSize: number): void;
}

export interface SplitviewReadyEvent {
  api: SplitviewFacade;
}

export interface ISplitviewComponentProps {
  orientation: Orientation;
  onReady?: (event: SplitviewReadyEvent) => void;
  components: { [index: string]: React.FunctionComponent<{}> };
}

export const SplitViewComponent = (props: ISplitviewComponentProps) => {
  const domReference = React.useRef<HTMLDivElement>();
  const splitview = React.useRef<SplitView>();
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
    splitview.current = new SplitView(domReference.current, {
      orientation: props.orientation,
    });

    const createViewWrapper = (
      id: string,
      component: React.FunctionComponent<{}>
    ) => {
      return new ReactView(id, component, { addPortal });
    };

    const facade: SplitviewFacade = {
      addFromComponent: (options) => {
        const component = props.components[options.component];
        const view = createViewWrapper(options.id, component);

        splitview.current.addView(view, { type: "distribute" });
        view.init({ params: {} });
        return {
          dispose: () => {
            //
          },
        };
      },
      layout: (width, height) => {
        const [size, orthogonalSize] =
          props.orientation === Orientation.HORIZONTAL
            ? [width, height]
            : [height, width];
        splitview.current.layout(size, orthogonalSize);
      },
    };

    const { width, height } = domReference.current.getBoundingClientRect();
    const [size, orthogonalSize] =
      props.orientation === Orientation.HORIZONTAL
        ? [width, height]
        : [height, width];
    splitview.current.layout(size, orthogonalSize);

    if (props.onReady) {
      props.onReady({ api: facade });
    }

    return () => {
      splitview.current.dispose();
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
