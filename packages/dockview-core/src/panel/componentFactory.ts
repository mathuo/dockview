export interface FrameworkFactory<T> {
    createComponent: (id: string, componentId: string, component: any) => T;
}

export type ComponentConstructor<T> = {
    new (id: string, component: string): T;
};

export function createComponent<T>(
    id: string,
    componentName?: string,
    components: {
        [componentName: string]: ComponentConstructor<T>;
    } = {},
    frameworkComponents: {
        [componentName: string]: any;
    } = {},
    createFrameworkComponent?: FrameworkFactory<T>,
    fallback?: () => T
): T {
    const Component =
        typeof componentName === 'string'
            ? components[componentName]
            : undefined;
    const FrameworkComponent =
        typeof componentName === 'string'
            ? frameworkComponents[componentName]
            : undefined;

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
        return createFrameworkComponent.createComponent(
            id,
            componentName!,
            FrameworkComponent
        );
    }

    if (!Component) {
        if (fallback) {
            return fallback();
        }
        throw new Error(
            `Cannot create '${id}', no component '${componentName}' provided`
        );
    }

    return new Component(id, componentName!);
}
