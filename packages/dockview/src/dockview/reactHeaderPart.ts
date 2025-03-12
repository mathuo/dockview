import React from 'react';
import { ReactPart, ReactPortalStore } from '../react';
import {
    PanelUpdateEvent,
    ITabRenderer,
    TabPartInitParameters,
    IDockviewPanelHeaderProps,
} from 'dockview-core';

export class ReactPanelHeaderPart implements ITabRenderer {
    private readonly _element: HTMLElement;
    private part?: ReactPart<IDockviewPanelHeaderProps>;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        public readonly id: string,
        private readonly component: React.FunctionComponent<IDockviewPanelHeaderProps>,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dv-react-part';
        this._element.style.height = '100%';
        this._element.style.width = '100%';
    }

    focus(): void {
        //noop
    }

    public init(parameters: TabPartInitParameters): void {
        this.part = new ReactPart(
            this.element,
            this.reactPortalStore,
            this.component,
            {
                params: parameters.params,
                api: parameters.api,
                containerApi: parameters.containerApi,
                tabLocation: parameters.tabLocation,
            }
        );
    }

    public update(event: PanelUpdateEvent): void {
        this.part?.update({ params: event.params });
    }

    public layout(_width: number, _height: number): void {
        // noop - retrieval from api
    }

    public dispose(): void {
        this.part?.dispose();
    }
}
