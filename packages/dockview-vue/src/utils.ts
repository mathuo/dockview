import type {
    DockviewApi,
    DockviewGroupPanel,
    DockviewGroupPanelApi,
    GroupPanelPartInitParameters,
    IContentRenderer,
    IHeaderActionsRenderer,
    ITabRenderer,
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
    mergeProps,
    type DefineComponent,
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
    props: T,
    element: HTMLElement
) {
    let vNode = createVNode(component, props);

    render(vNode, element);

    return {
        update: (newProps: any) => {
            vNode = cloneVNode(vNode, mergeProps(props, newProps));
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

    constructor(private readonly component: VueComponent) {
        this._element = document.createElement('div');
        this.element.className = 'dv-vue-part';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        const props = {
            params: parameters.params,
            api: parameters.api,
            containerApi: parameters.containerApi,
        };

        this._renderDisposable?.dispose();
        this._renderDisposable = mountVueComponent(
            this.component,
            props,
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

    constructor(private readonly component: VueComponent) {
        this._element = document.createElement('div');
        this.element.className = 'dv-vue-part';
    }

    init(parameters: GroupPanelPartInitParameters): void {
        const props = {
            params: parameters.params,
            api: parameters.api,
            containerApi: parameters.containerApi,
        };

        this._renderDisposable?.dispose();
        this._renderDisposable = mountVueComponent(
            this.component,
            props,
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

    constructor(private readonly component: VueComponent) {
        this._element = document.createElement('div');
        this.element.className = 'dv-vue-part';
    }

    init(parameters: WatermarkRendererInitParameters): void {
        const props = {
            group: parameters.group,
            containerApi: parameters.containerApi,
        };

        this._renderDisposable?.dispose();
        this._renderDisposable = mountVueComponent(
            this.component,
            props,
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
        group: DockviewGroupPanel
    ) {
        this._element = document.createElement('div');
        this.element.className = 'dv-vue-header-action-part';
    }

    init(params: {
        containerApi: DockviewApi;
        api: DockviewGroupPanelApi;
    }): void {
        console.log('meeee', this.component);
        const props = {
            api: params.api,
            containerApi: params.containerApi,
        };

        this._renderDisposable?.dispose();
        this._renderDisposable = mountVueComponent(
            this.component,
            props,
            this.element
        );
    }

    dispose(): void {
        console.log('dispose');
        this._renderDisposable?.dispose();
    }
}
