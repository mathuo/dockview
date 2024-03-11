import { Emitter, Event } from '../events';
import { IDisposable } from '../lifecycle';
import { FunctionOrValue } from '../types';
import { PanelApiImpl, PanelApi } from './panelApi';

interface PanelConstraintChangeEvent2 {
    readonly minimumSize?: FunctionOrValue<number>;
    readonly maximumSize?: FunctionOrValue<number>;
}

export interface PanelConstraintChangeEvent {
    readonly minimumSize?: number;
    readonly maximumSize?: number;
}

export interface PanelSizeEvent {
    readonly size: number;
}

export interface SplitviewPanelApi extends PanelApi {
    readonly onDidConstraintsChange: Event<PanelConstraintChangeEvent>;
    setConstraints(value: PanelConstraintChangeEvent2): void;
    setSize(event: PanelSizeEvent): void;
}

export class SplitviewPanelApiImpl
    extends PanelApiImpl
    implements SplitviewPanelApi, IDisposable
{
    readonly _onDidConstraintsChangeInternal =
        new Emitter<PanelConstraintChangeEvent2>();
    readonly onDidConstraintsChangeInternal: Event<PanelConstraintChangeEvent2> =
        this._onDidConstraintsChangeInternal.event;
    //

    readonly _onDidConstraintsChange = new Emitter<PanelConstraintChangeEvent>({
        replay: true,
    });
    readonly onDidConstraintsChange: Event<PanelConstraintChangeEvent> =
        this._onDidConstraintsChange.event;
    //

    readonly _onDidSizeChange = new Emitter<PanelSizeEvent>();
    readonly onDidSizeChange: Event<PanelSizeEvent> =
        this._onDidSizeChange.event;
    //

    constructor(id: string, component: string) {
        super(id, component);

        this.addDisposables(
            this._onDidConstraintsChangeInternal,
            this._onDidConstraintsChange,
            this._onDidSizeChange
        );
    }

    setConstraints(value: PanelConstraintChangeEvent2) {
        this._onDidConstraintsChangeInternal.fire(value);
    }

    setSize(event: PanelSizeEvent) {
        this._onDidSizeChange.fire(event);
    }
}
