import { Injector, EnvironmentInjector } from '@angular/core';
import { GridviewPanel, IFrameworkPart } from 'dockview-core';
import { AngularRenderer } from '../utils/angular-renderer';
import { ComponentReference } from '../types';

export class AngularGridviewPanel extends GridviewPanel {
    constructor(
        id: string,
        component: string,
        private readonly angularComponent: ComponentReference,
        private readonly injector: Injector,
        private readonly environmentInjector?: EnvironmentInjector
    ) {
        super(id, component);
    }

    getComponent(): IFrameworkPart {
        return new AngularRenderer({
            component: this.angularComponent,
            injector: this.injector,
            environmentInjector: this.environmentInjector,
        });
    }
}
