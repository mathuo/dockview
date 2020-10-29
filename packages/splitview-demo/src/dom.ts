export const toggleClass = (
    element: HTMLElement,
    className: string,
    isToggled: boolean
) => {
    const hasClass = element.classList.contains(className);
    if (isToggled && !hasClass) {
        element.classList.add(className);
    }
    if (!isToggled && hasClass) {
        element.classList.remove(className);
    }
};
