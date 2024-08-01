import { Emitter, Event } from '../events';
import { GridviewPanel } from '../gridview/gridviewPanel';
import { IPanel } from '../panel/types';
import { layoutPriorityAsNumber } from '../splitview/splitview';
import { FunctionOrValue } from '../types';
import { PanelApiImpl, PanelApi } from './panelApi';

export interface GridConstraintChangeEvent {
    readonly minimumWidth?: number;
    readonly minimumHeight?: number;
    readonly maximumWidth?: number;
    readonly maximumHeight?: number;
}

interface GridConstraintChangeEvent2 {
    readonly minimumWidth?: FunctionOrValue<number>;
    readonly minimumHeight?: FunctionOrValue<number>;
    readonly maximumWidth?: FunctionOrValue<number>;
    readonly maximumHeight?: FunctionOrValue<number>;
}

export interface SizeEvent {
    readonly width?: number;
    readonly height?: number;
}

export interface GridviewPanelApi extends PanelApi {
    readonly onDidConstraintsChange: Event<GridConstraintChangeEvent>;
    setConstraints(value: GridConstraintChangeEvent2): void;
    setSize(event: SizeEvent): void;
    readonly priority: number;
}

export class GridviewPanelApiImpl
    extends PanelApiImpl
    implements GridviewPanelApi
{
    private readonly _onDidConstraintsChangeInternal =
        new Emitter<GridConstraintChangeEvent2>();
    readonly onDidConstraintsChangeInternal: Event<GridConstraintChangeEvent2> =
        this._onDidConstraintsChangeInternal.event;

    readonly _onDidConstraintsChange = new Emitter<GridConstraintChangeEvent>();
    readonly onDidConstraintsChange: Event<GridConstraintChangeEvent> =
        this._onDidConstraintsChange.event;

    private readonly _onDidSizeChange = new Emitter<SizeEvent>();
    readonly onDidSizeChange: Event<SizeEvent> = this._onDidSizeChange.event;

    get priority(): number {
        return this.gridPanel?.priority
            ? layoutPriorityAsNumber(this.gridPanel.priority)
            : 0;
    }

    constructor(
        id: string,
        component: string,
        private readonly gridPanel?: GridviewPanel
    ) {
        super(id, component);

        this.addDisposables(
            this._onDidConstraintsChangeInternal,
            this._onDidConstraintsChange,
            this._onDidSizeChange
        );

        if (gridPanel) {
            this.initialize(gridPanel);
        }
    }

    public setConstraints(value: GridConstraintChangeEvent): void {
        this._onDidConstraintsChangeInternal.fire(value);
    }

    public setSize(event: SizeEvent): void {
        this._onDidSizeChange.fire(event);
    }
}
