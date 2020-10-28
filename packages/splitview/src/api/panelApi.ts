import { Emitter, Event } from '../events';
import { IDisposable } from '../lifecycle';
import { FunctionOrValue } from '../types';
import { BaseViewApi, IBaseViewApi } from './api';

interface PanelConstraintChangeEvent {
    minimumSize?: FunctionOrValue<number>;
    maximumSize?: FunctionOrValue<number>;
}

interface PanelConstraintChangeEvent2 {
    minimumSize?: number;
    maximumSize?: number;
}

interface SizeEvent {
    size: number;
}

export interface IPanelApi extends IBaseViewApi {
    onDidConstraintsChange: Event<PanelConstraintChangeEvent2>;
    setConstraints(value: PanelConstraintChangeEvent): void;
    setSize(event: SizeEvent): void;
}

export class PanelApi extends BaseViewApi implements IPanelApi, IDisposable {
    readonly _onDidConstraintsChangeInternal = new Emitter<
        PanelConstraintChangeEvent
    >();
    readonly onDidConstraintsChangeInternal: Event<
        PanelConstraintChangeEvent
    > = this._onDidConstraintsChangeInternal.event;
    //

    readonly _onDidConstraintsChange = new Emitter<PanelConstraintChangeEvent2>(
        {
            replay: true,
        }
    );
    readonly onDidConstraintsChange: Event<PanelConstraintChangeEvent2> = this
        ._onDidConstraintsChange.event;
    //

    readonly _onDidSizeChange = new Emitter<SizeEvent>();
    readonly onDidSizeChange: Event<SizeEvent> = this._onDidSizeChange.event;
    //

    constructor() {
        super();
    }

    setConstraints(value: PanelConstraintChangeEvent) {
        this._onDidConstraintsChangeInternal.fire(value);
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
