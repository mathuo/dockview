import { DockviewComponent } from '../dockview/dockviewComponent';
import { DockviewGroupPanel } from '../dockview/dockviewGroupPanel';
import { quasiPreventDefault } from '../dom';
import { addDisposableListener } from '../events';
import { IDisposable } from '../lifecycle';
import { DragHandler } from './abstractDragHandler';
import { LocalSelectionTransfer, PanelTransfer } from './dataTransfer';
import { addGhostImage } from './ghost';

export class GroupDragHandler extends DragHandler {
    private readonly panelTransfer =
        LocalSelectionTransfer.getInstance<PanelTransfer>();

    constructor(
        element: HTMLElement,
        private readonly accessor: DockviewComponent,
        private readonly group: DockviewGroupPanel
    ) {
        super(element);

        this.addDisposables(
            addDisposableListener(
                element,
                'pointerdown',
                (e) => {
                    if (e.shiftKey) {
                        /**
                         * You cannot call e.preventDefault() because that will prevent drag events from firing
                         * but we also need to stop any group overlay drag events from occuring
                         * Use a custom event marker that can be checked by the overlay drag events
                         */
                        quasiPreventDefault(e);
                    }
                },
                true
            )
        );
    }

    override isCancelled(_event: DragEvent): boolean {
        if (this.group.api.location.type === 'floating' && !_event.shiftKey) {
            return true;
        }
        return false;
    }

    getData(dragEvent: DragEvent): IDisposable {
        const dataTransfer = dragEvent.dataTransfer;

        this.panelTransfer.setData(
            [new PanelTransfer(this.accessor.id, this.group.id, null)],
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
}
