import {
    SplitView,
    Orientation,
    ISplitViewDescriptor,
} from '../splitview/core/splitview';
import { CompositeDisposable, IDisposable } from '../lifecycle';
import { Emitter, Event } from '../events';
import { addClasses, removeClasses } from '../dom';
import { PaneviewPanel } from './paneviewPanel';

interface PaneItem {
    pane: PaneviewPanel;
    disposable: IDisposable;
}

export class PaneView extends CompositeDisposable implements IDisposable {
    private element: HTMLElement;
    private splitview: SplitView;
    private paneItems: PaneItem[] = [];
    private _orientation: Orientation;
    private animationTimer: NodeJS.Timeout | undefined;

    private readonly _onDidChange = new Emitter<void>();
    readonly onDidChange: Event<void> = this._onDidChange.event;

    get minimumSize() {
        return this.splitview.minimumSize;
    }

    get maximumSize() {
        return this.splitview.maximumSize;
    }

    get orientation() {
        return this.splitview.orientation;
    }

    get size() {
        return this.splitview.size;
    }

    get orthogonalSize() {
        return this.splitview.orthogonalSize;
    }

    constructor(
        container: HTMLElement,
        options: { orientation: Orientation; descriptor?: ISplitViewDescriptor }
    ) {
        super();

        this._orientation = options.orientation ?? Orientation.VERTICAL;

        this.element = document.createElement('div');
        this.element.className = 'pane-container';

        container.appendChild(this.element);

        this.splitview = new SplitView(this.element, {
            orientation: this._orientation,
            proportionalLayout: false,
            descriptor: options.descriptor,
        });

        // if we've added views from the descriptor we need to
        // add the panes to our Pane array and setup animation
        this.getPanes().forEach((pane, index) => {
            const disposable = pane.onDidChangeExpansionState(() => {
                this.setupAnimation();
            });

            const paneItem: PaneItem = {
                pane,
                disposable: {
                    dispose: () => {
                        disposable.dispose();
                    },
                },
            };

            this.paneItems.splice(index, 0, paneItem);
            pane.orthogonalSize = this.splitview.orthogonalSize;
        });

        this.addDisposables(
            this.splitview.onDidSashEnd(() => {
                this._onDidChange.fire(undefined);
            })
        );
    }

    public addPane(
        pane: PaneviewPanel,
        size?: number,
        index = this.splitview.length,
        skipLayout = false
    ) {
        const disposable = pane.onDidChangeExpansionState(() => {
            this.setupAnimation();
        });

        const paneItem: PaneItem = {
            pane,
            disposable: {
                dispose: () => {
                    disposable.dispose();
                },
            },
        };

        this.paneItems.splice(index, 0, paneItem);
        pane.orthogonalSize = this.splitview.orthogonalSize;
        this.splitview.addView(pane, size, index, skipLayout);
    }

    getViewSize(index: number) {
        return this.splitview.getViewSize(index);
    }

    public getPanes() {
        return this.splitview.getViews() as PaneviewPanel[];
    }

    public removePane(index: number) {
        this.splitview.removeView(index);
        const paneItem = this.paneItems.splice(index, 1)[0];
        paneItem.disposable.dispose();
        return paneItem;
    }

    public moveView(from: number, to: number) {
        const view = this.removePane(from);
        this.addPane(view.pane, to);
    }

    public layout(size: number, orthogonalSize: number): void {
        for (const paneItem of this.paneItems) {
            paneItem.pane.orthogonalSize = orthogonalSize;
        }

        this.splitview.layout(size, orthogonalSize);
    }

    private setupAnimation() {
        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = undefined;
        }

        addClasses(this.element, 'animated');

        this.animationTimer = setTimeout(() => {
            this.animationTimer = undefined;
            removeClasses(this.element, 'animated');
        }, 200);
    }

    public dispose() {
        super.dispose();

        this.splitview.dispose();

        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = undefined;
        }

        this.paneItems.forEach((paneItem) => {
            paneItem.disposable.dispose();
        });
        this.paneItems = [];
    }
}
