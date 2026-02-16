import {
    SplitviewApi,
    PanelViewInitParameters,
    SplitviewPanel,
    IFrameworkPart,
} from 'dockview-core';
import { type ComponentInternalInstance } from 'vue';
import { VuePart, type VueComponent } from '../utils';
import type { ISplitviewVuePanelProps } from './types';

export class VueSplitviewPanelView extends SplitviewPanel {
    constructor(
        id: string,
        component: string,
        private readonly vueComponent: VueComponent<ISplitviewVuePanelProps>,
        private readonly parent: ComponentInternalInstance
    ) {
        super(id, component);
    }

    getComponent(): IFrameworkPart {
        const part = new VuePart(this.element, this.vueComponent, this.parent, {
            params: this._params?.params ?? {},
            api: this.api,
            containerApi: new SplitviewApi((this._params as any).accessor),
        });
        part.init();
        return part;
    }
}
