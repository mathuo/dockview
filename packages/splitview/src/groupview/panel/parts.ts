import { IDisposable } from '../../lifecycle';
import { IGroupview } from '../groupview';
import { IGroupAccessor } from '../../layout';
import { IGroupPanelApi } from './api';
import { PanelInitParameters } from './types';
import { Constructor } from '../../types';

export enum ClosePanelResult {
    CLOSE = 'CLOSE',
    DONT_CLOSE = 'DONT_CLOSE',
}

interface BasePart extends IDisposable {
    init?(params: PartInitParameters): void;
    setVisible(isPanelVisible: boolean, isGroupVisible: boolean): void;
}

export interface WatermarkPartInitParameters {
    accessor: IGroupAccessor;
}

export interface PartInitParameters extends PanelInitParameters {
    api: IGroupPanelApi;
}

export interface PanelHeaderPart extends BasePart {
    id: string;
    element: HTMLElement;
    layout?(height: string): void;
    toJSON(): {};
}

export interface PanelContentPart extends BasePart {
    id: string;
    element: HTMLElement;
    layout?(width: number, height: number): void;
    close?(): Promise<ClosePanelResult>;
    focus(): void;
    onHide(): void;
    update(params: {}): void;
    toJSON(): {};
}

export interface WatermarkPart extends IDisposable {
    init?: (params: WatermarkPartInitParameters) => void;
    setVisible?(visible: boolean, group: IGroupview): void;
    element: HTMLElement;
}

// constructors

export interface PanelHeaderPartConstructor
    extends Constructor<PanelHeaderPart> {}
export interface PanelContentPartConstructor
    extends Constructor<PanelContentPart> {}

export interface WatermarkConstructor extends Constructor<WatermarkPart> {}
