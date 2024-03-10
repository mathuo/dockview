import * as React from 'react';
import {
    DockviewComponent,
    DockviewWillDropEvent,
    GroupPanelFrameworkComponentFactory,
    DockviewApi,
    IContentRenderer,
    ITabRenderer,
    DockviewGroupPanel,
    IHeaderActionsRenderer,
    DockviewDidDropEvent,
    IWatermarkPanelProps,
    IDockviewHeaderActionsProps,
    IDockviewPanelHeaderProps,
    IDockviewPanelProps,
    DockviewOptions,
    PROPERTY_KEYS,
    DockviewComponentOptions,
    DockviewFrameworkOptions,
    IDockviewDisposable,
    DockviewDndOverlayEvent,
    DockviewReadyEvent,
} from 'dockview-core';
import { ReactPanelContentPart } from './reactContentPart';
import { ReactPanelHeaderPart } from './reactHeaderPart';

import { ReactPortalStore, usePortalsLifecycle } from '../react';
import { ReactWatermarkPart } from './reactWatermarkPart';
import { ReactHeaderActionsRendererPart } from './headerActionsRenderer';

function createGroupControlElement(
    component: React.FunctionComponent<IDockviewHeaderActionsProps> | undefined,
    store: ReactPortalStore
): ((groupPanel: DockviewGroupPanel) => IHeaderActionsRenderer) | undefined {
    return component
        ? (groupPanel: DockviewGroupPanel) => {
              return new ReactHeaderActionsRendererPart(
                  component,
                  store,
                  groupPanel
              );
          }
        : undefined;
}

const DEFAULT_REACT_TAB = 'props.defaultTabComponent';

export interface IDockviewReactProps extends DockviewOptions {
    className?: string;
    tabComponents?: Record<
        string,
        React.FunctionComponent<IDockviewPanelHeaderProps>
    >;
    components: Record<string, React.FunctionComponent<IDockviewPanelProps>>;
    watermarkComponent?: React.FunctionComponent<IWatermarkPanelProps>;
    defaultTabComponent?: React.FunctionComponent<IDockviewPanelHeaderProps>;
    rightHeaderActionsComponent?: React.FunctionComponent<IDockviewHeaderActionsProps>;
    leftHeaderActionsComponent?: React.FunctionComponent<IDockviewHeaderActionsProps>;
    prefixHeaderActionsComponent?: React.FunctionComponent<IDockviewHeaderActionsProps>;
    //
    onReady: (event: DockviewReadyEvent) => void;
    onDidDrop?: (event: DockviewDidDropEvent) => void;
    onWillDrop?: (event: DockviewWillDropEvent) => void;
    showDndOverlay?: (event: DockviewDndOverlayEvent) => boolean;
}

function extractCoreOptions(props: IDockviewReactProps): DockviewOptions {
    const coreOptions = (PROPERTY_KEYS as (keyof DockviewOptions)[]).reduce(
        (obj, key) => {
            obj[key] = props[key] as any;
            return obj;
        },
        {} as Partial<DockviewComponentOptions>
    );

    return coreOptions as DockviewOptions;
}

