import { IGroupview } from "../groupview/groupview";
import { PanelApi } from "../groupview/panel/api";
import {
  PanelContentPart,
  PanelContentPartConstructor,
  PanelHeaderPart,
  PanelHeaderPartConstructor,
  WatermarkConstructor,
} from "../groupview/panel/parts";
import { IPanel } from "../groupview/panel/types";
import { Api } from "./layout";

export interface FrameworkPanelWrapper {
  createContentWrapper: (id: string, component: any) => PanelContentPart;
  createTabWrapper: (id: string, component: any) => PanelHeaderPart;
}

export interface TabContextMenuEvent {
  event: MouseEvent;
  api: Api;
  panelApi: PanelApi;
  panel: IPanel;
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
  frameworkPanelWrapper: FrameworkPanelWrapper;
  tabHeight?: number;
  debug?: boolean;
  enableExternalDragEvents?: boolean;
  onTabContextMenu?: (event: TabContextMenuEvent) => void;
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
