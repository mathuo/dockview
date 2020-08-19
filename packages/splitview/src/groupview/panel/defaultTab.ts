import { CompositeDisposable, MutableDisposable } from "../../lifecycle";
import { PanelHeaderPart, PartInitParameters } from "./parts";
import { addDisposableListener } from "../../events";
import { toggleClass } from "../../dom";

export class DefaultTab extends CompositeDisposable implements PanelHeaderPart {
  private _element: HTMLElement;
  private _isGroupActive: boolean;
  private _isPanelVisible: boolean;

  //
  private _content: HTMLElement;
  private _actionContainer: HTMLElement;
  private _list: HTMLElement;
  private _closeAnchor: HTMLElement;
  //
  private params: PartInitParameters;
  //
  private isDirtyDisposable = new MutableDisposable();

  get element() {
    return this._element;
  }

  get id() {
    return "__DEFAULT_TAB__";
  }

  constructor() {
    super();

    this._element = document.createElement("div");
    this._element.className = "default-tab";
    //
    this._content = document.createElement("div");
    this._content.className = "tab-content";
    //
    this._actionContainer = document.createElement("div");
    this._actionContainer.className = "action-container";
    //
    this._list = document.createElement("ul");
    this._list.className = "tab-list";
    //
    this._closeAnchor = document.createElement("a");
    this._closeAnchor.className = "close-action";
    //
    this._element.appendChild(this._content);
    this._element.appendChild(this._actionContainer);
    this._actionContainer.appendChild(this._list);
    this._list.appendChild(this._closeAnchor);
    //
    this.addDisposables(
      addDisposableListener(this._actionContainer, "mousedown", (ev) => {
        ev.preventDefault();
      }),
      addDisposableListener(this._closeAnchor, "click", (ev) => {
        ev.preventDefault(); //
        this.params.api.close();
      })
    );

    this.render();
  }

  public toJSON() {
    return { id: this.id };
  }

  public init(params: PartInitParameters) {
    this.params = params;
    this._content.textContent = params.title;

    this.isDirtyDisposable.value = this.params.api.onDidDirtyChange((event) => {
      const isDirty = event;
      toggleClass(this._closeAnchor, "dirty", isDirty);
    });

    if (this.params.suppressClosable && this._closeAnchor.parentElement) {
      this._closeAnchor.remove();
    }
  }

  public setVisible(isPanelVisible: boolean, isGroupVisible: boolean) {
    this._isPanelVisible = isPanelVisible;
    this._isGroupActive = isGroupVisible;

    this.render();
  }

  private render() {
    const color = this.getColor();
    const backgroundColor = this.getBackgroundColor();

    toggleClass(this._element, "active-tab", this._isPanelVisible);
    toggleClass(this._element, "inactive-tab", !this._isPanelVisible);

    this._element.style.color = color;
    this._element.style.backgroundColor = backgroundColor;
    this._closeAnchor.style.backgroundColor = color;
  }

  private getColor() {
    if (this._isGroupActive) {
      if (this._isPanelVisible) {
        return "var(--active-group-visible-panel-color)";
      }
      return "var(--active-group-hidden-panel-color)";
    }
    if (this._isPanelVisible) {
      return "var(--inactive-group-visible-panel-color)";
    }
    return "var(--inactive-group-hidden-panel-color)";
  }

  private getBackgroundColor() {
    return this._isPanelVisible
      ? "var(--panel-visible-color)"
      : "var(--panel-hidden-color)";
  }
}
