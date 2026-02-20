import {
    FixedPanelView,
    IFixedPanelGroup,
    ShellManager,
    FixedPanelsConfig,
} from '../../dockview/dockviewShell';

function makeGroup(): IFixedPanelGroup & { layout: jest.Mock } {
    return {
        element: document.createElement('div'),
        layout: jest.fn(),
    };
}

describe('FixedPanelView', () => {
    describe('construction', () => {
        test('collapsedSize defaults to 35', () => {
            const group = makeGroup();
            const view = new FixedPanelView(
                { id: 'test' },
                group,
                'horizontal'
            );
            expect(view.collapsedSize).toBe(35);
        });

        test('expandedMinimumSize = collapsedSize + 50 when minimumSize not provided', () => {
            const group = makeGroup();
            const view = new FixedPanelView(
                { id: 'test', collapsedSize: 30 },
                group,
                'horizontal'
            );
            // minimumSize when not collapsed = expandedMinimumSize = 30 + 50 = 80
            expect(view.minimumSize).toBe(80);
        });

        test('expandedMinimumSize = provided minimumSize when given', () => {
            const group = makeGroup();
            const view = new FixedPanelView(
                { id: 'test', minimumSize: 100 },
                group,
                'horizontal'
            );
            expect(view.minimumSize).toBe(100);
        });

        test('lastExpandedSize defaults to 200 when initialSize not provided', () => {
            const group = makeGroup();
            const view = new FixedPanelView(
                { id: 'test' },
                group,
                'horizontal'
            );
            expect(view.lastExpandedSize).toBe(200);
        });

        test('lastExpandedSize = provided initialSize', () => {
            const group = makeGroup();
            const view = new FixedPanelView(
                { id: 'test', initialSize: 350 },
                group,
                'horizontal'
            );
            expect(view.lastExpandedSize).toBe(350);
        });

        test('adds dv-fixed-panel CSS class to group element', () => {
            const group = makeGroup();
            new FixedPanelView({ id: 'test' }, group, 'horizontal');
            expect(group.element.classList.contains('dv-fixed-panel')).toBe(
                true
            );
        });

        test('sets data-testid = dv-fixed-panel-<id>', () => {
            const group = makeGroup();
            new FixedPanelView({ id: 'my-panel' }, group, 'horizontal');
            expect(group.element.dataset.testid).toBe(
                'dv-fixed-panel-my-panel'
            );
        });
    });

    describe('minimumSize getter', () => {
        test('returns collapsedSize when collapsed', () => {
            const group = makeGroup();
            const view = new FixedPanelView(
                { id: 'test', collapsedSize: 40 },
                group,
                'horizontal'
            );
            view.setCollapsed(true);
            expect(view.minimumSize).toBe(40);
        });

        test('returns expandedMinimumSize when expanded', () => {
            const group = makeGroup();
            const view = new FixedPanelView(
                { id: 'test', collapsedSize: 40, minimumSize: 120 },
                group,
                'horizontal'
            );
            expect(view.minimumSize).toBe(120);
        });
    });

    describe('maximumSize getter', () => {
        test('returns collapsedSize when collapsed', () => {
            const group = makeGroup();
            const view = new FixedPanelView(
                { id: 'test', collapsedSize: 40 },
                group,
                'horizontal'
            );
            view.setCollapsed(true);
            expect(view.maximumSize).toBe(40);
        });

        test('returns Infinity when expanded and maximumSize not provided', () => {
            const group = makeGroup();
            const view = new FixedPanelView(
                { id: 'test' },
                group,
                'horizontal'
            );
            expect(view.maximumSize).toBe(Number.POSITIVE_INFINITY);
        });

        test('returns provided expandedMaximumSize when expanded', () => {
            const group = makeGroup();
            const view = new FixedPanelView(
                { id: 'test', maximumSize: 600 },
                group,
                'horizontal'
            );
            expect(view.maximumSize).toBe(600);
        });
    });

    describe('setCollapsed', () => {
        test('setCollapsed(true): isCollapsed becomes true and adds dv-fixed-collapsed class', () => {
            const group = makeGroup();
            const view = new FixedPanelView(
                { id: 'test' },
                group,
                'horizontal'
            );
            view.setCollapsed(true);
            expect(view.isCollapsed).toBe(true);
            expect(group.element.classList.contains('dv-fixed-collapsed')).toBe(
                true
            );
        });

        test('setCollapsed(false): isCollapsed becomes false and removes dv-fixed-collapsed class', () => {
            const group = makeGroup();
            const view = new FixedPanelView(
                { id: 'test' },
                group,
                'horizontal'
            );
            view.setCollapsed(true);
            view.setCollapsed(false);
            expect(view.isCollapsed).toBe(false);
            expect(group.element.classList.contains('dv-fixed-collapsed')).toBe(
                false
            );
        });

        test('setCollapsed(true) twice is a no-op on the second call', () => {
            const group = makeGroup();
            const view = new FixedPanelView(
                { id: 'test' },
                group,
                'horizontal'
            );
            view.setCollapsed(true);
            const afterFirst = view.isCollapsed;
            // Calling again with same value should not throw and state stays same
            view.setCollapsed(true);
            expect(view.isCollapsed).toBe(afterFirst);
        });
    });

    describe('layout', () => {
        test('horizontal: calls group.layout(size, orthogonalSize)', () => {
            const group = makeGroup();
            const view = new FixedPanelView(
                { id: 'test' },
                group,
                'horizontal'
            );
            view.layout(250, 800);
            expect(group.layout).toHaveBeenCalledWith(250, 800);
        });

        test('vertical: calls group.layout(orthogonalSize, size)', () => {
            const group = makeGroup();
            const view = new FixedPanelView({ id: 'test' }, group, 'vertical');
            view.layout(200, 900);
            // vertical: size=height, orthogonalSize=width → layout(width, height)
            expect(group.layout).toHaveBeenCalledWith(900, 200);
        });

        test('when not collapsed: updates lastExpandedSize', () => {
            const group = makeGroup();
            const view = new FixedPanelView(
                { id: 'test', initialSize: 200 },
                group,
                'horizontal'
            );
            view.layout(350, 800);
            expect(view.lastExpandedSize).toBe(350);
        });

        test('when collapsed: does NOT update lastExpandedSize', () => {
            const group = makeGroup();
            const view = new FixedPanelView(
                { id: 'test', initialSize: 200 },
                group,
                'horizontal'
            );
            view.setCollapsed(true);
            view.layout(35, 800);
            expect(view.lastExpandedSize).toBe(200);
        });
    });
});

