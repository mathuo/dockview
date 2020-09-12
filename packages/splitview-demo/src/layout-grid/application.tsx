import * as React from "react";
import {
  Orientation,
  SplitViewComponent,
  SplitviewReadyEvent,
  SplitviewFacade,
  ISplitviewPanelProps,
  CompositeDisposable,
  GridviewComponent,
  LayoutPriority,
  GridviewReadyEvent,
  IComponentGridviewLayout,
  ComponentGridview,
} from "splitview";
import { TestGrid } from "./reactgrid";

const components = {
  editor: TestGrid,
  panel: () => {
    return <div>panel</div>;
  },
};

const layout = {
  views: [
    {
      size: 6,
      data: {
        id: "editor",
        component: "editor",
        state: {},
      },
    },
    {
      size: 1,
      data: {
        id: "panel",
        component: "panel",
        state: {},
      },
      priority: "low",
      snapSize: 100,
      minimumSize: 100,
    },
  ],
  size: 0,
  orientation: "VERTICAL",
};

const PrimaryContent = (props: ISplitviewPanelProps) => {
  const api = React.useRef<SplitviewFacade>();

  const onReady = (event: SplitviewReadyEvent) => {
    event.api.deserialize(layout);
    // event.api.addFromComponent({ id: "1", component: "editor" });
    // event.api.addFromComponent({
    //   id: "2",
    //   component: "panel",
    //   priority: LayoutPriority.Low,
    // });

    api.current = event.api;
  };

  React.useEffect(() => {
    const disposable = new CompositeDisposable(
      props.api.onDidDimensionsChange((event) => {
        api.current.layout(event.width, event.height);
      })
    );

    props.api.setMinimumSize(api.current.minimumSize);

    return () => {
      disposable.dispose();
    };
  });

  return (
    <SplitViewComponent
      components={components}
      onReady={onReady}
      orientation={Orientation.VERTICAL}
    />
  );
};

const rootcomponents = {
  sidebar: (props: ISplitviewPanelProps) => {
    return <div>sidebar</div>;
  },
  editor: TestGrid,
  panel: () => {
    return <div>panel</div>;
  },
  main: PrimaryContent,
};

const rootLayout = {
  views: [
    {
      size: 1,
      data: {
        id: "sidebar",
        component: "sidebar",
        state: {},
      },
      snapSize: 100,
      minimumSize: 100,
      priority: "low",
    },
    {
      size: 6,
      data: {
        id: "main",
        component: "main",
        state: {},
      },
    },
  ],
  size: 0,
  orientation: "HORIZONTAL",
};

export const Application = () => {
  const api = React.useRef<ComponentGridview>();

  const onReady = (event: GridviewReadyEvent) => {
    // event.api.deserialize(rootLayout);
    event.api.addComponent({
      id: "1",
      component: "sidebar",
    });
    event.api.addComponent({
      id: "2",
      component: "editor",
      position: { reference: "1", direction: "right" },
      priority: LayoutPriority.High,
    });

    // event.api.addComponent({ id: "2", component: "main" });
    api.current = event.api as ComponentGridview;
  };

  React.useEffect(() => {
    const callback = (ev: UIEvent) => {
      const height = window.innerHeight - 20;
      const width = window.innerWidth;

      api.current?.layout(width, height);
    };
    window.addEventListener("resize", callback);
    callback(undefined);

    api.current.addComponent({
      id: "3",
      component: "panel",
      position: { reference: "2", direction: "below" },
      size: 200,
    });

    return () => {
      window.removeEventListener("resize", callback);
    };
  }, []);

  return (
    <GridviewComponent
      components={rootcomponents as any}
      onReady={onReady}
      orientation={Orientation.HORIZONTAL}
    />
  );

  // return (
  //   <SplitViewComponent
  //     components={rootcomponents}
  //     onReady={onReady}
  //     orientation={Orientation.HORIZONTAL}
  //   />
  // );
};
