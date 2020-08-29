import { IDisposable } from "../../lifecycle";
import { IGroupview } from "../groupview";
import { IGroupAccessor } from "../../layout";
import { PanelApi } from "./api";
import { PanelInitParameters } from "./types";

export enum ClosePanelResult {
  CLOSE = "CLOSE",
  DONT_CLOSE = "DONT_CLOSE",
}

interface Methods extends IDisposable {
  init?(params: PartInitParameters): void;
  setVisible(isPanelVisible: boolean, isGroupVisible: boolean): void;
}

export interface WatermarkPartInitParameters {
  accessor: IGroupAccessor;
}

export interface PartInitParameters extends PanelInitParameters {
  api: PanelApi;
}

export interface PanelHeaderPart extends Methods {
  id: string;
  element: HTMLElement;
  layout?(height: string): void;
  toJSON(): {};
}

export interface PanelContentPart extends Methods {
  id: string;
  element: HTMLElement;
  layout?(width: number, height: number): void;
  close?(): Promise<ClosePanelResult>;
  focus(): void;
  onHide(): void;
  update(params: {}): void;
  toJSON(): {};
}

export interface WatermarkPart extends IDisposable {
  init?: (params: WatermarkPartInitParameters) => void;
  setVisible?(visible: boolean, group: IGroupview): void;
  element: HTMLElement;
}

export interface PanelHeaderPartConstructor {
  new (): PanelHeaderPart;
}
export interface PanelContentPartConstructor {
  new (): PanelContentPart;
}

export interface WatermarkConstructor {
  new (): WatermarkPart;
}
