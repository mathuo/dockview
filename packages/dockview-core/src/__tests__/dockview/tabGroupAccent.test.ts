import {
    DEFAULT_TAB_GROUP_COLORS,
    TabGroupColorPalette,
    applyTabGroupAccent,
    resolveTabGroupAccent,
} from '../../dockview/tabGroupAccent';

describe('TabGroupColorPalette', () => {
    test('default palette has 9 entries with the canonical ids', () => {
        const ids = DEFAULT_TAB_GROUP_COLORS.map((e) => e.id);
        expect(ids).toEqual([
            'grey',
            'blue',
            'red',
            'yellow',
            'green',
            'pink',
            'purple',
            'cyan',
            'orange',
        ]);
    });

    test('default palette values reference the corresponding CSS var', () => {
        for (const entry of DEFAULT_TAB_GROUP_COLORS) {
            expect(entry.value).toBe(`var(--dv-tab-group-color-${entry.id})`);
        }
    });

    test('resolveValue returns the entry value for a known id', () => {
        const palette = new TabGroupColorPalette(DEFAULT_TAB_GROUP_COLORS);
        expect(palette.resolveValue('blue')).toBe(
            'var(--dv-tab-group-color-blue)'
        );
    });

    test('resolveValue passes unknown ids through as raw CSS literals', () => {
        const palette = new TabGroupColorPalette(DEFAULT_TAB_GROUP_COLORS);
        expect(palette.resolveValue('#abc123')).toBe('#abc123');
        expect(palette.resolveValue('rgb(0, 0, 0)')).toBe('rgb(0, 0, 0)');
    });

    test('resolveValue returns undefined for empty/unset color', () => {
        const palette = new TabGroupColorPalette(DEFAULT_TAB_GROUP_COLORS);
        expect(palette.resolveValue(undefined)).toBeUndefined();
        expect(palette.resolveValue('')).toBeUndefined();
    });

    test('resolveValue returns undefined when palette is disabled', () => {
        const palette = new TabGroupColorPalette(
            DEFAULT_TAB_GROUP_COLORS,
            false
        );
        expect(palette.resolveValue('blue')).toBeUndefined();
        expect(palette.resolveValue('#abc123')).toBeUndefined();
    });

    test('custom palette replaces defaults wholesale', () => {
        const palette = new TabGroupColorPalette([
            { id: 'brand', value: '#123456' },
            { id: 'accent', value: '#abcdef', label: 'Accent' },
        ]);
        expect(palette.entries()).toHaveLength(2);
        expect(palette.resolveValue('brand')).toBe('#123456');
        expect(palette.resolveValue('accent')).toBe('#abcdef');
        // Default-palette ids are passed through as raw literals.
        expect(palette.resolveValue('blue')).toBe('blue');
    });

    test('defaultId returns the first entry id', () => {
        const palette = new TabGroupColorPalette([
            { id: 'brand', value: '#123456' },
            { id: 'accent', value: '#abcdef' },
        ]);
        expect(palette.defaultId()).toBe('brand');
    });

    test('has() reports membership', () => {
        const palette = new TabGroupColorPalette(DEFAULT_TAB_GROUP_COLORS);
        expect(palette.has('blue')).toBe(true);
        expect(palette.has('nonexistent')).toBe(false);
    });

    test('enabled flag can be flipped at runtime', () => {
        const palette = new TabGroupColorPalette(DEFAULT_TAB_GROUP_COLORS);
        expect(palette.resolveValue('blue')).toBeDefined();
        palette.enabled = false;
        expect(palette.resolveValue('blue')).toBeUndefined();
        palette.enabled = true;
        expect(palette.resolveValue('blue')).toBeDefined();
    });
});

describe('applyTabGroupAccent', () => {
    test('writes resolved value to --dv-tab-group-color', () => {
        const el = document.createElement('div');
        const palette = new TabGroupColorPalette(DEFAULT_TAB_GROUP_COLORS);
        applyTabGroupAccent(el, 'blue', palette);
        expect(el.style.getPropertyValue('--dv-tab-group-color')).toBe(
            'var(--dv-tab-group-color-blue)'
        );
    });

    test('removes property when palette is disabled', () => {
        const el = document.createElement('div');
        const palette = new TabGroupColorPalette(DEFAULT_TAB_GROUP_COLORS);
        applyTabGroupAccent(el, 'blue', palette);
        palette.enabled = false;
        applyTabGroupAccent(el, 'blue', palette);
        expect(el.style.getPropertyValue('--dv-tab-group-color')).toBe('');
    });

    test('removes property when color is undefined', () => {
        const el = document.createElement('div');
        const palette = new TabGroupColorPalette(DEFAULT_TAB_GROUP_COLORS);
        applyTabGroupAccent(el, 'blue', palette);
        applyTabGroupAccent(el, undefined, palette);
        expect(el.style.getPropertyValue('--dv-tab-group-color')).toBe('');
    });

    test('falls back to default palette when no palette is supplied', () => {
        const el = document.createElement('div');
        applyTabGroupAccent(el, 'blue', undefined);
        expect(el.style.getPropertyValue('--dv-tab-group-color')).toBe(
            'var(--dv-tab-group-color-blue)'
        );
    });
});

describe('resolveTabGroupAccent', () => {
    test('returns the resolved CSS string for a known id', () => {
        const palette = new TabGroupColorPalette(DEFAULT_TAB_GROUP_COLORS);
        expect(resolveTabGroupAccent('blue', palette)).toBe(
            'var(--dv-tab-group-color-blue)'
        );
    });

    test('returns undefined when palette is disabled', () => {
        const palette = new TabGroupColorPalette(
            DEFAULT_TAB_GROUP_COLORS,
            false
        );
        expect(resolveTabGroupAccent('blue', palette)).toBeUndefined();
    });

    test('falls back to default palette when no palette supplied', () => {
        expect(resolveTabGroupAccent('blue', undefined)).toBe(
            'var(--dv-tab-group-color-blue)'
        );
    });
});
