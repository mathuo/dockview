import { IPanel, PanelInitParameters } from '../../panel/types';
import { IView, SplitViewOptions, LayoutPriority } from './splitview';
import { Constructor, FrameworkFactory } from '../../types';
import { SplitviewPanel } from '../splitviewPanel';
import { SplitviewApi } from '../../api/component.api';

export interface PanelViewInitParameters extends PanelInitParameters {
    minimumSize?: number;
    maximumSize?: number;
    snap?: boolean;
    priority?: LayoutPriority;
    containerApi: SplitviewApi;
}

export interface ISerializableView extends IView, IPanel {
    init: (params: PanelViewInitParameters) => void;
}

export interface SplitPanelOptions extends SplitViewOptions {
    components?: {
        [componentName: string]: SplitviewPanel;
    };
    frameworkComponents?: {
        [componentName: string]: any;
    };
    frameworkWrapper?: FrameworkFactory<SplitviewPanel>;
}

export interface ISerializableViewConstructor
    extends Constructor<ISerializableView> {}

export function createComponent<T>(
    id: string,
    componentName: string | Constructor<T> | any,
    components: {
        [componentName: string]: T;
    },
    frameworkComponents: {
        [componentName: string]: any;
    },
    createFrameworkComponent: (
        id: string,
        componentId: string,
        component: any
    ) => T
): T {
    const Component =
        typeof componentName === 'string'
            ? components[componentName]
            : componentName;
    const FrameworkComponent =
        typeof componentName === 'string'
            ? frameworkComponents[componentName]
            : componentName;
    if (Component && FrameworkComponent) {
        throw new Error(
            `cannot register component ${componentName} as both a component and frameworkComponent`
        );
    }
    if (FrameworkComponent) {
        if (!createFrameworkComponent) {
            throw new Error(
                'you must register a frameworkPanelWrapper to use framework components'
            );
        }
        const wrappedComponent = createFrameworkComponent(
            id,
            componentName,
            FrameworkComponent
        );
        return wrappedComponent;
    }

    return new Component() as T;
}
