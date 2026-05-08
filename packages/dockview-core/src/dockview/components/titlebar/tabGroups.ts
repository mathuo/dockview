import { toggleClass } from '../../../dom';
import { addDisposableListener } from '../../../events';
import { PointerDragSource } from '../../../dnd/pointer/pointerDragSource';
import { LongPressDetector } from '../../../dnd/pointer/longPress';
import { PointerGhost } from '../../../dnd/pointer/pointerGhost';
import {
    CompositeDisposable,
    IDisposable,
    IValueDisposable,
} from '../../../lifecycle';
import { DockviewComponent } from '../../dockviewComponent';
import { DockviewGroupPanel } from '../../dockviewGroupPanel';
import { DockviewHeaderDirection } from '../../options';
import { Tab } from '../tab/tab';
import { ITabGroup } from '../../tabGroup';
import { applyTabGroupAccent } from '../../tabGroupAccent';
import { TabGroupChip } from './tabGroupChip';
import { ITabGroupChipRenderer } from '../../framework';
import {
    ITabGroupIndicator,
    NoneTabGroupIndicator,
    WrapTabGroupIndicator,
} from './tabGroupIndicator';

const EMPTY_MAP: ReadonlyMap<string, HTMLElement> = new Map();

export interface TabGroupManagerContext {
    readonly group: DockviewGroupPanel;
    readonly accessor: DockviewComponent;
    readonly tabsList: HTMLElement;
    getTabs(): IValueDisposable<Tab>[];
    getTabMap(): Map<string, IValueDisposable<Tab>>;
    getDirection(): DockviewHeaderDirection;
}

export interface TabGroupManagerCallbacks {
    onChipContextMenu(tabGroup: ITabGroup, event: MouseEvent): void;
    onChipDragStart(
        tabGroup: ITabGroup,
        chip: ITabGroupChipRenderer,
        event: DragEvent | PointerEvent
    ): void;
}

export class TabGroupManager {
    private readonly _chipRenderers = new Map<
        string,
        { chip: ITabGroupChipRenderer; disposable: IDisposable }
    >();
    private _indicator: ITabGroupIndicator | null = null;
    private _skipNextCollapseAnimation = false;
    private readonly _pendingTransitionCleanups = new Map<string, () => void>();

    get chipRenderers(): ReadonlyMap<
        string,
        { chip: ITabGroupChipRenderer; disposable: IDisposable }
    > {
        return this._chipRenderers;
    }

    get groupUnderlines(): ReadonlyMap<string, HTMLElement> {
        return this._indicator?.underlines ?? EMPTY_MAP;
    }

    get skipNextCollapseAnimation(): boolean {
        return this._skipNextCollapseAnimation;
    }

    set skipNextCollapseAnimation(value: boolean) {
        this._skipNextCollapseAnimation = value;
    }

    constructor(
        private readonly _ctx: TabGroupManagerContext,
        private readonly _callbacks: TabGroupManagerCallbacks
    ) {}

    /**
     * Synchronize chip elements and CSS classes for all tab groups
     * in the parent group model. Call after any tab group mutation.
     */
    update(): void {
        const model = this._ctx.group.model;
        const tabGroups = model.getTabGroups();

        // Track which group IDs are still active
        const activeGroupIds = new Set<string>();

        for (const tabGroup of tabGroups) {
            activeGroupIds.add(tabGroup.id);
            this._ensureChipForGroup(tabGroup);
            this._positionChipForGroup(tabGroup);
        }

        // Remove chips for dissolved/destroyed groups
        for (const [groupId, entry] of this._chipRenderers) {
            if (!activeGroupIds.has(groupId)) {
                entry.chip.element.remove();
                entry.chip.dispose();
                entry.disposable.dispose();
                this._chipRenderers.delete(groupId);
            }
        }

        // Update CSS classes on all tabs
        this._updateTabGroupClasses();
    }

