import { DockviewComponent } from '../../dockview/dockviewComponent';
import { Emitter } from '../../events';
import { IContentRenderer } from '../../dockview/types';
import {
    DEFAULT_TAB_GROUP_COLORS,
    DockviewTabGroupColorEntry,
} from '../../dockview/tabGroupAccent';

class TestPanel implements IContentRenderer {
    element: HTMLElement = document.createElement('div');
    readonly _onDidDispose = new Emitter<void>();
    readonly onDidDispose = this._onDidDispose.event;
    isDisposed = false;
    constructor(
        public readonly id: string,
        public readonly component: string
    ) {}
    init(): void {}
    layout(): void {}
    update(): void {}
    toJSON(): object {
        return { id: this.component };
    }
    focus(): void {}
    dispose(): void {
        this.isDisposed = true;
        this._onDidDispose.fire();
    }
}

function setup(
    extraOptions: {
        tabGroupColors?: DockviewTabGroupColorEntry[];
        tabGroupAccent?: 'palette' | 'off';
    } = {}
) {
    const container = document.createElement('div');
    const dockview = new DockviewComponent(container, {
        createComponent(options) {
            return new TestPanel(options.id, options.name);
        },
        ...extraOptions,
    });
    dockview.layout(500, 500);
    return { container, dockview };
}

/**
 * Force synchronous chip rendering. updateTabGroups is normally batched
 * via queueMicrotask so the chip element doesn't appear in the DOM until
 * after the microtask drains.
 */
function flushChips(dockview: DockviewComponent): void {
    for (const group of dockview.groups) {
        (group.model as any).tabsContainer.tabs.updateTabGroups();
    }
}

