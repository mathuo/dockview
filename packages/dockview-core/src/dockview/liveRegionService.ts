import { CompositeDisposable, IDisposable } from '../lifecycle';
import { Event } from '../events';
import { IDockviewPanel } from './dockviewPanel';
import {
    DockviewLayoutMutationEvent,
    DockviewLayoutMutationKind,
} from './dockviewComponent';
import { defineModule } from './modules';

/**
 * The narrow surface the {@link LiveRegionService} needs from the host
 * (the `DockviewComponent`) — somewhere to mount the region and the layout
 * events to narrate. `onWill/onDidMutateLayout` are used to suppress the
 * bulk-load / clear burst (one transaction, not N panel announcements).
 */
export interface ILiveRegionHost {
    readonly element: HTMLElement;
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

function createLiveRegion(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'dv-live-region';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
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
 * Narrates layout state changes to screen readers via a visually-hidden
 * `aria-live` region. Free / core (WCAG 4.1.3). Phase 1: open / close
 * announcements + the `announce()` sink; the bulk load/clear burst is
 * suppressed via the mutation-transaction events.
 */
export class LiveRegionService
    extends CompositeDisposable
    implements ILiveRegionService
{
    private readonly _region: HTMLElement;
    private _suppressDepth = 0;

    constructor(host: ILiveRegionHost) {
        super();

        this._region = createLiveRegion();
        host.element.appendChild(this._region);

        this.addDisposables(
            { dispose: () => this._region.remove() },
            host.onDidAddPanel((panel) => this._announcePanel(panel, 'opened')),
            host.onDidRemovePanel((panel) =>
                this._announcePanel(panel, 'closed')
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
        _politeness: 'polite' | 'assertive' = 'polite'
    ): void {
        if (this._suppressDepth > 0 || !message) {
            return;
        }
        // Clearing first forces SRs to re-announce an identical message.
        this._region.textContent = '';
        this._region.textContent = message;
    }

    private _announcePanel(panel: IDockviewPanel, verb: string): void {
        this.announce(`${panel.title ?? panel.id} ${verb}`);
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
