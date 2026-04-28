import { findRelativeZIndexParent } from '../dom';
import { DockviewComponent } from './dockviewComponent';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { IDockviewPanel } from './dockviewPanel';
import {
    BuiltInChipContextMenuItem,
    ColorPickerConfig,
    ContextMenuItemConfig,
    ContextMenuItem,
} from './options';
import {
    DockviewTabGroupColors,
    ITabGroup,
    resolveTabGroupAccent,
} from './tabGroup';

function popoverZIndexFor(target: EventTarget | null): string | undefined {
    if (!(target instanceof HTMLElement)) {
        return undefined;
    }
    // Floating overlays live in the shell as siblings of the popover anchor
    // and the AriaLevelTracker sets their inline z-index. Without this, a
    // popover opened from inside a floating group would render behind it
    // because they share the shell stacking context.
    const relativeParent = findRelativeZIndexParent(target);
    return relativeParent?.style.zIndex
        ? `calc(${relativeParent.style.zIndex} * 2)`
        : undefined;
}

let _nextId = 0;
const nextContextMenuItemId = () => `dv-ctx-menu-item-${_nextId++}`;

function isItemConfig(
    item: BuiltInChipContextMenuItem | ContextMenuItemConfig | ContextMenuItem
): item is ContextMenuItemConfig {
    return typeof item === 'object';
}

function buildItem(
    label: string,
    close: () => void,
    action: () => void,
    disabled?: boolean
): HTMLElement {
    const el = document.createElement('div');
    el.className = 'dv-context-menu-item';
    el.setAttribute('role', 'menuitem');
    if (disabled) {
        el.classList.add('dv-context-menu-item--disabled');
        el.setAttribute('aria-disabled', 'true');
    }
    el.textContent = label;
    if (!disabled) {
        el.addEventListener('click', () => {
            action();
            close();
        });
    }
    return el;
}

function buildSeparator(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'dv-context-menu-separator';
    el.setAttribute('role', 'separator');
    return el;
}

function buildRenameInput(tabGroup: ITabGroup): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'dv-context-menu-rename';

    const input = document.createElement('input');
    input.className = 'dv-context-menu-rename-input';
    input.type = 'text';
    input.placeholder = 'Name This Group';
    input.value = tabGroup.label;
    input.addEventListener('input', () => {
        tabGroup.setLabel(input.value);
    });
    input.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' && e.key !== 'Enter') {
            e.stopPropagation();
        }
    });
    input.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    wrapper.appendChild(input);

    requestAnimationFrame(() => {
        input.focus();
        input.select();
    });

    return wrapper;
}

const DEFAULT_PALETTE: readonly string[] = Object.freeze(
    Object.values(DockviewTabGroupColors)
);

function buildColorPicker(
    tabGroup: ITabGroup,
    config?: ColorPickerConfig
): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'dv-context-menu-color-picker';

    const palette = config?.palette ?? DEFAULT_PALETTE;
    const allowCustom = config?.allowCustom ?? false;
    const allowClear = config?.allowClear ?? false;

    for (const color of palette) {
        const swatch = document.createElement('div');
        swatch.className = 'dv-context-menu-color-swatch';
        const accent = resolveTabGroupAccent(color);
        if (accent) {
            swatch.style.backgroundColor = accent;
        }
        if (tabGroup.color === color) {
            swatch.classList.add('dv-context-menu-color-swatch--selected');
        }
        swatch.addEventListener('click', () => {
            tabGroup.setColor(color);
        });
        wrapper.appendChild(swatch);
    }

    if (allowClear) {
        const clear = document.createElement('div');
        clear.className =
            'dv-context-menu-color-swatch dv-context-menu-color-swatch--clear';
        if (tabGroup.color === undefined) {
            clear.classList.add('dv-context-menu-color-swatch--selected');
        }
        clear.addEventListener('click', () => {
            tabGroup.setColor(undefined);
        });
        wrapper.appendChild(clear);
    }

    if (allowCustom) {
        const custom = document.createElement('label');
        custom.className =
            'dv-context-menu-color-swatch dv-context-menu-color-swatch--custom';
        const input = document.createElement('input');
        input.type = 'color';
        input.className = 'dv-context-menu-color-swatch-input';
        if (tabGroup.color && !palette.includes(tabGroup.color)) {
            const accent = resolveTabGroupAccent(tabGroup.color);
            if (accent) {
                custom.style.backgroundColor = accent;
            }
            custom.classList.add('dv-context-menu-color-swatch--selected');
        }
        input.addEventListener('input', () => {
            tabGroup.setColor(input.value);
            custom.style.backgroundColor = input.value;
        });
        custom.appendChild(input);
        wrapper.appendChild(custom);
    }

    return wrapper;
}

