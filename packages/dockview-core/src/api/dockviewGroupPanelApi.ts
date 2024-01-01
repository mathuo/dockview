import { Position } from '../dnd/droptarget';
import { DockviewComponent } from '../dockview/dockviewComponent';
import { DockviewGroupPanel } from '../dockview/dockviewGroupPanel';
import { DockviewGroupLocation } from '../dockview/dockviewGroupPanelModel';
import { Emitter, Event } from '../events';
import { GridviewPanelApi, GridviewPanelApiImpl } from './gridviewPanelApi';

export interface DockviewGroupPanelApi extends GridviewPanelApi {
    readonly onDidRenderPositionChange: Event<DockviewGroupPanelFloatingChangeEvent>;
    readonly location: DockviewGroupLocation;
    moveTo(options: { group: DockviewGroupPanel; position?: Position }): void;
}

export interface DockviewGroupPanelFloatingChangeEvent {
    readonly location: DockviewGroupLocation;
}

export class DockviewGroupPanelApiImpl extends GridviewPanelApiImpl {
    private _group: DockviewGroupPanel | undefined;

    readonly _onDidRenderPositionChange =
        new Emitter<DockviewGroupPanelFloatingChangeEvent>();
    readonly onDidRenderPositionChange: Event<DockviewGroupPanelFloatingChangeEvent> =
        this._onDidRenderPositionChange.event;

    get location(): DockviewGroupLocation {
        if (!this._group) {
            throw new Error(`DockviewGroupPanelApiImpl not initialized`);
        }
        return this._group.model.location;
    }

    constructor(id: string, private readonly accessor: DockviewComponent) {
        super(id);

        this.addDisposables(this._onDidRenderPositionChange);
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
