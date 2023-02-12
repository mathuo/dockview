import { Emitter, Event } from '../events';
import { BasePanelView } from '../gridview/basePanelView';
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
    setVisible(isVisible: boolean): void;
    setActive(): void;
    updateParameters(parameters: Parameters): void;
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
export abstract class PanelApiImpl
    extends CompositeDisposable
    implements PanelApi
{
    private _isFocused = false;
    private _isActive = false;
    private _isVisible = true;
    private _width = 0;
    private _height = 0;

    private readonly panelUpdatesDisposable = new MutableDisposable();

    readonly _onDidDimensionChange = new Emitter<PanelDimensionChangeEvent>({
        replay: true,
    });
    readonly onDidDimensionsChange = this._onDidDimensionChange.event;
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
    readonly onDidVisibilityChange: Event<VisibilityEvent> =
        this._onDidVisibilityChange.event;
    //

    readonly _onVisibilityChange = new Emitter<VisibilityEvent>();
    readonly onVisibilityChange: Event<VisibilityEvent> =
        this._onVisibilityChange.event;
    //
    readonly _onDidActiveChange = new Emitter<ActiveEvent>({
        replay: true,
    });
    readonly onDidActiveChange: Event<ActiveEvent> =
        this._onDidActiveChange.event;
    //
    readonly _onActiveChange = new Emitter<void>();
    readonly onActiveChange: Event<void> = this._onActiveChange.event;
    //
    readonly _onUpdateParameters = new Emitter<Parameters>();
    readonly onUpdateParameters: Event<Parameters> =
        this._onUpdateParameters.event;
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
            this.panelUpdatesDisposable,
            this._onDidDimensionChange,
            this._onDidChangeFocus,
            this._onDidVisibilityChange,
            this._onDidActiveChange,
            this._onFocusEvent,
            this._onActiveChange,
            this._onVisibilityChange,
            this._onUpdateParameters,
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

    public initialize(panel: IPanel): void {
        this.panelUpdatesDisposable.value = this._onUpdateParameters.event(
            (parameters) => {
                panel.update({
                    params: {
                        params: parameters,
                    },
                });
            }
        );
    }

    setVisible(isVisible: boolean) {
        this._onVisibilityChange.fire({ isVisible });
    }

    setActive(): void {
        this._onActiveChange.fire();
    }

    updateParameters(parameters: Parameters): void {
        this._onUpdateParameters.fire(parameters);
    }

    dispose() {
        super.dispose();
    }
}
