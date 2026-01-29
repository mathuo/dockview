import {
    ComponentRef,
    Injector,
    Type,
    EmbeddedViewRef,
    createComponent,
    EnvironmentInjector
} from '@angular/core';
import {
    IContentRenderer,
    IFrameworkPart,
    Parameters
} from 'dockview-core';

export interface AngularRendererOptions {
    component: Type<any>;
    injector: Injector;
    environmentInjector?: EnvironmentInjector;
}

export class AngularRenderer implements IContentRenderer, IFrameworkPart {
    private componentRef: ComponentRef<any> | null = null;
    private _element: HTMLElement | null = null;
    private appRef: ApplicationRef;

    constructor(
        private options: AngularRendererOptions
    ) {
        this.appRef = options.injector.get(ApplicationRef);
    }

    get element(): HTMLElement {
        if (!this._element) {
            throw new Error('Angular renderer not initialized');
        }
        return this._element;
    }

    init(parameters: Parameters): void {
        // If already initialized, just update the parameters
        if (this.componentRef) {
            this.update(parameters);
        } else {
            this.render(parameters);
        }
    }

    update(params: Parameters): void {
        if (this.componentRef) {
            Object.keys(params).forEach(key => {
                // Use 'in' operator instead of hasOwnProperty to support getter/setter properties
                if (key in this.componentRef!.instance) {
                    this.componentRef!.instance[key] = params[key];
                }
            });

            // trigger change detection
            this.componentRef.changeDetectorRef.markForCheck();
        }
    }

    private render(parameters: Parameters): void {
        try {
            // Create the component using modern Angular API
            this.componentRef = createComponent(this.options.component, {
                environmentInjector: this.options.environmentInjector || this.options.injector as EnvironmentInjector,
                elementInjector: this.options.injector
            });

            // Set initial parameters
            Object.keys(parameters).forEach(key => {
                // Use 'in' operator instead of hasOwnProperty to support getter/setter properties
                if (key in this.componentRef!.instance) {
                    this.componentRef!.instance[key] = parameters[key];
                }
            });

            // Get the DOM element
            const hostView = this.componentRef.hostView as EmbeddedViewRef<any>;
            this._element = hostView.rootNodes[0] as HTMLElement;

            // attach
            this.appRef.attachView(hostView);

            // trigger change detection
            this.componentRef.changeDetectorRef.markForCheck();

        } catch (error) {
            console.error('Error creating Angular component:', error);
            throw error;
        }
    }

    dispose(): void {
        if (this.componentRef) {
            this.componentRef.destroy();
            this.componentRef = null;
        }
        this._element = null;
    }
}