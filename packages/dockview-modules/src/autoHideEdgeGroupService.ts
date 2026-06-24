import { DockviewCompositeDisposable as CompositeDisposable } from 'dockview-core';
import { DockviewGroupPanel, IDockviewPanel } from 'dockview-core';
import { EdgeGroupPosition } from 'dockview-core';
import { AutoHideEdgeGroupOptions } from 'dockview-core';
import { defineModule, EdgeGroupModule } from 'dockview-core';
import {
    IAutoHideEdgeGroupHost,
    IAutoHideEdgeGroupService,
} from 'dockview-core';

function isEnabled(o: boolean | AutoHideEdgeGroupOptions | undefined): boolean {
    return !!o;
}

/**
 * Strip activators + slide-out peek for a single edge group.
 *
 * - **Strip** (Phase 1): when the group is collapsed, render a clickable
 *   activator per panel.
 * - **Peek** (Phase 2): clicking an activator slides the panel out as an
 *   overlay on the shared floating-overlay host — the live content element is
 *   reparented (state preserved) and the grid is **not** reflowed (the splitview
 *   view stays locked at `collapsedSize`). A pin button re-docks it; `Esc` or a
 *   pointer-down outside closes it.
 *
 * Limited to `onlyWhenVisible` renderers; an `always`-renderer panel (whose live
 * element lives in the shared render overlay) falls back to pinning. Hover/focus
 * debounce + animation are later phases.
 */
class EdgeGroupController extends CompositeDisposable {
    private _strip: HTMLElement | undefined;
    // open peek: the reparented content + where to put it back
    private _peek:
        | { overlay: HTMLElement; content: HTMLElement; parent: HTMLElement }
        | undefined;
    private _closeListeners: CompositeDisposable | undefined;

    constructor(
        private readonly group: DockviewGroupPanel,
        private readonly host: IAutoHideEdgeGroupHost
    ) {
        super();

        this.addDisposables(
            this.group.api.onDidCollapsedChange(() => {
                this._closePeek();
                this._renderStrip();
            }),
            this.group.model.onDidAddPanel(() => this._renderStrip()),
            this.group.model.onDidRemovePanel(() => this._renderStrip()),
            {
                dispose: () => {
                    this._closePeek();
                    this._removeStrip();
                },
            }
        );

        this._renderStrip();
    }

    private get _enabled(): boolean {
        return isEnabled(this.host.options.autoHideEdgeGroups);
    }

    private get _position(): EdgeGroupPosition | undefined {
        const location = this.group.api.location;
        return location.type === 'edge' ? location.position : undefined;
    }

    // --- strip ---

    private _renderStrip(): void {
        if (!this._enabled || !this.group.api.isCollapsed()) {
            this._removeStrip();
            return;
        }
        this._removeStrip();

        const doc = this.group.element.ownerDocument;
        const strip = doc.createElement('div');
        strip.className = 'dv-edge-activator-strip';
        strip.style.display = 'flex';
        strip.style.flexWrap = 'wrap';

        for (const panel of this.group.panels) {
            const button = doc.createElement('button');
            button.className = 'dv-edge-activator';
            button.type = 'button';
            button.textContent = panel.title ?? panel.id;
            button.addEventListener('click', () => this._onActivator(panel));
            strip.appendChild(button);
        }

        this.group.element.appendChild(strip);
        this._strip = strip;
    }

    private _removeStrip(): void {
        this._strip?.remove();
        this._strip = undefined;
    }

    private _onActivator(panel: IDockviewPanel): void {
        // Make the clicked panel active, then peek it (or pin if it can't peek).
        panel.api.setActive();
        this.openPeek();
    }

    // --- peek ---

    openPeek(): void {
        if (!this._enabled || !this.group.api.isCollapsed()) {
            return;
        }
        const panel = this.group.activePanel;
        if (!panel) {
            return;
        }
        // The `always` renderer's element lives in the shared render overlay, not
        // the content container — reparenting it is a later phase; pin instead.
        if (panel.api.renderer === 'always') {
            this.pin();
            return;
        }
        if (this._peek) {
            this._closePeek();
        }

        const content = panel.view.content.element;
        const parent = content.parentElement;
        if (!parent) {
            return;
        }

        const doc = this.group.element.ownerDocument;
        const overlay = doc.createElement('div');
        overlay.className = 'dv-edge-peek';
        overlay.style.position = 'absolute';
        overlay.style.background = 'var(--dv-group-view-background-color)';
        overlay.style.overflow = 'hidden';
        overlay.style.boxSizing = 'border-box';
        // Sit above grid content (the floating-overlay host is pointer-events:
        // none, so opt this child back in) and take pointer events for the
        // slid-out panel + its pin button.
        overlay.style.zIndex = '999';
        overlay.style.pointerEvents = 'auto';

        // A small header with a pin affordance (re-dock).
        const pinButton = doc.createElement('button');
        pinButton.className = 'dv-edge-peek-pin';
        pinButton.type = 'button';
        pinButton.textContent = 'Pin';
        pinButton.addEventListener('click', () => this.pin());
        overlay.appendChild(pinButton);

        // Reparent the live content into the overlay (state preserved).
        overlay.appendChild(content);

        this.host.floatingOverlayHost.appendChild(overlay);
        this._peek = { overlay, content, parent };
        this._positionOverlay(overlay);
        this._armCloseListeners();
    }

