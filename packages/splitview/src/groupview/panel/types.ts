import { IGroupview } from "../groupview";
import { IDisposable, ISerializable } from "../../lifecycle";
import { Event } from "../../events";
import { PanelHeaderPart, PanelContentPart, ClosePanelResult } from "./parts";

// objects

export type PanelUpdateEvent = {
  params: { [key: string]: any };
};

// init parameters

export type PanelInitParameters = {
  title: string;
  suppressClosable?: boolean;
  params: { [index: string]: any };
  state?: { [index: string]: any };
};

// constructors

export interface PanelConstructor {
  new (): IPanel;
}

// panel

export interface IPanel extends IDisposable, ISerializable {
  id: string;
  header: PanelHeaderPart;
  content: PanelContentPart;
  group: IGroupview;
  focus(): void;
  onHide(): void;
  setVisible(isGroupActive: boolean, group: IGroupview): void;
  setDirty(isDirty: boolean): void;
  close?(): Promise<ClosePanelResult>;
  layout?(width: number, height: number): void;
  init?(params: PanelInitParameters & { [index: string]: string }): void;
  update?(event: PanelUpdateEvent): void;
  onDidStateChange: Event<any>;
}
