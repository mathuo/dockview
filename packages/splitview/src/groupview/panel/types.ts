import { IGroupview } from "../groupview";
import { IDisposable, ISerializable } from "../../lifecycle";
import { Event } from "../../events";
import { PanelHeaderPart, PanelContentPart, ClosePanelResult } from "./parts";
import { InitParameters, IPanel } from "../../panel/types";

// init parameters

export interface PanelInitParameters extends InitParameters {
  title: string;
  suppressClosable?: boolean;
}

// constructors

// panel

export interface IGroupPanel extends IDisposable, ISerializable, IPanel {
  id: string;
  header: PanelHeaderPart;
  content: PanelContentPart;
  group: IGroupview;
  focus(): void;
  onHide(): void;
  setVisible(isGroupActive: boolean, group: IGroupview): void;
  setDirty(isDirty: boolean): void;
  close?(): Promise<ClosePanelResult>;
  init?(params: PanelInitParameters & { [index: string]: string }): void;
  onDidStateChange: Event<any>;
}
