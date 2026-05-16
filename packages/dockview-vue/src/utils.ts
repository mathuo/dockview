import type {
    DockviewApi,
    DockviewGroupLocation,
    DockviewGroupPanel,
    DockviewPanelApi,
    IContentRenderer,
    IDockviewGroupPanel,
    IDockviewHeaderActionsProps,
    IDockviewPanelHeaderProps,
    IGroupDragGhostRenderer,
    IGroupHeaderProps,
    IHeaderActionsRenderer,
    ITabGroupChipRenderer,
    ITabGroup,
    ITabRenderer,
    IWatermarkPanelProps,
    IWatermarkRenderer,
    IContextMenuItemRenderer,
    IContextMenuItemComponentProps,
    PanelUpdateEvent,
    Parameters,
    TabPartInitParameters,
    WatermarkRendererInitParameters,
} from 'dockview-core';
import {
    DockviewCompositeDisposable,
    DockviewMutableDisposable,
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
    let component: any = null;

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

    return component as VueComponent;
}

/**
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
    vNode.appContext.provides = {
        ...(vNode.appContext.provides ? vNode.appContext.provides : {}),
        ...((parent as any).provides ? (parent as any).provides : {}),
    };

    render(vNode, element);

    let runningProps = props;

    return {
        update: (newProps: any) => {
            runningProps = { ...props, ...newProps };
            vNode = cloneVNode(vNode, runningProps);
            render(vNode, element);
        },
        dispose: () => {
            render(null, element);
        },
    };
}

abstract class AbstractVueRenderer {
    protected readonly _element: HTMLElement;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        protected readonly component: VueComponent,
        protected readonly parent: ComponentInternalInstance
    ) {
        this._element = document.createElement('div');
        this.element.className = 'dv-vue-part';
        this.element.style.height = '100%';
        this.element.style.width = '100%';
    }
}

export class VueRenderer
    extends AbstractVueRenderer
    implements ITabRenderer, IContentRenderer
{
    private _renderDisposable:
        | { update: (props: any) => void; dispose: () => void }
        | undefined;
    private _api: DockviewPanelApi | undefined;
    private _containerApi: DockviewApi | undefined;

    init(parameters: TabPartInitParameters): void {
        this._api = parameters.api;
        this._containerApi = parameters.containerApi;

        const props: IDockviewPanelHeaderProps = {
            params: parameters.params,
            api: parameters.api,
            containerApi: parameters.containerApi,
            tabLocation: parameters.tabLocation,
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
        if (!this._api || !this._containerApi) {
            return;
        }

        const params = event.params;
        this._renderDisposable?.update({
            params: {
                params: params,
                api: this._api,
                containerApi: this._containerApi,
            },
        });
    }

    dispose(): void {
        this._renderDisposable?.dispose();
    }
}

export class VueWatermarkRenderer
    extends AbstractVueRenderer
    implements IWatermarkRenderer
{
    private _renderDisposable:
        | { update: (props: any) => void; dispose: () => void }
        | undefined;

    get element(): HTMLElement {
        return this._element;
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

    update(event: PanelUpdateEvent<Parameters>): void {
        // noop
    }

    dispose(): void {
        this._renderDisposable?.dispose();
    }
}

export class VueHeaderActionsRenderer
    extends AbstractVueRenderer
    implements IHeaderActionsRenderer
{
    private _renderDisposable:
        | { update: (props: any) => void; dispose: () => void }
        | undefined;
    private readonly _mutableDisposable = new DockviewMutableDisposable();
    private _baseProps: IGroupHeaderProps | undefined;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        component: VueComponent,
        parent: ComponentInternalInstance,
        private readonly group: DockviewGroupPanel
    ) {
        super(component, parent);
    }

    init(props: IGroupHeaderProps): void {
        this._baseProps = props;

        this._mutableDisposable.value = new DockviewCompositeDisposable(
            this.group.model.onDidAddPanel(() => {
                this.updateProps();
            }),
            this.group.model.onDidRemovePanel(() => {
                this.updateProps();
            }),
            this.group.model.onDidActivePanelChange(() => {
                this.updateProps();
            }),
            props.api.onDidActiveChange(() => {
                this.updateProps();
            }),
            props.api.onDidLocationChange((event) => {
                this.updateLocation(event.location);
            })
        );

        this._renderDisposable?.dispose();
        this._renderDisposable = mountVueComponent(
            this.component,
            this.parent,
            { params: this.buildEnrichedProps() },
            this.element
        );
    }

    dispose(): void {
        this._mutableDisposable.dispose();
        this._renderDisposable?.dispose();
    }

    private buildEnrichedProps(): IDockviewHeaderActionsProps {
        return {
            ...this._baseProps!,
            panels: this.group.model.panels,
            activePanel: this.group.model.activePanel,
            isGroupActive: this.group.api.isActive,
            group: this.group,
            headerPosition: this.group.model.headerPosition,
            location: this.group.api.location,
        };
    }

    private updateProps(): void {
        this._renderDisposable?.update({ params: this.buildEnrichedProps() });
    }

    private updateLocation(location: DockviewGroupLocation): void {
        this._renderDisposable?.update({ params: { location } });
    }
}

export class VueContextMenuItemRenderer
    extends AbstractVueRenderer
    implements IContextMenuItemRenderer
{
    private _renderDisposable:
        | { update: (props: any) => void; dispose: () => void }
        | undefined;

    init(props: IContextMenuItemComponentProps): void {
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

export class VueTabGroupChipRenderer
    extends AbstractVueRenderer
    implements ITabGroupChipRenderer
{
    private _renderDisposable:
        | { update: (props: any) => void; dispose: () => void }
        | undefined;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(component: VueComponent, parent: ComponentInternalInstance) {
        super(component, parent);
        this.element.style.height = '';
        this.element.style.width = '';
        this.element.style.display = 'inline-flex';
    }

    init(params: { tabGroup: ITabGroup; api: DockviewApi }): void {
        this._renderDisposable?.dispose();
        this._renderDisposable = mountVueComponent(
            this.component,
            this.parent,
            {
                params: {
                    tabGroup: params.tabGroup,
                    api: params.api,
                },
            },
            this.element
        );
    }

    update(params: { tabGroup: ITabGroup }): void {
        this._renderDisposable?.update({
            params: { tabGroup: params.tabGroup },
        });
    }

    dispose(): void {
        this._renderDisposable?.dispose();
    }
}

export class VueGroupDragGhostRenderer
    extends AbstractVueRenderer
    implements IGroupDragGhostRenderer
{
    private _renderDisposable:
        | { update: (props: any) => void; dispose: () => void }
        | undefined;

    constructor(component: VueComponent, parent: ComponentInternalInstance) {
        super(component, parent);
        this.element.style.height = '';
        this.element.style.width = '';
        this.element.style.display = 'inline-flex';
    }

    init(params: { group: IDockviewGroupPanel; api: DockviewApi }): void {
        this._renderDisposable?.dispose();
        this._renderDisposable = mountVueComponent(
            this.component,
            this.parent,
            {
                params: {
                    group: params.group,
                    api: params.api,
                },
            },
            this.element
        );
    }

    dispose(): void {
        this._renderDisposable?.dispose();
    }
}

export class VuePart<T extends Record<string, any> = any> {
    private _renderDisposable:
        | { update: (props: any) => void; dispose: () => void }
        | undefined;

    constructor(
        private readonly element: HTMLElement,
        private readonly vueComponent: VueComponent<T>,
        private readonly parent: ComponentInternalInstance,
        private props: T
    ) {}

    init(): void {
        this._renderDisposable?.dispose();
        this._renderDisposable = mountVueComponent(
            this.vueComponent,
            this.parent,
            this.props,
            this.element
        );
    }

    update(props: T): void {
        this.props = { ...this.props, ...props };
        this._renderDisposable?.update(this.props);
    }

    dispose(): void {
        this._renderDisposable?.dispose();
    }
}
