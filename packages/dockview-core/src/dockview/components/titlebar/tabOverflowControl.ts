import { createChevronRightButton } from '../../../svg';

export type DropdownElement = {
    element: HTMLElement;
    update: (params: { tabs: number }) => void;
    dispose?: () => void;
};

export function createDropdownElementHandle(): DropdownElement {
    const el = document.createElement('div');
    el.className = 'dv-tabs-overflow-dropdown-default';

    const text = document.createElement('span');
    text.textContent = ``;
    const icon = createChevronRightButton();
    el.appendChild(icon);
    el.appendChild(text);

    return {
        element: el,
        update: (params: { tabs: number }) => {
            text.textContent = `${params.tabs}`;
        },
    };
}
