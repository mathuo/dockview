import { CompositeDisposable, IDisposable } from '../lifecycle';
import { remove } from '../array';
import { watchElementResize } from '../dom';
import { Overlay } from '../overlay/overlay';
import { DEFAULT_FLOATING_GROUP_OVERFLOW_SIZE } from '../constants';
import { DockviewFloatingGroupPanel } from './dockviewFloatingGroupPanel';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { DockviewOptions } from './options';
import { SerializedFloatingGroup } from './dockviewComponent';
import { GroupPanelViewState } from './dockviewGroupPanelModel';
import { defineModule } from './modules';

/**
 * Narrow callback surface the FloatingGroupService needs from its host
 * component. Keeps the service decoupled from DockviewComponent.
 */
export interface IFloatingGroupHost {
    fireLayoutChange(): void;
    updateWatermark(): void;
}

export interface IFloatingGroupService extends IDisposable {
    readonly floatingGroups: readonly DockviewFloatingGroupPanel[];

    add(
        group: DockviewGroupPanel,
        overlay: Overlay
    ): DockviewFloatingGroupPanel;

    findByGroup(
        group: DockviewGroupPanel
    ): DockviewFloatingGroupPanel | undefined;

    serialize(): SerializedFloatingGroup[];

    constrainBounds(): void;

    updateBounds(options: Partial<DockviewOptions>): void;

    disposeAll(): void;
}

export class FloatingGroupService implements IFloatingGroupService {
    private readonly _host: IFloatingGroupHost;
    private readonly _floatingGroups: DockviewFloatingGroupPanel[] = [];

    get floatingGroups(): readonly DockviewFloatingGroupPanel[] {
        return this._floatingGroups;
    }

    constructor(host: IFloatingGroupHost) {
        this._host = host;
    }

    add(
        group: DockviewGroupPanel,
        overlay: Overlay
    ): DockviewFloatingGroupPanel {
        const floatingGroupPanel = new DockviewFloatingGroupPanel(
            group,
            overlay
        );

        const disposable = new CompositeDisposable(
            group.api.onDidActiveChange((event) => {
                if (event.isActive) {
                    overlay.bringToFront();
                }
            }),
            (() => {
                let lastWidth = -1;
                let lastHeight = -1;
                return watchElementResize(group.element, (entry) => {
                    const width = Math.round(entry.contentRect.width);
                    const height = Math.round(entry.contentRect.height);
                    if (width === lastWidth && height === lastHeight) {
                        return;
                    }
                    lastWidth = width;
                    lastHeight = height;
                    group.layout(width, height);
                });
            })()
        );

        floatingGroupPanel.addDisposables(
            overlay.onDidChange(() => {
                group.layout(group.width, group.height);
            }),
            overlay.onDidChangeEnd(() => {
                this._host.fireLayoutChange();
            }),
            group.onDidChange((event) => {
                overlay.setBounds({
                    height: event?.height,
                    width: event?.width,
                });
            }),
            {
                dispose: () => {
                    disposable.dispose();
                    remove(this._floatingGroups, floatingGroupPanel);
                    group.model.location = { type: 'grid' };
                    this._host.updateWatermark();
                },
            }
        );

        this._floatingGroups.push(floatingGroupPanel);
        return floatingGroupPanel;
    }

    findByGroup(
        group: DockviewGroupPanel
    ): DockviewFloatingGroupPanel | undefined {
        return this._floatingGroups.find((floating) => floating.group === group);
    }

    serialize(): SerializedFloatingGroup[] {
        return this._floatingGroups.map((group) => ({
            data: group.group.toJSON() as GroupPanelViewState,
            position: group.overlay.toJSON(),
        }));
    }

    constrainBounds(): void {
        for (const floating of this._floatingGroups) {
            floating.overlay.setBounds();
        }
    }

    updateBounds(options: Partial<DockviewOptions>): void {
        if (!('floatingGroupBounds' in options)) {
            return;
        }
        for (const group of this._floatingGroups) {
            switch (options.floatingGroupBounds) {
                case 'boundedWithinViewport':
                    group.overlay.minimumInViewportHeight = undefined;
                    group.overlay.minimumInViewportWidth = undefined;
                    break;
                case undefined:
                    group.overlay.minimumInViewportHeight =
                        DEFAULT_FLOATING_GROUP_OVERFLOW_SIZE;
                    group.overlay.minimumInViewportWidth =
                        DEFAULT_FLOATING_GROUP_OVERFLOW_SIZE;
                    break;
                default:
                    group.overlay.minimumInViewportHeight =
                        options.floatingGroupBounds?.minimumHeightWithinViewport;
                    group.overlay.minimumInViewportWidth =
                        options.floatingGroupBounds?.minimumWidthWithinViewport;
            }
            group.overlay.setBounds();
        }
    }

    disposeAll(): void {
        for (const floating of [...this._floatingGroups]) {
            floating.dispose();
        }
    }

    dispose(): void {
        this.disposeAll();
    }
}

export const FloatingGroupModule = defineModule<
    'floatingGroupService',
    IFloatingGroupHost
>({
    name: 'FloatingGroup',
    serviceKey: 'floatingGroupService',
    create: (host) => new FloatingGroupService(host),
});
