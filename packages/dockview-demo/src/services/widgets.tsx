import {
    CompositeDisposable,
    GridviewApi,
    IGridviewPanelProps,
    IPaneviewPanelProps,
    PanelCollection,
    PaneviewApi,
    PaneviewDropEvent,
    PaneviewReact,
    PaneviewReadyEvent,
    getPaneData,
} from 'dockview';
import * as React from 'react';
import { useLayoutRegistry } from '../layout-grid/registry';
import { PaneviewContainer, ViewContainer } from './viewContainer';
import { ViewService } from './viewService';
import { DefaultView } from './view';

const viewService = new ViewService();

const layout = localStorage.getItem('viewservice');
if (layout) {
    viewService.load(JSON.parse(layout));
} else {
    const container1 = new PaneviewContainer('c1', true);
    if (!container1.schema) {
        container1.addView(new DefaultView('panel1', 'Panel 1', true));
        container1.addView(new DefaultView('panel2', 'Panel 2', true));
    }
    const container2 = new PaneviewContainer('c2', true);
    if (!container2.schema) {
        container2.addView(new DefaultView('panel3', 'Panel 3', true));
        container2.addView(new DefaultView('panel4', 'Panel 4', true));
    }
    viewService.addContainer(container1);
    viewService.addContainer(container2);
}

const save = () => {
    localStorage.setItem('viewservice', JSON.stringify(viewService.toJSON()));
};

viewService.onDidActiveContainerChange(save);
viewService.onDidRemoveContainer(save);
viewService.onDidAddContainer(save);

const components: PanelCollection<IPaneviewPanelProps<any>> = {
    default: (props: IPaneviewPanelProps<{ viewId: string }>) => {
        return (
            <div style={{ backgroundColor: 'black', height: '100%' }}>
                {props.params.viewId}
            </div>
        );
    },
};

export const Activitybar = (props: IGridviewPanelProps) => {
    const [activeContainerid, setActiveContainerId] = React.useState<string>(
        viewService.activeContainer.id
    );
    const [containers, setContainers] = React.useState<ViewContainer[]>(
        viewService.containers
    );

    const registry = useLayoutRegistry();

    React.useEffect(() => {
        const disposable = new CompositeDisposable(
            viewService.onDidActiveContainerChange(() => {
                setActiveContainerId(viewService.activeContainer.id);
            }),
            viewService.onDidAddContainer(() => {
                setContainers(viewService.containers);
            }),
            viewService.onDidRemoveContainer(() => {
                setContainers(viewService.containers);
            }),
            viewService.onDidContainersChange(() => {
                setContainers(viewService.containers);
            })
        );

        return () => {
            disposable.dispose();
        };
    }, []);

    const onClick = (container: ViewContainer, alwaysOpen = false) => (
        event: React.MouseEvent
    ) => {
        const api = registry.get<GridviewApi>('gridview');

        const selectedActive = container.id === activeContainerid;

        const sidebarPanel = api.getPanel('sidebar');
        if (sidebarPanel.api.isVisible) {
            if (!alwaysOpen && selectedActive) {
                api.setVisible(sidebarPanel, false);
            }
        } else {
            event.preventDefault(); // prevent focus
            api.setVisible(sidebarPanel, true);
            sidebarPanel.focus();
        }

        viewService.setActiveViewContainer(container.id);
    };

    const onDrop = (targetContainer: ViewContainer) => (
        event: React.DragEvent
    ) => {
        const data = event.dataTransfer.getData('application/json');
        if (data) {
            const { container } = JSON.parse(data);
            const sourceContainer = viewService.getViewContainer(container);
            viewService.insertContainerAfter(sourceContainer, targetContainer);
        }
    };

    const onNewContainer = (event: React.DragEvent) => {
        const data = getPaneData();
        if (data) {
            const { paneId } = data;
            const view = viewService.getView(paneId);
            const viewContainer = viewService.getViewContainer2(view);
            viewService.removeViews([view], viewContainer);
            // viewContainer.removeView(view);
            const newContainer = new PaneviewContainer(
                `t_${Date.now().toString().substr(5)}`,
                true
            );
            newContainer.addView(view);
            viewService.addContainer(newContainer);
        }
    };

    return (
        <div style={{ background: 'rgb(51,51,51)' }}>
            {containers.map((container, i) => {
                const isActive = activeContainerid === container.id;
                return (
                    <div
                        onClick={onClick(container)}
                        onDragOver={(e) => {
                            e.preventDefault();
                            onClick(container, true)(e);
                        }}
                        onDragEnter={(e) => {
                            e.preventDefault();
                        }}
                        draggable={true}
                        onDragStart={(e) => {
                            e.dataTransfer.setData(
                                'application/json',
                                JSON.stringify({ container: container.id })
                            );
                        }}
                        onDrop={onDrop(container)}
                        style={{
                            height: '48px',
                            boxSizing: 'border-box',
                            borderLeft: isActive
                                ? '1px solid white'
                                : '1px solid transparent',
                        }}
                        key={i}
                    >
                        {container.id}
                    </div>
                );
            })}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                }}
                onDragEnter={(e) => {
                    e.preventDefault();
                }}
                onDrop={onNewContainer}
                style={{ height: '100%', backgroundColor: 'red' }}
            ></div>
        </div>
    );
};

export const Sidebar = () => {
    const [sidebarId, setSidebarId] = React.useState<string>(
        viewService.activeContainer.id
    );

    React.useEffect(() => {
        const disposable = viewService.onDidActiveContainerChange(() => {
            setSidebarId(viewService.activeContainer.id);
        });

        return () => {
            disposable.dispose();
        };
    }, []);

    return <SidebarPart id={sidebarId} />;
};

export const SidebarPart = (props: { id: string }) => {
    const [api, setApi] = React.useState<PaneviewApi>();

    React.useEffect(() => {
        if (!api) {
            return () => {
                //
            };
        }

        const viewContainer = viewService.getViewContainer(props.id);

        const disposables = new CompositeDisposable(
            api.onDidLayoutChange(() => {
                viewContainer.layout(api.toJSON());
            }),
            viewContainer.onDidAddView((view) => {
                api.addPanel({
                    id: view.id,
                    isExpanded: view.isExpanded,
                    title: view.title,
                    component: 'default',
                    params: {
                        viewId: view.id,
                    },
                });
            }),
            viewContainer.onDidRemoveView((view) => {
                const panel = api.getPanel(view.id);
                api.removePanel(panel);
            })
        );

        const schema = viewContainer.schema;
        if (schema) {
            api.fromJSON(schema);
        } else {
            api.getPanels().forEach((p) => {
                api.removePanel(p);
            });
            viewContainer.views.forEach((view) => {
                api.addPanel({
                    id: view.id,
                    isExpanded: view.isExpanded,
                    title: view.title,
                    component: 'default',
                    params: {
                        viewId: view.id,
                    },
                });
            });
        }

        return () => {
            disposables.dispose();
        };
    }, [api, props.id]);

    const onReady = (event: PaneviewReadyEvent) => {
        setApi(event.api);
    };

    const onDidDrop = (event: PaneviewDropEvent) => {
        const data = getPaneData();

        if (!data) {
            return;
        }

        const viewId = data.paneId;
        const viewContainer = viewService.getViewContainer(props.id);
        const view = viewService.getView(viewId);

        viewService.moveViewToLocation(view, viewContainer, 0);
    };

    if (!props.id) {
        return null;
    }

    return (
        <PaneviewReact
            onDidDrop={onDidDrop}
            components={components}
            onReady={onReady}
        />
    );
};
