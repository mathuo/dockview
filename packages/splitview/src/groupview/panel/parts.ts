import { IDisposable } from '../../lifecycle';
import { IGroupview } from '../groupview';
import { IGroupAccessor } from '../../dockview';
import { IGroupPanelApi } from '../../api/groupPanelApi';
import { Constructor } from '../../types';
import { InitParameters, IPanel } from '../../panel/types';

export enum ClosePanelResult {
    CLOSE = 'CLOSE',
    DONT_CLOSE = 'DONT_CLOSE',
}

export interface WatermarkPartInitParameters {
    accessor: IGroupAccessor;
}

export interface HeaderInitParameters {
    title: string;
    suppressClosable?: boolean;
}

export interface IGroupPanelInitParameters
    extends InitParameters,
        HeaderInitParameters {
    headerPart: PanelHeaderPart;
    contentPart: PanelContentPart;
    // api: IGroupPanelApi;
}

export interface PartInitParameters
    extends InitParameters,
        HeaderInitParameters {
    api: IGroupPanelApi;
}

export interface PanelHeaderPart extends IPanel, IDisposable {
    id: string;
    element: HTMLElement;
    init?(parameters: PartInitParameters);
    toJSON(): {};
    setVisible(isPanelVisible: boolean, isGroupVisible: boolean): void;
}

export interface PanelContentPart extends IPanel, IDisposable {
    id: string;
    element: HTMLElement;
    init?(parameters: PartInitParameters);
    layout?(width: number, height: number): void;
    close?(): Promise<ClosePanelResult>;
    focus(): void;
    onHide(): void;
    update(params: {}): void;
    toJSON(): {};
    setVisible(isPanelVisible: boolean, isGroupVisible: boolean): void;
}

export interface WatermarkPart extends IDisposable {
    init?: (params: WatermarkPartInitParameters) => void;
    setVisible?(visible: boolean, group: IGroupview): void;
    element: HTMLElement;
}

// constructors

export interface PanelHeaderPartConstructor {
    new (): PanelHeaderPart;
}
export interface PanelContentPartConstructor {
    new (): PanelContentPart;
}

export interface WatermarkConstructor extends Constructor<WatermarkPart> {}
