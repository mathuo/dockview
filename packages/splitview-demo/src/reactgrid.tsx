import * as React from "react";
import {
  ReactGrid,
  OnReadyEvent,
  Api,
  IPanelProps,
  PanelStateChangeEvent,
  ClosePanelResult,
  CompositeDisposable,
  GroupChangeKind,
} from "splitview";

const components = {
  inner_component: (props: IPanelProps) => {
    const _api = React.useRef<Api>();
    const [api, setApi] = React.useState<Api>();

    const onReady = (event: OnReadyEvent) => {
      _api.current = event.api;

      const layout = props.api.getState()["layout"];
      if (layout) {
        event.api.deserialize(layout);
      } else {
        event.api.addPanelFromComponent("test_component", {
          id: nextGuid(),
          title: "inner-1",
        });
        event.api.addPanelFromComponent("test_component", {
          id: nextGuid(),
          title: "inner-2",
        });
      }
      setApi(event.api);
    };

    React.useEffect(() => {
      const compDis = new CompositeDisposable(
        props.api.onDidPanelDimensionChange((event) => {
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
      <ReactGrid
        autoSizeToFitContainer={true}
        onReady={onReady}
        components={components}
        tabHeight={20}
        debug={true}
      />
    );
  },
  test_component: (props: IPanelProps & { [key: string]: any }) => {
    const [panelState, setPanelState] = React.useState<PanelStateChangeEvent>({
      isGroupActive: false,
      isPanelVisible: false,
    });

    React.useEffect(() => {
      const disposable = new CompositeDisposable(
        props.api.onDidPanelStateChange((x) => {
          setPanelState(x);
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

    const panelReference = api.addPanelFromComponent("test_component", {
      id: nextGuid(),
      title: "Item 1",
      params: { text: "how low?" },
    });
    api.addPanelFromComponent("test_component", {
      id: "item2",
      title: "Item 2",
    });
    api.addPanelFromComponent("test_component", {
      id: nextGuid(),
      title: "Item 3",
    });
    api.addPanelFromComponent("inner_component", {
      id: nextGuid(),
      title: "Item 3",
      position: { direction: "below", referencePanel: "item2" },
      suppressClosable: true,
    });

    // setInterval(() => {
    //   panelReference.update({ params: { text: `Tick ${Date.now()}` } });
    //   // panelReference.remove();
    // }, 1000);
  }, [api]);

  const onAdd = () => {
    api.addPanelFromComponent("test_component", {
      id: nextGuid(),
      title: "-",
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
    const didClose = await api.closeAll();
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
    api.closeAll();
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={{ height: "20px" }}>
        <button onClick={onAdd}>Add</button>
        <button onClick={onAddEmpty}>Add empty</button>
        <button onClick={onConfig}>Save</button>
        <button onClick={onLoad}>Load</button>
        <button onClick={onClear}>Clear</button>
      </div>
      <ReactGrid
        // autoSizeToFitContainer={true}
        onReady={onReady}
        components={components}
        debug={true}
        // serializedLayout={data}
      />
    </div>
  );
};
