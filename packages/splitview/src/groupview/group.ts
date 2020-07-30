import { Event, Emitter } from "../events";
import { IGroupview } from "./groupview";
import { IDisposable } from "../types";

export enum ClosePanelResult {
  CLOSE,
  DONT_CLOSE,
}

export interface IPanel extends IDisposable {
  id: string;
  header: HTMLElement;
  content: HTMLElement;
  focus(): void;
  onHide(): void;
  setVisible(visible: boolean, group: IGroupview): void;
  close(): Promise<ClosePanelResult>;
}

export class Group {
  private readonly _onDoSetActive = new Emitter<IPanel>();
  readonly onDoSetActive: Event<IPanel> = this._onDoSetActive.event;

  private active: IPanel;

  public isActive(panel: IPanel) {
    return this.active === panel;
  }
}
