import * as React from "react";
import {
  IPanelProps,
  Orientation,
  SplitviewFacade,
  SplitviewReadyEvent,
} from "splitview";
import { SplitViewComponent } from "splitview";

const components = {
  default1: (props) => {
    return <div style={{ height: "100%", width: "100%" }}>hiya</div>;
  },
};

export const SplitPanel = (props: IPanelProps) => {
  const api = React.useRef<SplitviewFacade>();

  React.useEffect(() => {
    props.api.onDidPanelDimensionChange((event) => {
      // const [height,width] = [event.height, event.width]
      // const [size, orthogonalSize] =
      //   props.orientation === Orientation.HORIZONTAL
      //     ? [width, height]
      //     : [height, width];
      api.current?.layout(event.width, event.height);
    });
  }, []);

  const onReady = (event: SplitviewReadyEvent) => {
    event.api.addFromComponent({ id: "1", component: "default1" });
    event.api.addFromComponent({ id: "2", component: "default1" });
    api.current = event.api;
  };

  return (
    <SplitViewComponent
      components={components}
      onReady={onReady}
      orientation={Orientation.VERTICAL}
    />
  );
};
