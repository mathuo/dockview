import { DockviewEvent, Emitter, Event } from '../events';
import { CompositeDisposable, MutableDisposable } from '../lifecycle';
import { IPanel, Parameters } from '../panel/types';

export interface FocusEvent {
    readonly isFocused: boolean;
}
export interface PanelDimensionChangeEvent {
    readonly width: number;
    readonly height: number;
}

export interface VisibilityEvent {
    readonly isVisible: boolean;
}

export interface ActiveEvent {
    readonly isActive: boolean;
}

export interface PanelApi {
    // events
    readonly onDidDimensionsChange: Event<PanelDimensionChangeEvent>;
    readonly onDidFocusChange: Event<FocusEvent>;
    readonly onDidVisibilityChange: Event<VisibilityEvent>;
    readonly onDidActiveChange: Event<ActiveEvent>;
    readonly onDidParametersChange: Event<Parameters>;
    setActive(): void;
    setVisible(isVisible: boolean): void;
    updateParameters(parameters: Parameters): void;
    /**
     * The id of the component renderer
     */
    readonly component: string;
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

    readonly onWillFocus: Event<WillFocusEvent>;

    getParameters<T extends Parameters = Parameters>(): T;
}

export class WillFocusEvent extends DockviewEvent {
    constructor() {
        super();
    }
}

/**
 * A core api implementation that should be used across all panel-like objects
 */
export class PanelApiImpl extends CompositeDisposable implements PanelApi {
    private _isFocused = false;
    private _isActive = false;
    private _isVisible = true;
    private _width = 0;
    private _height = 0;
    private _parameters: Parameters = {};

    private readonly panelUpdatesDisposable = new MutableDisposable();

    readonly _onDidDimensionChange = new Emitter<PanelDimensionChangeEvent>();
    readonly onDidDimensionsChange = this._onDidDimensionChange.event;

    readonly _onDidChangeFocus = new Emitter<FocusEvent>();
    readonly onDidFocusChange: Event<FocusEvent> = this._onDidChangeFocus.event;
    //
    readonly _onWillFocus = new Emitter<WillFocusEvent>();
    readonly onWillFocus: Event<WillFocusEvent> = this._onWillFocus.event;
    //
    readonly _onDidVisibilityChange = new Emitter<VisibilityEvent>();
    readonly onDidVisibilityChange: Event<VisibilityEvent> =
        this._onDidVisibilityChange.event;

    readonly _onWillVisibilityChange = new Emitter<VisibilityEvent>();
    readonly onWillVisibilityChange: Event<VisibilityEvent> =
        this._onWillVisibilityChange.event;

    readonly _onDidActiveChange = new Emitter<ActiveEvent>();
    readonly onDidActiveChange: Event<ActiveEvent> =
        this._onDidActiveChange.event;

    readonly _onActiveChange = new Emitter<void>();
    readonly onActiveChange: Event<void> = this._onActiveChange.event;

    readonly _onDidParametersChange = new Emitter<Parameters>();
    readonly onDidParametersChange: Event<Parameters> =
        this._onDidParametersChange.event;

    get isFocused(): boolean {
        return this._isFocused;
    }

    get isActive(): boolean {
        return this._isActive;
    }

    get isVisible(): boolean {
        return this._isVisible;
    }

    get width(): number {
        return this._width;
    }

    get height(): number {
        return this._height;
    }

    constructor(readonly id: string, readonly component: string) {
        super();

        this.addDisposables(
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
            }),
            this.panelUpdatesDisposable,
            this._onDidDimensionChange,
            this._onDidChangeFocus,
            this._onDidVisibilityChange,
            this._onDidActiveChange,
            this._onWillFocus,
            this._onActiveChange,
            this._onWillFocus,
            this._onWillVisibilityChange,
            this._onDidParametersChange
        );
    }

    getParameters<T extends Parameters = Parameters>(): T {
        return this._parameters as T;
    }

    public initialize(panel: IPanel): void {
        this.panelUpdatesDisposable.value = this._onDidParametersChange.event(
            (parameters) => {
                this._parameters = parameters;
                panel.update({
                    params: parameters,
                });
            }
        );
    }

    setVisible(isVisible: boolean): void {
        this._onWillVisibilityChange.fire({ isVisible });
    }

    setActive(): void {
        this._onActiveChange.fire();
    }

    updateParameters(parameters: Parameters): void {
        this._onDidParametersChange.fire(parameters);
    }
}
