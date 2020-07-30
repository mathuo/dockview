import { addDisposableListener, Emitter, Event } from "../../events";
import { Droptarget } from "../droptarget/droptarget";
import { CompositeDisposable } from "../../types";
import { TabChangedEvent, TabDropEvent, TabChangedEventType } from "../events";
import { DRAG_TYPE } from "../groupview";

export interface ITab {
  id: string;
  element: HTMLElement;
  hasActiveDragEvent: boolean;
  setContent: (element: HTMLElement) => void;
  onChanged: Event<TabChangedEvent>;
  onDropped: Event<TabDropEvent>;
}

export class Tab extends CompositeDisposable implements ITab {
  private _element: HTMLElement;
  private dragInProgresss: boolean;
  private droptarget: Droptarget;
  private content: HTMLElement;

  private readonly _onChanged = new Emitter<TabChangedEvent>();
  readonly onChanged: Event<TabChangedEvent> = this._onChanged.event;

  private readonly _onDropped = new Emitter<TabDropEvent>();
  readonly onDropped: Event<TabDropEvent> = this._onDropped.event;

  public get element() {
    return this._element;
  }

  public get hasActiveDragEvent() {
    return this.dragInProgresss;
  }

  constructor(public id: string, private groupId: string) {
    super();

    this.addDisposables(this._onChanged, this._onDropped);

    this._element = document.createElement("div");
    this._element.className = "tab";
    this._element.draggable = true;

    this.addDisposables(
      addDisposableListener(this._element, "click", (ev) => {
        this._onChanged.fire({ type: TabChangedEventType.CLICK });
      }),
      addDisposableListener(this._element, "dragstart", (event) => {
        this.dragInProgresss = true;
        // set up a custom ghost image
        const dragImage = this._element.cloneNode(true) as HTMLElement;
        const box = this._element.getBoundingClientRect();
        dragImage.style.height = `${box.height}px`;
        dragImage.style.width = `${box.width}px`;
        document.body.appendChild(dragImage);
        event.dataTransfer.setDragImage(
          dragImage,
          event.offsetX,
          event.offsetY
        );
        setTimeout(() => document.body.removeChild(dragImage), 0);
        // configure the data-transfer object
        event.dataTransfer.setData(
          "text/plain",
          JSON.stringify({
            type: DRAG_TYPE,
            itemId: this.id,
            groupId: this.groupId,
          })
        );
        event.dataTransfer.effectAllowed = "move";
      }),
      addDisposableListener(this._element, "dragend", (ev) => {
        this.dragInProgresss = false;
      })
    );

    this.droptarget = new Droptarget(this._element, {
      isDirectional: false,
      isDisabled: () => this.dragInProgresss,
    });

    this.addDisposables(
      this.droptarget.onDidChange((event) => {
        const {
          groupId,
          itemId,
        }: { groupId: string; itemId: string } = JSON.parse(
          event.event.dataTransfer.getData("text/plain")
        );

        setTimeout(() => {
          this._onDropped.fire({
            groupId,
            itemId,
            target: event.target,
            // index: this.items.findIndex((i) => i.tab === tab),
          });
        }, 0);
      })
    );
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