describe('DockviewComponent — tab group accent', () => {
    test('default palette is the built-in 9 colors', () => {
        const { dockview } = setup();
        expect(dockview.api.tabGroupColors).toEqual(DEFAULT_TAB_GROUP_COLORS);
        expect(dockview.tabGroupColorPalette.enabled).toBe(true);
        dockview.dispose();
    });

    test('custom tabGroupColors replaces the default palette', () => {
        const custom: DockviewTabGroupColorEntry[] = [
            { id: 'brand', value: '#123456', label: 'Brand' },
            { id: 'accent', value: '#abcdef' },
        ];
        const { dockview } = setup({ tabGroupColors: custom });

        expect(dockview.api.tabGroupColors).toEqual(custom);
        expect(dockview.tabGroupColorPalette.has('brand')).toBe(true);
        expect(dockview.tabGroupColorPalette.has('blue')).toBe(false);

        dockview.dispose();
    });

    test('custom palette resolves chip color through configured value', () => {
        const { dockview } = setup({
            tabGroupColors: [
                { id: 'brand', value: '#123456' },
                { id: 'accent', value: '#abcdef' },
            ],
        });

        const panel = dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });

        const tabGroup = dockview.api.createTabGroup({
            groupId: panel.api.group.id,
            label: 'Brand',
            color: 'brand',
        });
        dockview.api.addPanelToTabGroup({
            groupId: panel.api.group.id,
            tabGroupId: tabGroup.id,
            panelId: panel.id,
        });
        flushChips(dockview);

        const chipEl = panel.api.group.element.querySelector(
            '.dv-tab-group-chip'
        ) as HTMLElement | null;
        expect(chipEl).toBeTruthy();
        expect(chipEl!.style.getPropertyValue('--dv-tab-group-color')).toBe(
            '#123456'
        );

        dockview.dispose();
    });

    test('tabGroupAccent: "off" disables accent everywhere', () => {
        const { dockview } = setup({ tabGroupAccent: 'off' });

        expect(dockview.tabGroupColorPalette.enabled).toBe(false);

        const panel = dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });

        const tabGroup = dockview.api.createTabGroup({
            groupId: panel.api.group.id,
            label: 'Test',
            color: 'blue',
        });
        dockview.api.addPanelToTabGroup({
            groupId: panel.api.group.id,
            tabGroupId: tabGroup.id,
            panelId: panel.id,
        });
        flushChips(dockview);

        const chipEl = panel.api.group.element.querySelector(
            '.dv-tab-group-chip'
        ) as HTMLElement | null;
        expect(chipEl).toBeTruthy();
        expect(chipEl!.style.getPropertyValue('--dv-tab-group-color')).toBe('');
        expect(
            chipEl!.classList.contains('dv-tab-group-chip--accent-off')
        ).toBe(true);

        // Color data is still preserved on the group
        expect(tabGroup.color).toBe('blue');

        dockview.dispose();
    });

    test('updateOptions can toggle tabGroupAccent at runtime', () => {
        const { dockview } = setup();

        const panel = dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });
        const tabGroup = dockview.api.createTabGroup({
            groupId: panel.api.group.id,
            label: 'Test',
            color: 'blue',
        });
        dockview.api.addPanelToTabGroup({
            groupId: panel.api.group.id,
            tabGroupId: tabGroup.id,
            panelId: panel.id,
        });
        flushChips(dockview);

        const chipEl = () =>
            panel.api.group.element.querySelector(
                '.dv-tab-group-chip'
            ) as HTMLElement;

        expect(chipEl().style.getPropertyValue('--dv-tab-group-color')).toBe(
            'var(--dv-tab-group-color-blue)'
        );

        dockview.updateOptions({ tabGroupAccent: 'off' });

        expect(chipEl().style.getPropertyValue('--dv-tab-group-color')).toBe(
            ''
        );
        expect(
            chipEl().classList.contains('dv-tab-group-chip--accent-off')
        ).toBe(true);

        dockview.updateOptions({ tabGroupAccent: 'palette' });

        expect(chipEl().style.getPropertyValue('--dv-tab-group-color')).toBe(
            'var(--dv-tab-group-color-blue)'
        );

        dockview.dispose();
    });

    test('updateOptions can swap palette at runtime', () => {
        const { dockview } = setup();

        const panel = dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });
        const tabGroup = dockview.api.createTabGroup({
            groupId: panel.api.group.id,
            label: 'Brand',
            color: 'brand',
        });
        dockview.api.addPanelToTabGroup({
            groupId: panel.api.group.id,
            tabGroupId: tabGroup.id,
            panelId: panel.id,
        });
        flushChips(dockview);

        const chipEl = () =>
            panel.api.group.element.querySelector(
                '.dv-tab-group-chip'
            ) as HTMLElement;

        // Before swap: 'brand' isn't in default palette → falls through as literal
        expect(chipEl().style.getPropertyValue('--dv-tab-group-color')).toBe(
            'brand'
        );

        dockview.updateOptions({
            tabGroupColors: [{ id: 'brand', value: '#123456' }],
        });

        expect(chipEl().style.getPropertyValue('--dv-tab-group-color')).toBe(
            '#123456'
        );

        dockview.dispose();
    });

    test('componentParams round-trip through serialization', () => {
        const { dockview } = setup();

        const panel = dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });
        const tabGroup = dockview.api.createTabGroup({
            groupId: panel.api.group.id,
            label: 'WithParams',
            componentParams: { icon: 'star', priority: 1 },
        });
        dockview.api.addPanelToTabGroup({
            groupId: panel.api.group.id,
            tabGroupId: tabGroup.id,
            panelId: panel.id,
        });

        expect(tabGroup.componentParams).toEqual({
            icon: 'star',
            priority: 1,
        });

        const serialized = panel.api.group.toJSON();
        expect(serialized.tabGroups).toBeDefined();
        expect(serialized.tabGroups![0].componentParams).toEqual({
            icon: 'star',
            priority: 1,
        });

        dockview.dispose();
    });

    test('opt-out preserves color data through serialization round-trip', () => {
        const { dockview } = setup({ tabGroupAccent: 'off' });

        const panel = dockview.addPanel({
            id: 'panel1',
            component: 'default',
        });
        const tabGroup = dockview.api.createTabGroup({
            groupId: panel.api.group.id,
            label: 'Test',
            color: 'blue',
        });
        dockview.api.addPanelToTabGroup({
            groupId: panel.api.group.id,
            tabGroupId: tabGroup.id,
            panelId: panel.id,
        });

        const serialized = panel.api.group.toJSON();
        expect(serialized.tabGroups![0].color).toBe('blue');

        dockview.dispose();
    });
});
