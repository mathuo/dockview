import {
    DockviewCompositeDisposable as CompositeDisposable,
    DockviewIDisposable as IDisposable,
} from 'dockview-core';
import { Position } from 'dockview-core';
import { DockviewGroupPanel } from 'dockview-core';
import { IDockviewPanel } from 'dockview-core';
import { resolveMessages } from 'dockview-core';
import { defineModule } from 'dockview-core';
import { AdvancedDnDModule } from './advancedDnDService';
import { LiveRegionModule } from 'dockview-core';
import { IAccessibilityHost, IKeyboardDockingService } from 'dockview-core';
import {
    KEYBOARD_MOVE_ATTRIBUTE,
    matchesBinding,
    readKeyboardNavigation,
} from './keyboardShared';

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

/** Bindings owned by this module (kept separate from the default navigation keymap). */
interface DockingKeybindings {
    /** Move focus to the group spatially to the left. Default `ctrl+shift+arrowleft`. */
    focusGroupLeft: string;
    /** Move focus to the group spatially to the right. Default `ctrl+shift+arrowright`. */
    focusGroupRight: string;
    /** Move focus to the group spatially above. Default `ctrl+shift+arrowup`. */
    focusGroupUp: string;
    /** Move focus to the group spatially below. Default `ctrl+shift+arrowdown`. */
    focusGroupDown: string;
    /** Arm keyboard docking of the active panel. Default `ctrl+m`. */
    dock: string;
}

const DEFAULT_KEYMAP: DockingKeybindings = {
    focusGroupLeft: 'ctrl+shift+arrowleft',
    focusGroupRight: 'ctrl+shift+arrowright',
    focusGroupUp: 'ctrl+shift+arrowup',
    focusGroupDown: 'ctrl+shift+arrowdown',
    dock: 'ctrl+m',
};

/**
 * Advanced keyboard control — drive the layout itself without a mouse. Opt-in
 * via `keyboardNavigation` (shared with the default navigation module).
 *
 * - **Spatial group focus** (`Ctrl+Shift+Arrows`) — move focus to the visually
 *   adjacent group via the `adjacentGroupInDirection` geometry primitive.
 * - **Keyboard docking** (`Ctrl+M`) — arms a two-phase move of the active panel
 *   with a live drop preview + screen-reader narration:
 *     1. PICK TARGET — arrows cycle the groups (incl. the panel's own, so a tab
 *        can be split out); `Enter` selects one.
 *     2. PICK EDGE — arrows choose a split edge (left/right/top/bottom) or the
 *        centre (tab-into); `Enter` commits, `Escape` steps back.
 *   `Escape` from the target phase cancels.
 *
 * While a move is in progress it marks the root with
 * {@link KEYBOARD_MOVE_ATTRIBUTE} so the default navigation listener stands
 * down and the move keys aren't double-handled.
 */
export class KeyboardDockingService
    extends CompositeDisposable
    implements IKeyboardDockingService
{
    private _move: MoveState | null = null;
    private _preview: IDisposable | undefined;

    constructor(private readonly host: IAccessibilityHost) {
        super();

        // Capture phase, on the document — matches the navigation listener so
        // edge groups (outside the gridview) are covered.
        const doc = host.rootElement.ownerDocument;
        const onKeyDown = (e: KeyboardEvent): void => this._onKeyDown(e);
        doc.addEventListener('keydown', onKeyDown, true);

        this.addDisposables(
            { dispose: () => this._exit() },
            {
                dispose: () =>
                    doc.removeEventListener('keydown', onKeyDown, true),
            }
        );
    }

    private get _enabled(): boolean {
        return !!readKeyboardNavigation(this.host.options);
    }

    private get _keymap(): DockingKeybindings {
        // The public `keyboardNavigation.keymap` carries the default-navigation
        // bindings; this module's bindings are read from the same object when
        // present (so a consumer can rebind them too).
        const overrides = (readKeyboardNavigation(this.host.options)?.keymap ??
            {}) as Record<string, string>;
        return {
            focusGroupLeft:
                overrides.focusGroupLeft ?? DEFAULT_KEYMAP.focusGroupLeft,
            focusGroupRight:
                overrides.focusGroupRight ?? DEFAULT_KEYMAP.focusGroupRight,
            focusGroupUp: overrides.focusGroupUp ?? DEFAULT_KEYMAP.focusGroupUp,
            focusGroupDown:
                overrides.focusGroupDown ?? DEFAULT_KEYMAP.focusGroupDown,
            dock: overrides.dock ?? DEFAULT_KEYMAP.dock,
        };
    }

    private get _messages() {
        return resolveMessages(this.host.options.messages);
    }

    private _onKeyDown(e: KeyboardEvent): void {
        if (!this._enabled) {
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
        const keymap = this._keymap;
        if (matchesBinding(e, keymap.dock)) {
            this._enterMoveMode(e);
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

    // --- spatial focus ---

    private _focusGroupInDirection(
        direction: 'left' | 'right' | 'up' | 'down'
    ): void {
        const current = this.host.activeGroup;
        if (!current) {
            return;
        }
        // Geometry lives on the host as the shared `adjacentGroupInDirection`
        // primitive (also public on the api), so mouse and keyboard navigation
        // agree on what "the group to the left" is.
        this._focusGroup(
            this.host.adjacentGroupInDirection(current, direction)
        );
    }

    private _focusGroup(target: DockviewGroupPanel | undefined): void {
        if (!target) {
            return;
        }
        target.api.setActive();
        target.model.focusContent();
    }

    private _restoreFocus(): void {
        this.host.activeGroup?.model.focusContent();
    }

    // --- keyboard docking (move mode) ---

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
        // Signal the navigation module to stand down while the move runs.
        this.host.rootElement.setAttribute(KEYBOARD_MOVE_ATTRIBUTE, '');
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
        this.host.rootElement.removeAttribute(KEYBOARD_MOVE_ATTRIBUTE);
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

export const KeyboardDockingModule = defineModule<
    'keyboardDockingService',
    IAccessibilityHost
>({
    name: 'KeyboardDocking',
    serviceKey: 'keyboardDockingService',
    create: (host) => new KeyboardDockingService(host),
    dependsOn: [AdvancedDnDModule, LiveRegionModule],
});
