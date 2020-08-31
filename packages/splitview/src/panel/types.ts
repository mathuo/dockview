export interface InitParameters {
  params: { [index: string]: any };
  state?: { [index: string]: any };
}

export interface PanelUpdateEvent {
  params: { [index: string]: any };
}

export interface IPanel {
  init?(params: InitParameters): void;
  layout?(width: number, height: number): void;
  update?(event: PanelUpdateEvent): void;
}
