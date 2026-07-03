import {
    NoneTabGroupIndicator,
    WrapTabGroupIndicator,
    TabGroupIndicatorContext,
} from '../../../../dockview/components/titlebar/tabGroupIndicator';
import { TabGroup } from '../../../../dockview/tabGroup';
import {
    DEFAULT_TAB_GROUP_COLORS,
    TabGroupColorPalette,
} from '../../../../dockview/tabGroupAccent';

function createContext(
    overrides: Partial<TabGroupIndicatorContext> = {}
): TabGroupIndicatorContext {
    const tabsList = document.createElement('div');
    const palette = new TabGroupColorPalette(DEFAULT_TAB_GROUP_COLORS, true);
    return {
        tabsList,
        getTabGroups: () => [],
        getActivePanelId: () => undefined,
        getTabMap: () => new Map(),
        getChipElement: () => undefined,
        getDirection: () => 'horizontal',
        getColorPalette: () => palette,
        ...overrides,
    };
}

describe('NoneTabGroupIndicator', () => {
    test('applyShape sets backgroundColor and horizontal dimensions', () => {
        const ctx = createContext();
        const indicator = new NoneTabGroupIndicator(ctx);
        const underline = document.createElement('div');

        const tg = new TabGroup('tg-1', { label: 'Test', color: 'blue' });

        // Call the protected method via any cast
        (indicator as any).applyShape(
            underline,
            tg,
            0, // startEdge
            120, // span
            30, // containerCrossSize
            undefined, // activePanelId
            {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                toJSON: () => ({}),
            } as DOMRect,
            false // isVertical
        );

        // jsdom doesn't support CSS var() in style properties, so
        // we verify the dimensions and display are set correctly
        expect(underline.style.width).toBe('120px');
        expect(underline.style.height).toBe('2px');
        expect(underline.style.display).toBe('');
    });

    test('applyShape sets vertical dimensions when isVertical is true', () => {
        const ctx = createContext();
        const indicator = new NoneTabGroupIndicator(ctx);
        const underline = document.createElement('div');

        const tg = new TabGroup('tg-1', { label: 'Test', color: 'red' });

        (indicator as any).applyShape(
            underline,
            tg,
            0,
            200,
            30,
            undefined,
            {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                toJSON: () => ({}),
            } as DOMRect,
            true // isVertical
        );

        expect(underline.style.width).toBe('2px');
        expect(underline.style.height).toBe('200px');
    });

    test('applyShape hides underline when span is zero', () => {
        const ctx = createContext();
        const indicator = new NoneTabGroupIndicator(ctx);
        const underline = document.createElement('div');

        const tg = new TabGroup('tg-1', { label: 'Test', color: 'green' });

        (indicator as any).applyShape(
            underline,
            tg,
            0,
            0, // zero span
            30,
            undefined,
            {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                toJSON: () => ({}),
            } as DOMRect,
            false
        );

        expect(underline.style.display).toBe('none');
    });

    test('applyShape hides underline when span is negative', () => {
        const ctx = createContext();
        const indicator = new NoneTabGroupIndicator(ctx);
        const underline = document.createElement('div');

        const tg = new TabGroup('tg-1', { label: 'Test', color: 'purple' });

        (indicator as any).applyShape(
            underline,
            tg,
            0,
            -10,
            30,
            undefined,
            {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                toJSON: () => ({}),
            } as DOMRect,
            false
        );

        expect(underline.style.display).toBe('none');
    });

    test('applyShape clears leftover SVG content from mode switch', () => {
        const ctx = createContext();
        const indicator = new NoneTabGroupIndicator(ctx);
        const underline = document.createElement('div');

        // Simulate leftover SVG from WrapTabGroupIndicator
        const svg = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg'
        );
        underline.appendChild(svg);
        expect(underline.firstElementChild).toBeTruthy();

        const tg = new TabGroup('tg-1', { label: 'Test', color: 'cyan' });

        (indicator as any).applyShape(
            underline,
            tg,
            0,
            100,
            30,
            undefined,
            {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                toJSON: () => ({}),
            } as DOMRect,
            false
        );

        // SVG should be cleared
        expect(underline.firstElementChild).toBeNull();
        expect(underline.innerHTML).toBe('');
        // Dimensions should still be set
        expect(underline.style.width).toBe('100px');
        expect(underline.style.height).toBe('2px');
    });

    test('dispose clears underlines', () => {
        const ctx = createContext();
        const indicator = new NoneTabGroupIndicator(ctx);

        // Manually add an underline to verify disposal
        (indicator as any)._underlines.set(
            'tg-1',
            document.createElement('div')
        );
        expect(indicator.underlines.size).toBe(1);

        indicator.dispose();
        expect(indicator.underlines.size).toBe(0);
    });
});

describe('WrapTabGroupIndicator', () => {
    test('dispose clears underlines', () => {
        const ctx = createContext();
        const indicator = new WrapTabGroupIndicator(ctx);

        (indicator as any)._underlines.set(
            'tg-1',
            document.createElement('div')
        );
        expect(indicator.underlines.size).toBe(1);

        indicator.dispose();
        expect(indicator.underlines.size).toBe(0);
    });
});

describe('indicator type identity', () => {
    test('NoneTabGroupIndicator and WrapTabGroupIndicator are distinct types', () => {
        const ctx = createContext();
        const none = new NoneTabGroupIndicator(ctx);
        const wrap = new WrapTabGroupIndicator(ctx);

        expect(none).toBeInstanceOf(NoneTabGroupIndicator);
        expect(none).not.toBeInstanceOf(WrapTabGroupIndicator);
        expect(wrap).toBeInstanceOf(WrapTabGroupIndicator);
        expect(wrap).not.toBeInstanceOf(NoneTabGroupIndicator);

        none.dispose();
        wrap.dispose();
    });
});
