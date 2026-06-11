/**
 * Contracts (service + host interfaces) for the pluggable feature modules whose
 * *implementations* are candidates to live outside core. Core references only
 * these interfaces — never a module's implementation — so a module's code can
 * be relocated without touching core. Keep this file implementation-free.
 */
import { IDisposable } from '../lifecycle';
import { Event } from '../events';
import { Position } from '../dnd/droptarget';
import { DockviewApi } from '../api/component.api';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { IDockviewPanel } from './dockviewPanel';
import { ITabGroup } from './tabGroup';
import { TabGroupColorPalette } from './tabGroupAccent';
import { PopupService } from './components/popupService';
import { DockviewComponentOptions } from './options';
import { DockviewLayoutMutationEvent } from './dockviewComponent';
import {
    DockviewTabGroupChangeEvent,
    DockviewTabGroupPanelChangeEvent,
    DockviewTabGroupCollapsedChangeEvent,
} from './events';

// --- ContextMenu ---

export interface IContextMenuHost {
    readonly options: DockviewComponentOptions;
    readonly api: DockviewApi;
    readonly tabGroupColorPalette: TabGroupColorPalette;
    getPopupServiceForGroup(group: DockviewGroupPanel): PopupService;
}

export interface IContextMenuService {
    show(
        panel: IDockviewPanel,
        group: DockviewGroupPanel,
        event: MouseEvent
    ): void;
    showForChip(
        tabGroup: ITabGroup,
        group: DockviewGroupPanel,
        event: MouseEvent
    ): void;
}

// --- TabGroupChips ---

export interface ITabGroupChipsHost {
    readonly onDidAddGroup: Event<DockviewGroupPanel>;
    readonly onDidRemoveGroup: Event<DockviewGroupPanel>;

    fireDidCreateTabGroup(event: DockviewTabGroupChangeEvent): void;
    fireDidDestroyTabGroup(event: DockviewTabGroupChangeEvent): void;
    fireDidAddPanelToTabGroup(event: DockviewTabGroupPanelChangeEvent): void;
    fireDidRemovePanelFromTabGroup(
        event: DockviewTabGroupPanelChangeEvent
    ): void;
    fireDidTabGroupChange(event: DockviewTabGroupChangeEvent): void;
    fireDidTabGroupCollapsedChange(
        event: DockviewTabGroupCollapsedChangeEvent
    ): void;
}

export interface ITabGroupChipsService extends IDisposable {
    /**
     * Subscribe to the per-group tab-group events on the given group and
     * re-fire them on the host's component-level emitters. Returns a
     * disposable that detaches the subscriptions; intended to be bundled
     * into the per-group CompositeDisposable so cleanup happens when the
     * group is removed.
     */
    attachToGroup(group: DockviewGroupPanel): IDisposable;
}

// --- Accessibility ---

export interface IAccessibilityHost {
    /**
     * The outermost dockview element (the shell, which also contains edge
     * groups). A getter — it must resolve to the shell once that exists, not
     * the inner gridview, or keydowns from edge groups are missed.
     */
    readonly rootElement: HTMLElement;
    readonly options: DockviewComponentOptions;
    readonly groups: DockviewGroupPanel[];
    readonly activeGroup: DockviewGroupPanel | undefined;
    readonly activePanel: IDockviewPanel | undefined;
    /**
     * The next / previous group in gridview (spatial) order, wrapping round —
     * the one piece of navigation that needs the grid internals. All other
     * focus logic lives in the service, using the public group API.
     */
    adjacentGroup(
        group: DockviewGroupPanel,
        reverse: boolean
    ): DockviewGroupPanel | undefined;
    /** Fires before / after a structural layout change — used to restore focus on close. */
    readonly onWillMutateLayout: Event<DockviewLayoutMutationEvent>;
    readonly onDidMutateLayout: Event<DockviewLayoutMutationEvent>;
    showDropPreview(group: DockviewGroupPanel, position: Position): IDisposable;
    announce(message: string): void;
    dockPanel(
        panel: IDockviewPanel,
        group: DockviewGroupPanel,
        position: Position
    ): void;
}

export interface IAccessibilityService extends IDisposable {}
