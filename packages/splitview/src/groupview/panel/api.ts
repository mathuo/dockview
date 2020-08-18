import { IGroupview } from "../groupview";
import { Event, Emitter } from "../../events";
import { ClosePanelResult } from "./parts";
import { IPanel } from "./types";
import { CompositeDisposable, IDisposable } from "../../lifecycle";

export type PanelStateChangeEvent = {
  isPanelVisible: boolean;
  isGroupActive: boolean;
};

export type PanelDimensionChangeEvent = {
  width: number;
  height: number;
};

export interface PanelApi extends IDisposable {
  onDidPanelStateChange: Event<PanelStateChangeEvent>;
  onDidPanelDimensionChange: Event<PanelDimensionChangeEvent>;
  isPanelVisible: boolean;
  isGroupActive: boolean;
  group: IGroupview;
  close: () => Promise<boolean>;
  setClosePanelHook(callback: () => Promise<ClosePanelResult>): void;
  canClose: () => Promise<ClosePanelResult>;
  setState(key: string, value: any);
  setState(state: { [index: string]: any });
  getState: () => { [index: string]: any };
  onDidStateChange: Event<any>;
  onDidDirtyChange: Event<boolean>;
}

export class PanelApiImpl extends CompositeDisposable implements PanelApi {
  private _isPanelVisible: boolean;
  private _isGroupActive: boolean;
  private _group: IGroupview;
  private _closePanelCallback: () => Promise<ClosePanelResult>;
  private _state: { [index: string]: any } = {};

  private readonly _onDidStateChange = new Emitter<any>();
  readonly onDidStateChange: Event<any> = this._onDidStateChange.event;

  get onDidPanelStateChange() {
    return this._event;
  }

  get onDidPanelDimensionChange() {
    return this._dimensionEvent;
  }

  get onDidDirtyChange() {
    return this._dirtyEvent;
  }

  get isGroupActive() {
    return this._isGroupActive;
  }

  get isPanelVisible() {
    return this._isPanelVisible;
  }

  get canClose() {
    return this._closePanelCallback;
  }

  set group(value: IGroupview) {
    this._group = value;
  }

  get group() {
    return this._group;
  }

  constructor(
    private _event: Event<PanelStateChangeEvent>,
    private _dimensionEvent: Event<PanelDimensionChangeEvent>,
    private _dirtyEvent: Event<boolean>,
    private panel: IPanel,
    group: IGroupview
  ) {
    super();
    this._group = group;

    this.addDisposables(
      this._event((event) => {
        this._isGroupActive = event.isGroupActive;
        this._isPanelVisible = event.isPanelVisible;
      })
    );
  }

  public setState(key: string | { [index: string]: any }, value?: any) {
    if (typeof key === "object") {
      this._state = key;
    } else {
      this._state[key] = value;
    }
    this._onDidStateChange.fire(undefined);
  }

  public getState(): { [index: string]: any } {
    return this._state;
  }

  public close() {
    return this.group.close(this.panel);
  }

  public setClosePanelHook(callback: () => Promise<ClosePanelResult>) {
    this._closePanelCallback = callback;
  }

  public dispose() {
    super.dispose();

    this._onDidStateChange.dispose();
  }
}
