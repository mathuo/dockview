import { IDisposable } from '../lifecycle';
import {
    GroupDragEvent,
    TabDragEvent,
} from './components/titlebar/tabsContainer';
import { DockviewWillDropEvent } from './dockviewGroupPanelModel';
import { DockviewWillShowOverlayLocationEvent } from './events';
import { defineModule } from './modules';

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
