import { CompositeDisposable, IDisposable } from "../types";
import { IPanel } from "./group";
import { Emitter, Event } from "../events";
import { trackFocus } from "../dom";

export interface IContentContainer extends IDisposable {
  onDidFocus: Event<void>;
  element: HTMLElement;
  openPanel: (panel: IPanel) => void;
  closePanel: () => void;
}

export class ContentContainer extends CompositeDisposable
  implements IContentContainer {
  private _element: HTMLElement;
  private content: HTMLElement;

  private readonly _onDidFocus = new Emitter<void>();
  readonly onDidFocus: Event<void> = this._onDidFocus.event;

  get element() {
    return this._element;
  }

  constructor() {
    super();
    this._element = document.createElement("div");
    this._element.className = "content-container";
    this._element.tabIndex = -1;

    const { onDidBlur, onDidFocus } = trackFocus(this._element);

    onDidFocus(() => this._onDidFocus.fire());
  }

  public openPanel(panel: IPanel) {
    if (this.content) {
      this._element.removeChild(this.content);
      this.content = undefined;
    }
    this.content = panel.content;
    this._element.appendChild(this.content);
  }

  public closePanel() {
    if (this.content) {
      this._element.removeChild(this.content);
      this.content = undefined;
    }
  }

  public dispose() {
    super.dispose();
  }
}
