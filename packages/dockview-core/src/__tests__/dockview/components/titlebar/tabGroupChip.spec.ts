import { fireEvent } from '@testing-library/dom';
import { TabGroupChip } from '../../../../dockview/components/titlebar/tabGroupChip';
import { TabGroup, TAB_GROUP_COLORS } from '../../../../dockview/tabGroup';
import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewApi } from '../../../../api/component.api';

describe('TabGroupChip', () => {
    test('creates element with correct class', () => {
        const chip = new TabGroupChip();

        expect(chip.element.className).toBe('dv-tab-group-chip');
        expect(chip.element.tabIndex).toBe(0);
        expect(chip.element.draggable).toBe(true);
    });

    test('element contains a label span', () => {
        const chip = new TabGroupChip();

        const label = chip.element.querySelector('.dv-tab-group-chip-label');
        expect(label).toBeTruthy();
    });

    test('init sets label and color', () => {
        const chip = new TabGroupChip();
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
            chip.element.classList.contains('dv-tab-group-chip--blue')
        ).toBe(true);
    });

    test('init with empty label adds empty class', () => {
        const chip = new TabGroupChip();
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
        const chip = new TabGroupChip();
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
        const chip = new TabGroupChip();
        const tabGroup = new TabGroup('tg-1', {
            label: 'Test',
            color: 'blue',
        });

        chip.init({
            tabGroup,
            api: fromPartial<DockviewApi>({}),
        });

        expect(
            chip.element.classList.contains('dv-tab-group-chip--blue')
        ).toBe(true);

        tabGroup.color = 'red';

        expect(
            chip.element.classList.contains('dv-tab-group-chip--red')
        ).toBe(true);
        expect(
            chip.element.classList.contains('dv-tab-group-chip--blue')
        ).toBe(false);
    });

    test('updates label when tab group label changes', () => {
        const chip = new TabGroupChip();
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

        tabGroup.label = 'New';

        expect(label!.textContent).toBe('New');
    });

    test('toggles collapsed class when collapse state changes', () => {
        const chip = new TabGroupChip();
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
        const chip = new TabGroupChip();
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
        const chip = new TabGroupChip();
        const handler = jest.fn();
        chip.onContextMenu(handler);

        fireEvent.contextMenu(chip.element);

        expect(handler).toHaveBeenCalledTimes(1);
    });

    test('fires onDragStart event', () => {
        const chip = new TabGroupChip();
        const handler = jest.fn();
        chip.onDragStart(handler);

        fireEvent.dragStart(chip.element);

        expect(handler).toHaveBeenCalledTimes(1);
    });

    test('only one color class is active at a time', () => {
        const chip = new TabGroupChip();
        const tabGroup = new TabGroup('tg-1', {
            label: 'Test',
            color: 'blue',
        });

        chip.init({
            tabGroup,
            api: fromPartial<DockviewApi>({}),
        });

        for (const color of TAB_GROUP_COLORS) {
            tabGroup.color = color;

            for (const c of TAB_GROUP_COLORS) {
                expect(
                    chip.element.classList.contains(`dv-tab-group-chip--${c}`)
                ).toBe(c === color);
            }
        }
    });

    test('update method refreshes all properties', () => {
        const chip = new TabGroupChip();
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
            chip.element.classList.contains('dv-tab-group-chip--purple')
        ).toBe(true);
        expect(
            chip.element.classList.contains('dv-tab-group-chip--collapsed')
        ).toBe(true);
    });

    test('dispose does not throw', () => {
        const chip = new TabGroupChip();
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
        const chip = new TabGroupChip();
        expect(() => chip.dispose()).not.toThrow();
    });
});
