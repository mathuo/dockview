import { Target } from "./droptarget/droptarget";

export enum TabChangedEventType {
  CLICK,
}

export type TabChangedEvent = { type: TabChangedEventType };
export type TabDropEvent = { groupId: string; itemId: string; target: Target };