    /**
     * Re-read the active palette and re-apply colors to chips, tabs and
     * the indicator. Called when `tabGroupColors` / `tabGroupAccent`
     * options change at runtime.
     */
    refreshAccents(): void {
        for (const tabGroup of this._ctx.group.model.getTabGroups()) {
            const entry = this._chipRenderers.get(tabGroup.id);
            entry?.chip.update?.({ tabGroup });
        }
        this._updateTabGroupClasses();
    }

    positionAllChips(): void {
        if (this._chipRenderers.size === 0) {
            return;
        }
        for (const tabGroup of this._ctx.group.model.getTabGroups()) {
            this._positionChipForGroup(tabGroup);
        }
    }

    snapshotChipWidths(): Map<string, number> {
        const widths = new Map<string, number>();
        for (const [groupId, entry] of this._chipRenderers) {
            widths.set(
                groupId,
                entry.chip.element.getBoundingClientRect().width
            );
        }
        return widths;
    }

    positionUnderlines(): void {
        this._indicator?.positionUnderlines();
    }

    trackUnderlines(): void {
        this._indicator?.trackUnderlines();
    }

    setGroupDragImage(
        event: DragEvent,
        tabGroup: ITabGroup,
        chipEl: HTMLElement
    ): void {
        if (!event.dataTransfer) {
            return;
        }

        const isVertical = this._ctx.getDirection() === 'vertical';

        // Clone the entire tabs list so cloned nodes inherit all
        // theme styles, CSS variables and class-based rules.
        const clone = this._ctx.tabsList.cloneNode(true) as HTMLElement;

        if (isVertical) {
            // Force horizontal orientation for the drag ghost by
            // removing vertical CSS classes and overriding writing-mode.
            clone.classList.remove('dv-tabs-container-vertical', 'dv-vertical');
            clone.classList.add('dv-horizontal');
            clone.style.writingMode = 'horizontal-tb';
            clone.style.height = `${this._ctx.tabsList.offsetWidth}px`;
        } else {
            clone.style.height = `${this._ctx.tabsList.offsetHeight}px`;
        }
        clone.style.width = 'auto';
        clone.style.overflow = 'visible';
        clone.style.pointerEvents = 'none';

        // Remove all elements except the chip so the drag ghost
        // shows only the chip regardless of the group's expanded state.
        const children = Array.from(clone.children);
        const realChildren = Array.from(this._ctx.tabsList.children);
        for (let i = children.length - 1; i >= 0; i--) {
            const real = realChildren[i];
            if (real === chipEl) {
                continue; // keep the chip only
            }
            children[i].remove();
        }

        // Wrap the clone in a minimal ancestor chain so that CSS
        // selectors like `.dv-groupview.dv-active-group > .dv-tabs-and-actions-container .dv-tabs-container > .dv-tab`
        // match the cloned tabs and apply correct color/background.
        const wrapper = document.createElement('div');
        wrapper.className = 'dv-groupview dv-active-group';
        wrapper.style.position = 'fixed';
        wrapper.style.top = '-10000px';
        wrapper.style.left = '0px';
        wrapper.style.height = 'auto';
        wrapper.style.width = 'auto';
        wrapper.style.pointerEvents = 'none';

        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'dv-tabs-and-actions-container';
        actionsWrapper.style.height = 'auto';
        actionsWrapper.style.width = 'auto';
        wrapper.appendChild(actionsWrapper);
        actionsWrapper.appendChild(clone);

        // Append inside the dockview root so CSS variables are inherited
        this._ctx.accessor.element.appendChild(wrapper);

        // Compute cursor offset relative to the wrapper element.
        // The cloned chip is the first .dv-tab-group-chip in the clone.
        const clonedChip = clone.querySelector('.dv-tab-group-chip');
        const chipRect = chipEl.getBoundingClientRect();
        const cursorInChipX = event.clientX - chipRect.left;
        const cursorInChipY = event.clientY - chipRect.top;

        if (clonedChip) {
            const clonedChipRect = clonedChip.getBoundingClientRect();
            const wrapperRect = wrapper.getBoundingClientRect();
            const offsetX =
                clonedChipRect.left - wrapperRect.left + cursorInChipX;
            const offsetY =
                clonedChipRect.top - wrapperRect.top + cursorInChipY;
            event.dataTransfer.setDragImage(wrapper, offsetX, offsetY);
        } else {
            event.dataTransfer.setDragImage(
                wrapper,
                cursorInChipX,
                cursorInChipY
            );
        }

        // Clean up after the browser captures the image
        requestAnimationFrame(() => {
            wrapper.remove();
        });
    }

