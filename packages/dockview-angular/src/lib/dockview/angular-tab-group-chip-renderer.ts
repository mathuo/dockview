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
    ITabGroupChipRenderer,
    ITabGroup,
    DockviewApi,
} from 'dockview-core';

export interface IDockviewAngularTabGroupChipProps {
    tabGroup: ITabGroup;
    api: DockviewApi;
}

export class AngularTabGroupChipRenderer implements ITabGroupChipRenderer {
    private readonly _element: HTMLElement;
    private componentRef: ComponentRef<any> | null = null;
    private appRef: ApplicationRef;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        private readonly component: Type<any>,
        private readonly injector: Injector,
        private readonly environmentInjector?: EnvironmentInjector
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dv-angular-part';
        this._element.style.display = 'inline-flex';
        this.appRef = injector.get(ApplicationRef);
    }

    init(params: { tabGroup: ITabGroup; api: DockviewApi }): void {
        this.componentRef = createComponent(this.component, {
            environmentInjector:
                this.environmentInjector ||
                (this.injector as EnvironmentInjector),
            elementInjector: this.injector,
        });

        const instance = this.componentRef.instance as Record<string, unknown>;
        instance['tabGroup'] = params.tabGroup;
        instance['api'] = params.api;

        const hostView = this.componentRef.hostView as EmbeddedViewRef<any>;
        const rootNode = hostView.rootNodes[0] as HTMLElement;
        this._element.appendChild(rootNode);

        this.appRef.attachView(hostView);
        this.componentRef.changeDetectorRef.markForCheck();
    }

    update(params: { tabGroup: ITabGroup }): void {
        if (!this.componentRef) {
            return;
        }

        const instance = this.componentRef.instance as Record<string, unknown>;
        instance['tabGroup'] = params.tabGroup;
        this.componentRef.changeDetectorRef.markForCheck();
    }

    dispose(): void {
        if (this.componentRef) {
            this.componentRef.destroy();
            this.componentRef = null;
        }
    }
}
