import { fireEvent } from '@testing-library/dom';
import { fromPartial } from '@total-typescript/shoehorn';
import { ContextMenuController } from '../contextMenu';
import { DockviewComponent } from 'dockview-core';
import { DockviewGroupPanel } from 'dockview-core';
import { IDockviewPanel } from 'dockview-core';
import { PopupService } from 'dockview-core';
import { DEFAULT_TAB_GROUP_COLORS, TabGroupColorPalette } from 'dockview-core';
import { ITabGroup } from 'dockview-core';

function makeAccessor(
    overrides: {
        getTabContextMenuItems?: jest.Mock;
        getTabGroupChipContextMenuItems?: jest.Mock;
        createContextMenuItemComponent?: jest.Mock;
    } = {}
) {
    const openPopover = jest.fn();
    const close = jest.fn();
    const popupService = fromPartial<PopupService>({ openPopover, close });

    const accessor = fromPartial<DockviewComponent>({
        options: {
            getTabContextMenuItems: overrides.getTabContextMenuItems,
            getTabGroupChipContextMenuItems:
                overrides.getTabGroupChipContextMenuItems,
            createContextMenuItemComponent:
                overrides.createContextMenuItemComponent,
        },
        api: {} as any,
        popupService,
        getPopupServiceForGroup: () => popupService,
    });

    return { accessor, openPopover, close };
}

function makePanel(closeFn = jest.fn()) {
    return fromPartial<IDockviewPanel>({ api: { close: closeFn } });
}

function makeGroup(panels: IDockviewPanel[] = []) {
    return fromPartial<DockviewGroupPanel>({ panels });
}

