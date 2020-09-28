import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { IDisposable } from '../lifecycle';
import { sequentialNumberGenerator } from '../math';
import { IBaseViewApi } from '../api/api';

interface IPanelWrapperProps {
    component: React.FunctionComponent<{}>;
    componentProps: { [key: string]: any };
}

interface IPanelWrapperRef {
    update: (props: { [key: string]: any }) => void;
}

const PanelWrapper = React.forwardRef(
    (props: IPanelWrapperProps, ref: React.RefObject<IPanelWrapperRef>) => {
        const [_, triggerRender] = React.useState<number>();
        const _props = React.useRef<{ [key: string]: any }>(
            props.componentProps
        );

        React.useImperativeHandle(
            ref,
            () => ({
                update: (props: { [key: string]: any }) => {
                    _props.current = { ..._props.current, ...props };
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
    }
);
PanelWrapper.displayName = 'PanelWrapper';

/**
 * Since we are storing the React.Portal references in a rendered array they
 * require a key property like any other React elements rendered in an array
 * to prevent excessive re-rendering
 */
const uniquePortalKeyGenerator = sequentialNumberGenerator();

export interface IFrameworkPart extends IDisposable {
    update(params: {}): void;
}

export class ReactPart<P> implements IFrameworkPart {
    private componentInstance: IPanelWrapperRef;
    private ref: { portal: React.ReactPortal; disposable: IDisposable };
    private disposed: boolean;

    constructor(
        private readonly parent: HTMLElement,
        private readonly api: IBaseViewApi,
        private readonly addPortal: (portal: React.ReactPortal) => IDisposable,
        private readonly component: React.FunctionComponent<P>,
        private readonly parameters: { [key: string]: any }
    ) {
        this.createPortal();
    }

    public update(props: {}) {
        if (this.disposed) {
            throw new Error('invalid operation');
        }

        this.componentInstance?.update(props);
    }

    private createPortal() {
        if (this.disposed) {
            throw new Error('invalid operation');
        }

        let props = {
            api: this.api,
            ...this.parameters,
        } as any;

        // TODO use a better check for isReactFunctionalComponent
        if (typeof this.component !== 'function') {
            /**
             * we know this isn't a React.FunctionComponent so throw an error here.
             * if we do not intercept this the React library will throw a very obsure error
             * for the same reason.
             */
            throw new Error('invalid operation');
        }

        const wrapper = React.createElement(PanelWrapper, {
            component: this.component,
            componentProps: props,
            ref: (element: any) => {
                this.componentInstance = element;
            },
        });
        const portal = ReactDOM.createPortal(
            wrapper,
            this.parent,
            uniquePortalKeyGenerator.next()
        );

        this.ref = {
            portal,
            disposable: this.addPortal(portal),
        };
    }

    public dispose() {
        this.ref?.disposable?.dispose();
        this.ref = undefined;
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
                    throw new Error('invalid operation');
                }
                disposed = true;
                setPortals((portals) => portals.filter((p) => p !== portal));
            },
        };
    }, []);

    return [portals, addPortal];
};
