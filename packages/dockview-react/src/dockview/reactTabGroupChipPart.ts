import React from 'react';
import { ReactPart, ReactPortalStore } from '../react';
import { ITabGroupChipRenderer, ITabGroup, DockviewApi } from 'dockview';

export interface IDockviewTabGroupChipProps {
    tabGroup: ITabGroup;
    api: DockviewApi;
}

export class ReactTabGroupChipPart implements ITabGroupChipRenderer {
    private readonly _element: HTMLElement;
    private part?: ReactPart<IDockviewTabGroupChipProps>;

    get element(): HTMLElement {
        return this._element;
    }

    constructor(
        private readonly component: React.FunctionComponent<IDockviewTabGroupChipProps>,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dv-react-part';
        this._element.style.display = 'inline-flex';
    }

    init(params: { tabGroup: ITabGroup; api: DockviewApi }): void {
        this.part = new ReactPart(
            this._element,
            this.reactPortalStore,
            this.component,
            {
                tabGroup: params.tabGroup,
                api: params.api,
            }
        );
    }

    update(params: { tabGroup: ITabGroup }): void {
        this.part?.update({ tabGroup: params.tabGroup });
    }

    dispose(): void {
        this.part?.dispose();
    }
}
