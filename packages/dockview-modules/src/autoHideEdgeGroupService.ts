import { DockviewCompositeDisposable as CompositeDisposable } from 'dockview-core';
import { DockviewGroupPanel } from 'dockview-core';
import { IDockviewPanel } from 'dockview-core';
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
 * we only re-run its positioning (`repositionPanelOverlay`, force-visible) as the
 * container slides, so the panel's own visibility state is never touched.
 */
class EdgeGroupController extends CompositeDisposable {
    private _peek:
        | {
              overlay: HTMLElement;
              header: HTMLElement;
              content: HTMLElement;
              parent: HTMLElement;
              panel: IDockviewPanel;
          }
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
            // already shows the new active `onlyWhenVisible` panel; release the
            // old `always` overlay and re-anchor the new active one over it.
            this.group.api.onDidActivePanelChange(() => {
                const next = this.group.activePanel;
                if (this._peek && next) {
                    this.host.repositionPanelOverlay(this._peek.panel, false);
                    this._peek.panel = next;
                    this.host.repositionPanelOverlay(next, true);
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
        // Idempotent: a document pointermove drives this on every move, so don't
        // restart a running timer (that would prevent it ever firing).
        if (this._closeTimer !== undefined) {
            return;
        }
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

    /** The first opaque computed background walking up from the group — so the
     *  floating peek is never see-through, whatever (if anything) the consumer
     *  themed. Returns '' if nothing opaque is found (let the stylesheet win). */
    private _resolveBackground(): string {
        const win = this.group.element.ownerDocument.defaultView;
        if (!win) {
            return '';
        }
        let el: HTMLElement | null = this.group.element;
        while (el) {
            const bg = win.getComputedStyle(el).backgroundColor;
            if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
                return bg;
            }
            el = el.parentElement;
        }
        return '';
    }

    // --- peek ---

    openPeek(): void {
        if (!this._gate()) {
            return;
        }
        const panel = this.group.activePanel;
        if (!panel) {
            return;
        }
        // Reparent the whole content CONTAINER (not the panel's content element)
        // so BOTH renderers work: `onlyWhenVisible` content lives inside it, and
        // an `always` panel's render overlay is anchored to it (re-anchored via
        // repositionPanelOverlay). It un-hides automatically once out of the
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
        // The peek FLOATS over other content, so it must be opaque — a docked
        // group can be transparent (the shell shows through harmlessly), but a
        // floating one can't. The `.dv-edge-peek` stylesheet rule defaults it to
        // the group-view background, but if the consumer hasn't set that var the
        // peek would be see-through; derive an opaque background from the live
        // group (falling back up the tree) so it's never transparent.
        const background = this._resolveBackground();
        if (background) {
            overlay.style.backgroundColor = background;
        }

        // The Pin header is a SEPARATE sibling overlay (not a child of the peek)
        // so it can sit ABOVE an `always` panel's render overlay, which is itself
        // a sibling lifted above the peek backdrop (peek bg < always content <
        // pin). It's click-through except for the button so it never blocks the
        // peeked content.
        const header = doc.createElement('div');
        header.className = 'dv-edge-peek-header';
        header.style.position = 'absolute';
        header.style.zIndex = '1001';
        header.style.pointerEvents = 'none';
        header.style.display = 'flex';
        header.style.justifyContent = 'flex-end';
        header.style.alignItems = 'flex-start';
        header.style.padding = '4px';
        const pinButton = doc.createElement('button');
        pinButton.className = 'dv-edge-peek-pin';
        pinButton.type = 'button';
        pinButton.title = 'Pin';
        pinButton.setAttribute('aria-label', 'Pin');
        pinButton.textContent = 'Pin';
        // Self-contained cosmetics (it floats over the content, so needs its own
        // surface) — the stylesheet refines these but they must not depend on it.
        pinButton.style.pointerEvents = 'auto';
        pinButton.style.cursor = 'pointer';
        pinButton.style.border = '1px solid transparent';
        pinButton.style.borderRadius = '3px';
        pinButton.style.padding = '2px 8px';
        pinButton.style.fontSize = '11px';
        if (background) {
            pinButton.style.backgroundColor = background;
        }
        pinButton.addEventListener('click', () => this.pin());
        header.appendChild(pinButton);

        // Reparent the live content into the overlay (state preserved). Fill the
        // overlay so it doesn't depend on the consumer's stylesheet for layout.
        content.style.width = '100%';
        content.style.height = '100%';
        overlay.appendChild(content);

        this.host.overlayRoot.appendChild(overlay);
        this.host.overlayRoot.appendChild(header);
        this._peek = { overlay, header, content, parent, panel };
        this._positionOverlay(overlay);
        this._armCloseListeners();
        this.host.setEdgeGroupPeeking(this.group, true);
        this._animateIn(overlay);
    }

    /** Re-anchor the peeked `always` panel's render overlay over the (current)
     *  content-container box, force-showing it. No-op for `onlyWhenVisible`
     *  (whose content rides inside the reparented container). */
    private _syncOverlay(): void {
        if (this._peek) {
            this.host.repositionPanelOverlay(this._peek.panel, true);
        }
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
            this._syncOverlay();
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
            this._syncOverlay();
            if (t < 1) {
                win.requestAnimationFrame(step);
            }
        };
        win.requestAnimationFrame(step);
    }

    /** Anchor the overlay to the strip's inner edge, sized to the group's
     *  expanded size — relative to the overlay root. No grid reflow. The Pin
     *  header tracks the same box (it's a separate sibling so it can sit above
     *  an `always` render overlay). */
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

        let box: { left: number; top: number; width: number; height: number };
        switch (position) {
            case 'left':
                box = {
                    left: left + strip.width,
                    top,
                    width: size,
                    height: strip.height,
                };
                break;
            case 'right':
                box = {
                    left: left - size,
                    top,
                    width: size,
                    height: strip.height,
                };
                break;
            case 'top':
                box = {
                    left,
                    top: top + strip.height,
                    width: strip.width,
                    height: size,
                };
                break;
            case 'bottom':
                box = {
                    left,
                    top: top - size,
                    width: strip.width,
                    height: size,
                };
                break;
        }

        const apply = (el: HTMLElement): void => {
            el.style.left = `${box.left}px`;
            el.style.top = `${box.top}px`;
            el.style.width = `${box.width}px`;
            el.style.height = `${box.height}px`;
        };
        apply(overlay);
        if (this._peek) {
            apply(this._peek.header);
        }
    }

