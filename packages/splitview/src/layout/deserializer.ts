import { IGridView, IViewDeserializer } from "../gridview/gridview";
import { IPanel } from "../groupview/panel/types";
import { Layout } from "./layout";

export interface IPanelDeserializer {
  fromJSON(panelData: { [index: string]: any }): IPanel;
}

export class DefaultDeserializer implements IViewDeserializer {
  constructor(
    private readonly layout: Layout,
    private panelDeserializer: { createPanel: (id: string) => IPanel }
  ) {}

  public fromJSON(data: { [key: string]: any }): IGridView {
    const children = data.views;
    const active = data.activeView;

    const panels: IPanel[] = [];

    for (const child of children) {
      const panel = this.panelDeserializer.createPanel(child);

      panels.push(panel);
    }

    const group = this.layout.createGroup({
      panels,
      activePanel: panels.find((p) => p.id === active),
    });

    return group;
  }
}
