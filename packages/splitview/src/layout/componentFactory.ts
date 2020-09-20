import {
    PanelContentPart,
    PanelContentPartConstructor,
    PanelHeaderPart,
    PanelHeaderPartConstructor,
} from '../groupview/panel/parts'
import { FrameworkFactory } from '../types'
import { DefaultTab } from './components/tab/defaultTab'

export function createContentComponent(
    componentName: string | PanelContentPartConstructor | any,
    components: {
        [componentName: string]: PanelContentPartConstructor
    },
    frameworkComponents: {
        [componentName: string]: any
    },
    createFrameworkComponent: FrameworkFactory<PanelContentPart>
): PanelContentPart {
    const Component =
        typeof componentName === 'string'
            ? components[componentName]
            : componentName
    const FrameworkComponent =
        typeof componentName === 'string'
            ? frameworkComponents[componentName]
            : componentName
    if (Component && FrameworkComponent) {
        throw new Error(
            `cannot register component ${componentName} as both a component and frameworkComponent`
        )
    }
    if (FrameworkComponent) {
        if (!createFrameworkComponent) {
            throw new Error(
                'you must register a frameworkPanelWrapper to use framework components'
            )
        }
        const wrappedComponent = createFrameworkComponent.createComponent(
            componentName,
            FrameworkComponent
        )
        return wrappedComponent
    }
    return new Component() as PanelContentPart
}

export function createTabComponent(
    componentName: string | PanelHeaderPartConstructor | any,
    components: {
        [componentName: string]: PanelHeaderPartConstructor
    },
    frameworkComponents: {
        [componentName: string]: any
    },
    createFrameworkComponent: FrameworkFactory<PanelHeaderPart>
): PanelHeaderPart {
    const Component =
        typeof componentName === 'string'
            ? components[componentName]
            : componentName
    const FrameworkComponent =
        typeof componentName === 'string'
            ? frameworkComponents[componentName]
            : componentName
    if (Component && FrameworkComponent) {
        throw new Error(
            `cannot register component ${componentName} as both a component and frameworkComponent`
        )
    }
    if (FrameworkComponent) {
        if (!createFrameworkComponent) {
            throw new Error(
                'you must register a frameworkPanelWrapper to use framework components'
            )
        }
        const wrappedComponent = createFrameworkComponent.createComponent(
            componentName,
            FrameworkComponent
        )
        return wrappedComponent
    }

    if (!Component) {
        return new DefaultTab()
    }

    return new Component() as PanelHeaderPart
}
