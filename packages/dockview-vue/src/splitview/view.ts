import { SplitviewApi, SplitviewPanel, IFrameworkPart } from 'dockview';
import { type ComponentInternalInstance } from 'vue';
import { VuePart, VueRendererRegistry, type VueComponent } from '../utils';
import type { ISplitviewVuePanelProps } from './types';

export class VueSplitviewPanelView extends SplitviewPanel {
    constructor(
        id: string,
        component: string,
        private readonly vueComponent: VueComponent<ISplitviewVuePanelProps>,
        private readonly parent: ComponentInternalInstance,
        private readonly registry?: VueRendererRegistry
    ) {
        super(id, component);
    }

    getComponent(): IFrameworkPart {
        const part = new VuePart(
            this.element,
            this.vueComponent,
            this.parent,
            {
                params: this._params?.params ?? {},
                api: this.api,
                containerApi: new SplitviewApi((this._params as any).accessor),
            },
            this.registry
        );
        part.init();
        return part;
    }
}
