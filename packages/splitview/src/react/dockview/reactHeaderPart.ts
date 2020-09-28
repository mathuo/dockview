import * as React from 'react';
import {
    PanelHeaderPart,
    GroupPanelPartInitParameters,
} from '../../groupview/panel/parts';
import { ReactPart } from '../react';
import { IGroupPanelProps, ReactPortalStore } from './dockview';

export class ReactPanelHeaderPart implements PanelHeaderPart {
    private _element: HTMLElement;
    private part: ReactPart<IGroupPanelProps>;

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

    public init(parameters: GroupPanelPartInitParameters): void {
        this.part = new ReactPart(
            this.element,
            parameters.api,
            this.reactPortalStore.addPortal,
            this.component,
            parameters.params
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

    public setVisible(isPanelVisible: boolean, isGroupVisible: boolean): void {
        // noop - retrieval from api
    }

    public dispose() {
        this.part?.dispose();
    }
}
