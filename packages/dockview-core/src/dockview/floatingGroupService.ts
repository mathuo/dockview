import { CompositeDisposable, IDisposable } from '../lifecycle';
import { Overlay } from '../overlay/overlay';
import { DockviewFloatingGroupPanel } from './dockviewFloatingGroupPanel';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { DockviewOptions } from './options';
import { SerializedFloatingGroup } from './dockviewComponent';
import { GroupPanelViewState } from './dockviewGroupPanelModel';
import { remove } from '../array';
import { watchElementResize } from '../dom';
import { DEFAULT_FLOATING_GROUP_OVERFLOW_SIZE } from '../constants';

/**
 * Host interface that the FloatingGroupService needs from the component.
 * This keeps the service decoupled from the full DockviewComponent.
 */
export interface IFloatingGroupHost {
    /** Fire the buffered layout change event */
    fireLayoutChange(): void;
    /** Update the watermark state */
    updateWatermark(): void;
    /** Set the active group and panel */
    doSetGroupAndPanelActive(group: DockviewGroupPanel | undefined): void;
}

/**
 * Service interface for floating group management.
 *
 * Core code accesses this via `services.floatingGroupService?.method()`.
 * When the FloatingGroupModule is not registered, all floating group
 * functionality is unavailable.
 */
export interface IFloatingGroupService extends IDisposable {
    /** All active floating groups */
    readonly floatingGroups: DockviewFloatingGroupPanel[];

    /**
     * Register a group+overlay pair as a floating group.
     * Handles event wiring, disposable setup, and array management.
     */
    addFloatingGroup(
        group: DockviewGroupPanel,
        overlay: Overlay,
        options?: { inDragMode?: boolean; skipActiveGroup?: boolean }
    ): DockviewFloatingGroupPanel;

    /** Remove a floating group from tracking. Returns the found panel or undefined. */
    removeFloatingGroup(
        group: DockviewGroupPanel
    ): DockviewFloatingGroupPanel | undefined;

    /** Find the floating group panel for a given group */
    findFloatingGroup(
        group: DockviewGroupPanel
    ): DockviewFloatingGroupPanel | undefined;

    /** Toggle visibility of a floating group's overlay */
    setVisible(group: DockviewGroupPanel, visible: boolean): void;

    /** Update viewport bounds on all floating groups from changed options */
    updateBounds(options: Partial<DockviewOptions>): void;

    /** Re-constrain all floating groups within their viewport bounds */
    constrainBounds(): void;

    /** Serialize all floating groups to JSON */
    serialize(): SerializedFloatingGroup[];

    /** Dispose all floating groups (used during component teardown and error recovery) */
    disposeAll(): void;
}

/**
 * Manages floating group panels — the array of floating groups, their
 * lifecycle, event wiring, bounds, serialization, and disposal.
 */
export class FloatingGroupService implements IFloatingGroupService {
    private readonly _floatingGroups: DockviewFloatingGroupPanel[] = [];
    private readonly _host: IFloatingGroupHost;

    get floatingGroups(): DockviewFloatingGroupPanel[] {
        return this._floatingGroups;
    }

    constructor(host: IFloatingGroupHost) {
        this._host = host;
    }

    addFloatingGroup(
        group: DockviewGroupPanel,
        overlay: Overlay,
        options?: { inDragMode?: boolean; skipActiveGroup?: boolean }
    ): DockviewFloatingGroupPanel {
        overlay.setupDrag(
            group.element.querySelector('.dv-void-container') as HTMLElement,
            {
                inDragMode:
                    typeof options?.inDragMode === 'boolean'
                        ? options.inDragMode
                        : false,
            }
        );

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
            watchElementResize(group.element, (entry) => {
                const { width, height } = entry.contentRect;
                group.layout(width, height);
            })
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
        group.model.location = { type: 'floating' };

        if (!options?.skipActiveGroup) {
            this._host.doSetGroupAndPanelActive(group);
        }

        this._host.updateWatermark();

        return floatingGroupPanel;
    }

    removeFloatingGroup(
        group: DockviewGroupPanel
    ): DockviewFloatingGroupPanel | undefined {
        const floatingGroup = this._floatingGroups.find(
            (_) => _.group === group
        );
        if (floatingGroup) {
            remove(this._floatingGroups, floatingGroup);
            floatingGroup.dispose();
        }
        return floatingGroup;
    }

    findFloatingGroup(
        group: DockviewGroupPanel
    ): DockviewFloatingGroupPanel | undefined {
        return this._floatingGroups.find((_) => _.group === group);
    }

    setVisible(group: DockviewGroupPanel, visible: boolean): void {
        const item = this._floatingGroups.find(
            (floatingGroup) => floatingGroup.group === group
        );
        if (item) {
            item.overlay.setVisible(visible);
            group.api._onDidVisibilityChange.fire({ isVisible: visible });
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

    constrainBounds(): void {
        for (const floating of this._floatingGroups) {
            floating.overlay.setBounds();
        }
    }

    serialize(): SerializedFloatingGroup[] {
        return this._floatingGroups.map((group) => ({
            data: group.group.toJSON() as GroupPanelViewState,
            position: group.overlay.toJSON(),
        }));
    }

    disposeAll(): void {
        // iterate over a copy since .dispose() mutates the original array
        for (const group of [...this._floatingGroups]) {
            group.dispose();
        }
    }

    dispose(): void {
        this.disposeAll();
    }
}
