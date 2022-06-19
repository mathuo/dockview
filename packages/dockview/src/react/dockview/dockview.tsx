import * as React from 'react';
import {
    DockviewComponent,
    DockviewDropEvent,
} from '../../dockview/dockviewComponent';
import { ReactPanelContentPart } from './reactContentPart';
import { ReactPanelHeaderPart } from './reactHeaderPart';
import { ReactPanelDeserialzier } from '../deserializer';
import {
    DockviewDndOverlayEvent,
    GroupPanelFrameworkComponentFactory,
    TabContextMenuEvent,
} from '../../dockview/options';
import { DockviewPanelApi } from '../../api/groupPanelApi';
import { ReactPortalStore, usePortalsLifecycle } from '../react';
import { DockviewApi } from '../../api/component.api';
import { IWatermarkPanelProps, ReactWatermarkPart } from './reactWatermarkPart';
import { PanelCollection, PanelParameters } from '../types';
import { watchElementResize } from '../../dom';
import { IContentRenderer, ITabRenderer } from '../../groupview/types';
import {
    IDockviewGroupControlProps,
    IGroupControlRenderer,
    ReactGroupControlsRendererPart,
} from './groupControlsRenderer';
import { GroupPanel } from '../../groupview/groupviewPanel';
import { DEFAULT_TAB_IDENTIFIER } from '../../dockview/components/tab/defaultTab';

function createGroupControlElement(
    component: React.FunctionComponent<IDockviewGroupControlProps> | undefined,
    store: ReactPortalStore
): ((groupPanel: GroupPanel) => IGroupControlRenderer) | undefined {
    return component
        ? (groupPanel: GroupPanel) => {
              return new ReactGroupControlsRendererPart(
                  component,
                  store,
                  groupPanel
              );
          }
        : undefined;
}

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
    components: PanelCollection<IDockviewPanelProps>;
    tabComponents?: PanelCollection<IDockviewPanelHeaderProps>;
    watermarkComponent?: React.FunctionComponent<IWatermarkPanelProps>;
    onReady: (event: DockviewReadyEvent) => void;
    tabHeight?: number;
    onTabContextMenu?: (event: TabContextMenuEvent) => void;
    onDidDrop?: (event: DockviewDropEvent) => void;
    showDndOverlay?: (event: DockviewDndOverlayEvent) => boolean;
    hideBorders?: boolean;
    className?: string;
    disableAutoResizing?: boolean;
    defaultTabComponent?: React.FunctionComponent<IDockviewPanelHeaderProps>;
    groupControlComponent?: React.FunctionComponent<IDockviewGroupControlProps>;
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
                        _id: string,
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
                        _id: string,
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
                        _id: string,
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
                frameworkTabComponents: {
                    ...(props.tabComponents || {}),
                    [DEFAULT_TAB_IDENTIFIER]: props.defaultTabComponent,
                },
                tabHeight: props.tabHeight,
                watermarkFrameworkComponent: props.watermarkComponent,
                defaultTabComponent: DEFAULT_TAB_IDENTIFIER,
                styles: props.hideBorders
                    ? { separatorBorder: 'transparent' }
                    : undefined,
                showDndOverlay: props.showDndOverlay,
                createGroupControlElement: createGroupControlElement(
                    props.groupControlComponent,
                    { addPortal }
                ),
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
                element.remove();
            };
        }, []);

        React.useEffect(() => {
            if (!dockviewRef.current) {
                return () => {
                    // noop
                };
            }

            const disposable = dockviewRef.current.onDidDrop((event) => {
                if (props.onDidDrop) {
                    props.onDidDrop(event);
                }
            });

            return () => {
                disposable.dispose();
            };
        }, [props.onDidDrop]);

        React.useEffect(() => {
            if (!dockviewRef.current) {
                return;
            }
            dockviewRef.current.updateOptions({
                frameworkComponents: props.components,
            });
        }, [props.components]);

        React.useEffect(() => {
            if (!dockviewRef.current) {
                return;
            }
            dockviewRef.current.updateOptions({
                watermarkFrameworkComponent: props.watermarkComponent,
            });
        }, [props.watermarkComponent]);

        React.useEffect(() => {
            if (!dockviewRef.current) {
                return;
            }
            dockviewRef.current.updateOptions({
                showDndOverlay: props.showDndOverlay,
            });
        }, [props.showDndOverlay]);

        React.useEffect(() => {
            if (!dockviewRef.current) {
                return;
            }
            dockviewRef.current.updateOptions({
                frameworkTabComponents: props.tabComponents,
            });
        }, [props.tabComponents]);

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

        React.useEffect(() => {
            if (!dockviewRef.current) {
                return;
            }
            dockviewRef.current.updateOptions({
                defaultTabComponent: DEFAULT_TAB_IDENTIFIER,
                frameworkTabComponents: {
                    ...(props.tabComponents || {}),
                    [DEFAULT_TAB_IDENTIFIER]: props.defaultTabComponent,
                },
            });
        }, [props.defaultTabComponent]);

        React.useEffect(() => {
            if (!dockviewRef.current) {
                return;
            }
            dockviewRef.current.updateOptions({
                createGroupControlElement: createGroupControlElement(
                    props.groupControlComponent,
                    { addPortal }
                ),
            });
        }, [props.groupControlComponent]);

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
