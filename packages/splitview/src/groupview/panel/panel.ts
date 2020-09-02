import { IGroupPanel, PanelInitParameters } from "./types";
import { GroupPanelApi } from "./api";
import { Event } from "../../events";
import { IGroupview, GroupChangeKind } from "../groupview";
import { MutableDisposable, CompositeDisposable } from "../../lifecycle";
import { PanelContentPart, PanelHeaderPart, ClosePanelResult } from "./parts";
import { PanelUpdateEvent } from "../../panel/types";

export class DefaultPanel extends CompositeDisposable implements IGroupPanel {
  private readonly mutableDisposable = new MutableDisposable();

  private readonly api: GroupPanelApi;
  private _group: IGroupview;
  private params: PanelInitParameters;

  readonly onDidStateChange: Event<any>;

  get group() {
    return this._group;
  }

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

    this.api = new GroupPanelApi(this, this._group);
    this.onDidStateChange = this.api.onDidStateChange;
  }

  public setDirty(isDirty: boolean) {
    this.api._onDidDirtyChange.fire(isDirty);
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
    //
  }

  public update(params: PanelUpdateEvent): void {
    this.params.params = { ...this.params.params, ...params };

    this.contentPart.update(params.params);
    this.api._onDidStateChange.fire();
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
    this._group = group;
    this.api.group = group;

    this.mutableDisposable.value = this._group.onDidGroupChange((ev) => {
      if (ev.kind === GroupChangeKind.GROUP_ACTIVE) {
        this.api._onDidChangeVisibility.fire({
          isVisible: this._group.isPanelActive(this),
        });
      }
    });

    this.api._onDidChangeFocus.fire({ isFocused: isGroupActive });
    this.api._onDidChangeVisibility.fire({
      isVisible: this._group.isPanelActive(this),
    });

    if (this.headerPart.setVisible) {
      this.headerPart.setVisible(
        this._group.isPanelActive(this),
        isGroupActive
      );
    }
    if (this.contentPart.setVisible) {
      this.contentPart.setVisible(
        this._group.isPanelActive(this),
        isGroupActive
      );
    }
  }

  public layout(width: number, height: number) {
    // thw height of the panel excluded the height of the title/tab
    this.api._onDidPanelDimensionChange.fire({
      width,
      height: height - (this.group?.tabHeight || 0),
    });
  }

  public dispose() {
    this.api.dispose();
    this.mutableDisposable.dispose();

    this.headerPart.dispose();
    this.contentPart.dispose();
  }
}
