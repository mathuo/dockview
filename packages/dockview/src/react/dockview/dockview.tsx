import * as React from 'react';
import { DockviewComponent } from '../../dockview/dockviewComponent';
import { ReactPanelContentPart } from './reactContentPart';
import { ReactPanelHeaderPart } from './reactHeaderPart';
import { ReactPanelDeserialzier } from '../deserializer';
import {
    GroupPanelFrameworkComponentFactory,
    TabContextMenuEvent,
} from '../../dockview/options';
import { DockviewPanelApi } from '../../api/groupPanelApi';
import { usePortalsLifecycle } from '../react';
import { DockviewApi } from '../../api/component.api';
import { ReactWatermarkPart } from './reactWatermarkPart';
import { PanelCollection } from '../types';
import { watchElementResize } from '../../dom';
import { IContentRenderer, ITabRenderer } from '../../groupview/types';

export interface IGroupPanelBaseProps {
    api: DockviewPanelApi;
    containerApi: DockviewApi;
    [key: string]: any;
}

export interface IDockviewPanelProps extends IGroupPanelBaseProps {
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

export interface IDockviewReactProps {
    components?: PanelCollection<IDockviewPanelProps>;
    tabComponents?: PanelCollection<IGroupPanelBaseProps>;
    watermarkComponent?: React.FunctionComponent<IWatermarkPanelProps>;
    onReady?: (event: DockviewReadyEvent) => void;
    debug?: boolean;
    tabHeight?: number;
    enableExternalDragEvents?: boolean;
    onTabContextMenu?: (event: TabContextMenuEvent) => void;
    hideBorders?: boolean;
    className?: string;
    disableAutoResizing?: boolean;
}

export const DockviewReact = React.forwardRef(
    (props: IDockviewReactProps, ref: React.ForwardedRef<HTMLDivElement>) => {
        const domRef = React.useRef<HTMLDivElement>(null);
        const dockviewRef = React.useRef<DockviewComponent>();
        const [portals, addPortal] = usePortalsLifecycle();

        React.useImperativeHandle(ref, () => domRef.current!, []);

        React.useEffect(() => {
            if (props.disableAutoResizing) {
                return () => {
                    //
                };
            }

            const watcher = watchElementResize(domRef.current!, (entry) => {
                const { width, height } = entry.contentRect;
                dockviewRef.current?.layout(width, height);
            });

            return () => {
                watcher.dispose();
            };
        }, [props.disableAutoResizing]);

        React.useEffect(() => {
            const factory: GroupPanelFrameworkComponentFactory = {
                content: {
                    createComponent: (
                        id: string,
                        componentId: string,
                        component: React.FunctionComponent<IGroupPanelBaseProps>
                    ): IContentRenderer => {
                        return new ReactPanelContentPart(
                            componentId,
                            component,
                            {
                                addPortal,
                            }
                        );
                    },
                },
                tab: {
                    createComponent: (
                        id: string,
                        componentId: string,
                        component: React.FunctionComponent<IGroupPanelBaseProps>
                    ): ITabRenderer => {
                        return new ReactPanelHeaderPart(
                            componentId,
                            component,
                            {
                                addPortal,
                            }
                        );
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

            const dockview = new DockviewComponent(element, {
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

            const { clientWidth, clientHeight } = domRef.current!;
            dockview.layout(clientWidth, clientHeight);

            if (props.onReady) {
                props.onReady({ api: new DockviewApi(dockview) });
            }

            dockviewRef.current = dockview;

            return () => {
                dockview.dispose();
            };
        }, []);

        React.useEffect(() => {
            if (!props.onTabContextMenu || !dockviewRef.current) {
                return () => {
                    //noop
                };
            }

            const disposable = dockviewRef.current.onTabContextMenu((event) => {
                if (props.onTabContextMenu) {
                    props.onTabContextMenu(event);
                }
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
    }
);
DockviewReact.displayName = 'DockviewComponent';
