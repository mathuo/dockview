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

interface MoveState {
    readonly source: IDockviewPanel;
    readonly targets: DockviewGroupPanel[];
    index: number;
}

/**
 * Pro accessibility module — operate the dock without a mouse. This first
 * vertical: keyboard docking by tab-into. `Ctrl/Cmd+M` on the active panel
 * enters move mode; arrows cycle the target group (live preview + narration);
 * `Enter` docks it into the target; `Escape` cancels. Opt-in via the
 * `keyboardDocking` option.
 *
 * Splits (edge targets), float / popout terminals, spatial F6 navigation and
 * cross-window focus management are later phases.
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
        if ((e.ctrlKey || e.metaKey) && (e.key === 'm' || e.key === 'M')) {
            this._enterMoveMode(e);
        }
    }

    private _enterMoveMode(e: KeyboardEvent): void {
        const source = this.host.activePanel;
        if (!source) {
            return;
        }
        const targets = this.host.groups.filter((g) => g !== source.group);
        if (targets.length === 0) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        this._move = { source, targets, index: 0 };
        this._showTarget();
    }

    private _onMoveKey(e: KeyboardEvent): void {
        const move = this._move!;
        const count = move.targets.length;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                this._consume(e);
                move.index = (move.index + 1) % count;
                this._showTarget();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                this._consume(e);
                move.index = (move.index - 1 + count) % count;
                this._showTarget();
                break;
            case 'Enter': {
                this._consume(e);
                const target = move.targets[move.index];
                const source = move.source;
                this._exit();
                this.host.dockPanel(source, target, 'center');
                this.host.announce(`${this._label(source)} docked.`);
                break;
            }
            case 'Escape':
                this._consume(e);
                this._exit();
                this.host.announce('Move cancelled.');
                break;
        }
    }

    private _showTarget(): void {
        const move = this._move!;
        const target = move.targets[move.index];
        this._clearPreview();
        this._preview = this.host.showDropPreview(target, 'center');
        const name = target.activePanel?.title ?? target.id;
        this.host.announce(
            `Moving ${this._label(move.source)}. Target ${name}, ${
                move.index + 1
            } of ${move.targets.length}. Enter to dock, Escape to cancel.`
        );
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
