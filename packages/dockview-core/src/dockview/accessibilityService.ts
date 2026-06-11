import { CompositeDisposable, IDisposable } from '../lifecycle';
import { Position } from '../dnd/droptarget';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { IDockviewPanel } from './dockviewPanel';
import {
    DockviewComponentOptions,
    DockviewKeybindings,
    KeyboardNavigationOptions,
} from './options';
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
    readonly activePanel: IDockviewPanel | undefined;
    /** Activate the next tab in the focused group (wraps round). */
    focusNextPanel(): void;
    /** Activate the previous tab in the focused group (wraps round). */
    focusPreviousPanel(): void;
    /** Move focus to the next group (wraps round). */
    focusNextGroup(): void;
    /** Move focus to the previous group (wraps round). */
    focusPreviousGroup(): void;
    /** Return DOM focus to the active group's content (keeps it inside the dock). */
    focusActiveContent(): void;
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
 * - **Focus group** (`F6` / `Shift+F6`) — move focus between groups.
 * - **Keyboard docking** (`Ctrl+M`) — arms a two-phase move of the active
 *   panel with a live drop preview + screen-reader narration:
 *     1. PICK TARGET — arrows cycle the groups (incl. the panel's own, so a tab
 *        can be split out); `Enter` selects one.
 *     2. PICK EDGE — arrows choose a split edge (left/right/top/bottom) or the
 *        centre (tab-into); `Enter` commits, `Escape` steps back.
 *   `Escape` from the target phase cancels.
 *
 * Spatial (directional) group focus, float / popout terminals and cross-window
 * focus management are later phases.
 */
export class AccessibilityService
    extends CompositeDisposable
    implements IAccessibilityService
{
    private _move: MoveState | null = null;
    private _preview: IDisposable | undefined;

    constructor(private readonly host: IAccessibilityHost) {
        super();

        // Listen on the document (capture) rather than the dockview element:
        // edge groups live in the shell *outside* the gridview, and the shell
        // is created after this service, so a fixed element would miss them.
        // Capture also lets move-mode keys beat the free tab-strip navigation.
        const doc = host.rootElement.ownerDocument;
        const onKeyDown = (e: KeyboardEvent): void => this._onKeyDown(e);
        doc.addEventListener('keydown', onKeyDown, true);

        this.addDisposables(
            { dispose: () => this._clearPreview() },
            {
                dispose: () =>
                    doc.removeEventListener('keydown', onKeyDown, true),
            }
        );
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
        const keymap = this._keymap;
        if (matchesBinding(e, keymap.dock)) {
            this._enterMoveMode(e);
        } else if (matchesBinding(e, keymap.nextTab)) {
            this._consume(e);
            this.host.focusNextPanel();
        } else if (matchesBinding(e, keymap.prevTab)) {
            this._consume(e);
            this.host.focusPreviousPanel();
        } else if (matchesBinding(e, keymap.focusNextGroup)) {
            this._consume(e);
            this.host.focusNextGroup();
        } else if (matchesBinding(e, keymap.focusPrevGroup)) {
            this._consume(e);
            this.host.focusPreviousGroup();
        }
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
                this.host.announce('Move cancelled.');
                this.host.focusActiveContent();
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
        if (move.phase === 'target') {
            this.host.announce(
                `Moving ${this._label(move.source)}. Target ${name}, ${
                    move.groupIndex + 1
                } of ${move.groups.length}. Enter to choose where, Escape to cancel.`
            );
        } else {
            this.host.announce(
                `${this._describe(move.position)} ${name}. Arrows to change, Enter to confirm, Escape to go back.`
            );
        }
    }

    private _commit(): void {
        const move = this._move!;
        const group = move.groups[move.groupIndex];
        const position = move.position;
        const source = move.source;
        const name = group.activePanel?.title ?? group.id;
        this._exit();
        try {
            this.host.dockPanel(source, group, position);
            this.host.announce(
                `${this._label(source)} ${
                    position === 'center'
                        ? `docked into ${name}`
                        : `split ${position} of ${name}`
                }.`
            );
        } catch {
            this.host.announce('That move is not allowed.');
        }
        // The move re-renders the grid; pull focus back into the dock so the
        // keymap keeps working without a click.
        this.host.focusActiveContent();
    }

    private _describe(position: Position): string {
        return position === 'center' ? 'Tab into' : `Split ${position} of`;
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
