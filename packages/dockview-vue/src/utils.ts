import type {
    DockviewGroupPanel,
    GroupPanelPartInitParameters,
    IContentRenderer,
    IDockviewPanelHeaderProps,
    IDockviewPanelProps,
    IGroupHeaderProps,
    IHeaderActionsRenderer,
    ITabRenderer,
    IWatermarkPanelProps,
    IWatermarkRenderer,
    PanelUpdateEvent,
    Parameters,
    WatermarkRendererInitParameters,
} from 'dockview-core';
import {
    createVNode,
    type ComponentOptionsBase,
    render,
    cloneVNode,
    type DefineComponent,
    type ComponentInternalInstance,
} from 'vue';

export type ComponentInterface = ComponentOptionsBase<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
>;

export type VueComponent<T = any> = DefineComponent<T>;

export function findComponent(
    parent: ComponentInternalInstance,
    name: string
): VueComponent | null {
    let instance = parent as any;
    let component = null;

    while (!component && instance) {
        component = instance.components?.[name];
        instance = instance.parent;
    }

    if (!component) {
        component = parent.appContext.components?.[name];
    }

    if (!component) {
        throw new Error(`Failed to find Vue Component '${name}'`);
    }

    return component;
}

/**
 * TODO List
 *
 * 1. handle vue context-ish stuff (appContext? provides?)
 *
 *
 *
 * @see https://vuejs.org/api/render-function.html#clonevnode
 * @see https://vuejs.org/api/render-function.html#mergeprops
 */
export function mountVueComponent<T extends Record<string, any>>(
    component: VueComponent<T>,
    parent: ComponentInternalInstance,
    props: T,
    element: HTMLElement
) {
    let vNode = createVNode(component, Object.freeze(props));

    vNode.appContext = parent.appContext;

    render(vNode, element);

    let runningProps = props;

    return {
        update: (newProps: any) => {
            runningProps = { ...props, newProps };
            vNode = cloneVNode(vNode, Object.freeze(runningProps));
            render(vNode, element);
        },
        dispose: () => {
            render(null, element);
        },
    };
}

export class VueContentRenderer implements IContentRenderer {
    private _element: HTMLElement;
    private _renderDisposable:
        | { update: (props: any) => void; dispose: () => void }
        | undefined;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        private readonly component: VueComponent,
        private readonly parent: ComponentInternalInstance
    ) {
        this._element = document.createElement('div');
        this.element.className = 'dv-vue-part';
        this.element.style.height = '100%';
        this.element.style.width = '100%';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        const props: IDockviewPanelProps = {
            params: parameters.params,
            api: parameters.api,
            containerApi: parameters.containerApi,
        };

        this._renderDisposable?.dispose();
        this._renderDisposable = mountVueComponent(
            this.component,
            this.parent,
            { params: props },
            this.element
        );
    }

    update(event: PanelUpdateEvent<Parameters>): void {
        const params = event.params;
        // TODO: handle prop updates somehow?
        this._renderDisposable?.update(params);
    }

    focus(): void {
        //  TODO: make optional on interface
    }

    dispose(): void {
        this._renderDisposable?.dispose();
    }
}

export class VueTabRenderer implements ITabRenderer {
    private _element: HTMLElement;
    private _renderDisposable:
        | { update: (props: any) => void; dispose: () => void }
        | undefined;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        private readonly component: VueComponent,
        private readonly parent: ComponentInternalInstance
    ) {
        this._element = document.createElement('div');
        this.element.className = 'dv-vue-part';
        this.element.style.height = '100%';
        this.element.style.width = '100%';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        const props: IDockviewPanelHeaderProps = {
            params: parameters.params,
            api: parameters.api,
            containerApi: parameters.containerApi,
        };

        this._renderDisposable?.dispose();
        this._renderDisposable = mountVueComponent(
            this.component,
            this.parent,
            { params: props },
            this.element
        );
    }

    update(event: PanelUpdateEvent<Parameters>): void {
        const params = event.params;
        // TODO: handle prop updates somehow?
        this._renderDisposable?.update(params);
    }

    dispose(): void {
        this._renderDisposable?.dispose();
    }
}

export class VueWatermarkRenderer implements IWatermarkRenderer {
    private _element: HTMLElement;
    private _renderDisposable:
        | { update: (props: any) => void; dispose: () => void }
        | undefined;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        private readonly component: VueComponent,
        private readonly parent: ComponentInternalInstance
    ) {
        this._element = document.createElement('div');
        this.element.className = 'dv-vue-part';
        this.element.style.height = '100%';
        this.element.style.width = '100%';
    }

    init(parameters: WatermarkRendererInitParameters): void {
        const props: IWatermarkPanelProps = {
            group: parameters.group,
            containerApi: parameters.containerApi,
        };

        this._renderDisposable?.dispose();
        this._renderDisposable = mountVueComponent(
            this.component,
            this.parent,
            { params: props },
            this.element
        );
    }

    updateParentGroup(group: DockviewGroupPanel, visible: boolean): void {
        // TODO: make optional on interface
    }

    update(event: PanelUpdateEvent<Parameters>): void {
        const params = event.params;
        // TODO: handle prop updates somehow?
        this._renderDisposable?.update(params);
    }

    dispose(): void {
        this._renderDisposable?.dispose();
    }
}

export class VueHeaderActionsRenderer implements IHeaderActionsRenderer {
    private _element: HTMLElement;
    private _renderDisposable:
        | { update: (props: any) => void; dispose: () => void }
        | undefined;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        private readonly component: VueComponent,
        private readonly parent: ComponentInternalInstance,
        group: DockviewGroupPanel
    ) {
        this._element = document.createElement('div');
        this.element.className = 'dv-vue-header-action-part';
        this._element.style.width = '100%';
        this._element.style.height = '100%';
    }

    init(props: IGroupHeaderProps): void {
        this._renderDisposable?.dispose();
        this._renderDisposable = mountVueComponent(
            this.component,
            this.parent,
            { params: props },
            this.element
        );
    }

    dispose(): void {
        this._renderDisposable?.dispose();
    }
}
