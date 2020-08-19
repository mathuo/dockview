import { IPanel, PanelInitParameters, PanelUpdateEvent } from "./types";
import {
  PanelApiImpl,
  PanelStateChangeEvent,
  PanelDimensionChangeEvent,
  PanelApi,
} from "./api";
import { Emitter, Event } from "../../events";
import { IGroupview, GroupChangeKind } from "../groupview";
import { MutableDisposable, CompositeDisposable } from "../../lifecycle";
import { PanelContentPart, PanelHeaderPart, ClosePanelResult } from "./parts";

export class DefaultPanel extends CompositeDisposable implements IPanel {
  private readonly mutableDisposable = new MutableDisposable();
  private readonly _onDidPanelStateChange = new Emitter<PanelStateChangeEvent>({
    emitLastValue: true,
  });
  private readonly _onDidPanelDimensionsChange = new Emitter<
    PanelDimensionChangeEvent
  >();
  private readonly _onDidDirtyChange = new Emitter<boolean>();

  private readonly api: PanelApi;
  private group: IGroupview;
  private params: PanelInitParameters;

  private readonly _onDidStateChange = new Emitter<any>();
  readonly onDidStateChange: Event<any> = this._onDidStateChange.event;

  get header() {
    return this.headerPart;
  }

  get content() {
    return this.contentPart;
  }

  constructor(
    public readonly id: string,
    private readonly headerPart: PanelHeaderPart,
    private readonly contentPart: PanelContentPart
  ) {
    super();

    this.api = new PanelApiImpl(
      this._onDidPanelStateChange.event,
      this._onDidPanelDimensionsChange.event,
      this._onDidDirtyChange.event,
      this,
      this.group
    );

    this.addDisposables(
      this.api.onDidStateChange((e) => {
        this._onDidStateChange.fire(undefined);
      })
    );
  }

  public setDirty(isDirty: boolean) {
    this._onDidDirtyChange.fire(isDirty);
  }

  public close(): Promise<ClosePanelResult> {
    if (this.api.canClose) {
      return this.api.canClose();
    }

    return Promise.resolve(ClosePanelResult.CLOSE);
  }

  public toJSON(): object {
    return {
      id: this.id,
      content: this.contentPart.toJSON(),
      tab: this.headerPart.toJSON(),
      props: this.params.params,
      title: this.params.title,
      suppressClosable: this.params.suppressClosable,
      state: this.api.getState(),
    };
  }

  public fromJSON(data: object) {
    // this.
  }

  public update(params: PanelUpdateEvent): void {
    this.params.params = { ...this.params.params, ...params };

    this.contentPart.update(params.params);
    this._onDidStateChange.fire(undefined);
  }

  public init(params: PanelInitParameters): void {
    this.params = params;
    this.api.setState(this.params.state);
    if (this.content.init) {
      this.content.init({ ...params, api: this.api });
    }
    if (this.header.init) {
      this.header.init({ ...params, api: this.api });
    }
  }

  public onHide() {
    //
  }

  public focus() {
    //
  }

  public setVisible(isGroupActive: boolean, group: IGroupview) {
    this.group = group;
    this.api.group = group;

    this.mutableDisposable.value = this.group.onDidGroupChange((ev) => {
      if (ev.kind === GroupChangeKind.GROUP_ACTIVE) {
        //
        this._onDidPanelStateChange.fire({
          isGroupActive,
          isPanelVisible: this.group.isActive(this),
        });
      }
    });

    this._onDidPanelStateChange.fire({
      isGroupActive,
      isPanelVisible: this.group.isActive(this),
    });

    if (this.headerPart.setVisible) {
      this.headerPart.setVisible(this.group.isActive(this), isGroupActive);
    }
    if (this.contentPart.setVisible) {
      this.contentPart.setVisible(this.group.isActive(this), isGroupActive);
    }
  }

  public layout(width: number, height: number) {
    this._onDidPanelDimensionsChange.fire({ width, height });
  }

  public dispose() {
    this._onDidStateChange.dispose();
    this._onDidPanelStateChange.dispose();
    this._onDidPanelDimensionsChange.dispose();
    this._onDidDirtyChange.dispose();
    this.api.dispose();
    this.mutableDisposable.dispose();

    this.headerPart.dispose();
    this.contentPart.dispose();
  }
}
