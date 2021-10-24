export const focusedElement: { element: Element | null } = { element: null };

window.addEventListener(
    'focusin',
    () => {
        focusedElement.element = document.activeElement;
    },
    true
);

focusedElement.element = document.activeElement;
