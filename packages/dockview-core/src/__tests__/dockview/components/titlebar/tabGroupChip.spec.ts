import { fireEvent } from '@testing-library/dom';
import { TabGroupChip } from '../../../../dockview/components/titlebar/tabGroupChip';
import { TabGroup } from '../../../../dockview/tabGroup';
import {
    DEFAULT_TAB_GROUP_COLORS,
    TabGroupColorPalette,
} from '../../../../dockview/tabGroupAccent';
import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewApi } from '../../../../api/component.api';

function createPalette(enabled: boolean = true): TabGroupColorPalette {
    return new TabGroupColorPalette(DEFAULT_TAB_GROUP_COLORS, enabled);
}

describe('TabGroupChip', () => {
    test('creates element with correct class', () => {
        const chip = new TabGroupChip(createPalette());

        expect(chip.element.className).toBe('dv-tab-group-chip');
        expect(chip.element.tabIndex).toBe(0);
        // The chip is presentation-only; `draggable` is set by the
        // `TabGroupManager` when wiring DnD sources, so by default a
        // bare chip element is not draggable.
        expect(chip.element.draggable).toBe(false);
    });

    test('element contains a label span', () => {
        const chip = new TabGroupChip(createPalette());

        const label = chip.element.querySelector('.dv-tab-group-chip-label');
        expect(label).toBeTruthy();
    });

    test('init sets label and resolves color via palette', () => {
        const chip = new TabGroupChip(createPalette());
        const tabGroup = new TabGroup('tg-1', {
            label: 'Feature',
            color: 'blue',
        });

        chip.init({
            tabGroup,
            api: fromPartial<DockviewApi>({}),
        });

        const label = chip.element.querySelector('.dv-tab-group-chip-label');
        expect(label!.textContent).toBe('Feature');
        expect(
            chip.element.style.getPropertyValue('--dv-tab-group-color')
        ).toBe('var(--dv-tab-group-color-blue)');
        expect(
            chip.element.classList.contains('dv-tab-group-chip--accent-off')
        ).toBe(false);
    });

    test('init with empty label adds empty class', () => {
        const chip = new TabGroupChip(createPalette());
        const tabGroup = new TabGroup('tg-1', { color: 'red' });

        chip.init({
            tabGroup,
            api: fromPartial<DockviewApi>({}),
        });

        const label = chip.element.querySelector('.dv-tab-group-chip-label');
        expect(
            label!.classList.contains('dv-tab-group-chip-label--empty')
        ).toBe(true);
    });

    test('init applies collapsed class when group is collapsed', () => {
        const chip = new TabGroupChip(createPalette());
        const tabGroup = new TabGroup('tg-1', { color: 'green' });
        tabGroup.collapse();

        chip.init({
            tabGroup,
            api: fromPartial<DockviewApi>({}),
        });

        expect(
            chip.element.classList.contains('dv-tab-group-chip--collapsed')
        ).toBe(true);
    });

    test('updates color when tab group color changes', () => {
        const chip = new TabGroupChip(createPalette());
        const tabGroup = new TabGroup('tg-1', {
            label: 'Test',
            color: 'blue',
        });

        chip.init({
            tabGroup,
            api: fromPartial<DockviewApi>({}),
        });

        expect(
            chip.element.style.getPropertyValue('--dv-tab-group-color')
        ).toBe('var(--dv-tab-group-color-blue)');

        tabGroup.setColor('red');

        expect(
            chip.element.style.getPropertyValue('--dv-tab-group-color')
        ).toBe('var(--dv-tab-group-color-red)');
    });

    test('passes through unknown ids as raw CSS values', () => {
        const chip = new TabGroupChip(createPalette());
        const tabGroup = new TabGroup('tg-1', { color: '#abc123' });

        chip.init({
            tabGroup,
            api: fromPartial<DockviewApi>({}),
        });

        expect(
            chip.element.style.getPropertyValue('--dv-tab-group-color')
        ).toBe('#abc123');
    });

    test('palette disabled removes accent var and adds accent-off class', () => {
        const chip = new TabGroupChip(createPalette(false));
        const tabGroup = new TabGroup('tg-1', { color: 'blue' });

        chip.init({
            tabGroup,
            api: fromPartial<DockviewApi>({}),
        });

        expect(
            chip.element.style.getPropertyValue('--dv-tab-group-color')
        ).toBe('');
        expect(
            chip.element.classList.contains('dv-tab-group-chip--accent-off')
        ).toBe(true);
    });

    test('updates label when tab group label changes', () => {
        const chip = new TabGroupChip(createPalette());
        const tabGroup = new TabGroup('tg-1', {
            label: 'Old',
            color: 'grey',
        });

        chip.init({
            tabGroup,
            api: fromPartial<DockviewApi>({}),
        });

        const label = chip.element.querySelector('.dv-tab-group-chip-label');
        expect(label!.textContent).toBe('Old');

        tabGroup.setLabel('New');

        expect(label!.textContent).toBe('New');
    });

    test('toggles collapsed class when collapse state changes', () => {
        const chip = new TabGroupChip(createPalette());
        const tabGroup = new TabGroup('tg-1', {
            label: 'Test',
            color: 'grey',
        });

        chip.init({
            tabGroup,
            api: fromPartial<DockviewApi>({}),
        });

        expect(
            chip.element.classList.contains('dv-tab-group-chip--collapsed')
        ).toBe(false);

        tabGroup.collapse();

        expect(
            chip.element.classList.contains('dv-tab-group-chip--collapsed')
        ).toBe(true);

        tabGroup.expand();

        expect(
            chip.element.classList.contains('dv-tab-group-chip--collapsed')
        ).toBe(false);
    });

    test('clicking the chip toggles collapse state', () => {
        const chip = new TabGroupChip(createPalette());
        const tabGroup = new TabGroup('tg-1', {
            label: 'Test',
            color: 'grey',
        });

        chip.init({
            tabGroup,
            api: fromPartial<DockviewApi>({}),
        });

        expect(tabGroup.collapsed).toBe(false);

        fireEvent.click(chip.element);
        expect(tabGroup.collapsed).toBe(true);

        fireEvent.click(chip.element);
        expect(tabGroup.collapsed).toBe(false);
    });

    test('fires onContextMenu event on right-click', () => {
        const chip = new TabGroupChip(createPalette());
        const handler = jest.fn();
        chip.onContextMenu(handler);

        fireEvent.contextMenu(chip.element);

        expect(handler).toHaveBeenCalledTimes(1);
    });

    // Chip drag-start wiring moved to TabGroupManager; integration tests
    // in tabsAnimation.spec.ts cover the chip → manager → tabs.ts flow.

    test('dragstart does not add dv-tab-group-chip--dragging class', () => {
        const chip = new TabGroupChip(createPalette());

        fireEvent.dragStart(chip.element);

        // Class management is handled by Tabs, not the chip itself
        expect(
            chip.element.classList.contains('dv-tab-group-chip--dragging')
        ).toBe(false);
    });

    test('all default palette colors resolve to their CSS var', () => {
        const palette = createPalette();
        const chip = new TabGroupChip(palette);
        const tabGroup = new TabGroup('tg-1', {
            label: 'Test',
            color: 'blue',
        });

        chip.init({
            tabGroup,
            api: fromPartial<DockviewApi>({}),
        });

        for (const entry of DEFAULT_TAB_GROUP_COLORS) {
            tabGroup.setColor(entry.id);

            expect(
                chip.element.style.getPropertyValue('--dv-tab-group-color')
            ).toBe(entry.value);
        }
    });

    test('update method refreshes all properties', () => {
        const chip = new TabGroupChip(createPalette());
        const tabGroup1 = new TabGroup('tg-1', {
            label: 'First',
            color: 'blue',
        });

        chip.init({
            tabGroup: tabGroup1,
            api: fromPartial<DockviewApi>({}),
        });

        const tabGroup2 = new TabGroup('tg-2', {
            label: 'Second',
            color: 'purple',
        });
        tabGroup2.collapse();

        chip.update({ tabGroup: tabGroup2 });

        const label = chip.element.querySelector('.dv-tab-group-chip-label');
        expect(label!.textContent).toBe('Second');
        expect(
            chip.element.style.getPropertyValue('--dv-tab-group-color')
        ).toBe('var(--dv-tab-group-color-purple)');
        expect(
            chip.element.classList.contains('dv-tab-group-chip--collapsed')
        ).toBe(true);
    });

    test('dispose does not throw', () => {
        const chip = new TabGroupChip(createPalette());
        const tabGroup = new TabGroup('tg-1', {
            label: 'Test',
            color: 'grey',
        });

        chip.init({
            tabGroup,
            api: fromPartial<DockviewApi>({}),
        });

        expect(() => chip.dispose()).not.toThrow();
    });

    test('dispose before init does not throw', () => {
        const chip = new TabGroupChip(createPalette());
        expect(() => chip.dispose()).not.toThrow();
    });
});
