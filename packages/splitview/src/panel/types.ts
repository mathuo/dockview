import { State } from '../api/api';
import { IDisposable } from '../lifecycle';

/**
 * A key-value object of anything that is a valid JavaScript Object.
 */
export interface Parameters {
    [key: string]: any;
}

export interface PanelInitParameters {
    params: Parameters;
    state?: State;
}

export interface PanelUpdateEvent {
    params: Parameters;
}

export interface IPanel extends IDisposable {
    readonly id: string;
    init?(params: PanelInitParameters): void;
    layout(width: number, height: number): void;
    update?(event: PanelUpdateEvent): void;
    toJSON?(): object;
}

export interface IFrameworkPart extends IDisposable {
    update(params: { [index: string]: any }): void;
}