describe('ContextMenuController', () => {
    describe('show()', () => {
        test('calls event.preventDefault() when menu items are returned', () => {
            const { accessor } = makeAccessor({
                getTabContextMenuItems: jest.fn().mockReturnValue(['close']),
            });
            const controller = new ContextMenuController(accessor);
            const event = new MouseEvent('contextmenu', { cancelable: true });
            const spy = jest.spyOn(event, 'preventDefault');

            controller.show(makePanel(), makeGroup(), event);

            expect(spy).toHaveBeenCalled();
        });

        test('does not call event.preventDefault() when no callback provided', () => {
            const { accessor } = makeAccessor();
            const controller = new ContextMenuController(accessor);
            const event = new MouseEvent('contextmenu', { cancelable: true });
            const spy = jest.spyOn(event, 'preventDefault');

            controller.show(makePanel(), makeGroup(), event);

            expect(spy).not.toHaveBeenCalled();
        });

        test('does not call event.preventDefault() when callback returns empty array', () => {
            const { accessor } = makeAccessor({
                getTabContextMenuItems: jest.fn().mockReturnValue([]),
            });
            const controller = new ContextMenuController(accessor);
            const event = new MouseEvent('contextmenu', { cancelable: true });
            const spy = jest.spyOn(event, 'preventDefault');

            controller.show(makePanel(), makeGroup(), event);

            expect(spy).not.toHaveBeenCalled();
        });

        test('calls popupService.openPopover with correct coordinates', () => {
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest.fn().mockReturnValue(['close']),
            });
            const controller = new ContextMenuController(accessor);
            const event = new MouseEvent('contextmenu', {
                clientX: 150,
                clientY: 300,
            });

            controller.show(makePanel(), makeGroup(), event);

            expect(openPopover).toHaveBeenCalledWith(expect.any(HTMLElement), {
                x: 150,
                y: 300,
            });
        });

        test('does not call openPopover when getTabContextMenuItems returns empty array', () => {
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest.fn().mockReturnValue([]),
            });
            const controller = new ContextMenuController(accessor);

            controller.show(
                makePanel(),
                makeGroup(),
                new MouseEvent('contextmenu')
            );

            expect(openPopover).not.toHaveBeenCalled();
        });

        test('does not show menu when no callback provided', () => {
            const { accessor, openPopover } = makeAccessor();
            const controller = new ContextMenuController(accessor);

            controller.show(
                makePanel(),
                makeGroup(),
                new MouseEvent('contextmenu')
            );

            expect(openPopover).not.toHaveBeenCalled();
        });

        test('menu element has class dv-context-menu', () => {
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest.fn().mockReturnValue(['close']),
            });
            const controller = new ContextMenuController(accessor);

            controller.show(
                makePanel(),
                makeGroup(),
                new MouseEvent('contextmenu')
            );

            const menuEl = openPopover.mock.calls[0][0] as HTMLElement;
            expect(menuEl.className).toBe('dv-context-menu');
        });

        test('menu element has role="menu"', () => {
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest.fn().mockReturnValue(['close']),
            });
            const controller = new ContextMenuController(accessor);

            controller.show(
                makePanel(),
                makeGroup(),
                new MouseEvent('contextmenu')
            );

            const menuEl = openPopover.mock.calls[0][0] as HTMLElement;
            expect(menuEl.getAttribute('role')).toBe('menu');
        });
    });

    describe('popover z-index for floating groups', () => {
        // Floating overlays live in the shell as siblings of the popover anchor
        // and AriaLevelTracker sets their inline z-index. Without bumping the
        // popover above that, a context menu opened from inside a floating
        // group renders behind it (#1203 regression).
        function dispatchContextMenu(target: HTMLElement): MouseEvent {
            const event = new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
            });
            target.dispatchEvent(event);
            return event;
        }

        test('passes zIndex above the floating overlay when target is inside one', () => {
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest.fn().mockReturnValue(['close']),
            });
            const controller = new ContextMenuController(accessor);

            const floating = document.createElement('div');
            floating.style.zIndex = '1001'; // simulates AriaLevelTracker output
            const tab = document.createElement('div');
            floating.appendChild(tab);
            document.body.appendChild(floating);

            try {
                const event = dispatchContextMenu(tab);
                controller.show(makePanel(), makeGroup(), event);

                expect(openPopover).toHaveBeenCalledWith(
                    expect.any(HTMLElement),
                    expect.objectContaining({
                        zIndex: 'calc(1001 * 2)',
                    })
                );
            } finally {
                document.body.removeChild(floating);
            }
        });

        test('does not pass zIndex when target has no z-indexed ancestor', () => {
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest.fn().mockReturnValue(['close']),
            });
            const controller = new ContextMenuController(accessor);

            const tab = document.createElement('div');
            document.body.appendChild(tab);

            try {
                const event = dispatchContextMenu(tab);
                controller.show(makePanel(), makeGroup(), event);

                const args = openPopover.mock.calls[0][1];
                expect(args.zIndex).toBeUndefined();
            } finally {
                document.body.removeChild(tab);
            }
        });

        test('walks up multiple levels to find the z-indexed ancestor', () => {
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest.fn().mockReturnValue(['close']),
            });
            const controller = new ContextMenuController(accessor);

            const floating = document.createElement('div');
            floating.style.zIndex = '999';
            const group = document.createElement('div');
            const tabsContainer = document.createElement('div');
            const tab = document.createElement('div');
            floating.appendChild(group);
            group.appendChild(tabsContainer);
            tabsContainer.appendChild(tab);
            document.body.appendChild(floating);

            try {
                const event = dispatchContextMenu(tab);
                controller.show(makePanel(), makeGroup(), event);

                expect(openPopover).toHaveBeenCalledWith(
                    expect.any(HTMLElement),
                    expect.objectContaining({
                        zIndex: 'calc(999 * 2)',
                    })
                );
            } finally {
                document.body.removeChild(floating);
            }
        });

        test('uses the nearest z-indexed ancestor when several are stacked', () => {
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest.fn().mockReturnValue(['close']),
            });
            const controller = new ContextMenuController(accessor);

            const outer = document.createElement('div');
            outer.style.zIndex = '500';
            const inner = document.createElement('div');
            inner.style.zIndex = '1003';
            const tab = document.createElement('div');
            outer.appendChild(inner);
            inner.appendChild(tab);
            document.body.appendChild(outer);

            try {
                const event = dispatchContextMenu(tab);
                controller.show(makePanel(), makeGroup(), event);

                expect(openPopover).toHaveBeenCalledWith(
                    expect.any(HTMLElement),
                    expect.objectContaining({
                        zIndex: 'calc(1003 * 2)',
                    })
                );
            } finally {
                document.body.removeChild(outer);
            }
        });
    });

    describe('ARIA attributes', () => {
        test('built-in label items have role="menuitem"', () => {
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest
                    .fn()
                    .mockReturnValue(['close', 'closeOthers', 'closeAll']),
            });
            const controller = new ContextMenuController(accessor);

            controller.show(
                makePanel(),
                makeGroup([makePanel()]),
                new MouseEvent('contextmenu')
            );

            const menuEl = openPopover.mock.calls[0][0] as HTMLElement;
            const items = menuEl.querySelectorAll('.dv-context-menu-item');
            items.forEach((item) => {
                expect(item.getAttribute('role')).toBe('menuitem');
            });
        });

        test('separator has role="separator"', () => {
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest
                    .fn()
                    .mockReturnValue(['separator']),
            });
            const controller = new ContextMenuController(accessor);

            controller.show(
                makePanel(),
                makeGroup(),
                new MouseEvent('contextmenu')
            );

            const menuEl = openPopover.mock.calls[0][0] as HTMLElement;
            const sep = menuEl.querySelector('.dv-context-menu-separator')!;
            expect(sep.getAttribute('role')).toBe('separator');
        });

        test('disabled items have aria-disabled="true"', () => {
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest.fn().mockReturnValue([
                    {
                        label: 'Disabled',
                        action: jest.fn(),
                        disabled: true,
                    },
                ]),
            });
            const controller = new ContextMenuController(accessor);

            controller.show(
                makePanel(),
                makeGroup(),
                new MouseEvent('contextmenu')
            );

            const menuEl = openPopover.mock.calls[0][0] as HTMLElement;
            const item = menuEl.querySelector('.dv-context-menu-item')!;
            expect(item.getAttribute('aria-disabled')).toBe('true');
        });

        test('enabled items do not have aria-disabled', () => {
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest
                    .fn()
                    .mockReturnValue([{ label: 'Enabled', action: jest.fn() }]),
            });
            const controller = new ContextMenuController(accessor);

            controller.show(
                makePanel(),
                makeGroup(),
                new MouseEvent('contextmenu')
            );

            const menuEl = openPopover.mock.calls[0][0] as HTMLElement;
            const item = menuEl.querySelector('.dv-context-menu-item')!;
            expect(item.getAttribute('aria-disabled')).toBeNull();
        });
    });

    describe("built-in 'close' item", () => {
        test('calls panel.api.close() and closes popup on click', () => {
            const closePanelMock = jest.fn();
            const { accessor, openPopover, close } = makeAccessor({
                getTabContextMenuItems: jest.fn().mockReturnValue(['close']),
            });
            const controller = new ContextMenuController(accessor);

            controller.show(
                makePanel(closePanelMock),
                makeGroup(),
                new MouseEvent('contextmenu')
            );

            const menuEl = openPopover.mock.calls[0][0] as HTMLElement;
            fireEvent.click(menuEl.querySelector('.dv-context-menu-item')!);

            expect(closePanelMock).toHaveBeenCalled();
            expect(close).toHaveBeenCalled();
        });
    });

    describe("built-in 'closeOthers' item", () => {
        test('closes all panels except the target panel', () => {
            const close1 = jest.fn();
            const close2 = jest.fn();
            const close3 = jest.fn();

            const panel1 = makePanel(close1);
            const panel2 = makePanel(close2);
            const panel3 = makePanel(close3);

            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest
                    .fn()
                    .mockReturnValue(['closeOthers']),
            });
            const controller = new ContextMenuController(accessor);

            controller.show(
                panel2,
                makeGroup([panel1, panel2, panel3]),
                new MouseEvent('contextmenu')
            );

            const menuEl = openPopover.mock.calls[0][0] as HTMLElement;
            fireEvent.click(menuEl.querySelector('.dv-context-menu-item')!);

            expect(close1).toHaveBeenCalled();
            expect(close2).not.toHaveBeenCalled();
            expect(close3).toHaveBeenCalled();
        });
    });

    describe("built-in 'closeAll' item", () => {
        test('closes all panels in the group', () => {
            const close1 = jest.fn();
            const close2 = jest.fn();
            const close3 = jest.fn();

            const panel1 = makePanel(close1);
            const panel2 = makePanel(close2);
            const panel3 = makePanel(close3);

            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest.fn().mockReturnValue(['closeAll']),
            });
            const controller = new ContextMenuController(accessor);

            controller.show(
                panel1,
                makeGroup([panel1, panel2, panel3]),
                new MouseEvent('contextmenu')
            );

            const menuEl = openPopover.mock.calls[0][0] as HTMLElement;
            fireEvent.click(menuEl.querySelector('.dv-context-menu-item')!);

            expect(close1).toHaveBeenCalled();
            expect(close2).toHaveBeenCalled();
            expect(close3).toHaveBeenCalled();
        });
    });

    describe("built-in 'separator' item", () => {
        test('renders a separator element', () => {
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest
                    .fn()
                    .mockReturnValue(['separator']),
            });
            const controller = new ContextMenuController(accessor);

            controller.show(
                makePanel(),
                makeGroup(),
                new MouseEvent('contextmenu')
            );

            const menuEl = openPopover.mock.calls[0][0] as HTMLElement;
            expect(
                menuEl.querySelectorAll('.dv-context-menu-separator')
            ).toHaveLength(1);
            expect(
                menuEl.querySelectorAll('.dv-context-menu-item')
            ).toHaveLength(0);
        });
    });

    describe('custom label item', () => {
        test('renders label text and calls action on click', () => {
            const actionMock = jest.fn();
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest
                    .fn()
                    .mockReturnValue([
                        { label: 'My Action', action: actionMock },
                    ]),
            });
            const controller = new ContextMenuController(accessor);

            controller.show(
                makePanel(),
                makeGroup(),
                new MouseEvent('contextmenu')
            );

            const menuEl = openPopover.mock.calls[0][0] as HTMLElement;
            const item = menuEl.querySelector(
                '.dv-context-menu-item'
            ) as HTMLElement;
            expect(item.textContent).toBe('My Action');

            fireEvent.click(item);
            expect(actionMock).toHaveBeenCalled();
        });

        test('does not call action when disabled', () => {
            const actionMock = jest.fn();
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest.fn().mockReturnValue([
                    {
                        label: 'Disabled',
                        action: actionMock,
                        disabled: true,
                    },
                ]),
            });
            const controller = new ContextMenuController(accessor);

            controller.show(
                makePanel(),
                makeGroup(),
                new MouseEvent('contextmenu')
            );

            const menuEl = openPopover.mock.calls[0][0] as HTMLElement;
            const item = menuEl.querySelector(
                '.dv-context-menu-item'
            ) as HTMLElement;
            expect(
                item.classList.contains('dv-context-menu-item--disabled')
            ).toBe(true);
            fireEvent.click(item);
            expect(actionMock).not.toHaveBeenCalled();
        });
    });

    describe('custom component item', () => {
        test('calls createContextMenuItemComponent with the component reference', () => {
            const componentRef = { type: 'my-component' };
            const rendererElement = document.createElement('div');
            const initMock = jest.fn();
            const createContextMenuItemComponent = jest.fn().mockReturnValue({
                element: rendererElement,
                init: initMock,
                dispose: jest.fn(),
            });

            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest
                    .fn()
                    .mockReturnValue([{ component: componentRef }]),
                createContextMenuItemComponent,
            });
            const controller = new ContextMenuController(accessor);

            const panel = makePanel();
            const group = makeGroup();
            controller.show(panel, group, new MouseEvent('contextmenu'));

            expect(createContextMenuItemComponent).toHaveBeenCalledWith(
                expect.objectContaining({ component: componentRef })
            );
            expect(initMock).toHaveBeenCalledWith(
                expect.objectContaining({ panel, group })
            );

            const menuEl = openPopover.mock.calls[0][0] as HTMLElement;
            expect(menuEl.contains(rendererElement)).toBe(true);
        });

        test('init receives a close function that calls popupService.close()', () => {
            const initMock = jest.fn();
            const createContextMenuItemComponent = jest.fn().mockReturnValue({
                element: document.createElement('div'),
                init: initMock,
                dispose: jest.fn(),
            });

            const { accessor, close } = makeAccessor({
                getTabContextMenuItems: jest
                    .fn()
                    .mockReturnValue([{ component: {} }]),
                createContextMenuItemComponent,
            });
            const controller = new ContextMenuController(accessor);

            controller.show(
                makePanel(),
                makeGroup(),
                new MouseEvent('contextmenu')
            );

            const { close: closeFn } = initMock.mock.calls[0][0];
            closeFn();
            expect(close).toHaveBeenCalled();
        });

        test('forwards componentProps to renderer.init()', () => {
            const componentRef = { type: 'my-component' };
            const initMock = jest.fn();
            const createContextMenuItemComponent = jest.fn().mockReturnValue({
                element: document.createElement('div'),
                init: initMock,
                dispose: jest.fn(),
            });

            const { accessor } = makeAccessor({
                getTabContextMenuItems: jest.fn().mockReturnValue([
                    {
                        component: componentRef,
                        componentProps: { foo: 'bar' },
                    },
                ]),
                createContextMenuItemComponent,
            });
            const controller = new ContextMenuController(accessor);

            controller.show(
                makePanel(),
                makeGroup(),
                new MouseEvent('contextmenu')
            );

            expect(initMock).toHaveBeenCalledWith(
                expect.objectContaining({ componentProps: { foo: 'bar' } })
            );
        });

        test('skips item if createContextMenuItemComponent returns undefined', () => {
            const createContextMenuItemComponent = jest
                .fn()
                .mockReturnValue(undefined);
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest
                    .fn()
                    .mockReturnValue([{ component: {} }]),
                createContextMenuItemComponent,
            });
            const controller = new ContextMenuController(accessor);

            controller.show(
                makePanel(),
                makeGroup(),
                new MouseEvent('contextmenu')
            );

            const menuEl = openPopover.mock.calls[0][0] as HTMLElement;
            expect(menuEl.children).toHaveLength(0);
        });
    });

    describe('mixed item list', () => {
        test('renders items in order with correct types', () => {
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest
                    .fn()
                    .mockReturnValue([
                        'close',
                        'separator',
                        { label: 'Custom' },
                        'closeAll',
                    ]),
            });
            const controller = new ContextMenuController(accessor);

            controller.show(
                makePanel(),
                makeGroup(),
                new MouseEvent('contextmenu')
            );

            const menuEl = openPopover.mock.calls[0][0] as HTMLElement;
            expect(menuEl.children).toHaveLength(4);
            expect(menuEl.children[0].className).toBe('dv-context-menu-item');
            expect(menuEl.children[1].className).toBe(
                'dv-context-menu-separator'
            );
            expect(menuEl.children[2].className).toBe('dv-context-menu-item');
            expect(menuEl.children[3].className).toBe('dv-context-menu-item');
        });
    });

    describe('color picker', () => {
        function makeChipAccessor(palette: TabGroupColorPalette) {
            const openPopover = jest.fn();
            const close = jest.fn();
            const popupService = fromPartial<PopupService>({
                openPopover,
                close,
            });
            const accessor = fromPartial<DockviewComponent>({
                options: {
                    getTabGroupChipContextMenuItems: jest
                        .fn()
                        .mockReturnValue(['colorPicker']),
                },
                api: {} as any,
                popupService,
                getPopupServiceForGroup: () => popupService,
                tabGroupColorPalette: palette,
            });
            return { accessor, openPopover };
        }

        function getMenuEl(openPopover: jest.Mock): HTMLElement {
            const call = openPopover.mock.calls[0];
            return call[0] as HTMLElement;
        }

        test('renders one swatch per palette entry with backgroundColor set', () => {
            const palette = new TabGroupColorPalette(DEFAULT_TAB_GROUP_COLORS);
            const { accessor, openPopover } = makeChipAccessor(palette);
            const controller = new ContextMenuController(accessor);

            const tabGroup = fromPartial<ITabGroup>({
                color: 'blue',
                setColor: jest.fn(),
            });
            const event = new MouseEvent('contextmenu', { cancelable: true });
            controller.showForChip(tabGroup, makeGroup(), event);

            const menuEl = getMenuEl(openPopover);
            const picker = menuEl.querySelector(
                '.dv-context-menu-color-picker'
            )!;
            const swatches = picker.querySelectorAll(
                '.dv-context-menu-color-swatch'
            );
            expect(swatches.length).toBe(DEFAULT_TAB_GROUP_COLORS.length);

            const first = swatches[0] as HTMLElement;
            expect(first.style.getPropertyValue('--dv-tab-group-color')).toBe(
                DEFAULT_TAB_GROUP_COLORS[0].value
            );

            // The 'blue' swatch is the second entry in defaults; it should be
            // marked as selected.
            const blueIndex = DEFAULT_TAB_GROUP_COLORS.findIndex(
                (e) => e.id === 'blue'
            );
            expect(
                (swatches[blueIndex] as HTMLElement).classList.contains(
                    'dv-context-menu-color-swatch--selected'
                )
            ).toBe(true);
        });

        test('renders custom palette entries', () => {
            const palette = new TabGroupColorPalette([
                { id: 'brand', value: '#123456', label: 'Brand' },
                { id: 'accent', value: '#abcdef', label: 'Accent' },
            ]);
            const { accessor, openPopover } = makeChipAccessor(palette);
            const controller = new ContextMenuController(accessor);

            const tabGroup = fromPartial<ITabGroup>({
                color: 'brand',
                setColor: jest.fn(),
            });
            const event = new MouseEvent('contextmenu', { cancelable: true });
            controller.showForChip(tabGroup, makeGroup(), event);

            const menuEl = getMenuEl(openPopover);
            const swatches = menuEl.querySelectorAll(
                '.dv-context-menu-color-swatch'
            );
            expect(swatches.length).toBe(2);
            expect((swatches[0] as HTMLElement).title).toBe('Brand');
            expect(
                (swatches[0] as HTMLElement).style.getPropertyValue(
                    '--dv-tab-group-color'
                )
            ).toBe('#123456');
        });

        test('renders empty wrapper when palette is disabled', () => {
            const palette = new TabGroupColorPalette(
                DEFAULT_TAB_GROUP_COLORS,
                false
            );
            const { accessor, openPopover } = makeChipAccessor(palette);
            const controller = new ContextMenuController(accessor);

            const tabGroup = fromPartial<ITabGroup>({
                color: 'blue',
                setColor: jest.fn(),
            });
            const event = new MouseEvent('contextmenu', { cancelable: true });
            controller.showForChip(tabGroup, makeGroup(), event);

            const menuEl = getMenuEl(openPopover);
            const picker = menuEl.querySelector(
                '.dv-context-menu-color-picker'
            )!;
            expect(picker).toBeTruthy();
            expect(
                picker.querySelectorAll('.dv-context-menu-color-swatch').length
            ).toBe(0);
        });
    });

    describe('showForChip()', () => {
        test('passes zIndex above the floating overlay when chip is inside one', () => {
            const { accessor, openPopover } = makeAccessor({
                getTabGroupChipContextMenuItems: jest
                    .fn()
                    .mockReturnValue([{ label: 'Rename', action: jest.fn() }]),
            });
            const controller = new ContextMenuController(accessor);

            const floating = document.createElement('div');
            floating.style.zIndex = '1001';
            const chip = document.createElement('div');
            floating.appendChild(chip);
            document.body.appendChild(floating);

            try {
                const event = new MouseEvent('contextmenu', {
                    bubbles: true,
                    cancelable: true,
                });
                chip.dispatchEvent(event);

                controller.showForChip(fromPartial({}), makeGroup(), event);

                expect(openPopover).toHaveBeenCalledWith(
                    expect.any(HTMLElement),
                    expect.objectContaining({
                        zIndex: 'calc(1001 * 2)',
                    })
                );
            } finally {
                document.body.removeChild(floating);
            }
        });
    });

    describe("'pin' built-in item", () => {
        const pinPanel = (isPinned: boolean, setPinned = jest.fn()) =>
            fromPartial<IDockviewPanel>({
                api: { isPinned, setPinned, close: jest.fn() },
            });

        test('renders "Pin tab" and pins on click when unpinned', () => {
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest.fn().mockReturnValue(['pin']),
            });
            const controller = new ContextMenuController(accessor);
            const setPinned = jest.fn();

            controller.show(
                pinPanel(false, setPinned),
                makeGroup(),
                new MouseEvent('contextmenu', { cancelable: true })
            );

            const menuEl = openPopover.mock.calls[0][0] as HTMLElement;
            const item = menuEl.querySelector('.dv-context-menu-item')!;
            expect(item.textContent).toBe('Pin tab');

            fireEvent.click(item);
            expect(setPinned).toHaveBeenCalledWith(true);
        });

        test('renders "Unpin tab" and unpins on click when pinned', () => {
            const { accessor, openPopover } = makeAccessor({
                getTabContextMenuItems: jest.fn().mockReturnValue(['pin']),
            });
            const controller = new ContextMenuController(accessor);
            const setPinned = jest.fn();

            controller.show(
                pinPanel(true, setPinned),
                makeGroup(),
                new MouseEvent('contextmenu', { cancelable: true })
            );

            const menuEl = openPopover.mock.calls[0][0] as HTMLElement;
            const item = menuEl.querySelector('.dv-context-menu-item')!;
            expect(item.textContent).toBe('Unpin tab');

            fireEvent.click(item);
            expect(setPinned).toHaveBeenCalledWith(false);
        });
    });
});
