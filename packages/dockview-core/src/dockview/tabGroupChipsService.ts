import { CompositeDisposable, IDisposable } from '../lifecycle';
import { Emitter, Event } from '../events';
import {
    DockviewTabGroupChangeEvent,
    DockviewTabGroupPanelChangeEvent,
    DockviewTabGroupCollapsedChangeEvent,
} from './events';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { defineModule } from './modules';

export interface ITabGroupChipsHost {
    fireLayoutChange(): void;
    readonly onDidAddGroup: Event<DockviewGroupPanel>;
    readonly onDidRemoveGroup: Event<DockviewGroupPanel>;
}

export interface ITabGroupChipsService extends IDisposable {
    readonly onDidCreateTabGroup: Event<DockviewTabGroupChangeEvent>;
    readonly onDidDestroyTabGroup: Event<DockviewTabGroupChangeEvent>;
    readonly onDidAddPanelToTabGroup: Event<DockviewTabGroupPanelChangeEvent>;
    readonly onDidRemovePanelFromTabGroup: Event<DockviewTabGroupPanelChangeEvent>;
    readonly onDidTabGroupChange: Event<DockviewTabGroupChangeEvent>;
    readonly onDidTabGroupCollapsedChange: Event<DockviewTabGroupCollapsedChangeEvent>;

    /**
     * Subscribe to the per-group tab-group events on the given group and
     * re-fire them on the service's component-level emitters. Returns a
     * disposable that detaches the subscriptions; intended to be bundled
     * into the per-group CompositeDisposable so cleanup happens when the
     * group is removed.
     */
    attachToGroup(group: DockviewGroupPanel): IDisposable;
}

export class TabGroupChipsService implements ITabGroupChipsService {
    private readonly _layoutChangeWiring: IDisposable;

    private readonly _onDidCreateTabGroup =
        new Emitter<DockviewTabGroupChangeEvent>();
    readonly onDidCreateTabGroup = this._onDidCreateTabGroup.event;

    private readonly _onDidDestroyTabGroup =
        new Emitter<DockviewTabGroupChangeEvent>();
    readonly onDidDestroyTabGroup = this._onDidDestroyTabGroup.event;

    private readonly _onDidAddPanelToTabGroup =
        new Emitter<DockviewTabGroupPanelChangeEvent>();
    readonly onDidAddPanelToTabGroup = this._onDidAddPanelToTabGroup.event;

    private readonly _onDidRemovePanelFromTabGroup =
        new Emitter<DockviewTabGroupPanelChangeEvent>();
    readonly onDidRemovePanelFromTabGroup =
        this._onDidRemovePanelFromTabGroup.event;

    private readonly _onDidTabGroupChange =
        new Emitter<DockviewTabGroupChangeEvent>();
    readonly onDidTabGroupChange = this._onDidTabGroupChange.event;

    private readonly _onDidTabGroupCollapsedChange =
        new Emitter<DockviewTabGroupCollapsedChangeEvent>();
    readonly onDidTabGroupCollapsedChange =
        this._onDidTabGroupCollapsedChange.event;

    constructor(host: ITabGroupChipsHost) {
        // Any tab-group mutation persists as a layout change. Owning this
        // wiring inside the module keeps the component agnostic about which
        // module's events should trigger layout-change.
        this._layoutChangeWiring = Event.any<unknown>(
            this.onDidCreateTabGroup,
            this.onDidDestroyTabGroup,
            this.onDidAddPanelToTabGroup,
            this.onDidRemovePanelFromTabGroup,
            this.onDidTabGroupChange,
            this.onDidTabGroupCollapsedChange
        )(() => {
            host.fireLayoutChange();
        });
    }

    attachToGroup(group: DockviewGroupPanel): IDisposable {
        return new CompositeDisposable(
            group.model.onDidCreateTabGroup((e) => {
                this._onDidCreateTabGroup.fire(e);
            }),
            group.model.onDidDestroyTabGroup((e) => {
                this._onDidDestroyTabGroup.fire(e);
            }),
            group.model.onDidAddPanelToTabGroup((e) => {
                this._onDidAddPanelToTabGroup.fire(e);
            }),
            group.model.onDidRemovePanelFromTabGroup((e) => {
                this._onDidRemovePanelFromTabGroup.fire(e);
            }),
            group.model.onDidTabGroupChange((e) => {
                this._onDidTabGroupChange.fire(e);
            }),
            group.model.onDidTabGroupCollapsedChange((e) => {
                this._onDidTabGroupCollapsedChange.fire(e);
            })
        );
    }

    dispose(): void {
        this._layoutChangeWiring.dispose();
        this._onDidCreateTabGroup.dispose();
        this._onDidDestroyTabGroup.dispose();
        this._onDidAddPanelToTabGroup.dispose();
        this._onDidRemovePanelFromTabGroup.dispose();
        this._onDidTabGroupChange.dispose();
        this._onDidTabGroupCollapsedChange.dispose();
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