    cleanupTransition(panelId: string): void {
        this._pendingTransitionCleanups.get(panelId)?.();
        this._pendingTransitionCleanups.delete(panelId);
    }

    disposeAll(): void {
        this._indicator?.dispose();
        this._indicator = null;

        for (const [, cleanup] of this._pendingTransitionCleanups) {
            cleanup();
        }
        this._pendingTransitionCleanups.clear();

        for (const [, entry] of this._chipRenderers) {
            entry.chip.element.remove();
            entry.chip.dispose();
            entry.disposable.dispose();
        }
        this._chipRenderers.clear();
    }

    private _ensureIndicator(): void {
        const mode =
            this._ctx.accessor.options.theme?.tabGroupIndicator ?? 'wrap';

        const Ctor =
            mode === 'none' ? NoneTabGroupIndicator : WrapTabGroupIndicator;

        // Re-create if the indicator type changed (e.g. theme switch)
        if (this._indicator && !(this._indicator instanceof Ctor)) {
            this._indicator.dispose();
            this._indicator = null;
        }

        if (!this._indicator) {
            this._indicator = new Ctor({
                tabsList: this._ctx.tabsList,
                getTabGroups: () => this._ctx.group.model.getTabGroups(),
                getActivePanelId: () => this._ctx.group.activePanel?.id,
                getTabMap: () => this._ctx.getTabMap(),
                getChipElement: (id) =>
                    this._chipRenderers.get(id)?.chip.element,
                getDirection: () => this._ctx.getDirection(),
                getColorPalette: () => this._ctx.accessor.tabGroupColorPalette,
            });
        }
    }

