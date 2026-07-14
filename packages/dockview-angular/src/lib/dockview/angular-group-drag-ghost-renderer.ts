import {
    Type,
    Injector,
    EnvironmentInjector,
    ApplicationRef,
    ComponentRef,
    EmbeddedViewRef,
    createComponent,
} from '@angular/core';
import {
    IGroupDragGhostRenderer,
    IDockviewGroupPanel,
    DockviewApi,
} from 'dockview';

export interface IDockviewAngularGroupDragGhostProps {
    group: IDockviewGroupPanel;
    api: DockviewApi;
}

export class AngularGroupDragGhostRenderer implements IGroupDragGhostRenderer {
    private readonly _element: HTMLElement;
    private componentRef: ComponentRef<any> | null = null;
    private readonly appRef: ApplicationRef;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        private readonly component: Type<any>,
        private readonly injector: Injector,
        private readonly environmentInjector?: EnvironmentInjector | undefined
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dv-angular-part';
        this._element.style.display = 'inline-flex';
        this.appRef = injector.get(ApplicationRef);
    }

    init(params: { group: IDockviewGroupPanel; api: DockviewApi }): void {
        this.componentRef = createComponent(this.component, {
            environmentInjector:
                this.environmentInjector ||
                (this.injector as EnvironmentInjector),
            elementInjector: this.injector,
        });

        const instance = this.componentRef.instance as Record<string, unknown>;
        instance['group'] = params.group;
        instance['api'] = params.api;

        const hostView = this.componentRef.hostView as EmbeddedViewRef<any>;
        const rootNode = hostView.rootNodes[0] as HTMLElement;
        this._element.appendChild(rootNode);

        this.appRef.attachView(hostView);
        this.componentRef.changeDetectorRef.markForCheck();
    }

    dispose(): void {
        if (this.componentRef) {
            this.appRef.detachView(this.componentRef.hostView);
            this.componentRef.destroy();
            this.componentRef = null;
        }
    }
}
