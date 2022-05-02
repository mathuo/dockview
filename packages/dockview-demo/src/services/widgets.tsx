import {
    getPaneData,
    GridviewApi,
    IGridviewPanelProps,
    IPaneviewPanelProps,
    PanelCollection,
    PaneviewApi,
    PaneviewDropEvent,
    PaneviewReact,
    PaneviewReadyEvent,
    Position,
} from 'dockview';
import * as React from 'react';
import { useLayoutRegistry } from '../layout-grid/registry';
import { PaneviewContainer, ViewContainer } from './viewContainer';
import { IViewService, ViewService } from './viewService';
import { DefaultView } from './view';
import { RegisteredView, VIEW_REGISTRY } from './viewRegistry';
import { toggleClass } from '../dom';
import { Container } from './sidebarItem';
import './widgets.scss';
import { CompositeDisposable } from '../lifecycle';

class ViewServiceModel {
    private readonly viewService: IViewService;

    get model() {
        return this.viewService;
    }

    constructor() {
        this.viewService = new ViewService(VIEW_REGISTRY);
        this.init();
    }

    init(): void {
        const layout = localStorage.getItem('viewservice');
        if (layout) {
            this.viewService.load(JSON.parse(layout));
        } else {
            const container1 = new PaneviewContainer(
                'default_container_1',
                VIEW_REGISTRY
            );
            if (!container1.schema) {
                this.addView(
                    container1,
                    VIEW_REGISTRY.getRegisteredView('search_widget')
                );
                this.addView(
                    container1,
                    VIEW_REGISTRY.getRegisteredView('home_widget')
                );
            }
            const container2 = new PaneviewContainer(
                'default_container_2',
                VIEW_REGISTRY
            );
            if (!container2.schema) {
                this.addView(
                    container2,
                    VIEW_REGISTRY.getRegisteredView('account_widget')
                );
                this.addView(
                    container2,
                    VIEW_REGISTRY.getRegisteredView('settings_widget')
                );
            }
            this.viewService.addContainer(container1);
            this.viewService.addContainer(container2);
        }

        const save = () => {
            localStorage.setItem(
                'viewservice',
                JSON.stringify(this.viewService.toJSON())
            );
        };

        this.viewService.onDidActiveContainerChange(save);
        this.viewService.onDidRemoveContainer(save);
        this.viewService.onDidAddContainer(save);
    }

    private addView(
        container: ViewContainer,
        registedView: RegisteredView
    ): void {
        container.addView(
            new DefaultView({
                id: registedView.id,
                title: registedView.title,
                isExpanded: true,
                isLocationEditable: registedView.isLocationEditable,
                icon: registedView.icon,
            })
        );
    }
}

const viewService = new ViewServiceModel();

const colors = {
    home_widget: 'red',
    account_widget: 'green',
    settings_widget: 'yellow',
    search_widget: 'orange',
};

const components: PanelCollection<IPaneviewPanelProps<any>> = {
    default: (props: IPaneviewPanelProps<{ viewId: string }>) => {
        const Component = React.useMemo(() => {
            const registeredView = VIEW_REGISTRY.getRegisteredView(
                props.params.viewId
            );
            return registeredView?.component;
        }, [props.params.viewId]);

        return Component ? <Component /> : null;
    },
};

export const Activitybar = (props: IGridviewPanelProps) => {
    const [activeContainerid, setActiveContainerId] = React.useState<string>(
        viewService.model.activeContainer.id
    );
    const [containers, setContainers] = React.useState<ViewContainer[]>(
        viewService.model.containers
    );

    const registry = useLayoutRegistry();

    React.useEffect(() => {
        const disposable = new CompositeDisposable(
            viewService.model.onDidActiveContainerChange(() => {
                setActiveContainerId(viewService.model.activeContainer.id);
            }),
            viewService.model.onDidAddContainer(() => {
                setContainers(viewService.model.containers);
            }),
            viewService.model.onDidRemoveContainer(() => {
                setContainers(viewService.model.containers);
            }),
            viewService.model.onDidContainersChange(() => {
                setContainers(viewService.model.containers);
            })
        );

        return () => {
            disposable.dispose();
        };
    }, []);

    const onClick =
        (container: ViewContainer, alwaysOpen = false) =>
        (event: React.MouseEvent) => {
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

            viewService.model.setActiveViewContainer(container.id);
        };

    const onContainerDrop =
        (targetContainer: ViewContainer) =>
        (event: React.DragEvent, direction: 'top' | 'bottom') => {
            const data = event.dataTransfer.getData('application/json');
            if (data) {
                const { container } = JSON.parse(data);
                const sourceContainer =
                    viewService.model.getViewContainer(container);

                switch (direction) {
                    case 'bottom':
                        viewService.model.insertContainerAfter(
                            sourceContainer,
                            targetContainer
                        );
                        break;
                    case 'top':
                        viewService.model.insertContainerBefore(
                            sourceContainer,
                            targetContainer
                        );
                        break;
                }

                viewService.model.setActiveViewContainer(sourceContainer.id);
            }
        };

    const onNewContainer = (event: React.DragEvent) => {
        const data = getPaneData();
        if (data) {
            const { paneId } = data;
            const view = viewService.model.getView(paneId);

            if (!view) {
                console.log(`view ${paneId} doesn't exist`);
                return;
            }

            const viewContainer = viewService.model.getViewContainer2(view);

            if (!viewContainer) {
                console.log(`viewContainer for view ${view.id} doesn't exist`);
                return;
            }

            viewService.model.removeViews([view], viewContainer);

            const newContainer = new PaneviewContainer(
                `t_${Date.now().toString().substr(5)}`,
                VIEW_REGISTRY
            );
            newContainer.addView(view);
            viewService.model.addContainer(newContainer);
        }
    };

    const onDragOver = (container: ViewContainer) => (e: React.DragEvent) => {
        const api = registry.get<GridviewApi>('gridview');

        const sidebarPanel = api.getPanel('sidebar');
        if (!sidebarPanel.api.isVisible) {
            api.setVisible(sidebarPanel, true);
            sidebarPanel.focus();
        }

        viewService.model.setActiveViewContainer(container.id);
    };

    return (
        <div className="activity-bar-part">
            {containers.map((container, i) => {
                const isActive = activeContainerid === container.id;
                return (
                    <Container
                        key={i}
                        container={container}
                        isActive={isActive}
                        onDragOver={onDragOver(container)}
                        onClick={onClick(container)}
                        onDrop={onContainerDrop(container)}
                    />
                );
            })}
            <ExtraSpace onNewContainer={onNewContainer} />
        </div>
    );
};

