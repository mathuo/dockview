import { trackFocus } from "../dom";
import { Emitter } from "../events";
import { PanelApi } from "../panel/api";
import { PanelDimensionChangeEvent } from "../panel/types";
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
  private api: PanelApi;

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
    this.api = new PanelApi();
    if (!this.component) {
      throw new Error("React.FunctionalComponent cannot be undefined");
    }

    this._element = document.createElement("div");
    this._element.tabIndex = -1;
    this._element.style.outline = "none";

    const { onDidFocus, onDidBlur } = trackFocus(this._element);

    this.addDisposables(
      onDidFocus(() => {
        this.api._onDidChangeFocus.fire({ isFocused: true });
      }),
      onDidBlur(() => {
        this.api._onDidChangeFocus.fire({ isFocused: false });
      })
    );
  }

  layout(width: number, height: number) {
    this.api._onDidPanelDimensionChange.fire({ width, height });
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
    super.dispose();
    this.api.dispose();
  }
}
