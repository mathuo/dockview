import * as React from 'react';
import { ComponentDockview } from '../../dockview/componentDockview';
import { ReactPanelContentPart } from './reactContentPart';
import { ReactPanelHeaderPart } from './reactHeaderPart';
import { ReactPanelDeserialzier } from '../deserializer';
import {
    GroupPanelFrameworkComponentFactory,
    TabContextMenuEvent,
} from '../../dockview/options';
import { IGroupPanelApi } from '../../api/groupPanelApi';
import { usePortalsLifecycle } from '../react';
import { DockviewApi } from '../../api/component.api';
import { ReactWatermarkPart } from './reactWatermarkPart';

export interface IGroupPanelProps {
    api: IGroupPanelApi;
    containerApi: DockviewApi;
}

export interface DockviewReadyEvent {
    api: DockviewApi;
}

export interface IWatermarkPanelProps {
    containerApi: DockviewApi;
    close(): void;
}

export interface IDockviewComponentProps {
    components?: {
        [componentName: string]: React.FunctionComponent<IGroupPanelProps>;
    };
    tabComponents?: {
        [componentName: string]: React.FunctionComponent<IGroupPanelProps>;
    };
    watermarkComponent?: React.FunctionComponent<IWatermarkPanelProps>;
    onReady?: (event: DockviewReadyEvent) => void;
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
            watermark: {
                createComponent: (
                    id: string,
                    componentId: string,
                    component: React.FunctionComponent<{}>
                ) => {
                    return new ReactWatermarkPart(componentId, component, {
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
            watermarkFrameworkComponent: props.watermarkComponent,
        });

        domRef.current?.appendChild(dockview.element);
        dockview.deserializer = new ReactPanelDeserialzier(dockview);

        dockview.resizeToFit();

        if (props.onReady) {
            props.onReady({ api: new DockviewApi(dockview) });
        }

        dockviewRef.current = dockview;

        return () => {
            dockview.dispose();
        };
    }, []);

    React.useEffect(() => {
        if (!props.onTabContextMenu) {
            return () => {
                //noop
            };
        }

        const disposable = dockviewRef.current.onTabContextMenu((event) => {
            props.onTabContextMenu(event);
        });

        return () => {
            disposable.dispose();
        };
    }, [props.onTabContextMenu]);

    return (
        <div style={{ height: '100%', width: '100%' }} ref={domRef}>
            {portals}
        </div>
    );
};
DockviewComponent.displayName = 'DockviewComponent';
