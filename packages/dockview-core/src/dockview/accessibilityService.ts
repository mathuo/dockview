import { CompositeDisposable, IDisposable } from '../lifecycle';
import { Event } from '../events';
import { Position } from '../dnd/droptarget';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { IDockviewPanel } from './dockviewPanel';
import { DockviewLayoutMutationEvent } from './dockviewComponent';
import {
    DockviewComponentOptions,
    DockviewKeybindings,
    KeyboardNavigationOptions,
} from './options';
import { resolveMessages } from './accessibilityMessages';
import { defineModule } from './modules';
import { AdvancedDnDModule } from './advancedDnDService';
import { LiveRegionModule } from './liveRegionService';

/**
 * The narrow surface the {@link AccessibilityService} needs from the host
 * (the `DockviewComponent`). It reads the group tree, previews a drop (via the
 * AdvancedDnD module — same overlay as a mouse drag), narrates (via the
 * LiveRegion module), and commits the dock.
 */
export interface IAccessibilityHost {
    /**
     * The outermost dockview element (the shell, which also contains edge
     * groups). A getter — it must resolve to the shell once that exists, not
     * the inner gridview, or keydowns from edge groups are missed.
     */
    readonly rootElement: HTMLElement;
    readonly options: DockviewComponentOptions;
    readonly groups: DockviewGroupPanel[];
    readonly activeGroup: DockviewGroupPanel | undefined;
    readonly activePanel: IDockviewPanel | undefined;
    /**
     * The next / previous group in gridview (spatial) order, wrapping round —
     * the one piece of navigation that needs the grid internals. All other
     * focus logic lives in the service, using the public group API.
     */
    adjacentGroup(
        group: DockviewGroupPanel,
        reverse: boolean
    ): DockviewGroupPanel | undefined;
    /** Fires before / after a structural layout change — used to restore focus on close. */
    readonly onWillMutateLayout: Event<DockviewLayoutMutationEvent>;
    readonly onDidMutateLayout: Event<DockviewLayoutMutationEvent>;
    showDropPreview(group: DockviewGroupPanel, position: Position): IDisposable;
    announce(message: string): void;
    dockPanel(
        panel: IDockviewPanel,
        group: DockviewGroupPanel,
        position: Position
    ): void;
}

export interface IAccessibilityService extends IDisposable {}

type DockPhase = 'target' | 'edge';

interface MoveState {
    readonly source: IDockviewPanel;
    readonly groups: DockviewGroupPanel[];
    groupIndex: number;
    phase: DockPhase;
    position: Position;
}

const EDGE_FROM_KEY: Record<string, Position> = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'top',
    ArrowDown: 'bottom',
};

const DEFAULT_KEYMAP: DockviewKeybindings = {
    nextTab: 'ctrl+]',
    prevTab: 'ctrl+[',
    focusNextGroup: 'f6',
    focusPrevGroup: 'shift+f6',
    focusGroupLeft: 'ctrl+shift+arrowleft',
    focusGroupRight: 'ctrl+shift+arrowright',
    focusGroupUp: 'ctrl+shift+arrowup',
    focusGroupDown: 'ctrl+shift+arrowdown',
    dock: 'ctrl+m',
};

/**
 * Does `e` match a binding string like `'ctrl+]'` / `'shift+f6'`? Modifiers
 * are matched exactly (a binding without `shift` will not fire while Shift is
 * held), and the final part is compared to `KeyboardEvent.key`, lower-cased.
 */
function matchesBinding(e: KeyboardEvent, binding: string): boolean {
    const parts = binding.toLowerCase().split('+');
    const key = parts[parts.length - 1];
    const mods = parts.slice(0, -1);
    return (
        e.ctrlKey === mods.includes('ctrl') &&
        e.shiftKey === mods.includes('shift') &&
        e.altKey === mods.includes('alt') &&
        e.metaKey === (mods.includes('meta') || mods.includes('cmd')) &&
        e.key.toLowerCase() === key
    );
}

/**
 * Pro accessibility module — operate the dock without a mouse. Opt-in via
 * `keyboardNavigation`, with a rebindable {@link DockviewKeybindings} keymap.
 *
 * - **Switch tab** (`Ctrl+]` / `Ctrl+[`) — cycle the focused group's tabs.
 * - **Focus group** (`F6` / `Shift+F6` sequential, `Ctrl+Shift+Arrows`
 *   spatial) — move focus between groups.
 * - **Keyboard docking** (`Ctrl+M`) — arms a two-phase move of the active
 *   panel with a live drop preview + screen-reader narration:
 *     1. PICK TARGET — arrows cycle the groups (incl. the panel's own, so a tab
 *        can be split out); `Enter` selects one.
 *     2. PICK EDGE — arrows choose a split edge (left/right/top/bottom) or the
 *        centre (tab-into); `Enter` commits, `Escape` steps back.
 *   `Escape` from the target phase cancels.
 * - **Focus restore on close** (L4) — when removing a panel/group pulls focus
 *   out of the dock, focus returns to the neighbour the layout just activated
 *   instead of being stranded on `<body>`.
 * - **Floating `Esc`** (L4) — `Esc` inside a floating group returns focus to
 *   the control that had it before entering the float (polite: bubble phase,
 *   respects `defaultPrevented`, so panel content keeps `Esc`).
 * - **Floating Tab-containment** (L4) — Tab wraps within the floating group so
 *   focus doesn't leak to the grid behind it.
 *
 * Cross-window (popout) focus is a later phase.
 */
