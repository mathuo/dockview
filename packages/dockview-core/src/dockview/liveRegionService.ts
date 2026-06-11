import { CompositeDisposable, IDisposable } from '../lifecycle';
import { Event } from '../events';
import { IDockviewPanel } from './dockviewPanel';
import {
    DockviewLayoutMutationEvent,
    DockviewLayoutMutationKind,
} from './dockviewComponent';
import { DockviewComponentOptions } from './options';
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
}

export interface ILiveRegionService extends IDisposable {
    /**
     * Announce a message to assistive technology via the live region. The
     * shared sink — the pro accessibility module writes keyboard-docking
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
 * the shared `announce()` sink (the pro module narrates docking here too).
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
            host.onDidAddPanel((panel) => this._announcePanel(panel, 'open')),
            host.onDidRemovePanel((panel) =>
                this._announcePanel(panel, 'close')
            ),
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
            })
        );
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

    private _announcePanel(
        panel: IDockviewPanel,
        kind: 'open' | 'close'
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
        kind: 'open' | 'close'
    ): string {
        return `${panel.title ?? panel.id} ${kind === 'open' ? 'opened' : 'closed'}`;
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
