import {
    TabGroup,
    DockviewTabGroupColor,
    isValidTabGroupColor,
} from '../../dockview/tabGroup';

describe('TabGroup', () => {
    test('should create with default values', () => {
        const group = new TabGroup('g1');
        expect(group.id).toBe('g1');
        expect(group.label).toBe('');
        expect(group.color).toBe('grey');
        expect(group.collapsed).toBe(false);
        expect(group.panelIds).toEqual([]);
        expect(group.size).toBe(0);
        expect(group.isEmpty).toBe(true);
        group.dispose();
    });

    test('should create with options', () => {
        const group = new TabGroup('g2', { label: 'Frontend', color: 'blue' });
        expect(group.label).toBe('Frontend');
        expect(group.color).toBe('blue');
        group.dispose();
    });

    test('should default invalid color to grey', () => {
        const group = new TabGroup('g3', {
            color: 'invalid' as DockviewTabGroupColor,
        });
        expect(group.color).toBe('grey');
        group.dispose();
    });

    test('should add panel at end', () => {
        const group = new TabGroup('g1');
        group.addPanel('p1');
        group.addPanel('p2');
        expect(group.panelIds).toEqual(['p1', 'p2']);
        expect(group.size).toBe(2);
        expect(group.isEmpty).toBe(false);
        group.dispose();
    });

    test('should add panel at specific index', () => {
        const group = new TabGroup('g1');
        group.addPanel('p1');
        group.addPanel('p2');
        group.addPanel('p3', 1);
        expect(group.panelIds).toEqual(['p1', 'p3', 'p2']);
        group.dispose();
    });

    test('should clamp add index to valid range', () => {
        const group = new TabGroup('g1');
        group.addPanel('p1');
        group.addPanel('p2', -5);
        expect(group.panelIds).toEqual(['p2', 'p1']);
        group.addPanel('p3', 100);
        expect(group.panelIds).toEqual(['p2', 'p1', 'p3']);
        group.dispose();
    });

    test('should not add duplicate panel', () => {
        const group = new TabGroup('g1');
        group.addPanel('p1');
        group.addPanel('p1');
        expect(group.panelIds).toEqual(['p1']);
        group.dispose();
    });

    test('should remove panel', () => {
        const group = new TabGroup('g1');
        group.addPanel('p1');
        group.addPanel('p2');
        const removed = group.removePanel('p1');
        expect(removed).toBe(true);
        expect(group.panelIds).toEqual(['p2']);
        group.dispose();
    });

    test('should return false when removing non-existent panel', () => {
        const group = new TabGroup('g1');
        const removed = group.removePanel('non-existent');
        expect(removed).toBe(false);
        group.dispose();
    });

    test('should find panel index', () => {
        const group = new TabGroup('g1');
        group.addPanel('p1');
        group.addPanel('p2');
        expect(group.indexOfPanel('p1')).toBe(0);
        expect(group.indexOfPanel('p2')).toBe(1);
        expect(group.indexOfPanel('p3')).toBe(-1);
        group.dispose();
    });

    test('should check if panel is contained', () => {
        const group = new TabGroup('g1');
        group.addPanel('p1');
        expect(group.containsPanel('p1')).toBe(true);
        expect(group.containsPanel('p2')).toBe(false);
        group.dispose();
    });

    test('should collapse and expand', () => {
        const group = new TabGroup('g1');
        expect(group.collapsed).toBe(false);

        group.collapse();
        expect(group.collapsed).toBe(true);

        // Collapsing when already collapsed is a no-op
        group.collapse();
        expect(group.collapsed).toBe(true);

        group.expand();
        expect(group.collapsed).toBe(false);

        // Expanding when already expanded is a no-op
        group.expand();
        expect(group.collapsed).toBe(false);

        group.dispose();
    });

    test('should toggle collapsed state', () => {
        const group = new TabGroup('g1');
        group.toggle();
        expect(group.collapsed).toBe(true);
        group.toggle();
        expect(group.collapsed).toBe(false);
        group.dispose();
    });

    test('should fire onDidChange when label changes', () => {
        const group = new TabGroup('g1');
        const changes: void[] = [];
        group.onDidChange(() => changes.push(undefined));
        group.setLabel('New Label');
        expect(changes.length).toBe(1);
        // Setting same label should not fire
        group.setLabel('New Label');
        expect(changes.length).toBe(1);
        group.dispose();
    });

    test('should fire onDidChange when color changes', () => {
        const group = new TabGroup('g1');
        const changes: void[] = [];
        group.onDidChange(() => changes.push(undefined));
        group.setColor('blue');
        expect(changes.length).toBe(1);
        // Setting same color should not fire
        group.setColor('blue');
        expect(changes.length).toBe(1);
        group.dispose();
    });

    test('should default to grey on invalid color set', () => {
        const group = new TabGroup('g1', { color: 'blue' });
        group.setColor('invalid' as DockviewTabGroupColor);
        expect(group.color).toBe('grey');
        group.dispose();
    });

    test('should fire onDidPanelChange on add', () => {
        const group = new TabGroup('g1');
        const events: { panelId: string; type: 'add' | 'remove' }[] = [];
        group.onDidPanelChange((e) => events.push(e));
        group.addPanel('p1');
        expect(events).toEqual([{ panelId: 'p1', type: 'add' }]);
        group.dispose();
    });

    test('should fire onDidPanelChange on remove', () => {
        const group = new TabGroup('g1');
        group.addPanel('p1');
        const events: { panelId: string; type: 'add' | 'remove' }[] = [];
        group.onDidPanelChange((e) => events.push(e));
        group.removePanel('p1');
        expect(events).toEqual([{ panelId: 'p1', type: 'remove' }]);
        group.dispose();
    });

    test('should fire onDidCollapseChange', () => {
        const group = new TabGroup('g1');
        const events: boolean[] = [];
        group.onDidCollapseChange((collapsed) => events.push(collapsed));
        group.collapse();
        group.expand();
        group.toggle();
        expect(events).toEqual([true, false, true]);
        group.dispose();
    });

    test('should serialize to JSON', () => {
        const group = new TabGroup('g1', { label: 'Test', color: 'red' });
        group.addPanel('p1');
        group.addPanel('p2');
        group.collapse();
        const json = group.toJSON();
        expect(json).toEqual({
            id: 'g1',
            label: 'Test',
            color: 'red',
            collapsed: true,
            panelIds: ['p1', 'p2'],
        });
        group.dispose();
    });

    test('should omit label from JSON when empty', () => {
        const group = new TabGroup('g1');
        const json = group.toJSON();
        expect(json.label).toBeUndefined();
        group.dispose();
    });

    test('should fire onDidDestroy when disposed', () => {
        const group = new TabGroup('g1');
        let destroyed = false;
        group.onDidDestroy(() => {
            destroyed = true;
        });
        group.dispose();
        expect(destroyed).toBe(true);
    });
});

describe('isValidTabGroupColor', () => {
    test('should validate all valid colors', () => {
        const validColors = [
            'grey',
            'blue',
            'red',
            'yellow',
            'green',
            'pink',
            'purple',
            'cyan',
        ];
        for (const color of validColors) {
            expect(isValidTabGroupColor(color)).toBe(true);
        }
    });

    test('should reject invalid colors', () => {
        expect(isValidTabGroupColor('')).toBe(false);
        expect(isValidTabGroupColor('invalid')).toBe(false);
        expect(isValidTabGroupColor('orange')).toBe(true);
    });
});
