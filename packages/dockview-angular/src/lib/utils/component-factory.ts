import { Type, Injector, EnvironmentInjector } from '@angular/core';
import {
    IContentRenderer,
    ITabRenderer,
    IWatermarkRenderer,
    IHeaderActionsRenderer,
    CreateComponentOptions,
    GridviewPanel,
    SplitviewPanel,
    IPanePart
} from 'dockview-core';
import { AngularRenderer } from './angular-renderer';
import { AngularGridviewPanel } from '../gridview/angular-gridview-panel';
import { AngularSplitviewPanel } from '../splitview/angular-splitview-panel';
import { AngularPanePart } from '../paneview/angular-pane-part';

export class AngularFrameworkComponentFactory {
    constructor(
        private components: Record<string, Type<any>>,
        private injector: Injector,
        private environmentInjector?: EnvironmentInjector,
        private tabComponents?: Record<string, Type<any>>,
        private watermarkComponent?: Type<any>,
        private headerActionsComponents?: Record<string, Type<any>>,
        private defaultTabComponent?: Type<any>
    ) {}

    // For DockviewComponent
    createDockviewComponent(options: CreateComponentOptions): IContentRenderer {
        const component = this.components[options.name];
        if (!component) {
            throw new Error(`Component '${options.name}' not found in component registry`);
        }

        const renderer = new AngularRenderer({
            component,
            injector: this.injector,
            environmentInjector: this.environmentInjector
        });
        
        renderer.init(options);
        return renderer;
    }

    // For GridviewComponent  
    createGridviewComponent(options: CreateComponentOptions): GridviewPanel {
        const component = this.components[options.name];
        if (!component) {
            throw new Error(`Component '${options.name}' not found in component registry`);
        }

        return new AngularGridviewPanel(
            options.id,
            options.name,
            component,
            this.injector,
            this.environmentInjector
        );
    }

    // For SplitviewComponent
    createSplitviewComponent(options: CreateComponentOptions): SplitviewPanel {
        const component = this.components[options.name];
        if (!component) {
            throw new Error(`Component '${options.name}' not found in component registry`);
        }

        return new AngularSplitviewPanel(
            options.id,
            options.name,
            component,
            this.injector,
            this.environmentInjector
        );
    }

    // For PaneviewComponent
    createPaneviewComponent(options: CreateComponentOptions): IPanePart {
        const component = this.components[options.name];
        if (!component) {
            throw new Error(`Component '${options.name}' not found in component registry`);
        }

        return new AngularPanePart(
            component,
            this.injector,
            this.environmentInjector
        );
    }

    // Legacy method for backward compatibility
    createComponent(options: CreateComponentOptions): IContentRenderer {
        return this.createDockviewComponent(options);
    }

    createTabComponent(options: CreateComponentOptions): ITabRenderer | undefined {
        let component = this.tabComponents?.[options.name];
        
        if (!component && this.defaultTabComponent) {
            component = this.defaultTabComponent;
        }
        
        if (!component) {
            return undefined;
        }

        const renderer = new AngularRenderer({
            component,
            injector: this.injector,
            environmentInjector: this.environmentInjector
        });
        
        renderer.init(options);
        return renderer;
    }

    createWatermarkComponent(): IWatermarkRenderer {
        if (!this.watermarkComponent) {
            throw new Error('Watermark component not provided');
        }

        const renderer = new AngularRenderer({
            component: this.watermarkComponent,
            injector: this.injector,
            environmentInjector: this.environmentInjector
        });
        
        renderer.init({});
        return renderer;
    }

    createHeaderActionsComponent(name: string): IHeaderActionsRenderer | undefined {
        const component = this.headerActionsComponents?.[name];
        if (!component) {
            return undefined;
        }

        const renderer = new AngularRenderer({
            component,
            injector: this.injector,
            environmentInjector: this.environmentInjector
        });

        // Initialize with empty props - dockview-core will call init() again with actual IGroupHeaderProps
        renderer.init({});
        return renderer;
    }
}