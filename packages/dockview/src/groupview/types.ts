import { IDockviewComponent } from '../dockview/dockviewComponent';
import { DockviewPanelApi } from '../api/groupPanelApi';
import { PanelInitParameters, IPanel } from '../panel/types';
import { DockviewApi } from '../api/component.api';
import { GroupPanel } from './groupviewPanel';
import { Event } from '../events';

export interface IRenderable {
    id: string;
    element: HTMLElement;
    onDidFocus?: Event<void>;
    onDidBlur?: Event<void>;
}

export interface HeaderPartInitParameters {
    title: string;
    suppressClosable?: boolean;
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
