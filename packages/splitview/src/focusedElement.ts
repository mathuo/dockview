export const focusedElement: { element: Element } = { element: undefined };

window.addEventListener('focusin', () => {
    focusedElement.element = document.activeElement;
    console.log('activeElementChanged', document.activeElement);
});

focusedElement.element = document.activeElement;
