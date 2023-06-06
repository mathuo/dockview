import { IDockviewComponent } from './dockviewComponent';
import { DockviewPanelApi } from '../api/dockviewPanelApi';
import { PanelInitParameters, IPanel } from '../panel/types';
import { DockviewApi } from '../api/component.api';
import { Event } from '../events';
import { Optional } from '../types';
import { DockviewGroupPanel, IDockviewGroupPanel } from './dockviewGroupPanel';

export enum DockviewDropTargets {
    Tab,
    Panel,
    TabContainer,
    Edge,
}

export interface HeaderPartInitParameters {
    title: string;
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

export interface WatermarkRendererInitParameters {
    containerApi: DockviewApi;
    group?: IDockviewGroupPanel;
}

export interface IWatermarkRenderer
    extends Optional<
        Omit<IPanel, 'id' | 'init'>,
        'dispose' | 'update' | 'layout' | 'toJSON'
    > {
    readonly element: HTMLElement;
    init: (params: WatermarkRendererInitParameters) => void;
    updateParentGroup(group: DockviewGroupPanel, visible: boolean): void;
}

export interface ITabRenderer
    extends Optional<
        Omit<IPanel, 'id'>,
        'dispose' | 'update' | 'layout' | 'toJSON'
    > {
    readonly element: HTMLElement;
    init(parameters: GroupPanelPartInitParameters): void;
    onGroupChange?(group: DockviewGroupPanel): void;
    onPanelVisibleChange?(isPanelVisible: boolean): void;
}

export interface IContentRenderer
    extends Optional<
        Omit<IPanel, 'id'>,
        'dispose' | 'update' | 'layout' | 'toJSON'
    > {
    readonly element: HTMLElement;
    readonly onDidFocus?: Event<void>;
    readonly onDidBlur?: Event<void>;
    init(parameters: GroupPanelContentPartInitParameters): void;
    onGroupChange?(group: DockviewGroupPanel): void;
    onPanelVisibleChange?(isPanelVisible: boolean): void;
}

// watermark component

export interface WatermarkPartInitParameters {
    accessor: IDockviewComponent;
}

// constructors

export interface WatermarkConstructor {
    new (): IWatermarkRenderer;
}

export interface IGroupPanelInitParameters
    extends PanelInitParameters,
        HeaderPartInitParameters {
    //
}

export interface GroupviewPanelState {
    id: string;
    contentComponent?: string;
    tabComponent?: string;
    title?: string;
    params?: { [key: string]: any };
}
