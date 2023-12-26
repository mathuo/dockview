import { DragAndDropObserver } from '../../dnd/dnd';
import { Droptarget } from '../../dnd/droptarget';
import { getDomNodePagePosition, toggleClass } from '../../dom';
import { CompositeDisposable, Disposable, IDisposable } from '../../lifecycle';
import { IDockviewPanel } from '../dockviewPanel';

export type DockviewPanelRenderer = 'destructive' | 'gready';

export interface IRenderable {
    readonly element: HTMLElement;
    readonly dropTarget: Droptarget;
}

function createFocusableElement(): HTMLDivElement {
    const element = document.createElement('div');
    element.tabIndex = -1;
    return element;
}

export class GreadyRenderContainer extends CompositeDisposable {
    private readonly map: Record<
        string,
        { disposable: IDisposable; element: HTMLElement }
    > = {};

    get allIds(): string[] {
        return Object.keys(this.map);
    }

    constructor(private readonly element: HTMLElement) {
        super();

        this.addDisposables({
            dispose: () => {
                for (const value of Object.values(this.map)) {
                    value.disposable.dispose();
                }
            },
        });
    }

    remove(panel: IDockviewPanel): boolean {
        if (this.map[panel.api.id]) {
            this.map[panel.api.id].disposable.dispose();
            delete this.map[panel.api.id];
            return true;
        }
        return false;
    }

    setReferenceContentContainer(
        panel: IDockviewPanel,
        referenceContainer: IRenderable
    ): HTMLElement {
        if (!this.map[panel.api.id]) {
            const element = createFocusableElement();
            element.className = 'dv-render-overlay';

            this.map[panel.api.id] = {
                disposable: Disposable.NONE,
                element,
            };
        }

        this.map[panel.api.id]?.disposable.dispose();
        const focusContainer = this.map[panel.api.id].element;

        if (panel.view.content.element.parentElement !== focusContainer) {
            focusContainer.appendChild(panel.view.content.element);
        }

        if (focusContainer.parentElement !== this.element) {
            this.element.appendChild(focusContainer);
        }

        const resize = () => {
            // TODO propagate position to avoid getDomNodePagePosition calls
            const box = getDomNodePagePosition(referenceContainer.element);
            const box2 = getDomNodePagePosition(this.element);
            focusContainer.style.left = `${box.left - box2.left}px`;
            focusContainer.style.top = `${box.top - box2.top}px`;
            focusContainer.style.width = `${box.width}px`;
            focusContainer.style.height = `${box.height}px`;

            toggleClass(
                focusContainer,
                'dv-render-overlay-float',
                panel.group.api.isFloating
            );
        };

        const disposable = new CompositeDisposable(
            /**
             * since container is positioned absoutely we must explicitly forward
             * the dnd events for the expect behaviours to continue to occur in terms of dnd
             */
            new DragAndDropObserver(focusContainer, {
                onDragEnd: (e) => {
                    referenceContainer.dropTarget.dnd.onDragEnd(e);
                },
                onDragEnter: (e) => {
                    referenceContainer.dropTarget.dnd.onDragEnter(e);
                },
                onDragLeave: (e) => {
                    referenceContainer.dropTarget.dnd.onDragLeave(e);
                },
                onDrop: (e) => {
                    referenceContainer.dropTarget.dnd.onDrop(e);
                },
                onDragOver: (e) => {
                    referenceContainer.dropTarget.dnd.onDragOver(e);
                },
            }),
            panel.api.onDidVisibilityChange((event) => {
                focusContainer.style.display = event.isVisible ? '' : 'none';
            }),
            panel.api.onDidDimensionsChange((event) => {
                resize();
            }),
            {
                dispose: () => {
                    focusContainer.removeChild(panel.view.content.element);
                    this.element.removeChild(focusContainer);
                },
            }
        );

        queueMicrotask(() => {
            /**
             * wait until everything has finished in the current stack-frame call before
             * calling the first resize as other size-altering events may still occur before
             * the end of the stack-frame.
             */
            resize();
        });

        this.map[panel.api.id].disposable = disposable;

        return focusContainer;
    }
}
