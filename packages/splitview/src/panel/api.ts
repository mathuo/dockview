import { PanelDimensionChangeEvent } from './types'
import { Emitter, Event } from '../events'
import { CompositeDisposable, IDisposable } from '../lifecycle'
import { FunctionOrValue } from '../types'

// we've tried to do a bit better than the 'any' type.
// anything that is serializable JSON should be valid here
type StateObject =
    | number
    | string
    | boolean
    | undefined
    | null
    | object
    | StateObject[]
    | { [key: string]: StateObject }

interface State {
    [key: string]: StateObject
}

interface ChangeFocusEvent {
    isFocused: boolean
}

interface PanelConstraintChangeEvent {
    minimumSize?: number | (() => number)
    maximumSize?: number | (() => number)
}

export interface IBaseViewApi extends IDisposable {
    // events
    onDidDimensionsChange: Event<PanelDimensionChangeEvent>
    onDidStateChange: Event<void>
    onDidFocusChange: Event<ChangeFocusEvent>
    // state
    setState(key: string, value: StateObject): void
    setState(state: State): void
    getState: () => State
    getStateKey: <T extends StateObject>(key: string) => T
    //
    readonly isFocused: boolean
}

/**
 * A core api implementation that should be used across all panel-like objects
 */
export class BaseViewApi extends CompositeDisposable implements IBaseViewApi {
    private _state: State = {}
    private _isFocused: boolean

    readonly _onDidStateChange = new Emitter<void>()
    readonly onDidStateChange: Event<void> = this._onDidStateChange.event
    //
    readonly _onDidPanelDimensionChange = new Emitter<
        PanelDimensionChangeEvent
    >({
        emitLastValue: true,
    })
    readonly onDidDimensionsChange = this._onDidPanelDimensionChange.event
    //
    readonly _onDidChangeFocus = new Emitter<ChangeFocusEvent>({
        emitLastValue: true,
    })
    readonly onDidFocusChange: Event<ChangeFocusEvent> = this._onDidChangeFocus
        .event
    //

    get isFocused() {
        return this._isFocused
    }

    constructor() {
        super()

        this.addDisposables(
            this._onDidStateChange,
            this._onDidChangeFocus,
            this._onDidPanelDimensionChange,
            this.onDidFocusChange((event) => {
                this._isFocused = event.isFocused
            })
        )
    }

    public setState(
        key: string | { [key: string]: StateObject },
        value?: StateObject
    ) {
        if (typeof key === 'object') {
            this._state = key
        } else {
            this._state[key] = value
        }
        this._onDidStateChange.fire(undefined)
    }

    public getState(): State {
        return this._state
    }

    public getStateKey<T extends StateObject>(key: string): T {
        return this._state[key] as T
    }

    public dispose() {
        super.dispose()
    }
}

interface PanelConstraintChangeEvent {
    minimumSize?: FunctionOrValue<number>
    maximumSize?: FunctionOrValue<number>
}

export interface IPanelApi extends IBaseViewApi {
    onDidConstraintsChange: Event<PanelConstraintChangeEvent>
    setConstraints(value: PanelConstraintChangeEvent): void
}

export class PanelApi extends BaseViewApi implements IBaseViewApi {
    readonly _onDidConstraintsChange = new Emitter<PanelConstraintChangeEvent>({
        emitLastValue: true,
    })
    readonly onDidConstraintsChange: Event<PanelConstraintChangeEvent> = this
        ._onDidConstraintsChange.event

    constructor() {
        super()
    }

    public setConstraints(value: PanelConstraintChangeEvent) {
        this._onDidConstraintsChange.fire(value)
    }
}

interface GridConstraintChangeEvent {
    minimumWidth?: FunctionOrValue<number>
    minimumHeight?: FunctionOrValue<number>
    maximumWidth?: FunctionOrValue<number>
    maximumHeight?: FunctionOrValue<number>
}

export interface IGridApi extends IBaseViewApi {
    onDidConstraintsChange: Event<GridConstraintChangeEvent>
    setConstraints(value: GridConstraintChangeEvent): void
}

export class GridApi extends BaseViewApi implements IBaseViewApi {
    readonly _onDidConstraintsChange = new Emitter<GridConstraintChangeEvent>({
        emitLastValue: true,
    })
    readonly onDidConstraintsChange: Event<GridConstraintChangeEvent> = this
        ._onDidConstraintsChange.event

    constructor() {
        super()
    }

    public setConstraints(value: GridConstraintChangeEvent) {
        this._onDidConstraintsChange.fire(value)
    }
}
