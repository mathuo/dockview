import { fireEvent } from '@testing-library/dom';
import { TabGroupChip } from '../../../../dockview/components/titlebar/tabGroupChip';
import {
    TabGroup,
    DockviewTabGroupColors,
    resolveTabGroupAccent,
} from '../../../../dockview/tabGroup';
import { fromPartial } from '@total-typescript/shoehorn';
import { DockviewApi } from '../../../../api/component.api';

function paramsFor(tabGroup: TabGroup) {
    return {
        tabGroup,
        api: fromPartial<DockviewApi>({}),
        accent: resolveTabGroupAccent(tabGroup.color),
        componentParams: tabGroup.componentParams,
    };
}

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

    test('init sets label and accent', () => {
        const chip = new TabGroupChip();
        const tabGroup = new TabGroup('tg-1', {
            label: 'Feature',
            color: 'blue',
        });

        chip.init(paramsFor(tabGroup));

        const label = chip.element.querySelector('.dv-tab-group-chip-label');
        expect(label!.textContent).toBe('Feature');
        expect(
            chip.element.classList.contains('dv-tab-group-chip--accent')
        ).toBe(true);
        expect(chip.element.style.getPropertyValue('--dv-tab-group-color')).toBe(
            'var(--dv-tab-group-color-blue)'
        );
    });

    test('init with empty label adds empty class', () => {
        const chip = new TabGroupChip();
        const tabGroup = new TabGroup('tg-1', { color: 'red' });

        chip.init(paramsFor(tabGroup));

        const label = chip.element.querySelector('.dv-tab-group-chip-label');
        expect(
            label!.classList.contains('dv-tab-group-chip-label--empty')
        ).toBe(true);
    });

    test('init applies collapsed class when group is collapsed', () => {
        const chip = new TabGroupChip();
        const tabGroup = new TabGroup('tg-1', { color: 'green' });
        tabGroup.collapse();

        chip.init(paramsFor(tabGroup));

        expect(
            chip.element.classList.contains('dv-tab-group-chip--collapsed')
        ).toBe(true);
    });

    test('updates accent when tab group color changes', () => {
        const chip = new TabGroupChip();
        const tabGroup = new TabGroup('tg-1', {
            label: 'Test',
            color: 'blue',
        });

        chip.init(paramsFor(tabGroup));

        expect(chip.element.style.getPropertyValue('--dv-tab-group-color')).toBe(
            'var(--dv-tab-group-color-blue)'
        );

        tabGroup.setColor('red');

        expect(chip.element.style.getPropertyValue('--dv-tab-group-color')).toBe(
            'var(--dv-tab-group-color-red)'
        );
        expect(
            chip.element.classList.contains('dv-tab-group-chip--accent')
        ).toBe(true);
    });

    test('accepts arbitrary CSS colour values', () => {
        const chip = new TabGroupChip();
        const tabGroup = new TabGroup('tg-1', {
            label: 'Custom',
            color: '#ff0080',
        });

        chip.init(paramsFor(tabGroup));

        expect(chip.element.style.getPropertyValue('--dv-tab-group-color')).toBe(
            '#ff0080'
        );
        expect(
            chip.element.classList.contains('dv-tab-group-chip--accent')
        ).toBe(true);
    });

    test('clears accent when colour is undefined', () => {
        const chip = new TabGroupChip();
        const tabGroup = new TabGroup('tg-1', { color: 'blue' });

        chip.init(paramsFor(tabGroup));

        expect(
            chip.element.classList.contains('dv-tab-group-chip--accent')
        ).toBe(true);

        tabGroup.setColor(undefined);

        expect(
            chip.element.classList.contains('dv-tab-group-chip--accent')
        ).toBe(false);
        expect(chip.element.style.getPropertyValue('--dv-tab-group-color')).toBe(
            ''
        );
    });

    test('updates label when tab group label changes', () => {
        const chip = new TabGroupChip();
        const tabGroup = new TabGroup('tg-1', {
            label: 'Old',
            color: 'grey',
        });

        chip.init(paramsFor(tabGroup));

        const label = chip.element.querySelector('.dv-tab-group-chip-label');
        expect(label!.textContent).toBe('Old');

        tabGroup.setLabel('New');

        expect(label!.textContent).toBe('New');
    });

    test('toggles collapsed class when collapse state changes', () => {
        const chip = new TabGroupChip();
        const tabGroup = new TabGroup('tg-1', {
            label: 'Test',
            color: 'grey',
        });

        chip.init(paramsFor(tabGroup));

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

        chip.init(paramsFor(tabGroup));

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

    test('dragstart does not add dv-tab-group-chip--dragging class', () => {
        const chip = new TabGroupChip();

        fireEvent.dragStart(chip.element);

        // Class management is handled by Tabs, not the chip itself
        expect(
            chip.element.classList.contains('dv-tab-group-chip--dragging')
        ).toBe(false);
    });

    test('every preset colour resolves to its CSS variable', () => {
        const chip = new TabGroupChip();
        const tabGroup = new TabGroup('tg-1', {
            label: 'Test',
            color: 'blue',
        });

        chip.init(paramsFor(tabGroup));

        for (const color of Object.values(DockviewTabGroupColors)) {
            tabGroup.setColor(color);

            expect(
                chip.element.style.getPropertyValue('--dv-tab-group-color')
            ).toBe(`var(--dv-tab-group-color-${color})`);
            expect(
                chip.element.classList.contains('dv-tab-group-chip--accent')
            ).toBe(true);
        }
    });

    test('update method refreshes all properties', () => {
        const chip = new TabGroupChip();
        const tabGroup1 = new TabGroup('tg-1', {
            label: 'First',
            color: 'blue',
        });

        chip.init(paramsFor(tabGroup1));

        const tabGroup2 = new TabGroup('tg-2', {
            label: 'Second',
            color: 'purple',
        });
        tabGroup2.collapse();

        chip.update(paramsFor(tabGroup2));

        const label = chip.element.querySelector('.dv-tab-group-chip-label');
        expect(label!.textContent).toBe('Second');
        expect(chip.element.style.getPropertyValue('--dv-tab-group-color')).toBe(
            'var(--dv-tab-group-color-purple)'
        );
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

        chip.init(paramsFor(tabGroup));

        expect(() => chip.dispose()).not.toThrow();
    });

    test('dispose before init does not throw', () => {
        const chip = new TabGroupChip();
        expect(() => chip.dispose()).not.toThrow();
    });
});
