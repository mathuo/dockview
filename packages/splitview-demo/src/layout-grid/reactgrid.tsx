import * as React from "react";
import {
  ReactGrid,
  OnReadyEvent,
  Api,
  IPanelProps,
  ClosePanelResult,
  CompositeDisposable,
  GroupChangeKind,
} from "splitview";
import { CustomTab } from "./customTab";
import { Editor } from "./editorPanel";
import { SplitPanel } from "./splitPanel";

const components = {
  inner_component: (props: IPanelProps) => {
    const _api = React.useRef<Api>();
    const [api, setApi] = React.useState<Api>();

    const onReady = (event: OnReadyEvent) => {
      _api.current = event.api;

      const layout = props.api.getStateKey<object>("layout");
      if (layout) {
        event.api.deserialize(layout);
      } else {
        event.api.addPanelFromComponent({
          componentName: "test_component",
          id: "inner-1",
          title: "inner-1",
        });
        event.api.addPanelFromComponent({
          componentName: "test_component",
          id: "inner-2",
          title: "inner-2",
        });
        event.api.addPanelFromComponent({
          componentName: "test_component",
          id: nextGuid(),
          title: "inner-3",
          position: { direction: "within", referencePanel: "inner-1" },
        });
        event.api.addPanelFromComponent({
          componentName: "test_component",
          id: nextGuid(),
          title: "inner-4",
          position: { direction: "within", referencePanel: "inner-2" },
        });
      }
      setApi(event.api);
    };

    React.useEffect(() => {
      const compDis = new CompositeDisposable(
        props.api.onDidDimensionsChange((event) => {
          _api.current?.layout(event.width, event.height);
        }),
        _api.current.onDidLayoutChange((event) => {
          if (event.kind === GroupChangeKind.LAYOUT_CONFIG_UPDATED) {
            props.api.setState("layout", _api.current.toJSON());
          }
        })
      );

      return () => {
        compDis.dispose();
      };
    }, []);

    React.useEffect(() => {
      if (!api) {
        return;
      }

      api.onDidLayoutChange((event) => {
        // on inner grid changes
      });
    }, [api]);

    return (
      <div
        style={{
          boxSizing: "border-box",
          // borderTop: "1px solid var(--splitview-divider-color)",
        }}
      >
        <ReactGrid
          onReady={onReady}
          components={components}
          tabHeight={20}
          debug={true}
        />
      </div>
    );
  },
  test_component: (props: IPanelProps & { [key: string]: any }) => {
    const [panelState, setPanelState] = React.useState<{
      isGroupActive: boolean;
      isPanelVisible: boolean;
    }>({
      isGroupActive: false,
      isPanelVisible: false,
    });

    React.useEffect(() => {
      const disposable = new CompositeDisposable(
        props.api.onDidFocusChange((event) => {
          setPanelState((_) => ({ ..._, isGroupActive: event.isFocused }));
        }),
        props.api.onDidChangeVisibility((x) => {
          setPanelState((_) => ({ ..._, isPanelVisible: x.isVisible }));
        })
      );

      props.api.setClosePanelHook(() => {
        if (confirm("close?")) {
          return Promise.resolve(ClosePanelResult.CLOSE);
        }
        return Promise.resolve(ClosePanelResult.DONT_CLOSE);
      });

      return () => {
        disposable.dispose();
      };
    }, []);

    const onClick = () => {
      props.api.setState("test_key", "hello");
    };

    const backgroundColor = React.useMemo(
      () =>
        // "#1e1e1e",
        `rgb(${Math.floor(Math.random() * 256)},${Math.floor(
          Math.random() * 256
        )},${Math.floor(Math.random() * 256)})`,
      []
    );
    return (
      <div
        style={{
          backgroundColor,
          height: "100%",
        }}
      >
        <div>test component</div>
        <button onClick={onClick}>set state</button>
        {/* {props.api.getState()["test_key"]} */}

        <div>{`G:${panelState.isGroupActive} P:${panelState.isPanelVisible}`}</div>
        <div>{props.text || "-"}</div>
      </div>
    );
  },
  editor: Editor,
  split_panel: SplitPanel,
};

const tabComponents = {
  default: CustomTab,
};

const nextGuid = (() => {
  let counter = 0;
  return () => "panel_" + (counter++).toString();
})();

