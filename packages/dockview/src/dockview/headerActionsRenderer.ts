import React from 'react';
import { ReactPart, ReactPortalStore } from '../react';
import {
    IDockviewPanel,
    DockviewCompositeDisposable,
    DockviewMutableDisposable,
    DockviewApi,
    DockviewGroupPanel,
    DockviewGroupPanelApi,
    PanelUpdateEvent,
} from 'dockview-core';

export interface IDockviewHeaderActionsProps {
    api: DockviewGroupPanelApi;
    containerApi: DockviewApi;
    panels: IDockviewPanel[];
    activePanel: IDockviewPanel | undefined;
    isGroupActive: boolean;
    group: DockviewGroupPanel;
}

export class ReactHeaderActionsRendererPart {
    private mutableDisposable = new DockviewMutableDisposable();
    private _element: HTMLElement;
    private _part?: ReactPart<IDockviewHeaderActionsProps>;

    get element(): HTMLElement {
        return this._element;
    }

    get part(): ReactPart<IDockviewHeaderActionsProps> | undefined {
        return this._part;
    }

    get group(): DockviewGroupPanel {
        return this._group;
    }

    constructor(
        private readonly component: React.FunctionComponent<IDockviewHeaderActionsProps>,
        private readonly reactPortalStore: ReactPortalStore,
        private readonly _group: DockviewGroupPanel
    ) {
        this._element = document.createElement('div');
        this._element.className = 'dockview-react-part';
        this._element.style.height = '100%';
        this._element.style.width = '100%';
    }

    focus(): void {
        // TODO
    }

    public init(parameters: {
        containerApi: DockviewApi;
        api: DockviewGroupPanelApi;
    }): void {
        this.mutableDisposable.value = new DockviewCompositeDisposable(
            this._group.model.onDidAddPanel(() => {
                this.updatePanels();
            }),
            this._group.model.onDidRemovePanel(() => {
                this.updatePanels();
            }),
            this._group.model.onDidActivePanelChange(() => {
                this.updateActivePanel();
            }),
            parameters.api.onDidActiveChange(() => {
                this.updateGroupActive();
            })
        );

        this._part = new ReactPart(
            this.element,
            this.reactPortalStore,
            this.component,
            {
                api: parameters.api,
                containerApi: parameters.containerApi,
                panels: this._group.model.panels,
                activePanel: this._group.model.activePanel,
                isGroupActive: this._group.api.isActive,
                group: this._group,
            }
        );
    }

    public update(event: PanelUpdateEvent): void {
        this._part?.update(event.params);
    }

    public dispose(): void {
        this.mutableDisposable.dispose();
        this._part?.dispose();
    }

    private updatePanels(): void {
        this.update({ params: { panels: this._group.model.panels } });
    }

    private updateActivePanel(): void {
        this.update({
            params: {
                activePanel: this._group.model.activePanel,
            },
        });
    }

    private updateGroupActive(): void {
        this.update({
            params: {
                isGroupActive: this._group.api.isActive,
            },
        });
    }
}
