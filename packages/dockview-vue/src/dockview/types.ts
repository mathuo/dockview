import { type DockviewOptions, type DockviewReadyEvent } from 'dockview-core';
import type { Component } from 'vue';

export interface VueProps {
    watermarkComponent?: string;
    defaultTabComponent?: string;
    rightHeaderActionsComponent?: string;
    leftHeaderActionsComponent?: string;
    prefixHeaderActionsComponent?: string;
}

export type VueEvents = {
    ready: [event: DockviewReadyEvent];
};

export type IDockviewVueProps = DockviewOptions & VueProps;

export type VNodeType = {
  key: symbol;
  component: Component;
  props: any;
  target: HTMLElement;
}
