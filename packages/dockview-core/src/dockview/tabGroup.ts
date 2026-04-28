import { Emitter, Event } from '../events';
import { CompositeDisposable } from '../lifecycle';

/**
 * The accent colour for a tab group. May be one of the built-in preset
 * names (see `DockviewTabGroupColors`) or any valid CSS colour value
 * (e.g. `"#ff0080"`, `"rgb(255 0 128)"`, `"var(--my-accent)"`).
 */
export type DockviewTabGroupColor = string;

/**
 * Built-in preset names for tab group accents. Each name resolves to a
 * `--dv-tab-group-color-<name>` CSS custom property defined by the
 * theme, so consumers can override the swatches per-theme.
 *
 * Custom colours (any CSS colour string) are also supported and bypass
 * this map.
 */
export const DockviewTabGroupColors = {
    Grey: 'grey',
    Blue: 'blue',
    Red: 'red',
    Yellow: 'yellow',
    Green: 'green',
    Pink: 'pink',
    Purple: 'purple',
    Cyan: 'cyan',
    Orange: 'orange',
} as const;

const BUILT_IN_COLORS: Set<string> = new Set<string>(
    Object.values(DockviewTabGroupColors)
);

export function isBuiltInTabGroupColor(value: string | undefined): boolean {
    return typeof value === 'string' && BUILT_IN_COLORS.has(value);
}

/**
 * @deprecated Use `isBuiltInTabGroupColor`. Any non-empty string is now a
 * valid colour value; this predicate only narrows to the preset names.
 */
export const isValidTabGroupColor = isBuiltInTabGroupColor;

/**
 * Resolve a tab-group colour value to a CSS expression that can be assigned
 * to a property or custom property. Built-in names map to their themed
 * `--dv-tab-group-color-<name>` variable; arbitrary values are returned
 * verbatim.
 */
export function resolveTabGroupAccent(
    value: DockviewTabGroupColor | undefined
): string | undefined {
    if (!value) {
        return undefined;
    }
    if (isBuiltInTabGroupColor(value)) {
        return `var(--dv-tab-group-color-${value})`;
    }
    return value;
}

export interface SerializedTabGroup {
    id: string;
    label?: string;
    color?: DockviewTabGroupColor;
    collapsed: boolean;
    panelIds: string[];
    componentParams?: Record<string, unknown>;
}

export interface TabGroupOptions {
    label?: string;
    color?: DockviewTabGroupColor;
    collapsed?: boolean;
    componentParams?: Record<string, unknown>;
}

export interface ITabGroup {
    readonly id: string;
    readonly label: string;
    readonly color: DockviewTabGroupColor | undefined;
    readonly collapsed: boolean;
    readonly panelIds: readonly string[];
    readonly size: number;
    readonly isEmpty: boolean;
    readonly componentParams: Record<string, unknown> | undefined;
    readonly onDidChange: Event<void>;
    readonly onDidPanelChange: Event<{
        panelId: string;
        type: 'add' | 'remove';
    }>;
    readonly onDidCollapseChange: Event<boolean>;
    readonly onDidDestroy: Event<void>;
    addPanel(panelId: string, index?: number): void;
    removePanel(panelId: string): boolean;
    indexOfPanel(panelId: string): number;
    containsPanel(panelId: string): boolean;
    setLabel(value: string): void;
    setColor(value: DockviewTabGroupColor | undefined): void;
    setComponentParams(value: Record<string, unknown> | undefined): void;
    collapse(): void;
    expand(): void;
    toggle(): void;
    toJSON(): SerializedTabGroup;
    dispose(): void;
}

export class TabGroup extends CompositeDisposable implements ITabGroup {
    private _label: string;
    private _color: DockviewTabGroupColor | undefined;
    private _collapsed = false;
    private _componentParams: Record<string, unknown> | undefined;
    private readonly _panelIds: string[] = [];

    private readonly _onDidChange = new Emitter<void>();
    readonly onDidChange: Event<void> = this._onDidChange.event;

