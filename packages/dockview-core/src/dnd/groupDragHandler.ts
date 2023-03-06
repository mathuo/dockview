import { DockviewGroupPanel } from '../dockview/dockviewGroupPanel';
import { IDisposable } from '../lifecycle';
import { DragHandler } from './abstractDragHandler';
import { LocalSelectionTransfer, PanelTransfer } from './dataTransfer';
import { addGhostImage } from './ghost';

export class GroupDragHandler extends DragHandler {
    private readonly panelTransfer =
        LocalSelectionTransfer.getInstance<PanelTransfer>();

    constructor(
        element: HTMLElement,
        private readonly accessorId: string,
        private readonly group: DockviewGroupPanel
    ) {
        super(element);
    }

    getData(dataTransfer: DataTransfer | null): IDisposable {
        this.panelTransfer.setData(
            [new PanelTransfer(this.accessorId, this.group.id, null)],
            PanelTransfer.prototype
        );

        const style = window.getComputedStyle(this.el);

        const bgColor = style.getPropertyValue(
            '--dv-activegroup-visiblepanel-tab-background-color'
        );
        const color = style.getPropertyValue(
            '--dv-activegroup-visiblepanel-tab-color'
        );

        if (dataTransfer) {
            const ghostElement = document.createElement('div');

            ghostElement.style.backgroundColor = bgColor;
            ghostElement.style.color = color;
            ghostElement.style.padding = '2px 8px';
            ghostElement.style.height = '24px';
            ghostElement.style.fontSize = '11px';
            ghostElement.style.lineHeight = '20px';
            ghostElement.style.borderRadius = '12px';
            ghostElement.style.position = 'absolute';
            ghostElement.textContent = `Multiple Panels (${this.group.size})`;

            addGhostImage(dataTransfer, ghostElement);
        }

        return {
            dispose: () => {
                this.panelTransfer.clearData(PanelTransfer.prototype);
            },
        };
    }

    public dispose(): void {
        //
    }
}
