import * as React from 'react';
import {
    IGroupPanelProps,
    CompositeDisposable,
    GroupChangeKind,
    IGridviewPanelProps,
    TabContextMenuEvent,
    DockviewReadyEvent,
    DockviewComponent,
    DockviewApi,
} from 'splitview';
import { CustomTab } from './customTab';
import { Editor } from './editorPanel';
import { useLayoutRegistry } from './registry';
import { SplitPanel } from './splitPanel';

const components = {
    inner_component: (props: IGroupPanelProps) => {
        const _api = React.useRef<DockviewApi>();

        const onReady = (event: DockviewReadyEvent) => {
            _api.current = event.api;

            const layout = props.api.getStateKey<object>('layout');
            if (layout) {
                event.api.deserialize(layout);
            } else {
                event.api.addPanelFromComponent({
                    componentName: 'test_component',
                    id: 'inner-1',
                    title: 'inner-1',
                });
                event.api.addPanelFromComponent({
                    componentName: 'test_component',
                    id: 'inner-2',
                    title: 'inner-2',
                });
                event.api.addPanelFromComponent({
                    componentName: 'test_component',
                    id: nextGuid(),
                    title: 'inner-3',
                    position: {
                        direction: 'within',
                        referencePanel: 'inner-1',
                    },
                });
                event.api.addPanelFromComponent({
                    componentName: 'test_component',
                    id: nextGuid(),
                    title: 'inner-4',
                    position: {
                        direction: 'within',
                        referencePanel: 'inner-2',
                    },
                });
            }
        };

        React.useEffect(() => {
            const compDis = new CompositeDisposable(
                props.api.onDidDimensionsChange((event) => {
                    _api.current?.layout(event.width, event.height);
                }),
                _api.current.onDidLayoutChange((event) => {
                    if (event.kind === GroupChangeKind.LAYOUT_CONFIG_UPDATED) {
                        props.api.setState('layout', _api.current.toJSON());
                    }
                })
            );

            return () => {
                compDis.dispose();
            };
        }, []);

        return (
            <div
                style={{
                    boxSizing: 'border-box',
                    // borderTop: "1px solid var(--splitview-divider-color)",
                }}
            >
                <DockviewComponent
                    onReady={onReady}
                    components={components}
                    tabHeight={20}
                    debug={true}
                />
            </div>
        );
    },
    test_component: (props: IGroupPanelProps & { [key: string]: any }) => {
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
                    setPanelState((_) => ({
                        ..._,
                        isGroupActive: event.isFocused,
                    }));
                }),
                props.api.onDidGroupPanelVisibleChange((x) => {
                    setPanelState((_) => ({
                        ..._,
                        isPanelVisible: x.isVisible,
                    }));
                })
            );

            props.api.interceptOnCloseAction(() => {
                if (confirm('close?')) {
                    return Promise.resolve(true);
                }
                return Promise.resolve(false);
            });

            return () => {
                disposable.dispose();
            };
        }, []);

        const onClick = () => {
            props.api.setState('test_key', 'hello');
        };

        const backgroundColor = React.useMemo(
            () =>
                // "#1e1e1e",
                `rgb(${Math.floor(Math.random() * 256)},${Math.floor(
                    Math.random() * 256
                )},${Math.floor(Math.random() * 256)})`,
            []
        );

        const onRename = () => {
            props.api.setTitle('Did it change?');
        };

        return (
            <div
                style={{
                    backgroundColor,
                    height: '100%',
                }}
            >
                <div>test component</div>
                <button onClick={onClick}>set state</button>
                <button onClick={onRename}>rename</button>
                {/* {props.api.getState()["test_key"]} */}

                <div>{`G:${panelState.isGroupActive} P:${panelState.isPanelVisible}`}</div>
                <div>{props.text || '-'}</div>
            </div>
        );
    },
    editor: Editor,
    split_panel: SplitPanel,
};

const tabComponents = {
    default: CustomTab,
};

export const nextGuid = (() => {
    let counter = 0;
    return () => 'panel_' + (counter++).toString();
})();

export const TestGrid = (props: IGridviewPanelProps) => {
    const _api = React.useRef<DockviewApi>();
    const registry = useLayoutRegistry();

    const onReady = (event: DockviewReadyEvent) => {
        const api = event.api;
        _api.current = event.api;
        // setApi(event.api);
        registry.register('dockview', api);

        const panelReference = api.addPanelFromComponent({
            componentName: 'test_component',
            id: nextGuid(),
            title: 'Item 1',
            params: { text: 'how low?' },
        });
        api.addPanelFromComponent({
            componentName: 'test_component',
            id: 'item2',
            title: 'Item 2',
        });
        api.addPanelFromComponent({
            componentName: 'split_panel',
            id: nextGuid(),
            title: 'Item 3 with a long title',
        });
        api.addPanelFromComponent({
            componentName: 'test_component',
            id: nextGuid(),
            title: 'Item 3',
            position: { direction: 'below', referencePanel: 'item2' },
            suppressClosable: true,
        });

        // setInterval(() => {
        //   panelReference.update({ params: { text: `Tick ${Date.now()}` } });
        //   // panelReference.remove();
        // }, 1000);

        api.addDndHandle('text/plain', (ev) => {
            const { event } = ev;

            return {
                id: 'yellow',
                componentName: 'test_component',
            };
        });

        api.addDndHandle('Files', (ev) => {
            const { event } = ev;

            ev.event.event.preventDefault();

            return {
                id: Date.now().toString(),
                title: event.event.dataTransfer.files[0].name,
                componentName: 'test_component',
            };
        });
    };

    React.useEffect(() => {
        // const callback = (ev: UIEvent) => {
        //   const height = window.innerHeight - 40;
        //   const width = window.innerWidth;

        //   _api.current?.layout(width, height);
        // };
        // window.addEventListener("resize", callback);
        // callback(undefined);

        props.api.setConstraints({
            minimumWidth: () => _api.current.minimumWidth,
            minimumHeight: () => _api.current.minimumHeight,
        });

        const disposable = new CompositeDisposable(
            _api.current.onDidLayoutChange((event) => {
                console.log(event.kind);
            }),
            props.api.onDidDimensionsChange((event) => {
                const { width, height } = event;
                _api.current.layout(width, height);
            })
        );

        return () => {
            disposable.dispose();
            // window.removeEventListener("resize", callback);
        };
    }, []);

    const onTabContextMenu = React.useMemo(
        () => (event: TabContextMenuEvent) => {
            console.log(event);
        },
        []
    );

    return (
        <div
            // className="visual-studio-theme"
            style={{ width: '100%', overflow: 'hidden' }}
        >
            <DockviewComponent
                // autoSizeToFitContainer={true}
                onReady={onReady}
                components={components}
                tabComponents={tabComponents}
                debug={false}
                // tabHeight={30}
                enableExternalDragEvents={true}
                // serializedLayout={data}
                onTabContextMenu={onTabContextMenu}
                watermarkComponent={Watermark}
            />
        </div>
    );
};

const Watermark = (props) => {
    return (
        <div>
            <div>custom watermark</div>
        </div>
    );
};
