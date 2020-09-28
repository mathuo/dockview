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
import { usePortalsLifecycle } from '../react';

export interface IGroupPanelProps {
    api: IGroupPanelApi;
}

export interface DockviewReadyEvent {
    api: Api;
}

export interface ReactPortalStore {
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
    const domRef = React.useRef<HTMLDivElement>();
    const dockviewRef = React.useRef<ComponentDockview>();

    const [portals, addPortal] = usePortalsLifecycle();

    React.useEffect(() => {
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

        const dockview = new ComponentDockview(element, {
            frameworkComponentFactory: factory,
            frameworkComponents: props.components,
            frameworkTabComponents: props.tabComponents,
            tabHeight: props.tabHeight,
            debug: props.debug,
            enableExternalDragEvents: props.enableExternalDragEvents,
            // orientation: props.orientation,
        });

        domRef.current.appendChild(dockview.element);
        dockview.deserializer = new ReactPanelDeserialzier(dockview);

        if (props.serializedLayout) {
            dockview.deserialize(props.serializedLayout);
        }

        dockview.resizeToFit();

        if (props.onReady) {
            props.onReady({ api: dockview });
        }

        dockviewRef.current = dockview;

        return () => {
            dockview.dispose();
        };
    }, []);

    React.useEffect(() => {
        const disposable = dockviewRef.current.onTabContextMenu((event) => {
            props.onTabContextMenu(event);
        });

        return () => {
            disposable.dispose();
        };
    }, [props.onTabContextMenu]);

    React.useEffect(() => {
        dockviewRef.current.setAutoResizeToFit(props.autoSizeToFitContainer);
    }, [props.autoSizeToFitContainer]);

    return (
        <div
            style={{
                // height: '100%',
                width: '100%',
            }}
            ref={domRef}
        >
            {portals}
        </div>
    );
};
DockviewComponent.displayName = 'DockviewComponent';
