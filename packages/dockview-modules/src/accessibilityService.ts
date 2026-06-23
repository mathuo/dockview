import {
    DockviewCompositeDisposable as CompositeDisposable,
    DockviewIDisposable as IDisposable,
} from 'dockview-core';
import { DockviewGroupPanel } from 'dockview-core';
import { DockviewKeybindings, KeyboardNavigationOptions } from 'dockview-core';
import { defineModule } from 'dockview-core';
import { IAccessibilityHost, IAccessibilityService } from 'dockview-core';
import {
    KEYBOARD_MOVE_ATTRIBUTE,
    matchesBinding,
    readKeyboardNavigation,
} from './keyboardShared';

const DEFAULT_KEYMAP: DockviewKeybindings = {
    nextTab: 'ctrl+]',
    prevTab: 'ctrl+[',
    focusNextGroup: 'f6',
    focusPrevGroup: 'shift+f6',
    focusTabs: 'ctrl+shift+\\',
};

/**
 * Keyboard navigation & focus management — operate the dock without a mouse.
 * Opt-in via `keyboardNavigation`, with a rebindable {@link DockviewKeybindings}
 * keymap.
 *
 * - **Switch tab** (`Ctrl+]` / `Ctrl+[`) — cycle the focused group's tabs.
 * - **Focus group** (`F6` / `Shift+F6`) — move focus to the next / previous
 *   group in sequence.
 * - **Focus the tab strip** (`Ctrl+Shift+\`) — jump focus from panel content to
 *   the active group's tab strip (the strip's roving-tabindex takes over).
 * - **Focus restore on close** — when removing a panel/group pulls focus out of
 *   the dock, focus returns to the neighbour the layout just activated instead
 *   of being stranded on `<body>`.
 * - **Floating `Esc`** — `Esc` inside a floating group returns focus to the
 *   control that had it before entering the float (polite: bubble phase,
 *   respects `defaultPrevented`, so panel content keeps `Esc`).
 * - **Floating Tab-containment** — Tab wraps within the floating group so focus
 *   doesn't leak to the grid behind it.
 *
 * Stands down while an advanced keyboard move is in progress (see
 * {@link KEYBOARD_MOVE_ATTRIBUTE}) so the docking module owns the keys then.
 */
export class AccessibilityService
    extends CompositeDisposable
    implements IAccessibilityService
{
    private _focusWasInside = false;
    private _lastNonFloatFocus: HTMLElement | undefined;

    constructor(private readonly host: IAccessibilityHost) {
        super();

        // Listen on the document (capture) rather than the dockview element:
        // edge groups live in the shell *outside* the gridview, and the shell
        // is created after this service, so a fixed element would miss them.
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
            // When a structural change pulls focus out of the dock, return it to
            // the neighbour the component just activated rather than leaving it
            // stranded on <body>. Snapshot before the change (focus still on the
            // affected panel), restore after.
            //
            // - `remove`: closing the focused panel/group.
            // - `maximize`: maximizing a *different* group hides the focused
            //   one, blurring it to <body>. (Maximizing the focused group keeps
            //   its DOM in place, so focus stays inside and we no-op — which is
            //   exactly what the was-inside / not-inside guard checks, so we
            //   never steal focus from a mouse user who maximized in place.)
            host.onWillMutateLayout((e) => {
                if (this._restoresFocus(e) && this._nav) {
                    this._focusWasInside = this._isFocusInside();
                }
            }),
            host.onDidMutateLayout((e) => {
                if (
                    this._restoresFocus(e) &&
                    this._nav &&
                    this._focusWasInside &&
                    !this._isFocusInside()
                ) {
                    this._restoreFocus();
                }
            })
        );
    }

    private get _moveActive(): boolean {
        return this.host.rootElement.hasAttribute(KEYBOARD_MOVE_ATTRIBUTE);
    }

    /** Mutations that can strand focus on `<body>` and so warrant a restore. */
    private _restoresFocus(e: { kind: string }): boolean {
        return e.kind === 'remove' || e.kind === 'maximize';
    }

    private _isFocusInside(): boolean {
        const active = this.host.rootElement.ownerDocument.activeElement;
        return active instanceof Node && this.host.rootElement.contains(active);
    }

    private _onFloatingEscape(e: KeyboardEvent): void {
        if (
            !this._nav ||
            this._moveActive ||
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
        return readKeyboardNavigation(this.host.options);
    }

    private get _keymap(): DockviewKeybindings {
        return { ...DEFAULT_KEYMAP, ...this._nav?.keymap };
    }

    private _onKeyDown(e: KeyboardEvent): void {
        if (!this._nav) {
            return;
        }
        // Stand down while the docking module is driving a keyboard move.
        if (this._moveActive) {
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
        if (matchesBinding(e, keymap.nextTab)) {
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
        } else if (matchesBinding(e, keymap.focusTabs)) {
            this._consume(e);
            this._focusTabs();
        }
    }

    // --- navigation (uses the public group API + the adjacentGroup primitive) ---

    private _focusTabs(): void {
        // Jump from panel content to the active group's tab strip; the
        // tablist's own roving-tabindex handler takes over from there.
        this.host.activeGroup?.model.focusActiveTab();
    }

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

    private _consume(e: KeyboardEvent): void {
        e.preventDefault();
        e.stopPropagation();
    }
}

export const AccessibilityModule = defineModule<
    'accessibilityService',
    IAccessibilityHost
>({
    name: 'Accessibility',
    serviceKey: 'accessibilityService',
    create: (host) => new AccessibilityService(host),
});
