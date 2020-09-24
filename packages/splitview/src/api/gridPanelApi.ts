import { Emitter, Event } from '../events';
import { FunctionOrValue } from '../types';
import { BaseViewApi, IBaseViewApi } from './api';

interface GridConstraintChangeEvent {
    minimumWidth?: FunctionOrValue<number>;
    minimumHeight?: FunctionOrValue<number>;
    maximumWidth?: FunctionOrValue<number>;
    maximumHeight?: FunctionOrValue<number>;
}

export interface IGridPanelApi extends IBaseViewApi {
    onDidConstraintsChange: Event<GridConstraintChangeEvent>;
    setConstraints(value: GridConstraintChangeEvent): void;
}

export class GridPanelApi extends BaseViewApi implements IGridPanelApi {
    readonly _onDidConstraintsChange = new Emitter<GridConstraintChangeEvent>({
        emitLastValue: true,
    });
    readonly onDidConstraintsChange: Event<GridConstraintChangeEvent> = this
        ._onDidConstraintsChange.event;

    constructor() {
        super();
    }

    public setConstraints(value: GridConstraintChangeEvent) {
        this._onDidConstraintsChange.fire(value);
    }
}
