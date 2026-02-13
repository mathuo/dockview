import { Injector, EnvironmentInjector } from '@angular/core';
import {
    IPanePart,
    PanelUpdateEvent,
    PanePanelComponentInitParameter,
} from 'dockview-core';
import { AngularRenderer } from '../utils/angular-renderer';
import { ComponentReference } from '../types';

export class AngularPanePart implements IPanePart {
    private renderer: AngularRenderer;

    constructor(
        private readonly angularComponent: ComponentReference,
        private readonly injector: Injector,
        private readonly environmentInjector?: EnvironmentInjector
    ) {
        this.renderer = new AngularRenderer({
            component: this.angularComponent,
            injector: this.injector,
            environmentInjector: this.environmentInjector,
        });
    }

    get element(): HTMLElement {
        return this.renderer.element;
    }

    init(parameters: PanePanelComponentInitParameter): void {
        this.renderer.init(parameters);
    }

    update(params: PanelUpdateEvent): void {
        this.renderer.update(params);
    }

    dispose(): void {
        this.renderer.dispose();
    }
}
