import * as React from "react";
import {
  Orientation,
  GridviewComponent,
  LayoutPriority,
  GridviewReadyEvent,
  ComponentGridview,
  IGridviewPanelProps,
} from "splitview";
import { TestGrid } from "./reactgrid";

const rootcomponents: {
  [index: string]: React.FunctionComponent<IGridviewPanelProps>;
} = {
  sidebar: (props: IGridviewPanelProps) => {
    return <div>sidebar</div>;
  },
  editor: TestGrid,
  panel: () => {
    return <div>panel</div>;
  },
};

export const Application = () => {
  const api = React.useRef<ComponentGridview>();

  const onReady = (event: GridviewReadyEvent) => {
    // event.api.deserialize(rootLayout);
    event.api.addComponent({
      id: "1",
      component: "sidebar",
      snap: true,
    });
    event.api.addComponent({
      id: "2",
      component: "editor",
      snap: true,
      position: { reference: "1", direction: "right" },
      priority: LayoutPriority.High,
    });

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
      snap: true,
    });

    return () => {
      window.removeEventListener("resize", callback);
    };
  }, []);

  return (
    <GridviewComponent
      components={rootcomponents}
      onReady={onReady}
      orientation={Orientation.HORIZONTAL}
    />
  );
};