function isColorPickerConfig(
    item: BuiltInChipContextMenuItem | ContextMenuItemConfig | ColorPickerConfig
): item is ColorPickerConfig {
    return (
        typeof item === 'object' &&
        (item as ColorPickerConfig).kind === 'colorPicker'
    );
}

export class ContextMenuController {
    constructor(private readonly accessor: DockviewComponent) {}

    show(
        panel: IDockviewPanel,
        group: DockviewGroupPanel,
        event: MouseEvent
    ): void {
        if (!this.accessor.options.getTabContextMenuItems) {
            return;
        }

        const items: ContextMenuItem[] =
            this.accessor.options.getTabContextMenuItems({
                panel,
                group,
                api: this.accessor.api,
                event,
            });

        if (items.length === 0) {
            return;
        }

        event.preventDefault();

        const popupService = this.accessor.getPopupServiceForGroup(group);
        const close = () => popupService.close();
        const menuEl = document.createElement('div');
        menuEl.className = 'dv-context-menu';
        menuEl.setAttribute('role', 'menu');

        for (const item of items) {
            if (item === 'separator') {
                menuEl.appendChild(buildSeparator());
            } else if (item === 'close') {
                menuEl.appendChild(
                    buildItem('Close', close, () => panel.api.close())
                );
            } else if (item === 'closeOthers') {
                menuEl.appendChild(
                    buildItem('Close Others', close, () => {
                        group.panels
                            .filter((p) => p !== panel)
                            .forEach((p) => p.api.close());
                    })
                );
            } else if (item === 'closeAll') {
                menuEl.appendChild(
                    buildItem('Close All', close, () => {
                        [...group.panels].forEach((p) => p.api.close());
                    })
                );
            } else if (isItemConfig(item) && item.element) {
                menuEl.appendChild(item.element);
            } else if (isItemConfig(item) && item.component) {
                const renderer =
                    this.accessor.options.createContextMenuItemComponent?.({
                        id: nextContextMenuItemId(),
                        component: item.component,
                    });
                if (renderer) {
                    renderer.init({
                        panel,
                        group,
                        api: this.accessor.api,
                        close,
                        componentProps: item.componentProps,
                    });
                    menuEl.appendChild(renderer.element);
                }
            } else if (isItemConfig(item) && item.label) {
                menuEl.appendChild(
                    buildItem(
                        item.label,
                        close,
                        () => item.action?.(),
                        item.disabled
                    )
                );
            }
        }

        popupService.openPopover(menuEl, {
            x: event.clientX,
            y: event.clientY,
            zIndex: popoverZIndexFor(event.target),
        });
    }

    showForChip(
        tabGroup: ITabGroup,
        group: DockviewGroupPanel,
        event: MouseEvent
    ): void {
        if (!this.accessor.options.getTabGroupChipContextMenuItems) {
            return;
        }

        const items = this.accessor.options.getTabGroupChipContextMenuItems({
            tabGroup,
            group,
            api: this.accessor.api,
            event,
        });

        if (items.length === 0) {
            return;
        }

        event.preventDefault();

        const popupService = this.accessor.getPopupServiceForGroup(group);
        const close = () => popupService.close();
        const menuEl = document.createElement('div');
        menuEl.className = 'dv-context-menu';
        menuEl.setAttribute('role', 'menu');

        for (const item of items) {
            if (item === 'separator') {
                menuEl.appendChild(buildSeparator());
            } else if (item === 'rename') {
                menuEl.appendChild(buildRenameInput(tabGroup));
            } else if (item === 'colorPicker') {
                menuEl.appendChild(buildColorPicker(tabGroup));
            } else if (isColorPickerConfig(item)) {
                menuEl.appendChild(buildColorPicker(tabGroup, item));
            } else if (isItemConfig(item) && item.element) {
                menuEl.appendChild(item.element);
            } else if (isItemConfig(item) && item.label) {
                menuEl.appendChild(
                    buildItem(
                        item.label,
                        close,
                        () => item.action?.(),
                        item.disabled
                    )
                );
            }
        }

        popupService.openPopover(menuEl, {
            x: event.clientX,
            y: event.clientY,
            zIndex: popoverZIndexFor(event.target),
        });
    }
}
