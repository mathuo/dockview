import { FrameworkFactory } from '../types';

export function createComponent<T>(
    id: string,
    componentName: string,
    components: {
        [componentName: string]: { new (id: string, component: string): T };
    },
    frameworkComponents: {
        [componentName: string]: any;
    },
    createFrameworkComponent?: FrameworkFactory<T>,
    fallback?: () => T
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
        const wrappedComponent = createFrameworkComponent.createComponent(
            id,
            componentName,
            FrameworkComponent
        );
        return wrappedComponent;
    }

    if (!Component) {
        if (fallback) {
            return fallback();
        }
        throw new Error('invalid component');
    }

    return new Component(id, componentName) as T;
}
