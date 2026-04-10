import { toggleClass } from '../../../dom';
import { addDisposableListener } from '../../../events';
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
import { TabGroupChip } from './tabGroupChip';
import { ITabGroupChipRenderer } from '../../framework';

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
        event: DragEvent
    ): void;
}

export class TabGroupManager {
    private readonly _chipRenderers = new Map<
        string,
        { chip: ITabGroupChipRenderer; disposable: IDisposable }
    >();
    private readonly _groupUnderlines = new Map<string, HTMLElement>();
    private _underlineRafId: number | null = null;
    private _skipNextCollapseAnimation = false;
    private readonly _pendingTransitionCleanups = new Map<string, () => void>();

    get chipRenderers(): ReadonlyMap<
        string,
        { chip: ITabGroupChipRenderer; disposable: IDisposable }
    > {
        return this._chipRenderers;
    }

    get groupUnderlines(): ReadonlyMap<string, HTMLElement> {
        return this._groupUnderlines;
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
        requestAnimationFrame(() => {
            this._positionUnderlinesSync();
        });
    }

    /**
     * Continuously reposition underlines every frame for the duration
     * of a tab transition (~200ms), so the underline tracks tab sizes.
     */
    trackUnderlines(): void {
        if (this._underlineRafId !== null) {
            cancelAnimationFrame(this._underlineRafId);
        }

        const start = performance.now();
        const duration = 250; // slightly longer than transition to ensure we catch the end

        const tick = () => {
            this._positionUnderlinesSync();
            if (performance.now() - start < duration) {
                this._underlineRafId = requestAnimationFrame(tick);
            } else {
                this._underlineRafId = null;
            }
        };

        this._underlineRafId = requestAnimationFrame(tick);
    }