    /** Is the point within the strip or the peek's box? Geometry-based so it
     *  works regardless of which stacking layer the pointer is actually over —
     *  for `always` the content is a separate render overlay ON TOP of the peek,
     *  so element-based enter/leave on the peek would miss it. */
    private _pointWithinPeek(x: number, y: number): boolean {
        if (!this._peek) {
            return false;
        }
        const within = (r: DOMRect): boolean =>
            x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        return (
            within(this._peek.overlay.getBoundingClientRect()) ||
            within(this.group.element.getBoundingClientRect())
        );
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
            const pe = e as PointerEvent;
            if (this._pointWithinPeek(pe.clientX, pe.clientY)) {
                return;
            }
            this._closePeek();
        };
        // Keep-open / close by pointer geometry, not by element containment —
        // the peeked content may be a sibling render overlay on top of the peek.
        const onPointerMove = (e: Event): void => {
            const pe = e as PointerEvent;
            if (this._pointWithinPeek(pe.clientX, pe.clientY)) {
                this._cancelClose();
            } else {
                this._scheduleClose();
            }
        };
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
        doc.addEventListener('pointermove', onPointerMove, true);
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
                dispose: () =>
                    doc.removeEventListener('pointermove', onPointerMove, true),
            },
            {
                dispose: () =>
                    overlay.removeEventListener('focusout', onFocusOut),
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
        peek.header.remove();
        this.host.setEdgeGroupPeeking(this.group, false);
        // Re-anchor the `always` overlay back over the (now collapsed, in-group)
        // container — forceVisible:false lets it hide again as the panel is no
        // longer visible.
        this.host.repositionPanelOverlay(peek.panel, false);
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
