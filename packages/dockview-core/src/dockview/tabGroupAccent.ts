/**
 * A single entry in the tab-group color palette.
 *
 * `id` is the value stored on `ITabGroup.color` and serialized in
 * `SerializedTabGroup.color`. `value` is any CSS color expression — a hex
 * literal, an rgb()/hsl()/oklch() function, or a `var(...)` reference.
 *
 * The default palette ships with `var(--dv-tab-group-color-${id})` values so
 * themes can override the defaults purely in CSS. User-supplied palettes
 * typically use raw color literals.
 */
export interface DockviewTabGroupColorEntry {
    id: string;
    value: string;
    label?: string;
}

export const DEFAULT_TAB_GROUP_COLORS: readonly DockviewTabGroupColorEntry[] = [
    { id: 'grey', value: 'var(--dv-tab-group-color-grey)', label: 'Grey' },
    { id: 'blue', value: 'var(--dv-tab-group-color-blue)', label: 'Blue' },
    { id: 'red', value: 'var(--dv-tab-group-color-red)', label: 'Red' },
    {
        id: 'yellow',
        value: 'var(--dv-tab-group-color-yellow)',
        label: 'Yellow',
    },
    { id: 'green', value: 'var(--dv-tab-group-color-green)', label: 'Green' },
    { id: 'pink', value: 'var(--dv-tab-group-color-pink)', label: 'Pink' },
    {
        id: 'purple',
        value: 'var(--dv-tab-group-color-purple)',
        label: 'Purple',
    },
    { id: 'cyan', value: 'var(--dv-tab-group-color-cyan)', label: 'Cyan' },
    {
        id: 'orange',
        value: 'var(--dv-tab-group-color-orange)',
        label: 'Orange',
    },
];

/**
 * Runtime palette for tab-group color accents.
 *
 * Resolves a stored `color` string to a CSS color expression, with three
 * fall-through modes:
 *   1. `id` matches an entry → entry's `value`
 *   2. `id` doesn't match → `id` itself (raw CSS literal pass-through)
 *   3. `id` is empty or undefined → undefined (caller skips assignment)
 *
 * When `enabled` is false the palette returns undefined for everything; this
 * is the `tabGroupAccent: 'off'` opt-out path.
 */
export class TabGroupColorPalette {
    private _entries: DockviewTabGroupColorEntry[];
    private _byId: Map<string, DockviewTabGroupColorEntry>;
    private _enabled: boolean;

    constructor(
        entries: readonly DockviewTabGroupColorEntry[],
        enabled: boolean = true
    ) {
        this._entries = entries.slice();
        this._byId = new Map(entries.map((e) => [e.id, e]));
        this._enabled = enabled;
    }

    get enabled(): boolean {
        return this._enabled;
    }

    set enabled(value: boolean) {
        this._enabled = value;
    }

    /**
     * Replace the entry list in place. Used by `updateOptions` so that
     * existing palette references (held by chips, indicators, etc.) see
     * the new palette without needing to be re-wired.
     */
    setEntries(entries: readonly DockviewTabGroupColorEntry[]): void {
        this._entries = entries.slice();
        this._byId = new Map(entries.map((e) => [e.id, e]));
    }

    entries(): readonly DockviewTabGroupColorEntry[] {
        return this._entries;
    }

    has(id: string): boolean {
        return this._byId.has(id);
    }

    get(id: string): DockviewTabGroupColorEntry | undefined {
        return this._byId.get(id);
    }

    /** First entry's id; used as the default when a color is unset. */
    defaultId(): string | undefined {
        return this._entries[0]?.id;
    }

    /**
     * Resolve a stored color to its CSS value, or undefined if no value
     * should be written (palette disabled, or color empty/undefined).
     */
    resolveValue(color: string | undefined): string | undefined {
        if (!this._enabled || !color) {
            return undefined;
        }
        const entry = this._byId.get(color);
        return entry ? entry.value : color;
    }
}

let _fallbackPalette: TabGroupColorPalette | undefined;

/**
 * Lazy-built palette used when the accessor isn't available (test mocks,
 * isolated chip construction). Production code paths always pass a real
 * palette through.
 */
function getFallbackPalette(): TabGroupColorPalette {
    _fallbackPalette ??= new TabGroupColorPalette(
        DEFAULT_TAB_GROUP_COLORS,
        true
    );
    return _fallbackPalette;
}

/**
 * Set the `--dv-tab-group-color` custom property on `el` to the resolved
 * accent value, or remove it when the palette is disabled / color is unset.
 */
export function applyTabGroupAccent(
    el: HTMLElement,
    color: string | undefined,
    palette: TabGroupColorPalette | undefined
): void {
    const value = (palette ?? getFallbackPalette()).resolveValue(color);
    if (value === undefined) {
        el.style.removeProperty('--dv-tab-group-color');
    } else {
        el.style.setProperty('--dv-tab-group-color', value);
    }
}

/**
 * Return the resolved CSS color for a tab group, or undefined when the
 * palette is disabled or no color is set. Use this when you need the raw
 * value to assign to a non-custom-property style (e.g. SVG stroke,
 * backgroundColor on the indicator underline).
 */
export function resolveTabGroupAccent(
    color: string | undefined,
    palette: TabGroupColorPalette | undefined
): string | undefined {
    return (palette ?? getFallbackPalette()).resolveValue(color);
}
