import { DroptargetEvent } from "./droptarget/droptarget";

export enum TabChangedEventType {
  CLICK,
}

export type TabChangedEvent = { type: TabChangedEventType };
export type TabDropEvent = {
  event: DroptargetEvent;
  index?: number;
};