export class AccessibilityService
    extends CompositeDisposable
    implements IAccessibilityService
{
    private _move: MoveState | null = null;
    private _preview: IDisposable | undefined;
    private _focusWasInside = false;
    private _lastNonFloatFocus: HTMLElement | undefined;

    constructor(private readonly host: IAccessibilityHost) {
        super();

        // Listen on the document (capture) rather than the dockview element:
        // edge groups live in the shell *outside* the gridview, and the shell
        // is created after this service, so a fixed element would miss them.
        // Capture also lets move-mode keys beat the free tab-strip navigation.
        const doc = host.rootElement.ownerDocument;
        const onKeyDown = (e: KeyboardEvent): void => this._onKeyDown(e);
        doc.addEventListener('keydown', onKeyDown, true);

        // Remember the last control focused in the main dock (outside any
        // float) so Esc inside a floating group can return focus to its
        // invoking control. Observe-only — never consumes.
        const onFocusIn = (e: FocusEvent): void => {
            const t = e.target;
            if (
                t instanceof HTMLElement &&
                this.host.rootElement.contains(t) &&
                !t.closest('[role="dialog"]')
            ) {
                this._lastNonFloatFocus = t;
            }
        };
        doc.addEventListener('focusin', onFocusIn, true);

        // Esc-from-float restore runs in the BUBBLE phase and respects
        // defaultPrevented, so panel content that uses Esc keeps priority.
        const onEscape = (e: KeyboardEvent): void => this._onFloatingEscape(e);
        doc.addEventListener('keydown', onEscape, false);

        this.addDisposables(
            { dispose: () => this._clearPreview() },
            {
                dispose: () =>
                    doc.removeEventListener('keydown', onKeyDown, true),
            },
            {
                dispose: () =>
                    doc.removeEventListener('focusin', onFocusIn, true),
            },
            {
                dispose: () =>
                    doc.removeEventListener('keydown', onEscape, false),
            },
            // L4 focus management — when a close pulls focus out of the dock,
            // return it to the neighbour the component just activated rather
            // than leaving it stranded on <body>. Snapshot before the teardown
            // (focus still on the closing panel), restore after.
            host.onWillMutateLayout((e) => {
                if (e.kind === 'remove' && this._nav) {
                    this._focusWasInside = this._isFocusInside();
                }
            }),
            host.onDidMutateLayout((e) => {
                if (
                    e.kind === 'remove' &&
                    this._nav &&
                    this._focusWasInside &&
                    !this._isFocusInside()
                ) {
                    this._restoreFocus();
                }
            })
        );
    }

    private _isFocusInside(): boolean {
        const active = this.host.rootElement.ownerDocument.activeElement;
        return active instanceof Node && this.host.rootElement.contains(active);
    }

    private _onFloatingEscape(e: KeyboardEvent): void {
        if (
            !this._nav ||
            this._move ||
            e.defaultPrevented ||
            e.key !== 'Escape'
        ) {
            return;
        }
        const target = e.target;
        if (!(target instanceof Element)) {
            return;
        }
        // Only when focus is inside one of *this* dock's floating groups.
        const float = target.closest('[role="dialog"]');
        if (!float || !this.host.rootElement.contains(float)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        this._returnFocusFromFloat();
    }

    /**
     * Keep Tab inside the floating group that holds focus: at the last tabbable
     * Tab wraps to the first, at the first Shift+Tab wraps to the last. Returns
     * true if it handled the event. No-op outside a float.
     */
    private _trapFloatTab(e: KeyboardEvent): boolean {
        const target = e.target;
        if (!(target instanceof Element)) {
            return false;
        }
        const float = target.closest('[role="dialog"]');
        if (!float || !this.host.rootElement.contains(float)) {
            return false;
        }
        // Always manage Tab inside a float, never just at the boundary: focus
        // often sits on non-tabbable plumbing (the content container, which is
        // tabindex="-1"), and the browser's default Tab from there escapes to
        // the grid behind. Drive the cursor through the float's tabbables
        // ourselves and swallow the default so it can't leak out.
        e.preventDefault();
        const tabbables = this._tabbables(float);
        if (tabbables.length === 0) {
            return true;
        }
        const active = float.ownerDocument.activeElement;
        const index =
            active instanceof HTMLElement ? tabbables.indexOf(active) : -1;
        const n = tabbables.length;
        const next =
            index === -1
                ? e.shiftKey
                    ? n - 1
                    : 0
                : (index + (e.shiftKey ? -1 : 1) + n) % n;
        tabbables[next].focus();
        return true;
    }

    private _tabbables(root: Element): HTMLElement[] {
        const nodes = root.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), ' +
                'select:not([disabled]), textarea:not([disabled]), [tabindex]'
        );
        // tabIndex >= 0 keeps naturally-focusable controls and roving anchors
        // (the active tab) while dropping tabindex="-1" plumbing (content
        // containers, inactive tabs).
        return Array.from(nodes).filter((el) => el.tabIndex >= 0);
    }

    private _returnFocusFromFloat(): void {
        const prev = this._lastNonFloatFocus;
        if (
            prev &&
            prev.isConnected &&
            this.host.rootElement.contains(prev) &&
            !prev.closest('[role="dialog"]')
        ) {
            prev.focus();
            return;
        }
        // Invoking control is gone — fall back to a grid group's content.
        this.host.groups
            .find((g) => g.api.location.type === 'grid')
            ?.model.focusContent();
    }

    private get _nav(): KeyboardNavigationOptions | undefined {
        const opt = this.host.options.keyboardNavigation;
        if (!opt) {
            return undefined;
        }
        return opt === true ? {} : opt;
    }

    private get _keymap(): DockviewKeybindings {
        return { ...DEFAULT_KEYMAP, ...this._nav?.keymap };
    }

    private _onKeyDown(e: KeyboardEvent): void {
        if (!this._nav) {
            return;
        }
        if (this._move) {
            this._onMoveKey(e);
            return;
        }
        // Only act on events originating inside *this* dockview.
        if (
            !(e.target instanceof Node) ||
            !this.host.rootElement.contains(e.target)
        ) {
            return;
        }
        // Trap Tab within a floating group so focus doesn't leak to the grid
        // behind it (the float is non-modal, but its Tab order should be).
        if (e.key === 'Tab' && this._trapFloatTab(e)) {
            return;
        }
        const keymap = this._keymap;
        if (matchesBinding(e, keymap.dock)) {
            this._enterMoveMode(e);
        } else if (matchesBinding(e, keymap.nextTab)) {
            this._consume(e);
            this._switchTab(false);
        } else if (matchesBinding(e, keymap.prevTab)) {
            this._consume(e);
            this._switchTab(true);
        } else if (matchesBinding(e, keymap.focusNextGroup)) {
            this._consume(e);
            this._cycleGroup(false);
        } else if (matchesBinding(e, keymap.focusPrevGroup)) {
            this._consume(e);
            this._cycleGroup(true);
        } else if (matchesBinding(e, keymap.focusGroupLeft)) {
            this._consume(e);
            this._focusGroupInDirection('left');
        } else if (matchesBinding(e, keymap.focusGroupRight)) {
            this._consume(e);
            this._focusGroupInDirection('right');
        } else if (matchesBinding(e, keymap.focusGroupUp)) {
            this._consume(e);
            this._focusGroupInDirection('up');
        } else if (matchesBinding(e, keymap.focusGroupDown)) {
            this._consume(e);
            this._focusGroupInDirection('down');
        }
    }

    // --- navigation (uses the public group API + the adjacentGroup primitive) ---

    private _switchTab(reverse: boolean): void {
        const group = this.host.activeGroup;
        if (!group) {
            return;
        }
        if (reverse) {
            group.model.moveToPrevious();
        } else {
            group.model.moveToNext();
        }
        // Keep DOM focus inside the dock: switching hides the previously
        // focused content, which would otherwise drop focus to <body> and
        // leave the keymap unable to see the next key.
        group.model.focusContent();
    }

    private _cycleGroup(reverse: boolean): void {
        const current = this.host.activeGroup;
        const target = current
            ? this.host.adjacentGroup(current, reverse)
            : this.host.groups[0];
        this._focusGroup(target);
    }

    private _focusGroupInDirection(
        direction: 'left' | 'right' | 'up' | 'down'
    ): void {
        const current = this.host.activeGroup;
        if (!current || current.api.location.type !== 'grid') {
            return;
        }
        const from = current.element.getBoundingClientRect();
        const fromX = from.left + from.width / 2;
        const fromY = from.top + from.height / 2;

        let best: DockviewGroupPanel | undefined;
        let bestDistance = Number.POSITIVE_INFINITY;
        for (const group of this.host.groups) {
            if (group === current || group.api.location.type !== 'grid') {
                continue;
            }
            const rect = group.element.getBoundingClientRect();
            const dx = rect.left + rect.width / 2 - fromX;
            const dy = rect.top + rect.height / 2 - fromY;
            // require the candidate to sit predominantly in the asked-for
            // direction (dominant axis), so 'left' ignores a group that's
            // mostly above/below.
            const inDirection =
                direction === 'left'
                    ? dx < 0 && Math.abs(dx) >= Math.abs(dy)
                    : direction === 'right'
                      ? dx > 0 && Math.abs(dx) >= Math.abs(dy)
                      : direction === 'up'
                        ? dy < 0 && Math.abs(dy) >= Math.abs(dx)
                        : dy > 0 && Math.abs(dy) >= Math.abs(dx);
            if (!inDirection) {
                continue;
            }
            const distance = dx * dx + dy * dy;
            if (distance < bestDistance) {
                bestDistance = distance;
                best = group;
            }
        }

        this._focusGroup(best);
    }

    private _focusGroup(target: DockviewGroupPanel | undefined): void {
        if (!target) {
            return;
        }
        target.api.setActive();
        target.model.focusContent();
    }

    /** Return DOM focus to the active group's content, keeping it in the dock. */
    private _restoreFocus(): void {
        this.host.activeGroup?.model.focusContent();
    }

    private _enterMoveMode(e: KeyboardEvent): void {
        const source = this.host.activePanel;
        const groups = this.host.groups;
        if (!source || groups.length === 0) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        // Start on the panel's own group so a single group of tabs can still
        // split a tab out via the edge phase.
        const groupIndex = Math.max(0, groups.indexOf(source.group));
        this._move = {
            source,
            groups,
            groupIndex,
            phase: 'target',
            position: 'center',
        };
        this._render();
    }

    private _onMoveKey(e: KeyboardEvent): void {
        const move = this._move!;

        if (e.key === 'Escape') {
            this._consume(e);
            if (move.phase === 'edge') {
                move.phase = 'target';
                move.position = 'center';
                this._render();
            } else {
                this._exit();
                this.host.announce(this._messages.moveCancelled());
                this._restoreFocus();
            }
            return;
        }

        if (e.key === 'Enter') {
            this._consume(e);
            if (move.phase === 'target') {
                move.phase = 'edge';
                move.position = 'center';
                this._render();
            } else {
                this._commit();
            }
            return;
        }

        if (move.phase === 'target') {
            const n = move.groups.length;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                this._consume(e);
                move.groupIndex = (move.groupIndex + 1) % n;
                this._render();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                this._consume(e);
                move.groupIndex = (move.groupIndex - 1 + n) % n;
                this._render();
            }
            return;
        }

        // edge phase
        const edge = EDGE_FROM_KEY[e.key];
        if (edge) {
            this._consume(e);
            move.position = edge;
            this._render();
        } else if (e.key === ' ' || e.key === 'c' || e.key === 'C') {
            this._consume(e);
            move.position = 'center';
            this._render();
        }
    }

    private get _messages() {
        return resolveMessages(this.host.options.messages);
    }

    private _render(): void {
        const move = this._move!;
        const group = move.groups[move.groupIndex];
        this._clearPreview();
        this._preview = this.host.showDropPreview(group, move.position);

        const name = group.activePanel?.title ?? group.id;
        const m = this._messages;
        if (move.phase === 'target') {
            this.host.announce(
                m.movePickTarget(
                    this._label(move.source),
                    name,
                    move.groupIndex + 1,
                    move.groups.length
                )
            );
        } else {
            this.host.announce(m.movePickEdge(move.position, name));
        }
    }

    private _commit(): void {
        const move = this._move!;
        const group = move.groups[move.groupIndex];
        const position = move.position;
        const source = move.source;
        const name = group.activePanel?.title ?? group.id;
        const m = this._messages;
        this._exit();
        try {
            this.host.dockPanel(source, group, position);
            this.host.announce(
                m.moveCommitted(this._label(source), name, position)
            );
        } catch {
            this.host.announce(m.moveNotAllowed());
        }
        // The move re-renders the grid; pull focus back into the dock so the
        // keymap keeps working without a click.
        this._restoreFocus();
    }

    private _exit(): void {
        this._clearPreview();
        this._move = null;
    }

    private _clearPreview(): void {
        this._preview?.dispose();
        this._preview = undefined;
    }

    private _consume(e: KeyboardEvent): void {
        e.preventDefault();
        e.stopPropagation();
    }

    private _label(panel: IDockviewPanel): string {
        return panel.title ?? panel.id;
    }
}

export const AccessibilityModule = defineModule<
    'accessibilityService',
    IAccessibilityHost
>({
    name: 'Accessibility',
    serviceKey: 'accessibilityService',
    create: (host) => new AccessibilityService(host),
    dependsOn: [AdvancedDnDModule, LiveRegionModule],
});
