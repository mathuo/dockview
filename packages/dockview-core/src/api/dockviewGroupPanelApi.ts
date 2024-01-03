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
    maximize(): void;
    isMaximized(): boolean;
    exitMaximized(): void;
}

export interface DockviewGroupPanelFloatingChangeEvent {
    readonly location: DockviewGroupLocation;
}

// TODO find a better way to initialize and avoid needing null checks
const NOT_INITIALIZED_MESSAGE = 'DockviewGroupPanelApiImpl not initialized';

export class DockviewGroupPanelApiImpl extends GridviewPanelApiImpl {
    private _group: DockviewGroupPanel | undefined;

    readonly _onDidRenderPositionChange =
        new Emitter<DockviewGroupPanelFloatingChangeEvent>();
    readonly onDidRenderPositionChange: Event<DockviewGroupPanelFloatingChangeEvent> =
        this._onDidRenderPositionChange.event;

    get location(): DockviewGroupLocation {
        if (!this._group) {
            throw new Error(NOT_INITIALIZED_MESSAGE);
        }
        return this._group.model.location;
    }

    constructor(id: string, private readonly accessor: DockviewComponent) {
        super(id);

        this.addDisposables(this._onDidRenderPositionChange);
    }

    moveTo(options: { group: DockviewGroupPanel; position?: Position }): void {
        if (!this._group) {
            throw new Error(NOT_INITIALIZED_MESSAGE);
        }

        this.accessor.moveGroupOrPanel(
            options.group,
            this._group.id,
            undefined,
            options.position ?? 'center'
        );
    }

    maximize(): void {
        if (!this._group) {
            throw new Error(NOT_INITIALIZED_MESSAGE);
        }

        this.accessor.maximizeGroup(this._group);
    }

    isMaximized(): boolean {
        if (!this._group) {
            throw new Error(NOT_INITIALIZED_MESSAGE);
        }

        return this.accessor.isMaximizedGroup(this._group);
    }

    exitMaximized(): void {
        if (!this._group) {
            throw new Error(NOT_INITIALIZED_MESSAGE);
        }

        if (this.isMaximized()) {
            this.accessor.exitMaximizedGroup();
        }
    }

    initialize(group: DockviewGroupPanel): void {
        this._group = group;
    }
}
