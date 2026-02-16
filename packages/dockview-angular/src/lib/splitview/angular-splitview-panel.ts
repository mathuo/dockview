import { Type, Injector, EnvironmentInjector } from '@angular/core';
import { SplitviewPanel, IFrameworkPart } from 'dockview-core';
import { AngularRenderer } from '../utils/angular-renderer';

export class AngularSplitviewPanel extends SplitviewPanel {
    constructor(
        id: string,
        component: string,
        private readonly angularComponent: Type<any>,
        private readonly injector: Injector,
        private readonly environmentInjector?: EnvironmentInjector
    ) {
        super(id, component);
    }

    getComponent(): IFrameworkPart {
        const renderer = new AngularRenderer({
            component: this.angularComponent,
            injector: this.injector,
            environmentInjector: this.environmentInjector,
        });
        renderer.init({
            params: this._params?.params ?? {},
            api: this.api,
        });
        this.element.appendChild(renderer.element);
        return renderer;
    }
}
