import * as React from 'react';
import {
    PanelContentPart,
    GroupPanelPartInitParameters,
} from '../../groupview/types';
import { ReactPart, ReactPortalStore } from '../react';
import { ActionsbarReference, IGroupPanelProps } from '../dockview/dockview';
import { PanelUpdateEvent } from '../../panel/types';
import { IGroupview } from '../../groupview/groupview';
import { IGroupPanelApi } from '../../api/groupPanelApi';
import { DockviewApi } from '../../api/component.api';

export interface IGroupPanelActionbarProps {
    api: IGroupPanelApi;
    containerApi: DockviewApi;
}

export class ReactPanelContentPart implements PanelContentPart {
    private _element: HTMLElement;
    private part?: ReactPart<IGroupPanelProps>;
    private _group: IGroupview;
    //
    private _actionsElement: HTMLElement;
    private actionsPart?: ReactPart<any>;

    private parameters: GroupPanelPartInitParameters;

    get element() {
        return this._element;
    }

    get actions() {
        return this._actionsElement;
    }

    constructor(
        public readonly id: string,
        private readonly component: React.FunctionComponent<IGroupPanelProps>,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        this._element = document.createElement('div');
        this._element.style.height = '100%';
        this._element.style.width = '100%';

        this._actionsElement = document.createElement('div');
        this._actionsElement.style.height = '100%';
        this._actionsElement.style.width = '100%';
    }

    focus() {
        //noop
    }

    public init(parameters: GroupPanelPartInitParameters): void {
        this.parameters = parameters;
        this.part = new ReactPart(
            this.element,
            this.reactPortalStore,
            this.component,
            {
                ...parameters.params,
                api: parameters.api,
                containerApi: parameters.containerApi,
                setActionsbar: this.setActionsbar.bind(this),
            }
        );
    }

    private setActionsbar<P>(
        component: React.FunctionComponent<IGroupPanelActionbarProps & P>,
        props: P
    ): ActionsbarReference<IGroupPanelActionbarProps & P> {
        if (this.actionsPart) {
            console.debug('removed existing panel-actions portal');
            this.actionsPart.dispose();
            this.actionsPart = undefined;
        }

        this.actionsPart = new ReactPart<IGroupPanelActionbarProps & P>(
            this._actionsElement,
            this.reactPortalStore,
            component,
            {
                ...props,
                api: this.parameters.api,
                containerApi: this.parameters.containerApi,
            }
        );

        this._group?.updateActions();

        return {
            update: (props: Partial<P>) => {
                this.actionsPart.update(props);
            },
            dispose: () => {
                this.actionsPart.dispose();
                this.actionsPart = undefined;
            },
        };
    }

    public toJSON() {
        return {
            id: this.id,
        };
    }

    public update(params: PanelUpdateEvent) {
        this.parameters.params = params.params;
        this.part?.update(params.params);
    }

    public setVisible(isPanelVisible: boolean, group: IGroupview): void {
        this._group = group;
    }

    public layout(width: number, height: number): void {
        // noop
    }

    public close(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public dispose() {
        this.part?.dispose();
        this.actionsPart?.dispose();
    }
}
