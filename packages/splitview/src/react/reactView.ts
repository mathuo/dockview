import { Emitter } from "../events";
import { IView } from "../splitview/splitview";
import { ReactLayout } from "./layout";
import { ReactPart } from "./react";

export class ReactView implements IView {
  private _element: HTMLElement;
  private part: ReactPart;

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
    private readonly component: React.FunctionComponent<{}>,
    private readonly parent: ReactLayout
  ) {
    if (!this.component) {
      throw new Error("React.FunctionalComponent cannot be undefined");
    }

    this._element = document.createElement("div");
  }

  layout(size: number, orthogonalSize: number) {}

  init(parameters: { params: any }): void {
    this.part = new ReactPart(
      this.element,
      {} as any,
      this.parent.addPortal,
      this.component,
      parameters.params
    );
  }

  update(params: {}) {
    this.part.update(params);
  }
}
