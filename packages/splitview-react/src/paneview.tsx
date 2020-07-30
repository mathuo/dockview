import * as React from "react";
import { Orientation, IBaseView, PaneView } from "splitview";

import { PaneReact } from "./panel/pane";
import { PaneComponent, PaneHeaderComponent } from "./bridge/pane";

export interface IPaneWithReactComponent extends IBaseView {
  id: string;
  headerId: string;
  component: PaneComponent;
  headerComponent: PaneHeaderComponent;
  isExpanded: boolean;
  componentProps: {};
  headerProps: {};
}

export interface IPaneViewReactProps {
  orientation: Orientation;
  onReady?: (event: PaneViewReadyEvent) => void;
  components?: { [index: string]: PaneComponent };
  headerComponents?: { [index: string]: PaneHeaderComponent };
  size: number;
  orthogonalSize: number;
  initialLayout?: PaneViewSerializedConfig;
}

export type PaneViewReadyEvent = {
  api: PaneviewApi;
};

export type PaneViewSerializedConfig = {
  views: Array<
    Omit<IPaneWithReactComponent, "component" | "headerComponent"> & {
      size?: number;
    }
  >;
};

export type PaneviewApi = {
  add: (
    options: Omit<IPaneWithReactComponent, "component" | "headerComponent"> & {
      size?: number;
      index?: number;
    }
  ) => void;
  moveView: (from: number, to: number) => void;
  toJSON: () => {};
};

export interface IPaneViewComponentRef {
  layout: (size: number, orthogonalSize: number) => void;
}

export const PaneViewComponent = React.forwardRef(
  (props: IPaneViewReactProps, _ref: React.Ref<IPaneViewComponentRef>) => {
    const ref = React.useRef<HTMLDivElement>();
    const dimension = React.useRef<{ size: number; orthogonalSize: number }>();
    const paneview = React.useRef<PaneView>();
    const [portals, setPortals] = React.useState<React.ReactPortal[]>([]);

    const createView = React.useCallback((_view: IPaneWithReactComponent) => {
      return new PaneReact(_view, _view.component, {
        headerName: "header",
        headerComponent: _view.headerComponent,
        addPortal: (portal) => {
          setPortals((portals) => [...portals, portal]);
          return {
            dispose: () => {
              setPortals((portals) => portals.filter((_) => _ !== portal));
            },
          };
        },
      });
    }, []);

    const hydrate = React.useCallback(() => {
      if (!props.initialLayout || !paneview.current) {
        return;
      }

      const serializedConfig = props.initialLayout;

      serializedConfig.views.forEach((view) => {
        const component = props.components[view.id];
        const headerComponent = props.headerComponents[view.headerId];
        paneview.current.addPane(
          createView({ ...view, component, headerComponent }),
          view.size
        );
      });
      paneview.current.layout(props.size, props.orthogonalSize);
    }, [props.initialLayout]);

    React.useEffect(() => {
      if (paneview.current && dimension?.current) {
        paneview.current?.layout(
          dimension.current.size,
          dimension.current.orthogonalSize
        );
        dimension.current = undefined;
      }
    }, [paneview.current]);

    // if you put this in a hook it's laggy
    // paneview.current?.layout(props.size, props.orthogonalSize);

    React.useImperativeHandle(
      _ref,
      () => ({
        layout: (size, orthogonalSize) => {
          if (!paneview.current) {
            // handle the case when layout is called and paneview doesn't exist yet
            // we cache the values and use them at the first opportunity
            dimension.current = { size, orthogonalSize };
          }
          paneview.current?.layout(size, orthogonalSize);
        },
      }),
      [paneview]
    );

    React.useEffect(() => {
      paneview.current = new PaneView(ref.current, {
        orientation: props.orientation,
      });

      hydrate();

      if (props.onReady) {
        props.onReady({
          api: {
            add: (
              options: Omit<
                IPaneWithReactComponent,
                "component" | "headerComponent"
              > & {
                props?: {};
                size?: number;
                index?: number;
              }
            ) => {
              const component = props.components[options.id];
              const headerComponent = props.headerComponents[options.headerId];
              paneview.current.addPane(
                createView({ ...options, component, headerComponent }),
                options.size,
                options.index
              );
              paneview.current.layout(props.size, props.orthogonalSize);
            },
            moveView: (from: number, to: number) => {
              paneview.current.moveView(from, to);
            },
            toJSON: () => {
              return {
                // views: (paneview.current.getViews() as PaneReact[]).map((v) =>
                //   Object.entries({
                //     size: v.size,
                //     id: v.id,
                //     snapSize: v.snapSize,
                //     minimumSize: v.minimumSize,
                //     maximumSize: v.maximumSize,
                //     props: v.props,
                //   }).reduce(
                //     (x, y) =>
                //       y[1] !== undefined || x !== null
                //         ? { ...x, [y[0]]: y[1] }
                //         : x,
                //     {}
                //   )
                // ),
              };
            },
          },
        });
      }

      paneview.current.layout(props.size, props.orthogonalSize);

      return () => {
        paneview.current?.dispose();
        paneview.current = undefined;
      };
    }, []);

    React.useEffect(() => {
      paneview.current?.setOrientation(props.orientation);
    }, [props.orientation]);

    return (
      <div ref={ref} className="split-view-react-wrapper">
        {portals}
      </div>
    );
  }
);
