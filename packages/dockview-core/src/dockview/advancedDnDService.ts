import { IDisposable } from '../lifecycle';
import { IDragGhostSpec } from '../dnd/backend';
import { DroptargetOverlayModel } from '../dnd/droptarget';
import { DockviewApi } from '../api/component.api';
import {
    GroupDragEvent,
    TabDragEvent,
} from './components/titlebar/tabsContainer';
import { DockviewWillDropEvent } from './dockviewGroupPanelModel';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import {
    DockviewGroupDropLocation,
    DockviewWillShowOverlayLocationEvent,
} from './events';
import { DockviewComponentOptions } from './options';
import { defineModule } from './modules';

/** Cursor offset of the group drag ghost, matched to the long-shipped default. */
const GROUP_DRAG_GHOST_OFFSET_X = 30;
const GROUP_DRAG_GHOST_OFFSET_Y = -10;

/**
 * The narrow surface the {@link AdvancedDnDService} needs from the host
 * (the `DockviewComponent`).
 *
 * The `onWill*` emitters stay on the component so the public event shape is
 * unchanged whether or not this module is registered — the service is only the
 * dispatch point those fires are routed through. Engine policy (e.g. the
 * `disableDnd` guard) stays on the component, ahead of the dispatch.
 */
export interface IAdvancedDnDHost {
    readonly options: DockviewComponentOptions;
    readonly api: DockviewApi;
    fireWillDragPanel(event: TabDragEvent): void;
    fireWillDragGroup(event: GroupDragEvent): void;
    fireWillDrop(event: DockviewWillDropEvent): void;
    fireWillShowOverlay(event: DockviewWillShowOverlayLocationEvent): void;
}

export interface IAdvancedDnDService extends IDisposable {
    dispatchWillDragPanel(event: TabDragEvent): void;
    dispatchWillDragGroup(event: GroupDragEvent): void;
    dispatchWillDrop(event: DockviewWillDropEvent): void;
    dispatchWillShowOverlay(event: DockviewWillShowOverlayLocationEvent): void;
    /**
     * Resolve the custom group drag ghost from
     * `createGroupDragGhostComponent`, or `undefined` when no factory is
     * configured (the caller then renders the default chip). Returning
     * `undefined` is also what happens when this module is absent.
     */
    buildGroupDragGhost(group: DockviewGroupPanel): IDragGhostSpec | undefined;
    /**
     * Resolve the app-supplied overlay model for a group drop target via the
     * `dropOverlayModel` option, or `undefined` to keep the target's default.
     */
    resolveOverlayModel(
        location: DockviewGroupDropLocation,
        group?: DockviewGroupPanel
    ): DroptargetOverlayModel | undefined;
}

/**
 * Owns the dispatch of the advanced drag-and-drop hooks — `onWillDragPanel`,
 * `onWillDragGroup`, `onWillDrop` and `onWillShowOverlay`.
 *
 * At this stage the service is a thin dispatcher that forwards to the host's
 * emitters; the customisation surface it gates (custom drop overlays, custom
 * group drag ghosts, hook veto/transform behaviour) is currently inlined in
 * core and is extracted into this service in later phases. Routing the
 * dispatch through a module slot is what lets that customisation layer move
 * into a separately-distributed package in a future major version without
 * changing the public event surface.
 *
 * The service holds no drag state of its own — the gesture is driven by the
 * DnD backends, and the per-group subscriptions live on the component's group
 * lifecycle (so groups created mid-move are not missed).
 */
export class AdvancedDnDService implements IAdvancedDnDService {
    constructor(private readonly host: IAdvancedDnDHost) {}

    dispatchWillDragPanel(event: TabDragEvent): void {
        this.host.fireWillDragPanel(event);
    }

    dispatchWillDragGroup(event: GroupDragEvent): void {
        this.host.fireWillDragGroup(event);
    }

    dispatchWillDrop(event: DockviewWillDropEvent): void {
        this.host.fireWillDrop(event);
    }

    dispatchWillShowOverlay(event: DockviewWillShowOverlayLocationEvent): void {
        this.host.fireWillShowOverlay(event);
    }

    buildGroupDragGhost(group: DockviewGroupPanel): IDragGhostSpec | undefined {
        const createGhost = this.host.options.createGroupDragGhostComponent;
        if (!createGhost) {
            return undefined;
        }
        const renderer = createGhost(group);
        renderer.init({ group, api: this.host.api });
        return {
            element: renderer.element,
            offsetX: GROUP_DRAG_GHOST_OFFSET_X,
            offsetY: GROUP_DRAG_GHOST_OFFSET_Y,
            dispose: renderer.dispose ? () => renderer.dispose?.() : undefined,
        };
    }

    resolveOverlayModel(
        location: DockviewGroupDropLocation,
        group?: DockviewGroupPanel
    ): DroptargetOverlayModel | undefined {
        return this.host.options.dropOverlayModel?.({ location, group });
    }

    dispose(): void {
        // no-op — see class doc: the service holds no state to tear down.
    }
}

export const AdvancedDnDModule = defineModule<
    'advancedDnDService',
    IAdvancedDnDHost
>({
    name: 'AdvancedDnD',
    serviceKey: 'advancedDnDService',
    create: (host) => new AdvancedDnDService(host),
});
