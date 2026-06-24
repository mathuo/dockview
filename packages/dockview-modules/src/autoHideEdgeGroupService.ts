import { DockviewCompositeDisposable as CompositeDisposable } from 'dockview-core';
import { DockviewGroupPanel } from 'dockview-core';
import { EdgeGroupPosition } from 'dockview-core';
import { AutoHideEdgeGroupOptions } from 'dockview-core';
import { defineModule, EdgeGroupModule } from 'dockview-core';
import {
    IAutoHideEdgeGroupHost,
    IAutoHideEdgeGroupService,
} from 'dockview-core';

function resolveOptions(o: boolean | AutoHideEdgeGroupOptions | undefined): {
    enabled: boolean;
    showIcons: boolean;
} {
    if (!o) {
        return { enabled: false, showIcons: true };
    }
    if (o === true) {
        return { enabled: true, showIcons: true };
    }
    return { enabled: true, showIcons: o.showIcons ?? true };
}

/**
 * Renders the collapsed-strip activators for a single edge group and pins the
 * group when one is clicked. The activator list mirrors the group's panels and
 * is shown only while the group is collapsed and the feature is enabled — so
 * with `autoHideEdgeGroups` off the baseline (empty) strip is untouched.
 */
class EdgeStripController extends CompositeDisposable {
    private _strip: HTMLElement | undefined;

    constructor(
        private readonly group: DockviewGroupPanel,
        private readonly host: IAutoHideEdgeGroupHost
    ) {
        super();

        this.addDisposables(
            this.group.api.onDidCollapsedChange(() => this._render()),
            this.group.model.onDidAddPanel(() => this._render()),
            this.group.model.onDidRemovePanel(() => this._render()),
            { dispose: () => this._removeStrip() }
        );

        this._render();
    }

    private get _enabled(): boolean {
        return resolveOptions(this.host.options.autoHideEdgeGroups).enabled;
    }

    /** Rebuild the activator strip from the current panels, or remove it when
     *  the group is expanded / the feature is off. */
    private _render(): void {
        if (!this._enabled || !this.group.api.isCollapsed()) {
            this._removeStrip();
            return;
        }
        this._removeStrip();

        const doc = this.group.element.ownerDocument;
        const strip = doc.createElement('div');
        strip.className = 'dv-edge-activator-strip';
        // Minimal inline layout so the strip is usable before any theme styles
        // it; visual polish (orientation, icons) is a follow-up phase.
        strip.style.display = 'flex';
        strip.style.flexWrap = 'wrap';

        for (const panel of this.group.panels) {
            const button = doc.createElement('button');
            button.className = 'dv-edge-activator';
            button.type = 'button';
            button.textContent = panel.title ?? panel.id;
            // Clicking an activator pins (expands) the group and activates the
            // panel. Pin goes through the host's single collapse mutate path.
            // (Listeners are GC'd with the button when the strip is removed.)
            button.addEventListener('click', () => {
                this.host.setEdgeGroupCollapsed(this.group, false);
                panel.api.setActive();
            });
            strip.appendChild(button);
        }

        this.group.element.appendChild(strip);
        this._strip = strip;
    }

    private _removeStrip(): void {
        this._strip?.remove();
        this._strip = undefined;
    }
}

/**
 * Auto-hide edge groups (VS-style). Phase 1: a collapsed edge group renders
 * clickable activators in its strip; clicking one pins (expands) the group.
 * Opt-in via `autoHideEdgeGroups` (default off → baseline strip unchanged).
 * The slide-out peek + pin/unpin animation + serialization are later phases.
 */
export class AutoHideEdgeGroupService
    extends CompositeDisposable
    implements IAutoHideEdgeGroupService
{
    private readonly _controllers = new Map<
        DockviewGroupPanel,
        EdgeStripController
    >();

    constructor(private readonly host: IAutoHideEdgeGroupHost) {
        super();

        this.addDisposables(
            this.host.onDidAddGroup((group) => this._track(group)),
            this.host.onDidRemoveGroup((group) => this._untrack(group)),
            {
                dispose: () => {
                    this._controllers.forEach((c) => c.dispose());
                    this._controllers.clear();
                },
            }
        );
    }

    private _track(group: DockviewGroupPanel): void {
        if (
            group.api.location.type !== 'edge' ||
            this._controllers.has(group)
        ) {
            return;
        }
        this._controllers.set(group, new EdgeStripController(group, this.host));
    }

    private _untrack(group: DockviewGroupPanel): void {
        const controller = this._controllers.get(group);
        if (controller) {
            controller.dispose();
            this._controllers.delete(group);
        }
    }

    pin(position: EdgeGroupPosition): void {
        const group = this.host.getEdgeGroupPanel(position);
        if (group) {
            this.host.setEdgeGroupCollapsed(group, false);
        }
    }

    autoHide(position: EdgeGroupPosition): void {
        const group = this.host.getEdgeGroupPanel(position);
        if (group) {
            this.host.setEdgeGroupCollapsed(group, true);
        }
    }
}

export const AutoHideEdgeGroupModule = defineModule<
    'autoHideEdgeGroupService',
    IAutoHideEdgeGroupHost
>({
    name: 'AutoHideEdgeGroup',
    serviceKey: 'autoHideEdgeGroupService',
    dependsOn: [EdgeGroupModule],
    create: (host) => new AutoHideEdgeGroupService(host),
});
