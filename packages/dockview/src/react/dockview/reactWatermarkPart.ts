import * as React from 'react';
import {
    GroupPanelPartInitParameters,
    IWatermarkRenderer,
} from '../../groupview/types';
import { GroupPanel } from '../../groupview/groupviewPanel';
import { ReactPart, ReactPortalStore } from '../react';
import { IGroupPanelBaseProps } from './dockview';
import { PanelUpdateEvent } from '../../panel/types';

export interface IWatermarkPanelProps extends IGroupPanelBaseProps {
    close: () => void;
}

export class ReactWatermarkPart implements IWatermarkRenderer {
    private _element: HTMLElement;
    private part?: ReactPart<IWatermarkPanelProps>;
    private _groupRef: { value: GroupPanel | undefined } = {
        value: undefined,
    };
    private parameters: GroupPanelPartInitParameters | undefined;

    get element() {
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
                    if (this._groupRef.value) {
                        parameters.containerApi.removeGroup(
                            this._groupRef.value
                        );
                    }
                },
            }
        );
    }

    focus() {
        // noop
    }

    update(params: PanelUpdateEvent) {
        if (this.parameters) {
            this.parameters.params = params.params;
        }

        this.part?.update({ params: this.parameters?.params || {} });
    }

    toJSON() {
        return {
            id: this.id,
        };
    }

    layout(_width: number, _height: number) {
        // noop - retrieval from api
    }

    updateParentGroup(group: GroupPanel, _isPanelVisible: boolean): void {
        // noop - retrieval from api
        this._groupRef.value = group;
    }

    dispose() {
        this.part?.dispose();
    }
}
