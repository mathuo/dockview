import * as React from 'react';
import { IDisposable } from '../../lifecycle';
import { ComponentDockview, Api } from '../../dockview/componentDockview';
import { ReactPanelContentPart } from './reactContentPart';
import { ReactPanelHeaderPart } from './reactHeaderPart';
import { ReactPanelDeserialzier } from '../deserializer';
import {
    GroupPanelFrameworkComponentFactory,
    TabContextMenuEvent,
} from '../../dockview/options';
import { IGroupPanelApi } from '../../api/groupPanelApi';

export interface IGroupPanelProps {
    api: IGroupPanelApi;
}

export interface DockviewReadyEvent {
    api: Api;
}

export interface ReactLayout {
    addPortal: (portal: React.ReactPortal) => IDisposable;
}

export interface IDockviewComponentProps {
    components?: {
        [componentName: string]: React.FunctionComponent<IGroupPanelProps>;
    };
    tabComponents?: {
        [componentName: string]: React.FunctionComponent<IGroupPanelProps>;
    };
    watermarkComponent?: React.FunctionComponent;
    onReady?: (event: DockviewReadyEvent) => void;
    autoSizeToFitContainer?: boolean;
    serializedLayout?: {};
    deserializer?: {
        fromJSON: (
            data: any
        ) => {
            component: React.FunctionComponent<IGroupPanelProps>;
            tabComponent?: React.FunctionComponent<IGroupPanelProps>;
            props?: { [key: string]: any };
        };
    };
    debug?: boolean;
    tabHeight?: number;
    enableExternalDragEvents?: boolean;
    onTabContextMenu?: (event: TabContextMenuEvent) => void;
}

export const DockviewComponent: React.FunctionComponent<IDockviewComponentProps> = (
    props: IDockviewComponentProps
) => {
    const domReference = React.useRef<HTMLDivElement>();
    const layoutReference = React.useRef<ComponentDockview>();

    const [portals, setPortals] = React.useState<React.ReactPortal[]>([]);

    React.useEffect(() => {
        const addPortal = (p: React.ReactPortal) => {
            setPortals((portals) => [...portals, p]);
            return {
                dispose: () => {
                    setPortals((portals) =>
                        portals.filter((portal) => portal !== p)
                    );
                },
            };
        };

        const factory: GroupPanelFrameworkComponentFactory = {
            content: {
                createComponent: (
                    id: string,
                    componentId: string,
                    component: React.FunctionComponent<IGroupPanelProps>
                ) => {
                    return new ReactPanelContentPart(componentId, component, {
                        addPortal,
                    });
                },
            },
            tab: {
                createComponent: (
                    id: string,
                    componentId: string,
                    component: React.FunctionComponent<IGroupPanelProps>
                ) => {
                    return new ReactPanelHeaderPart(componentId, component, {
                        addPortal,
                    });
                },
            },
        };

        const element = document.createElement('div');

        const layout = new ComponentDockview(element, {
            frameworkComponentFactory: factory,
            frameworkComponents: props.components,
            frameworkTabComponents: props.tabComponents,
            tabHeight: props.tabHeight,
            debug: props.debug,
            enableExternalDragEvents: props.enableExternalDragEvents,
            // orientation: props.orientation,
        });

        layoutReference.current = layout;
        domReference.current.appendChild(layoutReference.current.element);

        layout.deserializer = new ReactPanelDeserialzier(layout);

        layout.resizeToFit();

        if (props.serializedLayout) {
            layout.deserialize(props.serializedLayout);
        }

        if (props.onReady) {
            props.onReady({ api: layout });
        }

        return () => {
            layout.dispose();
        };
    }, []);

    React.useEffect(() => {
        const disposable = layoutReference.current.onTabContextMenu((event) => {
            props.onTabContextMenu(event);
        });

        return () => {
            disposable.dispose();
        };
    }, [props.onTabContextMenu]);

    React.useEffect(() => {
        layoutReference.current.setAutoResizeToFit(
            props.autoSizeToFitContainer
        );
    }, [props.autoSizeToFitContainer]);

    return (
        <div
            style={{
                // height: '100%',
                width: '100%',
            }}
            ref={domReference}
        >
            {portals}
        </div>
    );
};
DockviewComponent.displayName = 'DockviewComponent';
