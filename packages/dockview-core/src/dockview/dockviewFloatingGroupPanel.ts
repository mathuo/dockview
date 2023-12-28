import { Overlay } from '../dnd/overlay';
import { CompositeDisposable } from '../lifecycle';
import { DockviewGroupPanel, IDockviewGroupPanel } from './dockviewGroupPanel';

export interface IDockviewFloatingGroupPanel {
    readonly group: IDockviewGroupPanel;
    position(
        bounds: Partial<{
            top: number;
            side: number;
            height: number;
            width: number;
        }>
    ): void;
}

export class DockviewFloatingGroupPanel
    extends CompositeDisposable
    implements IDockviewFloatingGroupPanel
{
    constructor(readonly group: DockviewGroupPanel, readonly overlay: Overlay) {
        super();

        this.addDisposables(overlay);
    }

    position(
        bounds: Partial<{
            top: number;
            side: number;
            height: number;
            width: number;
        }>
    ): void {
        this.overlay.setBounds(bounds);
    }
}
