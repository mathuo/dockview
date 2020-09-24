import { Emitter, Event } from '../events';
import { FunctionOrValue } from '../types';
import { BaseViewApi, IBaseViewApi } from './api';

interface PanelConstraintChangeEvent {
    minimumSize?: FunctionOrValue<number>;
    maximumSize?: FunctionOrValue<number>;
}

export interface IPanelApi extends IBaseViewApi {
    onDidConstraintsChange: Event<PanelConstraintChangeEvent>;
    setConstraints(value: PanelConstraintChangeEvent): void;
}

export class PanelApi extends BaseViewApi implements IPanelApi {
    readonly _onDidConstraintsChange = new Emitter<PanelConstraintChangeEvent>({
        emitLastValue: true,
    });
    readonly onDidConstraintsChange: Event<PanelConstraintChangeEvent> = this
        ._onDidConstraintsChange.event;

    constructor() {
        super();
    }

    public setConstraints(value: PanelConstraintChangeEvent) {
        this._onDidConstraintsChange.fire(value);
    }
}
