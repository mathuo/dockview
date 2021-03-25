import * as React from 'react';
import {
    GroupPanelPartInitParameters,
    WatermarkPart,
} from '../../groupview/types';
import { GroupviewPanel } from '../../groupview/v2/groupviewPanel';
import { ReactPart, ReactPortalStore } from '../react';
import { IGroupPanelBaseProps } from './dockview';

interface IWatermarkPanelProps extends IGroupPanelBaseProps {
    close: () => void;
}

export class ReactWatermarkPart implements WatermarkPart {
    private _element: HTMLElement;
    private part?: ReactPart<IWatermarkPanelProps>;
    private _groupRef: { value: GroupviewPanel | undefined } = {
        value: undefined,
    };

    get element() {
        return this._element;
    }

    constructor(
        public readonly id: string,
        private readonly component: React.FunctionComponent<IWatermarkPanelProps>,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        this._element = document.createElement('div');
        this._element.style.height = '100%';
        this._element.style.width = '100%';
    }

    public init(parameters: GroupPanelPartInitParameters): void {
        this.part = new ReactPart(
            this.element,
            this.reactPortalStore,
            this.component,
            {
                ...parameters.params,
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

    public toJSON() {
        return {
            id: this.id,
        };
    }

    public layout(width: number, height: number) {
        // noop - retrieval from api
    }

    public updateParentGroup(
        group: GroupviewPanel,
        isPanelVisible: boolean
    ): void {
        // noop - retrieval from api
        this._groupRef.value = group;
    }

    public dispose() {
        this.part?.dispose();
    }
}
