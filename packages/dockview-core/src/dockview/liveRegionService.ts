import { CompositeDisposable, IDisposable } from '../lifecycle';
import { Event } from '../events';
import { IDockviewPanel } from './dockviewPanel';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import {
    DockviewLayoutMutationEvent,
    DockviewLayoutMutationKind,
    DockviewMaximizedGroupChanged,
} from './dockviewComponent';
import { DockviewComponentOptions, LiveRegionEvent } from './options';
import { resolveMessages } from './accessibilityMessages';
import { defineModule } from './modules';

/**
 * The narrow surface the {@link LiveRegionService} needs from the host
 * (the `DockviewComponent`) — somewhere to mount the region and the layout
 * events to narrate. `onWill/onDidMutateLayout` are used to suppress the
 * bulk-load / clear burst (one transaction, not N panel announcements).
 */
export interface ILiveRegionHost {
    readonly element: HTMLElement;
    readonly options: DockviewComponentOptions;
    readonly onDidAddPanel: Event<IDockviewPanel>;
    readonly onDidRemovePanel: Event<IDockviewPanel>;
    readonly onWillMutateLayout: Event<DockviewLayoutMutationEvent>;
    readonly onDidMutateLayout: Event<DockviewLayoutMutationEvent>;
    readonly onDidMaximizedGroupChange: Event<DockviewMaximizedGroupChanged>;
    readonly onDidAddGroup: Event<DockviewGroupPanel>;
    readonly onDidRemoveGroup: Event<DockviewGroupPanel>;
}

export interface ILiveRegionService extends IDisposable {
    /**
     * Announce a message to assistive technology via the live region. The
     * shared sink — the accessibility module writes keyboard-docking
     * narration here too, so all announcements use one region.
     */
    announce(message: string, politeness?: 'polite' | 'assertive'): void;
}

/** Bulk transactions whose per-panel events should not each be announced. */
const isBulk = (kind: DockviewLayoutMutationKind): boolean =>
    kind === 'load' || kind === 'clear';

function createLiveRegion(politeness: 'polite' | 'assertive'): HTMLElement {
    const el = document.createElement('div');
    el.className =
        politeness === 'assertive'
            ? 'dv-live-region-assertive'
            : 'dv-live-region';
    // assertive interrupts the SR (errors / cancellations); polite waits for a
    // pause (routine status). `alert` implies assertive, `status` implies polite.
    el.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status');
    el.setAttribute('aria-live', politeness);
    el.setAttribute('aria-atomic', 'true');
    // Visually hidden but kept in the accessibility tree (never display:none /
    // visibility:hidden, which would drop it from AT). Standard clip pattern.
    Object.assign(el.style, {
        position: 'absolute',
        width: '1px',
        height: '1px',
        margin: '-1px',
        padding: '0',
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        clipPath: 'inset(50%)',
        whiteSpace: 'nowrap',
        border: '0',
    });
    return el;
}

/**
 * Narrates layout state changes to screen readers via visually-hidden
 * `aria-live` regions. Free / core (WCAG 4.1.3). Announces panel open/close +
 * the shared `announce()` sink (the accessibility module narrates docking here too).
 * Two regions: a **polite** one for routine status and an **assertive** one
 * for errors/cancellations. The bulk load/clear burst is suppressed via the
 * mutation-transaction events, and an app can take over delivery entirely with
 * the `announcer` option.
 */
