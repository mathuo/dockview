import {
    DockviewCompositeDisposable as CompositeDisposable,
    DockviewIDisposable as IDisposable,
} from 'dockview-core';
import { DockviewGroupPanel } from 'dockview-core';
import { defineModule } from 'dockview-core';
import { ITabGroupChipsHost, ITabGroupChipsService } from 'dockview-core';

export class TabGroupChipsService implements ITabGroupChipsService {
    private readonly _host: ITabGroupChipsHost;

    constructor(host: ITabGroupChipsHost) {
        this._host = host;
    }

    attachToGroup(group: DockviewGroupPanel): IDisposable {
        return new CompositeDisposable(
            group.model.onDidCreateTabGroup((e) => {
                this._host.fireDidCreateTabGroup(e);
            }),
            group.model.onDidDestroyTabGroup((e) => {
                this._host.fireDidDestroyTabGroup(e);
            }),
            group.model.onDidAddPanelToTabGroup((e) => {
                this._host.fireDidAddPanelToTabGroup(e);
            }),
            group.model.onDidRemovePanelFromTabGroup((e) => {
                this._host.fireDidRemovePanelFromTabGroup(e);
            }),
            group.model.onDidTabGroupChange((e) => {
                this._host.fireDidTabGroupChange(e);
            }),
            group.model.onDidTabGroupCollapsedChange((e) => {
                this._host.fireDidTabGroupCollapsedChange(e);
            })
        );
    }

    dispose(): void {
        // No internal state to tear down — emitters live on the host.
    }
}

export const TabGroupChipsModule = defineModule<
    'tabGroupChipsService',
    ITabGroupChipsHost
>({
    name: 'TabGroupChips',
    serviceKey: 'tabGroupChipsService',
    create: (host) => new TabGroupChipsService(host),
    init: (host, service) => {
        // Self-attach to existing and future groups; tear down when groups
        // are removed. Component doesn't need to know about this wiring.
        const perGroupDisposables = new Map<DockviewGroupPanel, IDisposable>();
        return new CompositeDisposable(
            host.onDidAddGroup((group) => {
                perGroupDisposables.set(group, service.attachToGroup(group));
            }),
            host.onDidRemoveGroup((group) => {
                perGroupDisposables.get(group)?.dispose();
                perGroupDisposables.delete(group);
            }),
            {
                dispose: () => {
                    for (const d of perGroupDisposables.values()) {
                        d.dispose();
                    }
                    perGroupDisposables.clear();
                },
            }
        );
    },
});
