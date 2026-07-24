import { addClasses, removeClasses } from '../dom';

export function addGhostImage(
    dataTransfer: DataTransfer,
    ghostElement: HTMLElement,
    options?: { x?: number; y?: number; ownerDocument?: Document }
): void {
    // class dockview provides to force ghost image to be drawn on a different layer and prevent weird rendering issues
    addClasses(ghostElement, 'dv-dragged');

    // move the element off-screen initially otherwise it may in some cases be rendered at (0,0) momentarily
    ghostElement.style.top = '-9999px';

    // Append to the drag source's own document. Per spec a setDragImage
    // element that is cross-document relative to the drag's DataTransfer is
    // ignored, so a drag initiated inside a popout window must use the popout
    // document, not the main one.
    const ownerDocument = options?.ownerDocument ?? document;
    ownerDocument.body.appendChild(ghostElement);
    dataTransfer.setDragImage(ghostElement, options?.x ?? 0, options?.y ?? 0);

    setTimeout(() => {
        removeClasses(ghostElement, 'dv-dragged');
        ghostElement.remove();
    }, 0);
}
