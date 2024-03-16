import React from 'react';
import { ReactPart, ReactPortalStore } from '../react';
import {
    PanelUpdateEvent,
    DockviewGroupPanel,
    GroupPanelPartInitParameters,
    IWatermarkRenderer,
    WatermarkRendererInitParameters,
    DockviewApi,
    IDockviewGroupPanel,
} from 'dockview-core';

export interface IWatermarkPanelProps {
    containerApi: DockviewApi;
    group?: IDockviewGroupPanel;
    close: () => void;
}

export class ReactWatermarkPart implements IWatermarkRenderer {
    private _element: HTMLElement;
    private part?: ReactPart<IWatermarkPanelProps>;
    private parameters: GroupPanelPartInitParameters | undefined;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        public readonly id: string,
        private readonly component: React.FunctionComponent<IWatermarkPanelProps>,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dockview-react-part';
        this._element.style.height = '100%';
        this._element.style.width = '100%';
    }

    init(parameters: WatermarkRendererInitParameters): void {
        this.part = new ReactPart(
            this.element,
            this.reactPortalStore,
            this.component,
            {
                group: parameters.group,
                containerApi: parameters.containerApi,
                close: () => {
                    if (parameters.group) {
                        parameters.containerApi.removeGroup(parameters.group);
                    }
                },
            }
        );
    }

    focus(): void {
        // noop
    }

    update(params: PanelUpdateEvent): void {
        if (this.parameters) {
            this.parameters.params = params.params;
        }

        this.part?.update({ params: this.parameters?.params ?? {} });
    }

    layout(_width: number, _height: number): void {
        // noop - retrieval from api
    }

    updateParentGroup(
        _group: DockviewGroupPanel,
        _isPanelVisible: boolean
    ): void {
        // noop
    }

    dispose(): void {
        this.part?.dispose();
    }
}
