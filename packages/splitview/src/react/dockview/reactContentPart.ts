import * as React from 'react';
import {
    PanelContentPart,
    GroupPanelPartInitParameters,
} from '../../groupview/panel/parts';
import { ReactPart, ReactPortalStore } from '../react';
import { IGroupPanelProps } from '../dockview/dockview';
import { PanelUpdateEvent } from '../../panel/types';
import { IGroupview } from '../../groupview/groupview';

interface IExtendedGroupPanelProps extends IGroupPanelProps {
    registerActions?<T>(c: React.FunctionComponent<T>, props: T): void;
}

export class ReactPanelContentPart implements PanelContentPart {
    private _element: HTMLElement;
    private part?: ReactPart<IExtendedGroupPanelProps>;
    private _group: IGroupview;

    get element() {
        return this._element;
    }

    private _actionsElement: HTMLElement;
    private actionsPart?: ReactPart<any>;
    private _init = false;

    get actions() {
        return this._actionsElement;
    }

    updateActions() {
        if (!this.actionsPart) {
            return;
        }
        if (this._init) {
            return;
        }
        this._init = true;
        this.actionsPart.createPortal();
    }

    constructor(
        public readonly id: string,
        private readonly component: React.FunctionComponent<
            IExtendedGroupPanelProps
        >,
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

    private parameters: GroupPanelPartInitParameters;

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
                registerActions: this.registerActions.bind(this),
            }
        );
    }

    private registerActions<P>(
        component: React.FunctionComponent<P>,
        props: P
    ) {
        this.actionsPart = new ReactPart<any>(
            this._actionsElement,
            this.reactPortalStore,
            component,
            props,
            true
        );

        this._group?.updateActions();

        return {
            update: (props: Partial<P>) => {
                this.actionsPart.update(props);
            },
        };
    }

    public toJSON() {
        return {
            id: this.id,
        };
    }

    public update(params: PanelUpdateEvent) {
        this.part?.update(params.params);
    }

    public setVisible(isPanelVisible: boolean, group: IGroupview): void {
        this._group = group;
    }

    public layout(width: number, height: number): void {}

    public close(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public dispose() {
        this.part?.dispose();
        this.actionsPart?.dispose();
    }
}
