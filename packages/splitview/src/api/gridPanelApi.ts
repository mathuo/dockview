import { Emitter, Event } from '../events';
import { FunctionOrValue } from '../types';
import { BaseViewApi, IBaseViewApi } from './api';

interface GridConstraintChangeEvent {
    minimumWidth?: FunctionOrValue<number>;
    minimumHeight?: FunctionOrValue<number>;
    maximumWidth?: FunctionOrValue<number>;
    maximumHeight?: FunctionOrValue<number>;
}

interface SizeEvent {
    width?: number;
    height?: number;
}

export interface IGridPanelApi extends IBaseViewApi {
    onDidConstraintsChange: Event<GridConstraintChangeEvent>;
    setConstraints(value: GridConstraintChangeEvent): void;
    setSize(event: SizeEvent): void;
}

export class GridPanelApi extends BaseViewApi implements IGridPanelApi {
    readonly _onDidConstraintsChange = new Emitter<GridConstraintChangeEvent>({
        emitLastValue: true,
    });
    readonly onDidConstraintsChange: Event<GridConstraintChangeEvent> = this
        ._onDidConstraintsChange.event;
    //

    readonly _onDidSizeChange = new Emitter<SizeEvent>();
    readonly onDidSizeChange: Event<SizeEvent> = this._onDidSizeChange.event;
    //

    constructor() {
        super();
    }

    public setConstraints(value: GridConstraintChangeEvent) {
        this._onDidConstraintsChange.fire(value);
    }

    public setSize(event: SizeEvent) {
        this._onDidSizeChange.fire(event);
    }
}