export const TestGrid = () => {
  const _api = React.useRef<Api>();
  const [api, setApi] = React.useState<Api>();

  const onReady = (event: OnReadyEvent) => {
    _api.current = event.api;
    setApi(event.api);
  };

  React.useEffect(() => {
    // return;
    if (!api) {
      return;
    }

    const panelReference = api.addPanelFromComponent({
      componentName: "test_component",
      id: nextGuid(),
      title: "Item 1",
      params: { text: "how low?" },
    });
    api.addPanelFromComponent({
      componentName: "test_component",
      id: "item2",
      title: "Item 2",
    });
    api.addPanelFromComponent({
      componentName: "split_panel",
      id: nextGuid(),
      title: "Item 3 with a long title",
    });
    api.addPanelFromComponent({
      componentName: "test_component",
      id: nextGuid(),
      title: "Item 3",
      position: { direction: "below", referencePanel: "item2" },
      suppressClosable: true,
    });

    // setInterval(() => {
    //   panelReference.update({ params: { text: `Tick ${Date.now()}` } });
    //   // panelReference.remove();
    // }, 1000);

    api.addDndHandle("text/plain", (ev) => {
      const { event } = ev;

      return {
        id: "yellow",
        componentName: "test_component",
      };
    });

    api.addDndHandle("Files", (ev) => {
      const { event } = ev;

      ev.event.event.preventDefault();

      return {
        id: Date.now().toString(),
        title: event.event.dataTransfer.files[0].name,
        componentName: "test_component",
      };
    });
  }, [api]);

  const onAdd = () => {
    const id = nextGuid();
    api.addPanelFromComponent({
      componentName: "test_component",
      id,
    });
  };

  const onAddEmpty = () => {
    api.addEmptyGroup();
  };

  React.useEffect(() => {
    const callback = (ev: UIEvent) => {
      const height = window.innerHeight - 40;
      const width = window.innerWidth;

      _api.current?.layout(width, height);
    };
    window.addEventListener("resize", callback);
    callback(undefined);

    const dis = _api.current.onDidLayoutChange((event) => {
      console.log(event.kind);
    });

    return () => {
      dis.dispose();
      window.removeEventListener("resize", callback);
    };
  }, []);

  const onConfig = () => {
    const data = api.toJSON();
    const stringData = JSON.stringify(data, null, 4);
    console.log(stringData);
    localStorage.setItem("layout", stringData);
  };

  const onLoad = async () => {
    const didClose = await api.closeAllGroups();
    if (!didClose) {
      return;
    }
    const data = localStorage.getItem("layout");
    if (data) {
      const jsonData = JSON.parse(data);
      api.deserialize(jsonData);
    }
  };

  const onClear = () => {
    api.closeAllGroups();
  };

  const onNextGroup = () => {
    api.moveToNext({ includePanel: true });
  };

  const onPreviousGroup = () => {
    api.moveToPrevious({ includePanel: true });
  };

  const onNextPanel = () => {
    api.activeGroup?.moveToNext();
  };

  const onPreviousPanel = () => {
    api.activeGroup?.moveToPrevious();
  };

  const dragRef = React.useRef<HTMLDivElement>();

  React.useEffect(() => {
    if (!api) {
      return;
    }
    api.createDragTarget(
      { element: dragRef.current, content: "drag me" },
      () => ({
        id: "yellow",
        componentName: "test_component",
      })
    );
  }, [api]);

  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData("text/plain", "Panel2");
  };

  const onAddEditor = () => {
    api.addPanelFromComponent({
      id: "editor",
      componentName: "editor",
      tabComponentName: "default",
      params: { layoutApi: api },
    });
  };

  const onTabContextMenu = (event: MouseEvent) => {};

  return (
    <div
      // className="visual-studio-theme"
      style={{ width: "100%" }}
    >
      <div style={{ height: "20px", display: "flex" }}>
        <button onClick={onAdd}>Add</button>
        <button onClick={onAddEditor}>Expr</button>
        <button onClick={onAddEmpty}>Add empty</button>
        <button onClick={onConfig}>Save</button>
        <button onClick={onLoad}>Load</button>
        <button onClick={onClear}>Clear</button>
        <button onClick={onNextGroup}>Next</button>
        <button onClick={onPreviousGroup}>Before</button>
        <button onClick={onNextPanel}>NextPanel</button>
        <button onClick={onPreviousPanel}>BeforePanel</button>
        <div
          draggable={true}
          className="my-dragger"
          style={{
            backgroundColor: "dodgerblue",
            borderRadius: "10px",
            color: " white",
          }}
          ref={dragRef}
        >
          Drag me
        </div>
        <div
          onDragStart={onDragStart}
          draggable={true}
          className="my-dragger"
          style={{
            backgroundColor: "orange",
            borderRadius: "10px",
            color: " white",
          }}
        >
          Drag me too
        </div>
      </div>
      <ReactGrid
        // autoSizeToFitContainer={true}
        onReady={onReady}
        components={components}
        tabComponents={tabComponents}
        debug={true}
        // tabHeight={30}
        enableExternalDragEvents={true}
        // serializedLayout={data}
        // onTabContextMenu={onTabContextMenu}
      />
    </div>
  );
};