    private _ensureChipForGroup(tabGroup: ITabGroup): void {
        if (this._chipRenderers.has(tabGroup.id)) {
            return;
        }

        const createChip =
            this._ctx.accessor.options.createTabGroupChipComponent;
        const chip: ITabGroupChipRenderer = createChip
            ? createChip(tabGroup)
            : new TabGroupChip(this._ctx.accessor.tabGroupColorPalette);

        chip.init({ tabGroup, api: this._ctx.accessor.api });

        const disposables: IDisposable[] = [
            tabGroup.onDidChange(() => {
                chip.update?.({ tabGroup });
                this._updateTabGroupClasses();
            }),
            tabGroup.onDidPanelChange(() => {
                this._positionChipForGroup(tabGroup);
                this._updateTabGroupClasses();
            }),
            tabGroup.onDidCollapseChange(() => {
                this._updateTabGroupClasses();
            }),
        ];

        // Wire chip context menu and drag for all chip renderers
        if (chip instanceof TabGroupChip) {
            disposables.push(
                chip.onContextMenu((event) => {
                    this._callbacks.onChipContextMenu(tabGroup, event);
                }),
                chip.onDragStart((event) => {
                    this._callbacks.onChipDragStart(tabGroup, chip, event);
                })
            );
        } else {
            // Custom chip renderers don't expose dockview's PointerDragSource,
            // so we attach one to the rendered element here. This gives
            // touch users the same drag affordance the built-in TabGroupChip
            // gets.
            const customPointerSource = new PointerDragSource(chip.element, {
                getData: () => ({
                    // The transfer payload is set by the consumer's
                    // onChipDragStart callback (in tabs.ts:
                    // _handleChipDragStart). We just produce the event.
                    dispose: () => {
                        /* noop */
                    },
                }),
                createGhost: (event) => {
                    const style = getComputedStyle(chip.element);
                    const clone = chip.element.cloneNode(true) as HTMLElement;
                    Array.from(style).forEach((key) => {
                        clone.style.setProperty(
                            key,
                            style.getPropertyValue(key),
                            style.getPropertyPriority(key)
                        );
                    });
                    clone.style.position = 'absolute';
                    return new PointerGhost({
                        element: clone,
                        initialX: event.clientX,
                        initialY: event.clientY,
                        offsetX: 8,
                        offsetY: 8,
                        owner: chip.element,
                    });
                },
                onDragStart: (event) => {
                    this._callbacks.onChipDragStart(tabGroup, chip, event);
                },
            });
            const customLongPress = new LongPressDetector(chip.element, {
                onLongPress: (event) => {
                    customPointerSource.cancelPending();
                    this._callbacks.onChipContextMenu(tabGroup, event);
                },
            });
            disposables.push(
                customPointerSource,
                customLongPress,
                addDisposableListener(chip.element, 'contextmenu', (event) => {
                    this._callbacks.onChipContextMenu(tabGroup, event);
                }),
                addDisposableListener(chip.element, 'dragstart', (event) => {
                    this._callbacks.onChipDragStart(tabGroup, chip, event);
                })
            );
        }

        const disposable = new CompositeDisposable(...disposables);
        this._chipRenderers.set(tabGroup.id, { chip, disposable });

        // Group is born collapsed (cross-group drop, layout restore, etc.):
        // its tabs are about to be added without the collapsed class. Skip
        // the animation in the upcoming _updateTabGroupClasses call so they
        // apply the class instantly instead of transitioning from expanded.
        if (tabGroup.collapsed) {
            this._skipNextCollapseAnimation = true;
        }
    }

    private _positionChipForGroup(tabGroup: ITabGroup): void {
        const entry = this._chipRenderers.get(tabGroup.id);
        if (!entry) {
            return;
        }

        const chipEl = entry.chip.element;
        const panelIds = tabGroup.panelIds;

        if (panelIds.length === 0) {
            chipEl.remove();
            return;
        }

        // Find the first tab element of this group
        const firstPanelId = panelIds[0];
        const firstTabEntry = this._ctx.getTabMap().get(firstPanelId);

        if (!firstTabEntry) {
            chipEl.remove();
            return;
        }

        // Insert chip before the first tab of the group
        const firstTabEl = firstTabEntry.value.element;
        if (chipEl.nextSibling !== firstTabEl) {
            this._ctx.tabsList.insertBefore(chipEl, firstTabEl);
        }
    }