export class LiveRegionService
    extends CompositeDisposable
    implements ILiveRegionService
{
    private readonly _host: ILiveRegionHost;
    private readonly _polite: HTMLElement;
    private readonly _assertive: HTMLElement;
    private _suppressDepth = 0;
    private readonly _locationSubs = new Map<string, IDisposable>();

    constructor(host: ILiveRegionHost) {
        super();

        this._host = host;
        this._polite = createLiveRegion('polite');
        this._assertive = createLiveRegion('assertive');
        host.element.appendChild(this._polite);
        host.element.appendChild(this._assertive);

        this.addDisposables(
            { dispose: () => this._polite.remove() },
            { dispose: () => this._assertive.remove() },
            host.onDidAddPanel((panel) => this._announce(panel, 'open')),
            host.onDidRemovePanel((panel) => this._announce(panel, 'close')),
            // Bracket bulk transactions so a fromJSON / clear doesn't announce
            // every nested add/remove.
            host.onWillMutateLayout((e) => {
                if (isBulk(e.kind)) {
                    this._suppressDepth++;
                }
            }),
            host.onDidMutateLayout((e) => {
                if (isBulk(e.kind)) {
                    this._suppressDepth = Math.max(0, this._suppressDepth - 1);
                }
            }),
            host.onDidMaximizedGroupChange((e) => {
                const panel = e.group.activePanel;
                if (panel) {
                    this._announce(
                        panel,
                        e.isMaximized ? 'maximize' : 'restore'
                    );
                }
            }),
            // Narrate a group floating / docking back / popping out. A group is
            // born in the grid then transitions, so track each group's previous
            // location and ignore the no-op initial `-> grid`.
            host.onDidAddGroup((group) => this._trackLocation(group)),
            host.onDidRemoveGroup((group) => {
                this._locationSubs.get(group.id)?.dispose();
                this._locationSubs.delete(group.id);
            }),
            {
                dispose: () => {
                    this._locationSubs.forEach((sub) => sub.dispose());
                    this._locationSubs.clear();
                },
            }
        );
    }

    private _trackLocation(group: DockviewGroupPanel): void {
        let prev = group.api.location.type;
        const sub = group.api.onDidLocationChange((e) => {
            const next = e.location.type;
            if (next === prev) {
                return;
            }
            prev = next;
            const panel = group.activePanel;
            if (!panel) {
                return;
            }
            const kind =
                next === 'floating'
                    ? 'float'
                    : next === 'popout'
                      ? 'popout'
                      : 'dock';
            this._announce(panel, kind);
        });
        this._locationSubs.set(group.id, sub);
    }

    announce(
        message: string,
        politeness: 'polite' | 'assertive' = 'polite'
    ): void {
        // Opt-out (read live so `updateOptions({ announcements })` applies).
        if (
            this._host.options.announcements === false ||
            this._suppressDepth > 0 ||
            !message
        ) {
            return;
        }
        // Apps can route announcements into their own SR system instead of the
        // built-in regions (e.g. a shared app-wide live region).
        const announcer = this._host.options.announcer;
        if (announcer) {
            announcer({ message, politeness });
            return;
        }
        // Clearing first forces SRs to re-announce an identical message.
        const region =
            politeness === 'assertive' ? this._assertive : this._polite;
        region.textContent = '';
        region.textContent = message;
    }

    private _announce(
        panel: IDockviewPanel,
        kind: LiveRegionEvent['kind']
    ): void {
        // The app may localise/override the message, suppress it (null / ''),
        // or fall through to the default (undefined).
        const custom = this._host.options.getAnnouncement?.({ kind, panel });
        if (custom === null || custom === '') {
            return;
        }
        this.announce(custom ?? this._defaultMessage(panel, kind));
    }

    private _defaultMessage(
        panel: IDockviewPanel,
        kind: LiveRegionEvent['kind']
    ): string {
        const m = resolveMessages(this._host.options.messages);
        const name = panel.title ?? panel.id;
        switch (kind) {
            case 'open':
                return m.panelOpened(name);
            case 'close':
                return m.panelClosed(name);
            case 'maximize':
                return m.groupMaximized(name);
            case 'restore':
                return m.groupRestored(name);
            case 'float':
                return m.groupFloated(name);
            case 'dock':
                return m.groupDocked(name);
            case 'popout':
                return m.groupPoppedOut(name);
        }
    }
}

export const LiveRegionModule = defineModule<
    'liveRegionService',
    ILiveRegionHost
>({
    name: 'LiveRegion',
    serviceKey: 'liveRegionService',
    create: (host) => new LiveRegionService(host),
});
