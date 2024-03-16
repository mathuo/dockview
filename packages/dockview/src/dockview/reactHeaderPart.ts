import React from 'react';
import { ReactPart, ReactPortalStore } from '../react';
import { IGroupPanelBaseProps } from './dockview';
import {
    PanelUpdateEvent,
    ITabRenderer,
    GroupPanelPartInitParameters,
} from 'dockview-core';

export class ReactPanelHeaderPart implements ITabRenderer {
    private _element: HTMLElement;
    private part?: ReactPart<IGroupPanelBaseProps>;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        public readonly id: string,
        private readonly component: React.FunctionComponent<IGroupPanelBaseProps>,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dockview-react-part';
        this._element.style.height = '100%';
        this._element.style.width = '100%';
    }

    focus(): void {
        //noop
    }

    public init(parameters: GroupPanelPartInitParameters): void {
        this.part = new ReactPart(
            this.element,
            this.reactPortalStore,
            this.component,
            {
                params: parameters.params,
                api: parameters.api,
                containerApi: parameters.containerApi,
            }
        );
    }

    public update(event: PanelUpdateEvent): void {
        this.part?.update(event.params);
    }

    public layout(_width: number, _height: number): void {
        // noop - retrieval from api
    }

    public dispose(): void {
        this.part?.dispose();
    }
}
