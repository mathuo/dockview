import { Overlay } from '../overlay/overlay';
import { CompositeDisposable } from '../lifecycle';
import { AnchoredBox } from '../types';
import { DockviewGroupPanel, IDockviewGroupPanel } from './dockviewGroupPanel';

export interface IDockviewFloatingGroupPanel {
    readonly group: IDockviewGroupPanel;
    position(bounds: Partial<AnchoredBox>): void;
}

export class DockviewFloatingGroupPanel
    extends CompositeDisposable
    implements IDockviewFloatingGroupPanel
{
    constructor(readonly group: DockviewGroupPanel, readonly overlay: Overlay) {
        super();
        this.addDisposables(overlay);
    }

    position(bounds: Partial<AnchoredBox>): void {
        this.overlay.setBounds(bounds);
    }
}
