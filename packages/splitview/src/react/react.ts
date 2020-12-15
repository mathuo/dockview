import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { IDisposable } from '../lifecycle';
import { sequentialNumberGenerator } from '../math';
import { IFrameworkPart } from '../panel/types';

export interface ReactPortalStore {
    addPortal: (portal: React.ReactPortal) => IDisposable;
}

interface IPanelWrapperProps {
    component: React.FunctionComponent<{ [key: string]: any }>;
    componentProps: { [key: string]: any };
}

interface IPanelWrapperRef {
    update: (props: { [key: string]: any }) => void;
}

/**
 * This component is intended to interface between vanilla-js and React hence we need to be
 * creative in how we update props.
 * A ref of the component is exposed with an update method; which when called stores the props
 * as a ref within this component and forcefully triggers a re-render of the component using
 * the ref of props we just set on the renderered component as the props passed to the inner
 * component
 */
const ReactComponentBridge: React.ForwardRefRenderFunction<
    IPanelWrapperRef,
    IPanelWrapperProps
> = (props, ref) => {
    const [_, triggerRender] = React.useState<number>();
    const _props = React.useRef<object>(props.componentProps);

    React.useImperativeHandle(
        ref,
        () => ({
            update: (props: object) => {
                _props.current = { ..._props.current, ...props };
                /**
                 * setting a arbitrary piece of state within this component will
                 * trigger a re-render.
                 * we use this rather than updating through a prop since we can
                 * pass a ref into the vanilla-js world.
                 */
                triggerRender(Date.now());
            },
        }),
        []
    );

    React.useEffect(() => {
        console.debug('[reactwrapper] component mounted ');
        return () => {
            console.debug('[reactwrapper] component unmounted ');
        };
    }, []);

    return React.createElement(props.component, _props.current);
};
ReactComponentBridge.displayName = 'PanelWrapper';

/**
 * Since we are storing the React.Portal references in a rendered array they
 * require a key property like any other React element rendered in an array
 * to prevent excessive re-rendering
 */
const uniquePortalKeyGenerator = sequentialNumberGenerator();

export class ReactPart<P extends object> implements IFrameworkPart {
    private componentInstance: IPanelWrapperRef;
    private ref?: { portal: React.ReactPortal; disposable: IDisposable };
    private disposed = false;

    constructor(
        private readonly parent: HTMLElement,
        private readonly portalStore: ReactPortalStore,
        private readonly component: React.FunctionComponent<P>,
        private readonly parameters: P
    ) {
        this.createPortal();
    }

    public update(props: { [index: string]: any }) {
        if (this.disposed) {
            throw new Error('invalid operation: resource is already disposed');
        }

        this.componentInstance?.update(props);
    }

    private createPortal() {
        if (this.disposed) {
            throw new Error('invalid operation: resource is already disposed');
        }

        // TODO use a better check for isReactFunctionalComponent
        if (typeof this.component !== 'function') {
            /**
             * we know this isn't a React.FunctionComponent so throw an error here.
             * if we do not intercept this the React library will throw a very obsure error
             * for the same reason, at least at this point we will emit a sensible stacktrace.
             */
            throw new Error(
                'invalid operation: only functional components are supported'
            );
        }

        const bridgeComponent = React.createElement(
            React.forwardRef(ReactComponentBridge),
            {
                component: (this
                    .component as unknown) as React.FunctionComponent<{}>,
                componentProps: (this.parameters as unknown) as {},
                ref: (element: IPanelWrapperRef) => {
                    this.componentInstance = element;
                },
            }
        );
        const portal = ReactDOM.createPortal(
            bridgeComponent,
            this.parent,
            uniquePortalKeyGenerator.next()
        );

        this.ref = {
            portal,
            disposable: this.portalStore.addPortal(portal),
        };
    }

    public dispose() {
        this.ref?.disposable.dispose();
        this.disposed = true;
    }
}

type PortalLifecycleHook = () => [
    React.ReactPortal[],
    (portal: React.ReactPortal) => IDisposable
];

/**
 * A React Hook that returns an array of portals to be rendered by the user of this hook
 * and a disposable function to add a portal. Calling dispose removes this portal from the
 * portal array
 */
export const usePortalsLifecycle: PortalLifecycleHook = () => {
    const [portals, setPortals] = React.useState<React.ReactPortal[]>([]);

    React.useDebugValue(`Portal count: ${portals.length}`);

    const addPortal = React.useCallback((portal: React.ReactPortal) => {
        setPortals((portals) => [...portals, portal]);
        let disposed = false;
        return {
            dispose: () => {
                if (disposed) {
                    throw new Error(
                        'invalid operation: resource already disposed'
                    );
                }
                disposed = true;
                setPortals((portals) => portals.filter((p) => p !== portal));
            },
        };
    }, []);

    return [portals, addPortal];
};
