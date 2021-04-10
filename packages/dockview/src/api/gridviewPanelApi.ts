import { Emitter, Event } from '../events';
import { FunctionOrValue } from '../types';
import { PanelApiImpl, PanelApi } from './panelApi';

export interface GridConstraintChangeEvent {
    minimumWidth?: number;
    minimumHeight?: number;
    maximumWidth?: number;
    maximumHeight?: number;
}

interface GridConstraintChangeEvent2 {
    minimumWidth?: FunctionOrValue<number>;
    minimumHeight?: FunctionOrValue<number>;
    maximumWidth?: FunctionOrValue<number>;
    maximumHeight?: FunctionOrValue<number>;
}

export interface SizeEvent {
    width?: number;
    height?: number;
}

export interface GridviewPanelApi extends PanelApi {
    onDidConstraintsChange: Event<GridConstraintChangeEvent>;
    setConstraints(value: GridConstraintChangeEvent2): void;
    setSize(event: SizeEvent): void;
}

export class GridviewPanelApiImpl
    extends PanelApiImpl
    implements GridviewPanelApi {
    readonly _onDidConstraintsChangeInternal = new Emitter<GridConstraintChangeEvent2>();
    readonly onDidConstraintsChangeInternal: Event<GridConstraintChangeEvent2> = this
        ._onDidConstraintsChangeInternal.event;
    //

    readonly _onDidConstraintsChange = new Emitter<GridConstraintChangeEvent>({
        replay: true,
    });
    readonly onDidConstraintsChange: Event<GridConstraintChangeEvent> = this
        ._onDidConstraintsChange.event;
    //

    readonly _onDidSizeChange = new Emitter<SizeEvent>();
    readonly onDidSizeChange: Event<SizeEvent> = this._onDidSizeChange.event;
    //

    constructor(id: string) {
        super(id);
    }

    public setConstraints(value: GridConstraintChangeEvent) {
        this._onDidConstraintsChangeInternal.fire(value);
    }

    public setSize(event: SizeEvent) {
        this._onDidSizeChange.fire(event);
    }
}
