import {
    ComponentRef,
    Injector,
    Type,
    ViewContainerRef,
    ApplicationRef,
    ComponentFactoryResolver,
    EmbeddedViewRef,
    createComponent,
    EnvironmentInjector
} from '@angular/core';
import {
    IContentRenderer,
    IFrameworkPart,
    ITabOverflowRenderer,
    ITabOverflowTriggerRenderer,
    DockviewIDisposable,
    Parameters,
    TabOverflowEvent
} from 'dockview-core';

export interface AngularRendererOptions {
    component: Type<any>;
    injector: Injector;
    environmentInjector?: EnvironmentInjector;
}

export class AngularRenderer implements IContentRenderer, IFrameworkPart {
    private componentRef: ComponentRef<any> | null = null;
    private _element: HTMLElement | null = null;

    constructor(
        private options: AngularRendererOptions
    ) {}

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
            this.componentRef.changeDetectorRef.detectChanges();
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

            // Trigger change detection
            this.componentRef.changeDetectorRef.detectChanges();

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

export class AngularTabOverflowRenderer implements ITabOverflowRenderer {
    private componentRef: ComponentRef<any> | null = null;
    private _element: HTMLElement;

    constructor(
        private options: AngularRendererOptions
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dv-angular-tab-overflow-part';
        this._element.style.height = '100%';
    }

    get element(): HTMLElement {
        return this._element;
    }

    update(event: TabOverflowEvent): void {
        if (!this.componentRef) {
            this.render(event);
        } else {
            this.updateComponent(event);
        }
    }

    private render(event: TabOverflowEvent): void {
        try {
            this.componentRef = createComponent(this.options.component, {
                environmentInjector: this.options.environmentInjector || this.options.injector as EnvironmentInjector,
                elementInjector: this.options.injector
            });

            // Set the event data
            if ('event' in this.componentRef.instance) {
                this.componentRef.instance.event = event;
            }

            // Get the component's DOM element and append to our element
            const hostView = this.componentRef.hostView as EmbeddedViewRef<any>;
            const componentElement = hostView.rootNodes[0] as HTMLElement;
            this._element.appendChild(componentElement);

            // Trigger change detection
            this.componentRef.changeDetectorRef.detectChanges();

        } catch (error) {
            console.error('Error creating Angular tab overflow component:', error);
            throw error;
        }
    }

    private updateComponent(event: TabOverflowEvent): void {
        if (this.componentRef && 'event' in this.componentRef.instance) {
            this.componentRef.instance.event = event;
            this.componentRef.changeDetectorRef.detectChanges();
        }
    }

    dispose(): void {
        if (this.componentRef) {
            this.componentRef.destroy();
            this.componentRef = null;
        }
        this._element.innerHTML = '';
    }
}

export class AngularTabOverflowTriggerRenderer implements ITabOverflowTriggerRenderer {
    private componentRef: ComponentRef<any> | null = null;
    private _element: HTMLElement;

    constructor(
        private options: AngularRendererOptions
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dv-angular-tab-overflow-trigger-part';
        this._element.style.height = '100%';
    }

    get element(): HTMLElement {
        return this._element;
    }

    update(event: TabOverflowEvent): void {
        if (!this.componentRef) {
            this.render(event);
        } else {
            this.updateComponent(event);
        }
    }

    private render(event: TabOverflowEvent): void {
        try {
            this.componentRef = createComponent(this.options.component, {
                environmentInjector: this.options.environmentInjector || this.options.injector as EnvironmentInjector,
                elementInjector: this.options.injector
            });

            // Set the event data
            if ('event' in this.componentRef.instance) {
                this.componentRef.instance.event = event;
            }

            // Get the component's DOM element and append to our element
            const hostView = this.componentRef.hostView as EmbeddedViewRef<any>;
            const componentElement = hostView.rootNodes[0] as HTMLElement;
            this._element.appendChild(componentElement);

            // Trigger change detection
            this.componentRef.changeDetectorRef.detectChanges();

        } catch (error) {
            console.error('Error creating Angular tab overflow trigger component:', error);
            throw error;
        }
    }

    private updateComponent(event: TabOverflowEvent): void {
        if (this.componentRef && 'event' in this.componentRef.instance) {
            this.componentRef.instance.event = event;
            this.componentRef.changeDetectorRef.detectChanges();
        }
    }

    dispose(): void {
        if (this.componentRef) {
            this.componentRef.destroy();
            this.componentRef = null;
        }
        this._element.innerHTML = '';
    }
}