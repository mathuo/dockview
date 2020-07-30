import * as React from "react";
import {
  SplitViewComponent,
  ViewComponent,
  SplitviewApi,
  OnReadyEvent,
} from "splitview-react";
import { Orientation } from "splitview";

const components: { [index: string]: ViewComponent } = {
  default: (props, ref) => {
    return (
      <div style={{ backgroundColor: "lightblue", height: "100%" }}>
        <div>{`hello from ${props.userprops.text}`}</div>
        <pre>{JSON.stringify(props, null, 4)}</pre>
      </div>
    );
  },
};

export const FromApi = () => {
  const [api, setApi] = React.useState<SplitviewApi>();
  const onReady = (event: OnReadyEvent) => {
    const { api } = event;
    setApi(api);
    api.add({
      id: "default",
      props: { text: "test" },
      minimumSize: 100,
      maximumSize: 1000,
    });
    api.add({
      id: "default",
      props: { text: "test2" },
      minimumSize: 100,
      maximumSize: 1000,
    });
    api.add({
      id: "default",
      props: { text: "test3" },
      minimumSize: 100,
      maximumSize: 1000,
    });
  };

  const onSave = () => {
    console.log(JSON.stringify(api?.toJSON(), null, 4));
  };

  return (
    <>
      <button onClick={onSave}>Save</button>
      <SplitViewComponent
        orientation={Orientation.HORIZONTAL}
        size={500}
        orthogonalSize={300}
        onReady={onReady}
        components={components}
      />
    </>
  );
};
