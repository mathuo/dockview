import { GridviewApi, GridviewPanel, IFrameworkPart } from 'dockview-core';
import { type ComponentInternalInstance } from 'vue';
import { VuePart, type VueComponent } from '../utils';
import type { IGridviewVuePanelProps } from './types';

export class VueGridviewPanelView extends GridviewPanel {
    constructor(
        id: string,
        component: string,
        private readonly vueComponent: VueComponent<IGridviewVuePanelProps>,
        private readonly parent: ComponentInternalInstance
    ) {
        super(id, component);
    }

    getComponent(): IFrameworkPart {
        return new VuePart(this.element, this.vueComponent, this.parent, {
            params: this._params?.params ?? {},
            api: this.api,
            containerApi: new GridviewApi((this._params as any).accessor),
        });
    }
}
