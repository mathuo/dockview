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
    openDelay: number;
    closeDelay: number;
    animate: boolean;
} {
    const obj = typeof o === 'object' ? o : {};
    return {
        enabled: !!o,
        openDelay: obj.openDelay ?? 250,
        closeDelay: obj.closeDelay ?? 300,
        animate: obj.animate ?? true,
    };
}

function prefersReducedMotion(doc: Document): boolean {
    const mq = doc.defaultView?.matchMedia?.(
        '(prefers-reduced-motion: reduce)'
    );
    return !!mq?.matches;
}

/**
 * Auto-hide peek for a single edge group. The collapsed edge group already
 * renders its tabs along the strip (the native "activity bar") — this reuses
 * them as the peek triggers rather than rendering a parallel strip:
 *
 * - **Hover** the collapsed strip → after `openDelay`, the active panel slides
 *   out as an overlay on the shell overlay root. The live content element is
 *   reparented (state preserved) and the grid is NOT reflowed (the splitview
 *   view stays locked at `collapsedSize`).
 * - **Keyboard-focus** a collapsed tab → peeks (so the panel is reachable).
 *   **Clicking** a collapsed tab natively expands (pins) the group instead.
 * - **Leave** both the strip and the overlay → closes after `closeDelay`; a
 *   single shared timer, cancelled by re-entering either (the flicker fix).
 *   `Esc` / pointer-down outside / focus-out also close. A pin button re-docks.
 *
 * Both render modes slide out. It reparents the content CONTAINER (not the panel
 * content): for `onlyWhenVisible` the content lives inside it and moves with it;
 * for `always` the container is just the position reference the shared render
 * overlay anchors to — the content's parent (the render overlay) never changes,
 * we only re-run its positioning (`repositionOverlays`) as the container slides.
 */
class EdgeGroupController extends CompositeDisposable {
    private _peek:
        | { overlay: HTMLElement; content: HTMLElement; parent: HTMLElement }
        | undefined;
    private _closeListeners: CompositeDisposable | undefined;
    private _openTimer: ReturnType<typeof setTimeout> | undefined;
    private _closeTimer: ReturnType<typeof setTimeout> | undefined;

    constructor(
        private readonly group: DockviewGroupPanel,
        private readonly host: IAutoHideEdgeGroupHost
    ) {
        super();

        const strip = this.group.element;
        const onEnter = (): void => {
            if (this._gate()) {
                this._cancelClose();
                this._scheduleOpen();
            }
        };
        const onLeave = (): void => {
            this._cancelOpen();
            this._scheduleClose();
        };
        // Keyboard-focus a collapsed tab → peek (so the keyboard can reach the
        // panel). Deferred out of the focus event: reparenting the content
        // container synchronously during dispatch makes the edge group expand.
        // No click handler — clicking a collapsed edge tab natively *expands*
        // (pins) the group, which is the intended VS-style behaviour (hover to
        // peek, click to pin).
        const onFocusIn = (): void => {
            if (this._gate()) {
                this._cancelClose();
                this._scheduleOpen(0);
            }
        };
        strip.addEventListener('pointerenter', onEnter);
        strip.addEventListener('pointerleave', onLeave);
        strip.addEventListener('focusin', onFocusIn);

        this.addDisposables(
            // Expanding (pin) tears the peek down; collapsing leaves the native
            // strip visible with nothing extra to render.
            this.group.api.onDidCollapsedChange(() => this._closePeek()),
            // Activating a different tab while peeking: the content container
            // already shows the new active `onlyWhenVisible` panel; re-anchor so
            // the new active `always` panel covers it too.
            this.group.api.onDidActivePanelChange(() => {
                if (this._peek) {
                    this.host.repositionOverlays();
                }
            }),
            {
                dispose: () => {
                    strip.removeEventListener('pointerenter', onEnter);
                    strip.removeEventListener('pointerleave', onLeave);
                    strip.removeEventListener('focusin', onFocusIn);
                    this._clearTimers();
                    this._closePeek();
                },
            }
        );
    }

    private get _opts() {
        return resolveOptions(this.host.options.autoHideEdgeGroups);
    }

    /** Enabled + collapsed — the precondition for peeking. */
    private _gate(): boolean {
        return this._opts.enabled && this.group.api.isCollapsed();
    }

