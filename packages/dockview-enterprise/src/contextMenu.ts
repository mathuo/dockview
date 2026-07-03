import { findRelativeZIndexParent } from 'dockview';
import { DockviewGroupPanel } from 'dockview';
import { IDockviewPanel } from 'dockview';
import {
    BuiltInChipContextMenuItem,
    ContextMenuItemConfig,
    ContextMenuItem,
} from 'dockview';
import { ITabGroup } from 'dockview';
import { TabGroupColorPalette } from 'dockview';
import { defineModule } from 'dockview';
import { IContextMenuHost, IContextMenuService } from 'dockview';

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

function isCoarsePrimaryInput(): boolean {
    if (globalThis.window === undefined || !globalThis.matchMedia) {
        return false;
    }
    const coarse = globalThis.matchMedia('(pointer: coarse)').matches;
    const fine = globalThis.matchMedia('(pointer: fine)').matches;
    return coarse && !fine;
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

    // Skip auto-focus on touch-primary devices: focusing the input pops the
    // on-screen keyboard, which fires `window resize`, which `PopupService`
    // listens to and uses to dismiss the popover — so the menu opens, the
    // keyboard appears, and the menu immediately closes before the user can
    // type. The user can still tap the input to focus it intentionally.
    if (!isCoarsePrimaryInput()) {
        requestAnimationFrame(() => {
            input.focus();
            input.select();
        });
    }

    return wrapper;
}

function buildColorPicker(
    tabGroup: ITabGroup,
    palette: TabGroupColorPalette
): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'dv-context-menu-color-picker';

    if (!palette.enabled) {
        // Opt-out: render no swatches. Returning a wrapper rather than null
        // keeps the call site simple; the wrapper is empty and visually inert.
        return wrapper;
    }

    for (const entry of palette.entries()) {
        const swatch = document.createElement('div');
        swatch.className = 'dv-context-menu-color-swatch';
        // Use a CSS custom property rather than setting `backgroundColor`
        // directly: the IDL setter validates the value against a color
        // grammar and rejects `var(...)` references in some environments
        // (notably jsdom; some browsers have historically had similar
        // quirks). The matching SCSS rule reads the var at use time.
        swatch.style.setProperty('--dv-tab-group-color', entry.value);
        if (entry.label) {
            swatch.title = entry.label;
        }
        if (tabGroup.color === entry.id) {
            swatch.classList.add('dv-context-menu-color-swatch--selected');
        }
        swatch.addEventListener('click', () => {
            tabGroup.setColor(entry.id);
        });
        wrapper.appendChild(swatch);
    }

    return wrapper;
}

export class ContextMenuController implements IContextMenuService {
    constructor(private readonly accessor: IContextMenuHost) {}

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
            } else if (item === 'pin') {
                menuEl.appendChild(
                    buildItem(
                        panel.api.isPinned ? 'Unpin tab' : 'Pin tab',
                        close,
                        () => panel.api.setPinned(!panel.api.isPinned)
                    )
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
                menuEl.appendChild(
                    buildColorPicker(
                        tabGroup,
                        this.accessor.tabGroupColorPalette
                    )
                );
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

export const ContextMenuModule = defineModule<
    'contextMenuService',
    IContextMenuHost
>({
    name: 'ContextMenu',
    serviceKey: 'contextMenuService',
    create: (host) => new ContextMenuController(host),
});
