import * as React from 'react';
import { IGroupview } from '../../groupview/groupview';
import {
    PanelHeaderPart,
    GroupPanelPartInitParameters,
} from '../../groupview/panel/parts';
import { PanelUpdateEvent } from '../../panel/types';
import { ReactPart, ReactPortalStore } from '../react';
import { IGroupPanelProps } from './dockview';

export class ReactPanelHeaderPart implements PanelHeaderPart {
    private _element: HTMLElement;
    private part?: ReactPart<IGroupPanelProps>;

    get element() {
        return this._element;
    }

    constructor(
        public readonly id: string,
        private readonly component: React.FunctionComponent<IGroupPanelProps>,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        this._element = document.createElement('div');
    }

    focus() {
        //noop
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
            }
        );
    }

    public update(event: PanelUpdateEvent) {
        //noop
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
    }

    public dispose() {
        this.part?.dispose();
    }
}