    private get _position(): EdgeGroupPosition | undefined {
        const location = this.group.api.location;
        return location.type === 'edge' ? location.position : undefined;
    }

    // --- timers ---

    private _openNow(): void {
        this._cancelOpen();
        this._cancelClose();
        this.openPeek();
    }

    private _scheduleOpen(delay = this._opts.openDelay): void {
        this._cancelOpen();
        this._openTimer = setTimeout(() => this.openPeek(), delay);
    }

    private _cancelOpen(): void {
        if (this._openTimer !== undefined) {
            clearTimeout(this._openTimer);
            this._openTimer = undefined;
        }
    }

    private _scheduleClose(): void {
        this._cancelClose();
        this._closeTimer = setTimeout(
            () => this._closePeek(),
            this._opts.closeDelay
        );
    }

    private _cancelClose(): void {
        if (this._closeTimer !== undefined) {
            clearTimeout(this._closeTimer);
            this._closeTimer = undefined;
        }
    }

    private _clearTimers(): void {
        this._cancelOpen();
        this._cancelClose();
    }

    // --- peek ---

    openPeek(): void {
        if (!this._gate()) {
            return;
        }
        if (!this.group.activePanel) {
            return;
        }
        // Reparent the whole content CONTAINER (not the panel's content element)
        // so BOTH renderers work: `onlyWhenVisible` content lives inside it, and
        // an `always` panel's render overlay is anchored to it (re-anchored via
        // repositionOverlays). It un-hides automatically once out of the
        // collapsed group's subtree.
        const content = this.group.element.querySelector<HTMLElement>(
            '.dv-content-container'
        );
        const parent = content?.parentElement;
        if (!content || !parent) {
            return;
        }
        // Already peeking? nothing to do.
        if (this._peek?.content === content) {
            return;
        }

        const doc = this.group.element.ownerDocument;
        const overlay = doc.createElement('div');
        overlay.className = 'dv-edge-peek';
        overlay.style.position = 'absolute';
        overlay.style.overflow = 'hidden';
        overlay.style.boxSizing = 'border-box';
        // Above grid content (the floating-overlay host is pointer-events:none,
        // so opt this child back in).
        overlay.style.zIndex = '999';
        overlay.style.pointerEvents = 'auto';

        const header = doc.createElement('div');
        header.className = 'dv-edge-peek-header';
        // Float the header so the content container can fill the whole overlay
        // (its box anchors `always`-rendered content) — layout must not depend
        // on the consumer loading the stylesheet.
        header.style.position = 'absolute';
        header.style.top = '0';
        header.style.right = '0';
        header.style.zIndex = '1';
        const pinButton = doc.createElement('button');
        pinButton.className = 'dv-edge-peek-pin';
        pinButton.type = 'button';
        pinButton.title = 'Pin';
        pinButton.setAttribute('aria-label', 'Pin');
        pinButton.textContent = 'Pin';
        pinButton.addEventListener('click', () => this.pin());
        header.appendChild(pinButton);
        overlay.appendChild(header);

        // Reparent the live content into the overlay (state preserved). Fill the
        // overlay so it doesn't depend on the consumer's stylesheet for layout.
        content.style.width = '100%';
        content.style.height = '100%';
        overlay.appendChild(content);

        this.host.overlayRoot.appendChild(overlay);
        this._peek = { overlay, content, parent };
        this._positionOverlay(overlay);
        this._armCloseListeners();
        this.host.setEdgeGroupPeeking(this.group, true);
        this._animateIn(overlay);
    }

    /**
     * Slide the overlay in from the strip edge. Driven by a manual rAF loop
     * (not a CSS transition) so that on every frame we also re-anchor any
     * `always`-rendered content over the container's *moving* box — otherwise
     * `onlyWhenVisible` content (inside the overlay) would slide but `always`
     * content (positioned in the shared render overlay) would not.
     */
    private _animateIn(overlay: HTMLElement): void {
        const position = this._position;
        const win = this.group.element.ownerDocument.defaultView;
        if (
            !position ||
            !this._opts.animate ||
            prefersReducedMotion(this.group.element.ownerDocument) ||
            typeof win?.requestAnimationFrame !== 'function' ||
            typeof win.performance?.now !== 'function'
        ) {
            this.host.repositionOverlays();
            return;
        }

        const axis = position === 'left' || position === 'right' ? 'X' : 'Y';
        const sign = position === 'left' || position === 'top' ? -1 : 1;
        const duration = 150;
        const start = win.performance.now();

        const step = (now: number): void => {
            if (this._peek?.overlay !== overlay) {
                return; // closed mid-animation
            }
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            const remaining = (1 - eased) * 100 * sign;
            overlay.style.transform =
                t >= 1 ? '' : `translate${axis}(${remaining}%)`;
            // Re-anchor `always` content over the container's transformed box.
            this.host.repositionOverlays();
            if (t < 1) {
                win.requestAnimationFrame(step);
            }
        };
        win.requestAnimationFrame(step);
    }

