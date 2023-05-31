import * as React from 'react';
import {
    DockviewComponent,
    DockviewDropEvent,
    DockviewDndOverlayEvent,
    GroupPanelFrameworkComponentFactory,
    IGroupControlRenderer,
    DockviewPanelApi,
    DockviewApi,
    IContentRenderer,
    ITabRenderer,
    DockviewGroupPanel,
} from 'dockview-core';
import { ReactPanelContentPart } from './reactContentPart';
import { ReactPanelHeaderPart } from './reactHeaderPart';

import { ReactPortalStore, usePortalsLifecycle } from '../react';
import { IWatermarkPanelProps, ReactWatermarkPart } from './reactWatermarkPart';
import { PanelCollection, PanelParameters } from '../types';
import {
    IDockviewGroupControlProps,
    ReactGroupControlsRendererPart,
} from './groupControlsRenderer';

function createGroupControlElement(
    component: React.FunctionComponent<IDockviewGroupControlProps> | undefined,
    store: ReactPortalStore
): ((groupPanel: DockviewGroupPanel) => IGroupControlRenderer) | undefined {
    return component
        ? (groupPanel: DockviewGroupPanel) => {
              return new ReactGroupControlsRendererPart(
                  component,
                  store,
                  groupPanel
              );
          }
        : undefined;
}

export interface IGroupPanelBaseProps<T extends { [index: string]: any } = any>
    extends PanelParameters<T> {
    api: DockviewPanelApi;
    containerApi: DockviewApi;
}

export type IDockviewPanelHeaderProps<
    T extends { [index: string]: any } = any
> = IGroupPanelBaseProps<T>;

export type IDockviewPanelProps<T extends { [index: string]: any } = any> =
    IGroupPanelBaseProps<T>;

export interface DockviewReadyEvent {
    api: DockviewApi;
}

export interface IDockviewReactProps {
    onReady: (event: DockviewReadyEvent) => void;
    components: PanelCollection<IDockviewPanelProps>;
    tabComponents?: PanelCollection<IDockviewPanelHeaderProps>;
    watermarkComponent?: React.FunctionComponent<IWatermarkPanelProps>;
    onDidDrop?: (event: DockviewDropEvent) => void;
    showDndOverlay?: (event: DockviewDndOverlayEvent) => boolean;
    hideBorders?: boolean;
    className?: string;
    disableAutoResizing?: boolean;
    defaultTabComponent?: React.FunctionComponent<IDockviewPanelHeaderProps>;
    groupControlComponent?: React.FunctionComponent<IDockviewGroupControlProps>;
    singleTabMode?: 'fullwidth' | 'default';
}

const DEFAULT_REACT_TAB = 'props.defaultTabComponent';

export const DockviewReact = React.forwardRef(
    (props: IDockviewReactProps, ref: React.ForwardedRef<HTMLDivElement>) => {
        const domRef = React.useRef<HTMLDivElement>(null);
        const dockviewRef = React.useRef<DockviewComponent>();
        const [portals, addPortal] = usePortalsLifecycle();

        React.useImperativeHandle(ref, () => domRef.current!, []);

        React.useEffect(() => {
            if (!domRef.current) {
                return () => {
                    // noop
                };
            }

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

            const frameworkTabComponents = props.tabComponents || {};

            if (props.defaultTabComponent) {
                frameworkTabComponents[DEFAULT_REACT_TAB] =
                    props.defaultTabComponent;
            }

            const dockview = new DockviewComponent({
                parentElement: domRef.current,
                frameworkComponentFactory: factory,
                frameworkComponents: props.components,
                frameworkTabComponents,
                watermarkFrameworkComponent: props.watermarkComponent,
                defaultTabComponent: props.defaultTabComponent
                    ? DEFAULT_REACT_TAB
                    : undefined,
                styles: props.hideBorders
                    ? { separatorBorder: 'transparent' }
                    : undefined,
                showDndOverlay: props.showDndOverlay,
                createGroupControlElement: createGroupControlElement(
                    props.groupControlComponent,
                    { addPortal }
                ),
                singleTabMode: props.singleTabMode,
            });

            const { clientWidth, clientHeight } = domRef.current;
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
            if (!dockviewRef.current) {
                return;
            }

            const frameworkTabComponents = props.tabComponents || {};

            if (props.defaultTabComponent) {
                frameworkTabComponents[DEFAULT_REACT_TAB] =
                    props.defaultTabComponent;
            }

            dockviewRef.current.updateOptions({
                defaultTabComponent: props.defaultTabComponent
                    ? DEFAULT_REACT_TAB
                    : undefined,
                frameworkTabComponents,
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
