import { Emitter, Event } from '../events';
import { IDisposable } from '../lifecycle';
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

export class PanelApi extends BaseViewApi implements IPanelApi, IDisposable {
    readonly _onDidConstraintsChange = new Emitter<PanelConstraintChangeEvent>({
        replay: true,
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

    setConstraints(value: PanelConstraintChangeEvent) {
        this._onDidConstraintsChange.fire(value);
    }

    setSize(event: SizeEvent) {
        this._onDidSizeChange.fire(event);
    }

    dispose() {
        super.dispose();
        this._onDidConstraintsChange.dispose();
        this._onDidSizeChange.dispose();
    }
}
