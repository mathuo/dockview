import {
  PanelContentPart,
  PanelContentPartConstructor,
  PanelHeaderPart,
  PanelHeaderPartConstructor,
  WatermarkConstructor,
} from "../groupview/panel/parts";

export type FrameworkPanelWrapper = {
  createContentWrapper: (id: string, component: any) => PanelContentPart;
  createTabWrapper: (id: string, component: any) => PanelHeaderPart;
};

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
  frameworkPanelWrapper: FrameworkPanelWrapper;
  tabHeight?: number;
  debug?: boolean;
}

export interface AddPanelOptions {
  tabComponentName?: string | PanelHeaderPartConstructor;
  params?: { [key: string]: any };
  id: string;
  title?: string;
  suppressClosable?: boolean;
  position?: {
    direction?: "left" | "right" | "above" | "below" | "within";
    referencePanel: string;
  };
}

export interface AddGroupOptions {
  direction?: "left" | "right" | "above" | "below";
  referencePanel: string;
}
