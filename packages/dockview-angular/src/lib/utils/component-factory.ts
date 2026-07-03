import {
    Type,
    Injector,
    EnvironmentInjector,
    TemplateRef,
} from '@angular/core';
import {
    IContentRenderer,
    ITabRenderer,
    IWatermarkRenderer,
    IHeaderActionsRenderer,
    CreateComponentOptions,
    DockviewGroupPanel,
    GridviewPanel,
    SplitviewPanel,
    IPanePart,
} from 'dockview';
import { AngularRenderer } from './angular-renderer';
import { AngularHeaderActionsRenderer } from '../dockview/angular-header-actions-renderer';
import { AngularGridviewPanel } from '../gridview/angular-gridview-panel';
import { AngularSplitviewPanel } from '../splitview/angular-splitview-panel';
import { AngularPanePart } from '../paneview/angular-pane-part';

export class AngularFrameworkComponentFactory {
    constructor(
        private readonly components: Record<
            string,
            Type<any> | TemplateRef<any>
        >,
        private readonly injector: Injector,
        private readonly environmentInjector?: EnvironmentInjector,
        private readonly tabComponents?: Record<
            string,
            Type<any> | TemplateRef<any>
        >,
        private readonly watermarkComponent?: Type<any> | TemplateRef<any>,
        private readonly headerActionsComponents?: Record<
            string,
            Type<any> | TemplateRef<any>
        >,
        private readonly defaultTabComponent?: Type<any> | TemplateRef<any>
    ) {}

    // For DockviewComponent
    createDockviewComponent(options: CreateComponentOptions): IContentRenderer {
        const component = this.components[options.name];
        if (!component) {
            throw new Error(
                `Component '${options.name}' not found in component registry`
            );
        }

        const renderer = new AngularRenderer({
            component,
            injector: this.injector,
            environmentInjector: this.environmentInjector,
        });

        renderer.init(options);
        return renderer;
    }

    // For GridviewComponent
    createGridviewComponent(options: CreateComponentOptions): GridviewPanel {
        const component = this.components[options.name];
        if (!component) {
            throw new Error(
                `Component '${options.name}' not found in component registry`
            );
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
            throw new Error(
                `Component '${options.name}' not found in component registry`
            );
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
            throw new Error(
                `Component '${options.name}' not found in component registry`
            );
        }

        return new AngularPanePart(
            component,
            this.injector,
            this.environmentInjector
        );
    }

    createTabComponent(
        options: CreateComponentOptions
    ): ITabRenderer | undefined {
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
            environmentInjector: this.environmentInjector,
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
            environmentInjector: this.environmentInjector,
        });

        renderer.init({});
        return renderer;
    }

    createHeaderActionsComponent(
        name: string,
        group: DockviewGroupPanel
    ): IHeaderActionsRenderer | undefined {
        const component = this.headerActionsComponents?.[name];
        if (!component) {
            return undefined;
        }

        // Dedicated renderer (not AngularRenderer) so the component instance
        // receives the full IDockviewHeaderActionsProps surface and stays in
        // sync with group/panel state via event subscriptions.
        return new AngularHeaderActionsRenderer(
            component,
            group,
            this.injector,
            this.environmentInjector
        );
    }
}
