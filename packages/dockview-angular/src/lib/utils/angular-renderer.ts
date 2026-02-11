import {
    ComponentRef,
    Injector,
    Type,
    EmbeddedViewRef,
    createComponent,
    EnvironmentInjector,
    ApplicationRef,
    TemplateRef,
    ViewContainerRef,
} from '@angular/core';
import { IContentRenderer, IFrameworkPart, Parameters } from 'dockview-core';

export interface AngularRendererOptions {
    component: Type<any> | TemplateRef<any>;
    injector: Injector;
    environmentInjector?: EnvironmentInjector;
}

export class AngularRenderer implements IContentRenderer, IFrameworkPart {
    private componentRef: ComponentRef<any> | null = null;
    private viewRef: EmbeddedViewRef<any> | null = null;
    private _element: HTMLElement | null = null;
    private appRef: ApplicationRef;

    constructor(private options: AngularRendererOptions) {
        this.appRef = options.injector.get(ApplicationRef);
    }

    get element(): HTMLElement {
        if (!this._element) {
            throw new Error('Angular renderer not initialized');
        }
        return this._element;
    }

    get component(): ComponentRef<any> | null {
        return this.componentRef;
    }
    get view(): EmbeddedViewRef<any> | null {
        return this.viewRef;
    }

    init(parameters: Parameters): void {
        // If already initialized, just update the parameters
        if (this._element) {
            this.update(parameters);
        } else {
            this.render(parameters);
        }
    }

    update(params: Parameters): void {
        // Only component can have parameters
        if (!this.componentRef) {
            return;
        }

        for (const key of Object.keys(params)) {
            // Use 'in' operator instead of hasOwnProperty to support getter/setter properties
            if (key in this.componentRef.instance) {
                this.componentRef.instance[key] = params[key];
            }
        }

        // Trigger change detection
        this.componentRef.changeDetectorRef.markForCheck();
    }

    private render(parameters: Parameters): void {
        try {
            if (this.options.component instanceof TemplateRef) {
                this.setupView(this.options.component);
            } else {
                this.setupComponent(this.options.component, parameters);
            }
        } catch (error) {
            console.error('Error creating Angular component:', error);
            throw error;
        }
    }

    private setupComponent(component: Type<any>, parameters: Parameters): void {
        // Create the component using modern Angular API
        this.componentRef = createComponent(component, {
            environmentInjector:
                this.options.environmentInjector ||
                (this.options.injector as EnvironmentInjector),
            elementInjector: this.options.injector,
        });

        // Set initial parameters
        this.update(parameters);

        // Get the DOM element
        const hostView = this.componentRef.hostView as EmbeddedViewRef<any>;
        this._element = hostView.rootNodes[0] as HTMLElement;

        // Attach to change detection
        this.appRef.attachView(hostView);

        // Trigger change detection
        this.componentRef.changeDetectorRef.markForCheck();
    }

    private setupView(template: TemplateRef<any>): void {
        // Get factory for template instances
        const vcr = this.options.injector.get(ViewContainerRef);

        // Create embedded view from template
        this.viewRef = vcr.createEmbeddedView(template);
        this._element = this.viewRef.rootNodes[0] as HTMLElement;

        // Already attached to change detection (of injector, usually dockview)

        // Trigger change detection
        this.viewRef.markForCheck();
    }

    dispose(): void {
        if (this.componentRef) {
            this.componentRef.destroy();
            this.componentRef = null;
        }
        if (this.viewRef) {
            this.viewRef.destroy();
            this.viewRef = null;
        }
        this._element = null;
    }
}
