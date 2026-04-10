import { DockviewComponent } from './dockviewComponent';
import { DockviewGroupPanel } from './dockviewGroupPanel';
import { IDockviewPanel } from './dockviewPanel';
import {
    BuiltInChipContextMenuItem,
    ContextMenuItemConfig,
    ContextMenuItem,
} from './options';
import { DockviewTabGroupColors, ITabGroup } from './tabGroup';

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
        e.stopPropagation();
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

function buildColorPicker(tabGroup: ITabGroup): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'dv-context-menu-color-picker';

    for (const color of Object.values(DockviewTabGroupColors)) {
        const swatch = document.createElement('div');
        swatch.className = `dv-context-menu-color-swatch dv-tab-group-chip--${color}`;
        if (tabGroup.color === color) {
            swatch.classList.add('dv-context-menu-color-swatch--selected');
        }
        swatch.addEventListener('click', () => {
            tabGroup.setColor(color);
        });
        wrapper.appendChild(swatch);
    }

    return wrapper;
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

        const close = () => this.accessor.popupService.close();
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

        this.accessor.popupService.openPopover(menuEl, {
            x: event.clientX,
            y: event.clientY,
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

        const close = () => this.accessor.popupService.close();
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

        this.accessor.popupService.openPopover(menuEl, {
            x: event.clientX,
            y: event.clientY,
        });
    }
}
