import { IDisposable } from '../lifecycle';
import { remove } from '../array';
import { PopupService } from './components/popupService';
import { PopoutWindow } from '../popoutWindow';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { SerializedPopoutGroup } from './dockviewComponent';
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
    scheduleRestoration(
        delayMs: number,
        work: () => void,
        onCancel?: () => void
    ): Promise<void>;
    finishRestoration(promises: Promise<void>[]): void;
    cancelPendingRestorations(): void;

    serialize(): SerializedPopoutGroup[];
    disposeAll(): void;
}

export class PopoutWindowService implements IPopoutWindowService {
    private readonly _host: IPopoutWindowHost;
    private readonly _entries: PopoutGroupEntry[] = [];
    private readonly _popupServices = new Map<string, PopupService>();
    private readonly _restorationCleanups = new Set<() => void>();
    private _restorationPromise: Promise<void> = Promise.resolve();

    constructor(host: IPopoutWindowHost) {
        this._host = host;
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

    scheduleRestoration(
        delayMs: number,
        work: () => void,
        onCancel?: () => void
    ): Promise<void> {
        return new Promise<void>((resolve) => {
            const cleanup = () => {
                this._restorationCleanups.delete(cleanup);
                clearTimeout(handle);
                onCancel?.();
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
