import {
    PanelContentPart,
    PanelContentPartConstructor,
    PanelHeaderPart,
    PanelHeaderPartConstructor,
    WatermarkConstructor,
    WatermarkPart,
} from '../groupview/types';
import { FrameworkFactory } from '../types';
import { DefaultTab } from './components/tab/defaultTab';

export function createWatermarkComponent(
    component: WatermarkConstructor,
    frameworkComponent: any,
    createFrameworkComponent: FrameworkFactory<WatermarkPart>
) {
    if (component && frameworkComponent) {
        throw new Error(
            `cannot register watermark as both a component and frameworkComponent`
        );
    }

    if (frameworkComponent) {
        if (!createFrameworkComponent) {
            throw new Error(
                'you must register a frameworkPanelWrapper to use framework components'
            );
        }
        const wrappedComponent = createFrameworkComponent.createComponent(
            'watermark-id',
            'watermark-name',
            frameworkComponent
        );
        return wrappedComponent;
    }
    return new component() as WatermarkPart;
}

export function createContentComponent(
    id: string,
    componentName: string | PanelContentPartConstructor | any,
    components: {
        [componentName: string]: PanelContentPartConstructor;
    },
    frameworkComponents: {
        [componentName: string]: any;
    },
    createFrameworkComponent: FrameworkFactory<PanelContentPart>
): PanelContentPart {
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
    return new Component() as PanelContentPart;
}

export function createTabComponent(
    id: string,
    componentName: string | PanelHeaderPartConstructor | any,
    components: {
        [componentName: string]: PanelHeaderPartConstructor;
    },
    frameworkComponents: {
        [componentName: string]: any;
    },
    createFrameworkComponent: FrameworkFactory<PanelHeaderPart>
): PanelHeaderPart {
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
        return new DefaultTab();
    }

    return new Component() as PanelHeaderPart;
}
