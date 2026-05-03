import { IValueDisposable } from '../../../lifecycle';
import { DockviewHeaderDirection, DockviewHeaderPosition } from '../../options';
import { Tab } from '../tab/tab';
import { ITabGroup } from '../../tabGroup';
import {
    resolveTabGroupAccent,
    TabGroupColorPalette,
} from '../../tabGroupAccent';

export interface TabGroupIndicatorContext {
    readonly tabsList: HTMLElement;
    getTabGroups(): readonly ITabGroup[];
    getActivePanelId(): string | undefined;
    getTabMap(): Map<string, IValueDisposable<Tab>>;
    getChipElement(groupId: string): HTMLElement | undefined;
    getDirection(): DockviewHeaderDirection;
    getHeaderPosition(): DockviewHeaderPosition;
    getColorPalette(): TabGroupColorPalette | undefined;
}

export interface ITabGroupIndicator {
    readonly underlines: ReadonlyMap<string, HTMLElement>;
    positionUnderlines(): void;
    trackUnderlines(): void;
    syncUnderlineElements(activeGroupIds: Set<string>): void;
    getUnderline(groupId: string): HTMLElement | undefined;
    dispose(): void;
}

/**
 * Shared positioning logic for tab group indicators.
 * Subclasses implement `applyShape` to control the visual output.
 */
abstract class BaseTabGroupIndicator implements ITabGroupIndicator {
    protected readonly _underlines = new Map<string, HTMLElement>();
    private _rafId: number | null = null;

    get underlines(): ReadonlyMap<string, HTMLElement> {
        return this._underlines;
    }

