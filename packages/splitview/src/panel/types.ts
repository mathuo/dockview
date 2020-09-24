import { IDisposable } from '../lifecycle';

export interface PanelInitParameters {
    params: { [index: string]: any };
    state?: { [index: string]: any };
}

export interface PanelUpdateEvent {
    params: { [index: string]: any };
}

export interface IPanel extends IDisposable {
    init?(params: PanelInitParameters): void;
    layout?(width: number, height: number): void;
    update?(event: PanelUpdateEvent): void;
    toJSON?(): object;
}
