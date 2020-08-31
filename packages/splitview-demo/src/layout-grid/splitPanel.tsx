import * as React from "react";
import {
  CompositeDisposable,
  IPanelProps,
  ISplitviewPanelProps,
  Orientation,
  SplitviewFacade,
  SplitviewReadyEvent,
} from "splitview";
import { SplitViewComponent } from "splitview";

const components = {
  default1: (props: ISplitviewPanelProps) => {
    React.useEffect(() => {
      const disposable = new CompositeDisposable();
      disposable.addDisposables(
        props.api.onDidPanelDimensionChange((event) => {
          //
        })
      );

      return () => {
        disposable.dispose();
      };
    }, []);

    return <div style={{ height: "100%", width: "100%" }}>hiya</div>;
  },
};

export const SplitPanel = (props: IPanelProps) => {
  const api = React.useRef<SplitviewFacade>();

  React.useEffect(() => {
    props.api.onDidPanelDimensionChange((event) => {
      api.current?.layout(event.width, event.height - 20);
    });

    api.current.onChange((event) => {
      props.api.setState("sview_layout", api.current.toJSON());
    });
  }, []);

  const onReady = (event: SplitviewReadyEvent) => {
    const existingLayout = props.api.getStateKey("sview_layout");

    if (existingLayout) {
      event.api.deserialize(existingLayout);
    } else {
      event.api.addFromComponent({ id: "1", component: "default1" });
      event.api.addFromComponent({ id: "2", component: "default1" });
    }
    api.current = event.api;
  };

  const onSave = () => {
    props.api.setState("sview_layout", api.current.toJSON());
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        color: "white",
      }}
    >
      <div style={{ height: "20px", flexShrink: 0 }}>
        <button onClick={onSave}>save</button>
      </div>
      <SplitViewComponent
        components={components}
        onReady={onReady}
        orientation={Orientation.VERTICAL}
      />
    </div>
  );
};
