import { IDockviewComponent } from '../dockview/dockviewComponent';
import { DockviewPanelApi } from '../api/dockviewPanelApi';
import {
    PanelInitParameters,
    IPanel,
    PanelUpdateEvent,
    Parameters,
} from '../panel/types';
import { DockviewApi } from '../api/component.api';
import { GroupPanel } from './groupviewPanel';
import { Event } from '../events';
import { IGroupPanelView } from '../dockview/defaultGroupPanelView';

export interface IRenderable {
    id: string;
    element: HTMLElement;
    onDidFocus?: Event<void>;
    onDidBlur?: Event<void>;
}

export interface HeaderPartInitParameters {
    title?: string;
}

export interface GroupPanelPartInitParameters
    extends PanelInitParameters,
        HeaderPartInitParameters {
    api: DockviewPanelApi;
    containerApi: DockviewApi;
}

export interface GroupPanelContentPartInitParameters
    extends GroupPanelPartInitParameters {
    tab: ITabRenderer;
}

export interface IWatermarkRenderer extends IPanel {
    readonly element: HTMLElement;
    init: (params: GroupPanelPartInitParameters) => void;
    updateParentGroup(group: GroupPanel, visible: boolean): void;
}

export interface ITabRenderer extends IPanel {
    readonly element: HTMLElement;
    init(parameters: GroupPanelPartInitParameters): void;
    updateParentGroup(group: GroupPanel, isPanelVisible: boolean): void;
}

export interface IContentRenderer extends IPanel {
    readonly element: HTMLElement;
    readonly actions?: HTMLElement;
    readonly onDidFocus?: Event<void>;
    readonly onDidBlur?: Event<void>;
    updateParentGroup(group: GroupPanel, isPanelVisible: boolean): void;
    init(parameters: GroupPanelContentPartInitParameters): void;
    layout(width: number, height: number): void;
}

// watermark component

export interface WatermarkPartInitParameters {
    accessor: IDockviewComponent;
}

// constructors

export interface PanelHeaderPartConstructor {
    new (): ITabRenderer;
}
export interface PanelContentPartConstructor {
    new (): IContentRenderer;
}

export interface WatermarkConstructor {
    new (): IWatermarkRenderer;
}

export interface IGroupPanelInitParameters
    extends PanelInitParameters,
        HeaderPartInitParameters {
    view: IGroupPanelView;
}

export type GroupPanelUpdateEvent = PanelUpdateEvent<{
    params?: Parameters;
    title?: string;
}>;

export interface GroupviewPanelState {
    id: string;
    view?: any;
    title?: string;
    params?: { [key: string]: any };
}
