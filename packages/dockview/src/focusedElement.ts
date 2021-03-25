export const focusedElement: { element: Element | null } = { element: null };

//TODO somebody could call .stopPropagation() on this - can you do this at the event capture-stage instead?
window.addEventListener('focusin', () => {
    focusedElement.element = document.activeElement;
});

focusedElement.element = document.activeElement;
