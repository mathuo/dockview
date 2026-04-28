import React from 'react';
import { ReactPart, ReactPortalStore } from '../react';
import {
    ITabGroupChipRenderer,
    ITabGroup,
    DockviewApi,
    TabGroupChipRendererParams,
} from 'dockview-core';

export interface IDockviewTabGroupChipProps {
    tabGroup: ITabGroup;
    api: DockviewApi;
    accent: string | undefined;
    componentParams: Record<string, unknown> | undefined;
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

    init(params: TabGroupChipRendererParams): void {
        this.part = new ReactPart(
            this._element,
            this.reactPortalStore,
            this.component,
            {
                tabGroup: params.tabGroup,
                api: params.api,
                accent: params.accent,
                componentParams: params.componentParams,
            }
        );
    }

    update(params: TabGroupChipRendererParams): void {
        this.part?.update({
            tabGroup: params.tabGroup,
            api: params.api,
            accent: params.accent,
            componentParams: params.componentParams,
        });
    }

    dispose(): void {
        this.part?.dispose();
    }
}
