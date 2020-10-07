import * as React from 'react';
import { IGroupview } from '../../groupview/groupview';
import {
    GroupPanelPartInitParameters,
    WatermarkPart,
} from '../../groupview/panel/parts';
import { ReactPart } from '../react';
import { IGroupPanelProps, ReactPortalStore } from './dockview';

interface IWatermarkPanelProps extends IGroupPanelProps {
    close: () => void;
}

export class ReactWatermarkPart implements WatermarkPart {
    private _element: HTMLElement;
    private part?: ReactPart<IWatermarkPanelProps>;
    private _groupRef: { value: IGroupview | undefined } = { value: undefined };

    get element() {
        return this._element;
    }

    constructor(
        public readonly id: string,
        private readonly component: React.FunctionComponent<
            IWatermarkPanelProps
        >,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        this._element = document.createElement('div');
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
                close: () =>
                    parameters.containerApi.removeGroup(this._groupRef.value),
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

    public setVisible(isPanelVisible: boolean, group: IGroupview): void {
        // noop - retrieval from api
        this._groupRef.value = group;
    }

    public dispose() {
        this.part?.dispose();
    }
}
