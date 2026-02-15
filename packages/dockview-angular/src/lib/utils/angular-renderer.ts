import {
    ComponentRef,
    Injector,
    Type,
    EmbeddedViewRef,
    createComponent,
    EnvironmentInjector,
    ApplicationRef,
} from '@angular/core';
import { IContentRenderer, IFrameworkPart, Parameters } from 'dockview-core';

export interface AngularRendererOptions<T = any> {
    component: Type<T>;
    injector: Injector;
    environmentInjector?: EnvironmentInjector;
}

export class AngularRenderer<T = any>
    implements IContentRenderer, IFrameworkPart
{
    private componentRef: ComponentRef<T> | null = null;
    private _element: HTMLElement | null = null;
    private appRef: ApplicationRef;

    constructor(private options: AngularRendererOptions<T>) {
        this.appRef = options.injector.get(ApplicationRef);
    }

    get element(): HTMLElement {
        if (!this._element) {
            throw new Error('Angular renderer not initialized');
        }
        return this._element;
    }

    get component(): ComponentRef<T> | null {
        return this.componentRef;
    }

    init(parameters: Parameters): void {
        // Only forward params, api, and containerApi to the component
        // (matching the React renderer). Other init parameters like
        // 'title' are internal to the framework.
        const filtered: Record<string, unknown> = {};
        if ('params' in parameters) {
            filtered['params'] = parameters['params'];
        }
        if ('api' in parameters) {
            filtered['api'] = parameters['api'];
        }
        if ('containerApi' in parameters) {
            filtered['containerApi'] = parameters['containerApi'];
        }

        if (this.componentRef) {
            this.update(filtered);
        } else {
            this.render(filtered);
        }
    }

    update(params: Parameters): void {
        if (!this.componentRef) {
            return;
        }

        const instance = this.componentRef.instance as Record<string, unknown>;

        for (const key of Object.keys(params)) {
            if (key in instance) {
                instance[key] = params[key];
            }
        }

        // trigger change detection
        this.componentRef.changeDetectorRef.markForCheck();
    }

    private render(parameters: Parameters): void {
        try {
            // Create the component using modern Angular API
            this.componentRef = createComponent(this.options.component, {
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

            // attach to change detection
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
