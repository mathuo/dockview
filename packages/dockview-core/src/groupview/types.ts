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
import {
    IDockviewPanelModel,
    SerializedGroupPanelView,
} from '../dockview/dockviewPanelModel';
import { Optional } from '../types';

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

export interface IWatermarkRenderer
    extends Optional<
        Omit<IPanel, 'id'>,
        'dispose' | 'update' | 'layout' | 'toJSON'
    > {
    readonly element: HTMLElement;
    init: (params: GroupPanelPartInitParameters) => void;
    updateParentGroup(group: GroupPanel, visible: boolean): void;
}

export interface ITabRenderer
    extends Optional<
        Omit<IPanel, 'id'>,
        'dispose' | 'update' | 'layout' | 'toJSON'
    > {
    readonly element: HTMLElement;
    init(parameters: GroupPanelPartInitParameters): void;
    onGroupChange?(group: GroupPanel): void;
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
    onGroupChange?(group: GroupPanel): void;
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

export type GroupPanelUpdateEvent = PanelUpdateEvent<{
    params?: Parameters;
    title?: string;
}>;

export interface GroupviewPanelState {
    id: string;
    contentComponent?: string;
    tabComponent?: string;
    title?: string;
    params?: { [key: string]: any };
    view?: SerializedGroupPanelView; // depreciated
}
