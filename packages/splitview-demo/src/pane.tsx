import * as React from "react";
import { PaneViewComponent, PaneComponent } from "splitview-react";
import { PaneHeaderComponent, PaneViewReadyEvent } from "splitview-react";
import { Orientation } from "splitview";

const components: { [index: string]: PaneComponent } = {
  default: (props, ref) => {
    return (
      <div style={{ backgroundColor: "lightblue", height: "100%" }}>
        <div>{`hello from ${props.userprops.text}`}</div>
        <pre>{JSON.stringify(props, null, 4)}</pre>
      </div>
    );
  },
};

const headerComponents: { [index: string]: PaneHeaderComponent } = {
  default: (props, ref) => {
    const onClick = React.useCallback(
      () => props.setExpanded(!props.isExpanded),
      [props.setExpanded, props.isExpanded]
    );

    const url = React.useMemo(
      () =>
        props.isExpanded
          ? "https://fonts.gstatic.com/s/i/materialicons/expand_more/v5/24px.svg"
          : "https://fonts.gstatic.com/s/i/materialicons/chevron_right/v5/24px.svg",
      [props.isExpanded]
    );

    const onKeyDown = (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowRight":
          if (!props.isExpanded) {
            props.setExpanded(true);
          }
          break;
        case "ArrowLeft":
          if (props.isExpanded) {
            props.setExpanded(false);
          }
          break;
        case "Enter":
          props.setExpanded(!props.isExpanded);
          break;
      }
    };

    return (
      <div
        tabIndex={0}
        onClick={onClick}
        onKeyDown={onKeyDown}
        style={{
          display: "flex",
          cursor: "pointer",
          fontSize: "13px",
          backgroundColor: "orange",
        }}
      >
        <div style={{ width: "22px", height: "22px" }}>
          <a
            style={{
              display: "block",
              height: "22px",
              width: "22px",
              backgroundColor: "white",
              WebkitMask: `url(${url}) 50% 50% / 80% 80% no-repeat`,
            }}
          />
        </div>
        <span>{props.userprops.title}</span>
      </div>
    );
  },
};

export const PaneDemo = () => {
  const onReady = (event: PaneViewReadyEvent) => {
    event.api.add({
      id: "default",
      headerId: "default",
      minimumSize: 200,
      maximumSize: 400,
      isExpanded: true,
      componentProps: { text: "sometext 1" },
      headerProps: { title: "title 1" },
    });
    event.api.add({
      id: "default",
      headerId: "default",
      minimumSize: 200,
      maximumSize: 400,
      isExpanded: true,
      componentProps: { text: "sometext 2" },
      headerProps: { title: "title 2" },
    });
    event.api.add({
      id: "default",
      headerId: "default",
      minimumSize: 200,
      maximumSize: 500,
      isExpanded: true,
      componentProps: { text: "sometext 3" },
      headerProps: { title: "title 3" },
    });
  };

  return (
    <div style={{ backgroundColor: "black", height: "500px" }}>
      <PaneViewComponent
        orientation={Orientation.VERTICAL}
        size={500}
        orthogonalSize={300}
        onReady={onReady}
        headerComponents={headerComponents}
        components={components}
      />
    </div>
  );
};