const ExtraSpace = (props: {
    onNewContainer: (event: React.DragEvent) => void;
}) => {
    const ref = React.useRef<HTMLDivElement>(null);

    const onDrop = (event: React.DragEvent) => {
        toggleClass(ref.current, 'activity-bar-space-dragover', false);
        props.onNewContainer(event);
    };

    return (
        <div
            ref={ref}
            className="activity-bar-space"
            onDragOver={(e) => {
                e.preventDefault();
            }}
            onDragEnter={(e) => {
                toggleClass(ref.current, 'activity-bar-space-dragover', true);
                e.preventDefault();
            }}
            onDragLeave={(e) => {
                toggleClass(ref.current, 'activity-bar-space-dragover', false);
            }}
            onDrop={onDrop}
        ></div>
    );
};

export const Sidebar = () => {
    const [sidebarId, setSidebarId] = React.useState<string>(
        viewService.model.activeContainer.id
    );

    React.useEffect(() => {
        const disposable = viewService.model.onDidActiveContainerChange(() => {
            setSidebarId(viewService.model.activeContainer.id);
        });

        return () => {
            disposable.dispose();
        };
    }, []);

    return <SidebarPart id={sidebarId} />;
};

const headerComponents: PanelCollection<IPaneviewPanelProps> = {
    default: (props) => {
        const onClick = () => props.api.setExpanded(!props.api.isExpanded);
        return (
            <div
                onClick={onClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0px 8px',
                    cursor: 'pointer',
                }}
            >
                <a className="material-icons-outlined">
                    {props.api.isExpanded ? 'expand_more' : 'chevron_right'}
                </a>
                <span>{props.title}</span>
            </div>
        );
    },
};

export const SidebarPart = (props: { id: string }) => {
    const [api, setApi] = React.useState<PaneviewApi>();

    React.useEffect(() => {
        if (!api) {
            return () => {
                //
            };
        }

        const viewContainer = viewService.model.getViewContainer(props.id);

        const disposables = new CompositeDisposable(
            api.onDidLayoutChange(() => {
                viewContainer.layout(api.toJSON());
            }),
            viewContainer.onDidAddView(({ view, index }) => {
                api.addPanel({
                    id: view.id,
                    isExpanded: view.isExpanded,
                    title: view.title,
                    component: 'default',
                    headerComponent: 'default',
                    params: {
                        viewId: view.id,
                    },
                    index,
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
            api.panels.forEach((p) => {
                api.removePanel(p);
            });
            viewContainer.views.forEach((view) => {
                api.addPanel({
                    id: view.id,
                    isExpanded: view.isExpanded,
                    title: view.title,
                    component: 'default',
                    headerComponent: 'default',
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
        const data = event.getData();

        const containerData =
            event.nativeEvent.dataTransfer.getData('application/json');

        if (containerData) {
            const { container } = JSON.parse(containerData);

            if (container === props.id) {
                return;
            }

            const sourceContainer =
                viewService.model.getViewContainer(container);
            const targetContainer = viewService.model.getViewContainer(
                props.id
            );

            if (!sourceContainer) {
                console.log(`sourceContainer ${props.id} doesn't exist`);
                return;
            }
            if (!targetContainer) {
                console.log(`targetContainer ${props.id} doesn't exist`);
                return;
            }

            sourceContainer.views.forEach((v) => {
                viewService.model.moveViewToLocation(v, targetContainer, 0);
            });

            return;
        }

        if (!data) {
            return;
        }

        const targetPanel = event.panel;
        const allPanels = event.api.panels;
        let toIndex = allPanels.indexOf(targetPanel);

        if (
            event.position === Position.Right ||
            event.position === Position.Bottom
        ) {
            toIndex = Math.min(allPanels.length, toIndex + 1);
        }

        const viewId = data.paneId;
        const viewContainer = viewService.model.getViewContainer(props.id);

        if (!viewContainer) {
            console.log(`viewContainer ${props.id} doesn't exist`);
            return;
        }

        const view = viewService.model.getView(viewId);

        viewService.model.moveViewToLocation(view, viewContainer, toIndex);
    };

    if (!props.id) {
        return null;
    }

    return (
        <PaneviewReact
            className="sidebar-part"
            onDidDrop={onDidDrop}
            components={components}
            headerComponents={headerComponents}
            onReady={onReady}
        />
    );
};
