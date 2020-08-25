import { addDisposableListener, Emitter, Event } from "../../events";
import { Droptarget, DroptargetEvent } from "../droptarget/droptarget";
import { CompositeDisposable } from "../../lifecycle";
import { TabChangedEvent, TabDropEvent, TabChangedEventType } from "../events";
import { IGroupview } from "../groupview";
import {
  DataTransferSingleton,
  DragType,
  extractData,
} from "../droptarget/dataTransfer";
import { IGroupAccessor } from "../../layout";
import { toggleClass } from "../../dom";

export interface ITab {
  id: string;
  element: HTMLElement;
  hasActiveDragEvent: boolean;
  setContent: (element: HTMLElement) => void;
  onChanged: Event<TabChangedEvent>;
  onDropped: Event<DroptargetEvent>;
  setActive(isActive: boolean): void;
  startDragEvent(): void;
  stopDragEvent(): void;
}

export class Tab extends CompositeDisposable implements ITab {
  private _element: HTMLElement;
  private dragInPlayDetails: { id?: string; isDragging: boolean } = {
    isDragging: false,
  };
  private droptarget: Droptarget;
  private content: HTMLElement;

  private readonly _onChanged = new Emitter<TabChangedEvent>();
  readonly onChanged: Event<TabChangedEvent> = this._onChanged.event;

  private readonly _onDropped = new Emitter<DroptargetEvent>();
  readonly onDropped: Event<DroptargetEvent> = this._onDropped.event;

  public get element() {
    return this._element;
  }

  public get hasActiveDragEvent() {
    return this.dragInPlayDetails?.isDragging;
  }

  public startDragEvent() {
    this.dragInPlayDetails = { isDragging: true, id: this.accessor.id };
  }

  public stopDragEvent() {
    this.dragInPlayDetails = { isDragging: false, id: undefined };
  }

  constructor(
    public id: string,
    private readonly accessor: IGroupAccessor,
    private group: IGroupview
  ) {
    super();

    this.addDisposables(this._onChanged, this._onDropped);

    this._element = document.createElement("div");
    this._element.className = "tab";
    this._element.draggable = true;

    this.addDisposables(
      addDisposableListener(this._element, "mousedown", (ev) => {
        if (ev.defaultPrevented) {
          return;
        }
        this._onChanged.fire({ type: TabChangedEventType.CLICK });
      }),
      addDisposableListener(this._element, "dragstart", (event) => {
        this.dragInPlayDetails = { isDragging: true, id: this.accessor.id };

        // set up a custom ghost image
        const dragImage = this._element.cloneNode(true) as HTMLElement;

        const box = this._element.getBoundingClientRect();

        // if the style of the tab is determined by CSS by a parent element that style will lost
        // therefore we must explicility re-add the style features that we know will be lost
        dragImage.style.height = `${box.height}px`;
        dragImage.style.width = `${box.width}px`;
        dragImage.style.position = "absolute";
        dragImage.classList.add("dragging");

        document.body.appendChild(dragImage);
        event.dataTransfer.setDragImage(
          dragImage,
          event.offsetX,
          event.offsetY
        );
        setTimeout(() => document.body.removeChild(dragImage), 0);
        // configure the data-transfer object

        const data = JSON.stringify({
          type: DragType.ITEM,
          itemId: this.id,
          groupId: this.group.id,
        });
        DataTransferSingleton.setData(this.dragInPlayDetails.id, data);

        event.dataTransfer.setData("text/plain", data);
        event.dataTransfer.effectAllowed = "move";
      }),
      addDisposableListener(this._element, "dragend", (ev) => {
        // drop events fire before dragend so we can remove this safely
        DataTransferSingleton.removeData(this.dragInPlayDetails.id);
        this.dragInPlayDetails = {
          isDragging: false,
          id: undefined,
        };
      })
    );

    this.droptarget = new Droptarget(this._element, {
      isDirectional: false,
      isDisabled: () => this.dragInPlayDetails.isDragging,
      id: this.accessor.id,
    });

    this.addDisposables(
      this.droptarget.onDidChange((event) => {
        this._onDropped.fire(event);
      })
    );
  }

  public setActive(isActive: boolean) {
    toggleClass(this.element, "active-tab", isActive);
    toggleClass(this.element, "inactive-tab", !isActive);
  }

  public setContent(element: HTMLElement) {
    if (this.content) {
      this._element.removeChild(this.content);
    }
    this.content = element;
    this._element.appendChild(this.content);
  }

  public dispose() {
    super.dispose();
    this.droptarget.dispose();
  }
}
