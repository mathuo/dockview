import { FrameworkFactory } from '../types';

export function createComponent<T>(
    id: string,
    componentName: string,
    components: {
        [componentName: string]: { new (id: string, component: string): T };
    },
    frameworkComponents: {
        [componentName: string]: any;
    } = {},
    createFrameworkComponent?: FrameworkFactory<T>,
    fallback?: () => T
): T {
    const Component = components[componentName];
    const FrameworkComponent = frameworkComponents[componentName];

    if (Component && FrameworkComponent) {
        throw new Error(
            `Cannot create '${id}'. component '${componentName}' registered as both a component and frameworkComponent`
        );
    }
    if (FrameworkComponent) {
        if (!createFrameworkComponent) {
            throw new Error(
                `Cannot create '${id}' for framework component '${componentName}'. you must register a frameworkPanelWrapper to use framework components`
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
        throw new Error(
            `Cannot create '${id}', no component '${componentName}' provided`
        );
    }

    return new Component(id, componentName) as T;
}
