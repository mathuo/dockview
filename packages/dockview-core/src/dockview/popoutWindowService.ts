import { IDisposable } from '../lifecycle';
import { remove } from '../array';
import { Emitter, Event } from '../events';
import { PopupService } from './components/popupService';
import { PopoutWindow } from '../popoutWindow';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import {
    PopoutGroupChangeSizeEvent,
    PopoutGroupChangePositionEvent,
    SerializedPopoutGroup,
} from './dockviewComponent';
import { GroupPanelViewState } from './dockviewGroupPanelModel';
import { defineModule } from './modules';

export interface PopoutGroupEntry {
    window: PopoutWindow;
    popoutGroup: DockviewGroupPanel;
    referenceGroup?: string;
    disposable: { dispose: () => DockviewGroupPanel | undefined };
}

/**
 * Narrow callback surface the PopoutWindowService needs from its host.
 */
export interface IPopoutWindowHost {
    readonly isDisposed: boolean;
    fireLayoutChange(): void;
}

export interface IPopoutWindowService extends IDisposable {
    readonly entries: readonly PopoutGroupEntry[];

    add(entry: PopoutGroupEntry): void;
    remove(entry: PopoutGroupEntry): void;

    findByGroup(group: DockviewGroupPanel): PopoutGroupEntry | undefined;
    findReferenceGroupId(group: DockviewGroupPanel): string | undefined;

    getPopupService(groupId: string): PopupService | undefined;
    setPopupService(groupId: string, service: PopupService): void;
    deletePopupService(groupId: string): void;

    readonly restorationPromise: Promise<void>;
    scheduleRestoration(delayMs: number, work: () => void): Promise<void>;
    finishRestoration(promises: Promise<void>[]): void;
    cancelPendingRestorations(): void;

    readonly onDidPopoutGroupSizeChange: Event<PopoutGroupChangeSizeEvent>;
    readonly onDidPopoutGroupPositionChange: Event<PopoutGroupChangePositionEvent>;
    readonly onDidOpenPopoutWindowFail: Event<void>;
    fireDidSizeChange(event: PopoutGroupChangeSizeEvent): void;
    fireDidPositionChange(event: PopoutGroupChangePositionEvent): void;
    fireOpenWindowFail(): void;

    serialize(): SerializedPopoutGroup[];
    disposeAll(): void;
}

export class PopoutWindowService implements IPopoutWindowService {
    private readonly _host: IPopoutWindowHost;
    private readonly _entries: PopoutGroupEntry[] = [];
    private readonly _popupServices = new Map<string, PopupService>();
    private readonly _restorationCleanups = new Set<() => void>();
    private _restorationPromise: Promise<void> = Promise.resolve();

    private readonly _onDidPopoutGroupSizeChange =
        new Emitter<PopoutGroupChangeSizeEvent>();
    readonly onDidPopoutGroupSizeChange =
        this._onDidPopoutGroupSizeChange.event;

    private readonly _onDidPopoutGroupPositionChange =
        new Emitter<PopoutGroupChangePositionEvent>();
    readonly onDidPopoutGroupPositionChange =
        this._onDidPopoutGroupPositionChange.event;

    private readonly _onDidOpenPopoutWindowFail = new Emitter<void>();
    readonly onDidOpenPopoutWindowFail = this._onDidOpenPopoutWindowFail.event;

    private readonly _layoutChangeWiring: IDisposable;

    constructor(host: IPopoutWindowHost) {
        this._host = host;
        // Popout size/position changes persist as layout changes. Owning
        // this wiring inside the module keeps the component agnostic.
        this._layoutChangeWiring = Event.any<unknown>(
            this.onDidPopoutGroupSizeChange,
            this.onDidPopoutGroupPositionChange
        )(() => {
            host.fireLayoutChange();
        });
    }

    fireDidSizeChange(event: PopoutGroupChangeSizeEvent): void {
        this._onDidPopoutGroupSizeChange.fire(event);
    }

    fireDidPositionChange(event: PopoutGroupChangePositionEvent): void {
        this._onDidPopoutGroupPositionChange.fire(event);
    }

    fireOpenWindowFail(): void {
        this._onDidOpenPopoutWindowFail.fire();
    }

    get entries(): readonly PopoutGroupEntry[] {
        return this._entries;
    }

    get restorationPromise(): Promise<void> {
        return this._restorationPromise;
    }

    add(entry: PopoutGroupEntry): void {
        this._entries.push(entry);
    }

    remove(entry: PopoutGroupEntry): void {
        remove(this._entries, entry);
    }

    findByGroup(group: DockviewGroupPanel): PopoutGroupEntry | undefined {
        return this._entries.find((entry) => entry.popoutGroup === group);
    }

    findReferenceGroupId(group: DockviewGroupPanel): string | undefined {
        return this._entries.find((entry) => entry.popoutGroup === group)
            ?.referenceGroup;
    }

    getPopupService(groupId: string): PopupService | undefined {
        return this._popupServices.get(groupId);
    }

    setPopupService(groupId: string, service: PopupService): void {
        this._popupServices.set(groupId, service);
    }

    deletePopupService(groupId: string): void {
        this._popupServices.delete(groupId);
    }

    scheduleRestoration(delayMs: number, work: () => void): Promise<void> {
        return new Promise<void>((resolve) => {
            const cleanup = () => {
                this._restorationCleanups.delete(cleanup);
                clearTimeout(handle);
                resolve();
            };
            const handle = setTimeout(() => {
                this._restorationCleanups.delete(cleanup);
                // Guard against the component being disposed before this
                // timer fires. Under React StrictMode the component is
                // mounted -> disposed -> remounted, and without this guard
                // the first instance's queued restoration would open a
                // second popout window. See issue #851.
                if (this._host.isDisposed) {
                    resolve();
                    return;
                }
                work();
                resolve();
            }, delayMs);
            this._restorationCleanups.add(cleanup);
        });
    }

    finishRestoration(promises: Promise<void>[]): void {
        this._restorationPromise = Promise.all(promises).then(() => void 0);
    }

    cancelPendingRestorations(): void {
        for (const cleanup of [...this._restorationCleanups]) {
            cleanup();
        }
        this._restorationCleanups.clear();
    }

    serialize(): SerializedPopoutGroup[] {
        return this._entries.map((entry) => ({
            data: entry.popoutGroup.toJSON() as GroupPanelViewState,
            gridReferenceGroup: entry.referenceGroup,
            position: entry.window.dimensions(),
            url:
                entry.popoutGroup.api.location.type === 'popout'
                    ? entry.popoutGroup.api.location.popoutUrl
                    : undefined,
        }));
    }

    disposeAll(): void {
        for (const entry of [...this._entries]) {
            entry.disposable.dispose();
        }
    }

    dispose(): void {
        this.cancelPendingRestorations();
        this.disposeAll();
        this._layoutChangeWiring.dispose();
        this._onDidPopoutGroupSizeChange.dispose();
        this._onDidPopoutGroupPositionChange.dispose();
        this._onDidOpenPopoutWindowFail.dispose();
    }
}

export const PopoutWindowModule = defineModule<
    'popoutWindowService',
    IPopoutWindowHost
>({
    name: 'PopoutWindow',
    serviceKey: 'popoutWindowService',
    create: (host) => new PopoutWindowService(host),
});
