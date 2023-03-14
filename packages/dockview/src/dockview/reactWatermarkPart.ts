import * as React from 'react';
import { ReactPart, ReactPortalStore } from '../react';
import { IGroupPanelBaseProps } from './dockview';
import {
    PanelUpdateEvent,
    DockviewGroupPanel,
    GroupPanelPartInitParameters,
    IWatermarkRenderer,
} from 'dockview-core';

export interface IWatermarkPanelProps extends IGroupPanelBaseProps {
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
    }

    init(parameters: GroupPanelPartInitParameters): void {
        this.parameters = parameters;

        this.part = new ReactPart(
            this.element,
            this.reactPortalStore,
            this.component,
            {
                params: parameters.params,
                api: parameters.api,
                containerApi: parameters.containerApi,
                close: () => {
                    parameters.containerApi.removeGroup(parameters.api.group);
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

        this.part?.update({ params: this.parameters?.params || {} });
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
