import { IGroupview } from "../groupview/groupview";
import {
  PanelContentPart,
  PanelContentPartConstructor,
  PanelHeaderPart,
  PanelHeaderPartConstructor,
  WatermarkConstructor,
} from "../groupview/panel/parts";
import { IGroupPanel } from "../groupview/panel/types";
import { FrameworkFactory } from "../types";
import { Api } from "./layout";

export interface GroupPanelFrameworkComponentFactory {
  content: FrameworkFactory<PanelContentPart>;
  tab: FrameworkFactory<PanelHeaderPart>;
}

export interface TabContextMenuEvent {
  event: MouseEvent;
  api: Api;
  panel: IGroupPanel;
}

export interface LayoutOptions {
  tabComponents?: {
    [componentName: string]: PanelHeaderPartConstructor;
  };
  components?: {
    [componentName: string]: PanelContentPartConstructor;
  };
  frameworkTabComponents?: {
    [componentName: string]: any;
  };
  frameworkComponents?: {
    [componentName: string]: any;
  };
  watermarkComponent?: WatermarkConstructor;
  watermarkFrameworkComponent?: any;
  frameworkComponentFactory: GroupPanelFrameworkComponentFactory;
  tabHeight?: number;
  debug?: boolean;
  enableExternalDragEvents?: boolean;
}

export interface PanelOptions {
  componentName: string;
  tabComponentName?: string;
  params?: { [key: string]: any };
  id: string;
  title?: string;
  suppressClosable?: boolean;
}

export interface AddPanelOptions
  extends Omit<PanelOptions, "componentName" | "tabComponentName"> {
  componentName: string | PanelContentPartConstructor;
  tabComponentName?: string | PanelHeaderPartConstructor;
  position?: {
    direction?: "left" | "right" | "above" | "below" | "within";
    referencePanel: string;
  };
}

export interface AddGroupOptions {
  direction?: "left" | "right" | "above" | "below";
  referencePanel: string;
}

export interface MovementOptions {
  group?: IGroupview;
  includePanel?: boolean;
}