    private _updateTabGroupClasses(): void {
        const model = this._ctx.group.model;
        const tabGroups = model.getTabGroups();
        const tabs = this._ctx.getTabs();
        const tabMap = this._ctx.getTabMap();
        let hasAnimation = false;

        // Build a lookup: panelId → tabGroup
        const panelGroupMap = new Map<string, ITabGroup>();
        for (const tg of tabGroups) {
            for (const pid of tg.panelIds) {
                panelGroupMap.set(pid, tg);
            }
        }

        for (const tabEntry of tabs) {
            const tab = tabEntry.value;
            const panelId = tab.panel.id;
            const tg = panelGroupMap.get(panelId);

            const isGrouped = !!tg;
            toggleClass(tab.element, 'dv-tab--grouped', isGrouped);

            if (tg) {
                const ids = tg.panelIds;
                const isFirst = ids[0] === panelId;
                const isLast = ids[ids.length - 1] === panelId;

                toggleClass(tab.element, 'dv-tab--group-first', isFirst);
                toggleClass(tab.element, 'dv-tab--group-last', isLast);

                // Expose the resolved group color as a CSS custom property
                // so pure-CSS themes can use it for borders, backgrounds, etc.
                applyTabGroupAccent(
                    tab.element,
                    tg.color,
                    this._ctx.accessor.tabGroupColorPalette
                );

                // Collapse / expand with animation
                const isCollapsed = tab.element.classList.contains(
                    'dv-tab--group-collapsed'
                );
                if (!tg.collapsed && isCollapsed) {
                    // Collapsed → expanding: animate back
                    hasAnimation = true;
                    tab.element.classList.remove('dv-tab--group-collapsed');
                    tab.element.classList.add('dv-tab--group-expanding');

                    // Clean up any previous transitionend listener
                    // from a rapid collapse/expand cycle
                    this._pendingTransitionCleanups.get(panelId)?.();

                    const onEnd = () => {
                        tab.element.classList.remove('dv-tab--group-expanding');
                        tab.element.style.removeProperty('width');
                        tab.element.removeEventListener('transitionend', onEnd);
                        clearTimeout(fallbackTimer);
                        this._pendingTransitionCleanups.delete(panelId);
                    };
                    // Fallback in case transitionend never fires
                    // (e.g. element removed from DOM mid-transition)
                    const fallbackTimer = setTimeout(onEnd, 300);
                    this._pendingTransitionCleanups.set(panelId, onEnd);
                    tab.element.addEventListener('transitionend', onEnd);
                }
            } else {
                toggleClass(tab.element, 'dv-tab--group-first', false);
                toggleClass(tab.element, 'dv-tab--group-last', false);
                tab.element.classList.remove(
                    'dv-tab--group-collapsed',
                    'dv-tab--group-expanding'
                );
                tab.element.style.removeProperty('width');
                tab.element.style.removeProperty('--dv-tab-group-color');
            }
        }

        // Track active group IDs for underline/collapse handling
        const activeGroupIds = new Set<string>();

        // Handle collapse animation per group
        for (const tg of tabGroups) {
            activeGroupIds.add(tg.id);

            // Collapse animation
            const hasNewCollapse =
                tg.collapsed &&
                tg.panelIds.some((pid) => {
                    const te = tabMap.get(pid);
                    return (
                        te &&
                        !te.value.element.classList.contains(
                            'dv-tab--group-collapsed'
                        )
                    );
                });

            if (hasNewCollapse) {
                if (this._skipNextCollapseAnimation) {
                    // Apply collapsed state instantly (no animation).
                    // Disable transitions so the CSS transition on
                    // dv-tab--group-collapsed doesn't fire.
                    const affected: HTMLElement[] = [];
                    for (const pid of tg.panelIds) {
                        const te = tabMap.get(pid);
                        if (te) {
                            te.value.element.style.transition = 'none';
                            te.value.element.classList.add(
                                'dv-tab--group-collapsed'
                            );
                            affected.push(te.value.element);
                        }
                    }
                    if (affected.length > 0) {
                        void affected[0].offsetHeight; // single reflow
                        for (const el of affected) {
                            el.style.removeProperty('transition');
                        }
                    }
                } else {
                    hasAnimation = true;
                    const isVert = this._ctx.getDirection() === 'vertical';
                    for (const pid of tg.panelIds) {
                        const te = tabMap.get(pid);
                        if (
                            te &&
                            !te.value.element.classList.contains(
                                'dv-tab--group-collapsed'
                            )
                        ) {
                            const rect =
                                te.value.element.getBoundingClientRect();
                            if (isVert) {
                                te.value.element.style.height = `${rect.height}px`;
                            } else {
                                te.value.element.style.width = `${rect.width}px`;
                            }
                            void te.value.element.offsetHeight; // force reflow
                            te.value.element.classList.add(
                                'dv-tab--group-collapsed'
                            );
                        }
                    }
                }
            }
        }

        this._skipNextCollapseAnimation = false;

        // Sync indicator underlines and position them
        this._ensureIndicator();
        if (this._indicator) {
            this._indicator.syncUnderlineElements(activeGroupIds);
            if (hasAnimation) {
                this._indicator.trackUnderlines();
            } else {
                this._indicator.positionUnderlines();
            }
        }
    }
}
