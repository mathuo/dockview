import { trackFocus } from "../dom";
import { Emitter } from "../events";
import { BasePanelApi, PanelDimensionChangeEvent } from "../panel/api";
import { CompositeDisposable } from "../lifecycle";
import { IView } from "../splitview/splitview";
import { ReactLayout } from "./layout";
import { ReactPart } from "./react";
import { ISplitviewPanelProps } from "./splitview";
import { PanelUpdateEvent, InitParameters, IPanel } from "../panel/types";

/**
 * A no-thrills implementation of IView that renders a React component
 */
export class ReactComponentView
  extends CompositeDisposable
  implements IView, IPanel {
  private _element: HTMLElement;
  private part: ReactPart;
  private params: { params: any };
  private api: BasePanelApi;
  private readonly _onDidPanelDimensionsChange = new Emitter<
    PanelDimensionChangeEvent
  >();

  private _onDidChange: Emitter<number | undefined> = new Emitter<
    number | undefined
  >();
  public onDidChange = this._onDidChange.event;

  get element() {
    return this._element;
  }

  get minimumSize() {
    return 100;
  }
  // get snapSize() {
  //   return 100;
  // }

  get maximumSize() {
    return Number.MAX_SAFE_INTEGER;
  }

  constructor(
    public readonly id: string,
    private readonly componentName: string,
    private readonly component: React.FunctionComponent<ISplitviewPanelProps>,
    private readonly parent: ReactLayout
  ) {
    super();
    this.api = new BasePanelApi(this._onDidPanelDimensionsChange.event);
    if (!this.component) {
      throw new Error("React.FunctionalComponent cannot be undefined");
    }

    this._element = document.createElement("div");

    const { onDidFocus } = trackFocus(this.element);

    this.addDisposables(
      this._onDidPanelDimensionsChange,
      onDidFocus(() => {
        //
      })
    );
  }

  layout(width: number, height: number) {
    this._onDidPanelDimensionsChange.fire({ width, height });
  }

  init(parameters: InitParameters): void {
    this.params = parameters;
    this.part = new ReactPart(
      this.element,
      this.api,
      this.parent.addPortal,
      this.component,
      parameters.params
    );
  }

  update(params: PanelUpdateEvent) {
    this.params = { ...this.params.params, ...params };
    this.part.update(params);
  }

  toJSON(): object {
    return {
      id: this.id,
      component: this.componentName,
      props: this.params.params,
      state: this.api.getState(),
    };
  }

  dispose() {
    this._onDidPanelDimensionsChange.dispose();
    this.api.dispose();
  }
}
