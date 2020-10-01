import { Emitter, Event } from '../events';
import { CompositeDisposable, IDisposable } from '../lifecycle';

/**
 * A valid JSON type
 */
export type StateObject =
    | number
    | string
    | boolean
    | null
    | object
    | StateObject[]
    | { [key: string]: StateObject };

/**
 * A JSON-serializable object
 */
export interface State {
    [key: string]: StateObject;
}

interface FocusEvent {
    isFocused: boolean;
}
interface PanelDimensionChangeEvent {
    width: number;
    height: number;
}

interface VisibilityEvent {
    isVisible: boolean;
}

export interface IBaseViewApi extends IDisposable {
    // events
    onDidDimensionsChange: Event<PanelDimensionChangeEvent>;
    onDidStateChange: Event<void>;
    onDidFocusChange: Event<FocusEvent>;
    onDidVisibilityChange: Event<VisibilityEvent>;
    // state
    setState(key: string, value: StateObject): void;
    setState(state: State): void;
    getState: () => State;
    getStateKey: <T extends StateObject>(key: string) => T;
    //
    readonly isFocused: boolean;
    readonly width: number;
    readonly height: number;
}

/**
 * A core api implementation that should be used across all panel-like objects
 */
export class BaseViewApi extends CompositeDisposable implements IBaseViewApi {
    private _state: State = {};
    private _isFocused: boolean;
    private _width = 0;
    private _height = 0;

    readonly _onDidStateChange = new Emitter<void>();
    readonly onDidStateChange: Event<void> = this._onDidStateChange.event;
    //
    readonly _onDidPanelDimensionChange = new Emitter<
        PanelDimensionChangeEvent
    >({
        emitLastValue: true,
    });
    readonly onDidDimensionsChange = this._onDidPanelDimensionChange.event;
    //
    readonly _onDidChangeFocus = new Emitter<FocusEvent>({
        emitLastValue: true,
    });
    readonly onDidFocusChange: Event<FocusEvent> = this._onDidChangeFocus.event;
    //
    readonly _onDidVisibilityChange = new Emitter<VisibilityEvent>({
        emitLastValue: true,
    });
    readonly onDidVisibilityChange: Event<VisibilityEvent> = this
        ._onDidVisibilityChange.event;
    //

    get isFocused() {
        return this._isFocused;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    constructor() {
        super();

        this.addDisposables(
            this._onDidStateChange,
            this._onDidChangeFocus,
            this._onDidPanelDimensionChange,
            this.onDidFocusChange((event) => {
                this._isFocused = event.isFocused;
            }),
            this.onDidDimensionsChange((event) => {
                this._width = event.width;
                this._height = event.height;
            })
        );
    }

    public setState(
        key: string | { [key: string]: StateObject },
        value?: StateObject
    ) {
        if (typeof key === 'object') {
            this._state = key;
        } else {
            this._state[key] = value;
        }
        this._onDidStateChange.fire(undefined);
    }

    public getState(): State {
        return this._state;
    }

    public getStateKey<T extends StateObject>(key: string): T {
        return this._state[key] as T;
    }

    public dispose() {
        super.dispose();
    }
}
