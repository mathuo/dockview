import { Emitter, Event } from '../events';
import { CompositeDisposable } from '../lifecycle';

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

export interface FocusEvent {
    isFocused: boolean;
}
export interface PanelDimensionChangeEvent {
    width: number;
    height: number;
}

export interface VisibilityEvent {
    isVisible: boolean;
}

export interface ActiveEvent {
    isActive: boolean;
}

export interface IBaseViewApi {
    // events
    onDidDimensionsChange: Event<PanelDimensionChangeEvent>;
    onDidStateChange: Event<void>;
    onDidFocusChange: Event<FocusEvent>;
    onDidVisibilityChange: Event<VisibilityEvent>;
    onDidActiveChange: Event<ActiveEvent>;
    onFocusEvent: Event<void>;
    //
    setVisible(isVisible: boolean): void;
    setActive(): void;
    // state
    setState(key: string, value: StateObject): void;
    setState(state: State): void;
    getState: () => State;
    getStateKey: <T extends StateObject>(key: string) => T;
    /**
     * The id of the panel that would have been assigned when the panel was created
     */
    readonly id: string;
    /**
     * Whether the panel holds the current focus
     */
    readonly isFocused: boolean;
    /**
     * Whether the panel is the actively selected panel
     */
    readonly isActive: boolean;
    /**
     * Whether the panel is visible
     */
    readonly isVisible: boolean;
    /**
     * The panel width in pixels
     */
    readonly width: number;
    /**
     * The panel height in pixels
     */
    readonly height: number;
}

/**
 * A core api implementation that should be used across all panel-like objects
 */
export class BaseViewApi extends CompositeDisposable implements IBaseViewApi {
    private _state: State = {};
    private _isFocused = false;
    private _isActive = false;
    private _isVisible = true;
    private _width = 0;
    private _height = 0;

    readonly _onDidStateChange = new Emitter<void>();
    readonly onDidStateChange: Event<void> = this._onDidStateChange.event;
    //
    readonly _onDidPanelDimensionChange = new Emitter<PanelDimensionChangeEvent>(
        {
            replay: true,
        }
    );
    readonly onDidDimensionsChange = this._onDidPanelDimensionChange.event;
    //
    readonly _onDidChangeFocus = new Emitter<FocusEvent>({
        replay: true,
    });
    readonly onDidFocusChange: Event<FocusEvent> = this._onDidChangeFocus.event;
    //
    readonly _onFocusEvent = new Emitter<void>();
    readonly onFocusEvent: Event<void> = this._onFocusEvent.event;
    //
    readonly _onDidVisibilityChange = new Emitter<VisibilityEvent>({
        replay: true,
    });
    readonly onDidVisibilityChange: Event<VisibilityEvent> = this
        ._onDidVisibilityChange.event;
    //

    readonly _onVisibilityChange = new Emitter<VisibilityEvent>();
    readonly onVisibilityChange: Event<VisibilityEvent> = this
        ._onVisibilityChange.event;
    //
    readonly _onDidActiveChange = new Emitter<ActiveEvent>({
        replay: true,
    });
    readonly onDidActiveChange: Event<ActiveEvent> = this._onDidActiveChange
        .event;
    //
    readonly _onActiveChange = new Emitter<void>();
    readonly onActiveChange: Event<void> = this._onActiveChange.event;
    //

    get isFocused() {
        return this._isFocused;
    }

    get isActive() {
        return this._isActive;
    }
    get isVisible() {
        return this._isVisible;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    constructor(readonly id: string) {
        super();

        this.addDisposables(
            this._onDidStateChange,
            this._onDidPanelDimensionChange,
            this._onDidChangeFocus,
            this._onDidVisibilityChange,
            this._onDidActiveChange,
            this._onFocusEvent,
            this.onDidFocusChange((event) => {
                this._isFocused = event.isFocused;
            }),
            this.onDidActiveChange((event) => {
                this._isActive = event.isActive;
            }),
            this.onDidVisibilityChange((event) => {
                this._isVisible = event.isVisible;
            }),
            this.onDidDimensionsChange((event) => {
                this._width = event.width;
                this._height = event.height;
            })
        );
    }

    setVisible(isVisible: boolean) {
        this._onVisibilityChange.fire({ isVisible });
    }

    setActive(): void {
        this._onActiveChange.fire();
    }

    setState(
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

    getState(): State {
        return this._state;
    }

    getStateKey<T extends StateObject>(key: string): T {
        return this._state[key] as T;
    }

    dispose() {
        super.dispose();
    }
}
