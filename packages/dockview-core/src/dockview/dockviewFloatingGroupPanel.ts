import { Overlay } from '../overlay/overlay';
import { CompositeDisposable } from '../lifecycle';
import { Gridview } from '../gridview/gridview';
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
    private _group: DockviewGroupPanel;

    /**
     * The window's representative/anchor group. A floating window can host a
     * nested layout of several groups; the anchor is used for back-compat
     * single-group APIs and is reassigned if it leaves the window.
     */
    get group(): DockviewGroupPanel {
        return this._group;
    }

    setAnchorGroup(group: DockviewGroupPanel): void {
        this._group = group;
    }

    constructor(
        group: DockviewGroupPanel,
        readonly overlay: Overlay,
        /**
         * The floating window hosts its own gridview so it can hold a nested
         * splitview layout of groups, not just a single group.
         */
        readonly gridview: Gridview
    ) {
        super();
        this._group = group;
        this.addDisposables(overlay, {
            // The gridview owns the floating window's DOM subtree (mounted as
            // the overlay's content). Disposing it tears down the splitview;
            // it does NOT dispose the leaf views (groups) — their lifecycle is
            // owned by the component's `_groups` map.
            dispose: () => this.gridview.dispose(),
        });
    }

    position(bounds: Partial<AnchoredBox>): void {
        this.overlay.setBounds(bounds);
    }
}
