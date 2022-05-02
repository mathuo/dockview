import { DockviewPanelApi } from '../api/groupPanelApi';
import { IDisposable } from '../lifecycle';
import { HeaderPartInitParameters } from './types';
import {
    IPanel,
    PanelInitParameters,
    PanelUpdateEvent,
    Parameters,
} from '../panel/types';
import { GroupviewPanel } from './groupviewPanel';
import { IGroupPanelView } from '../dockview/defaultGroupPanelView';

export interface IGroupPanelInitParameters
    extends PanelInitParameters,
        HeaderPartInitParameters {
    view: IGroupPanelView;
}

export type GroupPanelUpdateEvent = PanelUpdateEvent<{
    params?: Parameters;
    title?: string;
    suppressClosable?: boolean;
}>;

export interface IGroupPanel extends IDisposable, IPanel {
    readonly view?: IGroupPanelView;
    readonly group: GroupviewPanel;
    readonly api: DockviewPanelApi;
    readonly title: string;
    readonly suppressClosable: boolean;
    readonly params: Record<string, any> | undefined;
    updateParentGroup(group: GroupviewPanel, isGroupActive: boolean): void;
    init(params: IGroupPanelInitParameters): void;
    toJSON(): GroupviewPanelState;
    update(event: GroupPanelUpdateEvent): void;
}

export interface GroupviewPanelState {
    id: string;
    view?: any;
    title: string;
    params?: { [key: string]: any };
    suppressClosable?: boolean;
}
