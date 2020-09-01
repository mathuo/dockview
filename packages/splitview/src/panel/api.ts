import { Emitter, Event } from "../events";
import { CompositeDisposable, IDisposable } from "../lifecycle";

export interface PanelDimensionChangeEvent {
  width: number;
  height: number;
}

// try and do a bit better than the 'any' type.
// anything that is serializable JSON should be valid
type StateObject =
  | number
  | string
  | boolean
  | undefined
  | null
  | object
  | StateObject[]
  | { [key: string]: StateObject };

export interface IBasePanelApi extends IDisposable {
  // events
  onDidPanelDimensionChange: Event<PanelDimensionChangeEvent>;
  // state
  setState(key: string, value: StateObject): void;
  setState(state: { [key: string]: StateObject }): void;
  getState: () => { [key: string]: StateObject };
  getStateKey: <T extends StateObject>(key: string) => T;
  onDidStateChange: Event<void>;
  //
  // onFocus(): Event<void>;
  // onBlur(): Event<void>;
}
export class BasePanelApi extends CompositeDisposable implements IBasePanelApi {
  private _state: { [key: string]: StateObject } = {};

  readonly _onDidStateChange = new Emitter<void>();
  readonly onDidStateChange: Event<void> = this._onDidStateChange.event;
  //
  readonly _onDidPanelDimensionChange = new Emitter<PanelDimensionChangeEvent>({
    emitLastValue: true,
  });
  readonly onDidPanelDimensionChange = this._onDidPanelDimensionChange.event;

  constructor() {
    super();

    this.addDisposables(
      this._onDidStateChange,
      this._onDidPanelDimensionChange
    );
  }

  public setState(
    key: string | { [key: string]: StateObject },
    value?: StateObject
  ) {
    if (typeof key === "object") {
      this._state = key;
    } else {
      this._state[key] = value;
    }
    this._onDidStateChange.fire(undefined);
  }

  public getState(): { [key: string]: StateObject } {
    return this._state;
  }

  public getStateKey(key: string) {
    // TODO - find an alternative to 'as any'
    return this._state[key] as any;
  }

  public dispose() {
    super.dispose();
  }
}
