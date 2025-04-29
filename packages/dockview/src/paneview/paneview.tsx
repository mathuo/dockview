import React from 'react';
import {
    PaneviewPanelApi,
    PaneviewApi,
    PaneviewDropEvent,
    createPaneview,
    PaneviewOptions,
    PROPERTY_KEYS_PANEVIEW,
    PaneviewComponentOptions,
    PaneviewFrameworkOptions,
} from 'dockview-core';
import { usePortalsLifecycle } from '../react';
import { PanePanelSection } from './view';
import { PanelParameters } from '../types';

export interface PaneviewReadyEvent {
    api: PaneviewApi;
}

export interface IPaneviewPanelProps<T extends { [index: string]: any } = any>
    extends PanelParameters<T> {
    api: PaneviewPanelApi;
    containerApi: PaneviewApi;
    title: string;
}

export interface IPaneviewReactProps extends PaneviewOptions {
    onReady: (event: PaneviewReadyEvent) => void;
    components: Record<string, React.FunctionComponent<IPaneviewPanelProps>>;
    headerComponents?: Record<
        string,
        React.FunctionComponent<IPaneviewPanelProps>
    >;
    onDidDrop?(event: PaneviewDropEvent): void;
}

function extractCoreOptions(props: IPaneviewReactProps): PaneviewOptions {
    const coreOptions = PROPERTY_KEYS_PANEVIEW.reduce((obj, key) => {
        if (key in props) {
            obj[key] = props[key] as any;
        }
        return obj;
    }, {} as Partial<PaneviewComponentOptions>);

    return coreOptions as PaneviewOptions;
}

export const PaneviewReact = React.forwardRef(
    (props: IPaneviewReactProps, ref: React.ForwardedRef<HTMLDivElement>) => {
        const domRef = React.useRef<HTMLDivElement>(null);
        const paneviewRef = React.useRef<PaneviewApi>();
        const [portals, addPortal] = usePortalsLifecycle();

        React.useImperativeHandle(ref, () => domRef.current!, []);

        const prevProps = React.useRef<Partial<IPaneviewReactProps>>({});

        React.useEffect(
            () => {
                const changes: Partial<PaneviewOptions> = {};

                PROPERTY_KEYS_PANEVIEW.forEach((propKey) => {
                    const key = propKey;
                    const propValue = props[key];

                    if (key in props && propValue !== prevProps.current[key]) {
                        changes[key] = propValue as any;
                    }
                });

                if (paneviewRef.current) {
                    paneviewRef.current.updateOptions(changes);
                } else {
                    // not yet fully initialized
                }

                prevProps.current = props;
            },
            PROPERTY_KEYS_PANEVIEW.map((key) => props[key])
        );

        React.useEffect(() => {
            if (!domRef.current) {
                return () => {
                    // noop
                };
            }

            const headerComponents = props.headerComponents ?? {};

            const frameworkOptions: PaneviewFrameworkOptions = {
                createComponent: (options) => {
                    return new PanePanelSection(
                        options.id,
                        props.components[options.name],
                        { addPortal }
                    );
                },
                createHeaderComponent: (options) => {
                    return new PanePanelSection(
                        options.id,
                        headerComponents[options.name],
                        { addPortal }
                    );
                },
            };

            const api = createPaneview(domRef.current, {
                ...extractCoreOptions(props),
                ...frameworkOptions,
            });

            const { clientWidth, clientHeight } = domRef.current;
            api.layout(clientWidth, clientHeight);

            if (props.onReady) {
                props.onReady({ api });
            }

            paneviewRef.current = api;

            return () => {
                paneviewRef.current = undefined;
                api.dispose();
            };
        }, []);

        React.useEffect(() => {
            if (!paneviewRef.current) {
                return;
            }
            paneviewRef.current.updateOptions({
                createComponent: (options) => {
                    return new PanePanelSection(
                        options.id,
                        props.components[options.name],
                        { addPortal }
                    );
                },
            });
        }, [props.components]);

        React.useEffect(() => {
            if (!paneviewRef.current) {
                return;
            }

            const headerComponents = props.headerComponents ?? {};

            paneviewRef.current.updateOptions({
                createHeaderComponent: (options) => {
                    return new PanePanelSection(
                        options.id,
                        headerComponents[options.name],
                        { addPortal }
                    );
                },
            });
        }, [props.headerComponents]);

        React.useEffect(() => {
            if (!paneviewRef.current) {
                return () => {
                    // noop
                };
            }

            const disposable = paneviewRef.current.onDidDrop((event) => {
                if (props.onDidDrop) {
                    props.onDidDrop(event);
                }
            });

            return () => {
                disposable.dispose();
            };
        }, [props.onDidDrop]);

        return (
            <div style={{ height: '100%', width: '100%' }} ref={domRef}>
                {portals}
            </div>
        );
    }
);
PaneviewReact.displayName = 'PaneviewComponent';
