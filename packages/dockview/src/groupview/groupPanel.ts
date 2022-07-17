import { DockviewPanelApi } from '../api/groupPanelApi';
import { IDisposable } from '../lifecycle';
import { HeaderPartInitParameters } from './types';
import {
    IPanel,
    PanelInitParameters,
    PanelUpdateEvent,
    Parameters,
} from '../panel/types';
import { GroupPanel } from './groupviewPanel';
import { IGroupPanelView } from '../dockview/defaultGroupPanelView';

export interface IGroupPanelInitParameters
    extends PanelInitParameters,
        HeaderPartInitParameters {
    view: IGroupPanelView;
}

export type GroupPanelUpdateEvent = PanelUpdateEvent<{
    params?: Parameters;
    title?: string;
}>;

export interface IDockviewPanel extends IDisposable, IPanel {
    readonly view?: IGroupPanelView;
    readonly group: GroupPanel;
    readonly api: DockviewPanelApi;
    readonly title: string;
    readonly params: Record<string, any> | undefined;
    updateParentGroup(group: GroupPanel, isGroupActive: boolean): void;
    init(params: IGroupPanelInitParameters): void;
    toJSON(): GroupviewPanelState;
    update(event: GroupPanelUpdateEvent): void;
}

export interface GroupviewPanelState {
    id: string;
    view?: any;
    title: string;
    params?: { [key: string]: any };
}
