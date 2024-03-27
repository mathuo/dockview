import { DragAndDropObserver } from './dnd/dnd';
import { Droptarget } from './dnd/droptarget';
import { getDomNodePagePosition, toggleClass } from './dom';
import { CompositeDisposable, Disposable, IDisposable } from './lifecycle';
import { IDockviewPanel } from './dockview/dockviewPanel';

export type DockviewPanelRenderer = 'onlyWhenVisible' | 'always';

export interface IRenderable {
    readonly element: HTMLElement;
    readonly dropTarget: Droptarget;
}

function createFocusableElement(): HTMLDivElement {
    const element = document.createElement('div');
    element.tabIndex = -1;
    return element;
}

export class OverlayRenderContainer extends CompositeDisposable {
    private readonly map: Record<
        string,
        {
            panel: IDockviewPanel;
            disposable: IDisposable;
            destroy: IDisposable;
            element: HTMLElement;
        }
    > = {};

    private _disposed = false;

    constructor(private readonly element: HTMLElement) {
        super();

        this.addDisposables(
            Disposable.from(() => {
                for (const value of Object.values(this.map)) {
                    value.disposable.dispose();
                    value.destroy.dispose();
                }
                this._disposed = true;
            })
        );
    }

    detatch(panel: IDockviewPanel): boolean {
        if (this.map[panel.api.id]) {
            const { disposable, destroy } = this.map[panel.api.id];
            disposable.dispose();
            destroy.dispose();
            delete this.map[panel.api.id];
            return true;
        }
        return false;
    }

    attach(options: {
        panel: IDockviewPanel;
        referenceContainer: IRenderable;
    }): HTMLElement {
        const { panel, referenceContainer } = options;

        if (!this.map[panel.api.id]) {
            const element = createFocusableElement();
            element.className = 'dv-render-overlay';

            this.map[panel.api.id] = {
                panel,
                disposable: Disposable.NONE,
                destroy: Disposable.NONE,

                element,
            };
        }

        const focusContainer = this.map[panel.api.id].element;

        if (panel.view.content.element.parentElement !== focusContainer) {
            focusContainer.appendChild(panel.view.content.element);
        }

        if (focusContainer.parentElement !== this.element) {
            this.element.appendChild(focusContainer);
        }

        const resize = () => {
            // TODO propagate position to avoid getDomNodePagePosition calls, possible performance bottleneck?
            const box = getDomNodePagePosition(referenceContainer.element);
            const box2 = getDomNodePagePosition(this.element);
            focusContainer.style.left = `${box.left - box2.left}px`;
            focusContainer.style.top = `${box.top - box2.top}px`;
            focusContainer.style.width = `${box.width}px`;
            focusContainer.style.height = `${box.height}px`;

            toggleClass(
                focusContainer,
                'dv-render-overlay-float',
                panel.group.api.location.type === 'floating'
            );
        };

        const visibilityChanged = () => {
            if (panel.api.isVisible) {
                resize();
            }

            focusContainer.style.display = panel.api.isVisible ? '' : 'none';
        };

        const disposable = new CompositeDisposable(
            /**
             * since container is positioned absoutely we must explicitly forward
             * the dnd events for the expect behaviours to continue to occur in terms of dnd
             *
             * the dnd observer does not need to be conditional on whether the panel is visible since
             * non-visible panels are 'display: none' and in such case the dnd observer will not fire.
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
                /**
                 * Control the visibility of the content, however even when not visible (display: none)
                 * the content is still maintained within the DOM hence DOM specific attributes
                 * such as scroll position are maintained when next made visible.
                 */
                visibilityChanged();
            }),
            panel.api.onDidDimensionsChange(() => {
                if (!panel.api.isVisible) {
                    return;
                }

                resize();
            })
        );

        this.map[panel.api.id].destroy = Disposable.from(() => {
            if (panel.view.content.element.parentElement === focusContainer) {
                focusContainer.removeChild(panel.view.content.element);
            }

            focusContainer.parentElement?.removeChild(focusContainer);
        });

        queueMicrotask(() => {
            if (this.isDisposed) {
                return;
            }

            /**
             * wait until everything has finished in the current stack-frame call before
             * calling the first resize as other size-altering events may still occur before
             * the end of the stack-frame.
             */
            visibilityChanged();
        });

        // dispose of logic asoccciated with previous reference-container
        this.map[panel.api.id].disposable.dispose();
        // and reset the disposable to the active reference-container
        this.map[panel.api.id].disposable = disposable;

        return focusContainer;
    }
}