describe('ShellManager', () => {
    let container: HTMLElement;
    let dockviewElement: HTMLElement;
    let layoutGrid: jest.Mock;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        dockviewElement = document.createElement('div');
        layoutGrid = jest.fn();
    });

    afterEach(() => {
        container.parentElement?.removeChild(container);
    });

    function makeShell(
        config: FixedPanelsConfig,
        groups: {
            top?: IFixedPanelGroup;
            bottom?: IFixedPanelGroup;
            left?: IFixedPanelGroup;
            right?: IFixedPanelGroup;
        } = {}
    ): ShellManager {
        return new ShellManager(
            container,
            dockviewElement,
            config,
            groups,
            layoutGrid
        );
    }

    describe('hasFixedPanel', () => {
        test('returns true for configured positions and false for others', () => {
            const shell = makeShell(
                { left: { id: 'left' } },
                { left: makeGroup() }
            );
            expect(shell.hasFixedPanel('left')).toBe(true);
            expect(shell.hasFixedPanel('right')).toBe(false);
            expect(shell.hasFixedPanel('top')).toBe(false);
            expect(shell.hasFixedPanel('bottom')).toBe(false);
            shell.dispose();
        });

        test('returns true for all four positions when all configured', () => {
            const shell = makeShell(
                {
                    left: { id: 'left' },
                    right: { id: 'right' },
                    top: { id: 'top' },
                    bottom: { id: 'bottom' },
                },
                {
                    left: makeGroup(),
                    right: makeGroup(),
                    top: makeGroup(),
                    bottom: makeGroup(),
                }
            );
            expect(shell.hasFixedPanel('left')).toBe(true);
            expect(shell.hasFixedPanel('right')).toBe(true);
            expect(shell.hasFixedPanel('top')).toBe(true);
            expect(shell.hasFixedPanel('bottom')).toBe(true);
            shell.dispose();
        });
    });

    describe('setFixedPanelVisible / isFixedPanelVisible', () => {
        test('left panel: visible by default, can be hidden and shown', () => {
            const shell = makeShell(
                { left: { id: 'left' } },
                { left: makeGroup() }
            );
            expect(shell.isFixedPanelVisible('left')).toBe(true);
            shell.setFixedPanelVisible('left', false);
            expect(shell.isFixedPanelVisible('left')).toBe(false);
            shell.setFixedPanelVisible('left', true);
            expect(shell.isFixedPanelVisible('left')).toBe(true);
            shell.dispose();
        });

        test('right panel: visible by default, can be hidden', () => {
            const shell = makeShell(
                { right: { id: 'right' } },
                { right: makeGroup() }
            );
            expect(shell.isFixedPanelVisible('right')).toBe(true);
            shell.setFixedPanelVisible('right', false);
            expect(shell.isFixedPanelVisible('right')).toBe(false);
            shell.dispose();
        });

        test('top panel: visible by default, can be hidden', () => {
            const shell = makeShell(
                { top: { id: 'top' } },
                { top: makeGroup() }
            );
            expect(shell.isFixedPanelVisible('top')).toBe(true);
            shell.setFixedPanelVisible('top', false);
            expect(shell.isFixedPanelVisible('top')).toBe(false);
            shell.dispose();
        });

        test('bottom panel: visible by default, can be hidden', () => {
            const shell = makeShell(
                { bottom: { id: 'bottom' } },
                { bottom: makeGroup() }
            );
            expect(shell.isFixedPanelVisible('bottom')).toBe(true);
            shell.setFixedPanelVisible('bottom', false);
            expect(shell.isFixedPanelVisible('bottom')).toBe(false);
            shell.dispose();
        });

        test('unconfigured position always returns false', () => {
            const shell = makeShell({}, {});
            expect(shell.isFixedPanelVisible('left')).toBe(false);
            expect(shell.isFixedPanelVisible('right')).toBe(false);
            expect(shell.isFixedPanelVisible('top')).toBe(false);
            expect(shell.isFixedPanelVisible('bottom')).toBe(false);
            shell.dispose();
        });
    });

    describe('setFixedPanelCollapsed / isFixedPanelCollapsed', () => {
        test('collapse and expand left panel', () => {
            const shell = makeShell(
                { left: { id: 'left' } },
                { left: makeGroup() }
            );
            expect(shell.isFixedPanelCollapsed('left')).toBe(false);
            shell.setFixedPanelCollapsed('left', true);
            expect(shell.isFixedPanelCollapsed('left')).toBe(true);
            shell.setFixedPanelCollapsed('left', false);
            expect(shell.isFixedPanelCollapsed('left')).toBe(false);
            shell.dispose();
        });

        test('collapse right panel', () => {
            const shell = makeShell(
                { right: { id: 'right' } },
                { right: makeGroup() }
            );
            shell.setFixedPanelCollapsed('right', true);
            expect(shell.isFixedPanelCollapsed('right')).toBe(true);
            shell.dispose();
        });

        test('collapse top panel', () => {
            const shell = makeShell(
                { top: { id: 'top' } },
                { top: makeGroup() }
            );
            shell.setFixedPanelCollapsed('top', true);
            expect(shell.isFixedPanelCollapsed('top')).toBe(true);
            shell.dispose();
        });

        test('collapse bottom panel', () => {
            const shell = makeShell(
                { bottom: { id: 'bottom' } },
                { bottom: makeGroup() }
            );
            shell.setFixedPanelCollapsed('bottom', true);
            expect(shell.isFixedPanelCollapsed('bottom')).toBe(true);
            shell.dispose();
        });

        test('collapse unconfigured position is a no-op', () => {
            const shell = makeShell({}, {});
            expect(() =>
                shell.setFixedPanelCollapsed('left', true)
            ).not.toThrow();
            expect(shell.isFixedPanelCollapsed('left')).toBe(false);
            shell.dispose();
        });
    });

    describe('toJSON', () => {
        test('includes visible: true and no collapsed field when not collapsed', () => {
            const shell = makeShell(
                { left: { id: 'left', initialSize: 250 } },
                { left: makeGroup() }
            );
            const json = shell.toJSON();
            expect(json.left).toBeDefined();
            expect(json.left!.visible).toBe(true);
            expect(json.left!.collapsed).toBeUndefined();
            shell.dispose();
        });

        test('collapsed field is true when collapsed', () => {
            const shell = makeShell(
                { left: { id: 'left', initialSize: 250 } },
                { left: makeGroup() }
            );
            shell.setFixedPanelCollapsed('left', true);
            const json = shell.toJSON();
            // collapsed flag should be set; avoid asserting pixel size (jsdom has no real layout)
            expect(json.left!.collapsed).toBe(true);
            expect(typeof json.left!.size).toBe('number');
            shell.dispose();
        });

        test('visible is false after hiding the panel', () => {
            const shell = makeShell(
                { left: { id: 'left' } },
                { left: makeGroup() }
            );
            shell.setFixedPanelVisible('left', false);
            const json = shell.toJSON();
            expect(json.left!.visible).toBe(false);
            shell.dispose();
        });

        test('unconfigured positions are absent from the result', () => {
            const shell = makeShell(
                { left: { id: 'left' } },
                { left: makeGroup() }
            );
            const json = shell.toJSON();
            expect(json.right).toBeUndefined();
            expect(json.top).toBeUndefined();
            expect(json.bottom).toBeUndefined();
            shell.dispose();
        });
    });

    describe('fromJSON', () => {
        test('restores hidden visibility state for left panel', () => {
            const shell = makeShell(
                { left: { id: 'left' } },
                { left: makeGroup() }
            );
            shell.fromJSON({ left: { size: 200, visible: false } });
            expect(shell.isFixedPanelVisible('left')).toBe(false);
            shell.dispose();
        });

        test('restores collapsed state for left panel', () => {
            const shell = makeShell(
                { left: { id: 'left' } },
                { left: makeGroup() }
            );
            shell.fromJSON({
                left: { size: 200, visible: true, collapsed: true },
            });
            expect(shell.isFixedPanelCollapsed('left')).toBe(true);
            shell.dispose();
        });

        test('restores hidden visibility state for right panel', () => {
            const shell = makeShell(
                { right: { id: 'right' } },
                { right: makeGroup() }
            );
            shell.fromJSON({ right: { size: 200, visible: false } });
            expect(shell.isFixedPanelVisible('right')).toBe(false);
            shell.dispose();
        });

        test('restores hidden visibility state for top panel', () => {
            const shell = makeShell(
                { top: { id: 'top' } },
                { top: makeGroup() }
            );
            shell.fromJSON({ top: { size: 200, visible: false } });
            expect(shell.isFixedPanelVisible('top')).toBe(false);
            shell.dispose();
        });

        test('restores hidden visibility state for bottom panel', () => {
            const shell = makeShell(
                { bottom: { id: 'bottom' } },
                { bottom: makeGroup() }
            );
            shell.fromJSON({ bottom: { size: 200, visible: false } });
            expect(shell.isFixedPanelVisible('bottom')).toBe(false);
            shell.dispose();
        });
    });

    describe('dispose', () => {
        test('removes the shell element from the container', () => {
            const shell = makeShell(
                { left: { id: 'left' } },
                { left: makeGroup() }
            );
            const shellEl = shell.element;
            expect(container.contains(shellEl)).toBe(true);
            shell.dispose();
            expect(container.contains(shellEl)).toBe(false);
        });
    });
});
