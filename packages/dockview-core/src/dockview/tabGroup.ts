import { Emitter, Event } from '../events';
import { CompositeDisposable } from '../lifecycle';

export type DockviewDockviewTabGroupColor =
    | 'grey'
    | 'blue'
    | 'red'
    | 'yellow'
    | 'green'
    | 'pink'
    | 'purple'
    | 'cyan';

export const DockviewDockviewTabGroupColors: Record<string, DockviewDockviewTabGroupColor> = {
    Grey: 'grey',
    Blue: 'blue',
    Red: 'red',
    Yellow: 'yellow',
    Green: 'green',
    Pink: 'pink',
    Purple: 'purple',
    Cyan: 'cyan',
} as const;

const VALID_COLORS: Set<string> = new Set<string>(
    Object.values(DockviewDockviewTabGroupColors)
);

export function isValidDockviewTabGroupColor(
    value: string
): value is DockviewDockviewTabGroupColor {
    return VALID_COLORS.has(value);
}

export interface SerializedTabGroup {
    id: string;
    label?: string;
    color: DockviewTabGroupColor;
    collapsed: boolean;
    panelIds: string[];
}

export interface ITabGroup {
    readonly id: string;
    readonly label: string;
    readonly color: DockviewTabGroupColor;
    readonly collapsed: boolean;
    readonly panelIds: readonly string[];
    readonly size: number;
    readonly isEmpty: boolean;
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
    setColor(value: DockviewTabGroupColor): void;
    collapse(): void;
    expand(): void;
    toggle(): void;
    toJSON(): SerializedTabGroup;
    dispose(): void;
}

export class TabGroup extends CompositeDisposable implements ITabGroup {
    private _label: string;
    private _color: DockviewTabGroupColor;
    private _collapsed = false;
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

    get color(): DockviewTabGroupColor {
        return this._color;
    }

    setLabel(value: string): void {
        if (this.isDisposed || this._label === value) {
            return;
        }
        this._label = value;
        this._onDidChange.fire();
    }

    setColor(value: DockviewTabGroupColor): void {
        if (this.isDisposed) {
            return;
        }
        const validColor = isValidDockviewTabGroupColor(value) ? value : 'grey';
        if (this._color === validColor) {
            return;
        }
        this._color = validColor;
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
        options?: { label?: string; color?: DockviewTabGroupColor }
    ) {
        super();

        this._label = options?.label ?? '';
        this._color = isValidDockviewTabGroupColor(options?.color ?? '')
            ? (options!.color as DockviewTabGroupColor)
            : 'grey';

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
            color: this._color,
            collapsed: this._collapsed,
            panelIds: [...this._panelIds],
        };
        if (this._label) {
            result.label = this._label;
        }
        return result;
    }

    override dispose(): void {
        this._onDidDestroy.fire();
        super.dispose();
    }
}