    /** Anchor the overlay to the strip's inner edge, sized to the group's
     *  expanded size — relative to the floating-overlay host. No grid reflow. */
    private _positionOverlay(overlay: HTMLElement): void {
        const position = this._position;
        if (!position) {
            return;
        }
        const strip = this.group.element.getBoundingClientRect();
        const host = this.host.floatingOverlayHost.getBoundingClientRect();
        const size = this.host.getEdgeGroupExpandedSize(position);
        const left = strip.left - host.left;
        const top = strip.top - host.top;

        switch (position) {
            case 'left':
                Object.assign(overlay.style, {
                    left: `${left + strip.width}px`,
                    top: `${top}px`,
                    width: `${size}px`,
                    height: `${strip.height}px`,
                });
                break;
            case 'right':
                Object.assign(overlay.style, {
                    left: `${left - size}px`,
                    top: `${top}px`,
                    width: `${size}px`,
                    height: `${strip.height}px`,
                });
                break;
            case 'top':
                Object.assign(overlay.style, {
                    left: `${left}px`,
                    top: `${top + strip.height}px`,
                    width: `${strip.width}px`,
                    height: `${size}px`,
                });
                break;
            case 'bottom':
                Object.assign(overlay.style, {
                    left: `${left}px`,
                    top: `${top - size}px`,
                    width: `${strip.width}px`,
                    height: `${size}px`,
                });
                break;
        }
    }

    private _armCloseListeners(): void {
        const doc = this.group.element.ownerDocument;
        const onKeyDown = (e: Event): void => {
            if ((e as KeyboardEvent).key === 'Escape') {
                this._closePeek();
            }
        };
        const onPointerDown = (e: Event): void => {
            const target = e.target;
            if (!(target instanceof Node)) {
                return;
            }
            // A click on the strip or inside the peek keeps it open.
            if (
                this._peek?.overlay.contains(target) ||
                this.group.element.contains(target)
            ) {
                return;
            }
            this._closePeek();
        };
        doc.addEventListener('keydown', onKeyDown, true);
        doc.addEventListener('pointerdown', onPointerDown, true);
        this._closeListeners = new CompositeDisposable(
            {
                dispose: () =>
                    doc.removeEventListener('keydown', onKeyDown, true),
            },
            {
                dispose: () =>
                    doc.removeEventListener('pointerdown', onPointerDown, true),
            }
        );
    }

    /** Restore the reparented content and remove the overlay (no layout change). */
    private _closePeek(): void {
        this._closeListeners?.dispose();
        this._closeListeners = undefined;
        const peek = this._peek;
        this._peek = undefined;
        if (!peek) {
            return;
        }
        // Put the live content back where it came from before removing the overlay.
        peek.parent.appendChild(peek.content);
        peek.overlay.remove();
    }

    isPeeking(): boolean {
        return this._peek !== undefined;
    }

    peek(open: boolean): void {
        if (open) {
            this.openPeek();
        } else {
            this._closePeek();
        }
    }

    /** Re-dock: restore content, then expand via the host's collapse path. */
    pin(): void {
        this._closePeek();
        this.host.setEdgeGroupCollapsed(this.group, false);
    }
}

/**
 * Auto-hide edge groups (VS-style). A collapsed edge group renders clickable
 * activators; clicking one slides the panel out as a non-reflowing overlay
 * (peek), with a pin button to re-dock. Opt-in via `autoHideEdgeGroups`
 * (default off → baseline strip unchanged).
 */
export class AutoHideEdgeGroupService
    extends CompositeDisposable
    implements IAutoHideEdgeGroupService
{
    private readonly _controllers = new Map<
        DockviewGroupPanel,
        EdgeGroupController
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
        this._controllers.set(group, new EdgeGroupController(group, this.host));
    }

    private _untrack(group: DockviewGroupPanel): void {
        const controller = this._controllers.get(group);
        if (controller) {
            controller.dispose();
            this._controllers.delete(group);
        }
    }

    private _controllerAt(
        position: EdgeGroupPosition
    ): EdgeGroupController | undefined {
        const group = this.host.getEdgeGroupPanel(position);
        return group ? this._controllers.get(group) : undefined;
    }

    pin(position: EdgeGroupPosition): void {
        const group = this.host.getEdgeGroupPanel(position);
        if (group) {
            // Use the controller so an open peek is torn down cleanly first.
            const controller = this._controllers.get(group);
            if (controller) {
                controller.pin();
            } else {
                this.host.setEdgeGroupCollapsed(group, false);
            }
        }
    }

    autoHide(position: EdgeGroupPosition): void {
        const group = this.host.getEdgeGroupPanel(position);
        if (group) {
            this.host.setEdgeGroupCollapsed(group, true);
        }
    }

    peek(position: EdgeGroupPosition, peek: boolean): void {
        this._controllerAt(position)?.peek(peek);
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