    /** Anchor the overlay to the strip's inner edge, sized to the group's
     *  expanded size — relative to the floating-overlay host. No grid reflow. */
    private _positionOverlay(overlay: HTMLElement): void {
        const position = this._position;
        if (!position) {
            return;
        }
        const strip = this.group.element.getBoundingClientRect();
        const host = this.host.overlayRoot.getBoundingClientRect();
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
        const overlay = this._peek!.overlay;
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
            if (
                overlay.contains(target) ||
                this.group.element.contains(target)
            ) {
                return;
            }
            this._closePeek();
        };
        const onOverlayEnter = (): void => this._cancelClose();
        const onOverlayLeave = (): void => this._scheduleClose();
        const onFocusOut = (e: Event): void => {
            const next = (e as FocusEvent).relatedTarget;
            if (
                next instanceof Node &&
                (overlay.contains(next) || this.group.element.contains(next))
            ) {
                return;
            }
            this._scheduleClose();
        };
        doc.addEventListener('keydown', onKeyDown, true);
        doc.addEventListener('pointerdown', onPointerDown, true);
        overlay.addEventListener('pointerenter', onOverlayEnter);
        overlay.addEventListener('pointerleave', onOverlayLeave);
        overlay.addEventListener('focusout', onFocusOut);

        this._closeListeners = new CompositeDisposable(
            {
                dispose: () =>
                    doc.removeEventListener('keydown', onKeyDown, true),
            },
            {
                dispose: () =>
                    doc.removeEventListener('pointerdown', onPointerDown, true),
            },
            {
                dispose: () => {
                    overlay.removeEventListener('pointerenter', onOverlayEnter);
                    overlay.removeEventListener('pointerleave', onOverlayLeave);
                    overlay.removeEventListener('focusout', onFocusOut);
                },
            }
        );
    }

    private _closePeek(): void {
        this._clearTimers();
        this._closeListeners?.dispose();
        this._closeListeners = undefined;
        const peek = this._peek;
        this._peek = undefined;
        if (!peek) {
            return;
        }
        // Restore the content container before removing the overlay, clearing
        // the fill styles applied for the peek.
        peek.content.style.width = '';
        peek.content.style.height = '';
        peek.parent.appendChild(peek.content);
        peek.overlay.remove();
        this.host.setEdgeGroupPeeking(this.group, false);
        // Re-anchor `always` content back over the (now collapsed) container.
        this.host.repositionOverlays();
    }

    isPeeking(): boolean {
        return this._peek !== undefined;
    }

    peek(open: boolean): void {
        if (open) {
            this._openNow();
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
 * Auto-hide edge groups (VS-style). A collapsed edge group's native tabs become
 * peek triggers: hover/focus/click slides the active panel out as a
 * non-reflowing overlay, with a pin button to re-dock. Opt-in via
 * `autoHideEdgeGroups` (default off → collapsed edge groups behave as today).
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

    pin(position: EdgeGroupPosition): void {
        const group = this.host.getEdgeGroupPanel(position);
        if (!group) {
            return;
        }
        const controller = this._controllers.get(group);
        if (controller) {
            controller.pin();
        } else {
            this.host.setEdgeGroupCollapsed(group, false);
        }
    }

    autoHide(position: EdgeGroupPosition): void {
        const group = this.host.getEdgeGroupPanel(position);
        if (group) {
            this.host.setEdgeGroupCollapsed(group, true);
        }
    }

    peek(position: EdgeGroupPosition, peek: boolean): void {
        const group = this.host.getEdgeGroupPanel(position);
        const controller = group && this._controllers.get(group);
        controller?.peek(peek);
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
