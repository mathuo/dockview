import { addClasses } from '../dom';

export function addGhostImage(
    dataTransfer: DataTransfer,
    ghostElement: HTMLElement
): void {
    // class dockview provides to force ghost image to be drawn on a different layer and prevent weird rendering issues
    addClasses(ghostElement, 'dv-dragged');

    document.body.appendChild(ghostElement);
    dataTransfer.setDragImage(ghostElement, 0, 0);

    setTimeout(() => {
        ghostElement.remove();
    }, 0);
}
