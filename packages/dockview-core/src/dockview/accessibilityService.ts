import { CompositeDisposable, IDisposable } from '../lifecycle';
import { addDisposableListener } from '../events';
import { Position } from '../dnd/droptarget';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { IDockviewPanel } from './dockviewPanel';
import { DockviewComponentOptions } from './options';
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
    readonly element: HTMLElement;
    readonly options: DockviewComponentOptions;
    readonly groups: DockviewGroupPanel[];
    readonly activePanel: IDockviewPanel | undefined;
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

/**
 * Pro accessibility module — operate the dock without a mouse. Keyboard
 * docking: `Ctrl+M` on the active panel arms a two-phase move with a live drop
 * preview + screen-reader narration:
 *   1. PICK TARGET — arrows cycle the groups (incl. the panel's own, so a tab
 *      can be split out); `Enter` selects one.
 *   2. PICK EDGE — arrows choose a split edge (left/right/top/bottom) or the
 *      centre (tab-into); `Enter` commits, `Escape` steps back.
 * `Escape` from the target phase cancels. Opt-in via `keyboardDocking`.
 *
 * Float / popout terminals, spatial F6 navigation and cross-window focus
 * management are later phases.
 */
export class AccessibilityService
    extends CompositeDisposable
    implements IAccessibilityService
{
    private _move: MoveState | null = null;
    private _preview: IDisposable | undefined;

    constructor(private readonly host: IAccessibilityHost) {
        super();

        this.addDisposables(
            { dispose: () => this._clearPreview() },
            // Capture phase so move-mode arrows take precedence over the
            // free tab-strip keyboard navigation (which lives on the tablist).
            addDisposableListener(
                host.element,
                'keydown',
                (e) => this._onKeyDown(e),
                true
            )
        );
    }

    private _onKeyDown(e: KeyboardEvent): void {
        if (!this.host.options.keyboardDocking) {
            return;
        }
        if (this._move) {
            this._onMoveKey(e);
            return;
        }
        // Ctrl+M only — NOT Cmd+M, which is the macOS "minimise window"
        // shortcut and is handled by the OS before the page can intercept it.
        if (e.ctrlKey && !e.metaKey && (e.key === 'm' || e.key === 'M')) {
            this._enterMoveMode(e);
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
        this.host.dockPanel(source, group, position);
        this.host.announce(
            `${this._label(source)} ${
                position === 'center'
                    ? `docked into ${name}`
                    : `split ${position} of ${name}`
            }.`
        );
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
