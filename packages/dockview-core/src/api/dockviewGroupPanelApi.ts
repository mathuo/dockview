import { Position, positionToDirection } from '../dnd/droptarget';
import { DockviewComponent } from '../dockview/dockviewComponent';
import { DockviewGroupPanel } from '../dockview/dockviewGroupPanel';
import {
    DockviewGroupChangeEvent,
    DockviewGroupLocation,
} from '../dockview/dockviewGroupPanelModel';
import { Emitter, Event } from '../events';
import { GridviewPanelApi, GridviewPanelApiImpl } from './gridviewPanelApi';

export interface DockviewGroupMoveParams {
    group?: DockviewGroupPanel;
    position?: Position;
    /**
     * The index to place the panel within a group, only applicable if the placement is within an existing group
     */
    index?: number;
}

export interface DockviewGroupPanelApi extends GridviewPanelApi {
    readonly onDidLocationChange: Event<DockviewGroupPanelFloatingChangeEvent>;
    readonly onDidActivePanelChange: Event<DockviewGroupChangeEvent>;
    readonly location: DockviewGroupLocation;
    /**
     * If you require the Window object
     */
    getWindow(): Window;
    moveTo(options: DockviewGroupMoveParams): void;
    maximize(): void;
    isMaximized(): boolean;
    exitMaximized(): void;
    close(): void;
}

export interface DockviewGroupPanelFloatingChangeEvent {
    readonly location: DockviewGroupLocation;
}

const NOT_INITIALIZED_MESSAGE =
    'dockview: DockviewGroupPanelApiImpl not initialized';

export class DockviewGroupPanelApiImpl extends GridviewPanelApiImpl {
    private _group: DockviewGroupPanel | undefined;

    readonly _onDidLocationChange =
        new Emitter<DockviewGroupPanelFloatingChangeEvent>();
    readonly onDidLocationChange: Event<DockviewGroupPanelFloatingChangeEvent> =
        this._onDidLocationChange.event;

    readonly _onDidActivePanelChange = new Emitter<DockviewGroupChangeEvent>();
    readonly onDidActivePanelChange = this._onDidActivePanelChange.event;

    get location(): DockviewGroupLocation {
        if (!this._group) {
            throw new Error(NOT_INITIALIZED_MESSAGE);
        }
        return this._group.model.location;
    }

    constructor(id: string, private readonly accessor: DockviewComponent) {
        super(id, '__dockviewgroup__');

        this.addDisposables(
            this._onDidLocationChange,
            this._onDidActivePanelChange
        );
    }

    close(): void {
        if (!this._group) {
            return;
        }
        return this.accessor.removeGroup(this._group);
    }

    getWindow(): Window {
        return this.location.type === 'popout'
            ? this.location.getWindow()
            : window;
    }

    moveTo(options: DockviewGroupMoveParams): void {
        if (!this._group) {
            throw new Error(NOT_INITIALIZED_MESSAGE);
        }

        const group =
            options.group ??
            this.accessor.addGroup({
                direction: positionToDirection(options.position ?? 'right'),
                skipSetActive: true,
            });

        this.accessor.moveGroupOrPanel({
            from: { groupId: this._group.id },
            to: {
                group,
                position: options.group
                    ? options.position ?? 'center'
                    : 'center',
                index: options.index,
            },
        });
    }

    maximize(): void {
        if (!this._group) {
            throw new Error(NOT_INITIALIZED_MESSAGE);
        }

        if (this.location.type !== 'grid') {
            // only grid groups can be maximized
            return;
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
