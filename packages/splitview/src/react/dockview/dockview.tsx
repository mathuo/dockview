import * as React from 'react';
import { ComponentDockview } from '../../dockview/componentDockview';
import {
    IGroupPanelActionbarProps,
    ReactPanelContentPart,
} from './reactContentPart';
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
import { PanelCollection } from '../types';
import { IDisposable } from '../../lifecycle';

export interface ActionsbarReference<P> extends IDisposable {
    update(params: Partial<P>): void;
}

export interface IGroupPanelBaseProps {
    api: IGroupPanelApi;
    containerApi: DockviewApi;
    [key: string]: any;
}

export interface IGroupPanelProps extends IGroupPanelBaseProps {
    setActionsbar<P>(
        component: React.FunctionComponent<IGroupPanelActionbarProps & P>,
        props: P
    ): ActionsbarReference<IGroupPanelActionbarProps & P>;
    [key: string]: any;
}

export interface DockviewReadyEvent {
    api: DockviewApi;
}

export interface IWatermarkPanelProps {
    containerApi: DockviewApi;
    close(): void;
    [key: string]: any;
}

export interface IDockviewComponentProps {
    components?: PanelCollection<IGroupPanelProps>;
    tabComponents?: PanelCollection<IGroupPanelBaseProps>;
    watermarkComponent?: React.FunctionComponent<IWatermarkPanelProps>;
    onReady?: (event: DockviewReadyEvent) => void;
    debug?: boolean;
    tabHeight?: number;
    enableExternalDragEvents?: boolean;
    onTabContextMenu?: (event: TabContextMenuEvent) => void;
    hideBorders?: boolean;
    className?: string;
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
                    component: React.FunctionComponent<IGroupPanelBaseProps>
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
                    component: React.FunctionComponent<IGroupPanelBaseProps>
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
            styles: props.hideBorders
                ? { separatorBorder: 'transparent' }
                : undefined,
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
        <div
            className={props.className}
            style={{ height: '100%', width: '100%' }}
            ref={domRef}
        >
            {portals}
        </div>
    );
};
DockviewComponent.displayName = 'DockviewComponent';
