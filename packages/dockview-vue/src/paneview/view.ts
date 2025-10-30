import {
    IPanePart,
    PanePanelComponentInitParameter,
    PanelUpdateEvent,
} from 'dockview-core';
import { type ComponentInternalInstance } from 'vue';
import { VuePart, type VueComponent } from '../utils';
import type { IPaneviewVuePanelProps } from './types';

export class VuePaneviewPanelView implements IPanePart {
    private readonly _element: HTMLElement;
    private part?: VuePart<IPaneviewVuePanelProps>;

    get element() {
        return this._element;
    }

    constructor(
        public readonly id: string,
        private readonly vueComponent: VueComponent<IPaneviewVuePanelProps>,
        private readonly parent: ComponentInternalInstance
    ) {
        this._element = document.createElement('div');
        this._element.style.height = '100%';
        this._element.style.width = '100%';
    }

    public init(parameters: PanePanelComponentInitParameter): void {
        this.part = new VuePart(
            this.element,
            this.vueComponent,
            this.parent,
            {
                params: parameters.params,
                api: parameters.api,
                title: parameters.title,
                containerApi: parameters.containerApi,
            }
        );
        this.part.init();
    }

    public toJSON() {
        return {
            id: this.id,
        };
    }

    public update(params: PanelUpdateEvent) {
        // The update method for paneview doesn't need to pass all props,
        // just the updated params
        (this.part as any)?.update({ params: params.params });
    }

    public dispose() {
        this.part?.dispose();
    }
}