    private readonly _onDidPanelChange = new Emitter<{
        panelId: string;
        type: 'add' | 'remove';
    }>();
    readonly onDidPanelChange = this._onDidPanelChange.event;

    private readonly _onDidCollapseChange = new Emitter<boolean>();
    readonly onDidCollapseChange: Event<boolean> =
        this._onDidCollapseChange.event;

    private readonly _onDidDestroy = new Emitter<void>();
    readonly onDidDestroy: Event<void> = this._onDidDestroy.event;

    get label(): string {
        return this._label;
    }

    get color(): DockviewTabGroupColor | undefined {
        return this._color;
    }

    get componentParams(): Record<string, unknown> | undefined {
        return this._componentParams;
    }

    setLabel(value: string): void {
        if (this.isDisposed || this._label === value) {
            return;
        }
        this._label = value;
        this._onDidChange.fire();
    }

    setColor(value: DockviewTabGroupColor | undefined): void {
        if (this.isDisposed) {
            return;
        }
        const next = value ? value : undefined;
        if (this._color === next) {
            return;
        }
        this._color = next;
        this._onDidChange.fire();
    }

    setComponentParams(value: Record<string, unknown> | undefined): void {
        if (this.isDisposed) {
            return;
        }
        this._componentParams = value;
        this._onDidChange.fire();
    }

    get collapsed(): boolean {
        return this._collapsed;
    }

    get panelIds(): readonly string[] {
        return this._panelIds;
    }

    get size(): number {
        return this._panelIds.length;
    }

    get isEmpty(): boolean {
        return this._panelIds.length === 0;
    }

    constructor(
        readonly id: string,
        options?: TabGroupOptions
    ) {
        super();

        this._label = options?.label ?? '';
        this._color = options?.color ? options.color : undefined;
        this._collapsed = options?.collapsed ?? false;
        this._componentParams = options?.componentParams;

        this.addDisposables(
            this._onDidChange,
            this._onDidPanelChange,
            this._onDidCollapseChange,
            this._onDidDestroy
        );
    }

    addPanel(panelId: string, index?: number): void {
        if (this.isDisposed) {
            return;
        }
        if (this._panelIds.includes(panelId)) {
            return;
        }

        const insertIndex =
            index !== undefined
                ? Math.max(0, Math.min(index, this._panelIds.length))
                : this._panelIds.length;

        this._panelIds.splice(insertIndex, 0, panelId);
        this._onDidPanelChange.fire({ panelId, type: 'add' });
    }

    removePanel(panelId: string): boolean {
        if (this.isDisposed) {
            return false;
        }
        const index = this._panelIds.indexOf(panelId);
        if (index === -1) {
            return false;
        }
        this._panelIds.splice(index, 1);
        this._onDidPanelChange.fire({ panelId, type: 'remove' });
        return true;
    }

    indexOfPanel(panelId: string): number {
        return this._panelIds.indexOf(panelId);
    }

    containsPanel(panelId: string): boolean {
        return this._panelIds.includes(panelId);
    }

    collapse(): void {
        if (this.isDisposed || this._collapsed) {
            return;
        }
        this._collapsed = true;
        this._onDidCollapseChange.fire(true);
    }

    expand(): void {
        if (this.isDisposed || !this._collapsed) {
            return;
        }
        this._collapsed = false;
        this._onDidCollapseChange.fire(false);
    }

    toggle(): void {
        if (this._collapsed) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    toJSON(): SerializedTabGroup {
        const result: SerializedTabGroup = {
            id: this.id,
            collapsed: this._collapsed,
            panelIds: [...this._panelIds],
        };
        if (this._label) {
            result.label = this._label;
        }
        if (this._color !== undefined) {
            result.color = this._color;
        }
        if (this._componentParams !== undefined) {
            result.componentParams = this._componentParams;
        }
        return result;
    }

    override dispose(): void {
        this._onDidDestroy.fire();
        super.dispose();
    }
}
