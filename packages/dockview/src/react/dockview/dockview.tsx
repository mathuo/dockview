import * as React from 'react';
import {
    DockviewComponent,
    DockviewDropEvent,
} from '../../dockview/dockviewComponent';
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
import { IWatermarkPanelProps, ReactWatermarkPart } from './reactWatermarkPart';
import { PanelCollection, PanelParameters } from '../types';
import { watchElementResize } from '../../dom';
import { IContentRenderer, ITabRenderer } from '../../groupview/types';
import { DockviewDropTargets } from '../../groupview/dnd';

export interface IGroupPanelBaseProps<T extends {} = Record<string, any>>
    extends PanelParameters<T> {
    api: DockviewPanelApi;
    containerApi: DockviewApi;
}

export type IDockviewPanelHeaderProps<T extends {} = Record<string, any>> =
    IGroupPanelBaseProps<T>;

export type IDockviewPanelProps<T extends { [index: string]: any } = any> =
    IGroupPanelBaseProps<T>;

export interface DockviewReadyEvent {
    api: DockviewApi;
}

export interface IDockviewReactProps {
    components?: PanelCollection<IDockviewPanelProps>;
    tabComponents?: PanelCollection<IDockviewPanelHeaderProps>;
    watermarkComponent?: React.FunctionComponent<IWatermarkPanelProps>;
    onReady?: (event: DockviewReadyEvent) => void;
    debug?: boolean;
    tabHeight?: number;
    onTabContextMenu?: (event: TabContextMenuEvent) => void;
    onDidDrop?: (event: DockviewDropEvent) => void;
    showDndOverlay?: (event: DragEvent, target: DockviewDropTargets) => boolean;
    hideBorders?: boolean;
    className?: string;
    disableAutoResizing?: boolean;
}

export const DockviewReact = React.forwardRef(
    (props: IDockviewReactProps, ref: React.ForwardedRef<HTMLDivElement>) => {
        const domRef = React.useRef<HTMLDivElement>(null);
        const [dockview, setDockview] = React.useState<DockviewComponent>();
        const [portals, addPortal] = usePortalsLifecycle();

        React.useImperativeHandle(ref, () => domRef.current!, []);

        React.useEffect(() => {
            if (props.disableAutoResizing || !dockview) {
                return () => {
                    //
                };
            }

            const watcher = watchElementResize(domRef.current!, (entry) => {
                const { width, height } = entry.contentRect;
                dockview.layout(width, height);
            });

            return () => {
                watcher.dispose();
            };
        }, [dockview, props.disableAutoResizing]);

        React.useEffect(() => {
            const factory: GroupPanelFrameworkComponentFactory = {
                content: {
                    createComponent: (
                        id: string,
                        componentId: string,
                        component: React.FunctionComponent<IDockviewPanelProps>
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
                        component: React.FunctionComponent<IDockviewPanelHeaderProps>
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

            const component = new DockviewComponent(element, {
                frameworkComponentFactory: factory,
                frameworkComponents: props.components,
                frameworkTabComponents: props.tabComponents,
                tabHeight: props.tabHeight,
                debug: props.debug,
                watermarkFrameworkComponent: props.watermarkComponent,
                styles: props.hideBorders
                    ? { separatorBorder: 'transparent' }
                    : undefined,
            });

            domRef.current!.appendChild(component.element);
            component.deserializer = new ReactPanelDeserialzier(component);

            const { clientWidth, clientHeight } = domRef.current!;
            component.layout(clientWidth, clientHeight);

            if (props.onReady) {
                props.onReady({ api: new DockviewApi(component) });
            }

            setDockview(component);

            return () => {
                component.dispose();
                element.remove();
            };
        }, []);

        React.useEffect(() => {
            if (!dockview) {
                return;
            }
            dockview.updateOptions({
                frameworkComponents: props.components,
            });
        }, [dockview, props.components]);

        React.useEffect(() => {
            if (!dockview) {
                return;
            }
            dockview.updateOptions({
                watermarkFrameworkComponent: props.watermarkComponent,
            });
        }, [dockview, props.watermarkComponent]);

        React.useEffect(() => {
            if (!dockview) {
                return;
            }
            dockview.updateOptions({
                showDndOverlay: props.showDndOverlay,
            });
        }, [dockview, props.showDndOverlay]);

        React.useEffect(() => {
            if (!dockview) {
                return;
            }
            dockview.updateOptions({
                frameworkTabComponents: props.tabComponents,
            });
        }, [dockview, props.tabComponents]);

        React.useEffect(() => {
            if (!props.onTabContextMenu || !dockview) {
                return () => {
                    //noop
                };
            }

            const disposable = dockview.onTabContextMenu((event) => {
                if (props.onTabContextMenu) {
                    props.onTabContextMenu(event);
                }
            });

            return () => {
                disposable.dispose();
            };
        }, [dockview, props.onTabContextMenu]);

        React.useEffect(() => {
            if (!dockview) {
                return () => {
                    //
                };
            }

            const disposable = dockview.onDidDrop((event) => {
                if (props.onDidDrop) {
                    props.onDidDrop(event);
                }
            });

            return () => {
                disposable.dispose();
            };
        }, [dockview, props.onDidDrop]);

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
