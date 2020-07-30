import * as React from "react";
import { IGridView, Layout, ReactJS_Panel, IPanelProps } from "splitview";
import "./grid.scss";

const createView = (text: string): IGridView => {
  const el = document.createElement("div");
  el.textContent = text;
  el.style.backgroundColor = `rgb(${Math.floor(
    Math.random() * 256
  )},${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)})`;
  el.style.height = "100%";
  el.style.width = "100%";

  return {
    element: el,
    minimumHeight: 100,
    maximumHeight: Number.MAX_SAFE_INTEGER,
    minimumWidth: 200,
    maximumWidth: 1000,
    layout: (size, orthogonalSize) => {
      //
    },
  };
};

let id = 0;

export const Grid = () => {
  const ref = React.useRef<HTMLDivElement>();
  const gridview = React.useRef<Layout>();

  const [portals, setPortals] = React.useState<React.ReactPortal[]>([]);

  React.useEffect(() => {
    gridview.current = new Layout();
    ref.current.appendChild(gridview.current.element);

    gridview.current.layout(800, 500);

    // gridview.current.addView(createView("1"), 200, [0]);
    // gridview.current.addView(createView("2"), 200, [0]);
    // gridview.current.addView(createView("3"), 200, [0]);

    const createComponent = (title: string) => {
      const backgroundColor = `rgb(${Math.floor(
        Math.random() * 256
      )},${Math.floor(Math.random() * 256)},${Math.floor(
        Math.random() * 256
      )})`;

      return new ReactJS_Panel((id++).toString(), {
        header: {
          component: (props: IPanelProps & { [key: string]: any }) => {
            const [state, setState] = React.useState<{
              isGroupActive: boolean;
              isPanelVisible: boolean;
            }>({ isPanelVisible: false, isGroupActive: false });

            React.useEffect(() => {
              const listener = props.api.onDidPanelStateChange((ev) => {
                const { isGroupActive, isPanelVisible } = ev;
                setState({ isGroupActive, isPanelVisible });
              });
              return () => {
                listener.dispose();
              };
            }, []);

            const onClick = () => {
              props.api.close();
            };

            const activeAndFocused =
              state.isGroupActive && state.isPanelVisible;

            const mask = `url(https://fonts.gstatic.com/s/i/materialicons/close/v8/24px.svg) 50% 50% / 90% 90% no-repeat`;
            const color = activeAndFocused
              ? "white"
              : state.isGroupActive
              ? "#969696"
              : state.isPanelVisible
              ? "#8F8F8F"
              : "#626262";
            return (
              <div
                className={`my-tab ${
                  state.isPanelVisible ? "my-active-tab" : "my-inactive-tab"
                }`}
                style={{
                  position: "relative",
                  backgroundColor: state.isPanelVisible ? "#1E1E1E" : "#2D2D2D",
                  height: "100%",
                  display: "flex",
                  minWidth: "80px",
                  alignItems: "center",
                  paddingLeft: "10px",
                  whiteSpace: "nowrap",
                  textOverflow: "elipsis",
                  fontSize: "13px",
                  // width: "60px",
                  // minWidth: "fit-content",
                  color,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    backgroundColor: "black",
                    color: "white",
                    fontSize: "9px",
                    lineHeight: "9px",
                  }}
                >
                  {state.isGroupActive && <div>{`G`}</div>}
                  {state.isPanelVisible && <div>{`P`}</div>}
                </div>
                <span style={{ flexGrow: 1 }}>{props.title}</span>
                <div
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                  }}
                  style={{
                    textAlign: "right",
                    width: "28px",
                  }}
                >
                  <ul
                    className="tab-list"
                    style={{
                      display: "flex",
                      padding: "0px",
                      margin: "0px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <a
                      onClick={onClick}
                      style={{
                        height: "16px",
                        width: "16px",
                        display: "block",
                        WebkitMask: mask,
                        mask,
                        backgroundColor: color,
                        marginRight: "0.5em",
                      }}
                    ></a>
                  </ul>
                </div>
              </div>
            );
          },
          props: { title },
        },
        content: {
          component: (props: IPanelProps & { [key: string]: any }) => {
            const [state, setState] = React.useState<{
              isGroupActive: boolean;
              isPanelVisible: boolean;
            }>({ isPanelVisible: false, isGroupActive: false });

            React.useEffect(() => {
              const listener = props.api.onDidPanelStateChange((ev) => {
                const { isGroupActive, isPanelVisible } = ev;
                setState({ isGroupActive, isPanelVisible });
              });
              return () => {
                listener.dispose();
              };
            }, []);

            return (
              <div
                style={{
                  position: "relative",
                  height: "100%",
                  backgroundColor,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    backgroundColor: "black",
                    color: "white",
                    fontSize: "9px",
                    lineHeight: "9px",
                  }}
                >
                  {state.isGroupActive && <div>{`G`}</div>}
                  {state.isPanelVisible && <div>{`P`}</div>}
                </div>
                <div>{`body of ${props.title}`}</div>
              </div>
            );
          },
          props: { title },
        },
        addPortal: (portal) => {
          setPortals((_) => [..._, portal]);
          return {
            dispose: () => {
              setPortals((_) => _.filter((p) => p !== portal));
            },
          };
        },
      });
    };

    const create = (title: string) => {
      const color = `rgb(${Math.floor(Math.random() * 256)},${Math.floor(
        Math.random() * 256
      )},${Math.floor(Math.random() * 256)})`;

      const header = document.createElement("div");
      const headertext = document.createElement("span");
      headertext.textContent = title;
      header.className = "header";
      header.style.backgroundColor = color;
      header.style.height = "100%";
      header.appendChild(headertext);

      const body = document.createElement("div");
      body.textContent = "body";
      body.style.backgroundColor = color;
      body.style.height = "100%";
      body.style.padding = "2px";
      body.style.boxSizing = "border-box";
      return { tab: header, content: body };
    };

    gridview.current.addGroupItem(createComponent("Item 1"));
    gridview.current.addGroupItem(createComponent("Item 2"));
    gridview.current.addGroupItem(createComponent("Item 3"));
    gridview.current.addGroupItem(createComponent("Item 4"));
    gridview.current.addGroupItem(createComponent("Item 5"));
    // gridview.current.addGroupItem(createComponent("Item 6"));
    // gridview.current.addGroupItem(createComponent("Item 7"));
    // gridview.current.addGroupItem(createComponent("Item 8"));
    // gridview.current.addGroupItem(createComponent("Item 9"));
    // gridview.current.addGroupItem(createComponent("Item 10"));
    // gridview.current.addGroupItem(createComponent("Item 11"));

    // gridview.current.addGroupItem({ id: "1", ...create("Item 1") });
    // gridview.current.addGroupItem({ id: "2", ...create("Item 2") });
    // gridview.current.addGroupItem({ id: "3", ...create("Item 3") });
    // gridview.current.addGroupItem({ id: "4", ...create("Item 4") });
    // gridview.current.addGroupItem({ id: "5", ...create("Item 5") });
    // gridview.current.addGroupItem({ id: "6", ...create("Item 6") });
    // gridview.current.addGroupItem({ id: "7", ...create("Item 7") });

    // setTimeout(() => {
    //   gridview.current.remove(group2);
    //   gridview.current.layout(500, 800);
    // }, 5000);

    const { width, height } = ref.current.getBoundingClientRect();

    gridview.current.layout(800, 500);
  }, []);

  return (
    <div style={{ height: "500px", width: "800px" }} ref={ref}>
      {portals}
    </div>
  );
};
