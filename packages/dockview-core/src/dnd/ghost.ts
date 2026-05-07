import { addClasses, removeClasses } from '../dom';

export function addGhostImage(
    dataTransfer: DataTransfer,
    ghostElement: HTMLElement,
    options?: { x?: number; y?: number }
): void {
    // class dockview provides to force ghost image to be drawn on a different layer and prevent weird rendering issues
    addClasses(ghostElement, 'dv-dragged');

    // move the element off-screen initially otherwise it may in some cases be rendered at (0,0) momentarily
    ghostElement.style.top = '-9999px';

    document.body.appendChild(ghostElement);
    dataTransfer.setDragImage(ghostElement, options?.x ?? 0, options?.y ?? 0);

    setTimeout(() => {
        removeClasses(ghostElement, 'dv-dragged');
        ghostElement.remove();
    }, 0);
}