    setGroupDragImage(
        event: DragEvent,
        tabGroup: ITabGroup,
        chipEl: HTMLElement
    ): void {
        if (!event.dataTransfer) {
            return;
        }

        const groupPanelIds = new Set(tabGroup.panelIds);
        const underlineEl = this._groupUnderlines.get(tabGroup.id);

        // Clone the entire tabs list so cloned nodes inherit all
        // theme styles, CSS variables and class-based rules.
        const clone = this._ctx.tabsList.cloneNode(true) as HTMLElement;
        clone.style.height = `${this._ctx.tabsList.offsetHeight}px`;
        clone.style.width = 'auto';
        clone.style.overflow = 'visible';
        clone.style.pointerEvents = 'none';

        // Remove elements not belonging to this group.
        // Keep: chip, group tabs, group underline.
        // Walk backwards so removals don't shift indices.
        const children = Array.from(clone.children);
        const realChildren = Array.from(this._ctx.tabsList.children);
        for (let i = children.length - 1; i >= 0; i--) {
            const real = realChildren[i];
            if (!real) {
                children[i].remove();
                continue;
            }
            if (real === chipEl || real === underlineEl) {
                continue; // keep the chip and underline
            }
            if (real.classList.contains('dv-tab')) {
                const tabEntry = this._ctx
                    .getTabs()
                    .find((t) => t.value.element === real);
                if (tabEntry && groupPanelIds.has(tabEntry.value.panel.id)) {
                    continue; // keep
                }
            }
            children[i].remove();
        }

        // Re-position the underline clone as a simple bottom line for the drag ghost
        const underlineClone = clone.querySelector('.dv-tab-group-underline');
        if (underlineClone instanceof HTMLElement) {
            underlineClone.innerHTML = '';
            underlineClone.style.left = '0px';
            underlineClone.style.width = '100%';
            underlineClone.style.top = 'auto';
            underlineClone.style.bottom = '0';
            underlineClone.style.height = '2px';
            underlineClone.style.backgroundColor = `var(--dv-tab-group-color-${tabGroup.color})`;
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
        if (this._underlineRafId !== null) {
            cancelAnimationFrame(this._underlineRafId);
            this._underlineRafId = null;
        }

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

        for (const [, el] of this._groupUnderlines) {
            el.remove();
        }
        this._groupUnderlines.clear();
    }

    private _ensureChipForGroup(tabGroup: ITabGroup): void {
        if (this._chipRenderers.has(tabGroup.id)) {
            return;
        }

        const createChip =
            this._ctx.accessor.options.createTabGroupChipComponent;
        const chip: ITabGroupChipRenderer = createChip
            ? createChip(tabGroup)
            : new TabGroupChip();

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
            disposables.push(
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
            }
        }

        // Track active group IDs for underline cleanup
        const activeGroupIds = new Set<string>();

        // Handle collapse animation + underline per group
        for (const tg of tabGroups) {
            activeGroupIds.add(tg.id);

            // Ensure underline element exists
            let underline = this._groupUnderlines.get(tg.id);
            if (!underline) {
                underline = document.createElement('div');
                underline.className = 'dv-tab-group-underline';
                this._ctx.tabsList.appendChild(underline);
                this._groupUnderlines.set(tg.id, underline);
            }

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

        // Remove underlines for dissolved groups
        for (const [groupId, el] of this._groupUnderlines) {
            if (!activeGroupIds.has(groupId)) {
                el.remove();
                this._groupUnderlines.delete(groupId);
            }
        }

        this._skipNextCollapseAnimation = false;

        // Position underlines: use rAF loop during animations for fluid tracking
        if (hasAnimation) {
            this.trackUnderlines();
        } else {
            this.positionUnderlines();
        }
    }

    private _positionUnderlinesSync(): void {
        const containerRect = this._ctx.tabsList.getBoundingClientRect();
        const tabGroups = this._ctx.group.model.getTabGroups();
        const isVertical = this._ctx.getDirection() === 'vertical';
        const containerCrossSize = isVertical
            ? containerRect.width
            : containerRect.height;
        const activePanelId = this._ctx.group.activePanel?.id;
        const tabMap = this._ctx.getTabMap();

        for (const tg of tabGroups) {
            const underline = this._groupUnderlines.get(tg.id);
            if (!underline) {
                continue;
            }

            const panelIds = tg.panelIds;
            if (panelIds.length === 0) {
                underline.style.display = 'none';
                continue;
            }

            underline.style.display = '';

            const chipEntry = this._chipRenderers.get(tg.id);
            const chipEl = chipEntry?.chip.element;

            // In vertical mode, compute top/bottom edges; in horizontal, left/right.
            let startEdge: number;
            if (chipEl) {
                const chipRect = chipEl.getBoundingClientRect();
                const chipStyle = getComputedStyle(chipEl);
                const leadingMargin = isVertical
                    ? Number.parseFloat(chipStyle.marginTop) || 0
                    : Number.parseFloat(chipStyle.marginLeft) || 0;
                startEdge = isVertical
                    ? chipRect.top - containerRect.top - leadingMargin
                    : chipRect.left - containerRect.left - leadingMargin;
            } else {
                const firstPanelId = panelIds[0];
                const firstTabEntry = tabMap.get(firstPanelId);
                if (firstTabEntry) {
                    const firstRect =
                        firstTabEntry.value.element.getBoundingClientRect();
                    startEdge = isVertical
                        ? firstRect.top - containerRect.top
                        : firstRect.left - containerRect.left;
                } else {
                    startEdge = 0;
                }
            }

            // Measure the actual last tab position (follows CSS transitions in real-time)
            const lastPanelId = panelIds[panelIds.length - 1];
            const lastTabEntry = tabMap.get(lastPanelId);

            if (!lastTabEntry) {
                if (isVertical) {
                    underline.style.top = `${startEdge}px`;
                    underline.style.height = '0px';
                    underline.style.left = '';
                    underline.style.width = '';
                } else {
                    underline.style.left = `${startEdge}px`;
                    underline.style.width = '0px';
                    underline.style.top = '';
                    underline.style.height = '';
                }
                continue;
            }

            const lastTabRect =
                lastTabEntry.value.element.getBoundingClientRect();
            let endEdge = isVertical
                ? lastTabRect.bottom - containerRect.top
                : lastTabRect.right - containerRect.left;
            let span = endEdge - startEdge;

            // During collapse or expand: converge both edges toward chip center
            const isAnimating =
                tg.collapsed ||
                tg.panelIds.some((pid) => {
                    const te = tabMap.get(pid);
                    return (
                        te &&
                        te.value.element.classList.contains(
                            'dv-tab--group-expanding'
                        )
                    );
                });

            if (isAnimating && chipEl) {
                const chipRect = chipEl.getBoundingClientRect();
                const chipCenter = isVertical
                    ? chipRect.top + chipRect.height / 2 - containerRect.top
                    : chipRect.left + chipRect.width / 2 - containerRect.left;

                // Sum of current visible tab sizes (shrinking or growing)
                let currentTabSize = 0;
                let fullTabSize = 0;
                for (const pid of tg.panelIds) {
                    const te = tabMap.get(pid);
                    if (!te) continue;
                    const el = te.value.element;
                    if (isVertical) {
                        currentTabSize += el.getBoundingClientRect().height;
                        fullTabSize += el.scrollHeight;
                    } else {
                        currentTabSize += el.getBoundingClientRect().width;
                        fullTabSize += el.scrollWidth;
                    }
                }

                // progress: 0 when tabs at 0 size, 1 when fully open
                const progress =
                    fullTabSize > 0
                        ? Math.min(1, currentTabSize / fullTabSize)
                        : 0;

                // Interpolate start and end edges toward chip center
                startEdge = chipCenter + (startEdge - chipCenter) * progress;
                endEdge = chipCenter + (endEdge - chipCenter) * progress;
                span = Math.max(0, endEdge - startEdge);
            }

            if (isVertical) {
                underline.style.top = `${startEdge}px`;
                underline.style.height = `${Math.max(0, span)}px`;
                // Clear horizontal properties
                underline.style.left = '';
                underline.style.width = '';
            } else {
                underline.style.left = `${startEdge}px`;
                underline.style.width = `${Math.max(0, span)}px`;
                // Clear vertical properties
                underline.style.top = '';
                underline.style.height = '';
            }

            // Chrome-style wrap-around: contour the active tab if it belongs to this group
            this._applyUnderlineShape(
                underline,
                tg,
                startEdge,
                span,
                containerCrossSize,
                activePanelId,
                containerRect,
                isVertical
            );
        }
    }

    /**
     * Chrome-style wrap-around underline: a stroked SVG path that runs
     * along the bottom (or left edge in vertical mode), curving up and
     * over the active tab with rounded corners.
     *
     * The SVG and path elements are created once per underline and reused;
     * only the `d`, `stroke`, and viewport attributes are updated each frame.
     */
    private _applyUnderlineShape(
        underline: HTMLElement,
        tg: ITabGroup,
        groupStart: number,
        groupSpan: number,
        containerCrossSize: number,
        activePanelId: string | undefined,
        containerRect: DOMRect,
        isVertical: boolean
    ): void {
        const t = 2; // line thickness in px
        const crossSize = containerCrossSize;
        const mainSize = groupSpan;
        const color = `var(--dv-tab-group-color-${tg.color})`;

        if (mainSize <= 0 || crossSize <= 0) {
            underline.style.display = 'none';
            return;
        }
        underline.style.display = '';

        // Find the active tab within this group
        let activeTabEntry: IValueDisposable<Tab> | undefined;
        if (activePanelId && tg.panelIds.includes(activePanelId)) {
            activeTabEntry = this._ctx.getTabMap().get(activePanelId);
        }

        // Ensure SVG + path child exists (created once, reused)
        let svg = underline.firstElementChild as SVGSVGElement | null;
        let path: SVGPathElement;
        if (!svg || svg.tagName !== 'svg') {
            underline.innerHTML = '';
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.style.display = 'block';
            path = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path'
            );
            path.setAttribute('fill', 'none');
            svg.appendChild(path);
            underline.appendChild(svg);
        } else {
            path = svg.firstElementChild as SVGPathElement;
        }

        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', String(t));

        if (!activeTabEntry) {
            // No active tab: straight line along the edge
            if (isVertical) {
                svg.setAttribute('width', String(t));
                svg.setAttribute('height', String(mainSize));
                underline.style.width = `${t}px`;
                underline.style.height = `${mainSize}px`;
                path.setAttribute('d', `M ${t / 2},0 L ${t / 2},${mainSize}`);
            } else {
                svg.setAttribute('width', String(mainSize));
                svg.setAttribute('height', String(t));
                underline.style.width = `${mainSize}px`;
                underline.style.height = `${t}px`;
                path.setAttribute('d', `M 0,${t / 2} L ${mainSize},${t / 2}`);
            }
            return;
        }

        const activeRect = activeTabEntry.value.element.getBoundingClientRect();

        // Compute active tab start/end relative to the group start
        let aStart: number;
        let aEnd: number;
        if (isVertical) {
            aStart = Math.max(
                0,
                activeRect.top - containerRect.top - groupStart
            );
            aEnd = Math.min(
                mainSize,
                activeRect.bottom - containerRect.top - groupStart
            );
        } else {
            aStart = Math.max(
                0,
                activeRect.left - containerRect.left - groupStart
            );
            aEnd = Math.min(
                mainSize,
                activeRect.right - containerRect.left - groupStart
            );
        }

        if (aEnd <= aStart) {
            if (isVertical) {
                svg.setAttribute('width', String(t));
                svg.setAttribute('height', String(mainSize));
                underline.style.width = `${t}px`;
                underline.style.height = `${mainSize}px`;
                path.setAttribute('d', `M ${t / 2},0 L ${t / 2},${mainSize}`);
            } else {
                svg.setAttribute('width', String(mainSize));
                svg.setAttribute('height', String(t));
                underline.style.width = `${mainSize}px`;
                underline.style.height = `${t}px`;
                path.setAttribute('d', `M 0,${t / 2} L ${mainSize},${t / 2}`);
            }
            return;
        }

        const r = 6; // corner radius
        const half = t / 2;

        if (isVertical) {
            const svgW = crossSize;
            const svgH = mainSize;
            svg.setAttribute('width', String(svgW));
            svg.setAttribute('height', String(svgH));
            underline.style.width = `${svgW}px`;
            underline.style.height = `${svgH}px`;

            const xLeft = half;
            const xRight = svgW - half;

            const d = [
                `M ${xLeft},0`,
                `L ${xLeft},${aStart - r}`,
                `Q ${xLeft},${aStart} ${xLeft + r},${aStart}`,
                `L ${xRight - r},${aStart}`,
                `Q ${xRight},${aStart} ${xRight},${aStart + r}`,
                `L ${xRight},${aEnd - r}`,
                `Q ${xRight},${aEnd} ${xRight - r},${aEnd}`,
                `L ${xLeft + r},${aEnd}`,
                `Q ${xLeft},${aEnd} ${xLeft},${aEnd + r}`,
                `L ${xLeft},${svgH}`,
            ].join(' ');

            path.setAttribute('d', d);
        } else {
            const svgW = mainSize;
            const svgH = crossSize;
            svg.setAttribute('width', String(svgW));
            svg.setAttribute('height', String(svgH));
            underline.style.width = `${svgW}px`;
            underline.style.height = `${svgH}px`;

            const yBot = svgH - half;
            const yTop = half;

            const d = [
                `M 0,${yBot}`,
                `L ${aStart - r},${yBot}`,
                `Q ${aStart},${yBot} ${aStart},${yBot - r}`,
                `L ${aStart},${yTop + r}`,
                `Q ${aStart},${yTop} ${aStart + r},${yTop}`,
                `L ${aEnd - r},${yTop}`,
                `Q ${aEnd},${yTop} ${aEnd},${yTop + r}`,
                `L ${aEnd},${yBot - r}`,
                `Q ${aEnd},${yBot} ${aEnd + r},${yBot}`,
                `L ${svgW},${yBot}`,
            ].join(' ');

            path.setAttribute('d', d);
        }
    }
}