    constructor(protected readonly _ctx: TabGroupIndicatorContext) {}

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
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
        }

        const start = performance.now();
        const duration = 250; // slightly longer than transition to ensure we catch the end

        const tick = () => {
            this._positionUnderlinesSync();
            if (performance.now() - start < duration) {
                this._rafId = requestAnimationFrame(tick);
            } else {
                this._rafId = null;
            }
        };

        this._rafId = requestAnimationFrame(tick);
    }

    syncUnderlineElements(activeGroupIds: Set<string>): void {
        // Ensure underline elements exist for active groups
        for (const groupId of activeGroupIds) {
            if (!this._underlines.has(groupId)) {
                const underline = document.createElement('div');
                underline.className = 'dv-tab-group-underline';
                this._ctx.tabsList.appendChild(underline);
                this._underlines.set(groupId, underline);
            }
        }

        // Remove underlines for dissolved groups
        for (const [groupId, el] of this._underlines) {
            if (!activeGroupIds.has(groupId)) {
                el.remove();
                this._underlines.delete(groupId);
            }
        }
    }

    getUnderline(groupId: string): HTMLElement | undefined {
        return this._underlines.get(groupId);
    }

    dispose(): void {
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }

        for (const [, el] of this._underlines) {
            el.remove();
        }
        this._underlines.clear();
    }

    /**
     * Apply the visual shape to the underline element.
     * Called once per tab group per frame with the computed geometry.
     */
    protected abstract applyShape(
        underline: HTMLElement,
        tg: ITabGroup,
        startEdge: number,
        span: number,
        containerCrossSize: number,
        activePanelId: string | undefined,
        containerRect: DOMRect,
        isVertical: boolean
    ): void;

    private _positionUnderlinesSync(): void {
        const containerRect = this._ctx.tabsList.getBoundingClientRect();
        const tabGroups = this._ctx.getTabGroups();
        const isVertical = this._ctx.getDirection() === 'vertical';
        const containerCrossSize = isVertical
            ? containerRect.width
            : containerRect.height;
        const activePanelId = this._ctx.getActivePanelId();
        const tabMap = this._ctx.getTabMap();

        for (const tg of tabGroups) {
            const underline = this._underlines.get(tg.id);
            if (!underline) {
                continue;
            }

            const panelIds = tg.panelIds;
            if (panelIds.length === 0) {
                underline.style.display = 'none';
                continue;
            }

            underline.style.display = '';

            const chipEl = this._ctx.getChipElement(tg.id);

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

            this.applyShape(
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
}

/**
 * Chrome-style wrap-around indicator using SVG paths.
 */
export class WrapTabGroupIndicator extends BaseTabGroupIndicator {
    private _applyStraightLine(
        svg: SVGSVGElement,
        path: SVGPathElement,
        underline: HTMLElement,
        t: number,
        mainSize: number,
        isVertical: boolean
    ): void {
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
    }

    /**
     * Chrome-style wrap-around underline: a stroked SVG path that runs
     * along the bottom (or left edge in vertical mode), curving up and
     * over the active tab with rounded corners.
     *
     * The SVG and path elements are created once per underline and reused;
     * only the `d`, `stroke`, and viewport attributes are updated each frame.
     */
    protected applyShape(
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
        const color = resolveTabGroupAccent(
            tg.color,
            this._ctx.getColorPalette()
        );

        if (mainSize <= 0 || crossSize <= 0 || color === undefined) {
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
            this._applyStraightLine(
                svg,
                path,
                underline,
                t,
                mainSize,
                isVertical
            );
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
            this._applyStraightLine(
                svg,
                path,
                underline,
                t,
                mainSize,
                isVertical
            );
            return;
        }

        const r = 6; // corner radius
        const half = t / 2;
        const headerPosition = this._ctx.getHeaderPosition();

        if (isVertical) {
            const svgW = crossSize;
            const svgH = mainSize;
            svg.setAttribute('width', String(svgW));
            svg.setAttribute('height', String(svgH));
            underline.style.width = `${svgW}px`;
            underline.style.height = `${svgH}px`;

            // right header: indicator on the left edge (invert x sides)
            const isRightHeader = headerPosition === 'right';
            const xNear = isRightHeader ? svgW - half : half;
            const xFar = isRightHeader ? half : svgW - half;
            const cd = isRightHeader ? -1 : 1; // curve direction

            const d = [
                `M ${xNear},0`,
                `L ${xNear},${aStart - r}`,
                `Q ${xNear},${aStart} ${xNear + cd * r},${aStart}`,
                `L ${xFar - cd * r},${aStart}`,
                `Q ${xFar},${aStart} ${xFar},${aStart + r}`,
                `L ${xFar},${aEnd - r}`,
                `Q ${xFar},${aEnd} ${xFar - cd * r},${aEnd}`,
                `L ${xNear + cd * r},${aEnd}`,
                `Q ${xNear},${aEnd} ${xNear},${aEnd + r}`,
                `L ${xNear},${svgH}`,
            ].join(' ');

            path.setAttribute('d', d);
        } else {
            const svgW = mainSize;
            const svgH = crossSize;
            svg.setAttribute('width', String(svgW));
            svg.setAttribute('height', String(svgH));
            underline.style.width = `${svgW}px`;
            underline.style.height = `${svgH}px`;

            // bottom header: indicator on the top edge (invert y sides)
            const isBottomHeader = headerPosition === 'bottom';
            const yNear = isBottomHeader ? half : svgH - half;
            const yFar = isBottomHeader ? svgH - half : half;
            const cd = isBottomHeader ? 1 : -1; // curve direction

            const d = [
                `M 0,${yNear}`,
                `L ${aStart - r},${yNear}`,
                `Q ${aStart},${yNear} ${aStart},${yNear + cd * r}`,
                `L ${aStart},${yFar - cd * r}`,
                `Q ${aStart},${yFar} ${aStart + r},${yFar}`,
                `L ${aEnd - r},${yFar}`,
                `Q ${aEnd},${yFar} ${aEnd},${yFar - cd * r}`,
                `L ${aEnd},${yNear + cd * r}`,
                `Q ${aEnd},${yNear} ${aEnd + r},${yNear}`,
                `L ${svgW},${yNear}`,
            ].join(' ');

            path.setAttribute('d', d);
        }
    }
}

/**
 * Flat continuous bar indicator — no wrap-around, just a colored line
 * spanning the full tab group width.
 */
export class NoneTabGroupIndicator extends BaseTabGroupIndicator {
    protected applyShape(
        underline: HTMLElement,
        tg: ITabGroup,
        _startEdge: number,
        span: number,
        _containerCrossSize: number,
        _activePanelId: string | undefined,
        _containerRect: DOMRect,
        isVertical: boolean
    ): void {
        const t = 2; // line thickness in px
        const color = resolveTabGroupAccent(
            tg.color,
            this._ctx.getColorPalette()
        );

        if (span <= 0 || color === undefined) {
            underline.style.display = 'none';
            return;
        }
        underline.style.display = '';

        // Clear any SVG content left over from a mode switch
        if (underline.firstElementChild) {
            underline.innerHTML = '';
        }

        underline.style.backgroundColor = color;

        if (isVertical) {
            underline.style.width = `${t}px`;
            underline.style.height = `${span}px`;
        } else {
            underline.style.width = `${span}px`;
            underline.style.height = `${t}px`;
        }
    }
}
