import { Emitter, Event } from '../events';
import { FunctionOrValue } from '../types';
import { BaseViewApi, IBaseViewApi } from './api';

interface PanelConstraintChangeEvent {
    minimumSize?: FunctionOrValue<number>;
    maximumSize?: FunctionOrValue<number>;
}

interface SizeEvent {
    size: number;
}

export interface IPanelApi extends IBaseViewApi {
    onDidConstraintsChange: Event<PanelConstraintChangeEvent>;
    setConstraints(value: PanelConstraintChangeEvent): void;
    setSize(event: SizeEvent): void;
}

export class PanelApi extends BaseViewApi implements IPanelApi {
    readonly _onDidConstraintsChange = new Emitter<PanelConstraintChangeEvent>({
        emitLastValue: true,
    });
    readonly onDidConstraintsChange: Event<PanelConstraintChangeEvent> = this
        ._onDidConstraintsChange.event;
    //

    readonly _onDidSizeChange = new Emitter<SizeEvent>();
    readonly onDidSizeChange: Event<SizeEvent> = this._onDidSizeChange.event;
    //

    constructor() {
        super();
    }

    public setConstraints(value: PanelConstraintChangeEvent) {
        this._onDidConstraintsChange.fire(value);
    }

    public setSize(event: SizeEvent) {
        this._onDidSizeChange.fire(event);
    }
}