function createFrameworkFactory(
    addPortal: (portal: React.ReactPortal) => IDockviewDisposable
): GroupPanelFrameworkComponentFactory {
    return {
        content: {
            createComponent: (
                _id: string,
                componentId: string,
                component: React.FunctionComponent<IDockviewPanelProps>
            ): IContentRenderer => {
                return new ReactPanelContentPart(componentId, component, {
                    addPortal,
                });
            },
        },
        tab: {
            createComponent: (
                _id: string,
                componentId: string,
                component: React.FunctionComponent<IDockviewPanelHeaderProps>
            ): ITabRenderer => {
                return new ReactPanelHeaderPart(componentId, component, {
                    addPortal,
                });
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
}

export const DockviewReact = React.forwardRef(
    (props: IDockviewReactProps, ref: React.ForwardedRef<HTMLDivElement>) => {
        const domRef = React.useRef<HTMLDivElement>(null);
        const dockviewRef = React.useRef<DockviewComponent>();
        const [portals, addPortal] = usePortalsLifecycle();

        React.useImperativeHandle(ref, () => domRef.current!, []);

        const prevProps = React.useRef<Partial<IDockviewReactProps>>({});

        React.useEffect(() => {
            const changes: Partial<DockviewOptions> = {};

            Object.keys(PROPERTY_KEYS).forEach((propKey) => {
                const key = propKey as keyof DockviewOptions;
                const propValue = props[key];

                if (propValue !== prevProps.current[key]) {
                    changes[key] = propValue as any;
                }
            });

            if (dockviewRef.current) {
                dockviewRef.current.updateOptions(changes);
            } else {
                // not yet fully initialized
            }
        }, PROPERTY_KEYS.map((key) => props[key]).filter(Boolean));

        React.useEffect(() => {
            if (!domRef.current) {
                return;
            }

            const frameworkTabComponents = props.tabComponents ?? {};

            if (props.defaultTabComponent) {
                frameworkTabComponents[DEFAULT_REACT_TAB] =
                    props.defaultTabComponent;
            }

            const frameworkOptions: DockviewFrameworkOptions = {
                headerLeftActionComponent: createGroupControlElement(
                    props.leftHeaderActionsComponent,
                    { addPortal }
                ),
                headerRightActionComponent: createGroupControlElement(
                    props.rightHeaderActionsComponent,
                    { addPortal }
                ),
                headerPrefixActionComponent: createGroupControlElement(
                    props.prefixHeaderActionsComponent,
                    { addPortal }
                ),
                frameworkTabComponents,
                frameworkComponents: props.components,
                frameworkComponentFactory: createFrameworkFactory(addPortal),
                parentElement: domRef.current,
                defaultTabComponent: props.defaultTabComponent
                    ? DEFAULT_REACT_TAB
                    : undefined,
                watermarkFrameworkComponent: props.watermarkComponent,
            };

            const dockview = new DockviewComponent({
                ...extractCoreOptions(props),
                ...frameworkOptions,
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
                return () => {
                    // noop
                };
            }

            const disposable = dockviewRef.current.onUnhandledDragOverEvent(
                (event) => {
                    if (props.showDndOverlay?.(event)) {
                        event.accept();
                    }
                }
            );

            return () => {
                disposable.dispose();
            };
        }, [props.showDndOverlay]);

        React.useEffect(() => {
            if (!dockviewRef.current) {
                return () => {
                    // noop
                };
            }

            const disposable = dockviewRef.current.onWillDrop((event) => {
                if (props.onWillDrop) {
                    props.onWillDrop(event);
                }
            });

            return () => {
                disposable.dispose();
            };
        }, [props.onWillDrop]);

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

            const frameworkTabComponents = props.tabComponents ?? {};

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
        }, [props.tabComponents, props.defaultTabComponent]);

        React.useEffect(() => {
            if (!dockviewRef.current) {
                return;
            }
            dockviewRef.current.updateOptions({
                headerRightActionComponent: createGroupControlElement(
                    props.rightHeaderActionsComponent,
                    { addPortal }
                ),
            });
        }, [props.rightHeaderActionsComponent]);

        React.useEffect(() => {
            if (!dockviewRef.current) {
                return;
            }
            dockviewRef.current.updateOptions({
                headerLeftActionComponent: createGroupControlElement(
                    props.leftHeaderActionsComponent,
                    { addPortal }
                ),
            });
        }, [props.leftHeaderActionsComponent]);

        React.useEffect(() => {
            if (!dockviewRef.current) {
                return;
            }
            dockviewRef.current.updateOptions({
                headerRightActionComponent: createGroupControlElement(
                    props.prefixHeaderActionsComponent,
                    { addPortal }
                ),
            });
        }, [props.prefixHeaderActionsComponent]);

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
