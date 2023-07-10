import { Position } from '../dnd/droptarget';
import { DockviewComponent } from '../dockview/dockviewComponent';
import { DockviewGroupPanel } from '../dockview/dockviewGroupPanel';
import { Emitter, Event } from '../events';
import { GridviewPanelApi, GridviewPanelApiImpl } from './gridviewPanelApi';

export interface DockviewGroupPanelApi extends GridviewPanelApi {
    readonly onDidFloatingStateChange: Event<DockviewGroupPanelFloatingChangeEvent>;
    readonly isFloating: boolean;
    moveTo(options: { group: DockviewGroupPanel; position?: Position }): void;
}

export interface DockviewGroupPanelFloatingChangeEvent {
    readonly isFloating: boolean;
}

export class DockviewGroupPanelApiImpl extends GridviewPanelApiImpl {
    private _group: DockviewGroupPanel | undefined;

    readonly _onDidFloatingStateChange =
        new Emitter<DockviewGroupPanelFloatingChangeEvent>();
    readonly onDidFloatingStateChange: Event<DockviewGroupPanelFloatingChangeEvent> =
        this._onDidFloatingStateChange.event;

    get isFloating() {
        if (!this._group) {
            throw new Error(`DockviewGroupPanelApiImpl not initialized`);
        }
        return this._group.model.isFloating;
    }

    constructor(id: string, private readonly accessor: DockviewComponent) {
        super(id);

        this.addDisposables(this._onDidFloatingStateChange);
    }

    moveTo(options: { group: DockviewGroupPanel; position?: Position }): void {
        if (!this._group) {
            throw new Error(`DockviewGroupPanelApiImpl not initialized`);
        }

        this.accessor.moveGroupOrPanel(
            options.group,
            this._group.id,
            undefined,
            options.position ?? 'center'
        );
    }

    initialize(group: DockviewGroupPanel): void {
        this._group = group;
    }
}
