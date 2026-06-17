import React from 'react';
import { ReactPart, ReactPortalStore } from '../react';
import {
    IDockviewGroupPanel,
    IGroupDragGhostRenderer,
    DockviewApi,
} from 'dockview';

export interface IDockviewGroupDragGhostProps {
    group: IDockviewGroupPanel;
    api: DockviewApi;
}

export class ReactGroupDragGhostPart implements IGroupDragGhostRenderer {
    private readonly _element: HTMLElement;
    private part?: ReactPart<IDockviewGroupDragGhostProps>;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        private readonly component: React.FunctionComponent<IDockviewGroupDragGhostProps>,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dv-react-part';
        this._element.style.display = 'inline-flex';
    }

    init(params: { group: IDockviewGroupPanel; api: DockviewApi }): void {
        this.part = new ReactPart(
            this._element,
            this.reactPortalStore,
            this.component,
            {
                group: params.group,
                api: params.api,
            }
        );
    }

    dispose(): void {
        this.part?.dispose();
    }
}
